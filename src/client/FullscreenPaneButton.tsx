/**
 * Header fullscreen affordance (registered into the conversation header's
 * actions row): shows the FOCUSED pane alone while the split tree stays
 * intact, and toggles back. Operates the SHARED pane tree through the
 * plugin's injected operations.
 *
 * A single-pane workspace is already full-bleed, so the button renders
 * nothing there — there is nothing to expand.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-conversation SlotMap merge (header actions slot).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { IconFullscreen16, IconFullscreenExit16 } from './icons.tsx'
import css from './PaneWorkspace.module.css'
import type { PaneWorkspaceInjected } from './PaneWorkspace.tsx'

/** Full composed props: session kit + shared inject + locale. */
export type FullscreenPaneButtonProps =
  & PropsRuntime<'conversation.session.header.actions'>
  & InjectFace<Pick<PaneWorkspaceInjected, 'toggleFullscreen' | 'hasSplit' | 'isFullscreen'>>
  & PropsLocale<'panes'>

/**
 * Render the header fullscreen toggle.
 * @param props - composed slot props (see FullscreenPaneButtonProps).
 * @returns the toggle button, or null while there is no split to expand.
 */
export function FullscreenPaneButton({ toggleFullscreen, hasSplit, isFullscreen, t }: FullscreenPaneButtonProps) {
  if (!hasSplit()) return null
  const full = isFullscreen()
  const label = full ? t('pane.fullscreen.exit') : t('pane.fullscreen')
  return (
    <button
      type="button"
      className={css.closeButton}
      aria-label={label}
      title={label}
      aria-pressed={full}
      onClick={() => { toggleFullscreen() }}
    >
      {full ? <IconFullscreenExit16 /> : <IconFullscreen16 />}
    </button>
  )
}
