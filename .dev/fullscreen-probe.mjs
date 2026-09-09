/** Fullscreen toggle: split → fullscreen the focused pane → Escape back. */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const logs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`))

const facts = () => page.evaluate(() => {
  const center = document.querySelector('[class*="centerCol"]') ?? document.body
  const panes = [...center.querySelectorAll('*')].filter(el => [...el.classList].some(c => c.endsWith('_pane')))
  return {
    panes: panes.map(el => ({
      focused: el.hasAttribute('data-focused'),
      fullscreen: el.hasAttribute('data-fullscreen'),
      rect: (() => { const b = el.getBoundingClientRect(); return `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}` })(),
      crumbs: [...el.querySelectorAll('header nav button')].map(b => (b.textContent ?? '').trim()).filter(Boolean),
      hero: el.querySelector('header nav button') === null,
    })),
    separators: center.querySelectorAll('[role="separator"]').length,
    crashFaces: center.querySelectorAll('[data-slot-error]').length,
  }
})

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-slot="root"]', { timeout: 60000 })
await page.waitForTimeout(5000)
await page.locator('[data-slot="sidebar"] [role="treeitem"]', { hasText: '你好' }).first().click()
await page.waitForTimeout(2500)
await page.locator('[data-slot="conversation.session.header.actions"] [aria-label="分屏"]').first().click()
await page.waitForTimeout(2500)
console.log('split:', JSON.stringify(await facts()))

const button = page.locator('[data-slot="conversation.session.header.actions"] [aria-label="窗格全屏"]').first()
console.log('button count:', await button.count())
console.log('button visible:', await button.isVisible().catch(e => `ERR ${e.message.split('\n')[0]}`))
try {
  await button.click({ timeout: 8000 })
} catch (error) {
  console.log('CLICK FAILED:', String(error).slice(0, 900))
}
await page.waitForTimeout(2000)
console.log('after fullscreen:', JSON.stringify(await facts()))
await page.screenshot({ path: new URL('./shots/fs-full.png', import.meta.url).pathname.replace(/^\//, '') })

await page.keyboard.press('Escape')
await page.waitForTimeout(2000)
console.log('after escape:', JSON.stringify(await facts()))
await page.screenshot({ path: new URL('./shots/fs-exit.png', import.meta.url).pathname.replace(/^\//, '') })
console.log('--- console ---')
console.log(logs.join('\n') || '(none)')
await browser.close()
