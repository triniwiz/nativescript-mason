import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { platformSuffixResolver } from './mason-test-kit/platform-suffix-resolver';

const root = resolve(__dirname, '../..');

/**
 * Bare specifier resolver for the in-repo masonkit package. The workspace does
 * not symlink it into node_modules, so Node's ESM loader cannot find it; this
 * routes the import to the source entry before Node sees it.
 */
/** Prefer masonkit's `.windows.ts` modules, as the Windows build does. */
const windowsSuffixResolver = () => ({
  name: 'masonkit-windows-suffix-resolver',
  enforce: 'pre' as const,
  resolveId(source: string, importer?: string) {
    if (!importer || !source.startsWith('.') || /\.(ts|js)$/.test(source)) return null;
    const masonRoot = resolve(root, 'packages/nativescript-masonkit');
    if (!importer.startsWith(masonRoot)) return null;
    const base = resolve(dirname(importer), source);
    return [`${base}.windows.ts`, `${base}/index.windows.ts`].find(existsSync) ?? null;
  },
});

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
    server: {
      // Core and Vue's DOM use ESM directory imports that Node rejects.
      // Inline them so Vite resolves those imports for renderer integration tests.
      deps: { inline: [/@nativescript[\\/]core/, /nativescript-vue/] },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'masonkit',
          include: ['packages/**/*.spec.ts', 'tools/testing/**/*.spec.ts'],
          exclude: ['**/node_modules/**', 'packages/**/*.windows.spec.ts', 'packages/**/*.android.spec.ts', 'packages/**/style-native-sync.spec.ts'],
        },
      },
      {
        extends: true,
        define: { __ANDROID__: 'true' },
        test: { name: 'android-sync', include: ['packages/**/style-native-sync.spec.ts'] },
      },
      {
        extends: true,
        define: { __APPLE__: 'true' },
        test: { name: 'apple-sync', include: ['packages/**/style-native-sync.spec.ts'] },
      },
      {
        extends: true,
        define: { __WINDOWS__: 'true' },
        plugins: [windowsSuffixResolver()],
        test: { name: 'windows-sync', include: ['packages/**/style-native-sync.spec.ts'] },
      },
      {
        // Android code paths, against mocked org.nativescript.mason natives.
        extends: true,
        define: { __ANDROID__: 'true' },
        test: { name: 'android', include: ['packages/**/*.android.spec.ts'] },
      },
      {
        // Windows code paths, against mocked NativeScript.Mason natives.
        extends: true,
        define: { __WINDOWS__: 'true' },
        plugins: [windowsSuffixResolver()],
        test: {
          name: 'windows',
          include: ['packages/**/*.windows.spec.ts'],
        },
      },
    ],
  },
});
