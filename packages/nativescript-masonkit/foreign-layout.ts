import { widthProperty, heightProperty, minWidthProperty, minHeightProperty, maxWidthProperty, maxHeightProperty, marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty } from '@nativescript/core/ui/styling/style-properties';
import { alignSelfProperty, flexGrowProperty, flexShrinkProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { aspectRatioProperty, bottomProperty, flexBasisProperty, gridColumnEndProperty, gridColumnStartProperty, gridRowEndProperty, gridRowStartProperty, justifySelfProperty, leftProperty, positionProperty, rightProperty, topProperty } from './properties';
import { Style } from './style';
import { isMasonView_ } from './symbols';

// Plain core children keep core's Style; while attached, its layout setters also write the Mason leaf.

interface LayoutProperty {
  name: string;
  cssName?: string;
  cssLocalName?: string;
  keyframe?: string;
  sourceKey?: symbol;
  source?: symbol;
  defaultValue?: unknown;
  isSet(style: object): boolean;
}

const foreignStyle_ = Symbol('mason:foreignStyle');
const foreignProto_ = Symbol('mason:foreignProto');
const foreignInvalidate_ = Symbol('mason:foreignInvalidate');

const PX = /^\s*(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)px\s*$/i;

// Core reads px as device pixels, Mason as CSS pixels.
function cssPx(value: any): any {
  if (typeof value === 'string') {
    const match = PX.exec(value);
    return match ? parseFloat(match[1]) : value;
  }
  return value?.unit === 'px' ? value.value : value;
}

type Write = (helper: any, style: any) => void;

function scalar(property: LayoutProperty, fallback: unknown = property.defaultValue): Write {
  const { name } = property;
  const unset = cssPx(fallback);
  return (helper, style) => {
    helper[name] = property.isSet(style) ? cssPx(style[name]) : unset;
  };
}

const skip: Write = () => {};

function selfAlign(property: LayoutProperty): Write {
  const { name } = property;
  return (helper, style) => {
    const value = style[name];
    helper[name] = value == null || value === 'auto' ? 'normal' : value;
  };
}

const gridEdges = [gridRowStartProperty, gridColumnStartProperty, gridRowEndProperty, gridColumnEndProperty] as unknown as LayoutProperty[];

const writeGrid: Write = (helper, style) => {
  helper.gridArea = `${style.gridRowStart ?? 'auto'} / ${style.gridColumnStart ?? 'auto'} / ${style.gridRowEnd ?? 'auto'} / ${style.gridColumnEnd ?? 'auto'}`;
};

const entries: Array<[LayoutProperty, Write]> = [];
function add(properties: unknown[], write: (property: LayoutProperty) => Write): void {
  for (const property of properties as LayoutProperty[]) entries.push([property, write(property)]);
}

// Windows panels read these from the XAML element.
add([widthProperty, heightProperty, maxWidthProperty, maxHeightProperty, marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty], (p) => (__WINDOWS__ ? skip : scalar(p)));
// Core's 0 default would disable Mason's automatic minimum size.
add([minWidthProperty, minHeightProperty], (p) => (__WINDOWS__ ? skip : scalar(p, 'auto')));
add([flexGrowProperty, flexShrinkProperty, flexBasisProperty, aspectRatioProperty, positionProperty, leftProperty, rightProperty, topProperty, bottomProperty], scalar);
add([alignSelfProperty, justifySelfProperty], selfAlign);
add(gridEdges, () => writeGrid);

const foreignProtos = new WeakMap<object, object>();
// A leaf outlives a detach.
const written = new WeakSet<object>();

function foreignProto(proto: object): object {
  let shadow = foreignProtos.get(proto);
  if (shadow) return shadow;
  shadow = Object.create(proto);
  for (const [property, write] of entries) {
    for (const key of new Set([property.name, property.cssName, property.cssLocalName, property.keyframe])) {
      if (!key) continue;
      let owner = proto;
      let descriptor: PropertyDescriptor | undefined;
      while (owner && !(descriptor = Object.getOwnPropertyDescriptor(owner, key))) owner = Object.getPrototypeOf(owner);
      const set = descriptor?.set;
      if (!set) continue;
      Object.defineProperty(shadow, key, {
        configurable: true,
        enumerable: descriptor.enumerable,
        get: descriptor.get,
        set(this: any, value: unknown) {
          set.call(this, cssPx(value));
          const helper = this.viewRef?.get()?.[foreignStyle_];
          if (helper) write(helper, this);
        },
      });
    }
  }
  Object.defineProperty(shadow, foreignProto_, { value: true });
  foreignProtos.set(proto, shadow);
  return shadow;
}

/** Call after the native insert. */
export function adoptForeignLayout(view: any): void {
  const style = view?.style;
  const native = view?.nativeViewProtected;
  if (!style || !native || view[isMasonView_]) return;
  const helper = Style.fromView(view, native);
  view[foreignStyle_] = helper;
  if (!style[foreignProto_]) Object.setPrototypeOf(style, foreignProto(Object.getPrototypeOf(style)));
  for (const [property] of entries) {
    const value = style[property.name];
    const source = property.sourceKey ?? property.source;
    if (value?.unit !== 'px' || !source) continue;
    const key = sourceChannel(property, style[source]);
    if (key) style[key] = value.value;
  }
  const all = written.has(native);
  written.add(native);
  let grid = false;
  for (const [property, write] of entries) {
    if (!all && !property.isSet(style)) continue;
    if (write === writeGrid) grid = true;
    else write(helper, style);
  }
  if (grid) writeGrid(helper, style);
}

const enum ValueSource {
  Css = 2,
  Local = 3,
  Keyframe = 4,
}

function sourceChannel(property: LayoutProperty, source: ValueSource): string | undefined {
  switch (source) {
    case ValueSource.Css:
      return property.cssName;
    case ValueSource.Local:
      return property.name;
    case ValueSource.Keyframe:
      return property.keyframe;
  }
  return undefined;
}

export function invalidateOnLayoutRequest(view: any, mason: any): void {
  const hook = view[foreignInvalidate_];
  if (hook) {
    hook.mason = mason;
    return;
  }
  const original = view.requestLayout;
  if (typeof original !== 'function') return;
  const state = {
    mason,
    own: Object.getOwnPropertyDescriptor(view, 'requestLayout'),
    requestLayout(this: any) {
      const native = this.nativeViewProtected;
      if (native) state.mason.invalidateForeignView(native);
      return original.call(this);
    },
  };
  view.requestLayout = state.requestLayout;
  view[foreignInvalidate_] = state;
}

export function releaseForeignLayout(view: any): void {
  const hook = view?.[foreignInvalidate_];
  if (hook) {
    view[foreignInvalidate_] = undefined;
    if (hook.own) Object.defineProperty(view, 'requestLayout', hook.own);
    else delete view.requestLayout;
  }
  if (!view?.[foreignStyle_]) return;
  view[foreignStyle_] = undefined;
  const style = view.style;
  if (style?.[foreignProto_]) Object.setPrototypeOf(style, Object.getPrototypeOf(Object.getPrototypeOf(style)));
}
