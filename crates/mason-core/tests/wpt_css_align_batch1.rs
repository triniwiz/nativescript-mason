use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;

extern "C" fn measure_10x10(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(10.0, 10.0)
}

extern "C" fn measure_20x12(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(20.0, 12.0)
}

extern "C" fn measure_40x20(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(40.0, 20.0)
}

// Ported from css-align/baseline-of-scrollable-1a.html
#[test]
fn baseline_of_scrollable_1a() {
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

    // inline parent
    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    // scrollable child (overflow: scroll simulated via being a block child)
    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_20x12), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Scroll,
            y: mason_core::style::Overflow::Scroll,
        });
    });

    mason.set_segments(
        pid,
        vec![InlineSegment::InlineChild {
            id: Some(cid),
            baseline: 0.0,
        }],
    );
    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 200.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 12.0,
        "parent should accommodate scrollable child's baseline height"
    );
}

// Ported from css-align/baseline-of-scrollable-1b.html
#[test]
fn baseline_of_scrollable_1b() {
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
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_40x20), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Auto,
            y: mason_core::style::Overflow::Auto,
        });
    });

    mason.set_segments(
        pid,
        vec![InlineSegment::InlineChild {
            id: Some(cid),
            baseline: 0.0,
        }],
    );
    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 220.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 20.0,
        "parent should accommodate scrollable child's height"
    );
}

// Ported from css-align/baseline-of-scrollable-2.html
#[test]
fn baseline_of_scrollable_2() {
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
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    // Add a replaced inline child and a scrollable block child to test baseline
    let repl = mason.create_node();
    let ridn = repl.id();
    mason.set_measure(ridn, Some(measure_10x10), std::ptr::null_mut());
    mason.with_style_mut(ridn, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_40x20), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Scroll,
            y: mason_core::style::Overflow::Scroll,
        });
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(ridn),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(cid),
                baseline: 0.0,
            },
        ],
    );

    mason.append_node(pid, &[ridn, cid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 240.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 20.0,
        "parent should accommodate scrollable child's baseline contribution"
    );
}
