import { borderBottomWidthProperty, borderLeftWidthProperty, borderRightWidthProperty, borderTopWidthProperty, heightProperty, Length, marginBottomProperty, marginLeftProperty, marginRightProperty, marginTopProperty, minHeightProperty, minWidthProperty, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, Utils, widthProperty } from '@nativescript/core';
import { aspectRatioProperty, bottomProperty, columnGapProperty, displayProperty, flexBasisProperty, flexDirectionProperty, leftProperty, positionProperty, rightProperty, rowGapProperty, topProperty, TSCViewBase } from './common';
import {
  _forceStyleUpdate,
  _getAlignContent,
  _getAlignItems,
  _getAlignSelf,
  _getAspectRatio,
  _getDisplay,
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

let JSIEnabled = false;

export class TSCView extends TSCViewBase {
  static {
    TSCMason.alwaysEnable = true;
    if (!JSIEnabled) {
      //@ts-ignore
      const module = new JSIModule();
      console.log(module.install());
      console.log('creating module');
      JSIEnabled = true;
    }
  }

  __masonStylePtr = 0;
  get _masonStylePtr() {
    if (this.__masonStylePtr === 0) {
      this.__masonStylePtr = this.ios?.masonStylePtr ?? 0;
    }
    return this.__masonStylePtr;
  }

  __masonNodePtr = 0;
  get _masonNodePtr() {
    if (this.__masonNodePtr === 0) {
      this.__masonNodePtr = this.ios?.masonNodePtr ?? 0;
    }
    return this.__masonNodePtr;
  }

  __masonPtr = 0;
  get _masonPtr() {
    if (this.__masonPtr === 0) {
      this.__masonPtr = this.ios?.masonPtr ?? 0;
    }
    return this.__masonPtr;
  }

  _hasNativeView = false;

  createNativeView() {
    const view = UIView.alloc().initWithFrame(CGRectZero);
    view.mason.isEnabled = true;
    this.style.minWidth = undefined;
    this.style.minHeight = undefined;
    // this._masonStylePtr = view.masonStylePtr;
    // this._masonNodePtr = view.masonNodePtr;
    // this._masonPtr = view.masonPtr;
    this._hasNativeView = true;
    return view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
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
  get ios() {
    return this.nativeViewProtected as UIView;
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this.nativeView;
    if (nativeView) {
      const width = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const height = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      this.setMeasuredDimension(width, height);

      this.ios.mason.computeMaxContent();

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

  //@ts-ignore
  get display() {
    return _getDisplay(this as any);
  }

  //@ts-ignore
  set display(value) {
    this.style.display = value as any;
  }

  [displayProperty.setNative](value) {
    _setDisplay(value, this as any);
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
    _setPosition(value, this as any);
  }

  //@ts-ignore
  set flexWrap(value) {
    this.style.flexWrap = value as any;
    _setFlexWrap(value, this as any);
  }

  //@ts-ignore
  get flexWrap() {
    return _getFlexWrap(this as any);
  }

  //@ts-ignore
  set alignItems(value) {
    this.style.alignItems = value as any;
    _setAlignItems(value, this as any);
  }

  //@ts-ignore
  get alignItems() {
    return _getAlignItems(this as any);
  }

  //@ts-ignore
  set alignSelf(value) {
    this.style.alignSelf = value as any;
    _setAlignSelf(value, this as any);
  }

  //@ts-ignore
  get alignSelf() {
    return _getAlignSelf(this as any);
  }

  //@ts-ignore
  set alignContent(value) {
    this.style.alignContent = value as any;
    _setAlignContent(value, this as any);
  }

  //@ts-ignore
  get alignContent() {
    return _getAlignContent(this as any);
  }

  //@ts-ignore
  set justifyItems(value) {
    this.style.justifyItems = value as any;
    _setJustifyItems(value, this as any);
  }

  //@ts-ignore
  get justifyItems() {
    return _getJustifyItems(this as any);
  }

  //@ts-ignore
  set justifySelf(value) {
    this.style.justifySelf = value as any;
    _setJustifySelf(value, this as any);
  }

  //@ts-ignore
  get justifySelf() {
    return _getJustifySelf(this as any);
  }

  //@ts-ignore
  set justifyContent(value) {
    this.style.justifyContent = value as any;
    _setJustifyContent(value, this as any);
  }

  //@ts-ignore
  get justifyContent() {
    return _getJustifyContent(this as any);
  }

  [leftProperty.setNative](value) {
    _setLeft(value, this as any);
  }

  [rightProperty.setNative](value) {
    _setRight(value, this as any);
  }

  [topProperty.setNative](value) {
    _setTop(value, this as any);
  }

  [bottomProperty.setNative](value) {
    _setBottom(value, this as any);
  }

  [marginLeftProperty.getDefault]() {
    return undefined;
  }

  [marginLeftProperty.setNative](value) {
    _setMarginLeft(value, this as any);
  }

  [marginRightProperty.getDefault]() {
    return undefined;
  }

  [marginRightProperty.setNative](value) {
    _setMarginRight(value, this as any);
  }

  [marginTopProperty.getDefault]() {
    return undefined;
  }

  [marginTopProperty.setNative](value) {
    _setMarginTop(value, this as any);
  }

  [marginBottomProperty.getDefault]() {
    return undefined;
  }

  [marginBottomProperty.setNative](value) {
    _setMarginBottom(value, this as any);
  }

  [borderLeftWidthProperty.getDefault]() {
    return undefined;
  }

  [borderLeftWidthProperty.setNative](value) {
    _setBorderLeft(value, this as any);
  }

  [borderRightWidthProperty.getDefault]() {
    return undefined;
  }

  [borderRightWidthProperty.setNative](value) {
    _setBorderRight(value, this as any);
  }

  [borderTopWidthProperty.getDefault]() {
    return undefined;
  }

  [borderTopWidthProperty.setNative](value) {
    _setBorderTop(value, this as any);
  }

  [borderBottomWidthProperty.getDefault]() {
    return undefined;
  }

  [borderBottomWidthProperty.setNative](value) {
    _setBorderBottom(value, this as any);
  }

  //@ts-ignore
  get flexGrow() {
    return _getFlexGrow(this as any);
  }

  set flexGrow(value) {
    _setFlexGrow(value, this as any);
  }

  //@ts-ignore
  get flexShrink() {
    return _getFlexShrink(this as any);
  }

  set flexShrink(value) {
    _setFlexShrink(value, this as any);
  }

  [flexBasisProperty.getDefault]() {
    return 'auto';
  }

  //@ts-ignore
  get flexBasis() {
    return _getFlexBasis(this as any);
  }

  [flexBasisProperty.setNative](value) {
    _setFlexBasis(value, this as any);
  }

  //@ts-ignore
  get gap() {
    return _getGap(this as any);
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
    return _getAspectRatio(this as any);
  }

  [aspectRatioProperty.setNative](value) {
    _setAspectRatio(value, this as any);
  }

  [paddingLeftProperty.getDefault]() {
    return undefined;
  }

  [paddingLeftProperty.setNative](value) {
    _setPaddingLeft(value, this as any);
  }

  [paddingTopProperty.getDefault]() {
    return undefined;
  }

  [paddingTopProperty.setNative](value) {
    _setPaddingTop(value, this as any);
  }

  [paddingRightProperty.getDefault]() {
    return undefined;
  }

  [paddingRightProperty.setNative](value) {
    _setPaddingRight(value, this as any);
  }

  [paddingBottomProperty.getDefault]() {
    return undefined;
  }

  [paddingBottomProperty.setNative](value) {
    _setPaddingBottom(value, this as any);
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
    _setFlexDirection(value, this as any);
  }

  //@ts-ignore
  set minWidth(value) {
    this.style.minWidth = value;
    _setMinWidth(value, this as any);
  }

  //@ts-ignore
  set minHeight(value) {
    this.style.minHeight = value;
    _setMinHeight(value, this as any);
  }

  //@ts-ignore
  set width(value) {
    this.style.width = value;
    _setWidth(value, this as any);
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
    _setHeight(value, this as any);
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
    _setMaxWidth(value, this as any);
  }

  //@ts-ignore
  set maxHeight(value) {
    this.style.maxHeight = value;
    _setMaxHeight(value, this as any);
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
