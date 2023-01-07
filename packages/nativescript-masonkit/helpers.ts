declare const __non_webpack_require__, JSIModule;

import { Length, Utils } from '@nativescript/core';
import { TSCViewBase } from './common';

import { AlignSelf as AlignSelfType } from '.';

const enum GridPlacementCompatType {
  Auto = 0,

  Line = 1,

  Span = 2,
}

export const enum FlexWrap {
  NoWrap = 0,

  Wrap = 1,

  WrapReverse = 2,
}

export const enum FlexDirection {
  Row = 0,

  Column = 1,

  RowReverse = 2,

  ColumnReverse = 3,
}

const enum MasonLengthPercentageAutoCompatType {
  Auto = 0,

  Points = 1,

  Percent = 2,
}

const enum MasonLengthPercentageCompatType {
  Points = 0,

  Percent = 1,
}

export const enum MasonDimensionCompatType {
  Auto = 0,

  Points = 1,

  Percent = 2,
}

export const enum PositionType {
  Relative = 0,

  Absolute = 1,
}

export const enum AlignContent {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Stretch = 3,

  SpaceBetween = 4,

  SpaceAround = 5,

  SpaceEvenly = 6,
}

export const enum AlignItems {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

export const enum AlignSelf {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

export const enum JustifyContent {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Stretch = 3,

  SpaceBetween = 4,

  SpaceAround = 5,

  SpaceEvenly = 6,
}

export const enum JustifyItems {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

export const enum JustifySelf {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

type TSCView = TSCViewBase & {
  _hasNativeView: boolean;
  _masonPtr: any;
  _masonNodePtr: any;
  _masonStylePtr: any;
  _inBatch: boolean;
  ios: UIView;
  android: org.nativescript.mason.masonkit.View;
};

export let JSIEnabled = false;

if (global.isAndroid) {
  try {
    //  __non_webpack_require__('system_lib://libmasonnativev8.so');
    JSIEnabled = false;
  } catch (error) {
    console.warn('Failed to enable on FastAPI', error);
  }
}

if (global.isIOS) {
  TSCMason.alwaysEnable = true;
  if (!JSIEnabled) {
    try {
      //@ts-ignore
      const module = new global.JSIModule();
      console.log(module.install());
      JSIEnabled = true;
    } catch (error) {
      console.warn('Failed to enable on FastAPI', error);
    }
  }
}

export function _forceStyleUpdate(instance: TSCView) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_updateNodeAndStyle(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      instance.android.updateNodeAndStyle();
    }

    if (global.isIOS) {
      instance.ios.mason.updateNodeStyle();
    }
  }
}

export function _markDirty(instance: TSCView) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_markDirty(instance._masonPtr, instance._masonNodePtr);
  } else {
    if (global.isAndroid) {
      instance.android.markNodeDirty();
    }

    if (global.isIOS) {
      instance.ios.mason.markDirty();
    }
  }
}

export function _isDirty(instance: TSCView) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    return global.__Mason_isDirty(instance._masonPtr, instance._masonNodePtr);
  } else {
    if (global.isAndroid) {
      return instance.android.isNodeDirty();
    }

    if (global.isAndroid) {
      return instance.ios.mason.isDirty;
    }
  }

  return false;
}

export function _intoType(type: 'auto' | 'points' | 'percent') {
  switch (type) {
    case 'auto':
      return MasonDimensionCompatType.Auto;
    case 'points':
      return MasonDimensionCompatType.Points;
    case 'percent':
      return MasonDimensionCompatType.Percent;
    default:
      return MasonDimensionCompatType.Auto;
  }
}

export function _parseDimension(dim: org.nativescript.mason.masonkit.Dimension | MasonDimensionCompat) {
  if (global.isIOS) {
    const type = (<any>dim).type;
    const value = (<any>dim).value;
    switch (type) {
      case MasonDimensionCompatType.Auto:
        return 'auto';
      case MasonDimensionCompatType.Points:
        return { value: value, unit: 'px' };
      case MasonDimensionCompatType.Percent:
        return { value: value, unit: '%' };
    }
  }
  const name = (dim as any).getClass().getName();
  switch (name) {
    case 'org.nativescript.mason.masonkit.Dimension$Points':
      return { value: (dim as org.nativescript.mason.masonkit.Dimension.Points).getPoints(), unit: 'px' };
    case 'org.nativescript.mason.masonkit.Dimension$Percent':
      return { value: (dim as org.nativescript.mason.masonkit.Dimension.Percent).getPercentage(), unit: '%' };
    case 'org.nativescript.mason.masonkit.Dimension$Auto':
      return 'auto';
  }
}

export function _parseLengthPercentage(dim: org.nativescript.mason.masonkit.LengthPercentage | MasonLengthPercentageCompat) {
  if (global.isIOS) {
    const type = (<any>dim).type;
    const value = (<any>dim).value;
    switch (type) {
      case MasonLengthPercentageCompatType.Points:
        return { value: value, unit: 'px' };
      case MasonLengthPercentageCompatType.Percent:
        return { value: value, unit: '%' };
    }
  }
  const name = (dim as any).getClass().getName();
  switch (name) {
    case 'org.nativescript.mason.masonkit.LengthPercentage$Points':
      return { value: (dim as org.nativescript.mason.masonkit.LengthPercentage.Points).getPoints(), unit: 'px' };
    case 'org.nativescript.mason.masonkit.LengthPercentage$Percent':
      return { value: (dim as org.nativescript.mason.masonkit.LengthPercentage.Percent).getPercentage(), unit: '%' };
    case 'org.nativescript.mason.masonkit.LengthPercentage$Auto':
      return 'auto';
  }
}

export function _parseLengthPercentageAuto(dim: org.nativescript.mason.masonkit.LengthPercentageAuto | MasonLengthPercentageAutoCompat) {
  if (global.isIOS) {
    const type = (<any>dim).type;
    const value = (<any>dim).value;
    switch (type) {
      case MasonLengthPercentageAutoCompatType.Auto:
        return 'auto';
      case MasonLengthPercentageAutoCompatType.Points:
        return { value: value, unit: 'px' };
      case MasonLengthPercentageAutoCompatType.Percent:
        return { value: value, unit: '%' };
    }
  }
  const name = (dim as any).getClass().getName();
  switch (name) {
    case 'org.nativescript.mason.masonkit.LengthPercentageAuto$Points':
      return { value: (dim as org.nativescript.mason.masonkit.LengthPercentageAuto.Points).getPoints(), unit: 'px' };
    case 'org.nativescript.mason.masonkit.LengthPercentageAuto$Percent':
      return { value: (dim as org.nativescript.mason.masonkit.LengthPercentageAuto.Percent).getPercentage(), unit: '%' };
    case 'org.nativescript.mason.masonkit.LengthPercentageAuto$Auto':
      return 'auto';
  }
}

export function _toMasonDimension(value): { value: number; type: 'auto' | 'points' | 'percent'; native_type: MasonDimensionCompatType } {
  if (value === undefined || value === null) {
    return value;
  }
  if (value === 'auto') {
    return { value: 0, type: 'auto', native_type: MasonDimensionCompatType.Auto };
  }

  const typeOf = typeof value;
  if (typeOf === 'object') {
    switch (value?.unit) {
      case '%':
        return { value: value.value, type: 'percent', native_type: MasonDimensionCompatType.Percent };
      case 'px':
        return { value: value.value, type: 'points', native_type: MasonDimensionCompatType.Points };
      case 'dip':
        return { value: Utils.layout.toDevicePixels(value.value), type: 'points', native_type: MasonDimensionCompatType.Points };
    }
  }

  if (typeOf === 'number') {
    return { value: Utils.layout.toDevicePixels(value), type: 'points', native_type: MasonDimensionCompatType.Points };
  }

  return { value: value, type: 'points', native_type: MasonDimensionCompatType.Points };
}

export function _intoMasonDimension(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (global.isIOS) {
    if (value === 'auto') {
      return MasonDimensionCompat.Auto;
    }

    const typeOf = typeof value;
    if (typeOf === 'object') {
      switch (value?.unit) {
        case '%':
          return MasonDimensionCompat.alloc().initWithPercent(value.value);
        case 'px':
          return MasonDimensionCompat.alloc().initWithPoints(value.value);
        case 'dip':
          return MasonDimensionCompat.alloc().initWithPoints(Utils.layout.toDevicePixels(value.value));
      }
    }

    if (typeOf === 'number') {
      return MasonDimensionCompat.alloc().initWithPoints(Utils.layout.toDevicePixels(value));
    }

    return MasonDimensionCompat.alloc().initWithPoints(Utils.layout.toDevicePixels(value));
  }

  if (global.isAndroid) {
    if (value === 'auto') {
      return org.nativescript.mason.masonkit.Dimension.Auto;
    }

    const typeOf = typeof value;
    if (typeOf === 'object') {
      switch (value?.unit) {
        case '%':
          return new org.nativescript.mason.masonkit.Dimension.Percent(value.value);
        case 'px':
          return new org.nativescript.mason.masonkit.Dimension.Points(value.value);
        case 'dip':
          return new org.nativescript.mason.masonkit.Dimension.Points(Utils.layout.toDevicePixels(value.value));
      }
    }

    if (typeOf === 'number') {
      return new org.nativescript.mason.masonkit.Dimension.Points(Utils.layout.toDevicePixels(value));
    }

    return new org.nativescript.mason.masonkit.Dimension.Points(Utils.layout.toDevicePixels(value));
  }

  return null;
}

export function _toLengthPercentageAuto(value): { value: number; type: 'auto' | 'points' | 'percent'; native_type: MasonLengthPercentageAutoCompatType } {
  if (value === undefined || value === null) {
    return value;
  }
  if (value === 'auto') {
    return { value: 0, type: 'auto', native_type: MasonLengthPercentageAutoCompatType.Auto };
  }

  const typeOf = typeof value;
  if (typeOf === 'object') {
    switch (value?.unit) {
      case '%':
        return { value: value.value, type: 'percent', native_type: MasonLengthPercentageAutoCompatType.Percent };
      case 'px':
        return { value: value.value, type: 'points', native_type: MasonLengthPercentageAutoCompatType.Points };
      case 'dip':
        return { value: Utils.layout.toDevicePixels(value.value), type: 'points', native_type: MasonLengthPercentageAutoCompatType.Points };
    }
  }

  if (typeOf === 'number') {
    return { value: Utils.layout.toDevicePixels(value), type: 'points', native_type: MasonLengthPercentageAutoCompatType.Points };
  }

  return { value: value, type: 'points', native_type: MasonLengthPercentageAutoCompatType.Points };
}

export function _toLengthPercentage(value): { value: number; type: 'points' | 'percent'; native_type: MasonLengthPercentageCompatType } {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Length.parse(value);
    if (parsed) {
      value = parsed;
    }
  }

  const typeOf = typeof value;
  if (typeOf === 'object') {
    switch (value?.unit) {
      case '%':
        return { value: value.value, type: 'percent', native_type: MasonLengthPercentageCompatType.Percent };
      case 'px':
        return { value: value.value, type: 'points', native_type: MasonLengthPercentageCompatType.Points };
      case 'dip':
        return { value: Utils.layout.toDevicePixels(value.value), type: 'points', native_type: MasonLengthPercentageCompatType.Points };
    }
  }

  if (typeOf === 'number') {
    return { value: Utils.layout.toDevicePixels(value), type: 'points', native_type: MasonLengthPercentageCompatType.Points };
  }

  return { value: value, type: 'points', native_type: MasonLengthPercentageCompatType.Points };
}

export function _setDisplay(value, instance: TSCView, initial = false) {
  if (initial && value === 'flex') {
    return;
  }

  if (instance._hasNativeView) {
    if (JSIEnabled) {
      let nativeValue = -1;

      switch (value) {
        case 'none':
          nativeValue = Display.None;
          break;
        case 'flex':
          nativeValue = Display.Flex;
          break;
        case 'grid':
          nativeValue = Display.Grid;
          break;
      }

      if (nativeValue !== -1) {
        global.__Mason_setDisplay(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      }
    } else {
      if (global.isAndroid) {
        let nativeValue: org.nativescript.mason.masonkit.Display = null;
        switch (value) {
          case 'flex':
            nativeValue = org.nativescript.mason.masonkit.Display.Flex;
            break;
          case 'grid':
            nativeValue = org.nativescript.mason.masonkit.Display.Grid;
            break;
          case 'none':
            nativeValue = org.nativescript.mason.masonkit.Display.None;
            break;
        }
        if (nativeValue) {
          instance.android.setDisplay(nativeValue);
        }
      }

      if (global.isIOS) {
        let nativeValue = -1;
        switch (value) {
          case 'flex':
            nativeValue = Display.Flex;
            break;
          case 'grid':
            nativeValue = Display.Grid;
            break;
          case 'none':
            nativeValue = Display.None;
            break;
        }

        if (nativeValue !== -1) {
          instance.ios.display = nativeValue;
        }
      }
    }
  }
}

export function _getDisplay(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.display;
  }

  if (JSIEnabled) {
    const value = global.__Mason_getDisplay(instance._masonStylePtr);
    switch (value) {
      case 0:
        return 'none';
      case 1:
        return 'flex';
      case 2:
        return 'grid';
    }
  } else {
    if (global.isAndroid) {
      switch (instance.android.getDisplay()) {
        case org.nativescript.mason.masonkit.Display.None:
          return 'none';
        case org.nativescript.mason.masonkit.Display.Flex:
          return 'flex';
        case org.nativescript.mason.masonkit.Display.Grid:
          return 'grid';
      }
    }

    if (global.isIOS) {
      switch (instance.ios.display) {
        case Display.None:
          return 'none';
        case Display.Flex:
          return 'flex';
        case Display.Grid:
          return 'grid';
      }
    }
  }

  return instance.style.display;
}

export function _setMinWidth(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toMasonDimension(value);
  if (JSIEnabled) {
    global.__Mason_setMinWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMinSizeWidth(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMinSizeWidth(val.value, val.native_type);
    }
  }
}

export function _getMinWidth(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.minWidth;
  }
  if (JSIEnabled) {
    return global.__Mason_getMinWidth(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return _parseDimension(instance.android.getMinSizeWidth());
    }

    if (global.isIOS) {
      return _parseDimension(instance.ios.getMinSizeWidth());
    }
  }
}

export function _setMinHeight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toMasonDimension(value);
  if (JSIEnabled) {
    global.__Mason_setMinHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMinSizeHeight(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMinSizeHeight(val.value, val.native_type);
    }
  }
}

export function _getMinHeight(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.minHeight;
  }
  if (JSIEnabled) {
    return global.__Mason_getMinHeight(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return _parseDimension(instance.android.getMinSizeHeight());
    }

    if (global.isIOS) {
      return _parseDimension(instance.ios.getMinSizeHeight());
    }
  }
}

export function _setWidth(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toMasonDimension(value);
  if (JSIEnabled) {
    global.__Mason_setWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setSizeWidth(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setSizeWidth(val.value, val.native_type);
    }
  }
}

export function _getWidth(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.width;
  }
  if (JSIEnabled) {
    return global.__Mason_getWidth(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return _parseDimension(instance.android.getSizeWidth());
    }

    if (global.isIOS) {
      return _parseDimension(instance.ios.getSizeWidth());
    }
  }
}

export function _setHeight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toMasonDimension(value);

  if (JSIEnabled) {
    global.__Mason_setHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setSizeHeight(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setSizeHeight(val.value, val.native_type);
    }
  }
}

export function _getHeight(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.height;
  }
  if (JSIEnabled) {
    return global.__Mason_getHeight(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return _parseDimension(instance.android.getSizeHeight());
    }

    if (global.isIOS) {
      return _parseDimension(instance.ios.getSizeHeight());
    }
  }
}

export function _setMaxWidth(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toMasonDimension(value);

  if (JSIEnabled) {
    global.__Mason_setMaxWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMaxSizeWidth(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMaxSizeWidth(val.value, val.native_type);
    }
  }
}

export function _getMaxWidth(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.maxWidth;
  }
  if (JSIEnabled) {
    return global.__Mason_getMaxWidth(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return _parseDimension(instance.android.getMaxSizeWidth());
    }

    if (global.isIOS) {
      return _parseDimension(instance.ios.getMaxSizeWidth());
    }
  }
}

export function _setMaxHeight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toMasonDimension(value);
  if (JSIEnabled) {
    global.__Mason_setMaxHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMaxSizeHeight(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMaxSizeHeight(val.value, val.native_type);
    }
  }
}

export function _getMaxHeight(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.maxHeight;
  }
  if (JSIEnabled) {
    return global.__Mason_getMaxHeight(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return _parseDimension(instance.android.getMaxSizeHeight());
    }

    if (global.isIOS) {
      return _parseDimension(instance.ios.getMaxSizeHeight());
    }
  }
}

export function _setFlexDirection(value, instance: TSCView, initial = false) {
  if (initial && value === 'row') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'column':
        if (JSIEnabled) {
          nativeValue = FlexDirection.Column;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.FlexDirection.Column;
          } else if (global.isIOS) {
            nativeValue = FlexDirection.Column;
          }
        }
        break;
      case 'row':
        if (JSIEnabled) {
          nativeValue = FlexDirection.Row;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.FlexDirection.Row;
          } else if (global.isIOS) {
            nativeValue = FlexDirection.Row;
          }
        }
        break;
      case 'column-reverse':
        if (JSIEnabled) {
          nativeValue = FlexDirection.ColumnReverse;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.FlexDirection.ColumnReverse;
          } else if (global.isIOS) {
            nativeValue = FlexDirection.ColumnReverse;
          }
        }
        break;
      case 'row-reverse':
        if (JSIEnabled) {
          nativeValue = FlexDirection.RowReverse;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.FlexDirection.RowReverse;
          } else if (global.isIOS) {
            nativeValue = FlexDirection.RowReverse;
          }
        }
        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setFlexDirection(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setFlexDirection(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.flexDirection = nativeValue;
        }
      }
    }
  }
}

export function _getFlexDirection(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getFlexDirection(instance._masonStylePtr);
      switch (value) {
        case FlexDirection.Row:
          return 'row';
        case FlexDirection.Column:
          return 'column';
        case FlexDirection.RowReverse:
          return 'row-reverse';
        case FlexDirection.ColumnReverse:
          return 'column-reverse';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getFlexDirection();
        switch (value) {
          case org.nativescript.mason.masonkit.FlexDirection.Row:
            return 'row';
          case org.nativescript.mason.masonkit.FlexDirection.Column:
            return 'column';
          case org.nativescript.mason.masonkit.FlexDirection.RowReverse:
            return 'row-reverse';
          case org.nativescript.mason.masonkit.FlexDirection.ColumnReverse:
            return 'column-reverse';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.flexDirection as any;
        switch (value) {
          case FlexDirection.Row:
            return 'row';
          case FlexDirection.Column:
            return 'column';
          case FlexDirection.RowReverse:
            return 'row-reverse';
          case FlexDirection.ColumnReverse:
            return 'column-reverse';
        }
      }
    }
  }
  return instance.style.flexDirection;
}

export function _getPosition(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.position;
  }

  if (JSIEnabled) {
    const value = global.__Mason_getPosition(instance._masonStylePtr);
    switch (value) {
      case 0:
        return 'relative';
      case 1:
        return 'absolute';
    }
  } else {
    if (global.isAndroid) {
      switch (instance.android.getPosition()) {
        case org.nativescript.mason.masonkit.Position.Absolute:
          return 'absolute';
        case org.nativescript.mason.masonkit.Position.Relative:
          return 'relative';
      }
    }

    if (global.isIOS) {
      switch (instance.ios.position) {
        case Position.Absolute:
          return 'absolute';
        case Position.Relative:
          return 'relative';
      }
    }
  }
}

export function _setPosition(value, instance: TSCView, initial = false) {
  if (initial && value === 'relative') {
    return;
  }

  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'absolute':
        if (JSIEnabled) {
          nativeValue = PositionType.Absolute;
        } else {
          nativeValue = org.nativescript.mason.masonkit.Position.Absolute;
        }

        break;
      case 'relative':
        if (JSIEnabled) {
          nativeValue = PositionType.Relative;
        } else {
          nativeValue = org.nativescript.mason.masonkit.Position.Relative;
        }

        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setPosition(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setPosition(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.position = nativeValue;
        }
      }
    }
  }
}

export function _setFlexWrap(value, instance: TSCView, initial = false) {
  if (initial && value === 'no-wrap') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;

    switch (value) {
      case 'no-wrap':
        if (JSIEnabled) {
          nativeValue = FlexWrap.NoWrap;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.FlexWrap.NoWrap;
          }

          if (global.isAndroid) {
            nativeValue = FlexWrap.NoWrap;
          }
        }
        break;
      case 'wrap':
        if (JSIEnabled) {
          nativeValue = FlexWrap.Wrap;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.FlexWrap.Wrap;
          }

          if (global.isAndroid) {
            nativeValue = FlexWrap.Wrap;
          }
        }

        break;
      case 'wrap-reverse':
        if (JSIEnabled) {
          nativeValue = FlexWrap.WrapReverse;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.FlexWrap.WrapReverse;
          }

          if (global.isAndroid) {
            nativeValue = FlexWrap.WrapReverse;
          }
        }

        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setFlexWrap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setFlexWrap(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.flexWrap = nativeValue;
        }
      }
    }
  }
}

export function _getFlexWrap(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getFlexWrap(instance._masonStylePtr);
      switch (value) {
        case 0:
          return 'no-wrap';
        case 1:
          return 'wrap';
        case 2:
          return 'wrap-reverse';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getFlexWrap();
        switch (value) {
          case org.nativescript.mason.masonkit.FlexWrap.NoWrap:
            return 'no-wrap';
          case org.nativescript.mason.masonkit.FlexWrap.Wrap:
            return 'wrap';
          case org.nativescript.mason.masonkit.FlexWrap.WrapReverse:
            return 'wrap-reverse';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.flexWrap as any;
        switch (value) {
          case FlexWrap.NoWrap:
            return 'no-wrap';
          case FlexWrap.Wrap:
            return 'wrap';
          case FlexWrap.WrapReverse:
            return 'wrap-reverse';
        }
      }
    }
  }
  return instance.style.flexWrap;
}

export function _setAlignItems(value, instance: TSCView, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'normal':
        if (JSIEnabled) {
          nativeValue = AlignItems.Normal;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Normal;
        }
        break;
      case 'baseline':
        if (JSIEnabled) {
          nativeValue = AlignItems.Baseline;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Baseline;
        }

        break;
      case 'center':
        if (JSIEnabled) {
          nativeValue = AlignItems.Center;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Center;
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          nativeValue = AlignItems.End;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.End;
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          nativeValue = AlignItems.Start;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Start;
        }

        break;
      case 'stretch':
        if (JSIEnabled) {
          nativeValue = AlignItems.Stretch;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Stretch;
        }
        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setAlignItems(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.alignItems = nativeValue;
        }
      }
    }
  }
}

export function _getAlignItems(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignItems(instance._masonStylePtr);
      switch (value) {
        case AlignItems.Normal:
          return 'normal';
        case AlignItems.Baseline:
          return 'baseline';
        case AlignItems.Center:
          return 'center';
        case AlignItems.End:
          return 'end';
        case AlignItems.Start:
          return 'start';
        case AlignItems.Stretch:
          return 'stretch';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getAlignItems();
        switch (value) {
          case org.nativescript.mason.masonkit.AlignItems.Normal:
            return 'normal';
          case org.nativescript.mason.masonkit.AlignItems.Baseline:
            return 'baseline';
          case org.nativescript.mason.masonkit.AlignItems.Center:
            return 'center';
          case org.nativescript.mason.masonkit.AlignItems.End:
            return 'end';
          case org.nativescript.mason.masonkit.AlignItems.Start:
            return 'start';
          case org.nativescript.mason.masonkit.AlignItems.Stretch:
            return 'stretch';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.alignItems as any;
        switch (value) {
          case AlignItems.Normal:
            return 'normal';
          case AlignItems.Baseline:
            return 'baseline';
          case AlignItems.Center:
            return 'center';
          case AlignItems.End:
            return 'end';
          case AlignItems.Start:
            return 'start';
          case AlignItems.Stretch:
            return 'stretch';
        }
      }
    }
  }
  return instance.style.alignItems;
}

export function _setAlignSelf(value, instance: TSCView, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'normal':
        if (JSIEnabled) {
          nativeValue = AlignSelf.Normal;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Normal;
        }
        break;
      case 'baseline':
        if (JSIEnabled) {
          nativeValue = AlignSelf.Baseline;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Baseline;
        }

        break;
      case 'center':
        if (JSIEnabled) {
          nativeValue = AlignSelf.Center;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Center;
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          nativeValue = AlignSelf.End;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.End;
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          nativeValue = AlignSelf.Start;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Start;
        }

        break;
      case 'stretch':
        if (JSIEnabled) {
          nativeValue = AlignSelf.Stretch;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Stretch;
        }
        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setAlignSelf(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.alignSelf = nativeValue;
        }
      }
    }
  }
}

export function _getAlignSelf(instance: TSCView): AlignSelfType {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignSelf(instance._masonStylePtr);
      switch (value) {
        case AlignSelf.Normal:
          return 'normal';
        case AlignSelf.Baseline:
          return 'baseline';
        case AlignSelf.Center:
          return 'center';
        case AlignSelf.End:
          return 'end';
        case AlignSelf.Start:
          return 'start';
        case AlignSelf.Stretch:
          return 'stretch';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getAlignSelf();
        switch (value) {
          case org.nativescript.mason.masonkit.AlignSelf.Normal:
            return 'normal';
          case org.nativescript.mason.masonkit.AlignSelf.Baseline:
            return 'baseline';
          case org.nativescript.mason.masonkit.AlignSelf.Center:
            return 'center';
          case org.nativescript.mason.masonkit.AlignSelf.End:
            return 'end';
          case org.nativescript.mason.masonkit.AlignSelf.Start:
            return 'start';
          case org.nativescript.mason.masonkit.AlignSelf.Stretch:
            return 'stretch';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.alignSelf as any;
        switch (value) {
          case AlignSelf.Normal:
            return 'normal';
          case AlignSelf.Baseline:
            return 'baseline';
          case AlignSelf.Center:
            return 'center';
          case AlignSelf.End:
            return 'end';
          case AlignSelf.Start:
            return 'start';
          case AlignSelf.Stretch:
            return 'stretch';
        }
      }
    }
  }
  return instance.style.alignSelf as any;
}

export function _setAlignContent(value, instance: TSCView, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'normal':
        if (JSIEnabled) {
          nativeValue = AlignContent.Normal;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.Normal;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.Normal;
          }
        }
        break;
      case 'space-around':
        if (JSIEnabled) {
          nativeValue = AlignContent.SpaceAround;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.SpaceAround;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.SpaceAround;
          }
        }
        break;
      case 'space-between':
        if (JSIEnabled) {
          nativeValue = AlignContent.SpaceBetween;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.SpaceBetween;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.SpaceBetween;
          }
        }
        break;
      case 'space-evenly':
        if (JSIEnabled) {
          nativeValue = AlignContent.SpaceEvenly;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.SpaceEvenly;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.SpaceEvenly;
          }
        }
        break;
      case 'center':
        if (JSIEnabled) {
          nativeValue = AlignContent.Center;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.Center;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.Center;
          }
        }
        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          nativeValue = AlignContent.End;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.End;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.End;
          }
        }
        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          nativeValue = AlignContent.Start;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.Start;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.Start;
          }
        }
        break;
      case 'stretch':
        if (JSIEnabled) {
          nativeValue = AlignContent.Stretch;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.AlignContent.Stretch;
          }

          if (global.isIOS) {
            nativeValue = AlignContent.Stretch;
          }
        }
        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setAlignContent(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.alignContent = nativeValue;
        }
      }
    }
  }
}

export function _getAlignContent(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignContent(instance._masonStylePtr);
      switch (value) {
        case AlignContent.Normal:
          return 'normal';
        case AlignContent.SpaceAround:
          return 'space-around';
        case AlignContent.SpaceBetween:
          return 'space-between';
        case AlignContent.SpaceEvenly:
          return 'space-evenly';
        case AlignContent.Center:
          return 'center';
        case AlignContent.End:
          return 'end';
        case AlignContent.Start:
          return 'start';
        case AlignContent.Stretch:
          return 'stretch';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getAlignContent();
        switch (value) {
          case org.nativescript.mason.masonkit.AlignContent.Normal:
            return 'normal';
          case org.nativescript.mason.masonkit.AlignContent.SpaceAround:
            return 'space-around';
          case org.nativescript.mason.masonkit.AlignContent.SpaceBetween:
            return 'space-between';
          case org.nativescript.mason.masonkit.AlignContent.SpaceEvenly:
            return 'space-evenly';
          case org.nativescript.mason.masonkit.AlignContent.Center:
            return 'center';
          case org.nativescript.mason.masonkit.AlignContent.End:
            return 'end';
          case org.nativescript.mason.masonkit.AlignContent.Start:
            return 'start';
          case org.nativescript.mason.masonkit.AlignContent.Stretch:
            return 'stretch';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.alignContent as any;
        switch (value) {
          case AlignContent.Normal:
            return 'normal';
          case AlignContent.SpaceAround:
            return 'space-around';
          case AlignContent.SpaceBetween:
            return 'space-between';
          case AlignContent.SpaceEvenly:
            return 'space-evenly';
          case AlignContent.Center:
            return 'center';
          case AlignContent.End:
            return 'end';
          case AlignContent.Start:
            return 'start';
          case AlignContent.Stretch:
            return 'stretch';
        }
      }
    }
  }
  return instance.style.alignContent;
}

export function _setJustifyItems(value, instance: TSCView, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'normal':
        if (JSIEnabled) {
          nativeValue = JustifyItems.Normal;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifyItems.Normal;
        }
        break;
      case 'baseline':
        if (JSIEnabled) {
          nativeValue = JustifyItems.Baseline;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifyItems.Baseline;
        }

        break;
      case 'center':
        if (JSIEnabled) {
          nativeValue = JustifyItems.Center;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifyItems.Center;
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          nativeValue = JustifyItems.End;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifyItems.End;
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          nativeValue = JustifyItems.Start;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifyItems.Start;
        }

        break;
      case 'stretch':
        if (JSIEnabled) {
          nativeValue = JustifyItems.Stretch;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifyItems.Stretch;
        }
        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setJustifyItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setJustifyItems(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.justifyItems = nativeValue;
        }
      }
    }
  }
}

export function _getJustifyItems(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getJustifyItems(instance._masonStylePtr);
      switch (value) {
        case JustifyItems.Normal:
          return 'normal';
        case JustifyItems.Baseline:
          return 'baseline';
        case JustifyItems.Center:
          return 'center';
        case JustifyItems.End:
          return 'end';
        case JustifyItems.Start:
          return 'start';
        case JustifyItems.Stretch:
          return 'stretch';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getJustifyItems();
        switch (value) {
          case org.nativescript.mason.masonkit.JustifyItems.Normal:
            return 'normal';
          case org.nativescript.mason.masonkit.JustifyItems.Baseline:
            return 'baseline';
          case org.nativescript.mason.masonkit.JustifyItems.Center:
            return 'center';
          case org.nativescript.mason.masonkit.JustifyItems.End:
            return 'end';
          case org.nativescript.mason.masonkit.JustifyItems.Start:
            return 'start';
          case org.nativescript.mason.masonkit.JustifyItems.Stretch:
            return 'stretch';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.justifyItems as any;
        switch (value) {
          case JustifyItems.Normal:
            return 'normal';
          case JustifyItems.Baseline:
            return 'baseline';
          case JustifyItems.Center:
            return 'center';
          case JustifyItems.End:
            return 'end';
          case JustifyItems.Start:
            return 'start';
          case JustifyItems.Stretch:
            return 'stretch';
        }
      }
    }
  }
  return instance.style.justifyItems;
}

export function _setJustifySelf(value, instance: TSCView, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'normal':
        if (JSIEnabled) {
          nativeValue = JustifySelf.Normal;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifySelf.Normal;
        }
        break;
      case 'baseline':
        if (JSIEnabled) {
          nativeValue = JustifySelf.Baseline;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifySelf.Baseline;
        }

        break;
      case 'center':
        if (JSIEnabled) {
          nativeValue = JustifySelf.Center;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifySelf.Center;
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          nativeValue = JustifySelf.End;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifySelf.End;
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          nativeValue = JustifySelf.Start;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifySelf.Start;
        }

        break;
      case 'stretch':
        if (JSIEnabled) {
          nativeValue = JustifySelf.Stretch;
        } else {
          nativeValue = org.nativescript.mason.masonkit.JustifySelf.Stretch;
        }
        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setJustifySelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setJustifySelf(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.justifySelf = nativeValue;
        }
      }
    }
  }
}

export function _getJustifySelf(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getJustifySelf(instance._masonStylePtr);
      switch (value) {
        case JustifySelf.Normal:
          return 'normal';
        case JustifySelf.Baseline:
          return 'baseline';
        case JustifySelf.Center:
          return 'center';
        case JustifySelf.End:
          return 'end';
        case JustifySelf.Start:
          return 'start';
        case JustifySelf.Stretch:
          return 'stretch';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getJustifySelf();
        switch (value) {
          case org.nativescript.mason.masonkit.JustifySelf.Normal:
            return 'normal';
          case org.nativescript.mason.masonkit.JustifySelf.Baseline:
            return 'baseline';
          case org.nativescript.mason.masonkit.JustifySelf.Center:
            return 'center';
          case org.nativescript.mason.masonkit.JustifySelf.End:
            return 'end';
          case org.nativescript.mason.masonkit.JustifySelf.Start:
            return 'start';
          case org.nativescript.mason.masonkit.JustifySelf.Stretch:
            return 'stretch';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.justifySelf as any;
        switch (value) {
          case JustifySelf.Normal:
            return 'normal';
          case JustifySelf.Baseline:
            return 'baseline';
          case JustifySelf.Center:
            return 'center';
          case JustifySelf.End:
            return 'end';
          case JustifySelf.Start:
            return 'start';
          case JustifySelf.Stretch:
            return 'stretch';
        }
      }
    }
  }
  return instance.style.justifySelf;
}

export function _setJustifyContent(value, instance: TSCView, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    let nativeValue = null;
    switch (value) {
      case 'normal':
        if (JSIEnabled) {
          nativeValue = JustifyContent.Normal;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.Normal;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.Normal;
          }
        }
        break;
      case 'space-around':
        if (JSIEnabled) {
          nativeValue = JustifyContent.SpaceAround;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.SpaceAround;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.SpaceAround;
          }
        }
        break;
      case 'space-between':
        if (JSIEnabled) {
          nativeValue = JustifyContent.SpaceBetween;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.SpaceBetween;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.SpaceBetween;
          }
        }
        break;
      case 'space-evenly':
        if (JSIEnabled) {
          nativeValue = JustifyContent.SpaceEvenly;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.SpaceEvenly;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.SpaceEvenly;
          }
        }
        break;
      case 'center':
        if (JSIEnabled) {
          nativeValue = JustifyContent.Center;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.Center;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.Center;
          }
        }
        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          nativeValue = JustifyContent.End;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.End;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.End;
          }
        }
        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          nativeValue = JustifyContent.Start;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.Start;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.Start;
          }
        }
        break;
      case 'stretch':
        if (JSIEnabled) {
          nativeValue = JustifyContent.Stretch;
        } else {
          if (global.isAndroid) {
            nativeValue = org.nativescript.mason.masonkit.JustifyContent.Stretch;
          }

          if (global.isIOS) {
            nativeValue = JustifyContent.Stretch;
          }
        }
        break;
    }

    if (nativeValue) {
      if (JSIEnabled) {
        global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, nativeValue, !instance._inBatch);
      } else {
        if (global.isAndroid) {
          instance.android.setJustifyContent(nativeValue);
        }

        if (global.isIOS) {
          instance.ios.justifyContent = nativeValue;
        }
      }
    }
  }
}

export function _getJustifyContent(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getJustifyContent(instance._masonStylePtr);
      switch (value) {
        case JustifyContent.Normal:
          return 'normal';
        case JustifyContent.SpaceAround:
          return 'space-around';
        case JustifyContent.SpaceBetween:
          return 'space-between';
        case JustifyContent.SpaceEvenly:
          return 'space-evenly';
        case JustifyContent.Center:
          return 'center';
        case JustifyContent.End:
          return 'end';
        case JustifyContent.Start:
          return 'start';
      }
    } else {
      if (global.isAndroid) {
        const value = instance.android.getJustifyContent();
        switch (value) {
          case org.nativescript.mason.masonkit.JustifyContent.Normal:
            return 'normal';
          case org.nativescript.mason.masonkit.JustifyContent.SpaceAround:
            return 'space-around';
          case org.nativescript.mason.masonkit.JustifyContent.SpaceBetween:
            return 'space-between';
          case org.nativescript.mason.masonkit.JustifyContent.SpaceEvenly:
            return 'space-evenly';
          case org.nativescript.mason.masonkit.JustifyContent.Center:
            return 'center';
          case org.nativescript.mason.masonkit.JustifyContent.End:
            return 'end';
          case org.nativescript.mason.masonkit.JustifyContent.Start:
            return 'start';
          case org.nativescript.mason.masonkit.JustifyContent.Stretch:
            return 'stretch';
        }
      }

      if (global.isIOS) {
        const value = instance.ios.justifyContent as any;
        switch (value) {
          case JustifyContent.Normal:
            return 'normal';
          case JustifyContent.SpaceAround:
            return 'space-around';
          case JustifyContent.SpaceBetween:
            return 'space-between';
          case JustifyContent.SpaceEvenly:
            return 'space-evenly';
          case JustifyContent.Center:
            return 'center';
          case JustifyContent.End:
            return 'end';
          case JustifyContent.Start:
            return 'start';
          case JustifyContent.Stretch:
            return 'stretch';
        }
      }
    }
  }
  return instance.style.justifyContent;
}

export function _setLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setInsetLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setInsetLeft(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setInsetLeft(val.value, val.native_type);
    }
  }
}

export function _setRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setInsetRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setInsetRight(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setInsetRight(val.value, val.native_type);
    }
  }
}

export function _setTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setInsetTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setInsetTop(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setInsetTop(val.value, val.native_type);
    }
  }
}

export function _setBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setInsetBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setInsetBottom(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setInsetBottom(val.value, val.native_type);
    }
  }
}

export function _setMarginLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setMarginLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMarginLeft(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMarginLeft(val.value, val.native_type);
    }
  }
}

export function _setMarginRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setMarginRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMarginRight(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMarginRight(val.value, val.native_type);
    }
  }
}

export function _setMarginTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setMarginTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMarginTop(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMarginTop(val.value, val.native_type);
    }
  }
}

export function _setMarginBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toLengthPercentageAuto(value);

  if (JSIEnabled) {
    global.__Mason_setMarginBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setMarginBottom(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setMarginBottom(val.value, val.native_type);
    }
  }
}

export function _setPaddingLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setPaddingLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setPaddingLeft(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setPaddingLeft(val.value, val.native_type);
    }
  }
}

export function _setPaddingRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setPaddingRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setPaddingRight(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setPaddingRight(val.value, val.native_type);
    }
  }
}

export function _setPaddingTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setPaddingTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setPaddingTop(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setPaddingTop(val.value, val.native_type);
    }
  }
}

export function _setPaddingBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setPaddingBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setPaddingBottom(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setPaddingBottom(val.value, val.native_type);
    }
  }
}

export function _setBorderLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setBorderLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setBorderLeft(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setBorderLeft(val.value, val.native_type);
    }
  }
}

export function _setBorderRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setBorderRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setBorderRight(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setBorderRight(val.value, val.native_type);
    }
  }
}

export function _setBorderTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setBorderTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setBorderTop(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setBorderTop(val.value, val.native_type);
    }
  }
}

export function _setBorderBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _toLengthPercentage(value);

  if (JSIEnabled) {
    global.__Mason_setBorderBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setBorderBottom(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setBorderBottom(val.value, val.native_type);
    }
  }
}

export function _setFlexBasis(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  if (JSIEnabled) {
    const val = _toMasonDimension(value);

    global.__Mason_setFlexBasis(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      const val = _toMasonDimension(value);
      instance.android.setFlexBasis(val.value, MasonDimensionCompatType.Auto);
    }

    if (global.isIOS) {
      instance.ios.flexBasisCompat = _intoMasonDimension(value) as any;
    }
  }
}

export function _getFlexBasis(instance: TSCView) {
  if (!instance._hasNativeView) {
    return (instance as any).style.flexBasis;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexBasis(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return _parseDimension(instance.android.getFlexBasis());
    }

    if (global.isIOS) {
      return _parseDimension(instance.ios.flexBasisCompat);
    }

    return (instance as any).style.flexBasis;
  }
}

export function _setGap(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const width = _toLengthPercentage(value.width);
  const height = _toLengthPercentage(value.height);

  if (JSIEnabled) {
    global.__Mason_setGap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, width.value, width.native_type, height.value, height.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setGap(width.value, width.native_type, height.value, height.native_type);
    }

    if (global.isIOS) {
      instance.ios.setGapWithWidthHeightType(width.value, width.native_type, height.value, height.native_type);
    }
  }
}

export function _getGap(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }
  if (JSIEnabled) {
    return global.__Mason_getGap(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      const gap = instance.android.getGap();
      const width = _parseLengthPercentage(gap.getWidth());
      const height = _parseLengthPercentage(gap.getHeight());
      return { width, height };
    }

    if (global.isIOS) {
      const gap = instance.ios.getGap();
      const width = _parseLengthPercentage(gap.width);
      const height = _parseLengthPercentage(gap.height);
      return { width, height };
    }
  }
}

export function _setFlexGrow(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setFlexGrow(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setFlexGrow(value);
    }

    if (global.isIOS) {
      instance.ios.flexGrow = value;
    }
  }
}

export function _getFlexGrow(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.flexGrow;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexGrow(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return instance.android.getFlexGrow();
    }

    if (global.isiOS) {
      return instance.ios.flexGrow;
    }

    return instance.style.flexGrow;
  }
}

export function _setFlexShrink(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setFlexShrink(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setFlexShrink(value);
    }

    if (global.isIOS) {
      instance.ios.flexShrink = value;
    }
  }
}

export function _getFlexShrink(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.flexShrink;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexShrink(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return instance.android.getFlexShrink();
    }

    if (global.isIOS) {
      return instance.ios.flexShrink;
    }

    return instance.style.flexShrink;
  }
}

export function _setAspectRatio(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setAspectRatio(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      if (Number.isNaN(value)) {
        instance.android.setAspectRatio(null);
      } else {
        instance.android.setAspectRatio(value);
      }
    }

    if (global.isIOS) {
      instance.ios.aspectRatio = value;
    }
  }
}

export function _getAspectRatio(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.aspectRatio;
  }
  if (JSIEnabled) {
    return global.__Mason_getAspectRatio(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      return instance.android.getAspectRatio();
    }

    if (global.isIOS) {
      const ratio = instance.ios.aspectRatio;
      return Number.isNaN(ratio) ? null : ratio;
    }

    return null;
  }
}

function _parseGridLine(value): { value: number; type: any; native_value?: any } {
  let parsedValue = undefined;
  let parsedType = undefined;
  let nativeValue = undefined;
  if (typeof value === 'string') {
    if (value === 'auto') {
      parsedValue = 0;
      parsedType = GridPlacementCompatType.Auto;
      if (!JSIEnabled) {
        if (global.isAndroid) {
          parsedType = org.nativescript.mason.masonkit.GridPlacement.Auto;
          nativeValue = org.nativescript.mason.masonkit.GridPlacement.Auto;
        }

        if (global.isIOS) {
          parsedType = GridPlacementCompatType.Auto;
          nativeValue = GridPlacementCompat.Auto;
        }
      }
    }
    if (value.startsWith('span')) {
      parsedValue = Number(value.replace('span', '').trim());
      parsedType = GridPlacementCompatType.Span;

      if (!JSIEnabled) {
        const isValid = !Number.isNaN(parsedValue);
        if (global.isAndroid) {
          parsedType = org.nativescript.mason.masonkit.GridPlacement.Span;
          if (isValid) {
            nativeValue = new org.nativescript.mason.masonkit.GridPlacement.Span(parsedValue);
          }
        }

        if (global.isIOS) {
          parsedType = GridPlacementCompatType.Span;
          if (isValid) {
            nativeValue = GridPlacementCompat.alloc().initWithSpan(parsedValue);
          }
        }
      }
    } else {
      parsedValue = Number(value.trim());
      parsedType = GridPlacementCompatType.Line;

      if (!JSIEnabled) {
        const isValid = !Number.isNaN(parsedValue);
        if (global.isAndroid) {
          parsedType = org.nativescript.mason.masonkit.GridPlacement.Line;
          if (isValid) {
            nativeValue = new org.nativescript.mason.masonkit.GridPlacement.Line(parsedValue);
          }
        }

        if (global.isIOS) {
          parsedType = GridPlacementCompatType.Line;
          if (isValid) {
            nativeValue = GridPlacementCompat.alloc().initWithLine(parsedValue);
          }
        }
      }
    }

    return { value: Number.isNaN(parsedValue) ? undefined : parsedValue, type: parsedType, native_value: nativeValue };
  }

  if (typeof value === 'number') {
    parsedValue = value;
    parsedType = GridPlacementCompatType.Line;

    if (!JSIEnabled) {
      if (global.isAndroid) {
        parsedType = org.nativescript.mason.masonkit.GridPlacement.Line;
        nativeValue = new org.nativescript.mason.masonkit.GridPlacement.Line(parsedValue);
      }

      if (global.isIOS) {
        parsedType = GridPlacementCompatType.Line;
        nativeValue = GridPlacementCompat.alloc().initWithLine(parsedValue);
      }
    }
  }

  return { value: parsedValue, type: parsedType, native_value: nativeValue };
}

export function _setGridColumnStart(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (JSIEnabled) {
    global.__Mason_setColumnStart(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setGridColumnStart(val.native_value);
    }

    if (global.isIOS) {
      instance.ios.gridColumnStartCompat = val.native_value;
    }
  }
}

export function _setGridColumnEnd(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (JSIEnabled) {
    global.__Mason_setColumnEnd(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setGridColumnEnd(val.native_value);
    }

    if (global.isIOS) {
      instance.ios.gridColumnEndCompat = val.native_value;
    }
  }
}

export function _setGridRowStart(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (JSIEnabled) {
    global.__Mason_setRowStart(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setGridRowStart(val.native_value);
    }

    if (global.isIOS) {
      instance.ios.gridRowStartCompat = val.native_value;
    }
  }
}

export function _setGridRowEnd(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (JSIEnabled) {
    global.__Mason_setRowEnd(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setGridRowEnd(val.native_value);
    }

    if (global.isIOS) {
      instance.ios.gridRowEndCompat = val.native_value;
    }
  }
}

export function _setRowGap(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentage(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (JSIEnabled) {
    global.__Mason_setRowGap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setGapRow(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setRowGap(val.value, val.native_type);
    }
  }
}

export function _setColumnGap(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _toLengthPercentage(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (JSIEnabled) {
    console.log(val.value, val.native_type);
    global.__Mason_setColumnGap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      instance.android.setGapColumn(val.value, val.native_type);
    }

    if (global.isIOS) {
      instance.ios.setColumnGap(val.value, val.native_type);
    }
  }
}
