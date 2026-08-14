# Renderer capability patch (ships with the ui-panes plugin)

The pane-split plugin needs renderer-level capabilities that the OFFICIAL DeepSeek Harness web client (including the current `0.1.0-rc.5` release) does not ship: rendering a conversation subtree bound to an EXPLICIT session (`SessionScope` + by-id seats) and a wrapping seam over the stock conversation column (`conversation.panes`). These are not reachable from a plugin — the renderer's session-binding mechanism (React context + the standard-kit seat injection) is private, the released frontend is a pre-built `dist/`, and the `conversation` slot is exclusively owned by ui-conversation.

Proposal posted upstream: https://github.com/deepseek-ai/deepseek-harness/discussions/604

## What the patch adds (21 files, ~500 lines, all additive)

| Area | Addition |
|---|---|
| `packages/client/runtime` | `ISessions.session(id)` (by-id render bundle, lazy scope mint like `binding()`) + `emptyInfo` (static no-session roster); `SlotRegistry` host face wires both; `SessionRuntime` implements them |
| `packages/client/ui-slots` | Types: `UseSessionById`, `UseProjectionById`, `SessionScopeProps`, `SessionScopeComponent`; `SlotRendererHost.sessions.session(id)` + `emptyInfo` members |
| `packages/client/web-react` | `SessionScope` component (render a subtree under an EXPLICIT session's bundle; `key={sessionId}` remount semantics like `SessionProvider`), the by-id seats (`sessionByIdSeat` / `projectionByIdSeat`), injected into every entry's standard kit, exported |
| `packages/client/ui-layout` | `conversation.panes` seam (root scope): the frame renders it around the stock conversation (owner render-prop `renderConversation` + stock fallback — byte-identical without a registrant) |
| `packages/client/ui-primitives` | Platform exports of the per-line highlighter and the copy-feedback hook (`highlightLines` / `grammarLoadCount` / `subscribeGrammarLoaded` / `useCopyFeedback`) |
| tests | `SessionScope` behavior (binding / absent / late-arrival / remount), runtime `session`/`emptyInfo` cases, frame seam stub updates, host-mock additions |

All changes are pure additions — no existing behavior is altered, so the stock GUI stays byte-for-byte identical without the plugin.

## Apply

From the DSH repository root (baseline: the official `deepseek-ai/deepseek-harness` `0.1.0-rc.5` release — the `dsh` family version `0.1.0-rc.5`):

```sh
git apply packages/client/ui-panes/patches/dsh-session-scope-and-panes-rc5.patch
# or from this repo's patches/ directory:
git apply dsh-session-scope-and-panes-rc5.patch
```

If the target checkout has drifted, apply with `--3way` for a merge, or rebase the patch manually.

## Verify after applying

```sh
pnpm run build:lib:client && pnpm run build:web
pnpm exec vitest run packages/client/web-react packages/client/runtime packages/client/ui-layout packages/test-support/client-runtime
```

Boot `dsh web`, install the ui-panes plugin, and confirm split panes, header actions, and session drag & drop work.

## Distribution notes

- The patch and the plugin travel together: distribute `@dsh-external/dsh-split-panes` plus this file (keep it in the package's `patches/` directory so it ships in the tarball — `patches` is in the package `files` list).
- The renderer capability itself is generic (by-id session binding); it has no dependency on ui-panes and can be applied independently.
- Once the upstream discussion lands the capability, the patch becomes a no-op (its changes will already be present).

## Archived patch

`dsh-renderer-session-scope-0809.patch` is the earlier capability patch against the 20260807 private snapshot. It is superseded by `dsh-session-scope-and-panes-rc5.patch` (official rc.5 baseline) and kept only as a reference — do not apply it to an rc.5 checkout.
