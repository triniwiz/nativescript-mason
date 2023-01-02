use std::ffi::c_void;

use taffy::prelude::{AvailableSpace, LengthPercentageAuto};

use crate::style::Style;
use crate::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, display_from_enum, display_to_enum,
    flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum, flex_wrap_to_enum,
    justify_content_from_enum, justify_content_to_enum, position_from_enum, position_to_enum,
    Mason, Node, Rect, Size,
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
        } else {
            if let Some(enum_value) = align_self_from_enum(value) {
                style.set_align_self(Some(enum_value));
            }
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
        } else {
            if let Some(enum_value) = align_content_from_enum(value) {
                style.set_align_content(Some(enum_value));
            }
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
        } else {
            if let Some(enum_value) = align_self_from_enum(value) {
                style.set_justify_self(Some(enum_value));
            }
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

pub fn style_set_inset(style: *mut c_void, rect: Rect<LengthPercentageAuto>) {
    assert_pointer_address(style, "style");

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
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
        let size = Size::<AvailableSpace>::max_content();
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
