/**
 * Drop-zone overlay for session drag & drop (PiUI parity): while a session is
 * dragged over a pane, a ref-driven leaf overlay highlights the drop target —
 * the CENTER rectangle replaces the pane's session, the four EDGE halves
 * split to that side. The overlay owns its zone state so high-frequency
 * dragover events never re-render the expensive pane subtree; the pane calls
 * `setZone` through an imperative handle.
 */
import { forwardRef, memo, useImperativeHandle, useState } from 'react'
import type { ReactNode } from 'react'
import css from './PaneDropOverlay.module.css'

/** The five drop targets: the center rectangle or one of the four edges. */
export type DropZone = 'top' | 'bottom' | 'left' | 'right' | 'center'

/** Imperative handle the pane uses to update the highlight without re-rendering. */
export interface PaneDropOverlayHandle {
  setZone(zone: DropZone | null): void
}

/** Inner half-size of the central hit zone, normalized (40% x 40% area). */
export const PANE_CENTER_HALF = 0.2

/**
 * Resolve which drop zone a normalized point inside a pane falls into.
 * @param xRel - normalized X relative to the pane, 0-1.
 * @param yRel - normalized Y relative to the pane, 0-1.
 * @returns the zone, or null outside the pane.
 */
export function resolveDropZone(xRel: number, yRel: number): DropZone | null {
  if (xRel < 0 || xRel > 1 || yRel < 0 || yRel > 1) return null
  // The center rectangle wins first (replace the pane's session).
  if (Math.abs(xRel - 0.5) < PANE_CENTER_HALF && Math.abs(yRel - 0.5) < PANE_CENTER_HALF) {
    return 'center'
  }
  // Otherwise split to the closest edge by normalized distance.
  const dLeft = xRel
  const dRight = 1 - xRel
  const dTop = yRel
  const dBottom = 1 - yRel
  const min = Math.min(dLeft, dRight, dTop, dBottom)
  if (min === dLeft) return 'left'
  if (min === dRight) return 'right'
  if (min === dTop) return 'top'
  return 'bottom'
}

/** The overlay itself: pointer-transparent so it never blocks pane clicks. */
export const PaneDropOverlay = forwardRef<PaneDropOverlayHandle>(function PaneDropOverlay(_props, ref) {
  const [zone, setZone] = useState<DropZone | null>(null)
  useImperativeHandle(
    ref,
    () => ({
      setZone(next: DropZone | null) {
        setZone(prev => (prev === next ? prev : next))
      },
    }),
    [],
  )
  return zone === null ? null : <DropZoneVisual zone={zone} />
})

/** The pure highlight: center box or edge half, brand blue, 150ms morph. */
const DropZoneVisual = memo(function DropZoneVisual({ zone }: { zone: DropZone }) {
  const area: ReactNode = (() => {
    switch (zone) {
      case 'center':
        return <div className={css.center} />
      case 'left':
        return <div className={css.left} />
      case 'right':
        return <div className={css.right} />
      case 'top':
        return <div className={css.top} />
      case 'bottom':
        return <div className={css.bottom} />
    }
  })()
  return <div className={css.layer} data-drop-zone={zone}>{area}</div>
})
