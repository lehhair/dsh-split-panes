// @vitest-environment node
/**
 * Vendor drift guard: the pane renderer is the core's own slot renderer,
 * copied verbatim (see src/client/vendor/renderer/README.md). When upstream
 * changes it, this test fails instead of letting panes silently diverge from
 * the shell's rendering semantics.
 *
 * Fix by running: node scripts/sync-renderer-vendor.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const core = fileURLToPath(new URL('../../dsh2026/deepseek-harness/packages/client/ui-renderer/src/client/', import.meta.url))
const vendored = fileURLToPath(new URL('../src/client/vendor/renderer/', import.meta.url))

const FILES = ['bind.ts', 'bindings.tsx', 'scoped-slots.tsx'] as const

describe('vendored core renderer', () => {
  it.each(FILES)('%s is byte-identical to the core source', (file) => {
    const upstream = readFileSync(`${core}${file}`, 'utf8')
    const copy = readFileSync(`${vendored}${file}`, 'utf8')
    expect(copy).toBe(upstream)
  })

  it('exposes the renderer product the pane host drives', async () => {
    const module = await import('../src/client/vendor/renderer/scoped-slots.tsx')
    const renderer = module.createSlotRenderer()
    expect(typeof renderer.renderRoot).toBe('function')
  })
})
