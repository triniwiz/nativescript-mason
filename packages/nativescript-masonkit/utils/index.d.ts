import { style_, ViewBase } from '../common';

type View = ViewBase & {
  _hasNativeView: boolean;
  _masonPtr: bigint;
  _masonNodePtr: bigint;
  _inBatch: boolean;
  ios: MasonUIView;
  android: org.nativescript.mason.masonkit.View & android.view.View;
  [style_]: Style;
  readonly _styleHelper: Style;
};

import { parseUnit } from '@nativescript/core/css/parser';
import type { Style } from '../style';
import { Length, LengthAuto } from '..';

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

export function _forceStyleUpdate(instance: View);

export function _markDirty(instance: View);

export function _isDirty(instance: View): boolean;

export function _intoType(type: 'auto' | 'points' | 'percent'): MasonDimensionCompatType;

export function parseLength(length: CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | CoreTypes.LengthPercentUnit, parent = 0): Length;

export function _parseDimension(dim: org.nativescript.mason.masonkit.Dimension | MasonDimensionCompat): LengthAuto;

export function _parseLengthPercentage(dim: org.nativescript.mason.masonkit.LengthPercentage | MasonLengthPercentageCompat): Length;

export function _parseLengthPercentageAuto(dim: org.nativescript.mason.masonkit.LengthPercentageAuto | MasonLengthPercentageAutoCompat): LengthAuto;

export function _toMasonDimension(value): { value: number; type: 'auto' | 'points' | 'percent'; native_type: MasonDimensionCompatType };

export function _intoMasonDimension(value): org.nativescript.mason.masonkit.Dimension;

export function _toLengthPercentageAuto(value): { value: number; type: 'auto' | 'points' | 'percent'; native_type: MasonLengthPercentageAutoCompatType };

export function _toLengthPercentage(value): { value: number; type: 'points' | 'percent'; native_type: MasonLengthPercentageCompatType };

function syncStyle(instance: View) {
  // noop
}

export function _parseGridLine(value): { value: number; type: any; native_value?: any };

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

export function _parseMinMaxValue(value: string): MinMaxType;

export interface GridTemplates {
  is_repeating: boolean;
  repeating_type: TSCGridTrackRepetition;
  repeating_count: number;
  value: MinMaxType | Array<MinMaxType>;
}

const grid_templates_regex = /[^\s()]+(?:\([^\s()]+(?:\([^()]+\))?(?:, *[^\s()]+(?:\([^()]+\))?)*\))?/g;

export function _parseGridTemplates(value: string): Array<GridTemplates>;

export function _setGridTemplateRows(value: Array<GridTemplates>, instance: View, initial = false);

export function _setGridTemplateColumns(value: Array<GridTemplates>, instance: View, initial = false);

export function _getGridTemplateRows(instance: View);

export function _getGridTemplateColumns(instance: View);

export function _parseGridAutoRowsColumns(value: string): Array<MinMaxType>;

export function _setGridAutoRows(value, instance: View, initial = false);

export function _getGridAutoRows(value, instance: View, initial = false);

export function _setGridAutoColumns(value, instance: View, initial = false);
