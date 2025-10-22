import { Utils, View } from '@nativescript/core';
import { style_, ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';

export class Scroll extends ViewBase {
  [style_];
  private _view: MasonScroll;
  constructor() {
    super();
    const view = Tree.instance.createScrollView() as never;
    this._hasNativeView = true;
    this._view = view;
  }
  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  _hasNativeView = false;
  _inBatch = false;

  createNativeView() {
    return this._view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get ios() {
    return this._view;
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

    for (const child of this._children) {
      layout = children.objectAtIndex(i);
      const x = layout.x;
      const y = layout.y;
      const width = x + layout.width;
      const height = y + layout.height;
      View.layoutChild(this as never, child, x, y, width, height);
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
      if (!this._isMasonChild) {
        // only call compute on the parent
        if (this.width === 'auto' && this.height === 'auto') {
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          // this.ios.computeWithSize(specWidth, specHeight);
          // @ts-ignore
          const layout = this.ios.mason_layout();
          //const layout = this.ios.layout();
          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.eachLayoutChild((child) => {
            ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          });

          this.setMeasuredDimension(w, h);
          return;
        } else {
          // @ts-ignore
          this.ios.mason_computeWithMaxContent();
          // // @ts-ignore
          // this.ios.computeWithMaxContent();
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
    // @ts-ignore
    child._masonParent = this;
    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      if (atIndex <= -1) {
        nativeView.addView(child.nativeViewProtected);
      } else {
        nativeView.addViewAt(child.nativeViewProtected, atIndex);
      }
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    view._masonParent = undefined;
    view._isMasonView = false;
    view._isMasonChild = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
