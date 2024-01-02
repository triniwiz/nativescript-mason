use std::borrow::Cow;
use std::ffi::c_void;

use taffy::geometry::Point;
use taffy::prelude::*;
use taffy::style::Overflow;

use crate::style::Style;
use crate::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, display_from_enum, display_to_enum,
    flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum, flex_wrap_to_enum,
    grid_auto_flow_from_enum, grid_auto_flow_to_enum, justify_content_from_enum,
    justify_content_to_enum, overflow_from_enum, overflow_to_enum, position_from_enum,
    position_to_enum, Mason, Node, Rect, Size,
};

pub fn assert_pointer_address(pointer: *const c_void, pointer_type: &str) {
    assert_ne!(
        pointer,
        std::ptr::null(),
        "Invalid {:} pointer address",
        pointer_type
    );
}

pub fn style_set_align_items(style: *mut c_void, value: i32) {
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        if value == -1 {
            style.set_align_items(None);
        } else if let Some(enum_value) = align_items_from_enum(value) {
            style.set_align_items(Some(enum_value));
        }
        Box::leak(style);
    }
}

pub fn style_get_align_items(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = if let Some(value) = style.align_items() {
            align_items_to_enum(value)
        } else {
            -1
        };

        Box::leak(style);

        ret
    }
}

pub fn style_get_align_self(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = if let Some(value) = style.align_self() {
            align_self_to_enum(value)
        } else {
            -1
        };

        Box::leak(style);

        ret
    }
}

pub fn style_set_align_self(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        if value == -1 {
            style.set_align_self(None);
        } else if let Some(enum_value) = align_self_from_enum(value) {
            style.set_align_self(Some(enum_value));
        }
        Box::leak(style);
    }
}

pub fn style_get_align_content(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = if let Some(value) = style.align_content() {
            align_content_to_enum(value)
        } else {
            -1
        };

        Box::leak(style);

        ret
    }
}

pub fn style_set_align_content(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        if value == -1 {
            style.set_align_content(None);
        } else if let Some(enum_value) = align_content_from_enum(value) {
            style.set_align_content(Some(enum_value));
        }

        Box::leak(style);
    }
}

pub fn style_set_justify_items(style: *mut c_void, value: i32) {
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        if value == -1 {
            style.set_justify_items(None);
        } else if let Some(enum_value) = align_items_from_enum(value) {
            style.set_justify_items(Some(enum_value));
        }
        Box::leak(style);
    }
}

pub fn style_get_justify_items(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = if let Some(value) = style.justify_items() {
            align_items_to_enum(value)
        } else {
            -1
        };

        Box::leak(style);

        ret
    }
}

pub fn style_get_justify_self(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = if let Some(value) = style.justify_self() {
            align_self_to_enum(value)
        } else {
            -1
        };

        Box::leak(style);

        ret
    }
}

pub fn style_set_justify_self(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        if value == -1 {
            style.set_justify_self(None);
        } else if let Some(enum_value) = align_self_from_enum(value) {
            style.set_justify_self(Some(enum_value));
        }
        Box::leak(style);
    }
}

pub fn style_get_justify_content(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = if let Some(value) = style.justify_content() {
            justify_content_to_enum(value)
        } else {
            -1
        };

        Box::leak(style);

        ret
    }
}

pub fn style_set_justify_content(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        if value == -1 {
            style.set_justify_content(None);
        } else if let Some(enum_value) = justify_content_from_enum(value) {
            style.set_justify_content(Some(enum_value));
        }

        Box::leak(style);
    }
}

pub fn style_set_display(style: *mut c_void, display: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        if let Some(display) = display_from_enum(display) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_display(display);
            Box::leak(style);
        }
    }
}

pub fn style_get_display(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let display = display_to_enum(style.display());

        Box::leak(style);

        display
    }
}

pub fn style_get_position(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let position = position_to_enum(style.position());

        Box::leak(style);

        position
    }
}

pub fn style_set_position(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");
    unsafe {
        if let Some(position) = position_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_position(position);
            Box::leak(style);
        }
    }
}

pub fn style_set_flex_direction(style: *mut c_void, direction: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        if let Some(value) = flex_direction_from_enum(direction) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_flex_direction(value);
            Box::leak(style);
        }
    }
}

pub fn style_get_flex_direction(style: *mut c_void) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let position = flex_direction_to_enum(style.flex_direction());

        Box::leak(style);

        position
    }
}

pub fn style_get_flex_wrap(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let wrap = flex_wrap_to_enum(style.flex_wrap());

        Box::leak(style);

        wrap
    }
}

pub fn style_set_flex_wrap(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");
    unsafe {
        if let Some(flex_wrap) = flex_wrap_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_flex_wrap(flex_wrap);
            Box::leak(style);
        }
    }
}

pub fn style_set_inset(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<LengthPercentageAuto>::from_len_auto(value);
    style.set_inset(rect);
    Box::leak(style);
}

pub fn style_set_inset_lrtb(
    style: *mut c_void,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    style.set_inset_lrtb(left, right, top, bottom);
    Box::leak(style);
}

pub fn style_get_inset_left(style: *mut c_void) -> LengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_left();

        Box::leak(style);

        ret
    }
}

pub fn style_set_inset_left(style: *const c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_left(value);

        Box::leak(style);
    }
}

pub fn style_get_inset_right(style: *const c_void) -> LengthPercentageAuto {
    assert_pointer_address(style as _, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_right();

        Box::leak(style);

        ret
    }
}

pub fn style_set_inset_right(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style as _, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_right(value);

        Box::leak(style);
    }
}

pub fn style_get_inset_top(style: *const c_void) -> LengthPercentageAuto {
    assert_pointer_address(style as _, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_top();

        Box::leak(style);

        ret
    }
}

pub fn style_set_inset_top(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style as _, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_top(value);

        Box::leak(style);
    }
}

pub fn style_get_inset_bottom(style: *const c_void) -> LengthPercentageAuto {
    assert_pointer_address(style as _, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_bottom();

        Box::leak(style);

        ret
    }
}

pub fn style_set_inset_bottom(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style as _, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_bottom(value);

        Box::leak(style);
    }
}

pub fn style_set_margin(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<LengthPercentageAuto>::from_len_auto(value);
    style.set_margin(rect);
    Box::leak(style);
}

pub fn style_set_margin_lrtb(
    style: *mut c_void,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    style.set_margin_lrtb(left, right, top, bottom);
    Box::leak(style);
}

pub fn style_get_margin_left(style: *const c_void) -> LengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_left();

        Box::leak(style);

        ret
    }
}

pub fn style_set_margin_left(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_left(value);

        Box::leak(style);
    }
}

pub fn style_get_margin_right(style: *const c_void) -> LengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_right();

        Box::leak(style);

        ret
    }
}

pub fn style_set_margin_right(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_right(value);

        Box::leak(style);
    }
}

pub fn style_get_margin_top(style: *const c_void) -> LengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_top();

        Box::leak(style);

        ret
    }
}

pub fn style_set_margin_top(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_top(value);

        Box::leak(style);
    }
}

pub fn style_get_margin_bottom(style: *const c_void) -> LengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_bottom();

        Box::leak(style);

        ret
    }
}

pub fn style_set_margin_bottom(style: *mut c_void, value: LengthPercentageAuto) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_bottom(value);

        Box::leak(style);
    }
}

pub fn style_set_border(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<LengthPercentage>::from_len(value);
    style.set_border(rect);
    Box::leak(style);
}

pub fn style_set_border_lrtb(
    style: *mut c_void,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    style.set_border_lrtb(left, right, top, bottom);
    Box::leak(style);
}

pub fn style_get_border_left(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_left();

        Box::leak(style);

        ret
    }
}

pub fn style_set_border_left(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_left(value);

        Box::leak(style);
    }
}

pub fn style_get_border_right(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_right();

        Box::leak(style);

        ret
    }
}

pub fn style_set_border_right(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_right(value);

        Box::leak(style);
    }
}

pub fn style_get_border_top(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_top();

        Box::leak(style);

        ret
    }
}

pub fn style_set_border_top(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_top(value);

        Box::leak(style);
    }
}

pub fn style_get_border_bottom(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_bottom();

        Box::leak(style);

        ret
    }
}

pub fn style_set_border_bottom(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_bottom(value);

        Box::leak(style);
    }
}

pub fn style_set_flex_grow(style: *mut c_void, grow: f32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_grow(grow);

        Box::leak(style);
    }
}

pub fn style_get_flex_grow(style: *const c_void) -> f32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_grow();

        Box::leak(style);

        ret
    }
}

pub fn style_set_flex_shrink(style: *mut c_void, shrink: f32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_shrink(shrink);

        Box::leak(style);
    }
}

pub fn style_get_flex_shrink(style: *const c_void) -> f32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_shrink();

        Box::leak(style);

        ret
    }
}

pub fn style_get_flex_basis(style: *const c_void) -> Dimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_basis();

        Box::leak(style);

        ret
    }
}

pub fn style_set_flex_basis(style: *mut c_void, value: Dimension) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_basis(value);

        Box::leak(style);
    }
}

pub fn style_get_gap(style: *const c_void) -> Size<LengthPercentage> {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.gap();

        Box::leak(style);

        ret
    }
}

pub fn style_set_gap(style: *mut c_void, width: LengthPercentage, height: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        let size = Size::<LengthPercentage>::new_with_len(width, height);

        style.set_gap(size);

        Box::leak(style);
    }
}

pub fn style_get_row_gap(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_row_gap();

        Box::leak(style);

        ret
    }
}

pub fn style_set_row_gap(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_row_gap(value);

        Box::leak(style);
    }
}

pub fn style_get_column_gap(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_column_gap();

        Box::leak(style);

        ret
    }
}

pub fn style_set_column_gap(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_column_gap(value);

        Box::leak(style);
    }
}

pub fn style_set_aspect_ratio(style: *mut c_void, ratio: f32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        if ratio.is_nan() {
            style.set_aspect_ratio(None);
        } else {
            style.set_aspect_ratio(Some(ratio));
        }

        Box::leak(style);
    }
}

pub fn style_get_aspect_ratio(style: *const c_void) -> f32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.aspect_ratio().unwrap_or(f32::NAN);

        Box::leak(style);

        ret
    }
}

pub fn style_set_padding(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<LengthPercentage>::from_len(value);
    style.set_padding(rect);
    Box::leak(style);
}

pub fn style_set_padding_lrtb(
    style: *mut c_void,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    style.set_padding_lrtb(left, right, top, bottom);
    Box::leak(style);
}

pub fn style_get_padding_left(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_left();

        Box::leak(style);

        ret
    }
}

pub fn style_set_padding_left(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_left(value);

        Box::leak(style);
    }
}

pub fn style_get_padding_right(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_right();

        Box::leak(style);

        ret
    }
}

pub fn style_set_padding_right(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_right(value);

        Box::leak(style);
    }
}

pub fn style_get_padding_top(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_top();

        Box::leak(style);

        ret
    }
}

pub fn style_set_padding_top(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_top(value);

        Box::leak(style);
    }
}

pub fn style_get_padding_bottom(style: *const c_void) -> LengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_bottom();

        Box::leak(style);

        ret
    }
}

pub fn style_set_padding_bottom(style: *mut c_void, value: LengthPercentage) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_bottom(value);

        Box::leak(style);
    }
}

pub fn style_get_min_width(style: *const c_void) -> Dimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_min_size_width();

        Box::leak(style);

        ret
    }
}

pub fn style_set_min_width(style: *mut c_void, value: Dimension) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_width(value);

        Box::leak(style);
    }
}

pub fn style_get_min_height(style: *const c_void) -> Dimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_min_size_height();

        Box::leak(style);

        ret
    }
}

pub fn style_set_min_height(style: *mut c_void, value: Dimension) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_height(value);

        Box::leak(style);
    }
}

pub fn style_get_max_width(style: *const c_void) -> Dimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_max_size_width();

        Box::leak(style);

        ret
    }
}

pub fn style_set_max_width(style: *mut c_void, value: Dimension) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_width(value);

        Box::leak(style);
    }
}

pub fn style_get_max_height(style: *const c_void) -> Dimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_max_size_height();

        Box::leak(style);

        ret
    }
}

pub fn style_set_max_height(style: *mut c_void, value: Dimension) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_height(value);

        Box::leak(style);
    }
}

pub fn style_get_grid_auto_rows(style: *const c_void) -> Vec<NonRepeatedTrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_auto_rows().to_vec();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_auto_rows(style: *mut c_void, value: Vec<NonRepeatedTrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_auto_rows(value);

        Box::leak(style);
    }
}

pub fn style_get_grid_auto_columns(style: *const c_void) -> Vec<NonRepeatedTrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_auto_columns().to_vec();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_auto_columns(style: *mut c_void, value: Vec<NonRepeatedTrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_auto_columns(value);

        Box::leak(style);
    }
}

pub fn style_get_grid_auto_flow(style: *const c_void) -> i32 {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = grid_auto_flow_to_enum(style.get_grid_auto_flow());

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_auto_flow(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");
    unsafe {
        if let Some(value) = grid_auto_flow_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_grid_auto_flow(value);

            Box::leak(style);
        }
    }
}

pub fn style_set_grid_area(
    style: *mut c_void,
    row_start: GridPlacement,
    row_end: GridPlacement,
    column_start: GridPlacement,
    column_end: GridPlacement,
) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_row(Line {
            start: row_start,
            end: row_end,
        });

        style.set_grid_column(Line {
            start: column_start,
            end: column_end,
        });

        Box::leak(style);
    }
}

pub fn style_set_grid_column(style: *mut c_void, start: GridPlacement, end: GridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_column(Line { start, end });

        Box::leak(style);
    }
}

pub fn style_get_grid_column_start(style: *const c_void) -> GridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_column_start();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_column_start(style: *mut c_void, value: GridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_column_start(value);

        Box::leak(style);
    }
}

pub fn style_get_grid_column_end(style: *const c_void) -> GridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_column_end();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_column_end(style: *mut c_void, value: GridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_column_end(value);

        Box::leak(style);
    }
}

pub fn style_set_grid_row(style: *mut c_void, start: GridPlacement, end: GridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_row(Line { start, end });

        Box::leak(style);
    }
}

pub fn style_get_grid_row_start(style: *const c_void) -> GridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_row_start();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_row_start(style: *mut c_void, value: GridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_row_start(value);

        Box::leak(style);
    }
}

pub fn style_get_grid_row_end(style: *const c_void) -> GridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_row_end();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_row_end(style: *mut c_void, value: GridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_row_end(value);

        Box::leak(style);
    }
}

pub fn style_get_grid_template_rows(style: *const c_void) -> Vec<TrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_template_rows().to_vec();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_template_rows(style: *mut c_void, value: Vec<TrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_template_rows(value);

        Box::leak(style);
    }
}

pub fn style_get_grid_template_columns(style: *const c_void) -> Vec<TrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_template_columns().to_vec();

        Box::leak(style);

        ret
    }
}

pub fn style_set_grid_template_columns(style: *mut c_void, value: Vec<TrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_template_columns(value);

        Box::leak(style);
    }
}

pub fn style_set_width(style: *mut c_void, value: Dimension) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_width(value);

        Box::leak(style);
    }
}

pub fn style_get_width(style: *const c_void) -> Dimension {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let width = style.get_size_width();

        Box::leak(style);

        width
    }
}

pub fn style_set_height(style: *mut c_void, value: Dimension) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_height(value);

        Box::leak(style);
    }
}

pub fn style_get_height(style: *const c_void) -> Dimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let height = style.get_size_height();

        Box::leak(style);

        height
    }
}

pub fn style_set_scrollbar_width(style: *mut c_void, value: f32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_scrollbar_width(value);

        Box::leak(style);
    }
}

pub fn style_get_scrollbar_width(style: *const c_void) -> f32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let scrollbar_width = style.get_scrollbar_width();

        Box::leak(style);

        scrollbar_width
    }
}

pub fn style_set_overflow(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_overflow(Point {
            x: overflow_from_enum(value),
            y: overflow_from_enum(value),
        });

        Box::leak(style);
    }
}

pub fn style_get_overflow(style: *const c_void) -> taffy::geometry::Point<Overflow> {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let overflow = style.get_overflow();

        Box::leak(style);

        overflow
    }
}

pub fn style_set_overflow_x(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_overflow_x(overflow_from_enum(value));

        Box::leak(style);
    }
}

pub fn style_get_overflow_x(style: *const c_void) -> Overflow {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let overflow = style.get_overflow_x();

        Box::leak(style);

        overflow
    }
}

pub fn style_set_overflow_y(style: *mut c_void, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_overflow_y(overflow_from_enum(value));

        Box::leak(style);
    }
}

pub fn style_get_overflow_y(style: *const c_void) -> Overflow {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let overflow = style.get_overflow_y();

        Box::leak(style);

        overflow
    }
}

pub fn node_update_and_set_style(mason: *mut c_void, node: *const c_void, style: *const c_void) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    assert_pointer_address(style, "style");

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

pub fn node_compute(mason: *mut c_void, node: *const c_void) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute(*node);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn node_compute_min_content(mason: *mut c_void, node: *const c_void) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::min_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn node_compute_max_content(mason: *mut c_void, node: *const c_void) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::max_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn node_compute_wh(mason: *mut c_void, node: *const c_void, width: f32, height: f32) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute_wh(*node, width, height);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn node_mark_dirty(mason: *mut c_void, node: *const c_void) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);

        mason.mark_dirty(*node);

        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn node_dirty(mason: *const c_void, node: *const c_void) -> bool {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);

        let dirty = mason.dirty(*node);

        Box::leak(mason);
        Box::leak(node);
        dirty
    }
}

const AUTO: &str = "auto";
const MIN_CONTENT: &str = "min-content";
const MAX_CONTENT: &str = "max-content";
const FIT_CONTENT: &str = "fit-content";
const FLEX_UNIT: &str = "fr";
pub fn parse_non_repeated_track_sizing_function_value<'a>(
    value: NonRepeatedTrackSizingFunction,
) -> Cow<'a, str> {
    if let (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::Auto) = (value.min, value.max) {
        AUTO.into()
    } else if let (MinTrackSizingFunction::MinContent, MaxTrackSizingFunction::MinContent) = (value.min, value.max) {
        MIN_CONTENT.into()
    } else if let (MinTrackSizingFunction::MaxContent, MaxTrackSizingFunction::MaxContent) = (value.min, value.max) {
        MAX_CONTENT.into()
    } else if let (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::FitContent(value)) = (value.min, value.max) {
        match value {
            LengthPercentage::Length(value) => format!("fit-content({:.0}px)", value).into(),
            LengthPercentage::Percent(value) => format!("fit-content({:.3}%)", value).into(),
        }
    } else if let (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::Fraction(value)) = (value.min, value.max) {
        (value.to_string() + FLEX_UNIT).into()
    } else if let (min, max) = (value.min, value.max) {
        format!(
            "minmax({}, {})",
            Cow::from(match min {
                MinTrackSizingFunction::Fixed(value) => {
                    return match value {
                        LengthPercentage::Length(value) => format!("{}px", value),
                        LengthPercentage::Percent(value) => format!("{}%", value),
                    }
                        .into();
                }
                MinTrackSizingFunction::MinContent => MIN_CONTENT,
                MinTrackSizingFunction::MaxContent => MAX_CONTENT,
                MinTrackSizingFunction::Auto => AUTO,
            }),
            Cow::from(match max {
                MaxTrackSizingFunction::Fixed(value) => {
                    return match value {
                        LengthPercentage::Length(value) => format!("{}px", value),
                        LengthPercentage::Percent(value) => format!("{}%", value),
                    }
                        .into();
                }
                MaxTrackSizingFunction::MinContent => MIN_CONTENT,
                MaxTrackSizingFunction::MaxContent => MAX_CONTENT,
                MaxTrackSizingFunction::FitContent(_) => panic!(), // invalid should not hit here
                MaxTrackSizingFunction::Auto => AUTO,
                MaxTrackSizingFunction::Fraction(value) => {
                    return format!("{value}fr", ).into();
                }
            })
        )
            .into()
    } else {
        unreachable!()
    }
}

pub fn parse_track_sizing_function_value(value: &TrackSizingFunction) -> String {
    let mut ret = String::new();
    match value {
        TrackSizingFunction::Single(value) => {
            let parsed = parse_non_repeated_track_sizing_function_value(*value);
            ret.push_str(parsed.as_ref())
        }
        TrackSizingFunction::Repeat(grid_track_repetition, values) => {
            ret.push_str("repeat(");
            match *grid_track_repetition {
                GridTrackRepetition::AutoFill => {
                    ret.push_str("auto-fill");
                }
                GridTrackRepetition::AutoFit => {
                    ret.push_str("auto-fit");
                }
                GridTrackRepetition::Count(count) => ret.push_str(&format!("{count}")),
            }

            for (j, inner_val) in values.iter().enumerate() {
                let parsed = parse_non_repeated_track_sizing_function_value(*inner_val);

                if j != 0 {
                    ret.push(' ');
                }

                ret.push_str(parsed.as_ref())
            }

            ret.push(')');
        }
    }

    ret
}
