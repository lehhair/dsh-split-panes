// @vitest-environment jsdom
/** The pane render path over the REAL conversation assembly.
    Mounts ui-conversation's own apply (ConversationRoot, session header, body,
    composer) plus this plugin, then renders TWO panes through the plugin's
    `renderPane` delegate and asserts each pane shows ITS OWN session — the
    by-id rendering the core does not expose. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createElement } from 'react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import {
  SlotTestRuntime, stubSettingsScope, usePinnedBrowserLanguages,
} from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import {
  apply as applyConversation, inject as conversationInject,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { apply as applyPanes, inject as panesInject } from '../src/client/index.ts'
import { PANE_ROOT_SLOT_ENTRY } from '../src/client/pane-host.ts'

usePinnedBrowserLanguages('zh-CN')

// jsdom lacks ResizeObserver — ConversationRoot's measurement logic needs it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class RO {
    constructor(_cb: unknown) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as Record<string, unknown>).ResizeObserver = RO
}

const FIRST = 'session-first' as SessionId
const SECOND = 'session-second' as SessionId

/** Boot the real conversation assembly + the panes plugin. */
async function bench() {
  const runtime = await SlotTestRuntime.create()
  const locale = new LocaleRuntime(runtime.ctx)
  runtime.ctx.provide('locale', locale)
  runtime.slots.installLocale(locale)
  runtime.ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
  runtime.ctx.provide('uiWorkspace', { connectWorkspace: async () => FIRST } as never)
  for (const [id, title] of [[FIRST, 'Alpha session'], [SECOND, 'Beta session']] as const) {
    await runtime.sessions.add({
      id,
      summary: { title, displayTitle: title, cwd: '/proj' },
      session: { loadOlder: async () => {}, prompt: async () => ({ ok: true, value: { accepted: true } }) },
    }, { current: false })
  }
  await runtime.root.declare({
    'conversation': { kind: 'single', scope: 'session-maybe' },
  }, (_props: { renderSlot?: unknown }) => null)
  await runtime.mount({ inject: conversationInject, apply: applyConversation })
  await runtime.flush()
  // A stub chat view so the strict session body has an active view.
  runtime.slots.register(
    { name: 'conversation.view', id: 'chat', order: 0 },
    (() => createElement('div', { 'data-testid': 'chat-view' })) as never,
  )
  await runtime.mount({ inject: [...panesInject], apply: applyPanes })
  await runtime.flush()
  return runtime
}

/** The plugin's conversation occupant + its injected operations face. */
function panesOps(runtime: SlotTestRuntime) {
  const entry = runtime.slots.entries('conversation')
    .find(candidate => (candidate as { options?: { priority?: number } }).options?.priority === -1)
  if (entry === undefined) throw new Error('panes occupant missing')
  const inject = (entry as unknown as { inject?: (...args: unknown[]) => unknown }).inject
  if (inject === undefined) throw new Error('panes occupant has no inject face')
  return inject(FIRST) as unknown as {
    renderPane: (sessionId: SessionId | undefined, paneId: string) => unknown
    hasSplit: () => boolean
  }
}

describe('pane render path over the real conversation assembly', () => {
  it('renders the stock conversation under an EXPLICIT session per pane', async () => {
    const runtime = await bench()
    try {
      const ops = panesOps(runtime)
      const view = render(createElement('div', null,
        createElement('div', { 'data-pane': 'first' }, ops.renderPane(FIRST, 'first') as never),
        createElement('div', { 'data-pane': 'second' }, ops.renderPane(SECOND, 'second') as never),
      ))
      const pane = (name: string): HTMLElement => {
        const el = view.container.querySelector(`[data-pane="${name}"]`)
        if (el === null) throw new Error(`pane ${name} missing`)
        return el as HTMLElement
      }
      // No occupant crashed: the per-entry boundaries render nothing.
      expect(view.container.querySelectorAll('[data-slot-error]')).toHaveLength(0)
      // Each pane's native header shows ITS session's title and not the other's.
      expect(pane('first').textContent).toContain('Alpha session')
      expect(pane('first').textContent).not.toContain('Beta session')
      expect(pane('second').textContent).toContain('Beta session')
      expect(pane('second').textContent).not.toContain('Alpha session')
      // The native chrome and body are present in both panes.
      for (const name of ['first', 'second']) {
        expect(pane(name).querySelector('header')).not.toBeNull()
        expect(pane(name).querySelector('[data-slot="conversation.session"]')).not.toBeNull()
        expect(pane(name).querySelector('[data-slot="conversation.composer.bar"]')).not.toBeNull()
        expect(pane(name).querySelector('[data-testid="chat-view"]')).not.toBeNull()
      }
      view.unmount()
    } finally {
      await runtime.dispose()
    }
  }, 30000)

  it('renders the native new-conversation surface for an unbound pane', async () => {
    const runtime = await bench()
    try {
      const ops = panesOps(runtime)
      const view = render(createElement('div', null, ops.renderPane(undefined, 'hero') as never))
      expect(view.container.querySelectorAll('[data-slot-error]')).toHaveLength(0)
      // The hero keeps its own chrome (no strict session body, no header).
      expect(view.container.querySelector('[data-slot="conversation.composer.bar"]')).not.toBeNull()
      expect(view.container.querySelector('[data-slot="conversation.session"]')).toBeNull()
      view.unmount()
    } finally {
      await runtime.dispose()
    }
  }, 30000)

  it('answers the renderer for the synthetic root slot with one dispatch entry', async () => {
    const runtime = await bench()
    try {
      const rootEntry = runtime.slots.entriesOfSlot('root')[0]
      // The plugin does not touch the real root slot; the synthetic entry is
      // what a pane host serves instead of the shell.
      expect(rootEntry).not.toBe(PANE_ROOT_SLOT_ENTRY)
      expect(PANE_ROOT_SLOT_ENTRY.children?.['conversation']).toMatchObject({
        kind: 'single',
        scope: 'session-maybe',
      })
    } finally {
      await runtime.dispose()
    }
  }, 30000)

  afterEach(() => { cleanup() })
})
