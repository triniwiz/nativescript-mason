export enum Overflow {
  Visible = 0,
  Hidden = 1,
  Scroll = 2,
}

export enum Display {
  None = 0,
  Flex = 1,
  Grid = 2,
  Block = 3,
}

export enum GridAutoFlow {
  Row = 0,
  Column = 1,
  RowDense = 2,
  ColumnDense = 3,
}

export enum FlexWrap {
  NoWrap = 0,
  Wrap = 1,
  WrapReverse = 2,
  Balance = 3,
  BalanceReverse = 4,
}

export enum FlexDirection {
  Row = 0,
  Column = 1,
  RowReverse = 2,
  ColumnReverse = 3,
}

export enum MasonDimensionCompatType {
  Auto = 0,
  Points = 1,
  Percent = 2,
  MinContent = 3,
  MaxContent = 4,
  FitContent = 5,
  FitContentPoints = 6,
  FitContentPercent = 7,
  Stretch = 8,
  Content = 9,
}

export enum PositionType {
  Relative = 0,
  Absolute = 1,
}

export enum AlignContent {
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

export enum AlignItems {
  Normal = -1,
  Start = 0,
  End = 1,
  Center = 2,
  Baseline = 3,
  Stretch = 4,
  FlexStart = 5,
  FlexEnd = 6,
}

export enum AlignSelf {
  Normal = -1,
  Start = 0,
  End = 1,
  Center = 2,
  Baseline = 3,
  Stretch = 4,
  FlexStart = 5,
  FlexEnd = 6,
}

export enum JustifyContent {
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

export enum JustifyItems {
  Normal = -1,
  Start = 0,
  End = 1,
  Center = 2,
  Baseline = 3,
  Stretch = 4,
  FlexStart = 5,
  FlexEnd = 6,
}

export enum JustifySelf {
  Normal = -1,
  Start = 0,
  End = 1,
  Center = 2,
  Baseline = 3,
  Stretch = 4,
  FlexStart = 5,
  FlexEnd = 6,
}

export enum Float {
  None = 0,
  Left = 1,
  Right = 2,
}

export enum Clear {
  None = 0,
  Left = 1,
  Right = 2,
  Both = 3,
}

export function _forceStyleUpdate(_instance?: unknown): void {}

export function _markDirty(_instance?: unknown): void {}

export function _isDirty(_instance?: unknown): boolean {
  return false;
}

export function parseLength(length: any, _parent = 0): any {
  return length;
}

export function _parseGridLine(_value?: any): { value: number; type: number } {
  return { value: 0, type: 0 };
}

export function _parseGridTemplates(_value?: string): Array<any> {
  return [];
}

export function _setGridTemplateRows(_value?: any, _instance?: any, _initial = false): void {}

export function _setGridTemplateColumns(_value?: any, _instance?: any, _initial = false): void {}

export function _getGridTemplateRows(_instance?: any): string {
  return '';
}

export function _getGridTemplateColumns(_instance?: any): string {
  return '';
}

export function _parseGridAutoRowsColumns(_value?: string): Array<any> {
  return [];
}

export function _setGridAutoRows(_value?: any, _instance?: any, _initial = false): void {}

export function _setGridAutoColumns(_value?: any, _instance?: any, _initial = false): void {}
