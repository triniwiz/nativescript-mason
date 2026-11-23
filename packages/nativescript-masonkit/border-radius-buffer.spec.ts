import { beforeEach, describe, expect, it } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { refreshViewportUnits } from './style';
import { setCssUnitContext } from './units';

const BORDER_RADIUS_BIT = 1n << 41n;
const CORNERS = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT', 'BOTTOM_LEFT'] as const;

beforeEach(() => setCssUnitContext({ rootFontSize: 16 }));

function corners(t: ReturnType<typeof styleUnderTest>) {
  return CORNERS.map((c) => [t.getUint8(styleKey(`BORDER_RADIUS_${c}_X_TYPE`)), Math.round(t.getFloat32(styleKey(`BORDER_RADIUS_${c}_X_VALUE`)) * 1000) / 1000, t.getUint8(styleKey(`BORDER_RADIUS_${c}_Y_TYPE`)), Math.round(t.getFloat32(styleKey(`BORDER_RADIUS_${c}_Y_VALUE`)) * 1000) / 1000]);
}

describe('_writeBorderRadius', () => {
  it('maps one to four tokens onto the corners in device px', () => {
    const cases: [string, number[]][] = [
      ['4', [4, 4, 4, 4]],
      ['4px 8px', [4, 8, 4, 8]],
      ['4 8dip 12', [4, 8, 12, 8]],
      ['1 2 3 4', [1, 2, 3, 4]],
    ];
    for (const [css, expected] of cases) {
      const t = styleUnderTest();
      expect(t.style._writeBorderRadius(css, 2.5)).toBe(true);
      expect(corners(t)).toEqual(expected.map((v) => [0, v * 2.5, 0, v * 2.5]));
      expect(t.dirty() & BORDER_RADIUS_BIT).toBe(BORDER_RADIUS_BIT);
    }
  });

  it('writes percent as a fraction, dppx unscaled, and the vertical radii after a slash', () => {
    const t = styleUnderTest();
    expect(t.style._writeBorderRadius('50% 10dppx / 2 4;', 2)).toBe(true);
    expect(corners(t)).toEqual([
      [1, 0.5, 0, 4],
      [0, 10, 0, 8],
      [1, 0.5, 0, 4],
      [0, 10, 0, 8],
    ]);
  });

  it('clamps huge lengths like the native parser', () => {
    const t = styleUnderTest();
    t.style._writeBorderRadius('1e30px', 1);
    expect(corners(t)[0]).toEqual([0, 9999, 0, 9999]);
  });

  it('writes both axes with math and relative units', () => {
    const t = styleUnderTest();
    expect(t.style._writeBorderRadius('calc(4px + 1px) 10dppx / 2 1rem', 2)).toBe(true);
    expect(corners(t)).toEqual([[0, 10, 0, 4], [0, 10, 0, 32], [0, 10, 0, 4], [0, 10, 0, 32]]);
  });

  it('leaves the buffer clean for malformed radii', () => {
    for (const css of ['', '1 2 3 4 5', '4 / 1 2 3 4 5', '4px foo']) {
      const t = styleUnderTest();
      expect(t.style._writeBorderRadius(css, 2)).toBe(false);
      expect(t.dirty()).toBe(-1n);
    }
  });
});

describe('_writeCornerCss', () => {
  function withNativeView() {
    const t = styleUnderTest();
    (t.style as any).nativeView = {};
    return t;
  }

  it('writes only its own corner', () => {
    const t = withNativeView();
    t.style._writeBorderRadius('1 2 3 4', 2);
    expect(t.style._writeCornerCss(2, '5px', 2)).toBe(true);
    expect(corners(t)).toEqual([
      [0, 2, 0, 2],
      [0, 4, 0, 4],
      [0, 10, 0, 10],
      [0, 8, 0, 8],
    ]);
    expect((t.style as any)._radiusCssFromBuffer(2)).toBe('1px 2px 5px 4px');
    expect(t.dirty() & BORDER_RADIUS_BIT).toBe(BORDER_RADIUS_BIT);
  });

  it('writes percent and elliptical corners', () => {
    const t = withNativeView();
    expect(t.style._writeCornerCss(0, '50% 4', 3)).toBe(true);
    expect(corners(t)[0]).toEqual([1, 0.5, 0, 12]);
  });

  it('resolves a corner with math and root font units', () => {
    const t = withNativeView();
    expect(t.style._writeCornerCss(1, 'calc(4px + 1px) 2rem', 2)).toBe(true);
    expect(corners(t)[1]).toEqual([0, 10, 0, 64]);
  });

  it('does nothing for a style without a native view', () => {
    const t = styleUnderTest();
    expect(t.style._writeCornerCss(0, '5px', 2)).toBe(false);
    expect(t.dirty()).toBe(-1n);
  });
});

describe('_writeCornerLength', () => {
  function withNativeView() {
    const t = styleUnderTest();
    (t.style as any).nativeView = {};
    return t;
  }

  it('writes dip numbers and px/dip lengths scaled, percent as a fraction', () => {
    const t = withNativeView();
    expect(t.style._writeCornerLength(0, 8, 2)).toBe(true);
    expect(t.style._writeCornerLength(1, { unit: 'px', value: 4 }, 2)).toBe(true);
    expect(t.style._writeCornerLength(2, { unit: 'dip', value: 1.5 }, 2)).toBe(true);
    expect(t.style._writeCornerLength(3, { unit: '%', value: 0.25 }, 2)).toBe(true);
    expect(corners(t)).toEqual([
      [0, 16, 0, 16],
      [0, 8, 0, 8],
      [0, 3, 0, 3],
      [1, 0.25, 1, 0.25],
    ]);
    expect(t.dirty() & BORDER_RADIUS_BIT).toBe(BORDER_RADIUS_BIT);
  });

  it('builds the shorthand from the buffer only when read', () => {
    const t = withNativeView();
    t.style._writeBorderRadius('1 2 3 4', 2);
    t.style._writeCornerLength(2, 8, 2);
    expect((t.style as any)._borderRadiusCss).toBeNull();
    expect((t.style as any)._radiusCssFromBuffer(2)).toBe('1px 2px 8px 4px');
    t.style._writeCornerLength(0, { unit: '%', value: 0.5 }, 2);
    expect((t.style as any)._radiusCssFromBuffer(2)).toBe('50% 2px 8px 4px');
  });

  it('collapses equal corners and keeps elliptical ones after a slash', () => {
    const t = withNativeView();
    for (let c = 0; c < 4; c++) t.style._writeCornerLength(c, 6, 3);
    expect((t.style as any)._radiusCssFromBuffer(3)).toBe('6px');
    t.style._writeCornerCss(0, '6px 2px', 3);
    expect((t.style as any)._radiusCssFromBuffer(3)).toBe('6px / 2px 6px 6px 6px');
  });

  it('leaves strings, other units and missing native views to the string path', () => {
    for (const value of ['8px', { unit: 'rem', value: 1 }, null, undefined, NaN]) {
      const t = withNativeView();
      expect(t.style._writeCornerLength(0, value, 2)).toBe(false);
      expect(t.dirty()).toBe(-1n);
    }
    const t = styleUnderTest();
    expect(t.style._writeCornerLength(0, 4, 2)).toBe(false);
  });
});

describe('border corner CSS projection', () => {
  function withNativeView() {
    const t = styleUnderTest();
    (t.style as any).nativeView = {};
    return t;
  }

  it('projects both axes and updates the radius dirty bit', () => {
    for (const [css, expected] of [
      ['8px', [0, 24, 0, 24]],
      ['50%', [1, 0.5, 1, 0.5]],
      ['3dppx', [0, 3, 0, 3]],
      [' 8px 4px ', [0, 24, 0, 12]],
    ] as [string, number[]][]) {
      const t = withNativeView();
      expect(t.style._writeCornerCss(2, css, 3)).toBe(true);
      expect(corners(t)[2]).toEqual(expected);
      expect(t.dirty() & BORDER_RADIUS_BIT).toBe(BORDER_RADIUS_BIT);
    }
  });

  it('builds the shorthand from the buffer only when read', () => {
    const t = withNativeView();
    t.style._writeBorderRadius('1 2 3 4', 2);
    expect(t.style._writeCornerCss(1, '8px 2px', 2)).toBe(true);
    expect((t.style as any)._borderRadiusCss).toBeNull();
    expect((t.style as any)._radiusCssFromBuffer(2)).toBe('1px 8px 3px 4px / 1px 2px 3px 4px');
  });

  it('does not write malformed CSS or when the native view is missing', () => {
    for (const css of ['1px 2px 3px', '', 'auto']) {
      const t = withNativeView();
      expect(t.style._writeCornerCss(0, css, 2)).toBe(false);
      expect(t.dirty()).toBe(-1n);
    }
    expect(styleUnderTest().style._writeCornerCss(0, '4px', 2)).toBe(false);
  });

  it('replays viewport lengths while preserving newer fixed corner overrides', () => {
    setScreenScale(1);
    setCssUnitContext({ viewportWidth: 200, viewportHeight: 400 });
    const t = withNativeView();
    t.style.borderRadius = '5vw';
    expect(t.style._writeCornerLength(0, 3)).toBe(true);
    expect(t.style._writeCornerCss(1, '10vh 50%')).toBe(true);
    setCssUnitContext({ viewportWidth: 400, viewportHeight: 600 });
    refreshViewportUnits();
    expect(corners(t)).toEqual([[0, 3, 0, 3], [0, 60, 1, 0.5], [0, 20, 0, 20], [0, 20, 0, 20]]);

    t.style.borderRadius = '4';
    setCssUnitContext({ viewportWidth: 800, viewportHeight: 800 });
    refreshViewportUnits();
    expect(corners(t)).toEqual([[0, 4, 0, 4], [0, 4, 0, 4], [0, 4, 0, 4], [0, 4, 0, 4]]);
  });
});

describe('_cornerRadiusIsZero', () => {
  it('reads one corner from the buffer', () => {
    const t = styleUnderTest();
    (t.style as any).nativeView = {};
    expect([0, 1, 2, 3].map((c) => t.style._cornerRadiusIsZero(c))).toEqual([true, true, true, true]);
    t.style._writeCornerLength(1, 4, 2);
    expect([0, 1, 2, 3].map((c) => t.style._cornerRadiusIsZero(c))).toEqual([true, false, true, true]);
  });
});
