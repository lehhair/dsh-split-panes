// @vitest-environment node
/**
 * The blank pane's bar is the stock header's seat, with the stock header's rows.
 *
 * A blank session has no stock header — the core hides it — so the plugin draws
 * that seat itself: the split H/V / fullscreen / close icons, no title. Its row
 * metrics are what line those icons up with the session pane's next to them.
 *
 * It used to be a 32px bar with a `--pane-pad-top` variable that `.pane`
 * overrode to 3px, which sat its content 6px above the session pane's row.
 *
 * Expected values are read out of the core's own stylesheet, so upstream header
 * changes fail here rather than silently misaligning the panes.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const CORE_CSS = `${root}../dsh2026/deepseek-harness/packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css`
const PANE_CSS = `${root}src/client/PaneWorkspace.module.css`

/**
 * The declaration block of one selector, without the braces. The selector must
 * start a line, so `.heroHeader` never matches a `.host .pane .heroHeader`
 * override that also contains the name.
 */
function block(css: string, selector: string): string {
  const match = new RegExp(`(?:^|\\n)${selector.replace(/[.[\]()>]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)
  if (match?.[1] === undefined) throw new Error(`selector ${selector} not found`)
  return match[1]
}

/** One declaration's value (first occurrence inside the block). */
function prop(css: string, name: string): string {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css)
  if (match?.[1] === undefined) throw new Error(`property ${name} not found in: ${css.trim()}`)
  return match[1].trim()
}

/** The top inset, whether the block writes `padding` or `padding-top`. */
function insetTop(css: string): string {
  const shorthand = /(?:^|\s)padding:\s*([^;]+);/.exec(css)
  return shorthand?.[1] !== undefined ? (shorthand[1].trim().split(/\s+/)[0] ?? '') : prop(css, 'padding-top')
}

const core = readFileSync(CORE_CSS, 'utf8')
const pane = readFileSync(PANE_CSS, 'utf8')
const bare = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('the blank pane title bar', () => {
  const nativeHeader = block(core, '.header')
  const nativeTitleRow = block(core, '.titleRow')
  const hero = block(pane, '.heroHeader')

  it('opens at the core header top inset, on the core title row height', () => {
    // 10px + a 30px row is what puts the icons on the same line as the stock
    // header's actions — the position is the alignment, not decoration.
    expect(insetTop(hero)).toBe(insetTop(nativeHeader))
    expect(prop(hero, 'min-height')).toBe(prop(nativeTitleRow, 'min-height'))
  })

  it('pushes the icon row to the trailing edge, like the stock actions row', () => {
    expect(hero).toContain('justify-content: flex-end')
  })

  it('has no title and no pane-scoped padding override left over', () => {
    // The regression: `.pane { --pane-pad-top: 3px }` + `padding: var(...)`.
    expect(bare(pane)).not.toContain('--pane-pad-top')
    expect(hero).not.toContain('var(')
    // The bar is icon-only: its title rule is gone.
    expect(bare(pane)).not.toContain('.heroTitle')
  })
})
