import { beforeEach, describe, expect, it } from 'vitest';
import { styleUnderTest, type StyleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { setCssUnitContext } from './units';
import { style_ } from './symbols';
import { DECORATION_COLOR_UNSET, isSideList, parseBorderRadiusShorthand, parseCornerShape, parseLinearGradientCss, parseRadialGradientCss, parseTextDecoration, refreshViewportUnits, parseTextDecorationLine, parseTransformOrigin, textDecorationLineToCss } from './style';

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

  // --- plain lengths, cached across scales ----------------------------------
  { prop: 'paddingLeft', input: ' 10px ', valueOffset: K.PADDING_LEFT_VALUE, expected: cssPx(10) },
  { prop: 'paddingLeft', input: '10PX', valueOffset: K.PADDING_LEFT_VALUE, expected: cssPx(10) },
  { prop: 'paddingLeft', input: '.5px', valueOffset: K.PADDING_LEFT_VALUE, expected: cssPx(0.5) },
  { prop: 'paddingLeft', input: '25%', valueOffset: K.PADDING_LEFT_VALUE, expected: () => 0.25, typeOffset: K.PADDING_LEFT_TYPE, typeValue: 1 },
  { prop: 'marginTop', input: '-4px', valueOffset: K.MARGIN_TOP_VALUE, expected: cssPx(-4) },
  { prop: 'marginTop', input: '0', valueOffset: K.MARGIN_TOP_VALUE, expected: () => 0 },
  { prop: 'minWidth', input: '8dip', valueOffset: K.MIN_WIDTH_VALUE, expected: cssPx(8) },

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
  { prop: 'fontSize', input: '12.8px', valueOffset: K.FONT_SIZE, expected: dipConstant(12.8) },
  { prop: 'fontSize', input: '0.8rem', valueOffset: K.FONT_SIZE, expected: dipConstant(12.8) },
];

// An absolute line-height (TYPE 1) is CSS px: iOS reads points, Android's span applies the density.
const LINE_HEIGHT_DIP: Case[] = [
  { prop: 'lineHeight', input: 20, valueOffset: K.LINE_HEIGHT, expected: dipConstant(20), typeOffset: K.LINE_HEIGHT_TYPE, typeValue: 1 },
  { prop: 'lineHeight', input: '20px', valueOffset: K.LINE_HEIGHT, expected: dipConstant(20), typeOffset: K.LINE_HEIGHT_TYPE, typeValue: 1 },
  { prop: 'lineHeight', input: { value: 20, unit: 'dip' }, valueOffset: K.LINE_HEIGHT, expected: dipConstant(20), typeOffset: K.LINE_HEIGHT_TYPE, typeValue: 1 },
  { prop: 'lineHeight', input: '1.5', valueOffset: K.LINE_HEIGHT, expected: dipConstant(1.5), typeOffset: K.LINE_HEIGHT_TYPE, typeValue: 0 },
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
      expect(t.getFloat32(c.valueOffset)).toBeCloseTo(c.expected(scale), 4);
    });
  });

  describe('absolute line-height is stored in dip', () => {
    it.each(LINE_HEIGHT_DIP.map((c) => [`${c.prop} = ${JSON.stringify(c.input)}`, c] as const))('%s', (_label, c) => {
      const t = styleUnderTest();
      assign(t, c.prop, c.input);
      expect(t.getFloat32(c.valueOffset)).toBeCloseTo(c.expected(scale), 4);
      expect(t.getInt8(c.typeOffset!)).toBe(c.typeValue);
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
  it.each(GEOMETRY.filter((c) => c.expected(1) !== 0 && c.expected(2) === c.expected(1) * 2).map((c) => [`${c.prop} = ${JSON.stringify(c.input)}`, c] as const))('%s scales linearly', (_label, c) => {
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
    expect(t.getFloat32(K.FONT_SIZE)).toBe(150);
    expect(t.getInt8(K.FONT_SIZE_TYPE)).toBe(1);
  });

  it('font-size in rem is absolute against the root font size', () => {
    const t = styleUnderTest();
    t.style.fontSize = '1.5rem' as never;
    expect(t.getFloat32(K.FONT_SIZE)).toBe(24);
    expect(t.getInt8(K.FONT_SIZE_TYPE)).toBe(0);
  });

  it('an unknown viewport makes vw collapse to 0 rather than a bare number', () => {
    setCssUnitContext({ viewportWidth: 0, viewportHeight: 0 });
    const t = styleUnderTest();
    t.style.width = '50vw' as never;
    expect(t.getFloat32(K.WIDTH_VALUE)).toBe(0);
  });

  it('writes viewport units again against a new viewport, as a browser does on resize', () => {
    const t = styleUnderTest();
    t.style.width = '50vw' as never;
    t.style.height = '25vh' as never;
    setCssUnitContext({ viewportWidth: 1000, viewportHeight: 400 });
    refreshViewportUnits();
    expect(t.getFloat32(K.WIDTH_VALUE)).toBe(500);
    expect(t.getFloat32(K.HEIGHT_VALUE)).toBe(100);
  });

  it('forgets a viewport unit once the property is written without one', () => {
    const t = styleUnderTest();
    t.style.width = '50vw' as never;
    t.style.width = '10px' as never;
    setCssUnitContext({ viewportWidth: 1000, viewportHeight: 400 });
    refreshViewportUnits();
    expect(t.getFloat32(K.WIDTH_VALUE)).toBe(10);
  });

  it('tracks a style again when it uses a viewport unit after a refresh dropped it', () => {
    const t = styleUnderTest();
    t.style.width = '50vw' as never;
    t.style.width = '10px' as never;
    refreshViewportUnits();
    t.style.width = '50vw' as never;
    setCssUnitContext({ viewportWidth: 1000, viewportHeight: 400 });
    refreshViewportUnits();
    expect(t.getFloat32(K.WIDTH_VALUE)).toBe(500);
  });

  it('writes CSS text with a viewport unit again, for values the platform parses natively', () => {
    const t = styleUnderTest();
    t.style.background = 'linear-gradient(red 0 5vw, blue 0 10vw)';
    t.style.border = '1px solid red';
    const written: Record<string, unknown> = {};
    for (const name of ['background', 'border']) {
      Object.defineProperty(t.style, name, { configurable: true, set: (v: unknown) => (written[name] = v) });
    }
    refreshViewportUnits();
    expect(written).toEqual({ background: 'linear-gradient(red 0 5vw, blue 0 10vw)' });
  });
});

describe('Windows border-radius parsing', () => {
  // Since core 9.1's shorthand split hands mason the CSS text, a bare parseFloat
  // turned `1rem` into 1 and `50%` into 50.
  beforeEach(() => {
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
  });

  it.each(SCALES)('resolves lengths to dip at scale %i', (scale) => {
    setScreenScale(scale);
    const r = parseBorderRadiusShorthand('1rem 10px 12pt 4');
    expect(r.tl).toEqual({ type: 0, value: 16 });
    expect(r.tr.value).toBeCloseTo(10, 4);
    expect(r.br.value).toBeCloseTo(16, 4);
    expect(r.bl).toEqual({ type: 0, value: 4 });
  });

  it('keeps a percentage as a 0-1 fraction for native to resolve against the box', () => {
    const r = parseBorderRadiusShorthand('50%');
    expect(r.tl).toEqual({ type: 1, value: 0.5 });
    expect(r.br).toEqual({ type: 1, value: 0.5 });
  });

  it('expands 2 and 3 values in CSS corner order', () => {
    expect(parseBorderRadiusShorthand('1px 2px')).toMatchObject({ tl: { value: 1 }, tr: { value: 2 }, br: { value: 1 }, bl: { value: 2 } });
    expect(parseBorderRadiusShorthand('1px 2px 3px')).toMatchObject({ tl: { value: 1 }, tr: { value: 2 }, br: { value: 3 }, bl: { value: 2 } });
  });

  it('ignores the vertical radii after a slash', () => {
    expect(parseBorderRadiusShorthand('8px / 2px').tl).toEqual({ type: 0, value: 8 });
  });
});

describe('Windows corner-shape parsing', () => {
  it('maps keywords to their CSS superellipse parameter', () => {
    expect(parseCornerShape('round')).toEqual([1, 1, 1, 1]);
    expect(parseCornerShape('squircle')).toEqual([2, 2, 2, 2]);
    expect(parseCornerShape('bevel scoop')).toEqual([0, -1, 0, -1]);
    expect(parseCornerShape('notch square round')).toEqual([-Infinity, Infinity, 1, Infinity]);
    expect(parseCornerShape('round bevel scoop squircle')).toEqual([1, 0, -1, 2]);
  });

  it('takes any number or infinity in superellipse()', () => {
    expect(parseCornerShape('superellipse(1.5)')).toEqual([1.5, 1.5, 1.5, 1.5]);
    expect(parseCornerShape('superellipse(-2) superellipse(infinity)')).toEqual([-2, Infinity, -2, Infinity]);
    expect(parseCornerShape('superellipse(-infinity)')).toEqual([-Infinity, -Infinity, -Infinity, -Infinity]);
  });

  it('rejects unknown tokens', () => {
    expect(parseCornerShape('superellipse')).toBeNull();
    expect(parseCornerShape('superellipse(nan)')).toBeNull();
    expect(parseCornerShape('round wobbly')).toBeNull();
    expect(parseCornerShape('round round round round round')).toBeNull();
  });
});

describe('Windows CSS-string shorthands', () => {
  // `__WINDOWS__` is compiled out here, so these call the handler setPseudoCssStringValue routes to.
  const apply = (t: StyleUnderTest, name: string, value: string) => (t.style as any).applyWindowsCssString(name, value);
  const sides = (t: StyleUnderTest, prefix: string) => ['TOP', 'RIGHT', 'BOTTOM', 'LEFT'].map((side) => t.getFloat32(K[`${prefix}_${side}_VALUE`]));

  beforeEach(() => {
    setScreenScale(1);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
  });

  it('reads the dip suffix paddingCss gives a number', () => {
    const t = styleUnderTest();
    apply(t, 'padding', '10dip');
    expect(sides(t, 'PADDING')).toEqual([10, 10, 10, 10]);
  });

  it('resolves rem and keeps percentages as fractions', () => {
    const t = styleUnderTest();
    apply(t, 'margin', '1rem 5%');
    expect(sides(t, 'MARGIN')[0]).toBe(16);
    expect(sides(t, 'MARGIN')[1]).toBeCloseTo(0.05, 6);
    expect(t.getInt8(K.MARGIN_RIGHT_TYPE)).toBe(TYPE_PERCENT_DIM);
  });

  it('ignores a side list with an invalid token, as CSS does', () => {
    const t = styleUnderTest();
    apply(t, 'margin', '8px');
    apply(t, 'margin', '1px 2p 3px 4px');
    expect(sides(t, 'MARGIN')).toEqual([8, 8, 8, 8]);
  });

  it('accepts lengths, percentages, auto and functions as sides', () => {
    expect(isSideList('0 auto')).toBe(true);
    expect(isSideList('1rem 5% -2px .5em')).toBe(true);
    expect(isSideList('calc(1px + 2px) 4px')).toBe(true);
    expect(isSideList('10dip')).toBe(true);
    expect(isSideList('1px 2px 3px 4px 5px')).toBe(false);
    expect(isSideList('red')).toBe(false);
  });

  it('applies inset', () => {
    const t = styleUnderTest();
    apply(t, 'inset', '1px 2px 3px 4px');
    expect(sides(t, 'INSET')).toEqual([1, 2, 3, 4]);
  });

  it('resolves border widths in em', () => {
    const t = styleUnderTest();
    apply(t, 'border', '0.5em solid red');
    expect(t.getFloat32(K.BORDER_TOP_VALUE)).toBe(8);
  });

  it('writes the text-decoration shorthand and resets omitted longhands', () => {
    const t = styleUnderTest();
    apply(t, 'text-decoration-style', 'wavy');
    apply(t, 'text-decoration', 'underline line-through red');
    expect(t.getUint8(K.DECORATION_LINE)).toBe(5);
    expect(t.getUint8(K.DECORATION_STYLE)).toBe(0);
    expect(t.view.getUint32(K.DECORATION_COLOR, true)).toBe(0xffff0000);
    expect(t.getUint8(K.DECORATION_LINE_STATE)).toBe(1);
  });

  it('writes one longhand without touching the others', () => {
    const t = styleUnderTest();
    apply(t, 'text-decoration', 'overline dotted');
    apply(t, 'text-decoration-line', 'none');
    expect(t.getUint8(K.DECORATION_LINE)).toBe(0);
    expect(t.getUint8(K.DECORATION_STYLE)).toBe(2);
  });

  it('writes corner-shape exponents in CSS corner order', () => {
    const t = styleUnderTest();
    const corners = () => ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT', 'BOTTOM_LEFT'].map((c) => t.getFloat32(K[`BORDER_RADIUS_${c}_EXPONENT`]));
    apply(t, 'corner-shape', 'squircle scoop');
    expect(corners()).toEqual([2, -1, 2, -1]);
    apply(t, 'corner-shape-bottom-left', 'notch');
    expect(corners()).toEqual([2, -1, 2, -Infinity]);
    apply(t, 'corner-shape-top-left', 'round bevel');
    expect(corners()).toEqual([2, -1, 2, -Infinity]);
    apply(t, 'corner-shape', 'round wobbly');
    expect(corners()).toEqual([2, -1, 2, -Infinity]);
    apply(t, 'corner-shape', '');
    expect(corners()).toEqual([1, 1, 1, 1]);
  });

  it('ignores a declaration with an unknown token', () => {
    const t = styleUnderTest();
    apply(t, 'text-decoration', 'underline');
    apply(t, 'text-decoration', 'underline bogus');
    expect(t.getUint8(K.DECORATION_LINE)).toBe(1);
  });
});

describe('resetting a color', () => {
  // Core resets a property to undefined when its rule stops matching (`details[open] summary`,
  // leaving :active); the native side must see it unset, not keep the old value.
  it('unsets color, which then inherits', () => {
    const t = styleUnderTest();
    t.style.color = '#ff0000';
    expect(t.getInt8(K.FONT_COLOR_STATE)).toBe(1);
    (t.style as any).color = undefined;
    expect(t.getInt8(K.FONT_COLOR_STATE)).toBe(0);
  });

  it('unsets background-color, which goes transparent', () => {
    const t = styleUnderTest();
    t.style.backgroundColor = '#ff0000';
    expect(t.getInt8(K.BACKGROUND_COLOR_STATE)).toBe(1);
    (t.style as any).backgroundColor = undefined;
    expect(t.getInt8(K.BACKGROUND_COLOR_STATE)).toBe(0);
    expect(t.getInt32(K.BACKGROUND_COLOR)).toBe(0);
  });
});

describe('text-decoration parsing', () => {
  const px = (token: string) => (/^\d+px$/.test(token) ? parseFloat(token) : undefined);

  it('reads tokens in any order', () => {
    expect(parseTextDecoration('2px dashed #00ff00 overline', px)).toEqual({ line: 2, style: 3, color: 0xff00ff00, thickness: 2 });
  });

  it('treats currentcolor, auto and none as the initial values', () => {
    expect(parseTextDecoration('none currentcolor auto', px)).toEqual({ line: 0, style: 0, color: DECORATION_COLOR_UNSET, thickness: 0 });
  });

  it('keeps spelling and grammar errors as standalone values', () => {
    expect(parseTextDecorationLine('spelling-error')).toBe(8);
    expect(parseTextDecorationLine('underline grammar-error')).toBe(16);
    expect(textDecorationLineToCss(16)).toBe('grammar-error');
  });

  it('round-trips the line bit set', () => {
    expect(parseTextDecorationLine('line-through underline')).toBe(5);
    expect(textDecorationLineToCss(5)).toBe('underline line-through');
    expect(textDecorationLineToCss(0)).toBe('none');
    expect(parseTextDecorationLine('sideways')).toBeNull();
  });
});

describe('gradient length stops', () => {
  it('keeps a length position apart and places that stop as if it had none', () => {
    const g = parseLinearGradientCss('repeating-linear-gradient(0deg, red 0px 20px, transparent 20px 40px)')!;
    expect(g.lengths).toEqual([0, 20, 20, 40]);
    expect(g.positions).toEqual([null, null, null, null]);
    expect(g.offsets).toEqual([0, 1 / 3, 2 / 3, 1]);
    expect(parseLinearGradientCss('linear-gradient(red 10%, blue)')!.lengths).toBeUndefined();
  });

  it('marks a radial circle with its size keyword or radius', () => {
    expect(parseRadialGradientCss('radial-gradient(circle, red, blue)')!.circle).toBe(3);
    expect(parseRadialGradientCss('radial-gradient(circle closest-side at 20% 30%, red, blue)')!.circle).toBe(0);
    expect(parseRadialGradientCss('radial-gradient(circle 20px, red, blue)')!.circleRadius).toBe(20);
    expect(parseRadialGradientCss('radial-gradient(red, blue)')!.circle).toBeUndefined();
    expect(parseRadialGradientCss('radial-gradient(ellipse at top, red, blue)')!.circle).toBeUndefined();
  });
});

describe('parseLinearGradientCss', () => {
  it('separates the interpolation method from the direction', () => {
    const g = parseLinearGradientCss('linear-gradient(to bottom right in oklab, #6366f1 0%, #d946ef 100%)');
    expect(g?.angle).toBe(135);
    expect(g?.interpolation).toBe('oklab');
    expect(g?.colors.length).toBe(2);
    expect(g?.offsets).toEqual([0, 1]);
  });

  it('accepts the method before the direction, alone, or with a hue method', () => {
    expect(parseLinearGradientCss('linear-gradient(in oklch to right, #f00, #00f)')).toMatchObject({ angle: 90, interpolation: 'oklch' });
    expect(parseLinearGradientCss('linear-gradient(in oklab, #f00, #00f)')).toMatchObject({ angle: 180, interpolation: 'oklab' });
    const hue = parseLinearGradientCss('linear-gradient(90deg in oklch longer hue, #f00, #00f)');
    expect(hue).toMatchObject({ angle: 90, interpolation: 'oklch longer hue' });
    expect(hue?.colors.length).toBe(2);
  });

  it('leaves gradients without a method interpolating in sRGB', () => {
    expect(parseLinearGradientCss('linear-gradient(to right, #f00, #00f)')).toMatchObject({ angle: 90, interpolation: '' });
  });

  it('reports corner keywords, whose line depends on the box', () => {
    expect(parseLinearGradientCss('linear-gradient(to bottom right, #f00, #00f)')?.corner).toEqual([1, 1]);
    expect(parseLinearGradientCss('linear-gradient(to left top in oklab, #f00, #00f)')?.corner).toEqual([-1, -1]);
    expect(parseLinearGradientCss('linear-gradient(to top right, #f00, #00f)')?.corner).toEqual([1, -1]);
    expect(parseLinearGradientCss('linear-gradient(to right, #f00, #00f)')?.corner).toBeUndefined();
    expect(parseLinearGradientCss('linear-gradient(135deg, #f00, #00f)')?.corner).toBeUndefined();
  });
});

describe('text-orientation', () => {
  it.each([
    ['mixed', 0, 'mixed'],
    ['upright', 1, 'upright'],
    ['sideways', 2, 'sideways'],
    ['sideways-right', 2, 'sideways'],
  ])('%s is stored as %i and reads back as %s', (input, stored, read) => {
    const t = styleUnderTest();
    assign(t, 'text-orientation', input);
    expect(t.getUint8(K.TEXT_ORIENTATION)).toBe(stored);
    expect(t.getUint8(K.TEXT_ORIENTATION_STATE)).toBe(1);
    expect((t.style as any).textOrientation).toBe(read);
  });

  it('an unknown keyword leaves it inherited', () => {
    const t = styleUnderTest();
    assign(t, 'textOrientation', 'diagonal');
    expect(t.getUint8(K.TEXT_ORIENTATION_STATE)).toBe(0);
    expect((t.style as any).textOrientation).toBe('mixed');
  });
});

describe('text-combine-upright', () => {
  it.each([
    ['none', 0, 'none'],
    ['all', 1, 'all'],
    ['digits', 2, 'digits 2'],
    ['digits 4', 4, 'digits 4'],
  ])('%s is stored as %i and reads back as %s', (input, stored, read) => {
    const t = styleUnderTest();
    assign(t, 'text-combine-upright', input);
    expect(t.getUint8(K.TEXT_COMBINE_UPRIGHT)).toBe(stored);
    expect(t.getUint8(K.TEXT_COMBINE_UPRIGHT_STATE)).toBe(1);
    expect((t.style as any).textCombineUpright).toBe(read);
  });

  it.each(['digits 5', 'digits 1', 'all digits', 'horizontal'])('%s leaves it inherited', (input) => {
    const t = styleUnderTest();
    assign(t, 'textCombineUpright', input);
    expect(t.getUint8(K.TEXT_COMBINE_UPRIGHT_STATE)).toBe(0);
  });
});

describe('text-spacing-trim', () => {
  it.each([
    ['normal', 0],
    ['space-all', 1],
    ['space-first', 2],
    ['trim-start', 3],
    ['trim-both', 4],
    ['trim-all', 5],
    ['auto', 6],
  ])('%s is stored as %i', (input, stored) => {
    const t = styleUnderTest();
    assign(t, 'text-spacing-trim', input);
    expect(t.getUint8(K.TEXT_SPACING_TRIM)).toBe(stored);
    expect(t.getUint8(K.TEXT_SPACING_TRIM_STATE)).toBe(1);
    expect((t.style as any).textSpacingTrim).toBe(input);
  });

  it('an unknown keyword leaves it inherited', () => {
    const t = styleUnderTest();
    assign(t, 'textSpacingTrim', 'trim-end');
    expect(t.getUint8(K.TEXT_SPACING_TRIM_STATE)).toBe(0);
    expect((t.style as any).textSpacingTrim).toBe('normal');
  });
});

describe('text-indent', () => {
  it.each(SCALES)('a length is stored in device pixels at scale %i', (scale) => {
    setScreenScale(scale);
    const t = styleUnderTest();
    assign(t, 'textIndent', '10px');
    expect(t.getFloat32(K.TEXT_INDENT)).toBeCloseTo(10 * scale, 4);
    expect(t.getUint8(K.TEXT_INDENT_TYPE)).toBe(0);
    expect(t.getUint8(K.TEXT_INDENT_STATE)).toBe(1);
    expect((t.style as any).textIndent).toBe('10px');
  });

  it('a percentage keeps its number and the percent type', () => {
    setScreenScale(2);
    const t = styleUnderTest();
    assign(t, 'text-indent', '5% hanging');
    expect(t.getFloat32(K.TEXT_INDENT)).toBe(5);
    expect(t.getUint8(K.TEXT_INDENT_TYPE)).toBe(1);
    expect((t.style as any).textIndent).toBe('5%');
  });

  it('ignores a value with no length', () => {
    const t = styleUnderTest();
    assign(t, 'textIndent', 'each-line');
    expect(t.getUint8(K.TEXT_INDENT_STATE)).toBe(0);
  });
});

describe('line-clamp', () => {
  it.each([
    ['lineClamp', 3, 3],
    ['lineClamp', '2', 2],
    ['line-clamp', 'none', 0],
    ['-webkit-line-clamp', '4', 4],
  ])('%s = %j', (prop, input, lines) => {
    const t = styleUnderTest();
    assign(t, prop, input);
    expect(t.getInt32(K.LINE_CLAMP)).toBe(lines);
    expect(t.getUint8(K.LINE_CLAMP_STATE)).toBe(1);
    expect((t.style as any).lineClamp).toBe(lines || 'none');
  });

  it.each(['-1', 'bananas'])('ignores %s', (input) => {
    const t = styleUnderTest();
    assign(t, 'lineClamp', input);
    expect(t.getUint8(K.LINE_CLAMP_STATE)).toBe(0);
  });
});

describe('transform-origin', () => {
  beforeEach(() => setScreenScale(2));

  it.each([
    ['center', [1, 50, 1, 50]],
    ['top left', [1, 0, 1, 0]],
    ['left top', [1, 0, 1, 0]],
    ['top', [1, 50, 1, 0]],
    ['right', [1, 100, 1, 50]],
    ['bottom center', [1, 50, 1, 100]],
    ['10px 20%', [0, 20, 1, 20]],
    ['25% 75% 10px', [1, 25, 1, 75]],
  ])('%s', (value, [xType, x, yType, y]) => {
    expect(parseTransformOrigin(value)).toEqual({ xType, x, yType, y });
  });

  it.each(['', 'left right', 'bottom 10px', 'a b c d'])('rejects "%s"', (value) => {
    expect(parseTransformOrigin(value)).toBeNull();
  });

  it('round-trips through the buffer in CSS pixels', () => {
    const t = styleUnderTest();
    assign(t, 'transformOrigin', '10px 20%');
    expect(t.getUint8(K.TRANSFORM_ORIGIN_STATE)).toBe(1);
    expect(t.getFloat32(K.TRANSFORM_ORIGIN_X_VALUE)).toBe(20);
    expect((t.style as any).transformOrigin).toBe('10px 20%');
  });
});

describe('em resolves against the font size CSS would compute', () => {
  // A Style linked to a view whose ancestors' Styles are given, nearest first.
  function linked(...ancestors: (StyleUnderTest | null)[]) {
    const t = styleUnderTest();
    let parent: any = undefined;
    for (const ancestor of [...ancestors].reverse()) {
      parent = { parent, [style_]: ancestor?.style };
    }
    (t.style as any).view_ = { parent };
    return t;
  }

  beforeEach(() => {
    setScreenScale(1);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
  });

  it('an em font size is a share of the parent font size, not that many px', () => {
    const parent = styleUnderTest();
    parent.style.fontSize = 20 as never;
    const badge = linked(parent);
    badge.style.fontSize = '0.75em' as never;
    (badge.style as any).paddingLeft = '0.65em';
    expect(badge.getFloat32(K.PADDING_LEFT_VALUE)).toBeCloseTo(0.65 * 15, 3);
  });

  it('a percentage font size, through several ancestors', () => {
    const root = styleUnderTest();
    root.style.fontSize = '2rem' as never;
    const middle = linked(root);
    middle.style.fontSize = '50%' as never;
    const leaf = linked(middle, root);
    leaf.style.fontSize = '1.5em' as never;
    (leaf.style as any).paddingTop = '1em';
    expect(leaf.getFloat32(K.PADDING_TOP_VALUE)).toBeCloseTo(24, 3);
  });

  it('with no font size of its own, the element inherits one', () => {
    const parent = styleUnderTest();
    parent.style.fontSize = 24 as never;
    const child = linked(null, parent);
    (child.style as any).marginTop = '1em';
    expect(child.getFloat32(K.MARGIN_TOP_VALUE)).toBeCloseTo(24, 3);
  });

  it('with no ancestor font size, the root font size', () => {
    const lone = styleUnderTest();
    lone.style.fontSize = '50%' as never;
    (lone.style as any).paddingLeft = '1em';
    expect(lone.getFloat32(K.PADDING_LEFT_VALUE)).toBeCloseTo(8, 3);
  });

  it('an absolute font size is used as is', () => {
    const parent = styleUnderTest();
    parent.style.fontSize = 40 as never;
    const child = linked(parent);
    child.style.fontSize = 10 as never;
    (child.style as any).paddingLeft = '2em';
    expect(child.getFloat32(K.PADDING_LEFT_VALUE)).toBeCloseTo(20, 3);
  });
});

describe('flex-wrap', () => {
  it('accepts the CSS spelling nowrap, so it can undo wrap', () => {
    const t = styleUnderTest();
    t.style.flexWrap = 'wrap';
    expect(t.getInt8(K.FLEX_WRAP)).toBe(1);
    t.style.flexWrap = 'nowrap';
    expect(t.getInt8(K.FLEX_WRAP)).toBe(0);
    expect(t.style.flexWrap).toBe('nowrap');
  });
});

describe('text-align', () => {
  it('writes one byte, leaving text-justify alone', () => {
    const t = styleUnderTest();
    (t.style as any).textJustify = 'inter-character';
    const justify = t.getInt8(K.TEXT_JUSTIFY);
    const justifyState = t.getInt8(K.TEXT_JUSTIFY_STATE);
    (t.style as any).textAlignment = 'center';
    expect(t.getInt8(K.TEXT_JUSTIFY)).toBe(justify);
    expect(t.getInt8(K.TEXT_JUSTIFY_STATE)).toBe(justifyState);
    expect(t.getInt8(K.TEXT_ALIGN_STATE)).toBe(1);
    expect((t.style as any).textAlignment).toBe('center');
  });
});

describe('a style object with text-justify then text-align', () => {
  it('keeps text-justify, whichever lands first', () => {
    const t = styleUnderTest();
    (t.style as any).textJustify = 'inter-character';
    (t.style as any).textAlignment = 'justify';
    expect((t.style as any).textJustify).toBe('inter-character');
    expect((t.style as any).textAlignment).toBe('justify');
  });
});
