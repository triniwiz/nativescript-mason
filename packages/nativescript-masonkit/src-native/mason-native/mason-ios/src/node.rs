extern crate mason_core;

use std::ffi::{c_float, c_int, c_longlong, c_short, c_void};

use mason_core::style::Style;
use mason_core::{Mason, MeasureFunc, MeasureOutput, Node, Size};

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

#[no_mangle]
pub extern "C" fn mason_node_array_destroy(array: NodeArray) {
    if !array.array.is_null() {
        let mut buf = unsafe {
            Vec::from_raw_parts(array.array as *mut *mut Node, array.length, array.length)
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
pub extern "C" fn mason_node_destroy(node: *mut c_void) {
    if node.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(node as *mut Node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_node(mason: *mut c_void, style: *mut c_void) -> *mut c_void {
    if mason.is_null() || style.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let style = Box::from_raw(style as *mut Style);
        let ret = mason
            .new_node(*style.clone())
            .map(|v| Box::into_raw(Box::new(v)))
            .unwrap_or_else(std::ptr::null_mut) as *mut c_void;

        Box::leak(mason);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_node_with_measure_func(
    mason: *mut c_void,
    style: *mut c_void,
    measure_data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
) -> *mut c_void {
    if mason.is_null() || style.is_null() {
        return std::ptr::null_mut();
    }

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let style = Box::from_raw(style as *mut Style);
        // casting to long and back to to pass the pointer along
        let measure_data = measure_data as c_longlong;

        let ret = mason
            .new_node_with_measure_func(
                *style.clone(),
                MeasureFunc::Boxed(Box::new(
                    move |known_dimensions, available_space| match measure {
                        None => known_dimensions.map(|v| v.unwrap_or(0.0)),
                        Some(measure) => {
                            let measure_data = measure_data as *mut c_void;

                            let available_space_width = match available_space.width {
                                mason_core::AvailableSpace::MinContent => -1.,
                                mason_core::AvailableSpace::MaxContent => -2.,
                                mason_core::AvailableSpace::Definite(value) => value,
                            };

                            let available_space_height = match available_space.height {
                                mason_core::AvailableSpace::MinContent => -1.,
                                mason_core::AvailableSpace::MaxContent => -2.,
                                mason_core::AvailableSpace::Definite(value) => value,
                            };

                            let size = measure(
                                measure_data,
                                known_dimensions.width.unwrap_or(f32::NAN),
                                known_dimensions.height.unwrap_or(f32::NAN),
                                available_space_width,
                                available_space_height,
                            );

                            let width = MeasureOutput::get_width(size);
                            let height = MeasureOutput::get_height(size);

                            Size::<f32>::new(width, height).into()
                        }
                    },
                )),
            )
            .map(|v| Box::into_raw(Box::new(v)))
            .unwrap_or_else(|| std::ptr::null_mut()) as *mut c_void;

        Box::leak(mason);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_node_with_children(
    mason: *mut c_void,
    style: *mut c_void,
    children: *const c_void,
    children_size: usize,
) -> *mut c_void {
    if mason.is_null() || style.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let style = Box::from_raw(style as *mut Style);

        let data = std::slice::from_raw_parts(children as *const *mut Node, children_size as usize);

        let data: Vec<Node> = data.iter().map(|v| *(*v)).collect();

        let ret = mason
            .new_node_with_children(*style.clone(), &data)
            .map(|v| Box::into_raw(Box::new(v)))
            .unwrap_or_else(std::ptr::null_mut) as *mut c_void;

        Box::leak(mason);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_child_count(mason: *mut c_void, node: *mut c_void) -> usize {
    if mason.is_null() || node.is_null() {
        return 0;
    }
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let ret = mason.child_count(*node);
        Box::leak(mason);
        Box::leak(node);
        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_layout(
    mason: *mut c_void,
    node: *mut c_void,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() {
        return layout(std::ptr::null_mut());
    }
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let output = mason.layout(*node);

        let ret = layout(output.as_ptr());

        Box::leak(mason);
        Box::leak(node);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_wh(
    mason: *mut c_void,
    node: *mut c_void,
    width: c_float,
    height: c_float,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute_wh(*node, width, height);

        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_size(
    mason: *mut c_void,
    node: *mut c_void,
    width: AvailableSpace,
    height: AvailableSpace,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute_size(
            *node,
            Size::<mason_core::AvailableSpace>::from_wh(width.into(), height.into()),
        );
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_max_content(mason: *mut c_void, node: *mut c_void) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::max_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_min_content(mason: *mut c_void, node: *mut c_void) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::min_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute(mason: *mut c_void, node: *mut c_void) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute(*node);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_set_style(mason: *mut c_void, node: *mut c_void, style: *mut c_void) {
    if mason.is_null() || node.is_null() || style.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let style = Box::from_raw(style as *mut Style);
        mason.set_style(*node, *style.clone());
        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_and_set_style(
    mason: *mut c_void,
    node: *mut c_void,
    style: *mut c_void,
) {
    if mason.is_null() || node.is_null() || style.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let style = Box::from_raw(style as *mut Style);

        mason.set_style(*node, *style.clone());
        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_and_set_style_with_values(
    mason: *mut c_void,
    node: *mut c_void,
    style: *mut c_void,
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
) {
    if mason.is_null() || node.is_null() || style.is_null() {
        return;
    }

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let mut style = Box::from_raw(style as *mut Style);

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
        let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function(grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function(grid_template_columns);

        Style::update_from_ffi(
            &mut style,
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
        );

        mason.set_style(*node, *style.clone());


        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_style_with_values_compute_and_layout(
    mason: *mut c_void,
    node: *mut c_void,
    style: *mut c_void,
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
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let mut style = Box::from_raw(style as *mut Style);

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
        let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function(grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function(grid_template_columns);

        Style::update_from_ffi(
            &mut style,
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
        );

        let n = *node;

        mason.set_style(n, *style.clone());

        mason.compute(n);

        let output = mason.layout(n);

        let ret = layout(output.as_ptr());

        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_style_with_values_size_compute_and_layout(
    mason: *mut c_void,
    node: *mut c_void,
    style: *mut c_void,
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
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let mut style = Box::from_raw(style as *mut Style);

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
        let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function(grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function(grid_template_columns);

        Style::update_from_ffi(
            &mut style,
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
        );

        let n = *node;

        mason.set_style(n, *style.clone());

        mason.compute_wh(n, width, height);

        let output = mason.layout(n);

        let ret = layout(output.as_ptr());

        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_set_style_compute_and_layout(
    mason: *mut c_void,
    node: *mut c_void,
    style: *mut c_void,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let style = Box::from_raw(style as *mut Style);

        let n = *node;

        mason.set_style(n, *style.clone());

        mason.compute(n);

        let output = mason.layout(n);

        let ret = layout(output.as_ptr());

        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_update_set_style_compute_with_size_and_layout(
    mason: *mut c_void,
    node: *mut c_void,
    style: *mut c_void,
    width: c_float,
    height: c_float,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || style.is_null() {
        return layout(std::ptr::null_mut());
    }

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let style = Box::from_raw(style as *mut Style);

        let n = *node;

        mason.set_style(n, *style.clone());

        mason.compute_wh(n, width, height);

        let output = mason.layout(n);

        let ret = layout(output.as_ptr());
        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_child_at(
    mason: *mut c_void,
    node: *mut c_void,
    index: usize,
) -> *mut c_void {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let ret = mason
            .child_at_index(*node, index)
            .map(|v| Box::into_raw(Box::new(v)))
            .unwrap_or_else(std::ptr::null_mut) as *mut c_void;

        Box::leak(mason);
        Box::leak(node);
        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_set_children(
    mason: *mut c_void,
    node: *mut c_void,
    children: *const c_void,
    children_size: usize,
) {
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);

        let data = std::slice::from_raw_parts(children as *const *mut Node, children_size as usize);

        let data: Vec<Node> = data.iter().map(|v| *(*v)).collect();

        mason.set_children(*node, &data);

        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_children(
    mason: *mut c_void,
    node: *mut c_void,
    children: *const c_void,
    children_size: usize,
) {
    unsafe {
        if children_size == 0 {
            return;
        }

        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let data = std::slice::from_raw_parts(children as *const *mut Node, children_size as usize);

        let data: Vec<Node> = data.iter().map(|v| *(*v)).collect();

        mason.add_children(*node, &data);

        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_child(mason: *mut c_void, node: *mut c_void, child: *mut c_void) {
    if mason.is_null() || node.is_null() || child.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child = Box::from_raw(child as *mut Node);

        mason.add_child(*node, *child);

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_replace_child_at(
    mason: *mut c_void,
    node: *mut c_void,
    child: *mut c_void,
    index: usize,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || child.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child_ptr = child as *mut Node;
        let child = Box::from_raw(child_ptr);
        let ret = mason
            .replace_child_at_index(*node, *child, index)
            .map(|v| {
                if v == *child {
                    return child_ptr;
                }
                Box::into_raw(Box::new(v))
            })
            .unwrap_or_else(std::ptr::null_mut) as *mut c_void;

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_child_at(
    mason: *mut c_void,
    node: *mut c_void,
    child: *mut c_void,
    index: usize,
) {
    if mason.is_null() || node.is_null() || child.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child_ptr = child as *mut Node;
        let child = Box::from_raw(child_ptr);
        mason.add_child_at_index(*node, *child, index);

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_insert_child_before(
    mason: *mut c_void,
    node: *mut c_void,
    child: *mut c_void,
    reference: *mut c_void,
) {
    if mason.is_null() || node.is_null() || child.is_null() || reference.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child = Box::from_raw(child as *mut Node);
        let reference = Box::from_raw(reference as *mut Node);
        mason.insert_child_before(*node, *child, *reference);

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);
        Box::leak(reference);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_insert_child_after(
    mason: *mut c_void,
    node: *mut c_void,
    child: *mut c_void,
    reference: *mut c_void,
) {
    if mason.is_null() || node.is_null() || child.is_null() || reference.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child = Box::from_raw(child as *mut Node);
        let reference = Box::from_raw(reference as *mut Node);
        mason.insert_child_after(*node, *child, *reference);

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);
        Box::leak(reference);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_dirty(mason: *mut c_void, node: *mut c_void) -> bool {
    if mason.is_null() || node.is_null() {
        return false;
    }
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let ret = mason.dirty(*node);
        Box::leak(mason);
        Box::leak(node);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_mark_dirty(mason: *mut c_void, node: *mut c_void) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.mark_dirty(*node);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_is_children_same(
    mason: *mut c_void,
    node: *mut c_void,
    children: *const c_void,
    children_size: usize,
) -> bool {
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        if children_size != mason.child_count(*node) {
            Box::leak(mason);
            Box::leak(node);
            return false;
        }

        let data = std::slice::from_raw_parts(children as *const *mut Node, children_size);

        let data: Vec<Node> = data.iter().map(|v| *(*v)).collect();

        let ret = mason.is_children_same(*node, &data);

        Box::leak(mason);
        Box::leak(node);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_children(mason: *mut c_void, node: *mut c_void) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);

        mason.remove_children(*node);

        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_child_at(
    mason: *mut c_void,
    node: *mut c_void,
    index: usize,
) -> *mut c_void {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = node as *mut Node;
        let node = Box::from_raw(node as *mut Node);

        let ret = mason
            .remove_child_at_index(*node, index)
            .map(|v| Box::into_raw(Box::new(v)))
            .unwrap_or_else(std::ptr::null_mut) as *mut c_void;

        Box::leak(mason);
        Box::leak(node);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_child(
    mason: *mut c_void,
    node: *mut c_void,
    child: *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() || child.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child = Box::from_raw(child as *mut Node);

        let ret = mason
            .remove_child(*node, *child)
            .map(|v| Box::into_raw(Box::new(v)))
            .unwrap_or_else(std::ptr::null_mut) as *mut c_void;

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_children(mason: *mut c_void, node: *mut c_void) -> NodeArray {
    if mason.is_null() || node.is_null() {
        return Default::default();
    }
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let ret = mason
            .children(*node)
            .map(|mut v| {
                let buf: Vec<*mut Node> =
                    v.iter_mut().map(|v| Box::into_raw(Box::new(*v))).collect();

                let mut buf = buf.into_boxed_slice();
                let len = buf.len();
                let ret = NodeArray {
                    array: buf.as_mut_ptr() as *mut *mut c_void,
                    length: len,
                };
                Box::leak(buf);
                ret
            })
            .unwrap_or_default();

        Box::leak(mason);
        Box::leak(node);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_set_measure_func(
    mason: *mut c_void,
    node: *mut c_void,
    measure_data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let measure_data = measure_data as c_longlong;
        mason.set_measure_func(
            *node,
            Some(MeasureFunc::Boxed(Box::new(
                move |known_dimensions, available_space| match measure.as_ref() {
                    None => known_dimensions.map(|v| v.unwrap_or(0.0)),
                    Some(measure) => {
                        let measure_data = measure_data as *mut c_void;
                        let available_space_width = match available_space.width {
                            mason_core::AvailableSpace::MinContent => -1.,
                            mason_core::AvailableSpace::MaxContent => -2.,
                            mason_core::AvailableSpace::Definite(value) => value,
                        };

                        let available_space_height = match available_space.height {
                            mason_core::AvailableSpace::MinContent => -1.,
                            mason_core::AvailableSpace::MaxContent => -2.,
                            mason_core::AvailableSpace::Definite(value) => value,
                        };

                        let size = measure(
                            measure_data,
                            known_dimensions.width.unwrap_or(f32::NAN),
                            known_dimensions.height.unwrap_or(f32::NAN),
                            available_space_width,
                            available_space_height,
                        );

                        let width = MeasureOutput::get_width(size);
                        let height = MeasureOutput::get_height(size);

                        Size::<f32>::new(width, height).into()
                    }
                },
            ))),
        );

        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_measure_func(mason: *mut c_void, node: *mut c_void) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.set_measure_func(*node, None);
        Box::leak(mason);
        Box::leak(node);
    }
}
