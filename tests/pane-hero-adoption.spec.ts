// @vitest-environment node
/**
 * A pane's hero `selectWorkspace` must bind the opened Session back to that
 * pane — including when ui-workspace REUSES the current blank Session, which
 * leaves the global selection unchanged (regression: the pane stayed on the
 * absent hero). Exercised through the pane host's Factory view, the same path
 * the vendored renderer takes (`factoryOf(name).inject(...)`).
 */
import { describe, expect, it } from 'vitest'
import type { SlotRendererHost, StoredFactory } from '@deepseek-ai/dsh-client-ui-slots'
import { createPaneHost } from '../src/client/pane-host.ts'
import { paneFactoryInject } from '../src/client/PaneConversation.tsx'

/**
 * Mirrors rc.3: ui-conversation's selectWorkspace calls
 * `uiWorkspace.openWorkspace(id, beforeOpen)` synchronously; openWorkspace
 * runs `beforeOpen(sessionId)` only when it actually opens that Session and
 * resolves WITHOUT calling it when a later navigation superseded the request.
 */
function harness(opensSession: string, superseded = false) {
  const uiWorkspace = {
    async openWorkspace(_id: unknown, beforeOpen?: (id: string) => void) {
      await Promise.resolve()
      if (!superseded) beforeOpen?.(opensSession)
    },
  }
  const ctx = { get: (name: string) => (name === 'uiWorkspace' ? uiWorkspace : undefined) }
  const content: StoredFactory = {
    name: 'conversation.content',
    component: () => null,
    scope: 'session-maybe',
    inject: () => ({
      selectWorkspace: (id: unknown) => uiWorkspace.openWorkspace(id, () => {}),
    }),
  }
  const calls: string[] = []
  const base = {
    factoryOf: (name: string) => (name === content.name ? content : undefined),
    isFactoryLive: (definition: StoredFactory) => definition === content,
    retainFactoryOccurrence: (definition: StoredFactory) => { calls.push(definition === content ? 'retain:core' : 'retain:COPY'); return () => {} },
    factoryStoreOf: (definition: StoredFactory) => { calls.push(definition === content ? 'store:core' : 'store:COPY'); return undefined },
  } as Partial<SlotRendererHost> as SlotRendererHost
  const adopted: Array<[string, string]> = []
  const absent = { getSnapshot: () => ({ key: undefined, hooks: {}, keyedHooks: {}, props: {} }), subscribe: () => () => {} }
  const host = createPaneHost({
    base,
    adapter: { current: absent, bindingSource: () => absent } as never,
    binding: absent as never,
    wrapFactoryInject: paneFactoryInject(ctx as never, 'pane-2', (pane, id) => { adopted.push([pane, id]) }),
  })
  return { host, adopted, calls, content }
}

describe('pane hero adoption', () => {
  it('binds a REUSED blank Session (selection unchanged) back to the originating pane', async () => {
    const { host, adopted } = harness('blank-S')
    const face = host.factoryOf('conversation.content')!.inject!() as { selectWorkspace: (id: string) => Promise<void> }
    await face.selectWorkspace('ws')
    expect(adopted).toEqual([['pane-2', 'blank-S']])
  })

  it('binds a newly created Session back to the originating pane', async () => {
    const { host, adopted } = harness('new-N')
    const face = host.factoryOf('conversation.content')!.inject!() as { selectWorkspace: (id: string) => Promise<void> }
    await face.selectWorkspace('ws')
    expect(adopted).toEqual([['pane-2', 'new-N']])
  })

  it('a SUPERSEDED request binds nothing', async () => {
    const { host, adopted } = harness('new-N', true)
    const face = host.factoryOf('conversation.content')!.inject!() as { selectWorkspace: (id: string) => Promise<void> }
    await face.selectWorkspace('ws')
    expect(adopted).toEqual([])
  })

  it('identity-keyed Factory members still reach the core definition', () => {
    const { host, calls, content } = harness('x')
    const copy = host.factoryOf('conversation.content')!
    expect(copy).not.toBe(content)
    expect(host.factoryOf('conversation.content')).toBe(copy)
    expect(host.isFactoryLive(copy)).toBe(true)
    host.retainFactoryOccurrence(copy, {})
    host.factoryStoreOf(copy, undefined, {})
    expect(calls).toEqual(['retain:core', 'store:core'])
  })
})
