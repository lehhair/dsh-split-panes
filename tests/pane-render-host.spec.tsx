// @vitest-environment jsdom
/** Reproduce the runtime failure: PaneBody renders the stock conversation
    occupants through the pane render host. This mounts the REAL
    ui-conversation assembly and renders the REAL occupants (header, session
    body, composer) with the pane kit — the path the mocked unit tests skip. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import {
  SlotTestRuntime, stubSettingsScope, usePinnedBrowserLanguages,
} from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import {
  apply as applyConversation, inject as conversationInject,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { buildPaneKit } from '../src/client/kit.ts'
import { createPaneRenderHost } from '../src/client/render-host.tsx'
import { PaneBody } from '../src/client/PaneBody.tsx'

usePinnedBrowserLanguages('zh-CN')

const ROOT = 'root-1' as SessionId

async function bench() {
  const runtime = await SlotTestRuntime.create()
  const locale = new LocaleRuntime(runtime.ctx)
  runtime.ctx.provide('locale', locale)
  runtime.slots.installLocale(locale)
  runtime.ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
  runtime.ctx.provide('uiWorkspace', { connectWorkspace: async () => ROOT } as never)
  await runtime.sessions.add({
    id: ROOT,
    summary: { title: 'R', displayTitle: 'R', cwd: '/proj' },
    session: { loadOlder: async () => {}, prompt: async () => ({ ok: true, value: { accepted: true } }) },
  }, { current: true })
  await runtime.root.declare({
    'conversation': { kind: 'single', scope: 'session-maybe' },
  }, (_props: { renderSlot?: unknown }) => null)
  const conversation = await runtime.mount({ inject: conversationInject, apply: applyConversation })
  await runtime.flush()
  return { runtime, conversation }
}

describe('pane render host over the real conversation assembly', () => {
  it('resolves the pane binding with the conversation standard hooks', async () => {
    const b = await bench()
    try {
      const binding = b.runtime.ctx.uiSession.adapter.resolve(ROOT)
      expect(binding).toBeDefined()
      if (binding === undefined) return
      const kit = buildPaneKit(b.runtime.ctx, ROOT)
      const hooks = kit.hooks as Record<string, unknown>
      // The conversation/input hooks must be bound selector functions.
      expect(typeof hooks['conversation']).toBe('function')
      expect(typeof hooks['input']).toBe('function')
      expect(typeof hooks['session']).toBe('function')
    } finally {
      await b.runtime.dispose()
    }
  }, 20000)

  it('renders the REAL session header through the pane render host', async () => {
    const b = await bench()
    try {
      const kit = buildPaneKit(b.runtime.ctx, ROOT)
      const host = createPaneRenderHost(b.runtime.ctx.slots, kit, b.runtime.ctx.locale)
      // The stock header occupant, re-hosted under the pane kit.
      const header = host.renderSlot('conversation.session.header', {}, { fallback: null })
      expect(header).not.toBeNull()
      const view = render(createElement('div', null, header))
      // The header element exists in the DOM (it may be chrome-hidden for a
      // blank session, but the occupant itself must mount without crashing).
      const headerEl = view.container.querySelector('header')
      expect(headerEl).not.toBeNull()
      view.unmount()
    } finally {
      await b.runtime.dispose()
    }
  }, 20000)

  it('renders the REAL PaneBody (header + session body + composer)', async () => {
    const b = await bench()
    try {
      // Register a stub chat view so the session body has an active view
      // (the stock shell always has ui-chat's; the bench assembly does not).
      const removeView = b.runtime.slots.register(
        { name: 'conversation.view', id: 'chat', order: 0 },
        (() => createElement('div', { 'data-testid': 'pane-chat-view' })) as never,
      )
      await b.runtime.flush()
      const view = render(createElement(PaneBody, { ctx: b.runtime.ctx, sessionId: ROOT, key: 'p' }))
      // Every re-hosted region mounts: the header, the session body (the
      // active chat view), and the composer card. A crash in any occupant
      // would surface through the PaneBoundary fallback (empty region).
      expect(view.container.querySelector('header')).not.toBeNull()
      expect(view.container.querySelector('[data-testid="pane-chat-view"]')).not.toBeNull()
      view.unmount()
      removeView()
    } finally {
      await b.runtime.dispose()
    }
  }, 20000)

  afterEach(() => { cleanup() })
})