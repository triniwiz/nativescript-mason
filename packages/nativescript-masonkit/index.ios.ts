import { heightProperty, Length, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, Utils, widthProperty } from '@nativescript/core';
import { TSCViewBase } from './common';

export class TSCView extends TSCViewBase {
  createNativeView() {
    return MasonView.alloc().initWithFrame(CGRectZero);
  }

  //@ts-ignore
  get ios() {
    return this.nativeViewProtected as MasonView;
  }

  initNativeView(): void {
    super.initNativeView();

    console.time('initNativeView');
    const style = this.ios.style;
    style.flexDirection = FlexDirection.Column;
    style.alignContent = AlignContent.Stretch;
    console.timeEnd('initNativeView');
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this.nativeView;
    if (nativeView) {
      const width = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const height = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      this.setMeasuredDimension(width, height);
    }
  }

  onLoaded(): void {
    super.onLoaded();

    console.time('onLoaded');

    const views = this._children.filter((item) => {
      const ret = !item.parent;
      if (ret) {
        this._addView(item);
      }
      return ret;
    });

    const array = NSMutableArray.alloc().initWithCapacity(views.length);

    views.forEach((item) => {
      array.addObject(item.nativeView);
    });

    console.log(array);

    this.nativeView.addSubviews(array);

    // this._children.forEach((item) => {
    //   if (!item.parent) {
    //     this._addView(item);
    //     this.nativeView.addSubview(item.nativeView);
    //   }
    // });
    console.timeEnd('onLoaded');
  }

  [paddingLeftProperty.getDefault]() {
    return undefined;
  }

  [paddingLeftProperty.setNative](value) {
    /*
     0 -> Points
      1 -> Percent
      2 -> Undefined
      3 -> Auto
    */
    const val = Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderLeftWidth, 0);
    this.ios.style.setPaddingLeft(val, 0);
  }

  [paddingTopProperty.getDefault]() {
    return undefined;
  }

  [paddingTopProperty.setNative](value) {
    console.log('paddingTopProperty', value, this.effectivePaddingTop);
    const val = Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderTopWidth, 0);
    this.ios.style.setPaddingTop(val, 0);
  }

  [paddingRightProperty.getDefault]() {
    return undefined;
  }

  [paddingRightProperty.setNative](value) {
    const val = Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderRightWidth, 0);
    this.ios.style.setPaddingRight(val, 0);
  }

  [paddingBottomProperty.getDefault]() {
    return undefined;
  }

  [paddingBottomProperty.setNative](value) {
    const val = Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderBottomWidth, 0);
    this.ios.style.setPaddingBottom(val, 0);
  }

  [widthProperty.setNative](value) {
    console.log('widthProperty', value);
  }

  [heightProperty.setNative](value) {
    console.log('heightProperty', value);
  }
}
