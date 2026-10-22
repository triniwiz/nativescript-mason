import { CSSType, Utils, View } from '@nativescript/core';
import { ViewBase, setMeasuredFromNative } from '../common';
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
    //  nativeView.frame = frame;
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
        this._masonAdoptForeign(child);
      }
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: any): void {
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
      const w = layout.width;
      const h = layout.height;

      const wSpec = Utils.layout.makeMeasureSpec(w, Utils.layout.EXACTLY);
      const hSpec = Utils.layout.makeMeasureSpec(h, Utils.layout.EXACTLY);
      View.measureChild(this as never, child as never, wSpec, hSpec);

      (child as any).layout(x, y, x + w, y + h);
      i++;
    }
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;
    if (nativeView) {
      // @ts-ignore
      setMeasuredFromNative(this, nativeView.mason_measure(widthMeasureSpec, heightMeasureSpec, !this.parent?.[isMasonView_], false));
      this.eachLayoutChild((child) => {
        ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
      });
    }
  }
}
