/**
 * Session-window helpers a pane needs beyond the renderer's own bindings.
 *
 * A pane may show a session that is NOT the global current one. The core
 * stages exactly one session — `followCurrent()` opens the window of the
 * current selection only ("the window opens ⟺ the session is on stage") — so
 * a pinned pane must open its own window. `Session.open()` is idempotent and
 * independent of the stage: it pulls the tail window and the live event
 * stream without touching the selection.
 */
import type { Context } from '@deepseek-ai/cordis'

/** Concrete session face with the staging bridge the public face withholds. */
interface OpenableSession {
  open?: (() => Promise<void>) | undefined
}

/**
 * Ensure one session's history window is open, without selecting it.
 * @param ctx - client context carrying `sessions`.
 * @param sessionId - pane session id (undefined = new-conversation pane).
 */
export function ensureSessionOpen(ctx: Context, sessionId: string | undefined): void {
  if (sessionId === undefined) return
  const sessions = ctx.get('sessions') as
    | { binding?: (id: string) => { session?: unknown } | undefined }
    | undefined
  // `binding()` is the 0.1.5 accessor; an older core simply keeps the pane on
  // its summary data instead of crashing here.
  if (typeof sessions?.binding !== 'function') return
  try {
    const face = sessions.binding(sessionId)?.session as OpenableSession | undefined
    if (typeof face?.open === 'function') void face.open()
  } catch (error) {
    console.error('[dsh-split-panes] could not open pane session window:', error)
  }
}
