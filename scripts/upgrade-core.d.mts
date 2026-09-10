/**
 * Types for scripts/upgrade-core.mjs, which the tracker spec imports directly
 * (the script is plain ESM so it stays runnable by bare `node`; the tests are
 * typechecked with the same strict flags as the rest of the repo).
 */

/** Flags and positional values parsed out of process.argv. */
export interface UpgradeArgs {
  dryRun: boolean
  force: boolean
  skipCheck: boolean
  filesJson: string | undefined
  tag: string | undefined
  explicitSha: string | undefined
}

export function parseArgs(argv: string[]): UpgradeArgs
export function currentPin(workflow: string): string | undefined
export function rewritePin(workflow: string, pin: { tag: string; sha: string }): string

/** Harness-relative paths whose change forces a re-vendor / reconfigure. */
export const CONTACT_SURFACES: string[]
