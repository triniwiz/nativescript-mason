//! Repro for the WebSpec-list row overflow: a flex row (dot + flexGrow/flexShrink
//! nowrap-ellipsis label + status text) where the label's un-wrapped intrinsic
//! width (~550, standing in for a 74-char fixture name) is much larger than the
//! row's available width (350). `min-width: 0` is explicitly set on the label,
//! so per spec its automatic minimum size must be 0, not its content size —
//! it should shrink to fit, not force the row to overflow.

use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::{Dimension, Display, LengthPercentage};

extern "C" fn always_wide_measure(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    _avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    // Simulates `white-space: nowrap`: the text measure ignores available
    // width entirely and always reports its full unwrapped intrinsic size.
    let w = if known_w > 0.0 { known_w } else { 550.0_f32 };
    let h = if known_h > 0.0 { known_h } else { 16.0_f32 };
    MeasureOutput::make(w, h)
}

extern "C" fn status_measure(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    _avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    let w = if known_w > 0.0 { known_w } else { 30.0_f32 };
    let h = if known_h > 0.0 { known_h } else { 16.0_f32 };
    MeasureOutput::make(w, h)
}

#[test]
fn nowrap_label_with_min_width_zero_shrinks_to_fit_row() {
    let mut mason = Mason::new();

    let row = mason.create_node();
    let row_id = row.id();
    mason.with_style_mut(row_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(taffy::style::FlexDirection::Row);
        s.set_size(taffy::geometry::Size {
            width: Dimension::length(350.0),
            height: Dimension::auto(),
        });
    });

    // Status dot, fixed 8x8 with 10px right margin.
    let dot = mason.create_node();
    let dot_id = dot.id();
    mason.with_style_mut(dot_id, |s| {
        s.set_size(taffy::geometry::Size {
            width: Dimension::length(8.0),
            height: Dimension::length(8.0),
        });
        s.set_margin(Rect {
            left: LengthPercentage::length(0.0).into(),
            right: LengthPercentage::length(10.0).into(),
            top: LengthPercentage::length(0.0).into(),
            bottom: LengthPercentage::length(0.0).into(),
        });
    });

    // The nowrap+ellipsis label: flexGrow:1, flexShrink:1, minWidth:0 (explicit).
    let label = mason.create_text_node();
    let label_id = label.id();
    mason.with_style_mut(label_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_shrink(1.0);
        s.set_min_size(taffy::geometry::Size {
            width: Dimension::length(0.0),
            height: Dimension::auto(),
        });
    });
    mason.set_measure(label_id, Some(always_wide_measure), std::ptr::null_mut());

    // Trailing status text ("pass"/"fail"), fixed-ish small width, flexShrink:0.
    let status = mason.create_text_node();
    let status_id = status.id();
    mason.with_style_mut(status_id, |s| {
        s.set_flex_shrink(0.0);
        s.set_margin(Rect {
            left: LengthPercentage::length(6.0).into(),
            right: LengthPercentage::length(0.0).into(),
            top: LengthPercentage::length(0.0).into(),
            bottom: LengthPercentage::length(0.0).into(),
        });
    });
    mason.set_measure(status_id, Some(status_measure), std::ptr::null_mut());

    mason.append_node(row_id, &[dot_id, label_id, status_id]);

    mason.compute_wh(row_id, 350.0, f32::NAN);

    let row_l = mason.layout_raw(row_id);
    let dot_l = mason.layout_raw(dot_id);
    let label_l = mason.layout_raw(label_id);
    let status_l = mason.layout_raw(status_id);

    eprintln!("row:    size={:?}", row_l.size);
    eprintln!("dot:    size={:?} loc={:?}", dot_l.size, dot_l.location);
    eprintln!("label:  size={:?} loc={:?}", label_l.size, label_l.location);
    eprintln!("status: size={:?} loc={:?}", status_l.size, status_l.location);

    let label_right_edge = label_l.location.x + label_l.size.width;
    let status_right_edge = status_l.location.x + status_l.size.width;

    assert!(
        label_right_edge <= row_l.size.width + 0.5,
        "label right edge {} overflows row width {} (min-width:0 should let it shrink below its 550 intrinsic content size)",
        label_right_edge,
        row_l.size.width
    );
    assert!(
        status_right_edge <= row_l.size.width + 0.5,
        "status right edge {} overflows row width {}",
        status_right_edge,
        row_l.size.width
    );
}
