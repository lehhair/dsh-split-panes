# Renderer capability patch (ships with the ui-panes plugin)

English | [中文](README.zh.md)


`dsh-renderer-session-scope.patch` carries the RENDERER-LEVEL capabilities the
pane-split plugin needs but that are not part of the upstream DeepSeek Harness
web client. The plugin itself is UI and interaction only — it cannot provide
"render a conversation bound to an arbitrary session" because that is the
renderer's session-binding mechanism (React context + the standard-kit seat
injection), which business plugins cannot reach. Applying this patch gives any
DSH the same renderer capabilities this fork ships with; without it the plugin
cannot install.

## What it adds (10 files, ~450 lines, all additive)

| File | Addition |
|---|---|
| `packages/client/web-react/src/session-provider.tsx` | `SessionScope` component (render a subtree under an EXPLICIT session's bundle), the by-id seats (`sessionByIdSeat` / `projectionByIdSeat`) backing `useSessionById` / `useProjectionById` |
| `packages/client/web-react/src/scoped-slots.tsx` | Inject the new global seats (`useSessionById`, `useProjectionById`, `SessionScope`) into the standard kit |
| `packages/client/web-react/src/index.ts` | Export the new seats |
| `packages/client/ui-slots/src/index.ts` | Types: `UseSessionById`, `UseProjectionById`, `SessionScopeProps`, `SessionScopeComponent` |
| `packages/client/ui-slots/src/renderer.ts` | `SlotRendererHost.sessions.session(id)` + `sessions.emptyInfo` members |
| `packages/client/runtime/src/client/slots.ts` | Host face wiring for the two new sessions members |
| `packages/client/runtime/src/client/sessions/service.ts` | `emptyInfo` (the static no-session roster) |
| `packages/client/runtime/src/client/contract/sessions.ts` | `ISessions.session(id)` + `emptyInfo` contract members |
| `packages/client/ui-layout/src/client/AppFrame.tsx` | Render the center column through the `conversation.panes` wrapping seam (owner render-prop + stock fallback) |
| `packages/client/ui-layout/src/client/index.ts` | `conversation.panes` slot declaration (root scope) + `ConvPanesOwnerProps` |

All changes are pure additions — no existing behavior is altered, so the stock
GUI stays byte-for-byte identical without the plugin.

## Apply

Run from the DSH repository root:

```sh
git apply packages/client/ui-panes/patches/dsh-renderer-session-scope.patch
```

The patch is generated against the official snapshot
`20260807T130646Z` (git `820b7a5`). If the target checkout has drifted from
that baseline, `git apply` may report context mismatches — apply with
`--3way` for a merge, or rebase the patch manually.

## Verify after applying

- `pnpm run test:gui` (or at least
  `npx vitest run packages/client/web-react packages/client/ui-layout packages/client/ui-slots packages/client/runtime`)
- Boot `dsh web`, install the ui-panes plugin, and confirm split panes,
  header actions, and session drag & drop all work.

## Distribution notes

- The patch and the plugin travel together: distribute `@deepseek-ai/dsh-client-ui-panes`
  plus this file (keep it in the package's `patches/` directory so it ships in
  the tarball — add `patches` to the package `files` list).
- The renderer capability itself is generic (by-id session binding); it has no
  dependency on ui-panes and can be applied independently of the plugin.
- This is the alternative to upstreaming the capability into the official
  renderer; if the upstream later ships it, the patch becomes a no-op (its
  changes will already be present).
