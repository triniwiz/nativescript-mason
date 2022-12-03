import { View, AddChildFromBuilder, ViewBase, CssProperty, Style, CoreTypes, Length } from '@nativescript/core';

export const enum Display {
  Flex = 'flex',

  None = 'none',
}

export const displayProperty = new CssProperty<Style, Display | 'flex' | 'none'>({
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

    return 'flex';
  },
});

export const maxWidthProperty = new CssProperty<Style, CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | 'auto'>({
  name: 'maxWidth',
  cssName: 'max-width',
  defaultValue: 'auto',
  equalityComparer: Length.equals,
});

export const maxHeightProperty = new CssProperty<Style, CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | 'auto'>({
  name: 'maxHeight',
  cssName: 'max-height',
  defaultValue: 'auto',
  equalityComparer: Length.equals,
});

export class TSCViewBase extends View implements AddChildFromBuilder {
  display: Display;
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
