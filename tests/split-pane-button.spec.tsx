// @vitest-environment jsdom
/* SplitPaneButton: the header split affordance splits the focused pane
   side-by-side, anchoring the new pane's sibling with the current session
   (read through the global useSessions seat). */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import type { SplitPaneButtonProps } from '../src/client/SplitPaneButton.tsx'
import { SplitPaneButton } from '../src/client/SplitPaneButton.tsx'
import { createPaneLayoutStore } from '../src/client/pane-layout-store.ts'
import { en } from '../src/client/locales.ts'

const t: SplitPaneButtonProps['t'] = key => (en as Record<string, string>)[key] ?? key

afterEach(() => { cleanup() })

const neverHook = (() => { throw new Error('button must not read this seat') }) as never

describe('SplitPaneButton', () => {
  it('splits the focused pane with the current session anchor', () => {
    const instance = createPaneLayoutStore().create()
    const splitWithNew = vi.fn()
    render(
      <SplitPaneButton
        useStore={((sel: (s: unknown) => unknown) => sel(instance.getSnapshot())) as SplitPaneButtonProps['useStore']}
        actions={instance.actions}
        useSessions={((sel: (s: { current?: string }) => unknown) => sel({ current: 's1' })) as SplitPaneButtonProps['useSessions']}
        useWorkspaces={((sel: (s: { recentWorkspaceId?: string }) => unknown) => sel({ recentWorkspaceId: 'ws1' })) as SplitPaneButtonProps['useWorkspaces']}
        useSessionById={neverHook}
        useProjectionById={neverHook}
        SessionScope={neverHook}
        splitWithNew={splitWithNew}
        renderConversation={(() => null)}
        t={t}
      />,
    )
    const id = instance.getSnapshot().focusedPaneId
    fireEvent.click(screen.getByRole('button', { name: en['pane.split'] }))
    expect(splitWithNew).toHaveBeenCalledWith(id, 'horizontal', 's1', 'ws1')
  })
})
