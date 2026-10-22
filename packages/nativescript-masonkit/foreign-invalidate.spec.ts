import { describe, expect, it, vi } from 'vitest';
import { invalidateOnLayoutRequest, releaseForeignLayout } from './foreign-layout';

function child() {
  const order: string[] = [];
  const requestLayout = vi.fn(() => order.push('core'));
  const view: any = { nativeViewProtected: {}, requestLayout };
  const mason = { invalidateForeignView: vi.fn(() => order.push('mason')) };
  return { view, mason, requestLayout, order };
}

describe('foreign child requestLayout', () => {
  it('drops the native measurement before core forwards the request', () => {
    const { view, mason, requestLayout, order } = child();
    invalidateOnLayoutRequest(view, mason);
    view.nativeViewProtected = { recreated: true };
    view.requestLayout();
    expect(mason.invalidateForeignView).toHaveBeenCalledWith(view.nativeViewProtected);
    expect(requestLayout).toHaveBeenCalledOnce();
    expect(order).toEqual(['mason', 'core']);
  });

  it('installs one hook and follows a new engine', () => {
    const { view, mason } = child();
    const other = { invalidateForeignView: vi.fn() };
    invalidateOnLayoutRequest(view, mason);
    invalidateOnLayoutRequest(view, other);
    view.requestLayout();
    expect(mason.invalidateForeignView).not.toHaveBeenCalled();
    expect(other.invalidateForeignView).toHaveBeenCalledOnce();
  });

  it('restores own and inherited methods on removal', () => {
    const { view, mason, requestLayout } = child();
    invalidateOnLayoutRequest(view, mason);
    releaseForeignLayout(view);
    expect(view.requestLayout).toBe(requestLayout);

    const inherited = Object.create({ requestLayout });
    inherited.nativeViewProtected = {};
    invalidateOnLayoutRequest(inherited, mason);
    releaseForeignLayout(inherited);
    expect(Object.hasOwn(inherited, 'requestLayout')).toBe(false);
    inherited.requestLayout();
    expect(mason.invalidateForeignView).not.toHaveBeenCalled();
  });
});
