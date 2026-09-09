/**
 * Verify (a) header-title alignment with dsh-home-ui in split panes
 * (padding-top must be 12px inside panes, 20px standalone) and
 * (b) fullscreen hides the focus border.
 *
 * Usage: node .dev/align-probe.mjs <url-with-token> <label>
 */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const label = process.argv[3] ?? 'align'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const logs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 250)}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 250)}`))

const headers = () => page.evaluate(() => {
  const center = document.querySelector('[class*="centerCol"]') ?? document.body
  const panes = [...center.querySelectorAll('*')]
    .filter(el => [...el.classList].some(c => c.endsWith('_pane')))
  const read = (el) => {
    const header = el.querySelector('header')
    const nav = header?.querySelector('nav') ?? header?.querySelector('button')
    const navBox = nav?.getBoundingClientRect()
    return {
      headerPaddingTop: header === null ? null : getComputedStyle(header).paddingTop,
      headerTop: header === null ? null : Math.round(header.getBoundingClientRect().top),
      navCenter: nav === null ? null : Math.round((navBox?.top ?? 0) + (navBox?.height ?? 0) / 2),
      borderColor: getComputedStyle(el).borderTopColor,
    }
  }
  return {
    panes: panes.map(p => ({...read(p), fullscreen: p.hasAttribute('data-fullscreen'), focused: p.hasAttribute('data-focused')})),
    // Sidebar's top control line, for comparison.
    sidebarControls: (() => {
      const sidebar = document.querySelector('[data-slot="sidebar"]')
      const row = sidebar?.querySelector('[class*="controls"], [class*="header"], [class*="topbar"]')
      const box = row?.getBoundingClientRect()
      return box === undefined || box === null ? null : Math.round(box.top + box.height / 2)
    })(),
    homeUiActive: document.querySelector('[data-dsh-home-ui]') !== null,
  }
})

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-slot="root"]', { timeout: 60000 })
await page.waitForTimeout(5000)
await page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: '你好' }).first().click()
await page.waitForTimeout(2500)

console.log('single pane:', JSON.stringify(await headers()))

await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
await page.waitForTimeout(2000)
console.log('split panes:', JSON.stringify(await headers()))
await page.screenshot({ path: new URL(`./shots/${label}-split.png`, import.meta.url).pathname.replace(/^\//, '') })

// Fullscreen the FIRST pane (dispatch click: live sessions re-layout constantly).
await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="窗格全屏"]:visible, [aria-label="窗格全屏"]:visible').first()
  .evaluate(el => el.click())
await page.waitForTimeout(2000)
console.log('fullscreen:', JSON.stringify(await headers()))
await page.screenshot({ path: new URL(`./shots/${label}-fullscreen.png`, import.meta.url).pathname.replace(/^\//, '') })
await page.keyboard.press('Escape')
await page.waitForTimeout(1500)

console.log('--- console ---')
console.log(logs.join('\n') || '(none)')
await browser.close()