// @vitest-environment jsdom
/** Panes-plugin registration: occupies the conversation slot permanently
    (the single-pane state is the tree with one leaf), registers the header
    split/close buttons over the ONE shared pane tree, owns the global
    shortcuts, and back-fills the side-bar drag payload. */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import {
  SlotTestRuntime, usePinnedBrowserLanguages,
} from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { apply, inject } from '../src/client/index.ts'
import { SESSION_DRAG_TYPE } from '../src/client/session-row.ts'

usePinnedBrowserLanguages('zh-CN')

async function bench() {
  const runtime = await SlotTestRuntime.create()
  const locale = new LocaleRuntime(runtime.ctx)
  runtime.ctx.provide('locale', locale)
  runtime.slots.installLocale(locale)
  await runtime.sessions.add({
    id: 's1' as SessionId,
    summary: { title: 'Fix the build', displayTitle: 'Fix the build', cwd: '/dev' },
  }, { current: false })
  await runtime.sessions.add({
    id: 's2' as SessionId,
    summary: { title: 'Second', displayTitle: 'Second', cwd: '/dev' },
  }, { current: false })
  // Declare the layout-owned conversation slot (single, session-maybe) and —
  // as ui-conversation's ConversationRoot does in production — the child
  // slots (session, header, composer) it owns. The plugin wins the slot but
  // relies on these declarations + occupant registrations surviving.
  await runtime.root.declare({
    'conversation': { kind: 'single', scope: 'session-maybe' },
  }, (_props: { renderSlot?: unknown }) => null)
  await runtime.slots.inject('conversation' as never, function* () {
    yield runtime.slots.register({
      name: 'conversation',
      children: {
        'conversation.session': { kind: 'single', scope: 'session' },
        'conversation.session.header': { kind: 'single', scope: 'session' },
        'conversation.composer': { kind: 'chain', scope: 'session' },
        'conversation.composer.bar': { kind: 'single', scope: 'session-maybe' },
        'conversation.input.dock': { kind: 'list', scope: 'session' },
        'conversation.hero.brand.mark': { kind: 'single', scope: 'root' },
        'conversation.hero.workspace': { kind: 'single', scope: 'root' },
        'conversation.hero.agentPreset': { kind: 'single', scope: 'root' },
      } as never,
    } as never, (() => null) as never)
    yield runtime.slots.register({
      name: 'conversation.session.header',
      children: {
        'conversation.session.header.actions': { kind: 'list', scope: 'session' },
      } as never,
    } as never, (() => null) as never)
  })
  return runtime
}

describe('ui-panes apply', () => {
  it('declares only the services it uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'sessions', 'uiSession'])
  })

  it('occupies the conversation slot permanently and owns one shared pane tree', async () => {
    const runtime = await bench()
    await runtime.mount({ inject: [...inject], apply })
    await runtime.flush()
    // The plugin's occupant is always registered; the stock ConversationRoot
    // stays on the ledger (the pane renderer elects it inside each pane).
    const conversation = runtime.slots.entries('conversation')
    expect(conversation).toHaveLength(2)
    const panesEntry = conversation.find(e => (e as { options?: { priority?: number } }).options?.priority === -1)
    expect(panesEntry).toBeDefined()
    expect(runtime.slots.entriesOfSlot('conversation')[0]).toBe(panesEntry)

    const splitButton = runtime.slots.entries('conversation.session.header.actions' as never)
      .find(e => (e as { options?: { id?: string } }).options?.id === 'panes-split')
    const entry = splitButton as unknown as { inject?: (...args: unknown[]) => Record<string, unknown> } | undefined
    const ops = entry?.inject
      ? entry.inject('s1') as unknown as {
        splitFocused: (d: 'horizontal' | 'vertical') => void
        closeFocused: () => void
        hasSplit: () => boolean
      }
      : null
    expect(ops).not.toBeNull()
    expect(ops?.hasSplit()).toBe(false)
    const buttons = runtime.slots.entries('conversation.session.header.actions' as never)
      .filter(e => (e as { options: { id?: string } }).options.id?.startsWith('panes-') ?? false)
    expect(buttons).toHaveLength(3)
    const ids = buttons.map(e => (e as { options: { id?: string } }).options.id).sort()
    expect(ids).toEqual(['panes-close', 'panes-split', 'panes-split-v'])

    runtime.sessions.open('s1' as SessionId)
    ops!.splitFocused('horizontal')
    await runtime.flush()
    expect(ops!.hasSplit()).toBe(true)
    // The first pane keeps the current selection; the new pane is a fresh
    // new-conversation placeholder.
    ops!.closeFocused()
    await runtime.flush()
    expect(ops!.hasSplit()).toBe(false)
    await runtime.dispose()
  })

  it('splits and closes through the global shortcuts', async () => {
    const runtime = await bench()
    await runtime.mount({ inject: [...inject], apply })
    await runtime.flush()
    runtime.sessions.open('s1' as SessionId)
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true, shiftKey: true })
    await runtime.flush()
    const splitButton = runtime.slots.entries('conversation.session.header.actions' as never)
      .find(e => (e as { options?: { id?: string } }).options?.id === 'panes-split')
    const ops = (splitButton as unknown as { inject: (...args: unknown[]) => { hasSplit: () => boolean } })
      .inject('s1')
    expect(ops.hasSplit()).toBe(true)
    // Editing targets stay exempt (mod+shift+arrows select text there).
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'w', ctrlKey: true, shiftKey: true })
    expect(ops.hasSplit()).toBe(true)
    input.remove()
    fireEvent.keyDown(window, { key: 'w', ctrlKey: true, shiftKey: true })
    await runtime.flush()
    expect(ops.hasSplit()).toBe(false)
    await runtime.dispose()
  })

  it('backs the dragged session id into dataTransfer from the side-bar row DOM', async () => {
    const runtime = await bench()
    await runtime.mount({ inject: [...inject], apply })
    // A draggable session row (like the side-bar's): a title cell matching a
    // roster displayTitle resolves to that session's id on dragstart.
    const row = document.createElement('div')
    row.setAttribute('role', 'treeitem')
    row.setAttribute('draggable', 'true')
    const title = document.createElement('span')
    title.textContent = 'Fix the build'
    const time = document.createElement('span')
    time.textContent = '5h'
    row.append(title, time)
    document.body.appendChild(row)
    const dataTransfer = { types: [] as string[], setData: vi.fn(), getData: () => '' }
    fireEvent.dragStart(row, { dataTransfer })
    expect(dataTransfer.setData).toHaveBeenCalledWith(SESSION_DRAG_TYPE, 's1')
    // A row whose title matches no roster session (e.g. a blank New Session
    // row) writes nothing.
    const blank = document.createElement('div')
    blank.setAttribute('role', 'treeitem')
    blank.setAttribute('draggable', 'true')
    const blankTitle = document.createElement('span')
    blankTitle.textContent = 'New Session'
    blank.append(blankTitle)
    document.body.appendChild(blank)
    const dt2 = { types: [] as string[], setData: vi.fn(), getData: () => '' }
    fireEvent.dragStart(blank, { dataTransfer: dt2 })
    expect(dt2.setData).not.toHaveBeenCalled()
    // Non-session drags (no treeitem row) are ignored.
    const other = document.createElement('div')
    other.setAttribute('draggable', 'true')
    document.body.appendChild(other)
    const dt3 = { types: [] as string[], setData: vi.fn(), getData: () => '' }
    fireEvent.dragStart(other, { dataTransfer: dt3 })
    expect(dt3.setData).not.toHaveBeenCalled()
    // An already-populated payload (a newer side-bar) is never overwritten.
    const dt4 = { types: [SESSION_DRAG_TYPE], setData: vi.fn(), getData: () => '' }
    fireEvent.dragStart(row, { dataTransfer: dt4 })
    expect(dt4.setData).not.toHaveBeenCalled()
    await runtime.dispose()
  })
})
