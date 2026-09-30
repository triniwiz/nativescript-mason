import { describe, expect, it } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';

const BORDER_RADIUS_BIT = 1n << 41n;
const CORNERS = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT', 'BOTTOM_LEFT'] as const;

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

  it('leaves units that need native context to the native parser', () => {
    for (const css of ['2rem', '1em', '10vw', '3pt', 'calc(4px + 1px)', '4px foo']) {
      const t = styleUnderTest();
      expect(t.style._writeBorderRadius(css, 2)).toBe(false);
      expect(t.dirty()).toBe(-1n);
    }
  });

  it('accepts but ignores an empty list or more than four tokens', () => {
    for (const css of ['', '1 2 3 4 5', '4 / 1 2 3 4 5']) {
      const t = styleUnderTest();
      expect(t.style._writeBorderRadius(css, 2)).toBe(true);
      expect(t.dirty()).toBe(-1n);
    }
  });
});

describe('_writeCornerRadius', () => {
  function withNativeView() {
    const t = styleUnderTest();
    (t.style as any).nativeView = {};
    return t;
  }

  it('writes only its own corner and keeps the composed shorthand', () => {
    const t = withNativeView();
    t.style._writeBorderRadius('1 2 3 4', 2);
    expect(t.style._writeCornerRadius(2, ['5px', '5px'], '1 2 5px 4', 2)).toBe(true);
    expect(corners(t)).toEqual([
      [0, 2, 0, 2],
      [0, 4, 0, 4],
      [0, 10, 0, 10],
      [0, 8, 0, 8],
    ]);
    expect((t.style as any)._borderRadiusCss).toBe('1 2 5px 4');
    expect(t.dirty() & BORDER_RADIUS_BIT).toBe(BORDER_RADIUS_BIT);
  });

  it('writes percent and elliptical corners', () => {
    const t = withNativeView();
    expect(t.style._writeCornerRadius(0, ['50%', '4'], '50% 0 0 0 / 4 0 0 0', 3)).toBe(true);
    expect(corners(t)[0]).toEqual([1, 0.5, 0, 12]);
  });

  it('leaves units that need native context to the native parser', () => {
    for (const css of ['2rem', 'calc(4px + 1px)', '4px 8px']) {
      const t = withNativeView();
      expect(t.style._writeCornerRadius(1, [css, css], css, 2)).toBe(false);
      expect(t.dirty()).toBe(-1n);
    }
  });

  it('does nothing for a style without a native view', () => {
    const t = styleUnderTest();
    expect(t.style._writeCornerRadius(0, ['4', '4'], '4 0 0 0', 2)).toBe(false);
    expect(t.dirty()).toBe(-1n);
  });
});
