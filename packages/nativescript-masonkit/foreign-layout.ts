import { layout } from '@nativescript/core/utils';
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
  defaultValue?: unknown;
  isSet(style: object): boolean;
}

const foreignStyle_ = Symbol('mason:foreignStyle');
const foreignProto_ = Symbol('mason:foreignProto');

// Core px objects are device pixels; Mason reads px as CSS pixels, and numbers as dip.
function toMason(value: any): any {
  return value?.unit === 'px' ? layout.toDeviceIndependentPixels(value.value) : value;
}

type Write = (helper: any, style: any) => void;

function scalar(property: LayoutProperty, fallback: unknown = property.defaultValue): Write {
  const { name } = property;
  const unset = toMason(fallback);
  return (helper, style) => {
    helper[name] = property.isSet(style) ? toMason(style[name]) : unset;
  };
}

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

const entries: Array<[LayoutProperty, Write]> = [
  ...([widthProperty, heightProperty, maxWidthProperty, maxHeightProperty, marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty, flexGrowProperty, flexShrinkProperty, flexBasisProperty, aspectRatioProperty, positionProperty, leftProperty, rightProperty, topProperty, bottomProperty] as unknown as LayoutProperty[]).map((p): [LayoutProperty, Write] => [p, scalar(p)]),
  // Core's 0 default would disable Mason's automatic minimum size.
  ...([minWidthProperty, minHeightProperty] as unknown as LayoutProperty[]).map((p): [LayoutProperty, Write] => [p, scalar(p, 'auto')]),
  ...([alignSelfProperty, justifySelfProperty] as unknown as LayoutProperty[]).map((p): [LayoutProperty, Write] => [p, selfAlign(p)]),
  ...gridEdges.map((p): [LayoutProperty, Write] => [p, writeGrid]),
];

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
          set.call(this, value);
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

/** Stop mirroring and give the child its own Style prototype back. */
export function releaseForeignLayout(view: any): void {
  if (!view?.[foreignStyle_]) return;
  view[foreignStyle_] = undefined;
  const style = view.style;
  if (style?.[foreignProto_]) Object.setPrototypeOf(style, Object.getPrototypeOf(Object.getPrototypeOf(style)));
}
