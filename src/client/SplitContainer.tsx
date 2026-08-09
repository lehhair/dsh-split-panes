/**
 * Recursive split-pane container: renders a grid with a draggable +
 * keyboard-resizable divider between the two sides (role=separator, arrow
 * keys step the ratio).
 *
 * Drag follows the PiUI model: while dragging, the divider writes the grid
 * template directly on the DOM element (no store traffic per move, so large
 * conversation trees do not re-render); on release it commits the final
 * ratio to the store once. The divider's hit area extends past its 6px
 * visual gap (generous negative margins), and the ratio clamps to [0.1, 0.9]
 * so a pane can never collapse to zero.
 */
import { type KeyboardEvent, type ReactNode, useRef } from 'react'
import type { PaneNode } from './pane-layout-store.ts'
import { MAX_RATIO, MIN_RATIO } from './pane-layout-store.ts'
import css from './SplitContainer.module.css'

const STEP = 0.05
/** Visual gap between panes in px (PiUI parity). */
const SPLIT_GAP = 6
/** Extra invisible hit area on each side of the divider for easier grabbing. */
const HIT_EXTEND = 4

/** Build a CSS grid-template value like "49.5fr 6px 50.5fr". */
function buildGridTemplate(ratio: number): string {
  const r = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio))
  return `${r}fr ${SPLIT_GAP}px ${1 - r}fr`
}

/**
 * Render the pane tree as nested grids with labeled dividers.
 * @param node - the tree node to render.
 * @param dividerLabel - accessible divider label (also the keyboard hint).
 * @param onSetRatio - ratio commit (drag end / keyboard step).
 * @param renderLeaf - leaf renderer.
 * @returns the nested split surface.
 */
export function SplitContainer(props: {
  node: PaneNode
  dividerLabel: string
  onSetRatio: (splitId: string, ratio: number) => void
  renderLeaf: (leaf: Extract<PaneNode, { type: 'leaf' }>) => ReactNode
}) {
  if (props.node.type === 'leaf') return <>{props.renderLeaf(props.node)}</>
  const { node, dividerLabel, onSetRatio, renderLeaf } = props
  return (
    <div className={css.host} data-direction={node.direction}>
      <SplitView
        node={node}
        dividerLabel={dividerLabel}
        onSetRatio={onSetRatio}
        renderLeaf={renderLeaf}
      />
    </div>
  )
}

function SplitView(props: {
  node: Extract<PaneNode, { type: 'split' }>
  dividerLabel: string
  onSetRatio: (splitId: string, ratio: number) => void
  renderLeaf: (leaf: Extract<PaneNode, { type: 'leaf' }>) => ReactNode
}) {
  const { node, dividerLabel, onSetRatio, renderLeaf } = props
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef<boolean>(false)
  const isHorizontal = node.direction === 'horizontal'

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) return
    const container = containerRef.current
    if (container === null) return
    event.preventDefault()
    dragging.current = true
    const splitId = node.id
    // The container does not move during a drag, so capture the geometry once.
    const rect = container.getBoundingClientRect()
    const base = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }

    const apply = (clientX: number, clientY: number) => {
      const size = isHorizontal ? base.width : base.height
      if (size === 0) return
      const offset = isHorizontal ? clientX - base.left : clientY - base.top
      const ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, offset / size))
      // Write the grid directly during the drag: no store traffic per move.
      const tpl = buildGridTemplate(ratio)
      if (isHorizontal) container.style.gridTemplateColumns = tpl
      else container.style.gridTemplateRows = tpl
    }

    const onMove = (moveEvent: PointerEvent) => { apply(moveEvent.clientX, moveEvent.clientY) }
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dragging.current = false
      // Clear the inline override, then commit the final ratio once.
      container.style.gridTemplateColumns = ''
      container.style.gridTemplateRows = ''
      const size = isHorizontal ? base.width : base.height
      if (size > 0) {
        const offset = isHorizontal ? upEvent.clientX - base.left : upEvent.clientY - base.top
        onSetRatio(splitId, Math.min(MAX_RATIO, Math.max(MIN_RATIO, offset / size)))
      }
    }

    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const delta = (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) * STEP
    onSetRatio(node.id, node.ratio + delta)
  }

  const gridTemplate = buildGridTemplate(node.ratio)
  const hitSize = SPLIT_GAP + HIT_EXTEND * 2
  const negMargin = -(hitSize + SPLIT_GAP) / 2

  return (
    <div
      ref={containerRef}
      className={css.split}
      data-direction={node.direction}
      style={isHorizontal
        ? { gridTemplateColumns: gridTemplate, gridTemplateRows: '1fr' }
        : { gridTemplateRows: gridTemplate, gridTemplateColumns: '1fr' }}
    >
      <div className={css.paneSide}>
        {node.first.type === 'split'
          ? (
            <SplitView
              node={node.first}
              dividerLabel={dividerLabel}
              onSetRatio={onSetRatio}
              renderLeaf={renderLeaf}
            />
          )
          : renderLeaf(node.first)}
      </div>
      <div
        className={css.divider}
        role="separator"
        aria-label={dividerLabel}
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-valuemin={Math.round(MIN_RATIO * 100)}
        aria-valuemax={Math.round(MAX_RATIO * 100)}
        aria-valuenow={Math.round(node.ratio * 100)}
        tabIndex={0}
        style={isHorizontal
          ? { width: hitSize, marginLeft: negMargin, marginRight: negMargin }
          : { height: hitSize, marginTop: negMargin, marginBottom: negMargin }}
        onPointerDown={startDrag}
        onKeyDown={onKeyDown}
      />
      <div className={css.paneSide}>
        {node.second.type === 'split'
          ? (
            <SplitView
              node={node.second}
              dividerLabel={dividerLabel}
              onSetRatio={onSetRatio}
              renderLeaf={renderLeaf}
            />
          )
          : renderLeaf(node.second)}
      </div>
    </div>
  )
}
