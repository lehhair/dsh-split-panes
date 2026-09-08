// @vitest-environment jsdom
/* SplitPaneButton: the header split affordance calls the injected
   splitFocused verb — the apply closure resolves the focused pane + anchor
   from the shared tree. The button itself carries no store seat. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import type { SplitPaneButtonProps } from '../src/client/SplitPaneButton.tsx'
import { SplitPaneButton } from '../src/client/SplitPaneButton.tsx'
import { en } from '../src/client/locales.ts'

const t: SplitPaneButtonProps['t'] = key => (en as Record<string, string>)[key] ?? key

afterEach(() => { cleanup() })

describe('SplitPaneButton', () => {
  it('invokes splitFocused(horizontal) on click', () => {
    const splitFocused = vi.fn()
    const props = {
      splitFocused,
      t,
    } as unknown as SplitPaneButtonProps
    render(<SplitPaneButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: en['pane.split'] }))
    expect(splitFocused).toHaveBeenCalledWith('horizontal')
  })
})