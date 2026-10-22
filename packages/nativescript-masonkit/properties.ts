import {
  CssProperty,
  CssAnimationProperty,
  InheritedCssProperty,
  backgroundColorProperty,
  Style,
  ViewBase as NSViewBase,
  ShorthandProperty,
  Length as CoreLength,
  fontSizeProperty,
  textAlignmentProperty,
  textDecorationProperty,
  textTransformProperty,
  PercentLength as CorePercentLength,
  Trace,
  CoreTypes,
  unsetValue,
  verticalAlignmentProperty,
  textShadowProperty,
  Font,
  Property,
  makeParser,
  makeValidator,
  marginTopProperty,
  marginRightProperty,
  marginBottomProperty,
  marginLeftProperty,
  paddingTopProperty,
  paddingRightProperty,
  paddingBottomProperty,
  paddingLeftProperty,
  borderTopWidthProperty,
  borderRightWidthProperty,
  borderBottomWidthProperty,
  borderLeftWidthProperty,
  minWidthProperty,
  minHeightProperty,
  widthProperty,
  heightProperty,
  lineHeightProperty,
  letterSpacingProperty,
} from '@nativescript/core';
import { Display, Overflow, Length, Gap, LengthAuto, Position, BoxSizing, GridAutoFlow, JustifyItems, JustifySelf, AlignContent, VerticalAlign, Float, Clear } from '.';
import type { TextBase, ViewBase } from './common';
import { isMasonView_, remapLogicalBoxes_, touchAction_ } from './symbols';

/** Marks a Style whose size accessors already resolve Mason's units. */
const MASON_SIZE_UNITS = Symbol('mason:size-units');
import type { LogicalGroupName, Style as MasonStyle } from './style';
import { beginStyleWrite, cssLengthToDip, endStyleWrite, isSizingKeyword, parseAspectRatio } from './style';
import { isCssMathFunction } from './css-math';
import { alignItemsProperty, alignSelfProperty, flexDirectionProperty, flexGrowProperty, flexShrinkProperty, flexWrapProperty, justifyContentProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { parseCSSShadow } from '@nativescript/core/ui/styling/css-shadow';
import { installKeyframes, interpolatePositionList, interpolateSizeList, registerKeyframeProperty } from './css-keyframes';
import { borderTopLeftRadiusProperty, borderTopRightRadiusProperty, borderBottomRightRadiusProperty, borderBottomLeftRadiusProperty, borderTopColorProperty, borderRightColorProperty, borderBottomColorProperty, borderLeftColorProperty } from '@nativescript/core/ui/styling/style-properties';
import { BORDER_WIDTH_KEYWORDS, splitBorder, splitBorderSide, splitBorderStyle, splitBorderStyleStartEnd, splitBorderWidthStartEnd, splitBorderColorStartEnd, splitInsetStartEnd, splitMarginStartEnd, splitPaddingStartEnd, splitBackground, splitMask, splitMaskBorder, splitWebkitMask, webkitMaskBox, webkitMaskComposite, splitBorderColor, splitBorderRadius, splitBorderWidth, splitFlex, splitFlexFlow, splitGap, splitMargin, splitOverflow, splitPadding } from './css-shorthands';
import { cssLength, isCssLength, toCamelCase } from './css-shorthands';
import type { CssLength, LonghandValue } from './css-shorthands';
import { splitListStyle, splitPlace } from './css-shorthands';

function getViewStyle(view: WeakRef<NSViewBase> | WeakRef<TextBase>): MasonStyle | undefined {
  const ret: (NSViewBase & { _styleHelper: MasonStyle }) | undefined = (__ANDROID__ ? view?.get() : view?.deref()) as never;
  // Undefined for a plain NativeScript view (and for a cleared ref): only mason's
  // own view classes define `_styleHelper`.
  return ret?._styleHelper as MasonStyle | undefined;
}

/** Mason views write these in setNative, which core runs after valueChanged; one write is enough. */
function appliedInSetNative(target: Style, property: { setNative: symbol }): boolean {
  const ref = target?.viewRef;
  const view = ref ? (__ANDROID__ ? ref.get() : ref.deref()) : undefined;
  return !!(view && view[isMasonView_] && view[property.setNative]);
}

// Mason parses CSS values itself, so for its own elements the raw declaration is
// passed straight through; anything else has to go through core's parser first.
//
// This asks specifically whether the view *is* a mason element, not whether it
// sits inside one. A plain NativeScript view parented into a mason tree has no
// mason style buffer — its value still has to be converted for core, or core's
// own setNative gets a string it can't use. See "Mixing with plain NativeScript
// views" in MASON_CONTEXT.md.
//
// `isMasonView_` is a plain marker set in the mason view constructors. Don't
// reach for `_styleHelper` here: its getter lazily builds the native view, and a
// valueConverter can run long before that should happen.
function isMasonView(style: Style): boolean {
  if (style && style.viewRef) {
    const view = __ANDROID__ ? style.viewRef.get() : style.viewRef.deref();
    return !!(view && view[isMasonView_]);
  }
  return false;
}

// From core 9.1 a stylesheet shorthand is split into its longhands while the
// stylesheet is parsed, with the converter of the last ShorthandProperty built
// for that CSS name, and a longhand that arrives parsed skips every converter.

type ShorthandLonghand = CssProperty<Style, any> | CssAnimationProperty<Style, any>;

export interface MasonShorthand {
  cssName: string;
  longhands: ShorthandLonghand[];
  split(value: string): LonghandValue[];
}

const CSS_WIDE_KEYWORDS = new Set(['initial', 'inherit', 'unset', 'revert']);

export function shorthandConverter({ longhands, split }: MasonShorthand) {
  return (value: unknown): [ShorthandLonghand, unknown][] => {
    const text = typeof value === 'number' ? String(value) : value;
    if (typeof text !== 'string') {
      // Core 9.1 probes with unsetValue to learn the longhands, which a var()
      // declaration needs all of.
      return longhands.map((property) => [property, value]);
    }
    const trimmed = text.trim();
    if (!trimmed || CSS_WIDE_KEYWORDS.has(trimmed)) {
      return longhands.map((property) => [property, trimmed]);
    }
    const parts = split(trimmed);
    return longhands.map((property, i) => [property, parts[i]]);
  };
}

function masonShorthandProperty(entry: MasonShorthand, getter: (this: Style) => unknown = () => undefined) {
  return new ShorthandProperty<Style, any>({
    name: toCamelCase(entry.cssName),
    cssName: entry.cssName,
    getter,
    converter: shorthandConverter(entry),
  });
}

export const textProperty = new Property<ViewBase, string>({
  name: 'text',
});

export const displayProperty = new CssProperty<Style, Display>({
  name: 'display',
  cssName: 'display',
  defaultValue: 'block',
  valueChanged: (target, oldValue, newValue) => {
    if (appliedInSetNative(target, displayProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view && newValue) {
      view.display = newValue;
    }
  },
  valueConverter: function (value) {
    if (typeof value === 'number') {
      switch (value) {
        case 0:
          return 'none';
        case 1:
          return 'flex';
        case 2:
          return 'grid';
        case 3:
          return 'block';
        case 4:
          return 'inline';
        case 5:
          return 'inline-block';
        case 6:
          return 'inline-flex';
        case 7:
          return 'inline-grid';
      }
    }

    switch (value) {
      case 'none':
      case 'flex':
      case 'grid':
      case 'block':
      case 'inline':
      case 'inline-block':
      case 'inline-flex':
      case 'inline-grid':
        return value;
      // The legacy boxes `line-clamp` utilities ask for.
      case '-webkit-box':
        return 'block';
      case '-webkit-inline-box':
        return 'inline-block';
      default:
        return undefined;
    }
  },
});

export const filterProperty = new CssProperty<Style, string>({
  name: 'filter',
  cssName: 'filter',
});

export const borderColorProperty = new CssProperty<Style, string>({
  name: 'borderColor',
  cssName: 'border-color',
});

export const backgroundProperty = new CssProperty<Style, string>({
  name: 'background',
  cssName: 'background',
});

export const backgroundImageProperty = new CssProperty<Style, string>({
  name: 'backgroundImage',
  cssName: 'background-image',
});

export const backgroundRepeatProperty = new CssProperty<Style, string>({
  name: 'backgroundRepeat',
  cssName: 'background-repeat',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundRepeat = newValue as never;
    }
  },
});

export const backgroundPositionProperty = new CssProperty<Style, string>({
  name: 'backgroundPosition',
  cssName: 'background-position',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundPosition = newValue as never;
    }
  },
});

export const backgroundSizeProperty = new CssProperty<Style, string>({
  name: 'backgroundSize',
  cssName: 'background-size',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundSize = newValue as never;
    }
  },
});

export const backgroundClipProperty = new CssProperty<Style, string>({
  name: 'backgroundClip',
  cssName: 'background-clip',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundClip = newValue as never;
    }
  },
});

function overflowConverter(value) {
  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return 'visible';
      case 1:
        return 'clip';
      case 2:
        return 'hidden';
      case 3:
        return 'scroll';
    }
  }

  switch (value) {
    case 'visible':
    case 'hidden':
    case 'clip':
    case 'scroll':
    case 'auto':
      return value;
    default:
      return undefined;
  }
}

export const overflowXProperty = new CssProperty<Style, Overflow>({
  name: 'overflowX',
  cssName: 'overflow-x',
  defaultValue: 'visible',
  valueConverter: overflowConverter,
  valueChanged: (target, oldValue, newValue) => {
    if (newValue && appliedInSetNative(target, overflowXProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.overflowX = newValue;
      } else {
        // Revert to old value if newValue is invalid
        target.overflowX = oldValue;
      }
    }
  },
});

export const overflowYProperty = new CssProperty<Style, Overflow>({
  name: 'overflowY',
  cssName: 'overflow-y',
  defaultValue: 'visible',
  valueConverter: overflowConverter,
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, overflowYProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.overflowY = newValue;
      } else {
        // Revert to old value if newValue is invalid
        target.overflowY = oldValue;
      }
    }
  },
});

const overflowShorthand: MasonShorthand = { cssName: 'overflow', longhands: [overflowXProperty, overflowYProperty], split: splitOverflow };

export const overflowProperty = masonShorthandProperty(overflowShorthand, function (this: Style) {
  if (this.overflowX === this.overflowY) {
    return this.overflowX;
  }
  return `${this.overflowX} ${this.overflowY}`;
});

export const paddingProperty = new CssProperty<Style, string>({
  name: 'padding',
  cssName: 'padding',
});

// These four style-buffer fields were consumed by the natives all along but had
// no JS or CSS path to them: reserved StyleKeys nobody ever wrote. Same shape of
// gap as `list-style-type`. (`text-indent` and `font-variant-numeric` are
// deliberately left out — their offsets exist but nothing reads them yet, so
// exposing them would write bytes into the void.)
export const whiteSpaceProperty = new CssProperty<Style, string>({
  name: 'whiteSpace',
  cssName: 'white-space',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('whiteSpace');
      else view.whiteSpace = newValue as never;
    }
  },
});

/**
 * CSS `touch-action` as the pan flags native scroll views read: 1 = pan-x,
 * 2 = pan-y, 4 = pinch-zoom. A Mason scroll view only starts a drag along an
 * axis every element from the touched one up to it allows, as browsers do.
 */
export function parseTouchAction(value: string): number {
  const v = String(value ?? 'auto')
    .trim()
    .toLowerCase();
  if (v === 'auto' || v === '') return 7;
  if (v === 'none') return 0;
  if (v === 'manipulation') return 7;
  let flags = 0;
  for (const part of v.split(/\s+/)) {
    if (part === 'pan-x' || part === 'pan-left' || part === 'pan-right') flags |= 1;
    else if (part === 'pan-y' || part === 'pan-up' || part === 'pan-down') flags |= 2;
    else if (part === 'pinch-zoom') flags |= 4;
  }
  return flags;
}

export const touchActionProperty = new CssProperty<Style, string>({
  name: 'touchAction',
  cssName: 'touch-action',
  defaultValue: 'auto',
  valueChanged(target, oldValue, newValue) {
    const ref = target?.viewRef;
    const view = ref ? (__ANDROID__ ? ref.get() : ref.deref()) : undefined;
    if (view && view[isMasonView_]) {
      view[touchAction_] = parseTouchAction(newValue);
      (view as ViewBase)._applyTouchAction?.();
    }
  },
});

export const objectFitProperty = new CssProperty<Style, string>({
  name: 'objectFit',
  cssName: 'object-fit',
  defaultValue: 'fill',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.objectFit = newValue as never;
    }
  },
});

export const textJustifyProperty = new CssProperty<Style, string>({
  name: 'textJustify',
  cssName: 'text-justify',
  defaultValue: 'auto',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.textJustify = newValue as never;
    }
  },
});

export const backgroundPositionXProperty = new CssProperty<Style, string>({
  name: 'backgroundPositionX',
  cssName: 'background-position-x',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundPositionX = newValue as never;
    }
  },
});

export const backgroundPositionYProperty = new CssProperty<Style, string>({
  name: 'backgroundPositionY',
  cssName: 'background-position-y',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundPositionY = newValue as never;
    }
  },
});

export const backgroundOriginProperty = new CssProperty<Style, string>({
  name: 'backgroundOrigin',
  cssName: 'background-origin',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundOrigin = newValue as never;
    }
  },
});

export const backgroundAttachmentProperty = new CssProperty<Style, string>({
  name: 'backgroundAttachment',
  cssName: 'background-attachment',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundAttachment = newValue as never;
    }
  },
});

export const backgroundBlendModeProperty = new CssProperty<Style, string>({
  name: 'backgroundBlendMode',
  cssName: 'background-blend-mode',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundBlendMode = newValue as never;
    }
  },
});

export const textDecorationLineProperty = new CssProperty<Style, string>({
  name: 'textDecorationLine',
  cssName: 'text-decoration-line',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.textDecorationLine = newValue as never;
    }
  },
});

export const textDecorationStyleProperty = new CssProperty<Style, string>({
  name: 'textDecorationStyle',
  cssName: 'text-decoration-style',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.textDecorationStyle = newValue as never;
    }
  },
});

export const textDecorationColorProperty = new CssProperty<Style, string>({
  name: 'textDecorationColor',
  cssName: 'text-decoration-color',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.textDecorationColor = newValue as never;
    }
  },
});

export const textDecorationThicknessProperty = new CssProperty<Style, string>({
  name: 'textDecorationThickness',
  cssName: 'text-decoration-thickness',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.textDecorationThickness = newValue as never;
    }
  },
});

// `font-family` had no path at all: FONT_FAMILY_STATE exists with no value slot
// (the natives keep the family on a FontFace, not in the buffer), and core's
// fontInternalProperty.setNative hook in common.ts is Windows-only. So on both
// mobile platforms this was unsettable from CSS *and* from TS.
export const fontFamilyProperty = new CssProperty<Style, string>({
  name: 'fontFamily',
  cssName: 'font-family',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.fontFamily = newValue as never;
    }
  },
});

// ---------------------------------------------------------------------------
// Registering alongside @nativescript/core
// ---------------------------------------------------------------------------
//
// `CssProperty.register()` installs its accessors with Object.defineProperty, so
// for a CSS name core already owns the last registration wins outright — and
// masonkit registers after core. That silently shadowed core's handling of
// `margin`, `padding`, `background`, `background-*`, `border-color`,
// `border-radius`, `box-shadow`, `transform`, `vertical-align`, `text-overflow`,
// `align-content`, `flex` and `flex-flow` for **every view in the app**, mason's
// or not: a plain StackLayout with `margin: 10` in a stylesheet got nothing,
// because mason's property only implements setNative on mason's own ViewBase.
//
// So instead of replacing core's accessor, keep both and pick at assignment
// time: a mason view gets mason's, anything else keeps core's untouched.
// Foreign-only grid shorthands invert the selection to preserve existing Mason
// direct setters while foreign views use core's longhand priority machinery.
function registerAlongsideCore(property: { name: string; cssName?: string; cssLocalName?: string; register(cls: unknown): void }, target: 'mason' | 'foreign' = 'mason'): void {
  const proto = (Style as unknown as { prototype: object }).prototype;
  const keys = [property.name, property.cssName, property.cssLocalName].filter((key): key is string => typeof key === 'string' && key.length > 0);

  const core = new Map<string, PropertyDescriptor>();
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (descriptor) core.set(key, descriptor);
  }

  property.register(Style);

  for (const [key, coreDescriptor] of core) {
    const masonDescriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (!masonDescriptor) continue;

    Object.defineProperty(proto, key, {
      enumerable: masonDescriptor.enumerable ?? true,
      configurable: true,
      get(this: Style) {
        const descriptor = isMasonView(this) === (target === 'mason') ? masonDescriptor : coreDescriptor;
        return descriptor.get?.call(this);
      },
      set(this: Style, value: unknown) {
        const descriptor = isMasonView(this) === (target === 'mason') ? masonDescriptor : coreDescriptor;
        descriptor.set?.call(this, value);
      },
    });
  }
}

registerAlongsideCore(paddingProperty);

export const marginProperty = new CssProperty<Style, string>({
  name: 'margin',
  cssName: 'margin',
});

export const scrollBarWidthProperty = new CssProperty<Style, number>({
  name: 'scrollBarWidth',
  cssName: 'scrollbar-width',
  defaultValue: 0,
  valueConverter: parseFloat,
});

// Core keeps these parsers private, so the fallbacks below have to restate them.
// The value lists mirror @nativescript/core exactly — flexbox-layout-common's
// FlexWrap and text-base-common's textAlignment/textTransform converters.
const FlexWrapParse = makeParser<string>(makeValidator('nowrap', 'wrap', 'wrap-reverse'));
const FlexDirectionParse = makeParser<string>(makeValidator('row', 'row-reverse', 'column', 'column-reverse'));
const TextAlignmentParse = makeParser<string>(makeValidator('left', 'center', 'right', 'justify'));
const TextTransformParse = makeParser<string>(makeValidator('none', 'capitalize', 'uppercase', 'lowercase'));

/**
 * Narrow one of @nativescript/core's own properties so mason views get mason's
 * handling and every other view keeps core's, untouched. `overrideHandlers`
 * replaces core's handlers outright, so the fallback to core's own handling
 * has to be named explicitly.
 */
function overrideForMasonViews<TValue>(
  property: { overrideHandlers(options: any): void },
  options: {
    /** Core's own converter, used for non-mason views. Omit to leave it alone. */
    coreConverter?: (value: string) => TValue;
    /** Forward the value into the mason style buffer. */
    apply: (masonStyle: MasonStyle, value: TValue) => void;
  },
): void {
  const handlers: Record<string, unknown> = {
    valueChanged(target: Style, _oldValue: TValue, newValue: TValue) {
      if (appliedInSetNative(target, property as never)) return;
      const masonStyle = getViewStyle(target.viewRef);
      // No mason style means a plain NativeScript view: core's setNative owns
      // it, so leave the value exactly as core produced it.
      if (!masonStyle) {
        return;
      }
      options.apply(masonStyle, newValue);
    },
  };

  if (options.coreConverter) {
    handlers.valueConverter = function (this: Style, value: string) {
      // Mason parses CSS itself, so its own elements get the raw declaration.
      return isMasonView(this) ? value : options.coreConverter(value);
    };
  }

  property.overrideHandlers(handlers);
}

const rawDeclarations = new WeakMap<object, Map<string, { converted: unknown; raw: string }>>();

/** Plain views keep core's number; a mason view also records the raw declaration so its units survive. */
function keepRawDeclarationForMasonViews(property: { name: string; overrideHandlers(options: any): void }, coreConverter: (value: string) => unknown): void {
  property.overrideHandlers({
    valueConverter(this: Style, value: string) {
      const converted = coreConverter(value);
      if (isMasonView(this)) {
        let raw = rawDeclarations.get(this);
        if (!raw) {
          raw = new Map();
          rawDeclarations.set(this, raw);
        }
        raw.set(property.name, { converted, raw: value });
      }
      return converted;
    },
  });
}

/** The declaration behind `value` if it came from this view's own CSS, else `value`. */
export function masonRawDeclaration(style: Style, propertyName: string, value: unknown): unknown {
  const raw = rawDeclarations.get(style)?.get(propertyName);
  if (!raw) {
    return value;
  }
  if (Object.is(raw.converted, value)) {
    return raw.raw;
  }
  rawDeclarations.get(style).delete(propertyName);
  return value;
}

keepRawDeclarationForMasonViews(lineHeightProperty, (v) => parseFloat(v));
keepRawDeclarationForMasonViews(letterSpacingProperty, (v) => parseFloat(v));

overrideForMasonViews<string>(flexDirectionProperty, {
  coreConverter: FlexDirectionParse,
  apply: (style, value) => {
    style.flexDirection = value as never;
  },
});

overrideForMasonViews<string>(flexWrapProperty, {
  coreConverter: FlexWrapParse,
  apply: (style, value) => {
    style.flexWrap = value as never;
  },
});

flexGrowProperty.overrideHandlers({
  name: 'flexGrow',
  cssName: 'flex-grow',
  valueChanged(target, oldValue, newValue) {
    if (typeof newValue === 'number' && !isNaN(newValue) && appliedInSetNative(target, flexGrowProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      // 0 is a valid flex-grow; don't treat it as falsy/invalid
      if (typeof newValue === 'number' && !isNaN(newValue)) {
        view.flexGrow = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.flexGrow = oldValue as never;
      }
    }
  },
});

fontSizeProperty.overrideHandlers({
  name: 'fontSize',
  cssName: 'font-size',
  valueConverter: function (value) {
    if (isMasonView(this)) {
      return value as never;
    }
    return parseFloat(value as never);
  },
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, fontSizeProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        if (typeof newValue === 'string') {
          // @ts-ignore
          if (isCssMathFunction(newValue)) {
            // Mason's setter evaluates calc()/min()/max()/clamp() itself.
            view.fontSize = newValue as never;
            // @ts-ignore
          } else if (newValue.indexOf('%') !== -1) {
            view.fontSize = {
              value: parseFloat(newValue as never) / 100,
              unit: '%',
            };
            // @ts-ignore
          } else if (newValue.indexOf('dip') !== -1) {
            view.fontSize = parseFloat(newValue as never);
            // @ts-ignore
          } else if (newValue.indexOf('px') !== -1) {
            view.fontSize = {
              value: parseFloat(newValue as never),
              unit: 'px',
            };
          } else {
            view.fontSize = parseFloat(newValue as never);
          }
        } else {
          view.fontSize = newValue as never;
        }
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.fontSize = oldValue as never;
      }
    } else {
      // fallback to core behavior

      const currentFont = target.fontInternal || Font.default;
      if (currentFont.fontSize !== newValue) {
        const newFont = currentFont.withFontSize(newValue);
        target.fontInternal = Font.equals(Font.default, newFont) ? unsetValue : newFont;
      }
    }
  },
});

export const rowGapProperty = new CssProperty<Style, Length>({
  name: 'rowGap',
  cssName: 'row-gap',
  defaultValue: 0,
  // @ts-ignore
  valueConverter: masonGapConverter,
  // @ts-ignore
  equalityComparer: masonLengthEquals,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, rowGapProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.rowGap = newValue;
    }
  },
});

export const columnGapProperty = new CssProperty<Style, Length>({
  name: 'columnGap',
  cssName: 'column-gap',
  defaultValue: 0,
  // @ts-ignore
  valueConverter: masonGapConverter,
  // @ts-ignore
  equalityComparer: masonLengthEquals,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, columnGapProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.columnGap = newValue;
    }
  },
});

/** A gap longhand as CSS text: CSS text as is, a number in px, a core length as `<n><unit>`. */
function gapText(value: unknown): string {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (value && typeof value === 'object') {
    const { value: amount, unit } = value as { value?: number; unit?: string };
    return unit === '%' ? `${Math.round((amount ?? 0) * 1e6) / 1e4}%` : `${amount ?? 0}${unit === 'dip' ? 'px' : (unit ?? 'px')}`;
  }
  return String(value ?? '');
}

function gapGetter(this: Style) {
  if (this.rowGap === this.columnGap) {
    return this.rowGap;
  }
  const row = gapText(this.rowGap);
  const column = gapText(this.columnGap);
  // Two equal parses are different objects.
  return row === column ? row : `${row} ${column}`;
}

const gapShorthand: MasonShorthand = { cssName: 'gap', longhands: [rowGapProperty, columnGapProperty], split: splitGap };
const gridGapShorthand: MasonShorthand = { ...gapShorthand, cssName: 'grid-gap' };

export const gridGapProperty = masonShorthandProperty(gridGapShorthand, gapGetter);

export const gapProperty = masonShorthandProperty(gapShorthand, gapGetter);

export const gridRowGapProperty = new ShorthandProperty<Style, Gap>({
  name: 'gridRowGap',
  cssName: 'grid-row-gap',
  getter: function () {
    return this.rowGap;
  },
  converter(value) {
    return [[rowGapProperty, value]];
  },
});

export const gridColumnGapProperty = new ShorthandProperty<Style, Length>({
  name: 'gridColumnGap',
  cssName: 'grid-column-gap',
  getter: function () {
    return this.columnGap;
  },
  converter(value) {
    return [[columnGapProperty, value]];
  },
});

overrideForMasonViews<string>(textAlignmentProperty, {
  coreConverter: TextAlignmentParse,
  apply: (style, value) => {
    style.textAlignment = value as never;
  },
});

overrideForMasonViews<string>(textTransformProperty, {
  coreConverter: TextTransformParse,
  apply: (style, value) => {
    style.textTransform = value as never;
  },
});

function masonLengthParse(value) {
  try {
    return CoreLength.parse(value);
  } catch (e) {
    return undefined;
  }
}

function masonLengthPercentParse(value) {
  try {
    return CorePercentLength.parse(value);
  } catch (e) {
    return undefined;
  }
}

/** Lengths in units core's parsers read as bare numbers. */
const UNITS_CORE_MISREADS = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(r?em|pt|vw|vh|vmin|vmax|dppx)$/i;

/** CSS text for a length in a unit core can't parse (rem, em, vw), else undefined. */
function masonLengthText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const t = value.trim();
  // Core can't evaluate math functions either; Mason's setter does.
  return UNITS_CORE_MISREADS.test(t) || isCssMathFunction(t) ? t : undefined;
}

/** `left`/`top`/`right`/`bottom`: Mason's units, else core's parse (`%`, `auto`). */
function masonInsetConverter(value: unknown) {
  return (masonLengthText(value) ?? masonLengthPercentParse(value)) as never;
}

/** `row-gap`/`column-gap`: as the insets, but anything unparsable is 0. */
function masonGapConverter(value: unknown) {
  const text = masonLengthText(value);
  if (text !== undefined) {
    return text as never;
  }
  const parsed = masonLengthPercentParse(value);
  if (parsed === undefined || typeof parsed === 'string') {
    return 0 as never;
  }
  return parsed as never;
}

/** Compares CSS text as text: core's `PercentLength.equals` calls any two strings equal. */
function masonLengthEquals(a: unknown, b: unknown): boolean {
  if (typeof a === 'string' || typeof b === 'string') {
    return a === b;
  }
  return CorePercentLength.equals(a as never, b as never);
}

/** As `masonSizeConverter`, for Mason's own max-* properties (core has none). */
function masonMaxSizeConverter(value: string) {
  const resolved = masonSizeValue(value);
  return (resolved ?? masonLengthPercentParse(value)) as never;
}

export const maxWidthProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxWidth',
  cssName: 'max-width',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: CorePercentLength.equals,
  // masonLengthParse has no '%' handling; match width/height's converter.
  // @ts-ignore
  valueConverter: masonMaxSizeConverter,
  valueChanged: (target, oldValue, newValue) => {
    if (appliedInSetNative(target, maxWidthProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maxWidth = newValue;
    } else {
      Trace.write(`${newValue} not set to view's property because ".viewRef" is cleared`, Trace.categories.Style, Trace.messageType.warn);
    }
  },
});

export const maxHeightProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxHeight',
  cssName: 'max-height',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: CorePercentLength.equals,
  // @ts-ignore
  valueConverter: masonMaxSizeConverter,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, maxHeightProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maxHeight = newValue;
    }
  },
});

// Core's minWidth/minHeight already route into this Style via setNative
// (common.ts), so no new CssProperty is needed — just fix the '%' handling.
// Core's min-width/min-height converter is Length.parse, which has no '%'
// handling; mason needs percentages. Core's own valueChanged (which sets
// effectiveMinWidth) is deliberately left in place for both kinds of view, so
// only the converter is narrowed — a plain view must still get a plain Length,
// or core's Length.toDevicePixels mis-reads a percentage.
/**
 * Resolve a size value with Mason's own length parser before core sees it.
 *
 * `width`/`height`/`min-*` reach core's `PercentLength.parse` first, which
 * misreads `100vh`/`1rem` as a bare dip count and `px` as a device pixel
 * rather than Mason's CSS pixel. Resolve every unit Mason understands here
 * as the equivalent dip; percentages, `auto` and keywords fall through
 * untouched.
 */
function masonSizeValue(value: string): { value: number; unit: 'dip' } | undefined {
  const dip = cssLengthToDip(value);
  return dip === undefined ? undefined : { value: dip, unit: 'dip' };
}

function masonMinSizeConverter(this: Style, value: string) {
  if (isMasonView(this)) {
    const resolved = masonSizeValue(value);
    if (resolved) {
      return resolved as never;
    }
    return masonLengthPercentParse(value) as never;
  }
  return CoreLength.parse(value) as never;
}

minWidthProperty.overrideHandlers({
  name: 'minWidth',
  cssName: 'min-width',
  // @ts-ignore
  equalityComparer: CorePercentLength.equals,
  // @ts-ignore
  valueConverter: masonMinSizeConverter,
});

minHeightProperty.overrideHandlers({
  name: 'minHeight',
  cssName: 'min-height',
  // @ts-ignore
  equalityComparer: CorePercentLength.equals,
  // @ts-ignore
  valueConverter: masonMinSizeConverter,
});

/**
 * Rewrite a size declaration for mason views before core parses it.
 *
 * `width`/`height` are `CssAnimationProperty`s with no `overrideHandlers`, so
 * mason can't narrow their converter the way it does for `min-*`. Rewriting
 * the declaration itself works instead: `100vh` becomes its resolved dip
 * count, which core's parser then reads correctly (and, deliberately, so
 * does a bare `px`, which core reads as a device pixel but mason as a CSS
 * pixel).
 */
function masonLengthDeclaration(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const keyword = sizingKeywordLength(value);
  if (keyword) {
    return keyword;
  }
  const dip = cssLengthToDip(value);
  // A bare number is a dip to core and a CSS pixel to mason — the same size.
  return dip === undefined ? value : String(dip);
}

/** Core throws on sizing keywords; a negative length reads as auto to core and carries the keyword as its unit. */
function sizingKeywordLength(value: string): { unit: string; value: number } | undefined {
  return isSizingKeyword(value) ? { unit: value.trim(), value: -2 } : undefined;
}

const MASON_SIZE_KEYS = [widthProperty, heightProperty].flatMap((property) => [property.name, property.cssName, property.cssLocalName]).filter((key): key is string => typeof key === 'string' && key.length > 0);

/**
 * The stylesheet-facing accessor a `CssAnimationProperty` installs is
 * non-configurable, so it can't be overridden on `Style.prototype`. Shadow it
 * on a prototype between `Style.prototype` and each mason view's Style.
 */
const masonStyleProtos = new WeakMap<object, object>();

function masonStyleProto(proto: object): object {
  let masonProto = masonStyleProtos.get(proto);
  if (masonProto) {
    return masonProto;
  }
  masonProto = Object.create(proto);
  for (const key of new Set(MASON_SIZE_KEYS)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    const set = descriptor?.set;
    const get = descriptor?.get;
    if (!set) {
      continue;
    }
    Object.defineProperty(masonProto, key, {
      enumerable: false,
      configurable: true,
      get,
      set(this: Style, value: unknown) {
        beginStyleWrite(this, key, value);
        try {
          set.call(this, masonLengthDeclaration(value));
        } finally {
          endStyleWrite();
        }
      },
    });
  }
  Object.defineProperty(masonProto, MASON_SIZE_UNITS, { value: true, enumerable: false });
  masonStyleProtos.set(proto, masonProto);
  return masonProto;
}

export function installMasonSizeUnits(style: Style): void {
  if (!style || (style as { [MASON_SIZE_UNITS]?: boolean })[MASON_SIZE_UNITS]) {
    return;
  }
  Object.setPrototypeOf(style, masonStyleProto(Object.getPrototypeOf(style)));
}

export const insetProperty = new ShorthandProperty<Style, LengthAuto>({
  name: 'inset',
  cssName: 'inset',
  getter: function (this: Style) {
    if (this.top === this.right && this.top === this.bottom && this.top === this.left) {
      if (typeof this.top === 'string') {
        if (this.top === 'auto') {
          return this.top;
        }
        const value = CorePercentLength.parse(this.top);
        if (Number.isNaN(value)) {
          return this.top;
        } else {
          return CorePercentLength.convertToString(value);
        }
      }
    }
    if (CorePercentLength.equals(this.top as never, this.right as never) && CorePercentLength.equals(this.top as never, this.bottom as never) && CorePercentLength.equals(this.top as never, this.left as never)) {
      return this.top as never;
    }

    return `${CorePercentLength.convertToString(this.paddingTop)} ${CorePercentLength.convertToString(this.paddingRight)} ${CorePercentLength.convertToString(this.paddingBottom)} ${CorePercentLength.convertToString(this.paddingLeft)}`;
  },
  converter: convertToInsets,
});

interface ShorthandPositioning {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

function parseShorthandPositioning(value: string): ShorthandPositioning {
  const arr = value.split(/[ ,]+/);

  let top: string;
  let right: string;
  let bottom: string;
  let left: string;

  if (arr.length === 1) {
    top = arr[0];
    right = arr[0];
    bottom = arr[0];
    left = arr[0];
  } else if (arr.length === 2) {
    top = arr[0];
    bottom = arr[0];
    right = arr[1];
    left = arr[1];
  } else if (arr.length === 3) {
    top = arr[0];
    right = arr[1];
    left = arr[1];
    bottom = arr[2];
  } else if (arr.length === 4) {
    top = arr[0];
    right = arr[1];
    bottom = arr[2];
    left = arr[3];
  } else {
    throw new Error('Expected 1, 2, 3 or 4 parameters. Actual: ' + value);
  }

  return {
    top: top,
    right: right,
    bottom: bottom,
    left: left,
  };
}

function convertToInsets(value: string | CoreTypes.LengthType): [CssProperty<Style, LengthAuto>, LengthAuto][] {
  if (typeof value === 'string' && value !== 'auto') {
    const thickness = parseShorthandPositioning(value);

    return [
      [topProperty, masonInsetConverter(thickness.top) as LengthAuto],
      [rightProperty, masonInsetConverter(thickness.right) as LengthAuto],
      [bottomProperty, masonInsetConverter(thickness.bottom) as LengthAuto],
      [leftProperty, masonInsetConverter(thickness.left) as LengthAuto],
    ];
  } else {
    return [
      [topProperty, value],
      [rightProperty, value],
      [bottomProperty, value],
      [leftProperty, value],
    ];
  }
}

export const leftProperty = new CssProperty<Style, LengthAuto>({
  name: 'left',
  cssName: 'left',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: masonLengthEquals,
  // @ts-ignore
  valueConverter: masonInsetConverter,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, leftProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.left = newValue;
    }
  },
});

export const rightProperty = new CssProperty<Style, LengthAuto>({
  name: 'right',
  cssName: 'right',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: masonLengthEquals,
  // @ts-ignore
  valueConverter: masonInsetConverter,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, rightProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.right = newValue;
    }
  },
});

export const topProperty = new CssProperty<Style, LengthAuto>({
  name: 'top',
  cssName: 'top',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: masonLengthEquals,
  // @ts-ignore
  valueConverter: masonInsetConverter,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, topProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.top = newValue;
    }
  },
});

export const bottomProperty = new CssProperty<Style, LengthAuto>({
  name: 'bottom',
  cssName: 'bottom',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: masonLengthEquals,
  // @ts-ignore
  valueConverter: masonInsetConverter,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, bottomProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.bottom = newValue;
    }
  },
});

export const positionProperty = new CssProperty<Style, Position>({
  name: 'position',
  cssName: 'position',
  defaultValue: 'static',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, positionProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.position = newValue;
    }
  },
});

export const boxSizingProperty = new CssProperty<Style, BoxSizing>({
  name: 'boxSizing',
  cssName: 'box-sizing',
  defaultValue: 'border-box',
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, boxSizingProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.boxSizing = newValue;
      } else {
        // Revert to old value if newValue is invalid
        target.boxSizing = oldValue;
      }
    }
  },
  valueConverter(value) {
    switch (value) {
      case 'content-box':
      case 'border-box':
        return value;
      default:
        return undefined;
    }
  },
});

export const borderRadiusProperty = new CssProperty<Style, string>({
  name: 'borderRadius',
  cssName: 'border-radius',
});

// Core's alignItems/alignSelf validator rejects Box Alignment keywords
// ("start"/"end") masonkit's own Style setter accepts fine; bypass it for
// Mason views/children like alignContent/justifyContent already do below.
export const AlignItemsIsValid = makeValidator('normal', 'start', 'end', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch');
export const AlignItemsParse = makeParser(AlignItemsIsValid);

export const AlignSelfIsValid = makeValidator('normal', 'start', 'end', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch');
export const AlignSelfParse = makeParser(AlignSelfIsValid);

alignItemsProperty.overrideHandlers({
  name: 'alignItems',
  cssName: 'align-items',
  valueConverter: function (value) {
    if (isMasonView(this as unknown as Style)) {
      return value as never;
    }
    return AlignItemsParse(value) as never;
  },
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, alignItemsProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.alignItems = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.alignItems = oldValue as never;
      }
    }
  },
});

alignSelfProperty.overrideHandlers({
  name: 'alignSelf',
  cssName: 'align-self',
  valueConverter: function (value) {
    if (isMasonView(this as unknown as Style)) {
      return value as never;
    }
    return AlignSelfParse(value) as never;
  },
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, alignSelfProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.alignSelf = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.alignSelf = oldValue as never;
      }
    }
  },
});

export const AlignContentIsValid = makeValidator('flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly', 'stretch', 'normal', 'start', 'end');
export const AlignContentParse = makeParser(AlignContentIsValid);

export const alignContentProperty = new CssProperty<Style, AlignContent>({
  name: 'alignContent',
  cssName: 'align-content',
  defaultValue: 'normal',
  valueConverter: function (value) {
    if (isMasonView(this)) {
      return value as never;
    }
    return AlignContentParse(value) as never;
  },
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, alignContentProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.alignContent = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.alignContent = oldValue as never;
      }
    }
  },
});

export const justifyItemsProperty = new CssProperty<Style, JustifyItems>({
  name: 'justifyItems',
  cssName: 'justify-items',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, justifyItemsProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.justifyItems = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.justifyItems = oldValue as never;
      }
    }
  },
});

export const justifySelfProperty = new CssProperty<Style, JustifySelf>({
  name: 'justifySelf',
  cssName: 'justify-self',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, justifySelfProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.justifySelf = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.justifySelf = oldValue as never;
      }
    }
  },
});

export const placeShorthands: MasonShorthand[] = [
  { cssName: 'place-items', longhands: [alignItemsProperty, justifyItemsProperty], split: splitPlace },
  { cssName: 'place-content', longhands: [alignContentProperty, justifyContentProperty], split: splitPlace },
  { cssName: 'place-self', longhands: [alignSelfProperty, justifySelfProperty], split: splitPlace },
];

for (const entry of placeShorthands) {
  masonShorthandProperty(entry).register(Style);
}

export const JustifyContentIsValid = makeValidator('flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly', 'stretch', 'normal', 'start', 'end');
export const JustifyContentParse = makeParser(JustifyContentIsValid);

justifyContentProperty.overrideHandlers({
  name: 'justifyContent',
  cssName: 'justify-content',
  valueConverter: function (value) {
    if (isMasonView(this)) {
      return value as never;
    }
    return JustifyContentParse(value) as never;
  },
  valueChanged(target, oldValue, newValue) {
    if (newValue && appliedInSetNative(target, justifyContentProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.justifyContent = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.justifyContent = oldValue as never;
      }
    }
  },
});

export const flexBasisProperty = new CssProperty<Style, LengthAuto>({
  name: 'flexBasis',
  cssName: 'flex-basis',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: masonLengthEquals,
  // @ts-ignore
  valueConverter: (value: unknown) => (isSizingKeyword(value) ? value.trim() : masonInsetConverter(value)),
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, flexBasisProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.flexBasis = newValue;
    }
  },
});

export const aspectRatioProperty = new CssProperty<Style, number>({
  name: 'aspectRatio',
  cssName: 'aspect-ratio',
  defaultValue: Number.NaN,
  // Without this the raw declaration reached the buffer's setFloat32, where the
  // `<ratio>` form (`2 / 3`) coerces to NaN — i.e. no ratio at all.
  // @ts-ignore
  valueConverter: parseAspectRatio,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, aspectRatioProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.aspectRatio = newValue;
    }
  },
});

export const gridAutoRowsProperty = new CssProperty<Style, string>({
  name: 'gridAutoRows',
  cssName: 'grid-auto-rows',
  defaultValue: '',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridAutoRowsProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridAutoRows = newValue;
    }
  },
});

export const gridAutoColumnsProperty = new CssProperty<Style, string>({
  name: 'gridAutoColumns',
  cssName: 'grid-auto-columns',
  defaultValue: '',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridAutoColumnsProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridAutoColumns = newValue;
    }
  },
});

export const gridAutoFlowProperty = new CssProperty<Style, GridAutoFlow>({
  name: 'gridAutoFlow',
  cssName: 'grid-auto-flow',
  defaultValue: 'row',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridAutoFlowProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridAutoFlow = newValue;
    }
  },
});

export const gridAreaProperty = new CssProperty<Style, string>({
  name: 'gridArea',
  cssName: 'grid-area',
  defaultValue: '',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridAreaProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridArea = newValue;
    }
  },
});

export const gridColumnStartProperty = new CssProperty<Style, string>({
  name: 'gridColumnStart',
  cssName: 'grid-column-start',
  defaultValue: 'auto',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridColumnStartProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridColumnStart = newValue;
    }
  },
});

export const gridColumnEndProperty = new CssProperty<Style, string>({
  name: 'gridColumnEnd',
  cssName: 'grid-column-end',
  defaultValue: 'auto',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridColumnEndProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridColumnEnd = newValue;
    }
  },
});

export const gridColumnProperty = new CssProperty<Style, string>({
  name: 'gridColumn',
  cssName: 'grid-column',
  defaultValue: '',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridColumnProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridColumn = newValue;
    }
  },
});

export const gridRowStartProperty = new CssProperty<Style, string>({
  name: 'gridRowStart',
  cssName: 'grid-row-start',
  defaultValue: 'auto',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridRowStartProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridRowStart = newValue;
    }
  },
});

export const gridRowEndProperty = new CssProperty<Style, string>({
  name: 'gridRowEnd',
  cssName: 'grid-row-end',
  defaultValue: 'auto',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridRowEndProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridRowEnd = newValue;
    }
  },
});

export const gridRowProperty = new CssProperty<Style, string>({
  name: 'gridRow',
  cssName: 'grid-row',
  defaultValue: '',
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridRowProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridRow = newValue;
    }
  },
});

export const gridTemplateAreasProperty = new CssProperty<Style, string>({
  name: 'gridTemplateAreas',
  cssName: 'grid-template-areas',
  defaultValue: null,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridTemplateAreasProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridTemplateAreas = newValue;
    }
  },
});

export const gridTemplateRowsProperty = new CssProperty<Style, string>({
  name: 'gridTemplateRows',
  cssName: 'grid-template-rows',
  defaultValue: null,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridTemplateRowsProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridTemplateRows = newValue;
    }
  },
});

export const gridTemplateColumnsProperty = new CssProperty<Style, string>({
  name: 'gridTemplateColumns',
  cssName: 'grid-template-columns',
  defaultValue: null,
  valueChanged(target, oldValue, newValue) {
    if (appliedInSetNative(target, gridTemplateColumnsProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridTemplateColumns = newValue;
    }
  },
});

// @ts-ignore
export const textWrapProperty = new CssProperty<Style, 'nowrap' | 'wrap' | 'balance'>({
  name: 'textWrap',
  cssName: 'text-wrap',
  affectsLayout: true,
  defaultValue: 'wrap',
  valueChanged(target: any, oldValue, newValue) {
    if (appliedInSetNative(target, textWrapProperty)) return;
    const view = target?.viewRef ? getViewStyle(target.viewRef) : target.view;
    if (view) {
      view.textWrap = newValue;
    }
  },
});

const flexFlowShorthand: MasonShorthand = { cssName: 'flex-flow', longhands: [flexDirectionProperty, flexWrapProperty], split: splitFlexFlow };

const flexFlowProperty = masonShorthandProperty(flexFlowShorthand, function (this: Style) {
  return `${this.flexDirection} ${this.flexWrap}`;
});

const flexShorthand: MasonShorthand = { cssName: 'flex', longhands: [flexGrowProperty, flexShrinkProperty, flexBasisProperty], split: splitFlex };

const flexProperty = masonShorthandProperty(flexShorthand, function (this: Style) {
  return `${this.flexGrow} ${this.flexShrink} ${this.flexBasis}`;
});

export const textOverFlowProperty = new CssProperty<Style, 'clip' | 'ellipsis' | `${string}`>({
  name: 'textOverflow',
  cssName: 'text-overflow',
  defaultValue: 'clip',
  valueChanged(target: any, oldValue, newValue) {
    if (appliedInSetNative(target, textOverFlowProperty)) return;
    const view = target?.viewRef ? getViewStyle(target.viewRef) : target.view;
    if (view) {
      view.textOverflow = newValue;
    }
  },
});

export const verticalAlignProperty = new CssProperty<Style, VerticalAlign>({
  name: 'verticalAlign',
  cssName: 'vertical-align',
  defaultValue: 'baseline',
  valueChanged: (target, oldValue, newValue) => {
    if (newValue && appliedInSetNative(target, verticalAlignProperty)) return;
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.verticalAlign = newValue;
      } else {
        // Revert to old value if newValue is invalid
        target.verticalAlign = oldValue;
      }
    }
  },
});

verticalAlignmentProperty.overrideHandlers({
  name: 'verticalAlignment',
  cssName: 'vertical-align',
  valueConverter: function (value) {
    if (isMasonView(this)) {
      return value as never;
    }
    return CoreTypes.VerticalAlignmentText.parse(value) as never;
  },
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        // @ts-ignore
        view.verticalAlign = newValue;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.verticalAlign = oldValue;
      }
    }
  },
});

overrideForMasonViews<string>(textShadowProperty, {
  coreConverter: parseCSSShadow as never,
  apply: (style, value) => {
    style.textShadow = value as never;
  },
});

export const floatProperty = new CssProperty<Style, Float>({
  name: 'float',
  cssName: 'float',
  defaultValue: 'none',
});

export const clearProperty = new CssProperty<Style, Clear>({
  name: 'clear',
  cssName: 'clear',
  defaultValue: 'none',
});

export const cornerShapeProperty = new CssProperty<Style, string>({
  name: 'cornerShape',
  cssName: 'corner-shape',
});

export const boxShadowProperty = new CssProperty<Style, string>({
  name: 'boxShadow',
  cssName: 'box-shadow',
});

export const transformProperty = new CssProperty<Style, string>({
  name: 'transform',
  cssName: 'transform',
});

export const cornerShapeTopLeftProperty = new CssProperty<Style, string>({
  name: 'cornerShapeTopLeft',
  cssName: 'corner-shape-top-left',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.cornerShapeTopLeft = newValue as never;
    }
  },
});

export const cornerShapeTopRightProperty = new CssProperty<Style, string>({
  name: 'cornerShapeTopRight',
  cssName: 'corner-shape-top-right',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.cornerShapeTopRight = newValue as never;
    }
  },
});

export const cornerShapeBottomRightProperty = new CssProperty<Style, string>({
  name: 'cornerShapeBottomRight',
  cssName: 'corner-shape-bottom-right',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.cornerShapeBottomRight = newValue as never;
    }
  },
});

export const cornerShapeBottomLeftProperty = new CssProperty<Style, string>({
  name: 'cornerShapeBottomLeft',
  cssName: 'corner-shape-bottom-left',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.cornerShapeBottomLeft = newValue as never;
    }
  },
});

registerAlongsideCore(cornerShapeProperty);
registerAlongsideCore(boxShadowProperty);
registerAlongsideCore(transformProperty);
cornerShapeTopLeftProperty.register(Style);
cornerShapeTopRightProperty.register(Style);
cornerShapeBottomRightProperty.register(Style);
cornerShapeBottomLeftProperty.register(Style);

clearProperty.register(Style);

floatProperty.register(Style);

registerAlongsideCore(verticalAlignProperty);

registerAlongsideCore(textOverFlowProperty);

registerAlongsideCore(flexProperty);

registerAlongsideCore(flexFlowProperty);

textWrapProperty.register(Style);

gridTemplateColumnsProperty.register(Style);

gridTemplateRowsProperty.register(Style);

registerAlongsideCore(alignContentProperty);

justifySelfProperty.register(Style);

justifyItemsProperty.register(Style);

gridTemplateAreasProperty.register(Style);

gridRowProperty.register(Style);

gridRowStartProperty.register(Style);

gridRowEndProperty.register(Style);

gridColumnProperty.register(Style);

gridColumnEndProperty.register(Style);

gridColumnStartProperty.register(Style);

gridAreaProperty.register(Style);

// Foreign grid shorthands must share core's effective longhands: independent
// scalar properties lose CSS/local priority (including an explicit `auto`).
// Preserve Mason's direct accessors; core 9.1 stylesheet expansion uses these
// same longhands for both kinds of view.
/** A lone `<custom-ident>` placement, which an omitted end copies instead of `auto`. */
function isGridIdent(part: string): boolean {
  return /^-?[A-Za-z_][\w-]*$/.test(part) && !/^(auto|span)$/i.test(part);
}

/** Splits `a / b / ...` into `count` longhands, filling omitted ones as CSS Grid does. */
export function gridParts(value: string, count: number): string[] {
  const parts = String(value)
    .split('/')
    .map((part) => part.trim());
  if (parts.length > count || parts.some((part) => !part)) throw new Error(`Invalid grid placement: ${value}`);
  // Omitted ends copy their start (grid-area: row-start, column-start, row-end, column-end).
  for (let i = parts.length; i < count; i++) {
    const start = parts[i - (count === 4 ? 2 : 1)] ?? parts[0];
    parts.push(isGridIdent(start) ? start : 'auto');
  }
  return parts;
}

const gridPlacementShorthands: MasonShorthand[] = [
  { cssName: 'grid-row', longhands: [gridRowStartProperty, gridRowEndProperty], split: (value) => gridParts(value, 2) },
  { cssName: 'grid-column', longhands: [gridColumnStartProperty, gridColumnEndProperty], split: (value) => gridParts(value, 2) },
  { cssName: 'grid-area', longhands: [gridRowStartProperty, gridColumnStartProperty, gridRowEndProperty, gridColumnEndProperty], split: (value) => gridParts(value, 4) },
];
for (const entry of gridPlacementShorthands) {
  const shorthand = masonShorthandProperty(entry, function (this: Style) {
    return entry.longhands.map((property) => this[property.name]).join(' / ');
  });
  registerAlongsideCore(shorthand, 'foreign');
}

gridAutoFlowProperty.register(Style);

gridAutoRowsProperty.register(Style);

gridAutoColumnsProperty.register(Style);

aspectRatioProperty.register(Style);

flexBasisProperty.register(Style);

registerAlongsideCore(borderRadiusProperty);

boxSizingProperty.register(Style);

positionProperty.register(Style);

insetProperty.register(Style);

leftProperty.register(Style);
rightProperty.register(Style);
topProperty.register(Style);
bottomProperty.register(Style);

registerAlongsideCore(maxWidthProperty);
registerAlongsideCore(maxHeightProperty);

gridRowGapProperty.register(Style);
gridColumnGapProperty.register(Style);
gridGapProperty.register(Style);
registerAlongsideCore(gapProperty);
registerAlongsideCore(rowGapProperty);
registerAlongsideCore(columnGapProperty);

scrollBarWidthProperty.register(Style);

registerAlongsideCore(marginProperty);

overflowProperty.register(Style);
overflowXProperty.register(Style);
overflowYProperty.register(Style);

registerAlongsideCore(backgroundProperty);
registerAlongsideCore(backgroundRepeatProperty);
registerAlongsideCore(backgroundPositionProperty);
registerAlongsideCore(backgroundSizeProperty);
backgroundClipProperty.register(Style);
backgroundPositionXProperty.register(Style);
backgroundPositionYProperty.register(Style);
backgroundOriginProperty.register(Style);
backgroundAttachmentProperty.register(Style);
backgroundBlendModeProperty.register(Style);

filterProperty.register(Style);
registerAlongsideCore(borderColorProperty);

// New CSS properties

export const objectPositionProperty = new CssProperty<Style, string>({
  name: 'objectPosition',
  cssName: 'object-position',
  defaultValue: '50% 50%',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.objectPosition = newValue as never;
    }
  },
});

// Per-side style longhands; `border-style`, `border` and `border-<side>` expand into them.
export const borderTopStyleProperty = new CssProperty<Style, string>({
  name: 'borderTopStyle',
  cssName: 'border-top-style',
  defaultValue: 'none',
});

export const borderRightStyleProperty = new CssProperty<Style, string>({
  name: 'borderRightStyle',
  cssName: 'border-right-style',
  defaultValue: 'none',
});

export const borderBottomStyleProperty = new CssProperty<Style, string>({
  name: 'borderBottomStyle',
  cssName: 'border-bottom-style',
  defaultValue: 'none',
});

export const borderLeftStyleProperty = new CssProperty<Style, string>({
  name: 'borderLeftStyle',
  cssName: 'border-left-style',
  defaultValue: 'none',
});

export const borderImageProperty = new CssProperty<Style, string>({
  name: 'borderImage',
  cssName: 'border-image',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.borderImage = newValue as never;
    }
  },
});

export const fontStretchProperty = new CssProperty<Style, string>({
  name: 'fontStretch',
  cssName: 'font-stretch',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('fontStretch');
      else view.fontStretch = newValue as never;
    }
  },
});

export const fontFeatureSettingsProperty = new CssProperty<Style, string>({
  name: 'fontFeatureSettings',
  cssName: 'font-feature-settings',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.fontFeatureSettings = newValue as never;
    }
  },
});

export const wordSpacingProperty = new CssProperty<Style, string>({
  name: 'wordSpacing',
  cssName: 'word-spacing',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('wordSpacing');
      else view.wordSpacing = newValue as never;
    }
  },
});

export const hyphensProperty = new CssProperty<Style, string>({
  name: 'hyphens',
  cssName: 'hyphens',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('hyphens');
      else view.hyphens = newValue as never;
    }
  },
});

export const textIndentProperty = new CssProperty<Style, string>({
  name: 'textIndent',
  cssName: 'text-indent',
  defaultValue: '0px',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.textIndent = newValue as never;
    }
  },
});

function setLineClamp(target: Style, value: unknown) {
  const view = getViewStyle(target.viewRef);
  if (view) {
    view.lineClamp = (value ?? 'none') as never;
  }
}

export const lineClampProperty = new CssProperty<Style, string>({
  name: 'lineClamp',
  cssName: 'line-clamp',
  defaultValue: 'none',
  valueChanged: (target, oldValue, newValue) => setLineClamp(target, newValue),
});

// Tailwind's `line-clamp-*` pairs this with `display: -webkit-box`, read as block.
export const webkitLineClampProperty = new CssProperty<Style, string>({
  name: 'webkitLineClamp',
  cssName: '-webkit-line-clamp',
  defaultValue: 'none',
  valueChanged: (target, oldValue, newValue) => setLineClamp(target, newValue),
});

export const transformOriginProperty = new CssProperty<Style, string>({
  name: 'transformOrigin',
  cssName: 'transform-origin',
  defaultValue: '50% 50%',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.transformOrigin = newValue as never;
    }
  },
});

export const backdropFilterProperty = new CssProperty<Style, string>({
  name: 'backdropFilter',
  cssName: 'backdrop-filter',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backdropFilter = newValue as never;
    }
  },
});

// CSS masking. Android and iOS parse and draw these natively, the way they do backgrounds; the
// `mask` shorthand is split into them here, like `background`.
export const maskImageProperty = new CssProperty<Style, string>({
  name: 'maskImage',
  cssName: 'mask-image',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskImage = newValue as never;
    }
  },
});

export const maskSizeProperty = new CssAnimationProperty<Style, string>({
  name: 'maskSize',
  cssName: 'mask-size',
  valueConverter: (value) => value,
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskSize = newValue as never;
    }
  },
});

export const maskPositionProperty = new CssAnimationProperty<Style, string>({
  name: 'maskPosition',
  cssName: 'mask-position',
  // Keyframes keep only declarations whose property has a converter; see css-keyframes.ts.
  valueConverter: (value) => value,
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskPosition = newValue as never;
    }
  },
});

export const maskRepeatProperty = new CssProperty<Style, string>({
  name: 'maskRepeat',
  cssName: 'mask-repeat',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskRepeat = newValue as never;
    }
  },
});

export const maskOriginProperty = new CssProperty<Style, string>({
  name: 'maskOrigin',
  cssName: 'mask-origin',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskOrigin = newValue as never;
    }
  },
});

export const maskClipProperty = new CssProperty<Style, string>({
  name: 'maskClip',
  cssName: 'mask-clip',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskClip = newValue as never;
    }
  },
});

export const maskModeProperty = new CssProperty<Style, string>({
  name: 'maskMode',
  cssName: 'mask-mode',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskMode = newValue as never;
    }
  },
});

export const maskCompositeProperty = new CssProperty<Style, string>({
  name: 'maskComposite',
  cssName: 'mask-composite',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskComposite = newValue as never;
    }
  },
});

export const clipPathProperty = new CssProperty<Style, string>({
  name: 'clipPath',
  cssName: 'clip-path',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.clipPath = newValue as never;
    }
  },
});

export const maskBorderSourceProperty = new CssProperty<Style, string>({
  name: 'maskBorderSource',
  cssName: 'mask-border-source',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskBorderSource = newValue as never;
    }
  },
});

export const maskBorderSliceProperty = new CssProperty<Style, string>({
  name: 'maskBorderSlice',
  cssName: 'mask-border-slice',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskBorderSlice = newValue as never;
    }
  },
});

export const maskBorderWidthProperty = new CssProperty<Style, string>({
  name: 'maskBorderWidth',
  cssName: 'mask-border-width',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskBorderWidth = newValue as never;
    }
  },
});

export const maskBorderOutsetProperty = new CssProperty<Style, string>({
  name: 'maskBorderOutset',
  cssName: 'mask-border-outset',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskBorderOutset = newValue as never;
    }
  },
});

export const maskBorderRepeatProperty = new CssProperty<Style, string>({
  name: 'maskBorderRepeat',
  cssName: 'mask-border-repeat',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskBorderRepeat = newValue as never;
    }
  },
});

export const maskBorderModeProperty = new CssProperty<Style, string>({
  name: 'maskBorderMode',
  cssName: 'mask-border-mode',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maskBorderMode = newValue as never;
    }
  },
});

// The -webkit- prefixed names older and autoprefixed CSS still uses, set on the same Style
// properties. Composite operators and box keywords are translated to the standard ones.

// Gradient-text CSS is usually written `-webkit-background-clip: text`.
const webkitBackgroundClipProperty = new CssProperty<Style, string>({
  name: 'webkitBackgroundClip',
  cssName: '-webkit-background-clip',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.backgroundClip = newValue as never;
    }
  },
});

const webkitMaskImageProperty = new CssProperty<Style, string>({
  name: 'webkitMaskImage',
  cssName: '-webkit-mask-image',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      const value = newValue as unknown as string;
      view.maskImage = (typeof value === 'string' ? value : value) as never;
    }
  },
});

const webkitMaskSizeProperty = new CssProperty<Style, string>({
  name: 'webkitMaskSize',
  cssName: '-webkit-mask-size',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      const value = newValue as unknown as string;
      view.maskSize = (typeof value === 'string' ? value : value) as never;
    }
  },
});

const webkitMaskPositionProperty = new CssProperty<Style, string>({
  name: 'webkitMaskPosition',
  cssName: '-webkit-mask-position',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      const value = newValue as unknown as string;
      view.maskPosition = (typeof value === 'string' ? value : value) as never;
    }
  },
});

const webkitMaskRepeatProperty = new CssProperty<Style, string>({
  name: 'webkitMaskRepeat',
  cssName: '-webkit-mask-repeat',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      const value = newValue as unknown as string;
      view.maskRepeat = (typeof value === 'string' ? value : value) as never;
    }
  },
});

const webkitMaskOriginProperty = new CssProperty<Style, string>({
  name: 'webkitMaskOrigin',
  cssName: '-webkit-mask-origin',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      const value = newValue as unknown as string;
      view.maskOrigin = (typeof value === 'string' ? webkitMaskBox(value) : value) as never;
    }
  },
});

const webkitMaskClipProperty = new CssProperty<Style, string>({
  name: 'webkitMaskClip',
  cssName: '-webkit-mask-clip',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      const value = newValue as unknown as string;
      view.maskClip = (typeof value === 'string' ? webkitMaskBox(value) : value) as never;
    }
  },
});

const webkitMaskCompositeProperty = new CssProperty<Style, string>({
  name: 'webkitMaskComposite',
  cssName: '-webkit-mask-composite',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      const value = newValue as unknown as string;
      view.maskComposite = (typeof value === 'string' ? webkitMaskComposite(value) : value) as never;
    }
  },
});

const maskShorthand: MasonShorthand = {
  cssName: 'mask',
  longhands: [maskImageProperty, maskPositionProperty, maskSizeProperty, maskRepeatProperty, maskOriginProperty, maskClipProperty, maskCompositeProperty, maskModeProperty],
  split: splitMask,
};

export const maskProperty = masonShorthandProperty(maskShorthand, function (this: Style) {
  return this.maskImage;
});

const webkitMaskShorthand: MasonShorthand = { cssName: '-webkit-mask', longhands: maskShorthand.longhands, split: splitWebkitMask };

const webkitMaskProperty = masonShorthandProperty(webkitMaskShorthand, function (this: Style) {
  return this.maskImage;
});

const maskBorderShorthand: MasonShorthand = {
  cssName: 'mask-border',
  longhands: [maskBorderSourceProperty, maskBorderSliceProperty, maskBorderWidthProperty, maskBorderOutsetProperty, maskBorderRepeatProperty, maskBorderModeProperty],
  split: splitMaskBorder,
};

export const maskBorderProperty = masonShorthandProperty(maskBorderShorthand, function (this: Style) {
  return this.maskBorderSource;
});

// WebKit's name for mask-border.
const webkitMaskBoxImageShorthand: MasonShorthand = { cssName: '-webkit-mask-box-image', longhands: maskBorderShorthand.longhands, split: splitMaskBorder };

const webkitMaskBoxImageProperty = masonShorthandProperty(webkitMaskBoxImageShorthand, function (this: Style) {
  return this.maskBorderSource;
});

export const writingModeProperty = new CssProperty<Style, string>({
  name: 'writingMode',
  cssName: 'writing-mode',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('writingMode');
      else view.writingMode = newValue as never;
      const ref = target.viewRef;
      (__ANDROID__ ? ref?.get() : ref?.deref())?.[remapLogicalBoxes_]?.();
    }
  },
});

export const textOrientationProperty = new CssProperty<Style, string>({
  name: 'textOrientation',
  cssName: 'text-orientation',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('textOrientation');
      else view.textOrientation = newValue as never;
    }
  },
});

export const textCombineUprightProperty = new CssProperty<Style, string>({
  name: 'textCombineUpright',
  cssName: 'text-combine-upright',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('textCombineUpright');
      else view.textCombineUpright = newValue;
    }
  },
});

export const textSpacingTrimProperty = new CssProperty<Style, string>({
  name: 'textSpacingTrim',
  cssName: 'text-spacing-trim',
  // No default: it inherits, so the initial value is a real change under another value.
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue == null) view.unsetInheritedText('textSpacingTrim');
      else view.textSpacingTrim = newValue;
    }
  },
});

export const unicodeBidiProperty = new CssProperty<Style, string>({
  name: 'unicodeBidi',
  cssName: 'unicode-bidi',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.unicodeBidi = newValue as never;
    }
  },
});

export const caretColorProperty = new CssProperty<Style, string>({
  name: 'caretColor',
  cssName: 'caret-color',
  defaultValue: 'auto',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.caretColor = newValue as never;
    }
  },
});

objectPositionProperty.register(Style);
borderTopStyleProperty.register(Style);
borderRightStyleProperty.register(Style);
borderBottomStyleProperty.register(Style);
borderLeftStyleProperty.register(Style);
borderImageProperty.register(Style);
fontStretchProperty.register(Style);
fontFeatureSettingsProperty.register(Style);
wordSpacingProperty.register(Style);
hyphensProperty.register(Style);
textIndentProperty.register(Style);
lineClampProperty.register(Style);
webkitLineClampProperty.register(Style);
transformOriginProperty.register(Style);
backdropFilterProperty.register(Style);
maskImageProperty.register(Style);
maskProperty.register(Style);

// Keyframes can animate mask position and size; see css-keyframes.ts.
registerKeyframeProperty(maskPositionProperty, interpolatePositionList, '0% 0%');
registerKeyframeProperty(maskSizeProperty, interpolateSizeList, 'auto');
installKeyframes();
// Core has its own clip-path for plain views; MasonKit views draw theirs natively.
registerAlongsideCore(clipPathProperty);
maskBorderSourceProperty.register(Style);
maskBorderSliceProperty.register(Style);
maskBorderWidthProperty.register(Style);
maskBorderOutsetProperty.register(Style);
maskBorderRepeatProperty.register(Style);
maskBorderModeProperty.register(Style);
webkitBackgroundClipProperty.register(Style);
webkitMaskImageProperty.register(Style);
webkitMaskSizeProperty.register(Style);
webkitMaskPositionProperty.register(Style);
webkitMaskRepeatProperty.register(Style);
webkitMaskOriginProperty.register(Style);
webkitMaskClipProperty.register(Style);
webkitMaskCompositeProperty.register(Style);
webkitMaskProperty.register(Style);
maskBorderProperty.register(Style);
webkitMaskBoxImageProperty.register(Style);
maskSizeProperty.register(Style);
maskPositionProperty.register(Style);
maskRepeatProperty.register(Style);
maskOriginProperty.register(Style);
maskClipProperty.register(Style);
maskModeProperty.register(Style);
maskCompositeProperty.register(Style);
writingModeProperty.register(Style);
textOrientationProperty.register(Style);
textCombineUprightProperty.register(Style);
textSpacingTrimProperty.register(Style);
unicodeBidiProperty.register(Style);
caretColorProperty.register(Style);

registerAlongsideCore(backgroundImageProperty);

// Inherited, as in CSS, so a list's value reaches its items.
export const listStyleTypeProperty = new InheritedCssProperty<Style, string>({
  name: 'listStyleType',
  cssName: 'list-style-type',
});

export const listStylePositionProperty = new InheritedCssProperty<Style, string>({
  name: 'listStylePosition',
  cssName: 'list-style-position',
});

listStyleTypeProperty.register(Style);
listStylePositionProperty.register(Style);

export const listStyleShorthand: MasonShorthand = { cssName: 'list-style', longhands: [listStyleTypeProperty, listStylePositionProperty], split: splitListStyle };

export const listStyleProperty = masonShorthandProperty(listStyleShorthand, function (this: Style) {
  const style = this as unknown as { listStyleType?: unknown; listStylePosition?: unknown };
  const parts = [style.listStyleType, style.listStylePosition].filter((part) => typeof part === 'string' && part);
  return parts.join(' ');
});
listStyleProperty.register(Style);

// core owns `white-space` too (its Label honours nowrap), so dispatch.
registerAlongsideCore(whiteSpaceProperty);
objectFitProperty.register(Style);
touchActionProperty.register(Style);
textJustifyProperty.register(Style);
textDecorationThicknessProperty.register(Style);
textDecorationLineProperty.register(Style);
textDecorationStyleProperty.register(Style);
textDecorationColorProperty.register(Style);

// Core validates `text-decoration` down to none/underline/line-through, so
// overline, the error lines, styles, colors and thicknesses never reached
// mason. Its own elements get the raw declaration; core keeps its parser.
const TextDecorationParse = makeParser<string>(makeValidator('none', 'underline', 'line-through', 'underline line-through'));
(textDecorationProperty as unknown as { overrideHandlers(options: object): void }).overrideHandlers({
  valueConverter: function (this: Style, value: string) {
    return isMasonView(this) ? value : TextDecorationParse(value);
  },
});
// core owns `font-family` (through its Font shorthand), so this has to dispatch
// rather than shadow it.
// Windows keeps core's inherited font-family, whose fontInternal reaches common.ts and resolves app fonts.
if (!__WINDOWS__) {
  registerAlongsideCore(fontFamilyProperty);
}

displayProperty.register(Style);

interface CoreLonghandHandlers {
  converter(value: string): unknown;
  comparer(a: unknown, b: unknown): boolean;
  keywords?: ReadonlyMap<string, string>;
}

/**
 * A Mason view gets core's own parse with the CSS text attached (see
 * CssLength), so core's valueChanged and layout code read a finite length
 * while Mason's setNative parses the text. Core views keep core's converter.
 */
function keepCssOnMasonViews(longhands: CssProperty<Style, any>[], core: CoreLonghandHandlers): void {
  for (const property of longhands) {
    property.overrideHandlers({
      name: property.name,
      cssName: property.cssLocalName,
      valueConverter(this: Style, value: string) {
        const css = core.keywords?.get(value.trim()) ?? value;
        return isMasonView(this) ? cssLength(css, core.converter) : core.converter(css);
      },
      // Core's parse reads `10%` and `10rem` alike, so the CSS text decides.
      equalityComparer: (a, b) => (isCssLength(a) || isCssLength(b) ? (a as CssLength)?.css === (b as CssLength)?.css : core.comparer(a, b)),
    });
  }
}

const radiusLonghands = [borderTopLeftRadiusProperty, borderTopRightRadiusProperty, borderBottomRightRadiusProperty, borderBottomLeftRadiusProperty];
const marginLonghands = [marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty];
const paddingLonghands = [paddingTopProperty, paddingRightProperty, paddingBottomProperty, paddingLeftProperty];
const borderWidthLonghands = [borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, borderLeftWidthProperty];
const borderColorLonghands = [borderTopColorProperty, borderRightColorProperty, borderBottomColorProperty, borderLeftColorProperty];

// Core reads `50%` as 50 and skips a parsed 0 as equal to its default, so
// `border-radius: 0` never reached a button's native 4px radius.
keepCssOnMasonViews(radiusLonghands, { converter: CoreLength.parse, comparer: CoreLength.equals });
keepCssOnMasonViews(marginLonghands, { converter: CorePercentLength.parse, comparer: CorePercentLength.equals });
keepCssOnMasonViews(paddingLonghands, { converter: CoreLength.parse, comparer: CoreLength.equals });
keepCssOnMasonViews(borderWidthLonghands, { converter: CoreLength.parse, comparer: CoreLength.equals, keywords: BORDER_WIDTH_KEYWORDS });

/** The shorthands core registers; MasonKit builds these only to own core 9.1's parse-time split. */
const coreShorthands: MasonShorthand[] = [
  { cssName: 'border-radius', longhands: radiusLonghands, split: splitBorderRadius },
  { cssName: 'margin', longhands: marginLonghands, split: splitMargin },
  { cssName: 'padding', longhands: paddingLonghands, split: splitPadding },
  { cssName: 'border-width', longhands: borderWidthLonghands, split: splitBorderWidth },
  { cssName: 'border-color', longhands: borderColorLonghands, split: splitBorderColor },
  {
    cssName: 'background',
    longhands: [backgroundColorProperty, backgroundImageProperty, backgroundRepeatProperty, backgroundPositionProperty, backgroundSizeProperty, backgroundClipProperty, backgroundOriginProperty, backgroundAttachmentProperty],
    split: splitBackground,
  },
];

for (const entry of coreShorthands) {
  masonShorthandProperty(entry);
}

// `border`, `border-<side>` and `border-style` expand into the width, style and
// color longhands, so the cascade resolves each longhand on its own.
const SIDES = ['top', 'right', 'bottom', 'left'];

/** A longhand's value as CSS text, for the shorthand getters. */
function cssText(value: unknown): string {
  if (value == null || value === unsetValue) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (isCssLength(value)) {
    return value.css;
  }
  const { hex, unit, value: amount } = value as { hex?: string; unit?: string; value?: number };
  if (typeof hex === 'string') {
    return hex;
  }
  if (typeof amount === 'number') {
    return unit === '%' ? `${amount * 100}%` : `${amount}px`;
  }
  return String(value);
}

const borderStyleLonghands = [borderTopStyleProperty, borderRightStyleProperty, borderBottomStyleProperty, borderLeftStyleProperty];

const borderStyleShorthand: MasonShorthand = { cssName: 'border-style', longhands: borderStyleLonghands, split: splitBorderStyle };
const borderShorthand: MasonShorthand = { cssName: 'border', longhands: [...borderWidthLonghands, ...borderStyleLonghands, ...borderColorLonghands], split: splitBorder };
const borderSideShorthands: MasonShorthand[] = [0, 1, 2, 3].map((i) => ({
  cssName: `border-${SIDES[i]}`,
  longhands: [borderWidthLonghands[i], borderStyleLonghands[i], borderColorLonghands[i]],
  split: splitBorderSide,
}));

function sideValues(style: Style, longhands: { name: string }[]): string[] {
  return longhands.map(({ name }) => cssText((style as never)[name]));
}

/** The shared value when every side agrees, else undefined. */
function uniformSides(values: string[]): string | undefined {
  return values.every((value) => value === values[0]) ? values[0] : undefined;
}

export const borderStyleProperty = masonShorthandProperty(borderStyleShorthand, function (this: Style) {
  const styles = sideValues(this, borderStyleLonghands);
  return uniformSides(styles) ?? styles.join(' ');
});

export const borderProperty = masonShorthandProperty(borderShorthand, function (this: Style) {
  const width = uniformSides(sideValues(this, borderWidthLonghands));
  const style = uniformSides(sideValues(this, borderStyleLonghands));
  const color = uniformSides(sideValues(this, borderColorLonghands));
  return width !== undefined && style !== undefined && color !== undefined ? [width, style, color].filter(Boolean).join(' ') : '';
});

function borderSideGetter(i: number) {
  return function (this: Style) {
    return sideValues(this, [borderWidthLonghands[i], borderStyleLonghands[i], borderColorLonghands[i]]).filter(Boolean).join(' ');
  };
}

export const borderTopProperty = masonShorthandProperty(borderSideShorthands[0], borderSideGetter(0));
export const borderRightProperty = masonShorthandProperty(borderSideShorthands[1], borderSideGetter(1));
export const borderBottomProperty = masonShorthandProperty(borderSideShorthands[2], borderSideGetter(2));
export const borderLeftProperty = masonShorthandProperty(borderSideShorthands[3], borderSideGetter(3));

borderStyleProperty.register(Style);
borderProperty.register(Style);
borderTopProperty.register(Style);
borderRightProperty.register(Style);
borderBottomProperty.register(Style);
borderLeftProperty.register(Style);

// ---------------------------------------------------------------------------
// Logical properties
// ---------------------------------------------------------------------------
// Logical properties are longhands of their own, and the later of a physical and a logical
// declaration wins a side, by the box's writing mode and direction. A Mason view stores
// margins, padding, insets and sizes as logical sides, which mason-core maps; it writes
// borders, corners and overflow to the physical sides their painters read (see
// logicalBoxGroups in common.ts). A plain NativeScript view gets the physical property for
// horizontal left-to-right text.

type Sides = readonly [top: ShorthandLonghand, right: ShorthandLonghand, bottom: ShorthandLonghand, left: ShorthandLonghand];

const LOGICAL_SIDES: ReadonlyArray<[logical: string, physical: number]> = [
  ['block-start', 0],
  ['inline-end', 1],
  ['block-end', 2],
  ['inline-start', 3],
];

/** `<prefix>-inline<suffix>` and `<prefix>-block<suffix>`, over a group's logical sides. */
function logicalSides(prefix: string, suffix: string, sides: Sides, splitAxis: (value: string) => string[]): MasonShorthand[] {
  return [
    { cssName: `${prefix}-inline${suffix}`, longhands: [sides[3], sides[1]], split: splitAxis },
    { cssName: `${prefix}-block${suffix}`, longhands: [sides[0], sides[2]], split: splitAxis },
  ];
}

export interface LogicalLonghand {
  property: CssProperty<Style, unknown>;
  group: LogicalGroupName;
  slot: number;
}

/** Logical longhands; Mason views write them in setNative (common.ts), once the native view exists. */
export const logicalLonghands: LogicalLonghand[] = [];

function logicalLonghand(cssName: string, group: LogicalGroupName, slot: number, physical: ShorthandLonghand) {
  const property = new CssProperty<Style, unknown>({
    name: toCamelCase(cssName),
    cssName,
    valueChanged(target, oldValue, newValue) {
      const ref = target?.viewRef;
      const view = ref ? (__ANDROID__ ? ref.get() : ref.deref()) : undefined;
      if (!view || view[isMasonView_]) return;
      // cssName is the cascade's css-tier key ('css:margin-left').
      (target as never)[physical.cssName] = (newValue ?? unsetValue) as never;
    },
  });
  property.register(Style);
  logicalLonghands.push({ property, group, slot });
  return property;
}

/** A group's four logical sides, in the positions of the physical sides they map to in horizontal left-to-right text. */
function logicalSideLonghands(prefix: string, group: LogicalGroupName, physical: Sides): Sides {
  return LOGICAL_SIDES.map(([side, i]) => logicalLonghand(`${prefix}-${side}`, group, i, physical[i])) as unknown as Sides;
}

export const marginLogicalLonghands = logicalSideLonghands('margin', 'margin', marginLonghands as unknown as Sides);
export const paddingLogicalLonghands = logicalSideLonghands('padding', 'padding', paddingLonghands as unknown as Sides);
export const insetLogicalLonghands = logicalSideLonghands('inset', 'inset', [topProperty, rightProperty, bottomProperty, leftProperty]);
export const logicalSizeLonghands = (
  [
    ['inline-size', widthProperty],
    ['block-size', heightProperty],
    ['min-inline-size', minWidthProperty],
    ['min-block-size', minHeightProperty],
    ['max-inline-size', maxWidthProperty],
    ['max-block-size', maxHeightProperty],
  ] as const
).map(([cssName, physical], slot) => logicalLonghand(cssName, 'size', slot, physical as ShorthandLonghand));

/**
 * Logical longhands a Mason view writes to physical sides: `physical` are the group's physical
 * longhands (sides top, right, bottom, left; corners top-left, top-right, bottom-right,
 * bottom-left; axes x, y), `logical` its logical ones in the positions of the physical ones
 * they map to in horizontal left-to-right text.
 */
export interface LogicalBoxGroup {
  kind: 'sides' | 'corners' | 'axes';
  physical: CssProperty<Style, unknown>[];
  logical: CssProperty<Style, unknown>[];
  /** A side's value when neither kind of declaration sets it. */
  initial: unknown;
}

export const logicalBoxGroups: LogicalBoxGroup[] = [];

function logicalBoxGroup(kind: LogicalBoxGroup['kind'], physical: unknown[], cssNames: string[], initial: unknown) {
  const group: LogicalBoxGroup = { kind, physical: physical as CssProperty<Style, unknown>[], logical: [], initial };
  group.logical = cssNames.map((cssName, slot) => {
    const property = new CssProperty<Style, unknown>({
      name: toCamelCase(cssName),
      cssName,
      valueChanged(target, oldValue, newValue) {
        const ref = target?.viewRef;
        const view = ref ? (__ANDROID__ ? ref.get() : ref.deref()) : undefined;
        if (!view || view[isMasonView_]) return;
        (target as never)[group.physical[slot].cssName] = (newValue ?? unsetValue) as never;
      },
    });
    property.register(Style);
    return property;
  });
  logicalBoxGroups.push(group);
  return group.logical;
}

const sideNames = (prefix: string, suffix: string) => LOGICAL_SIDES.map(([side]) => `${prefix}-${side}${suffix}`);
const borderWidthLogicalLonghands = logicalBoxGroup('sides', borderWidthLonghands, sideNames('border', '-width'), 0) as unknown as Sides;
const borderStyleLogicalLonghands = logicalBoxGroup('sides', borderStyleLonghands, sideNames('border', '-style'), 'none') as unknown as Sides;
const borderColorLogicalLonghands = logicalBoxGroup('sides', borderColorLonghands, sideNames('border', '-color'), 'black') as unknown as Sides;
// Corners are <block>-<inline>: start-start is top-left.
export const radiusLogicalLonghands = logicalBoxGroup('corners', radiusLonghands, ['border-start-start-radius', 'border-start-end-radius', 'border-end-end-radius', 'border-end-start-radius'], 0);
export const overflowLogicalLonghands = logicalBoxGroup('axes', [overflowXProperty, overflowYProperty], ['overflow-inline', 'overflow-block'], 'visible');

const borderSideLonghands = (i: number) => [borderWidthLogicalLonghands[i], borderStyleLogicalLonghands[i], borderColorLogicalLonghands[i]];

const logicalShorthands: MasonShorthand[] = [
  ...logicalSides('margin', '', marginLogicalLonghands, splitMarginStartEnd),
  ...logicalSides('padding', '', paddingLogicalLonghands, splitPaddingStartEnd),
  ...logicalSides('inset', '', insetLogicalLonghands, splitInsetStartEnd),
  ...logicalSides('border', '-width', borderWidthLogicalLonghands, splitBorderWidthStartEnd),
  ...logicalSides('border', '-style', borderStyleLogicalLonghands, splitBorderStyleStartEnd),
  ...logicalSides('border', '-color', borderColorLogicalLonghands, splitBorderColorStartEnd),
  // `border-inline: 1px solid` gives both sides the same border.
  { cssName: 'border-inline', longhands: [...borderSideLonghands(3), ...borderSideLonghands(1)], split: (value) => [...splitBorderSide(value), ...splitBorderSide(value)] },
  { cssName: 'border-block', longhands: [...borderSideLonghands(0), ...borderSideLonghands(2)], split: (value) => [...splitBorderSide(value), ...splitBorderSide(value)] },
  ...LOGICAL_SIDES.map(([side, i]) => ({ cssName: `border-${side}`, longhands: borderSideLonghands(i), split: splitBorderSide })),
];

for (const entry of logicalShorthands) {
  masonShorthandProperty(entry, function (this: Style) {
    const parts = entry.longhands.map((longhand) => cssText((this as never)[longhand.name]));
    // The axis shorthands read back as one value when both sides agree.
    return entry.longhands.length === 2 && parts[0] === parts[1] ? parts[0] : parts.join(' ');
  }).register(Style);
}

export const masonShorthands: MasonShorthand[] = [...coreShorthands, ...gridPlacementShorthands, borderStyleShorthand, borderShorthand, ...borderSideShorthands, ...logicalShorthands, overflowShorthand, maskShorthand, webkitMaskShorthand, maskBorderShorthand, webkitMaskBoxImageShorthand, gapShorthand, gridGapShorthand, flexFlowShorthand, flexShorthand];
