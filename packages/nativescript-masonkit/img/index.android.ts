import { CSSType, knownFolders, Utils } from '@nativescript/core';
import { ImageBase, srcProperty } from '../common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_, native_ } from '../symbols';

@CSSType('img')
export class Img extends ImageBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createImageView(context);
      this[native_] = view;
      return view;
    }
    return this[native_] as org.nativescript.mason.masonkit.Img;
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
      if (typeof value === 'string' && value.startsWith('~/')) {
        nativeView.setSrc(value.replace('~/', knownFolders.currentApp().path));
      } else {
        nativeView.setSrc(value);
      }
    }
  }
}
