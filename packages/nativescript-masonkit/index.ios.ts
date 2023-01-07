import { Utils, ViewBase } from '@nativescript/core';
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
    const view = UIView.alloc().initWithFrame(CGRectZero);
    view.mason.isEnabled = true;
    this._hasNativeView = true;
    return view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  //@ts-ignore
  get ios() {
    return this.nativeViewProtected as UIView;
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this.nativeView;
    if (nativeView) {
      const width = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const height = Utils.layout.getMeasureSpecSize(heightMeasureSpec);

      // todo fix
      if (this.id === 'root') {
        this.setMeasuredDimension(width, height);
        this.ios.mason.computeWithViewSize();
        //  this.ios.mason.computeMaxContent();
      } else {
        const layout = this.ios.mason.layout();
        this.setMeasuredDimension(Utils.layout.toDeviceIndependentPixels(layout.width), Utils.layout.toDeviceIndependentPixels(layout.height));
      }

      /*
      console.log('JSI method', JSIEnabled);

      // cache the ptr value since it's not going to change
      const masonStylePtr = this.ios.masonStylePtr;
      console.time('JSI: getWidth');
      for (let i = 0; i < 1000000; i++) {
        JSIEnabled(masonStylePtr);
      }
      console.timeEnd('JSI: getWidth');

      console.log('JSI', 'width', JSIEnabled(this.ios.masonStylePtr));

      console.time('runtime: getWidth');
      for (let i = 0; i < 1000000; i++) {
        this.ios.mason.style.sizeCompatWidth.cssValue;
      }
      console.timeEnd('runtime: getWidth');
      console.log('runtime', 'width', this.ios.mason.style.sizeCompatWidth.cssValue);

      */
    }
  }

  public _addViewToNativeVisualTree(view: ViewBase, atIndex?: number): boolean {
    const nativeView = this.nativeView as UIView;
    super._addViewToNativeVisualTree(view, atIndex);
    const index = atIndex ?? -1;

    if (nativeView && view.nativeViewProtected) {
      nativeView.addSubview(view.nativeViewProtected);
      /* if (index >= nativeView.subviews.count) {
        nativeView.addSubview(view.nativeViewProtected);
      } else {
        nativeView.insertSubviewAtIndex(view.nativeViewProtected, index);
      } */
    }

    return true;
  }
}
