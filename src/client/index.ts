/**
 * Panes plugin entry: registers the pane workspace as this plugin's occupant
 * of the `conversation` slot, plus the header split/close affordances and the
 * side-bar drag channel.
 *
 * HOW A PANE GETS A NATIVE CONVERSATION (no core patch):
 * the core renders session-scoped slots against one global binding (the
 * current selection), and exposes no seam to render an explicit session. It
 * DOES expose the renderer's input contract, `SlotRendererHost` — so every
 * pane runs the core's own slot renderer (vendored verbatim, see
 * `vendor/renderer/README.md`) against a host whose `scope('session')`
 * resolves to the pane's session. Everything below that — outlet dispatch,
 * kit synthesis, composer, chat view, hero — is the core's own code.
 *
 * The takeover is PERMANENT: the plugin always occupies `conversation`, and
 * the single-pane state is just the tree with one leaf rendering the global
 * current selection. One path, no takeover/release transitions.
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
import type { StoredEntry } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { observableHook } from './vendor/renderer/bindings.tsx'
import { PaneConversation, type PaneRenderDeps } from './PaneConversation.tsx'
import { PaneWorkspace, type PaneWorkspaceInjected } from './PaneWorkspace.tsx'
import { SplitPaneButton } from './SplitPaneButton.tsx'
import { SplitVerticalButton } from './SplitVerticalButton.tsx'
import { ClosePaneButton } from './ClosePaneButton.tsx'
import { createPaneRootSource } from './root-binding.ts'
import { installStoreSharing } from './pane-store.ts'
import { resolveSessionIdFromRow, SESSION_DRAG_TYPE, sessionRowOf } from './session-row.ts'
import { createPaneLayoutStore, allLeaves, type PaneLayoutState } from './pane-layout-store.ts'
import { en, zh, type PaneKey } from './locales.ts'

export type { PaneWorkspaceProps, PaneWorkspaceInjected } from './PaneWorkspace.tsx'
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
export const inject = ['slots', 'locale', 'sessions', 'uiSession']

/**
 * Register the panes-plugin surfaces over ONE shared pane-layout store
 * instance: the conversation-column occupant (the pane workspace) and the
 * split/close buttons inside the conversation header's actions row.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  // The ONE shared split-tree instance (global viewing state).
  const paneStore = createPaneLayoutStore().create()
  const paneActions = paneStore.actions
  const usePaneStore = observableHook<PaneLayoutState>({
    getSnapshot: () => paneStore.getSnapshot(),
    subscribe: fn => paneStore.subscribe(fn),
  })
  const paneTree = (): PaneLayoutState => paneStore.getSnapshot()

  // The renderer host inputs shared by every pane: the root standard-source
  // binding (rebuilt from the contributing services) and the live ledger.
  const rootSource = createPaneRootSource(ctx)
  const deps: PaneRenderDeps = {
    ctx,
    rootSource,
    ledger: {
      entries: key => ctx.slots.entries(key as never) as unknown as readonly StoredEntry[],
      entriesOfSlot: key => ctx.slots.entriesOfSlot(key as never) as unknown as readonly StoredEntry[],
      spec: key => ctx.slots.spec(key as never) as unknown as
        { kind: string; scope: string; inject?: unknown } | undefined,
      subscribe: (key, fn) => ctx.slots.subscribe(key as never, fn),
      getVersion: key => ctx.slots.getVersion(key as never),
    },
    // This plugin's own conversation occupant must never win inside a pane —
    // dropping it is what makes the stock ConversationRoot the pane's root.
    excluded: entry => entry.component === (PaneWorkspace as unknown),
    wrapEntry: (entry, paneId) => wrapPaneEntry(entry, paneId, {
      ctx,
      onSessionStarted: (paneId_, sessionId) => {
        paneActions.setPaneSession(paneId_, sessionId)
        paneActions.focusPane(paneId_)
      },
    }),
  }

  /** The header affordances operate on the shared tree's FOCUSED pane. */
  const splitFocused: PaneWorkspaceInjected['splitFocused'] = (direction) => {
    const state = paneTree()
    const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id
    if (paneId === undefined) return
    // Anchor the current selection: splitting never creates a host session —
    // the new pane is a new-conversation placeholder (the stock hero).
    paneActions.splitPane(paneId, direction, state.root.type === 'leaf'
      ? (ctx.sessions.list.getSnapshot().current ?? null)
      : null)
  }
  const closeFocused: PaneWorkspaceInjected['closeFocused'] = () => {
    const state = paneTree()
    if (state.root.type === 'leaf') return
    const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id
    if (paneId !== undefined) paneActions.closePane(paneId)
  }
  const hasSplit = (): boolean => paneTree().root.type !== 'leaf'

  const operations: PaneWorkspaceInjected = {
    openSession: (sessionId) => { ctx.sessions.open(sessionId) },
    splitWithNew: (paneId, direction, anchor) => { paneActions.splitPane(paneId, direction, anchor) },
    splitFocused,
    closeFocused,
    hasSplit,
    usePaneStore,
    paneActions,
    renderPane: (sessionId, paneId) =>
      createElement(PaneConversation, { deps, sessionId, paneId, key: paneId }),
    resolveRowSession: row => resolveSessionIdFromRow(ctx, row),
  }

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-panes: dictionaries')
  // Store handles shared with core-rendered regions (e.g. the right sidebar's
  // panel + its header-corner button) must resolve to ONE instance.
  installStoreSharing(ctx)

  // The conversation occupant. Priority -1 keeps the stock ConversationRoot
  // registered at 0 (the pane renderer elects it inside each pane), and makes
  // this entry the slot's winner so the core renders the pane workspace.
  ctx.slots.register({
    name: 'conversation',
    priority: TAKEOVER_PRIORITY,
    locale: NS,
    inject: (): PaneWorkspaceInjected => operations,
  } as never, PaneWorkspace as never)

  // Session drag channel, plugin-owned: the side-bar rows are draggable (their
  // own in-group reorder) but carry no session id on the dataTransfer. Capture
  // dragstart before React's synthetic handler and back-fill the payload.
  ctx.effect(() => {
    const onDragStart = (event: DragEvent): void => {
      const row = sessionRowOf(event.target)
      if (row === null || event.dataTransfer === null) return
      if (Array.from(event.dataTransfer.types).includes(SESSION_DRAG_TYPE)) return
      const sessionId = resolveSessionIdFromRow(ctx, row)
      if (sessionId !== null) event.dataTransfer.setData(SESSION_DRAG_TYPE, sessionId)
    }
    document.addEventListener('dragstart', onDragStart, true)
    return () => { document.removeEventListener('dragstart', onDragStart, true) }
  }, 'ui-panes: session drag data')

  // Global split-pane shortcuts (mod+shift+arrows split, mod+shift+w close).
  // Editable targets are exempt: the chords are text-selection shortcuts there.
  ctx.effect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return
      const target = event.target as HTMLElement | null
      if (target !== null
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          splitFocused('horizontal')
          break
        case 'ArrowDown':
          event.preventDefault()
          splitFocused('vertical')
          break
        case 'w':
        case 'W':
          event.preventDefault()
          closeFocused()
          break
        default:
          return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, 'ui-panes: shortcuts')

  // Header split/close buttons: registered into the session-scoped header
  // actions row (declared by ui-conversation), operating the SAME shared pane
  // tree. Each entry declares the panes locale namespace so the renderer
  // synthesizes its `t`.
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

/** Wrapped conversation entries: inject provenance per (entry, pane). */
const wrappedEntries = new WeakMap<StoredEntry, Map<string, StoredEntry>>()

/**
 * Wrap one pane's copy of an entry so the stock `selectWorkspace` inject
 * reports the session it just created back to the pane that owns it.
 *
 * A pane's hero picker creates a session through the stock inject (workspace
 * connect + draft migration, all core logic) and selects it globally. Without
 * this provenance the pane that owns the hero would not adopt the new session
 * — the selection-change effect would bind whichever pane is focused.
 *
 * The wrapper is cached per (entry, pane): the renderer caches inject faces
 * and hooks by entry identity, so a fresh object per render would churn every
 * subscription in the pane.
 * @param entry - ledger entry.
 * @param paneId - owning pane.
 * @param hooks - client context + adoption callback.
 * @returns the wrapped entry (the original when it has no inject face).
 */
function wrapPaneEntry(
  entry: StoredEntry,
  paneId: string,
  hooks: { ctx: ClientContext; onSessionStarted: (paneId: string, sessionId: SessionId) => void },
): StoredEntry {
  const inject = entry.inject
  if (inject === undefined) return entry
  let perPane = wrappedEntries.get(entry)
  if (perPane === undefined) {
    perPane = new Map()
    wrappedEntries.set(entry, perPane)
  }
  let wrapped = perPane.get(paneId)
  if (wrapped !== undefined) return wrapped
  wrapped = {
    ...entry,
    inject: (...args: never[]) => {
      const face = (inject as (...params: never[]) => Record<string, unknown>)(...args)
      const selectWorkspace = face['selectWorkspace']
      if (typeof selectWorkspace !== 'function') return face
      return {
        ...face,
        selectWorkspace: async (workspaceId: unknown) => {
          const result = await (selectWorkspace as (id: unknown) => Promise<void>)(workspaceId)
          const created = hooks.ctx.sessions.list.getSnapshot().current
          if (created !== undefined) hooks.onSessionStarted(paneId, created)
          return result
        },
      }
    },
  }
  perPane.set(paneId, wrapped)
  return wrapped
}
