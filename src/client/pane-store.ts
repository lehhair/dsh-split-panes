/**
 * Store instances shared between the core registry and pane hosts.
 *
 * The core resolves one store instance per (handle, scope key) and caches it
 * inside its private registry (`resolveStore`). A pane host stands in for that
 * registry, so it must hand out THE SAME instance — otherwise a handle used by
 * both a pane entry and a core-rendered entry splits its state. The live case:
 * `ui-sidebar-right` shares one session-scoped store between the `rightbar`
 * panel seat (rendered by the core frame) and the header-corner expand button
 * (rendered inside a pane); with two instances the button toggles its own copy
 * and the panel never opens.
 *
 * The registry exposes no accessor for its instance map, so sharing is
 * established on the handle itself: `create(scopeKey)` is memoized per key,
 * which makes "one instance per (handle, scope key)" hold globally whichever
 * side resolves first. {@link installStoreSharing} patches every declared
 * handle at plugin apply — before the shell renders — and keeps up with
 * registrations through the `slots/changed` event, so the core's own
 * `resolveStore` always receives the memoized instance.
 *
 * A frozen handle cannot be patched; the plugin-local cache is then the only
 * sharing available.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { StoreInstanceLike } from '@deepseek-ai/dsh-client-ui-slots'

/** Marks a handle whose `create` this module memoizes. */
const MEMOIZED = Symbol.for('@dsh-external/dsh-split-panes.memoizedStoreCreate')

/** The slice of an engine handle this module touches. */
interface MemoizableHandle {
  create(scopeKey?: string): StoreInstanceLike
  [MEMOIZED]?: boolean
}

/** Every cache this module created (pruning walks them). */
const caches = new Set<Map<string, StoreInstanceLike>>()
/** handle identity → scope key → instance. */
const perHandle = new WeakMap<object, Map<string, StoreInstanceLike>>()

/**
 * Memoize one handle's `create(scopeKey)` per key (idempotent).
 * @param handle - engine store handle declared by an entry.
 * @returns the handle's per-key instance cache.
 */
export function memoizeHandle(handle: object): Map<string, StoreInstanceLike> {
  let cache = perHandle.get(handle)
  if (cache === undefined) {
    cache = new Map()
    perHandle.set(handle, cache)
    caches.add(cache)
  }
  const mutable = handle as MemoizableHandle
  if (mutable[MEMOIZED] !== true && !Object.isFrozen(handle)) {
    const original = mutable.create
    mutable.create = function (this: unknown, nextKey?: string): StoreInstanceLike {
      const key = nextKey ?? ''
      let instance = cache.get(key)
      if (instance === undefined) {
        instance = original.call(this, nextKey)
        cache.set(key, instance)
      }
      return instance
    }
    mutable[MEMOIZED] = true
  }
  return cache
}

/**
 * Resolve one handle's instance for one scope key, sharing it with every other
 * consumer of the same handle.
 * @param handle - engine store handle declared by an entry.
 * @param scopeKey - session id for session-scoped handles; undefined for root.
 * @returns the shared instance.
 */
export function storeInstanceOf(handle: object, scopeKey: string | undefined): StoreInstanceLike {
  const cache = memoizeHandle(handle)
  const key = scopeKey ?? ''
  let instance = cache.get(key)
  if (instance === undefined) {
    instance = (handle as MemoizableHandle).create(scopeKey)
    cache.set(key, instance)
  }
  return instance
}

/** One declared slot tree node's key (the inspection snapshot's shape). */
interface SlotNode {
  readonly name: string
  readonly children?: readonly SlotNode[]
}

/** Collect every declared slot key reachable from an inspection snapshot. */
function slotKeys(nodes: readonly SlotNode[], into: Set<string> = new Set()): Set<string> {
  for (const node of nodes) {
    into.add(node.name)
    if (node.children !== undefined) slotKeys(node.children, into)
  }
  return into
}

/**
 * Share every declared store handle with the core, and keep sharing the ones
 * registered later. Runs at plugin apply (before the shell mounts), so a pane
 * never races the core's own resolution.
 *
 * Also prunes memoized instances for sessions that no longer exist, so a
 * long-lived process does not retain one store per session ever viewed.
 * @param ctx - client context carrying the slot registry and session roster.
 */
export function installStoreSharing(ctx: Context): void {
  const patchDeclared = (): void => {
    for (const key of slotKeys(ctx.slots.snapshot() as unknown as readonly SlotNode[])) {
      for (const entry of ctx.slots.entries(key as never)) {
        const handle = (entry as { store?: object }).store
        if (handle !== undefined) memoizeHandle(handle)
      }
    }
  }
  patchDeclared()

  ctx.effect(() => {
    // Batched to one scan per tick: boot registers hundreds of entries.
    let scheduled = false
    const onChanged = (): void => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => {
        scheduled = false
        try {
          patchDeclared()
        } catch (error) {
          console.error('[dsh-split-panes] store sharing scan failed:', error)
        }
      })
    }
    const disposeChanged = ctx.on('slots/changed', onChanged)

    const sessions = ctx.sessions
    const disposeList = sessions.list.subscribe(() => {
      const snapshot = sessions.list.getSnapshot() as
        | { byId: Record<string, unknown>; phase?: string } | undefined
      if (snapshot === undefined || snapshot.phase !== 'ready') return
      for (const cache of caches) {
        for (const key of [...cache.keys()]) {
          if (key !== '' && snapshot.byId[key] === undefined) cache.delete(key)
        }
      }
    })
    return () => {
      disposeChanged()
      disposeList()
    }
  }, 'ui-panes: store sharing')
}
