import { View, AddChildFromBuilder, ViewBase, CssProperty, Style, Length as NSLength, ShorthandProperty, CSSType } from '@nativescript/core';
import { Display, FlexDirection, FlexWrap, Gap, Length, Position, AlignContent, AlignItems, AlignSelf, JustifyContent, JustifyItems, JustifySelf, GridAutoFlow, LengthAuto } from '.';

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
      }
    }

    switch (value) {
      case 'none':
      case 'flex':
      case 'grid':
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

export const flexDirectionProperty = new CssProperty<Style, FlexDirection>({
  name: 'flexDirection',
  cssName: 'flex-direction',
});

export const flexWrapProperty = new CssProperty<Style, FlexWrap>({
  name: 'flexWrap',
  cssName: 'flex-wrap',
});

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

        properties.push([gridColumnStartProperty, row]);
        properties.push([gridColumnEndProperty, column]);
      }
    }

    return properties;
  },
});

export const aspectRatioProperty = new CssProperty<Style, number>({
  name: 'aspectRatio',
  cssName: 'aspect-ratio',
  defaultValue: undefined,
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
    const properties: [CssProperty<any, any>, any][] = [];

    console.log('gridArea', value);
    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      // grid-row-start / grid-column-start / grid-row-end / grid-column-end

      const length = values.length;
      if (length === 0) {
        return properties;
      }

      if (length === 1) {
        const parsed = parseGridColumnOrRow(values[0]);
        properties.push([gridRowStartProperty, parsed]);
        properties.push([gridRowEndProperty, parsed]);

        properties.push([gridColumnStartProperty, parsed]);
        properties.push([gridColumnEndProperty, parsed]);
      }

      if (length === 2) {
        const row = parseGridColumnOrRow(values[0]);
        properties.push([gridRowStartProperty, row]);
        properties.push([gridRowEndProperty, row]);

        const column = parseGridColumnOrRow(values[1]);
        properties.push([gridColumnStartProperty, column]);
        properties.push([gridColumnEndProperty, column]);
      }

      if (length === 3) {
        const rowStart = parseGridColumnOrRow(values[0]);
        properties.push([gridRowStartProperty, rowStart]);

        const rowEnd = parseGridColumnOrRow(values[2]);
        properties.push([gridRowEndProperty, rowEnd]);

        const columnStart = parseGridColumnOrRow(values[1]);
        properties.push([gridColumnStartProperty, columnStart]);
        properties.push([gridColumnEndProperty, columnStart]);
      }

      if (length >= 4) {
        const rowStart = parseGridColumnOrRow(values[0]);
        properties.push([gridRowStartProperty, rowStart]);

        const rowEnd = parseGridColumnOrRow(values[2]);
        properties.push([gridRowEndProperty, rowEnd]);

        const columnStart = parseGridColumnOrRow(values[1]);
        properties.push([gridColumnStartProperty, columnStart]);

        const columnEnd = parseGridColumnOrRow(values[3]);
        properties.push([gridColumnEndProperty, columnEnd]);
      }
    }

    return properties;
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
    const properties: [CssProperty<any, any>, any][] = [];

    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return properties;
      }

      if (length === 1) {
        const parsed = parseGridColumnOrRow(values[0]);
        properties.push([gridColumnStartProperty, parsed]);
        properties.push([gridColumnEndProperty, parsed]);
      }

      if (length > 1) {
        const start = values[0];
        const end = values[1];

        const parsedStart = parseGridColumnOrRow(start);
        const parsedEnd = parseGridColumnOrRow(end);
        properties.push([gridColumnStartProperty, parsedStart]);
        properties.push([gridColumnEndProperty, parsedEnd]);
      }
    }

    return properties;
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
    const properties: [CssProperty<any, any>, any][] = [];

    if (typeof value === 'string') {
      const values = value.split('/').filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return properties;
      }

      if (length === 1) {
        const parsed = parseGridColumnOrRow(values[0]);
        properties.push([gridRowStartProperty, parsed]);
        properties.push([gridRowEndProperty, parsed]);
      }

      if (length > 1) {
        const start = values[0];
        const end = values[1];

        const parsedStart = parseGridColumnOrRow(start);
        const parsedEnd = parseGridColumnOrRow(end);
        properties.push([gridRowStartProperty, parsedStart]);
        properties.push([gridRowEndProperty, parsedEnd]);
      }
    }

    return properties;
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
export class TSCViewBase extends View implements AddChildFromBuilder {
  android: org.nativescript.mason.masonkit.View;
  ios: UIView;
  display: Display;
  position: Position;
  flexDirection: FlexDirection;
  flexWrap: FlexWrap;
  maxWidth: Length;
  maxHeight: Length;
  left: Length;
  right: Length;
  top: Length;
  bottom: Length;
  flexBasis: Length;
  gap: Gap;
  rowGap: Length;
  columnGap: Length;

  aspectRatio: number;
  alignItems: AlignItems;
  // @ts-ignore
  alignSelf: AlignSelf;
  alignContent: AlignContent;

  justifyItems: JustifyItems;
  justifySelf: JustifySelf;
  justifyContent: JustifyContent;

  gridAutoRows: string;
  gridAutoColumns: string;
  gridAutoFlow: GridAutoFlow;

  gridArea: string;

  gridColumn: string;
  gridColumnStart: string;
  gridColumnEnd: string;

  gridRow: string;
  gridRowStart: string;
  gridRowEnd: string;

  _children: any[] = [];

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
    this._addView(value);
  }
}

displayProperty.register(Style);
maxWidthProperty.register(Style);
maxHeightProperty.register(Style);
positionProperty.register(Style);
flexDirectionProperty.register(Style);
flexWrapProperty.register(Style);
leftProperty.register(Style);
rightProperty.register(Style);
topProperty.register(Style);
bottomProperty.register(Style);
flexBasisProperty.register(Style);
rowGapProperty.register(Style);
columnGapProperty.register(Style);
gapProperty.register(Style);
aspectRatioProperty.register(Style);
alignItemsProperty.register(Style);
alignSelfProperty.register(Style);
alignContentProperty.register(Style);
justifyItemsProperty.register(Style);
justifySelfProperty.register(Style);
justifyContentProperty.register(Style);

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
