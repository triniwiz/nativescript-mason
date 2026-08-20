use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;

extern "C" fn measure_12x8(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(12.0, 8.0)
}

extern "C" fn measure_24x16(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(24.0, 16.0)
}

extern "C" fn measure_36x22(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(36.0, 22.0)
}

// Ported from css-align/baseline-rules/synthesized-baseline-flexbox-001.html
#[test]
fn synthesized_baseline_flexbox_001() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(200.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let flex = mason.create_node();
    let fid = flex.id();
    mason.set_measure(fid, Some(measure_24x16), std::ptr::null_mut());
    mason.with_style_mut(fid, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    let repl = mason.create_node();
    let ridn = repl.id();
    mason.set_measure(ridn, Some(measure_12x8), std::ptr::null_mut());
    mason.with_style_mut(ridn, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(fid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(ridn),
                baseline: 0.0,
            },
        ],
    );
    mason.append_node(pid, &[fid, ridn]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 200.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 16.0,
        "parent should accommodate synthesized flexbox baseline"
    );
}

// Ported from css-align/baseline-rules/synthesized-baseline-grid-001.html
#[test]
fn synthesized_baseline_grid_001() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
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

    let grid = mason.create_node();
    let gid = grid.id();
    mason.set_measure(gid, Some(measure_36x22), std::ptr::null_mut());
    mason.with_style_mut(gid, |s| {
        s.set_display(Display::Grid);
        s.set_display_mode(DisplayMode::Box);
    });

    let text_repl = mason.create_node();
    let tid = text_repl.id();
    mason.set_measure(tid, Some(measure_12x8), std::ptr::null_mut());
    mason.with_style_mut(tid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(gid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(tid),
                baseline: 0.0,
            },
        ],
    );
    mason.append_node(pid, &[gid, tid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 220.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 22.0,
        "parent should accommodate synthesized grid baseline"
    );
}

// Ported from css-align/baseline-rules/synthesized-baseline-inline-block-001.html
#[test]
fn synthesized_baseline_inline_block_001() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
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

    let ib = mason.create_node();
    let ibid = ib.id();
    mason.set_measure(ibid, Some(measure_36x22), std::ptr::null_mut());
    mason.with_style_mut(ibid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    let small = mason.create_node();
    let sid = small.id();
    mason.set_measure(sid, Some(measure_12x8), std::ptr::null_mut());
    mason.with_style_mut(sid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(ibid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(sid),
                baseline: 0.0,
            },
        ],
    );
    mason.append_node(pid, &[ibid, sid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 240.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 22.0,
        "parent should accommodate synthesized inline-block baseline"
    );
}
