import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/** DSH fork sources: the plugin builds on the fork's renderer capability
    types, and the linked packages' `./client` exports point at browser
    bundles (lib/client.js, loader-bannered) — tests must resolve to the
    fork's src instead, like the monorepo's tsconfig paths. */
const fork = fileURLToPath(new URL('../dsh2026/deepseek-harness/packages/client', import.meta.url))

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    environment: 'node',
    pool: 'threads',
  },
  resolve: {
    alias: {
      '@deepseek-ai/dsh-client-runtime/client': `${fork}/runtime/src/client/index.ts`,
      '@deepseek-ai/dsh-client-runtime': `${fork}/runtime/src/index.ts`,
      '@deepseek-ai/dsh-client-ui-slots': `${fork}/ui-slots/src/index.ts`,
      '@deepseek-ai/dsh-client-ui-layout/client': `${fork}/ui-layout/src/client/index.ts`,
      '@deepseek-ai/dsh-client-ui-primitives': `${fork}/ui-primitives/src/index.ts`,
      '@deepseek-ai/dsh-client-locale/client': `${fork}/locale/src/client/index.ts`,
      '@deepseek-ai/dsh-client-test-runtime': `${fork}/../test-support/client-runtime/src/index.ts`,
      '@deepseek-ai/dsh-client-test-runtime/client': `${fork}/../test-support/client-runtime/src/client/index.ts`,
    },
  },
})


