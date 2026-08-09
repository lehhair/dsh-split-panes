/**
 * Header split affordance (registered into the conversation header's actions
 * row): splits the focused pane side-by-side and seeds the new pane as a
 * fresh conversation in the current workspace — the entry point into split
 * mode. Reads the SAME pane-layout store instance as the workspace (both
 * entries share the handle).
 *
 * The props type deliberately rides 'conversation.panes' (the layout-owned
 * root-scope slot this package composes against): it delivers the global
 * standard kit (current selection and recent workspace via the global seats)
 * plus the shared inject, keeping the package's one-way dependency direction
 * (ui-conversation renders the 'conversation' entry this package's panes
 * reuse).
 */
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState, WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { createPaneLayoutStore } from './pane-layout-store.ts'
import { IconSplitHorizontal16 } from './icons.tsx'
import css from './PaneWorkspace.module.css'
import type { PaneWorkspaceInjected } from './PaneWorkspace.tsx'

/** Full composed props: global kit + shared store + inject + locale. */
export type SplitPaneButtonProps =
  & PropsRuntime<'conversation.panes'>
  & PropsStore<ReturnType<typeof createPaneLayoutStore>>
  & InjectFace<Pick<PaneWorkspaceInjected, 'splitWithNew'>>
  & PropsLocale<'panes'>

/**
 * Render the header split button.
 * @param props - composed slot props (see SplitPaneButtonProps).
 * @returns the split button element.
 */
export function SplitPaneButton({ useStore, useSessions, useWorkspaces, splitWithNew, t }: SplitPaneButtonProps) {
  const focusedPaneId = useStore(s => s.focusedPaneId)
  const current = useSessions((s: SessionListState) => s.current)
  const workspaceId = useWorkspaces((s: WorkspaceListState) => s.recentWorkspaceId)
  return (
    <button
      type="button"
      className={css.splitButton}
      aria-label={t('pane.split')}
      title={t('pane.split')}
      onClick={() => {
        // The current session anchors the new pane's sibling: splitting the
        // full-bleed pane keeps this session and opens a fresh conversation
        // (no current session anchors null — hero-to-hero).
        if (focusedPaneId !== null) {
          splitWithNew(focusedPaneId, 'horizontal', current ?? null, workspaceId)
        }
      }}
    >
      <IconSplitHorizontal16 />
    </button>
  )
}
