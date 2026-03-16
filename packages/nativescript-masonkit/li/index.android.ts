import { CSSType, Utils } from '@nativescript/core';
import { ViewBase } from '../common';
import { isMasonView_, isPlaceholder_, native_, style_ } from '../symbols';
import { Tree } from '../tree';

@CSSType('Li')
export class Li extends ViewBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createListItem(context) as org.nativescript.mason.masonkit.Li;
      this[native_] = view as never;
      return view;
    }
    return this[native_] as never as org.nativescript.mason.masonkit.Li;
  }

  createNativeView(): Object {
    return this._view;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view as org.nativescript.mason.masonkit.Li;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.Li;

    if (nativeView && (child.nativeViewProtected || child.android)) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      if (child[isPlaceholder_]) {
        nativeView.addChildAt(child.android, index as never);
      } else {
        nativeView.addChildAt(child.nativeViewProtected, index as never);
      }
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
