/**
 * Pane-workspace entry (the 'conversation.panes' wrapping seam declared by
 * ui-layout, ROOT scope): renders the STOCK conversation column full-bleed as
 * a single pane, or as a split-pane tree once the user splits. Splitting
 * CLONES the single-pane conversation into two panes — the original keeps
 * the current session, the new pane starts a FRESH conversation — and EVERY
 * pane renders the FULL native conversation UNCHANGED, including its own
 * header (crumbs, tabs, header actions): a session pane reuses the stock
 * header with the pane actions (split H/V / close) in its actions row. The
 * new-conversation surface (no session, or a BLANK session — the stock hero
 * hides its header) gets the plugin's new-conversation header (title + split
 * H/V + close while split) in BOTH the single full-bleed state and split
 * panes. Splitting always seeds the new pane as an INDEPENDENT fresh
 * conversation of the current workspace — each pane mints its own blank
 * session on the host (never the New Session reuse), so typing in one pane
 * never surfaces in another; with no workspace it stays the plain
 * add-a-workspace hero. Panes are scoped to their OWN session through the
 * framework's SessionScope global seat.
 *
 * The split tree is GLOBAL viewing state (root scope, one store): switching
 * sessions never rebuilds it. The CURRENT selection tracks the FOCUSED
 * pane: focusing a pane opens its session (the side-bar highlights it),
 * clicking a session in the side-bar (or starting a new one) binds the
 * focused pane, and every other pane keeps its pinned session — so several
 * panes may show the SAME session.
 */
import { useEffect, useRef } from 'react'
import type { DragEvent as ReactDragEvent, ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-layout SlotMap merge ('conversation.panes' /
// ConvPanesOwnerProps) into this compilation.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { SessionId, SessionListState, WorkspaceId, WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { createPaneLayoutStore, PaneLayoutState, PaneLeaf } from './pane-layout-store.ts'
import { allLeaves } from './pane-layout-store.ts'
import { SplitContainer } from './SplitContainer.tsx'
import { IconSplitHorizontal16, IconSplitVertical16 } from './icons.tsx'
import { PaneDropOverlay, resolveDropZone, type DropZone, type PaneDropOverlayHandle } from './PaneDropOverlay.tsx'
import css from './PaneWorkspace.module.css'

/**
 * HTML5 data-transfer type carrying a dragged session id (written by the
 * side-bar session rows in ui-workspace; read here on dragover/drop). The
 * mime string is the cross-package channel — no import between the two
 * plugin packages.
 */
export const SESSION_DRAG_TYPE = 'application/x-dsh-session'

/** The entry's inject face: the selection-drive and fresh-conversation verbs. */
export interface PaneWorkspaceInjected {
  /** Select a session as current — focusing a pane opens its session. */
  openSession: (sessionId: SessionId) => void
  /**
   * Split a pane and bind the NEW pane to an INDEPENDENT fresh conversation
   * in the given workspace (each call mints its own blank session on the
   * host). An undefined workspace leaves the new pane as the plain hero
   * (add-a-workspace prompt).
   */
  splitWithNew: (
    paneId: string,
    direction: 'horizontal' | 'vertical',
    anchor: SessionId | null,
    workspaceId: WorkspaceId | undefined,
  ) => void
}

/** Full composed props: runtime + store + owner + inject + locale. */
export type PaneWorkspaceProps =
  & PropsRuntime<'conversation.panes'>
  & PropsStore<ReturnType<typeof createPaneLayoutStore>>
  & InjectFace<PaneWorkspaceInjected>
  & PropsLocale<'panes'>

/** The new-conversation header: title + split H/V (+ close while split). */
function HeroHeader(props: {
  paneId: string
  split: boolean
  current: SessionId | undefined
  workspaceId: WorkspaceId | undefined
  actions: PaneWorkspaceProps['actions']
  splitWithNew: PaneWorkspaceProps['splitWithNew']
  t: PaneWorkspaceProps['t']
}) {
  const { paneId, split, current, workspaceId, actions, splitWithNew, t } = props
  const doSplit = (direction: 'horizontal' | 'vertical') => {
    // Splitting the SINGLE full-bleed hero anchors the current selection
    // (the original pane becomes that session; a no-session hero anchors
    // null). Splitting inside the split tree never anchors: the original
    // pane keeps its own nature (hero stays hero, session keeps session).
    // The new pane always starts a fresh conversation in the workspace.
    splitWithNew(paneId, direction, split ? null : (current ?? null), workspaceId)
  }
  return (
    <div className={css.heroHeader}>
      <span className={css.heroTitle}>{t('pane.new.conversation')}</span>
      <div className={css.heroActions}>
        <button
          type="button"
          className={css.heroButton}
          aria-label={t('pane.split.horizontal')}
          title={t('pane.split.horizontal')}
          onClick={() => { doSplit('horizontal') }}
        >
          <IconSplitHorizontal16 />
        </button>
        <button
          type="button"
          className={css.heroButton}
          aria-label={t('pane.split.vertical')}
          title={t('pane.split.vertical')}
          onClick={() => { doSplit('vertical') }}
        >
          <IconSplitVertical16 />
        </button>
        {split && (
          <button
            type="button"
            className={css.heroButton}
            aria-label={t('pane.close')}
            title={t('pane.close')}
            onClick={() => { actions.closePane(paneId) }}
          >
            <IconCloseOutline16 />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Session drag & drop wiring for one pane (PiUI drop model): while a session
 * is dragged over the pane, a ref-driven overlay highlights the target zone —
 * CENTER replaces the pane's session, the four EDGE halves split to that
 * side with the dropped session landing in the NEW pane (focus stays on the
 * original). High-frequency dragover events update only the tiny overlay
 * through its imperative handle, never the pane subtree.
 * @param leaf - this pane's leaf.
 * @param single - true on the single full-bleed surface: edge splits anchor
 *   the current selection and a center drop OPENS the dragged session; in
 *   the split tree the original pane keeps itself and a center drop binds
 *   the pane's session slot.
 * @param current - the global current selection (single-pane split anchor).
 */
function usePaneDrop(
  leaf: PaneLeaf,
  single: boolean,
  current: SessionId | undefined,
  actions: PaneWorkspaceProps['actions'],
  openSession: PaneWorkspaceProps['openSession'],
): {
  onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void
  onDragLeave: (event: ReactDragEvent<HTMLDivElement>) => void
  onDrop: (event: ReactDragEvent<HTMLDivElement>) => void
  overlay: ReactNode
} {
  const overlayRef = useRef<PaneDropOverlayHandle>(null)
  const zoneRef = useRef<DropZone | null>(null)
  const writeZone = (zone: DropZone | null): void => {
    if (zoneRef.current === zone) return
    zoneRef.current = zone
    overlayRef.current?.setZone(zone)
  }
  const zoneAt = (event: ReactDragEvent<HTMLDivElement>): DropZone | null => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return resolveDropZone((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)
  }
  const onDragOver = (event: ReactDragEvent<HTMLDivElement>): void => {
    // Ignore every drag but a side-bar session row's (file drops and other
    // payloads keep their own handlers).
    if (!Array.from(event.dataTransfer.types).includes(SESSION_DRAG_TYPE)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    writeZone(zoneAt(event))
  }
  const onDragLeave = (event: ReactDragEvent<HTMLDivElement>): void => {
    const related = event.relatedTarget as Node | null
    if (related !== null && event.currentTarget.contains(related)) return
    writeZone(null)
  }
  const onDrop = (event: ReactDragEvent<HTMLDivElement>): void => {
    const sessionId = event.dataTransfer.getData(SESSION_DRAG_TYPE)
    if (sessionId === '') return
    event.preventDefault()
    const zone = zoneAt(event)
    writeZone(null)
    if (zone === null) return
    if (zone === 'center') {
      // Replace this pane's session — dropping the pane's own session is a
      // no-op. The single surface navigates the current selection instead;
      // a split-tree pane binds its slot and both focus + open the dropped
      // session (a cold session's window loads only on open — this IS the
      // open, so the pane renders content immediately).
      if (single) {
        if (current !== sessionId) openSession(sessionId as SessionId)
      } else if (leaf.sessionId !== sessionId) {
        actions.setPaneSession(leaf.id, sessionId as SessionId)
        actions.focusPane(leaf.id)
        openSession(sessionId as SessionId)
      }
      return
    }
    // Edge: split to that side — the dropped session lands in the NEW pane
    // (which the split focuses); open it so its window loads.
    const anchor: SessionId | null = single ? (current ?? null) : null
    actions.splitPaneToSide(leaf.id, zone, sessionId as SessionId, anchor)
    openSession(sessionId as SessionId)
  }
  return {
    onDragOver,
    onDragLeave,
    onDrop,
    overlay: <PaneDropOverlay ref={overlayRef} />,
  }
}

/** One split leaf: focus frame + (new-conversation header | stock header) + scoped conversation. */
function PaneFrame(props: {
  leaf: PaneLeaf
  focused: boolean
  current: SessionId | undefined
  workspaceId: WorkspaceId | undefined
  useSessions: PaneWorkspaceProps['useSessions']
  SessionScope: PaneWorkspaceProps['SessionScope']
  renderConversation: PaneWorkspaceProps['renderConversation']
  actions: PaneWorkspaceProps['actions']
  openSession: PaneWorkspaceProps['openSession']
  splitWithNew: PaneWorkspaceProps['splitWithNew']
  t: PaneWorkspaceProps['t']
}) {
  const {
    leaf, focused, current, workspaceId, useSessions, SessionScope,
    renderConversation, actions, openSession, splitWithNew, t,
  } = props
  // A new-conversation pane: no session yet, or a BLANK session (the stock
  // hero hides its header in both cases) — show the plugin's header.
  const isNewConversation = useSessions((s: SessionListState) =>
    leaf.sessionId === null
      ? true
      : (s.byId[leaf.sessionId]?.blank ?? false))
  const { onDragOver, onDragLeave, onDrop, overlay } = usePaneDrop(leaf, false, current, actions, openSession)
  return (
    <div
      className={css.pane}
      data-focused={focused || undefined}
      onPointerDown={() => {
        // The frame captures focus: the header actions' split/close buttons
        // act on the pane this click just focused. The side-bar highlight
        // follows the pane's session (the new-conversation pane has none).
        actions.focusPane(leaf.id)
        if (leaf.sessionId !== null) openSession(leaf.sessionId)
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isNewConversation && (
        <HeroHeader
          paneId={leaf.id}
          split
          current={current}
          workspaceId={workspaceId}
          actions={actions}
          splitWithNew={splitWithNew}
          t={t}
        />
      )}
      {/* The FULL stock conversation — header (session panes), tabs,
          composer, stats — scoped to the pane's session (absent or blank
          id = the new-conversation hero). */}
      <SessionScope sessionId={leaf.sessionId ?? undefined}>
        {renderConversation()}
      </SessionScope>
      {overlay}
    </div>
  )
}

/** The single full-bleed surface (session or new-conversation state): the
    stock conversation verbatim plus the drop zone for the FIRST split. */
function SinglePane(props: {
  leaf: PaneLeaf
  current: SessionId | undefined
  workspaceId: WorkspaceId | undefined
  showHeroHeader: boolean
  renderConversation: PaneWorkspaceProps['renderConversation']
  actions: PaneWorkspaceProps['actions']
  openSession: PaneWorkspaceProps['openSession']
  splitWithNew: PaneWorkspaceProps['splitWithNew']
  t: PaneWorkspaceProps['t']
}) {
  const {
    leaf, current, workspaceId, showHeroHeader,
    renderConversation, actions, openSession, splitWithNew, t,
  } = props
  const { onDragOver, onDragLeave, onDrop, overlay } = usePaneDrop(leaf, true, current, actions, openSession)
  return (
    <div className={css.singleSurface} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {showHeroHeader && (
        <HeroHeader
          paneId={leaf.id}
          split={false}
          current={current}
          workspaceId={workspaceId}
          actions={actions}
          splitWithNew={splitWithNew}
          t={t}
        />
      )}
      {renderConversation()}
      {overlay}
    </div>
  )
}

/**
 * Render the conversation as a full-bleed pane, or as the split-pane tree
 * once the user splits. Each session pane is the FULL stock conversation
 * (its own header included) inside a focus-grabbing frame; new-conversation
 * panes get the plugin's new-conversation header.
 * @param props - composed slot props (see PaneWorkspaceProps).
 * @returns the pane surface wrapping the stock conversation column.
 */
export function PaneWorkspace({
  useStore, actions, renderConversation, useSessions, useWorkspaces,
  SessionScope, openSession, splitWithNew, t,
}: PaneWorkspaceProps) {
  const state = useStore(s => s)
  const current = useSessions((s: SessionListState) => s.current)
  const workspaceId = useWorkspaces((s: WorkspaceListState) => s.recentWorkspaceId)
  // A BLANK session is a brand-new conversation: the stock UI renders it as
  // the hero (header hidden), so the single pane shows the new-conversation
  // header for it too (the hook is unconditional — hook order must stay
  // stable across the leaf/split branches).
  const currentIsBlank = useSessions((s: SessionListState) =>
    current !== undefined ? (s.byId[current]?.blank ?? false) : false)
  const showSingleHeroHeader = current === undefined || currentIsBlank

  // Route a SELECTION CHANGE to the focused pane: the side-bar's session
  // click (or the hero's start action) binds that pane, while every other
  // pane keeps its pinned session. The previous-id ref distinguishes a real
  // change from the initial mount (the split's original pane is already
  // bound; the fresh pane must stay on the new-conversation hero).
  const prevCurrent = useRef(current)
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (current === prevCurrent.current) return
    prevCurrent.current = current
    if (current === undefined) return
    const tree = stateRef.current
    if (tree.root.type === 'leaf') return
    const paneId = tree.focusedPaneId ?? allLeaves(tree.root)[0]?.id
    if (paneId !== undefined) actions.setPaneSession(paneId, current)
  }, [current, actions])

  // Split-pane keybindings (mod+shift+arrows split, mod+shift+w close).
  // Live state and actions ride refs so the listener binds once. Editable
  // targets are exempt: mod+shift+arrows are text-selection shortcuts there.
  const latest = useRef({ state, actions, current, workspaceId, splitWithNew })
  latest.current = { state, actions, current, workspaceId, splitWithNew }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return
      const target = event.target as HTMLElement | null
      if (target !== null
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const latestNow = latest.current
      const paneId = latestNow.state.focusedPaneId ?? allLeaves(latestNow.state.root)[0]?.id
      if (paneId === undefined) return
      // The anchor: splitting the SINGLE pane keeps the current session (or
      // stays fresh without one); splitting INSIDE the tree never anchors —
      // a new-conversation pane stays new, a session pane keeps its session.
      const anchor: SessionId | null = latestNow.state.root.type === 'leaf'
        ? (latestNow.current ?? null)
        : null
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          latestNow.splitWithNew(paneId, 'horizontal', anchor, latestNow.workspaceId)
          break
        case 'ArrowDown':
          event.preventDefault()
          latestNow.splitWithNew(paneId, 'vertical', anchor, latestNow.workspaceId)
          break
        case 'w':
        case 'W':
          event.preventDefault()
          latestNow.actions.closePane(paneId)
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [])

  if (state.root.type === 'leaf') {
    // Single pane: the stock conversation rendered VERBATIM inside the
    // transparent drop surface (the only wrapper of our own — it carries the
    // drag & drop that creates the FIRST split). The new-conversation states
    // (no session, or a BLANK session — the stock UI renders both as the
    // header-less hero) gain the new-conversation header, so a fresh
    // conversation can split from the start. The header renders FULL-BLEED
    // like the native one (no pane frame): unsplit, the hero must look
    // exactly like a plain session.
    return (
      <SinglePane
        leaf={state.root}
        current={current}
        workspaceId={workspaceId}
        showHeroHeader={showSingleHeroHeader}
        renderConversation={renderConversation}
        actions={actions}
        openSession={openSession}
        splitWithNew={splitWithNew}
        t={t}
      />
    )
  }

  return (
    <div className={css.host}>
      <SplitContainer
        node={state.root}
        dividerLabel={t('pane.split.divider')}
        onSetRatio={(splitId, ratio) => { actions.setRatio(splitId, ratio) }}
        renderLeaf={leaf => (
          <PaneFrame
            key={leaf.id}
            leaf={leaf}
            focused={state.focusedPaneId === leaf.id}
            current={current}
            workspaceId={workspaceId}
            useSessions={useSessions}
            SessionScope={SessionScope}
            renderConversation={renderConversation}
            actions={actions}
            openSession={openSession}
            splitWithNew={splitWithNew}
            t={t}
          />
        )}
      />
    </div>
  )
}

export type { PaneLayoutState, PaneLeaf }
