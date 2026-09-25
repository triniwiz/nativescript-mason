import { CSSType, Utils, View } from '@nativescript/core';
import { ViewBase } from '../common';
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
      (view as any).isScrollContainer = this._visibleOverflowScrolls;
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
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);
      if (this.parent && !this.parent[isMasonView_]) {
        // same reasoning as other views – if the scroll view is the root it may
        // receive an UNSPECIFIED spec, or sometimes an AT_MOST/0 spec, which we
        // must treat as unconstrained.
        const unconstrained = widthMode === Utils.layout.UNSPECIFIED || heightMode === Utils.layout.UNSPECIFIED || (widthMode === Utils.layout.AT_MOST && specWidth === 0) || (heightMode === Utils.layout.AT_MOST && specHeight === 0);

        // Compute against the parent's bounds whenever the spec gives any; see
        // view/index.ios.ts for why auto/auto doesn't matter here.
        if (!unconstrained) {
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          // Claim this root for the host's spec; see view/index.ios.ts.
          // @ts-ignore
          this.ios.mason_markRootComputeAppliedWithSize(specWidth, specHeight);
          // this.ios.computeWithSize(specWidth, specHeight);
          // _setNativeViewFrame

          // @ts-ignore
          var layout = this.ios.mason_layout();
          //const layout = this.ios.layout();
          // A scroll container is a VIEWPORT: its own box must never exceed the
          // available space, even though its children (the scrollable content)
          // can. Mason lays the node out at its natural content height because
          // the default overflow is `visible`; clamp the measured box back to
          // the spec so the native view is the viewport and `contentSize`
          // (the natural content extent) overflows it → the pan scroll engages.
          const viewportW = widthMode === Utils.layout.EXACTLY ? specWidth : Math.min(layout.width, specWidth);
          const viewportH = heightMode === Utils.layout.EXACTLY ? specHeight : Math.min(layout.height, specHeight);
          const w = Utils.layout.makeMeasureSpec(viewportW, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(viewportH, Utils.layout.EXACTLY);

          // this.eachLayoutChild((child) => {
          //   ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          // });

          this.setMeasuredDimension(w, h);

          return;
        } else {
          // unconstrained or explicit size – fall back to max-content
          // @ts-ignore
          this.ios.mason_computeWithMaxContent();
          // // @ts-ignore
          // this.ios.computeWithMaxContent();
          var layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);

          // this.eachLayoutChild((child) => {
          //   ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          // });
        }
      } else {
        // @ts-ignore
        var layout = this.ios.node.computedLayout;
        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);
        this.setMeasuredDimension(w, h);
      }
    }
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
        this._masonMeasureForeign(child);
      }
      return true;
    }

    return false;
  }

  _setNativeViewFrame(nativeView: any, frame: any): void {
    nativeView.frame = frame;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    // Inverse of `_addViewToNativeVisualTree` — unlink the mason node so
    // removal detaches the Rust node + native view rather than orphaning it.
    const nativeView = this._view as any;
    if (nativeView && view.nativeViewProtected && typeof nativeView.removeView === 'function') {
      nativeView.removeView(view.nativeViewProtected);
    }
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
