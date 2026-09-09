/**
 * PaneRoot: the synthetic 'root' slot occupant every pane renders.
 *
 * The vendored core renderer (`vendor/renderer/scoped-slots.tsx`) always
 * starts at the 'root' outlet and reads the winning root entry off the host
 * it was given. A pane is not the application shell, so the pane host hands
 * it THIS entry instead of ui-layout's AppFrame: a one-line component that
 * dispatches the 'conversation' slot through the kit-provided `renderSlot`.
 *
 * The dispatch then lands on the STOCK ConversationRoot entry — the pane
 * host's ledger view filters this plugin's own conversation shadow out — and
 * the core renderer's session-maybe branch renders it against the pane's
 * scope binding. Everything below that point (header, session body, composer
 * chain, hero) is the core's own outlet code.
 */
import type { ReactNode } from 'react'

/** Props the core renderer's standard kit supplies to a root occupant. */
export interface PaneRootProps {
  /** Child-slot dispatch bound to this synthetic root entry's children table. */
  renderSlot?: ((key: string, owner: object) => ReactNode) | undefined
}

/**
 * Render one pane's conversation column.
 * @param props - kit props (only `renderSlot` is used).
 * @returns the conversation subtree for this pane's session.
 */
export function PaneRoot(props: PaneRootProps): ReactNode {
  return props.renderSlot?.('conversation', {}) ?? null
}
