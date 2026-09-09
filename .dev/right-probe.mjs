/** Does the right sidebar (ui-sidebar-right) work? A/B against the plugin. */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const label = process.argv[3] ?? 'right'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const logs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 250)}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 250)}`))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-slot="root"]', { timeout: 60000 })
await page.waitForTimeout(5000)
await page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: '你好' }).first().click()
await page.waitForTimeout(3000)

const state = () => page.evaluate(() => {
  const right = document.querySelector('[data-slot="rightbar"]')
  const corner = document.querySelector('[data-slot="conversation.session.header.corner"]')
  return {
    rightbarSlot: right !== null,
    rightbarRect: right === null ? null : (() => {
      const b = right.getBoundingClientRect(); return `${Math.round(b.x)},${Math.round(b.width)}x${Math.round(b.height)}`
    })(),
    rightbarText: (right?.textContent ?? '').trim().slice(0, 80),
    rightbarHtml: (right?.innerHTML ?? '').slice(0, 200),
    cornerButtons: [...(corner?.querySelectorAll('button') ?? [])].map(b => b.getAttribute('aria-label') ?? b.textContent?.trim()),
    headerCorner: corner !== null,
  }
})

console.log('before:', JSON.stringify(await state(), null, 2))
const toggle = page.locator('[data-slot="conversation.session.header.corner"] button').first()
if (await toggle.count() > 0) {
  await toggle.click()
  await page.waitForTimeout(2500)
  console.log('after toggle:', JSON.stringify(await state(), null, 2))
  await page.screenshot({ path: new URL(`./shots/${label}-right-open.png`, import.meta.url).pathname.replace(/^\//, '') })
} else {
  console.log('no corner toggle button found')
}
console.log('--- console ---')
console.log(logs.join('\n') || '(none)')
await browser.close()
