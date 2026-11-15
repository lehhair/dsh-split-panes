// @vitest-environment node
/**
 * Pane-host election must equal the core's own election (SlotCore.entriesOfSlot)
 * with pane-hidden entries additionally skipped. Regression: a pane re-elected
 * from the raw ledger and resurrected entries the CORE had abdicated.
 */
import { describe, expect, it } from 'vitest'
import { SlotCore, type SlotComponent, type SlotRendererHost } from '@deepseek-ai/dsh-client-ui-slots'
import { createPaneHost, registryCoreAbdicated } from '../src/client/pane-host.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'panes.test.single': { kind: 'single'; scope: 'root' }
    'panes.test.keyed': { kind: 'keyed'; scope: 'root' }
  }
}

const A: SlotComponent<object> = () => null
const B: SlotComponent<object> = () => null
const C: SlotComponent<object> = () => null

/** A host face over a real SlotCore, shaped like the registry's (only the members the overlay reads). */
function baseOver(core: SlotCore): SlotRendererHost {
  return {
    entriesOf: key => core.entries(key),
    entriesOfSlot: key => core.entriesOfSlot(key),
    specOf: key => core.specDynamic(key),
    isLive: entry => core.isLive(entry),
    subscribe: (key, fn) => core.subscribe(key, fn),
    getVersion: key => core.getVersion(key),
    reportEntryError: (key, entry, error, info) => { core.reportEntryError(key, entry, error, info) },
    scope: () => undefined,
  } as Partial<SlotRendererHost> as SlotRendererHost
}

function setup() {
  const core = new SlotCore()
  core.register({
    name: 'root',
    children: {
      'panes.test.single': { kind: 'single', scope: 'root' },
      'panes.test.keyed': { kind: 'keyed', scope: 'root' },
    },
  }, A as never)
  const absent = { getSnapshot: () => ({ key: undefined, hooks: {}, keyedHooks: {}, props: {} }), subscribe: () => () => {} }
  const adapter = { current: absent, bindingSource: () => absent }
  return { core, base: baseOver(core), adapter, absent }
}

const crash = new Error('boom')

describe('pane host election', () => {
  // The core abdication happens BEFORE the pane host exists — the plugin-reload case.
  it('a pane abdication never resurrects an entry the core already abdicated', () => {
    const { core, base, adapter, absent } = setup()
    core.register({ name: 'panes.test.single', priority: 0 }, A)
    core.register({ name: 'panes.test.single', priority: 1 }, B)
    core.register({ name: 'panes.test.single', priority: 2 }, C)
    const [a, b, c] = core.entries('panes.test.single')
    core.reportEntryError('panes.test.single', a!, crash, { abdicate: true })
    expect(core.entriesOfSlot('panes.test.single')).toEqual([b])

    const pane = createPaneHost({
      base, adapter: adapter as never, binding: absent as never,
      coreAbdicated: registryCoreAbdicated({ _core: core }),
    })
    expect(pane.entriesOfSlot('panes.test.single')).toEqual([b])
    pane.reportEntryError('panes.test.single', b!, crash, { abdicate: true })
    expect(pane.entriesOfSlot('panes.test.single')).toEqual([c])
    // The pane abdication stays local: the main view still elects B.
    expect(core.entriesOfSlot('panes.test.single')).toEqual([b])
  })

  it('a later higher-priority registration does not resurrect a core-abdicated entry', () => {
    const { core, base, adapter, absent } = setup()
    core.register({ name: 'panes.test.single', priority: 0 }, B)
    core.register({ name: 'panes.test.single', priority: 1 }, C)
    const [b] = core.entries('panes.test.single')
    core.reportEntryError('panes.test.single', b!, crash, { abdicate: true })
    core.register({ name: 'panes.test.single', priority: -1 }, A)
    const a = core.entries('panes.test.single').find(e => e.component === A)!
    const pane = createPaneHost({
      base, adapter: adapter as never, binding: absent as never,
      coreAbdicated: registryCoreAbdicated({ _core: core }),
    })
    pane.reportEntryError('panes.test.single', a, crash, { abdicate: true })
    expect(pane.entriesOfSlot('panes.test.single').map(e => e.component)).toEqual([C])
  })

  it('excluded entries are skipped per cell, other cells keep the core winner', () => {
    const { core, base, adapter, absent } = setup()
    core.register({ name: 'panes.test.keyed', key: 'x', priority: -1 }, A)
    core.register({ name: 'panes.test.keyed', key: 'x' }, B)
    core.register({ name: 'panes.test.keyed', key: 'y' }, C)
    const pane = createPaneHost({
      base, adapter: adapter as never, binding: absent as never,
      excluded: entry => entry.component === A,
    })
    expect(pane.entriesOfSlot('panes.test.keyed').map(e => e.component)).toEqual([B, C])
  })
})
