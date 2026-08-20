use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;

extern "C" fn measure_30x20(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(30.0, 20.0)
}

extern "C" fn measure_12x8(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(12.0, 8.0)
}

// Ported small batch from css-display: block, text-only, line-height smoke checks

#[test]
fn display_contents_block_smoke() {
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

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_30x20), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    // simulate display:contents by appending child directly to parent
    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 200.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 20.0,
        "parent should accommodate child height via display:contents"
    );
}

#[test]
fn display_contents_text_only_smoke() {
    let mut mason = Mason::new();
    let parent = mason.create_text_node();
    let pid = parent.id();

    // child text segments appended directly (simulate contents)
    mason.set_segments(
        pid,
        vec![InlineSegment::Text {
            flags: 0,
            width: 50.0,
            ascent: 10.0,
            descent: 2.0,
        }],
    );

    mason.compute(pid);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height > 0.0,
        "text-only inline container should have positive height"
    );
}

#[test]
fn display_contents_line_height_smoke() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(220.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_12x8), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 220.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 8.0,
        "parent should accommodate child's line-height via display:contents"
    );
}
