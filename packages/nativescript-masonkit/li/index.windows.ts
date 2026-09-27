import { CSSType } from '@nativescript/core';
import { ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, native_, style_ } from '../symbols';
import { appendNativeChild, removeNativeChild } from '../windows-panel-helpers';

@CSSType('Li')
export class Li extends ViewBase {
  [style_];
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.Li {
    if (!this[native_]) {
      this[native_] = Tree.instance.createListItem() as never;
    }
    return this[native_] as never as NativeScript.Mason.Li;
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
    const index = this._windowsNativeIndexOf(child, atIndex);
    super._addViewToNativeVisualTree(child, index);
    return appendNativeChild(this._view, child, index);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    child._isMasonChild = false;
    removeNativeChild(this._view, child);
    // @ts-ignore
    super._removeViewFromNativeVisualTree(child);
  }
}
