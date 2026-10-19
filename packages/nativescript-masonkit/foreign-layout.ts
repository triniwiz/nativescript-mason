import { Utils, View } from '@nativescript/core';
import { Style } from './style';
import { isMasonView_ } from './symbols';
import { gridAreaProperty, gridRowProperty, gridColumnProperty, gridRowStartProperty, gridRowEndProperty, gridColumnStartProperty, gridColumnEndProperty } from './properties';

// Read core's effective longhands, after its CSS/local-value priority and unit
// parsing. A foreign widget must keep its normal NativeScript Style accessors.
const lengths = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'flexBasis'] as const;
const values = ['flexGrow', 'flexShrink', 'alignSelf', 'justifySelf', 'aspectRatio', 'position', 'left', 'right', 'top', 'bottom'] as const;
const placementProperties = [gridAreaProperty, gridRowProperty, gridColumnProperty, gridRowStartProperty, gridRowEndProperty, gridColumnStartProperty, gridColumnEndProperty];
const placements = placementProperties.map((property) => property.name);
const properties = [...lengths, ...values, ...placements];

function length(value: any): any {
  // Core px objects contain physical pixels. Mason's number/dip/px setters
  // all scale by the display density, while percentage objects hold fractions.
  return value?.unit === 'px' ? { value: Utils.layout.toDeviceIndependentPixels(value.value), unit: 'dip' } : value;
}

// Send one complete grid-area declaration. Native grid setters retain staged
// shorthand fields and apply grid-area last, so replaying reset shorthands and
// longhands together can otherwise erase an active row/column placement.
function gridArea(entries: ReadonlyArray<readonly [string, any]>): string {
  const authored = Object.fromEntries(entries);
  const area = String(authored.gridArea || '').trim();
  let [rowStart = 'auto', columnStart = 'auto', rowEnd = 'auto', columnEnd = 'auto'] = area ? area.split('/').map((part) => part.trim()) : [];
  // Mason treats a single grid-area token as a named area on all four edges.
  if (area && !area.includes('/')) rowStart = columnStart = rowEnd = columnEnd = area;
  if (authored.gridRow)
    [rowStart, rowEnd = 'auto'] = String(authored.gridRow)
      .split('/')
      .map((part) => part.trim());
  if (authored.gridColumn)
    [columnStart, columnEnd = 'auto'] = String(authored.gridColumn)
      .split('/')
      .map((part) => part.trim());
  return [authored.gridRowStart ?? rowStart, authored.gridColumnStart ?? columnStart, authored.gridRowEnd ?? rowEnd, authored.gridColumnEnd ?? columnEnd].join(' / ');
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
  const sync = () => {
    if (disposed || suspended || !view.nativeViewProtected) return;
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
    const grid = placementProperties.filter((property) => property.isSet(view.style)).map((property) => [property.name, view.style[property.name]] as const);
    const gridChanged = previous.get('grid') !== JSON.stringify(grid);
    if (!changed.length && !gridChanged) return;
    helper!.batch((style) => {
      for (const key of changed) style[key] = resolved[key];
      if (gridChanged) {
        style.gridArea = gridArea(grid);
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
  };
  const unlisten = () => {
    if (!listening) return;
    listening = false;
    for (const key of properties) view.style.off(`${key}Change`, sync);
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
