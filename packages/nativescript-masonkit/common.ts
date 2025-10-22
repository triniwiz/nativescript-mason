/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AddChildFromBuilder, CSSType, CssProperty, CustomLayoutView, Length as NSLength, ShorthandProperty, Style, View as NSView, ViewBase as NSViewBase, getViewById, unsetValue, Property, widthProperty, heightProperty, View, CoreTypes, Trace, Length as CoreLength, PercentLength as CorePercentLength, marginLeftProperty, marginRightProperty, marginTopProperty, marginBottomProperty, minWidthProperty, minHeightProperty, fontSizeProperty, fontWeightProperty, fontStyleProperty } from '@nativescript/core';
import { AlignContent, AlignSelf, Display, Gap, GridAutoFlow, JustifyItems, JustifySelf, Length, LengthAuto, Overflow, Position, AlignItems, JustifyContent, BoxSizing } from '.';
import { flexDirectionProperty, flexGrowProperty, flexWrapProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { _forceStyleUpdate, _setGridAutoRows, GridTemplates } from './utils';
import { Style as MasonStyle } from './style';
export const native_ = Symbol('[[native]]');
export const style_ = Symbol('[[style]]');
export const isTextChild_ = Symbol('[[isTextChild]]');
export const isText_ = Symbol('[[isText]]');
export const isMasonView_ = Symbol('[[isMasonView]]');

function getViewStyle(view: WeakRef<NSViewBase> | WeakRef<TextBase>): MasonStyle {
  const ret: NSViewBase & { _styleHelper: MasonStyle } = (__ANDROID__ ? view.get() : view.deref()) as never;
  return ret._styleHelper as MasonStyle;
}

export interface MasonChild extends ViewBase {}

export const scrollBarWidthProperty = new CssProperty<Style, number>({
  name: 'scrollBarWidth',
  cssName: 'scroll-bar-width',
  defaultValue: 0,
  valueConverter: parseFloat,
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
        view.view.style.overflowX = oldValue;
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
        view.view.style.overflowY = oldValue;
      }
    }
  },
});

const paddingProperty = new ShorthandProperty<Style, string | CoreTypes.LengthType>({
  name: 'padding',
  cssName: 'padding',
  getter: function (this: Style) {
    if (CoreLength.equals(this.paddingTop, this.paddingRight) && CoreLength.equals(this.paddingTop, this.paddingBottom) && CoreLength.equals(this.paddingTop, this.paddingLeft)) {
      return this.paddingTop;
    }

    return `${CoreLength.convertToString(this.paddingTop)} ${CoreLength.convertToString(this.paddingRight)} ${CoreLength.convertToString(this.paddingBottom)} ${CoreLength.convertToString(this.paddingLeft)}`;
  },
  converter: convertToPaddings,
});

export const paddingLeftProperty = new CssProperty<Style, CoreTypes.LengthType>({
  name: 'paddingLeft',
  cssName: 'padding-left',
  defaultValue: CoreTypes.zeroLength,
  affectsLayout: global.isIOS,
  equalityComparer: CoreLength.equals,
  valueChanged: (target, oldValue, newValue) => {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.paddingLeft = CoreLength.toDevicePixels(newValue, 0);
    } else {
      Trace.write(`${newValue} not set to view's property because ".viewRef" is cleared`, Trace.categories.Style, Trace.messageType.warn);
    }
  },
  valueConverter: masonLengthParse,
});

export const paddingRightProperty = new CssProperty<Style, CoreTypes.LengthType>({
  name: 'paddingRight',
  cssName: 'padding-right',
  defaultValue: CoreTypes.zeroLength,
  affectsLayout: global.isIOS,
  equalityComparer: CoreLength.equals,
  valueChanged: (target, oldValue, newValue) => {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.paddingRight = CoreLength.toDevicePixels(newValue, 0);
    } else {
      Trace.write(`${newValue} not set to view's property because ".viewRef" is cleared`, Trace.categories.Style, Trace.messageType.warn);
    }
  },
  valueConverter: masonLengthParse,
});

export const paddingTopProperty = new CssProperty<Style, CoreTypes.LengthType>({
  name: 'paddingTop',
  cssName: 'padding-top',
  defaultValue: CoreTypes.zeroLength,
  affectsLayout: global.isIOS,
  equalityComparer: CoreLength.equals,
  valueChanged: (target, oldValue, newValue) => {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.paddingTop = CoreLength.toDevicePixels(newValue, 0);
    } else {
      Trace.write(`${newValue} not set to view's property because ".viewRef" is cleared`, Trace.categories.Style, Trace.messageType.warn);
    }
  },
  valueConverter: masonLengthParse,
});

export const paddingBottomProperty = new CssProperty<Style, CoreTypes.LengthType>({
  name: 'paddingBottom',
  cssName: 'padding-bottom',
  defaultValue: CoreTypes.zeroLength,
  affectsLayout: global.isIOS,
  equalityComparer: CoreLength.equals,
  valueChanged: (target, oldValue, newValue) => {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.paddingBottom = CoreLength.toDevicePixels(newValue, 0);
    } else {
      Trace.write(`${newValue} not set to view's property because ".viewRef" is cleared`, Trace.categories.Style, Trace.messageType.warn);
    }
  },
  valueConverter: masonLengthParse,
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

export const gapProperty = new ShorthandProperty<Style, Gap>({
  name: 'gap',
  cssName: 'gap',
  getter: function () {
    if (this.rowGap === this.columnGap) {
      return this.rowGap;
    }
    return `${this.rowGap} ${this.columnGap}`;
  },
  converter(value) {
    const properties: [CssProperty<any, any>, any][] = [];

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

// export const flexGrowProperty = new CssProperty<Style, number>({
//   name: 'flexGrow',
//   cssName: 'flex-grow',
//   defaultValue: 0,
//   valueConverter: parseFloat,
// });

export const flexShrinkProperty = new CssProperty<Style, number>({
  name: 'flexShrink',
  cssName: 'flex-shrink',
  defaultValue: 1,
  valueConverter: parseFloat,
});

export const displayProperty = new CssProperty<Style, Display>({
  name: 'display',
  cssName: 'display',
  defaultValue: 'block',
  valueChanged: (target, oldValue, newValue) => {
    const view = getViewStyle(target.viewRef);
    if (view && newValue) {
      view.display = newValue;
    } else {
      // Revert to old value if newValue is invalid
      view.view.style.display = oldValue;
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

export const maxWidthProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxWidth',
  cssName: 'max-width',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: NSLength.equals,
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
  equalityComparer: NSLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.maxHeight = newValue;
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

// export const flexDirectionProperty = new CssProperty<Style, FlexDirection>({
//   name: 'flexDirection',
//   cssName: 'flex-direction',
// });

// export const flexWrapProperty = new CssProperty<Style, FlexWrap>({
//   name: 'flexWrap',
//   cssName: 'flex-wrap',
//   defaultValue: 'no-wrap',
// });

const insetProperty = new ShorthandProperty<Style, LengthAuto>({
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
  equalityComparer: NSLength.equals,
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
  equalityComparer: NSLength.equals,
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
  equalityComparer: NSLength.equals,
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
  equalityComparer: NSLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.bottom = newValue;
    }
  },
});

export const flexBasisProperty = new CssProperty<Style, LengthAuto>({
  name: 'flexBasis',
  cssName: 'flex-basis',
  defaultValue: 'auto',
  equalityComparer: NSLength.equals,
  valueConverter: masonLengthParse,
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.flexBasis = newValue;
    }
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

export const alignItemsProperty = new CssProperty<Style, AlignItems>({
  name: 'alignItems',
  cssName: 'align-items',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.alignItems = newValue;
    }
  },
});

export const alignSelfProperty = new CssProperty<Style, AlignSelf>({
  name: 'alignSelf',
  cssName: 'align-self',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.alignSelf = newValue;
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
      view.alignContent = newValue as never;
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
      view.justifyItems = newValue;
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
      view.justifySelf = newValue;
    }
  },
});

export const justifyContentProperty = new CssProperty<Style, JustifyContent>({
  name: 'justifyContent',
  cssName: 'justify-content',
  defaultValue: 'normal',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      view.justifyContent = newValue as never;
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

function parseGridColumnOrRow(value: string) {
  if (value.trim() === 'auto') {
    return 'auto';
  } else {
    const split = value.split(/\s+/).filter((item) => item.trim().length !== 0);

    const length = split.length;

    if (length === 0) {
      return undefined;
    }

    const first = split[0];
    if (length === 1) {
      const parsedValue = Number(first);
      if (Number.isNaN(parsedValue)) {
        return undefined;
      }
      return first;
    }

    if (length === 2) {
      if (first === 'span') {
        const second = split[1];

        const parsedValue = Number(second);
        if (Number.isNaN(parsedValue)) {
          return undefined;
        }

        return `${first} ${second}`;
      }
    }

    //custom-ident unsupport atm

    return undefined;
  }
}

export const gridAreaProperty = new ShorthandProperty<Style, string>({
  name: 'gridArea',
  cssName: 'grid-area',
  getter: function () {
    return `${this.gridRowStart} / ${this.gridColumnStart} / ${this.gridRowEnd} / ${this.gridColumnEnd}`;
  },
  converter(value) {
    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      // grid-row-start / grid-column-start / grid-row-end / grid-column-end

      const length = values.length;
      if (length === 0) {
        return [];
      }

      if (length === 1) {
        const parsed = parseGridColumnOrRow(values[0]);
        return [
          [gridRowStartProperty, parsed],
          [gridRowEndProperty, parsed],
          [gridColumnStartProperty, parsed],
          [gridColumnEndProperty, parsed],
        ];
      }

      if (length === 2) {
        const row = parseGridColumnOrRow(values[0]);

        const column = parseGridColumnOrRow(values[1]);

        return [
          [gridRowStartProperty, row],
          [gridRowEndProperty, row],
          [gridColumnStartProperty, column],
          [gridColumnEndProperty, column],
        ];
      }

      if (length === 3) {
        const rowStart = parseGridColumnOrRow(values[0]);

        const rowEnd = parseGridColumnOrRow(values[2]);

        const columnStart = parseGridColumnOrRow(values[1]);
        return [
          [gridRowStartProperty, rowStart],
          [gridRowEndProperty, rowEnd],
          [gridColumnStartProperty, columnStart],
          [gridColumnEndProperty, columnStart],
        ];
      }

      if (length >= 4) {
        const rowStart = parseGridColumnOrRow(values[0]);

        const rowEnd = parseGridColumnOrRow(values[2]);

        const columnStart = parseGridColumnOrRow(values[1]);

        const columnEnd = parseGridColumnOrRow(values[3]);
        return [
          [gridRowStartProperty, rowStart],
          [gridRowEndProperty, rowEnd],
          [gridColumnStartProperty, columnStart],
          [gridColumnEndProperty, columnEnd],
        ];
      }
    }

    return [];
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

export const gridColumnProperty = new ShorthandProperty<Style, string>({
  name: 'gridColumn',
  cssName: 'grid-column',
  getter: function () {
    if (this.gridColumnStart === this.gridColumnEnd) {
      return this.gridColumnStart;
    }
    return `${this.gridColumnStart} / ${this.gridColumnEnd}`;
  },
  converter(value) {
    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return [];
      }

      if (length === 1) {
        const parsed = parseGridColumnOrRow(values[0]);
        return [
          [gridColumnStartProperty, parsed],
          [gridColumnEndProperty, parsed],
        ];
      }

      if (length > 1) {
        const start = values[0];
        const end = values[1];

        const parsedStart = parseGridColumnOrRow(start);
        const parsedEnd = parseGridColumnOrRow(end);

        return [
          [gridColumnStartProperty, parsedStart],
          [gridColumnEndProperty, parsedEnd],
        ];
      }
    }

    return [];
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

export const gridRowProperty = new ShorthandProperty<Style, string>({
  name: 'gridRow',
  cssName: 'grid-row',
  getter: function () {
    if (this.gridRowStart === this.gridRowEnd) {
      return this.gridRowStart;
    }
    return `${this.gridRowStart} / ${this.gridRowEnd}`;
  },
  converter(value) {
    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return [];
      }

      if (length === 1) {
        const parsed = parseGridColumnOrRow(values[0]);
        return [
          [gridRowStartProperty, parsed],
          [gridRowEndProperty, parsed],
        ];
      }

      if (length > 1) {
        const start = values[0];
        const end = values[1];

        const parsedStart = parseGridColumnOrRow(start);
        const parsedEnd = parseGridColumnOrRow(end);
        return [
          [gridRowStartProperty, parsedStart],
          [gridRowEndProperty, parsedEnd],
        ];
      }
    }

    return [];
  },
});

export const gridTemplateRowsProperty = new CssProperty<Style, Array<GridTemplates> | string>({
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

export const gridTemplateColumnsProperty = new CssProperty<Style, Array<GridTemplates> | string>({
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

// @ts-ignore
export const textWrapProperty = new Property<TextBase, 'nowrap' | 'wrap' | 'balance'>({
  name: 'textWrap',
  affectsLayout: true,
  defaultValue: 'nowrap',
  valueChanged(target: any, oldValue, newValue) {
    const view = target?.viewRef ? getViewStyle(target.viewRef) : target.view;
    if (view) {
      view.textWrap = newValue;
    }
  },
});

// @ts-ignore
export const textProperty = new Property<TextBase, string>({
  name: 'text',
  affectsLayout: true,
  defaultValue: '',
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
        view.view.style.boxSizing = oldValue;
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

export class ViewBase extends CustomLayoutView implements AddChildFromBuilder {
  readonly android: org.nativescript.mason.masonkit.View;
  readonly ios: MasonUIView;

  overflow: Overflow | `${Overflow} ${Overflow}`;

  gridGap: Gap;
  gap: Gap;
  gridArea: string;
  gridColumn: string;
  gridRow: string;

  inset: LengthAuto;
  padding: Length;
  margin: LengthAuto;
  border: Length;

  _children: any[] = [];
  [isMasonView_] = false;

  [isTextChild_] = false;
  [isText_] = false;

  constructor() {
    super();
  }

  forceStyleUpdate() {
    _forceStyleUpdate(this as any);
  }

  public eachLayoutChild(callback: (child: NSView, isLast: boolean) => void): void {
    let lastChild: View = null;

    this.eachChildView((cv) => {
      cv._eachLayoutView((lv) => {
        if (lastChild && !lastChild.isCollapsed) {
          callback(lastChild, false);
        }

        lastChild = lv;
      });

      return true;
    });

    if (lastChild && !lastChild.isCollapsed) {
      callback(lastChild, true);
    }
  }

  public eachChild(callback: (child: NSViewBase) => boolean) {
    for (const child of this._children) {
      callback(child);
    }
  }

  public eachChildView(callback: (child: NSView) => boolean): void {
    for (const view of this._children) {
      callback(view);
    }
  }

  _addChildFromBuilder(name: string, value: any): void {
    if (value instanceof NSView) {
      this.addChild(value);
    }
  }

  getChildrenCount() {
    return this._children.length;
  }

  get _childrenCount() {
    return this._children.length;
  }

  getChildAt(index: number) {
    return this._children[index];
  }

  getChildIndex(child: NSView) {
    return this._children.indexOf(child);
  }
  getChildById(id: string) {
    return getViewById(this as never, id);
  }

  addChild(child: any) {
    if (child instanceof NSView) {
      this._children.push(child);
      if (this[isText_]) {
        child[isTextChild_] = true;
      }
      this._addView(child);
    }
  }

  insertChild(child: any, atIndex: number) {
    if (child instanceof NSView) {
      this._children.splice(atIndex, 0, child);
      if (this[isText_]) {
        child[isTextChild_] = true;
      }
      this._addView(child, atIndex);
    }
  }

  removeChild(child: any) {
    const index = this._children.indexOf(child);
    if (index > -1) {
      this._children.splice(index, 1);
      this._removeView(child);
    }
  }

  removeChildren() {
    if (this._children.length === 0) {
      return;
    }
    for (const child of this._children) {
      child._isMasonChild = false;
      this._removeView(child);
    }
    this._children.splice(0);
  }

  get boxSizing(): BoxSizing {
    return this.style.boxSizing;
  }

  set boxSizing(value: BoxSizing) {
    this.style.boxSizing = value;
  }

  get display() {
    return this.style.display;
  }

  set display(value: Display) {
    this.style.display = value;
  }

  get overflowX() {
    return this.style.overflowX;
  }

  set overflowX(value: Overflow) {
    this.style.overflowX = value;
  }

  get overflowY() {
    return this.style.overflowY;
  }

  set overflowY(value: Overflow) {
    this.style.overflowY = value;
  }

  get scrollBarWidth() {
    return this.style.scrollBarWidth;
  }

  set scrollBarWidth(value: Length) {
    this.style.scrollBarWidth = value;
  }

  get position() {
    return this.style.position;
  }

  set position(value: Position) {
    this.style.position = value;
  }

  [flexWrapProperty.setNative](value) {
    // _setFlexWrap(value, this as any);
  }

  [flexDirectionProperty.setNative](value) {
    // _setFlexDirection(value, this as any);
  }

  [flexGrowProperty.setNative](value) {
    // _setFlexGrow(value, this as any);
  }

  [flexShrinkProperty.setNative](value) {
    //  _setFlexShrink(value, this as any);
  }

  [flexBasisProperty.setNative](value) {
    //  _setFlexBasis(value, this as any);
  }

  [alignItemsProperty.setNative](value) {
    //  _setAlignItems(value, this as any);
  }

  [alignSelfProperty.setNative](value) {
    // _setAlignSelf(value, this as any);
  }

  [alignContentProperty.setNative](value) {
    // _setAlignContent(value, this as any);
  }

  [justifyItemsProperty.setNative](value) {
    // _setJustifyItems(value, this as any);
  }

  [justifySelfProperty.setNative](value) {
    //  _setJustifySelf(value, this as any);
  }

  [justifyContentProperty.setNative](value) {
    //  _setJustifyContent(value, this as any);
  }

  [leftProperty.setNative](value) {
    //  _setLeft(value, this as any);
  }

  [rightProperty.setNative](value) {
    //  _setRight(value, this as any);
  }

  [bottomProperty.setNative](value) {
    // _setBottom(value, this as any);
  }

  [topProperty.setNative](value) {
    // _setTop(value, this as any);
  }

  [minWidthProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.minWidth = value;
    }
  }

  [minHeightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.minHeight = value;
    }
  }

  [heightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.height = value;
    }
  }

  [widthProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.width = value;
    }
  }

  set maxWidth(value: LengthAuto) {
    this.style.maxWidth = value;
  }

  get maxWidth(): LengthAuto {
    return this.style.maxWidth;
  }

  set maxHeight(value: LengthAuto) {
    this.style.maxHeight = value;
  }

  get maxHeight(): LengthAuto {
    return this.style.maxHeight;
  }

  [marginLeftProperty.setNative](value) {
    // _setMarginLeft(value, this as any);
  }

  [marginRightProperty.setNative](value) {
    // _setMarginRight(value, this as any);
  }

  [marginBottomProperty.setNative](value) {
    // _setMarginBottom(value, this as any);
  }

  [marginTopProperty.setNative](value) {
    // _setMarginTop(value, this as any);
  }

  [paddingLeftProperty.setNative](value) {
    // _setPaddingLeft(value, this as any);
  }
  [paddingRightProperty.setNative](value) {
    //  _setPaddingRight(value, this as any);
  }
  [paddingTopProperty.setNative](value) {
    // _setPaddingTop(value, this as any);
  }
  [paddingBottomProperty.setNative](value) {
    // _setPaddingBottom(value, this as any);
  }

  set rowGap(value: Length) {
    this.style.rowGap = value;
  }

  get rowGap(): Length {
    return this.style.rowGap;
  }

  set columnGap(value: Length) {
    this.style.columnGap = value;
  }

  get columnGap(): Length {
    return this.style.columnGap;
  }

  set gridColumnStart(value: string) {
    this.style.gridColumnStart = value;
  }

  get gridColumnStart(): string {
    return this.style.gridColumnStart;
  }

  set gridColumnEnd(value: string) {
    this.style.gridColumnEnd = value;
  }

  get gridColumnEnd(): string {
    return this.style.gridColumnEnd;
  }

  set gridRowStart(value: string) {
    this.style.gridRowStart = value;
  }

  get gridRowStart(): string {
    return this.style.gridRowStart;
  }

  set gridRowEnd(value: string) {
    this.style.gridRowEnd = value;
  }

  get gridRowEnd(): string {
    return this.style.gridRowEnd;
  }

  set gridTemplateRows(value: string) {
    this.style.gridTemplateRows = value;
  }

  get gridTemplateRows(): string {
    return this.style.gridTemplateRows;
  }

  set gridTemplateColumns(value: string) {
    this.style.gridTemplateColumns = value;
  }

  get gridTemplateColumns(): string {
    return this.style.gridTemplateColumns;
  }

  set gridAutoColumns(value: string) {
    this.style.gridAutoColumns = value;
  }

  get gridAutoColumns(): string {
    return this.style.gridAutoColumns;
  }

  set gridAutoRows(value: string) {
    this.style.gridAutoRows = value;
  }

  get gridAutoRows(): string {
    return this.style.gridAutoRows;
  }
}

export class TextBase extends ViewBase {
  text: string;
  textWrap: 'nowrap' | 'wrap' | 'balance';

  constructor() {
    super();
  }

  [fontSizeProperty.setNative](value: Length) {
    // @ts-ignore
    if (this._styleHelper) {
      //@ts-ignore
      this._styleHelper.fontSize = value;
    }
  }

  [fontWeightProperty.setNative](value: string) {
    // @ts-ignore
    if (this._styleHelper) {
      //@ts-ignore
      this._styleHelper.fontWeight = value;
    }
  }

  [fontStyleProperty.setNative](value: string) {
    // @ts-ignore
    if (this._styleHelper) {
      //@ts-ignore
      this._styleHelper.fontStyle = value;
    }
  }
}

textProperty.register(TextBase);
textWrapProperty.register(TextBase);

// @ts-ignore
export const srcProperty = new Property<ImageBase, string>({
  name: 'src',
  defaultValue: '',
});

export class ImageBase extends ViewBase {
  src: string;
}

srcProperty.register(ImageBase);

/**
 * Props are already defined in core flexbox layout,
 * overriding them breaks the core flexbox layout.
 */
// flexDirectionProperty.register(Style);
// flexWrapProperty.register(Style);
// flexGrowProperty.register(Style);
// flexShrinkProperty.register(Style);

paddingLeftProperty.overrideHandlers({
  name: 'paddingLeft',
  cssName: 'padding-left',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.paddingLeft = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        view.view.style.paddingLeft = oldValue as never;
      }
    }
  },
});

paddingTopProperty.overrideHandlers({
  name: 'paddingTop',
  cssName: 'padding-top',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.paddingTop = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        view.view.style.paddingTop = oldValue as never;
      }
    }
  },
});

paddingRightProperty.overrideHandlers({
  name: 'paddingRight',
  cssName: 'padding-right',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.paddingRight = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        view.view.style.paddingRight = oldValue as never;
      }
    }
  },
});

paddingBottomProperty.overrideHandlers({
  name: 'paddingBottom',
  cssName: 'padding-bottom',
  valueChanged(target, oldValue, newValue) {
    const view = getViewStyle(target.viewRef);
    if (view) {
      if (newValue) {
        view.paddingBottom = newValue as never;
      } else {
        // Revert to old value if newValue is invalid
        // @ts-ignore
        view.view.style.paddingBottom = oldValue as never;
      }
    }
  },
});

insetProperty.register(Style);

boxSizingProperty.register(Style);

alignItemsProperty.register(Style);
alignSelfProperty.register(Style);
justifyContentProperty.register(Style);

displayProperty.register(Style);
maxWidthProperty.register(Style);
maxHeightProperty.register(Style);
positionProperty.register(Style);

leftProperty.register(Style);
rightProperty.register(Style);
topProperty.register(Style);
bottomProperty.register(Style);
flexBasisProperty.register(Style);

rowGapProperty.register(Style);
columnGapProperty.register(Style);

gridRowGapProperty.register(Style);
gridColumnGapProperty.register(Style);
gapProperty.register(Style);

aspectRatioProperty.register(Style);

alignContentProperty.register(Style);
justifyItemsProperty.register(Style);
justifySelfProperty.register(Style);

gridAutoRowsProperty.register(Style);
gridAutoColumnsProperty.register(Style);
gridAutoFlowProperty.register(Style);

gridAreaProperty.register(Style);

gridColumnProperty.register(Style);
gridColumnStartProperty.register(Style);
gridColumnEndProperty.register(Style);

gridRowProperty.register(Style);
gridRowStartProperty.register(Style);
gridRowEndProperty.register(Style);

gridTemplateRowsProperty.register(Style);

gridTemplateColumnsProperty.register(Style);

overflowProperty.register(Style);
overflowXProperty.register(Style);
overflowYProperty.register(Style);
scrollBarWidthProperty.register(Style);

flexFlowProperty.register(Style);
flexProperty.register(Style);

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

function convertToPaddings(value: string | CoreTypes.LengthType): [CssProperty<Style, CoreTypes.LengthType>, CoreTypes.LengthType][] {
  if (typeof value === 'string' && value !== 'auto') {
    const thickness = parseShorthandPositioning(value);

    return [
      [paddingTopProperty, CoreLength.parse(thickness.top)],
      [paddingRightProperty, CoreLength.parse(thickness.right)],
      [paddingBottomProperty, CoreLength.parse(thickness.bottom)],
      [paddingLeftProperty, CoreLength.parse(thickness.left)],
    ];
  } else {
    return [
      [paddingTopProperty, value],
      [paddingRightProperty, value],
      [paddingBottomProperty, value],
      [paddingLeftProperty, value],
    ];
  }
}

paddingProperty.register(Style);
paddingLeftProperty.register(Style);
paddingRightProperty.register(Style);
paddingTopProperty.register(Style);
paddingBottomProperty.register(Style);
