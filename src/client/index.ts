/** Registers the pane workspace and the header split/close affordances. */
import type { ClientContext, EngineStoreHandle, SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls this package's GlobalStandardProps merge (SessionScope +
// by-id seats) into every compilation unit that touches the panes surfaces.
import type {} from './global-seats.ts'
import { PaneWorkspace, SESSION_DRAG_TYPE, type PaneWorkspaceInjected } from './PaneWorkspace.tsx'
import { SplitPaneButton } from './SplitPaneButton.tsx'
import { SplitVerticalButton } from './SplitVerticalButton.tsx'
import { ClosePaneButton } from './ClosePaneButton.tsx'
import { createPaneLayoutStore, type PaneActions, type PaneLayoutState } from './pane-layout-store.ts'
import { en, zh, type PaneKey } from './locales.ts'
// Plugin-owned global chrome (single-row header, sidebar fusion): injected
// with this bundle, removed on unload — the stock GUI stays unchanged
// without the plugin row.
import './PaneGlobal.module.css'

export type { PaneWorkspaceProps, PaneWorkspaceInjected } from './PaneWorkspace.tsx'
export type { SplitPaneButtonProps } from './SplitPaneButton.tsx'
export type { SplitVerticalButtonProps } from './SplitVerticalButton.tsx'
export type { ClosePaneButtonProps } from './ClosePaneButton.tsx'
export type { PaneKey } from './locales.ts'
export type { PaneLayoutState, PaneNode, PaneLeaf, PaneSplit } from './pane-layout-store.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Pane chrome and split-pane copy. */
    panes: PaneKey
  }
}

/** Dictionary namespace owned by this plugin (pane chrome copy). */
const NS = 'panes'

/** Services required by the panes plugin. */
export const inject = ['slots', 'locale', 'sessions']

/**
 * Register the panes-plugin surfaces over ONE shared layout store instance:
 * the 'conversation.panes' workspace (declared by the ui-layout frame, ROOT
 * scope — the split tree is global viewing state) and the split/close
 * buttons inside the conversation header's actions row (declared by
 * ui-conversation, session scope; registered through an erased name so this
 * package keeps its one-way dependency direction). The framework pins one
 * scope per store HANDLE, so each registration gets its own wrapper handle
 * whose create() returns the SAME live instance — every surface operates on
 * one split tree regardless of its slot's scope. Registrations wait on their
 * owner's declaration via slots.inject; absent this plugin, the frame falls
 * back to the plain conversation render.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  const paneLayoutStore = createPaneLayoutStore()
  // One shared live instance (apply-time create is the sanctioned path): the
  // workspace and the header buttons must mutate the SAME split tree. Each
  // registration gets its own wrapper handle (distinct identity, so the
  // framework's one-handle-per-scope pin never fires) whose create() returns
  // the shared instance; the runtime only ever calls create() on a handle,
  // so the erased spec member is never touched.
  const paneStore = paneLayoutStore.create()
  const sharedHandle = (): EngineStoreHandle<PaneLayoutState, PaneActions> =>
    ({ create: () => paneStore }) as unknown as EngineStoreHandle<PaneLayoutState, PaneActions>

  /**
   * Split, leaving the new pane as a NEW-CONVERSATION PLACEHOLDER (no host
   * session — the split is a pure view operation). The placeholder renders
   * the stock hero (workspace picker): choosing a workspace there starts the
   * conversation, which creates the session and binds it to that pane. A
   * stack of placeholders stays independent by construction — nothing is
   * shared until each pane actually starts its own conversation.
   */
  const splitWithNew: PaneWorkspaceInjected['splitWithNew'] = (paneId, direction, anchor) => {
    paneStore.actions.splitPane(paneId, direction, anchor)
  }

  ctx.effect(() => { return ctx.locale.register(NS, { zh, en }) }, 'ui-panes: dictionaries')

  // Session drag & drop channel, plugin-owned: the side-bar session rows are
  // draggable (their own in-group reorder), but nothing outside this plugin
  // carries the dragged session id on the HTML5 dataTransfer. Capture the
  // dragstart (before React's synthetic handler) and back-fill the id —
  // resolved from the row's own DOM against the session roster — so the
  // panes can receive the drag. This keeps the whole interaction inside the
  // plugin: no core or side-bar changes needed to install it.
  ctx.effect(() => {
    const onDragStart = (event: DragEvent): void => {
      const target = event.target as HTMLElement | null
      const row = target?.closest('[role="treeitem"][draggable="true"]') as HTMLElement | null
      if (row === null || event.dataTransfer === null) return
      // A newer side-bar may already carry the id — trust its exact data.
      if (Array.from(event.dataTransfer.types).includes(SESSION_DRAG_TYPE)) return
      const sessionId = resolveSessionIdFromRow(row, ctx.sessions.list.getSnapshot().byId)
      if (sessionId !== null) event.dataTransfer.setData(SESSION_DRAG_TYPE, sessionId)
    }
    document.addEventListener('dragstart', onDragStart, true)
    return () => { document.removeEventListener('dragstart', onDragStart, true) }
  }, 'ui-panes: session drag data')

  ctx.effect(
    () => ctx.slots.inject('conversation.panes', () => ctx.slots.register({
      name: 'conversation.panes',
      store: sharedHandle(),
      locale: NS,
      inject: (): PaneWorkspaceInjected => ({
        openSession: (sessionId) => { ctx.sessions.open(sessionId) },
        splitWithNew,
      }),
    }, PaneWorkspace)),
    'ui-panes: workspace registration',
  )

  ctx.effect(
    () => ctx.slots.inject('conversation.session.header.actions' as never, () => ctx.slots.register(
      // The target slot is declared by ui-conversation, whose types this
      // package must not import (one-way dependency). The erased call keeps
      // the registration correct at runtime — the loader resolves the real
      // spec.
      {
        name: 'conversation.session.header.actions',
        id: 'panes-split',
        order: 1000,
        store: sharedHandle(),
        locale: NS,
        inject: (): Pick<PaneWorkspaceInjected, 'splitWithNew'> => ({ splitWithNew }),
      } as never,
      SplitPaneButton as never,
    )),
    'ui-panes: header split button',
  )

  ctx.effect(
    () => ctx.slots.inject('conversation.session.header.actions' as never, () => ctx.slots.register(
      {
        name: 'conversation.session.header.actions',
        id: 'panes-split-v',
        order: 1001,
        store: sharedHandle(),
        locale: NS,
        inject: (): Pick<PaneWorkspaceInjected, 'splitWithNew'> => ({ splitWithNew }),
      } as never,
      SplitVerticalButton as never,
    )),
    'ui-panes: header split-vertical button',
  )

  ctx.effect(
    () => ctx.slots.inject('conversation.session.header.actions' as never, () => ctx.slots.register(
      {
        name: 'conversation.session.header.actions',
        id: 'panes-close',
        order: 1002,
        store: sharedHandle(),
        locale: NS,
      } as never,
      ClosePaneButton as never,
    )),
    'ui-panes: header close-pane button',
  )
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
  byId: SessionListState['byId'],
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
