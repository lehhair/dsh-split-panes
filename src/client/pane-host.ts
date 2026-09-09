/**
 * Pane render host: the synthetic {@link SlotRendererHost} one pane runs the
 * vendored core renderer against.
 *
 * The core renderer reads every dependency off this single object, so a pane
 * is fully described by what the host returns:
 *
 *   host.root            → the assembled root standard-source binding
 *   host.scope('session')→ THIS pane's binding, not the global current one
 *   host.entriesOf*      → the live ledger, with this plugin's conversation
 *                          shadow removed so the stock root wins
 *   host.entriesOfSlot('root') → the synthetic PaneRoot entry
 *   host.storeOf         → per-(handle, scope) store instances
 *   host.locale          → the installed locale face (the `t` seat cache)
 *
 * Everything the core normally owns internally — outlet dispatch, kit
 * synthesis, inject caches, error boundaries — then runs verbatim on the
 * pane's session. This file only supplies the five decisions above plus the
 * crash supervision the private `SlotCore.reportEntryError` would have done.
 */
import type { StoredEntry } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  HostObservable, LocaleFace, ScopedStandardSourceBinding, SessionAreaProps, SlotRendererHost,
  SlotScopeAdapter, StandardSourceBinding, StoreInstanceLike,
} from '@deepseek-ai/dsh-client-ui-slots'
import { PaneRoot } from './PaneRoot.tsx'
import { storeInstanceOf } from './pane-store.ts'

/** The ledger face a pane host reads (the live SlotRegistry, type-erased). */
export interface PaneLedger {
  /** Raw registrations for one key, in registration order. */
  entries(key: string): readonly StoredEntry[]
  /** Shadowing winners for one key (the registry's own projection). */
  entriesOfSlot(key: string): readonly StoredEntry[]
  /** Declared spec (kind/scope/slot-level inject) for one key. */
  spec(key: string): { kind: string; scope: string; inject?: unknown } | undefined
  /** Registration-version subscription for one key (uSES pair with getVersion). */
  subscribe(key: string, fn: () => void): () => void
  /** Monotonic registration version for one key. */
  getVersion(key: string): number
}

/** Options one pane host is built from. */
export interface PaneHostOptions {
  /** Live slot ledger. */
  readonly ledger: PaneLedger
  /** The installed session scope adapter (resolve/renderArea are reused verbatim). */
  readonly adapter: SlotScopeAdapter
  /** Installed locale face, when present. */
  readonly locale?: LocaleFace | undefined
  /** Root standard-source binding observable. */
  readonly root: HostObservable<StandardSourceBinding>
  /** This pane's session binding; undefined renders the new-conversation state. */
  readonly binding: ScopedStandardSourceBinding | undefined
  /**
   * The absent binding used when `binding` is undefined. Build it with
   * {@link paneAbsentBinding} so the pane sees the full declared source
   * roster (absent hooks must still be FUNCTIONS).
   */
  readonly absent?: StandardSourceBinding | undefined
  /**
   * Entries this pane must never elect (the plugin's own conversation shadow —
   * dropping it is what makes the stock ConversationRoot the winner).
   */
  readonly excluded?: ((entry: StoredEntry) => boolean) | undefined
  /**
   * Entry wrapper applied to every elected entry, identity-stable per entry
   * (inject provenance rides here). Defaults to the identity function.
   */
  readonly wrap?: ((entry: StoredEntry) => StoredEntry) | undefined
  /** Diagnostic hook for pane-side occupant crashes. */
  readonly onCrash?: ((key: string, entry: StoredEntry, error: unknown) => void) | undefined
}

/** The synthetic 'root' occupant: a one-line dispatch into 'conversation'. */
const PANE_ROOT_ENTRY: StoredEntry = {
  component: PaneRoot,
  options: { id: 'panes.root' },
  children: { 'conversation': { kind: 'single', scope: 'session-maybe' } },
}

/** The built-in 'root' spec (SlotCore seeds it; a pane host must answer for it). */
const ROOT_SPEC = { kind: 'single', scope: 'root' } as const

/**
 * The absent scope binding for a new-conversation pane, derived from the
 * installed adapter so it carries EXACTLY the declared source roster (a
 * hand-written shape would miss any hook a later package provides, and a
 * missing seat makes a session-maybe occupant read `undefined` as a hook
 * function — the "useConversation is not a function" failure).
 *
 * With no selection at all the adapter's current binding IS the core's own
 * absent binding, so it is returned as-is.
 * @param ctx - client context carrying uiSession.
 * @returns the absent binding shape.
 */
export function paneAbsentBinding(ctx: {
  uiSession: { adapter: { current: HostObservable<StandardSourceBinding> } }
}): StandardSourceBinding {
  const current = ctx.uiSession.adapter.current.getSnapshot()
  if (current.key === undefined) return current
  const hooks: Record<string, undefined> = {}
  for (const name of Object.keys(current.hooks)) hooks[name] = undefined
  const keyedHooks: Record<string, undefined> = {}
  for (const name of Object.keys(current.keyedHooks)) keyedHooks[name] = undefined
  const props: Record<string, undefined> = {}
  for (const name of Object.keys(current.props)) props[name] = undefined
  return { key: undefined, hooks, keyedHooks, props }
}

/** The cell one entry occupies under its slot's kind (mirrors SlotCore). */
function cellOf(kind: string, entry: StoredEntry): string {
  if (kind === 'keyed') return entry.options.key ?? ''
  if (kind === 'list') return entry.options.id ?? ''
  return ''
}

/** Resolve one entry store's instance for one scope key (shared with the core). */
function storeOf(entry: StoredEntry, binding: ScopedStandardSourceBinding | undefined): StoreInstanceLike | undefined {
  const handle = entry.store as unknown as { create?: (scopeKey?: string) => StoreInstanceLike } | undefined
  if (handle === undefined || typeof handle.create !== 'function') return undefined
  return storeInstanceOf(handle, binding?.key)
}

/**
 * Build the render host for one pane.
 *
 * The host is created per pane session (the memoized `PaneConversation`
 * owns its lifetime); its ledger reads stay live, so late registrations
 * (view tabs, node renderers, docks) appear in every pane as they land.
 * @param options - ledger, adapter, root binding, pane binding, wrappers.
 * @returns the renderer host for this pane.
 */
export function createPaneHost(options: PaneHostOptions): SlotRendererHost {
  const { ledger, adapter, locale, root, binding } = options
  const excluded = options.excluded ?? (() => false)
  const wrap = options.wrap ?? ((entry: StoredEntry) => entry)
  const paneBinding: StandardSourceBinding = binding ?? options.absent ?? { key: undefined, hooks: {}, keyedHooks: {}, props: {} }

  /** Entries retired by an abdicating crash (mirrors SlotCore's WeakSet). */
  const abdicated = new WeakSet<StoredEntry>()
  /** Local version bumps so outlets re-read the ledger after an abdication. */
  const localVersions = new Map<string, number>()
  const listeners = new Map<string, Set<() => void>>()
  const ledgerDisposers = new Map<string, () => void>()
  /** Wrapped-entry cache: the renderer caches inject faces per entry identity. */
  const wrapped = new WeakMap<StoredEntry, StoredEntry>()

  const bump = (key: string): void => {
    localVersions.set(key, (localVersions.get(key) ?? 0) + 1)
    const set = listeners.get(key)
    if (set === undefined) return
    for (const listener of [...set]) {
      try {
        listener()
      } catch (error) {
        console.error('[dsh-split-panes] pane ledger subscriber failed:', error)
      }
    }
  }

  const wrappedEntry = (entry: StoredEntry): StoredEntry => {
    let value = wrapped.get(entry)
    if (value === undefined) {
      value = wrap(entry)
      wrapped.set(entry, value)
    }
    return value
  }

  /** Elect one winner per cell, mirroring SlotCore's shadowing projection. */
  const winnersOf = (key: string): readonly StoredEntry[] => {
    const all = ledger.entries(key)
    const spec = ledger.spec(key) ?? (key === 'root' ? ROOT_SPEC : undefined)
    const kind = spec?.kind ?? 'single'
    if (kind === 'chain') {
      return all.filter(entry => !abdicated.has(entry) && !excluded(entry))
    }
    const order = new Map<StoredEntry, number>()
    all.forEach((entry, index) => { order.set(entry, index) })
    const best = new Map<string, StoredEntry>()
    for (const entry of all) {
      if (abdicated.has(entry) || excluded(entry)) continue
      const cell = cellOf(kind, entry)
      const incumbent = best.get(cell)
      if (incumbent === undefined) {
        best.set(cell, entry)
        continue
      }
      const challenger = entry.options.priority ?? 0
      const holding = incumbent.options.priority ?? 0
      if (challenger < holding
        || (challenger === holding && (order.get(entry) ?? 0) < (order.get(incumbent) ?? 0))) {
        best.set(cell, entry)
      }
    }
    return [...best.values()]
  }

  const paneScope: SlotScopeAdapter = {
    current: {
      getSnapshot: () => paneBinding,
      subscribe: () => () => {},
    },
    resolve: key => adapter.resolve(key),
    // The session owner's own area semantics; a composition without one is
    // already an assembly failure in the core renderer.
    ...(adapter.renderArea === undefined
      ? {}
      : { renderArea: (value: StandardSourceBinding, props: SessionAreaProps) => adapter.renderArea!(value, props) }),
  }

  return {
    subscribe(key, fn) {
      let set = listeners.get(key)
      if (set === undefined) {
        set = new Set()
        listeners.set(key, set)
        ledgerDisposers.set(key, ledger.subscribe(key, () => { bump(key) }))
      }
      set.add(fn)
      return () => {
        set?.delete(fn)
        if (set !== undefined && set.size === 0) {
          listeners.delete(key)
          ledgerDisposers.get(key)?.()
          ledgerDisposers.delete(key)
        }
      }
    },
    getVersion: key => ledger.getVersion(key) + (localVersions.get(key) ?? 0),
    entriesOf: (key) => {
      if (key === 'root') return [PANE_ROOT_ENTRY]
      return ledger.entries(key).filter(entry => !excluded(entry)).map(wrappedEntry)
    },
    entriesOfSlot: (key) => {
      if (key === 'root') return [PANE_ROOT_ENTRY]
      return winnersOf(key).map(wrappedEntry)
    },
    // The renderer guards retained renderSlot closures with this. A pane's
    // bindings are created from the stock entries, whose registrations live as
    // long as their owning package; a disposed entry disappears from
    // entriesOfSlot on the next ledger tick, which is the real re-election.
    isLive: () => true,
    reportEntryError(key, entry, error, info) {
      console.error(`[dsh-split-panes] pane occupant crashed in '${key}':`, error)
      options.onCrash?.(key, entry, error)
      if (!info.abdicate) return
      abdicated.add(entry)
      bump(key)
    },
    specOf: (key) => {
      if (key === 'root') return ROOT_SPEC
      return ledger.spec(key) as never
    },
    storeOf: (entry, scopeBinding) => storeOf(entry, scopeBinding),
    root,
    scopeRevision: { getSnapshot: () => 0, subscribe: () => () => {} },
    scope: scope => (scope === 'session' || scope === 'session-maybe' ? paneScope : undefined),
    ...(locale !== undefined ? { locale } : {}),
  }
}

/** The synthetic root entry a pane host answers for (exposed for tests). */
export const PANE_ROOT_SLOT_ENTRY = PANE_ROOT_ENTRY
