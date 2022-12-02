import { View, AddChildFromBuilder, ViewBase, CssProperty, Style, CoreTypes, Length } from '@nativescript/core';

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

maxWidthProperty.register(Style);
maxHeightProperty.register(Style);
