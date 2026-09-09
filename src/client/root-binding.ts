/**
 * Root standard-source binding for a pane render tree.
 *
 * The core renderer's `RootStandardProvider` subscribes `host.root` — the
 * assembled root standard-source binding, whose hook names come from every
 * package that called `ctx.slots.provideRoot()`. That assembled value is
 * private (the registry exposes no `root` accessor), so a pane host rebuilds
 * the same shape from the contributing services.
 *
 * The 0.1.5 composition contributes:
 *   - `ui-session`:       hooks `sessions`, `sessionPendingInteraction`
 *   - `ui-workspace`:     hook  `workspaces`
 *   - `client-resources`: keyed hook `resource`
 *
 * The optional contributors are bound with `ctx.inject`, NOT read eagerly:
 * this plugin's own service list does not depend on them, so its apply may
 * run before they exist. `ctx.inject` runs the callback when they arrive and
 * republishes the binding, so a pane mounted early still gets the hook once
 * its owner is up (and loses it again if the owner unloads). A third-party
 * root contribution would still be missing — a graceful degradation, since
 * the hook prop is simply absent.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {
  HostObservable, KeyedStandardSource, StandardSourceBinding,
} from '@deepseek-ai/dsh-client-ui-slots'

/**
 * Build the root standard-source observable a pane host hands the renderer.
 * @param ctx - client root context carrying the root feeds.
 * @returns an observable of the root binding (republishes as owners load).
 */
export function createPaneRootSource(ctx: Context): HostObservable<StandardSourceBinding> {
  const listeners = new Set<() => void>()
  const extraHooks: Record<string, HostObservable<unknown>> = {}
  const extraKeyedHooks: Record<string, KeyedStandardSource> = {}

  // Only sources that exist may enter the binding: the renderer's strict root
  // materialization throws on an undefined source, so a core without one of
  // these feeds must degrade to a missing seat, not a crashed pane.
  const baseHooks: Record<string, HostObservable<unknown>> = {}
  const sessionsFeed = (ctx as unknown as {
    sessions?: { list?: HostObservable<unknown> }
  }).sessions?.list
  if (sessionsFeed !== undefined) baseHooks['sessions'] = sessionsFeed
  const pendingFeed = (ctx as unknown as {
    uiSession?: { pendingInteractions?: HostObservable<unknown> }
  }).uiSession?.pendingInteractions
  if (pendingFeed !== undefined) baseHooks['sessionPendingInteraction'] = pendingFeed

  const assemble = (): StandardSourceBinding => ({
    key: undefined,
    hooks: { ...baseHooks, ...extraHooks },
    keyedHooks: { ...extraKeyedHooks },
    props: {},
  })
  let binding = assemble()

  const publish = (): void => {
    binding = assemble()
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[dsh-split-panes] root binding subscriber failed:', error)
      }
    }
  }

  ctx.inject(['workspaces'], (scoped) => {
    extraHooks['workspaces'] = scoped.workspaces.list as HostObservable<unknown>
    publish()
    return () => { delete extraHooks['workspaces']; publish() }
  })
  ctx.inject(['resources'], (scoped) => {
    // The resources package's Context merge is not imported here (type-only
    // dependency avoided); the face is the public `source(address)` accessor.
    const resources = (scoped as unknown as {
      resources?: { source(address: string): HostObservable<unknown> }
    }).resources
    if (resources === undefined) return
    extraKeyedHooks['resource'] = address => resources.source(address)
    publish()
    return () => { delete extraKeyedHooks['resource']; publish() }
  })

  return {
    getSnapshot: () => binding,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}
