/** Dump the pane headers' buttons (fullscreen affordance check). */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const logs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-slot="root"]', { timeout: 60000 })
await page.waitForTimeout(5000)
await page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: '你好' }).first().click()
await page.waitForTimeout(2500)
await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
await page.waitForTimeout(2500)

const dump = await page.evaluate(() => {
  const center = document.querySelector('[class*="centerCol"]') ?? document.body
  const panes = [...center.querySelectorAll('*')].filter(el => [...el.classList].some(c => c.endsWith('_pane')))
  return {
    panes: panes.map(pane => ({
      buttons: [...pane.querySelectorAll('button')].map(b => ({
        label: b.getAttribute('aria-label'),
        slot: b.closest('[data-slot]')?.getAttribute('data-slot'),
        pressed: b.getAttribute('aria-pressed'),
      })),
      headerActions: [...pane.querySelectorAll('[data-slot="conversation.session.header.actions"]')].length,
      heroActions: [...pane.querySelectorAll('[class*="heroActions"]')].length,
    })),
    crash: [...center.querySelectorAll('[data-slot-error]')].map(el => el.getAttribute('data-slot-error')),
  }
})
console.log(JSON.stringify(dump, null, 1))
console.log('--- console ---')
console.log(logs.join('\n') || '(none)')
await browser.close()
