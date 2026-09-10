/**
 * Guard: the published client bundle must not embed this machine's paths.
 *
 * `lib/client.js` is built here on Windows and shipped from a tagged Linux
 * runner, and the upstream tracker decides whether a release is warranted by
 * rebuilding it and comparing bytes with the committed copy. Two leaks used to
 * break that (both fixed in tsdown.config.ts): lightningcss hashes the filename
 * it is handed when it generates CSS-module class names, and rolldown writes the
 * module id into a `//#region` comment. Either one makes the artifact path-
 * dependent — the tracker then reports "bundle changed" on every run, and the
 * tarball differs depending on where it was built.
 *
 * Usage: node scripts/check-bundle-portability.mjs [file]   (default lib/client.js)
 * Exit: 0 = clean, 1 = machine-specific path found.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Shapes that only ever come from a local filesystem. */
const MACHINE_PATHS = [
  /\b[A-Za-z]:[\\/][^"'\s]*/, // C:\... or E:/... (a Windows checkout)
  /\/(?:home|Users|mnt|runner)\//, // /home/runner/... (a CI checkout)
]

const file = process.argv[2] ?? 'lib/client.js'
const text = readFileSync(resolve(file), 'utf8')

const hits = new Set()
for (const pattern of MACHINE_PATHS) {
  for (const match of text.matchAll(new RegExp(pattern.source, 'g'))) hits.add(match[0])
}

if (hits.size > 0) {
  console.error(`DRIFT: ${file} embeds machine-specific paths:`)
  for (const hit of [...hits].slice(0, 10)) console.error(`  ${hit}`)
  console.error(
    '\nThe bundle must be byte-identical wherever it is built — see the stableId()\n'
    + 'helper in tsdown.config.ts (CSS-module hashes and rolldown region comments).',
  )
  process.exit(1)
}
console.log(`${file} carries no machine-specific paths`)
