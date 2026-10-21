import { beforeEach, describe, expect, it, vi } from 'vitest';

const bridge = vi.hoisted(() => ({ adopt: vi.fn(), release: vi.fn() }));
vi.mock('./foreign-layout', () => ({ adoptForeignLayout: bridge.adopt, releaseForeignLayout: bridge.release }));

import { Text } from './text/index.windows';
import { Button } from './button/index.windows';
import { native_, runMember_ } from './symbols';

function host(cls: any) {
  const view = Object.create(cls.prototype) as any;
  view._children = [];
  view[native_] = { IsButton: cls === Button, SetInlineBox: vi.fn(), RemoveInlineBox: vi.fn() };
  return view;
}

function plain() {
  return { nativeViewProtected: { id: 'xaml' }, _isMasonChild: false } as any;
}

beforeEach(() => {
  bridge.adopt.mockClear();
  bridge.release.mockClear();
});

describe.each([
  ['Text', Text],
  ['Button', Button],
])('a plain child of a Windows %s', (_name, cls) => {
  it('is laid out as an inline box and mirrors its CSS layout', () => {
    const parent = host(cls);
    const child = plain();
    expect(parent._addViewToNativeVisualTree(child)).toBe(true);
    expect(parent._view.SetInlineBox).toHaveBeenCalledExactlyOnceWith(child.nativeViewProtected, -1);
    expect(child[runMember_]).toBe('box');
    expect(child._isMasonChild).toBe(true);
    expect(bridge.adopt).toHaveBeenCalledExactlyOnceWith(child);
  });

  it('is unhosted and released on removal', () => {
    const parent = host(cls);
    const child = plain();
    parent._addViewToNativeVisualTree(child);
    parent._removeViewFromNativeVisualTree(child);
    expect(parent._view.RemoveInlineBox).toHaveBeenCalledExactlyOnceWith(child.nativeViewProtected);
    expect(child[runMember_]).toBeUndefined();
    expect(child._isMasonChild).toBe(false);
    expect(bridge.release).toHaveBeenCalledExactlyOnceWith(child);
  });
});
