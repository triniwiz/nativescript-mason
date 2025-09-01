import { CSSType, Utils } from '@nativescript/core';
import { style_, ViewBase } from '../common';
import { Tree } from '../tree';
import { Style } from '../style';

@CSSType('View')
export class View extends ViewBase {
  [style_];
  private _view: org.nativescript.mason.masonkit.View;
  _hasNativeView = false;
  _inBatch = false;
  constructor() {
    super();
    const view = Tree.instance.createView(Utils.android.getCurrentActivity() || Utils.android.getApplicationContext()) as never;
    this._hasNativeView = true;
    this._view = view;
    this._isMasonView = true;
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

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view as org.nativescript.mason.masonkit.View;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.View;

    // @ts-ignore
    child._masonParent = this;
    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      nativeView.addView(child.nativeViewProtected, (atIndex ?? -1) as never);
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    view._masonParent = undefined;
    view._isMasonView = false;
    view._isMasonChild = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
