declare const __non_webpack_require__, JSIModule;

import { Length, Utils } from '@nativescript/core';
import { TSCViewBase } from './common';

import { AlignSelf as AlignSelfType } from '.';

const enum Display {
  None = 0,

  Flex = 1,

  Grid = 2,
}

const enum TSCGridTrackRepetition {
  AutoFill = 0,

  AutoFit = 1,

  Count = 2,
}

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
    __non_webpack_require__('system_lib://libmasonnativev8.so');
    // JSIEnabled = true;
  } catch (error) {
    console.warn('Failed to enable on FastAPI');
  }
}

if (global.isIOS) {
  TSCMason.alwaysEnable = true;
  if (!JSIEnabled) {
    try {
      //@ts-ignore
      const module = new global.JSIModule();
      // module.install()
      // JSIEnabled = true;
    } catch (error) {
      console.warn('Failed to enable on FastAPI');
    }
  }
}

function getMasonInstance(instance: TSCView) {
  const nativeView = instance?.nativeView;
  if (instance._isMasonChild) {
    const parent = instance.parent?.nativeView;
    return parent?.nodeForView?.(nativeView as any);
  }
  return nativeView;
}

export function _forceStyleUpdate(instance: TSCView) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_updateNodeAndStyle(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      const nodeOrView = getMasonInstance(instance);
      nodeOrView.updateNodeAndStyle();
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        nodeOrView.dirty();
      } else {
        nodeOrView.markNodeDirty();
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        return nodeOrView.isDirty();
      } else {
        return nodeOrView.isNodeDirty();
      }
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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setDisplay(nodeOrView, nativeValue);
          } else {
            nodeOrView.setDisplay(nativeValue);
          }
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
      const nodeOrView = getMasonInstance(instance);
      let display;
      if (instance._isMasonChild) {
        display = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getDisplay(nodeOrView);
      } else {
        display = nodeOrView.getDisplay();
      }

      switch (display) {
        case org.nativescript.mason.masonkit.Display.None:
          return 'none';
        case org.nativescript.mason.masonkit.Display.Flex:
          return 'flex';
        case org.nativescript.mason.masonkit.Display.Grid:
          return 'grid';
      }
    }

    if (global.isIOS) {
      switch (instance.ios.display as any) {
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMinSizeWidth(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMinSizeWidth(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let min;
      if (instance._isMasonChild) {
        min = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getMinSizeWidth(nodeOrView);
      } else {
        min = nodeOrView.getMinSizeWidth();
      }

      return _parseDimension(min);
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMinSizeHeight(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMinSizeHeight(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let min;
      if (instance._isMasonChild) {
        min = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getMinSizeHeight(nodeOrView);
      } else {
        min = nodeOrView.getMinSizeHeight();
      }

      return _parseDimension(min);
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setSizeWidth(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setSizeWidth(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let size;
      if (instance._isMasonChild) {
        size = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getSizeWidth(nodeOrView);
      } else {
        size = nodeOrView.getSizeWidth();
      }

      return _parseDimension(size);
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setSizeHeight(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setSizeHeight(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let size;
      if (instance._isMasonChild) {
        size = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getSizeHeight(nodeOrView);
      } else {
        size = nodeOrView.getSizeHeight();
      }

      return _parseDimension(size);
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMaxSizeWidth(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMaxSizeWidth(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let max;
      if (instance._isMasonChild) {
        max = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getMaxSizeWidth(nodeOrView);
      } else {
        max = nodeOrView.getMaxSizeWidth();
      }

      return _parseDimension(max);
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMaxSizeHeight(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMaxSizeHeight(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let max;
      if (instance._isMasonChild) {
        max = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getMaxSizeHeight(nodeOrView);
      } else {
        max = nodeOrView.getMaxSizeHeight();
      }

      return _parseDimension(max);
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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setFlexDirection(nodeOrView, nativeValue);
          } else {
            nodeOrView.setFlexDirection(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getFlexDirection(nodeOrView);
        } else {
          value = nodeOrView.getFlexDirection();
        }

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
      const nodeOrView = getMasonInstance(instance);
      let value;
      if (instance._isMasonChild) {
        value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getPosition(nodeOrView);
      } else {
        value = nodeOrView.getPosition();
      }

      switch (value) {
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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setPosition(nodeOrView, nativeValue);
          } else {
            nodeOrView.setPosition(nativeValue);
          }
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

          if (global.isIOS) {
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

          if (global.isIOS) {
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

          if (global.isIOS) {
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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setFlexWrap(nodeOrView, nativeValue);
          } else {
            nodeOrView.setFlexWrap(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getFlexWrap(nodeOrView);
        } else {
          value = nodeOrView.getFlexWrap();
        }
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
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignItems.Normal;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Normal;
        }
        break;
      case 'baseline':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignItems.Baseline;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Baseline;
        }

        break;
      case 'center':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignItems.Center;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Center;
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignItems.End;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.End;
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignItems.Start;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignItems.Start;
        }

        break;
      case 'stretch':
        if (JSIEnabled || global.isIOS) {
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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setAlignItems(nodeOrView, nativeValue);
          } else {
            nodeOrView.setAlignItems(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getAlignItems(nodeOrView);
        } else {
          value = nodeOrView.getAlignItems();
        }
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
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignSelf.Normal;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Normal;
        }
        break;
      case 'baseline':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignSelf.Baseline;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Baseline;
        }

        break;
      case 'center':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignSelf.Center;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Center;
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignSelf.End;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.End;
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled || global.isIOS) {
          nativeValue = AlignSelf.Start;
        } else {
          nativeValue = org.nativescript.mason.masonkit.AlignSelf.Start;
        }

        break;
      case 'stretch':
        if (JSIEnabled || global.isIOS) {
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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setAlignSelf(nodeOrView, nativeValue);
          } else {
            nodeOrView.setAlignSelf(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getAlignSelf(nodeOrView);
        } else {
          value = nodeOrView.getAlignSelf();
        }
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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setAlignContent(nodeOrView, nativeValue);
          } else {
            nodeOrView.setAlignContent(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getAlignContent(nodeOrView);
        } else {
          value = nodeOrView.getAlignContent();
        }

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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setJustifyItems(nodeOrView, nativeValue);
          } else {
            nodeOrView.setJustifyItems(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getJustifyItems(nodeOrView);
        } else {
          value = nodeOrView.getJustifyItems();
        }

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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setJustifySelf(nodeOrView, nativeValue);
          } else {
            nodeOrView.setJustifySelf(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getJustifySelf(nodeOrView);
        } else {
          value = nodeOrView.getJustifySelf();
        }

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
          const nodeOrView = getMasonInstance(instance);
          if (instance._isMasonChild) {
            org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setJustifyContent(nodeOrView, nativeValue);
          } else {
            nodeOrView.setJustifyContent(nativeValue);
          }
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
        const nodeOrView = getMasonInstance(instance);
        let value;
        if (instance._isMasonChild) {
          value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getJustifyContent(nodeOrView);
        } else {
          value = nodeOrView.getJustifyContent();
        }

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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setInsetLeft(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setInsetLeft(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setInsetRight(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setInsetRight(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setInsetTop(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setInsetTop(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setInsetBottom(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setInsetBottom(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMarginLeft(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMarginLeft(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMarginRight(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMarginRight(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMarginTop(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMarginTop(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setMarginBottom(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setMarginBottom(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setPaddingLeft(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setPaddingLeft(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setPaddingRight(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setPaddingRight(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setPaddingTop(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setPaddingTop(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setPaddingBottom(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setPaddingBottom(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setBorderLeft(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setBorderLeft(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setBorderRight(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setBorderRight(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setBorderTop(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setBorderTop(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setBorderBottom(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setBorderBottom(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setFlexBasis(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setFlexBasis(val.value, val.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let value;
      if (instance._isMasonChild) {
        value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getFlexBasis(nodeOrView);
      } else {
        value = nodeOrView.getFlexBasis();
      }

      return _parseDimension(value);
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGap(nodeOrView, width.value, width.native_type, height.value, height.native_type);
      } else {
        nodeOrView.setGap(width.value, width.native_type, height.value, height.native_type);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let gap;
      if (instance._isMasonChild) {
        gap = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getGap(nodeOrView);
      } else {
        gap = nodeOrView.getGap();
      }

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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setFlexGrow(nodeOrView, value);
      } else {
        nodeOrView.setFlexGrow(value);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let value;
      if (instance._isMasonChild) {
        value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getFlexGrow(nodeOrView);
      } else {
        value = nodeOrView.getFlexGrow();
      }

      return value;
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setFlexShrink(nodeOrView, value);
      } else {
        nodeOrView.setFlexShrink(value);
      }
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
      const nodeOrView = getMasonInstance(instance);
      let value;
      if (instance._isMasonChild) {
        value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getFlexShrink(nodeOrView);
      } else {
        value = nodeOrView.getFlexShrink();
      }

      return value;
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
      const val = Number.isNaN(value) ? null : value;

      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setAspectRatio(nodeOrView, val);
      } else {
        nodeOrView.setAspectRatio(val);
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
      const nodeOrView = getMasonInstance(instance);
      let value;
      if (instance._isMasonChild) {
        value = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getAspectRatio(nodeOrView);
      } else {
        value = nodeOrView.getAspectRatio();
      }

      return value;
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridColumnStart(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridColumnStart(val.native_value);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridColumnEnd(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridColumnEnd(val.native_value);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridRowStart(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridRowStart(val.native_value);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridRowEnd(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridRowEnd(val.native_value);
      }
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
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGapRow(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setGapRow(val.value, val.native_type);
      }
    }

    if (global.isIOS) {
      instance.ios.setRowGap(val.value, val.native_type);
    }
  }
}

export function _getRowGap(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }
  if (JSIEnabled) {
    return global.__Mason_getRowGap(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      const nodeOrView = getMasonInstance(instance);
      let gap;
      if (instance._isMasonChild) {
        gap = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getGapRow(nodeOrView);
      } else {
        gap = nodeOrView.getGapRow();
      }

      return _parseLengthPercentage(gap);
    }

    if (global.isIOS) {
      const gap = instance.ios.getRowGap();
      return _parseLengthPercentage(gap);
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
    global.__Mason_setColumnGap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, val.native_type, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGapColumn(nodeOrView, val.value, val.native_type);
      } else {
        nodeOrView.setGapColumn(val.value, val.native_type);
      }
    }

    if (global.isIOS) {
      instance.ios.setColumnGap(val.value, val.native_type);
    }
  }
}

export function _getColumnGap(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }
  if (JSIEnabled) {
    return global.__Mason_getColumnGap(instance._masonStylePtr);
  } else {
    if (global.isAndroid) {
      const nodeOrView = getMasonInstance(instance);
      let gap;
      if (instance._isMasonChild) {
        gap = org.nativescript.mason.masonkit.NodeHelper.INSTANCE.getGapColumn(nodeOrView);
      } else {
        gap = nodeOrView.getGapColumn();
      }

      return _parseLengthPercentage(gap);
    }

    if (global.isIOS) {
      const gap = instance.ios.getColumnGap();
      return _parseLengthPercentage(gap);
    }
  }
}

const enum MinSizingType {
  Auto = 0,
  MinContent = 1,
  MaxContent = 2,
  Points = 3,
  Percent = 4,
}

const enum MaxSizingType {
  Auto = 0,
  MinContent = 1,
  MaxContent = 2,
  Points = 3,
  Percent = 4,
  Flex = 5,
  FitContent = 6,
  FitContentPercent = 7,
}

const Auto = 'auto';
const None = 'none';
const MinContent = 'min-content';
const MaxContent = 'max-content';

interface MinMaxType {
  min_type: MinSizingType;
  min_value: number;
  max_type: MaxSizingType;
  max_value: number;
}

export function _parseMinMaxValue(value: string): MinMaxType {
  if (typeof value === 'string') {
    if (value === Auto || value === None) {
      return {
        min_type: MinSizingType.Auto,
        min_value: 0,
        max_type: MaxSizingType.Auto,
        max_value: 0,
      };
    } else if (value === MinContent) {
      return {
        min_type: MinSizingType.MinContent,
        min_value: 0,
        max_type: MaxSizingType.MinContent,
        max_value: 0,
      };
    } else if (value === MaxContent) {
      return {
        min_type: MinSizingType.MaxContent,
        min_value: 0,
        max_type: MaxSizingType.MaxContent,
        max_value: 0,
      };
    } else if (value.indexOf('fr') > -1) {
      const flex = parseInt(value.replace('fr', '').trim());
      return {
        min_type: MinSizingType.Auto,
        min_value: 0,
        max_type: MaxSizingType.Flex,
        max_value: flex,
      };
    } else if (value.startsWith('minmax')) {
      // todo
      const minMax = parseInt(value.replace('minmax(', '').replace(')', '').trim());
    } else if (value.startsWith('fit-content')) {
      const fitContent = value.replace('fit-content(', '').replace(')', '').trim();

      if (fitContent.indexOf('px') > -1) {
        const px = parseInt(fitContent.replace('px', ''));
        return {
          min_type: MinSizingType.Auto,
          min_value: px,
          max_type: MaxSizingType.FitContent,
          max_value: px,
        };
      }

      if (fitContent.indexOf('px') > -1) {
        const dip = Utils.layout.toDevicePixels(parseInt(fitContent.replace('dip', '')));
        return {
          min_type: MinSizingType.Auto,
          min_value: dip,
          max_type: MaxSizingType.FitContent,
          max_value: dip,
        };
      }

      if (fitContent.indexOf('%') > -1) {
        const percent = parseFloat(fitContent.replace('%', ''));
        return {
          min_type: MinSizingType.Auto,
          min_value: percent,
          max_type: MaxSizingType.FitContentPercent,
          max_value: percent,
        };
      }
    } else if (value.indexOf('px') > -1) {
      const px = parseInt(value.replace('px', ''));
      return {
        min_type: MinSizingType.Points,
        min_value: px,
        max_type: MaxSizingType.Points,
        max_value: px,
      };
    } else if (value.indexOf('dip') > -1) {
      const dip = Utils.layout.toDevicePixels(parseInt(value.replace('dip', '')));
      return {
        min_type: MinSizingType.Points,
        min_value: dip,
        max_type: MaxSizingType.Points,
        max_value: dip,
      };
    } else if (value.indexOf('%') > -1) {
      const percent = parseFloat(value.replace('%', ''));
      return {
        min_type: MinSizingType.Percent,
        min_value: percent,
        max_type: MaxSizingType.Percent,
        max_value: percent,
      };
    } else if (value.indexOf('fr') > -1) {
      const flex = parseFloat(value.replace('fr', ''));
      return {
        min_type: MinSizingType.Auto,
        min_value: 0,
        max_type: MaxSizingType.Flex,
        max_value: flex,
      };
    } else {
      const dip = Utils.layout.toDevicePixels(Number(value));
      return {
        min_type: MinSizingType.Points,
        min_value: dip,
        max_type: MaxSizingType.Points,
        max_value: dip,
      };
    }
  }
  if (typeof value === 'number') {
    const dip = Utils.layout.toDevicePixels(value);
    return {
      min_type: MinSizingType.Points,
      min_value: dip,
      max_type: MaxSizingType.Points,
      max_value: dip,
    };
  }
  return undefined;
}

interface GridTemplates {
  is_repeating: boolean;
  repeating_type: TSCGridTrackRepetition;
  repeating_count: number;
  value: MinMaxType | Array<MinMaxType>;
}

const grid_templates_regex = /[^\s()]+(?:\([^\s()]+(?:\([^()]+\))?(?:, *[^\s()]+(?:\([^()]+\))?)*\))?/g;

export function _parseGridTemplates(value: string): Array<GridTemplates> {
  const array = [];
  if (typeof value === 'string') {
    const values = Array.from(value.matchAll(grid_templates_regex), (m) => m[0]);

    values.forEach((item) => {
      if (item.startsWith('repeat(')) {
        const repeatValue = item.replace('repeat(', '').replace(')', '');

        const trackEnd = repeatValue.indexOf(',');

        const repetition = repeatValue.substring(0, trackEnd);

        const tracks = repeatValue
          .substring(trackEnd + 1)
          .split(' ')
          .filter((a) => {
            return a.length || a.trim() === ',';
          });
        let isValid = true;

        let repeating_type = 0;

        let repeat_count = 0;

        switch (repetition) {
          case 'repeat-fill':
            repeating_type = TSCGridTrackRepetition.AutoFill;
            break;
          case 'repeat-fit':
            repeating_type = TSCGridTrackRepetition.AutoFit;
            break;
          default:
            const number = parseInt(repetition);

            repeating_type = TSCGridTrackRepetition.Count;

            isValid = !Number.isNaN(number);
            if (isValid) {
              repeat_count = number;
            }
            break;
        }

        if (isValid) {
          const tracks_array = [];
          tracks.forEach((track) => {
            const minMax = _parseMinMaxValue(track.trim());
            tracks_array.push(minMax);
          });

          array.push({
            is_repeating: true,
            repeating_type,
            repeating_count: repeat_count,
            value: tracks_array,
          });
        }
      } else {
        const value = _parseMinMaxValue(item);
        array.push({
          is_repeating: false,
          repeating_type: 0,
          value,
        });
      }
    });
  }
  return array;
}

export function _setGridTemplateRows(value: Array<GridTemplates>, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  if (JSIEnabled) {
    global.__Mason_setGridTemplateRows(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      const array = Array.create('org.nativescript.mason.masonkit.TrackSizingFunction', value.length);
      const length = value.length;
      for (let i = 0; i < length; i++) {
        const item = value[i];
        if (item.is_repeating) {
          const repeating = item.value as Array<MinMaxType>;
          const tracks = Array.create('org.nativescript.mason.masonkit.MinMax', repeating.length);
          let gridTrackRepetition = null;
          switch (item.repeating_type) {
            case TSCGridTrackRepetition.AutoFill:
              gridTrackRepetition = org.nativescript.mason.masonkit.GridTrackRepetition.AutoFill;
              break;
            case TSCGridTrackRepetition.AutoFit:
              gridTrackRepetition = org.nativescript.mason.masonkit.GridTrackRepetition.AutoFit;
              break;
            case TSCGridTrackRepetition.Count:
              gridTrackRepetition = new org.nativescript.mason.masonkit.GridTrackRepetition.Count(item.repeating_count);
              break;
          }
          if (gridTrackRepetition === null) {
            continue;
          }

          const repeatingLength = repeating.length;

          for (let j = 0; j < repeatingLength; j++) {
            const repeat = repeating[j];
            tracks[j] = org.nativescript.mason.masonkit.MinMax.fromTypeValue(repeat.min_type, repeat.min_value, repeat.max_type, repeat.max_value);
          }

          const repeat = new org.nativescript.mason.masonkit.TrackSizingFunction.AutoRepeat(gridTrackRepetition, tracks);
          array[i] = repeat;
        } else {
          const single = item.value as MinMaxType;
          const trackSizingFunction = new org.nativescript.mason.masonkit.TrackSizingFunction.Single(org.nativescript.mason.masonkit.MinMax.fromTypeValue(single.min_type, single.min_value, single.max_type, single.max_value));
          array[i] = trackSizingFunction;
        }
      }

      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridTemplateRows(nodeOrView, array);
      } else {
        nodeOrView.setGridTemplateRows(array);
      }
    }

    if (global.isIOS) {
      const length = value.length;
      const array = NSMutableArray.arrayWithCapacity<TrackSizingFunction>(length);

      for (let i = 0; i < length; i++) {
        const item = value[i];
        if (item.is_repeating) {
          const repeating = item.value as Array<MinMaxType>;
          const repeatingLength = repeating.length;
          const tracks = NSMutableArray.arrayWithCapacity<MinMax>(repeatingLength);
          let gridTrackRepetition = null;
          switch (item.repeating_type) {
            case TSCGridTrackRepetition.AutoFill:
              gridTrackRepetition = TSCGridTrackRepetition.AutoFill;
              break;
            case TSCGridTrackRepetition.AutoFit:
              gridTrackRepetition = TSCGridTrackRepetition.AutoFit;
              break;
            case TSCGridTrackRepetition.Count:
              gridTrackRepetition = GridTrackRepetition.Count(item.repeating_count);
              break;
          }
          if (gridTrackRepetition === null) {
            continue;
          }

          for (let j = 0; j < repeatingLength; j++) {
            const repeat = repeating[j];
            tracks.addObject(MinMax.fromTypeValue(repeat.min_type, repeat.min_value, repeat.max_type, repeat.max_value));
          }

          const repeat = TrackSizingFunction.AutoRepeat(gridTrackRepetition, tracks);
          array.addObject(repeat);
        } else {
          const single = item.value as MinMaxType;
          const trackSizingFunction = TrackSizingFunction.Single(MinMax.fromTypeValue(single.min_type, single.min_value, single.max_type, single.max_value));
          array.addObject(trackSizingFunction);
        }
      }

      instance.ios.gridTemplateRows = array;
    }
  }
}

export function _setGridTemplateColumns(value: Array<GridTemplates>, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  if (JSIEnabled) {
    global.__Mason_setGridTemplateColumns(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      const array = Array.create('org.nativescript.mason.masonkit.TrackSizingFunction', value.length);
      const length = value.length;
      for (let i = 0; i < length; i++) {
        const item = value[i];
        if (item.is_repeating) {
          const repeating = item.value as Array<MinMaxType>;
          const tracks = Array.create('org.nativescript.mason.masonkit.MinMax', repeating.length);
          let gridTrackRepetition = null;
          switch (item.repeating_type) {
            case TSCGridTrackRepetition.AutoFill:
              gridTrackRepetition = org.nativescript.mason.masonkit.GridTrackRepetition.AutoFill.INSTANCE;
              break;
            case TSCGridTrackRepetition.AutoFit:
              gridTrackRepetition = org.nativescript.mason.masonkit.GridTrackRepetition.AutoFit.INSTANCE;
              break;
            case TSCGridTrackRepetition.Count:
              gridTrackRepetition = new org.nativescript.mason.masonkit.GridTrackRepetition.Count(item.repeating_count);
              break;
          }
          if (gridTrackRepetition === null) {
            continue;
          }

          const repeatingLength = repeating.length;

          for (let j = 0; j < repeatingLength; j++) {
            const repeat = repeating[j];
            tracks[j] = org.nativescript.mason.masonkit.MinMax.fromTypeValue(repeat.min_type, repeat.min_value, repeat.max_type, repeat.max_value);
          }

          const repeat = new org.nativescript.mason.masonkit.TrackSizingFunction.AutoRepeat(gridTrackRepetition, tracks);

          array[i] = repeat;
        } else {
          const single = item.value as MinMaxType;
          const trackSizingFunction = new org.nativescript.mason.masonkit.TrackSizingFunction.Single(org.nativescript.mason.masonkit.MinMax.fromTypeValue(single.min_type, single.min_value, single.max_type, single.max_value));
          array[i] = trackSizingFunction;
        }
      }

      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridTemplateColumns(nodeOrView, array);
      } else {
        nodeOrView.setGridTemplateColumns(array);
      }
    }

    if (global.isIOS) {
      const length = value.length;
      const array = NSMutableArray.arrayWithCapacity<TrackSizingFunction>(length);

      for (let i = 0; i < length; i++) {
        const item = value[i];
        if (item.is_repeating) {
          const repeating = item.value as Array<MinMaxType>;

          const repeatingLength = repeating.length;

          const tracks = NSMutableArray.arrayWithCapacity<MinMax>(repeatingLength);

          let gridTrackRepetition = null;
          switch (item.repeating_type) {
            case TSCGridTrackRepetition.AutoFill:
              gridTrackRepetition = TSCGridTrackRepetition.AutoFill;
              break;
            case TSCGridTrackRepetition.AutoFit:
              gridTrackRepetition = TSCGridTrackRepetition.AutoFit;
              break;
            case TSCGridTrackRepetition.Count:
              gridTrackRepetition = GridTrackRepetition.Count(item.repeating_count);
              break;
          }
          if (gridTrackRepetition === null) {
            continue;
          }

          for (let j = 0; j < repeatingLength; j++) {
            const repeat = repeating[j];
            tracks.addObject(MinMax.fromTypeValue(repeat.min_type, repeat.min_value, repeat.max_type, repeat.max_value));
          }

          const repeat = TrackSizingFunction.AutoRepeat(gridTrackRepetition, tracks);
          array.addObject(repeat);
        } else {
          const single = item.value as MinMaxType;
          const trackSizingFunction = TrackSizingFunction.Single(MinMax.fromTypeValue(single.min_type, single.min_value, single.max_type, single.max_value));
          array.addObject(trackSizingFunction);
        }
      }

      instance.ios.gridTemplateColumns = array;
    }
  }
}

export function _parseGridAutoRowsColumns(value: string): Array<MinMaxType> {
  const array = [];
  if (typeof value === 'string') {
    const values = value.split(' ');
    values.forEach((item) => {
      const value = _parseMinMaxValue(item);
      array.push({
        is_repeating: false,
        repeating_type: 0,
        value,
      });
    });
  }
  return array;
}

export function _setGridAutoRows(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const values = _parseGridAutoRowsColumns(value);

  if (JSIEnabled) {
    global.__Mason_setGridAutoRows(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, values, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      const array = Array.create('org.nativescript.mason.masonkit.MinMax', values.length);
      const length = value.length;
      for (let i = 0; i < length; i++) {
        const item = value[i];

        const minMax = org.nativescript.mason.masonkit.MinMax.fromTypeValue(item.min_type, item.min_value, item.max_type, item.max_value);

        array[i] = minMax;
      }

      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridAutoRows(nodeOrView, array);
      } else {
        nodeOrView.setGridAutoRows(array);
      }
    }

    if (global.isIOS) {
      const length = value.length;
      const array = NSMutableArray.arrayWithCapacity<MinMax>(length);

      for (let i = 0; i < length; i++) {
        const item = value[i];
        const minMax = MinMax.fromTypeValue(item.min_type, item.min_value, item.max_type, item.max_value);
        array.addObject(minMax);
      }

      instance.ios.gridAutoRows = array;
    }
  }
}

export function _setGridAutoColumns(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const values = _parseGridAutoRowsColumns(value);

  if (JSIEnabled) {
    global.__Mason_setGridAutoColumns(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, values, !instance._inBatch);
  } else {
    if (global.isAndroid) {
      const array = Array.create('org.nativescript.mason.masonkit.MinMax', values.length);
      const length = value.length;
      for (let i = 0; i < length; i++) {
        const item = value[i];

        const minMax = org.nativescript.mason.masonkit.MinMax.fromTypeValue(item.min_type, item.min_value, item.max_type, item.max_value);

        array[i] = minMax;
      }

      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridAutoColumns(nodeOrView, array);
      } else {
        nodeOrView.setGridAutoColumns(array);
      }
    }

    if (global.isIOS) {
      const length = value.length;
      const array = NSMutableArray.arrayWithCapacity<MinMax>(length);

      for (let i = 0; i < length; i++) {
        const item = value[i];
        const minMax = MinMax.fromTypeValue(item.min_type, item.min_value, item.max_type, item.max_value);
        array.addObject(minMax);
      }

      instance.ios.gridAutoColumns = array;
    }
  }
}
