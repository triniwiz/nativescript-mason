use jni::objects::{JClass, JObject, JPrimitiveArray, ReleaseMode};
use jni::sys::{
    jboolean, jfloat, jfloatArray, jint, jlong, jlongArray, jobjectArray, jshort, JNI_FALSE,
    JNI_TRUE,
};
use jni::JNIEnv;

use crate::style::{
    to_vec_non_repeated_track_sizing_function_jni, to_vec_track_sizing_function_jni,
};
use mason_core::{AvailableSpace, Mason, MeasureOutput, Node, NodeContext, Size};

#[no_mangle]
pub extern "system" fn NodeNativeDestroy(node: jlong) {
    if node == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(node as *mut Node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeDestroyNormal(_env: JNIEnv, _: JClass, node: jlong) {
    if node == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(node as *mut Node);
    }
}

fn native_new_node(taffy: jlong, style: jlong) -> jlong {
    if taffy == 0 || style == 0 {
        return 0;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let style = Box::from_raw(style as *mut mason_core::style::Style);
        let ret = mason
            .new_node(*style.clone())
            .map(|v| Box::into_raw(Box::new(v)) as jlong)
            .unwrap_or_else(|| 0);

        Box::leak(mason);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNode(taffy: jlong, style: jlong) -> jlong {
    native_new_node(taffy, style)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNodeNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    style: jlong,
) -> jlong {
    native_new_node(taffy, style)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNodeWithContext(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    style: jlong,
    measure: JObject,
) -> jlong {
    if taffy == 0 || style == 0 {
        return 0;
    }
    let measure = env.new_global_ref(measure).unwrap();
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let style = Box::from_raw(style as *mut mason_core::style::Style);

        let jvm = env.get_java_vm().unwrap();

        let context = NodeContext::new(jvm, measure);

        let ret = mason
            .new_node_with_context(*style.clone(), context)
            .map(|v| Box::into_raw(Box::new(v)) as jlong)
            .unwrap_or_else(|| 0);

        Box::leak(mason);
        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeNewNodeWithChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    style: jlong,
    children: jlongArray,
) -> jlong {
    if taffy == 0 || style == 0 {
        return 0;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let style = Box::from_raw(style as *mut mason_core::style::Style);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        let ret = match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            Ok(array) => {
                let data =
                    std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len());
                let data: Vec<Node> = data
                    .iter()
                    .map(|v| {
                        let v = *v as *mut Node;
                        *v
                    })
                    .collect();

                mason
                    .new_node_with_children(*style.clone(), data.as_slice())
                    .map(|v| Box::into_raw(Box::new(v)) as jlong)
                    .unwrap_or_else(|| 0)
            }
            Err(_) => mason
                .new_node(*style.clone())
                .map(|v| Box::into_raw(Box::new(v)) as jlong)
                .unwrap_or_else(|| 0),
        };

        Box::leak(mason);
        Box::leak(style);

        ret
    }
}

fn native_get_child_count(taffy: jlong, node: jlong) -> jint {
    if taffy == 0 || node == 0 {
        return 0;
    }
    unsafe {
        let mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let count = mason.child_count(*node) as jint;

        Box::leak(mason);
        Box::leak(node);

        count
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildCount(taffy: jlong, node: jlong) -> jint {
    native_get_child_count(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildCountNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) -> jint {
    native_get_child_count(taffy, node)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeLayout(
    env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) -> jfloatArray {
    if taffy == 0 || node == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let output = mason.layout(*node);
        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();
        Box::leak(mason);
        Box::leak(node);
        result.into_raw()
    }
}

fn native_compute_wh(taffy: jlong, node: jlong, width: jfloat, height: jfloat) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute_wh(*node, width, height);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeWH(
    taffy: jlong,
    node: jlong,
    width: jfloat,
    height: jfloat,
) {
    native_compute_wh(taffy, node, width, height)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeWHNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    width: jfloat,
    height: jfloat,
) {
    native_compute_wh(taffy, node, width, height)
}

fn native_compute_size(taffy: jlong, node: jlong, size: jlong) {
    if taffy == 0 || node == 0 || size == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Box::from_raw(size as *mut Size<AvailableSpace>);
        mason.compute_size(*node, *size);
        Box::leak(mason);
        Box::leak(node);
        Box::leak(size);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeSize(taffy: jlong, node: jlong, size: jlong) {
    native_compute_size(taffy, node, size)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeSizeNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    size: jlong,
) {
    native_compute_size(taffy, node, size)
}

fn native_compute_max_content(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::max_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMaxContent(taffy: jlong, node: jlong) {
    native_compute_max_content(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMaxContentNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) {
    native_compute_max_content(taffy, node)
}

fn native_compute_min_content(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::min_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMinContent(taffy: jlong, node: jlong) {
    native_compute_min_content(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMinContentNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) {
    native_compute_min_content(taffy, node)
}

fn native_compute(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute(*node);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeCompute(taffy: jlong, node: jlong) {
    native_compute(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) {
    native_compute(taffy, node)
}

fn native_set_style(taffy: jlong, node: jlong, style: jlong) {
    if taffy == 0 || node == 0 || style == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let style = Box::from_raw(style as *mut mason_core::style::Style);
        mason.set_style(*node, *style.clone());
        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeSetStyle(taffy: jlong, node: jlong, style: jlong) {
    native_set_style(taffy, node, style)
}

#[no_mangle]
pub extern "system" fn NodeNativeSetStyleNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    style: jlong,
) {
    native_set_style(taffy, node, style)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeUpdateAndSetStyle(
    env: &mut JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    style: jlong,
    display: jint,
    position: jint,
    direction: jint,
    flex_direction: jint,
    flex_wrap: jint,
    overflow: jint,
    align_items: jint,
    align_self: jint,
    align_content: jint,
    justify_items: jint,
    justify_self: jint,
    justify_content: jint,
    inset_left_type: jint,
    inset_left_value: jfloat,
    inset_right_type: jint,
    inset_right_value: jfloat,
    inset_top_type: jint,
    inset_top_value: jfloat,
    inset_bottom_type: jint,
    inset_bottom_value: jfloat,
    margin_left_type: jint,
    margin_left_value: jfloat,
    margin_right_type: jint,
    margin_right_value: jfloat,
    margin_top_type: jint,
    margin_top_value: jfloat,
    margin_bottom_type: jint,
    margin_bottom_value: jfloat,
    padding_left_type: jint,
    padding_left_value: jfloat,
    padding_right_type: jint,
    padding_right_value: jfloat,
    padding_top_type: jint,
    padding_top_value: jfloat,
    padding_bottom_type: jint,
    padding_bottom_value: jfloat,
    border_left_type: jint,
    border_left_value: jfloat,
    border_right_type: jint,
    border_right_value: jfloat,
    border_top_type: jint,
    border_top_value: jfloat,
    border_bottom_type: jint,
    border_bottom_value: jfloat,
    flex_grow: jfloat,
    flex_shrink: jfloat,
    flex_basis_type: jint,
    flex_basis_value: jfloat,
    width_type: jint,
    width_value: jfloat,
    height_type: jint,
    height_value: jfloat,
    min_width_type: jint,
    min_width_value: jfloat,
    min_height_type: jint,
    min_height_value: jfloat,
    max_width_type: jint,
    max_width_value: jfloat,
    max_height_type: jint,
    max_height_value: jfloat,
    gap_row_type: jint,
    gap_row_value: jfloat,
    gap_column_type: jint,
    gap_column_value: jfloat,
    aspect_ratio: jfloat,
    grid_auto_rows: jobjectArray,
    grid_auto_columns: jobjectArray,
    grid_auto_flow: jint,
    grid_column_start_type: jint,
    grid_column_start_value: jshort,
    grid_column_end_type: jint,
    grid_column_end_value: jshort,
    grid_row_start_type: jint,
    grid_row_start_value: jshort,
    grid_row_end_type: jint,
    grid_row_end_value: jshort,
    grid_template_rows: jobjectArray,
    grid_template_columns: jobjectArray,
    overflow_x: jint,
    overflow_y: jint,
    scrollbar_width: jfloat,
) {
    if taffy == 0 || node == 0 || style == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let mut style = Box::from_raw(style as *mut mason_core::style::Style);

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_rows);
        let grid_auto_columns =
            to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function_jni(env, grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function_jni(env, grid_template_columns);

        mason_core::style::Style::update_from_ffi(
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
            overflow_x,
            overflow_y,
            scrollbar_width,
        );

        mason.set_style(*node, *style.clone());
        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeUpdateSetStyleComputeAndLayout(
    env: &mut JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    style: jlong,
    display: jint,
    position: jint,
    direction: jint,
    flex_direction: jint,
    flex_wrap: jint,
    overflow: jint,
    align_items: jint,
    align_self: jint,
    align_content: jint,
    justify_items: jint,
    justify_self: jint,
    justify_content: jint,
    inset_left_type: jint,
    inset_left_value: jfloat,
    inset_right_type: jint,
    inset_right_value: jfloat,
    inset_top_type: jint,
    inset_top_value: jfloat,
    inset_bottom_type: jint,
    inset_bottom_value: jfloat,
    margin_left_type: jint,
    margin_left_value: jfloat,
    margin_right_type: jint,
    margin_right_value: jfloat,
    margin_top_type: jint,
    margin_top_value: jfloat,
    margin_bottom_type: jint,
    margin_bottom_value: jfloat,
    padding_left_type: jint,
    padding_left_value: jfloat,
    padding_right_type: jint,
    padding_right_value: jfloat,
    padding_top_type: jint,
    padding_top_value: jfloat,
    padding_bottom_type: jint,
    padding_bottom_value: jfloat,
    border_left_type: jint,
    border_left_value: jfloat,
    border_right_type: jint,
    border_right_value: jfloat,
    border_top_type: jint,
    border_top_value: jfloat,
    border_bottom_type: jint,
    border_bottom_value: jfloat,
    flex_grow: jfloat,
    flex_shrink: jfloat,
    flex_basis_type: jint,
    flex_basis_value: jfloat,
    width_type: jint,
    width_value: jfloat,
    height_type: jint,
    height_value: jfloat,
    min_width_type: jint,
    min_width_value: jfloat,
    min_height_type: jint,
    min_height_value: jfloat,
    max_width_type: jint,
    max_width_value: jfloat,
    max_height_type: jint,
    max_height_value: jfloat,
    gap_row_type: jint,
    gap_row_value: jfloat,
    gap_column_type: jint,
    gap_column_value: jfloat,
    aspect_ratio: jfloat,
    grid_auto_rows: jobjectArray,
    grid_auto_columns: jobjectArray,
    grid_auto_flow: jint,
    grid_column_start_type: jint,
    grid_column_start_value: jshort,
    grid_column_end_type: jint,
    grid_column_end_value: jshort,
    grid_row_start_type: jint,
    grid_row_start_value: jshort,
    grid_row_end_type: jint,
    grid_row_end_value: jshort,
    grid_template_rows: jobjectArray,
    grid_template_columns: jobjectArray,
    overflow_x: jint,
    overflow_y: jint,
    scrollbar_width: jfloat,
) -> jfloatArray {
    if taffy == 0 || node == 0 || style == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let mut style = Box::from_raw(style as *mut mason_core::style::Style);

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_rows);
        let grid_auto_columns =
            to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function_jni(env, grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function_jni(env, grid_template_columns);

        mason_core::style::Style::update_from_ffi(
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
            overflow_x,
            overflow_y,
            scrollbar_width,
        );

        mason.set_style(*node, *(style.clone()));

        mason.compute(*node);

        let output = mason.layout(*node);

        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);

        result.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeComputeAndLayout(
    env: &mut JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) -> jfloatArray {
    if taffy == 0 || node == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        mason.compute(*node);

        let output = mason.layout(*node);

        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        Box::leak(mason);
        Box::leak(node);

        result.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeComputeWithSizeAndLayout(
    env: &mut JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    width: jfloat,
    height: jfloat,
) -> jfloatArray {
    if taffy == 0 || node == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        mason.compute_wh(*node, width, height);

        let output = mason.layout(*node);

        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        Box::leak(mason);
        Box::leak(node);

        result.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeUpdateSetStyleComputeWithSizeAndLayout(
    env: &mut JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    style: jlong,
    width: jfloat,
    height: jfloat,
    display: jint,
    position: jint,
    direction: jint,
    flex_direction: jint,
    flex_wrap: jint,
    overflow: jint,
    align_items: jint,
    align_self: jint,
    align_content: jint,
    justify_items: jint,
    justify_self: jint,
    justify_content: jint,
    inset_left_type: jint,
    inset_left_value: jfloat,
    inset_right_type: jint,
    inset_right_value: jfloat,
    inset_top_type: jint,
    inset_top_value: jfloat,
    inset_bottom_type: jint,
    inset_bottom_value: jfloat,
    margin_left_type: jint,
    margin_left_value: jfloat,
    margin_right_type: jint,
    margin_right_value: jfloat,
    margin_top_type: jint,
    margin_top_value: jfloat,
    margin_bottom_type: jint,
    margin_bottom_value: jfloat,
    padding_left_type: jint,
    padding_left_value: jfloat,
    padding_right_type: jint,
    padding_right_value: jfloat,
    padding_top_type: jint,
    padding_top_value: jfloat,
    padding_bottom_type: jint,
    padding_bottom_value: jfloat,
    border_left_type: jint,
    border_left_value: jfloat,
    border_right_type: jint,
    border_right_value: jfloat,
    border_top_type: jint,
    border_top_value: jfloat,
    border_bottom_type: jint,
    border_bottom_value: jfloat,
    flex_grow: jfloat,
    flex_shrink: jfloat,
    flex_basis_type: jint,
    flex_basis_value: jfloat,
    width_type: jint,
    width_value: jfloat,
    height_type: jint,
    height_value: jfloat,
    min_width_type: jint,
    min_width_value: jfloat,
    min_height_type: jint,
    min_height_value: jfloat,
    max_width_type: jint,
    max_width_value: jfloat,
    max_height_type: jint,
    max_height_value: jfloat,
    gap_row_type: jint,
    gap_row_value: jfloat,
    gap_column_type: jint,
    gap_column_value: jfloat,
    aspect_ratio: jfloat,
    grid_auto_rows: jobjectArray,
    grid_auto_columns: jobjectArray,
    grid_auto_flow: jint,
    grid_column_start_type: jint,
    grid_column_start_value: jshort,
    grid_column_end_type: jint,
    grid_column_end_value: jshort,
    grid_row_start_type: jint,
    grid_row_start_value: jshort,
    grid_row_end_type: jint,
    grid_row_end_value: jshort,
    grid_template_rows: jobjectArray,
    grid_template_columns: jobjectArray,
    overflow_x: jint,
    overflow_y: jint,
    scrollbar_width: jfloat,
) -> jfloatArray {
    if taffy == 0 || node == 0 || style == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let mut style = Box::from_raw(style as *mut mason_core::style::Style);

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_rows);
        let grid_auto_columns =
            to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function_jni(env, grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function_jni(env, grid_template_columns);

        mason_core::style::Style::update_from_ffi(
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
            overflow_x,
            overflow_y,
            scrollbar_width,
        );

        mason.set_style(*node, *style.clone());

        mason.compute_wh(*node, width, height);

        let output = mason.layout(*node);

        let result = env.new_float_array(output.len() as i32).unwrap();

        env.set_float_array_region(&result, 0, &output).unwrap();

        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);

        result.into_raw()
    }
}

fn native_get_child_at(taffy: jlong, node: jlong, index: jint) -> jlong {
    if taffy == 0 || node == 0 {
        return 0;
    }
    unsafe {
        let mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let ret = mason
            .child_at_index(*node, index as usize)
            .map(|v| Box::into_raw(Box::new(v)) as jlong)
            .unwrap_or_default();
        Box::leak(mason);
        Box::leak(node);
        ret
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildAt(taffy: jlong, node: jlong, index: jint) -> jlong {
    native_get_child_at(taffy, node, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildAtNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    index: jint,
) -> jlong {
    native_get_child_at(taffy, node, index)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeSetChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jlongArray,
) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        if let Ok(array) = env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len());
            let data: Vec<Node> = data
                .iter()
                .map(|v| {
                    let v = *v as *mut Node;
                    *v
                })
                .collect();
            mason.set_children(*node, data.as_slice());
        }

        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeAddChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jlongArray,
) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        if let Ok(array) = env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len());
            let data: Vec<Node> = data
                .iter()
                .map(|v| {
                    let v = *v as *mut Node;
                    *v
                })
                .collect();
            mason.add_children(*node, data.as_slice());
        }

        Box::leak(mason);
        Box::leak(node);
    }
}

fn native_add_child(taffy: jlong, node: jlong, child: jlong) {
    if taffy == 0 || node == 0 || child == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child = Box::from_raw(child as *mut Node);

        mason.add_child(*node, *child);

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChild(taffy: jlong, node: jlong, child: jlong) {
    native_add_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChildNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
) {
    native_add_child(taffy, node, child)
}

fn native_replace_child_at(taffy: jlong, node: jlong, child: jlong, index: jint) -> jlong {
    if taffy == 0 || node == 0 || child == 0 {
        return 0;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child_ptr = child as *mut Node;
        let child = Box::from_raw(child_ptr);
        let ret = mason
            .replace_child_at_index(*node, *child, index as usize)
            .map(|v| {
                if v == *child {
                    return child_ptr as jlong;
                }
                Box::into_raw(Box::new(v)) as jlong
            })
            .unwrap_or_default();

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);

        ret
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeReplaceChildAt(
    taffy: jlong,
    node: jlong,
    child: jlong,
    index: jint,
) -> jlong {
    native_replace_child_at(taffy, node, child, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeReplaceChildAtNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    index: jint,
) -> jlong {
    native_replace_child_at(taffy, node, child, index)
}

fn native_add_child_at(taffy: jlong, node: jlong, child: jlong, index: jint) {
    if taffy == 0 || node == 0 || child == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child_ptr = child as *mut Node;
        let child = Box::from_raw(child_ptr);
        mason.add_child_at_index(*node, *child, index as usize);

        Box::leak(mason);
        Box::leak(node);
        Box::leak(child);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChildAt(taffy: jlong, node: jlong, child: jlong, index: jint) {
    native_add_child_at(taffy, node, child, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChildAtNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    index: jint,
) {
    native_add_child_at(taffy, node, child, index)
}

fn native_insert_child_before(taffy: jlong, node: jlong, child: jlong, reference: jlong) {
    if taffy == 0 || node == 0 || child == 0 || reference == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
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
pub extern "system" fn NodeNativeInsertChildBefore(
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_before(taffy, node, child, reference)
}

#[no_mangle]
pub extern "system" fn NodeNativeInsertChildBeforeNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_before(taffy, node, child, reference)
}

fn native_insert_child_after(taffy: jlong, node: jlong, child: jlong, reference: jlong) {
    if taffy == 0 || node == 0 || child == 0 || reference == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
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
pub extern "system" fn NodeNativeInsertChildAfter(
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_after(taffy, node, child, reference)
}

#[no_mangle]
pub extern "system" fn NodeNativeInsertChildAfterNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_after(taffy, node, child, reference)
}

fn native_dirty(taffy: jlong, node: jlong) -> jboolean {
    if taffy == 0 || node == 0 {
        return JNI_FALSE;
    }
    unsafe {
        let mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let ret = mason.dirty(*node);
        Box::leak(mason);
        Box::leak(node);

        if ret {
            return JNI_TRUE;
        }
    }

    JNI_FALSE
}

#[no_mangle]
pub extern "system" fn NodeNativeDirty(taffy: jlong, node: jlong) -> jboolean {
    native_dirty(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeDirtyNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) -> jboolean {
    native_dirty(taffy, node)
}

fn native_mark_dirty(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.mark_dirty(*node);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeMarkDirty(taffy: jlong, node: jlong) {
    native_mark_dirty(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeMarkDirtyNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
    native_mark_dirty(taffy, node)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeIsChildrenSame(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jlongArray,
) -> jboolean {
    if taffy == 0 || node == 0 {
        return JNI_FALSE;
    }
    unsafe {
        let mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        let ret = match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            Ok(array) => {
                let size = array.len();
                if mason.child_count(*node) != size {
                    return JNI_TRUE;
                }
                let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, size);
                let data: Vec<Node> = data
                    .iter()
                    .map(|v| {
                        let v = *v as *mut Node;
                        *v
                    })
                    .collect();
                if mason.is_children_same(*node, data.as_slice()) {
                    return JNI_TRUE;
                }
                JNI_FALSE
            }
            Err(_) => JNI_FALSE,
        };

        Box::leak(mason);
        Box::leak(node);

        ret
    }
}

fn native_remove_children(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        mason.remove_children(*node);

        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildren(taffy: jlong, node: jlong) {
    native_remove_children(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildrenNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
    native_remove_children(taffy, node)
}

fn native_remove_child_at(taffy: jlong, node: jlong, index: jint) -> jlong {
    if taffy == 0 || node == 0 {
        return 0;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let ret = mason
            .remove_child_at_index(*node, index as usize)
            .map(|v| Box::into_raw(Box::new(v)) as jlong)
            .unwrap_or_default();

        Box::leak(mason);
        Box::leak(node);

        ret
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildAt(taffy: jlong, node: jlong, index: jint) -> jlong {
    native_remove_child_at(taffy, node, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildAtNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    index: jint,
) -> jlong {
    native_remove_child_at(taffy, node, index)
}

fn native_remove_child(taffy: jlong, node: jlong, child: jlong) -> jlong {
    if taffy == 0 || node == 0 || child == 0 {
        return 0;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let child = Box::from_raw(child as *mut Node);

        match mason.remove_child(*node, *child) {
            None => {
                Box::leak(mason);
                Box::leak(node);
                Box::leak(child);

                0
            }
            Some(_) => {
                Box::leak(mason);
                Box::leak(node);

                Box::into_raw(child) as jlong
            }
        }
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChild(taffy: jlong, node: jlong, child: jlong) -> jlong {
    native_remove_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
) -> jlong {
    native_remove_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeGetChildren(
    env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) -> jlongArray {
    if taffy == 0 || node == 0 {
        return env.new_long_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);

        let ret = mason
            .children(*node)
            .map(|mut v| {
                let array = env.new_long_array(v.len() as i32).unwrap();
                let buf: Vec<jlong> = v
                    .iter_mut()
                    .map(|v| Box::into_raw(Box::new(v)) as jlong)
                    .collect();
                env.set_long_array_region(&array, 0, &buf).unwrap();
                array
            })
            .unwrap_or_else(|| env.new_long_array(0_i32).unwrap());

        Box::leak(mason);
        Box::leak(node);

        ret.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeSetContext(
    env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    measure: JObject,
) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let measure = env.new_global_ref(measure).unwrap();
        let jvm = env.get_java_vm().unwrap();
        let context = NodeContext::new(jvm, measure);
        mason.set_node_context(*node, Some(context));

        Box::leak(mason);
        Box::leak(node);
    }
}

fn native_remove_context(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.set_node_context(*node, None);
        Box::leak(mason);
        Box::leak(node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveContext(taffy: jlong, node: jlong) {
    native_remove_context(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveContextNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
    native_remove_context(taffy, node)
}
