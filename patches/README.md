# Renderer capability — merged upstream (no patch needed)

The renderer-level capabilities this plugin needs (`SessionScope` per-session
render scope, the by-id seats `useSessionById` / `useProjectionById`, and the
`conversation.panes` wrapping seam) are now **part of the official DeepSeek
Harness web client** (the session-scope proposal #486 landed in the current
development snapshot). Install the plugin as-is — no patch, no fork, no
capability-carrying distribution:

```sh
dsh plugin --profile web add <this-plugin>   # path / tarball / github spec
```

The plugin refuses to install only on older dsh releases that predate the
capability. On those, either upgrade dsh or apply the archived patch below.

## Archived patch (older dsh only)

`dsh-renderer-session-scope-0809.patch` carried the same capabilities for the
20260807 official snapshot, before they merged upstream. It is **superseded**:
against the current snapshot the changes are already present and the patch
will not apply. It is kept for reference; do not apply it to a current
checkout.

The patch's file-by-file account (still accurate for the merged change set):

| File | Addition |
|---|---|
| `packages/client/web-react/src/session-provider.tsx` | `SessionScope` component (render a subtree under an EXPLICIT session's bundle), the by-id seats (`sessionByIdSeat` / `projectionByIdSeat`) backing `useSessionById` / `useProjectionById` |
| `packages/client/web-react/src/scoped-slots.tsx` | Inject the new global seats (`useSessionById`, `useProjectionById`, `SessionScope`) into the standard kit |
| `packages/client/web-react/src/index.ts` | Export the new seats |
| `packages/client/ui-slots/src/index.ts` | Types: `UseSessionById`, `UseProjectionById`, `SessionScopeProps`, `SessionScopeComponent` |
| `packages/client/ui-slots/src/renderer.ts` | `SlotRendererHost.sessions.session(id)` + `sessions.emptyInfo` members |
| `packages/client/runtime/src/client/slots.ts` | Host face wiring for the two new sessions members |
| `packages/client/runtime/src/client/sessions/service.ts` | `session(id)` + `emptyInfo` (the static no-session roster) |
| `packages/client/runtime/src/client/contract/sessions.ts` | `ISessions.session(id)` + `emptyInfo` contract members |
| `packages/client/ui-layout/src/client/AppFrame.tsx` | Render the center column through the `conversation.panes` wrapping seam (owner render-prop + stock fallback) |
| `packages/client/ui-layout/src/client/index.ts` | `conversation.panes` slot declaration (root scope) + `ConvPanesOwnerProps` |

All changes are pure additions — the stock GUI stays byte-for-byte identical
without the plugin.

The plugin's typed seats are declared in `src/client/global-seats.ts`
(`declare module` merge over `GlobalStandardProps`), matching the renderer's
unconditional injection — the same consumer-typed pattern the diff-viewer
plugin uses for its slot declarations.
