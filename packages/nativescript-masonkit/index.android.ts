import { TSCViewBase } from './common';

import { paddingLeftProperty, paddingTopProperty, paddingRightProperty, paddingBottomProperty, Style, Length, widthProperty, heightProperty, View } from '@nativescript/core';

export class TSCView extends TSCViewBase {
  createNativeView() {
    return new org.nativescript.mason.masonkit.View(this._context);
  }

  //@ts-ignore
  get android() {
    return this.nativeViewProtected as org.nativescript.mason.masonkit.View;
  }

  initNativeView(): void {
    super.initNativeView();

    console.time('initNativeView');
    const style = this.android.getStyle();
    style.setFlexDirection(org.nativescript.mason.masonkit.FlexDirection.Column);
    style.setAlignContent(org.nativescript.mason.masonkit.AlignContent.Stretch);
    console.timeEnd('initNativeView');
  }

  onLoaded(): void {
    super.onLoaded();
    const views = this._children.filter((item) => {
      const ret = !item.parent;
      if (ret) {
        this._addView(item);
      }
      return ret;
    });

    const array = Array.create('android.view.View', views.length);

    views.forEach((item, index) => {
      array[index] = item.nativeView;
    });
    this.nativeView.addViews(array);
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
    this.android.getStyle().setPaddingLeft(val, 0);
  }

  [paddingTopProperty.getDefault]() {
    return undefined;
  }

  [paddingTopProperty.setNative](value) {
    console.log('paddingTopProperty', value, this.effectivePaddingTop);
    const val = Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderTopWidth, 0);
    this.android.getStyle().setPaddingTop(val, 0);
  }

  [paddingRightProperty.getDefault]() {
    return undefined;
  }

  [paddingRightProperty.setNative](value) {
    const val = Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderRightWidth, 0);
    this.android.getStyle().setPaddingRight(val, 0);
  }

  [paddingBottomProperty.getDefault]() {
    return undefined;
  }

  [paddingBottomProperty.setNative](value) {
    const val = Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderBottomWidth, 0);
    this.android.getStyle().setPaddingBottom(val, 0);
  }

  [widthProperty.setNative](value) {
    console.log('widthProperty', value);
  }

  [heightProperty.setNative](value) {
    console.log('heightProperty', value);
  }
}
