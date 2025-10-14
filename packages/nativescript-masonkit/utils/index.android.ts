// declare const __non_webpack_require__;

import { CoreTypes, Length, returnKeyTypeProperty, Utils } from '@nativescript/core';
import { style_, ViewBase } from '../common';

type View = ViewBase & {
  _hasNativeView: boolean;
  _masonPtr: bigint;
  _masonNodePtr: bigint;
  _inBatch: boolean;
  ios: MasonUIView;
  android: org.nativescript.mason.masonkit.View & android.view.View & org.nativescript.mason.masonkit.MasonView;
  [style_]: Style;
  readonly _styleHelper: Style;
};

import { parseUnit } from '@nativescript/core/css/parser';
import type { Style } from '../style';
import { Tree } from '../tree';

const enum Overflow {
  Visible = 0,

  Hidden = 1,

  Scroll = 2,

  Clip = 3,

  Auto = 4,
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

export function parseLength(length: CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | CoreTypes.LengthPercentUnit, parent = 0) {
  switch (length.unit) {
    case '%':
      return length.value * parent;
    case 'dip':
      return Utils.layout.toDevicePixels(length.value);
    case 'px':
      return length.value;
  }
}

let sharedMason = null;
function getMasonInstance(instance: View): org.nativescript.mason.masonkit.Node {
  const nativeView = instance?.android;
  if (instance._isMasonView) {
    return nativeView.getNode();
  }
  if (!sharedMason) {
    sharedMason = org.nativescript.mason.masonkit.Mason.getShared();
  }
  return sharedMason.nodeForView(nativeView as never);
}

function getStyleInstance(instance: View): org.nativescript.mason.masonkit.Style {
  const nativeView = instance?.android;
  if (instance._isMasonView) {
    return nativeView.getStyle();
  }
  if (!sharedMason) {
    sharedMason = org.nativescript.mason.masonkit.Mason.getShared();
  }

  return sharedMason.nodeForView(nativeView as never).getStyle();
}

export function _forceStyleUpdate(instance: View) {
  if (!instance._hasNativeView) {
    return;
  }

  if (instance._isMasonView) {
  }

  //   const nodeOrView = getMasonInstance(instance) as org.nativescript.mason.masonkit.TextView;
  //   nodeOrView.getStyle().updateNodeAndStyle();
}

export function _markDirty(instance: View) {
  if (!instance._hasNativeView) {
    return;
  }

  const nodeOrView = getMasonInstance(instance);
  nodeOrView.dirty();
}

export function _isDirty(instance: View) {
  if (!instance._hasNativeView) {
    return;
  }
  const nodeOrView = getMasonInstance(instance);
  return nodeOrView.isDirty();
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
  // noop
}

export function _parseGridLine(value): { value: number; type: number } {
  let parsedValue = undefined;
  let parsedType = undefined;

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

  return { value: Number.isNaN(parsedValue) ? undefined : parsedValue, type: parsedType };
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
  Fraction = 5,
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
        max_type: MaxSizingType.Fraction,
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

export interface GridTemplates {
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
            {
              const number = parseInt(repetition);

              repeating_type = TSCGridTrackRepetition.Count;

              isValid = !Number.isNaN(number);
              if (isValid) {
                repeat_count = number;
              }
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

  instance.android.setGridTemplateRows(array);

  // org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateRows(instance.android, array);
}

export function _setGridTemplateColumns(value: Array<GridTemplates>, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

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

  org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateColumns(instance.android, array);
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

export function _setGridAutoRows(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const values = _parseGridAutoRowsColumns(value);

  const array = Array.create('org.nativescript.mason.masonkit.MinMax', values.length);
  const length = array.length;
  for (let i = 0; i < length; i++) {
    const item = value[i];

    const minMax = org.nativescript.mason.masonkit.MinMax.fromTypeValue(item.min_type, item.min_value, item.max_type, item.max_value);

    array[i] = minMax;
  }

  if (instance.android?.setGridAutoRows) {
    instance.android.setGridAutoRows(array);
  } else {
    const style = org.nativescript.mason.masonkit.Mason.getShared().styleForView(instance.android as never);

    if (style) {
      style.setGridAutoRows(array);
    }
  }
}

export function _setGridAutoColumns(value, instance: View, initial = false) {
  if (!instance._hasNativeView) {
    return;
  }

  const values = _parseGridAutoRowsColumns(value);

  const array = Array.create('org.nativescript.mason.masonkit.MinMax', values.length);
  const length = value.length;
  for (let i = 0; i < length; i++) {
    const item = value[i];

    const minMax = org.nativescript.mason.masonkit.MinMax.fromTypeValue(item.min_type, item.min_value, item.max_type, item.max_value);

    array[i] = minMax;
  }

  if (instance.android?.setGridAutoColumns) {
    instance.android.setGridAutoColumns(array);
  } else {
    const node = org.nativescript.mason.masonkit.Mason.getShared().nodeForView(instance.android as never);

    if (node) {
      node.getStyle().setGridAutoColumns(array);
    }
  }
}

export function _getGridTemplateRows(instance: View) {
  if (!instance._hasNativeView) {
    return '';
  }
  if (__ANDROID__) {
    return org.nativescript.mason.masonkit.StyleHelpers.gridTemplateRowsCSS(Tree.instance.native as never, instance.android);
  }

  const style = org.nativescript.mason.masonkit.Mason.getShared().styleForView(instance.android as never);

  if (style) {
    return style.getGridTemplateRows();
  }

  return [];
}

export function _getGridTemplateColumns(instance: View) {
  if (!instance._hasNativeView) {
    return [];
  }

  const style = org.nativescript.mason.masonkit.Mason.getShared().styleForView(instance.android as never);

  if (style) {
    return style.getGridTemplateColumns();
  }

  return [];
}
