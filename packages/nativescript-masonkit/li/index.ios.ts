import { CSSType } from '@nativescript/core';
import { ViewBase } from '../common';
import { isMasonView_, native_, style_ } from '../symbols';
import { Tree } from '../tree';

@CSSType('li')
export class Li extends ViewBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createListItem();
      this[native_] = view as never;
      return view;
    }
    return this[native_] as never as MasonLi;
  }
}
