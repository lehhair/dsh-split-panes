/**
 * PaneConversation: ONE pane's native conversation, rendered by the core's
 * own slot renderer running against a pane-scoped host.
 *
 * The renderer instance is the vendored core `createSlotRenderer()` product
 * (see `vendor/renderer/README.md`); the host is `createPaneHost` with this
 * pane's session binding. The renderer's root outlet dispatches 'conversation',
 * which elects the STOCK ConversationRoot (the pane host filters this
 * plugin's own shadow out of its ledger view) under the pane's scope — so the
 * native header, session body, composer chain and hero render here exactly as
 * they do for the current session in an unmodified shell.
 *
 * The host is memoized per (deps, pane binding): the renderer caches inject
 * faces, store instances and hooks per host identity, so a stable host is
 * what keeps component subscriptions from churning.
 */
import { memo, useEffect, useMemo, type ReactNode } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { HostObservable, StandardSourceBinding, StoredEntry } from '@deepseek-ai/dsh-client-ui-slots'
import { createPaneHost, paneAbsentBinding, type PaneLedger } from './pane-host.ts'
import { ensureSessionOpen } from './pane-session.ts'
import { createSlotRenderer } from './vendor/renderer/scoped-slots.tsx'

/** The renderer product, created once (it is stateless between renders). */
const RENDERER = createSlotRenderer()

/** Everything a pane needs that is shared across panes of one plugin load. */
export interface PaneRenderDeps {
  /** Client root context (slots / uiSession / locale / sessions). */
  readonly ctx: Context
  /** Live slot ledger, type-erased. */
  readonly ledger: PaneLedger
  /** Root standard-source binding observable. */
  readonly rootSource: HostObservable<StandardSourceBinding>
  /** Entries never elected in a pane (this plugin's own conversation shadow). */
  readonly excluded: (entry: StoredEntry) => boolean
  /** Entry wrapper (inject provenance); identity-stable per (entry, pane). */
  readonly wrapEntry: (entry: StoredEntry, paneId: string) => StoredEntry
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
 * Render one pane's native conversation.
 * @param props - deps + pane identity + session.
 * @returns the pane's conversation subtree.
 */
export const PaneConversation = memo(function PaneConversation({
  deps, sessionId, paneId,
}: PaneConversationProps): ReactNode {
  const { ctx } = deps
  const binding = sessionId === undefined
    ? undefined
    : ctx.uiSession.adapter.resolve(sessionId)

  // Pinned panes are not staged by the core; open their window explicitly.
  useEffect(() => { ensureSessionOpen(ctx, sessionId) }, [ctx, sessionId])

  const host = useMemo(() => createPaneHost({
    ledger: deps.ledger,
    adapter: ctx.uiSession.adapter,
    locale: ctx.locale,
    root: deps.rootSource,
    binding,
    absent: binding === undefined ? paneAbsentBinding(ctx) : undefined,
    excluded: deps.excluded,
    wrap: entry => deps.wrapEntry(entry, paneId),
    onCrash: (key, entry, error) => {
      console.error(`[dsh-split-panes] pane ${paneId} occupant crashed in '${key}':`, error, entry.options)
    },
  }), [deps, binding, paneId, ctx])

  // The core renderer keys the session-maybe incarnation itself (adoption →
  // remount on a different session), so no extra key is needed here; the host
  // identity changes with the binding, which is what re-derives every seat.
  return RENDERER.renderRoot(host, {})
})
