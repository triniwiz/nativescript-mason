import { beforeEach, describe, expect, it } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { evaluateCssMath, substituteCssMath, type CssUnitResolver } from './css-math';
import { cssLengthToDip, resolveCssMathIn } from './style';
import { setCssUnitContext } from './units';
import './properties';

// 16px root, 400x800 viewport, em = 10px.
const units: CssUnitResolver = (n, unit) => {
  switch (unit) {
    case 'px':
      return n;
    case 'rem':
      return n * 16;
    case 'em':
      return n * 10;
    case 'vw':
      return n * 4;
    case 'vh':
      return n * 8;
    default:
      return undefined;
  }
};

describe('evaluateCssMath', () => {
  it.each([
    ['calc(0.75rem - 1px)', 11],
    ['calc(1rem + 2em)', 36],
    ['calc(2 * 3px)', 6],
    ['calc(3px * 2)', 6],
    ['calc(10px / 4)', 2.5],
    ['calc((1rem + 4px) * 2)', 40],
    ['calc(1rem + calc(2px * 2))', 20],
    ['calc(-1 * 1rem)', -16],
    ['calc(1px -2px)', -1],
    ['min(10rem, 50vw)', 160],
    ['max(10rem, 50vw, 1px)', 200],
    ['clamp(2rem, 1.5rem + 1.875vw, 2.5rem)', 32],
    ['clamp(1rem, 1rem + 2vw, 3rem)', 24],
    ['clamp(1rem, 0px, 3rem)', 16],
    ['clamp(1rem, 100vw, 3rem)', 48],
    ['CALC(1PX + 1REM)', 17],
    ['calc(2.5e1px)', 25],
  ])('%s is %dpx', (value, px) => {
    expect(evaluateCssMath(value, units)).toEqual({ kind: 'length', px });
  });

  it('keeps a pure percentage a percentage', () => {
    expect(evaluateCssMath('calc(50% - 10%)', units)).toEqual({ kind: 'percent', percent: 40 });
    expect(evaluateCssMath('min(10%, 20%)', units)).toEqual({ kind: 'percent', percent: 10 });
  });

  it('evaluates plain numbers', () => {
    expect(evaluateCssMath('calc(1.5 * 2)', units)).toEqual({ kind: 'number', value: 3 });
    expect(evaluateCssMath('max(1, 2)', units)).toEqual({ kind: 'number', value: 2 });
  });

  it.each([
    // A percentage's basis is only known at layout.
    'calc(100% - 20px)',
    'min(100%, 200px)',
    // Type errors and units this context can't resolve.
    'calc(1px + 2)',
    'calc(1px * 2px)',
    'calc(2 / 1px)',
    'calc(1ch + 1px)',
    'calc(1px / 0)',
    'clamp(1px, 2px)',
    // Not math, or malformed.
    'var(--x)',
    '10px',
    'calc(1px + )',
    'calc(1px',
    'calc(1px) 2px',
    'calc(foo(1px))',
  ])('leaves %s unresolved', (value) => {
    expect(evaluateCssMath(value, units)).toBeUndefined();
  });
});

describe('substituteCssMath', () => {
  it('replaces each function that resolves and leaves the rest', () => {
    expect(substituteCssMath('0 0 calc(0.5rem + 1px) red', units)).toBe('0 0 9px red');
    expect(substituteCssMath('translateX(min(1rem, 2px)) rotate(45deg)', units)).toBe('translateX(2px) rotate(45deg)');
    expect(substituteCssMath('calc(100% - 1px) calc(1rem - 1px)', units)).toBe('calc(100% - 1px) 15px');
  });

  it('leaves url() alone', () => {
    const value = 'url("data:image/svg+xml,<path d=\'calc(1px)\'/>") calc(1px + 1px)';
    expect(substituteCssMath(value, units)).toBe('url("data:image/svg+xml,<path d=\'calc(1px)\'/>") 2px');
  });

  it('rounds away float noise', () => {
    expect(substituteCssMath('calc(0.1px + 0.2px)', units)).toBe('0.3px');
  });
});

describe('Mason lengths evaluate math functions with its units', () => {
  beforeEach(() => {
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
  });

  it.each([
    ['paddingLeft', 'calc(0.75rem - 1px)', 'PADDING_LEFT_VALUE', 11],
    ['marginTop', 'clamp(1rem, 10vw, 2rem)', 'MARGIN_TOP_VALUE', 32],
    ['width', 'min(10rem, 50vw)', 'WIDTH_VALUE', 160],
    ['maxWidth', 'max(10rem, 50vw)', 'MAX_WIDTH_VALUE', 200],
    ['rowGap', 'calc(0.5rem + 2px)', 'GAP_ROW_VALUE', 10],
    ['borderTopWidth', 'calc(1px * 2)', 'BORDER_TOP_VALUE', 2],
  ])('%s: %s', (prop, value, key, cssPx) => {
    for (const scale of [1, 2, 3]) {
      setScreenScale(scale);
      const t = styleUnderTest();
      (t.style as any)[prop] = value;
      expect(t.getFloat32(styleKey(key))).toBeCloseTo(cssPx * scale, 3);
    }
  });

  it('em inside calc() uses the element font size', () => {
    setScreenScale(1);
    const t = styleUnderTest();
    t.style.fontSize = 20 as never;
    (t.style as any).paddingLeft = 'calc(1em + 1rem)';
    expect(t.getFloat32(styleKey('PADDING_LEFT_VALUE'))).toBeCloseTo(36, 3);
  });

  it('a pure percentage stays a percentage', () => {
    setScreenScale(2);
    const t = styleUnderTest();
    (t.style as any).width = 'calc(100% - 25%)';
    expect(t.getInt8(styleKey('WIDTH_TYPE'))).toBe(2);
    expect(t.getFloat32(styleKey('WIDTH_VALUE'))).toBeCloseTo(0.75, 4);
  });

  it('font-size resolves rem and the viewport, and keeps em parent-relative', () => {
    const t = styleUnderTest();
    (t.style as any).fontSize = 'clamp(1rem, 1rem + 2vw, 3rem)';
    expect(t.getFloat32(styleKey('FONT_SIZE'))).toBe(24);
    expect(t.getInt8(styleKey('FONT_SIZE_TYPE'))).toBe(0);
    (t.style as any).fontSize = 'calc(1.5em)';
    expect(t.getFloat32(styleKey('FONT_SIZE'))).toBe(150);
    expect(t.getInt8(styleKey('FONT_SIZE_TYPE'))).toBe(1);
    // em mixed with px can't be stored either way; it uses the root font size.
    (t.style as any).fontSize = 'clamp(12px, 0.75em, 0.75em)';
    expect(t.getFloat32(styleKey('FONT_SIZE'))).toBe(12);
    expect(t.getInt8(styleKey('FONT_SIZE_TYPE'))).toBe(0);
  });

  it('a stylesheet font-size reaches the setter as text', () => {
    const { under, style } = masonHost();
    (style as any)['font-size'] = 'calc(1rem + 4px)';
    expect(under.getFloat32(styleKey('FONT_SIZE'))).toBe(20);
  });

  it('a stylesheet gap or inset reaches the setter as text', () => {
    setScreenScale(2);
    const { under, style } = masonHost();
    (style as any)['gap'] = 'clamp(0.5rem, 1vw, 1rem)';
    (style as any)['left'] = 'calc(1rem - 2px)';
    expect(under.getFloat32(styleKey('GAP_COLUMN_VALUE'))).toBeCloseTo(8 * 2, 3);
    expect(under.getFloat32(styleKey('INSET_LEFT_VALUE'))).toBeCloseTo(14 * 2, 3);
  });

  it('cssLengthToDip resolves them, for core-owned sizes and shadows', () => {
    expect(cssLengthToDip('calc(1rem + 1vh)')).toBe(24);
    expect(cssLengthToDip('calc(100% - 1px)')).toBeUndefined();
  });

  it('string values read natively get their math resolved first', () => {
    expect(resolveCssMathIn('calc(0.75rem - 1px) 4px', 10)).toBe('11px 4px');
    expect(resolveCssMathIn('0 0 calc(2em) rgba(0, 0, 0, 0.5)', 10)).toBe('0 0 20px rgba(0, 0, 0, 0.5)');
  });
});
