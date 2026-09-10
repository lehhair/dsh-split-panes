/**
 * Pane-workspace entry: this plugin's occupant of the `conversation` slot
 * (declared by ui-layout, scope session-maybe).
 *
 * The plugin ALWAYS occupies that slot: the single full-bleed state is the
 * pane tree with one leaf, so one rendering path covers both states (no
 * takeover/release transition, no dual behavior to keep in sync). Each pane
 * renders the native conversation through the vendored core renderer bound to
 * the pane's own session — see PaneConversation.tsx.
 *
 * FOCUS MODEL (OpenCode): the focused pane is the current selection's mirror.
 *   - clicking a pane focuses it and, when it holds a session, selects that
 *     session globally (side-bar highlight follows);
 *   - clicking a side-bar session binds the FOCUSED pane (other panes keep
 *     their pinned sessions);
 *   - the single-leaf state renders the global current selection, so with one
 *     pane nothing has to be routed at all.
 *
 * This component owns layout, focus and drag & drop only — no conversation
 * markup, no session data.
 */
import { useEffect, useRef } from 'react'
import type { DragEvent as ReactDragEvent, ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PaneLayoutState, PaneLeaf } from './pane-layout-store.ts'
import { allLeaves, createPaneLayoutStore } from './pane-layout-store.ts'
import { SplitContainer } from './SplitContainer.tsx'
import { IconFullscreen16, IconFullscreenExit16, IconSplitHorizontal16, IconSplitVertical16 } from './icons.tsx'
import { PaneDropOverlay, resolveDropZone, type DropZone, type PaneDropOverlayHandle } from './PaneDropOverlay.tsx'
import { SESSION_DRAG_TYPE, sessionRowOf } from './session-row.ts'
import css from './PaneWorkspace.module.css'

export { SESSION_DRAG_TYPE } from './session-row.ts'

/**
 * The shared pane tree's action set: the frame-baked actions of the pane
 * layout store (draft params peeled), used by the workspace and buttons.
 */
export type PaneLayoutActions = ReturnType<ReturnType<typeof createPaneLayoutStore>['create']>['actions']

/** The entry's inject face: selection-drive verbs plus the pane body renderer. */
export interface PaneWorkspaceInjected {
  /** Select a session as current — focusing a pane opens its session. */
  openSession: (sessionId: SessionId) => void
  /**
   * Split a pane and bind the NEW pane to an INDEPENDENT fresh conversation:
   * splitting anchors the original pane to the current selection; inside the
   * split tree the new pane stays a new-conversation placeholder (null
   * session) — the stock hero then starts its own conversation.
   */
  splitWithNew: (
    paneId: string,
    direction: 'horizontal' | 'vertical',
    anchor: SessionId | null,
  ) => void
  /** Split the FOCUSED pane (header-affordance route). */
  splitFocused: (direction: 'horizontal' | 'vertical') => void
  /** Close the FOCUSED pane (header-affordance route); no-op on a single pane. */
  closeFocused: () => void
  /** Whether the shared pane tree is currently split (close button visibility). */
  hasSplit: () => boolean
  /**
   * Show the FOCUSED pane alone while the tree stays intact, or leave
   * fullscreen. No-op on a single pane (already full-bleed).
   */
  toggleFullscreen: () => void
  /** Whether the focused pane is the one currently shown fullscreen. */
  isFullscreen: () => boolean
  /** Selector hook over the SHARED split tree (global viewing state). */
  usePaneStore: <S>(selector: (state: PaneLayoutState) => S) => S
  /** The shared split tree's bound actions. */
  paneActions: PaneLayoutActions
  /**
   * Render one pane's native conversation body for an explicit session. The
   * delegate owns the per-session renderer host; the workspace layouts it.
   * `sessionId` undefined is the new-conversation hero.
   */
  renderPane: (sessionId: SessionId | undefined, paneId: string) => ReactNode
  /**
   * Resolve the session a side-bar row element stands for (the click-routing
   * channel: `sessions.open()` does not report a selection change when the
   * clicked session is already current).
   */
  resolveRowSession: (row: HTMLElement) => SessionId | null
}

/** Full composed props: runtime (main panel, root scope) + inject + locale. */
export type PaneWorkspaceProps =
  & PropsRuntime<'main'>
  & InjectFace<PaneWorkspaceInjected>
  & PropsLocale<'panes'>

/** The new-conversation header: title + split H/V + fullscreen + close. */
function HeroHeader(props: {
  paneId: string
  split: boolean
  fullscreen: boolean
  current: SessionId | undefined
  actions: PaneLayoutActions
  splitWithNew: PaneWorkspaceProps['splitWithNew']
  t: PaneWorkspaceProps['t']
}) {
  const { paneId, split, fullscreen, current, actions, splitWithNew, t } = props
  const doSplit = (direction: 'horizontal' | 'vertical') => {
    // Splitting the SINGLE full-bleed hero anchors the current selection
    // (the original pane becomes that session; a no-session hero anchors
    // null). Splitting inside the split tree never anchors: the original
    // pane keeps its own nature (hero stays hero, session keeps session).
    splitWithNew(paneId, direction, split ? null : (current ?? null))
  }
  return (
    <div className={css.heroHeader}>
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
            aria-label={fullscreen ? t('pane.fullscreen.exit') : t('pane.fullscreen')}
            title={fullscreen ? t('pane.fullscreen.exit') : t('pane.fullscreen')}
            aria-pressed={fullscreen}
            onClick={() => { actions.toggleFullscreen(paneId) }}
          >
            {fullscreen ? <IconFullscreenExit16 /> : <IconFullscreen16 />}
          </button>
        )}
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
 * CENTER replaces the pane's session, the four EDGE halves split to that side
 * with the dropped session landing in the NEW pane (focus follows the drop).
 * High-frequency dragover events update only the tiny overlay through its
 * imperative handle, never the pane subtree.
 */
function usePaneDrop(
  leaf: PaneLeaf,
  single: boolean,
  current: SessionId | undefined,
  actions: PaneLayoutActions,
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
      if (single) {
        if (current !== sessionId) openSession(sessionId as SessionId)
      } else if (leaf.sessionId !== sessionId) {
        actions.setPaneSession(leaf.id, sessionId as SessionId)
        actions.focusPane(leaf.id)
        openSession(sessionId as SessionId)
      }
      return
    }
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

/** One split leaf: focus frame + (new-conversation header | stock header) + pane body. */
function PaneFrame(props: {
  leaf: PaneLeaf
  focused: boolean
  /** Shown alone: full-bleed, no frame chrome, tree untouched. */
  fullscreen?: boolean | undefined
  current: SessionId | undefined
  blankIds: ReadonlySet<string>
  renderPane: PaneWorkspaceProps['renderPane']
  actions: PaneLayoutActions
  openSession: PaneWorkspaceProps['openSession']
  splitWithNew: PaneWorkspaceProps['splitWithNew']
  t: PaneWorkspaceProps['t']
}) {
  const {
    leaf, focused, fullscreen = false, current, blankIds, renderPane, actions, openSession, splitWithNew, t,
  } = props
  const { onDragOver, onDragLeave, onDrop, overlay } = usePaneDrop(leaf, false, current, actions, openSession)
  // The stock shell hides its header for a blank session (the hero owns the
  // surface), so such a pane would lose its split/close affordances; the
  // plugin's own new-conversation header stands in for both states.
  const needsOwnHeader = leaf.sessionId === null || blankIds.has(leaf.sessionId)
  return (
    <div
      className={fullscreen ? `${css.pane} ${css.paneFullscreen}` : css.pane}
      data-focused={focused || undefined}
      data-fullscreen={fullscreen || undefined}
      onPointerDown={() => {
        actions.focusPane(leaf.id)
        if (leaf.sessionId !== null) openSession(leaf.sessionId)
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {needsOwnHeader && (
        <HeroHeader
          paneId={leaf.id}
          split
          fullscreen={fullscreen}
          current={current}
          actions={actions}
          splitWithNew={splitWithNew}
          t={t}
        />
      )}
      {renderPane(leaf.sessionId ?? undefined, leaf.id)}
      {overlay}
    </div>
  )
}

/** The single full-bleed surface: the current session's conversation verbatim. */
function SinglePane(props: {
  leaf: PaneLeaf
  current: SessionId | undefined
  showHeroHeader: boolean
  renderPane: PaneWorkspaceProps['renderPane']
  actions: PaneLayoutActions
  openSession: PaneWorkspaceProps['openSession']
  splitWithNew: PaneWorkspaceProps['splitWithNew']
  t: PaneWorkspaceProps['t']
}) {
  const {
    leaf, current, showHeroHeader, renderPane, actions, openSession, splitWithNew, t,
  } = props
  const { onDragOver, onDragLeave, onDrop, overlay } = usePaneDrop(leaf, true, current, actions, openSession)
  // The single pane follows the global selection: no leaf session is pinned
  // (closing back to one pane clears it), so a side-bar switch always lands
  // here without any routing.
  return (
    <div className={css.singleSurface} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {showHeroHeader && (
        <HeroHeader
          paneId={leaf.id}
          split={false}
          fullscreen={false}
          current={current}
          actions={actions}
          splitWithNew={splitWithNew}
          t={t}
        />
      )}
      {renderPane(current, leaf.id)}
      {overlay}
    </div>
  )
}

/**
 * Render the conversation column: one full-bleed pane, or the split tree.
 * @param props - composed slot props (see PaneWorkspaceProps).
 * @returns the pane surface wrapping the native conversation.
 */
export function PaneWorkspace({
  usePaneStore, paneActions, useSessions,
  openSession, splitWithNew, renderPane, resolveRowSession, t,
}: PaneWorkspaceProps) {
  const state = usePaneStore((s: PaneLayoutState) => s)
  const current = useSessions((s: { current?: SessionId | undefined }) => s.current)
  // Blank sessions render the stock hero (header hidden), so both the single
  // surface and each split pane need the plugin's own new-conversation header
  // there. The selector returns a joined id list — value-stable, so it only
  // re-renders when the blank set actually changes.
  const blankKey = useSessions((s: { ids?: readonly string[]; byId: Record<string, { blank?: boolean }> }) =>
    (s.ids ?? []).filter(id => s.byId[id]?.blank === true).join(','))
  const blankIds = new Set(blankKey === '' ? [] : blankKey.split(','))

  // Route the GLOBAL SELECTION to the focused pane: a side-bar click (or any
  // other selection writer, including "new session") binds the focused pane
  // while every other pane keeps its pinned session.
  //
  // The check is IDEMPOTENT on purpose — it compares the focused pane's own
  // session against the selection instead of tracking a previous value. The
  // core's conversation slot is session-maybe, so every selection change
  // REMOUNTS this component (SessionMaybeEntry's incarnation epoch); a
  // mount-local "previous current" ref would be initialized to the new value
  // and the effect would never fire.
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (current === undefined) return
    const tree = stateRef.current
    if (tree.root.type === 'leaf') return
    const paneId = tree.focusedPaneId ?? allLeaves(tree.root)[0]?.id
    if (paneId === undefined) return
    const focused = allLeaves(tree.root).find(leaf => leaf.id === paneId)
    if (focused === undefined || focused.sessionId === current) return
    paneActions.setPaneSession(paneId, current)
  }, [current, paneActions])

  // Side-bar click channel: `sessions.open()` notifies even when the clicked
  // session is ALREADY current (no selection change to observe), so the
  // focused pane is bound here, at capture time, before the row's own handler
  // runs. Only the split state needs routing — one pane renders `current`.
  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      const row = sessionRowOf(event.target)
      if (row === null) return
      const tree = stateRef.current
      if (tree.root.type === 'leaf') return
      const sessionId = resolveRowSession(row)
      if (sessionId === null) return
      const paneId = tree.focusedPaneId ?? allLeaves(tree.root)[0]?.id
      if (paneId === undefined) return
      paneActions.setPaneSession(paneId, sessionId)
    }
    document.addEventListener('click', onClick, true)
    return () => { document.removeEventListener('click', onClick, true) }
  }, [paneActions, resolveRowSession])

  const root = state.root
  // Fullscreen shows ONE pane full-bleed; the tree (and every other pane's
  // session) stays exactly as it was, so leaving fullscreen restores the split.
  const fullscreenLeaf = state.fullscreenPaneId === null
    ? null
    : allLeaves(root).find(leaf => leaf.id === state.fullscreenPaneId) ?? null
  if (fullscreenLeaf !== null) {
    return (
      <div className={css.fullscreenHost}>
        <PaneFrame
          leaf={fullscreenLeaf}
          focused
          fullscreen
          current={current}
          blankIds={blankIds}
          renderPane={renderPane}
          actions={paneActions}
          openSession={openSession}
          splitWithNew={splitWithNew}
          t={t}
        />
      </div>
    )
  }

  if (root.type === 'leaf') {
    return (
      <SinglePane
        leaf={root}
        current={current}
        showHeroHeader={current === undefined || blankIds.has(current)}
        renderPane={renderPane}
        actions={paneActions}
        openSession={openSession}
        splitWithNew={splitWithNew}
        t={t}
      />
    )
  }

  return (
    // data-slot="conversation.panes" is the CROSS-PLUGIN split-state marker
    // (introduced by this plugin, consumed by dsh-home-ui's "exclude split
    // panes" header rule). It is a plain DOM attribute on this container —
    // no slot is declared or registered, and the core never reads it.
    <div className={css.host} data-slot="conversation.panes">
      <SplitContainer
        node={root}
        dividerLabel={t('pane.split.divider')}
        onSetRatio={(splitId, ratio) => { paneActions.setRatio(splitId, ratio) }}
        renderLeaf={leaf => (
          <PaneFrame
            key={leaf.id}
            leaf={leaf}
            focused={state.focusedPaneId === leaf.id}
            current={current}
            blankIds={blankIds}
            renderPane={renderPane}
            actions={paneActions}
            openSession={openSession}
            splitWithNew={splitWithNew}
            t={t}
          />
        )}
      />
    </div>
  )
}
