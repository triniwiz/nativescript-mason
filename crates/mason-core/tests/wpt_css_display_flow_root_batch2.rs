use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;
use taffy::style::Float;

extern "C" fn measure_20x40(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(20.0, 40.0)
}

extern "C" fn measure_10x10(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(10.0, 10.0)
}

// 1) Flow-root should grow to contain child floats
#[test]
fn flow_root_grows_to_fit_child_float() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(200.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    let flow = mason.create_node();
    let fid = flow.id();
    mason.with_style_mut(fid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box); // simulate flow-root
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Auto,
            y: mason_core::style::Overflow::Auto,
        });
    });

    let f = mason.create_node();
    let fid_float = f.id();
    mason.set_measure(fid_float, Some(measure_20x40), std::ptr::null_mut());
    mason.with_style_mut(fid_float, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_float(Float::Left);
    });

    mason.append_node(fid, &[fid_float]);
    mason.append_node(rid, &[fid]);

    mason.compute_wh(rid, 200.0, f32::NAN);
    let flow_layout = mason.layout_raw(fid);
    assert!(
        flow_layout.size.height + 1e-3 >= 40.0,
        "flow-root should grow to contain float"
    );
}

// 2) Float outside should not intrude into flow-root box
#[test]
fn flow_root_blocks_external_float_intrusion() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(200.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    // external float
    let float = mason.create_node();
    let fid = float.id();
    mason.set_measure(fid, Some(measure_20x40), std::ptr::null_mut());
    mason.with_style_mut(fid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_float(Float::Left);
    });

    // flow-root
    let flow = mason.create_node();
    let flow_id = flow.id();
    mason.with_style_mut(flow_id, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Auto,
            y: mason_core::style::Overflow::Auto,
        });
        s.set_border(mason_core::Rect {
            left: mason_core::LengthPercentage::length(1.0),
            right: mason_core::LengthPercentage::length(1.0),
            top: mason_core::LengthPercentage::length(1.0),
            bottom: mason_core::LengthPercentage::length(1.0),
        });
    });

    mason.append_node(rid, &[fid, flow_id]);
    mason.compute_wh(rid, 200.0, f32::NAN);

    let flow_layout = mason.layout_raw(flow_id);
    let floats = mason.get_float_rects_with_nodes(rid);
    for (_id, left_f, _top, right_f, _bottom) in floats.iter() {
        let f_left = *left_f;
        let f_right = *right_f;
        let flow_left = flow_layout.location.x;
        let flow_right = flow_left + flow_layout.size.width;
        assert!(
            f_right <= flow_left || f_left >= flow_right,
            "external float should not intrude into flow-root"
        );
    }
}

// 3) Flow-root in inline split should still produce a flow-root box
#[test]
fn flow_root_in_inline_split_creates_box() {
    let mut mason = Mason::new();

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let flow = mason.create_node();
    let fid = flow.id();
    mason.with_style_mut(fid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Auto,
            y: mason_core::style::Overflow::Auto,
        });
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_10x10), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.append_node(fid, &[cid]);
    mason.set_segments(
        pid,
        vec![InlineSegment::InlineChild {
            id: Some(fid),
            baseline: 0.0,
        }],
    );
    mason.append_node(pid, &[fid]);

    mason.compute(pid);
    let flow_layout = mason.layout_raw(fid);
    assert!(
        flow_layout.size.height > 0.0,
        "flow-root inside inline split should have a box height"
    );
}

// 4) height on flow-root applies
#[test]
fn flow_root_height_applies() {
    let mut mason = Mason::new();
    let node = mason.create_node();
    let nid = node.id();
    mason.with_style_mut(nid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(100.0),
            height: taffy::style::Dimension::length(10.0),
        });
    });

    mason.compute(nid);
    let layout = mason.layout_raw(nid);
    assert!(
        (layout.size.height - 10.0).abs() < 0.001,
        "explicit height should apply to flow-root"
    );
}
