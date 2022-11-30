import { View, AddChildFromBuilder, ViewBase } from '@nativescript/core';

export class TSCViewBase extends View implements AddChildFromBuilder {
  _children: any[] = [];

  public eachChild(callback: (child: ViewBase) => boolean) {
    this._children.forEach((child) => {
      callback(child);
    });
  }

  _addChildFromBuilder(name: string, value: any): void {
    this._children.push(value);
  }
}
