// @vitest-environment node
/**
 * The blank pane's title bar must place its title exactly where the stock header
 * places its own.
 *
 * A blank session has no stock header — the core hides it — so the plugin draws
 * that seat itself. It used to be a 32px bar whose top padding was a
 * `--pane-pad-top` variable that `.pane` overrode to 3px, which sat the
 * "new conversation" title 6px higher than the session title in the pane next to
 * it, 2px taller, and 8px further left.
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
  const nativeTitle = block(core, '.crumb')
  const nativeTitleCurrent = block(core, '.crumbCurrent')
  const hero = block(pane, '.heroHeader')
  const heroTitle = block(pane, '.heroTitle')

  it('opens at the core header top inset, on the core title row height', () => {
    // 10px + 30px puts the title's centre 25px below the header's top, in the
    // single full-bleed surface and inside a split pane alike.
    expect(insetTop(hero)).toBe(insetTop(nativeHeader))
    expect(prop(hero, 'min-height')).toBe(prop(nativeTitleRow, 'min-height'))
  })

  it('draws the title with the core crumb box and typography', () => {
    expect(prop(heroTitle, 'font-size')).toBe(prop(nativeTitle, 'font-size'))
    expect(prop(heroTitle, 'line-height')).toBe(prop(nativeTitle, 'line-height'))
    // The current crumb is the one carrying the weight the title uses.
    expect(prop(heroTitle, 'font-weight')).toBe(prop(nativeTitleCurrent, 'font-weight'))
    // The 8px left padding is what lines the text up with the stock title.
    expect(prop(heroTitle, 'padding')).toBe(prop(nativeTitle, 'padding'))
  })

  it('has no pane-scoped padding override left over', () => {
    // The regression: `.pane { --pane-pad-top: 3px }` + `padding: var(...)`.
    expect(bare(pane)).not.toContain('--pane-pad-top')
    expect(hero).not.toContain('var(')
  })
})
