import { CSSType } from '@nativescript/core';
import { ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, native_, style_ } from '../symbols';
import { appendNativeChild, removeNativeChild } from '../windows-panel-helpers';

@CSSType('View')
export class View extends ViewBase {
  [style_];
  nativeViewProtected: NativeScript.Mason.View;

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.View {
    if (!this[native_]) {
      this[native_] = Tree.instance.createView() as never;
    }
    return this[native_] as never as NativeScript.Mason.View;
  }

  get _styleHelper(): Style {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  _inBatch = false;

  createNativeView() {
    return this._view;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get windows() {
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
