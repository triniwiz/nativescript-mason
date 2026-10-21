import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewBase } from './common';
import { native_ } from './symbols';

const engine = {
  ScrollLeft: vi.fn(() => 0),
  ScrollTop: vi.fn(() => 0),
  ScrollWidth: vi.fn(() => 0),
  ScrollHeight: vi.fn(() => 0),
  ClientWidth: vi.fn(() => 0),
  ClientHeight: vi.fn(() => 0),
  ScrollTo: vi.fn(),
  ScrollIntoView: vi.fn(),
  AddEventListener: vi.fn(() => 1),
  RemoveEventListener: vi.fn(),
};

(globalThis as any).NativeScript = { Mason: { Mason: { Instance: () => engine } } };
(globalThis as any).NSWinRT = { asDelegate: (_name: string, fn: any) => fn };

function element(native: any = { id: 'native' }) {
  const view = new ViewBase() as any;
  view[native_] = native;
  view._view = native;
  return view;
}

beforeEach(() => {
  for (const fn of Object.values(engine)) fn.mockClear();
});

describe('scroll offsets', () => {
  it('reads the offset from native only when asked', () => {
    const view = element();
    expect(engine.ScrollTop).not.toHaveBeenCalled();
    engine.ScrollTop.mockReturnValueOnce(42.5);
    expect(view.scrollTop).toBe(42.5);
    expect(engine.ScrollTop).toHaveBeenCalledWith(view[native_]);
  });

  it('sets one axis and keeps the other', () => {
    const view = element();
    view.scrollTop = 50;
    view.scrollLeft = 7;
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(1, view[native_], NaN, 50, false);
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(2, view[native_], 7, NaN, false);
  });

  it('treats a non-finite offset as 0, like the web', () => {
    const view = element();
    view.scrollTop = NaN;
    view.scrollTo(Infinity, 'x' as any);
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(1, view[native_], NaN, 0, false);
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(2, view[native_], 0, 0, false);
  });

  it('is a no-op before the native view exists', () => {
    const view = element(null);
    expect(view.scrollTop).toBe(0);
    expect(view.scrollHeight).toBe(0);
    view.scrollTop = 10;
    view.scrollIntoView();
    expect(engine.ScrollTo).not.toHaveBeenCalled();
    expect(engine.ScrollIntoView).not.toHaveBeenCalled();
  });
});

describe('before the native view exists', () => {
  it('keeps the latest request per axis and replays it with the native view', () => {
    const view = element(null);
    view.scrollTop = 10;
    view.scrollLeft = 3;
    view.scrollTo({ top: 20, behavior: 'smooth' });
    view.scrollBy(0, 5);
    expect(engine.ScrollTo).not.toHaveBeenCalled();
    const native = { id: 'late' };
    view[native_] = native;
    view._view = native;
    view.initNativeView();
    expect(engine.ScrollTo).toHaveBeenCalledTimes(1);
    expect(engine.ScrollTo).toHaveBeenCalledWith(native, 3, 25, false);
    view.initNativeView();
    expect(engine.ScrollTo).toHaveBeenCalledTimes(1);
  });
});

describe('scroll sizes', () => {
  it('rounds to whole pixels', () => {
    const view = element();
    engine.ScrollHeight.mockReturnValueOnce(100.6);
    engine.ClientWidth.mockReturnValueOnce(99.4);
    expect(view.scrollHeight).toBe(101);
    expect(view.clientWidth).toBe(99);
  });
});

describe('scrollTo / scrollBy', () => {
  it('takes coordinates or options, keeping axes the options leave out', () => {
    const view = element();
    view.scrollTo(10, 20);
    view.scrollTo({ top: 5, behavior: 'smooth' });
    view.scroll({ left: 3 });
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(1, view[native_], 10, 20, false);
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(2, view[native_], NaN, 5, true);
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(3, view[native_], 3, NaN, false);
  });

  it('scrolls by a delta from the current offset', () => {
    const view = element();
    engine.ScrollTop.mockReturnValue(30);
    view.scrollBy({ top: 10, behavior: 'smooth' });
    view.scrollBy(0, -5);
    engine.ScrollTop.mockReturnValue(0);
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(1, view[native_], NaN, 40, true);
    expect(engine.ScrollTo).toHaveBeenNthCalledWith(2, view[native_], NaN, 25, false);
    expect(engine.ScrollLeft).not.toHaveBeenCalled();
  });
});

describe('scrollIntoView', () => {
  it('maps the web defaults and options to start/center/end/nearest', () => {
    const view = element();
    view.scrollIntoView();
    view.scrollIntoView(false);
    view.scrollIntoView({ block: 'center', inline: 'end', behavior: 'smooth' });
    view.scrollIntoView({ block: 'nearest' });
    expect(engine.ScrollIntoView.mock.calls.map((c) => c.slice(1))).toEqual([
      [0, 3, false],
      [2, 3, false],
      [1, 2, true],
      [3, 3, false],
    ]);
  });
});

describe('scroll events', () => {
  it.each(['scroll', 'scrollend'])('registers "%s" natively only when a listener is added', (type) => {
    const view = element();
    expect(engine.AddEventListener).not.toHaveBeenCalled();
    const listener = vi.fn();
    view.addEventListener(type, listener);
    expect(engine.AddEventListener).toHaveBeenCalledWith(view[native_], type, expect.any(Function));
    const nativeListener = (engine.AddEventListener.mock.calls[0] as any[])[2];
    nativeListener({ Type: type });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].type).toBe(type);
    view.removeEventListener(type, listener);
    expect(engine.RemoveEventListener).toHaveBeenCalledWith(view[native_], type, 1);
  });
});
