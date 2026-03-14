import { CSSType } from '@nativescript/core';
import { ViewBase } from '../common';
import { isMasonView_, native_, style_ } from '../symbols';
import { Tree } from '../tree/index';

export class List extends ViewBase {
  readonly ordered: boolean;
  [style_];
  _inBatch = false;
  constructor(ordered: boolean = false) {
    super();
    this.ordered = ordered ?? false;
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createList();
      if (this.ordered) {
        view.isOrdered = true;
      }
      this[native_] = view as never;
      return view;
    }
    return this[native_] as never as MasonList;
  }
}

@CSSType('ul')
export class UnorderedList extends List {
  constructor() {
    super(false);
  }
}

@CSSType('ol')
export class OrderedList extends List {
  constructor() {
    super(true);
  }
}
