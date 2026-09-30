import { CSSType, Utils } from '@nativescript/core';
import { ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isMasonView_, native_, isPlaceholder_ } from '../symbols';

@CSSType('Scroll')
export class Scroll extends ViewBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  /** `<scroll>` treats default `visible` Y overflow as `auto`; HTML block elements opt out. */
  get _visibleOverflowScrolls(): boolean {
    return true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createScrollView(context) as never as org.nativescript.mason.masonkit.Scroll;
      view.setVisibleOverflowScrolls(this._visibleOverflowScrolls);
      this[native_] = view as never;
    }
    return this[native_] as never as org.nativescript.mason.masonkit.Scroll;
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view as org.nativescript.mason.masonkit.Scroll;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.Scroll;

    if (nativeView && (child.nativeViewProtected || child.android)) {
      child._hasNativeView = true;
      // Map the JS index onto the native children list (views attach lazily,
      // so the raw index can run ahead of native state).
      const { nativeIndex: index } = (this as any)._nativeAttachIndex(child, atIndex);
      child._isMasonChild = true;
      if (child[isPlaceholder_]) {
        nativeView.addChildAt(child.android, index as never);
      } else {
        nativeView.addView(child.nativeViewProtected, index as never);
      }
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    (this as any)._invalidateAttachCursor();
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
