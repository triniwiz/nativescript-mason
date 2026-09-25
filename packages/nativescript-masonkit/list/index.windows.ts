import { CSSType } from '@nativescript/core';
import { ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, native_, style_ } from '../symbols';
import { appendNativeChild, removeNativeChild } from '../windows-panel-helpers';

class ListView extends ViewBase {
  [style_];
  protected _ordered = false;

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.List {
    if (!this[native_]) {
      this[native_] = Tree.instance.createList(this._ordered) as never;
    }
    return this[native_] as never as NativeScript.Mason.List;
  }

  // @ts-ignore
  get windows() {
    return this._view;
  }

  get _styleHelper(): Style {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    return this._view;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: any, atIndex = -1): boolean {
    super._addViewToNativeVisualTree(child, atIndex);
    return appendNativeChild(this._view, child, atIndex);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    child._isMasonChild = false;
    removeNativeChild(this._view, child);
    // @ts-ignore
    super._removeViewFromNativeVisualTree(child);
  }
}

@CSSType('ul')
export class UnorderedList extends ListView {
  constructor() {
    super();
    this._ordered = false;
  }
}

@CSSType('ol')
export class OrderedList extends ListView {
  constructor() {
    super();
    this._ordered = true;
  }
}
