/** What does a given dsh web instance actually render? (version-agnostic DOM dump) */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const logs = []
page.on('console', (m) => { if (m.type() !== 'log') logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 400)}`))
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(8000)

const dump = await page.evaluate(() => ({
  title: document.title,
  bodyLength: document.body.textContent?.trim().length ?? 0,
  bodyHead: (document.body.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 300),
  slotAnchors: [...document.querySelectorAll('[data-slot]')].map(el => el.getAttribute('data-slot')).slice(0, 25),
  treeitems: document.querySelectorAll('[role="treeitem"]').length,
  buttons: [...document.querySelectorAll('button')].map(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim()).filter(Boolean).slice(0, 25),
  rootChildren: [...(document.getElementById('root')?.children ?? [])].map(el => `${el.tagName}.${[...el.classList].join('.')}`),
  bootGlobal: typeof window.__DSH_BOOT__,
}))
console.log(JSON.stringify(dump, null, 2))
await page.screenshot({ path: new URL('./shots/dom012.png', import.meta.url).pathname.replace(/^\//, '') })
console.log('--- console ---')
console.log(logs.join('\n') || '(none)')
await browser.close()
