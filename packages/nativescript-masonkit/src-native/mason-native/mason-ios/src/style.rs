use std::ffi::{c_float, c_int, c_void};
use mason_core::style::Style;


#[no_mangle]
pub extern "C" fn mason_style_init() -> *mut c_void {
    Style::default().into_raw() as _
}

#[no_mangle]
pub extern "C" fn mason_style_destroy(style: *mut c_void) {
    if style.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(style as *mut Style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_display(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let display = match style.display() {
            mason_core::Display::Flex => 0,
            mason_core::Display::None => 1,
        };

        Box::leak(style);

        display
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_display(display: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        let display = match display {
            0 => mason_core::Display::Flex,
            1 => mason_core::Display::None,
            _ => panic!(),
        };

        style.set_display(display);
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_init_with_values(
    display: c_int,
    position_type: c_int,
    direction: c_int,
    flex_direction: c_int,
    flex_wrap: c_int,
    overflow: c_int,
    align_items: c_int,
    align_self: c_int,
    align_content: c_int,
    justify_content: c_int,
    position_left_type: c_int,
    position_left_value: c_float,
    position_right_type: c_int,
    position_right_value: c_float,
    position_top_type: c_int,
    position_top_value: c_float,
    position_bottom_type: c_int,
    position_bottom_value: c_float,
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
    flex_gap_width_type: c_int,
    flex_gap_width_value: c_float,
    flex_gap_height_type: c_int,
    flex_gap_height_value: c_float,
    aspect_ratio: c_float,
) -> *mut c_void {
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
    ))) as *mut c_void
}

#[no_mangle]
pub extern "C" fn mason_style_update_with_values(
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
    justify_content: c_int,
    position_left_type: c_int,
    position_left_value: c_float,
    position_right_type: c_int,
    position_right_value: c_float,
    position_top_type: c_int,
    position_top_value: c_float,
    position_bottom_type: c_int,
    position_bottom_value: c_float,
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
    flex_gap_width_type: c_int,
    flex_gap_width_value: c_float,
    flex_gap_height_type: c_int,
    flex_gap_height_value: c_float,
    aspect_ratio: c_float,
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
