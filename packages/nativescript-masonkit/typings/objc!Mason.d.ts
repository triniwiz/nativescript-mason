declare const enum AlignContent {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Stretch = 3,

  SpaceBetween = 4,

  SpaceAround = 5,

  SpaceEvenly = 6,
}

declare const enum AlignItems {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

declare const enum AlignSelf {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

declare const enum AvailableSpace_Tag {
  Definite = 0,

  MinContent = 1,

  MaxContent = 2,
}

interface CMasonDimension {
  value: number;
  value_type: CMasonDimensionType;
}
declare var CMasonDimension: interop.StructType<CMasonDimension>;

declare const enum CMasonDimensionType {
  MasonDimensionPoints = 0,

  MasonDimensionPercent = 1,

  MasonDimensionAuto = 2,
}

interface CMasonGridPlacement {
  value: number;
  value_type: CMasonGridPlacementType;
}
declare var CMasonGridPlacement: interop.StructType<CMasonGridPlacement>;

declare const enum CMasonGridPlacementType {
  MasonGridPlacementTypeAuto = 0,

  MasonGridPlacementTypeLine = 1,

  MasonGridPlacementTypeSpan = 2,
}

interface CMasonLengthPercentage {
  value: number;
  value_type: CMasonLengthPercentageType;
}
declare var CMasonLengthPercentage: interop.StructType<CMasonLengthPercentage>;

interface CMasonLengthPercentageAuto {
  value: number;
  value_type: CMasonLengthPercentageAutoType;
}
declare var CMasonLengthPercentageAuto: interop.StructType<CMasonLengthPercentageAuto>;

declare const enum CMasonLengthPercentageAutoType {
  MasonLengthPercentageAutoPoints = 0,

  MasonLengthPercentageAutoPercent = 1,

  MasonLengthPercentageAutoAuto = 2,
}

interface CMasonLengthPercentageSize {
  width: CMasonLengthPercentage;
  height: CMasonLengthPercentage;
}
declare var CMasonLengthPercentageSize: interop.StructType<CMasonLengthPercentageSize>;

declare const enum CMasonLengthPercentageType {
  MasonLengthPercentagePoints = 0,

  MasonLengthPercentagePercent = 1,
}

interface CMasonMinMax {
  min_type: number;
  min_value: number;
  max_type: number;
  max_value: number;
}
declare var CMasonMinMax: interop.StructType<CMasonMinMax>;

interface CMasonNonRepeatedTrackSizingFunctionArray {
  array: interop.Pointer | interop.Reference<CMasonMinMax>;
  length: number;
}
declare var CMasonNonRepeatedTrackSizingFunctionArray: interop.StructType<CMasonNonRepeatedTrackSizingFunctionArray>;

declare const enum CMasonTrackSizingFunction_Tag {
  Single = 0,

  Repeat = 1,
}

declare const enum Direction {
  Inherit = 0,

  LTR = 1,

  RTL = 2,
}

declare const enum Display {
  None = 0,

  Flex = 1,

  Grid = 2,
}

declare const enum FlexDirection {
  Row = 0,

  Column = 1,

  RowReverse = 2,

  ColumnReverse = 3,
}

declare const enum FlexGridAutoFlowWrap {
  Row = 0,

  Column = 1,

  RowDense = 2,

  ColumnDense = 3,
}

declare const enum FlexWrap {
  NoWrap = 0,

  Wrap = 1,

  WrapReverse = 2,
}

declare class GridPlacementCompat extends NSObject {
  static alloc(): GridPlacementCompat; // inherited from NSObject

  static new(): GridPlacementCompat; // inherited from NSObject

  readonly cssValue: string;

  readonly jsonValue: string;

  readonly type: GridPlacementCompatType;

  readonly value: number;

  static readonly Auto: GridPlacementCompat;

  constructor(o: { line: number });

  constructor(o: { span: number });

  initWithLine(line: number): this;

  initWithSpan(span: number): this;
}

declare const enum GridPlacementCompatType {
  Auto = 0,

  Line = 1,

  Span = 2,
}

declare const enum GridTrackRepetition {
  AutoFill = 0,

  AutoFit = 1,
}

declare const enum JustifyContent {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Stretch = 3,

  SpaceBetween = 4,

  SpaceAround = 5,

  SpaceEvenly = 6,
}

declare const enum JustifyItems {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

declare const enum JustifySelf {
  Normal = -1,

  Start = 0,

  End = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

declare class LineGridPlacementCompat extends NSObject {
  static alloc(): LineGridPlacementCompat; // inherited from NSObject

  static new(): LineGridPlacementCompat; // inherited from NSObject

  readonly end: GridPlacementCompat;

  readonly start: GridPlacementCompat;
}

declare class MasonDimensionCompat extends NSObject {
  static alloc(): MasonDimensionCompat; // inherited from NSObject

  static new(): MasonDimensionCompat; // inherited from NSObject

  readonly cssValue: string;

  readonly jsonValue: string;

  readonly type: MasonDimensionCompatType;

  readonly value: number;

  static readonly Auto: MasonDimensionCompat;

  static readonly Zero: MasonDimensionCompat;

  constructor(o: { percent: number });

  constructor(o: { points: number });

  initWithPercent(percent: number): this;

  initWithPoints(points: number): this;
}

declare const enum MasonDimensionCompatType {
  Auto = 0,

  Points = 1,

  Percent = 2,
}

declare class MasonDimensionRectCompat extends NSObject {
  static alloc(): MasonDimensionRectCompat; // inherited from NSObject

  static new(): MasonDimensionRectCompat; // inherited from NSObject

  bottom: MasonDimensionCompat;

  left: MasonDimensionCompat;

  right: MasonDimensionCompat;

  top: MasonDimensionCompat;

  constructor();

  init(left: MasonDimensionCompat, right: MasonDimensionCompat, top: MasonDimensionCompat, bottom: MasonDimensionCompat): this;
}

declare class MasonDimensionSizeCompat extends NSObject {
  static alloc(): MasonDimensionSizeCompat; // inherited from NSObject

  static new(): MasonDimensionSizeCompat; // inherited from NSObject

  height: MasonDimensionCompat;

  width: MasonDimensionCompat;
}

declare class MasonLayout extends NSObject {
  static alloc(): MasonLayout; // inherited from NSObject

  static new(): MasonLayout; // inherited from NSObject

  readonly children: NSArray<MasonLayout>;

  readonly height: number;

  readonly order: number;

  readonly width: number;

  readonly x: number;

  readonly y: number;
}

declare class MasonLengthPercentageAutoCompat extends NSObject {
  static alloc(): MasonLengthPercentageAutoCompat; // inherited from NSObject

  static new(): MasonLengthPercentageAutoCompat; // inherited from NSObject

  readonly cssValue: string;

  readonly jsonValue: string;

  readonly type: MasonLengthPercentageAutoCompatType;

  readonly value: number;

  static readonly Auto: MasonLengthPercentageAutoCompat;

  static readonly Zero: MasonLengthPercentageAutoCompat;

  constructor(o: { percent: number });

  constructor(o: { points: number });

  initWithPercent(percent: number): this;

  initWithPoints(points: number): this;
}

declare const enum MasonLengthPercentageAutoCompatType {
  Auto = 0,

  Points = 1,

  Percent = 2,
}

declare class MasonLengthPercentageAutoRectCompat extends NSObject {
  static alloc(): MasonLengthPercentageAutoRectCompat; // inherited from NSObject

  static new(): MasonLengthPercentageAutoRectCompat; // inherited from NSObject

  bottom: MasonLengthPercentageAutoCompat;

  left: MasonLengthPercentageAutoCompat;

  right: MasonLengthPercentageAutoCompat;

  top: MasonLengthPercentageAutoCompat;

  constructor();

  init(left: MasonLengthPercentageAutoCompat, right: MasonLengthPercentageAutoCompat, top: MasonLengthPercentageAutoCompat, bottom: MasonLengthPercentageAutoCompat): this;
}

declare class MasonLengthPercentageAutoSizeCompat extends NSObject {
  static alloc(): MasonLengthPercentageAutoSizeCompat; // inherited from NSObject

  static new(): MasonLengthPercentageAutoSizeCompat; // inherited from NSObject

  height: MasonLengthPercentageAutoCompat;

  width: MasonLengthPercentageAutoCompat;
}

declare class MasonLengthPercentageCompat extends NSObject {
  static alloc(): MasonLengthPercentageCompat; // inherited from NSObject

  static new(): MasonLengthPercentageCompat; // inherited from NSObject

  readonly cssValue: string;

  readonly jsonValue: string;

  readonly type: MasonLengthPercentageCompatType;

  readonly value: number;

  static readonly Zero: MasonLengthPercentageCompat;

  constructor(o: { percent: number });

  constructor(o: { points: number });

  initWithPercent(percent: number): this;

  initWithPoints(points: number): this;
}

declare const enum MasonLengthPercentageCompatType {
  Points = 0,

  Percent = 1,
}

declare class MasonLengthPercentageRectCompat extends NSObject {
  static alloc(): MasonLengthPercentageRectCompat; // inherited from NSObject

  static new(): MasonLengthPercentageRectCompat; // inherited from NSObject

  bottom: MasonLengthPercentageCompat;

  left: MasonLengthPercentageCompat;

  right: MasonLengthPercentageCompat;

  top: MasonLengthPercentageCompat;

  constructor();

  init(left: MasonLengthPercentageCompat, right: MasonLengthPercentageCompat, top: MasonLengthPercentageCompat, bottom: MasonLengthPercentageCompat): this;
}

declare class MasonLengthPercentageSizeCompat extends NSObject {
  static alloc(): MasonLengthPercentageSizeCompat; // inherited from NSObject

  static new(): MasonLengthPercentageSizeCompat; // inherited from NSObject

  height: MasonLengthPercentageCompat;

  width: MasonLengthPercentageCompat;
}

declare class MasonNode extends NSObject {
  static alloc(): MasonNode; // inherited from NSObject

  static new(): MasonNode; // inherited from NSObject

  readonly children: NSArray<MasonNode>;

  data: any;

  readonly isDirty: boolean;

  isEnabled: boolean;

  readonly isLeaf: boolean;

  readonly nativePtr: interop.Pointer | interop.Reference<any>;

  readonly owner: MasonNode;

  style: MasonStyle;

  constructor(o: { style: MasonStyle });

  constructor(o: { style: MasonStyle; children: NSArray<MasonNode> | MasonNode[] });

  addChildren(children: NSArray<MasonNode> | MasonNode[]): void;

  compute(): void;

  computeMaxContent(): void;

  computeMinContent(): void;

  computeWithMaxContent(): void;

  computeWithViewSize(): void;

  configure(block: (p1: MasonNode) => void): void;

  initWithStyle(style: MasonStyle): this;

  initWithStyleChildren(style: MasonStyle, children: NSArray<MasonNode> | MasonNode[]): this;

  layout(): MasonLayout;

  markDirty(): void;

  setChildrenWithChildren(children: NSArray<MasonNode> | MasonNode[]): void;

  updateNodeStyle(): void;
}

declare class MasonReexports extends NSObject {
  static alloc(): MasonReexports; // inherited from NSObject

  static destroyWithNonRepeatedTrackSizingFunctionArray(nonRepeatedTrackSizingFunctionArray: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

  static new(): MasonReexports; // inherited from NSObject

  static node_compute(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

  static node_compute_max_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

  static node_compute_min_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

  static node_compute_whWidthHeight(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, width: number, height: number): void;

  static node_dirty(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): boolean;

  static node_mark_dirty(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

  static node_set_style(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>): void;

  static style_get_align_content(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_align_items(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_align_self(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_aspect_ratio(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_border_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_border_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_border_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_border_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_column_gap(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_direction(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_display(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_flex_basis(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_get_flex_direction(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_flex_grow(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_flex_shrink(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_flex_wrap(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_gap(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageSize;

  static style_get_grid_auto_columns(style: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;

  static style_get_grid_auto_flow(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_grid_auto_rows(style: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;

  static style_get_grid_column_end(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

  static style_get_grid_column_start(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

  static style_get_grid_row_end(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

  static style_get_grid_row_start(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

  static style_get_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_get_inset_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_inset_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_inset_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_inset_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_justify_content(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_justify_items(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_justify_self(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_margin_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_margin_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_margin_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_margin_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

  static style_get_max_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_get_max_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_get_min_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_get_min_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_get_overflow(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_padding_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_padding_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_padding_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_padding_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_position(style: interop.Pointer | interop.Reference<any>): number;

  static style_get_row_gap(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

  static style_get_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_set_align_content(style: interop.Pointer | interop.Reference<any>, align_content: number): void;

  static style_set_align_items(style: interop.Pointer | interop.Reference<any>, align_items: number): void;

  static style_set_align_self(style: interop.Pointer | interop.Reference<any>, align_self: number): void;

  static style_set_aspect_ratio(style: interop.Pointer | interop.Reference<any>, value: number): void;

  static style_set_border(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_border_bottom(style: interop.Pointer | interop.Reference<any>, value: number): void;

  static style_set_border_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_border_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_border_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_column_gap(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_direction(style: interop.Pointer | interop.Reference<any>, direction: number): void;

  static style_set_display(style: interop.Pointer | interop.Reference<any>, display: number): void;

  static style_set_flex_basis(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

  static style_set_flex_direction(style: interop.Pointer | interop.Reference<any>, flex_direction: number): void;

  static style_set_flex_grow(style: interop.Pointer | interop.Reference<any>, value: number): void;

  static style_set_flex_shrink(style: interop.Pointer | interop.Reference<any>, value: number): void;

  static style_set_flex_wrap(style: interop.Pointer | interop.Reference<any>, flex_wrap: number): void;

  static style_set_gap(style: interop.Pointer | interop.Reference<any>, width_value: number, width_type: CMasonLengthPercentageType, height_value: number, height_type: CMasonLengthPercentageType): void;

  static style_set_grid_area(style: interop.Pointer | interop.Reference<any>, row_start: CMasonGridPlacement, row_end: CMasonGridPlacement, column_start: CMasonGridPlacement, column_end: CMasonGridPlacement): void;

  static style_set_grid_auto_columns(style: interop.Pointer | interop.Reference<any>, value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

  static style_set_grid_auto_flow(style: interop.Pointer | interop.Reference<any>, value: number): void;

  static style_set_grid_auto_rows(style: interop.Pointer | interop.Reference<any>, value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

  static style_set_grid_column(style: interop.Pointer | interop.Reference<any>, start: CMasonGridPlacement, end: CMasonGridPlacement): void;

  static style_set_grid_column_end(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

  static style_set_grid_column_start(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

  static style_set_grid_row(style: interop.Pointer | interop.Reference<any>, start: CMasonGridPlacement, end: CMasonGridPlacement): void;

  static style_set_grid_row_end(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

  static style_set_grid_row_start(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

  static style_set_height(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

  static style_set_inset(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_inset_bottom(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_inset_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_inset_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_inset_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_justify_content(style: interop.Pointer | interop.Reference<any>, justify_content: number): void;

  static style_set_justify_items(style: interop.Pointer | interop.Reference<any>, align_items: number): void;

  static style_set_justify_self(style: interop.Pointer | interop.Reference<any>, align_self: number): void;

  static style_set_margin(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_margin_bottom(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_margin_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_margin_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_margin_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

  static style_set_max_height(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

  static style_set_max_width(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

  static style_set_min_height(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

  static style_set_min_width(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

  static style_set_overflow(style: interop.Pointer | interop.Reference<any>, overflow: number): void;

  static style_set_padding(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_padding_bottom(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_padding_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_padding_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_padding_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_position(style: interop.Pointer | interop.Reference<any>, position: number): void;

  static style_set_row_gap(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

  static style_set_width(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

  static util_create_non_repeated_track_sizing_function_with_type_value(track_type: number, track_value_type: number, track_value: number): CMasonMinMax;

  static util_parse_non_repeated_track_sizing_function(value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): string;
}

declare class MasonStyle extends NSObject {
  static alloc(): MasonStyle; // inherited from NSObject

  static new(): MasonStyle; // inherited from NSObject

  alignContent: AlignContent;

  alignItems: AlignItems;

  alignSelf: AlignSelf;

  borderCompat: MasonLengthPercentageRectCompat;

  direction: Direction;

  display: Display;

  flexDirection: FlexDirection;

  flexGrow: number;

  flexShrink: number;

  flexWrap: FlexWrap;

  gapCompat: MasonLengthPercentageSizeCompat;

  gridAutoColumns: NSArray<MinMax>;

  gridAutoFlow: FlexGridAutoFlowWrap;

  gridAutoRows: NSArray<MinMax>;

  gridColumnCompat: LineGridPlacementCompat;

  gridColumnEndCompat: GridPlacementCompat;

  gridColumnStartCompat: GridPlacementCompat;

  gridRowCompat: LineGridPlacementCompat;

  gridRowEndCompat: GridPlacementCompat;

  gridRowStartCompat: GridPlacementCompat;

  gridTemplateColumns: NSArray<TrackSizingFunction>;

  gridTemplateRows: NSArray<TrackSizingFunction>;

  insetCompat: MasonLengthPercentageAutoRectCompat;

  justifyContent: JustifyContent;

  justifyItems: JustifyItems;

  justifySelf: JustifySelf;

  marginCompat: MasonLengthPercentageAutoRectCompat;

  maxSizeCompat: MasonDimensionSizeCompat;

  minSizeCompat: MasonDimensionSizeCompat;

  readonly nativePtr: interop.Pointer | interop.Reference<any>;

  overflow: Overflow;

  paddingCompat: MasonLengthPercentageRectCompat;

  position: Position;

  sizeCompat: MasonDimensionSizeCompat;

  sizeCompatHeight: MasonDimensionCompat;

  sizeCompatWidth: MasonDimensionCompat;

  setBorderBottom(value: number, type: number): void;

  setBorderLeft(value: number, type: number): void;

  setBorderRight(value: number, type: number): void;

  setBorderTop(value: number, type: number): void;

  setBorderWithValueType(value: number, type: number): void;

  setColumnGap(value: number, type: number): void;

  setFlexBasis(value: number, type: number): void;

  setGapColumn(value: number, type: number): void;

  setGapRow(value: number, type: number): void;

  setInsetBottom(value: number, type: number): void;

  setInsetLeft(value: number, type: number): void;

  setInsetRight(value: number, type: number): void;

  setInsetTop(value: number, type: number): void;

  setInsetWithValueType(value: number, type: number): void;

  setMarginBottom(value: number, type: number): void;

  setMarginLeft(value: number, type: number): void;

  setMarginRight(value: number, type: number): void;

  setMarginTop(value: number, type: number): void;

  setMarginWithValueType(value: number, type: number): void;

  setMaxSizeHeight(value: number, type: number): void;

  setMaxSizeWidth(value: number, type: number): void;

  setMaxSizeWidthHeight(value: number, type: number): void;

  setMinSizeHeight(value: number, type: number): void;

  setMinSizeWidth(value: number, type: number): void;

  setMinSizeWidthHeight(value: number, type: number): void;

  setPaddingBottom(value: number, type: number): void;

  setPaddingLeft(value: number, type: number): void;

  setPaddingRight(value: number, type: number): void;

  setPaddingTop(value: number, type: number): void;

  setPaddingWithValueType(value: number, type: number): void;

  setRowGap(value: number, type: number): void;

  setSizeHeight(value: number, type: number): void;

  setSizeWidth(value: number, type: number): void;

  setSizeWidthHeight(value: number, type: number): void;
}

declare var MasonVersionNumber: number;

declare var MasonVersionString: interop.Reference<number>;

declare class MaxSizing extends NSObject {
  static FitContent(fit: number): MaxSizing;

  static FitContentPercent(fit: number): MaxSizing;

  static Flex(flex: number): MaxSizing;

  static Percent(percent: number): MaxSizing;

  static Points(points: number): MaxSizing;

  static alloc(): MaxSizing; // inherited from NSObject

  static new(): MaxSizing; // inherited from NSObject

  readonly cssValue: string;

  readonly jsonValue: string;

  readonly value: number;

  static readonly Auto: MaxSizing;

  static readonly MaxContent: MaxSizing;

  static readonly MinContent: MaxSizing;
}

declare class MeasureOutput extends NSObject {
  static alloc(): MeasureOutput; // inherited from NSObject

  static new(): MeasureOutput; // inherited from NSObject
}

declare class MinMax extends NSObject {
  static FitContentPercentWithFit(fit: number): MinMax;

  static FitContentWithFit(fit: number): MinMax;

  static FlexWithFlex(flex: number): MinMax;

  static PercentWithPercent(percent: number): MinMax;

  static PointsWithPoints(points: number): MinMax;

  static alloc(): MinMax; // inherited from NSObject

  static fromTypeValue(minType: number, minValue: number, maxType: number, maxValue: number): MinMax;

  static new(): MinMax; // inherited from NSObject

  readonly cssValue: string;

  readonly jsonValue: string;

  static readonly Auto: MinMax;

  constructor();

  init(min: MinSizing, max: MaxSizing): this;
}

declare class MinSizing extends NSObject {
  static Percent(percent: number): MinSizing;

  static Points(points: number): MinSizing;

  static alloc(): MinSizing; // inherited from NSObject

  static new(): MinSizing; // inherited from NSObject

  readonly cssValue: string;

  readonly jsonValue: string;

  readonly value: number;

  static readonly Auto: MinSizing;

  static readonly MaxContent: MinSizing;

  static readonly MinContent: MinSizing;
}

interface NodeArray {
  array: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>;
  length: number;
}
declare var NodeArray: interop.StructType<NodeArray>;

declare const enum Overflow {
  Visible = 0,

  Hidden = 1,

  Scroll = 2,
}

declare const enum Position {
  Relative = 0,

  Absolute = 1,
}

interface Repeat_Body {
  _0: number;
  _1: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;
}
declare var Repeat_Body: interop.StructType<Repeat_Body>;

declare class TSCMason extends NSObject {
  static alloc(): TSCMason; // inherited from NSObject

  static new(): TSCMason; // inherited from NSObject

  static setAlwaysEnable(value: boolean): void;

  static setShared(value: boolean): void;

  readonly nativePtr: interop.Pointer | interop.Reference<any>;

  static alwaysEnable: boolean;

  static readonly instance: TSCMason;

  static shared: boolean;

  clear(): void;
}

declare class TrackSizingFunction extends NSObject {
  static AutoRepeat(gridTrackRepetition: GridTrackRepetition, value: NSArray<MinMax> | MinMax[]): TrackSizingFunction;

  static Single(value: MinMax): TrackSizingFunction;

  static alloc(): TrackSizingFunction; // inherited from NSObject

  static new(): TrackSizingFunction; // inherited from NSObject

  readonly isRepeating: boolean;

  readonly value: any;
}

declare function mason_clear(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_destroy(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_destroy_non_repeated_track_sizing_function_array(array: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

declare function mason_init(): interop.Pointer | interop.Reference<any>;

declare function mason_init_with_capacity(capacity: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_add_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_add_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): void;

declare function mason_node_add_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<any>, children_size: number): void;

declare function mason_node_array_destroy(array: NodeArray): void;

declare function mason_node_compute(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_compute_max_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_compute_min_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_compute_wh(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, width: number, height: number): void;

declare function mason_node_destroy(node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_dirty(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): boolean;

declare function mason_node_get_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_get_child_count(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): number;

declare function mason_node_get_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): NodeArray;

declare function mason_node_insert_child_after(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, reference: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_insert_child_before(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, reference: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_is_children_same(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<any>, children_size: number): boolean;

declare function mason_node_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_node_mark_dirty(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_new_node(mason: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_children(mason: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<any>, children_size: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_measure_func(mason: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, measure_data: interop.Pointer | interop.Reference<any>, measure: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any>, p2: number, p3: number, p4: number, p5: number) => number>): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_remove_measure_func(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_replace_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_set_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<any>, children_size: number): void;

declare function mason_node_set_measure_func(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, measure_data: interop.Pointer | interop.Reference<any>, measure: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any>, p2: number, p3: number, p4: number, p5: number) => number>): void;

declare function mason_node_set_style(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_update_and_set_style(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_update_set_style_compute_and_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_node_update_set_style_compute_with_size_and_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, width: number, height: number, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_style_destroy(style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_get_align_content(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_align_items(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_align_self(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_aspect_ratio(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_border_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_border_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_border_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_border_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_column_gap(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_direction(_style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_display(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_basis(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_flex_direction(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_grow(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_shrink(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_wrap(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_gap(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageSize;

declare function mason_style_get_grid_auto_columns(style: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;

declare function mason_style_get_grid_auto_flow(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_grid_auto_rows(style: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;

declare function mason_style_get_grid_column_end(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

declare function mason_style_get_grid_column_start(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

declare function mason_style_get_grid_row_end(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

declare function mason_style_get_grid_row_start(style: interop.Pointer | interop.Reference<any>): CMasonGridPlacement;

declare function mason_style_get_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_inset_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_inset_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_inset_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_inset_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_justify_content(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_justify_items(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_justify_self(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_margin_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_margin_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_margin_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_margin_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentageAuto;

declare function mason_style_get_max_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_max_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_min_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_min_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_overflow(_style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_padding_bottom(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_padding_left(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_padding_right(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_padding_top(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_position(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_row_gap(style: interop.Pointer | interop.Reference<any>): CMasonLengthPercentage;

declare function mason_style_get_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_init(): interop.Pointer | interop.Reference<any>;

declare function mason_style_set_align_content(style: interop.Pointer | interop.Reference<any>, align: number): void;

declare function mason_style_set_align_items(style: interop.Pointer | interop.Reference<any>, align: number): void;

declare function mason_style_set_align_self(style: interop.Pointer | interop.Reference<any>, align: number): void;

declare function mason_style_set_aspect_ratio(style: interop.Pointer | interop.Reference<any>, ratio: number): void;

declare function mason_style_set_border(style: interop.Pointer | interop.Reference<any>, left_value: number, left_value_type: CMasonLengthPercentageType, right_value: number, right_value_type: CMasonLengthPercentageType, top_value: number, top_value_type: CMasonLengthPercentageType, bottom_value: number, bottom_value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_border_bottom(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_border_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_border_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_border_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_column_gap(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_direction(_style: interop.Pointer | interop.Reference<any>, _direction: number): void;

declare function mason_style_set_display(style: interop.Pointer | interop.Reference<any>, display: number): void;

declare function mason_style_set_flex_basis(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

declare function mason_style_set_flex_direction(style: interop.Pointer | interop.Reference<any>, direction: number): void;

declare function mason_style_set_flex_grow(style: interop.Pointer | interop.Reference<any>, grow: number): void;

declare function mason_style_set_flex_shrink(style: interop.Pointer | interop.Reference<any>, shrink: number): void;

declare function mason_style_set_flex_wrap(style: interop.Pointer | interop.Reference<any>, wrap: number): void;

declare function mason_style_set_gap(style: interop.Pointer | interop.Reference<any>, width_value: number, width_type: CMasonLengthPercentageType, height_value: number, height_type: CMasonLengthPercentageType): void;

declare function mason_style_set_grid_area(style: interop.Pointer | interop.Reference<any>, row_start: CMasonGridPlacement, row_end: CMasonGridPlacement, column_start: CMasonGridPlacement, column_end: CMasonGridPlacement): void;

declare function mason_style_set_grid_auto_columns(style: interop.Pointer | interop.Reference<any>, value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

declare function mason_style_set_grid_auto_flow(style: interop.Pointer | interop.Reference<any>, value: number): void;

declare function mason_style_set_grid_auto_rows(style: interop.Pointer | interop.Reference<any>, value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

declare function mason_style_set_grid_column(style: interop.Pointer | interop.Reference<any>, start: CMasonGridPlacement, end: CMasonGridPlacement): void;

declare function mason_style_set_grid_column_end(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

declare function mason_style_set_grid_column_start(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

declare function mason_style_set_grid_row(style: interop.Pointer | interop.Reference<any>, start: CMasonGridPlacement, end: CMasonGridPlacement): void;

declare function mason_style_set_grid_row_end(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

declare function mason_style_set_grid_row_start(style: interop.Pointer | interop.Reference<any>, value: CMasonGridPlacement): void;

declare function mason_style_set_height(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

declare function mason_style_set_inset(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_inset_bottom(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_inset_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_inset_lrtb(style: interop.Pointer | interop.Reference<any>, left_value: number, left_value_type: CMasonLengthPercentageAutoType, right_value: number, right_value_type: CMasonLengthPercentageAutoType, top_value: number, top_value_type: CMasonLengthPercentageAutoType, bottom_value: number, bottom_value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_inset_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_inset_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_justify_content(style: interop.Pointer | interop.Reference<any>, justify: number): void;

declare function mason_style_set_justify_items(style: interop.Pointer | interop.Reference<any>, align: number): void;

declare function mason_style_set_justify_self(style: interop.Pointer | interop.Reference<any>, align: number): void;

declare function mason_style_set_margin(style: interop.Pointer | interop.Reference<any>, left_value: number, left_value_type: CMasonLengthPercentageAutoType, right_value: number, right_value_type: CMasonLengthPercentageAutoType, top_value: number, top_value_type: CMasonLengthPercentageAutoType, bottom_value: number, bottom_value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_margin_bottom(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_margin_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_margin_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_margin_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageAutoType): void;

declare function mason_style_set_max_height(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

declare function mason_style_set_max_width(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

declare function mason_style_set_min_height(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

declare function mason_style_set_min_width(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

declare function mason_style_set_overflow(_style: interop.Pointer | interop.Reference<any>, _overflow: number): void;

declare function mason_style_set_padding(style: interop.Pointer | interop.Reference<any>, left_value: number, left_value_type: CMasonLengthPercentageType, right_value: number, right_value_type: CMasonLengthPercentageType, top_value: number, top_value_type: CMasonLengthPercentageType, bottom_value: number, bottom_value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_padding_bottom(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_padding_left(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_padding_right(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_padding_top(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_position(style: interop.Pointer | interop.Reference<any>, position: number): void;

declare function mason_style_set_row_gap(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonLengthPercentageType): void;

declare function mason_style_set_width(style: interop.Pointer | interop.Reference<any>, value: number, value_type: CMasonDimensionType): void;

declare function mason_util_create_non_repeated_track_sizing_function_with_type_value(track_type: number, track_value_type: number, track_value: number): CMasonMinMax;

declare function mason_util_destroy_string(string: string | interop.Pointer | interop.Reference<any>): void;

declare function mason_util_parse_non_repeated_track_sizing_function(value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): string;
