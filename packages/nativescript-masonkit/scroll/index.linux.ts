import { CSSType } from '@nativescript/core';
import { ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, native_, style_ } from '../symbols';
import { appendNativeChild } from '../panel-helpers';
import { createScroller } from '../native.linux';
import type * as Native from '../native.linux';

@CSSType('Scroll')
export class Scroll extends ViewBase {
  [style_];

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  /** `<scroll>` treats default `visible` Y overflow as `auto`; HTML block elements opt out. */
  get _visibleOverflowScrolls(): boolean {
    return true;
  }

  get _view(): Native.View {
    if (!this[native_]) {
      this[native_] = Tree.instance.createScrollView() as never;
    }
    return this[native_] as never as Native.View;
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

  // A vertical GtkScrolledWindow is the element in the parent's tree; plain block elements
  // (div, section, ...) keep `visible` overflow and hand back the Mason view itself.
  createNativeView() {
    if (!this._visibleOverflowScrolls) {
      return this._view as any;
    }
    return createScroller(this._view as any);
  }

  // Children go into the inner Mason view, not the scroller.
  // @ts-ignore
  public _addViewToNativeVisualTree(child: any, atIndex = -1): boolean {
    if (this._windowsAttach(child)) return true;
    const index = this._windowsNativeIndexOf(child, atIndex);
    super._addViewToNativeVisualTree(child, index);
    if (!appendNativeChild(this._view, child, index)) return false;
    this._masonAdoptForeign(child);
    return true;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    this._windowsDetachChild(child);
    child._isMasonChild = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(child);
  }
}
