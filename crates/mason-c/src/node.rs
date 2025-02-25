use std::ffi::{c_float, c_int, c_longlong, c_short, c_void};

use crate::{CMason, CMasonNode, CMasonStyle};
use mason_core::{NodeContext, NodeKind, Size};

use crate::style::{
    to_vec_non_repeated_track_sizing_function, to_vec_track_sizing_function,
    CMasonNonRepeatedTrackSizingFunctionArray, CMasonTrackSizingFunctionArray,
};

#[repr(C)]
pub enum AvailableSpace {
    Definite(f32),
    MinContent,
    MaxContent,
}

#[allow(clippy::from_over_into)]
impl Into<mason_core::AvailableSpace> for AvailableSpace {
    fn into(self) -> mason_core::AvailableSpace {
        match self {
            AvailableSpace::Definite(value) => mason_core::AvailableSpace::Definite(value),
            AvailableSpace::MinContent => mason_core::AvailableSpace::MinContent,
            AvailableSpace::MaxContent => mason_core::AvailableSpace::MaxContent,
        }
    }
}

#[repr(C)]
pub struct NodeArray {
    pub array: *mut *mut c_void,
    pub length: usize,
}

impl Default for NodeArray {
    fn default() -> Self {
        Self {
            array: std::ptr::null_mut(),
            length: 0,
        }
    }
}

#[repr(C)]
pub enum CMasonNodeKind {
    Element,
    Text,
    Custom
}


// impl Into<CMasonNodeKind> for NodeKind {
//     fn into(self) -> CMasonNodeKind {
//         match self {
//             NodeKind::Element => CMasonNodeKind::Element,
//             NodeKind::Text => CMasonNodeKind::Text,
//         }
//     }
// }

impl From<NodeKind> for CMasonNodeKind {
    fn from(value: NodeKind) -> Self {
        match value {
            NodeKind::Element => CMasonNodeKind::Element,
            NodeKind::Text => CMasonNodeKind::Text,
            NodeKind::Custom => CMasonNodeKind::Custom
        }
    }
}

impl From<CMasonNodeKind> for NodeKind {
    fn from(value: CMasonNodeKind) -> Self {
        match value {
            CMasonNodeKind::Element => NodeKind::Element,
            CMasonNodeKind::Text => NodeKind::Text,
            CMasonNodeKind::Custom => NodeKind::Custom
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_node_is_equal(node_a: *mut CMasonNode, node_b: *mut CMasonNode) -> bool {
    if node_a.is_null() || node_b.is_null() {
        return false;
    }

    let a = unsafe { Box::from_raw(node_a) };

    let b = unsafe { Box::from_raw(node_b) };

    let ret = a == b;

    Box::leak(a);
    Box::leak(b);

    ret
}

#[no_mangle]
pub extern "C" fn mason_node_array_destroy(array: *mut NodeArray) {
    if array.is_null() {
        return;
    }
    let array = unsafe { &mut *array };
    if !array.array.is_null() {
        let mut buf = unsafe {
            Vec::from_raw_parts(
                array.array as *mut *mut CMasonNode,
                array.length,
                array.length,
            )
        };
        let _: Vec<_> = buf
            .iter_mut()
            .map(|v| {
                let a = *v;
                unsafe { Box::from_raw(a) }
            })
            .collect();
    }
}

#[no_mangle]
pub extern "C" fn mason_node_destroy(node: *mut CMasonNode) {
    if node.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_node(mason: *mut CMason, kind: CMasonNodeKind) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        Box::into_raw(Box::new(CMasonNode(mason.create_node(kind.into()))))
    }
}

#[cfg(not(target_os = "android"))]
#[no_mangle]
pub extern "C" fn mason_node_new_node_with_context(
    mason: *mut CMason,
    kind: CMasonNodeKind,
    measure_data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }

    unsafe {
        let mason = &mut (*mason).0;

        let context = NodeContext::new(measure_data, measure);

        let node_id = mason.create_node(kind.into());

        match mason.get_node_mut(node_id) {
            None => std::ptr::null_mut(),
            Some(node) => {
                node.set_node_context(Some(context));
                Box::into_raw(Box::new(CMasonNode(node_id)))
            }
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_node_with_children(
    mason: *mut CMason,
    kind: CMasonNodeKind,
    children: *const *mut CMasonNode,
    children_size: usize,
) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<usize> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0
            })
            .collect();

        let node_id = mason.create_node(kind.into());
        mason.set_children(node_id, &data);

        Box::into_raw(Box::new(CMasonNode(node_id)))
    }
}

#[no_mangle]
pub extern "C" fn mason_node_layout(
    mason: *mut CMason,
    node: *mut CMasonNode,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() {
        return layout(std::ptr::null_mut());
    }
    unsafe {
        let mason = &(*mason).0;
        let node = (*node).0;

        let output = mason.layout(node);

        layout(output.as_ptr())
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_style(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut CMasonStyle {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let tree = &(*mason).0;
        let node_id = (*node).0;
        match tree.get_node(node_id) {
            None => std::ptr::null_mut(),
            Some(_) => Box::into_raw(Box::new(CMasonStyle { mason, node })),
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_wh(
    mason: *mut CMason,
    node: *mut CMasonNode,
    width: c_float,
    height: c_float,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        mason.compute_wh(node, width, height);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_size(
    mason: *mut CMason,
    node: *mut CMasonNode,
    width: AvailableSpace,
    height: AvailableSpace,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        mason.compute_size(
            node,
            Size::<mason_core::AvailableSpace> {
                width: width.into(),
                height: height.into(),
            },
        );
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_max_content(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        let size = Size::max_content();
        mason.compute_size(node, size);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_min_content(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        let size = Size::min_content();
        mason.compute_size(node, size);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        mason.compute(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_set_style(
    mason: *mut CMason,
    node: *mut CMasonNode,
    style: *mut CMasonStyle,
) {
    if mason.is_null() || node.is_null() || style.is_null() {
        return;
    }
    unsafe {
        // let mason = &mut (*mason).0;
        // let node = (*node).0;
        // let style = &(*style).0;
        // mason.set_style(node, style.clone());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_and_set_style(
    mason: *mut CMason,
    node: *mut CMasonNode,
    style: *mut CMasonStyle,
) {
    if mason.is_null() || node.is_null() || style.is_null() {
        return;
    }
    unsafe {
        // let mason = &mut (*mason).0;
        // let node = (*node).0;
        // let style = &(*style).0;

        // mason.set_style(node, style.clone());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_and_set_style_with_values(
    mason: *mut CMason,
    node: *mut CMasonNode,
    style: *mut CMasonStyle,
    display: c_int,
    position: c_int,
    direction: c_int,
    flex_direction: c_int,
    flex_wrap: c_int,
    overflow: c_int,
    align_items: c_int,
    align_self: c_int,
    align_content: c_int,
    justify_items: c_int,
    justify_self: c_int,
    justify_content: c_int,
    inset_left_type: c_int,
    inset_left_value: c_float,
    inset_right_type: c_int,
    inset_right_value: c_float,
    inset_top_type: c_int,
    inset_top_value: c_float,
    inset_bottom_type: c_int,
    inset_bottom_value: c_float,
    margin_left_type: c_int,
    margin_left_value: c_float,
    margin_right_type: c_int,
    margin_right_value: c_float,
    margin_top_type: c_int,
    margin_top_value: c_float,
    margin_bottom_type: c_int,
    margin_bottom_value: c_float,
    padding_left_type: c_int,
    padding_left_value: c_float,
    padding_right_type: c_int,
    padding_right_value: c_float,
    padding_top_type: c_int,
    padding_top_value: c_float,
    padding_bottom_type: c_int,
    padding_bottom_value: c_float,
    border_left_type: c_int,
    border_left_value: c_float,
    border_right_type: c_int,
    border_right_value: c_float,
    border_top_type: c_int,
    border_top_value: c_float,
    border_bottom_type: c_int,
    border_bottom_value: c_float,
    flex_grow: c_float,
    flex_shrink: c_float,
    flex_basis_type: c_int,
    flex_basis_value: c_float,
    width_type: c_int,
    width_value: c_float,
    height_type: c_int,
    height_value: c_float,
    min_width_type: c_int,
    min_width_value: c_float,
    min_height_type: c_int,
    min_height_value: c_float,
    max_width_type: c_int,
    max_width_value: c_float,
    max_height_type: c_int,
    max_height_value: c_float,
    gap_row_type: c_int,
    gap_row_value: c_float,
    gap_column_type: c_int,
    gap_column_value: c_float,
    aspect_ratio: c_float,
    grid_auto_rows: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_columns: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_flow: c_int,
    grid_column_start_type: c_int,
    grid_column_start_value: c_short,
    grid_column_end_type: c_int,
    grid_column_end_value: c_short,
    grid_row_start_type: c_int,
    grid_row_start_value: c_short,
    grid_row_end_type: c_int,
    grid_row_end_value: c_short,
    grid_template_rows: *mut CMasonTrackSizingFunctionArray,
    grid_template_columns: *mut CMasonTrackSizingFunctionArray,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
    text_align: i32,
    box_sizing: i32,
) {
    if mason.is_null() || node.is_null() || style.is_null() {
        return;
    }

    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        // let style = (*style).0;

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
        let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function(grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function(grid_template_columns);

        if let Some(style) = mason.get_node_mut(node) {
            mason_core::style::update_from_ffi(
                style.style_mut(),
                display,
                position,
                direction,
                flex_direction,
                flex_wrap,
                overflow,
                align_items,
                align_self,
                align_content,
                justify_items,
                justify_self,
                justify_content,
                inset_left_type,
                inset_left_value,
                inset_right_type,
                inset_right_value,
                inset_top_type,
                inset_top_value,
                inset_bottom_type,
                inset_bottom_value,
                margin_left_type,
                margin_left_value,
                margin_right_type,
                margin_right_value,
                margin_top_type,
                margin_top_value,
                margin_bottom_type,
                margin_bottom_value,
                padding_left_type,
                padding_left_value,
                padding_right_type,
                padding_right_value,
                padding_top_type,
                padding_top_value,
                padding_bottom_type,
                padding_bottom_value,
                border_left_type,
                border_left_value,
                border_right_type,
                border_right_value,
                border_top_type,
                border_top_value,
                border_bottom_type,
                border_bottom_value,
                flex_grow,
                flex_shrink,
                flex_basis_type,
                flex_basis_value,
                width_type,
                width_value,
                height_type,
                height_value,
                min_width_type,
                min_width_value,
                min_height_type,
                min_height_value,
                max_width_type,
                max_width_value,
                max_height_type,
                max_height_value,
                gap_row_type,
                gap_row_value,
                gap_column_type,
                gap_column_value,
                aspect_ratio,
                grid_auto_rows,
                grid_auto_columns,
                grid_auto_flow,
                grid_column_start_type,
                grid_column_start_value,
                grid_column_end_type,
                grid_column_end_value,
                grid_row_start_type,
                grid_row_start_value,
                grid_row_end_type,
                grid_row_end_value,
                grid_template_rows,
                grid_template_columns,
                overflow_x,
                overflow_y,
                scrollbar_width,
                text_align,
                box_sizing,
            );
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_style_with_values_compute_and_layout(
    mason: *mut CMason,
    node: *mut CMasonNode,
    style: *mut CMasonStyle,
    display: c_int,
    position_type: c_int,
    direction: c_int,
    flex_direction: c_int,
    flex_wrap: c_int,
    overflow: c_int,
    align_items: c_int,
    align_self: c_int,
    align_content: c_int,
    justify_items: c_int,
    justify_self: c_int,
    justify_content: c_int,
    inset_left_type: c_int,
    inset_left_value: c_float,
    inset_right_type: c_int,
    inset_right_value: c_float,
    inset_top_type: c_int,
    inset_top_value: c_float,
    inset_bottom_type: c_int,
    inset_bottom_value: c_float,
    margin_left_type: c_int,
    margin_left_value: c_float,
    margin_right_type: c_int,
    margin_right_value: c_float,
    margin_top_type: c_int,
    margin_top_value: c_float,
    margin_bottom_type: c_int,
    margin_bottom_value: c_float,
    padding_left_type: c_int,
    padding_left_value: c_float,
    padding_right_type: c_int,
    padding_right_value: c_float,
    padding_top_type: c_int,
    padding_top_value: c_float,
    padding_bottom_type: c_int,
    padding_bottom_value: c_float,
    border_left_type: c_int,
    border_left_value: c_float,
    border_right_type: c_int,
    border_right_value: c_float,
    border_top_type: c_int,
    border_top_value: c_float,
    border_bottom_type: c_int,
    border_bottom_value: c_float,
    flex_grow: c_float,
    flex_shrink: c_float,
    flex_basis_type: c_int,
    flex_basis_value: c_float,
    width_type: c_int,
    width_value: c_float,
    height_type: c_int,
    height_value: c_float,
    min_width_type: c_int,
    min_width_value: c_float,
    min_height_type: c_int,
    min_height_value: c_float,
    max_width_type: c_int,
    max_width_value: c_float,
    max_height_type: c_int,
    max_height_value: c_float,
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    grid_auto_rows: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_columns: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    grid_template_rows: *mut CMasonTrackSizingFunctionArray,
    grid_template_columns: *mut CMasonTrackSizingFunctionArray,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
    text_align: i32,
    box_sizing: i32,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }

    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        //  let style = (*style).0;

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
        let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function(grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function(grid_template_columns);

        if let Some(style) = mason.get_node_mut(node_id) {
            mason_core::style::update_from_ffi(
                style.style_mut(),
                display,
                position_type,
                direction,
                flex_direction,
                flex_wrap,
                overflow,
                align_items,
                align_self,
                align_content,
                justify_items,
                justify_self,
                justify_content,
                inset_left_type,
                inset_left_value,
                inset_right_type,
                inset_right_value,
                inset_top_type,
                inset_top_value,
                inset_bottom_type,
                inset_bottom_value,
                margin_left_type,
                margin_left_value,
                margin_right_type,
                margin_right_value,
                margin_top_type,
                margin_top_value,
                margin_bottom_type,
                margin_bottom_value,
                padding_left_type,
                padding_left_value,
                padding_right_type,
                padding_right_value,
                padding_top_type,
                padding_top_value,
                padding_bottom_type,
                padding_bottom_value,
                border_left_type,
                border_left_value,
                border_right_type,
                border_right_value,
                border_top_type,
                border_top_value,
                border_bottom_type,
                border_bottom_value,
                flex_grow,
                flex_shrink,
                flex_basis_type,
                flex_basis_value,
                width_type,
                width_value,
                height_type,
                height_value,
                min_width_type,
                min_width_value,
                min_height_type,
                min_height_value,
                max_width_type,
                max_width_value,
                max_height_type,
                max_height_value,
                gap_row_type,
                gap_row_value,
                gap_column_type,
                gap_column_value,
                aspect_ratio,
                grid_auto_rows,
                grid_auto_columns,
                grid_auto_flow,
                grid_column_start_type,
                grid_column_start_value,
                grid_column_end_type,
                grid_column_end_value,
                grid_row_start_type,
                grid_row_start_value,
                grid_row_end_type,
                grid_row_end_value,
                grid_template_rows,
                grid_template_columns,
                overflow_x,
                overflow_y,
                scrollbar_width,
                text_align,
                box_sizing,
            );

            // mason.set_style(n, style.clone());

            mason.compute(node_id);

            let output = mason.layout(node_id);

            return layout(output.as_ptr());
        }

        layout(std::ptr::null_mut())
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_style_with_values_size_compute_and_layout(
    mason: *mut CMason,
    node: *mut CMasonNode,
    style: *mut CMasonStyle,
    width: c_float,
    height: c_float,
    display: c_int,
    position: c_int,
    direction: c_int,
    flex_direction: c_int,
    flex_wrap: c_int,
    overflow: c_int,
    align_items: c_int,
    align_self: c_int,
    align_content: c_int,
    justify_items: c_int,
    justify_self: c_int,
    justify_content: c_int,
    inset_left_type: c_int,
    inset_left_value: c_float,
    inset_right_type: c_int,
    inset_right_value: c_float,
    inset_top_type: c_int,
    inset_top_value: c_float,
    inset_bottom_type: c_int,
    inset_bottom_value: c_float,
    margin_left_type: c_int,
    margin_left_value: c_float,
    margin_right_type: c_int,
    margin_right_value: c_float,
    margin_top_type: c_int,
    margin_top_value: c_float,
    margin_bottom_type: c_int,
    margin_bottom_value: c_float,
    padding_left_type: c_int,
    padding_left_value: c_float,
    padding_right_type: c_int,
    padding_right_value: c_float,
    padding_top_type: c_int,
    padding_top_value: c_float,
    padding_bottom_type: c_int,
    padding_bottom_value: c_float,
    border_left_type: c_int,
    border_left_value: c_float,
    border_right_type: c_int,
    border_right_value: c_float,
    border_top_type: c_int,
    border_top_value: c_float,
    border_bottom_type: c_int,
    border_bottom_value: c_float,
    flex_grow: c_float,
    flex_shrink: c_float,
    flex_basis_type: c_int,
    flex_basis_value: c_float,
    width_type: c_int,
    width_value: c_float,
    height_type: c_int,
    height_value: c_float,
    min_width_type: c_int,
    min_width_value: c_float,
    min_height_type: c_int,
    min_height_value: c_float,
    max_width_type: c_int,
    max_width_value: c_float,
    max_height_type: c_int,
    max_height_value: c_float,
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    grid_auto_rows: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_columns: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    grid_template_rows: *mut CMasonTrackSizingFunctionArray,
    grid_template_columns: *mut CMasonTrackSizingFunctionArray,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
    text_align: i32,
    box_sizing: i32,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }

    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        // let style = (*style).0;

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
        let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function(grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function(grid_template_columns);

        if let Some(node) = mason.get_node_mut(node_id) {
            mason_core::style::update_from_ffi(
                node.style_mut(),
                display,
                position,
                direction,
                flex_direction,
                flex_wrap,
                overflow,
                align_items,
                align_self,
                align_content,
                justify_items,
                justify_self,
                justify_content,
                inset_left_type,
                inset_left_value,
                inset_right_type,
                inset_right_value,
                inset_top_type,
                inset_top_value,
                inset_bottom_type,
                inset_bottom_value,
                margin_left_type,
                margin_left_value,
                margin_right_type,
                margin_right_value,
                margin_top_type,
                margin_top_value,
                margin_bottom_type,
                margin_bottom_value,
                padding_left_type,
                padding_left_value,
                padding_right_type,
                padding_right_value,
                padding_top_type,
                padding_top_value,
                padding_bottom_type,
                padding_bottom_value,
                border_left_type,
                border_left_value,
                border_right_type,
                border_right_value,
                border_top_type,
                border_top_value,
                border_bottom_type,
                border_bottom_value,
                flex_grow,
                flex_shrink,
                flex_basis_type,
                flex_basis_value,
                width_type,
                width_value,
                height_type,
                height_value,
                min_width_type,
                min_width_value,
                min_height_type,
                min_height_value,
                max_width_type,
                max_width_value,
                max_height_type,
                max_height_value,
                gap_row_type,
                gap_row_value,
                gap_column_type,
                gap_column_value,
                aspect_ratio,
                grid_auto_rows,
                grid_auto_columns,
                grid_auto_flow,
                grid_column_start_type,
                grid_column_start_value,
                grid_column_end_type,
                grid_column_end_value,
                grid_row_start_type,
                grid_row_start_value,
                grid_row_end_type,
                grid_row_end_value,
                grid_template_rows,
                grid_template_columns,
                overflow_x,
                overflow_y,
                scrollbar_width,
                text_align,
                box_sizing,
            );

            //   mason.set_style(node_id, style.clone());

            mason.compute_wh(node_id, width, height);

            let output = mason.layout(node_id);

            return layout(output.as_ptr());
        }
        layout(std::ptr::null_mut())
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_set_style_compute_and_layout(
    mason: *mut CMason,
    node: *mut CMasonNode,
    style: *mut CMasonStyle,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }
    let mut output = vec![];
    unsafe {
        let mason = &mut (*mason);
        let node_id = (*node).0;
        mason.with_mut(|mason| {
            // mason.set_style(node_id, style.clone());

            mason.compute(node_id);

            output = mason.layout(node_id);
        });
    }

    layout(output.as_ptr())
}

#[no_mangle]
pub extern "C" fn mason_node_update_set_style_compute_with_size_and_layout(
    mason: *mut CMason,
    node: *mut CMasonNode,
    style: *mut CMasonStyle,
    width: c_float,
    height: c_float,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }

    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        // todo
        // let style = &(*style).0;

        //  mason.set_style(n, style.clone());

        mason.compute_wh(node_id, width, height);

        let output = mason.layout(node_id);

        layout(output.as_ptr())
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    index: usize,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &(*mason).0;
        let node_id = (*node).0;

        match mason.get_node(node_id) {
            None => std::ptr::null_mut(),
            Some(node) => node
                .child_at_index(index)
                .map(|id| Box::into_raw(Box::new(CMasonNode(id))))
                .unwrap_or(std::ptr::null_mut()),
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_node_set_children(
    mason: *mut CMason,
    node: *mut CMasonNode,
    children: *const *mut CMasonNode,
    children_size: usize,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;

        let node_id = (*node).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<usize> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0
            })
            .collect();

        mason.set_children(node_id, &data);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_children(
    mason: *mut CMason,
    node: *mut CMasonNode,
    children: *const *mut CMasonNode,
    children_size: usize,
) {
    if mason.is_null() || node.is_null() {
        return;
    }

    unsafe {
        if children_size == 0 {
            return;
        }

        let mason = &mut (*mason).0;
        let node_id = (*node).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<usize> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0
            })
            .collect();

        mason.add_children(node_id, &data);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_child(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
) {
    if mason.is_null() || node.is_null() || child.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        let child = (*child).0;

        mason.add_child(node, child);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_replace_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    index: usize,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() || child.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        let child_id = (*child).0;

        let ret = mason
            .replace_child_at_index(node_id, child_id, index)
            .map(|v| Box::into_raw(Box::new(CMasonNode(v))))
            .unwrap_or_else(std::ptr::null_mut);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    index: usize,
) {
    if mason.is_null() || node.is_null() || child.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        let child_id = (*child).0;
        mason.add_child_at_index(node_id, child_id, index);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_insert_child_before(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    reference: *mut CMasonNode,
) {
    if mason.is_null() || node.is_null() || child.is_null() || reference.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        let child_id = (*child).0;
        let reference_id = (*reference).0;
        mason.insert_child_before(node_id, child_id, reference_id);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_insert_child_after(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    reference: *mut CMasonNode,
) {
    if mason.is_null() || node.is_null() || child.is_null() || reference.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        let child_id = (*child).0;
        let reference_id = (*reference).0;
        mason.insert_child_after(node_id, child_id, reference_id);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_dirty(mason: *mut CMason, node: *mut CMasonNode) -> bool {
    if mason.is_null() || node.is_null() {
        return false;
    }
    unsafe {
        let mason = &(*mason).0;
        let node_id = (*node).0;

        mason
            .get_node(node_id)
            .map(|node| node.dirty())
            .unwrap_or(false)
    }
}

#[no_mangle]
pub extern "C" fn mason_node_mark_dirty(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason);
        mason.with_node_mut(node, |node| {
            node.mark_dirty();
        });
    }
}

#[no_mangle]
pub extern "C" fn mason_node_is_children_same(
    mason: *mut CMason,
    node: *mut CMasonNode,
    children: *const *mut CMasonNode,
    children_size: usize,
) -> bool {
    unsafe {
        let mason = &(*mason).0;
        let node_id = (*node).0;

        if children_size != mason.child_count(node_id) {
            return false;
        }

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<usize> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0
            })
            .collect();

        mason.is_children_same(node_id, &data)
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_children(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;

        let node_id = (*node).0;

        mason.remove_children(node_id);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    index: usize,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;

        mason
            .remove_child_at_index(node_id, index)
            .map(|v| Box::into_raw(Box::new(CMasonNode(v))))
            .unwrap_or_else(std::ptr::null_mut)
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_child(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() || child.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        let child_id = (*child).0;

        mason
            .remove_child(node_id, child_id)
            .map(|v| Box::into_raw(Box::new(CMasonNode(v))))
            .unwrap_or_else(std::ptr::null_mut)
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_children(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut NodeArray {
    if mason.is_null() || node.is_null() {
        return Box::into_raw(Box::new(Default::default()));
    }
    unsafe {
        let mason = &(*mason).0;
        let node_id = (*node).0;

        let buf = mason
            .children(node_id)
            .iter()
            .map(|v| Box::into_raw(Box::new(CMasonNode(*v))))
            .collect::<Vec<_>>();

        let mut buf = buf.into_boxed_slice();
        let len = buf.len();
        let ret = NodeArray {
            array: buf.as_mut_ptr() as *mut *mut c_void,
            length: len,
        };
        Box::leak(buf);

        Box::into_raw(Box::new(ret))
    }
}

#[cfg(not(target_os = "android"))]
#[no_mangle]
pub extern "C" fn mason_node_set_context(
    mason: *mut CMason,
    node: *mut CMasonNode,
    measure_data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
) {
    if mason.is_null() || node.is_null() {
        return;
    }

    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        let context = NodeContext::new(measure_data, measure);
        mason.set_node_context(node_id, Some(context));
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_context(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = (*node).0;
        mason.set_node_context(node_id, None);
    }
}
