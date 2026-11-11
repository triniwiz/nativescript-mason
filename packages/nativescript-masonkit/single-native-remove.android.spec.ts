import { describe, expect, it, vi } from 'vitest';
import { View } from './view';
import { Text } from './text';
import { native_ } from './symbols';

describe.each([
  ['View', View],
  ['Text', Text],
])('%s removing a child', (_name, Container: any) => {
  it('removes the native child once and clears core bookkeeping', () => {
    const parent = Object.create(Container.prototype);
    const removeView = vi.fn();
    parent[native_] = parent.nativeViewProtected = { removeView };
    const child: any = { nativeViewProtected: {}, _isAddedToNativeVisualTree: true, _isMasonChild: true };
    parent._removeViewFromNativeVisualTree(child);
    expect(removeView).toHaveBeenCalledTimes(1);
    expect(removeView).toHaveBeenCalledWith(child.nativeViewProtected);
    expect(child._isAddedToNativeVisualTree).toBe(false);
    expect(child._isMasonChild).toBe(false);
  });
});
