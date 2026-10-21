import { afterEach, describe, expect, it, vi } from 'vitest';
import { CssState, StyleScope } from '@nativescript/core/ui/styling/style-scope';
import { Observable } from '@nativescript/core/data/observable';
import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { unsetValue } from '@nativescript/core/ui/core/properties';
import { Style } from '../../packages/nativescript-masonkit/style';
import { adoptForeignLayout, releaseForeignLayout } from '../../packages/nativescript-masonkit/foreign-layout';
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
    _onCssStateChange() {},
    eachChild() {},
    _batchUpdate: (update: () => void) => update(),
    getEffectivePaddingShorthand: () => 0,
    getEffectiveMarginShorthand: () => 0,
  });
  view.style = new CoreStyle({ get: () => view, deref: () => view, clear() {} } as any);
  return { view, style: view.style as any };
}

function cssClass(view: any, css: string, name: string) {
  const scope = new StyleScope();
  scope.css = css;
  view._styleScope = scope;
  view.cssClasses = new Set(name.split(' '));
  view.cssPseudoClasses = new Set();
  view.isLoaded = true;
  const state = new CssState({ get: () => view, deref: () => view } as any);
  view._onCssStateChange = () => state.onChange();
  state.onChange();
}

const adopted: any[] = [];
function adopt(view: any) {
  adoptForeignLayout(view);
  adopted.push(view);
}

function nativeTransport() {
  const leaves = new Map<object, any>();
  const writes: Array<[string, unknown]> = [];
  vi.spyOn(Style, 'fromView').mockImplementation((_view, native) => {
    // A native view keeps its Mason leaf across attachments.
    if (!leaves.has(native as object)) {
      leaves.set(
        native as object,
        new Proxy({} as any, {
          set(target, key, value) {
            writes.push([String(key), value]);
            return Reflect.set(target, key, value);
          },
        }),
      );
    }
    return leaves.get(native as object);
  });
  return { writes, leaf: (view: any) => leaves.get(view.nativeViewProtected) };
}

afterEach(() => {
  for (const view of adopted.splice(0)) releaseForeignLayout(view);
  vi.restoreAllMocks();
  setScreenScale(3);
});

describe('effective CSS layout on foreign NativeScript children', () => {
  it('copies class dimensions and resets removed class values to Mason defaults', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    style['css:width'] = '31';
    style['css:height'] = '36';
    style['css:margin-left'] = '4';
    style['css:align-self'] = 'center';
    adopt(view);
    expect(native.leaf(view)).toEqual({ width: 31, height: 36, marginLeft: 4, alignSelf: 'center' });
    style['css:width'] = '43';
    style['css:margin-left'] = unsetValue;
    style['css:align-self'] = unsetValue;
    expect(native.leaf(view)).toMatchObject({ width: 43, marginLeft: 0, alignSelf: 'normal' });
    style['css:width'] = unsetValue;
    style['css:height'] = unsetValue;
    expect(native.leaf(view)).toMatchObject({ width: 'auto', height: 'auto' });
    expect(view[isMasonView_]).toBeUndefined();
  });

  it('keeps local precedence and restores current CSS when the override is removed', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    style['css:width'] = '31';
    style['css:height'] = '36';
    adopt(view);
    style.width = 30;
    style['css:width'] = '43';
    style['css:height'] = '43';
    expect(native.leaf(view)).toMatchObject({ width: 30, height: 43 });
    style.width = unsetValue;
    expect(native.leaf(view)).toMatchObject({ width: 43, height: 43 });
  });

  it('converts physical px to dip once, preserving dip values and percentage fractions', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    setScreenScale(3);
    style['css:width'] = '93px';
    style['css:height'] = '50%';
    style['css:min-width'] = '18px';
    style['css:min-height'] = '7';
    style['css:max-width'] = '120px';
    style['css:margin-left'] = '9px';
    adopt(view);
    expect(style.width).toEqual({ value: 93, unit: 'px' });
    expect(native.leaf(view)).toEqual({ width: 31, height: { value: 0.5, unit: '%' }, minWidth: 6, minHeight: 7, maxWidth: 40, marginLeft: 3 });
  });

  it('forwards constraints, flex and grid placement without coercing core style', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    Object.assign(style, { minWidth: 12, minHeight: 13, maxWidth: 100, maxHeight: 101, flexGrow: 2, flexShrink: 0, flexBasis: '25%', alignSelf: 'center', justifySelf: 'end', gridRowStart: 2, gridRowEnd: 4, gridColumnStart: 3, gridColumnEnd: 5 });
    adopt(view);
    expect(native.leaf(view)).toMatchObject({ minWidth: 12, minHeight: 13, maxWidth: 100, maxHeight: 101, flexGrow: 2, flexShrink: 0, flexBasis: { value: 0.25, unit: '%' }, alignSelf: 'center', justifySelf: 'end', gridArea: '2 / 3 / 4 / 5' });
  });

  it('keeps Mason automatic minimum sizes: core min-size defaults are never written as 0', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    style.width = 20;
    adopt(view);
    expect(native.leaf(view)).toEqual({ width: 20 });
    style.minWidth = 8;
    style.minWidth = unsetValue;
    expect(native.leaf(view).minWidth).toBe('auto');
  });

  it('follows native recreation, stops on release and catches up on re-adoption', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    style['css:width'] = '31';
    view.nativeViewProtected = undefined;
    adopt(view);
    expect(Style.fromView).not.toHaveBeenCalled();
    view.nativeViewProtected = {};
    adopt(view);
    const original = native.leaf(view);
    expect(original).toEqual({ width: 31 });
    view.nativeViewProtected = {};
    adopt(view);
    expect(native.leaf(view)).not.toBe(original);
    expect(native.leaf(view)).toEqual({ width: 31 });
    releaseForeignLayout(view);
    style['css:width'] = '54';
    style['css:height'] = '12';
    expect(native.leaf(view)).toEqual({ width: 31 });
    adopt(view);
    expect(native.leaf(view)).toMatchObject({ width: 54, height: 12 });
  });

  it('clears values unset while detached when the same leaf is re-adopted', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    style.width = 30;
    style.marginTop = 5;
    adopt(view);
    releaseForeignLayout(view);
    style.width = unsetValue;
    style.marginTop = unsetValue;
    adopt(view);
    expect(native.leaf(view)).toMatchObject({ width: 'auto', marginTop: 0, minWidth: 'auto', alignSelf: 'normal' });
  });

  it('restores the original Style prototype and adds no own accessors', () => {
    nativeTransport();
    const { view, style } = foreign();
    const proto = Object.getPrototypeOf(style);
    adopt(view);
    expect(Object.getPrototypeOf(style)).not.toBe(proto);
    expect(Object.getOwnPropertyNames(style).filter((key) => /width|margin|grid/i.test(key))).toEqual([]);
    releaseForeignLayout(view);
    expect(Object.getPrototypeOf(style)).toBe(proto);
  });

  // Removing a local CssProperty value falls back to its default, not the class
  // value: core's own semantics, shared by every view outside Mason too.
  it('keeps grid shorthand and longhand CSS/local priority on the same effective edges', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    cssClass(view, '.placement { grid-row-start: 3; grid-row-end: 5; }', 'placement');
    adopt(view);
    expect(native.leaf(view).gridArea).toBe('3 / auto / 5 / auto');
    style.gridRow = '2 / 4';
    expect(native.leaf(view).gridArea).toBe('2 / auto / 4 / auto');
    style['css:grid-row-start'] = '6';
    expect(native.leaf(view).gridArea).toBe('2 / auto / 4 / auto');
    style.gridRowStart = unsetValue;
    expect(native.leaf(view).gridArea).toBe('auto / auto / 4 / auto');
  });

  it('writes authored grid shorthands once as a complete area', () => {
    const native = nativeTransport();
    const { view, style } = foreign();
    cssClass(view, '.placement { grid-row: 2 / 4; }', 'placement');
    adopt(view);
    expect(native.writes.filter(([key]) => key.startsWith('grid'))).toEqual([['gridArea', '2 / auto / 4 / auto']]);
    style.gridRowStart = '3';
    expect(native.leaf(view).gridArea).toBe('3 / auto / 4 / auto');
    view.cssClasses.clear();
    view._onCssStateChange();
    expect(native.leaf(view).gridArea).toBe('3 / auto / auto / auto');
  });

  it('keeps Mason direct grid setters and stylesheet expansion working', () => {
    nativeTransport();
    const { view, style } = foreign();
    view[isMasonView_] = true;
    view._styleHelper = {};
    style.gridRow = '2 / 4';
    expect(view._styleHelper.gridRow).toBe('2 / 4');
    cssClass(view, '.placement { grid-row: 3 / 5; grid-column: 2 / 4; }', 'placement');
    expect(view._styleHelper).toMatchObject({ gridRowStart: '3', gridRowEnd: '5', gridColumnStart: '2', gridColumnEnd: '4' });
  });

  it('leaves Mason-owned views on their existing forwarding path', () => {
    nativeTransport();
    const { view, style } = foreign();
    view[isMasonView_] = true;
    view._styleHelper = {};
    const proto = Object.getPrototypeOf(style);
    adopt(view);
    style.width = 54;
    expect(Style.fromView).not.toHaveBeenCalled();
    expect(Object.getPrototypeOf(style)).toBe(proto);
  });
});
