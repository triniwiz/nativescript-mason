import { CSSType, Utils } from '@nativescript/core';
import { style_, ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';

@CSSType('View')
export class View extends ViewBase {
  [style_];
  private _view: MasonUIView;
  constructor() {
    super();
    const view = Tree.instance.createView();
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
    let layout = this._view.node.computedLayout ?? this._view.node.layout();
    const children = layout.children;
    let i = 0;

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
          this.ios.node.computeWithSize(specWidth, specHeight);

          const layout = this.ios.node.layout();

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.eachLayoutChild((child) => {
            ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          });

          this.setMeasuredDimension(w, h);
          return;
        } else {
          this.ios.node.computeWithMaxContent();
          const layout = this.ios.node.computedLayout ?? this.ios.node.layout();

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);

          this.eachLayoutChild((child) => {
            ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          });
        }
      } else {
        const layout = this.ios.node.computedLayout ?? this.ios.node.layout();
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
    console.log('_setNativeViewFrame', frame);
    nativeView.frame = frame;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    console.log('_addViewToNativeVisualTree', child);
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
    console.log('_removeViewFromNativeVisualTree', view);
    view._masonParent = undefined;
    view._isMasonView = false;
    view._isMasonChild = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
