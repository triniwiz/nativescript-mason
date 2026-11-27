import { describe, expect, it } from 'vitest';
import { ViewBase } from './common';

function countingRect(top: number, right: number, bottom: number, left: number) {
  const reads = { count: 0 };
  const field = (value: number) => ({
    get() {
      reads.count++;
      return value;
    },
  });
  const rect = Object.defineProperties({}, { top: field(top), right: field(right), bottom: field(bottom), left: field(left) });
  return { rect, reads };
}

describe('default paddings', () => {
  it('gives every view the Rect values while reading its Java fields once', () => {
    const { rect, reads } = countingRect(1, 2, 3, 4);
    const views = [0, 1, 2].map(() => Object.create(ViewBase.prototype) as any);
    for (const view of views) view._setDefaultPaddings(rect);
    for (const view of views) {
      expect([view._defaultPaddingTop, view._defaultPaddingRight, view._defaultPaddingBottom, view._defaultPaddingLeft]).toEqual([1, 2, 3, 4]);
    }
    expect(reads.count).toBe(4);
  });

  it('keeps zero paddings when core has no Rect', () => {
    const view = Object.create(ViewBase.prototype) as any;
    view._setDefaultPaddings(undefined);
    expect([view._defaultPaddingTop, view._defaultPaddingRight, view._defaultPaddingBottom, view._defaultPaddingLeft]).toEqual([0, 0, 0, 0]);
  });
});
