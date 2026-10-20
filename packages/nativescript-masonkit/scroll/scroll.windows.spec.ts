import { afterEach, describe, expect, it, vi } from 'vitest';
import { Scroll } from './index.windows';

function fixture() {
  const view = new Scroll();
  const scroller = { HorizontalOffset: 0, VerticalOffset: 60, ScrollableWidth: 0, ScrollableHeight: 900, ActualWidth: 320, ActualHeight: 240, ChangeView: vi.fn() };
  (view as any)._scroller = scroller;
  const listeners: Array<() => void> = [];
  const engine = {
    AddScrollListener: vi.fn((_view, callback) => {
      listeners.push(callback);
      return listeners.length;
    }),
    RemoveScrollListener: vi.fn(),
  };
  vi.stubGlobal('NativeScript', { Mason: { Mason: { Instance: () => engine } } });
  vi.stubGlobal('NSWinRT', { asDelegate: (_type, callback) => callback });
  return { view, scroller, engine, listeners };
}

afterEach(() => vi.unstubAllGlobals());

describe('Windows scroll source bridge (mocked WinUI)', () => {
  it('reports logical metrics and preserves disabled horizontal scrolling', () => {
    const { view, scroller } = fixture();
    expect([view.scrollX, view.scrollY, view.scrollableWidth, view.scrollableHeight]).toEqual([0, 60, 0, 900]);
    (view as any)._seek(200, 1000, true);
    expect(scroller.ChangeView).toHaveBeenLastCalledWith(0, 900, null, false);
  });

  it('applies the latest pre-layout seek and removes both native subscriptions', () => {
    const { view, scroller, engine, listeners } = fixture();
    (view as any)._observeScroll(true);
    scroller.ActualHeight = 0;
    (view as any)._seek(0, 500, true);
    (view as any)._seek(0, 700, false);
    scroller.ActualHeight = 240;
    listeners[1]();
    expect(scroller.ChangeView).toHaveBeenLastCalledWith(0, 700, null, true);
    const onScroll = vi.fn();
    view.on('scroll', onScroll);
    listeners[0]();
    expect(onScroll).toHaveBeenCalledWith(expect.objectContaining({ scrollX: 0, scrollY: 60 }));
    (view as any)._observeScroll(false);
    expect(engine.RemoveScrollListener.mock.calls.map((args) => args.slice(1))).toEqual([
      [1, false],
      [2, true],
    ]);
  });
});
