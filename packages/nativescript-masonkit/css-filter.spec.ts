import { describe, expect, it } from 'vitest';
import { composeMatrices, encodeCssFilter, parseCssFilter } from './css-filter';

const px = (token: string) => (token.endsWith('em') ? parseFloat(token) * 16 : parseFloat(token));

function apply(matrix: number[], [r, g, b, a]: number[]): number[] {
  return [0, 1, 2, 3].map((row) => matrix[row * 5] * r + matrix[row * 5 + 1] * g + matrix[row * 5 + 2] * b + matrix[row * 5 + 3] * a + matrix[row * 5 + 4]);
}

describe('parseCssFilter', () => {
  it('is empty for none and for identity functions', () => {
    expect(parseCssFilter('none', px)).toEqual([]);
    expect(parseCssFilter('', px)).toEqual([]);
    expect(parseCssFilter('brightness(1) saturate(100%) hue-rotate(0deg)', px)).toEqual([]);
  });

  it('reads blur as a length', () => {
    expect(parseCssFilter('blur(4px)', px)).toEqual([{ kind: 'blur', sigma: 4 }]);
    expect(parseCssFilter('blur(0.5em)', px)).toEqual([{ kind: 'blur', sigma: 8 }]);
    expect(parseCssFilter('blur(0)', px)).toEqual([]);
  });

  it('merges adjacent colour functions but keeps blurs between them', () => {
    const steps = parseCssFilter('grayscale(1) brightness(0.5) blur(2px) invert(1)', px);
    expect(steps.map((s) => s.kind)).toEqual(['matrix', 'blur', 'matrix']);
  });

  it('maps colours as the Filter Effects spec does', () => {
    const one = (css: string) => (parseCssFilter(css, px)[0] as { matrix: number[] }).matrix;
    const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 4));
    close(apply(one('grayscale(100%)'), [1, 0, 0, 1]), [0.2126, 0.2126, 0.2126, 1]);
    close(apply(one('invert(1)'), [1, 0.25, 0, 1]), [0, 0.75, 1, 1]);
    close(apply(one('brightness(2)'), [0.25, 0.25, 0.25, 1]), [0.5, 0.5, 0.5, 1]);
    close(apply(one('contrast(0)'), [1, 0, 0.3, 1]), [0.5, 0.5, 0.5, 1]);
    close(apply(one('opacity(25%)'), [1, 1, 1, 1]), [1, 1, 1, 0.25]);
    close(apply(one('hue-rotate(180deg)'), [0.5, 0.5, 0.5, 1]), [0.5, 0.5, 0.5, 1]);
    close(apply(one('sepia(1)'), [1, 1, 1, 1]), [1.351, 1.203, 0.937, 1]);
  });

  it('applies merged functions in order', () => {
    const merged = (parseCssFilter('invert(1) brightness(0.5)', px)[0] as { matrix: number[] }).matrix;
    expect(apply(merged, [1, 1, 1, 1])[0]).toBeCloseTo(0, 5);
    expect(apply(merged, [0, 0, 0, 1])[0]).toBeCloseTo(0.5, 5);
  });

  it('reads drop-shadow with the blur radius halved to a deviation', () => {
    expect(parseCssFilter('drop-shadow(2px 4px 6px rgba(0,0,0,0.5))', px)).toEqual([{ kind: 'shadow', x: 2, y: 4, sigma: 3, color: 'rgba(0,0,0,0.5)' }]);
  });
});

describe('composeMatrices', () => {
  it('keeps identity as identity', () => {
    const id = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
    expect(composeMatrices(id, id)).toEqual(id);
  });
});

describe('encodeCssFilter', () => {
  it('writes one record per step', () => {
    const encoded = encodeCssFilter(parseCssFilter('blur(3px) drop-shadow(1px 2px red)', px), () => 0xffff0000);
    expect(encoded).toBe(`b,3;d,1,2,0,${0xffff0000}`);
  });
});
