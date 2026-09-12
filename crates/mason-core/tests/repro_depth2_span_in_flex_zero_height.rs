//! Repro for "DEPTH-2 span text blank on iOS": a plain block `<div>` whose sole
//! child is inline text (a `<span>`) renders fine when the div is a normal
//! block child, but when the SAME div is instead a flex item (child of a
//! `display:flex` row/column), the span's own computed height collapses to 0
//! even though the div's own box still gets a correct height. A 0-height leaf
//! draws nothing on iOS (frame height applied verbatim); Android happens to
//! mask it because its native TextView self-sizes via WRAP_CONTENT.

use mason_core::*;
use mason_core::style::DisplayMode;
use taffy::style::{Dimension, Display, FlexDirection};

extern "C" fn span_measure(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    _avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    let w = if known_w > 0.0 { known_w } else { 200.0_f32 };
    let h = if known_h > 0.0 { known_h } else { 18.0_f32 };
    MeasureOutput::make(w, h)
}

fn build_middle_plus_span(mason: &mut Mason) -> (Id, Id) {
    let middle = mason.create_node();
    let middle_id = middle.id();
    mason.with_style_mut(middle_id, |s| {
        s.set_display(Display::Block);
    });

    let span = mason.create_text_node();
    let span_id = span.id();
    mason.with_style_mut(span_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.set_measure(span_id, Some(span_measure), std::ptr::null_mut());

    mason.append_node(middle_id, &[span_id.into()]);
    (middle_id, span_id)
}

#[test]
fn span_in_plain_div_as_direct_block_child_gets_nonzero_height() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Block);
        s.set_size(taffy::geometry::Size {
            width: Dimension::length(400.0),
            height: Dimension::auto(),
        });
    });

    let (middle_id, span_id) = build_middle_plus_span(&mut mason);
    mason.append_node(root_id, &[middle_id.into()]);

    mason.compute_wh(root_id, 400.0, f32::NAN);

    let middle_l = mason.layout_raw(middle_id.into());
    let span_l = mason.layout_raw(span_id.into());
    eprintln!("DEPTH-1-equivalent: middle={:?} span={:?}", middle_l.size, span_l.size);

    assert!(middle_l.size.height > 0.0, "middle div height should be > 0, got {}", middle_l.size.height);
    assert!(span_l.size.height > 0.0, "span height should be > 0, got {}", span_l.size.height);
}

#[test]
fn span_in_plain_div_as_flex_row_item_gets_nonzero_height() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_size(taffy::geometry::Size {
            width: Dimension::length(400.0),
            height: Dimension::auto(),
        });
    });

    let (middle_id, span_id) = build_middle_plus_span(&mut mason);
    mason.append_node(root_id, &[middle_id.into()]);

    mason.compute_wh(root_id, 400.0, f32::NAN);

    let middle_l = mason.layout_raw(middle_id.into());
    let span_l = mason.layout_raw(span_id.into());
    eprintln!("DEPTH-2-ROW-equivalent: middle={:?} span={:?}", middle_l.size, span_l.size);

    assert!(middle_l.size.height > 0.0, "middle div height should be > 0, got {}", middle_l.size.height);
    assert!(span_l.size.height > 0.0, "span height should be > 0, got {} (this is the DEPTH-2 bug)", span_l.size.height);
}

#[test]
fn span_in_plain_div_as_flex_column_item_gets_nonzero_height() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_size(taffy::geometry::Size {
            width: Dimension::length(400.0),
            height: Dimension::auto(),
        });
    });

    let (middle_id, span_id) = build_middle_plus_span(&mut mason);
    mason.append_node(root_id, &[middle_id.into()]);

    mason.compute_wh(root_id, 400.0, f32::NAN);

    let middle_l = mason.layout_raw(middle_id.into());
    let span_l = mason.layout_raw(span_id.into());
    eprintln!("DEPTH-2-COLUMN-equivalent: middle={:?} span={:?}", middle_l.size, span_l.size);

    assert!(middle_l.size.height > 0.0, "middle div height should be > 0, got {}", middle_l.size.height);
    assert!(span_l.size.height > 0.0, "span height should be > 0, got {} (this is the DEPTH-2 bug)", span_l.size.height);
}
