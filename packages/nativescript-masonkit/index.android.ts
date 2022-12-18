import { TSCViewBase } from './common';

import { paddingLeftProperty, paddingTopProperty, paddingRightProperty, paddingBottomProperty, Style, Length, widthProperty, heightProperty, View, Utils } from '@nativescript/core';
import { alignSelfProperty } from '@nativescript/core/ui/layouts/flexbox-layout';

declare const __non_webpack_require__;

let JSIEnabled = true;

const enum MasonDimensionCompatType {
  Points = 0,

  Percent = 1,

  Auto = 2,

  Undefined = 3,
}

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
    }
  }

  return { value: value, type: 'points' };
}

function _setDisplay(value, instance: TSCView, initial = false) {
  if (initial && value === 'flex') {
    return;
  }

  if (instance._hasNativeView) {
    // console.log('instance._masonStylePtr', instance._masonStylePtr, JSIEnabled)
    if (JSIEnabled) {
      switch (value) {
        case 'flex':
          global.__Mason_setDisplay(instance._masonStylePtr, 0);
          break;
        case 'none':
          global.__Mason_setDisplay(instance._masonStylePtr, 1);
          break;
      }
    } else {
      switch (value) {
        case 'flex':
          {
            const style = instance.android.getStyle();
            style.setDisplay(org.nativescript.mason.masonkit.Display.Flex);
            instance.android.setStyle(style);
          }
          break;
        case 'none':
          const style = instance.android.getStyle();
          style.setDisplay(org.nativescript.mason.masonkit.Display.None);
          instance.android.setStyle(style);
          break;
      }
    }
  }
}

function _setWidth(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonStylePtr, 0, MasonDimensionCompatType.Auto);
      } else {
        instance.ios.style.setSizeWidth(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined);
      } else {
        instance.ios.style.setSizeWidth(0, MasonDimensionCompatType.Undefined);
      }

      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent);
      } else {
        instance.ios.style.setSizeWidth(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonStylePtr, val.value, MasonDimensionCompatType.Points);
      } else {
        instance.ios.style.setSizeWidth(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

function _setHeight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);

  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonStylePtr, 0, MasonDimensionCompatType.Auto);
      } else {
        instance.ios.style.setSizeHeight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined);
      } else {
        instance.ios.style.setSizeHeight(0, MasonDimensionCompatType.Undefined);
      }

      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent);
      } else {
        instance.ios.style.setSizeHeight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonStylePtr, val.value, MasonDimensionCompatType.Points);
      } else {
        instance.ios.style.setSizeHeight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

/*

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

*/

export class TSCView extends TSCViewBase {
  __masonStylePtr = 0;
  get _masonStylePtr() {
    if (this.__masonStylePtr === 0) {
      this.__masonStylePtr = parseInt((this.android as any)?.getMasonStylePtr?.()?.toString?.() ?? '0');
    }
    return this.__masonStylePtr;
  }

  __masonNodePtr = 0;
  get _masonNodePtr() {
    if (this.__masonNodePtr === 0) {
      this.__masonNodePtr = parseInt((this.android as any)?.getMasonNodePtr?.()?.toString?.() ?? '0');
    }
    return this.__masonNodePtr;
  }

  __masonPtr = 0;
  get _masonPtr() {
    if (this.__masonPtr === 0) {
      this.__masonPtr = parseInt((this.android as any)?.getMasonPtr?.()?.toString?.() ?? '0');
    }
    return this.__masonPtr;
  }

  _hasNativeView = false;

  createNativeView() {
    const view = new org.nativescript.mason.masonkit.View(this._context) as any;
    this._hasNativeView = true;
    return view;
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

  //@ts-ignore
  get display() {
    if (!this.android) {
      return 'flex';
    }

    if (JSIEnabled) {
      const value = global.__Mason_getDisplay(this._masonStylePtr);
      console.log('value', value);
      switch (value) {
        case 0:
          return 'flex';
        case 1:
          return 'none';
      }
    } else {
      switch (this.android.getStyle().getDisplay()) {
        case org.nativescript.mason.masonkit.Display.Flex:
          return 'flex';
        case org.nativescript.mason.masonkit.Display.None:
          return 'none';
      }
    }
  }

  //@ts-ignore
  set display(value) {
    _setDisplay(value, this);
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

  set flexDirection(value) {
    this.style.flexDirection = value;
    // _setFlexDirection(value, this.ios);
  }

  [alignSelfProperty.setNative](value) {
    // _setAlignSelf(value, this.ios);
  }

  // //@ts-ignore
  // set alignSelf(value) {
  //   console.log(value);
  //   this.style.alignSelf = value;
  //   _setAlignSelf(value, this.ios);
  // }

  /* //@ts-ignore
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
  */

  //@ts-ignore
  set width(value) {
    this.style.width = value;
    _setWidth(value, this);
  }

  //@ts-ignore
  get width() {
    if (!this.ios) {
      return this.style.width;
    }
    if (JSIEnabled) {
      return global.__Mason_getWidth(this._masonStylePtr);
    } else {
      // todo
      // return this.ios.mason.style.sizeCompatWidth.cssValue;
      return 0;
    }
  }

  //@ts-ignore
  set height(value) {
    this.style.height = value;
    _setHeight(value, this);
  }

  //@ts-ignore
  get height() {
    if (!this.ios) {
      return this.style.height;
    }
    if (JSIEnabled) {
      return global.__Mason_getHeight(this._masonStylePtr);
    } else {
      // todo
      //return this.ios.mason.style.sizeCompatHeight.cssValue;
      return 0;
    }
  }

  set maxWidth(value) {
    this.style.maxWidth = value;
    if (!this.ios) {
      return;
    }
    const val = _parseLength(value);
    /* switch (val.type) {
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

    */
  }

  set maxHeight(value) {
    this.style.maxHeight = value;
    if (!this.ios) {
      return;
    }
    /* const val = _parseLength(value);
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
    }*/
  }
}
