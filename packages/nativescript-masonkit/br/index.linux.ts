import { ViewBase } from '@nativescript/core';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, isPlaceholder_, native_, style_ } from '../symbols';
import type * as Native from '../native.linux';

export class Br extends ViewBase {
  [style_];
  constructor() {
    super();
    this[isMasonView_] = true;
    this[isPlaceholder_] = true;
  }

  get _view(): Native.Br {
    if (!this[native_]) {
      this[native_] = Tree.instance.createBr() as never;
    }
    return this[native_] as never as Native.Br;
  }

  // @ts-ignore
  get linux() {
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
}
