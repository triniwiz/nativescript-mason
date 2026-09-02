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

  private _measureChildren(layout) {
    const children = layout.children;
    let i = 0;
    if (children.count === 0) {
      return;
    }

    for (const child of this._viewChildren) {
      layout = children.objectAtIndex(i);
      const w = layout.width;
      const h = layout.height;

      const wSpec = Utils.layout.makeMeasureSpec(w, Utils.layout.EXACTLY);
      const hSpec = Utils.layout.makeMeasureSpec(h, Utils.layout.EXACTLY);
      View.measureChild(this as never, child as never, wSpec, hSpec);

      i++;
    }
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);
    // @ts-ignore
    let layout = this._view.node.computedLayout;
    const children = layout.children;
    let i = 0;

    if (children.count === 0) {
      return;
    }

    for (const child of this._viewChildren) {
      layout = children.objectAtIndex(i);
      const x = layout.x;
      const y = layout.y;
      const w = layout.width;
      const h = layout.height;

      const isMason = !!child[isMasonView_];

      if (isMason) {
        // Mason child: Swift's applyToView already set the native frame.
        // If isLayoutValid is set, Mason handled this child — skip the full
        // layout cascade and just sync NativeScript's internal bounds tracking.
        const childNode = (child as any).ios?.node;
        if (childNode?.isLayoutValid) {
          // Still call layout() to keep NativeScript's bounds state in sync,
          // but with setFrame=false so we don't redundantly set the native frame.
          (child as any).layout(x, y, x + w, y + h, false);
          // Clear isLayoutValid AFTER layout() completes so a re-entrant
          // layoutSubviews during layout() can't see a stale false value
          // and fall through to the non-Mason path.
          childNode.isLayoutValid = false;
          i++;
          continue;
        }
        // Mason child but not yet laid out by Swift — let the cascade run
        // with setFrame=false (Swift will set the frame during layoutSubviews).
        (child as any).layout(x, y, x + w, y + h, false);
      } else {
        // Non-Mason (plain NativeScript) child inside a Mason container.
        // Mason's applyToView already set its UIView frame; NativeScript's
        // _setNativeViewFrame will set it again to the same value which
        // keeps NativeScript's internal state (_isLaidOut, events) correct.
        (child as any).layout(x, y, x + w, y + h, true);
      }
      i++;
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

        if (this.width === 'auto' && this.height === 'auto' && !unconstrained) {
          // we have explicit constraints from the spec, use them
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          // Tell Swift's layoutSubviews-driven autoComputeIfRoot this parent
          // size is already handled, so setting our frame below doesn't
          // trigger a second, redundant native compute+apply pass.
          // @ts-ignore
          this.ios.mason_markRootComputeApplied();

          // computeWithSize already applied the layout natively and cached it
          // on the node — read it back instead of paying for another native
          // round trip via mason_layout().
          // @ts-ignore
          const layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
          this._measureChildren(layout);
          return;
        } else {
          // either we had a non-auto dimension or an unconstrained spec,
          // measure by max-content so we don't accidentally collapse to zero.
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

          this.eachLayoutChild((child) => {
            ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          });
        }
      } else {
        // @ts-ignore
        const layout = this.ios.node.computedLayout;
        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

        this.setMeasuredDimension(w, h);

        this.eachLayoutChild((child) => {
          ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
        });
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
    view[isMasonView_] = false;
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
