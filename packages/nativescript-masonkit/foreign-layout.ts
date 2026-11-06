import { widthProperty, heightProperty, minWidthProperty, minHeightProperty, maxWidthProperty, maxHeightProperty, marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty } from '@nativescript/core/ui/styling/style-properties';
import { alignSelfProperty, flexGrowProperty, flexShrinkProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { aspectRatioProperty, bottomProperty, flexBasisProperty, gridColumnEndProperty, gridColumnStartProperty, gridRowEndProperty, gridRowStartProperty, justifySelfProperty, leftProperty, positionProperty, rightProperty, topProperty } from './properties';
import { Style } from './style';
import { isMasonView_ } from './symbols';

// A plain NativeScript child of a Mason container keeps core's Style and cascade.
// While attached, its Style sits on a shared prototype whose layout setters call
// core's, then copy the effective value into the child's Mason leaf.

interface LayoutProperty {
  name: string;
  cssName?: string;
  cssLocalName?: string;
  keyframe?: string;
  /** The value source key of a CssProperty. */
  sourceKey?: symbol;
  /** The value source key of a CssAnimationProperty. */
  source?: symbol;
  defaultValue?: unknown;
  isSet(style: object): boolean;
}

const foreignStyle_ = Symbol('mason:foreignStyle');
const foreignProto_ = Symbol('mason:foreignProto');
const foreignInvalidate_ = Symbol('mason:foreignInvalidate');

const PX = /^\s*(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)px\s*$/i;

/** `value` with px read as CSS pixels, as a dip number; core would read them as device pixels. */
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

// One complete area, so a single edge never inherits stale native shorthand state.
const writeGrid: Write = (helper, style) => {
  helper.gridArea = `${style.gridRowStart ?? 'auto'} / ${style.gridColumnStart ?? 'auto'} / ${style.gridRowEnd ?? 'auto'} / ${style.gridColumnEnd ?? 'auto'}`;
};

// Windows panels copy these from the XAML element on every measure.
const entries: Array<[LayoutProperty, Write]> = [];
function add(properties: unknown[], write: (property: LayoutProperty) => Write): void {
  for (const property of properties as LayoutProperty[]) entries.push([property, write(property)]);
}

// Windows panels copy these from the XAML element, so there they only convert px.
add([widthProperty, heightProperty, maxWidthProperty, maxHeightProperty, marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty], (p) => (__WINDOWS__ ? skip : scalar(p)));
// Core's 0 default would disable Mason's automatic minimum size.
add([minWidthProperty, minHeightProperty], (p) => (__WINDOWS__ ? skip : scalar(p, 'auto')));
add([flexGrowProperty, flexShrinkProperty, flexBasisProperty, aspectRatioProperty, positionProperty, leftProperty, rightProperty, topProperty, bottomProperty], scalar);
add([alignSelfProperty, justifySelfProperty], selfAlign);
add(gridEdges, () => writeGrid);

const foreignProtos = new WeakMap<object, object>();
// Native views whose leaf this bridge has written; a leaf outlives a detach.
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

/** Start mirroring a plain child's layout styles into its Mason leaf. Call after the native insert. */
export function adoptForeignLayout(view: any): void {
  const style = view?.style;
  const native = view?.nativeViewProtected;
  if (!style || !native || view[isMasonView_]) return;
  const helper = Style.fromView(view, native);
  view[foreignStyle_] = helper;
  if (!style[foreignProto_]) Object.setPrototypeOf(style, foreignProto(Object.getPrototypeOf(style)));
  // Convert px set before adoption through its own source, so precedence is kept.
  for (const [property] of entries) {
    const value = style[property.name];
    const source = property.sourceKey ?? property.source;
    if (value?.unit !== 'px' || !source) continue;
    const key = sourceChannel(property, style[source]);
    if (key) style[key] = value.value;
  }
  // A fresh leaf already holds Mason's defaults, so it only needs the values core has set.
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

/** The style key that sets a value with core's ValueSource `source`. */
function sourceChannel(property: LayoutProperty, source: number): string | undefined {
  switch (source) {
    case 2:
      return property.cssName;
    case 3:
      return property.name;
    case 4:
      return property.keyframe;
  }
  return undefined;
}

/** iOS: a content change core reports through requestLayout drops the child's cached Mason measurement. */
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

/** Stop mirroring and give the child its own Style prototype and requestLayout back. */
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
