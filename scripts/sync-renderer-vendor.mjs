/**
 * Vendor the core slot renderer into this plugin.
 *
 * WHY: the core exposes no seam that renders a session-scoped subtree for an
 * explicit session id — `ScopeProvider` hard-codes `adapter.current` and the
 * binding context is private. The only way to give every pane a native
 * conversation without patching the core is to run the core's OWN renderer
 * against a plugin-built host facade. `SlotRendererHost` is a public
 * interface, so that is legitimate; but the renderer implementation
 * (`createSlotRenderer`) is not exported from the published
 * `@deepseek-ai/dsh-client-ui-renderer` (the npm tarball ships `lib/` only,
 * no `src/`), so the source must be vendored.
 *
 * These files are copied VERBATIM. `tests/renderer-vendor.spec.ts` asserts
 * byte equality against the core checkout, so an upstream change fails the
 * suite instead of silently drifting.
 *
 * Usage: node scripts/sync-renderer-vendor.mjs [--check]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = resolve(HERE, '..')
const CORE = resolve(PLUGIN_ROOT, '../dsh2026/deepseek-harness/packages/client/ui-renderer/src/client')
const OUT = join(PLUGIN_ROOT, 'src/client/vendor/renderer')

/** Files copied verbatim from the core renderer. */
export const VENDORED_FILES = ['bind.ts', 'bindings.tsx', 'scoped-slots.tsx']

/** Normalize platform line endings (git autocrlf rewrites Windows copies). */
const normalize = (text) => text.replace(/\r\n/g, '\n')

/** Read one vendored pair: [core source, plugin copy]. */
export function vendorPair(file) {
  return {
    core: join(CORE, file),
    copy: join(OUT, file),
    read: () => ({
      upstream: normalize(readFileSync(join(CORE, file), 'utf8')),
      vendored: existsSync(join(OUT, file)) ? normalize(readFileSync(join(OUT, file), 'utf8')) : undefined,
    }),
  }
}

function main() {
  const check = process.argv.includes('--check')
  if (!existsSync(CORE)) {
    console.error(`core renderer sources not found at ${CORE} — set up the core checkout first`)
    process.exit(1)
  }
  mkdirSync(OUT, { recursive: true })
  let drift = 0
  for (const file of VENDORED_FILES) {
    const { read, copy } = vendorPair(file)
    const { upstream, vendored } = read()
    if (check) {
      if (vendored !== upstream) {
        console.error(`DRIFT: src/client/vendor/renderer/${file} differs from the core source`)
        drift += 1
      }
      continue
    }
    if (vendored === upstream) {
      console.log(`unchanged ${file}`)
      continue
    }
    writeFileSync(copy, upstream)
    console.log(`synced    ${file}`)
  }
  if (check && drift > 0) {
    console.error(`\n${drift} vendored file(s) drifted. Run: node scripts/sync-renderer-vendor.mjs`)
    process.exit(1)
  }
  if (check) console.log('vendored renderer is byte-identical to the core source')
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
