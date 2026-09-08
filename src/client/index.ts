/**
 * Registers the pane workspace (a replacement for the `conversation` slot)
 * and the header split/close affordances.
 *
 * The takeover is a SLOT SHADOW on the core's single conversation slot:
 * this entry registers at a lower priority than ui-conversation's
 * ConversationRoot, so while this plugin is loaded the conversation column
 * renders the pane workspace; the stock root entry stays registered (its
 * child-slot declarations and the session/header/composer occupants
 * survive), and unload returns the stock rendering byte-identically.
 *
 * Every pane re-hosts the native conversation occupants bound to an
 * EXPLICIT pane session through the core's by-id standard-source adapter
 * (`ctx.uiSession.adapter.resolve`) — see kit.ts / render-host.ts /
 * PaneBody.tsx. No core patch: the by-id render path is assembled from
 * public slot-registry, ui-session, and sessions-service surfaces.
 *
 * The split tree is ONE module-owned store instance (global viewing state,
 * deliberately NOT a per-session slot store — the tree must survive session
 * switches). The workspace and the header buttons both operate that single
 * instance through the apply closure.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { createElement } from 'react'
// Type-only: pulls the slots registry's Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the ui-session Context merge (ctx.uiSession).
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: pulls the sessions-service Context merge (ctx.sessions).
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-layout SlotMap merge ('conversation').
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { bindSelector } from './kit.ts'
import { PaneWorkspace, type PaneWorkspaceInjected } from './PaneWorkspace.tsx'
import { PaneConversation } from './PaneConversation.tsx'
import { SplitPaneButton } from './SplitPaneButton.tsx'
import { SplitVerticalButton } from './SplitVerticalButton.tsx'
import { ClosePaneButton } from './ClosePaneButton.tsx'
import { createPaneLayoutStore, allLeaves, type PaneLayoutState } from './pane-layout-store.ts'
import { en, zh, type PaneKey } from './locales.ts'

export type { PaneWorkspaceProps, PaneWorkspaceInjected } from './PaneWorkspace.tsx'
export type { SplitPaneButtonProps } from './SplitPaneButton.tsx'
export type { SplitVerticalButtonProps } from './SplitVerticalButton.tsx'
export type { ClosePaneButtonProps } from './ClosePaneButton.tsx'
export type { PaneKey } from './locales.ts'
export type { PaneLayoutState, PaneLeaf, PaneNode, PaneSplit } from './pane-layout-store.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Pane chrome and split-pane copy. */
    panes: PaneKey
  }
}

/** Dictionary namespace owned by this plugin (pane chrome copy). */
const NS = 'panes'

/** The priority at which this plugin shadows ui-conversation's root (0). */
const TAKEOVER_PRIORITY = -1

/** Services required by the panes plugin. */
export const inject = ['slots', 'locale', 'sessions', 'uiSession', 'workspaces']

/**
 * Register the panes-plugin surfaces over ONE shared pane-layout store
 * instance: the conversation-column takeover (the plugin's workspace) and
 * the split/close buttons inside the conversation header's actions row.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  // The ONE shared split-tree instance (global viewing state).
  const paneStore = createPaneLayoutStore().create()
  const paneActions = paneStore.actions
  const usePaneStore = <S>(selector: (state: PaneLayoutState) => S): S =>
    bindSelector({
      getSnapshot: () => paneStore.getSnapshot(),
      subscribe: fn => paneStore.subscribe(fn),
    })(selector)
  const paneTree = (): PaneLayoutState => paneStore.getSnapshot()

  /**
   * Split, leaving the new pane as a NEW-CONVERSATION PLACEHOLDER (no host
   * session — the split is a pure view operation). The placeholder renders
   * the stock hero (workspace picker): choosing a workspace there starts the
   * conversation, which creates the session and binds it to that pane. A
   * stack of placeholders stays independent by construction — nothing is
   * shared until each pane actually starts its own conversation.
   */
  const splitWithNew: PaneWorkspaceInjected['splitWithNew'] = (paneId, direction, anchor) => {
    paneActions.splitPane(paneId, direction, anchor)
  }

  /** The header affordances operate on the shared tree's FOCUSED pane. */
  const splitFocused: PaneWorkspaceInjected['splitFocused'] = (direction) => {
    const state = paneTree()
    const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id
    if (paneId === undefined) return
    // Splitting the SINGLE full-bleed pane anchors the current selection;
    // splitting inside the tree never anchors.
    const anchor: SessionId | null = state.root.type === 'leaf'
      ? (ctx.sessions.list.getSnapshot().current ?? null)
      : null
    paneActions.splitPane(paneId, direction, anchor)
  }
  const closeFocused: PaneWorkspaceInjected['closeFocused'] = () => {
    const state = paneTree()
    const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id
    if (paneId !== undefined) paneActions.closePane(paneId)
  }
  const hasSplit = (): boolean => paneTree().root.type !== 'leaf'

  ctx.effect(() => { return ctx.locale.register(NS, { zh, en }) }, 'ui-panes: dictionaries')

  // Session drag & drop channel, plugin-owned: the side-bar session rows are
  // draggable (their own in-group reorder), but nothing outside this plugin
  // carries the dragged session id on the HTML5 dataTransfer. Capture the
  // dragstart (before React's synthetic handler) and back-fill the id —
  // resolved from the row's own DOM against the session roster — so the
  // panes can receive the drag. This keeps the whole interaction inside the
  // plugin: no core or side-bar changes needed to install it.
  ctx.effect(() => {
    const SESSION_DRAG_TYPE = 'application/x-dsh-session'
    const onDragStart = (event: DragEvent): void => {
      const target = event.target as HTMLElement | null
      const row = target?.closest('[role="treeitem"][draggable="true"]') as HTMLElement | null
      if (row === null || event.dataTransfer === null) return
      if (Array.from(event.dataTransfer.types).includes(SESSION_DRAG_TYPE)) return
      const byId = ctx.sessions.list.getSnapshot().byId
      const sessionId = resolveSessionIdFromRow(row, byId)
      if (sessionId !== null) event.dataTransfer.setData(SESSION_DRAG_TYPE, sessionId)
    }
    document.addEventListener('dragstart', onDragStart, true)
    return () => { document.removeEventListener('dragstart', onDragStart, true) }
  }, 'ui-panes: session drag data')

  // The pane render delegate: capture the STOCK ConversationRoot entry and
  // re-host it under the pane session — the pure-extension path. Instead of
  // re-implementing ConversationRoot's layout (hero, workspace picker,
  // composer variants, measurements, width handles), every pane renders the
  // native component verbatim, bound to the pane's own session through the
  // by-id kit. The kit and host are memoized per pane session (identity-
  // stable hooks / store instances / inject faces).
  const renderPane: PaneWorkspaceInjected['renderPane'] = (sessionId, key) => (
    createElement(PaneConversation, { key, ctx, sessionId })
  )

  /** The full injected operations face shared by the workspace + buttons. */
  const operations: PaneWorkspaceInjected = {
    openSession: (sessionId) => { ctx.sessions.open(sessionId) },
    splitWithNew,
    splitFocused,
    closeFocused,
    hasSplit,
    usePaneStore,
    paneActions,
    renderPane,
  }

  // The conversation-column takeover. No store seat: the split tree is a
  // module-owned singleton, delivered through the inject face (a per-session
  // slot store would mint one instance per session, breaking the global
  // tree). The inject runs per declared session; it returns the same
  // operations each time.
  ctx.slots.register({
    name: 'conversation',
    priority: TAKEOVER_PRIORITY,
    locale: NS,
    inject: (): PaneWorkspaceInjected => operations,
  }, PaneWorkspace)

  // Header split/close buttons: registered into the session-scoped header
  // actions row (declared by ui-conversation), operating the SAME shared
  // pane tree through the closure captured above. No store seat. Each entry
  // declares the panes locale namespace so the renderer synthesizes its `t`.
  ctx.slots.inject('conversation.session.header.actions' as never, function* () {
    yield ctx.slots.register({
      name: 'conversation.session.header.actions',
      id: 'panes-split',
      order: 1000,
      locale: NS,
      inject: (): PaneWorkspaceInjected => operations,
    } as never, SplitPaneButton as never)
    yield ctx.slots.register({
      name: 'conversation.session.header.actions',
      id: 'panes-split-v',
      order: 1001,
      locale: NS,
      inject: (): PaneWorkspaceInjected => operations,
    } as never, SplitVerticalButton as never)
    yield ctx.slots.register({
      name: 'conversation.session.header.actions',
      id: 'panes-close',
      order: 1002,
      locale: NS,
      inject: (): Pick<PaneWorkspaceInjected, 'closeFocused' | 'hasSplit'> => ({
        closeFocused,
        hasSplit,
      }),
    } as never, ClosePaneButton as never)
  })
}

/**
 * Resolve the dragged session id from a side-bar row's DOM against the live
 * session roster. The row's title cell renders the session's displayTitle
 * verbatim, so an exact cell match is the reliable probe; a blank New
 * Session row renders the localized label and resolves to nothing (blank
 * sessions are not draggable). A longest-substring fallback covers rows
 * whose title cell is not a direct child.
 * @param row - the draggable session row (role=treeitem).
 * @param byId - the live session summary map.
 * @returns the session id, or null when no roster session matches the row.
 */
function resolveSessionIdFromRow(
  row: HTMLElement,
  byId: Record<string, { id: string; displayTitle: string }>,
): string | null {
  const cells = [...row.querySelectorAll(':scope > span')]
    .map(cell => cell.textContent.trim())
    .filter(text => text.length > 0)
  for (const summary of Object.values(byId)) {
    if (cells.includes(summary.displayTitle)) return summary.id
  }
  // Longest-title fallback guards against prefix collisions ("项目" matching
  // a "项目插件…" row); a blank row's localized label never equals a title.
  const text = row.textContent.trim()
  let best: string | null = null
  let bestLength = 0
  for (const summary of Object.values(byId)) {
    if (summary.displayTitle.length > bestLength && text.includes(summary.displayTitle)) {
      best = summary.id
      bestLength = summary.displayTitle.length
    }
  }
  return best
}