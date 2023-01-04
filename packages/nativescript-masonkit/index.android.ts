import { aspectRatioProperty, bottomProperty, columnGapProperty, displayProperty, flexBasisProperty, flexDirectionProperty, gapProperty, leftProperty, positionProperty, rightProperty, rowGapProperty, topProperty, TSCViewBase } from './common';

import { paddingLeftProperty, paddingTopProperty, paddingRightProperty, paddingBottomProperty, Style, Length, widthProperty, heightProperty, View, Utils, Size, marginProperty, marginBottomProperty, marginLeftProperty, marginRightProperty, marginTopProperty, borderBottomWidthProperty, borderLeftWidthProperty, borderRightWidthProperty, borderTopWidthProperty } from '@nativescript/core';

import {
  JSIEnabled,
  _getAlignContent,
  _getAlignItems,
  _getAlignSelf,
  _getAspectRatio,
  _getFlexBasis,
  _getFlexGrow,
  _getFlexShrink,
  _getFlexWrap,
  _getGap,
  _getJustifyContent,
  _getJustifyItems,
  _getJustifySelf,
  _parseDimension,
  _setAlignContent,
  _setAlignItems,
  _setAlignSelf,
  _setAspectRatio,
  _setBorderBottom,
  _setBorderLeft,
  _setBorderRight,
  _setBorderTop,
  _setBottom,
  _setDisplay,
  _setFlexBasis,
  _setFlexDirection,
  _setFlexGrow,
  _setFlexShrink,
  _setFlexWrap,
  _setGap,
  _setHeight,
  _setJustifyContent,
  _setJustifyItems,
  _setJustifySelf,
  _setLeft,
  _setMarginBottom,
  _setMarginLeft,
  _setMarginRight,
  _setMarginTop,
  _setMaxHeight,
  _setMaxWidth,
  _setMinHeight,
  _setMinWidth,
  _setPaddingBottom,
  _setPaddingLeft,
  _setPaddingRight,
  _setPaddingTop,
  _setPosition,
  _setRight,
  _setTop,
  _setWidth,
} from './helpers';

const BigIntZero = BigInt(0);

export class TSCView extends TSCViewBase {
  static {
    org.nativescript.mason.masonkit.Mason.setShared(true);
  }
  __masonStylePtr = BigIntZero;
  get _masonStylePtr() {
    if (this.__masonStylePtr === BigIntZero) {
      this.__masonStylePtr = BigInt((this.android as any)?.getMasonStylePtr?.()?.toString?.() ?? '0');
    }
    return this.__masonStylePtr;
  }

  __masonNodePtr = BigIntZero;
  get _masonNodePtr() {
    if (this.__masonNodePtr === BigIntZero) {
      this.__masonNodePtr = BigInt((this.android as any)?.getMasonNodePtr?.()?.toString?.() ?? '0');
    }
    return this.__masonNodePtr;
  }

  __masonPtr = BigIntZero;
  get _masonPtr() {
    if (this.__masonPtr === BigIntZero) {
      this.__masonPtr = BigInt(org.nativescript.mason.masonkit.Mason.getInstance().getNativePtr().toString());
    }
    return this.__masonPtr;
  }

  _hasNativeView = false;
  _inBatch = false;

  createNativeView() {
    const view = new org.nativescript.mason.masonkit.View(this._context) as any;
    this._hasNativeView = true;
    return view;
  }

  forceStyleUpdate() {
    if (JSIEnabled) {
      global.__Mason_updateNodeAndStyle(this._masonPtr, this._masonNodePtr, this._masonStylePtr);
    } else {
      (this.android as any)?.updateNodeAndStyle?.();
    }
  }

  markDirty() {
    if (JSIEnabled) {
      global.__Mason_markDirty(this._masonPtr, this._masonNodePtr);
    } else {
      (this.android as any)?.markNodeDirty?.();
    }
  }

  isDirty() {
    if (JSIEnabled) {
      return global.__Mason_isDirty(this._masonPtr, this._masonNodePtr);
    } else {
      (this.android as any)?.isNodeDirty?.();
    }
  }

  //@ts-ignore
  get android() {
    return this.nativeViewProtected as org.nativescript.mason.masonkit.View;
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
    if (!this._hasNativeView) {
      return this.style.display;
    }

    if (JSIEnabled) {
      const value = global.__Mason_getDisplay(this._masonStylePtr);
      switch (value) {
        case 0:
          return 'none';
        case 1:
          return 'flex';
        case 2:
          return 'grid';
      }
    } else {
      switch (this.android.getDisplay()) {
        case org.nativescript.mason.masonkit.Display.Flex:
          return 'flex';
        case org.nativescript.mason.masonkit.Display.None:
          return 'none';
      }
    }
  }

  //@ts-ignore
  set display(value) {
    this.style.display = value as any;
  }

  [displayProperty.setNative](value) {
    _setDisplay(value, this);
  }

  //@ts-ignore
  set position(value) {
    this.style.position = value;
  }

  //@ts-ignore
  get position() {
    if (!this._hasNativeView) {
      return this.style.position;
    }

    if (JSIEnabled) {
      const value = global.__Mason_getPosition(this._masonStylePtr);
      switch (value) {
        case 0:
          return 'relative';
        case 1:
          return 'absolute';
      }
    } else {
      switch (this.android.getPosition()) {
        case org.nativescript.mason.masonkit.Position.Absolute:
          return 'absolute';
        case org.nativescript.mason.masonkit.Position.Relative:
          return 'relative';
      }
    }
  }

  [positionProperty.setNative](value) {
    _setPosition(value, this);
  }

  //@ts-ignore
  set flexWrap(value) {
    this.style.flexWrap = value as any;
    _setFlexWrap(value, this);
  }

  //@ts-ignore
  get flexWrap() {
    return _getFlexWrap(this);
  }

  //@ts-ignore
  set alignItems(value) {
    this.style.alignItems = value as any;
    _setAlignItems(value, this);
  }

  //@ts-ignore
  get alignItems() {
    return _getAlignItems(this);
  }

  //@ts-ignore
  set alignSelf(value) {
    this.style.alignSelf = value as any;
    _setAlignSelf(value, this);
  }

  //@ts-ignore
  get alignSelf() {
    return _getAlignSelf(this);
  }

  //@ts-ignore
  set alignContent(value) {
    this.style.alignContent = value as any;
    _setAlignContent(value, this);
  }

  //@ts-ignore
  get alignContent() {
    return _getAlignContent(this);
  }

  //@ts-ignore
  set justifyItems(value) {
    this.style.justifyItems = value as any;
    _setJustifyItems(value, this);
  }

  //@ts-ignore
  get justifyItems() {
    return _getJustifyItems(this);
  }

  //@ts-ignore
  set justifySelf(value) {
    this.style.justifySelf = value as any;
    _setJustifySelf(value, this);
  }

  //@ts-ignore
  get justifySelf() {
    return _getJustifySelf(this);
  }

  //@ts-ignore
  set justifyContent(value) {
    this.style.justifyContent = value as any;
    _setJustifyContent(value, this);
  }

  //@ts-ignore
  get justifyContent() {
    return _getJustifyContent(this);
  }

  [leftProperty.setNative](value) {
    _setLeft(value, this);
  }

  [rightProperty.setNative](value) {
    _setRight(value, this);
  }

  [topProperty.setNative](value) {
    _setTop(value, this);
  }

  [bottomProperty.setNative](value) {
    _setBottom(value, this);
  }

  [marginLeftProperty.getDefault]() {
    return undefined;
  }

  [marginLeftProperty.setNative](value) {
    _setMarginLeft(value, this);
  }

  [marginRightProperty.getDefault]() {
    return undefined;
  }

  [marginRightProperty.setNative](value) {
    _setMarginRight(value, this);
  }

  [marginTopProperty.getDefault]() {
    return undefined;
  }

  [marginTopProperty.setNative](value) {
    _setMarginTop(value, this);
  }

  [marginBottomProperty.getDefault]() {
    return undefined;
  }

  [marginBottomProperty.setNative](value) {
    _setMarginBottom(value, this);
  }

  [borderLeftWidthProperty.getDefault]() {
    return undefined;
  }

  [borderLeftWidthProperty.setNative](value) {
    _setBorderLeft(value, this);
  }

  [borderRightWidthProperty.getDefault]() {
    return undefined;
  }

  [borderRightWidthProperty.setNative](value) {
    _setBorderRight(value, this);
  }

  [borderTopWidthProperty.getDefault]() {
    return undefined;
  }

  [borderTopWidthProperty.setNative](value) {
    _setBorderTop(value, this);
  }

  [borderBottomWidthProperty.getDefault]() {
    return undefined;
  }

  [borderBottomWidthProperty.setNative](value) {
    _setBorderBottom(value, this);
  }

  //@ts-ignore
  get flexGrow() {
    return _getFlexGrow(this);
  }

  set flexGrow(value) {
    _setFlexGrow(value, this);
  }

  //@ts-ignore
  get flexShrink() {
    return _getFlexShrink(this);
  }

  set flexShrink(value) {
    _setFlexShrink(value, this);
  }

  [flexBasisProperty.getDefault]() {
    return 'auto';
  }

  //@ts-ignore
  get flexBasis() {
    return _getFlexBasis(this);
  }

  [flexBasisProperty.setNative](value) {
    _setFlexBasis(value, this);
  }

  //@ts-ignore
  get gap() {
    return _getGap(this);
  }

  set gap(value) {
    this.style.gap = value;
  }

  [rowGapProperty.getDefault]() {
    return 0;
  }

  [rowGapProperty.setNative](value) {
    // TODO
  }

  [columnGapProperty.getDefault]() {
    return 0;
  }

  [columnGapProperty.setNative](value) {
    // TODO
  }

  [aspectRatioProperty.getDefault]() {
    return undefined;
  }

  //@ts-ignore
  get aspectRatio() {
    return _getAspectRatio(this);
  }

  [aspectRatioProperty.setNative](value) {
    _setAspectRatio(value, this);
  }

  [paddingLeftProperty.getDefault]() {
    return undefined;
  }

  [paddingLeftProperty.setNative](value) {
    _setPaddingLeft(value, this);
  }

  [paddingTopProperty.getDefault]() {
    return undefined;
  }

  [paddingTopProperty.setNative](value) {
    _setPaddingTop(value, this);
  }

  [paddingRightProperty.getDefault]() {
    return undefined;
  }

  [paddingRightProperty.setNative](value) {
    _setPaddingRight(value, this);
  }

  [paddingBottomProperty.getDefault]() {
    return undefined;
  }

  [paddingBottomProperty.setNative](value) {
    _setPaddingBottom(value, this);
  }

  // [widthProperty.setNative](value) {
  //   console.log('widthProperty', value);
  // }

  // [heightProperty.setNative](value) {
  //   console.log('heightProperty', value);
  // }

  //@ts-ignore
  set flexDirection(value) {
    this.style.flexDirection = value;
  }

  [flexDirectionProperty.setNative](value) {
    _setFlexDirection(value, this);
  }

  //@ts-ignore
  set minWidth(value) {
    this.style.minWidth = value;
    _setMinWidth(value, this);
  }

  //@ts-ignore
  set minHeight(value) {
    this.style.minHeight = value;
    _setMinHeight(value, this);
  }

  //@ts-ignore
  set width(value) {
    this.style.width = value;
    _setWidth(value, this);
  }

  //@ts-ignore
  get width() {
    if (!this._hasNativeView) {
      return this.style.width;
    }
    if (JSIEnabled) {
      return global.__Mason_getWidth(this._masonStylePtr);
    } else {
      return _parseDimension(this.android.getSizeWidth());
      //  return JSON.parse(this.android.getSizeJsonValue())?.width;
    }
  }

  //@ts-ignore
  set height(value) {
    this.style.height = value;
    _setHeight(value, this);
  }

  //@ts-ignore
  get height() {
    if (!this._hasNativeView) {
      return this.style.height;
    }
    if (JSIEnabled) {
      return global.__Mason_getHeight(this._masonStylePtr);
    } else {
      return _parseDimension(this.android.getSizeHeight());
      // return JSON.parse(this.android.getSizeJsonValue())?.height;
    }
  }

  //@ts-ignore
  set maxWidth(value) {
    this.style.maxWidth = value;
    _setMaxWidth(value, this);
  }

  //@ts-ignore
  set maxHeight(value) {
    this.style.maxHeight = value;
    _setMaxHeight(value, this);
  }

  //@ts-ignore
  set gridAutoRows(value) {
    this.style.gridAutoRows = value;
  }

  //@ts-ignore
  get gridAutoRows() {
    return this.style.gridAutoRows;
  }

  //@ts-ignore
  set gridAutoColumns(value) {
    this.style.gridAutoColumns = value;
  }

  //@ts-ignore
  get gridAutoColumns() {
    return this.style.gridAutoColumns;
  }

  //@ts-ignore
  set gridAutoFlow(value) {
    this.style.gridAutoFlow = value;
  }

  //@ts-ignore
  get gridAutoFlow() {
    return this.style.gridAutoFlow;
  }

  //@ts-ignore
  set gridColumnStart(value) {
    this.style.gridColumnStart = value;
  }

  //@ts-ignore
  get gridColumnStart() {
    return this.style.gridColumnStart;
  }

  //@ts-ignore
  set gridColumnEnd(value) {
    this.style.gridColumnEnd = value;
  }

  //@ts-ignore
  get gridColumnEnd() {
    return this.style.gridColumnEnd;
  }

  //@ts-ignore
  set gridRowStart(value) {
    this.style.gridRowStart = value;
  }

  //@ts-ignore
  get gridRowStart() {
    return this.style.gridRowStart;
  }

  //@ts-ignore
  set gridRowEnd(value) {
    this.style.gridRowEnd = value;
  }

  //@ts-ignore
  get gridRowEnd() {
    return this.style.gridRowEnd;
  }
}
