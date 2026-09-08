/**
 * Pane standard kit: the per-session render props a re-hosted native slot
 * occupant receives inside one pane.
 *
 * The framework renders session-scoped slots by resolving the CURRENT
 * selection's standard-source binding (ui-session's scope adapter) and
 * synthesizing `use<Name>` selector hooks over its bare observables. The
 * panes plugin needs the SAME kit for an EXPLICIT pane session — a by-id
 * twin the framework does not hand out to slot components. The core DOES
 * expose the resolution machinery, though: `ctx.uiSession.adapter.resolve(
 * sessionId)` materializes the exact `ScopedStandardSourceBinding` the
 * renderer consumes (hooks / keyedHooks / props / ctx — see ui-session's
 * UiSession.materialize). This package binds its own selector hooks over
 * that binding's bare observables (the same uSES contract the renderer's
 * bind.ts implements — one tiny local bridge, no core internals imported),
 * so every re-hosted native component gets identity-stable hooks that
 * follow its pane session — no core changes.
 */
import { useSyncExternalStore } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { HostObservable, ScopedStandardSourceBinding } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Selector hook over one snapshot source (the uSES shape components consume). */
export type SelectorHook<Snapshot> = <S>(
  selector: (snapshot: Snapshot) => S,
  equal?: (left: S, right: S) => boolean,
) => S

/**
 * Keyed selector hook: one stable source resolver per key, selector over its
 * value. The selector is OPTIONAL (the core's KeyedSnapshotSelectorHook
 * contract — `useProjection('key')` without a selector reads the whole
 * snapshot, exactly as `TodoDock` consumes it).
 */
export type KeyedSelectorHook<Snapshot> = <S>(
  key: string,
  selector?: (snapshot: Snapshot | undefined) => S,
  equal?: (left: S, right: S) => boolean,
) => S

/**
 * Bind one bare observable source to a typed uSES selector hook.
 *
 * The production renderer uses the selector form of
 * use-sync-external-store (its bind.ts — `useSyncExternalStoreWithSelector`).
 * This package implements the same contract self-contained: the hook reads
 * the live snapshot through uSES (subscription identity stable per source,
 * so components never resubscribe across renders) and applies the selector
 * in the render body. The returned value therefore re-renders on every
 * source bump — a guard `equal` lets the caller skip value-identity churn,
 * and the shallow overall is what the engine stores already coalesce. This
 * is the same observable-side contract the renderer's own hooks honor for
 * selector families without the selector form.
 * @param source - bare observable source (engine store, session object, …).
 * @returns the selector hook.
 */
export function bindSelector<Snapshot>(source: HostObservable<Snapshot>): SelectorHook<Snapshot> {
  const subscribe = (fn: () => void) => source.subscribe(fn)
  const getSnapshot = () => source.getSnapshot()
  return function useSelect<S>(selector: (snapshot: Snapshot) => S, equal?: (a: S, b: S) => boolean): S {
    return selector(useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as Snapshot)
  }
}

/** The identity selector (the keyed hook's no-selector default). */
const identity = (value: unknown): unknown => value

/** Identity-stable hook over an ABSENT source: selector never runs, returns undefined. */
const ABSENT_SOURCE: HostObservable<undefined> = {
  getSnapshot: () => undefined,
  subscribe: () => () => {},
}

/**
 * The per-pane standard kit: exactly the props the renderer's kit synthesis
 * would hand a session-scoped slot component, assembled from ONE pane
 * session's materialized binding. Components re-hosted inside the pane — the
 * stock ChatView, InputBar, session header — consume these the same way they
 * consume the framework's own kit.
 */
export interface PaneKit {
  /** The pane session identity. */
  readonly sessionId: SessionId | undefined
  /** useSession — lifecycle snapshot selector over the pane session. */
  readonly useSession: SelectorHook<unknown>
  /** useSessions — the global list/current feed. */
  readonly useSessions: SelectorHook<unknown>
  /** useProjection — key-addressed projection values for the pane session. */
  readonly useProjection: KeyedSelectorHook<unknown>
  /** Every other bound standard hook by source name (conversation, input, notices, …). */
  readonly hooks: Readonly<Record<string, SelectorHook<unknown> | undefined>>
  /** Every keyed hook family (chatNode, chatNodeProcess, …). */
  readonly keyedHooks: Readonly<Record<string, KeyedSelectorHook<unknown> | undefined>>
  /** Plain standard props (inputActions, …). */
  readonly props: Readonly<Record<string, unknown>>
}

/** The ui-session service face this package composes against (type-only; merged via import). */
export interface PaneUiSession {
  readonly adapter: {
    readonly current: HostObservable<{ key: string | undefined }>
    resolve(key: string): ScopedStandardSourceBinding | undefined
  }
  /** Root source of pending UI interactions (the useSessionPendingInteraction feed). */
  readonly pendingInteractions: HostObservable<unknown>
}

/** Type of ctx.uiSession as merged by @deepseek-ai/dsh-client-ui-session/client. */
export type PaneContext = Context & {
  readonly uiSession: PaneUiSession
  /** The locale face as merged by @deepseek-ai/dsh-client-locale/client. */
  readonly locale?: { bind(ns: string): (key: string, params?: Record<string, unknown>) => string } | undefined
}

/**
 * The maybe-hook for an ABSENT source (the renderer's maybeObservableHook /
 * useAbsentSnapshot semantics): subscribes the absent source so the hook
 * call order stays stable across the present/absent transition, but the
 * component's selector is NEVER called — the value is always `undefined`.
 * This is what a session-maybe occupant (ConversationRoot, InputBar) reads
 * when no session is bound: `useSession(s => s.promptError)` must yield
 * `undefined`, never `undefined.promptError`.
 */
function absentHook<Snapshot>(): SelectorHook<Snapshot> {
  const useAbsent = bindSelector(ABSENT_SOURCE)
  return ((_selector: (snapshot: Snapshot) => unknown) =>
    useAbsent(() => undefined as never)) as SelectorHook<Snapshot>
}

/**
 * Ensure a pane session's history window is open. Non-current sessions are
 * NOT staged by the framework (staging follows `list.current` — see the
 * session-controller's followCurrent), so a pane rendering an explicit
 * session must open it itself. `Session.open()` is idempotent and
 * independent of the stage, so calling it on a never-opened session pulls
 * the tail window and live event stream without touching the current
 * selection; already-open sessions no-op.
 *
 * The session face is resolved through the binding's scoped context via the
 * sessions service (`sessionOf(ctx)`) — the same scope-addressed resolution
 * the framework's own apply paths use — and its concrete open() reached
 * through a narrow cast (the public SessionFace deliberately withholds the
 * staging bridge).
 *
 * @param sessions - the sessions service face (ctx.sessions).
 * @param binding - the pane session's resolved scope binding.
 */
export function ensurePaneSessionOpen(
  sessions: { sessionOf(ctx: ScopedStandardSourceBinding['ctx']): unknown } | undefined,
  binding: ScopedStandardSourceBinding | undefined,
): void {
  if (sessions === undefined || binding === undefined) return
  const session = sessions.sessionOf(binding.ctx) as
    | { open?: (() => Promise<void>) | undefined }
    | undefined
  if (session?.open !== undefined) void session.open()
}

/**
 * Resolve (and lazily cache) one session's materialized standard-source
 * binding, then materialize the pane kit. Bindings are identity-stable for
 * the session's lifetime (ui-session caches materialized bindings), so the
 * generated hooks are stable too — re-hosted components never resubscribe on
 * unrelated re-renders.
 *
 * @param ctx - client root context carrying ctx.uiSession.
 * @param sessionId - pane session id; undefined renders the absent kit
 *   (new-conversation hero: no session hooks, only the global feeds).
 * @returns the pane kit.
 */
export function buildPaneKit(
  ctx: PaneContext & {
    readonly sessions: { sessionOf(scope: ScopedStandardSourceBinding['ctx']): unknown; readonly list: HostObservable<unknown> }
    readonly workspaces?: { readonly list: HostObservable<unknown> } | undefined
  },
  sessionId: SessionId | undefined,
): PaneKit {
  const binding = sessionId === undefined ? undefined : ctx.uiSession.adapter.resolve(sessionId as string)
  ensurePaneSessionOpen(ctx.sessions, binding)
  const hooks: Record<string, SelectorHook<unknown> | undefined> = {}
  const keyedHooks: Record<string, KeyedSelectorHook<unknown> | undefined> = {}
  const props: Record<string, unknown> = {}

  // ROOT standard sources first (the renderer's standardProps synthesis:
  // `{...root, ...session}` — the session binding's hooks overwrite). The
  // root binding lives inside the renderer host, but its contributions are
  // the services themselves: useSessions reads the sessions list feed and
  // useWorkspaces the workspaces list (both bare observables), exactly what
  // ui-session / the workspace owner install through slots.provideRoot.
  hooks['sessions'] = bindSelector(ctx.sessions.list)
  hooks['sessionPendingInteraction'] = bindSelector(ctx.uiSession.pendingInteractions)
  // cordis getters throw on un-injected services (even through optional
  // chaining), so the optional workspaces feed is read through a guard.
  let workspaces: { readonly list?: HostObservable<unknown> } | undefined
  try {
    workspaces = ctx.workspaces as { readonly list?: HostObservable<unknown> } | undefined
  } catch {
    workspaces = undefined
  }
  if (workspaces?.list !== undefined) hooks['workspaces'] = bindSelector(workspaces.list)

  if (binding !== undefined) {
    // Same precedence the renderer uses: plain props spread first, then the
    // synthesized hook props overwrite.
    for (const [name, value] of Object.entries(binding.props)) props[name] = value
    for (const [name, source] of Object.entries(binding.hooks)) {
      // Absent sources bind to the absent hook (a FUNCTION that returns
      // undefined) — the renderer's maybeObservableHook semantics. A
      // session-maybe occupant (ConversationRoot) reads these seats
      // unconditionally, so they must always be functions, never undefined.
      hooks[name] = source === undefined ? absentHook() : bindSelector(source)
    }
    for (const [name, source] of Object.entries(binding.keyedHooks)) {
      keyedHooks[name] = source === undefined
        ? undefined
        : (<S>(key: string, selector?: (snapshot: unknown) => S, equal?: (left: S, right: S) => boolean): S => {
          const useValue = bindSelector(source(key) ?? ABSENT_SOURCE)
          return useValue(((value) => (selector ?? identity)(value)) as (snapshot: unknown) => S, equal)
        })
    }
  }

  // The session-maybe seats (conversation/input) must ALWAYS be functions,
  // even without a binding (the hero/new-conversation pane): ConversationRoot
  // destructures and calls them unconditionally, and the stock renderer hands
  // it the maybe-hook (absent → undefined value) in that state, not a missing
  // function. Bind the absent hook for every standard seat the kit did not
  // resolve, so a missing binding never leaves an undefined function behind.
  for (const name of ['conversation', 'input']) {
    if (hooks[name] === undefined) hooks[name] = absentHook()
  }

  return {
    sessionId,
    useSession: hooks['session'] ?? absentHook(),
    useSessions: hooks['sessions'] ?? absentHook(),
    useProjection: (keyedHooks['projection']
      ?? (<S,>(key: string, selector?: (snapshot: unknown) => S): S => (selector ?? (identity as (value: unknown) => S))(undefined))) as KeyedSelectorHook<unknown>,
    hooks,
    keyedHooks,
    props,
  }
}