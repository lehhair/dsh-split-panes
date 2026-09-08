/**
 * Header split affordance (registered into the conversation header's actions
 * row): splits the FOCUSED pane side-by-side and seeds the new pane as a
 * fresh conversation — the entry point into split mode. Operates the SHARED
 * pane tree through the plugin's injected operations (the apply closure owns
 * the store instance; this button carries no store seat).
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-conversation SlotMap merge (header actions slot).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { IconSplitHorizontal16 } from './icons.tsx'
import css from './PaneWorkspace.module.css'
import type { PaneWorkspaceInjected } from './PaneWorkspace.tsx'

/** Full composed props: session kit + shared inject + locale. */
export type SplitPaneButtonProps =
  & PropsRuntime<'conversation.session.header.actions'>
  & InjectFace<PaneWorkspaceInjected>
  & PropsLocale<'panes'>

/**
 * Render the header split button.
 * @param props - composed slot props (see SplitPaneButtonProps).
 * @returns the split button element.
 */
export function SplitPaneButton({ splitFocused, t }: SplitPaneButtonProps) {
  return (
    <button
      type="button"
      className={css.splitButton}
      aria-label={t('pane.split')}
      title={t('pane.split')}
      onClick={() => { splitFocused('horizontal') }}
    >
      <IconSplitHorizontal16 />
    </button>
  )
}