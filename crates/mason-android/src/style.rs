use jni::objects::{JObject, JString, JClass};
use jni::signature::ReturnType;
use jni::sys::{jfloat, jint, jlong, jstring};
use jni::JNIEnv;
use mason_core::{Mason, NodeRef};
use std::borrow::Cow;

pub(crate) const JAVA_INT_TYPE: ReturnType = ReturnType::Primitive(jni::signature::Primitive::Int);
pub(crate) const JAVA_SHORT_TYPE: ReturnType =
    ReturnType::Primitive(jni::signature::Primitive::Short);
pub(crate) const JAVA_FLOAT_TYPE: ReturnType =
    ReturnType::Primitive(jni::signature::Primitive::Float);
pub(crate) const JAVA_BOOLEAN_TYPE: ReturnType =
    ReturnType::Primitive(jni::signature::Primitive::Boolean);
pub(crate) const JAVA_OBJECT_TYPE: ReturnType = ReturnType::Object;
pub(crate) const JAVA_ARRAY_TYPE: ReturnType = ReturnType::Array;

pub(crate) const JAVA_LONG_TYPE: ReturnType =
    ReturnType::Primitive(jni::signature::Primitive::Long);


fn get_string_lossy(env: &mut JNIEnv, value: &JString) -> Option<String> {
    if value.is_null() {
        None
    } else {
        env.get_string(value)
            .ok()
            .map(|java_str| java_str.to_string_lossy().to_string())
    }
}
#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeNonBufferData(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
    grid_auto_rows: JString,
    grid_auto_columns: JString,
    grid_column: JString,
    grid_column_start: JString,
    grid_column_end: JString,
    grid_row: JString,
    grid_row_start: JString,
    grid_row_end: JString,
    grid_template_rows: JString,
    grid_template_columns: JString,
    grid_area: JString,
    grid_template_areas: JString,
) {
    if mason == 0 || node == 0 {
        return;
    }

    let env = &mut env;
    let grid_auto_rows = get_string_lossy(env, &grid_auto_rows);
    let grid_auto_columns = get_string_lossy(env, &grid_auto_columns);

    let grid_column = get_string_lossy(env, &grid_column);
    let grid_column_start = get_string_lossy(env, &grid_column_start);
    let grid_column_end = get_string_lossy(env, &grid_column_end);

    let grid_row = get_string_lossy(env, &grid_row);
    let grid_row_start = get_string_lossy(env, &grid_row_start);
    let grid_row_end = get_string_lossy(env, &grid_row_end);


    let grid_template_rows = get_string_lossy(env, &grid_template_rows);
    let grid_template_columns = get_string_lossy(env, &grid_template_columns);

    let grid_area = get_string_lossy(env, &grid_area);
    let grid_template_areas = get_string_lossy(env, &grid_template_areas);



    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let old = mason.get_device_scale();
        mason.with_style_mut(node.id().into(), |style| {
            if let Some(grid_template_rows) = grid_template_rows.as_deref() {
                style.set_grid_template_columns_css(grid_template_rows);
            }

            if let Some(grid_template_columns) = grid_template_columns.as_deref() {
                style.set_grid_template_columns_css(grid_template_columns);
            }

            if let Some(grid_auto_rows) = grid_auto_rows.as_deref() {
                style.set_grid_auto_rows_css(grid_auto_rows);
            }

            if let Some(grid_auto_columns) = grid_auto_columns.as_deref() {
                style.set_grid_auto_columns_css(grid_auto_columns);
            }


            if let Some(grid_row) = grid_row.as_deref() {
                style.set_grid_row_css(grid_row)
            }

            if let Some(start) = grid_row_start.as_deref() {
                style.set_grid_row_start_css(start)
            }

            if let Some(end) = grid_row_end.as_deref() {
                style.set_grid_row_start_css(end)
            }

            if let Some(grid_column) = grid_column.as_deref() {
                style.set_grid_column_css(grid_column)
            }

            if let Some(start) = grid_column_start.as_deref() {
                style.set_grid_column_start_css(start)
            }

            if let Some(end) = grid_column_end.as_deref() {
                style.set_grid_column_start_css(end)
            }

            if let Some(areas) = grid_template_areas.as_deref() {
                style.set_grid_template_areas_css(areas)
            }

            if let Some(columns) = grid_template_columns.as_deref() {
                style.set_grid_template_columns_css(columns);
            }

            if let Some(rows) = grid_template_rows.as_deref() {
                style.set_grid_template_rows_css(rows);
            }

            if let Some(area) = grid_area.as_deref() {
                style.set_grid_area(area);
            }

        })
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeUpdateWithValues(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
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
    grid_auto_rows: JString,
    grid_auto_columns: JString,
    grid_auto_flow: jint,
    grid_column: JString,
    grid_column_start: JString,
    grid_column_end: JString,
    grid_row: JString,
    grid_row_start: JString,
    grid_row_end: JString,
    grid_template_rows: JString,
    grid_template_columns: JString,
    overflow_x: jint,
    overflow_y: jint,
    scrollbar_width: jfloat,
    text_align: jint,
    box_sizing: jint,
    grid_area: JString,
    grid_template_areas: JString,
) {
    if mason == 0 || node == 0 {
        return;
    }

    let env = &mut env;

    unsafe {
        let grid_auto_rows = get_string_lossy(env, &grid_auto_rows);
        let grid_auto_columns = get_string_lossy(env, &grid_auto_columns);

        let grid_column = get_string_lossy(env, &grid_column);
        let grid_column_start = get_string_lossy(env, &grid_column_start);
        let grid_column_end = get_string_lossy(env, &grid_column_end);

        let grid_row = get_string_lossy(env, &grid_row);
        let grid_row_start = get_string_lossy(env, &grid_row_start);
        let grid_row_end = get_string_lossy(env, &grid_row_end);


        let grid_template_rows = get_string_lossy(env, &grid_template_rows);
        let grid_template_columns = get_string_lossy(env, &grid_template_columns);

        let grid_area = get_string_lossy(env, &grid_area);
        let grid_template_areas = get_string_lossy(env, &grid_template_areas);

        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.with_style_mut(node.id(), |style|{
            mason_core::style::utils::update_from_ffi(
                style,
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
                grid_auto_rows.as_deref(),
                grid_auto_columns.as_deref(),
                grid_auto_flow,
                grid_column.as_deref(),
                grid_column_start.as_deref(),
                grid_column_end.as_deref(),
                grid_row.as_deref(),
                grid_row_start.as_deref(),
                grid_row_end.as_deref(),
                grid_template_rows.as_deref(),
                grid_template_columns.as_deref(),
                overflow_x,
                overflow_y,
                scrollbar_width,
                text_align,
                box_sizing,
                grid_area.as_deref(),
                grid_template_areas.as_deref(),
            );
        });
    }
}

#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn nativeGetStyleBuffer(
    _: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jni::sys::jobject {
    if mason == 0 || node == 0 {
        return JObject::null().into_raw();
    }
    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &mut *(node as *mut NodeRef);

        let buffer = mason.style_data(node.id());

        if buffer.is_null() {
            return JObject::null().into_raw();
        }

        buffer.as_raw()
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridArea(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            return mason_core::utils::get_grid_area(style.get_grid_row(), style.get_grid_column())
                .and_then(|area| env.new_string(area).ok())
                .map(|value| value.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridTemplateAreas(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);

        if let Some(style) = mason.style(node.id()) {
            return env
                .new_string(style.get_grid_template_areas_css())
                .map(|area| area.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}


#[no_mangle]
pub extern "system" fn StyleNativeGetGridAutoRows(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            return style.get_grid_auto_rows_css()
                .and_then(|area| env.new_string(area).ok())
                .map(|value| value.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}


#[no_mangle]
pub extern "system" fn StyleNativeGetGridAutoColumns(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            return style.get_grid_auto_columns_css()
                .and_then(|area| env.new_string(area).ok())
                .map(|value| value.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridColumn(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            return style.get_grid_column_css()
                .and_then(|value| env.new_string(value).ok())
                .map(|value| value.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridColumnStart(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            let line = style.get_grid_column_start_css();
            if line.is_empty() {
                return 0 as _;
            }
            return
                env.new_string(line).ok()
                    .map(|value| value.into_raw())
                    .unwrap_or(0 as _);
        }

        0 as _
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridColumnEnd(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            let line = style.get_grid_column_end_css();
            if line.is_empty() {
                return 0 as _;
            }
            return
                env.new_string(line).ok()
                    .map(|value| value.into_raw())
                    .unwrap_or(0 as _);
        }

        0 as _
    }
}




#[no_mangle]
pub extern "system" fn StyleNativeGetGridRow(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            return style.get_grid_row_css()
                .and_then(|value| env.new_string(value).ok())
                .map(|value| value.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridRowStart(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            let line = style.get_grid_row_start_css();
            if line.is_empty() {
                return 0 as _;
            }
            return
                env.new_string(line).ok()
                    .map(|value| value.into_raw())
                    .unwrap_or(0 as _);
        }

        0 as _
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridRowEnd(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            let line = style.get_grid_row_end_css();
            if line.is_empty() {
                return 0 as _;
            }
            return
                env.new_string(line).ok()
                    .map(|value| value.into_raw())
                    .unwrap_or(0 as _);
        }

        0 as _
    }
}


#[no_mangle]
pub extern "system" fn StyleNativeGetGridTemplateRows(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            return style.get_grid_template_rows_css()
                .and_then(|value| env.new_string(value).ok())
                .map(|value| value.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeGetGridTemplateColumns(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) -> jstring {
    if mason == 0 || node == 0 {
        return 0 as _;
    }

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        let node = &*(node as *const NodeRef);
        if let Some(style) = mason.style(node.id()) {
            return style.get_grid_template_columns_css()
                .and_then(|value| env.new_string(value).ok())
                .map(|value| value.into_raw())
                .unwrap_or(0 as _);
        }

        0 as _
    }
}