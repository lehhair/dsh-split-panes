/* Pane-layout store: split clones the pane (original keeps the session, the
   new pane is the new-conversation entry), ratios clamp to [0.15, 0.85],
   closing prunes to the remaining pane, and a started conversation binds to
   its pane. */
import { describe, expect, it } from 'vitest'
import { createPaneLayoutStore, MAX_RATIO, MIN_RATIO, allLeaves } from '../src/client/pane-layout-store.ts'

const SESSION = 's1' as never

function boot() {
  const store = createPaneLayoutStore().create()
  const id = (store.getSnapshot().root as { id: string }).id
  return { store, id }
}

describe('pane-layout-store', () => {
  it('starts as a single unbound pane', () => {
    const { store, id } = boot()
    expect(store.getSnapshot().root).toEqual({ type: 'leaf', id, sessionId: null })
    expect(store.getSnapshot().focusedPaneId).toBe(id)
  })

  it('split keeps the original session and opens a fresh pane', () => {
    const { store, id } = boot()
    store.actions.splitPane(id, 'horizontal', SESSION)
    const root = store.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    // The original pane defaulted to the current session; the new pane is fresh.
    expect(root.first).toMatchObject({ type: 'leaf', sessionId: SESSION })
    expect(root.second).toMatchObject({ type: 'leaf', sessionId: null })
    // Focus follows the new pane.
    expect(store.getSnapshot().focusedPaneId).toBe(root.second.id)
  })

  it('setPaneSession binds a started conversation to its pane', () => {
    const { store, id } = boot()
    store.actions.splitPane(id, 'horizontal', SESSION)
    const root = store.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    const newPaneId = root.second.id
    store.actions.setPaneSession(newPaneId, 's2' as never)
    const after = store.getSnapshot().root
    if (after.type !== 'split') throw new Error('expected a split')
    expect(after.second).toMatchObject({ type: 'leaf', sessionId: 's2' })
  })

  it('re-splitting an already-bound pane keeps its session', () => {
    const { store, id } = boot()
    store.actions.splitPane(id, 'horizontal', SESSION)
    const firstId = (store.getSnapshot().root as Extract<ReturnType<typeof store.getSnapshot>['root'], { type: 'split' }>).first.id
    store.actions.splitPane(firstId, 'vertical', SESSION)
    const root = store.getSnapshot().root
    if (root.type !== 'split' || root.first.type !== 'split') throw new Error('expected a nested split')
    expect(root.first.first).toMatchObject({ type: 'leaf', sessionId: SESSION })
    expect(root.first.second).toMatchObject({ type: 'leaf', sessionId: null })
  })

  it('close prunes the split and refocuses when the focused pane closes', () => {
    const { store, id } = boot()
    store.actions.splitPane(id, 'horizontal', SESSION)
    const root = store.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    const newPaneId = root.second.id
    store.actions.closePane(newPaneId)
    expect(store.getSnapshot().root.type).toBe('leaf')
    expect(store.getSnapshot().focusedPaneId).toBe(id)
  })

  it('setRatio clamps to the [MIN, MAX] band', () => {
    const { store, id } = boot()
    store.actions.splitPane(id, 'horizontal', SESSION)
    const splitId = store.getSnapshot().root.id
    store.actions.setRatio(splitId, 0.99)
    expect((store.getSnapshot().root as Extract<ReturnType<typeof store.getSnapshot>['root'], { type: 'split' }>).ratio).toBe(MAX_RATIO)
    store.actions.setRatio(splitId, 0.01)
    expect((store.getSnapshot().root as Extract<ReturnType<typeof store.getSnapshot>['root'], { type: 'split' }>).ratio).toBe(MIN_RATIO)
  })

  it('allLeaves lists every pane in tree order', () => {
    const { store, id } = boot()
    store.actions.splitPane(id, 'horizontal', SESSION)
    const firstId = (store.getSnapshot().root as Extract<ReturnType<typeof store.getSnapshot>['root'], { type: 'split' }>).first.id
    store.actions.splitPane(firstId, 'vertical', SESSION)
    const leaves = allLeaves(store.getSnapshot().root)
    expect(leaves).toHaveLength(3)
  })

  it('splitPaneToSide splits on the dropped side with the dropped session, focusing the new pane', () => {
    const { store, id } = boot()
    store.actions.focusPane(id)
    // 'right' appends the dropped pane after the original.
    store.actions.splitPaneToSide(id, 'right', 's2' as never, SESSION)
    let root = store.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    expect(root.direction).toBe('horizontal')
    expect(root.first).toMatchObject({ type: 'leaf', sessionId: SESSION })
    expect(root.second).toMatchObject({ type: 'leaf', sessionId: 's2' })
    // The single full-bleed pane anchored the current selection; the drop
    // is an act on the NEW pane, so it takes focus.
    expect(store.getSnapshot().focusedPaneId).toBe(root.second.id)
    // 'left' puts the dropped pane FIRST, the original moves to the far side.
    const originalId = root.first.id
    store.actions.splitPaneToSide(originalId, 'left', 's3' as never, null)
    root = store.getSnapshot().root
    if (root.type !== 'split' || root.first.type !== 'split') throw new Error('expected a nested split')
    expect(root.first.first).toMatchObject({ type: 'leaf', sessionId: 's3' })
    expect(root.first.second).toMatchObject({ type: 'leaf', sessionId: 's1' })
    expect(root.second).toMatchObject({ type: 'leaf', sessionId: 's2' })
    expect(root.first.direction).toBe('horizontal')
  })

  it('splitPaneToSide top/bottom stack vertically', () => {
    const { store, id } = boot()
    store.actions.splitPaneToSide(id, 'top', 's2' as never, null)
    let root = store.getSnapshot().root
    if (root.type !== 'split') throw new Error('expected a split')
    expect(root.direction).toBe('vertical')
    expect(root.first).toMatchObject({ type: 'leaf', sessionId: 's2' })
    expect(root.second).toMatchObject({ type: 'leaf', sessionId: null })
    const originalId = root.second.id
    store.actions.splitPaneToSide(originalId, 'bottom', 's3' as never, null)
    root = store.getSnapshot().root
    if (root.type !== 'split' || root.second.type !== 'split') throw new Error('expected a nested split')
    expect(root.second.direction).toBe('vertical')
    expect(root.second.first).toMatchObject({ type: 'leaf', sessionId: null })
    expect(root.second.second).toMatchObject({ type: 'leaf', sessionId: 's3' })
  })
})
