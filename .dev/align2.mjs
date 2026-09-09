/**
 * Measure header-title-line vs side-bar first-row alignment precisely.
 * Prints: sidebar first button center-Y, each pane header nav center-Y,
 * and the delta (smaller |delta| = better aligned).
 */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const label = process.argv[3] ?? 'align'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

const measure = () => page.evaluate(() => {
  const center = document.querySelector('[class*="centerCol"]') ?? document.body
  const sidebar = document.querySelector('[data-slot="sidebar"]')
  // The LOGO / word-mark line: the side-bar's topmost content (the home-ui
  // comment describes 6px shell padding + 60px logo row). Grab every element
  // that has text or an svg in the top 90px and take the highest one with a
  // non-trivial height.
  const candidates = [...(sidebar?.querySelectorAll('*') ?? [])].filter(el => {
    const box = el.getBoundingClientRect()
    if (box.width < 10 || box.height < 8) return false
    if (box.top < 0 || box.top > 90) return false
    const text = (el.textContent ?? '').trim()
    const hasSvg = el.querySelector(':scope svg, :scope img') !== null
    return (text.length > 0 || hasSvg) && el.childElementCount > 0
  })
  const top = candidates.sort((a, b) => {
    const ab = a.getBoundingClientRect(); const bb = b.getBoundingClientRect()
    return ab.top === bb.top ? (ab.height < bb.height ? -1 : 1) : ab.top - bb.top
  })[0]
  const logoBox = top?.getBoundingClientRect()
  const logoCenter = logoBox === undefined ? null : Math.round(logoBox.top + logoBox.height / 2)
  const sbBox = logoBox
  const sbCenter = logoCenter
  const sbTop = logoBox === undefined ? null : Math.round(logoBox.top)
  const sidebarCollapsed = document.querySelector('[class*="frame"]')?.getAttribute('data-sidebar-collapsed') === ''

  const panes = [...center.querySelectorAll('*')]
    .filter(el => [...el.classList].some(c => c.endsWith('_pane')))
  // In the single-pane state there is no pane frame; measure the conversation
  // column's own header.
  const conversationHeader = center.querySelector('[data-slot="conversation.session.header"] header')
  const nh = conversationHeader?.querySelector('nav button, button')
  const nhBox = nh?.getBoundingClientRect()
  const singleHeader = conversationHeader === null || nhBox === undefined
    ? null
    : {
      box: `${Math.round(nhBox.top)}..${Math.round(nhBox.top + nhBox.height)}`,
      center: Math.round(nhBox.top + nhBox.height / 2),
      paddingTop: getComputedStyle(conversationHeader).paddingTop,
    }

  const headers = panes.map((el) => {
    const navBtn = [...(el.querySelectorAll('header nav button, header button'))]
      .sort((a, b) => (a.getBoundingClientRect().top) - (b.getBoundingClientRect().top))[0]
    const box = navBtn?.getBoundingClientRect()
    return {
      fullscreen: el.hasAttribute('data-fullscreen'),
      box: box === undefined ? null : `${Math.round(box.top)}..${Math.round(box.top + box.height)}`,
      center: box === undefined ? null : Math.round(box.top + box.height / 2),
      paddingTop: el.querySelector('header') === null ? null : getComputedStyle(el.querySelector('header')).paddingTop,
    }
  })
  return {
    sidebar: { top: sbTop, center: sbCenter, collapsed: sidebarCollapsed, text: (top?.textContent ?? '').trim().slice(0, 20), count: candidates.length },
    single: singleHeader,
    headers,
    deltas: headers.map(h => h.center === null || sbCenter === null ? null : h.center - sbCenter),
    singleDelta: singleHeader === null || sbCenter === null ? null : singleHeader.center - sbCenter,
  }
})

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-slot="root"]', { timeout: 60000 })
await page.waitForTimeout(5000)
await page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: '你好' }).first().click()
await page.waitForTimeout(2500)

console.log(`[${label}] single pane:`, JSON.stringify(await measure()))
await page.screenshot({ path: new URL(`./shots/${label}-single.png`, import.meta.url).pathname.replace(/^\//, '') })

await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
await page.waitForTimeout(2000)
console.log(`[${label}] split panes:`, JSON.stringify(await measure()))
await page.screenshot({ path: new URL(`./shots/${label}-split.png`, import.meta.url).pathname.replace(/^\//, '') })

await browser.close()