/**
 * PaneConversation: ONE pane's native conversation, rendered by the core's
 * own slot renderer running against a pane-scoped host.
 *
 * The renderer instance is the vendored core `createSlotRenderer()` product
 * (see `vendor/renderer/README.md`); the host is `createPaneHost`, an overlay
 * on the registry's own host face whose session scope is this pane's binding.
 * The renderer's root outlet dispatches 'main.conversation', which elects the
 * STOCK ConversationRoot (the pane host filters this plugin's own main-panel
 * shadow out) — so the native header, Conversation content Factory, composer
 * and hero render here exactly as they do in an unmodified shell.
 *
 * rc.3: a pane owns a SessionReference (`sessions.retain`) for its Session;
 * `adapter.bindingSource(reference)` turns it into the pane's binding source.
 * The reference is released when the pane switches Session or unmounts.
 */
import { memo, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionReference } from '@deepseek-ai/dsh-api-session-controller/client'
import type {
  HostObservable, SlotRendererHost, StandardSourceBinding, StoredEntry,
} from '@deepseek-ai/dsh-client-ui-slots'
import { createPaneHost } from './pane-host.ts'
import { retainPaneSession } from './pane-session.ts'
import { createSlotRenderer } from './vendor/renderer/scoped-slots.tsx'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** The renderer product, created once (it is stateless between renders). */
const RENDERER = createSlotRenderer()

/** Everything a pane needs that is shared across panes of one plugin load. */
export interface PaneRenderDeps {
  /** Client root context (slots / uiSession / sessions). */
  readonly ctx: Context
  /** The registry's host face, read lazily (installed after plugin apply). */
  readonly baseHost: () => SlotRendererHost
  /** Entries never elected in a pane (this plugin's own conversation shadow). */
  readonly excluded: (entry: StoredEntry) => boolean
  /** Entries the core abdicated (mirrored supervision channel). */
  readonly coreAbdicated: (entry: StoredEntry) => boolean
  /** A pane's hero opened `sessionId`: bind it back to that pane. */
  readonly onPaneSessionOpened: (paneId: string, sessionId: SessionId) => void
}

/**
 * Report the Session a pane's hero `selectWorkspace` opened — including a
 * REUSED blank, which leaves the global selection unchanged and so is
 * invisible to the selection-routing effect.
 */
type OpenWorkspace = (workspaceId: unknown, beforeOpen?: (id: SessionId) => void, ...rest: unknown[]) => Promise<void>

/**
 * Run `start` while `uiWorkspace.openWorkspace` is shadowed by a wrapper that
 * chains `capture` onto the caller's `beforeOpen`. The shadow is an own
 * property removed again before `start` returns (the navigation call is
 * synchronous), so no other caller ever sees it.
 */
function withOpenedCapture<T>(ctx: Context, capture: (id: SessionId) => void, start: () => T): T {
  const navigation = ctx.get('uiWorkspace') as { openWorkspace?: OpenWorkspace } | undefined
  const original = navigation?.openWorkspace
  if (navigation === undefined || typeof original !== 'function') return start()
  const hadOwn = Object.hasOwn(navigation, 'openWorkspace')
  navigation.openWorkspace = (workspaceId, beforeOpen, ...rest) =>
    original.call(navigation, workspaceId, (id: SessionId) => { beforeOpen?.(id); capture(id) }, ...rest)
  try {
    return start()
  } finally {
    if (hadOwn) navigation.openWorkspace = original
    else delete navigation.openWorkspace
  }
}

export function paneFactoryInject(
  ctx: Context,
  paneId: string,
  report: PaneRenderDeps['onPaneSessionOpened'],
): (name: string, face: Record<string, unknown>) => Record<string, unknown> {
  return (name, face) => {
    const selectWorkspace = face['selectWorkspace']
    if (name !== 'conversation.content' || typeof selectWorkspace !== 'function') return face
    return {
      ...face,
      // Success is taken from rc.3's documented signal, not from resolution:
      // `uiWorkspace.openWorkspace` also resolves when a later navigation
      // SUPERSEDES it, but its `beforeOpen(sessionId)` runs only for the
      // Session it actually opens (new or reused blank). ui-conversation
      // calls openWorkspace synchronously inside selectWorkspace, so the
      // pane chains its own capture onto `beforeOpen` for exactly that call.
      selectWorkspace: async (workspaceId: unknown) => {
        let opened: SessionId | undefined
        const result = await withOpenedCapture(ctx, (id) => { opened = id }, () =>
          (selectWorkspace as (id: unknown) => Promise<unknown>)(workspaceId))
        if (opened !== undefined) report(paneId, opened)
        return result
      },
    }
  }
}

/** One pane's props. */
export interface PaneConversationProps {
  readonly deps: PaneRenderDeps
  /** Pane session; undefined renders the native new-conversation surface. */
  readonly sessionId: string | undefined
  /** Pane identity (stable across session switches of the same pane). */
  readonly paneId: string
}

/**
 * Hold a SessionReference for the pane's Session while it is shown.
 * Retained in an effect, so React StrictMode double-invocation releases the
 * first reference before taking the second.
 */
function usePaneReference(ctx: Context, sessionId: string | undefined): SessionReference | undefined {
  const [reference, setReference] = useState<SessionReference | undefined>(undefined)
  useEffect(() => {
    if (sessionId === undefined) {
      setReference(undefined)
      return
    }
    const owned = retainPaneSession(ctx, sessionId as SessionId)
    setReference(owned)
    return () => { owned?.release() }
  }, [ctx, sessionId])
  return reference?.sessionId === sessionId ? reference : undefined
}

/**
 * Render one pane's native conversation.
 * @param props - deps + pane identity + session.
 * @returns the pane's conversation subtree.
 */
export const PaneConversation = memo(function PaneConversation({
  deps, sessionId, paneId,
}: PaneConversationProps): ReactNode {
  const { ctx } = deps
  const reference = usePaneReference(ctx, sessionId)
  const adapter = ctx.uiSession.adapter

  const binding: HostObservable<StandardSourceBinding> = useMemo(
    () => adapter.bindingSource(reference),
    [adapter, reference],
  )

  const host = useMemo(() => createPaneHost({
    base: deps.baseHost(),
    adapter,
    binding,
    excluded: deps.excluded,
    coreAbdicated: deps.coreAbdicated,
    wrapFactoryInject: paneFactoryInject(ctx, paneId, deps.onPaneSessionOpened),
    onCrash: (key, entry, error) => {
      console.error(`[dsh-split-panes] pane ${paneId} occupant crashed in '${key}':`, error, entry.options)
    },
  }), [deps, adapter, binding, paneId])

  // A pane whose Session is still being retained renders nothing for one
  // commit rather than flashing the absent (hero) projection.
  if (sessionId !== undefined && reference === undefined) return null
  return RENDERER.renderRoot(host, {})
})
