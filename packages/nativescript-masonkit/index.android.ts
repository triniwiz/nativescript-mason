import { aspectRatioProperty, bottomProperty, columnGapProperty, displayProperty, flexBasisProperty, flexDirectionProperty, gapProperty, gridColumnEndProperty, gridColumnStartProperty, gridRowEndProperty, gridRowStartProperty, leftProperty, positionProperty, rightProperty, rowGapProperty, topProperty, TSCViewBase } from './common';

import { paddingLeftProperty, paddingTopProperty, paddingRightProperty, paddingBottomProperty, Style, Length, widthProperty, heightProperty, View, Utils, Size, marginProperty, marginBottomProperty, marginLeftProperty, marginRightProperty, marginTopProperty, borderBottomWidthProperty, borderLeftWidthProperty, borderRightWidthProperty, borderTopWidthProperty } from '@nativescript/core';

import {
  JSIEnabled,
  _forceStyleUpdate,
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
  _isDirty,
  _markDirty,
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
  _getPosition,
  _setRight,
  _setTop,
  _setWidth,
  _getWidth,
  _getHeight,
  _getDisplay,
  _setGridColumnEnd,
  _setGridColumnStart,
  _setGridRowEnd,
  _setGridRowStart,
} from './helpers';

const BigIntZero = BigInt(0);

export class TSCView extends TSCViewBase {
  static {
    org.nativescript.mason.masonkit.Mason.setShared(false);
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
    _forceStyleUpdate(this as any);
  }

  markDirty() {
    _markDirty(this as any);
  }

  isDirty() {
    return _isDirty(this as any);
  }

  //@ts-ignore
  get android() {
    return this.nativeViewProtected as org.nativescript.mason.masonkit.View;
  }

  public _addViewToNativeVisualTree(child: View, atIndex: number = Number.MAX_VALUE): boolean {
    super._addViewToNativeVisualTree(child);
    const nativeView = this.nativeViewProtected as org.nativescript.mason.masonkit.View;

    if (nativeView && child.nativeViewProtected) {
      (nativeView as any).addView(child.nativeViewProtected, -1);

      return true;
    }

    return false;
  }

  //@ts-ignore
  get display() {
    return _getDisplay(this);
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
    return _getPosition(this);
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
    return _getWidth(this);
  }

  //@ts-ignore
  set height(value) {
    this.style.height = value;
    _setHeight(value, this);
  }

  //@ts-ignore
  get height() {
    return _getHeight(this);
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

  [gridColumnStartProperty.setNative](value) {
    _setGridColumnStart(value, this as any);
  }

  //@ts-ignore
  get gridColumnStart() {
    return this.style.gridColumnStart;
  }

  //@ts-ignore
  set gridColumnEnd(value) {
    this.style.gridColumnEnd = value;
  }

  [gridColumnEndProperty.setNative](value) {
    _setGridColumnEnd(value, this as any);
  }

  //@ts-ignore
  get gridColumnEnd() {
    return this.style.gridColumnEnd;
  }

  //@ts-ignore
  set gridRowStart(value) {
    this.style.gridRowStart = value;
  }

  [gridRowStartProperty.setNative](value) {
    _setGridRowStart(value, this as any);
  }

  //@ts-ignore
  get gridRowStart() {
    return this.style.gridRowStart;
  }

  //@ts-ignore
  set gridRowEnd(value) {
    this.style.gridRowEnd = value;
  }

  [gridRowEndProperty.setNative](value) {
    _setGridRowEnd(value, this as any);
  }

  //@ts-ignore
  get gridRowEnd() {
    return this.style.gridRowEnd;
  }
}
