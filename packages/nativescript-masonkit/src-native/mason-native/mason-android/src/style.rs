use jni::JNIEnv;
use jni::objects::JObject;
use jni::sys::{jfloat, jint, jlong};

use mason_core::style::Style;

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeDestroy(
    _: JNIEnv,
    _: JObject,
    style: jlong,
) {
    if style == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(style as *mut Style);
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeInit(
    _: JNIEnv,
    _: JObject,
) -> jlong {
    Style::default().into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeInitWithValues(
    _: JNIEnv,
    _: JObject,
    display: jint,
    position_type: jint,
    direction: jint,
    flex_direction: jint,
    flex_wrap: jint,
    overflow: jint,
    align_items: jint,
    align_self: jint,
    align_content: jint,
    justify_content: jint,
    position_left_type: jint,
    position_left_value: jfloat,
    position_right_type: jint,
    position_right_value: jfloat,
    position_top_type: jint,
    position_top_value: jfloat,
    position_bottom_type: jint,
    position_bottom_value: jfloat,
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
    flex_gap_width_type: jint,
    flex_gap_width_value: jfloat,
    flex_gap_height_type: jint,
    flex_gap_height_value: jfloat,
    aspect_ratio: jfloat,
) -> jlong {
    Box::into_raw(Box::new(Style::from_ffi(
        display,
        position_type,
        direction,
        flex_direction,
        flex_wrap,
        overflow,
        align_items,
        align_self,
        align_content,
        justify_content,
        position_left_type,
        position_left_value,
        position_right_type,
        position_right_value,
        position_top_type,
        position_top_value,
        position_bottom_type,
        position_bottom_value,
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
        flex_gap_width_type,
        flex_gap_width_value,
        flex_gap_height_type,
        flex_gap_height_value,
        aspect_ratio,
    ))) as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeUpdateWithValues(
    _: JNIEnv,
    _: JObject,
    style: jlong,
    display: jint,
    position_type: jint,
    direction: jint,
    flex_direction: jint,
    flex_wrap: jint,
    overflow: jint,
    align_items: jint,
    align_self: jint,
    align_content: jint,
    justify_content: jint,
    position_left_type: jint,
    position_left_value: jfloat,
    position_right_type: jint,
    position_right_value: jfloat,
    position_top_type: jint,
    position_top_value: jfloat,
    position_bottom_type: jint,
    position_bottom_value: jfloat,
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
    flex_gap_width_type: jint,
    flex_gap_width_value: jfloat,
    flex_gap_height_type: jint,
    flex_gap_height_value: jfloat,
    aspect_ratio: jfloat,
) {
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
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
            justify_content,
            position_left_type,
            position_left_value,
            position_right_type,
            position_right_value,
            position_top_type,
            position_top_value,
            position_bottom_type,
            position_bottom_value,
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
            flex_gap_width_type,
            flex_gap_width_value,
            flex_gap_height_type,
            flex_gap_height_value,
            aspect_ratio,
        );
        Box::leak(style);
    }
}

