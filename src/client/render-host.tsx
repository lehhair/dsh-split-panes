/**
 * Pane render host: re-hosts the NATIVE slot occupants inside one pane.
 *
 * A session-scoped slot (e.g. `conversation.composer.bar`, `conversation.
 * session.header`) is declared by ui-conversation and normally rendered with
 * the CURRENT selection's binding. The panes plugin renders the same
 * registered COMPONENTS under an EXPLICIT pane session by assembling each
 * occupant's declared shares itself:
 *   1. standard kit — buildPaneKit over the pane session's materialized
 *      binding (see kit.ts). The binding carries the session's provide
 *      bundle exactly as the renderer sees it (useSession, useSessions,
 *      useProjection, inputActions, …).
 *   2. entry inject — the occupant's own `inject(sessionId, actions)`
 *      factory, the same call the production renderer's runInject makes.
 *      Its `hooks`/`keyedHooks` compartments bind to `use<Name>` props,
 *      mirroring the renderer's bindInjectSources.
 *   3. entry store — `handle.create(sessionId)` yielding the per-session
 *      instance (actions + snapshot), exactly like the renderer host's
 *      storeOf — including the engine's per-session persist suffix.
 *   4. child rendering — the occupant's declared children dispatch through
 *      this package's own renderSlot, so nested slots (chat node renderers,
 *      model/plan seats, header actions, …) resolve through the same pane
 *      ledger.
 *
 * This is the by-id rendering twin the framework withholds from slot
 * components — built entirely from public slot-registry and ui-session
 * surfaces, no core changes.
 */
import { Component, createElement, type ReactNode } from 'react'
import type { StoredEntry } from '@deepseek-ai/dsh-client-ui-slots'
import { standardHookPropName } from '@deepseek-ai/dsh-client-ui-slots'
import { bindSelector, type PaneKit, type KeyedSelectorHook } from './kit.ts'

/** The store-instance shape this package resolves (type-erased view of the engine instance). */
export interface PaneStoreInstance {
  readonly actions: Readonly<Record<string, (...args: unknown[]) => void>>
  getSnapshot(): unknown
  subscribe(fn: () => void): () => void
}

/** Store handle shape (type-erased view of EngineStoreHandle). */
export interface PaneStoreHandle {
  create(scopeKey?: string): PaneStoreInstance
}

/** The type-erased record view this package reads (authority: SlotCore.register). */
interface EntryRecord {
  readonly component?: unknown
  readonly options?: { key?: string; id?: string; order?: number; label?: string | number | (() => string); priority?: number }
  readonly select?: ((owner: object) => unknown) | undefined
  readonly inject?: ((...args: unknown[]) => Record<string, unknown>) | undefined
  readonly children?: Readonly<Record<string, { kind: string; scope: string }>> | undefined
  readonly store?: PaneStoreHandle | undefined
  readonly locale?: string | undefined
}

/** One resolved occupant renderer: the component plus a per-pane props assembler. */
export interface PaneOccupant {
  readonly key?: string | undefined
  readonly id?: string | undefined
  readonly order?: number | undefined
  readonly priority?: number | undefined
  readonly select?: ((owner: object) => unknown) | undefined
  readonly locale?: string | undefined
  /**
   * Assemble this occupant's full props for one pane (kit + inject + store),
   * then render it. `renderChild` is the pane's own dispatch for the
   * occupant's declared children (supplied at mount so child slots resolve
   * through the same ledger).
   */
  readonly render: (ctx: PaneMount, renderChild: PaneRenderHost) => ReactNode
}

/** Reparse the record into the shape this package consumes. */
function viewOf(raw: StoredEntry): EntryRecord {
  return raw as unknown as EntryRecord
}

/** Bind one entry inject face: hooks/keyedHooks compartments become use<Name> hooks. */
function bindInjectSources(face: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const sources = face['hooks']
  const keyed = face['keyedHooks']
  for (const [name, value] of Object.entries(face)) {
    if (name === 'hooks' || name === 'keyedHooks') continue
    out[name] = value
  }
  if (sources !== null && typeof sources === 'object') {
    for (const [name, source] of Object.entries(sources as Record<string, { getSnapshot(): unknown; subscribe(fn: () => void): () => void } | undefined>)) {
      if (source !== undefined) out[standardHookPropName(name)] = bindSelector(source)
    }
  }
  if (keyed !== null && typeof keyed === 'object') {
    for (const [name, source] of Object.entries(keyed as Record<string, (key: string) => { getSnapshot(): unknown; subscribe(fn: () => void): () => void } | undefined>)) {
      if (source === undefined) continue
      const hook: KeyedSelectorHook<unknown> = (key, selector, equal) => {
        const useValue = bindSelector(source(key) ?? { getSnapshot: () => undefined, subscribe: () => () => {} })
        return useValue(value => selector(value), equal)
      }
      out[standardHookPropName(name)] = hook
    }
  }
  return out
}

/** Error boundary so one pane's native occupant cannot take down the workspace. */
class PaneBoundary extends Component<{ fallback?: ReactNode; children?: ReactNode }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError(_error: unknown): { failed: boolean } {
    return { failed: true }
  }
  override componentDidCatch(error: unknown): void {
    console.error('[dsh-split-panes] pane occupant failed, using fallback:', error)
  }
  override render(): ReactNode {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

/** The pane mount context passed to every occupant render. */
export interface PaneMount {
  readonly kit: PaneKit
  readonly slots: { entries(key: string): readonly StoredEntry[] }
  /** Child dispatch (assembled after the host closure completes). */
  renderChild: PaneRenderHost
}

/** Child-slot dispatch exposed to occupants (composed props renderSlot/renderSlotChain). */
export interface PaneRenderHost {
  renderSlot: (key: string, owner: object, opts?: { entryKey?: string; only?: string; fallback?: ReactNode }) => ReactNode
  renderSlotChain: (key: string, owner: object, opts?: { fallback?: ReactNode }) => ReactNode
}

const NO_RECORDS: readonly StoredEntry[] = Object.freeze([])

/**
 * Resolve one registered entry into a pane occupant (undefined when the
 * record has no component — the record shape this package knows).
 */
export function resolveOccupant(raw: StoredEntry): PaneOccupant | undefined {
  const record = viewOf(raw)
  const component = record.component
  if (typeof component !== 'function') return undefined
  const store = record.store
  const render: PaneOccupant['render'] = (ctx, renderChild) => {
    const sessionId = ctx.kit.sessionId as string | undefined
    // 1. standard kit props (plain props first; synthesized hooks override).
    const props: Record<string, unknown> = { ...ctx.kit.props }
    // 2. entry inject factory (sessionId [+ actions]).
    let face: Record<string, unknown> = {}
    if (record.inject !== undefined) {
      const actions = store?.create(sessionId).actions
      face = bindInjectSources(record.inject(
        ...(store !== undefined ? [sessionId, actions] : [sessionId]),
      ) as Record<string, unknown>)
    }
    Object.assign(props, face)
    // 3. store instance.
    if (store !== undefined) {
      const instance = store.create(sessionId)
      props['useStore'] = bindSelector({
        getSnapshot: () => instance.getSnapshot(),
        subscribe: fn => instance.subscribe(fn),
      })
      props['actions'] = instance.actions
    }
    // 4. global standard seats + child dispatch.
    props['sessionId'] = sessionId
    props['useSession'] = ctx.kit.useSession
    props['useSessions'] = ctx.kit.useSessions
    props['useProjection'] = ctx.kit.useProjection
    for (const [name, hook] of Object.entries(ctx.kit.hooks)) props[name.startsWith('use') ? name : standardHookPropName(name)] = hook
    props['renderSlot'] = renderChild.renderSlot
    props['renderSlotChain'] = renderChild.renderSlotChain
    return (
      <PaneBoundary fallback={null}>
        {createElement(component as never, props)}
      </PaneBoundary>
    )
  }
  const options = record.options ?? {}
  return {
    ...(options.key !== undefined ? { key: options.key } : {}),
    ...(options.id !== undefined ? { id: options.id } : {}),
    ...(options.order !== undefined ? { order: options.order } : {}),
    ...(options.priority !== undefined ? { priority: options.priority } : {}),
    ...(record.select !== undefined ? { select: record.select } : {}),
    ...(record.locale !== undefined ? { locale: record.locale } : {}),
    render,
  }
}

/**
 * Create a pane render host over one pane's kit. `entries(key)` reads the
 * LIVE slot ledger so registrations (view tabs, node renderers, dock strips)
 * appear as they land.
 */
export function createPaneRenderHost(
  slots: { entries(key: string): readonly StoredEntry[] },
  kit: PaneKit,
): PaneRenderHost & { occupants(key: string): readonly PaneOccupant[] } {
  const cache = new Map<string, readonly PaneOccupant[]>()

  const occupants = (key: string): readonly PaneOccupant[] => {
    const cached = cache.get(key)
    if (cached !== undefined) return cached
    let resolved: PaneOccupant[] | undefined
    const records = slots.entries(key)
    if (records.length === 0) resolved = NO_RECORDS as unknown as PaneOccupant[]
    else resolved = records.map(resolveOccupant).filter(occupant => occupant !== undefined)
    cache.set(key, resolved)
    return resolved
  }

  const mount: PaneMount = {
    kit,
    slots,
    renderChild: undefined as unknown as PaneRenderHost,
  }

  let renderChild: PaneRenderHost
  renderChild = {
    renderSlot: (key, owner, opts) => {
      const list = occupants(key)
      if (opts?.entryKey !== undefined) {
        const found = list.find(o => o.key === opts.entryKey)
        return found === undefined
          ? (opts.fallback ?? null)
          : found.render(mount, renderChild)
      }
      if (opts?.only !== undefined) {
        const found = list.find(o => o.id === opts.only)
        return found === undefined
          ? (opts.fallback ?? null)
          : found.render(mount, renderChild)
      }
      const first = list[0]
      return first === undefined ? (opts?.fallback ?? null) : first.render(mount, renderChild)
    },
    renderSlotChain: (key, owner, opts) => {
      for (const occupant of occupants(key)) {
        const select = occupant.select
        if (select === undefined) continue
        let matched: unknown
        try {
          matched = select(owner)
        } catch {
          continue
        }
        if (matched === null || matched === undefined) continue
        // Chain occupants render with `matched` merged into owner props.
        return (
          <PaneBoundary fallback={opts?.fallback}>
            {occupant.render(mount, renderChild)}
          </PaneBoundary>
        )
      }
      return opts?.fallback ?? null
    },
  }
  mount.renderChild = renderChild
  return { renderSlot: renderChild.renderSlot, renderSlotChain: renderChild.renderSlotChain, occupants }
}

/** The pane render host + kit bundle handed to PaneFrame. */
export interface PaneRenderBundle {
  readonly kit: PaneKit
  readonly host: PaneRenderHost & { occupants(key: string): readonly PaneOccupant[] }
}