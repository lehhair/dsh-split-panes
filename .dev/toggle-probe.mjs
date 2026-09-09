/** Why is a fullscreen toggle not clickable in a 3-pane state? Dump all matches. */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-slot="root"]', { timeout: 60000 })
await page.waitForTimeout(5000)
await page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: '你好' }).first().click()
await page.waitForTimeout(2500)
await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
await page.waitForTimeout(2000)
await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
await page.waitForTimeout(2500)

const dump = await page.evaluate(() => {
  const center = document.querySelector('[class*="centerCol"]') ?? document.body
  const panes = [...center.querySelectorAll('*')].filter(el => [...el.classList].some(c => c.endsWith('_pane')))
  return {
    panes: panes.map(pane => {
      const box = pane.getBoundingClientRect()
      const header = pane.querySelector('header')
      return {
        rect: `${Math.round(box.x)} ${Math.round(box.width)}x${Math.round(box.height)}`,
        headerHidden: header?.getAttribute('aria-hidden') ?? null,
        headerBox: header === null ? null : (() => { const b = header.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)}` })(),
        heroTitle: (pane.querySelector('[class*="heroTitle"]')?.textContent ?? '').trim(),
        toggles: [...pane.querySelectorAll('[aria-label="窗格全屏"], [aria-label="退出全屏"]')].map(b => {
          const r = b.getBoundingClientRect()
          const style = getComputedStyle(b)
          return {
            cls: [...b.classList].join(' '),
            slot: b.closest('[data-slot]')?.getAttribute('data-slot'),
            rect: `${Math.round(r.width)}x${Math.round(r.height)}`,
            display: style.display,
            visibility: style.visibility,
          }
        }),
      }
    }),
  }
})
console.log(JSON.stringify(dump, null, 1))
await browser.close()
