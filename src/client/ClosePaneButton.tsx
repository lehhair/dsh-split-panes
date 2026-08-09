/**
 * Header close-pane affordance (registered into the conversation header's
 * actions row): closes the FOCUSED pane — visible only while the split tree
 * actually has panes to close. Reads the SAME pane-layout store instance as
 * the workspace (both entries share the handle).
 *
 * The props type deliberately rides 'conversation.panes' (the layout-owned
 * root-scope slot this package composes against): it delivers the global
 * standard kit, and typing this component that way keeps the package's
 * one-way dependency direction (ui-conversation renders the 'conversation'
 * entry this package's panes reuse).
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { createPaneLayoutStore } from './pane-layout-store.ts'
import { allLeaves } from './pane-layout-store.ts'
import css from './PaneWorkspace.module.css'

/** Full composed props: global kit + shared store + locale. */
export type ClosePaneButtonProps =
  & PropsRuntime<'conversation.panes'>
  & PropsStore<ReturnType<typeof createPaneLayoutStore>>
  & PropsLocale<'panes'>

/**
 * Render the header close-pane button (single-pane state renders nothing).
 * @param props - composed slot props (see ClosePaneButtonProps).
 * @returns the close button, or null while there is no split to close.
 */
export function ClosePaneButton({ useStore, actions, t }: ClosePaneButtonProps) {
  const root = useStore(s => s.root)
  const focusedPaneId = useStore(s => s.focusedPaneId)
  if (root.type === 'leaf') return null
  return (
    <button
      type="button"
      className={css.closeButton}
      aria-label={t('pane.close')}
      title={t('pane.close')}
      onClick={() => {
        const paneId = focusedPaneId ?? allLeaves(root)[0]?.id
        if (paneId !== undefined) actions.closePane(paneId)
      }}
    >
      <IconCloseOutline16 />
    </button>
  )
}
