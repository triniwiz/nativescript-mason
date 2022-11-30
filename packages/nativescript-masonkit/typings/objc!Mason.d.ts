declare const enum AvailableSpace_Tag {
  Definite = 0,

  MinContent = 1,

  MaxContent = 2,
}

declare class Mason extends NSObject {
  static alloc(): Mason; // inherited from NSObject

  static new(): Mason; // inherited from NSObject

  clear(): void;
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

  constructor(o: { style: MasonStyle });

  constructor(o: { style: MasonStyle; children: NSArray<MasonNode> | MasonNode[] });

  initWithStyle(style: MasonStyle): this;

  initWithStyleChildren(style: MasonStyle, children: NSArray<MasonNode> | MasonNode[]): this;
}

declare class MasonStyle extends NSObject {
  static alloc(): MasonStyle; // inherited from NSObject

  static new(): MasonStyle; // inherited from NSObject

  flexGrow: number;

  flexShrink: number;
}

declare var MasonVersionNumber: number;

declare var MasonVersionString: interop.Reference<number>;

declare class MasonView extends UIView {
  static alloc(): MasonView; // inherited from NSObject

  static appearance(): MasonView; // inherited from UIAppearance

  static appearanceForTraitCollection(trait: UITraitCollection): MasonView; // inherited from UIAppearance

  static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): MasonView; // inherited from UIAppearance

  static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(trait: UITraitCollection, containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonView; // inherited from UIAppearance

  static appearanceWhenContainedIn(ContainerClass: typeof NSObject): MasonView; // inherited from UIAppearance

  static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonView; // inherited from UIAppearance

  static new(): MasonView; // inherited from NSObject
}

declare class MeasureOutput extends NSObject {
  static alloc(): MeasureOutput; // inherited from NSObject

  static new(): MeasureOutput; // inherited from NSObject
}

interface NodeArray {
  array: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>;
  length: number;
}
declare var NodeArray: interop.StructType<NodeArray>;

declare function mason_clear(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_destroy(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_init(): interop.Pointer | interop.Reference<any>;

declare function mason_node_add_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_add_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): void;

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

declare function mason_node_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_node_mark_dirty(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_new_node(mason: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_children(mason: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<any>, children_size: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_measure_func(mason: interop.Pointer | interop.Reference<any>, style: interop.Pointer | interop.Reference<any>, measure_data: interop.Pointer | interop.Reference<any>, measure: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any>, p2: number, p3: number, p4: number, p5: number) => number>): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_measure_func(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_replace_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

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

declare function mason_style_get_display(style: interop.Pointer | interop.Reference<any>): number;

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

declare function mason_style_set_display(display: number, style: interop.Pointer | interop.Reference<any>): void;

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
