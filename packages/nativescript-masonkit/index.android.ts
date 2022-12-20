import { aspectRatioProperty, bottomProperty, displayProperty, flexBasisProperty, flexDirectionProperty, gapProperty, leftProperty, positionProperty, rightProperty, topProperty, TSCViewBase } from './common';

import { paddingLeftProperty, paddingTopProperty, paddingRightProperty, paddingBottomProperty, Style, Length, widthProperty, heightProperty, View, Utils, Size, marginProperty, marginBottomProperty, marginLeftProperty, marginRightProperty, marginTopProperty, borderBottomWidthProperty, borderLeftWidthProperty, borderRightWidthProperty, borderTopWidthProperty } from '@nativescript/core';
import { alignSelfProperty } from '@nativescript/core/ui/layouts/flexbox-layout';

declare const __non_webpack_require__;

let JSIEnabled = false;

try {
  __non_webpack_require__('system_lib://libmasonnativev8.so');
  JSIEnabled = true;
} catch (error) {
  console.warn('Failed to turn on JSI');
}

const enum FlexDirection {
  Row = 0,

  Column = 1,

  RowReverse = 2,

  ColumnReverse = 3,
}

const enum MasonDimensionCompatType {
  Points = 0,

  Percent = 1,

  Undefined = 2,

  Auto = 3,
}

const enum PositionType {
  Relative = 0,

  Absolute = 1,
}

const enum FlexWrap {
  NoWrap = 0,

  Wrap = 1,

  WrapReverse = 2,
}

const enum AlignContent {
  FlexStart = 0,

  FlexEnd = 1,

  Center = 2,

  Stretch = 3,

  SpaceBetween = 4,

  SpaceAround = 5,

  SpaceEvenly = 6,
}

const enum AlignItems {
  FlexStart = 0,

  FlexEnd = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

const enum AlignSelf {
  Auto = 0,

  FlexStart = 1,

  FlexEnd = 2,

  Center = 3,

  Baseline = 4,

  Stretch = 5,
}

function _parseDimension(dim: org.nativescript.mason.masonkit.Dimension) {
  const name = (dim as any).getClass().getName();
  switch (name) {
    case 'org.nativescript.mason.masonkit.Dimension$Points':
      return { value: (dim as org.nativescript.mason.masonkit.Dimension.Points).getPoints(), unit: 'px' };
    case 'org.nativescript.mason.masonkit.Dimension$Percent':
      return { value: (dim as org.nativescript.mason.masonkit.Dimension.Percent).getPercentage(), unit: '%' };
    case 'org.nativescript.mason.masonkit.Dimension$Auto':
      return 'auto';
    case 'org.nativescript.mason.masonkit.Dimension$Undefined':
      return undefined;
  }
}

function _parseLength(value): { value: number; type: 'auto' | 'points' | 'percent' | 'undefined'; native_type: MasonDimensionCompatType } {
  if (value === undefined || value === null) {
    return { value: 0, type: 'undefined', native_type: MasonDimensionCompatType.Undefined };
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

function _setDisplay(value, instance: TSCView, initial = false) {
  if (initial && value === 'flex') {
    return;
  }

  if (instance._hasNativeView) {
    if (JSIEnabled) {
      switch (value) {
        case 'flex':
          global.__Mason_setDisplay(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, !instance._inBatch);
          break;
        case 'none':
          global.__Mason_setDisplay(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 1, !instance._inBatch);
          break;
      }
    } else {
      switch (value) {
        case 'flex':
          instance.android.setDisplay(org.nativescript.mason.masonkit.Display.Flex);
          break;
        case 'none':
          instance.android.setDisplay(org.nativescript.mason.masonkit.Display.None);
          break;
      }
    }
  }
}

function _setMinWidth(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMinWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMinSizeWidth(0, MasonDimensionCompatType.Undefined);
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

function _setMinHeight(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMinHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMinSizeHeight(0, MasonDimensionCompatType.Undefined);
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

function _setWidth(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setSizeWidth(0, MasonDimensionCompatType.Undefined);
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

function _setHeight(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setSizeHeight(0, MasonDimensionCompatType.Undefined);
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

function _setMaxWidth(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMaxWidth(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMaxSizeWidth(0, MasonDimensionCompatType.Undefined);
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

function _setMaxHeight(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMaxHeight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMaxSizeHeight(0, MasonDimensionCompatType.Undefined);
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

function _setFlexDirection(value, instance: TSCView, initial = false) {
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

function _setAlignSelf(value, instance: TSCView, initial = false) {
  if (initial && value === 'auto') {
    return;
  }

  if (instance._hasNativeView) {
    switch (value) {
      case 'auto':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.Auto, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.Auto);
        }

        break;
      case 'baseline':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.Baseline, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.Baseline);
        }
        break;
      case 'flex-start':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.FlexStart, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.FlexStart);
        }
        break;
      case 'flex-end':
        if (JSIEnabled) {
          global.__Mason_setAlignSelf(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignSelf.FlexEnd, !instance._inBatch);
        } else {
          instance.android.setAlignSelf(org.nativescript.mason.masonkit.AlignSelf.FlexEnd);
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

function _getAlignSelf(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignSelf(this._masonStylePtr);

      switch (value) {
        case AlignSelf.Baseline:
          return 'baseline';
        case AlignSelf.Center:
          return 'center';
        case AlignSelf.FlexEnd:
          return 'flex-end';
        case AlignSelf.FlexStart:
          return 'flex-start';
        case AlignSelf.Stretch:
          return 'stretch';
        case AlignSelf.Auto:
          return 'auto';
      }
    } else {
      const value = instance.android.getAlignSelf();
      switch (value) {
        case org.nativescript.mason.masonkit.AlignSelf.Baseline:
          return 'baseline';
        case org.nativescript.mason.masonkit.AlignSelf.Center:
          return 'center';
        case org.nativescript.mason.masonkit.AlignSelf.FlexEnd:
          return 'flex-end';
        case org.nativescript.mason.masonkit.AlignSelf.FlexStart:
          return 'flex-start';
        case org.nativescript.mason.masonkit.AlignSelf.Stretch:
          return 'stretch';
        case org.nativescript.mason.masonkit.AlignSelf.Auto:
          return 'auto';
      }
    }
  }
  return instance.style.alignSelf;
}

function _setPositionType(value, instance: TSCView, initial = false) {
  if (initial && value === 'relative') {
    return;
  }

  if (instance._hasNativeView) {
    switch (value) {
      case 'absolute':
        if (JSIEnabled) {
          global.__Mason_setPositionType(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, PositionType.Absolute, !instance._inBatch);
        } else {
          instance.android.setPositionType(org.nativescript.mason.masonkit.PositionType.Absolute);
        }

        break;
      case 'relative':
        if (JSIEnabled) {
          global.__Mason_setPositionType(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, PositionType.Relative, !instance._inBatch);
        } else {
          instance.android.setPositionType(org.nativescript.mason.masonkit.PositionType.Relative);
        }

        break;
    }
  }
}

function _setFlexWrap(value, instance: TSCView, initial = false) {
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

function _getFlexWrap(instance: TSCView) {
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

function _setAlignItems(value, instance: TSCView, initial = false) {
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
        if (JSIEnabled) {
          global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignItems.FlexEnd, !instance._inBatch);
        } else {
          instance.android.setAlignItems(org.nativescript.mason.masonkit.AlignItems.FlexEnd);
        }

        break;
      case 'flex-start':
        if (JSIEnabled) {
          global.__Mason_setAlignItems(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignItems.FlexStart, !instance._inBatch);
        } else {
          instance.android.setAlignItems(org.nativescript.mason.masonkit.AlignItems.FlexStart);
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

function _getAlignItems(instance: TSCView) {
  if (instance._hasNativeView) {
    if (JSIEnabled) {
      const value = global.__Mason_getAlignItems(this._masonStylePtr);
      switch (value) {
        case AlignItems.Baseline:
          return 'baseline';
        case AlignItems.Center:
          return 'center';
        case AlignItems.FlexEnd:
          return 'flex-end';
        case AlignItems.FlexStart:
          return 'flex-start';
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
        case org.nativescript.mason.masonkit.AlignItems.FlexEnd:
          return 'flex-end';
        case org.nativescript.mason.masonkit.AlignItems.FlexStart:
          return 'flex-start';
        case org.nativescript.mason.masonkit.AlignItems.Stretch:
          return 'stretch';
      }
    }
  }
  return instance.style.alignItems;
}

function _setAlignContent(value, instance: TSCView, initial = false) {
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
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.FlexEnd, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.FlexEnd);
        }
        break;
      case 'flex-start':
        if (JSIEnabled) {
          global.__Mason_setAlignContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.FlexStart, !instance._inBatch);
        } else {
          instance.android.setAlignContent(org.nativescript.mason.masonkit.AlignContent.FlexStart);
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

function _getAlignContent(instance: TSCView) {
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
        case AlignContent.FlexEnd:
          return 'flex-end';
        case AlignContent.FlexStart:
          return 'flex-start';
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
        case org.nativescript.mason.masonkit.AlignContent.FlexEnd:
          return 'flex-end';
        case org.nativescript.mason.masonkit.AlignContent.FlexStart:
          return 'flex-start';
        case org.nativescript.mason.masonkit.AlignContent.Stretch:
          return 'stretch';
      }
    }
  }
  return instance.style.alignItems;
}

function _setJustifyContent(value, instance: TSCView, initial = false) {
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
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.FlexEnd, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.FlexEnd);
        }
        break;
      case 'flex-start':
        if (JSIEnabled) {
          global.__Mason_setJustifyContent(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, AlignContent.FlexStart, !instance._inBatch);
        } else {
          instance.android.setJustifyContent(org.nativescript.mason.masonkit.JustifyContent.FlexStart);
        }
        break;
    }
  }
}

function _getJustifyContent(instance: TSCView) {
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
        case JustifyContent.FlexEnd:
          return 'flex-end';
        case JustifyContent.FlexStart:
          return 'flex-start';
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
        case org.nativescript.mason.masonkit.JustifyContent.FlexEnd:
          return 'flex-end';
        case org.nativescript.mason.masonkit.JustifyContent.FlexStart:
          return 'flex-start';
      }
    }
  }
  return instance.style.justifyContent;
}

function _setLeft(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPositionLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPositionLeft(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPositionLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPositionLeft(0, MasonDimensionCompatType.Undefined);
      }

      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPositionLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPositionLeft(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPositionLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setPositionLeft(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

function _setRight(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPositionRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPositionRight(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPositionRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPositionRight(0, MasonDimensionCompatType.Undefined);
      }

      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPositionRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPositionRight(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPositionRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setPositionRight(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

function _setTop(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPositionTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPositionTop(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPositionTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPositionTop(0, MasonDimensionCompatType.Undefined);
      }

      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPositionTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPositionTop(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPositionTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points, !instance._inBatch);
      } else {
        instance.android.setPositionTop(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

function _setBottom(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  const val = _parseLength(value);
  switch (val.type) {
    case 'auto':
      if (JSIEnabled) {
        global.__Mason_setPositionBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Auto, !instance._inBatch);
      } else {
        instance.android.setPositionBottom(0, MasonDimensionCompatType.Auto);
      }
      break;
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPositionBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPositionBottom(0, MasonDimensionCompatType.Undefined);
      }

      break;
    case 'percent':
      if (JSIEnabled) {
        global.__Mason_setPositionBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Percent, !instance._inBatch);
      } else {
        instance.android.setPositionBottom(val.value, MasonDimensionCompatType.Percent);
      }
      break;
    case 'points':
      if (JSIEnabled) {
        global.__Mason_setPositionBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, val.value, MasonDimensionCompatType.Points), !instance._inBatch;
      } else {
        instance.android.setPositionBottom(val.value, MasonDimensionCompatType.Points);
      }
      break;
  }
}

function _setMarginLeft(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMarginLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMarginLeft(0, MasonDimensionCompatType.Undefined);
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

function _setMarginRight(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMarginRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMarginRight(0, MasonDimensionCompatType.Undefined);
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

function _setMarginTop(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMarginTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMarginTop(0, MasonDimensionCompatType.Undefined);
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

function _setMarginBottom(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setMarginBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setMarginBottom(0, MasonDimensionCompatType.Undefined);
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

function _setPaddingLeft(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPaddingLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPaddingLeft(0, MasonDimensionCompatType.Undefined);
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

function _setPaddingRight(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPaddingRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPaddingRight(0, MasonDimensionCompatType.Undefined);
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

function _setPaddingTop(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPaddingTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPaddingTop(0, MasonDimensionCompatType.Undefined);
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

function _setPaddingBottom(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setPaddingBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setPaddingBottom(0, MasonDimensionCompatType.Undefined);
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

function _setBorderLeft(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setBorderLeft(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setBorderLeft(0, MasonDimensionCompatType.Undefined);
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

function _setBorderRight(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setBorderRight(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setBorderRight(0, MasonDimensionCompatType.Undefined);
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

function _setBorderTop(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setBorderTop(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined);
      } else {
        instance.android.setBorderTop(0, MasonDimensionCompatType.Undefined);
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

function _setBorderBottom(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setBorderBottom(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setBorderBottom(0, MasonDimensionCompatType.Undefined);
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

function _setFlexBasis(value, instance: TSCView, initial = false) {
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
    case 'undefined':
      if (JSIEnabled) {
        global.__Mason_setFlexBasis(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, 0, MasonDimensionCompatType.Undefined, !instance._inBatch);
      } else {
        instance.android.setFlexBasis(0, MasonDimensionCompatType.Undefined);
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

function _getFlexBasis(instance: TSCView) {
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

function _setGap(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const width = _parseLength(value.width);
  const height = _parseLength(value.height);

  if (JSIEnabled) {
    global.__Mason_setGap(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, width.value, width.native_type, height.value, height.native_type, !instance._inBatch);
  } else {
    instance.android.setFlexGap(width.value, width.native_type, height.value, height.native_type);
  }
}

function _getGap(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.gap;
  }
  if (JSIEnabled) {
    return global.__Mason_getGap(this._masonStylePtr);
  } else {
    const gap = instance.android.getFlexGap();
    const width = _parseDimension(gap.getWidth());
    const height = _parseDimension(gap.getHeight());
    return { width, height };
    //  return JSON.parse(this.android.getSizeJsonValue())?.width;
  }
}

function _setFlexGrow(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setFlexGrow(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    instance.android.setFlexGrow(value);
  }
}

function _getFlexGrow(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.flexGrow;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexGrow(this._masonStylePtr);
  } else {
    return instance.android.getFlexGrow();
  }
}

function _setFlexShrink(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setFlexShrink(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    instance.android.setFlexShrink(value);
  }
}

function _getFlexShrink(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.flexShrink;
  }
  if (JSIEnabled) {
    return global.__Mason_getFlexShrink(this._masonStylePtr);
  } else {
    return instance.android.getFlexShrink();
  }
}

function _setAspectRatio(value, instance: TSCView, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }
  if (JSIEnabled) {
    global.__Mason_setAspectRatio(instance._masonPtr, instance._masonNodePtr, instance._masonStylePtr, value, !instance._inBatch);
  } else {
    instance.android.setAspectRatio(value);
  }
}

function _getAspectRatio(instance: TSCView) {
  if (!instance._hasNativeView) {
    return instance.style.aspectRatio;
  }
  if (JSIEnabled) {
    return global.__Mason_getAspectRatio(this._masonStylePtr);
  } else {
    return instance.android.getAspectRatio();
  }
}

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
  _inBatch = true; // todo

  createNativeView() {
    const view = new org.nativescript.mason.masonkit.View(this._context) as any;
    this._hasNativeView = true;
    return view;
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
          return 'flex';
        case 1:
          return 'none';
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
    this.style.display = value;
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
      const value = global.__Mason_getPositionType(this._masonStylePtr);
      switch (value) {
        case 0:
          return 'relative';
        case 1:
          return 'absolute';
      }
    } else {
      switch (this.android.getPositionType()) {
        case org.nativescript.mason.masonkit.PositionType.Absolute:
          return 'absolute';
        case org.nativescript.mason.masonkit.PositionType.Relative:
          return 'relative';
      }
    }
  }

  [positionProperty.setNative](value) {
    _setPositionType(value, this);
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
    this.style.alignItems = value;
    _setAlignItems(value, this);
  }

  //@ts-ignore
  get alignItems() {
    return _getAlignItems(this);
  }

  //@ts-ignore
  set alignSelf(value) {
    this.style.alignSelf = value;
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

  [gapProperty.getDefault]() {
    return 'auto';
  }

  [gapProperty.setNative](value) {
    _setGap(value, this);
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

  [alignSelfProperty.setNative](value) {
    _setAlignSelf(value, this);
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
}
