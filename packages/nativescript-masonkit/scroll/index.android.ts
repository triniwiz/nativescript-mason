import { ScrollBase } from './common';
export type { ScrollEventData } from './common';
import { CSSType, Utils } from '@nativescript/core';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isMasonView_, native_, isPlaceholder_ } from '../symbols';

@CSSType('Scroll')
export class Scroll extends ScrollBase {
  [style_];
  _inBatch = false;

  protected _scrollMetrics(): [number, number, number, number] {
    const view = this[native_] as unknown as org.nativescript.mason.masonkit.Scroll;
    const dip = Utils.layout.toDeviceIndependentPixels;
    return view ? [dip(view.getScrollX()), dip(view.getScrollY()), dip(view.getScrollableWidth()), dip(view.getScrollableHeight())] : [0, 0, 0, 0];
  }

  protected _seek(x: number, y: number, animated: boolean): void {
    const px = Utils.layout.toDevicePixels;
    // The native bridge takes signed 32-bit pixel coordinates.
    const coordinate = (value: number) => Math.max(0, Math.min(2147483647, Math.round(px(value))));
    this._view.scrollToOffset(coordinate(x), coordinate(y), animated);
  }

  protected _stopScrolling(): void {
    (this[native_] as unknown as org.nativescript.mason.masonkit.Scroll)?.stopScrolling();
  }

  protected _observeScroll(observe: boolean): void {
    const view = this[native_] as unknown as org.nativescript.mason.masonkit.Scroll;
    if (!view) return;
    const ref = new WeakRef(this);
    view.setScrollListener(
      observe
        ? new org.nativescript.mason.masonkit.TwoDScrollView.ScrollChangeListener({
            onScrollChanged() {
              ref.deref()?._notifyScroll();
            },
          })
        : null,
    );
  }

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
      // Native default is true.
      if (!this._visibleOverflowScrolls) view.setVisibleOverflowScrolls(false);
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
