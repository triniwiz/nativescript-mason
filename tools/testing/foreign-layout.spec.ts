import { afterEach, describe, expect, it, vi } from 'vitest';
import { Observable } from '@nativescript/core/data/observable';
import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { unsetValue } from '@nativescript/core/ui/core/properties';
import { Style } from '../../packages/nativescript-masonkit/style';
import { bindForeignLayout, syncForeignLayout } from '../../packages/nativescript-masonkit/foreign-layout';
import { isMasonView_ } from '../../packages/nativescript-masonkit/symbols';
import { setScreenScale } from './mason-test-kit/ns-layout';
import '../../packages/nativescript-masonkit/properties';

// Exercise NativeScript's real property system, including CSS/local precedence.
// Only the native Style transport is replaced: these tests do not claim native
// frame or cache-invalidation coverage.
function foreign() {
  const view = new Observable() as any;
  Object.assign(view, {
    nativeViewProtected: {},
    eachChild() {},
    _batchUpdate: (update: () => void) => update(),
    getEffectivePaddingShorthand: () => 0,
    getEffectiveMarginShorthand: () => 0,
  });
  view.style = new CoreStyle({ get: () => view, deref: () => view, clear() {} } as any);
  const parent = { requestLayout: vi.fn() };
  view.parent = parent;
  return { view, style: view.style as any, parent };
}

const releases: Array<() => void> = [];
function bind(view: any, parent: any) {
  const release = bindForeignLayout(view, parent as any);
  releases.push(release);
  return release;
}

function nativeTransport() {
  const leaves = new Map<object, any>();
  const calls: string[] = [];
  const writes: Array<[string, unknown]> = [];
  vi.spyOn(Style, 'fromView').mockImplementation((_view, native) => {
    if (!leaves.has(native as object)) {
      const leaf: any = new Proxy(
        {
          batch(update: (style: any) => void) {
            calls.push('begin');
            update(leaf);
            calls.push('commit');
          },
        },
        {
          set(target, key, value) {
            writes.push([String(key), value]);
            return Reflect.set(target, key, value);
          },
        },
      );
      leaves.set(native as object, leaf);
    }
    return leaves.get(native as object);
  });
  return { leaves, calls, writes, leaf: (view: any) => leaves.get(view.nativeViewProtected) };
}

afterEach(() => {
  for (const release of releases.splice(0)) release();
  vi.restoreAllMocks();
  setScreenScale(3);
});

describe('effective CSS layout on foreign NativeScript children', () => {
  it('copies class dimensions and clears removed class values', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    style['css:width'] = '31';
    style['css:height'] = '36';
    style['css:margin-left'] = '4';
    style['css:align-self'] = 'center';
    bind(view, parent);
    expect(native.leaf(view)).toMatchObject({ width: 31, height: 36, marginLeft: 4, alignSelf: 'center' });
    style['css:width'] = '43';
    style['css:margin-left'] = unsetValue;
    style['css:align-self'] = unsetValue;
    expect(native.leaf(view)).toMatchObject({ width: 43, marginLeft: { value: 0, unit: 'dip' } });
    expect(['auto', 'normal']).toContain(native.leaf(view).alignSelf);
    style['css:width'] = unsetValue;
    style['css:height'] = unsetValue;
    expect(native.leaf(view)).toMatchObject({ width: 'auto', height: 'auto' });
    expect(view[isMasonView_]).toBeUndefined();
  });

  it('keeps local precedence and restores current CSS when the override is removed', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    style['css:width'] = '31';
    style['css:height'] = '36';
    bind(view, parent);
    style.width = 30;
    style['css:width'] = '43';
    style['css:height'] = '43';
    expect(native.leaf(view)).toMatchObject({ width: 30, height: 43 });
    style.width = unsetValue;
    expect(native.leaf(view)).toMatchObject({ width: 43, height: 43 });
  });

  it('converts physical px once, preserving DIP values and percentage fractions', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    setScreenScale(3);
    style['css:width'] = '93px';
    style['css:height'] = '50%';
    style['css:min-width'] = '18px';
    style['css:min-height'] = '7';
    style['css:max-width'] = '120px';
    style['css:margin-left'] = '9px';
    bind(view, parent);
    expect(style.width).toEqual({ value: 93, unit: 'px' });
    expect(native.leaf(view)).toMatchObject({
      width: { value: 31, unit: 'dip' },
      height: { value: 0.5, unit: '%' },
      minWidth: { value: 6, unit: 'dip' },
      minHeight: 7,
      maxWidth: { value: 40, unit: 'dip' },
      marginLeft: { value: 3, unit: 'dip' },
    });
  });

  it('forwards constraints, flex and grid placement without coercing core style', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    Object.assign(style, { minWidth: 12, minHeight: 13, maxWidth: 100, maxHeight: 101, flexGrow: 2, flexShrink: 0, flexBasis: '25%', alignSelf: 'center', justifySelf: 'end', gridRowStart: 2, gridRowEnd: 4, gridColumnStart: 3, gridColumnEnd: 5 });
    bind(view, parent);
    expect(native.leaf(view)).toMatchObject({ minWidth: 12, minHeight: 13, maxWidth: 100, maxHeight: 101, flexGrow: 2, flexShrink: 0, flexBasis: { value: 0.25, unit: '%' }, alignSelf: 'center', justifySelf: 'end', gridArea: '2 / 3 / 4 / 5' });
  });

  it('replays after late native creation/recreation and unsubscribes on removal', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    view.nativeViewProtected = undefined;
    style['css:width'] = '31';
    style['css:height'] = '36';
    const release = bind(view, parent);
    expect(Style.fromView).not.toHaveBeenCalled();
    view.nativeViewProtected = {};
    view.notify({ eventName: 'loaded', object: view });
    const original = native.leaf(view);
    expect(original).toMatchObject({ width: 31, height: 36 });
    view.nativeViewProtected = {};
    view.notify({ eventName: 'loaded', object: view });
    expect(native.leaf(view)).not.toBe(original);
    expect(native.leaf(view)).toMatchObject({ width: 31, height: 36 });
    release();
    const writes = vi.mocked(Style.fromView).mock.calls.length;
    parent.requestLayout.mockClear();
    style['css:width'] = '54';
    view.notify({ eventName: 'loaded', object: view });
    expect(Style.fromView).toHaveBeenCalledTimes(writes);
    expect(parent.requestLayout).not.toHaveBeenCalled();
    bind(view, parent);
    expect(native.leaf(view).width).toBe(54);
  });

  it('finishes synchronous style commits before requesting parent layout', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    parent.requestLayout.mockImplementation(() => expect(native.calls.at(-1)).toBe('commit'));
    bind(view, parent);
    parent.requestLayout.mockClear();
    style.width = 54;
    expect(parent.requestLayout).toHaveBeenCalled();
    expect(native.leaf(view).width).toBe(54);
  });

  it('pauses style forwarding while unloaded and replays current CSS on load', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    style.width = 31;
    bind(view, parent);
    view.notify({ eventName: 'unloaded', object: view });
    const original = native.leaf(view);
    parent.requestLayout.mockClear();
    style.width = 54;
    expect(original.width).toBe(31);
    expect(parent.requestLayout).not.toHaveBeenCalled();
    view.nativeViewProtected = {};
    view.notify({ eventName: 'loaded', object: view });
    expect(native.leaf(view)).not.toBe(original);
    expect(native.leaf(view).width).toBe(54);
    expect(parent.requestLayout).toHaveBeenCalled();
  });

  it('replays explicit post-insertion sync before a loaded event', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    style.width = 31;
    view.nativeViewProtected = undefined;
    bind(view, parent);
    view.nativeViewProtected = {};
    syncForeignLayout(view);
    expect(native.leaf(view).width).toBe(31);
    expect(parent.requestLayout).toHaveBeenCalledTimes(1);
    syncForeignLayout(view);
    expect(parent.requestLayout).toHaveBeenCalledTimes(1);
  });

  it('drops disposed native transport and resumes with a newly created native view', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    style.width = 31;
    const release = bind(view, parent);
    const original = native.leaf(view);
    view.notify({ eventName: 'disposeNativeView', object: view });
    expect(style.hasListeners('widthChange')).toBe(false);
    style.width = 54;
    expect(original.width).toBe(31);
    view.nativeViewProtected = {};
    view.notify({ eventName: 'loaded', object: view });
    expect(native.leaf(view).width).toBe(54);
    release();
    expect(style.hasListeners('widthChange')).toBe(false);
    expect(view.hasListeners('loaded')).toBe(false);
    expect(view.hasListeners('unloaded')).toBe(false);
    expect(view.hasListeners('disposeNativeView')).toBe(false);
  });

  it('does not overwrite authored grid shorthands with default auto longhands', () => {
    const native = nativeTransport();
    const { view, style, parent } = foreign();
    style.gridRow = '2 / 4';
    bind(view, parent);
    expect(native.writes.filter(([key]) => key.startsWith('grid'))).toEqual([['gridArea', '2 / auto / 4 / auto']]);
    native.writes.length = 0;
    style.gridRowStart = '3';
    expect(native.writes.filter(([key]) => key.startsWith('grid'))).toEqual([['gridArea', '3 / auto / 4 / auto']]);
    native.writes.length = 0;
    style.gridRowStart = unsetValue;
    expect(native.writes.filter(([key]) => key.startsWith('grid'))).toEqual([['gridArea', '2 / auto / 4 / auto']]);
    native.writes.length = 0;
    style.gridRow = unsetValue;
    expect(native.writes.filter(([key]) => key.startsWith('grid'))).toEqual([['gridArea', 'auto / auto / auto / auto']]);
  });

  it('leaves Mason-owned views on their existing forwarding path', () => {
    nativeTransport();
    const { view, style, parent } = foreign();
    view[isMasonView_] = true;
    view._styleHelper = {};
    bind(view, parent);
    style.width = 54;
    expect(Style.fromView).not.toHaveBeenCalled();
  });
});
