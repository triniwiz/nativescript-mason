import { CSSType, Utils, ViewBase } from '@nativescript/core';
import { ButtonBase, textContentProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isText_, isMasonView_, isTextChild_ } from '../symbols';

@CSSType('Button')
export class Button extends ButtonBase {
  [style_];
  _inBatch = false;
  private _view: org.nativescript.mason.masonkit.Button;
  constructor() {
    super();
    this[isText_] = true;
    const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
    this._view = Tree.instance.createButtonView(context) as never;
    this[isMasonView_] = true;
    this[style_] = Style.fromView(this as never, this._view);
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
