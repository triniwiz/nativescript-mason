import { beforeEach, describe, expect, it } from 'vitest';
import { styleUnderTest, type StyleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { setCssUnitContext } from './units';

// The unit contract these tests encode:
//
//   CSS `px` === 1 dip === 1 CSS pixel, exactly as on the web.
//   A bare number is also dip (NativeScript's convention, unchanged).
//   `dppx` is the escape hatch for a literal device pixel.
//
// Geometry buffers hold DEVICE pixels, so a dip input is multiplied by the
// screen scale. FONT_SIZE / LINE_HEIGHT / LETTER_SPACING buffers hold dip, so
// those are scale-invariant. Running the whole table at more than one scale is
// what makes a px/dip confusion visible at all — at scale 1 the two are
// indistinguishable, which is why several of these shipped.
const SCALES = [1, 2, 3];

// Offsets come from style.ts's own StyleKeys enum (see style-keys.ts) rather
// than a copy here: asserting against the real offset means a setter that writes
// the right number into the wrong slot still fails, and the table can't drift.
const K = new Proxy({} as Record<string, number>, { get: (_t, name: string) => styleKey(name) });

/** Dimension/LengthPercentage type discriminants, per parseDimension in style.ts. */
const TYPE_POINTS_DIM = 1;
const TYPE_PERCENT_DIM = 2;
/** LengthPercentage (padding, gap) swaps 0/1: 0 = points, 1 = percent. */
const TYPE_POINTS_LP = 0;

type Case = {
  /** Property to assign. */
  prop: string;
  /** Value to assign. */
  input: unknown;
  /** Offset of the f32 the setter should land in. */
  valueOffset: number;
  /** Expected f32, given the screen scale. */
  expected: (scale: number) => number;
  /** Offset + expected value of the type discriminant, when it should be checked. */
  typeOffset?: number;
  typeValue?: number;
};

/** A CSS-pixel length: scales with the device, whatever spelling was used. */
function cssPx(n: number) {
  return (scale: number) => n * scale;
}
/** A dip-invariant length: buffer stores dip, so the same at every scale. */
function dipConstant(n: number) {
  return () => n;
}

const GEOMETRY: Case[] = [
  // --- width: every spelling of "100 CSS pixels" must land identically -------
  { prop: 'width', input: '100px', valueOffset: K.WIDTH_VALUE, expected: cssPx(100), typeOffset: K.WIDTH_TYPE, typeValue: TYPE_POINTS_DIM },
  { prop: 'width', input: 100, valueOffset: K.WIDTH_VALUE, expected: cssPx(100), typeOffset: K.WIDTH_TYPE, typeValue: TYPE_POINTS_DIM },
  { prop: 'width', input: '100dip', valueOffset: K.WIDTH_VALUE, expected: cssPx(100) },
  { prop: 'width', input: { value: 100, unit: 'px' }, valueOffset: K.WIDTH_VALUE, expected: cssPx(100) },
  { prop: 'width', input: { value: 100, unit: 'dip' }, valueOffset: K.WIDTH_VALUE, expected: cssPx(100) },
  // The escape hatch: an explicit device pixel is NOT scaled.
  { prop: 'width', input: '100dppx', valueOffset: K.WIDTH_VALUE, expected: () => 100 },
  // Percentages are a [0,1] fraction and never scale.
  { prop: 'width', input: '50%', valueOffset: K.WIDTH_VALUE, expected: () => 0.5, typeOffset: K.WIDTH_TYPE, typeValue: TYPE_PERCENT_DIM },

  // --- the same contract across the other length-bearing properties ---------
  { prop: 'height', input: '100px', valueOffset: K.HEIGHT_VALUE, expected: cssPx(100) },
  { prop: 'minWidth', input: '100px', valueOffset: K.MIN_WIDTH_VALUE, expected: cssPx(100) },
  { prop: 'maxWidth', input: '100px', valueOffset: K.MAX_WIDTH_VALUE, expected: cssPx(100) },
  { prop: 'flexBasis', input: '100px', valueOffset: K.FLEX_BASIS_VALUE, expected: cssPx(100) },
  { prop: 'paddingLeft', input: '10px', valueOffset: K.PADDING_LEFT_VALUE, expected: cssPx(10), typeOffset: K.PADDING_LEFT_TYPE, typeValue: TYPE_POINTS_LP },
  { prop: 'marginTop', input: '10px', valueOffset: K.MARGIN_TOP_VALUE, expected: cssPx(10) },

  // --- shorthands go through their own parser -------------------------------
  { prop: 'padding', input: '10px 20px', valueOffset: K.PADDING_LEFT_VALUE, expected: cssPx(20) },
  { prop: 'padding', input: 10, valueOffset: K.PADDING_LEFT_VALUE, expected: cssPx(10) },
  { prop: 'margin', input: '10px', valueOffset: K.MARGIN_TOP_VALUE, expected: cssPx(10) },
  { prop: 'margin', input: 10, valueOffset: K.MARGIN_TOP_VALUE, expected: cssPx(10) },

  // --- gap: the longhands historically had no string case at all ------------
  { prop: 'gap', input: '10px', valueOffset: K.GAP_ROW_VALUE, expected: cssPx(10) },
  { prop: 'gap', input: '10px 20px', valueOffset: K.GAP_COLUMN_VALUE, expected: cssPx(20) },
  { prop: 'rowGap', input: '10px', valueOffset: K.GAP_ROW_VALUE, expected: cssPx(10) },
  { prop: 'rowGap', input: 10, valueOffset: K.GAP_ROW_VALUE, expected: cssPx(10) },
  { prop: 'columnGap', input: '10px', valueOffset: K.GAP_COLUMN_VALUE, expected: cssPx(10) },
  { prop: 'rowGap', input: { value: 10, unit: 'px' }, valueOffset: K.GAP_ROW_VALUE, expected: cssPx(10) },

  // --- border widths: also had no string case -------------------------------
  { prop: 'borderLeftWidth', input: '2px', valueOffset: K.BORDER_LEFT_VALUE, expected: cssPx(2) },
  { prop: 'borderLeftWidth', input: 2, valueOffset: K.BORDER_LEFT_VALUE, expected: cssPx(2) },
];

const TEXT_DIP: Case[] = [
  // FONT_SIZE's buffer is dip (TextEngine.kt applies COMPLEX_UNIT_SP), so these
  // must NOT scale — the mirror image of the geometry rows above.
  { prop: 'fontSize', input: 20, valueOffset: K.FONT_SIZE, expected: dipConstant(20) },
  { prop: 'fontSize', input: '20px', valueOffset: K.FONT_SIZE, expected: dipConstant(20) },
  { prop: 'fontSize', input: { value: 20, unit: 'px' }, valueOffset: K.FONT_SIZE, expected: dipConstant(20) },
  { prop: 'fontSize', input: { value: 20, unit: 'dip' }, valueOffset: K.FONT_SIZE, expected: dipConstant(20) },
];

function assign(t: StyleUnderTest, prop: string, input: unknown) {
  (t.style as any)[prop] = input;
}

describe.each(SCALES)('screen scale %i', (scale) => {
  beforeEach(() => setScreenScale(scale));

  describe('geometry lengths are stored in device pixels', () => {
    it.each(GEOMETRY.map((c) => [`${c.prop} = ${JSON.stringify(c.input)}`, c] as const))('%s', (_label, c) => {
      const t = styleUnderTest();
      assign(t, c.prop, c.input);
      expect(t.getFloat32(c.valueOffset)).toBeCloseTo(c.expected(scale), 4);
      if (c.typeOffset !== undefined) {
        expect(t.getInt8(c.typeOffset)).toBe(c.typeValue);
      }
    });
  });

  describe('font metrics are stored in dip', () => {
    it.each(TEXT_DIP.map((c) => [`${c.prop} = ${JSON.stringify(c.input)}`, c] as const))('%s', (_label, c) => {
      const t = styleUnderTest();
      assign(t, c.prop, c.input);
      expect(t.getInt32(c.valueOffset)).toBe(c.expected(scale));
    });
  });

  it('never writes NaN or Infinity, whatever the input', () => {
    const garbage = ['', 'bananas', 'NaNpx', '1e999px', 'calc(', '%', '-', 'auto auto auto auto auto', null, undefined, {}];
    for (const prop of ['width', 'height', 'minWidth', 'maxWidth', 'paddingLeft', 'marginTop', 'rowGap', 'flexBasis']) {
      for (const input of garbage) {
        const t = styleUnderTest();
        try {
          assign(t, prop, input);
        } catch {
          // A throw is a separate defect (the browser ignores a bad
          // declaration); this test only guards the buffer contents.
          continue;
        }
        const floats = new Float32Array(t.bytes.buffer);
        for (const [i, v] of floats.entries()) {
          expect(Number.isFinite(v), `${prop} = ${JSON.stringify(input)} wrote ${v} at f32 index ${i}`).toBe(true);
        }
      }
    }
  });
});

describe('scale invariance', () => {
  // A single assertion that catches the whole bug class: whatever spelling is
  // used, a CSS length must come out N times bigger at scale N.
  it.each(GEOMETRY.filter((c) => c.input !== '100dppx' && c.input !== '50%').map((c) => [`${c.prop} = ${JSON.stringify(c.input)}`, c] as const))('%s scales linearly', (_label, c) => {
    const at = (scale: number) => {
      setScreenScale(scale);
      const t = styleUnderTest();
      assign(t, c.prop, c.input);
      return t.getFloat32(c.valueOffset);
    };
    const one = at(1);
    expect(one).not.toBe(0);
    expect(at(2)).toBeCloseTo(one * 2, 4);
    expect(at(3)).toBeCloseTo(one * 3, 4);
  });
});

describe('get/set round-trips in CSS pixels', () => {
  // The buffer stores device pixels, but the public unit is the CSS pixel in
  // both directions — otherwise reading a value and writing it back would
  // multiply it by the screen scale each time.
  const ROUND_TRIP: Array<[string, unknown, unknown]> = [
    ['width', '100px', { value: 100, unit: 'px' }],
    ['width', '50%', { value: 0.5, unit: '%' }],
    ['width', 'auto', 'auto'],
    ['height', '64px', { value: 64, unit: 'px' }],
    ['minWidth', '12px', { value: 12, unit: 'px' }],
    ['maxWidth', '480px', { value: 480, unit: 'px' }],
    ['paddingLeft', '8px', { value: 8, unit: 'px' }],
    ['marginTop', '24px', { value: 24, unit: 'px' }],
    ['left', '16px', { value: 16, unit: 'px' }],
  ];

  it.each(SCALES.flatMap((scale) => ROUND_TRIP.map(([prop, input, expected]) => [scale, prop, input, expected] as const)))('scale %i: %s = %j', (scale, prop, input, expected) => {
    setScreenScale(scale);
    const t = styleUnderTest();
    assign(t, prop, input);
    const read = (t.style as any)[prop];
    expect(read).toEqual(expected);

    // Writing the value straight back must not change it.
    const again = styleUnderTest();
    assign(again, prop, read);
    expect((again.style as any)[prop]).toEqual(expected);
  });
});

describe('CSS relative units', () => {
  // Before this, the native regex accepted only px|%|dip|em, so `rem` fell
  // through to parseFloat('1rem') === 1 and became 1 dip instead of 16 — the
  // reason @nativescript/tailwind has to pre-multiply rem by 16 before mason
  // ever sees it. Hand-written CSS got no such help.
  beforeEach(() => {
    setScreenScale(1);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
  });

  const CASES: Array<[string, number]> = [
    ['1rem', 16],
    ['0.5rem', 8],
    ['2rem', 32],
    ['12pt', 16], // 12pt = 12 * 96/72
    ['50vw', 200],
    ['25vh', 200],
    ['10vmin', 40], // min(400, 800) = 400
    ['10vmax', 80],
    ['10px', 10],
    ['10dip', 10],
    ['10', 10],
  ];

  it.each(CASES)('width: %s resolves to %i CSS px', (input, expected) => {
    const t = styleUnderTest();
    t.style.width = input as never;
    expect(t.getFloat32(K.WIDTH_VALUE)).toBeCloseTo(expected, 4);
  });

  it('scales relative units by the screen scale like any other length', () => {
    setScreenScale(3);
    const t = styleUnderTest();
    t.style.width = '1rem' as never;
    expect(t.getFloat32(K.WIDTH_VALUE)).toBeCloseTo(48, 4);
  });

  it('em on a length is relative to the element own font size', () => {
    const t = styleUnderTest();
    t.style.fontSize = 20;
    t.style.width = '2em' as never;
    expect(t.getFloat32(K.WIDTH_VALUE)).toBeCloseTo(40, 4);
  });

  it('em on a length falls back to the root font size when the element has none', () => {
    const t = styleUnderTest();
    t.style.width = '2em' as never;
    expect(t.getFloat32(K.WIDTH_VALUE)).toBeCloseTo(32, 4);
  });

  it('font-size in em becomes a percentage so inheritance resolves it natively', () => {
    const t = styleUnderTest();
    t.style.fontSize = '1.5em' as never;
    expect(t.getInt32(K.FONT_SIZE)).toBe(150);
    expect(t.getInt8(K.FONT_SIZE_TYPE)).toBe(1);
  });

  it('font-size in rem is absolute against the root font size', () => {
    const t = styleUnderTest();
    t.style.fontSize = '1.5rem' as never;
    expect(t.getInt32(K.FONT_SIZE)).toBe(24);
    expect(t.getInt8(K.FONT_SIZE_TYPE)).toBe(0);
  });

  it('an unknown viewport makes vw collapse to 0 rather than a bare number', () => {
    setCssUnitContext({ viewportWidth: 0, viewportHeight: 0 });
    const t = styleUnderTest();
    t.style.width = '50vw' as never;
    expect(t.getFloat32(K.WIDTH_VALUE)).toBe(0);
  });
});
