import { describe, expect, it } from 'vitest';
import { resolveCssColors } from './css-colors';
import { cssColorToRgba } from './style';

const fake = (color: string) => `<${color}>`;

describe('resolveCssColors', () => {
  it('leaves values without colour functions alone', () => {
    expect(resolveCssColors('0 2px 4px #000', fake)).toBe('0 2px 4px #000');
    expect(resolveCssColors('1px solid rgba(0, 0, 0, 0.5)', fake)).toBe('1px solid rgba(0, 0, 0, 0.5)');
    expect(resolveCssColors('blur(4px) drop-shadow(0 0 2px red)', fake)).toBe('blur(4px) drop-shadow(0 0 2px red)');
  });

  it('replaces each colour function in place, outermost first', () => {
    const shadow = '0 2px 4px color-mix(in oklch, oklch(0% 0 0) 4%, transparent), 0 6px 12px oklch(60% 0.2 240)';
    expect(resolveCssColors(shadow, fake)).toBe('0 2px 4px <color-mix(in oklch, oklch(0% 0 0) 4%, transparent)>, 0 6px 12px <oklch(60% 0.2 240)>');
  });

  it('resolves space-separated rgb() but not the comma form', () => {
    expect(resolveCssColors('rgb(0 0 0 / 15%)', fake)).toBe('<rgb(0 0 0 / 15%)>');
    expect(resolveCssColors('rgb(0, 0, 0)', fake)).toBe('rgb(0, 0, 0)');
  });

  it('keeps calls it cannot resolve, and anything holding a var()', () => {
    expect(resolveCssColors('0 0 2px oklch(nonsense)', () => null)).toBe('0 0 2px oklch(nonsense)');
    expect(resolveCssColors('0 0 2px color-mix(in srgb, var(--x) 50%, red)', fake)).toBe('0 0 2px color-mix(in srgb, var(--x) 50%, red)');
  });

  it('does not touch functions that merely end in a colour name', () => {
    expect(resolveCssColors('linear-gradient(red, blue)', fake)).toBe('linear-gradient(red, blue)');
  });

  it('rewrites functions inside gradients and preserves UTF-16 offsets, quotes, and URLs', () => {
    const value = '/* 🎨 */ url("oklch(0 0 0)") "rgb(1 2 3)" linear-gradient(OKLCH(60% 0.2 240), red)';
    expect(resolveCssColors(value, fake)).toBe(value.replace('OKLCH(60% 0.2 240)', '<OKLCH(60% 0.2 240)>'));
    expect(resolveCssColors('oklch(60% 0.2 240', fake)).toBe('oklch(60% 0.2 240');
  });
});

// The bridge packs alpha into one byte.
function rgba(value: string | null) {
  const [r, g, b, a] = /rgba\(([^)]*)\)/
    .exec(value ?? '')![1]
    .split(',')
    .map(Number);
  return { r, g, b, a };
}

describe('cssColorToRgba', () => {
  it('serializes packed colors from Rust, including opaque white', () => {
    const shadow = rgba(cssColorToRgba('color-mix(in oklch, oklch(from #000 l c h / 0.04) 100%, transparent)'));
    expect(shadow).toMatchObject({ r: 0, g: 0, b: 0 });
    expect(shadow.a).toBeCloseTo(0.04, 2);
    expect(rgba(cssColorToRgba('rgb(0 0 0 / 15%)')).a).toBeCloseTo(0.15, 2);
    expect(cssColorToRgba('white')).toBe('rgba(255, 255, 255, 1)');
  });

  it('returns null for something that is not a colour', () => {
    expect(cssColorToRgba('oklch(nonsense)')).toBeNull();
  });
});
