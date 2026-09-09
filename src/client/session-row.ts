/**
 * Side-bar session rows: the DOM channel this plugin uses to learn which
 * session a drag or click addresses.
 *
 * The side-bar's rows are draggable (their own in-group reorder) but carry no
 * session id on the HTML5 `dataTransfer`, and they have no click callback the
 * plugin can wrap — the row component belongs to ui-sidebar. Both channels are
 * therefore derived from the row element itself, resolved against the live
 * session roster by the row's rendered title cell. That keeps the whole
 * interaction inside the plugin (no core or side-bar changes), at the cost of
 * depending on the row's DOM shape; a side-bar redesign must revisit
 * {@link resolveSessionIdFromRow}.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** HTML5 data-transfer type carrying a dragged session id. */
export const SESSION_DRAG_TYPE = 'application/x-dsh-session'

/** One side-bar session row: draggable, tree-item, holding the session title. */
const SESSION_ROW_SELECTOR = '[role="treeitem"][draggable="true"]'

/**
 * Resolve the side-bar session row behind a DOM event target.
 * @param target - event target.
 * @returns the row element, or null.
 */
export function sessionRowOf(target: EventTarget | null): HTMLElement | null {
  const element = target as HTMLElement | null
  return element?.closest(SESSION_ROW_SELECTOR) as HTMLElement | null
}

/**
 * Resolve the session id a row stands for, against the live roster.
 *
 * The row's title cell renders the session's displayTitle verbatim, so an
 * exact cell match is the reliable probe; a longest-substring fallback covers
 * rows whose title cell is not a direct child. A blank "New Session" row
 * renders the localized label instead and resolves to nothing.
 * @param ctx - client context carrying the session roster.
 * @param row - the draggable session row.
 * @returns the session id, or null when no roster session matches the row.
 */
export function resolveSessionIdFromRow(ctx: Context, row: HTMLElement): SessionId | null {
  const sessions = ctx.get('sessions') as
    | { list: { getSnapshot(): { byId: Record<string, { id: string; displayTitle: string }> } } }
    | undefined
  const byId = sessions?.list.getSnapshot().byId
  if (byId === undefined) return null
  const cells = [...row.querySelectorAll(':scope > span')]
    .map(cell => cell.textContent?.trim() ?? '')
    .filter(text => text.length > 0)
  for (const summary of Object.values(byId)) {
    if (cells.includes(summary.displayTitle)) return summary.id as SessionId
  }
  const text = row.textContent?.trim() ?? ''
  let best: string | null = null
  let bestLength = 0
  for (const summary of Object.values(byId)) {
    if (summary.displayTitle.length > bestLength && text.includes(summary.displayTitle)) {
      best = summary.id
      bestLength = summary.displayTitle.length
    }
  }
  return best === null ? null : (best as SessionId)
}
