import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';

const SUFFIXED = (base: string, platform: string) => [`${base}.${platform}.js`, `${base}/index.${platform}.js`, `${base}.${platform}.ts`, `${base}/index.${platform}.ts`, `${base}.js`, `${base}/index.js`];

/**
 * `@nativescript/core` ships platform-suffixed modules (`utils/index.ios.js`,
 * `ui/styling/background.ios.js`, ...) and relies on NativeScript's webpack
 * resolver to pick one; it also has no `exports` map, so its subpaths are bare
 * directory imports. Node's resolver rejects both. This resolves them the way
 * the NativeScript build does, which is the only thing standing between plain
 * Node and importing core.
 */
export function platformSuffixResolver(platform: 'ios' | 'android' = 'ios'): Plugin {
  let coreRoot: string | undefined;
  let masonRoot: string | undefined;
  let utilsStub: string | undefined;
  let layoutStub: string | undefined;
  // Core modules that reach for the platform runtime at module scope (defining
  // NSObject subclasses and the like) and have to be swapped wholesale.
  let stubs: Array<[RegExp, string]> = [];

  return {
    name: 'mason-platform-suffix-resolver',
    enforce: 'pre',
    configResolved(config) {
      coreRoot = resolve(config.root, 'node_modules/@nativescript/core');
      masonRoot = resolve(config.root, 'packages/nativescript-masonkit');
      utilsStub = resolve(config.root, 'tools/testing/mason-test-kit/utils-stub.ts');
      layoutStub = resolve(config.root, 'tools/testing/mason-test-kit/ns-layout.ts');
      stubs = [
        [/[\\/]utils[\\/]layout-helper$/, layoutStub],
        [/[\\/]timer$/, resolve(config.root, 'tools/testing/mason-test-kit/ns-timer-stub.ts')],
      ];
    },
    resolveId(source, importer) {
      if (/\.(js|json|mjs|cjs)$/.test(source)) return null;

      // Bare subpath into core, e.g. "@nativescript/core/ui/styling/background".
      if (coreRoot && source.startsWith('@nativescript/core/')) {
        const base = resolve(coreRoot, source.slice('@nativescript/core/'.length));
        return SUFFIXED(base, platform).find(existsSync) ?? null;
      }

      // Relative import, e.g. core's "./layout-helper" or masonkit's "./utils".
      if (importer && source.startsWith('.') && !/\.ts$/.test(source)) {
        const base = resolve(dirname(importer), source);
        // masonkit's own `./utils` is platform-split and pulls in the whole NS UI
        // layer. Scope this to masonkit: core has several `./utils` modules of
        // its own (globals/polyfills/utils, for one) that must resolve normally.
        if (utilsStub && masonRoot && importer.startsWith(masonRoot) && base === resolve(masonRoot, 'utils')) {
          return utilsStub;
        }
        for (const [pattern, stub] of stubs) {
          if (pattern.test(base)) return stub;
        }
        return SUFFIXED(base, platform).find(existsSync) ?? null;
      }

      return null;
    },
  };
}
