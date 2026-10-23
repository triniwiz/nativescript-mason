import { CSSType } from '@nativescript/core';
import { ViewBase, setRootNativeViewFrame, setMeasuredFromNative } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, isPlaceholder_, native_, style_ } from '../symbols';

/** Views with queued native inserts (see `View._addViewToNativeVisualTree`). */
let pendingAddHosts = 0;

function flushNativeAddsDeep(view: any) {
  view._masonFlushNativeAdds?.();
  view.eachChildView?.((child: any) => {
    if (child[isMasonView_]) flushNativeAddsDeep(child);
    return true;
  });
}

@CSSType('View')
export class View extends ViewBase {
  [style_];
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createView() as never;
      this[native_] = view;
      return view;
    }
    return this[native_] as never as MasonUIView;
  }

  get _styleHelper(): Style {
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
      const root = !this.parent?.[isMasonView_];
      if (root && pendingAddHosts > 0) flushNativeAddsDeep(this);
      // One native call computes a root for the host's specs, or reads a child's placed box.
      // @ts-ignore
      setMeasuredFromNative(this, nativeView.mason_measure(widthMeasureSpec, heightMeasureSpec, root, false));
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    if (this.parent?.[isMasonView_]) {
      nativeView.frame = frame;
    } else {
      setRootNativeViewFrame(this, nativeView, frame);
    }
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view;
    if (nativeView && (child.nativeViewProtected || child.ios)) {
      child._hasNativeView = true;
      // Views attach lazily, so the JS index can run ahead of the native children.
      const { nativeIndex: index } = (this as any)._nativeAttachIndex(child, atIndex);
      child._isMasonChild = true;
      // Inserted once loaded (see loadView), with its CSS and subtree in place.
      if (!child.isLoaded) {
        if (!this._masonPendingAdds) {
          this._masonPendingAdds = [];
          pendingAddHosts++;
        }
        this._masonPendingAdds.push(child, index);
        if (child.parent !== this) (child as any).once('loaded', () => this._masonFlushNativeAdds(child));
        return true;
      }
      this._masonInsertNative(child, index);
      return true;
    }

    return false;
  }

  private _masonInsertNative(child: any, index: number) {
    const nativeView = this._view;
    if (child[isPlaceholder_]) {
      // @ts-ignore
      nativeView.mason_addChildAtElement(child.ios, index);
    } else {
      nativeView.addViewAt(child.nativeViewProtected, index);
      this._masonAdoptForeign(child);
      this._masonMeasureForeign(child);
    }
  }

  /** Child/index pairs queued by `_addViewToNativeVisualTree`, from `_masonPendingHead`. */
  private _masonPendingAdds: any[] | undefined;
  private _masonPendingHead = 0;

  /** Run the queued inserts in order, through `upTo` (every one when omitted). */
  _masonFlushNativeAdds(upTo?: any): void {
    const pending = this._masonPendingAdds;
    if (!pending) return;
    let end = pending.length;
    if (upTo !== undefined) {
      let i = this._masonPendingHead;
      while (i < end && pending[i] !== upTo) i += 2;
      if (i === end) return;
      end = i + 2;
    }
    let i = this._masonPendingHead;
    // Advance first: an insert can re-enter (a measure) and flush again.
    this._masonPendingHead = end;
    if (end === pending.length) {
      this._masonPendingAdds = undefined;
      this._masonPendingHead = 0;
      pendingAddHosts--;
    }
    for (; i < end; i += 2) this._masonInsertNative(pending[i], pending[i + 1]);
  }

  public loadView(view: any): void {
    super.loadView(view);
    if (this._masonPendingAdds) this._masonFlushNativeAdds(view);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    if (this._masonPendingAdds) this._masonFlushNativeAdds();
    (this as any)._invalidateAttachCursor();
    // Clear the attach flag; `_nativeIndexFor` counts it, so a stale `true` misindexes inserts.
    view._isMasonChild = false;
    // Detach the Rust node too; super only removes the native view.
    const nativeView = this._view as any;
    if (nativeView && view.nativeViewProtected && typeof nativeView.removeView === 'function') {
      nativeView.removeView(view.nativeViewProtected);
      (this as any)._masonRequestLayoutAfterRemoval();
    }
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
