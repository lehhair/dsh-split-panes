# Vendored core slot renderer

These three files are **verbatim copies** of the DeepSeek Harness core slot
renderer:

| file | upstream |
|---|---|
| `bind.ts` | `packages/client/ui-renderer/src/client/bind.ts` |
| `bindings.tsx` | `packages/client/ui-renderer/src/client/bindings.tsx` |
| `scoped-slots.tsx` | `packages/client/ui-renderer/src/client/scoped-slots.tsx` |

## Why a copy exists

The core exposes no seam that renders a session-scoped subtree for an
**explicit** session id:

- `ScopeProvider` hard-codes `host.scope('session').current` — the current
  selection only (`bindings.tsx`).
- The binding context it provides is private: never re-exported from any
  package, and `installScope` is boot-once with `'session'` already taken.
- `ctx.slots.renderSlot()` only renders `'root'`; `SlotScope` is the closed
  union `'root' | 'session-maybe' | 'session'`.

What **is** public is the renderer's input contract: `SlotRendererHost`
(`@deepseek-ai/dsh-client-ui-slots`). `createSlotRenderer().renderRoot(host,
ownerProps)` reads every dependency — the root standard-source binding, the
scope adapter, the entry ledger, store instances, the locale face — off that
one object. Whoever supplies the host decides the scope binding.

So a pane renders a native conversation by running the core's **own**
renderer against a plugin-built host whose `scope('session')` resolves to the
pane's session. That needs the renderer implementation, and the published
`@deepseek-ai/dsh-client-ui-renderer` npm tarball ships `lib/` only (no
`src/`), so the source is vendored here.

Copying (rather than re-implementing) keeps the outlet semantics exact:
standard-prop synthesis, the locale `t` seat cache, store resolution, entry
inject caches, slot-level inject factories with `hookContext`, owner-wins
merge order, single/keyed/list/chain dispatch with dry-cell crash faces,
session-maybe adoption epochs, and per-entry error boundaries with
abdication. No hand-written twin of that logic exists in this plugin.

## Keeping it in sync

```sh
node scripts/sync-renderer-vendor.mjs          # copy upstream → vendor
node scripts/sync-renderer-vendor.mjs --check  # fail on drift (CI / pre-push)
```

`tests/renderer-vendor.spec.ts` runs the same byte comparison inside the test
suite, so an upstream renderer change fails the plugin's tests instead of
silently drifting. Local edits to these files are not supported — fix the
façade (`src/client/pane-host.ts`) instead.

Both projects are BSD-3-Clause.
