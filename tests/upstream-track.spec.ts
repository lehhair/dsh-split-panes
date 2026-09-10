// @vitest-environment node
/**
 * Tracker guards.
 *
 * The scheduled upstream tracker only runs its interesting half when a release
 * actually touches a contact surface — which, by design, is rare. Two bugs
 * therefore survived in it: the workflow wrote its variables to $GITHUB_ENV in
 * lowercase while every step read them in uppercase (so `upgrade-core` was
 * handed an empty tag and sha and pinned `ref:` with an empty value), and the
 * harness checkout sat *after* the step that copies files out of it. A forced
 * manual dispatch is what finally exposed both. These tests fail on the old
 * shapes.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CONTACT_SURFACES, parseArgs, readPin, rewritePin } from '../scripts/upgrade-core.mjs'
import { VENDORED_FILES } from '../scripts/sync-renderer-vendor.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string): string => readFileSync(`${root}${path}`, 'utf8').replace(/\r\n/g, '\n')

const TRACK = '.github/workflows/upstream-track.yml'
const RELEASE = '.github/workflows/build-release.yml'
const PIN = 'core-pin.json'

/** Every `run:` block body in a workflow, dedented to column zero. */
function runBlocks(workflow: string): string[] {
  const blocks: string[] = []
  const lines = workflow.split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line === undefined) continue
    const header = /^(\s*)run:\s*(.*)$/.exec(line)
    if (header === null) continue
    const indent = (header[1] ?? '').length
    const inline = (header[2] ?? '').trim()
    if (inline !== '' && inline !== '|' && inline !== '>') {
      blocks.push(inline)
      continue
    }
    const body: string[] = []
    for (let j = i + 1; j < lines.length; j += 1) {
      const inner = lines[j]
      if (inner === undefined) break
      if (inner.trim() !== '' && inner.search(/\S/) <= indent) break
      body.push(inner.slice(indent + 2))
    }
    blocks.push(body.join('\n'))
  }
  return blocks
}

/** Captured group 1 of every match, skipping the ones that did not match. */
function captures(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined)
}

describe('upstream tracker workflow', () => {
  it('defines every shell variable its run blocks read', () => {
    const workflow = read(TRACK)
    // Names the workflow itself provides: $GITHUB_ENV writes and `env:` entries
    // (workflow level and step level). `${{ ... }}` expressions are not shell
    // variables and are never read as one.
    const defined = new Set<string>([
      ...captures(workflow, /\b([A-Z][A-Z0-9_]*)=/g),
      ...captures(workflow, /^\s*([A-Z][A-Z0-9_]*):/gm),
    ])
    // Provided by the runner, not by this file.
    const builtin = new Set(['GITHUB_ENV', 'GITHUB_OUTPUT', 'GITHUB_REPOSITORY', 'HOME', 'PATH'])

    const missing = new Set<string>()
    for (const block of runBlocks(workflow)) {
      for (const name of captures(block, /\$\{?([A-Z][A-Z0-9_]*)\}?/g)) {
        if (!defined.has(name) && !builtin.has(name)) missing.add(name)
      }
    }
    // Regression: `printf 'latest=%s' >> $GITHUB_ENV` against `$LATEST` in a step.
    expect([...missing]).toEqual([])
  })

  it('checks the harness out before the step that vendors files from it', () => {
    const workflow = read(TRACK)
    const harness = workflow.indexOf('Checkout harness at the new pin')
    const vendor = workflow.indexOf('Pin + re-vendor')
    expect(harness).toBeGreaterThan(-1)
    expect(vendor).toBeGreaterThan(-1)
    expect(harness).toBeLessThan(vendor)
  })

  it('offers a forced dispatch that only bypasses the contact-surface gate', () => {
    const workflow = read(TRACK)
    expect(workflow).toMatch(/workflow_dispatch:\n\s+inputs:\n(?:.*\n)*?\s+force:\n\s+description:.*\n\s+type: boolean/)
    expect(workflow).toMatch(/FORCE='--force'/)
  })

  it('treats every core file the sync scripts read as a contact surface', () => {
    // Two ways a core file reaches this plugin: copied verbatim by the vendor
    // script, or a glyph extracted out of a component by the icon script. A
    // source missing from the list is one the tracker will skip in silence —
    // the plugin keeps the stale copy forever.
    const vendored = VENDORED_FILES.map((file) => `packages/client/ui-renderer/src/client/${file}`)
    const icons = captures(read('scripts/sync-icons.mjs'), /join\(CORE,\s*'([^']+)'\)/g)
    const sources = [...vendored, ...icons]
    expect(sources.length).toBeGreaterThan(3)
    expect(sources.filter((source) => !CONTACT_SURFACES.some((prefix) => source.startsWith(prefix)))).toEqual([])
  })

  it('never stages a workflow file, which GITHUB_TOKEN cannot push', () => {
    // GitHub rejected the tracker's push outright:
    //   refusing to allow a GitHub App to create or update workflow
    //   `.github/workflows/build-release.yml` without `workflows` permission
    // There is no `workflows` key in GITHUB_TOKEN's permission set, so no
    // permissions block can fix it: the pin must not live in a workflow file.
    const workflow = read(TRACK)
    const lines = (runBlocks(workflow).find((block) => block.includes('git add')) ?? '').split('\n')
    const start = lines.findIndex((line) => line.includes('git add'))
    const staged: string[] = []
    for (let i = start; i >= 0 && i < lines.length; i += 1) {
      const line = lines[i] ?? ''
      staged.push(line)
      if (!line.trimEnd().endsWith('\\')) break
    }
    expect(staged.join(' ')).toContain('core-pin.json')
    expect(staged.join(' ')).not.toContain('.github')
    expect(read(RELEASE)).not.toMatch(/^\s+ref:\s*[0-9a-f]{40}\s*$/m)
    expect(read(RELEASE)).toContain('steps.core.outputs.ref')
  })
})

describe('upgrade-core argument handling', () => {
  it('drops empty arguments instead of reading them as the tag and sha', () => {
    // What a workflow passes when `$LATEST` / `$NEW_SHA` are unset.
    expect(parseArgs(['', '', '--files', 'compare.json', '--skip-check', '--force'])).toMatchObject({
      tag: undefined,
      explicitSha: undefined,
      force: true,
      filesJson: 'compare.json',
    })
  })

  it('reads the tag and sha from the documented invocations', () => {
    // `pnpm run upgrade:core dsh-v0.1.6`
    expect(parseArgs(['dsh-v0.1.6'])).toMatchObject({ tag: 'dsh-v0.1.6', explicitSha: undefined })
    // `pnpm run upgrade:core dsh-v0.1.6 <sha>`
    expect(parseArgs(['dsh-v0.1.6', 'a'.repeat(40)])).toMatchObject({ tag: 'dsh-v0.1.6', explicitSha: 'a'.repeat(40) })
    // …and with the CI-only compare file in between.
    expect(parseArgs(['dsh-v0.1.6', 'a'.repeat(40), '--files', 'compare.json', '--skip-check'])).toMatchObject({
      tag: 'dsh-v0.1.6',
      explicitSha: 'a'.repeat(40),
      filesJson: 'compare.json',
    })
  })

  it('exits 128 without touching the pin file', () => {
    const before = read(PIN)
    const cases: Array<[string[], string]> = [
      // Both positionals empty: the run dies on usage instead of pinning `ref:`.
      [['', '', '--files', 'compare.json', '--force'], 'usage:'],
      // A single positional must still be read as the tag, not dropped.
      [['dsh-v9.9.9'], 'cannot resolve dsh-v9.9.9'],
      // A sha that is not a 40-hex commit.
      [['dsh-v9.9.9', 'deadbeef', '--force'], 'got "deadbeef"'],
      [[], 'usage:'],
    ]
    for (const [args, expected] of cases) {
      const result = spawnSync(process.execPath, ['scripts/upgrade-core.mjs', ...args], { cwd: root, encoding: 'utf8' })
      const label = args.join(' ')
      expect(result.status, label).toBe(128)
      expect(`${result.stdout}${result.stderr}`, label).toContain(expected)
    }
    expect(read(PIN)).toBe(before)
  })
})

describe('the pin file', () => {
  const pin = read(PIN)
  const NEW_SHA = '0123456789abcdef0123456789abcdef01234567'

  it('names a tag and a 40-hex ref', () => {
    const parsed = readPin(pin)
    expect(parsed.tag).toMatch(/^dsh-v/)
    expect(parsed.ref).toMatch(/^[0-9a-f]{40}$/)
  })

  it('is what the release workflow reads its ref from', () => {
    // The workflow cannot hardcode the ref: GITHUB_TOKEN may not write it.
    const release = read(RELEASE)
    expect(release).toContain('core-pin.json')
    expect(release).toContain('ref: ${{ steps.core.outputs.ref }}')
  })

  it('keeps its note and rewrites the tag + ref', () => {
    const next = rewritePin(pin, { tag: 'dsh-v0.1.6', sha: NEW_SHA })
    const parsed = readPin(next)
    expect(parsed.tag).toBe('dsh-v0.1.6')
    expect(parsed.ref).toBe(NEW_SHA)
    // The explanatory note survives the rewrite untouched.
    expect(parsed.note).toBe(readPin(pin).note)
    expect(next.endsWith('\n')).toBe(true)
  })

  it('is idempotent', () => {
    const once = rewritePin(pin, { tag: 'dsh-v0.1.6', sha: NEW_SHA })
    expect(rewritePin(once, { tag: 'dsh-v0.1.6', sha: NEW_SHA })).toBe(once)
  })

  it('rejects a mangled pin instead of writing garbage', () => {
    expect(() => readPin('not json')).toThrow(/not valid JSON/)
    expect(() => readPin(JSON.stringify({ tag: 'dsh-v0.1.6' }))).toThrow(/40-hex ref/)
    expect(() => readPin(JSON.stringify({ ref: 'a'.repeat(40) }))).toThrow(/missing a tag/)
    expect(() => readPin(JSON.stringify({ tag: 'dsh-v0.1.6', ref: '' }))).toThrow(/40-hex ref/)
  })
})
