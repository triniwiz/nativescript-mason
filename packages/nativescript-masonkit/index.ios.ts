import { Utils, View, ViewBase } from '@nativescript/core';
import { TSCViewBase } from './common';

export class TSCView extends TSCViewBase {
  __masonStylePtr = 0;
  get _masonStylePtr() {
    if (this.__masonStylePtr === 0) {
      this.__masonStylePtr = String(this.ios?.masonStylePtr ?? 0) as any; // cast as string for now
    }
    return this.__masonStylePtr;
  }

  __masonNodePtr = 0;
  get _masonNodePtr() {
    if (this.__masonNodePtr === 0) {
      this.__masonNodePtr = String(this.ios?.masonNodePtr ?? 0) as any; // cast as string for now
    }
    return this.__masonNodePtr;
  }

  __masonPtr = 0;
  get _masonPtr() {
    if (this.__masonPtr === 0) {
      this.__masonPtr = String((UIView as any).masonPtr ?? 0) as any; // cast as string for now
    }
    return this.__masonPtr;
  }

  _hasNativeView = false;

  createNativeView() {
    this._hasNativeView = true;
    return UIView.alloc().initWithFrame(CGRectZero);
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  //@ts-ignore
  get ios() {
    return this.nativeViewProtected as UIView;
  }

  /*
   // This method won't be called in Android because we use the native android layout.
   public onLayout(left: number, top: number, right: number, bottom: number): void {
    this.eachLayoutChild((child) => {
      View.layoutChild(this, child, 0, 0, right - left, bottom - top);
      return true;
    });
  }

  */

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    const nativeView = this.nativeView;
    if (nativeView) {
      //   this.ios.mason.computeWithMaxContent();

      this.eachLayoutChild((child) => {
        const layout = child.ios.mason.layout();
        View.layoutChild(this as any, child, layout.x, layout.y, layout.width, layout.height);
        return true;
      });
    }
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this.nativeView;
    if (nativeView) {
      const width = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const height = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const next = (this as any)._masonParent;

      if (!next) {
        let parent;
        let entry = this;
        while (next) {
          parent = next;
          entry = (this as any)._masonParent;
        }

        entry.ios.setSize(width, height);

        if (!this._isMasonChild) {
          entry.ios.mason.computeWithMaxContent();
        }
      }

      const layout = this.ios.mason.layout();

      this.setMeasuredDimension(layout.width, layout.height);
    }
  }

  public layoutNativeView(): void {
    // noop
  }

  public _addViewToNativeVisualTree(view: ViewBase, atIndex?: number): boolean {
    const nativeView = this.nativeView as UIView;
    (view as any)._masonParent = this;
    super._addViewToNativeVisualTree(view, atIndex);

    // if (nativeView && view.nativeViewProtected) {
    //   console.log(view.nativeViewProtected);
    //   nativeView.addSubview(view.nativeViewProtected);
    // }

    const index = atIndex ?? Infinity;
    if (nativeView && view.nativeViewProtected) {
      view['_hasNativeView'] = true;
      if (index >= nativeView.subviews.count) {
        nativeView.addSubview(view.nativeViewProtected);
      } else {
        nativeView.insertSubviewAtIndex(view.nativeViewProtected, index);
      }
    }

    return true;
  }

  public _removeViewFromNativeVisualTree(view: ViewBase): void {
    const nativeView = this.viewController.view;
    (view as any)._masonParent = undefined;
    (view as any)._isMasonView = false;
    (view as any)._isMasonChild = false;
    super._removeViewFromNativeVisualTree(view);
    if (view.nativeViewProtected) {
      if ((view.nativeViewProtected as UIView).superview === nativeView) {
        (view.nativeViewProtected as UIView).removeFromSuperview();
      }
    }
  }
}
