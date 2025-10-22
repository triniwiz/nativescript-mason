import { CSSType, Utils } from '@nativescript/core';
import { ImageBase, isMasonView_, srcProperty, style_ } from '../common';
import { Tree } from '../tree';
import { Style } from '../style';

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

  // [backgroundColorProperty.setNative](value) {
  //   if (typeof value === 'number') {
  //     this[style_].backgroundColor = value;
  //   } else if (value instanceof Color) {
  //     this[style_].backgroundColor = value.android;
  //   }
  // }
}
