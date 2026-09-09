// @vitest-environment node
/**
 * Vendor drift guard: the pane renderer is the core's own slot renderer,
 * copied verbatim (see src/client/vendor/renderer/README.md). When upstream
 * changes it, this test fails instead of letting panes silently diverge from
 * the shell's rendering semantics.
 *
 * Fix by running: node scripts/sync-renderer-vendor.mjs
 *
 * Line endings are normalized before comparing: git's autocrlf rewrites the
 * working copy on Windows, so a byte comparison would flag a cosmetic
 * CRLF/LF difference on exactly the platform that most often rewrites files.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const core = fileURLToPath(new URL('../../dsh2026/deepseek-harness/packages/client/ui-renderer/src/client/', import.meta.url))
const vendored = fileURLToPath(new URL('../src/client/vendor/renderer/', import.meta.url))

const FILES = ['bind.ts', 'bindings.tsx', 'scoped-slots.tsx'] as const

/** Normalize platform line endings so a CRLF working copy matches LF source. */
const normalize = (text: string): string => text.replace(/\r\n/g, '\n')

describe('vendored core renderer', () => {
  it.each(FILES)('%s is byte-identical to the core source', (file) => {
    const upstream = normalize(readFileSync(`${core}${file}`, 'utf8'))
    const copy = normalize(readFileSync(`${vendored}${file}`, 'utf8'))
    expect(copy).toBe(upstream)
  })

  it('exposes the renderer product the pane host drives', async () => {
    const module = await import('../src/client/vendor/renderer/scoped-slots.tsx')
    const renderer = module.createSlotRenderer()
    expect(typeof renderer.renderRoot).toBe('function')
  })
})
