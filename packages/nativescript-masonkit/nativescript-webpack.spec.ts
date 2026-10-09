import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// nativescript.webpack.js is plain CommonJS, as @nativescript/webpack requires it.
const applyConfig = createRequire(import.meta.url)('./nativescript.webpack.js') as (webpack: unknown) => void;

const APP_ENTRY = '/app/src/app.ts';

/** Runs the config against a bundle entry holding `entries`, returning the result. */
function bundleAfterConfig(entries: string[]): string[] {
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
  applyConfig({
    Utils: { platform: { getEntryPath: () => APP_ENTRY } },
    chainWebpack: (fn: (config: unknown) => void) => fn({ entry: () => bundle }),
  });
  return values;
}

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
});
