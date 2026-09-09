// @vitest-environment node
/**
 * Store-instance sharing: a handle used by both a pane entry and a
 * core-rendered entry must resolve to ONE instance, or the two regions drift
 * (the live symptom: the right-sidebar expand button toggling its own copy
 * while the panel reads the other).
 */
import { describe, expect, it } from 'vitest'
import { memoizeHandle, storeInstanceOf } from '../src/client/pane-store.ts'

/** Minimal engine handle: create() mints a fresh instance, like the real one. */
function handle() {
  let minted = 0
  const created: string[] = []
  return {
    created,
    create(scopeKey?: string) {
      minted += 1
      created.push(`${scopeKey ?? ''}#${minted}`)
      return {
        actions: {},
        getSnapshot: () => scopeKey ?? null,
        subscribe: () => () => {},
        clearPersisted: () => {},
      }
    },
  }
}

describe('storeInstanceOf', () => {
  it('memoizes one instance per (handle, scope key)', () => {
    const h = handle()
    const first = storeInstanceOf(h, 's1')
    expect(storeInstanceOf(h, 's1')).toBe(first)
    expect(storeInstanceOf(h, 's2')).not.toBe(first)
    expect(h.created).toHaveLength(2)
  })

  it('hands the memoized instance to any later caller — the core registry path', () => {
    const h = handle()
    const fromPane = storeInstanceOf(h, 's1')
    // The core registry resolves through the same handle.create(key).
    const fromCore = h.create('s1')
    expect(fromCore).toBe(fromPane)
    expect(h.created).toHaveLength(1)
  })

  it('adopts an instance the core created first, once the handle is memoized', () => {
    const h = handle()
    // installStoreSharing patches every declared handle at plugin apply, so by
    // the time either side resolves, create() is already memoized.
    memoizeHandle(h)
    const fromCore = h.create('s1')
    expect(storeInstanceOf(h, 's1')).toBe(fromCore)
    expect(h.created).toHaveLength(1)
  })

  it('keys the root scope separately from session scopes', () => {
    const h = handle()
    const root = storeInstanceOf(h, undefined)
    expect(storeInstanceOf(h, undefined)).toBe(root)
    expect(storeInstanceOf(h, 's1')).not.toBe(root)
  })

  it('leaves a frozen handle unpatched and still caches locally', () => {
    const h = Object.freeze(handle())
    const first = storeInstanceOf(h, 's1')
    expect(storeInstanceOf(h, 's1')).toBe(first)
    // The frozen handle cannot be memoized, so a second create() mints anew —
    // the plugin-local cache is the only sharing available.
    expect(h.create('s1')).not.toBe(first)
  })
})
