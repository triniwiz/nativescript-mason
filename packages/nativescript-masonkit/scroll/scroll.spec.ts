import { afterEach, describe, expect, it, vi } from 'vitest';
import { Scroll } from './index.android';
import { Scroll as IOSScroll } from './index.ios';
import { ViewBase } from '../common';
import { native_ } from '../symbols';
import { setScreenScale } from '../../../tools/testing/mason-test-kit/ns-layout';

function fixture() {
  const view = new Scroll();
  const native = {
    getScrollX: () => 45,
    getScrollY: () => 180,
    getScrollableWidth: () => 900,
    getScrollableHeight: () => 1800,
    scrollToOffset: vi.fn(),
    stopScrolling: vi.fn(),
    setScrollListener: vi.fn(),
  };
  (view as any)[native_] = native;
  return { view, native };
}

afterEach(() => setScreenScale(3));

describe('Scroll public contract', () => {
  it.each([1, 2.625, 3])('converts both offsets, extents and seek coordinates at density %s', (density) => {
    setScreenScale(density);
    const { view, native } = fixture();
    expect([view.scrollX, view.scrollY, view.scrollableWidth, view.scrollableHeight]).toEqual([45 / density, 180 / density, 900 / density, 1800 / density]);
    (view as any)._seek(13.3, 201.7, true);
    expect(native.scrollToOffset).toHaveBeenCalledWith(Math.round(13.3 * density), Math.round(201.7 * density), true);
  });

  it('retains only the latest pre-load seek; stop cancels it', () => {
    const { view, native } = fixture();
    view.scrollTo(10, 20, true);
    view.scrollTo(30, 40);
    expect((view as any)._pendingScroll).toEqual([30, 40, false]);
    expect(native.scrollToOffset).not.toHaveBeenCalled();
    view.stopScrolling();
    expect((view as any)._pendingScroll).toBeUndefined();
    expect(native.stopScrolling).toHaveBeenCalledOnce();
  });

  it('rejects nonfinite coordinates without replacing a valid pending seek', () => {
    const { view } = fixture();
    view.scrollTo(10, 20);
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(() => view.scrollTo(value, 0)).toThrow(RangeError);
      expect(() => view.scrollTo(0, value)).toThrow(RangeError);
    }
    expect((view as any)._pendingScroll).toEqual([10, 20, false]);
  });

  it('delivers current native offsets and supports listener removal', () => {
    const { view } = fixture();
    const listener = vi.fn();
    view.on(Scroll.scrollEvent, listener);
    (view as any)._notifyScroll();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ eventName: 'scroll', object: view, scrollX: 15, scrollY: 60 }));
    view.off(Scroll.scrollEvent, listener);
    (view as any)._notifyScroll();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('removes only the public native observer, preserving Mason internal listeners', () => {
    const { view, native } = fixture();
    (view as any)._observeScroll(false);
    expect(native.setScrollListener).toHaveBeenCalledWith(null);
  });
});

it('iOS uses UIKit points and detaches its block listener', () => {
  const view = new IOSScroll();
  const native: any = { contentOffset: { x: 25, y: 80 }, scrollableWidth: 600, scrollableHeight: 1600, stopScrolling: vi.fn() };
  (view as any)[native_] = native;
  expect([view.scrollX, view.scrollY, view.scrollableWidth, view.scrollableHeight]).toEqual([25, 80, 600, 1600]);
  const listener = vi.fn();
  view.on('scroll', listener);
  (view as any)._observeScroll(true);
  native.scrollChangeListener();
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ scrollX: 25, scrollY: 80 }));
  (view as any)._observeScroll(false);
  view.stopScrolling();
  expect(native.scrollChangeListener).toBeNull();
  expect(native.stopScrolling).toHaveBeenCalledOnce();
});

it('a loaded handler can replace a queued seek without replaying stale work', () => {
  const { view, native } = fixture();
  const loaded = vi.spyOn(ViewBase.prototype, 'onLoaded').mockImplementation(function () {
    (this as any)._isLoaded = true;
    this.notify({ eventName: 'loaded', object: this });
  });
  vi.spyOn(view as any, '_observeScroll').mockImplementation(() => {});
  view.scrollTo(10, 20);
  view.on('loaded', () => view.scrollTo(30, 40));
  try {
    view.onLoaded();
    expect(native.scrollToOffset).toHaveBeenCalledExactlyOnceWith(90, 120, false);
  } finally {
    loaded.mockRestore();
  }
});

it('returns zero before native creation and bounds coordinates before the signed native bridge', () => {
  const empty = new Scroll();
  expect([empty.scrollX, empty.scrollY, empty.scrollableWidth, empty.scrollableHeight]).toEqual([0, 0, 0, 0]);
  const { view, native } = fixture();
  (view as any)._seek(Number.MAX_VALUE, -Number.MAX_VALUE, false);
  expect(native.scrollToOffset).toHaveBeenCalledWith(2147483647, 0, false);
});
