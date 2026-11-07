// Linux (NativeScript/linux runtime): libmasonkit.so's C ABI as generated from
// platforms/linux/include/mason_linux.h, plus the runtime and core APIs native.linux.ts uses.

declare const __LINUX__: boolean;

declare function g_object_ref(object: any): any;
declare function g_object_unref(object: any): void;

declare module interop {
  function bufferFromData(data: Pointer, length: number, free?: Function): ArrayBuffer;
}

declare module '@nativescript/core/ui/core/view/gtk-layout' {
  export function viewForWidget(widget: any): any;
}


declare function mason_gtk_add_event_listener(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, type: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): number;

declare function mason_gtk_css_apply_transform(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): void;

declare function mason_gtk_css_background_image(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, source: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, fit: number, align_x: number, align_y: number): void;

declare function mason_gtk_css_clear_background(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_css_clear_transform(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_css_linear_gradient(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, angle: number, corner_x: number, corner_y: number, stops: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, interpolation: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_css_radial_gradient(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, center_x: number, center_y: number, radius_x: number, radius_y: number, stops: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, interpolation: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_css_set_box_shadow(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, spec: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_css_set_filter(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, spec: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, backdrop: boolean): void;

declare function mason_gtk_css_set_layers(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, spec: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_css_set_mask(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number, spec: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_css_set_transform_origin(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, x: number, y: number): void;

declare function mason_gtk_css_set_transforms(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, scale_x: number, scale_y: number, angle: number, translate_x: number, translate_y: number, origin_x: number, origin_y: number): void;

declare function mason_gtk_default_style(): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_details(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_element_from_point(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, x: number, y: number): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_element_kind(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): number;

declare function mason_gtk_element_new(kind: number): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_event_call(event: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): void;

declare function mason_gtk_event_number(event: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): number;

declare function mason_gtk_event_string(event: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): string | null;

declare function mason_gtk_event_target(event: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_foreign_style_values(widget: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_get_preflight(): boolean;

declare function mason_gtk_grid_css(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): string | null;

declare function mason_gtk_image_set_source(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, source: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_image_source(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): string | null;

declare function mason_gtk_init(): boolean;

declare function mason_gtk_fonts_changed(): void;

declare function mason_gtk_register_fonts(directory: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): boolean;

declare function mason_gtk_input_flag(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): boolean;

declare function mason_gtk_input_focus(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_input_int(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): number;

declare function mason_gtk_input_placeholder(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): string | null;

declare function mason_gtk_input_set_accept(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, value: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_input_set_flag(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number, value: boolean): void;

declare function mason_gtk_input_set_int(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number, value: number): void;

declare function mason_gtk_input_set_placeholder(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, value: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_input_set_placeholder_color(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, argb: number, clear: boolean): void;

declare function mason_gtk_input_set_type(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, type: number): void;

declare function mason_gtk_input_set_value(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, value: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_input_type(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): number;

declare function mason_gtk_input_value(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): string | null;

declare function mason_gtk_invalidate(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_layout(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_list_ordered(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): boolean;

declare function mason_gtk_list_set_ordered(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, ordered: boolean): void;

declare function mason_gtk_measure(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, width_spec: number, height_spec: number): void;

declare function mason_gtk_open(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): boolean;

declare function mason_gtk_print_tree(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_remove_child(parent: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, child: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_remove_event_listener(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, type: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, id: number): boolean;

declare function mason_gtk_reparent_child(parent: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, child: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, index: number): void;

declare function mason_gtk_role(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): number;

declare function mason_gtk_scratch(): interop.Pointer | interop.Reference<number> | null;

declare function mason_gtk_scroll_into_view(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, block: number, inline_mode: number, smooth: boolean): void;

declare function mason_gtk_scroll_metric(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): number;

declare function mason_gtk_scroll_new(content: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_scroll_to(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, left: number, top: number, smooth: boolean): void;

declare function mason_gtk_set_event_dispatcher(callback: interop.FunctionReference<(p1: number, p2: interop.Pointer | interop.Reference<any> | null) => void>): void;

declare function mason_gtk_set_font_family(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, family: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_set_foreign_layout(callback: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any> | null, p2: number, p3: number, p4: number, p5: number) => void>): void;

declare function mason_gtk_set_foreign_measure(callback: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any> | null, p2: number, p3: number, p4: number, p5: number) => boolean>): void;

declare function mason_gtk_set_open(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, open: boolean): void;

declare function mason_gtk_set_percent_size(widget: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, horizontal: boolean, fraction: number): void;

declare function mason_gtk_set_preflight(enabled: boolean): void;

declare function mason_gtk_set_role(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, role: number): void;

declare function mason_gtk_set_url_loader(callback: interop.FunctionReference<(p1: string | null) => void>): void;

declare function mason_gtk_style_size(): number;

declare function mason_gtk_style_values(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_sync_foreign_style(widget: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, d0: number, d1: number, d2: number, d3: number): void;

declare function mason_gtk_sync_style(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, d0: number, d1: number, d2: number, d3: number): void;

declare function mason_gtk_text_clear_runs(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_text_content(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): string | null;

declare function mason_gtk_text_flag(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number): boolean;

declare function mason_gtk_text_node_data(run: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): string | null;

declare function mason_gtk_text_node_new(): interop.Pointer | interop.Reference<any> | null;

declare function mason_gtk_text_node_set_break(run: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, value: boolean): void;

declare function mason_gtk_text_node_set_data(run: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, data: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_text_remove_inline_box(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, child: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_text_remove_inline_text(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, child: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_text_remove_run(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, run: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_text_set_content(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, value: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_text_set_feature_settings(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, value: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_text_set_flag(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, which: number, value: boolean): void;

declare function mason_gtk_text_set_inline_box(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, child: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, index: number): void;

declare function mason_gtk_text_set_inline_text(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, child: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, index: number): void;

declare function mason_gtk_text_set_run(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, run: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, index: number): void;

declare function mason_gtk_text_set_shadow(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, spec: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;

declare function mason_gtk_texture_loaded(url: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, data: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, length: number): void;

declare function mason_gtk_update_grid(element: interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, auto_rows: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, auto_columns: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, column: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, column_start: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, column_end: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, row: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, row_start: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, row_end: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, template_rows: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, template_columns: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, area: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null, template_areas: string | interop.Pointer | interop.Reference<any> | ArrayBufferLike | ArrayBufferView | null): void;
