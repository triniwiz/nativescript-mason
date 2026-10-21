import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewBase } from './common';
import { native_ } from './symbols';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';

// WebScroll works in device pixels; the JS API is in CSS pixels (dips).
const webScroll = {
  scrollLeft: vi.fn(() => 0),
  scrollTop: vi.fn(() => 0),
  scrollWidth: vi.fn(() => 0),
  scrollHeight: vi.fn(() => 0),
  clientWidth: vi.fn(() => 0),
  clientHeight: vi.fn(() => 0),
  scrollTo: vi.fn(),
  scrollIntoView: vi.fn(),
};

const runtimeOrg = (globalThis as any).org;

function element(native: any = { id: 'native' }) {
  const view = new ViewBase() as any;
  view[native_] = native;
  view._view = native;
  return view;
}

beforeEach(() => {
  (globalThis as any).org = { nativescript: { mason: { masonkit: { WebScroll: webScroll } } } };
  for (const fn of Object.values(webScroll)) fn.mockClear();
});

afterEach(() => {
  (globalThis as any).org = runtimeOrg;
  setScreenScale(3);
});

describe('Android scroll units', () => {
  it.each([1, 2.625, 3])('converts offsets, sizes and seeks at density %s', (density) => {
    setScreenScale(density);
    const view = element();
    webScroll.scrollTop.mockReturnValueOnce(180);
    webScroll.scrollLeft.mockReturnValueOnce(45);
    webScroll.scrollHeight.mockReturnValueOnce(2100);
    webScroll.clientHeight.mockReturnValueOnce(420);
    expect(view.scrollTop).toBe(180 / density);
    expect(view.scrollLeft).toBe(45 / density);
    expect(view.scrollHeight).toBe(Math.round(2100 / density));
    expect(view.clientHeight).toBe(Math.round(420 / density));

    view.scrollTo({ left: 13.3, top: 201.7, behavior: 'smooth' });
    expect(webScroll.scrollTo).toHaveBeenLastCalledWith(view[native_], 13.3 * density, 201.7 * density, true);
  });

  it('keeps an axis as NaN rather than converting it', () => {
    const view = element();
    view.scrollTop = 10;
    expect(webScroll.scrollTo).toHaveBeenLastCalledWith(view[native_], NaN, 30, false);
  });

  it('replays a request made before the native view exists, converted once', () => {
    setScreenScale(2);
    const view = element(null);
    view.scrollTo({ top: 50 });
    view.scrollBy(0, 5);
    expect(webScroll.scrollTo).not.toHaveBeenCalled();
    const native = { id: 'late' };
    view[native_] = native;
    view._view = native;
    view.initNativeView();
    expect(webScroll.scrollTo).toHaveBeenCalledExactlyOnceWith(native, NaN, 110, false);
  });
});
