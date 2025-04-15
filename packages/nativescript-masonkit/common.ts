/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AddChildFromBuilder, CSSType, CssProperty, CustomLayoutView, Length as NSLength, ShorthandProperty, Style, View as NSView, ViewBase as NSViewBase, getViewById, unsetValue, Property, colorProperty, widthProperty, heightProperty, View } from '@nativescript/core';
import { AlignContent, AlignSelf, Display, Gap, GridAutoFlow, JustifyItems, JustifySelf, Length, LengthAuto, Overflow, Position, AlignItems, JustifyContent } from '.';
import { _forceStyleUpdate, _setAlignContent, _setDisplay, _setFlexDirection, _setHeight, _setJustifyContent, _setWidth } from './helpers';
import { flexDirectionProperty, flexGrowProperty, flexWrapProperty } from '@nativescript/core/ui/layouts/flexbox-layout';

export const native_ = Symbol('[[native]]');
export const style_ = Symbol('[[style]]');

export interface MasonChild extends ViewBase {
  _isMasonChild: boolean;
  _masonParent: ViewBase;
  _hasNativeView: boolean;
}

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
  defaultValue: 'block',
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
        return 'block';
    }
  },
});

export const maxWidthProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxWidth',
  cssName: 'max-width',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: NSLength.equals,
});

export const maxHeightProperty = new CssProperty<Style, LengthAuto>({
  name: 'maxHeight',
  cssName: 'max-height',
  defaultValue: 'auto',
  // @ts-ignore
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
  // @ts-ignore
  equalityComparer: NSLength.equals,
});

export const rightProperty = new CssProperty<Style, LengthAuto>({
  name: 'right',
  cssName: 'right',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: NSLength.equals,
});

export const topProperty = new CssProperty<Style, LengthAuto>({
  name: 'top',
  cssName: 'top',
  defaultValue: 'auto',
  // @ts-ignore
  equalityComparer: NSLength.equals,
});

export const bottomProperty = new CssProperty<Style, LengthAuto>({
  name: 'bottom',
  cssName: 'bottom',
  defaultValue: 'auto',
  // @ts-ignore
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
  converter(value): any[] {
    if (typeof value === 'string') {
      const values = value.split(/\s+/).filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return [];
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

    return [];
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
        return [];
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

    return [];
  },
});

export const aspectRatioProperty = new CssProperty<Style, number>({
  name: 'aspectRatio',
  cssName: 'aspect-ratio',
  defaultValue: Number.NaN,
});

export const alignItemsProperty = new CssProperty<Style, AlignItems>({
  name: 'alignItems',
  cssName: 'align-items',
  defaultValue: 'normal',
});

export const alignSelfProperty = new CssProperty<Style, AlignSelf>({
  name: 'alignSelf',
  cssName: 'align-self',
  defaultValue: 'normal',
});

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

export const justifyContentProperty = new CssProperty<Style, JustifyContent>({
  name: 'justifyContent',
  cssName: 'justify-content',
  defaultValue: 'normal',
});

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

export const BigIntZero = BigInt(0);

export const style = Symbol('[[style]]');
export const node = Symbol('[[node]]');
export const mason = Symbol('[[mason]]');

export const textProperty = new Property<TextBase, string>({
  name: 'text',
  affectsLayout: true,
  defaultValue: '',
});

@CSSType('View')
export class ViewBase extends CustomLayoutView implements AddChildFromBuilder {
  readonly android: org.nativescript.mason.masonkit.View;
  readonly ios: UIView;
  gridGap: Gap;
  gap: Gap;
  gridArea: string;
  gridColumn: string;
  gridRow: string;
  display: Display;
  position: Position;

  _children: any[] = [];
  _isMasonView = false;
  _isMasonChild = false;

  [node] = BigIntZero;
  [mason] = BigIntZero;

  constructor() {
    super();
    this._isMasonView = true;
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
    return getViewById(this, id);
  }

  addChild(child: any) {
    this._children.push(child);
    this._addView(child);
  }

  insertChild(child: any, atIndex: number) {
    this._children.splice(atIndex, 0, child);
    this._addView(child, atIndex);
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
  [displayProperty.setNative](value) {
    _setDisplay(value, this as any);
  }

  [flexDirectionProperty.setNative](value) {
    _setFlexDirection(value, this as any);
  }

  [widthProperty.setNative](value) {
    _setWidth(value, this as any);
  }

  [heightProperty.setNative](value) {
    _setHeight(value, this as any);
  }
  [alignContentProperty.setNative](value) {
    _setAlignContent(value, this as any);
  }
  [justifyContentProperty.setNative](value) {
    _setJustifyContent(value, this as any);
  }
}

@CSSType('Text')
export class TextBase extends ViewBase {
  constructor() {
    super();
  }
}

textProperty.register(TextBase);

/**
 * Props are already defined in core flexbox layout,
 * overriding them breaks the core flexbox layout.
 */
// flexDirectionProperty.register(Style);
// flexWrapProperty.register(Style);
// flexGrowProperty.register(Style);
// flexShrinkProperty.register(Style);

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

flexFlowProperty.register(Style);
flexProperty.register(Style);
