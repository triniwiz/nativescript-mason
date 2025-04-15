// declare const __non_webpack_require__;

import { Length, Utils } from '@nativescript/core';
import { style_, ViewBase } from './common';

type View = ViewBase & {
  _hasNativeView: boolean;
  _masonPtr: bigint;
  _masonNodePtr: bigint;
  _inBatch: boolean;
  ios: MasonUIView;
  android: org.nativescript.mason.masonkit.View;
  [style_]: Style;
};

import { parseUnit } from '@nativescript/core/css/parser';
import type { Style } from './style';

const enum Overflow {
  Visible = 0,

  Hidden = 1,

  Scroll = 2,
}

const enum Display {
  None = 0,

  Flex = 1,

  Grid = 2,

  Block = 3,
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

const enum GridAutoFlow {
  Row,
  Column,
  RowDense,
  ColumnDense,
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

  FlexStart = 7,

  FlexEnd = 8,
}

export const enum AlignItems {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,

  FlexStart = 5,

  FlexEnd = 6,
}

export const enum AlignSelf {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,

  FlexStart = 5,

  FlexEnd = 6,
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

  FlexStart = 7,

  FlexEnd = 8,
}

export const enum JustifyItems {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,

  FlexStart = 5,

  FlexEnd = 6,
}

export const enum JustifySelf {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,

  FlexStart = 5,

  FlexEnd = 6,
}

export let UseV8Module = false;

// if (__ANDROID__) {
//   try {
//     java.lang.System.loadLibrary('masonnative');
//     __non_webpack_require__('system_lib://libmasonnativev8.so');
//     UseV8Module = true;
//   } catch (error) {
//     console.warn('Failed to enable on FastAPI');
//   }
// }

// if (__APPLE__) {
//   NSCMason.alwaysEnable = true;
//   if (!UseV8Module) {
//     try {
//       const installer = MasonV8Module.new();
//       installer.install();
//       UseV8Module = true;
//     } catch (error) {
//       console.warn('Failed to enable on FastAPI');
//     }
//   }
// }

function getMasonInstance(instance: View) {
  const nativeView = instance?.nativeView;
  if (instance._isMasonChild) {
    const parent = instance.parent?.nativeView;
    return parent?.nodeForView?.(nativeView as any);
  }
  return nativeView;
}

export function _forceStyleUpdate(instance: View) {
  if (!instance._hasNativeView) {
    return;
  }

  if (UseV8Module) {
    MasonV8Module.updateNodeAndStyle(instance._masonPtr, instance._masonNodePtr);
  } else {
    if (__ANDROID__) {
      const nodeOrView = getMasonInstance(instance);
      nodeOrView.updateNodeAndStyle();
    }

    if (__APPLE__) {
      (instance.ios as MasonUIView).node.style.updateNativeStyle();
    }
  }
}

export function _markDirty(instance: View) {
  if (!instance._hasNativeView) {
    return;
  }
  if (UseV8Module) {
    MasonV8Module.markDirty(instance._masonPtr, instance._masonNodePtr);
  } else {
    if (__ANDROID__) {
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        nodeOrView.dirty();
      } else {
        nodeOrView.markNodeDirty();
      }
    }

    if (__APPLE__) {
      instance.ios.node.markDirty();
    }
  }
}

export function _isDirty(instance: View) {
  if (!instance._hasNativeView) {
    return;
  }
  if (UseV8Module) {
    return MasonV8Module.isDirty(instance._masonPtr, instance._masonNodePtr);
  } else {
    if (__ANDROID__) {
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        return nodeOrView.isDirty();
      } else {
        return nodeOrView.isNodeDirty();
      }
    }

    if (__ANDROID__) {
      return instance.ios.node.isDirty;
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
  if (__APPLE__) {
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
  if (__APPLE__) {
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
  if (__APPLE__) {
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
    return { value: 0, type: 'auto', native_type: 0 /* MasonDimensionCompatType.Auto */ };
  }

  let typeOf = typeof value;

  if (typeOf === 'number') {
    return { value: Utils.layout.toDevicePixels(value), type: 'points', native_type: 1 /* MasonDimensionCompatType.Points */ };
  }

  if (typeOf === 'string') {
    value = parseUnit(value).value;
    typeOf = 'object';
  }
  if (typeOf === 'object') {
    switch (value?.unit) {
      case '%':
        return { value: value.value, type: 'percent', native_type: 2 /* MasonDimensionCompatType.Percent */ };
      case 'px':
        return { value: value.value, type: 'points', native_type: 1 /* MasonDimensionCompatType.Points */ };
      case 'dip':
        return { value: Utils.layout.toDevicePixels(value.value), type: 'points', native_type: 1 /* MasonDimensionCompatType.Points */ };
    }
  }

  return { value: value, type: 'points', native_type: 1 /* MasonDimensionCompatType.Points */ };
}

export function _intoMasonDimension(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (__APPLE__) {
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

  if (__ANDROID__) {
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

function syncStyle(instance: View) {
  if (UseV8Module) {
    //
  } else {
    //
  }
}

export function _setDisplay(value, instance: View, initial = false) {
  if (initial && value === 'block') {
    return;
  }

  if (instance._hasNativeView) {
    instance[style_].display = value;
    syncStyle(instance);
  }
}

export function _getDisplay(instance: View) {
  return instance[style_].display;
}

export function _setMinWidth(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].minWidth = value;
  syncStyle(instance);
}

export function _getMinWidth(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.minWidth;
  }
  return instance[style_].minWidth;
}

export function _setMinHeight(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].minHeight = value;
  syncStyle(instance);
}

export function _getMinHeight(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.minHeight;
  }
  return instance[style_].minHeight;
}

export function _setWidth(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].width = value;
  syncStyle(instance);
}

export function _getWidth(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.width;
  }
  return instance[style_].width;
}

export function _setHeight(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].height = value;
  syncStyle(instance);
}

export function _getHeight(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.height;
  }
  return instance[style_].height;
}

export function _setMaxWidth(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].maxWidth = value;
  syncStyle(instance);
}

export function _getMaxWidth(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.maxWidth;
  }
  return instance[style_].maxWidth;
}

export function _setMaxHeight(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].maxHeight = value;
  syncStyle(instance);
}

export function _getMaxHeight(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.maxHeight;
  }
  return instance[style_].maxHeight;
}

export function _setFlexDirection(value, instance: View, initial = false) {
  if (initial && value === 'row') {
    return;
  }
  if (instance._hasNativeView) {
    instance[style_].flexDirection = value;
  }
}

export function _getFlexDirection(instance: View) {
  return instance[style_].flexDirection;
}

export function _getPosition(instance: View) {
  return instance[style_].position;
}

export function _setPosition(value, instance: View, initial = false) {
  if (initial && value === 'relative') {
    return;
  }

  if (instance._hasNativeView) {
    instance[style_].position = value;
  }
}

export function _setFlexWrap(value, instance: View, initial = false) {
  if (initial && value === 'no-wrap') {
    return;
  }
  if (instance._hasNativeView) {
    instance[style_].flexWrap = value;
  }
}

export function _getFlexWrap(instance: View) {
  if (instance._hasNativeView) {
    return instance[style_].flexWrap;
  }
  return instance.style.flexWrap;
}

export function _setAlignItems(value, instance: View, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    instance[style_].alignItems = value;
  }
}

export function _getAlignItems(instance: View) {
  if (instance._hasNativeView) {
    return instance[style_].alignItems;
  }
  return instance.style.alignItems;
}

export function _setAlignSelf(value, instance: View, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    instance[style_].alignSelf = value;
  }
}

export function _getAlignSelf(instance: View): AlignSelf {
  if (instance._hasNativeView) {
    return instance[style_].alignSelf as never;
  }
  return instance.style.alignSelf as never;
}

export function _setAlignContent(value, instance: View, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    instance[style_].alignContent = value;
  }
}

export function _getAlignContent(instance: View) {
  if (instance._hasNativeView) {
    return instance[style_].alignContent;
  }
  return instance.style.alignContent;
}

export function _setJustifyItems(value, instance: View, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    instance[style_].justifyItems = value;
  }
}

export function _getJustifyItems(instance: View) {
  if (instance._hasNativeView) {
    return instance[style_].justifyItems;
  }
  return instance.style.justifyItems;
}

export function _setJustifySelf(value, instance: View, initial = false) {
  if (initial && value === 'normal') {
    return;
  }
  if (instance._hasNativeView) {
    instance[style_].justifySelf = value;
  }
}

export function _getJustifySelf(instance: View) {
  if (instance._hasNativeView) {
    return instance[style_].justifySelf;
  }
  return instance.style.justifySelf;
}

export function _setJustifyContent(value, instance: View, initial = false) {
  if (initial && value === 'normal') {
    return;
  }

  if (!value) value = 'normal';

  if (instance._hasNativeView) {
    instance[style_].justifyContent = value;
  }
}

export function _getJustifyContent(instance: View) {
  if (instance._hasNativeView) {
    return instance[style_].justifyContent;
  }
  return instance.style.justifyContent;
}

export function _setLeft(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].left = value;
}

export function _setRight(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].right = value;
}

export function _setTop(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].top = value;
}

export function _setBottom(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].bottom = value;
}

export function _setMarginLeft(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].marginLeft = value;
}

export function _setMarginRight(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].marginRight = value;
}

export function _setMarginTop(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].marginTop = value;
}

export function _setMarginBottom(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].marginBottom = value;
}

export function _setPaddingLeft(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].paddingLeft = value;
}

export function _setPaddingRight(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].paddingRight = value;
}

export function _setPaddingTop(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].paddingTop = value;
}

export function _setPaddingBottom(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].paddingBottom = value;
}

export function _setBorderLeft(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
}

export function _setBorderRight(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
}

export function _setBorderTop(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
}

export function _setBorderBottom(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
}

export function _setFlexBasis(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].flexBasis = value;
}

export function _getFlexBasis(instance: View) {
  if (!instance._hasNativeView) {
    return (instance as any).style.flexBasis;
  }
  return instance[style_].flexBasis;
}

export function _setGap(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
}

export function _getGap(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }

  return {
    row: this[style_].rowGap,
    column: this[style_].columnGap,
  };
}

export function _setOverflow(value, instance: View) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].overflow = value;
}

export function _getOverflow(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.flexGrow;
  }
  return instance[style_].overflow;
}

export function _setOverflowX(value, instance: View) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].overflowX = value;
}

export function _getOverflowX(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.overflowX;
  }
  return instance[style_].overflowX;
}

export function _setOverflowY(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].overflowY = value;
}

export function _getOverflowY(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.overflowY;
  }

  return instance[style_].overflowY;
}

export function _setScrollbarWidth(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].scrollBarWidth = value;
}

export function getScrollbarWidth(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.scrollBarWidth;
  }
  return instance[style_].scrollBarWidth;
}

export function _setFlexGrow(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].flexGrow = value;
}

export function _getFlexGrow(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.flexGrow;
  }
  return instance[style_].flexGrow;
}

export function _setFlexShrink(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].flexShrink = value;
}

export function _getFlexShrink(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.flexShrink;
  }
  return instance[style_].flexShrink;
}

export function _setAspectRatio(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].aspectRatio = value;
}

export function _getAspectRatio(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.aspectRatio;
  }
  const ratio = instance[style_].aspectRatio;
  return Number.isNaN(ratio) ? null : ratio;
}

function _parseGridLine(value): { value: number; type: any; native_value?: any } {
  let parsedValue = undefined;
  let parsedType = undefined;
  let nativeValue = undefined;

  if (value === 'auto' || value === undefined) {
    parsedValue = 0;
    parsedType = 0 /* GridPlacementCompatType.Auto */;
  }

  if (typeof value === 'string') {
    if (value.startsWith('span')) {
      parsedValue = Number(value.replace('span', '').trim());
      parsedType = 2 /* GridPlacementCompatType.Span */;
    } else {
      parsedValue = Number(value.trim());
      if (parsedValue < 1) {
        parsedValue = 0;
        parsedType = 0 /* GridPlacementCompatType.Auto */;
      } else {
        parsedType = 1 /* GridPlacementCompatType.Line */;
      }
    }
  }

  if (typeof value === 'number') {
    parsedValue = value;
    if (parsedValue < 1) {
      parsedValue = 0;
      parsedType = 0 /* GridPlacementCompatType.Auto */;
    } else {
      parsedType = 1 /* GridPlacementCompatType.Line */;
    }
  }

  if (parsedType === 0) {
    if (!UseV8Module) {
      if (__ANDROID__) {
        parsedType = org.nativescript.mason.masonkit.GridPlacement.Auto;
        nativeValue = org.nativescript.mason.masonkit.GridPlacement.Auto.INSTANCE;
      }
      if (__APPLE__) {
        parsedType = 0 /* GridPlacementCompatType.Auto */;
        nativeValue = GridPlacementCompat.Auto;
      }
    }
  } else if (parsedType === 1) {
    if (!UseV8Module) {
      const isValid = !Number.isNaN(parsedValue);
      if (__ANDROID__) {
        parsedType = org.nativescript.mason.masonkit.GridPlacement.Line;
        if (isValid) {
          nativeValue = new org.nativescript.mason.masonkit.GridPlacement.Line(parsedValue);
        }
      }
      if (__APPLE__) {
        parsedType = 1 /* GridPlacementCompatType.Line */;
        if (isValid) {
          nativeValue = GridPlacementCompat.alloc().initWithLine(parsedValue);
        }
      }
    }
  } else {
    if (!UseV8Module) {
      const isValid = !Number.isNaN(parsedValue);
      if (__ANDROID__) {
        parsedType = org.nativescript.mason.masonkit.GridPlacement.Span;
        if (isValid) {
          nativeValue = new org.nativescript.mason.masonkit.GridPlacement.Span(parsedValue);
        }
      }
      if (__APPLE__) {
        parsedType = 2 /* GridPlacementCompatType.Span */;
        if (isValid) {
          nativeValue = GridPlacementCompat.alloc().initWithSpan(parsedValue);
        }
      }
    }
  }

  return { value: Number.isNaN(parsedValue) ? undefined : parsedValue, type: parsedType, native_value: nativeValue };
}

export function _setGridColumnStart(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (UseV8Module) {
    MasonV8Module.setColumnStart(instance._masonPtr, instance._masonNodePtr, val, !instance._inBatch);
  } else {
    if (__ANDROID__) {
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridColumnStart(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridColumnStart(val.native_value);
      }
    }

    if (__APPLE__) {
      instance.ios.gridColumnStartCompat = val.native_value;
    }
  }
}

export function _setGridColumnEnd(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (UseV8Module) {
    MasonV8Module.setColumnEnd(instance._masonPtr, instance._masonNodePtr, val, !instance._inBatch);
  } else {
    if (__ANDROID__) {
      const nodeOrView = getMasonInstance(instance);
      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridColumnEnd(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridColumnEnd(val.native_value);
      }
    }

    if (__APPLE__) {
      instance.ios.gridColumnEndCompat = val.native_value;
    }
  }
}

export function _setGridRowStart(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (UseV8Module) {
    MasonV8Module.setRowStart(instance._masonPtr, instance._masonNodePtr, val, !instance._inBatch);
  } else {
    if (__ANDROID__) {
      const nodeOrView = getMasonInstance(instance);

      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridRowStart(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridRowStart(val.native_value);
      }
    }

    if (__APPLE__) {
      instance.ios.gridRowStartCompat = val.native_value;
    }
  }
}

export function _setGridRowEnd(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const val = _parseGridLine(value);

  if (val.value === undefined || val.type === undefined) {
    return;
  }

  if (UseV8Module) {
    MasonV8Module.setRowEnd(instance._masonPtr, instance._masonNodePtr, val, !instance._inBatch);
  } else {
    if (__ANDROID__) {
      const nodeOrView = getMasonInstance(instance);

      if (instance._isMasonChild) {
        org.nativescript.mason.masonkit.NodeHelper.INSTANCE.setGridRowEnd(nodeOrView, val.native_value);
      } else {
        nodeOrView.setGridRowEnd(val.native_value);
      }
    }

    if (__APPLE__) {
      instance.ios.gridRowEndCompat = val.native_value;
    }
  }
}

export function _setRowGap(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  instance[style_].rowGap = value;
}

export function _getRowGap(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }
  return instance[style_].rowGap;
}

export function _setColumnGap(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  instance[style_].columnGap = value;
}

export function _getColumnGap(instance: View) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }
  return instance[style_].columnGap;
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

export function _setGridTemplateRows(value: Array<GridTemplates>, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  if (UseV8Module) {
    MasonV8Module.setGridTemplateRows(instance._masonPtr, instance._masonNodePtr, value, !instance._inBatch);
  } else {
    if (__ANDROID__) {
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

    if (__APPLE__) {
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

export function _setGridTemplateColumns(value: Array<GridTemplates>, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  if (UseV8Module) {
    MasonV8Module.setGridTemplateColumns(instance._masonPtr, instance._masonNodePtr, value, !instance._inBatch);
  } else {
    if (__ANDROID__) {
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

          const minMax = single ? org.nativescript.mason.masonkit.MinMax.fromTypeValue(single.min_type, single.min_value, single.max_type, single.max_value) : org.nativescript.mason.masonkit.MinMax.Auto.INSTANCE;
          const trackSizingFunction = new org.nativescript.mason.masonkit.TrackSizingFunction.Single(minMax);
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

    if (__APPLE__) {
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

export function _setGridAutoFlow(value, instance: View) {
  if (!instance._hasNativeView) {
    return;
  }

  instance.ios.gridAutoFlow = value;
}

export function _getGridAutoFlow(instance) {
  if (!instance._hasNativeView) {
    return;
  }

  return this[style_].gridAutoFlow;
}

export function _setGridAutoRows(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const values = _parseGridAutoRowsColumns(value);

  if (UseV8Module) {
    MasonV8Module.setGridAutoRows(instance._masonPtr, instance._masonNodePtr, values, !instance._inBatch);
  } else {
    if (__ANDROID__) {
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

    if (__APPLE__) {
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

export function _setGridAutoColumns(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const values = _parseGridAutoRowsColumns(value);

  if (UseV8Module) {
    MasonV8Module.setGridAutoColumns(instance._masonPtr, instance._masonNodePtr, values, !instance._inBatch);
  } else {
    if (__ANDROID__) {
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

    if (__APPLE__) {
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
