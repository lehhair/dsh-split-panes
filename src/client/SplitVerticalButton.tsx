/**
 * Header split-stacked affordance (registered into the conversation header's
 * actions row): splits the focused pane stacked top/bottom and seeds the new
 * pane as a fresh conversation — the vertical twin of the horizontal split
 * button. Operates the SHARED pane tree through the plugin's injected
 * operations.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-conversation SlotMap merge (header actions slot).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { IconSplitVertical16 } from './icons.tsx'
import css from './PaneWorkspace.module.css'
import type { PaneWorkspaceInjected } from './PaneWorkspace.tsx'

/** Full composed props: session kit + shared inject + locale. */
export type SplitVerticalButtonProps =
  & PropsRuntime<'conversation.session.header.actions'>
  & InjectFace<PaneWorkspaceInjected>
  & PropsLocale<'panes'>

/**
 * Render the header split-stacked button.
 * @param props - composed slot props (see SplitVerticalButtonProps).
 * @returns the split button element.
 */
export function SplitVerticalButton({ splitFocused, t }: SplitVerticalButtonProps) {
  return (
    <button
      type="button"
      className={css.splitButton}
      aria-label={t('pane.split.vertical')}
      title={t('pane.split.vertical')}
      onClick={() => { splitFocused('vertical') }}
    >
      <IconSplitVertical16 />
    </button>
  )
}