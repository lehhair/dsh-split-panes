/**
 * Pane-scope global seats, typed at the consumer: the renderer injects the
 * by-id session binding seats (`useSessionById` / `useProjectionById`) and
 * the `SessionScope` per-session render scope into EVERY entry's standard
 * kit unconditionally, but the official `GlobalStandardProps` keeps them out
 * of the base seat (optional capabilities — see the runtime's declaration),
 * so this package merges its own typed members. The merge rides this
 * module's type-only import edge; the seats are framework-supplied, never
 * imported as values.
 */
import type {
  SessionScopeComponent, UseProjectionById, UseSessionById,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { ConversationSnapshot } from '@deepseek-ai/dsh-client-runtime/client'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface GlobalStandardProps {
    /** By-id twin of useSession: subscribe to any listed session's conversation snapshot. */
    useSessionById: UseSessionById<ConversationSnapshot>
    /** By-id twin of useProjection: key-addressed values off an arbitrary session's projection store. */
    useProjectionById: UseProjectionById
    /** Per-session render scope seat: bind a subtree to an explicit session (pane roots). */
    SessionScope: SessionScopeComponent
  }
}

export {}
