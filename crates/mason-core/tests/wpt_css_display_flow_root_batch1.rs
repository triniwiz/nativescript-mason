use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;

extern "C" fn measure_250x100(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(250.0, 100.0)
}

// Ported from css-display/display-flow-root-002.html
#[test]
fn flow_root_zero_width_not_intersect_floats() {
    let mut mason = Mason::new();

    let outer = mason.create_node();
    let rid = outer.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(400.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    // right float
    let right = mason.create_node();
    let rid_f = right.id();
    mason.set_measure(rid_f, Some(measure_250x100), std::ptr::null_mut());
    mason.with_style_mut(rid_f, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_float(Float::Right);
    });

    // left float
    let left = mason.create_node();
    let lid_f = left.id();
    mason.set_measure(lid_f, Some(measure_250x100), std::ptr::null_mut());
    mason.with_style_mut(lid_f, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_float(Float::Left);
    });

    // zero-width flow-root: simulate with overflow:auto to establish BFC
    let flow = mason.create_node();
    let fid = flow.id();
    mason.with_style_mut(fid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Auto,
            y: mason_core::style::Overflow::Auto,
        });
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(0.0),
            height: taffy::style::Dimension::length(200.0),
        });
    });

    mason.append_node(rid, &[rid_f, lid_f, fid]);

    mason.compute_wh(rid, 400.0, f32::NAN);

    let flow_layout = mason.layout_raw(fid);
    let floats = mason.get_float_rects_with_nodes(rid);

    // Ensure no float rect intersects the flow-root rect horizontally
    for (node, left_f, _top, right_f, _bottom) in floats.iter() {
        let flow_left = flow_layout.location.x;
        let flow_right = flow_left + flow_layout.size.width;
        assert!(
            *right_f <= flow_left || *left_f >= flow_right,
            "flow-root should not intersect float {:?} (float L={} R={} flow L={} R={})",
            node,
            left_f,
            right_f,
            flow_left,
            flow_right
        );
    }
}
