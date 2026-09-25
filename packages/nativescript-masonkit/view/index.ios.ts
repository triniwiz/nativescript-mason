import { CSSType, Utils } from '@nativescript/core';
import { ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, isPlaceholder_, native_, style_ } from '../symbols';

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
        const unconstrained = widthMode === Utils.layout.UNSPECIFIED || heightMode === Utils.layout.UNSPECIFIED || (widthMode === Utils.layout.AT_MOST && specWidth === 0) || (heightMode === Utils.layout.AT_MOST && specHeight === 0);

        // Compute against the parent's bounds whenever the spec gives any, and
        // fall back to max-content only when it doesn't. This view's own
        // `auto`/`auto` style is not a reason to skip it: taffy honours that
        // size either way, while a percentage, viewport unit, or an abspos
        // child with `top: 0; bottom: 0` has nothing to resolve against
        // without it. Android's View.kt has always passed the mapped spec
        // through unconditionally.
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
    nativeView.frame = frame;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view;
    if (nativeView && (child.nativeViewProtected || child.ios)) {
      child._hasNativeView = true;
      const jsIndex = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      // Map the JS index onto the native children list (views attach lazily,
      // so the raw index can run ahead of native state).
      const index = jsIndex <= -1 ? jsIndex : (this as any)._nativeIndexFor(jsIndex);
      child._isMasonChild = true;
      if (child[isPlaceholder_]) {
        // @ts-ignore
        nativeView.mason_addChildAtElement(child.ios, index);
      } else {
        nativeView.addViewAt(child.nativeViewProtected, index);
      }
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    // Clear the attach flag; `_nativeIndexFor` counts it, so a stale `true` misindexes inserts.
    view._isMasonChild = false;
    // Unlink the mason node so removal detaches
    // the Rust node + native view instead of orphaning it (super only does removeFromSuperview).
    const nativeView = this._view as any;
    if (nativeView && view.nativeViewProtected && typeof nativeView.removeView === 'function') {
      nativeView.removeView(view.nativeViewProtected);
    }
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
