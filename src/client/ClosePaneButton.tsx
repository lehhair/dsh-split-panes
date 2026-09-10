/**
 * Header close-pane affordance (registered into the conversation header's
 * actions row): closes the FOCUSED pane — visible only while the split tree
 * actually has panes to close. Operates the SHARED pane tree through the
 * plugin's injected operations.
 *
 * The glyph is ui-primitives' IconCloseOutline16 — the core's own choice for a
 * close control inside conversation chrome (ui-conversation's QueueDock,
 * ui-goal's GoalBar both use it at 16px). The 14px IconCloseFill14 belongs to
 * compact chips/rows (attachment cards, dockkit tab chips), where the smaller
 * filled X reads better; using it here made the close sit a size below its
 * 16px neighbours, and disagreed with this plugin's own new-conversation
 * header, which renders the same action.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-conversation SlotMap merge (header actions slot).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './PaneWorkspace.module.css'
import type { PaneWorkspaceInjected } from './PaneWorkspace.tsx'

/** Full composed props: session kit + shared inject + locale. */
export type ClosePaneButtonProps =
  & PropsRuntime<'conversation.session.header.actions'>
  & InjectFace<Pick<PaneWorkspaceInjected, 'closeFocused' | 'hasSplit'>>
  & PropsLocale<'panes'>

/**
 * Render the header close-pane button (single-pane state renders nothing).
 * @param props - composed slot props (see ClosePaneButtonProps).
 * @returns the close button, or null while there is no split to close.
 */
export function ClosePaneButton({ closeFocused, hasSplit, t }: ClosePaneButtonProps) {
  if (!hasSplit()) return null
  return (
    <button
      type="button"
      className={css.closeButton}
      aria-label={t('pane.close')}
      title={t('pane.close')}
      onClick={() => { closeFocused() }}
    >
      <IconCloseOutline16 />
    </button>
  )
}