import { CssProperty, Style, ViewBase as NSViewBase, ShorthandProperty, Length as CoreLength, fontSizeProperty, textAlignmentProperty, PercentLength as CorePercentLength, Trace, CoreTypes, unsetValue, verticalAlignmentProperty, textShadowProperty, Font } from '@nativescript/core';
import { Display, Overflow, Length, Gap, LengthAuto, Position, BoxSizing, GridAutoFlow, JustifyItems, JustifySelf, AlignContent, VerticalAlign } from '.';
import type { TextBase } from './common';
import { isMasonChild_, isMasonView_ } from './symbols';
import type { Style as MasonStyle } from './style';
import { alignItemsProperty, alignSelfProperty, flexDirectionProperty, flexGrowProperty, flexShrinkProperty, flexWrapProperty, justifyContentProperty } from '@nativescript/core/ui/layouts/flexbox-layout';

function getViewStyle(view: WeakRef<NSViewBase> | WeakRef<TextBase>): MasonStyle {
  const ret: NSViewBase & { _styleHelper: MasonStyle } = (__ANDROID__ ? view.get() : view.deref()) as never;
  return ret._styleHelper as MasonStyle;
}

function isMasonViewOrChild(style: Style): boolean {
  if (style && style.viewRef) {
    const view = __ANDROID__ ? style.viewRef.get() : style.viewRef.deref();
    return view && (view[isMasonView_] || view[isMasonChild_]);
  }
  return false;
}

export const displayProperty = new CssProperty<Style, Display>({
  name: 'display',
  cssName: 'display',
  defaultValue: 'block',
  valueChanged: (target, oldValue, newValue) => {
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
      default:
        return undefined;
    }
  },
});

export const filterProperty = new CssProperty<Style, string>({
  name: 'filter',
  cssName: 'filter',
});

export const borderProperty = new CssProperty<Style, string>({
  name: 'border',
  cssName: 'border',
});

export const backgroundProperty = new CssProperty<Style, string>({
  name: 'background',
  cssName: 'background',
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
      return value;
    default:
      return undefined;
  }
}

const overFlow = /^\s*(visible|hidden|clip|scroll|auto)(?:\s+(visible|hidden|clip|scroll|auto))?\s*$/;

export const overflowProperty = new ShorthandProperty<Style, Overflow>({
  name: 'overflow',
  cssName: 'overflow',
  getter: function () {
    if (this.overflowX === this.overflowY) {
      return this.overflowX;
    }
    return `${this.overflowX} ${this.overflowY}`;
  },
  converter(value) {
    const properties: [CssProperty<any, any>, any][] = [];
    if (typeof value === 'string') {
      const values = value.match(overFlow);

      const length = values?.length ?? 0;
      if (length === 0) {
        return properties;
      }

      if (length === 1) {
        const xy = values[0];
        properties.push([overflowXProperty, xy]);
        properties.push([overflowYProperty, xy]);
      }

      if (length > 1) {
        const x = values[0];
        const y = values[1];

        properties.push([overflowXProperty, x]);
        properties.push([overflowYProperty, y]);
      }
    }

    return properties;
  },
});

export const overflowXProperty = new CssProperty<Style, Overflow>({
  name: 'overflowX',
  cssName: 'overflow-x',
  defaultValue: 'visible',
  valueConverter: overflowConverter,
  valueChanged: (target, oldValue, newValue) => {
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

export const paddingProperty = new CssProperty<Style, string>({
  name: 'padding',
  cssName: 'padding',
});

paddingProperty.register(Style);

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

flexDirectionProperty.overrideHandlers({
  name: 'flexDirection',
  cssName: 'flex-direction',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.flexDirection = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.flexDirection = oldValue as never;
      }
    }
  },
});

flexWrapProperty.overrideHandlers({
  name: 'flexWrap',
  cssName: 'flex-wrap',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.flexWrap = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.flexWrap = oldValue as never;
      }
    }
  },
});

flexGrowProperty.overrideHandlers({
  name: 'flexGrow',
  cssName: 'flex-grow',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
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
    if (isMasonViewOrChild(this)) {
      return value as never;
    }
    return parseFloat(value as never);
  },
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        if (typeof newValue === 'string') {
          // @ts-ignore
          if (newValue.indexOf('%') !== -1) {
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
  valueConverter(value) {
    const parsed = CoreLength.parse(value);
    if (typeof parsed === 'string') {
      return 0;
    }
    return parsed;
  },
  valueChanged(target, oldValue, newValue) {
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
  valueConverter(value) {
    const parsed = CoreLength.parse(value);
    if (typeof parsed === 'string') {
      return 0;
    }
    return parsed;
  },
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.columnGap = newValue;
    }
  },
});

export const gridGapProperty = new ShorthandProperty<Style, Gap>({
  name: 'gridGap',
  cssName: 'grid-gap',
  getter: function () {
    if (this.rowGap === this.columnGap) {
      return this.rowGap;
    }
    return `${this.rowGap} ${this.columnGap}`;
  },
  converter(gap) {
    const properties: [CssProperty<any, any>, any][] = [];

    let value = gap;

    if (typeof value === 'number') {
      value = `${value}`;
    }

    if (typeof value === 'string') {
      const values = value.split(/\s+/).filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return properties;
      }

      if (length === 1) {
        const row = values[0];
        properties.push([rowGapProperty, row]);
        properties.push([columnGapProperty, row]);
      }

      if (length > 1) {
        const row = values[0];
        const column = values[1];

        properties.push([rowGapProperty, row]);
        properties.push([columnGapProperty, column]);
      }
    }

    return properties;
  },
});

export const gapProperty = new ShorthandProperty<Style, Gap>({
  name: 'gap',
  cssName: 'gap',
  getter: function () {
    if (this.rowGap === this.columnGap) {
      return this.rowGap;
    }
    return `${this.rowGap} ${this.columnGap}`;
  },
  converter(gap) {
    const properties: [CssProperty<any, any>, any][] = [];

    let value = gap;

    if (typeof value === 'number') {
      value = `${value}`;
    }

    if (typeof value === 'string') {
      const values = value.split(/\s+/).filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return properties;
      }

      if (length === 1) {
        const row = values[0];
        properties.push([rowGapProperty, row]);
        properties.push([columnGapProperty, row]);
      }

      if (length > 1) {
        const row = values[0];
        const column = values[1];

        properties.push([rowGapProperty, row]);
        properties.push([columnGapProperty, column]);
      }
    }

    return properties;
  },
});

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

textAlignmentProperty.overrideHandlers({
  name: 'textAlignment',
  cssName: 'text-align',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.textAlignment = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        target.textAlignment = oldValue as never;
      }
    }
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

export const maxWidthProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxWidth',
  cssName: 'max-width',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: CoreLength.equals,
  valueConverter: masonLengthParse,
  valueChanged: (target, oldValue, newValue) => {
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
  equalityComparer: CoreLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maxHeight = newValue;
    }
  },
});

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
      [topProperty, masonLengthPercentParse(thickness.top)],
      [rightProperty, masonLengthPercentParse(thickness.right)],
      [bottomProperty, masonLengthPercentParse(thickness.bottom)],
      [leftProperty, masonLengthPercentParse(thickness.left)],
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
  equalityComparer: CoreLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
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
  equalityComparer: CoreLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
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
  equalityComparer: CoreLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
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
  equalityComparer: CoreLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.bottom = newValue;
    }
  },
});

export const positionProperty = new CssProperty<Style, Position>({
  name: 'position',
  cssName: 'position',
  defaultValue: 'relative',
  valueChanged(target, oldValue, newValue) {
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

alignItemsProperty.overrideHandlers({
  name: 'alignItems',
  cssName: 'align-items',
  valueChanged(target, oldValue, newValue) {
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
  valueChanged(target, oldValue, newValue) {
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

export const alignContentProperty = new CssProperty<Style, AlignContent>({
  name: 'alignContent',
  cssName: 'align-content',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
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

justifyContentProperty.overrideHandlers({
  name: 'justifyContent',
  cssName: 'justify-content',
  valueChanged(target, oldValue, newValue) {
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
  equalityComparer: CoreLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
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
  valueChanged(target, oldValue, newValue) {
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
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.gridTemplateColumns = newValue;
    }
  },
});

// @ts-ignore
export const textWrapProperty = new CssProperty<Style, 'nowrap' | 'wrap' | 'balance'>({
  name: 'textWrap',
  affectsLayout: true,
  defaultValue: 'wrap',
  valueChanged(target: any, oldValue, newValue) {
    const view = target?.viewRef ? getViewStyle(target.viewRef) : target.view;
    if (view) {
      view.textWrap = newValue;
    }
  },
});

// flex-flow: <flex-direction> || <flex-wrap>
const flexFlowProperty = new ShorthandProperty({
  name: 'flexFlow',
  cssName: 'flex-flow',
  getter: function () {
    return `${this.flexDirection} ${this.flexWrap}`;
  },
  converter: function (value) {
    const properties = [];
    if (value === unsetValue) {
      properties.push([flexDirectionProperty, value]);
      properties.push([flexWrapProperty, value]);
    } else {
      const trimmed = value && value.trim();
      if (trimmed) {
        const values = trimmed.split(/\s+/);
        if (values.length >= 1) {
          properties.push([flexDirectionProperty, values[0]]);
        }
        if (value.length >= 2) {
          properties.push([flexWrapProperty, values[1]]);
        }
      }
    }
    return properties;
  },
});

// flex: inital | auto | none | <flex-grow> <flex-shrink> || <flex-basis>
const flexProperty = new ShorthandProperty({
  name: 'flex',
  cssName: 'flex',
  getter: function () {
    return `${this.flexGrow} ${this.flexShrink} ${this.flexBasis}`;
  },
  converter: function (value) {
    const properties = [];
    if (value === unsetValue) {
      properties.push([flexGrowProperty, value]);
      properties.push([flexShrinkProperty, value]);
    } else if (typeof value === 'number') {
      properties.push([flexGrowProperty, value]);
      properties.push([flexShrinkProperty, 1]);
      properties.push([flexBasisProperty, 'auto']);
    } else {
      const trimmed = value && value.trim();
      if (trimmed) {
        const values = trimmed.split(/\s+/);
        if (values.length === 1) {
          switch (values[0]) {
            case 'inital':
              properties.push([flexGrowProperty, 0]);
              properties.push([flexShrinkProperty, 1]);
              properties.push([flexBasisProperty, 'auto']);
              break;
            case 'auto':
              properties.push([flexGrowProperty, 1]);
              properties.push([flexShrinkProperty, 1]);
              properties.push([flexBasisProperty, 'auto']);
              break;
            case 'none':
              properties.push([flexGrowProperty, 0]);
              properties.push([flexShrinkProperty, 0]);
              properties.push([flexBasisProperty, 'auto']);
              break;
            default:
              properties.push([flexGrowProperty, values[0]]);
              properties.push([flexShrinkProperty, 1]);
              properties.push([flexBasisProperty, 'auto']);
          }
        }
        if (values.length >= 2) {
          properties.push([flexGrowProperty, values[0]]);
          properties.push([flexShrinkProperty, values[1]]);
        }

        if (value.length >= 3) {
          properties.push({ property: flexBasisProperty, value: values[2] });
        }
      }
    }

    return properties;
  },
});

export const textOverFlowProperty = new CssProperty<Style, 'clip' | 'ellipsis' | `${string}`>({
  name: 'textOverflow',
  cssName: 'text-overflow',
  defaultValue: 'clip',
  valueChanged(target: any, oldValue, newValue) {
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
    if (isMasonViewOrChild(this)) {
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

textShadowProperty.overrideHandlers({
  name: 'textShadow',
  cssName: 'text-shadow',
  valueConverter: function (value) {
    return value as never;
  },
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.textShadow = newValue as never;
    } else {
      // Revert to old value if newValue is invalid
      // @ts-ignore
      target.textShadow = oldValue;
    }
  },
});

verticalAlignProperty.register(Style);

textOverFlowProperty.register(Style);

flexProperty.register(Style);

flexFlowProperty.register(Style);

textWrapProperty.register(Style);

gridTemplateColumnsProperty.register(Style);

gridTemplateRowsProperty.register(Style);

alignContentProperty.register(Style);

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

gridAutoFlowProperty.register(Style);

gridAutoRowsProperty.register(Style);

gridAutoColumnsProperty.register(Style);

aspectRatioProperty.register(Style);

flexBasisProperty.register(Style);

borderRadiusProperty.register(Style);

boxSizingProperty.register(Style);

positionProperty.register(Style);

insetProperty.register(Style);

leftProperty.register(Style);
rightProperty.register(Style);
topProperty.register(Style);
bottomProperty.register(Style);

maxWidthProperty.register(Style);
maxHeightProperty.register(Style);

gridRowGapProperty.register(Style);
gridColumnGapProperty.register(Style);
gridGapProperty.register(Style);
gapProperty.register(Style);
rowGapProperty.register(Style);
columnGapProperty.register(Style);

scrollBarWidthProperty.register(Style);

marginProperty.register(Style);

overflowProperty.register(Style);
overflowXProperty.register(Style);
overflowYProperty.register(Style);

backgroundProperty.register(Style);

borderProperty.register(Style);

filterProperty.register(Style);

displayProperty.register(Style);
