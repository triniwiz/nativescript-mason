declare const enum AlignContent {
  FlexStart = 0,

  FlexEnd = 1,

  Center = 2,

  Stretch = 3,

  SpaceBetween = 4,

  SpaceAround = 5,

  SpaceEvenly = 6,
}

declare const enum AlignItems {
  FlexStart = 0,

  FlexEnd = 1,

  Center = 2,

  Baseline = 3,

  Stretch = 4,
}

declare const enum AlignSelf {
  Auto = 0,

  FlexStart = 1,

  FlexEnd = 2,

  Center = 3,

  Baseline = 4,

  Stretch = 5,
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
  Points = 0,

  Percent = 1,

  Auto = 2,

  Undefined = 3,
}

declare const enum Direction {
  Inherit = 0,

  LTR = 1,

  RTL = 2,
}

declare const enum Display {
  Flex = 0,

  None = 1,
}

declare const enum FlexDirection {
  Row = 0,

  Column = 1,

  RowReverse = 2,

  ColumnReverse = 3,
}

declare const enum FlexWrap {
  NoWrap = 0,

  Wrap = 1,

  WrapReverse = 2,
}

declare const enum JustifyContent {
  FlexStart = 0,

  FlexEnd = 1,

  Center = 2,

  SpaceBetween = 3,

  SpaceAround = 4,

  SpaceEvenly = 5,
}

declare class MasonDimensionCompat extends NSObject {
  static alloc(): MasonDimensionCompat; // inherited from NSObject

  static new(): MasonDimensionCompat; // inherited from NSObject

  readonly cssValue: string;

  readonly type: MasonDimensionCompatType;

  readonly value: number;

  static readonly Auto: MasonDimensionCompat;

  static readonly Undefined: MasonDimensionCompat;

  constructor(o: { percent: number });

  constructor(o: { points: number });

  initWithPercent(percent: number): this;

  initWithPoints(points: number): this;
}

declare const enum MasonDimensionCompatType {
  Points = 0,

  Percent = 1,

  Auto = 2,

  Undefined = 3,
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

  computeWithViewSize(): void;

  configure(block: (p1: MasonNode) => void): void;

  initWithStyle(style: MasonStyle): this;

  initWithStyleChildren(style: MasonStyle, children: NSArray<MasonNode> | MasonNode[]): this;

  markDirty(): void;

  setChildrenWithChildren(children: NSArray<MasonNode> | MasonNode[]): void;
}

declare class MasonRectCompat extends NSObject {
  static alloc(): MasonRectCompat; // inherited from NSObject

  static new(): MasonRectCompat; // inherited from NSObject

  bottom: MasonDimensionCompat;

  left: MasonDimensionCompat;

  right: MasonDimensionCompat;

  top: MasonDimensionCompat;

  constructor();

  init(left: MasonDimensionCompat, right: MasonDimensionCompat, top: MasonDimensionCompat, bottom: MasonDimensionCompat): this;
}

declare class MasonReexports extends NSObject {
  static alloc(): MasonReexports; // inherited from NSObject

  static new(): MasonReexports; // inherited from NSObject

  static node_compute(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

  static node_compute_max_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

  static node_compute_min_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

  static node_compute_whWidthHeight(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, width: number, height: number): void;

  static style_get_height(node: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_get_width(node: interop.Pointer | interop.Reference<any>): CMasonDimension;

  static style_update_with_valuesAspectRatio(
    style: interop.Pointer | interop.Reference<any>,
    display: number,
    positionType: number,
    direction: number,
    flexDirection: number,
    flexWrap: number,
    overflow: number,
    alignItems: number,
    alignSelf: number,
    alignContent: number,
    justifyContent: number,
    positionLeftType: number,
    positionLeftValue: number,
    positionRightType: number,
    positionRightValue: number,
    positionTopType: number,
    positionTopValue: number,
    positionBottomType: number,
    positionBottomValue: number,
    marginLeftType: number,
    marginLeftValue: number,
    marginRightType: number,
    marginRightValue: number,
    marginTopType: number,
    marginTopValue: number,
    marginBottomType: number,
    marginBottomValue: number,
    paddingLeftType: number,
    paddingLeftValue: number,
    paddingRightType: number,
    paddingRightValue: number,
    paddingTopType: number,
    paddingTopValue: number,
    paddingBottomType: number,
    paddingBottomValue: number,
    borderLeftType: number,
    borderLeftValue: number,
    borderRightType: number,
    borderRightValue: number,
    borderTopType: number,
    borderTopValue: number,
    borderBottomType: number,
    borderBottomValue: number,
    flexGrow: number,
    flexShrink: number,
    flexBasisType: number,
    flexBasisValue: number,
    widthType: number,
    widthValue: number,
    heightType: number,
    heightValue: number,
    minWidthType: number,
    minWidthValue: number,
    minHeightType: number,
    minHeightValue: number,
    maxWidthType: number,
    maxWidthValue: number,
    maxHeightType: number,
    maxHeightValue: number,
    flexGapWidthType: number,
    flexGapWidthValue: number,
    flexGapHeightType: number,
    flexGapHeightValue: number,
    aspectRatio: number
  ): void;
}

declare class MasonSizeCompat extends NSObject {
  static alloc(): MasonSizeCompat; // inherited from NSObject

  static new(): MasonSizeCompat; // inherited from NSObject

  height: MasonDimensionCompat;

  width: MasonDimensionCompat;
}

declare class MasonStyle extends NSObject {
  static alloc(): MasonStyle; // inherited from NSObject

  static new(): MasonStyle; // inherited from NSObject

  alignContent: AlignContent;

  alignItems: AlignItems;

  alignSelf: AlignSelf;

  borderCompat: MasonRectCompat;

  direction: Direction;

  display: Display;

  flexDirection: FlexDirection;

  flexGapCompat: MasonSizeCompat;

  flexGrow: number;

  flexShrink: number;

  flexWrap: FlexWrap;

  justifyContent: JustifyContent;

  marginCompat: MasonRectCompat;

  maxSizeCompat: MasonSizeCompat;

  minSizeCompat: MasonSizeCompat;

  readonly nativePtr: interop.Pointer | interop.Reference<any>;

  overflow: Overflow;

  paddingCompat: MasonRectCompat;

  positionCompat: MasonRectCompat;

  positionType: PositionType;

  sizeCompat: MasonSizeCompat;

  sizeCompatHeight: MasonDimensionCompat;

  sizeCompatWidth: MasonDimensionCompat;

  setBorderBottom(value: number, type: number): void;

  setBorderLeft(value: number, type: number): void;

  setBorderRight(value: number, type: number): void;

  setBorderTop(value: number, type: number): void;

  setBorderWithValueType(value: number, type: number): void;

  setFlexGapHeight(value: number, type: number): void;

  setFlexGapWidth(value: number, type: number): void;

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

  setPositionBottom(value: number, type: number): void;

  setPositionLeft(value: number, type: number): void;

  setPositionRight(value: number, type: number): void;

  setPositionTop(value: number, type: number): void;

  setPositionWithValueType(value: number, type: number): void;

  setSizeHeight(value: number, type: number): void;

  setSizeWidth(value: number, type: number): void;

  setSizeWidthHeight(value: number, type: number): void;
}

declare var MasonVersionNumber: number;

declare var MasonVersionString: interop.Reference<number>;

declare class MeasureOutput extends NSObject {
  static alloc(): MeasureOutput; // inherited from NSObject

  static new(): MeasureOutput; // inherited from NSObject
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

declare const enum PositionType {
  Relative = 0,

  Absolute = 1,
}

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

declare function mason_clear(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_destroy(mason: interop.Pointer | interop.Reference<any>): void;

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

declare function mason_node_update_and_set_style_with_values(
  mason: interop.Pointer | interop.Reference<any>,
  node: interop.Pointer | interop.Reference<any>,
  style: interop.Pointer | interop.Reference<any>,
  display: number,
  position_type: number,
  direction: number,
  flex_direction: number,
  flex_wrap: number,
  overflow: number,
  align_items: number,
  align_self: number,
  align_content: number,
  justify_content: number,
  position_left_type: number,
  position_left_value: number,
  position_right_type: number,
  position_right_value: number,
  position_top_type: number,
  position_top_value: number,
  position_bottom_type: number,
  position_bottom_value: number,
  margin_left_type: number,
  margin_left_value: number,
  margin_right_type: number,
  margin_right_value: number,
  margin_top_type: number,
  margin_top_value: number,
  margin_bottom_type: number,
  margin_bottom_value: number,
  padding_left_type: number,
  padding_left_value: number,
  padding_right_type: number,
  padding_right_value: number,
  padding_top_type: number,
  padding_top_value: number,
  padding_bottom_type: number,
  padding_bottom_value: number,
  border_left_type: number,
  border_left_value: number,
  border_right_type: number,
  border_right_value: number,
  border_top_type: number,
  border_top_value: number,
  border_bottom_type: number,
  border_bottom_value: number,
  flex_grow: number,
  flex_shrink: number,
  flex_basis_type: number,
  flex_basis_value: number,
  width_type: number,
  width_value: number,
  height_type: number,
  height_value: number,
  min_width_type: number,
  min_width_value: number,
  min_height_type: number,
  min_height_value: number,
  max_width_type: number,
  max_width_value: number,
  max_height_type: number,
  max_height_value: number,
  flex_gap_width_type: number,
  flex_gap_width_value: number,
  flex_gap_height_type: number,
  flex_gap_height_value: number,
  aspect_ratio: number
): void;

declare function mason_node_update_set_style_compute_and_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_node_update_set_style_compute_with_size_and_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, width: number, height: number, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_node_update_style_with_values_compute_and_layout(
  mason: interop.Pointer | interop.Reference<any>,
  node: interop.Pointer | interop.Reference<any>,
  style: interop.Pointer | interop.Reference<any>,
  display: number,
  position_type: number,
  direction: number,
  flex_direction: number,
  flex_wrap: number,
  overflow: number,
  align_items: number,
  align_self: number,
  align_content: number,
  justify_content: number,
  position_left_type: number,
  position_left_value: number,
  position_right_type: number,
  position_right_value: number,
  position_top_type: number,
  position_top_value: number,
  position_bottom_type: number,
  position_bottom_value: number,
  margin_left_type: number,
  margin_left_value: number,
  margin_right_type: number,
  margin_right_value: number,
  margin_top_type: number,
  margin_top_value: number,
  margin_bottom_type: number,
  margin_bottom_value: number,
  padding_left_type: number,
  padding_left_value: number,
  padding_right_type: number,
  padding_right_value: number,
  padding_top_type: number,
  padding_top_value: number,
  padding_bottom_type: number,
  padding_bottom_value: number,
  border_left_type: number,
  border_left_value: number,
  border_right_type: number,
  border_right_value: number,
  border_top_type: number,
  border_top_value: number,
  border_bottom_type: number,
  border_bottom_value: number,
  flex_grow: number,
  flex_shrink: number,
  flex_basis_type: number,
  flex_basis_value: number,
  width_type: number,
  width_value: number,
  height_type: number,
  height_value: number,
  min_width_type: number,
  min_width_value: number,
  min_height_type: number,
  min_height_value: number,
  max_width_type: number,
  max_width_value: number,
  max_height_type: number,
  max_height_value: number,
  flex_gap_width_type: number,
  flex_gap_width_value: number,
  flex_gap_height_type: number,
  flex_gap_height_value: number,
  aspect_ratio: number,
  layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>
): interop.Pointer | interop.Reference<any>;

declare function mason_node_update_style_with_values_size_compute_and_layout(
  mason: interop.Pointer | interop.Reference<any>,
  node: interop.Pointer | interop.Reference<any>,
  style: interop.Pointer | interop.Reference<any>,
  width: number,
  height: number,
  display: number,
  position_type: number,
  direction: number,
  flex_direction: number,
  flex_wrap: number,
  overflow: number,
  align_items: number,
  align_self: number,
  align_content: number,
  justify_content: number,
  position_left_type: number,
  position_left_value: number,
  position_right_type: number,
  position_right_value: number,
  position_top_type: number,
  position_top_value: number,
  position_bottom_type: number,
  position_bottom_value: number,
  margin_left_type: number,
  margin_left_value: number,
  margin_right_type: number,
  margin_right_value: number,
  margin_top_type: number,
  margin_top_value: number,
  margin_bottom_type: number,
  margin_bottom_value: number,
  padding_left_type: number,
  padding_left_value: number,
  padding_right_type: number,
  padding_right_value: number,
  padding_top_type: number,
  padding_top_value: number,
  padding_bottom_type: number,
  padding_bottom_value: number,
  border_left_type: number,
  border_left_value: number,
  border_right_type: number,
  border_right_value: number,
  border_top_type: number,
  border_top_value: number,
  border_bottom_type: number,
  border_bottom_value: number,
  flex_grow: number,
  flex_shrink: number,
  flex_basis_type: number,
  flex_basis_value: number,
  width_type: number,
  width_value: number,
  height_type: number,
  height_value: number,
  min_width_type: number,
  min_width_value: number,
  min_height_type: number,
  min_height_value: number,
  max_width_type: number,
  max_width_value: number,
  max_height_type: number,
  max_height_value: number,
  flex_gap_width_type: number,
  flex_gap_width_value: number,
  flex_gap_height_type: number,
  flex_gap_height_value: number,
  aspect_ratio: number,
  layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>
): interop.Pointer | interop.Reference<any>;

declare function mason_style_destroy(style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_get_align_content(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_align_items(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_align_self(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_aspect_ratio(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_border_bottom(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_border_left(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_border_right(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_border_top(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_direction(_style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_display(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_basis(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_flex_direction(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_grow(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_shrink(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_flex_wrap(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_gap_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_gap_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_justify_content(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_margin_bottom(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_margin_left(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_margin_right(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_margin_top(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_max_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_max_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_min_height(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_min_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_overflow(_style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_padding_bottom(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_padding_left(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_padding_right(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_padding_top(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_position_bottom(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_position_left(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_position_right(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_position_top(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_get_position_type(style: interop.Pointer | interop.Reference<any>): number;

declare function mason_style_get_width(style: interop.Pointer | interop.Reference<any>): CMasonDimension;

declare function mason_style_init(): interop.Pointer | interop.Reference<any>;

declare function mason_style_init_with_values(
  display: number,
  position_type: number,
  direction: number,
  flex_direction: number,
  flex_wrap: number,
  overflow: number,
  align_items: number,
  align_self: number,
  align_content: number,
  justify_content: number,
  position_left_type: number,
  position_left_value: number,
  position_right_type: number,
  position_right_value: number,
  position_top_type: number,
  position_top_value: number,
  position_bottom_type: number,
  position_bottom_value: number,
  margin_left_type: number,
  margin_left_value: number,
  margin_right_type: number,
  margin_right_value: number,
  margin_top_type: number,
  margin_top_value: number,
  margin_bottom_type: number,
  margin_bottom_value: number,
  padding_left_type: number,
  padding_left_value: number,
  padding_right_type: number,
  padding_right_value: number,
  padding_top_type: number,
  padding_top_value: number,
  padding_bottom_type: number,
  padding_bottom_value: number,
  border_left_type: number,
  border_left_value: number,
  border_right_type: number,
  border_right_value: number,
  border_top_type: number,
  border_top_value: number,
  border_bottom_type: number,
  border_bottom_value: number,
  flex_grow: number,
  flex_shrink: number,
  flex_basis_type: number,
  flex_basis_value: number,
  width_type: number,
  width_value: number,
  height_type: number,
  height_value: number,
  min_width_type: number,
  min_width_value: number,
  min_height_type: number,
  min_height_value: number,
  max_width_type: number,
  max_width_value: number,
  max_height_type: number,
  max_height_value: number,
  flex_gap_width_type: number,
  flex_gap_width_value: number,
  flex_gap_height_type: number,
  flex_gap_height_value: number,
  aspect_ratio: number
): interop.Pointer | interop.Reference<any>;

declare function mason_style_set_align_content(align: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_align_items(align: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_align_self(align: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_aspect_ratio(ratio: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_border(left_value: number, left_value_type: CMasonDimensionType, right_value: number, right_value_type: CMasonDimensionType, top_value: number, top_value_type: CMasonDimensionType, bottom_value: number, bottom_value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_border_bottom(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_border_left(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_border_right(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_border_top(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_direction(_direction: number, _style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_display(display: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_flex_basis(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_flex_direction(direction: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_flex_grow(style: interop.Pointer | interop.Reference<any>, grow: number): void;

declare function mason_style_set_flex_shrink(style: interop.Pointer | interop.Reference<any>, shrink: number): void;

declare function mason_style_set_flex_wrap(wrap: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_gap_height(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_gap_width(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_height(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_justify_content(justify: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_margin(left_value: number, left_value_type: CMasonDimensionType, right_value: number, right_value_type: CMasonDimensionType, top_value: number, top_value_type: CMasonDimensionType, bottom_value: number, bottom_value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_margin_bottom(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_margin_left(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_margin_right(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_margin_top(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_max_height(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_max_width(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_min_height(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_min_width(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_overflow(_overflow: number, _style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_padding(left_value: number, left_value_type: CMasonDimensionType, right_value: number, right_value_type: CMasonDimensionType, top_value: number, top_value_type: CMasonDimensionType, bottom_value: number, bottom_value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_padding_bottom(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_padding_left(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_padding_right(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_padding_top(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_position(left_value: number, left_value_type: CMasonDimensionType, right_value: number, right_value_type: CMasonDimensionType, top_value: number, top_value_type: CMasonDimensionType, bottom_value: number, bottom_value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_position_bottom(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_position_left(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_position_right(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_position_top(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_position_type(position_type: number, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_set_width(value: number, value_type: CMasonDimensionType, style: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_update_with_values(
  style: interop.Pointer | interop.Reference<any>,
  display: number,
  position_type: number,
  direction: number,
  flex_direction: number,
  flex_wrap: number,
  overflow: number,
  align_items: number,
  align_self: number,
  align_content: number,
  justify_content: number,
  position_left_type: number,
  position_left_value: number,
  position_right_type: number,
  position_right_value: number,
  position_top_type: number,
  position_top_value: number,
  position_bottom_type: number,
  position_bottom_value: number,
  margin_left_type: number,
  margin_left_value: number,
  margin_right_type: number,
  margin_right_value: number,
  margin_top_type: number,
  margin_top_value: number,
  margin_bottom_type: number,
  margin_bottom_value: number,
  padding_left_type: number,
  padding_left_value: number,
  padding_right_type: number,
  padding_right_value: number,
  padding_top_type: number,
  padding_top_value: number,
  padding_bottom_type: number,
  padding_bottom_value: number,
  border_left_type: number,
  border_left_value: number,
  border_right_type: number,
  border_right_value: number,
  border_top_type: number,
  border_top_value: number,
  border_bottom_type: number,
  border_bottom_value: number,
  flex_grow: number,
  flex_shrink: number,
  flex_basis_type: number,
  flex_basis_value: number,
  width_type: number,
  width_value: number,
  height_type: number,
  height_value: number,
  min_width_type: number,
  min_width_value: number,
  min_height_type: number,
  min_height_value: number,
  max_width_type: number,
  max_width_value: number,
  max_height_type: number,
  max_height_value: number,
  flex_gap_width_type: number,
  flex_gap_width_value: number,
  flex_gap_height_type: number,
  flex_gap_height_value: number,
  aspect_ratio: number
): void;
