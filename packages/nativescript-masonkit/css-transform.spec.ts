import { describe, expect, it } from 'vitest';
import { parseAngle, parseCssTransform } from './css-transform';

const px = (token: string) => (token.endsWith('px') || /^-?[\d.]+$/.test(token) ? parseFloat(token) : token.endsWith('em') ? parseFloat(token) * 16 : undefined);
const size = { width: 200, height: 100 };
const close = (actual: number[] | null, expected: number[]) => {
  expect(actual).not.toBeNull();
  actual!.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));
};

describe('parseAngle', () => {
  it('reads every CSS angle unit', () => {
    expect(parseAngle('90deg')).toBeCloseTo(Math.PI / 2);
    expect(parseAngle('1rad')).toBeCloseTo(1);
    expect(parseAngle('100grad')).toBeCloseTo(Math.PI / 2);
    expect(parseAngle('0.25turn')).toBeCloseTo(Math.PI / 2);
    expect(parseAngle('45')).toBeCloseTo(Math.PI / 4);
  });
});

describe('parseCssTransform', () => {
  it('is null for none or nothing understood', () => {
    expect(parseCssTransform('none', px, size)).toBeNull();
    expect(parseCssTransform('', px, size)).toBeNull();
    expect(parseCssTransform('perspective(10px)', px, size)).toBeNull();
  });

  it('resolves translate lengths, percentages and em', () => {
    close(parseCssTransform('translate(10px, 50%)', px, size), [1, 0, 0, 1, 10, 50]);
    close(parseCssTransform('translateX(25%) translateY(1em)', px, size), [1, 0, 0, 1, 50, 16]);
  });

  it('composes in order, as CSS does', () => {
    // Translate then rotate: the translation isn't rotated.
    close(parseCssTransform('translate(10px, 0) rotate(90deg)', px, size), [0, 1, -1, 0, 10, 0]);
    // Rotate then translate: the translation is.
    close(parseCssTransform('rotate(90deg) translate(10px, 0)', px, size), [0, 1, -1, 0, 0, 10]);
  });

  it('supports skew, scale and matrix forms', () => {
    close(parseCssTransform('skewX(45deg)', px, size), [1, 0, 1, 1, 0, 0]);
    close(parseCssTransform('scale(2, 3)', px, size), [2, 0, 0, 3, 0, 0]);
    close(parseCssTransform('matrix(1, 2, 3, 4, 5, 6)', px, size), [1, 2, 3, 4, 5, 6]);
    close(parseCssTransform('matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 7,8,0,1)', px, size), [1, 0, 0, 1, 7, 8]);
  });
});
