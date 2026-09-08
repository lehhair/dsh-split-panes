// @vitest-environment jsdom
/* PaneWorkspace (the plugin's conversation-slot replacement): single
   full-bleed pane renders the inject-provided feed with no chrome; the
   no-session hero stays full-bleed; splitting clones the pane — the
   original keeps the current session, the new pane is the new-conversation
   entry — and EVERY pane re-hosts its conversation through the injected
   renderPane delegate (session-id addressed), inside a focus-grabbing
   frame; a selection change routes to the FOCUSED pane; focusing a pane
   opens its session; mod+shift keybindings split and close; dragging a
   side-bar session onto a pane highlights the drop zone and splits to that
   side (or replaces the pane's session on the center). */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, createEvent, fireEvent, render, screen, act } from '@testing-library/react'
import { useSyncExternalStore } from 'react'
import type { PaneWorkspaceProps } from '../src/client/PaneWorkspace.tsx'
import { PaneWorkspace, SESSION_DRAG_TYPE } from '../src/client/PaneWorkspace.tsx'
import { createPaneLayoutStore, allLeaves, type PaneLayoutState } from '../src/client/pane-layout-store.ts'
import { en } from '../src/client/locales.ts'

const t: PaneWorkspaceProps['t'] = key => (en as Record<string, string>)[key] ?? key

afterEach(() => { cleanup() })

/** Selector hook over a store instance (the framework's useStore binding). */
function hookOf<T>(inst: { subscribe: (fn: () => void) => () => void; getSnapshot: () => T }) {
  return function useSelector<S>(sel: (s: T) => S): S {
    return sel(useSyncExternalStore(inst.subscribe, inst.getSnapshot))
  }
}

// Framework kit members the workspace never reads; stub as never-called.
const neverHook = (() => { throw new Error('workspace must not read this seat') }) as never

function sessionState(current: string | undefined, extra: Record<string, { blank?: boolean }> = {}) {
  return {
    ids: ['s1', 's2'],
    byId: {
      s1: { id: 's1', displayTitle: 'Fix the build', running: false, blank: false, updatedAt: 1 },
      s2: { id: 's2', displayTitle: 'Second', running: false, blank: false, updatedAt: 1 },
      ...extra,
    },
    current,
    phase: 'ready',
  }
}

function mount(initialCurrent: string | undefined = 's1') {
  const instance = createPaneLayoutStore().create()
  // The pane-body delegate records the session each pane renders under
  // (undefined = the new-conversation hero) and renders a marker.
  const bodies: Array<string | undefined> = []
  const renderPane = vi.fn((sessionId: string | undefined, key: string) => {
    bodies.push(sessionId)
    return <div data-testid={`feed-${key}`} data-pane-session={sessionId ?? 'none'} />
  })
  const openSession = vi.fn()
  // The entry's split verb is a real split over the store (the anchor rule —
  // single pane keeps current, tree splits anchor null — lives in the
  // component, so the keyboard path exercises it end-to-end).
  const splitWithNew = vi.fn((paneId: string, direction: 'horizontal' | 'vertical', anchor: string | null) => {
    instance.actions.splitPane(paneId, direction, anchor as never)
  })
  const splitFocused = vi.fn((direction: 'horizontal' | 'vertical') => {
    const state = instance.getSnapshot()
    const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id
    if (paneId === undefined) return
    const anchor: string | null = state.root.type === 'leaf'
      ? (currentRef.current ?? null)
      : null
    instance.actions.splitPane(paneId, direction, anchor as never)
  })
  const closeFocused = vi.fn(() => {
    const state = instance.getSnapshot()
    const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id
    if (paneId !== undefined) instance.actions.closePane(paneId)
  })
  const hasSplit = vi.fn((): boolean => instance.getSnapshot().root.type !== 'leaf')
  const usePaneStore = hookOf(instance)
  // Mutable current for the selection-change binding test.
  let current: string | undefined = initialCurrent
  const currentRef: { current: string | undefined } = { current: initialCurrent }
  const element = () => (
    <PaneWorkspace
      usePaneStore={usePaneStore}
      paneActions={instance.actions}
      useSessions={((sel: (s: unknown) => unknown) => sel(sessionState(currentRef.current))) as PaneWorkspaceProps['useSessions']}
      useSession={neverHook}
      useConversation={neverHook}
      useInput={neverHook}
      useProjection={neverHook}
      inputActions={undefined}
      sessionId={undefined}
      useSessionPendingInteraction={neverHook}
      useWorkspaces={neverHook}
      openSession={openSession}
      splitWithNew={splitWithNew}
      splitFocused={splitFocused}
      closeFocused={closeFocused}
      hasSplit={hasSplit}
      renderPane={renderPane}
      t={t}
    />
  )
  const view = render(element())
  return {
    ...view,
    instance,
    bodies,
    renderPane,
    openSession,
    splitWithNew,
    splitFocused,
    closeFocused,
    rerender: () => { view.rerender(element()) },
    setCurrent: (next: string | undefined) => {
      current = next
      currentRef.current = next
      view.rerender(element())
    },
    get: () => ({ current }),
  }
}

describe('PaneWorkspace', () => {
  it('single pane: renders the inject-provided feed full-bleed with no chrome', () => {
    const { renderPane, container, bodies } = mount()
    expect(renderPane).toHaveBeenCalledOnce()
    expect(screen.getAllByTestId(/feed-/)).toHaveLength(1)
    expect(container.querySelector('[role="separator"]')).toBeNull()
    expect(bodies).toEqual(['s1'])
  })

  it('no current session: the plain full-bleed hero with a new-conversation header (split from the start)', () => {
    // NB: mount(undefined) would hit the default parameter — start from a
    // session then clear the selection to reach the no-session hero.
    const { renderPane, instance, setCurrent, container } = mount()
    act(() => { setCurrent(undefined) })
    // mount (session) + the hero branch re-render.
    expect(renderPane).toHaveBeenCalledTimes(2)
    expect(screen.getAllByTestId(/feed-/)).toHaveLength(1)
    // The hero gets the plugin's new-conversation header: title + split H/V
    // (no close — nothing to close while unsplit).
    expect(screen.getAllByText('New conversation')).toHaveLength(1)
    expect(screen.getByRole('button', { name: en['pane.split.horizontal'] })).toBeTruthy()
    expect(screen.getByRole('button', { name: en['pane.split.vertical'] })).toBeTruthy()
    expect(screen.queryByRole('button', { name: en['pane.close'] })).toBeNull()
    // The UNSPlit new-conversation state is full-bleed like a plain session:
    // no pane frame (border/padding) around the header + feed — the frame
    // appears only once the user actually splits.
    expect(container.querySelector('[class*="host"]')).toBeNull()
    expect(container.querySelector('[class*="pane"]')).toBeNull()
    // Splitting from the hero yields two fresh hero panes (no session anchor).
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', null) })
    const root = instance.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    const leaves = [root.first, root.second]
    if (leaves[0]!.type !== 'leaf' || leaves[1]!.type !== 'leaf') throw new Error('expected leaves')
    expect(leaves[0]!.sessionId).toBeNull()
    expect(leaves[1]!.sessionId).toBeNull()
    // Both hero panes now carry the new-conversation header with close.
    expect(screen.getAllByText('New conversation')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: en['pane.close'] })).toHaveLength(2)
  })

  it('split clones the pane: both panes re-host the conversation, each under its own session', () => {
    const { instance, renderPane, bodies } = mount()
    renderPane.mockClear()
    bodies.length = 0
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    expect(renderPane).toHaveBeenCalledTimes(2)
    expect(bodies).toEqual(['s1', undefined])
    const divider = screen.getByRole('separator', { name: en['pane.split.divider'] })
    expect(divider.getAttribute('aria-orientation')).toBe('vertical')
    expect(divider.getAttribute('aria-valuenow')).toBe('50')
    // The FRESH pane is focused (split focuses the new pane); the original
    // is not.
    const frames = [...document.querySelectorAll('[data-pane-session]')]
      .map(el => el.closest('[class*="pane"]'))
      .filter((el): el is Element => el !== null)
    expect(frames).toHaveLength(2)
    expect(frames[0]!.hasAttribute('data-focused')).toBe(false)
    expect(frames[1]!.hasAttribute('data-focused')).toBe(true)
  })

  it('a selection change routes to the FOCUSED pane (side-bar switch binds it)', () => {
    const { instance, setCurrent } = mount()
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    // The fresh pane is focused; switching the selection binds IT, while the
    // original pane keeps its pinned session.
    act(() => { setCurrent('s2') })
    const root = instance.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    const newPane = root.second
    const original = root.first
    if (newPane.type !== 'leaf' || original.type !== 'leaf') throw new Error('expected leaves')
    expect(newPane.sessionId).toBe('s2')
    expect(original.sessionId).toBe('s1')
  })

  it('focusing a pane opens its session (the side-bar highlight follows the active pane)', () => {
    const { instance, openSession } = mount()
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    // Bind the fresh pane to a session, then focus the ORIGINAL pane: its
    // session is opened (selection follows the active pane).
    const root = instance.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    act(() => { instance.actions.setPaneSession(root.second.id, 's2' as never) })
    openSession.mockClear()
    const frames = [...document.querySelectorAll('[data-pane-session]')]
      .map(el => el.closest('[class*="pane"]'))
      .filter((el): el is Element => el !== null)
    fireEvent.pointerDown(frames[0]!)
    expect(openSession).toHaveBeenCalledWith('s1')
    // The hero pane has no session to open — focusing it leaves the
    // selection untouched.
    act(() => { instance.actions.setPaneSession(root.second.id, null) })
    openSession.mockClear()
    fireEvent.pointerDown(frames[1]!)
    expect(openSession).not.toHaveBeenCalled()
  })

  it('several panes may show the SAME session', () => {
    const { instance } = mount()
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    const root = instance.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    const newPane = root.second
    if (newPane.type !== 'leaf') throw new Error('expected a leaf')
    act(() => { instance.actions.setPaneSession(newPane.id, 's1' as never) })
    const after = instance.getSnapshot().root
    if (after.type !== 'split') throw new Error('expected a split')
    const leaves = [after.first, after.second]
    if (leaves[0]!.type !== 'leaf' || leaves[1]!.type !== 'leaf') throw new Error('expected leaves')
    expect(leaves[0]!.sessionId).toBe('s1')
    expect(leaves[1]!.sessionId).toBe('s1')
  })

  it('close returns to the single full-bleed pane', () => {
    const { instance, renderPane } = mount()
    renderPane.mockClear()
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    const closedId = (() => {
      const root = instance.getSnapshot().root
      if (root.type !== 'split') throw new Error('expected a split')
      return root.second.id
    })()
    act(() => { instance.actions.closePane(closedId) })
    expect(screen.getAllByTestId(/feed-/)).toHaveLength(1)
    expect(screen.queryByRole('separator')).toBeNull()
    // split (2 panes) + the surviving single pane re-render.
    expect(renderPane).toHaveBeenCalledTimes(3)
  })

  it('mod+shift+ArrowRight splits the focused pane; mod+shift+w closes it', () => {
    const { instance } = mount()
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true, shiftKey: true })
    const root = instance.getSnapshot().root
    expect(root.type).toBe('split')
    const first = root.type === 'split' ? root.first : null
    if (first === null || first.type !== 'leaf') throw new Error('expected a leaf')
    expect(first.sessionId).toBe('s1')
    fireEvent.keyDown(window, { key: 'w', ctrlKey: true, shiftKey: true })
    expect(instance.getSnapshot().root.type).toBe('leaf')
  })

  it('ignores mod+shift keys while an editable element is focused', () => {
    const { instance } = mount()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowRight', ctrlKey: true, shiftKey: true })
    expect(instance.getSnapshot().root.type).toBe('leaf')
    input.remove()
  })

  it('dragging a session over a pane highlights the drop zone (center vs edge)', () => {
    const { instance } = mount()
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    const pane = paneOf('none')
    pinRect(pane, 100, 100)
    // Right edge -> 'right' zone highlight.
    fireDrag(pane, 'dragOver', 95, 50, 's2')
    expect(document.querySelector('[data-drop-zone="right"]')).toBeTruthy()
    // Center -> 'center' highlight.
    fireDrag(pane, 'dragOver', 50, 50, 's2')
    expect(document.querySelector('[data-drop-zone="center"]')).toBeTruthy()
    // Leaving the pane clears it; non-session drags never highlight.
    fireDrag(pane, 'dragLeave', 50, 50, 's2')
    expect(document.querySelector('[data-drop-zone]')).toBeNull()
    const other = createEvent.dragOver(pane)
    Object.defineProperty(other, 'dataTransfer', { value: { types: ['text/plain'], dropEffect: '' } })
    fireEvent(pane, other)
    expect(document.querySelector('[data-drop-zone]')).toBeNull()
  })

  it('dropping a session on the CENTER replaces that pane\'s session', () => {
    const { instance, openSession } = mount()
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    const pane = paneOf('none')
    pinRect(pane, 100, 100)
    fireDrag(pane, 'drop', 50, 50, 's2')
    const root = instance.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    expect(root.second).toMatchObject({ type: 'leaf', sessionId: 's2' })
    // The drop acts on that pane: it takes focus and OPENS the dropped
    // session — the open is what loads a cold session's window, so the pane
    // renders content immediately.
    expect(instance.getSnapshot().focusedPaneId).toBe(root.second.id)
    expect(openSession).toHaveBeenCalledWith('s2')
    // Dropping the pane's own session is a no-op.
    const own = paneOf('s1')
    pinRect(own, 100, 100)
    fireDrag(own, 'drop', 50, 50, 's1')
    const after = instance.getSnapshot().root
    if (after.type !== 'split') throw new Error('expected a split')
    expect(after.first).toMatchObject({ type: 'leaf', sessionId: 's1' })
    expect(after.second).toMatchObject({ type: 'leaf', sessionId: 's2' })
  })

  it('dropping a session on an EDGE splits to that side, the new pane shows the session', () => {
    const { instance, openSession } = mount()
    const id = instance.getSnapshot().root.id
    act(() => { instance.actions.splitPane(id, 'horizontal', 's1' as never) })
    const original = paneOf('s1')
    pinRect(original, 100, 100)
    // Drop on the original pane's right edge: the original keeps its
    // session, the new pane (with s2) appears to its right. The drop is an
    // act on the new pane — it takes focus and its session opens.
    fireDrag(original, 'drop', 95, 50, 's2')
    const root = instance.getSnapshot().root
    if (root.type !== 'split' || root.first.type !== 'split') throw new Error('expected a nested split')
    expect(root.first.first).toMatchObject({ type: 'leaf', sessionId: 's1' })
    expect(root.first.second).toMatchObject({ type: 'leaf', sessionId: 's2' })
    expect(instance.getSnapshot().focusedPaneId).toBe(root.first.second.id)
    expect(openSession).toHaveBeenCalledWith('s2')
  })

  it('the single full-bleed surface drops too: center opens the session, an edge splits with the current anchor', () => {
    const { instance, openSession } = mount()
    const surface = document.querySelector('[class*="singleSurface"]') as HTMLElement
    expect(surface).toBeTruthy()
    pinRect(surface, 100, 100)
    fireDrag(surface, 'drop', 50, 50, 's2')
    expect(openSession).toHaveBeenCalledWith('s2')
    fireDrag(surface, 'drop', 95, 50, 's2')
    const root = instance.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    // The single pane anchored the current selection (s1); the dropped
    // session landed in the new right-side pane.
    expect(root.first).toMatchObject({ type: 'leaf', sessionId: 's1' })
    expect(root.second).toMatchObject({ type: 'leaf', sessionId: 's2' })
  })
})

/** Minimal HTML5 dataTransfer for a side-bar session drag. */
function dragData(sessionId: string) {
  return {
    types: [SESSION_DRAG_TYPE],
    dropEffect: '',
    setData: () => {},
    getData: (type: string) => (type === SESSION_DRAG_TYPE ? sessionId : ''),
  }
}

/**
 * Fire a drag event with pinned coordinates + session dataTransfer. jsdom
 * lacks DragEvent, and the plain-Event fallback drops clientX/clientY —
 * pin the read properties on the built event (the repo's fireDrag pattern).
 */
function fireDrag(element: HTMLElement, kind: 'dragOver' | 'dragLeave' | 'drop', clientX: number, clientY: number, sessionId: string): void {
  const event = kind === 'drop' ? createEvent.drop(element)
    : kind === 'dragLeave' ? createEvent.dragLeave(element)
      : createEvent.dragOver(element)
  Object.defineProperty(event, 'clientX', { value: clientX })
  Object.defineProperty(event, 'clientY', { value: clientY })
  Object.defineProperty(event, 'dataTransfer', { value: dragData(sessionId) })
  fireEvent(element, event)
}

/** One split pane by its rendered pane session marker. */
function paneOf(scope: string): HTMLElement {
  const scoped = document.querySelector(`[data-pane-session="${scope}"]`)
  if (scoped === null) throw new Error(`no panned element for "${scope}"`)
  const pane = scoped.closest('[class*="pane"]')
  if (pane === null) throw new Error('no pane frame')
  return pane as HTMLElement
}

/** jsdom reports 0x0 rects — pin a deterministic one for zone hit-testing. */
function pinRect(element: HTMLElement, width: number, height: number): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: width, bottom: height, width, height,
    x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
}