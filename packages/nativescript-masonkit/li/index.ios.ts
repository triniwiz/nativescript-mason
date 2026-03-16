import { CSSType, Utils, View } from '@nativescript/core';
import { ViewBase } from '../common';
import { isMasonView_, isPlaceholder_, native_, style_ } from '../symbols';
import { Tree } from '../tree';

@CSSType('li')
export class Li extends ViewBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createListItem();
      this[native_] = view as never;
      return view;
    }
    return this[native_] as never as MasonLi;
  }

  createNativeView(): Object {
    return this._view;
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    nativeView.frame = frame;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: any, atIndex = -1): boolean {
    const nativeView = this._view;
    if (nativeView && (child.nativeViewProtected || child.ios)) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      if (child[isPlaceholder_]) {
        // @ts-ignore
        nativeView.mason_addChildAtElement(child.ios, index);
      } else {
        nativeView.mason_addChildAtElement(child.nativeViewProtected, index);
      }
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: any): void {
    view[isMasonView_] = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
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
      const width = x + layout.width;
      const height = y + layout.height;
      View.layoutChild(this as never, child as never, x, y, width, height);
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

          // @ts-ignore
          const layout = this.ios.mason_layout();

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.eachLayoutChild((child) => {
            ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          });

          this.setMeasuredDimension(w, h);
          return;
        } else {
          // either we had a non-auto dimension or an unconstrained spec,
          // measure by max-content so we don't accidentally collapse to zero.
          // @ts-ignore
          this.ios.mason_computeWithMaxContent();
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
}
