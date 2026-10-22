import { createRequire } from 'node:module';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const guard = require('./postcss-guard.js') as { before: () => postcss.Plugin; after: () => postcss.Plugin };
const applyConfig = require('./nativescript.webpack.js') as (webpack: unknown) => void;

// Stands in for @nativescript/tailwind's step: drops what core can't apply, rewrites rem.
const coreOnly: postcss.PluginCreator<void> = () => ({
  postcssPlugin: 'core-only',
  Rule(rule) {
    if (rule.selector.includes(':hover')) rule.remove();
  },
  Declaration(decl) {
    if (decl.value.includes('rem')) decl.value = decl.value.replace(/(\d*\.?\d+)rem/g, (_, n) => String(parseFloat(n) * 16));
    if (!decl.prop.startsWith('--') && ['display', 'gap', 'grid-template-columns'].includes(decl.prop)) decl.remove();
    if (!decl.prop.startsWith('--') && /vw$/.test(decl.value)) decl.remove();
  },
});
coreOnly.postcss = true;

const run = (css: string, plugins: postcss.AcceptedPlugin[]) => postcss(plugins).process(css, { from: undefined }).css;

describe('postcss-guard', () => {
  const css = '.card { display: flex; gap: 8px; padding: 1rem; width: 50vw; color: red } .card:hover { opacity: 0.5 }';

  it('without it, the tailwind step loses the CSS MasonKit supports', () => {
    expect(run(css, [coreOnly])).toBe('.card { padding: 16; color: red }');
  });

  it('puts back what the step removed and keeps what it rewrote', () => {
    expect(run(css, [guard.before(), coreOnly, guard.after()])).toBe('.card { display: flex; gap: 8px; padding: 16; width: 50vw; color: red } .card:hover { opacity: 0.5 }');
  });

  it('leaves custom properties and !important as they were', () => {
    expect(run('.a { --x: 1rem; display: grid !important }', [guard.before(), coreOnly, guard.after()])).toBe('.a { --x: 16; display: grid !important }');
  });
});

describe('nativescript.webpack.js and @nativescript/tailwind', () => {
  function postcssPlugins(plugins: unknown[]) {
    let options: any = { postcssOptions: { plugins } };
    const rule = { uses: { has: () => true }, use: () => ({ tap: (fn: (o: unknown) => unknown) => (options = fn(options)) }) };
    const config = {
      entry: () => ({ values: () => [], clear() {}, add() {} }),
      plugins: { has: () => false },
      module: { rules: { has: (name: string) => name === 'css' }, rule: () => rule },
    };
    applyConfig({ Utils: { platform: { getEntryPath: () => '/app.ts', getPlatformName: () => 'android' } }, chainWebpack: (fn: (c: unknown) => void) => fn(config) });
    return options.postcssOptions.plugins as unknown[];
  }

  it('wraps the tailwind step in the guard', () => {
    const plugins = postcssPlugins(['postcss-preset-env', '@nativescript/tailwind', 'other']);
    expect(plugins.map((p) => (typeof p === 'string' ? p : (p as postcss.Plugin).postcssPlugin))).toEqual(['postcss-preset-env', 'masonkit-css-guard-before', '@nativescript/tailwind', 'masonkit-css-guard-after', 'other']);
  });

  it('leaves a build without tailwind alone', () => {
    expect(postcssPlugins(['postcss-preset-env'])).toEqual(['postcss-preset-env']);
  });
});
