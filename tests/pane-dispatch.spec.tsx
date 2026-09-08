// @vitest-environment jsdom
/** Dispatch regression: owner props merge (last, winning), slot-level
    inject factories bind per hookContext, and keyed dispatch routes by the
    entry key — the exact chat-node dispatch shape (ChatNodeSeat). */
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
    // A keyed test slot whose SPEC carries a slot-level inject with a hook
    // factory over hookContext (the exact shape of ui-chat's
    // CHAT_NODE_INJECT on conversation.chat.node).
    'pane.test.node': {
      kind: 'keyed', scope: 'session',
      inject: {
        hooks: {
          turnData: (_standard: unknown, data: unknown) =>
            function useTurnData() { return data },
        },
      },
    },
  }, (_props: { renderSlot?: unknown }) => null)
  await runtime.mount({ inject: conversationInject, apply: applyConversation })
  await runtime.flush()
  return runtime
}

describe('pane dispatch regression', () => {
  afterEach(() => { cleanup() })

  it('merges owner props (winning) into a keyed node renderer', async () => {
    const runtime = await bench()
    try {
      // A keyed renderer that reads its OWNER props (the tool-call shape).
      let seenNode: unknown = 'never-called'
      const removeView = runtime.ctx.slots.register({
        name: 'pane.test.node',
        key: 'tool-call',
      } as never, ((props: { node?: { data?: unknown } }) => {
        seenNode = props.node
        return createElement('div', { 'data-testid': 'node-rendered' })
      }) as never)
      await runtime.flush()
      const kit = buildPaneKit(runtime.ctx, ROOT)
      const host = createPaneRenderHost(runtime.ctx.slots, kit, runtime.ctx.locale)
      // The ChatNodeSeat dispatch shape: owner carries node, opts carries
      // entryKey + hookContext.
      const node = host.renderSlot(
        'pane.test.node',
        { node: { data: { root: 'the-root' } } },
        { entryKey: 'tool-call', hookContext: { turn: 'ctx' }, fallback: null },
      )
      expect(node).not.toBeNull()
      const view = render(createElement('div', null, node))
      expect(screen.queryByTestId('node-rendered')).not.toBeNull()
      // The owner's node arrived (previously the owner was dropped —
      // 'node' was undefined and reading node.data crashed).
      expect(seenNode).toEqual({ data: { root: 'the-root' } })
      view.unmount()
      removeView()
    } finally {
      await runtime.dispose()
    }
  }, 20000)

  it('binds slot-level inject hook factories with the dispatch hookContext', async () => {
    const runtime = await bench()
    try {
      let seenTurnData: unknown = 'never-called'
      const removeView = runtime.ctx.slots.register({
        name: 'pane.test.node',
        key: 'tool-call',
      } as never, ((props: { useTurnData?: () => unknown }) => {
        seenTurnData = props.useTurnData?.()
        return createElement('div', { 'data-testid': 'node-rendered' })
      }) as never)
      await runtime.flush()
      const kit = buildPaneKit(runtime.ctx, ROOT)
      const host = createPaneRenderHost(runtime.ctx.slots, kit, runtime.ctx.locale)
      const node = host.renderSlot(
        'pane.test.node',
        { node: { data: 'the-turn-data' } },
        { entryKey: 'tool-call', hookContext: 'the-turn-data', fallback: null },
      )
      expect(node).not.toBeNull()
      const view = render(createElement('div', null, node))
      // The factory produced useTurnData over THIS dispatch's hookContext.
      expect(seenTurnData).toBe('the-turn-data')
      view.unmount()
      removeView()
    } finally {
      await runtime.dispose()
    }
  }, 20000)
})