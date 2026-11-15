/**
 * Pane render host: the {@link SlotRendererHost} one pane runs the vendored
 * core renderer against.
 *
 * Since dsh 0.2.2-rc.3 the host contract carries Factory machinery
 * (`factoryOf`, `factoryStoreOf`, occurrence retention, …) and store
 * resolution bound to the registry's own instance axis. Re-implementing that
 * would fork core state, so a pane host is an OVERLAY on the registry's own
 * host face: every member is delegated except the five pane decisions —
 *
 *   entriesOf/entriesOfSlot('root') → the synthetic PaneRoot entry
 *   entriesOf*(other)               → the live ledger minus this plugin's own
 *                                     conversation shadow (so the stock root wins)
 *   reportEntryError                → pane-local abdication (a pane crash must
 *                                     not retire the entry for the main view)
 *   subscribe/getVersion            → ledger + pane-local abdication bumps
 *   scope('session'|'session-maybe')→ THIS pane's binding source
 */
import type { StoredEntry, StoredFactory } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  HostObservable, SlotRendererHost, SlotScopeAdapter, StandardSourceBinding,
} from '@deepseek-ai/dsh-client-ui-slots'
import { PaneRoot } from './PaneRoot.tsx'

/** Options one pane host is built from. */
export interface PaneHostOptions {
  /** The registry's own host face (delegation target). */
  readonly base: SlotRendererHost
  /** The installed session scope adapter. */
  readonly adapter: SlotScopeAdapter
  /** This pane's binding source (a retained Session, or the absent projection). */
  readonly binding: HostObservable<StandardSourceBinding>
  /**
   * Entries this pane must never elect (the plugin's own conversation shadow —
   * dropping it is what makes the stock ConversationRoot the winner).
   */
  readonly excluded?: ((entry: StoredEntry) => boolean) | undefined
  /** Diagnostic hook for pane-side occupant crashes. */
  readonly onCrash?: ((key: string, entry: StoredEntry, error: unknown) => void) | undefined
  /** Entries the CORE abdicated (see {@link registryCoreAbdicated}). */
  readonly coreAbdicated?: ((entry: StoredEntry) => boolean) | undefined
  /**
   * Pane-local view of a Factory's inject face (e.g. to learn which Session a
   * hero's `selectWorkspace` opened). Omitted: Factories render unchanged.
   */
  readonly wrapFactoryInject?: ((name: string, face: Record<string, unknown>) => Record<string, unknown>) | undefined
}

/** The synthetic 'root' occupant: a one-line dispatch into 'main.conversation'. */
const PANE_ROOT_ENTRY: StoredEntry = {
  component: PaneRoot,
  options: { id: 'panes.root' },
  children: { 'main.conversation': { kind: 'single', scope: 'session-maybe' } },
}

/** The built-in 'root' spec (SlotCore seeds it; a pane host must answer for it). */
const ROOT_SPEC = { kind: 'single', scope: 'root' } as const

/**
 * Read the registry's host face. `hostFace()` is TypeScript-private on
 * SlotRegistry but is the very object the core renderer receives; the pane
 * renderer must see the same Factory and store axes.
 * @param slots - the `ctx.slots` SlotRegistry.
 * @returns the registry host face.
 * @throws when this core build exposes no host face.
 */
export function registryHostFace(slots: unknown): SlotRendererHost {
  const face = (slots as { hostFace?: () => SlotRendererHost }).hostFace
  if (typeof face !== 'function') {
    throw new Error('[dsh-split-panes] this dsh core exposes no slot host face (unsupported core version)')
  }
  return face.call(slots)
}

/**
 * The core's own abdication set, read live from the registry's SlotCore
 * (`_core.abdicated`, TS-private like `hostFace()`; same documented exception).
 * Reading the set itself — rather than mirroring `onEntryError` — keeps it
 * complete across plugin reloads and for abdications that predate this plugin.
 * @param slots - the `ctx.slots` SlotRegistry.
 * @returns membership test for core-abdicated entries.
 * @throws when this core build has no such set.
 */
export function registryCoreAbdicated(slots: unknown): (entry: StoredEntry) => boolean {
  const set = (slots as { _core?: { abdicated?: unknown } })._core?.abdicated
  if (!(set instanceof WeakSet)) {
    throw new Error('[dsh-split-panes] this dsh core exposes no slot abdication set (unsupported core version)')
  }
  return entry => set.has(entry)
}

/** The cell one entry occupies under its slot's kind (mirrors SlotCore.entriesOfSlot). */
function cellOf(kind: string, entry: StoredEntry): string | undefined {
  if (kind === 'keyed') return entry.options.key
  if (kind === 'list') return entry.options.id
  if (kind === 'hoc') return JSON.stringify([entry.options.key, entry.options.id])
  return undefined
}

/**
 * Build the render host for one pane.
 * @param options - base host, adapter, pane binding, exclusion.
 * @returns the renderer host for this pane.
 */
export function createPaneHost(options: PaneHostOptions): SlotRendererHost {
  const { base, adapter, binding } = options
  const excluded = options.excluded ?? (() => false)

  /** Entries retired by a pane-local abdicating crash. */
  const abdicated = new WeakSet<StoredEntry>()
  const localVersions = new Map<string, number>()
  const localListeners = new Map<string, Set<() => void>>()

  const bump = (key: string): void => {
    localVersions.set(key, (localVersions.get(key) ?? 0) + 1)
    for (const listener of [...(localListeners.get(key) ?? [])]) {
      try {
        listener()
      } catch (error) {
        console.error('[dsh-split-panes] pane ledger subscriber failed:', error)
      }
    }
  }

  const coreAbdicated = options.coreAbdicated ?? (() => false)

  /**
   * SlotCore.entriesOfSlot over the priority-sorted ledger, skipping entries
   * the core abdicated (mirrored set) and entries this pane hides.
   */
  const winnersOf = (key: string): readonly StoredEntry[] => {
    const all = base.entriesOf(key)
    const hidden = (entry: StoredEntry): boolean => abdicated.has(entry) || excluded(entry)
    // Fast path: nothing pane-specific applies, so the core's own election stands.
    if (!all.some(hidden)) return base.entriesOfSlot(key)
    const kind = base.specOf(key)?.kind ?? 'single'
    if (kind === 'chain') return all.filter(entry => !hidden(entry))
    const seen = new Set<string | undefined>()
    const heads: StoredEntry[] = []
    for (const entry of all) {
      if (coreAbdicated(entry) || hidden(entry)) continue
      const cell = cellOf(kind, entry)
      if (seen.has(cell)) continue
      seen.add(cell)
      heads.push(entry)
    }
    return heads
  }

  // Methods are re-bound to the core adapter so `this` stays the adapter.
  const paneScope: SlotScopeAdapter = {
    current: binding,
    bindingSource: adapter.bindingSource.bind(adapter),
    ...(adapter.renderArea === undefined ? {} : { renderArea: adapter.renderArea.bind(adapter) }),
  }

  // Delegate everything through the prototype (the base's live `locale`
  // getter included), then override the pane decisions.
  return Object.assign(Object.create(base) as SlotRendererHost, {
    subscribe(key: string, fn: () => void): () => void {
      let set = localListeners.get(key)
      if (set === undefined) {
        set = new Set()
        localListeners.set(key, set)
      }
      set.add(fn)
      const disposeBase = base.subscribe(key, fn)
      return () => {
        set?.delete(fn)
        disposeBase()
      }
    },
    getVersion: (key: string): number => base.getVersion(key) + (localVersions.get(key) ?? 0),
    entriesOf: (key: string): readonly StoredEntry[] => {
      if (key === 'root') return [PANE_ROOT_ENTRY]
      const all = base.entriesOf(key)
      return all.some(excluded) ? all.filter(entry => !excluded(entry)) : all
    },
    entriesOfSlot: (key: string): readonly StoredEntry[] => {
      if (key === 'root') return [PANE_ROOT_ENTRY]
      return winnersOf(key)
    },
    isLive: (entry: StoredEntry): boolean => entry === PANE_ROOT_ENTRY || base.isLive(entry),
    reportEntryError(key: string, entry: StoredEntry, error: unknown, info: { abdicate: boolean }): void {
      console.error(`[dsh-split-panes] pane occupant crashed in '${key}':`, error)
      options.onCrash?.(key, entry, error)
      if (!info.abdicate) return
      abdicated.add(entry)
      bump(key)
    },
    specOf: (key: string) => (key === 'root' ? ROOT_SPEC : base.specOf(key)) as ReturnType<SlotRendererHost['specOf']>,
    scope: (scope: Parameters<SlotRendererHost['scope']>[0]) =>
      (scope === 'session' || scope === 'session-maybe' ? paneScope : base.scope(scope)),
    ...factoryOverrides(base, options.wrapFactoryInject),
  })
}

/**
 * Hand the renderer a per-pane copy of each Factory definition whose inject
 * face passes through `wrap`. The copy is a distinct object, so every member
 * that keys on definition identity (liveness, store axes, occurrence
 * retention, crash reports) is translated back to the core's original.
 * @param base - registry host face.
 * @param wrap - pane-local inject transform, or undefined for no overrides.
 * @returns host members to overlay.
 */
function factoryOverrides(
  base: SlotRendererHost,
  wrap: PaneHostOptions['wrapFactoryInject'],
): Partial<SlotRendererHost> {
  if (wrap === undefined) return {}
  const copies = new WeakMap<StoredFactory, StoredFactory>()
  const originals = new WeakMap<object, StoredFactory>()
  const original = (definition: StoredFactory): StoredFactory => originals.get(definition) ?? definition
  const copyOf = (definition: StoredFactory): StoredFactory => {
    const inject = definition.inject
    if (inject === undefined) return definition
    let copy = copies.get(definition)
    if (copy === undefined) {
      copy = {
        ...definition,
        inject: ((...args: never[]) => wrap(definition.name, inject(...args))) as StoredFactory['inject'],
      }
      copies.set(definition, copy)
      originals.set(copy, definition)
    }
    return copy
  }
  return {
    factoryOf: (name) => {
      const definition = base.factoryOf(name)
      return definition === undefined ? undefined : copyOf(definition)
    },
    isFactoryLive: definition => base.isFactoryLive(original(definition)),
    factoryStoreOf: (definition, scopeBinding, occurrence) =>
      base.factoryStoreOf(original(definition), scopeBinding, occurrence),
    retainFactoryOccurrence: (definition, occurrence) =>
      base.retainFactoryOccurrence(original(definition), occurrence),
    reportFactoryError: (name, registration, error) => {
      base.reportFactoryError(name, originals.get(registration) ?? registration, error)
    },
  }
}

/** The synthetic root entry a pane host answers for (exposed for tests). */
export const PANE_ROOT_SLOT_ENTRY = PANE_ROOT_ENTRY
