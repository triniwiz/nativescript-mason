import { AddChildFromBuilder, CSSType, CoreTypes, CssProperty, CustomLayoutView, Length as NSLength, ShorthandProperty, Style, View, ViewBase, borderBottomWidthProperty, borderLeftWidthProperty, borderRightWidthProperty, borderTopWidthProperty, getViewById, heightProperty, marginBottomProperty, marginLeftProperty, marginRightProperty, marginTopProperty, minHeightProperty, minWidthProperty, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, widthProperty } from '@nativescript/core';
import { alignItemsProperty, alignSelfProperty, flexDirectionProperty, flexGrowProperty, flexWrapProperty, justifyContentProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { AlignContent, AlignSelf, Display, Gap, GridAutoFlow, JustifyItems, JustifySelf, Length, LengthAuto, Overflow, Position } from '.';
import {
  _forceStyleUpdate,
  _getAlignContent,
  _getAlignItems,
  _getAlignSelf,
  _getAspectRatio,
  _getColumnGap,
  _getDisplay,
  _getFlexBasis,
  _getFlexDirection,
  _getFlexGrow,
  _getFlexShrink,
  _getFlexWrap,
  _getHeight,
  _getJustifyContent,
  _getJustifyItems,
  _getJustifySelf,
  _getOverflow,
  _getOverflowX,
  _getOverflowY,
  _getPosition,
  _getRowGap,
  _getWidth,
  _parseGridTemplates,
  _setAlignContent,
  _setAlignItems,
  _setAlignSelf,
  _setAspectRatio,
  _setBorderBottom,
  _setBorderLeft,
  _setBorderRight,
  _setBorderTop,
  _setBottom,
  _setColumnGap,
  _setDisplay,
  _setFlexBasis,
  _setFlexDirection,
  _setFlexGrow,
  _setFlexShrink,
  _setFlexWrap,
  _setGridAutoColumns,
  _setGridAutoFlow,
  _setGridAutoRows,
  _setGridColumnEnd,
  _setGridColumnStart,
  _setGridRowEnd,
  _setGridRowStart,
  _setGridTemplateColumns,
  _setGridTemplateRows,
  _setHeight,
  _setJustifyContent,
  _setJustifyItems,
  _setJustifySelf,
  _setLeft,
  _setMarginBottom,
  _setMarginLeft,
  _setMarginRight,
  _setMarginTop,
  _setMaxHeight,
  _setMaxWidth,
  _setMinHeight,
  _setMinWidth,
  _setOverflow,
  _setOverflowX,
  _setOverflowY,
  _setPaddingBottom,
  _setPaddingLeft,
  _setPaddingRight,
  _setPaddingTop,
  _setPosition,
  _setRight,
  _setRowGap,
  _setScrollbarWidth,
  _setTop,
  _setWidth,
  getScrollbarWidth,
} from './helpers';

// let widgetMasonView: typeof org.nativescript.mason.masonkit.View;

// function ensureNativeTypes() {
// 	if (!widgetMasonView) {
// 		widgetMasonView = org.nativescript.mason.masonkit.View;
// 	}
// }

// function makeNativeSetter<T>(setter: (lp: org.nativescript.widgets.FlexboxLayout.LayoutParams, value: T) => void) {
// 	return function (this: View, value: T) {
// 		ensureNativeTypes();
// 		const nativeView: android.view.View = this.nativeViewProtected;
// 		const lp = nativeView.getLayoutParams() || new widgetLayoutParams();
// 		if (lp instanceof widgetLayoutParams) {
// 			setter(lp, value);
// 			nativeView.setLayoutParams(lp);
// 		}
// 	};
// }

export function applyMixins(
  derivedCtor: any,
  baseCtors: any[],
  options?: {
    after?: boolean;
    override?: boolean;
    overrideIfExists?: string;
    omit?: (string | symbol)[];
  }
) {
  const omits = options && options.omit ? options.omit : [];
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      if (omits.indexOf(name) !== -1) {
        return;
      }
      const descriptor = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);

      if (name === 'constructor') return;
      if (descriptor && (descriptor.get || descriptor.set)) {
        Object.defineProperty(derivedCtor.prototype, name, descriptor);
      } else {
        const oldImpl = derivedCtor.prototype[name];

        if (!oldImpl) {
          derivedCtor.prototype[name] = baseCtor.prototype[name];
        } else {
          derivedCtor.prototype[name] = function (...args) {
            if (options) {
              if (options.override) {
                return baseCtor.prototype[name].apply(this, args);
              } else if (options.after) {
                return baseCtor.prototype[name].apply(this, args);
              } else if (options.overrideIfExists) {
                if (this[options.overrideIfExists]) {
                  return baseCtor.prototype[name].apply(this, args);
                }
                return oldImpl.apply(this, args);
              } else {
                baseCtor.prototype[name].apply(this, args);
                return oldImpl.apply(this, args);
              }
            } else {
              baseCtor.prototype[name].apply(this, args);
              return oldImpl.apply(this, args);
            }
          };
        }
      }
    });
    Object.getOwnPropertySymbols(baseCtor.prototype).forEach((symbol) => {
      if (omits.indexOf(symbol) !== -1) {
        return;
      }
      const oldImpl: Function = derivedCtor.prototype[symbol];
      if (!oldImpl) {
        derivedCtor.prototype[symbol] = baseCtor.prototype[symbol];
      } else {
        derivedCtor.prototype[symbol] = function (...args) {
          if (options) {
            if (options.override) {
              return baseCtor.prototype[symbol].apply(this, args);
            }
            if (options.overrideIfExists) {
              if (this[options.overrideIfExists]) {
                return baseCtor.prototype[symbol].apply(this, args);
              }
              return oldImpl.apply(this, args);
            } else if (options.after) {
              oldImpl.apply(this, args);
              return baseCtor.prototype[symbol].apply(this, args);
            } else {
              baseCtor.prototype[symbol].apply(this, args);
              return oldImpl.apply(this, args);
            }
          } else {
            baseCtor.prototype[symbol].apply(this, args);
            return oldImpl.apply(this, args);
          }
        };
      }
    });
  });
}

let mixinInstalled = false;
export function overrideViewBase() {
  const NSView = require('@nativescript/core').View;
  class ViewOverride extends View {
    get _isMasonViewOrChild() {
      return this._isMasonView || this._isMasonChild;
    }

    _isMasonView = false;
    _isMasonChild = false;

    /* Short Props */

    set gridRowGap(value) {
      this.style.gridRowGap = value;
    }

    get gridRowGap() {
      return this.style.gridRowGap;
    }

    set gridGap(value) {
      this.style.gridGap = value;
    }

    get gridGap() {
      return this.style.gridGap;
    }

    set gap(value) {
      this.style.gap = value;
    }

    get gap() {
      return this.style.gap;
    }

    set gridArea(value) {
      this.style.gridArea = value;
    }

    get gridArea() {
      return this.style.gridArea;
    }

    set gridColumn(value) {
      this.style.gridColumn = value;
    }

    get gridColumn() {
      return this.style.gridColumn;
    }

    set gridRow(value) {
      this.style.gridRow = value;
    }

    get gridRow() {
      return this.style.gridColumn;
    }

    /* Short Props */

    get display(): Display {
      return _getDisplay(this as any);
    }

    set display(value) {
      this.style.display = value as any;
    }

    [displayProperty.setNative](value) {
      _setDisplay(value, this as any);
    }

    set position(value) {
      this.style.position = value;
    }

    get position(): Position {
      return _getPosition(this as any);
    }

    [positionProperty.setNative](value) {
      _setPosition(value, this as any);
    }

    set flexDirection(value) {
      this.style.flexDirection = value;
    }

    get flexDirection() {
      return _getFlexDirection(this as any);
    }

    [flexDirectionProperty.setNative](value) {
      _setFlexDirection(value, this as any);
    }

    set flexWrap(value) {
      this.style.flexWrap = value as any;
    }

    [flexWrapProperty.setNative](value) {
      _setFlexWrap(value, this as any);
    }

    get flexWrap() {
      return _getFlexWrap(this as any);
    }

    set alignItems(value) {
      this.style.alignItems = value as any;
    }

    get alignItems() {
      return _getAlignItems(this as any);
    }

    [alignItemsProperty.setNative](value) {
      _setAlignItems(value, this as any);
    }

    //@ts-ignore
    set alignSelf(value: AlignSelf) {
      this.style.alignSelf = value as any;
    }

    //@ts-ignore
    get alignSelf() {
      return _getAlignSelf(this as any);
    }

    [alignSelfProperty.setNative](value) {
      _setAlignSelf(value, this as any);
    }

    set alignContent(value) {
      this.style.alignContent = value as any;
    }

    [alignContentProperty.setNative](value) {
      _setAlignContent(value, this as any);
    }

    get alignContent() {
      return _getAlignContent(this as any);
    }

    set justifyItems(value) {
      this.style.justifyItems = value as any;
    }

    [justifyItemsProperty.setNative](value) {
      _setJustifyItems(value, this as any);
    }

    get justifyItems() {
      return _getJustifyItems(this as any);
    }

    set justifySelf(value) {
      this.style.justifySelf = value as any;
    }

    [justifySelfProperty.setNative](value) {
      _setJustifySelf(value, this as any);
    }

    get justifySelf() {
      return _getJustifySelf(this as any);
    }

    set justifyContent(value) {
      this.style.justifyContent = value as any;
    }

    [justifyContentProperty.setNative](value) {
      _setJustifyContent(value, this as any);
    }

    get justifyContent() {
      return _getJustifyContent(this as any);
    }

    //@ts-ignore
    set left(value) {
      this.style.left = value;
    }

    get left() {
      return this.style.left;
    }

    [leftProperty.setNative](value) {
      _setLeft(value, this as any);
    }

    //@ts-ignore
    set right(value) {
      this.style.right = value;
    }

    get right() {
      return this.style.right;
    }

    [rightProperty.setNative](value) {
      _setRight(value, this as any);
    }

    //@ts-ignore
    set top(value) {
      this.style.top = value;
    }

    get top() {
      return this.style.top;
    }

    [topProperty.setNative](value) {
      _setTop(value, this as any);
    }

    //@ts-ignore
    set bottom(value) {
      this.style.bottom = value;
    }

    get bottom() {
      return this.style.bottom;
    }

    [bottomProperty.setNative](value) {
      _setBottom(value, this as any);
    }

    [marginLeftProperty.setNative](value) {
      _setMarginLeft(value, this as any);
    }

    [marginRightProperty.setNative](value) {
      _setMarginRight(value, this as any);
    }

    [marginTopProperty.setNative](value) {
      _setMarginTop(value, this as any);
    }

    [marginBottomProperty.setNative](value) {
      _setMarginBottom(value, this as any);
    }

    [borderLeftWidthProperty.setNative](value) {
      _setBorderLeft(value, this as any);
    }

    [borderRightWidthProperty.setNative](value) {
      _setBorderRight(value, this as any);
    }

    [borderTopWidthProperty.setNative](value) {
      _setBorderTop(value, this as any);
    }

    [borderBottomWidthProperty.setNative](value) {
      _setBorderBottom(value, this as any);
    }

    //@ts-ignore
    get flexGrow() {
      return _getFlexGrow(this as any);
    }

    set flexGrow(value) {
      this.style.flexGrow = value;
    }

    [flexGrowProperty.setNative](value) {
      _setFlexGrow(value, this as any);
    }

    //@ts-ignore
    get flexShrink() {
      return _getFlexShrink(this as any);
    }

    set flexShrink(value) {
      this.style.flexShrink = value;
    }

    [flexShrinkProperty.setNative](value) {
      _setFlexShrink(value, this as any);
    }

    //@ts-ignore
    get flexBasis() {
      return _getFlexBasis(this as any);
    }

    [flexBasisProperty.setNative](value) {
      _setFlexBasis(value, this as any);
    }

    /* faster setter/getter
    //@ts-ignore
    get gap() {
      return _getGap(this as any);
    }

    set gap(value) {
      this.style.gap = value;
      _setGap(value, this as any);
    }

    */

    set rowGap(value) {
      this.style.rowGap = value;
    }

    get rowGap() {
      return _getRowGap(this as any);
    }

    [rowGapProperty.setNative](value) {
      _setRowGap(value, this as any);
    }

    set columnGap(value) {
      this.style.columnGap = value;
    }

    get columnGap() {
      return _getColumnGap(this as any);
    }

    [columnGapProperty.setNative](value) {
      _setColumnGap(value, this as any);
    }

    get aspectRatio() {
      return _getAspectRatio(this as any);
    }

    [aspectRatioProperty.setNative](value) {
      _setAspectRatio(value, this as any);
    }

    [paddingLeftProperty.setNative](value) {
      _setPaddingLeft(value, this as any);
    }

    [paddingTopProperty.setNative](value) {
      _setPaddingTop(value, this as any);
    }

    [paddingRightProperty.setNative](value) {
      _setPaddingRight(value, this as any);
    }

    [paddingBottomProperty.setNative](value) {
      _setPaddingBottom(value, this as any);
    }

    //@ts-ignore
    set minWidth(value) {
      this.style.minWidth = value;
    }

    [minWidthProperty.setNative](value) {
      _setMinWidth(value, this as any);
    }

    //@ts-ignore
    set minHeight(value) {
      this.style.minHeight = value;
    }

    [minHeightProperty.setNative](value) {
      _setMinHeight(value, this as any);
    }

    //@ts-ignore
    set width(value) {
      this.style.width = value;
    }

    [widthProperty.setNative](value) {
      _setWidth(value, this as any);
    }

    get width() {
      return _getWidth(this as any);
    }

    //@ts-ignore
    set height(value) {
      this.style.height = value;
    }

    [heightProperty.setNative](value) {
      _setHeight(value, this as any);
    }

    //@ts-ignore
    get height() {
      return _getHeight(this as any);
    }

    set maxWidth(value) {
      this.style.maxWidth = value;
    }

    [maxWidthProperty.setNative](value) {
      _setMaxWidth(value, this as any);
    }

    //@ts-ignore
    set maxHeight(value) {
      this.style.maxHeight = value;
    }

    [maxHeightProperty.setNative](value) {
      _setMaxHeight(value, this as any);
    }

    //@ts-ignore
    set gridAutoRows(value) {
      this.style.gridAutoRows = value;
    }

    [gridAutoRowsProperty.setNative](value) {
      _setGridAutoRows(value, this as any);
    }

    //@ts-ignore
    get gridAutoRows() {
      return this.style.gridAutoRows;
    }

    //@ts-ignore
    set gridAutoColumns(value) {
      this.style.gridAutoColumns = value;
    }

    [gridAutoColumnsProperty.setNative](value) {
      _setGridAutoColumns(value, this as any);
    }

    get gridAutoColumns() {
      return this.style.gridAutoColumns;
    }

    set gridAutoFlow(value) {
      this.style.gridAutoFlow = value;
    }

    [gridAutoFlowProperty.setNative](value) {
      _setGridAutoFlow(value, this as any);
    }

    get gridAutoFlow() {
      return this.style.gridAutoFlow;
    }

    set gridColumnStart(value) {
      this.style.gridColumnStart = value;
    }

    [gridColumnStartProperty.setNative](value) {
      _setGridColumnStart(value, this as any);
    }

    get gridColumnStart() {
      return this.style.gridColumnStart;
    }

    set gridColumnEnd(value) {
      this.style.gridColumnEnd = value;
    }

    [gridColumnEndProperty.setNative](value) {
      _setGridColumnEnd(value, this as any);
    }

    get gridColumnEnd() {
      return this.style.gridColumnEnd;
    }

    set gridRowStart(value) {
      this.style.gridRowStart = value;
    }

    [gridRowStartProperty.setNative](value) {
      _setGridRowStart(value, this as any);
    }

    get gridRowStart() {
      return this.style.gridRowStart;
    }

    set gridRowEnd(value) {
      this.style.gridRowEnd = value;
    }

    [gridRowEndProperty.setNative](value) {
      _setGridRowEnd(value, this as any);
    }

    get gridRowEnd() {
      return this.style.gridRowEnd;
    }

    set gridTemplateRows(value) {
      this.style.gridTemplateRows = value;
    }

    [gridTemplateRowsProperty.setNative](value) {
      const templates = _parseGridTemplates(value);
      if (templates) {
        _setGridTemplateRows(templates, this as any);
      }
    }

    set gridTemplateColumns(value) {
      this.style.gridTemplateColumns = value;
    }

    [gridTemplateColumnsProperty.setNative](value) {
      const templates = _parseGridTemplates(value);
      if (templates) {
        _setGridTemplateColumns(templates, this as any);
      }
    }

    get scrollBarWidth() {
      return getScrollbarWidth(this as any);
    }

    set scrollBarWidth(value: number | CoreTypes.LengthType) {
      this.style.scrollBarWidth = value;
    }

    [scrollBarWidthProperty.setNative](value) {
      _setScrollbarWidth(value, this as any);
    }

    get overflow() {
      return _getOverflow(this as any);
    }

    set overflow(value: Overflow) {
      this.style.overflow = value;
    }

    [overflowProperty.setNative](value) {
      _setOverflow(value, this as any);
    }

    get overflowX() {
      return _getOverflowX(this as any);
    }

    set overflowX(value: Overflow) {
      this.style.overflowX = value;
    }

    [overflowXProperty.setNative](value) {
      _setOverflowX(value, this as any);
    }

    get overflowY() {
      return _getOverflowY(this as any);
    }

    set overflowY(value: Overflow) {
      this.style.overflowY = value;
    }

    [overflowYProperty.setNative](value) {
      _setOverflowY(value, this as any);
    }
  }
  applyMixins(NSView, [ViewOverride], { overrideIfExists: '_isMasonViewOrChild' });
}

export function installMixins() {
  if (!mixinInstalled) {
    mixinInstalled = true;
    overrideViewBase();
  }
}

const emptyArray = new Array();

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
        return 'hidden';
      case 2:
        return 'scroll';
    }
  }

  switch (value) {
    case 'visible':
    case 'hidden':
    case 'scroll':
      return value;
    default:
      return 'visible';
  }
}

export const overflowProperty = new CssProperty<Style, Overflow>({
  name: 'overflow',
  cssName: 'overflow',
  defaultValue: 'visible',
  valueConverter: overflowConverter,
});

export const overflowXProperty = new CssProperty<Style, Overflow>({
  name: 'overflowX',
  cssName: 'overflow-x',
  defaultValue: 'visible',
  valueConverter: overflowConverter,
});

export const overflowYProperty = new CssProperty<Style, Overflow>({
  name: 'overflow',
  cssName: 'overflow-y',
  defaultValue: 'visible',
  valueConverter: overflowConverter,
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
  defaultValue: 'flex',
  valueConverter(value) {
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
      }
    }

    switch (value) {
      case 'none':
      case 'flex':
      case 'grid':
      case 'block':
        return value;
      default:
        // todo throw???
        return 'flex';
    }
  },
});

export const maxWidthProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxWidth',
  cssName: 'max-width',
  defaultValue: 'auto',
  equalityComparer: NSLength.equals,
});

export const maxHeightProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxHeight',
  cssName: 'max-height',
  defaultValue: 'auto',
  equalityComparer: NSLength.equals,
});

export const positionProperty = new CssProperty<Style, Position>({
  name: 'position',
  cssName: 'position',
  defaultValue: 'relative',
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

export const leftProperty = new CssProperty<Style, LengthAuto>({
  name: 'left',
  cssName: 'left',
  defaultValue: 'auto',
  equalityComparer: NSLength.equals,
});

export const rightProperty = new CssProperty<Style, LengthAuto>({
  name: 'right',
  cssName: 'right',
  defaultValue: 'auto',
  equalityComparer: NSLength.equals,
});

export const topProperty = new CssProperty<Style, LengthAuto>({
  name: 'top',
  cssName: 'top',
  defaultValue: 'auto',
  equalityComparer: NSLength.equals,
});

export const bottomProperty = new CssProperty<Style, LengthAuto>({
  name: 'bottom',
  cssName: 'bottom',
  defaultValue: 'auto',
  equalityComparer: NSLength.equals,
});

export const flexBasisProperty = new CssProperty<Style, LengthAuto>({
  name: 'flexBasis',
  cssName: 'flex-basis',
  defaultValue: 'auto',
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

export const rowGapProperty = new CssProperty<Style, Length>({
  name: 'rowGap',
  cssName: 'row-gap',
  defaultValue: 0,
});

export const columnGapProperty = new CssProperty<Style, Length>({
  name: 'columnGap',
  cssName: 'column-gap',
  defaultValue: 0,
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
  converter(value) {
    if (typeof value === 'string') {
      const values = value.split(/\s+/).filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return emptyArray;
      }

      if (length === 1) {
        const row = values[0];
        return [
          [rowGapProperty, row],
          [columnGapProperty, row],
        ];
      }

      if (length > 1) {
        const row = values[0];
        const column = values[1];

        return [
          [rowGapProperty, row],
          [columnGapProperty, column],
        ];
      }
    }

    return emptyArray;
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
    if (typeof value === 'string') {
      const values = value.split(/\s+/).filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return emptyArray;
      }

      if (length === 1) {
        const row = values[0];
        return [
          [rowGapProperty, row],
          [columnGapProperty, row],
        ];
      }

      if (length > 1) {
        const row = values[0];
        const column = values[1];
        return [
          [rowGapProperty, row],
          [columnGapProperty, column],
        ];
      }
    }

    return emptyArray;
  },
});

export const aspectRatioProperty = new CssProperty<Style, number>({
  name: 'aspectRatio',
  cssName: 'aspect-ratio',
  defaultValue: Number.NaN,
});

// export const alignItemsProperty = new CssProperty<Style, AlignItems>({
//   name: 'alignItems',
//   cssName: 'align-items',
//   defaultValue: 'normal',
// });

// export const alignSelfProperty = new CssProperty<Style, AlignSelf>({
//   name: 'alignSelf',
//   cssName: 'align-self',
//   defaultValue: 'normal',
// });

export const alignContentProperty = new CssProperty<Style, AlignContent>({
  name: 'alignContent',
  cssName: 'align-content',
  defaultValue: 'normal',
});

export const justifyItemsProperty = new CssProperty<Style, JustifyItems>({
  name: 'justifyItems',
  cssName: 'justify-items',
  defaultValue: 'normal',
});

export const justifySelfProperty = new CssProperty<Style, JustifySelf>({
  name: 'justifySelf',
  cssName: 'justify-self',
  defaultValue: 'normal',
});

// export const justifyContentProperty = new CssProperty<Style, JustifyContent>({
//   name: 'justifyContent',
//   cssName: 'justify-content',
//   defaultValue: 'normal',
// });

export const gridAutoRowsProperty = new CssProperty<Style, string>({
  name: 'gridAutoRows',
  cssName: 'grid-auto-rows',
  defaultValue: '',
});

export const gridAutoColumnsProperty = new CssProperty<Style, string>({
  name: 'gridAutoColumns',
  cssName: 'grid-auto-columns',
  defaultValue: '',
});

export const gridAutoFlowProperty = new CssProperty<Style, GridAutoFlow>({
  name: 'gridAutoFlow',
  cssName: 'grid-auto-flow',
  defaultValue: 'row',
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
        return emptyArray;
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

    return emptyArray;
  },
});

export const gridColumnStartProperty = new CssProperty<Style, string>({
  name: 'gridColumnStart',
  cssName: 'grid-column-start',
  defaultValue: 'auto',
});

export const gridColumnEndProperty = new CssProperty<Style, string>({
  name: 'gridColumnEnd',
  cssName: 'grid-column-end',
  defaultValue: 'auto',
});

export const gridColumnProperty = new ShorthandProperty<Style, string>({
  name: 'gridColumn',
  cssName: 'grid-column',
  getter: function () {
    if (this.gridColumnStart === this.gridColumnEnd) {
      return this.gridColumnStart;
    }
    return `${this.gridColumnStart} / ${this.gridColumnStart}`;
  },
  converter(value) {
    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return emptyArray;
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

    return emptyArray;
  },
});

export const gridRowStartProperty = new CssProperty<Style, string>({
  name: 'gridRowStart',
  cssName: 'grid-row-start',
  defaultValue: 'auto',
});

export const gridRowEndProperty = new CssProperty<Style, string>({
  name: 'gridRowEnd',
  cssName: 'grid-row-end',
  defaultValue: 'auto',
});

export const gridRowProperty = new ShorthandProperty<Style, string>({
  name: 'gridRow',
  cssName: 'grid-row',
  getter: function () {
    if (this.gridRowStart === this.gridRowEnd) {
      return this.gridRowStart;
    }
    return `${this.gridRowStart} / ${this.gridRowStart}`;
  },
  converter(value) {
    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return emptyArray;
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

    return emptyArray;
  },
});

export const gridTemplateRowsProperty = new CssProperty<Style, string>({
  name: 'gridTemplateRows',
  cssName: 'grid-template-rows',
  defaultValue: '',
});

export const gridTemplateColumnsProperty = new CssProperty<Style, string>({
  name: 'gridTemplateColumns',
  cssName: 'grid-template-columns',
  defaultValue: '',
});

@CSSType('TSCView')
export class TSCViewBase extends CustomLayoutView implements AddChildFromBuilder {
  android: org.nativescript.mason.masonkit.View;
  ios: UIView;

  gridGap: Gap;
  gap: Gap;
  gridArea: string;
  gridColumn: string;
  gridRow: string;

  _children: any[] = [];
  _isMasonView = false;
  _isMasonChild = false;

  constructor() {
    super();
    this._isMasonView = true;
  }

  forceStyleUpdate() {
    _forceStyleUpdate(this as any);
  }

  public eachLayoutChild(callback: (child: View, isLast: boolean) => void): void {
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

  public eachChild(callback: (child: ViewBase) => boolean) {
    this._children.forEach((child) => {
      callback(child);
    });
  }

  public eachChildView(callback: (child: View) => boolean): void {
    this._children.forEach((view, key) => {
      callback(view as any);
    });
  }

  _addChildFromBuilder(name: string, value: any): void {
    this._children.push(value);
    value._isMasonChild = true;
    this._addView(value);
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

  getChildIndex(child: View) {
    return this._children.indexOf(child);
  }
  getChildById(id: string) {
    return getViewById(this, id);
  }

  addChild(child: View) {
    this._children.push(child);
    this._addView(child);
  }

  insertChild(child: View, atIndex: number) {
    this._children.splice(atIndex, 0, child);
    this._addView(child, atIndex);
  }

  removeChild(child: View) {
    const index = this._children.indexOf(child);
    this._children.splice(index, 1);
    this._removeView(child);
  }

  removeChildren() {
    while (this.getChildrenCount() !== 0) {
      this.removeChild(this._children[this.getChildrenCount() - 1]);
    }
  }
}

/**
 * Props are already defined in core flexbox layout,
 * overriding them breaks the core flexbox layout.
 */
// flexDirectionProperty.register(Style);
// flexWrapProperty.register(Style);
// flexGrowProperty.register(Style);
// flexShrinkProperty.register(Style);
// alignItemsProperty.register(Style);
// alignSelfProperty.register(Style);
// justifyContentProperty.register(Style);

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

gridGapProperty.register(Style);

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

installMixins();
