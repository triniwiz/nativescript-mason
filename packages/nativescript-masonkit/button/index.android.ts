import { CSSType, Utils, ViewBase } from '@nativescript/core';
import { ButtonBase, textContentProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isText_, isMasonView_, isTextChild_, native_ } from '../symbols';

@CSSType('Button')
export class Button extends ButtonBase {
  [style_];
  _inBatch = false;
  private __view: org.nativescript.mason.masonkit.Button;
  constructor() {
    super();
    this[isText_] = true;
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      this[native_] = Tree.instance.createButtonView(context) as never;
    }
    return this[native_] as org.nativescript.mason.masonkit.Button;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view;
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

  [textContentProperty.setNative](value) {
    const nativeView = this._view as org.nativescript.mason.masonkit.Button;
    if (nativeView) {
      nativeView.setTextContent(value);
    }
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.Button;
    if (nativeView && child.nativeViewProtected) {
      child[isTextChild_] = true;
      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      nativeView.addChildAt(child.nativeViewProtected, index as never);
    }

    return false;
  }

  _removeViewFromNativeVisualTree(view: ViewBase): void {
    view[isTextChild_] = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
