/**
 * Split-pane interaction scenarios against a running dsh web instance.
 *
 * Drives the real UI in Chromium and asserts the behaviours this plugin
 * exists for: split, focus-follows-selection, pane-click follows the global
 * selection, side-bar drag & drop, and starting a conversation in a
 * placeholder pane. Every step captures a screenshot plus the DOM facts that
 * reveal render corruption (occupant crash faces, composer count, header).
 *
 * Usage: node .dev/scenario.mjs <url-with-token> [label]
 *
 * Playwright resolves from the local core checkout (this repo has no browser
 * dependency of its own); point PLAYWRIGHT_PATH at any playwright install.
 */
import { mkdirSync } from 'node:fs'

const PW = process.env.PLAYWRIGHT_PATH
  ?? 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const { chromium } = await import(PW)

const url = process.argv[2]
const label = process.argv[3] ?? 'run'
if (url === undefined) {
  console.error('usage: node .dev/scenario.mjs <url-with-token> [label]')
  process.exit(1)
}
/** Session titles are instance-specific; override per run when needed. */
const SESSION_A = process.env.SESSION_A ?? '你好'
const SESSION_B = process.env.SESSION_B ?? 'DeepSeek Harness 分屏扩展适配研究'
const SESSION_C = process.env.SESSION_C ?? '分屏渲染问题与dsh扩展'
const WORKSPACE = process.env.WORKSPACE ?? 'dsh-split-panes'
const SHOTS = new URL('./shots/', import.meta.url).pathname.replace(/^\//, '')
mkdirSync(SHOTS, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const logs = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`)
})
page.on('pageerror', (e) => { logs.push(`[pageerror] ${e.message.slice(0, 300)}`) })

/** Per-pane DOM facts (the plugin's frames are the `<hash>_pane` class). */
const facts = () => page.evaluate(() => {
  const center = document.querySelector('[class*="centerCol"]') ?? document.body
  const panes = [...center.querySelectorAll('*')]
    .filter(el => [...el.classList].some(c => c.endsWith('_pane')))
  return {
    panes: panes.map(el => ({
      focused: el.hasAttribute('data-focused'),
      rect: (() => { const b = el.getBoundingClientRect(); return `${Math.round(b.x)},${Math.round(b.width)}` })(),
      crumbs: [...el.querySelectorAll('header nav button')].map(b => (b.textContent ?? '').trim()).filter(Boolean),
      hero: el.querySelector('header nav button') === null,
      composers: el.querySelectorAll('[data-slot="conversation.composer.bar"]').length,
      editables: el.querySelectorAll('[contenteditable="true"]').length,
      crashFaces: el.querySelectorAll('[data-slot-error]').length,
    })),
    crashFaces: center.querySelectorAll('[data-slot-error]').length,
    syntheticRoots: center.querySelectorAll('[data-slot="root"]').length,
    separators: center.querySelectorAll('[role="separator"]').length,
  }
})

const steps = []
const run = async (name, fn) => {
  steps.push(`--- ${name}`)
  try { await fn() } catch (e) { steps.push(`STEP FAILED: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`) }
}
const snap = async (name) => {
  await page.screenshot({ path: `${SHOTS}/${label}-${name}.png` })
  steps.push(JSON.stringify(await facts(), null, 2))
}
const clickSession = async (title) => {
  await page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: title }).first().click()
  await page.waitForTimeout(2500)
}
const paneAt = (index) => page.locator('[class*="centerCol"] [class*="_pane"]').nth(index)

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-slot="root"]', { timeout: 60000 })
await page.waitForTimeout(5000)

await run('1 open a session (single pane, native chrome)', async () => {
  await clickSession(SESSION_A)
  await snap('1-session')
})

await run('2 split via the header button (new pane = placeholder)', async () => {
  await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
  await page.waitForTimeout(2500)
  await snap('2-split')
})

await run('3 side-bar switch binds the FOCUSED pane', async () => {
  await clickSession(SESSION_B)
  await snap('3-switch')
})

await run('4 clicking the first pane focuses it and follows it globally', async () => {
  await paneAt(0).click({ position: { x: 250, y: 400 } })
  await page.waitForTimeout(2500)
  await snap('4-focus-first')
})

await run('5 drag a side-bar session onto a pane centre (replace)', async () => {
  const source = page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: SESSION_C }).first()
  await source.dragTo(paneAt(0), { targetPosition: { x: 250, y: 400 } })
  await page.waitForTimeout(3000)
  await snap('5-drag-replace')
})

await run('6 start a conversation inside a placeholder pane', async () => {
  // Split again so a fresh placeholder exists, then pick a workspace in it.
  await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
  await page.waitForTimeout(2500)
  const hero = page.locator('[class*="centerCol"] [class*="_pane"]')
    .filter({ has: page.getByText('选择工作区') }).last()
  await hero.locator('button', { hasText: '选择工作区' }).first().click()
  await page.waitForTimeout(1200)
  await page.locator('[role="menuitem"]').filter({ hasText: WORKSPACE }).first().click()
  await page.waitForTimeout(6000)
  await snap('6-new-in-placeholder')
})

console.log(steps.join('\n'))
console.log('--- console ---')
console.log(logs.join('\n') || '(none)')
await browser.close()

