/**
 * Reproduce: in a SPLIT state, starting a new conversation must rebind the
 * focused pane. Tries both side-bar entries (the top "new session" button and
 * a workspace row's "new session in <workspace>" button).
 *
 * Usage: node .dev/newchat-probe.mjs <url-with-token>
 */
import { chromium } from 'file:///E:/dev/dsh2026/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const logs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`))

const state = () => page.evaluate(() => {
  const center = document.querySelector('[class*="centerCol"]') ?? document.body
  const panes = [...center.querySelectorAll('*')]
    .filter(el => [...el.classList].some(c => c.endsWith('_pane')))
  const selected = document.querySelector('[data-slot="sidebar"] [role="treeitem"][aria-selected="true"], [data-slot="sidebar"] [role="treeitem"][data-selected]')
  return {
    panes: panes.map(el => ({
      focused: el.hasAttribute('data-focused'),
      crumbs: [...el.querySelectorAll('header nav button')].map(b => (b.textContent ?? '').trim()).filter(Boolean),
      hero: el.querySelector('header nav button') === null,
      heroTitle: (el.querySelector('[class*="heroTitle"]')?.textContent ?? '').trim(),
      composerPlaceholder: (el.querySelector('[contenteditable="true"]')?.getAttribute('data-placeholder') ?? '').slice(0, 24),
    })),
    selected: (selected?.textContent ?? '').trim().slice(0, 30),
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
console.log('after split:', JSON.stringify(await state(), null, 1))

console.log('--- focus the pane that HAS a session ---')
await page.locator('[class*="centerCol"] [class*="_pane"]').first().click({ position: { x: 250, y: 400 } })
await page.waitForTimeout(2000)
console.log('focused pane with session:', JSON.stringify(await state(), null, 1))

console.log('--- click the side-bar "new session" button ---')
await page.locator('[data-slot="sidebar"] button', { hasText: '新会话' }).first().click()
await page.waitForTimeout(6000)
console.log('after top button:', JSON.stringify(await state(), null, 1))
await page.screenshot({ path: new URL('./shots/newchat-top.png', import.meta.url).pathname.replace(/^\//, '') })

console.log('--- click the same button again ---')
await page.locator('[data-slot="sidebar"] button', { hasText: '新会话' }).first().click()
await page.waitForTimeout(5000)
console.log('after second click:', JSON.stringify(await state(), null, 1))

console.log('--- click a workspace row new-session button ---')
const rowButton = page.locator('[data-slot="sidebar"] button[aria-label*="中新建会话"]').first()
if (await rowButton.count() > 0) {
  console.log('workspace row button label:', await rowButton.getAttribute('aria-label'))
  await rowButton.click()
  await page.waitForTimeout(6000)
  console.log('after workspace button:', JSON.stringify(await state(), null, 1))
  await page.screenshot({ path: new URL('./shots/newchat-ws.png', import.meta.url).pathname.replace(/^\//, '') })
} else {
  console.log('no workspace row new-session button found')
}

console.log('--- console ---')
console.log(logs.join('\n') || '(none)')
await browser.close()
