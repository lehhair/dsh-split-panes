/**
 * Pane-layout store: one split-pane tree per session. Splitting CLONES the
 * single-pane conversation: the original pane keeps the current session, and
 * the new pane is a fresh new-conversation entry (null session) that binds
 * the session it starts. Pane state is viewing state — sessions themselves
 * live in the object layer, never here.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'

/** One chat pane: a session slot (null = the new-conversation entry). */
export interface PaneLeaf {
  type: 'leaf'
  id: string
  /** Bound session; null while the pane is the new-conversation entry. */
  sessionId: SessionId | null
}

/** A split: two panes with a ratio (first share of the main axis). */
export interface PaneSplit {
  type: 'split'
  id: string
  direction: 'horizontal' | 'vertical'
  ratio: number
  first: PaneNode
  second: PaneNode
}

export type PaneNode = PaneLeaf | PaneSplit

export interface PaneLayoutState {
  root: PaneNode
  focusedPaneId: string | null
}

export type PaneActions = {
  focusPane: (draft: PaneLayoutState, paneId: string) => void
  /** Split a pane; the original keeps its session (defaults to the current one), the new pane starts fresh. */
  /** Split a pane; the original keeps its session (defaults to the current one; null keeps a hero pane hero), the new pane starts fresh. */
  splitPane: (draft: PaneLayoutState, paneId: string, direction: 'horizontal' | 'vertical', currentSessionId: SessionId | null) => void
  /**
   * Drop-side split (session drag & drop): split a pane on the given side,
   * binding the NEW pane to the dropped session while the original keeps its
   * own. Focus moves to the NEW pane — a drop is an act on that pane (its
   * session opens right after), so the tree hands it focus.
   */
  splitPaneToSide: (
    draft: PaneLayoutState,
    paneId: string,
    side: PaneSide,
    sessionId: SessionId | null,
    currentSessionId: SessionId | null,
  ) => void
  closePane: (draft: PaneLayoutState, paneId: string) => void
  setRatio: (draft: PaneLayoutState, splitId: string, ratio: number) => void
  /** Bind (or clear) one leaf's session — a started conversation lands here. */
  setPaneSession: (draft: PaneLayoutState, paneId: string, sessionId: SessionId | null) => void
}

/** One of the four drop sides a session can be dragged onto (center replaces). */
export type PaneSide = 'left' | 'right' | 'top' | 'bottom'

/** Ratio bounds for the divider drag/keyboard (PiUI parity: a pane can shrink to 10% but never collapse). */
export const MIN_RATIO = 0.1
export const MAX_RATIO = 0.9

let paneSeq = 0
let splitSeq = 0

const genPaneId = (): string => `pane-${++paneSeq}`
const genSplitId = (): string => `split-${++splitSeq}`

/** Collect every leaf id in tree order. */
export function allLeaves(node: PaneNode): PaneLeaf[] {
  if (node.type === 'leaf') return [node]
  return [...allLeaves(node.first), ...allLeaves(node.second)]
}

/** Locate one leaf by id. */
function findLeaf(node: PaneNode, paneId: string): PaneLeaf | null {
  if (node.type === 'leaf') return node.id === paneId ? node : null
  return findLeaf(node.first, paneId) ?? findLeaf(node.second, paneId)
}

/** Replace one node by id (identity-preserving). */
function replaceNode(node: PaneNode, paneId: string, next: PaneNode): PaneNode {
  if (node.type === 'leaf') return node.id === paneId ? next : node
  const first = replaceNode(node.first, paneId, next)
  const second = replaceNode(node.second, paneId, next)
  if (first === node.first && second === node.second) return node
  return { ...node, first, second }
}

/**
 * The pane-layout store factory (one handle per registration site; the two
 * panes-plugin surfaces share one instance through the handle).
 * @returns the store pair (create/define).
 */
export function createPaneLayoutStore(): EngineStoreHandle<PaneLayoutState, PaneActions> {
  return defineStore<PaneLayoutState, PaneActions>({
    init: (): PaneLayoutState => {
      const id = genPaneId()
      return { root: { type: 'leaf', id, sessionId: null }, focusedPaneId: id }
    },

    actions: {
      focusPane: (d, paneId: string) => {
        if (d.focusedPaneId === paneId) return
        d.focusedPaneId = paneId
      },

      splitPane: (d, paneId: string, direction: 'horizontal' | 'vertical', currentSessionId: SessionId | null) => {
        const leaf = findLeaf(d.root, paneId)
        if (leaf === null) return
        // The original pane keeps its session (defaulting to the current one
        // when it was the plain full-bleed pane); the new pane is the
        // NEW-CONVERSATION entry (null session) — the clone is fresh, not a
        // duplicate of the running conversation.
        const newLeaf: PaneLeaf = { type: 'leaf', id: genPaneId(), sessionId: null }
        d.root = replaceNode(d.root, paneId, {
          type: 'split',
          id: genSplitId(),
          direction,
          ratio: 0.5,
          first: { ...leaf, sessionId: leaf.sessionId ?? currentSessionId },
          second: newLeaf,
        })
        d.focusedPaneId = newLeaf.id
      },

      splitPaneToSide: (d, paneId: string, side: PaneSide, sessionId: SessionId | null, currentSessionId: SessionId | null) => {
        const leaf = findLeaf(d.root, paneId)
        if (leaf === null) return
        // The ORIGINAL pane keeps its own session (the single full-bleed pane
        // anchors the current selection; inside the split tree it stays
        // itself); the NEW pane shows the dropped session. Focus moves to
        // the new pane — the drop is an act on it, and its session opens
        // right after (the caller opens it).
        const original: PaneLeaf = { ...leaf, sessionId: leaf.sessionId ?? currentSessionId }
        const dropped: PaneLeaf = { type: 'leaf', id: genPaneId(), sessionId }
        const horizontal = side === 'left' || side === 'right'
        // 'left'/'top' put the dropped pane first (the original moves to the
        // far side), 'right'/'bottom' append it after the original.
        const first = side === 'left' || side === 'top' ? dropped : original
        const second = side === 'left' || side === 'top' ? original : dropped
        d.root = replaceNode(d.root, paneId, {
          type: 'split',
          id: genSplitId(),
          direction: horizontal ? 'horizontal' : 'vertical',
          ratio: 0.5,
          first,
          second,
        })
        d.focusedPaneId = dropped.id
      },

      closePane: (d, paneId: string) => {
        if (d.root.type === 'leaf') return
        const leaves = allLeaves(d.root)
        if (leaves.length === 1) return
        const prune = (node: PaneNode): PaneNode | null => {
          if (node.type === 'leaf') return node.id === paneId ? null : node
          const first = prune(node.first)
          const second = prune(node.second)
          if (first === null && second === null) return null
          if (first === null) return second
          if (second === null) return first
          if (first === node.first && second === node.second) return node
          return { ...node, first, second }
        }
        const next = prune(d.root)
        if (next === null) return
        d.root = next
        // Keep focus on a live pane when the focused one closed.
        if (d.focusedPaneId === paneId || findLeaf(d.root, d.focusedPaneId ?? '') === null) {
          d.focusedPaneId = allLeaves(d.root)[0]?.id ?? null
        }
      },

      setRatio: (d, splitId: string, ratio: number) => {
        const clamp = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio))
        const set = (node: PaneNode): PaneNode => {
          if (node.type === 'leaf' || node.id !== splitId || node.ratio === clamp) return node
          return { ...node, ratio: clamp }
        }
        d.root = set(d.root)
      },

      setPaneSession: (d, paneId: string, sessionId: SessionId | null) => {
        const set = (node: PaneNode): PaneNode => {
          if (node.type === 'leaf') {
            if (node.id !== paneId || node.sessionId === sessionId) return node
            return { ...node, sessionId }
          }
          const first = set(node.first)
          const second = set(node.second)
          if (first === node.first && second === node.second) return node
          return { ...node, first, second }
        }
        d.root = set(d.root)
      },
    },
  })
}
