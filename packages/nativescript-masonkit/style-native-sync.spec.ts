import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@nativescript/core', () => ({ Color: class {}, Screen: { mainScreen: { scale: 1 } } }));
vi.mock('./fonts', () => ({ pickFontFamily: () => undefined }));

import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { isMasonView_ } from './symbols';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { displayDensity } from './display-density';
import { nodeHelper, refreshViewportUnits } from './style';

// Exercise the real platform dispatch with a live JS buffer; native geometry
// and cache invalidation are covered by the Swift/Kotlin tests.
let windowsSync: (...args: unknown[]) => void = () => {};
if (__WINDOWS__) {
  (globalThis as any).NativeScript = { Mason: { Mason: { Instance: () => ({ SyncForeignStyle: (...a: unknown[]) => windowsSync(...a) }) } } };
}

function foreignStyle() {
  const sync = vi.fn();
  const native = __ANDROID__ || __WINDOWS__ ? {} : { mason_syncStyleParts: sync };
  if (__WINDOWS__) windowsSync = sync;
  if (__ANDROID__) {
    vi.stubGlobal('org', {
      nativescript: {
        mason: {
          masonkit: {
            Mason: { getShared: () => ({ syncStyleParts: sync }) },
          },
        },
      },
    });
  }
  const { style: value } = styleUnderTest();
  const style = value as any;
  style.nativeView = native;
  style.view_ = { android: native, ios: native, windows: native };
  return { style, sync, native };
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

  it.runIf(__APPLE__ || __ANDROID__)('reads native numeric radii without relying on a wrapper CSS cache', () => {
    const { style, view } = styleUnderTest();
    const css = { borderRadius: '' };
    const scale = displayDensity();
    Reflect.set(style, 'nativeView', { style: css });
    if (__ANDROID__) {
      vi.stubGlobal('org', { nativescript: { mason: { masonkit: {
        NodeHelper: { getShared: () => ({ getBorderRadius: () => css.borderRadius }) },
      } } } });
    }
    for (const corner of ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT', 'BOTTOM_LEFT']) {
      for (const axis of ['X', 'Y']) {
        view.setFloat32(styleKey(`BORDER_RADIUS_${corner}_${axis}_VALUE`), 40 * scale, true);
      }
    }
    expect(style.borderRadius).toBe('40px');
    for (const corner of ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT', 'BOTTOM_LEFT']) {
      for (const axis of ['X', 'Y']) {
        view.setFloat32(styleKey(`BORDER_RADIUS_${corner}_${axis}_VALUE`), 30 * scale, true);
      }
    }
    expect(style.borderRadius).toBe('30px');
    css.borderRadius = '25%';
    expect(style.borderRadius).toBe('25%');
  });

  it.runIf(__APPLE__ || __ANDROID__)('sends grid track math to the native style as authored', () => {
    const { style, native } = foreignStyle();
    const css = 'repeat(2, minmax(calc(10vw + 1em), 1fr))';
    const setGridTemplateColumns = vi.fn();
    if (__APPLE__) {
      Reflect.set(native, 'style', { set gridTemplateColumns(value: string) { setGridTemplateColumns(value); } });
      style.gridTemplateColumns = css;
      refreshViewportUnits();
      expect(setGridTemplateColumns.mock.calls).toEqual([[css], [css]]);
    } else {
      (globalThis as any).org.nativescript.mason.masonkit.NodeHelper = { getShared: () => ({}) };
      const helper = nodeHelper() as any;
      helper.setGridTemplateColumns = setGridTemplateColumns;
      try {
        style.gridTemplateColumns = css;
        refreshViewportUnits();
        expect(setGridTemplateColumns.mock.calls).toEqual([[native, css], [native, css]]);
      } finally {
        delete helper.setGridTemplateColumns;
      }
    }
  });

  it.runIf(__APPLE__ || __ANDROID__)('passes the full transform expression to the native parser', () => {
    const { style, native } = foreignStyle();
    const css = 'translateX(calc(50% - 10px)) rotate(calc(.25turn + 30deg))';
    const setTransform = vi.fn();
    if (__APPLE__) {
      Reflect.set(native, 'style', { set transform(value: string) { setTransform(value); } });
      style.transform = css;
      expect(setTransform).toHaveBeenCalledExactlyOnceWith(css);
    } else {
      (globalThis as any).org.nativescript.mason.masonkit.NodeHelper = { getShared: () => ({}) };
      const helper = nodeHelper() as any;
      helper.setTransform = setTransform;
      try {
        style.transform = css;
        expect(setTransform).toHaveBeenCalledExactlyOnceWith(native, css);
      } finally {
        delete helper.setTransform;
      }
    }
  });

  function backgroundStyle() {
    const { style, native } = foreignStyle();
    style.inBatch = false;
    const apply = vi.fn((_payload: string) => {});
    const getRepeat = vi.fn(() => 'round');
    if (__ANDROID__) {
      (globalThis as any).org.nativescript.mason.masonkit.NodeHelper = { getShared: () => ({}) };
      Object.assign(nodeHelper(), {
        applyBackgroundBatch: (_view: object, payload: string) => apply(payload),
        getBackgroundRepeat: getRepeat,
      });
    } else {
      Object.assign(native, { style: { applyBackgroundBatch: apply, get backgroundRepeat() { return getRepeat(); } } });
    }
    return { style, apply, getRepeat };
  }

  it.runIf(__APPLE__ || __ANDROID__)('sends ordered background writes together at the end of a turn', async () => {
    const { style, apply } = backgroundStyle();
    style.color = 0xffff0000;
    style.background = 'linear-gradient(currentColor, white) right calc(10% + 2px) bottom / min(50%, 80px) auto';
    style.color = 0xff0000ff;
    style.backgroundImage = 'linear-gradient(calc(.25turn + 90deg), currentColor calc(50% - 10px), black)';
    style.backgroundRepeat = 'round';
    style.backgroundSize = 'clamp(10px, 50%, 4em) auto';
    expect(apply).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(apply).toHaveBeenCalledExactlyOnceWith(JSON.stringify([
      'background', 'linear-gradient(currentColor, white) right calc(10% + 2px) bottom / min(50%, 80px) auto', String(0xffff0000),
      'background-image', 'linear-gradient(calc(.25turn + 90deg), currentColor calc(50% - 10px), black)', String(0xff0000ff),
      'background-repeat', 'round', '',
      'background-size', 'clamp(10px, 50%, 4em) auto', '',
    ]));
  });

  it.runIf(__APPLE__ || __ANDROID__)('flushes pending layers before a synchronous read or fill write', async () => {
    const { style, apply, getRepeat } = backgroundStyle();
    style.backgroundRepeat = 'round';
    expect(style.backgroundRepeat).toBe('round');
    expect(apply.mock.invocationCallOrder[0]).toBeLessThan(getRepeat.mock.invocationCallOrder[0]);

    style.background = 'blue';
    style.backgroundColor = 0xffff0000;
    expect(apply).toHaveBeenCalledTimes(2);
    expect(style.backgroundColor).toBe(0xffff0000);
    await Promise.resolve();
    expect(apply).toHaveBeenCalledTimes(2);
  });

  it.runIf(__APPLE__ || __ANDROID__)('keeps pseudo background strings out of the base batch', async () => {
    const { style, apply } = backgroundStyle();
    const setPseudoString = vi.fn();
    style.nativeNode = { setPseudoString };
    style._pseudo = 2;
    style.backgroundImage = 'url(active.png)';
    expect(setPseudoString).toHaveBeenCalledExactlyOnceWith(2, 'background-image', 'url(active.png)');
    await Promise.resolve();
    expect(apply).not.toHaveBeenCalled();
  });

  it.runIf(__APPLE__ || __ANDROID__)('flushes writes already made when a style batch throws', async () => {
    const { style, apply } = backgroundStyle();
    expect(() => style.batch(() => {
      style.backgroundRepeat = 'round';
      throw new Error('aborted style update');
    })).toThrow('aborted style update');
    expect(apply).toHaveBeenCalledExactlyOnceWith(JSON.stringify(['background-repeat', 'round', '']));
    style.backgroundRepeat = 'space';
    await Promise.resolve();
    expect(apply).toHaveBeenCalledTimes(2);
  });

  it.runIf(__APPLE__ || __ANDROID__)('sends shadow and filter writes in one batch and flushes before a read', async () => {
    const { style, native } = foreignStyle();
    style.inBatch = false;
    const apply = vi.fn((_payload: string) => {});
    const getFilter = vi.fn(() => 'blur(2px)');
    if (__ANDROID__) {
      (globalThis as any).org.nativescript.mason.masonkit.NodeHelper = { getShared: () => ({}) };
      Object.assign(nodeHelper(), {
        applyEffectBatch: (_view: object, payload: string) => apply(payload),
        getFilter,
      });
    } else {
      Object.assign(native, { style: { applyEffectBatch: apply, get filter() { return getFilter(); } } });
    }
    style.color = 0xffff0000;
    style.boxShadow = 'calc(1px + 2px) 2px currentColor';
    style.color = 0xff0000ff;
    style.filter = 'blur(calc(1px + 1px))';
    style.textShadow = 'none';
    style.backdropFilter = 'brightness(calc(100% - 20%))';
    expect(apply).not.toHaveBeenCalled();
    expect(style.filter).toBe('blur(2px)');
    expect(apply.mock.invocationCallOrder[0]).toBeLessThan(getFilter.mock.invocationCallOrder[0]);
    await Promise.resolve();
    expect(apply).toHaveBeenCalledExactlyOnceWith(JSON.stringify([
      'box-shadow', 'calc(1px + 2px) 2px currentColor', String(0xffff0000),
      'filter', 'blur(calc(1px + 1px))', String(0xff0000ff),
      'text-shadow', 'none', String(0xff0000ff),
      'backdrop-filter', 'brightness(calc(100% - 20%))', String(0xff0000ff),
    ]));
  });

  it.runIf(__APPLE__ || __ANDROID__)('batches mask, mask-border, and clip-path updates and preserves clears', async () => {
    const { style, native } = foreignStyle();
    style.inBatch = false;
    const apply = vi.fn((_payload: string) => {});
    const getMaskRepeat = vi.fn(() => 'no-repeat');
    if (__ANDROID__) {
      (globalThis as any).org.nativescript.mason.masonkit.NodeHelper = { getShared: () => ({}) };
      Object.assign(nodeHelper(), {
        applyMaskBatch: (_view: object, payload: string) => apply(payload),
        getMaskRepeat,
      });
    } else {
      Object.assign(native, { style: { applyMaskBatch: apply, get maskRepeat() { return getMaskRepeat(); } } });
    }
    style.maskImage = 'linear-gradient(calc(180deg - 90deg), black calc(50% - 10px), transparent)';
    style['mask-size'] = 'min(100px, 20px) auto';
    style['mask-position'] = 'calc(50% - 2px) center';
    style.maskRepeat = 'round';
    style.maskRepeat = 'no-repeat';
    style.maskBorderSlice = 'max(10%, 25%) fill';
    style.maskBorderWidth = 'min(25%, 30px) calc(1em + 2px)';
    style.maskBorderOutset = 'calc(1em - 10px)';
    style.clipPath = 'inset(min(25%, 20px) calc(50% - 2px))';
    expect(apply).not.toHaveBeenCalled();
    expect(style.maskRepeat).toBe('no-repeat');
    expect(apply.mock.invocationCallOrder[0]).toBeLessThan(getMaskRepeat.mock.invocationCallOrder[0]);
    expect(apply).toHaveBeenCalledExactlyOnceWith(JSON.stringify([
      '0', 'linear-gradient(calc(180deg - 90deg), black calc(50% - 10px), transparent)',
      '1', 'min(100px, 20px) auto', '2', 'calc(50% - 2px) center',
      '3', 'no-repeat', '9', 'max(10%, 25%) fill', '10', 'min(25%, 30px) calc(1em + 2px)',
      '11', 'calc(1em - 10px)', '14', 'inset(min(25%, 20px) calc(50% - 2px))',
    ]));

    style.maskImage = null;
    await Promise.resolve();
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenLastCalledWith(JSON.stringify(['0', '']));
  });

  it.runIf(__APPLE__ || __ANDROID__)('passes authored decoration math to the native parser', () => {
    const { style, native } = foreignStyle();
    const decoration = vi.fn();
    const color = vi.fn();
    if (__ANDROID__) {
      (globalThis as any).org.nativescript.mason.masonkit.NodeHelper = { getShared: () => ({}) };
      Object.assign(nodeHelper(), { setTextDecoration: decoration, setTextDecorationColor: color });
    } else {
      Object.assign(native, { style: { setTextDecoration: decoration, set textDecorationColor(value: string) { color(value); } } });
    }
    const authoredColor = 'rgb(calc(50 * 2) 0 0)';
    const authored = `underline ${authoredColor} calc(1em + 2px)`;
    style.textDecoration = authored;
    style.textDecorationColor = authoredColor;
    expect(decoration).toHaveBeenCalledExactlyOnceWith(...(__ANDROID__ ? [native, authored] : [authored]));
    expect(color).toHaveBeenCalledExactlyOnceWith(...(__ANDROID__ ? [native, authoredColor] : [authoredColor]));
  });

  it.runIf(__WINDOWS__)('sends all four Windows effects through one Rust batch', async () => {
    const { style, native } = foreignStyle();
    style.inBatch = false;
    const apply = vi.fn();
    Object.assign((globalThis as any).NativeScript.Mason, { Css: { SetCssEffects: apply } });
    style.filter = 'blur(2px)';
    style.color = 0xffff0000;
    style.boxShadow = '1px 2px currentColor';
    style.color = 0x00000000;
    style.textShadow = '2px 3px currentColor';
    style.backdropFilter = 'brightness(80%)';
    expect(apply).not.toHaveBeenCalled();
    expect(style.textShadow).toBe('2px 3px currentColor');
    expect(apply).toHaveBeenCalledExactlyOnceWith(native, JSON.stringify([
      'filter', 'blur(2px)', '',
      'box-shadow', '1px 2px currentColor', String(0xffff0000),
      'text-shadow', '2px 3px currentColor', '0',
      'backdrop-filter', 'brightness(80%)', '0',
    ]), expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number));

    style.textShadow = 'none';
    await Promise.resolve();
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply.mock.lastCall?.[1]).toBe(JSON.stringify(['text-shadow', 'none', '0']));
  });

  it('forwards every dirty word as int32 without combining them into a JS number', () => {
    const { style, sync, native } = foreignStyle();
    const words = [-2147483648, -2147483647, -1, -2147483646];
    [style._d0, style._d1, style._d2, style._d3] = words;
    style._hasDirty = true;
    style._sendSync();
    expect(sync).toHaveBeenCalledWith(...args(native, words));
  });

  it('uses the combined overflow bit when writing both axes', () => {
    const { style, sync, native } = foreignStyle();
    style.batch(() => { style.overflow = 'hidden scroll'; });
    expect(sync).toHaveBeenCalledExactlyOnceWith(...args(native, [-2147483648, 0, 0, 0]));
    expect(style.overflowX).toBe('hidden');
    expect(style.overflowY).toBe('scroll');
  });
});
