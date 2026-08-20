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

extern "C" fn measure_40x25(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(40.0, 25.0)
}

extern "C" fn measure_50x18(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(50.0, 18.0)
}

// Ported from css-display/display-contents-inline-001.html
#[test]
fn display_contents_inline_001() {
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

    // child inline-block measured
    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_30x20), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    // simulate display:contents by appending child directly to the parent
    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    // compute
    mason.compute_wh(pid, 200.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 20.0,
        "parent should accommodate child height via display:contents"
    );
}

// Ported from css-display/display-contents-flex-001.html
#[test]
fn display_contents_flex_001() {
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
    mason.set_measure(cid, Some(measure_40x25), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 220.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 25.0,
        "parent should accommodate inline flex child via display:contents"
    );
}

// Ported from css-display/display-contents-inline-flex-001.html
#[test]
fn display_contents_inline_flex_001() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(240.0),
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
    mason.set_measure(cid, Some(measure_50x18), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 240.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 18.0,
        "parent should accommodate inline-flex child via display:contents"
    );
}
