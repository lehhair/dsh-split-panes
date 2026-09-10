/**
 * Upgrade the plugin to track a newer DeepSeek Harness release.
 *
 * One command performs the whole "follow upstream" sequence, SKIPPING work that
 * does not matter:
 *
 *   1. only act when the new release touches the panes' surfaces
 *        (the vendored renderer files + the component contract packs).
 *        A tag that only bumps the version — or moves work we do not consume —
 *        is ignored, so no empty upgrade PRs get opened.
 *   2. rewrite the pinned harness ref in core-pin.json to the target tag
 *   3. re-vendor the slot renderer from the core checkout
 *   4. run the full check (drift guard + typecheck + tests + build)
 *   5. report whether the built client bundle actually changed — the signal
 *      for whether releasing a new plugin patch makes sense.
 *
 * The pin is data (core-pin.json), NOT a line inside build-release.yml: the
 * default GITHUB_TOKEN cannot push anything under .github/workflows, so a
 * tracker PR that edited the workflow was rejected outright. The release
 * workflow reads the file and passes its ref to actions/checkout.
 *
 * CONTACT SURFACES (paths relative to the harness root):
 *   renderer  : the vendored slot renderer (must re-vendor when touched)
 *   contracts : ui-conversation skeleton + contract/, ui-session/, ui-layout/
 *               (the seats the vendored renderer feeds the stock components)
 *   icons     : the two components the pane-chrome glyphs are extracted from
 *
 * Usage (from the plugin root):
 *   node scripts/upgrade-core.mjs dsh-v0.1.6-alpha.1                # resolve from the local core checkout
 *   node scripts/upgrade-core.mjs dsh-v0.1.6-alpha.1 <sha>          # explicit commit (CI path)
 *   node scripts/upgrade-core.mjs dsh-v0.1.6-alpha.1 <sha> --files <compare.json>
 *   node scripts/upgrade-core.mjs --force dsh-v0.1.6-alpha.1 <sha> --skip-check
 *
 *   --files <compare.json>: GitHub /compare/{old}...{new} response filtered to
 *     `.files[].filename`; used when the local core checkout lacks history.
 *
 * Exit codes: 0 = nothing to do / done; 1 = check failed (contract work needed);
 * 3 = contact surfaces untouched (parsed by the tracker to skip silently);
 * 128 = bad arguments / tag not resolvable to a commit sha (nothing written).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = resolve(HERE, '..')
const CORE = resolve(PLUGIN_ROOT, '../dsh2026/deepseek-harness')
const PIN_FILE = join(PLUGIN_ROOT, 'core-pin.json')
const CLIENT_BUNDLE = join(PLUGIN_ROOT, 'lib/client.js')

/** Paths (harness-relative) whose change forces a re-vendor / reconfigure. */
export const CONTACT_SURFACES = [
  'packages/client/ui-renderer/src/client/bind.ts',
  'packages/client/ui-renderer/src/client/bindings.tsx',
  'packages/client/ui-renderer/src/client/scoped-slots.tsx',
  'packages/client/ui-conversation/src/client/contract/',
  'packages/client/ui-conversation/src/client/skeleton/',
  'packages/client/ui-session/src/client/',
  'packages/client/ui-layout/src/client/',
  // The pane-chrome glyphs are extracted from these two files (split, stacked,
  // fullscreen, exit-fullscreen). Leaving them out meant a redrawn upstream
  // glyph was skipped in silence and the plugin shipped the old icon forever —
  // exactly the drift that 0.1.5-alpha.2 introduced. `tests/upstream-track.spec.ts`
  // cross-checks this list against every file the sync scripts read.
  'packages/client/ui-dockkit/src/components/TabPanel.tsx',
  'packages/client/ui-sidebar-right/src/client/shell/SidebarRight.tsx',
]

const USAGE = `usage: node scripts/upgrade-core.mjs [--dry-run] [--force] [--skip-check] <dsh-tag> [<sha>] [--files <compare.json>]`

/**
 * Split argv into flags and the two positional values.
 *
 * Empty arguments are DROPPED, not treated as positional values: a shell
 * variable that was never set expands to '' and would otherwise arrive as a
 * real tag/sha (that is exactly how an empty sha once got pinned into the
 * release workflow).
 */
export function parseArgs(argv) {
  const filesIdx = argv.indexOf('--files')
  // Only exclude the two slots `--files` occupies when the flag is actually
  // present: with filesIdx === -1 the old `i !== filesIdx + 1` test matched
  // index 0 and silently dropped the tag (`upgrade:core dsh-v0.1.6` failed
  // with a usage error, and `upgrade:core <tag> <sha>` read the sha as tag).
  const fileSlot = (i) => filesIdx !== -1 && (i === filesIdx || i === filesIdx + 1)
  const positional = argv.filter((arg, i) => arg !== '' && !arg.startsWith('--') && !fileSlot(i))
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    skipCheck: argv.includes('--skip-check'),
    filesJson: filesIdx === -1 ? undefined : argv[filesIdx + 1],
    tag: positional[0],
    explicitSha: positional[1] === undefined ? undefined : positional[1],
  }
}

/**
 * Rewrite the pin in the core-pin.json text.
 *
 * The pin is data rather than a line inside build-release.yml because the
 * default GITHUB_TOKEN cannot push anything under .github/workflows: a tracker
 * branch that edited the workflow was rejected by GitHub ("refusing to allow a
 * GitHub App to create or update workflow ... without `workflows` permission").
 * Editing JSON also removes the whole class of "did the comment above `ref:`
 * survive the rewrite" bugs.
 */
export function rewritePin(pinText, { tag, sha }) {
  const current = readPin(pinText)
  const next = { ...(current.note === undefined ? {} : { note: current.note }), tag, ref: sha }
  return `${JSON.stringify(next, null, 2)}\n`
}

/** Parse core-pin.json, rejecting anything that is not a tag + 40-hex ref. */
export function readPin(pinText) {
  let parsed
  try {
    parsed = JSON.parse(pinText)
  } catch {
    throw new Error('core-pin.json is not valid JSON')
  }
  if (parsed === null || typeof parsed !== 'object') throw new Error('core-pin.json must be an object')
  const { note, tag, ref } = parsed
  if (typeof tag !== 'string' || tag === '') throw new Error('core-pin.json is missing a tag')
  if (typeof ref !== 'string' || !/^[0-9a-f]{40}$/.test(ref)) throw new Error('core-pin.json is missing a 40-hex ref')
  return { note: typeof note === 'string' ? note : undefined, tag, ref }
}

function main() {
  const { dryRun, force, skipCheck, filesJson, tag, explicitSha } = parseArgs(process.argv.slice(2))
  if (tag === undefined) {
    console.error(USAGE)
    process.exit(128)
  }

  const sha = explicitSha === undefined ? resolveFromLocalCheckout(tag) : explicitSha
  // Validate BEFORE anything is written: an empty sha used to be pinned into
  // the release workflow (`ref: ` with an empty value), breaking it for real.
  if (sha === undefined || !/^[0-9a-f]{40}$/.test(sha)) {
    console.error(
      `cannot resolve ${tag} to a commit sha${sha === undefined ? '' : ` (got ${JSON.stringify(sha)})`}\n` +
      'pass the commit sha explicitly (CI resolves it via git ls-remote)',
    )
    process.exit(128)
  }
  // The pin file currently names one commit; that is the change baseline.
  const pinText = readFileSync(PIN_FILE, 'utf8')
  const oldSha = readPin(pinText).ref
  if (oldSha === sha) {
    console.log(`already pinned to ${tag} (${sha}) — nothing to do`)
    return
  }

  // ---- 1. contact-surface diff ----
  if (!force) {
    const touched = contactSurfacesTouched(oldSha, sha, filesJson)
    if (touched === false) {
      console.log(`no contact surface changed between ${oldSha} and ${sha} (${tag}) — nothing to upgrade`)
      process.exit(3)
    }
    if (touched === undefined) {
      console.error('could not compare contact surfaces — proceeding (pass --files for a definitive diff)')
    }
  }

  // ---- 2. pin ----
  if (!dryRun) writeFileSync(PIN_FILE, rewritePin(pinText, { tag, sha }))
  console.log(`${dryRun ? '[dry-run] would pin' : 'pinned'}  ${PIN_FILE} -> ${tag} @ ${sha}`)

  // ---- 3. re-vendor ----
  const before = dryRun ? '' : readFileSync(CLIENT_BUNDLE, 'utf8')
  if (!dryRun) {
    const sync = spawnSync(process.execPath, ['scripts/sync-renderer-vendor.mjs'], { cwd: PLUGIN_ROOT, stdio: 'inherit' })
    if (sync.status !== 0) process.exit(sync.status ?? 1)
    // The pane-chrome icons are extracted from the core too (they drifted once
    // when 0.1.5-alpha.2 redrew the right sidebar's glyphs).
    const icons = spawnSync(process.execPath, ['scripts/sync-icons.mjs'], { cwd: PLUGIN_ROOT, stdio: 'inherit' })
    if (icons.status !== 0) process.exit(icons.status ?? 1)
  }
  console.log(`${dryRun ? '[dry-run] would sync the' : 'vendored'}  renderer + icons`)

  // ---- 4. check ----
  if (!skipCheck && !dryRun) {
    const check = spawnSync(pnpmCommand(), ['run', 'check'], {
      cwd: PLUGIN_ROOT,
      stdio: 'inherit',
      // Windows: pnpm is a .cmd shim, and spawnSync cannot execute it without
      // a shell (it fails EINVAL with a null status, which would read as a
      // check failure without ever running the check).
      ...(process.platform === 'win32' ? { shell: true } : {}),
    })
    if (check.error !== undefined) {
      console.error(`could not run 'pnpm run check': ${check.error.message}`)
      process.exit(1)
    }
    if (check.status !== 0) {
      console.error(`
check FAILED after tracking ${tag}.

If a contact surface changed, the plugin must adapt before it can be released —
see docs/ARCHITECTURE.md §10 for the seams the vendored renderer touches.
The pin in core-pin.json has ALREADY been rewritten; '$ git checkout -- core-pin.json' reverts it.`)
      process.exit(1)
    }
    console.log('check   OK')
  }

  // ---- 5. bundle-change signal ----
  const after = dryRun ? '' : readFileSync(CLIENT_BUNDLE, 'utf8')
  if (!dryRun) {
    console.log(`bundle   ${before === after ? 'unchanged (no release warranted)' : 'CHANGED (a patch release is meaningful)'}`)
  }

  console.log(`${dryRun ? '[dry-run] done — nothing written, nothing changed.' : `\nDone tracking ${tag} @ ${sha}.`}`)
}

/** The package-manager command (Windows resolves the .cmd shim under `shell`). */
function pnpmCommand() {
  return 'pnpm'
}

function contactSurfacesTouched(oldSha, newSha, filesJson) {
  if (filesJson !== undefined) {
    // GitHub compare response (files[].filename), read from a file.
    try {
      const { files } = JSON.parse(readFileSync(filesJson, 'utf8'))
      const names = files.map((f) => f.filename)
      return names.some((name) => CONTACT_SURFACES.some((prefix) => name.startsWith(prefix)))
    } catch {
      return undefined
    }
  }
  if (!existsSync(join(CORE, 'packages/client/ui-renderer/src/client/bind.ts'))) return undefined
  const result = spawnSync('git', ['-C', CORE, 'diff', '--name-only', oldSha, newSha, '--', ...CONTACT_SURFACES])
  if (result.status !== 0) return undefined
  return result.stdout.toString().trim().length > 0
}

function resolveFromLocalCheckout(tag) {
  const result = spawnSync('git', ['-C', CORE, 'rev-parse', `${tag}^{commit}`])
  const sha = result.status === 0 ? result.stdout.toString().trim() : undefined
  return sha && /^[0-9a-f]{40}$/.test(sha) ? sha : undefined
}

if (process.argv[1] !== undefined && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  main()
}