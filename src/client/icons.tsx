/** Local pane-chrome icons (16px, currentColor) — no new icon imports needed. */
import type { IconProps } from '@deepseek-ai/dsh-client-ui-primitives'

/** Split side-by-side: a frame with a vertical center line. */
export function IconSplitHorizontal16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2.5v11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

/** Split stacked: a frame with a horizontal center line. */
export function IconSplitVertical16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 8h13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

/** Enter fullscreen: corner arrows pointing outward. */
export function IconFullscreen16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Leave fullscreen: corner arrows pointing inward. */
export function IconFullscreenExit16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 6H6V2.5M13.5 6H10V2.5M2.5 10H6v3.5M13.5 10H10v3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
