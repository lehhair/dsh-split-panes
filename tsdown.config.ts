/**
 * tsdown preset for dsh-split-panes: an ESM node half with declarations plus
 * a browser half (lib/client.js) wrapped for the harness client-plugin loader.
 * The browser half keeps the loader's platform module table external
 * (react, cordis, ui-slots, web-react, primitives, runtime) and inlines
 * everything else; CSS Modules compile through lightningcss into a
 * <style data-plugin> tag injected at factory execution (removed on unload),
 * the same mechanism as the official client bundles.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import type { UserConfig } from 'tsdown'

const PLUGIN_ID = '@dsh-external/dsh-split-panes'
const PLUGIN_ROOT = fileURLToPath(new URL('.', import.meta.url))

/**
 * Repo-relative, slash-separated id for a file — the only file name that may
 * reach the bundle.
 *
 * Two things leaked the checkout location into `lib/client.js`: lightningcss
 * hashes the FILENAME it is given to build the CSS-module class names, and
 * rolldown writes the virtual module id into a `//#region` comment. Either way
 * the bundle built on Windows never matched the one built at
 * /home/runner/work/..., the artifact was not reproducible, and the upstream
 * tracker's "did the bundle change?" release signal was always yes.
 */
function stableId(abs: string): string {
  return relative(PLUGIN_ROOT, abs).split(sep).join('/')
}

/** Module specifiers the dsh web shell shares into its frozen module table. */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-schema-form',
] as const

/** Externals resolved from the loader module table (platform + core client services). */
const CLIENT_EXTERNALS: readonly string[] = [
  ...PLATFORM_MODULES,
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-ui-session',
  '@deepseek-ai/dsh-api-session-controller',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-layout',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-session',
]

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

export default [
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: true,
    clean: true,
    deps: {
      neverBundle: ['schemastery', 'cordis'],
    },
  },
  {
    // Browser bundle: lib/client.js, served by the harness at /plugins/<id>/client.js.
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    deps: {
      neverBundle: [...CLIENT_EXTERNALS],
      alwaysBundle: (id: string) => !CLIENT_EXTERNALS.includes(id),
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    plugins: [{
      // Bundle purity gate: platform seed entries stay external, every other
      // @deepseek-ai value import is a build error (cross-plugin value imports
      // would inline a duplicate instance or need an unknown table specifier).
      name: 'dsh-client-bundle-purity',
      resolveId(source: string) {
        if (!source.startsWith('@deepseek-ai/')) return null
        if (CLIENT_EXTERNALS.includes(source)) return null
        throw new Error(
          `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS) — `
          + 'cross-plugin value imports are forbidden; collaborate through cordis services',
        )
      },
    }, {
      // CSS Modules → hashed class map + one injected <style data-plugin> tag.
      name: 'dsh-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? resolve(dirname(importer), source) : source
        return CSS_VIRTUAL_PREFIX + stableId(abs) + CSS_VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
        if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const stableName = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
        const fileId = resolve(PLUGIN_ROOT, stableName)
        this.addWatchFile(fileId)
        const source = await readFile(fileId)
        // `filename` drives the `[hash]` in the class names, so it must not
        // contain machine-specific path text (see below).
        const { code, exports: cssExports } = transform({
          filename: stableName,
          code: source,
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        const classMap: Record<string, string> = {}
        // Sorted keys: lightningcss returns its CSS-module export map in a
        // hash-dependent order, so serializing it verbatim made every build
        // emit different bytes for identical sources (noisy diffs, and the
        // upgrade script's "did the bundle change?" release signal always
        // said yes). The values are content hashes already; only the key
        // order needed pinning.
        const exports0 = cssExports ?? {}
        for (const local of Object.keys(exports0).sort()) classMap[local] = exports0[local]!.name
        const tagId = `${PLUGIN_ID}/${basename(fileId)}`
        return [
          `const css = ${JSON.stringify(code.toString())};`,
          `const tagId = ${JSON.stringify(tagId)};`,
          `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
          `  const tag = document.createElement('style');`,
          `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
          `  tag.dataset.pluginCss = tagId;`,
          `  tag.textContent = css;`,
          `  document.head.appendChild(tag);`,
          `}`,
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: `return module.exports; } });`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
] satisfies UserConfig[]
