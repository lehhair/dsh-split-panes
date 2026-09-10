/**
 * Local pane-chrome icons — same glyphs as the official right-side-bar
 * chrome (ui-sidebar-right's FullscreenGlyph / ExitFullscreenGlyph and
 * ui-dockkit's SplitGlyph), inlined verbatim so the split panes never read as
 * a different visual language. currentColor; no external icon imports.
 */
import type { IconProps } from '@deepseek-ai/dsh-client-ui-primitives'

/**
 * Split side-by-side: the official dockkit SplitGlyph (a frame with a
 * vertical center line) at the header button's 16px size.
 */
export function IconSplitHorizontal16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="currentColor" />
      <path d="M7 2v10" stroke="currentColor" />
    </svg>
  )
}

/**
 * Split stacked (vertical split): the official dockkit SplitGlyph rotated a
 * quarter turn — the same line weight and corner radius, so the two split
 * controls read as one family.
 */
export function IconSplitVertical16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <g transform="rotate(90 7 7)">
        <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="currentColor" />
        <path d="M7 2v10" stroke="currentColor" />
      </g>
    </svg>
  )
}

/** Expand-to-viewport glyph (ui-sidebar-right's FullscreenGlyph). */
export function IconFullscreen16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 1.5H1.5V5M9 1.5h3.5V5M1.5 9v3.5H5M12.5 9v3.5H9" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

/** Restore-from-fullscreen glyph: ui-sidebar-right's ExitFullscreenGlyph. */
export function IconFullscreenExit16(props: IconProps) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 5H5V1.5M9 1.5V5h3.5M1.5 9H5v3.5M9 12.5V9h3.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}