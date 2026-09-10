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
 *   2. rewrite the release workflow's pinned harness ref to the target tag
 *   3. re-vendor the slot renderer from the core checkout
 *   4. run the full check (drift guard + typecheck + tests + build)
 *   5. report whether the built client bundle actually changed — the signal
 *      for whether releasing a new plugin patch makes sense.
 *
 * CONTACT SURFACES (paths relative to the harness root):
 *   renderer  : the vendored slot renderer (must re-vendor when touched)
 *   contracts : ui-conversation skeleton + contract/, ui-session/, ui-layout/
 *               (the seats the vendored renderer feeds the stock components)
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
 * 3 = contact surfaces untouched (parsed by the tracker to skip silently).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = resolve(HERE, '..')
const CORE = resolve(PLUGIN_ROOT, '../dsh2026/deepseek-harness')
const WORKFLOW = join(PLUGIN_ROOT, '.github/workflows/build-release.yml')
const CLIENT_BUNDLE = join(PLUGIN_ROOT, 'lib/client.js')

/** Paths (harness-relative) whose change forces a re-vendor / reconfigure. */
const CONTACT_SURFACES = [
  'packages/client/ui-renderer/src/client/bind.ts',
  'packages/client/ui-renderer/src/client/bindings.tsx',
  'packages/client/ui-renderer/src/client/scoped-slots.tsx',
  'packages/client/ui-conversation/src/client/contract/',
  'packages/client/ui-conversation/src/client/skeleton/',
  'packages/client/ui-session/src/client/',
  'packages/client/ui-layout/src/client/',
]

const USAGE = `usage: node scripts/upgrade-core.mjs [--dry-run] [--force] [--skip-check] <dsh-tag> [<sha>] [--files <compare.json>]`

function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const force = argv.includes('--force')
  const skipCheck = argv.includes('--skip-check')
  let filesJson
  const filesIdx = argv.indexOf('--files')
  if (filesIdx !== -1) filesJson = argv[filesIdx + 1]
  const positional = argv.filter((arg, i) => !arg.startsWith('--') && i !== filesIdx && i !== filesIdx + 1)
  const tag = positional[0]
  const explicitSha = positional[1]
  if (tag === undefined) {
    console.error(USAGE)
    process.exit(128)
  }

  const sha = explicitSha ?? resolveFromLocalCheckout(tag)
  if (sha === undefined) {
    console.error(`cannot resolve ${tag} — pass the commit sha explicitly (CI resolves it via git ls-remote)`)
    process.exit(128)
  }
  // The release workflow currently pins one commit; that is the change baseline.
  const workflow = readFileSync(WORKFLOW, 'utf8')
  const oldSha = currentPin(workflow)
  if (oldSha === undefined) throw new Error(`no pinned \`ref:\` line found in ${WORKFLOW}`)
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

  // ---- 2. pin the workflow ----
  const lines = workflow.split('\n')
  let refIdx = -1
  lines.forEach((line, i) => { if (/^\s*ref:\s*[0-9a-f]{40}\s*$/.test(line)) refIdx = i })
  if (refIdx === -1) throw new Error(`no pinned \`ref:\` line found in ${WORKFLOW}`)
  const next = [...lines]
  next[refIdx] = `          ref: ${sha}`
  next[refIdx - 1] = `          # ${tag}; keep in sync with the vendored renderer.`
  if (!dryRun) writeFileSync(WORKFLOW, next.join('\n'))
  console.log(`${dryRun ? '[dry-run] would pin' : 'pinned'}  ${WORKFLOW} -> ${tag} @ ${sha}`)

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
The workflow pin has ALREADY been rewritten; '$ git checkout -- .github/workflows/build-release.yml' reverts it.`)
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

function currentPin(workflow) {
  for (const line of workflow.split('\n')) {
    const m = /^\s*ref:\s*([0-9a-f]{40})\s*$/.exec(line)
    if (m) return m[1]
  }
  return undefined
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