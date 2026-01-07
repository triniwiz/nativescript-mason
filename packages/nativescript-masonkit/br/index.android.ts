import { Utils, ViewBase } from '@nativescript/core';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isMasonView_, isPlaceholder_, native_ } from '../symbols';

export class Br extends ViewBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
    this[isPlaceholder_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      this[native_] = Tree.instance.createBr(context) as never;
    }
    return this[native_] as org.nativescript.mason.masonkit.Br;
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
}
