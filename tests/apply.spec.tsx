// @vitest-environment jsdom
/** Panes-plugin registration: all surfaces share one layout store instance;
    they wait on their owners' declarations; teardown removes everything. */
import { Context } from 'cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent } from '@testing-library/react'
import { SlotsService } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleService } from '@deepseek-ai/dsh-client-locale/client'
import { apply, inject } from '../src/client/index.ts'
import { SESSION_DRAG_TYPE } from '../src/client/PaneWorkspace.tsx'
import type { PaneWorkspaceInjected } from '../src/client/PaneWorkspace.tsx'
import type { PaneLayoutState, PaneLeaf, PaneSplit } from '../src/client/pane-layout-store.ts'
import type { SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'

afterEach(() => { cleanup() })

async function bench(declare = true, createSession?: (opts: { workspaceId: WorkspaceId }) => Promise<SessionId>) {
  const ctx = new Context()
  await ctx.plugin(SlotsService).await()
  ctx.provide('locale', new LocaleService(ctx))
  // splitWithNew mints fresh sessions through sessions.create — each call
  // returns a NEW id so a stack of split panes stays independent.
  let next = 0
  ctx.provide('sessions', {
    open: () => {},
    list: {
      getSnapshot: () => ({
        byId: {
          s1: { id: 's1', displayTitle: 'Fix the build', running: false, blank: false, updatedAt: 1 },
          s2: { id: 's2', displayTitle: 'Second', running: false, blank: false, updatedAt: 1 },
        },
      }),
    },
    create: createSession ?? vi.fn(async () => `blank-${++next}` as SessionId),
  })
  const slots = ctx.get('slots') as SlotsService
  if (declare) {
    slots.register(
      {
        name: 'root',
        children: {
          'conversation.panes': { kind: 'single', scope: 'root' },
          'conversation.session.header.actions': { kind: 'list', scope: 'session' },
        },
      } as never,
      () => null,
    )
  }
  return { ctx, slots }
}

describe('ui-panes apply', () => {
  it('declares only the services it uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'sessions'])
  })

  it('registers the workspace and the header split/close buttons over ONE store instance', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const workspace = b.slots.entries('conversation.panes')
    const buttons = b.slots.entries('conversation.session.header.actions' as never)
    expect(workspace).toHaveLength(1)
    expect(buttons).toHaveLength(3)
    const ids = buttons.map(e => e.options.id).sort()
    expect(ids).toEqual(['panes-close', 'panes-split', 'panes-split-v'])
    // Every surface shares ONE live store instance (each registration
    // carries its own wrapper handle so the framework's per-handle scope pin
    // never fires; create() resolves the same instance — one split tree,
    // every surface, across the root and session slots).
    const workspaceStore = (workspace[0]!.store as { create: () => unknown }).create()
    for (const btn of buttons) {
      expect((btn.store as { create: () => unknown }).create()).toBe(workspaceStore)
    }
    // Copy rides the standard locale seat.
    expect(workspace[0]!.locale).toBe('panes')
  })

  it('waits for the owners — no registration without a live declaration', async () => {
    // Registrations ride slots.inject: absent a declaration they simply do
    // not install (never a hard failure), so the surfaces stay empty.
    const b = await bench(false)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    expect(b.slots.entries('conversation.panes')).toHaveLength(0)
    expect(b.slots.entries('conversation.session.header.actions' as never)).toHaveLength(0)
  })

  it('removes all entries on teardown', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    await fiber.dispose()
    expect(b.slots.entries('conversation.panes')).toHaveLength(0)
    expect(b.slots.entries('conversation.session.header.actions' as never)).toHaveLength(0)
  })

  it('backs the dragged session id into dataTransfer from the side-bar row DOM', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
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
  })

  it('splitWithNew splits and leaves the new pane a NEW-CONVERSATION placeholder (no host session)', async () => {
    const createSession = vi.fn(async () => 'unused' as SessionId)
    const b = await bench(true, createSession)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const workspace = b.slots.entries('conversation.panes')
    const store = (workspace[0]!.store as { create: () => { getSnapshot: () => PaneLayoutState } }).create()
    const rootId = store.getSnapshot().root.id
    const face = (workspace[0]!.inject as unknown as () => PaneWorkspaceInjected)()
    // A split is a pure VIEW operation: no host session is minted — the new
    // pane is a placeholder whose stock hero starts the conversation (and
    // only then creates its session). Nothing is shared until a pane starts.
    face.splitWithNew(rootId, 'horizontal', null, 'ws1' as WorkspaceId)
    await new Promise(r => setTimeout(r, 0))
    expect(createSession).not.toHaveBeenCalled()
    const first = store.getSnapshot().root as PaneSplit
    expect(first.type).toBe('split')
    expect((first.first as PaneLeaf).sessionId).toBeNull()
    expect((first.second as PaneLeaf).sessionId).toBeNull()
    // A second split adds another placeholder — still no host session.
    face.splitWithNew((first.second as PaneLeaf).id, 'vertical', null, 'ws1' as WorkspaceId)
    await new Promise(r => setTimeout(r, 0))
    expect(createSession).not.toHaveBeenCalled()
  })
})
