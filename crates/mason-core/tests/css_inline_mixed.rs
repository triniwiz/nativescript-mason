use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;

extern "C" fn measure_40x20(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(40.0, 20.0)
}

extern "C" fn measure_60x30(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(60.0, 30.0)
}

extern "C" fn measure_80x25(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(80.0, 25.0)
}

// Helper approx
fn approx(a: f32, b: f32) -> bool {
    (a - b).abs() < 0.5
}

// Test: inline parent with an inline-block and an inline-grid child
#[test]
fn inline_mixed_inline_block_and_inline_grid() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(300.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    // inline parent (text container)
    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    // inline-block child (measured)
    let ib = mason.create_node();
    let ibid = ib.id();
    mason.set_measure(ibid, Some(measure_40x20), std::ptr::null_mut());
    mason.with_style_mut(ibid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    // inline-grid child (measured via direct measure on the grid box)
    let ig = mason.create_node();
    let igid = ig.id();
    mason.set_measure(igid, Some(measure_60x30), std::ptr::null_mut());
    mason.with_style_mut(igid, |s| {
        s.set_display(Display::Grid);
        s.set_display_mode(DisplayMode::Box);
    });

    // Place both as inline children in the parent's segments
    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(ibid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(igid),
                baseline: 0.0,
            },
        ],
    );

    mason.append_node(pid, &[ibid, igid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 300.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    // Parent height should be at least the height of the taller inline child (30)
    assert!(
        pl.size.height + 1e-3 >= 30.0,
        "parent should accommodate taller inline child"
    );
}

// Test: inline parent mixing inline-flex (measured) and an inline-block child
#[test]
fn inline_mixed_inline_flex_and_inline_block() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(400.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    // inline-flex child: give it an intrinsic measure
    let iflex = mason.create_node();
    let ifid = iflex.id();
    mason.set_measure(ifid, Some(measure_80x25), std::ptr::null_mut());
    mason.with_style_mut(ifid, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    // inline-block child
    let ib = mason.create_node();
    let ibid = ib.id();
    mason.set_measure(ibid, Some(measure_60x30), std::ptr::null_mut());
    mason.with_style_mut(ibid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(ifid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(ibid),
                baseline: 0.0,
            },
        ],
    );

    mason.append_node(pid, &[ifid, ibid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 400.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    // Parent height should be at least 30 (taller child)
    assert!(
        pl.size.height + 1e-3 >= 30.0,
        "parent should accommodate taller inline child"
    );
}

// Test: inline replaced element and text run
#[test]
fn inline_replaced_and_text_runs() {
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

    // replaced element measured 40x20
    let repl = mason.create_node();
    let ridn = repl.id();
    mason.set_measure(ridn, Some(measure_40x20), std::ptr::null_mut());
    mason.with_style_mut(ridn, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    // text run tiny ascent/descent
    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(ridn),
                baseline: 0.0,
            },
            InlineSegment::Text {
                flags: 0,
                width: 10.0,
                ascent: 8.0,
                descent: 2.0,
            },
        ],
    );

    mason.append_node(pid, &[ridn]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 200.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    // replaced element is taller (20) than text (10) so parent must be >=20
    assert!(
        pl.size.height + 1e-3 >= 20.0,
        "parent should accommodate replaced inline element"
    );
}
