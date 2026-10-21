import { describe, expect, it, vi } from 'vitest';
import { View } from '@nativescript/core';
import { ViewBase } from './common';
import { isPlaceholder_, text_, textNode_, textNodeProxied_ } from './symbols';

function fixture(kinds: string[]) {
  const parent = Object.create(ViewBase.prototype) as any;
  const nativeChildren: object[] = [];
  const rawText: any[] = [];
  const remove = (node: object) => {
    const index = nativeChildren.indexOf(node);
    expect(index).toBeGreaterThanOrEqual(0);
    nativeChildren.splice(index, 1);
  };
  parent._children = kinds.map((kind) => {
    const node = { kind };
    nativeChildren.push(node);
    if (kind === 'text') {
      const raw: any = { data: 'hello', [textNode_]: node, [textNodeProxied_]: true };
      (node as any).__raw__ = raw;
      rawText.push(raw);
      return { [text_]: 'hello', [textNode_]: node };
    }
    if (kind === 'break') return { [isPlaceholder_]: true, _view: { node } };
    if (kind === 'legacy-text') return { [text_]: 'hello' };
    const view = Object.create(View.prototype);
    view._testNative = node;
    return view;
  });
  parent._view = {
    removeChild: vi.fn(remove),
    removeChildAt: vi.fn((index: number) => remove(nativeChildren[index])),
  };
  parent._masonSettleNativeAdds = vi.fn();
  parent._removeView = vi.fn((view) => remove(view._testNative));
  parent.requestLayout = vi.fn();
  return { parent, nativeChildren, rawText };
}

describe('removeChildren', () => {
  it.each([
    ['text'],
    ['break'],
    ['legacy-text'],
    ['view', 'text', 'break', 'legacy-text', 'view'],
  ])('clears all raw and native children for %j', (...kinds) => {
    const { parent, nativeChildren, rawText } = fixture(kinds);
    parent.removeChildren();
    expect(parent._children).toEqual([]);
    expect(nativeChildren).toEqual([]);
    for (const raw of rawText) {
      expect(raw[textNode_]).toBeUndefined();
      expect(raw[textNodeProxied_]).toBe(false);
    }
    parent.removeChildren();
    expect(nativeChildren).toEqual([]);
  });
});
