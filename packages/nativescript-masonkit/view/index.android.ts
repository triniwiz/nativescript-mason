import { CSSType, Utils } from '@nativescript/core';
import { ViewBase } from '../common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_, native_ } from '../symbols';

@CSSType('View')
export class View extends ViewBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createView(context) as never;
      this[native_] = view;
      return view;
    }
    return this[native_] as never as org.nativescript.mason.masonkit.View;
  }

  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    return this._view;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view as org.nativescript.mason.masonkit.View;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.View;

    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      nativeView.addView(child.nativeViewProtected, index as never);
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    view[isMasonView_] = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
