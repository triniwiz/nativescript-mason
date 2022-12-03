import { heightProperty, Length, minHeightProperty, minWidthProperty, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, Utils, widthProperty } from '@nativescript/core';
import { alignSelfProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { TSCViewBase } from './common';

function _parseLength(value): { value: number; type: 'auto' | 'points' | 'percent' | 'undefined' } {
  if (value === undefined || value === null) {
    return { value: 0, type: 'undefined' };
  }
  if (value === 'auto') {
    return { value: 0, type: 'auto' };
  }

  if (typeof value === 'object') {
    switch (value?.unit) {
      case '%':
        return { value: value.value * 100, type: 'percent' };
      case 'px':
        return { value: value.value, type: 'points' };
      case 'dip':
        return { value: Utils.layout.toDevicePixels(value.value), type: 'points' };
      default:
        break;
    }
  }

  return { value: value, type: 'points' };
}

function _intoType(type: 'auto' | 'points' | 'percent' | 'undefined') {
  switch (type) {
    case 'auto':
      return MasonDimensionCompatType.Auto;
    case 'points':
      return MasonDimensionCompatType.Points;
    case 'percent':
      return MasonDimensionCompatType.Percent;
    case 'undefined':
      return MasonDimensionCompatType.Undefined;
    default:
      return MasonDimensionCompatType.Auto;
  }
}

function _setFlexDirection(value, instance, initial = false) {
  if (initial && value === 'row') {
    return;
  }
  if (instance) {
    switch (value) {
      case 'column':
        instance.style.flexDirection = FlexDirection.Column;
        break;
      case 'row':
        instance.style.flexDirection = FlexDirection.Row;
        break;
      case 'column-reverse':
        instance.style.flexDirection = FlexDirection.ColumnReverse;
        break;
      case 'row-reverse':
        instance.style.flexDirection = FlexDirection.RowReverse;
        break;
    }
  }
}

function _setAlignSelf(value, instance, initial = false) {
  if (initial && value === 'auto') {
    return;
  }

  if (instance) {
    const mason = instance as MasonNode;
    switch (value) {
      case 'auto':
        mason.style.alignSelf = AlignSelf.Auto;
        break;
      case 'baseline':
        mason.style.alignSelf = AlignSelf.Baseline;
        break;
      case 'flex-start':
        mason.style.alignSelf = AlignSelf.FlexStart;
        break;
      case 'flex-end':
        mason.style.alignSelf = AlignSelf.FlexEnd;
        break;
      case 'center':
        mason.style.alignSelf = AlignSelf.Center;
        break;
      case 'stretch':
        mason.style.alignSelf = AlignSelf.Stretch;
        break;
    }
  }
}

export class TSCStyle {}

export class TSCView extends TSCViewBase {
  static {
    TSCMason.alwaysEnable = true;
  }

  createNativeView() {
    const view = UIView.alloc().initWithFrame(CGRectZero);
    view.mason.isEnabled = true;
    this.style.minWidth = undefined;
    this.style.minHeight = undefined;
    return view;
  }

  //@ts-ignore
  get ios() {
    return this.nativeViewProtected as UIView;
  }

  initNativeView(): void {
    super.initNativeView();

    console.time('initNativeView');

    this.ios.mason.configure((mason) => {
      _setFlexDirection(this.style.flexDirection, mason, true);
      _setAlignSelf(this.style.alignSelf, mason, true);

      // style.flexDirection = 1;

      const minW = _parseLength(this.style.minWidth);
      const minH = _parseLength(this.style.minHeight);
      const w = _parseLength(this.style.width);
      const h = _parseLength(this.style.height);
      const mw = _parseLength(this.style.maxWidth);
      const mh = _parseLength(this.style.maxWidth);

      if (minW.type === minH.type && minW.value === minH.value) {
        mason.style.setMinSizeWidthHeight(minW.value, _intoType(minW.type));
      } else {
        //   mason.style.ma = M
      }

      if (w.type === h.type && w.value === h.value) {
        mason.style.setSizeWidthHeight(w.value, _intoType(w.type));
      } else {
        //   mason.style.ma = M
      }

      if (mw.type === mh.type && mw.value === mh.value) {
        mason.style.setMaxSizeWidthHeight(mw.value, _intoType(mw.type));
      } else {
        //   mason.style.ma = M
      }

      console.log(mason.style);
    });

    console.timeEnd('initNativeView');
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this.nativeView;
    if (nativeView) {
      const width = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const height = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      this.setMeasuredDimension(width, height);

      this.ios.mason.computeWithViewSize();
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

  [minWidthProperty.getDefault]() {
    return undefined;
  }

  [minHeightProperty.getDefault]() {
    return undefined;
  }

  set flexDirection(value) {
    this.style.flexDirection = value;
    _setFlexDirection(value, this.ios);
  }

  [alignSelfProperty.setNative](value) {
    _setAlignSelf(value, this.ios);
  }

  // //@ts-ignore
  // set alignSelf(value) {
  //   console.log(value);
  //   this.style.alignSelf = value;
  //   _setAlignSelf(value, this.ios);
  // }

  //@ts-ignore
  set minWidth(value) {
    this.style.minWidth = value;
    if (!this.ios) {
      return;
    }
    const val = _parseLength(value);
    switch (val.type) {
      case 'auto':
        this.ios.style.setMinSizeWidth(0, MasonDimensionCompatType.Auto);
        break;
      case 'undefined':
        this.ios.style.setMinSizeWidth(0, MasonDimensionCompatType.Undefined);
        break;
      case 'percent':
        this.ios.style.setMinSizeWidth(val.value, MasonDimensionCompatType.Percent);
        break;
      case 'points':
        this.ios.style.setMinSizeWidth(val.value, MasonDimensionCompatType.Points);
        break;
    }
  }

  //@ts-ignore
  set minHeight(value) {
    this.style.minHeight = value;
    if (!this.ios) {
      return;
    }
    const val = _parseLength(value);
    switch (val.type) {
      case 'auto':
        this.ios.style.setMinSizeHeight(0, MasonDimensionCompatType.Auto);
        break;
      case 'undefined':
        this.ios.style.setMinSizeHeight(0, MasonDimensionCompatType.Undefined);
        break;
      case 'percent':
        this.ios.style.setMinSizeHeight(val.value, MasonDimensionCompatType.Percent);
        break;
      case 'points':
        this.ios.style.setMinSizeHeight(val.value, MasonDimensionCompatType.Points);
        break;
    }
  }

  //@ts-ignore
  set width(value) {
    this.style.width = value;
    if (!this.ios) {
      return;
    }
    const val = _parseLength(value);
    switch (val.type) {
      case 'auto':
        this.ios.style.setSizeWidth(0, MasonDimensionCompatType.Auto);
        break;
      case 'undefined':
        this.ios.style.setSizeWidth(0, MasonDimensionCompatType.Undefined);
        break;
      case 'percent':
        this.ios.style.setSizeWidth(val.value, MasonDimensionCompatType.Percent);
        break;
      case 'points':
        this.ios.style.setSizeWidth(val.value, MasonDimensionCompatType.Points);
        break;
    }
  }

  //@ts-ignore
  set height(value) {
    this.style.height = value;
    if (!this.ios) {
      return;
    }
    const val = _parseLength(value);
    switch (val.type) {
      case 'auto':
        this.ios.style.setSizeHeight(0, MasonDimensionCompatType.Auto);
        break;
      case 'undefined':
        this.ios.style.setSizeHeight(0, MasonDimensionCompatType.Undefined);
        break;
      case 'percent':
        this.ios.style.setSizeHeight(val.value, MasonDimensionCompatType.Percent);
        break;
      case 'points':
        this.ios.style.setSizeHeight(val.value, MasonDimensionCompatType.Points);
        break;
    }
  }

  set maxWidth(value) {
    this.style.maxWidth = value;
    if (!this.ios) {
      return;
    }
    const val = _parseLength(value);
    switch (val.type) {
      case 'auto':
        this.ios.style.setMaxSizeWidth(0, MasonDimensionCompatType.Auto);
        break;
      case 'undefined':
        this.ios.style.setMaxSizeWidth(0, MasonDimensionCompatType.Undefined);
        break;
      case 'percent':
        this.ios.style.setMaxSizeWidth(val.value, MasonDimensionCompatType.Percent);
        break;
      case 'points':
        this.ios.style.setMaxSizeWidth(val.value, MasonDimensionCompatType.Points);
        break;
    }
  }

  set maxHeight(value) {
    this.style.maxHeight = value;
    if (!this.ios) {
      return;
    }
    const val = _parseLength(value);
    switch (val.type) {
      case 'auto':
        this.ios.style.setMaxSizeHeight(0, MasonDimensionCompatType.Auto);
        break;
      case 'undefined':
        this.ios.style.setMaxSizeHeight(0, MasonDimensionCompatType.Undefined);
        break;
      case 'percent':
        this.ios.style.setMaxSizeHeight(val.value, MasonDimensionCompatType.Percent);
        break;
      case 'points':
        this.ios.style.setMaxSizeHeight(val.value, MasonDimensionCompatType.Points);
        break;
    }
  }
}
