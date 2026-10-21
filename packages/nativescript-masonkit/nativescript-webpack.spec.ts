import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// nativescript.webpack.js is plain CommonJS, as @nativescript/webpack requires it.
const applyConfig = createRequire(import.meta.url)('./nativescript.webpack.js') as (webpack: unknown) => void;

const APP_ENTRY = '/app/src/app.ts';

/** Runs the config against a bundle entry holding `entries` and DefinePlugin `defines`. */
function runConfig(entries: string[], defines: Record<string, unknown> | null = {}, platform = 'android') {
  let values = [...entries];
  const bundle = {
    values: () => [...values],
    clear: () => {
      values = [];
      return bundle;
    },
    add: (entry: string) => {
      values.push(entry);
      return bundle;
    },
  };
  let args = defines ? [defines] : [];
  const config = {
    entry: () => bundle,
    plugins: { has: (name: string) => name === 'DefinePlugin' && defines !== null },
    plugin: () => ({ tap: (fn: (a: unknown[]) => unknown[]) => (args = fn(args) as typeof args) }),
  };
  applyConfig({
    Utils: { platform: { getEntryPath: () => APP_ENTRY, getPlatformName: () => platform } },
    chainWebpack: (fn: (config: unknown) => void) => fn(config),
  });
  return { entries: values, defines: args[0] };
}

const bundleAfterConfig = (entries: string[]) => runConfig(entries).entries;

describe('nativescript.webpack.js', () => {
  // app-css-loader imports app.css at the top of the app entry, so MasonKit's
  // shorthand converters have to be registered by an earlier entry module.
  it('loads MasonKit right before the app entry', () => {
    expect(bundleAfterConfig(['@nativescript/core/globals/index', '@nativescript/core/bundle-entry-points', APP_ENTRY, '@nativescript/core/ui/frame'])).toEqual(['@nativescript/core/globals/index', '@nativescript/core/bundle-entry-points', '@triniwiz/nativescript-masonkit', APP_ENTRY, '@nativescript/core/ui/frame']);
  });

  it('leaves an entry without the app entry, or already loading MasonKit, alone', () => {
    expect(bundleAfterConfig(['@nativescript/core/globals/index'])).toEqual(['@nativescript/core/globals/index']);
    const already = ['@triniwiz/nativescript-masonkit', APP_ENTRY];
    expect(bundleAfterConfig(already)).toEqual(already);
  });

  it('defines __WINDOWS__ when the webpack release does not', () => {
    expect(runConfig([APP_ENTRY], { __ANDROID__: true }).defines).toEqual({ __ANDROID__: true, __WINDOWS__: false });
    expect(runConfig([APP_ENTRY], {}, 'windows').defines).toEqual({ __WINDOWS__: true });
    expect(runConfig([APP_ENTRY], { __WINDOWS__: 'kept' }).defines).toEqual({ __WINDOWS__: 'kept' });
    expect(runConfig([APP_ENTRY], null).entries).toEqual(['@triniwiz/nativescript-masonkit', APP_ENTRY]);
  });
});
