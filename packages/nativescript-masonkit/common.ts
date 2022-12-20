import { View, AddChildFromBuilder, ViewBase, CssProperty, Style, Length } from '@nativescript/core';
import { DisplayType, FlexDirectionType, FlexWrapType, GapType, LengthType, PositionType } from '.';

export const displayProperty = new CssProperty<Style, DisplayType>({
  name: 'display',
  cssName: 'display',
  defaultValue: 'flex',
  valueConverter(value) {
    if (typeof value === 'number') {
      switch (value) {
        case 0:
          return 'flex';
        case 1:
          return 'none';
      }
    }

    switch (value) {
      case 'flex':
      case 'none':
        return value;
      default:
        // todo throw???
        return 'flex';
    }
  },
});

export const maxWidthProperty = new CssProperty<Style, LengthType>({
  name: 'maxWidth',
  cssName: 'max-width',
  defaultValue: 'auto',
  equalityComparer: Length.equals,
});

export const maxHeightProperty = new CssProperty<Style, LengthType>({
  name: 'maxHeight',
  cssName: 'max-height',
  defaultValue: 'auto',
  equalityComparer: Length.equals,
});

export const positionProperty = new CssProperty<Style, PositionType>({
  name: 'position',
  cssName: 'position',
  defaultValue: 'relative',
});

export const flexDirectionProperty = new CssProperty<Style, FlexDirectionType>({
  name: 'flexDirection',
  cssName: 'flex-direction',
});

declare const enum FlexWrap {
  NoWrap = 0,

  Wrap = 1,

  WrapReverse = 2,
}

export const flexWrapProperty = new CssProperty<Style, FlexWrapType>({
  name: 'flexWrap',
  cssName: 'flex-wrap',
});

export const leftProperty = new CssProperty<Style, LengthType>({
  name: 'left',
  cssName: 'left',
  defaultValue: undefined,
  equalityComparer: Length.equals,
});

export const rightProperty = new CssProperty<Style, LengthType>({
  name: 'right',
  cssName: 'right',
  defaultValue: undefined,
  equalityComparer: Length.equals,
});

export const topProperty = new CssProperty<Style, LengthType>({
  name: 'top',
  cssName: 'top',
  defaultValue: undefined,
  equalityComparer: Length.equals,
});

export const bottomProperty = new CssProperty<Style, LengthType>({
  name: 'bottom',
  cssName: 'bottom',
  defaultValue: undefined,
  equalityComparer: Length.equals,
});

export const flexBasisProperty = new CssProperty<Style, LengthType>({
  name: 'flexBasis',
  cssName: 'flex-basis',
  defaultValue: 'auto',
});

export const gapProperty = new CssProperty<Style, GapType>({
  name: 'gap',
  cssName: 'gap',
  defaultValue: 'auto',
  valueConverter(value) {
    if (value === null || value === undefined) {
      return { width: undefined, height: undefined };
    }
    const values = value.split(' ');

    if (values.length === 0) {
      return { width: undefined, height: undefined };
    }

    if (values.length === 1) {
      const parsed = Length.parse(values[0]);
      return { width: parsed, height: parsed };
    }

    const width = Length.parse(values[0]);
    const height = Length.parse(values[1]);

    return { width, height };
  },
});

export const aspectRatioProperty = new CssProperty<Style, number>({
  name: 'aspectRatio',
  cssName: 'aspect-ratio',
  defaultValue: undefined,
});

export class TSCViewBase extends View implements AddChildFromBuilder {
  display: Display;
  position: PositionType;
  flexDirection: FlexDirectionType;
  flexWrap: FlexWrapType;
  maxWidth: LengthType;
  maxHeight: LengthType;
  left: LengthType;
  right: LengthType;
  top: LengthType;
  bottom: LengthType;
  flexBasis: LengthType;
  gap: GapType;
  aspectRatio: number;

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
gapProperty.register(Style);
aspectRatioProperty.register(Style);
