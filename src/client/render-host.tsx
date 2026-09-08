/**
 * Pane render host: re-hosts the NATIVE slot occupants inside one pane.
 *
 * A session-scoped slot (e.g. `conversation.composer.bar`, `conversation.
 * session.header`) is declared by ui-conversation and normally rendered with
 * the CURRENT selection's binding. The panes plugin renders the same
 * registered COMPONENTS under an EXPLICIT pane session by assembling each
 * occupant's declared shares itself:
 *   1. standard kit — buildPaneKit over the pane session's materialized
 *      binding (see kit.ts). The binding carries the session's provide
 *      bundle exactly as the renderer sees it (useSession, useSessions,
 *      useProjection, inputActions, …).
 *   2. entry inject — the occupant's own `inject(sessionId, actions)`
 *      factory, the same call the production renderer's runInject makes.
 *      Its `hooks`/`keyedHooks` compartments bind to `use<Name>` props,
 *      mirroring the renderer's bindInjectSources.
 *   3. entry store — `handle.create(sessionId)` yielding the per-session
 *      instance (actions + snapshot), exactly like the renderer host's
 *      storeOf — including the engine's per-session persist suffix.
 *   4. child rendering — the occupant's declared children dispatch through
 *      this package's own renderSlot, so nested slots (chat node renderers,
 *      model/plan seats, header actions, …) resolve through the same pane
 *      ledger.
 *
 * This is the by-id rendering twin the framework withholds from slot
 * components — built entirely from public slot-registry and ui-session
 * surfaces, no core changes.
 */
import { Component, createElement, type ReactNode } from 'react'
import type { StoredEntry } from '@deepseek-ai/dsh-client-ui-slots'
import { standardHookPropName } from '@deepseek-ai/dsh-client-ui-slots'
import { bindSelector, type PaneKit, type KeyedSelectorHook } from './kit.ts'

/** The priority at which this plugin shadows ui-conversation's root (0). */
const TAKEOVER_PRIORITY = -1

/** The store-instance shape this package resolves (type-erased view of the engine instance). */
export interface PaneStoreInstance {
  readonly actions: Readonly<Record<string, (...args: unknown[]) => void>>
  getSnapshot(): unknown
  subscribe(fn: () => void): () => void
}

/** Store handle shape (type-erased view of EngineStoreHandle). */
export interface PaneStoreHandle {
  create(scopeKey?: string): PaneStoreInstance
}

/** The type-erased record view this package reads (authority: SlotCore.register). */
interface EntryRecord {
  readonly component?: unknown
  readonly options?: { key?: string; id?: string; order?: number; label?: string | number | (() => string); priority?: number }
  readonly select?: ((owner: object) => unknown) | undefined
  readonly inject?: ((...args: unknown[]) => Record<string, unknown>) | undefined
  readonly children?: Readonly<Record<string, { kind: string; scope: string }>> | undefined
  readonly store?: PaneStoreHandle | undefined
  readonly locale?: string | undefined
}

/** One resolved occupant renderer: the component plus a per-pane props assembler. */
export interface PaneOccupant {
  readonly key?: string | undefined
  readonly id?: string | undefined
  readonly order?: number | undefined
  readonly priority?: number | undefined
  readonly select?: ((owner: object) => unknown) | undefined
  readonly locale?: string | undefined
  /**
   * Assemble this occupant's full props for one pane (kit + inject + store +
   * slot-level inject + owner), then render it. `renderChild` is the pane's
   * own dispatch for the occupant's declared children. `owner`/`slotInject`/
   * `hookContext` are the dispatch-occurrence inputs (the caller's renderSlot
   * arguments), merged exactly like the production outlet: owner wins.
   */
  readonly render: (ctx: PaneMount, renderChild: PaneRenderHost, owner: object, slotInject: BoundSlotInject, hookContext: unknown) => ReactNode
}

/** Reparse the record into the shape this package consumes. */
function viewOf(raw: StoredEntry): EntryRecord {
  return raw as unknown as EntryRecord
}

/** Bind one entry inject face: hooks/keyedHooks compartments become use<Name> hooks. */
function bindInjectSources(face: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const sources = face['hooks']
  const keyed = face['keyedHooks']
  for (const [name, value] of Object.entries(face)) {
    if (name === 'hooks' || name === 'keyedHooks') continue
    out[name] = value
  }
  if (sources !== null && typeof sources === 'object') {
    for (const [name, source] of Object.entries(sources as Record<string, { getSnapshot(): unknown; subscribe(fn: () => void): () => void } | undefined>)) {
      if (source !== undefined) out[standardHookPropName(name)] = bindSelector(source)
    }
  }
  if (keyed !== null && typeof keyed === 'object') {
    for (const [name, source] of Object.entries(keyed as Record<string, (key: string) => { getSnapshot(): unknown; subscribe(fn: () => void): () => void } | undefined>)) {
      if (source === undefined) continue
      // The selector is optional (the core's keyed-hook contract: no selector
      // reads the whole snapshot).
      const hook: KeyedSelectorHook<unknown> = (<S,>(
        key: string,
        selector?: (snapshot: unknown) => S,
        equal?: (left: S, right: S) => boolean,
      ): S => {
        const useValue = bindSelector(source(key) ?? { getSnapshot: () => undefined, subscribe: () => () => {} })
        return useValue(((value) => (selector ?? identityOf)(value)) as (snapshot: unknown) => S, equal)
      })
      out[standardHookPropName(name)] = hook
    }
  }
  return out
}

/** The identity selector (the keyed hook's no-selector default). */
const identityOf = (value: unknown): unknown => value

/** Error boundary so one pane's native occupant cannot take down the workspace. */
class PaneBoundary extends Component<{ fallback?: ReactNode; children?: ReactNode }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError(_error: unknown): { failed: boolean } {
    return { failed: true }
  }
  override componentDidCatch(error: unknown): void {
    console.error('[dsh-split-panes] pane occupant failed, using fallback:', error)
  }
  override render(): ReactNode {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

/** The pane mount context passed to every occupant render. */
export interface PaneMount {
  readonly kit: PaneKit
  readonly slots: {
    entries(key: string): readonly StoredEntry[]
    /** Slot spec lookup (slot-level inject + scope + kind). */
    specOf?(key: string): { kind: string; scope: string; inject?: unknown } | undefined
  }
  /** The locale face (bind(ns) → translate); entries declaring a namespace read their `t` here. */
  readonly locale?: { bind(ns: string): (key: string, params?: Record<string, unknown>) => string } | undefined
  /** Child dispatch (assembled after the host closure completes). */
  renderChild: PaneRenderHost
}

/** Child-slot dispatch exposed to occupants (composed props renderSlot/renderSlotChain). */
export interface PaneRenderHost {
  renderSlot: (key: string, owner: object, opts?: { entryKey?: string; only?: string; fallback?: ReactNode; hookContext?: unknown }) => ReactNode
  renderSlotChain: (key: string, owner: object, opts?: { fallback?: ReactNode; overlay?: boolean; fallbackOnly?: boolean }) => ReactNode
}

/** One entry's slot-level inject face: fixed props + per-dispatch hook factories. */
interface BoundSlotInject {
  readonly props: Record<string, unknown>
  readonly factories: Readonly<Record<string, (standard: Record<string, unknown>, hookContext: unknown) => unknown>> | undefined
}

const EMPTY_SLOT_INJECT: BoundSlotInject = { props: {}, factories: undefined }

const slotInjectCache = new WeakMap<object, BoundSlotInject>()

/**
 * Normalize one slot-level inject face (the declaring slot's `inject` member,
 * carried on the slot SPEC — not the entry): `hooks` members that are
 * functions are factories bound per dispatch occurrence with the occurrence's
 * hookContext; every other member passes through as a fixed prop.
 */
function cachedSlotInject(face: object | undefined): BoundSlotInject {
  if (face === undefined) return EMPTY_SLOT_INJECT
  let bound = slotInjectCache.get(face)
  if (bound !== undefined) return bound
  const definitions = (face as Record<string, unknown>)['hooks']
  if (definitions === undefined || typeof definitions !== 'object') {
    bound = { props: face as Record<string, unknown>, factories: undefined }
    slotInjectCache.set(face, bound)
    return bound
  }
  const { hooks: _hooks, ...rest } = face as Record<string, unknown>
  const props: Record<string, unknown> = rest
  let factories: Record<string, (standard: Record<string, unknown>, hookContext: unknown) => unknown> | undefined
  for (const [name, definition] of Object.entries(definitions as Record<string, unknown>)) {
    const hookName = standardHookPropName(name)
    if (typeof definition === 'function') {
      factories ??= {}
      factories[name] = definition as (standard: Record<string, unknown>, hookContext: unknown) => unknown
    } else {
      props[hookName] = definition
    }
  }
  bound = { props, factories }
  slotInjectCache.set(face, bound)
  return bound
}

const NO_RECORDS: readonly StoredEntry[] = Object.freeze([])

/**
 * Resolve one registered entry into a pane occupant (undefined when the
 * record has no component). React components come in several runtime shapes:
 * plain functions, class components, and the memo()/forwardRef() OBJECT
 * wrappers (typeof 'object') — the production renderer accepts all of them
 * (createElement), so this package must too.
 */
export function resolveOccupant(raw: StoredEntry): PaneOccupant | undefined {
  const record = viewOf(raw)
  const component = record.component
  if (component === null || component === undefined) return undefined
  if (typeof component !== 'function' && typeof component !== 'object') return undefined
  const store = record.store
  const render: PaneOccupant['render'] = (ctx, renderChild, owner, slotInject, hookContext) => {
    const sessionId = ctx.kit.sessionId as string | undefined
    // 1. standard kit props (plain props first; synthesized hooks override).
    const props: Record<string, unknown> = { ...ctx.kit.props }
    // 2. store instance (cached per handle x session — the production
    // renderer's storeOf, so the occupant's view state/draft survives across
    // renders instead of being re-minted every render).
    let instance: PaneStoreInstance | undefined
    if (store !== undefined) {
      instance = storeOf(store, sessionId)
      props['useStore'] = bindSelector({
        getSnapshot: () => instance!.getSnapshot(),
        subscribe: fn => instance!.subscribe(fn),
      })
      props['actions'] = instance.actions
    }
    // 3. entry inject face (cached per entry x session: the same face the
    // production renderer memoizes, so the occupant's injected callbacks stay
    // identity-stable and keyed hook families don't churn subscriptions).
    let face: Record<string, unknown> = {}
    if (record.inject !== undefined) {
      face = cachedInject(
        record as EntryRecord & { inject: NonNullable<EntryRecord['inject']> },
        sessionId,
        instance?.actions,
      )
    }
    Object.assign(props, face)
    // 4. global standard seats + child dispatch. Absent binding hooks
    // (explicit undefined) are skipped — a session-maybe occupant renders
    // its absent branch on the missing seat instead of crashing on an
    // undefined function.
    props['sessionId'] = sessionId
    props['useSession'] = ctx.kit.useSession
    props['useSessions'] = ctx.kit.useSessions
    props['useProjection'] = ctx.kit.useProjection
    for (const [name, hook] of Object.entries(ctx.kit.hooks)) {
      if (hook === undefined) continue
      props[name.startsWith('use') ? name : standardHookPropName(name)] = hook
    }
    // 5. the locale `t` seat for entries that declare a namespace (the
    // renderer synthesizes it from the installed locale face; the bind is
    // identity-stable per namespace).
    if (record.locale !== undefined && ctx.locale !== undefined) {
      props['t'] = ctx.locale.bind(record.locale)
    }
    // 6. slot-level inject: fixed props, then the hook factories bound to
    // THIS dispatch occurrence's hookContext (the chat node's useTurnData
    // rides here).
    Object.assign(props, slotInject.props)
    if (slotInject.factories !== undefined) {
      for (const [name, factory] of Object.entries(slotInject.factories)) {
        const hook = factory(props as Record<string, unknown>, hookContext)
        props[standardHookPropName(name)] = hook
      }
    }
    // 7. owner props LAST — they win (the production outlet's merge order:
    // kit, inject, slot inject, contextual hooks, owner).
    Object.assign(props, owner)
    props['renderSlot'] = renderChild.renderSlot
    props['renderSlotChain'] = renderChild.renderSlotChain
    return (
      <PaneBoundary fallback={null}>
        {createElement(component as never, props)}
      </PaneBoundary>
    )
  }
  const options = record.options ?? {}
  return {
    ...(options.key !== undefined ? { key: options.key } : {}),
    ...(options.id !== undefined ? { id: options.id } : {}),
    ...(options.order !== undefined ? { order: options.order } : {}),
    ...(options.priority !== undefined ? { priority: options.priority } : {}),
    ...(record.select !== undefined ? { select: record.select } : {}),
    ...(record.locale !== undefined ? { locale: record.locale } : {}),
    render,
  }
}

/** store instance cache: handle x session identity. */
const storeCache = new WeakMap<PaneStoreHandle, Map<string, PaneStoreInstance>>()

/** Resolve (and lazily cache) the engine store instance for one handle x session. */
function storeOf(handle: PaneStoreHandle, sessionId: string | undefined): PaneStoreInstance {
  let perSession = storeCache.get(handle)
  if (perSession === undefined) {
    perSession = new Map()
    storeCache.set(handle, perSession)
  }
  const key = sessionId ?? ''
  let instance = perSession.get(key)
  if (instance === undefined) {
    instance = handle.create(sessionId)
    perSession.set(key, instance)
  }
  return instance
}

/** entry inject face cache: entry record x session identity. */
const injectCache = new WeakMap<EntryRecord, Map<string, Record<string, unknown>>>()

/** Resolve (and lazily cache) the entry's injected face for one pane session. */
function cachedInject(
  record: EntryRecord & { inject: NonNullable<EntryRecord['inject']> },
  sessionId: string | undefined,
  actions: Readonly<Record<string, (...args: unknown[]) => void>> | undefined,
): Record<string, unknown> {
  let perSession = injectCache.get(record)
  if (perSession === undefined) {
    perSession = new Map()
    injectCache.set(record, perSession)
  }
  const key = sessionId ?? ''
  let face = perSession.get(key)
  if (face === undefined) {
    face = bindInjectSources(record.inject(
      ...(actions !== undefined ? [sessionId, actions] : [sessionId]),
    ) as Record<string, unknown>)
    perSession.set(key, face)
  }
  return face
}

/**
 * Create a pane render host over one pane's kit. `entries(key)` reads the
 * LIVE slot ledger so registrations (view tabs, node renderers, dock strips)
 * appear as they land.
 */
export function createPaneRenderHost(
  slots: PaneMount['slots'],
  kit: PaneKit,
  locale?: { bind(ns: string): (key: string, params?: Record<string, unknown>) => string },
): PaneRenderHost & { occupants(key: string): readonly PaneOccupant[] } & { renderConversationRoot(): ReactNode } {
  const cache = new Map<string, readonly PaneOccupant[]>()

  const occupants = (key: string): readonly PaneOccupant[] => {
    const cached = cache.get(key)
    if (cached !== undefined) return cached
    let resolved: PaneOccupant[] | undefined
    const records = slots.entries(key)
    if (records.length === 0) resolved = NO_RECORDS as unknown as PaneOccupant[]
    else resolved = records.map(resolveOccupant).filter(occupant => occupant !== undefined)
    cache.set(key, resolved)
    return resolved
  }

  const mount: PaneMount = {
    kit,
    slots,
    ...(locale !== undefined ? { locale } : {}),
    renderChild: undefined as unknown as PaneRenderHost,
  }

  let renderChild: PaneRenderHost
  const dispatch = (key: string, occupant: PaneOccupant, owner: object, opts?: { hookContext?: unknown; fallback?: ReactNode }): ReactNode => {
    // The slot-level inject face rides the slot SPEC (declared by the
    // entry that owns the children table). SlotRegistry exposes `spec()`;
    // the record view exposes the spec through whatever face the caller
    // supplied (specOf on the mount, or a registry's spec method).
    const spec = slots.specOf?.(key) ?? (slots as { spec?(key: string): { kind: string; scope: string; inject?: unknown } | undefined }).spec?.(key)
    const slotInject = cachedSlotInject(spec?.inject as object | undefined)
    return (
      <PaneBoundary fallback={opts?.fallback}>
        {occupant.render(mount, renderChild, owner, slotInject, opts?.hookContext)}
      </PaneBoundary>
    )
  }
  renderChild = {
    renderSlot: (key, owner, opts) => {
      const list = occupants(key)
      if (opts?.entryKey !== undefined) {
        const found = list.find(o => o.key === opts.entryKey)
        return found === undefined
          ? (opts.fallback ?? null)
          : dispatch(key, found, owner, opts)
      }
      if (opts?.only !== undefined) {
        const found = list.find(o => o.id === opts.only)
        return found === undefined
          ? (opts.fallback ?? null)
          : dispatch(key, found, owner, opts)
      }
      const first = list[0]
      return first === undefined ? (opts?.fallback ?? null) : dispatch(key, first, owner, opts)
    },
    renderSlotChain: (key, owner, opts) => {
      if (opts?.fallbackOnly === true) return opts.fallback ?? null
      for (const occupant of occupants(key)) {
        const select = occupant.select
        if (select === undefined) continue
        let matched: unknown
        try {
          matched = select(owner)
        } catch {
          continue
        }
        if (matched === null || matched === undefined) continue
        // The chain entry renders with `matched` merged into the owner (the
        // component reads it as the `matched` prop) — owner wins on conflicts
        // except matched itself.
        return dispatch(key, occupant, { ...owner, matched }, opts)
      }
      return opts?.fallback ?? null
    },
  }
  mount.renderChild = renderChild
  /**
   * Render the ConversationRoot ENTRY itself (the native conversation UI) for
   * THIS pane session — the pure-extension path: instead of re-implementing
   * ConversationRoot's layout (hero, workspace picker, composer variants,
   * measurements, width handles), the plugin captures the stock component and
   * feeds it THIS pane's binding kit + the pane's own child dispatch, so the
   * stock layout renders verbatim under the pane session. The stock entry is
   * selected by priority: it is the NON-takeover occupant of 'conversation'
   * (this plugin's own takeover registers at a lower priority, so the
   * conversation slot renders the pane workspace, while every pane re-hosts
   * the stock ConversationRoot below it).
   */
  const renderConversationRoot = (): ReactNode => {
    // The stock ConversationRoot entry: every 'conversation' occupant except
    // this plugin's takeover (which registers at priority -1 / lower).
    const rootEntry = slots.entries('conversation')
      .find(raw => ((viewOf(raw).options?.priority ?? 0) > TAKEOVER_PRIORITY))
    if (rootEntry === undefined) return null
    const occupant = resolveOccupant(rootEntry)
    if (occupant === undefined) return null
    return (
      <PaneBoundary fallback={null}>
        {occupant.render(mount, renderChild, {}, EMPTY_SLOT_INJECT, undefined)}
      </PaneBoundary>
    )
  }
  return {
    renderSlot: renderChild.renderSlot,
    renderSlotChain: renderChild.renderSlotChain,
    occupants,
    renderConversationRoot,
  }
}

/** The pane render host + kit bundle handed to PaneFrame. */
export interface PaneRenderBundle {
  readonly kit: PaneKit
  readonly host: PaneRenderHost & { occupants(key: string): readonly PaneOccupant[] }
}