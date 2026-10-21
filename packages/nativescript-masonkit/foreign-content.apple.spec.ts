import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nativescript/core/ui/gestures/touch-manager', () => ({ TouchManager: class {} }));
vi.mock('@nativescript/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@nativescript/core')>();
  const { layout } = await import('@nativescript/core/utils/layout-helper/index.ios');
  return { ...core, Utils: { ...core.Utils, layout } };
});

import { ViewBase } from './common';
import { releaseForeignLayout } from './foreign-layout';
import { View } from '@nativescript/core';

const attached: any[] = [];
afterEach(() => {
  for (const child of attached.splice(0)) releaseForeignLayout(child);
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function host(order: string[] = []) {
  const markDirty = vi.fn(() => order.push('dirty'));
  const nodeForView = vi.fn(() => ({ markDirty }));
  const mason = { nodeForView, setMeasureForViewBlock: vi.fn() };
  const parent = Object.create(ViewBase.prototype) as ViewBase;
  Object.defineProperty(parent, 'nativeViewProtected', { value: { mason } });
  return { parent, mason, markDirty, nodeForView };
}

function foreign(requestLayout = vi.fn()) {
  const child = { nativeViewProtected: {}, requestLayout };
  attached.push(child);
  return child;
}

describe('foreign content invalidation on iOS', () => {
  it('invalidates cached native measurement before forwarding a content layout request', () => {
    const order: string[] = [];
    const { parent, markDirty, nodeForView } = host(order);
    const original = vi.fn(function (this: unknown) {
      expect(this).toBe(child);
      order.push('core');
    });
    const child = foreign(original);
    parent._masonMeasureForeign(child);
    child.requestLayout();
    expect(nodeForView).toHaveBeenCalledWith(child.nativeViewProtected);
    expect(markDirty).toHaveBeenCalledOnce();
    expect(order).toEqual(['dirty', 'core']);
  });

  it('does not stack hooks when native measurement is registered again', () => {
    const { parent, markDirty } = host();
    const child = foreign();
    const original = child.requestLayout;
    parent._masonMeasureForeign(child);
    parent._masonMeasureForeign(child);
    child.requestLayout();
    expect(original).toHaveBeenCalledOnce();
    expect(markDirty).toHaveBeenCalledOnce();
  });

  it('restores an own requestLayout method on removal and stops invalidating the old tree', () => {
    const { parent, markDirty } = host();
    const child = foreign();
    const original = child.requestLayout;
    parent._masonMeasureForeign(child);
    expect(child.requestLayout).not.toBe(original);
    releaseForeignLayout(child);
    expect(child.requestLayout).toBe(original);
    child.requestLayout();
    expect(markDirty).not.toHaveBeenCalled();
    expect(original).toHaveBeenCalledOnce();
  });

  it('restores inherited methods without leaving an own method behind', () => {
    const { parent, markDirty } = host();
    const original = vi.fn();
    const child = Object.assign(Object.create({ requestLayout: original }), { nativeViewProtected: {} });
    attached.push(child);
    parent._masonMeasureForeign(child);
    child.requestLayout();
    expect(markDirty).toHaveBeenCalledOnce();
    releaseForeignLayout(child);
    expect(Object.hasOwn(child, 'requestLayout')).toBe(false);
    expect(child.requestLayout).toBe(original);
  });

  it('invalidates the current native instance after recreation', () => {
    const { parent, nodeForView, markDirty } = host();
    const child = foreign();
    parent._masonMeasureForeign(child);
    child.nativeViewProtected = {};
    parent._masonMeasureForeign(child);
    child.requestLayout();
    expect(nodeForView).toHaveBeenCalledWith(child.nativeViewProtected);
    expect(markDirty).toHaveBeenCalledOnce();
  });

  it('switches engines on reparenting without calling the old invalidation hook', () => {
    const first = host();
    const second = host();
    const child = foreign();
    const original = child.requestLayout;
    first.parent._masonMeasureForeign(child);
    releaseForeignLayout(child);
    second.parent._masonMeasureForeign(child);
    child.requestLayout();
    expect(first.markDirty).not.toHaveBeenCalled();
    expect(second.markDirty).toHaveBeenCalledOnce();
    expect(original).toHaveBeenCalledOnce();
  });

  it('defers invalidation requested inside measurement until Rust has released its lock', () => {
    vi.useFakeTimers();
    vi.stubGlobal('CGSizeMake', (width: number, height: number) => ({ width, height }));
    const { parent, mason, markDirty } = host();
    const child = Object.assign(foreign(), { getMeasuredWidth: () => 30, getMeasuredHeight: () => 20 });
    const original = child.requestLayout;
    parent._masonMeasureForeign(child);
    vi.spyOn(View, 'measureChild').mockImplementation(() => {
      child.requestLayout();
      child.requestLayout();
      return { measuredWidth: 30, measuredHeight: 20 };
    });
    const measure = mason.setMeasureForViewBlock.mock.calls[0][1];
    measure(NaN, NaN, 300, 600);
    expect(markDirty).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(markDirty).toHaveBeenCalledOnce();
    expect(original).toHaveBeenCalledTimes(3);
  });

  it('also defers a sibling request during another leaf measurement in the same engine', () => {
    vi.useFakeTimers();
    vi.stubGlobal('CGSizeMake', (width: number, height: number) => ({ width, height }));
    const { parent, mason, markDirty } = host();
    const child = Object.assign(foreign(), { getMeasuredWidth: () => 30, getMeasuredHeight: () => 20 });
    const sibling = foreign();
    parent._masonMeasureForeign(child);
    parent._masonMeasureForeign(sibling);
    vi.spyOn(View, 'measureChild').mockImplementation(() => {
      sibling.requestLayout();
      return { measuredWidth: 30, measuredHeight: 20 };
    });
    const measure = mason.setMeasureForViewBlock.mock.calls[0][1];
    measure(NaN, NaN, 300, 600);
    expect(markDirty).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(markDirty).toHaveBeenCalledOnce();
  });

  it('cancels deferred invalidation if the child is removed before the next turn', () => {
    vi.useFakeTimers();
    vi.stubGlobal('CGSizeMake', (width: number, height: number) => ({ width, height }));
    const { parent, mason, markDirty } = host();
    const child = Object.assign(foreign(), { getMeasuredWidth: () => 30, getMeasuredHeight: () => 20 });
    parent._masonMeasureForeign(child);
    vi.spyOn(View, 'measureChild').mockImplementation(() => {
      child.requestLayout();
      return { measuredWidth: 30, measuredHeight: 20 };
    });
    mason.setMeasureForViewBlock.mock.calls[0][1](NaN, NaN, 300, 600);
    releaseForeignLayout(child);
    vi.runAllTimers();
    expect(markDirty).not.toHaveBeenCalled();
  });

  it('leaves measurement state after a core measurement throws', () => {
    const { parent, mason, markDirty } = host();
    const child = foreign();
    parent._masonMeasureForeign(child);
    vi.spyOn(View, 'measureChild').mockImplementation(() => { throw new Error('measure failed'); });
    expect(() => mason.setMeasureForViewBlock.mock.calls[0][1](NaN, NaN, 300, 600)).toThrow('measure failed');
    child.requestLayout();
    expect(markDirty).toHaveBeenCalledOnce();
  });
});
