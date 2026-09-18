import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { platformSuffixResolver } from './mason-test-kit/platform-suffix-resolver';

const root = resolve(__dirname, '../..');

/**
 * Bare specifier resolver for the in-repo masonkit package. The workspace does
 * not symlink it into node_modules, so Node's ESM loader cannot find it; this
 * routes the import to the source entry before Node sees it.
 */
const masonkitInternalResolver = () => ({
  name: 'masonkit-internal-resolver',
  enforce: 'pre' as const,
  resolveId(source: string) {
    if (source === '@triniwiz/nativescript-masonkit') {
      return resolve(root, 'packages/nativescript-masonkit/index.android.ts');
    }
    return null;
  },
});

export default defineConfig({
  // NativeScript's platform flags are compile-time globals; style.ts branches on
  // them at call time. All false = the platform-neutral path, which is what the
  // ArrayBuffer-backed test seam needs.
  define: {
    __ANDROID__: 'false',
    __APPLE__: 'false',
    __IOS__: 'false',
    __VISIONOS__: 'false',
    __WINDOWS__: 'false',
    __DEV__: 'true',
    __COMMONJS__: 'false',
    __TEST__: 'true',
    __UI_USE_EXTERNAL_RENDERER__: 'false',
    __UI_USE_XML_PARSER__: 'false',
    __CSS_PARSER__: '"css-tree"',
    __SNAPSHOT__: 'false',
  },
  plugins: [masonkitInternalResolver(), platformSuffixResolver('android')],
  resolve: {
    alias: [
      { find: /^@nativescript\/core$/, replacement: resolve(root, 'tools/testing/mason-test-kit/ns-core-stub.ts') },
      { find: /^@nativescript\/core\/utils$/, replacement: resolve(root, 'tools/testing/mason-test-kit/ns-layout.ts') },
      { find: /^@nativescript\/core\/utils\/layout-helper$/, replacement: resolve(root, 'tools/testing/mason-test-kit/ns-layout.ts') },
      { find: /^~\/package\.json$/, replacement: resolve(root, 'package.json') },
    ],
  },
  test: {
    root,
    environment: 'node',
    setupFiles: [resolve(root, 'tools/testing/mason-test-kit/setup.ts')],
    include: ['packages/**/*.spec.ts', 'tools/testing/**/*.spec.ts'],
    server: {
      // @nativescript/core is ESM with directory imports ("./globals"), which
      // Node's own resolver rejects. Inlining routes it through Vite's resolver
      // instead, which understands them.
      deps: { inline: [/@nativescript[\\/]core/] },
    },
  },
});
