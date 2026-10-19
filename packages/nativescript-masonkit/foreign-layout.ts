import { Utils, View } from '@nativescript/core';
import { isResetValue } from '@nativescript/core/ui/core/properties/property-shared';
import { Style } from './style';
import { isMasonView_ } from './symbols';

// Read core's effective longhands, after its CSS/local-value priority and unit
// parsing. A foreign widget must keep its normal NativeScript Style accessors.
const lengths = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'flexBasis'] as const;
const values = ['flexGrow', 'flexShrink', 'alignSelf', 'justifySelf', 'aspectRatio', 'position', 'left', 'right', 'top', 'bottom'] as const;
const placements = ['gridRowStart', 'gridColumnStart', 'gridRowEnd', 'gridColumnEnd'] as const;
const properties = [...lengths, ...values, ...placements];

function length(value: any): any {
  // Core px objects contain physical pixels. Mason's number/dip/px setters
  // all scale by the display density, while percentage objects hold fractions.
  return value?.unit === 'px' ? { value: Utils.layout.toDeviceIndependentPixels(value.value), unit: 'dip' } : value;
}

interface Binding {
  attached(): void;
  dispose(): void;
}
const bindings = new WeakMap<View, Binding>();

/** Replay after native insertion too: on iOS insertion may follow `loaded`. */
export function syncForeignLayout(view: View): void {
  bindings.get(view)?.attached();
}

/** Own the listeners for one attachment of a plain NativeScript child. */
export function bindForeignLayout(view: View, parent: View): () => void {
  if (view[isMasonView_]) return () => {};
  bindings.get(view)?.dispose();
  let native: any;
  let helper: Style | undefined;
  let previous = new Map<string, string>();
  let disposed = false;
  let listening = false;
  let suspended = false;
  let writing = 0;
  const restorers: Array<() => void> = [];
  const sync = () => {
    if (disposed || suspended || writing || !view.nativeViewProtected) return;
    if (native !== view.nativeViewProtected) {
      native = view.nativeViewProtected;
      helper = Style.fromView(view as never, native);
      previous = new Map();
    }
    const resolved: Record<string, any> = {};
    for (const key of lengths) resolved[key] = length(view.style[key]);
    for (const key of values) resolved[key] = ['left', 'right', 'top', 'bottom'].includes(key) ? length(view.style[key]) : view.style[key];
    for (const key of ['width', 'height', 'maxWidth', 'maxHeight', 'flexBasis', 'left', 'right', 'top', 'bottom']) resolved[key] ??= 'auto';
    for (const key of ['alignSelf', 'justifySelf']) if (resolved[key] == null || resolved[key] === 'auto') resolved[key] = 'normal';
    const changed = Object.keys(resolved).filter((key) => previous.get(key) !== JSON.stringify(resolved[key]));
    const grid = placements.map((key) => view.style[key] ?? 'auto');
    const gridChanged = previous.get('grid') !== JSON.stringify(grid);
    if (!changed.length && !gridChanged) return;
    helper!.batch((style) => {
      for (const key of changed) style[key] = resolved[key];
      if (gridChanged) {
        // One complete declaration avoids retained native shorthand fields.
        style.gridArea = grid.join(' / ');
      }
    });
    for (const key of Object.keys(resolved)) previous.set(key, JSON.stringify(resolved[key]));
    previous.set('grid', JSON.stringify(grid));
    parent.requestLayout();
  };
  const listen = () => {
    if (listening) return;
    listening = true;
    for (const key of properties) view.style.on(`${key}Change`, sync);
    // CssProperty does not restore its CSS value on local unset, and an
    // equal-default unset emits no change event. Delegate every conversion to
    // core, then let its cascade resolve resets, including these silent ones.
    for (const key of new Set(properties.flatMap((name) => [name, name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)]))) {
      const own = Object.getOwnPropertyDescriptor(view.style, key);
      if (own?.configurable === false) continue;
      let prototype: object = view.style;
      let descriptor = own;
      while (!descriptor && (prototype = Object.getPrototypeOf(prototype))) descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (!descriptor?.set) continue;
      const original = descriptor;
      const set = function (value: unknown) {
        writing++;
        try {
          original.set.call(this, value);
        } finally {
          writing--;
        }
        if (!writing && (isResetValue(value) || value === '')) {
          writing++;
          try {
            view._onCssStateChange();
          } finally {
            writing--;
          }
        }
        sync();
      };
      Object.defineProperty(view.style, key, { configurable: true, enumerable: descriptor.enumerable, get: descriptor.get, set });
      restorers.push(() => {
        if (Object.getOwnPropertyDescriptor(view.style, key)?.set !== set) return;
        if (own) Object.defineProperty(view.style, key, own);
        else delete view.style[key];
      });
    }
  };
  const unlisten = () => {
    if (!listening) return;
    listening = false;
    for (const key of properties) view.style.off(`${key}Change`, sync);
    for (const restore of restorers.splice(0)) restore();
  };
  const loaded = () => {
    suspended = false;
    listen();
    sync();
  };
  const unloaded = () => {
    suspended = true;
    unlisten();
    helper = undefined;
    native = undefined;
    previous.clear();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    unlisten();
    view.off(View.loadedEvent, loaded);
    view.off(View.unloadedEvent, unloaded);
    view.off(View.disposeNativeViewEvent, unloaded);
    helper = undefined;
    native = undefined;
    previous.clear();
    bindings.delete(view);
  };
  bindings.set(view, { attached: loaded, dispose });
  listen();
  view.on(View.loadedEvent, loaded);
  view.on(View.unloadedEvent, unloaded);
  view.on(View.disposeNativeViewEvent, unloaded);
  sync();
  return dispose;
}
