import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@nativescript/core', () => ({ Color: class {}, Screen: { mainScreen: { scale: 1 } } }));
vi.mock('./fonts', () => ({ pickFontFamily: () => undefined }));

import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { isMasonView_ } from './symbols';

// Exercise the real platform dispatch with a live JS buffer; native geometry
// and cache invalidation are covered by the Swift/Kotlin tests.
let windowsSync: (...args: unknown[]) => void = () => {};
if (__WINDOWS__) {
  (globalThis as any).NativeScript = { Mason: { Mason: { Instance: () => ({ SyncForeignStyle: (...a: unknown[]) => windowsSync(...a) }) } } };
}

function foreignStyle() {
  const sync = vi.fn();
  const setGridArea = vi.fn();
  const appleStyle = {
    set gridArea(value: string) {
      setGridArea(value);
    },
  };
  const native = __ANDROID__ || __WINDOWS__ ? {} : { mason_syncStyleParts: sync, style: appleStyle };
  if (__WINDOWS__) windowsSync = sync;
  if (__ANDROID__) {
    vi.stubGlobal('org', {
      nativescript: {
        mason: {
          masonkit: {
            Mason: { getShared: () => ({ syncStyleParts: sync }) },
            NodeHelper: { getShared: () => ({ setGridArea: (_view: unknown, value: string) => setGridArea(value) }) },
          },
        },
      },
    });
  }
  const { style: value } = styleUnderTest();
  const style = value as any;
  style.inBatch = false;
  style.nativeView = native;
  style.view_ = { android: native, ios: native, windows: native };
  return { style, sync, native, setGridArea };
}

function args(native: object, words: number[]) {
  return __ANDROID__ || __WINDOWS__ ? [native, ...words] : words;
}

afterEach(() => vi.unstubAllGlobals());

describe('native style dispatch for ordinary views', () => {
  it('syncs initial sizes and later changes without Element methods', () => {
    const { style, sync, native } = foreignStyle();
    style.batch(() => {
      style.width = 31;
      style.height = 36;
    });
    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenLastCalledWith(...args(native, [1 << 20, 0, 0, 0]));
    style.batch(() => {
      style.width = 54;
      style.height = 43;
    });
    expect(sync).toHaveBeenCalledTimes(2);
    style.batch(() => {
      style.width = 54;
      style.height = 43;
    });
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it.runIf(__ANDROID__ || __APPLE__)('syncs foreign grid placement and its reset after the native string writes', async () => {
    const { style, sync, native, setGridArea } = foreignStyle();

    style.gridArea = 'auto / 3 / auto / auto';
    await Promise.resolve();
    expect(setGridArea).toHaveBeenLastCalledWith('auto / 3 / auto / auto');
    expect(sync).toHaveBeenCalledExactlyOnceWith(...args(native, [0, 0, 0, 0]));
    expect(setGridArea).toHaveBeenCalledBefore(sync);

    setGridArea.mockClear();
    sync.mockClear();
    style.gridArea = 'auto / auto / auto / auto';
    await Promise.resolve();
    expect(setGridArea).toHaveBeenLastCalledWith('auto / auto / auto / auto');
    expect(sync).toHaveBeenCalledExactlyOnceWith(...args(native, [0, 0, 0, 0]));
    expect(setGridArea).toHaveBeenCalledBefore(sync);

    style.width = 31;
    await Promise.resolve();
    sync.mockClear();
    style.width = 42;
    style.width = 31;
    style.gridArea = 'auto / 3 / auto / auto';
    await Promise.resolve();
    expect(sync).toHaveBeenCalledExactlyOnceWith(...args(native, [1 << 20, 0, 0, 0]));
  });

  it.runIf(__ANDROID__)('syncs Mason views directly without fetching the native singleton', () => {
    const { style, sync, native } = foreignStyle();
    const directSync = vi.fn();
    (native as any).syncStyleParts = directSync;
    style.view_[isMasonView_] = true;
    const getShared = vi.fn(() => {
      throw new Error('Mason views must use direct sync');
    });
    vi.stubGlobal('org', { nativescript: { mason: { masonkit: { Mason: { getShared } } } } });
    const words = [-2147483648, -2147483647, -1, -2147483646];
    [style._d0, style._d1, style._d2, style._d3] = words;
    style._hasDirty = true;
    style._sendSync();
    expect(directSync).toHaveBeenCalledExactlyOnceWith(...words);
    expect(getShared).not.toHaveBeenCalled();
    expect(sync).not.toHaveBeenCalled();
  });

  it.runIf(__WINDOWS__)('syncs Mason views through their own element, not the engine', () => {
    const { style, sync, native } = foreignStyle();
    const directSync = vi.fn();
    (native as any).SyncStyle = directSync;
    style.view_[isMasonView_] = true;
    const words = [-2147483648, -2147483647, -1, -2147483646];
    [style._d0, style._d1, style._d2, style._d3] = words;
    style._hasDirty = true;
    style._sendSync();
    expect(directSync).toHaveBeenCalledExactlyOnceWith(...words);
    expect(sync).not.toHaveBeenCalled();
  });

  it('forwards every dirty word as int32 without combining them into a JS number', () => {
    const { style, sync, native } = foreignStyle();
    const words = [-2147483648, -2147483647, -1, -2147483646];
    [style._d0, style._d1, style._d2, style._d3] = words;
    style._hasDirty = true;
    style._sendSync();
    expect(sync).toHaveBeenCalledWith(...args(native, words));
  });
});
