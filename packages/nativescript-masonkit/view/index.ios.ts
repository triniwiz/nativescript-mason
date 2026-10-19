import { CSSType, Utils } from '@nativescript/core';
import { ViewBase, setRootNativeViewFrame } from '../common';
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
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

      const parentIsMason = this.parent && this.parent[isMasonView_];
      if (!parentIsMason) {
        if (pendingAddHosts > 0) flushNativeAddsDeep(this);
        const unconstrained = widthMode === Utils.layout.UNSPECIFIED || heightMode === Utils.layout.UNSPECIFIED || (widthMode === Utils.layout.AT_MOST && specWidth === 0) || (heightMode === Utils.layout.AT_MOST && specHeight === 0);

        // Compute against the spec's bounds whenever it gives any; max-content only when it doesn't.
        if (!unconstrained) {
          // we have explicit constraints from the spec, use them
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          // Tell autoComputeIfRoot this parent size is already handled (so
          // setting our frame below doesn't trigger a redundant native
          // compute+apply pass), and hand it the spec — not always the
          // superview's bounds, e.g. a Page measures against the safe area.
          // @ts-ignore
          this.ios.mason_markRootComputeAppliedWithSize(specWidth, specHeight);

          // computeWithSize already applied the layout natively and cached it
          // on the node — read it back instead of paying for another native
          // round trip via mason_layout().
          // @ts-ignore
          const layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
          return;
        } else {
          // Nothing definite to resolve against: measure by max-content so we
          // don't accidentally collapse to zero.
          // @ts-ignore
          this.ios.mason_computeWithMaxContent();
          // Same as above: prevent autoComputeIfRoot from immediately
          // overriding this max-content measurement with a constrained
          // compute against the parent's exact bounds.
          // @ts-ignore
          this.ios.mason_markRootComputeApplied();
          // @ts-ignore
          const layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
        }
      } else {
        // @ts-ignore
        const layout = this.ios.node.computedLayout;
        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

        this.setMeasuredDimension(w, h);
      }
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
      this._masonSyncForeignChild(child);
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
