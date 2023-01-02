declare const __non_webpack_require__;

import { Utils } from '@nativescript/core';
import { TSCViewBase } from './common';

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
  Start = 0,

  End = 1,

  Center = 2,

  Stretch = 3,

  SpaceBetween = 4,

  SpaceAround = 5,

  SpaceEvenly = 6,
}

export const enum JustifyItems {
  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

export const enum JustifySelf {
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
};

export let JSIEnabled = false;

if (global.isAndroid) {
  try {
    __non_webpack_require__('system_lib://libmasonnativev8.so');
    JSIEnabled = false;
  } catch (error) {
    console.warn('Failed to enable on FastAPI');
  }
}

export function _parseDimension(dim: org.nativescript.mason.masonkit.Dimension) {
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

export function _parseLength(value): { value: number; type: 'auto' | 'points' | 'percent'; native_type: MasonDimensionCompatType } {
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
        return { value: value.value * 100, type: 'percent', native_type: MasonDimensionCompatType.Percent };
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

export function _setDisplay(value, instance: TSCView, initial = false) {
  if (initial && value === 'flex') {
    return;
  }

  if (instance._hasNativeView) {
    if (JSIEnabled) {
      switch (value) {
        case 'none':
          global.__Mason_setDisplay(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, !instance._inBatch);
          break;
        case 'flex':
          global.__Mason_setDisplay(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 1, !instance._inBatch);
          break;
        case 'grid':
          global.__Mason_setDisplay(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 2, !instance._inBatch);
          break;
      }
    } else {
      switch (value) {
        case 'flex':
          instance.android.setDisplay(org.nativescript.mason.masonkit.Display.Flex);
          break;
        case 'grid':
          instance.android.setDisplay(org.nativescript.mason.masonkit.Display.Grid);
          break;
        case 'none':
          instance.android.setDisplay(org.nativescript.mason.masonkit.Display.None);
          break;
      }
    }
  }
}

export function _setMinWidth(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMinWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMinSizeWidth(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMinWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMinSizeWidth(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMinWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMinSizeWidth(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setMinHeight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);

  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMinHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMinSizeHeight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMinHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMinSizeHeight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMinHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMinSizeHeight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setWidth(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setSizeWidth(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setSizeWidth(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setSizeWidth(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setHeight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);

  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setSizeHeight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setSizeHeight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setSizeHeight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setMaxWidth(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMaxWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMaxSizeWidth(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMaxWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMaxSizeWidth(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMaxWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMaxSizeWidth(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setMaxHeight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);

  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMaxHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMaxSizeHeight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMaxHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMaxSizeHeight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMaxHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMaxSizeHeight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setFlexDirection(value, instance: TSCView, initial = false) {
  if (initial && value === 'row') {
    return;
  }
  if (instance._hasNativeView) {
    switch (value) {
      case 'column':
        if (JSIEnabled) {
          global.__Mason_setFlexDirection(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, FlexDirection.Column, !instance._inBatch);
        } else {
          instance.android.setFlexDirection(org.nativescript.mason.masonkit.FlexDirection.Column);
        }
        break;
      case 'row':
        if (JSIEnabled) {
          global.__Mason_setFlexDirection(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, FlexDirection.Row, !instance._inBatch);
        } else {
          instance.android.setFlexDirection(org.nativescript.mason.masonkit.FlexDirection.Row);
        }
        break;
      case 'column-reverse':
        if (JSIEnabled) {
          global.__Mason_setFlexDirection(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, FlexDirection.ColumnReverse, !instance._inBatch);
        } else {
          instance.android.setFlexDirection(org.nativescript.mason.masonkit.FlexDirection.ColumnReverse);
        }
        break;
      case 'row-reverse':
        if (JSIEnabled) {
          global.__Mason_setFlexDirection(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, FlexDirection.RowReverse, !instance._inBatch);
        } else {
          instance.android.setFlexDirection(org.nativescript.mason.masonkit.FlexDirection.RowReverse);
        }
        break;
    }
  }
}

export function _setAlignSelf(value, instance: TSCView, initial = false) {
  if (initial && value === 'auto') {
    return;
  }

  if (instance._hasNativeView) {
    switch (value) {
      case 'baseline':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.Baseline, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.Baseline);
        }
        break;
      case 'start':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.Start, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.Start);
        }
        break;
      case 'end':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.End, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.End);
        }
        break;
      case 'center':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.Center, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.Center);
        }
        break;
      case 'stretch':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.Stretch, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.Stretch);
        }
        break;
    }
  }
}

export function _getAlignSelf(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignSelf(this._masonStylePtr);

      switch (value) {
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
      const value = instance.android.getAlignSelf();
      switch (value) {
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
  }
  return instance.style.alignSelf;
}

export function _setJustifySelf(value, instance: TSCView, initial = false) {
  if (initial && value === 'stretch') {
    return;
  }

  if (instance._hasNativeView) {
    switch (value) {
      case 'baseline':
        if (JSIEnabled) {
          global.__Mason_setJustifySelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifySelf.Baseline, !instance._inBatch);
        } else {
          instance.android.setJustifySelf(org.nativescript.mason.masonkit.JustifySelf.Baseline);
        }
        break;
      case 'start':
        if (JSIEnabled) {
          global.__Mason_setJustifySelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifySelf.Start, !instance._inBatch);
        } else {
          instance.android.setJustifySelf(org.nativescript.mason.masonkit.JustifySelf.Start);
        }
        break;
      case 'end':
        if (JSIEnabled) {
          global.__Mason_setJustifySelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifySelf.End, !instance._inBatch);
        } else {
          instance.android.setJustifySelf(org.nativescript.mason.masonkit.JustifySelf.End);
        }
        break;
      case 'center':
        if (JSIEnabled) {
          global.__Mason_setJustifySelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifySelf.Center, !instance._inBatch);
        } else {
          instance.android.setJustifySelf(org.nativescript.mason.masonkit.JustifySelf.Center);
        }
        break;
      case 'stretch':
        if (JSIEnabled) {
          global.__Mason_setJustifySelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifySelf.Stretch, !instance._inBatch);
        } else {
          instance.android.setJustifySelf(org.nativescript.mason.masonkit.JustifySelf.Stretch);
        }
        break;
    }
  }
}

export function _getJustifySelf(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getJustifySelf(this._masonStylePtr);

      switch (value) {
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
      const value = instance.android.getJustifySelf();
      switch (value) {
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
  }
  return instance.style.justifySelf;
}

export function _setPosition(value, instance: TSCView, initial = false) {
  if (initial && value === 'relative') {
    return;
  }

  if (instance._hasNativeView) {
    switch (value) {
      case 'absolute':
        if (JSIEnabled) {
          global.__Mason_setPosition(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, PositionType.Absolute, !instance._inBatch);
        } else {
          instance.android.setPosition(org.nativescript.mason.masonkit.Position.Absolute);
        }

        break;
      case 'relative':
        if (JSIEnabled) {
          global.__Mason_setPosition(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, PositionType.Relative, !instance._inBatch);
        } else {
          instance.android.setPosition(org.nativescript.mason.masonkit.Position.Relative);
        }

        break;
    }
  }
}

export function _setFlexWrap(value, instance: TSCView, initial = false) {
  if (initial && value === 'no-wrap') {
    return;
  }
  if (instance._hasNativeView) {
    switch (value) {
      case 'no-wrap':
        if (JSIEnabled) {
          global.__Mason_setFlexWrap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, FlexWrap.NoWrap, !instance._inBatch);
        } else {
          instance.android.setFlexWrap(org.nativescript.mason.masonkit.FlexWrap.NoWrap);
        }
        break;
      case 'wrap':
        if (JSIEnabled) {
          global.__Mason_setFlexWrap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, FlexWrap.Wrap, !instance._inBatch);
        } else {
          instance.android.setFlexWrap(org.nativescript.mason.masonkit.FlexWrap.Wrap);
        }

        break;
      case 'wrap-reverse':
        if (JSIEnabled) {
          global.__Mason_setFlexWrap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, FlexWrap.WrapReverse, !instance._inBatch);
        } else {
          instance.android.setFlexWrap(org.nativescript.mason.masonkit.FlexWrap.WrapReverse);
        }
        break;
    }
  }
}

export function _getFlexWrap(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getFlexWrap(this._masonStylePtr);
      switch (value) {
        case 0:
          return 'no-wrap';
        case 1:
          return 'wrap';
        case 2:
          return 'wrap-reverse';
      }
    } else {
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
  }
  return instance.style.flexWrap;
}

export function _setAlignItems(value, instance: TSCView, initial = false) {
  if (initial && value === 'no-wrap') {
    return;
  }
  if (instance._hasNativeView) {
    switch (value) {
      case 'baseline':
        if (JSIEnabled) {
          global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignItems.Baseline, !instance._inBatch);
        } else {
          instance.android.setAlignItems(org.nativescript.mason.masonkit.AlignItems.Baseline);
        }

        break;
      case 'center':
        if (JSIEnabled) {
          global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignItems.Center, !instance._inBatch);
        } else {
          instance.android.setAlignItems(org.nativescript.mason.masonkit.AlignItems.Center);
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignItems.End, !instance._inBatch);
        } else {
          instance.android.setAlignItems(org.nativescript.mason.masonkit.AlignItems.End);
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignItems.Start, !instance._inBatch);
        } else {
          instance.android.setAlignItems(org.nativescript.mason.masonkit.AlignItems.Start);
        }

        break;
      case 'stretch':
        if (JSIEnabled) {
          global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignItems.Stretch, !instance._inBatch);
        } else {
          instance.android.setAlignItems(org.nativescript.mason.masonkit.AlignItems.Stretch);
        }

        break;
    }
  }
}

export function _getAlignItems(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignItems(this._masonStylePtr);
      switch (value) {
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
      const value = instance.android.getAlignItems();
      switch (value) {
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
  }
  return instance.style.alignItems;
}

export function _setAlignContent(value, instance: TSCView, initial = false) {
  if (initial && value === 'flex-start') {
    return;
  }
  if (instance._hasNativeView) {
    switch (value) {
      case 'space-around':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.SpaceAround, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.SpaceAround);
        }

        break;
      case 'space-between':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.SpaceBetween, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.SpaceBetween);
        }
        break;
      case 'space-evenly':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.SpaceEvenly, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.SpaceEvenly);
        }
        break;
      case 'center':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.Center, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.Center);
        }
        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.End, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.End);
        }
        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.Start, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.Start);
        }
        break;
      case 'stretch':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.Stretch, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.Stretch);
        }
        break;
    }
  }
}

export function _getAlignContent(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignContent(this._masonStylePtr);
      switch (value) {
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
      const value = instance.android.getAlignContent();
      switch (value) {
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
  }
  return instance.style.alignItems;
}

export function _setJustifyItems(value, instance: TSCView, initial = false) {
  if (initial && value === 'stretch') {
    return;
  }
  if (instance._hasNativeView) {
    switch (value) {
      case 'baseline':
        if (JSIEnabled) {
          global.__Mason_setJustifyItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifyItems.Baseline, !instance._inBatch);
        } else {
          instance.android.setJustifyItems(org.nativescript.mason.masonkit.JustifyItems.Baseline);
        }

        break;
      case 'center':
        if (JSIEnabled) {
          global.__Mason_setJustifyItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifyItems.Center, !instance._inBatch);
        } else {
          instance.android.setJustifyItems(org.nativescript.mason.masonkit.JustifyItems.Center);
        }

        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          global.__Mason_setJustifyItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifyItems.End, !instance._inBatch);
        } else {
          instance.android.setJustifyItems(org.nativescript.mason.masonkit.JustifyItems.End);
        }

        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          global.__Mason_setJustifyItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifyItems.Start, !instance._inBatch);
        } else {
          instance.android.setJustifyItems(org.nativescript.mason.masonkit.JustifyItems.Start);
        }

        break;
      case 'stretch':
        if (JSIEnabled) {
          global.__Mason_setJustifyItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, JustifyItems.Stretch, !instance._inBatch);
        } else {
          instance.android.setJustifyItems(org.nativescript.mason.masonkit.JustifyItems.Stretch);
        }

        break;
    }
  }
}

export function _getJustifyItems(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getJustifyItems(this._masonStylePtr);
      switch (value) {
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
      const value = instance.android.getJustifyItems();
      switch (value) {
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
  }
  return instance.style.justifyItems;
}

export function _setJustifyContent(value, instance: TSCView, initial = false) {
  if (initial && value === 'flex-start') {
    return;
  }
  if (instance._hasNativeView) {
    switch (value) {
      case 'space-around':
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.SpaceAround, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.SpaceAround);
        }
        break;
      case 'space-between':
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.SpaceBetween, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.SpaceBetween);
        }
        break;
      case 'space-evenly':
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.SpaceEvenly, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.SpaceEvenly);
        }
        break;
      case 'center':
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.Center, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.Center);
        }
        break;
      case 'flex-end':
      case 'end':
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.End, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.End);
        }
        break;
      case 'flex-start':
      case 'start':
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.Start, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.Start);
        }
        break;
    }
  }
}

export function _getJustifyContent(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getJustifyConten(this._masonStylePtr);
      switch (value) {
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
      const value = instance.android.getJustifyContent();
      switch (value) {
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
      }
    }
  }
  return instance.style.justifyContent;
}

export function _setLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setInsetLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setInsetLeft(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setInsetLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setInsetLeft(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setInsetLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setInsetLeft(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setInsetRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setInsetRight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setInsetRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setInsetRight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setInsetRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setInsetRight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setInsetTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setInsetTop(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setInsetTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setInsetTop(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setInsetTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setInsetTop(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setInsetBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setInsetBottom(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setInsetBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setInsetBottom(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setInsetBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points), !instance._inBatch;
      } else {
        instance.android.setInsetBottom(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setMarginLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMarginLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMarginLeft(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMarginLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMarginLeft(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMarginLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMarginLeft(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setMarginRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMarginRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMarginRight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMarginRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMarginRight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMarginRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMarginRight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setMarginTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMarginTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMarginTop(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMarginTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMarginTop(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMarginTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMarginTop(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setMarginBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setMarginBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setMarginBottom(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setMarginBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setMarginBottom(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setMarginBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setMarginBottom(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setPaddingLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPaddingLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPaddingLeft(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPaddingLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPaddingLeft(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPaddingLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setPaddingLeft(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setPaddingRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPaddingRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPaddingRight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPaddingRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPaddingRight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPaddingRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setPaddingRight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setPaddingTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPaddingTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPaddingTop(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPaddingTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPaddingTop(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPaddingTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setPaddingTop(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setPaddingBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPaddingBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPaddingBottom(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPaddingBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPaddingBottom(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPaddingBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setPaddingBottom(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setBorderLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setBorderLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setBorderLeft(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setBorderLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setBorderLeft(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setBorderLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setBorderLeft(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setBorderRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setBorderRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setBorderRight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setBorderRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setBorderRight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setBorderRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setBorderRight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setBorderTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setBorderTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setBorderTop(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setBorderTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setBorderTop(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setBorderTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setBorderTop(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setBorderBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setBorderBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setBorderBottom(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setBorderBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setBorderBottom(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setBorderBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setBorderBottom(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _setFlexBasis(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setFlexBasis(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setFlexBasis(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setFlexBasis(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setFlexBasis(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setFlexBasis(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setFlexBasis(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

export function _getFlexBasis(instance: TSCView) {
  if (!instance._hasNativeView) {
    return (instance as any).style.flexBasis;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexBasis(this._masonStylePtr);
  } else {
    return _parseDimension(instance.android.getFlexBasis());
    //  return JSON.parse(this.android.getSizeJsonValue())?.width;
  }
}

export function _setGap(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const width = _parseLength(value.width);
  const height = _parseLength(value.height);

  if (JSIEnabled) {
    global.__Mason_setGap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, width.value, width.native_type, height.value, height.native_type, !instance._inBatch);
  } else {
    instance.android.setGap(width.value, width.native_type, height.value, height.native_type);
  }
}

export function _getGap(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }
  if (JSIEnabled) {
    return global.__Mason_getGap(this._masonStylePtr);
  } else {
    const gap = instance.android.getGap();
    const width = _parseDimension(gap.getWidth());
    const height = _parseDimension(gap.getHeight());
    return { width, height };
    //  return JSON.parse(this.android.getSizeJsonValue())?.width;
  }
}

export function _setFlexGrow(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setFlexGrow(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    instance.android.setFlexGrow(value);
  }
}

export function _getFlexGrow(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.flexGrow;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexGrow(this._masonStylePtr);
  } else {
    return instance.android.getFlexGrow();
  }
}

export function _setFlexShrink(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setFlexShrink(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    instance.android.setFlexShrink(value);
  }
}

export function _getFlexShrink(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.flexShrink;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexShrink(this._masonStylePtr);
  } else {
    return instance.android.getFlexShrink();
  }
}

export function _setAspectRatio(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setAspectRatio(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    instance.android.setAspectRatio(value);
  }
}

export function _getAspectRatio(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.aspectRatio;
  }
  if (JSIEnabled) {
    return global.__Mason_getAspectRatio(this._masonStylePtr);
  } else {
    return instance.android.getAspectRatio();
  }
}
