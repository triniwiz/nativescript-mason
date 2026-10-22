import { CSSType } from '@nativescript/core';
import { ViewBase, setRootNativeViewFrame, setMeasuredFromNative } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isMasonView_, native_, isPlaceholder_, isText_ } from '../symbols';

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

  get _view() {
    if (!this[native_]) {
      // MasonUIView has its own scroll handling; UIScrollView breaks when nested.
      const view = Tree.instance.createView() as never;
      // Native default is false; most block elements keep it.
      if (this._visibleOverflowScrolls) (view as any).isScrollContainer = true;
      this[native_] = view;
      return view;
    }
    return this[native_] as never as MasonUIView;
  }

  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }
  _inBatch = false;

  createNativeView() {
    return this._view;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get ios() {
    return this._view;
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);
    // Mason descendants were placed by the native compute; only a root's
    // non-Mason views still need core's layout.
    if (!this._masonPlacedNatively) {
      this._masonLayoutForeignDescendants();
    }
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;
    if (nativeView) {
      // As a root, the box is the viewport: clamped to the specs so the content overflows it and scrolls.
      // @ts-ignore
      setMeasuredFromNative(this, nativeView.mason_measure(widthMeasureSpec, heightMeasureSpec, !!this.parent && !this.parent[isMasonView_], true));
    }
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view;
    if (nativeView && (child.nativeViewProtected || child.ios)) {
      child._hasNativeView = true;
      // Map the JS index onto the native children list (views attach lazily,
      // so the raw index can run ahead of native state).
      const { nativeIndex: index } = (this as any)._nativeAttachIndex(child, atIndex);
      child._isMasonChild = true;
      if (child[isPlaceholder_]) {
        // @ts-ignore
        nativeView.mason_addChildAtElement(child.ios, index);
      } else {
        nativeView.addViewAt(child.nativeViewProtected, index);
        this._masonAdoptForeign(child);
        this._masonMeasureForeign(child);
      }
      return true;
    }

    return false;
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    if (this.parent?.[isMasonView_]) {
      nativeView.frame = frame;
    } else {
      setRootNativeViewFrame(this, nativeView, frame);
    }
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    (this as any)._invalidateAttachCursor();
    // Inverse of `_addViewToNativeVisualTree` — unlink the mason node so
    // removal detaches the Rust node + native view rather than orphaning it.
    const nativeView = this._view as any;
    if (nativeView && view.nativeViewProtected && typeof nativeView.removeView === 'function') {
      nativeView.removeView(view.nativeViewProtected);
      (this as any)._masonRequestLayoutAfterRemoval();
    }
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
