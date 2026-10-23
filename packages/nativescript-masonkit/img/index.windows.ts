import { CSSType } from '@nativescript/core';
import { ImageBase, srcProperty } from '../common';
import { Tree } from '../tree';
import { Style, windowsAppFile } from '../style';
import { style_, isMasonView_, native_ } from '../symbols';

@CSSType('img')
export class Img extends ImageBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.Image {
    if (!this[native_]) {
      this[native_] = Tree.instance.createImageView() as never;
    }
    return this[native_] as never as NativeScript.Mason.Image;
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

  [srcProperty.setNative](value) {
    const nativeView = this._view;
    if (nativeView) {
      nativeView.Source = typeof value === 'string' ? windowsAppFile(value) : value;
    }
  }
}
