import { ViewBase } from '@nativescript/core';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, isPlaceholder_, isText_, isTextChild_, native_, style_ } from '../symbols';

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
      this[native_] = Tree.instance.createBr(null) as never;
    }
    return this[native_] as never as MasonBr;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get ios() {
    return this._view;
  }

  get _styleHelper(): Style {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }
}
