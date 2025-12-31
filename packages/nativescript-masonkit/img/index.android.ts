import { CSSType, Utils } from '@nativescript/core';
import { ImageBase, srcProperty } from '../common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_ } from '../symbols';

@CSSType('img')
export class Img extends ImageBase {
  [style_];
  _inBatch = false;
  private _view;
  constructor() {
    super();
    const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
    this._view = Tree.instance.createImageView(context);
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

  [srcProperty.setNative](value) {
    const nativeView = this._view as org.nativescript.mason.masonkit.Img;
    if (nativeView) {
      nativeView.setSrc(value);
    }
  }
}
