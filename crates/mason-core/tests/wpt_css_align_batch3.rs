use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;

extern "C" fn measure_14x9(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(14.0, 9.0)
}

extern "C" fn measure_28x18(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(28.0, 18.0)
}

extern "C" fn measure_32x20(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(32.0, 20.0)
}

// Ported from css-align/baseline-rules/inline-table-inline-block-baseline.html
#[test]
fn inline_table_inline_block_baseline() {
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

    // simulate inline-table using Grid (table not available)
    let table = mason.create_node();
    let tid = table.id();
    mason.set_measure(tid, Some(measure_32x20), std::ptr::null_mut());
    mason.with_style_mut(tid, |s| {
        s.set_display(Display::Grid);
        s.set_display_mode(DisplayMode::Box);
    });

    let ib = mason.create_node();
    let ibid = ib.id();
    mason.set_measure(ibid, Some(measure_14x9), std::ptr::null_mut());
    mason.with_style_mut(ibid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(tid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(ibid),
                baseline: 0.0,
            },
        ],
    );
    mason.append_node(pid, &[tid, ibid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 200.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 20.0,
        "parent should accommodate inline-table baseline"
    );
}

// Ported from css-align/baseline-rules/inline-table-inline-block-baseline-vert-rl.html
#[test]
fn inline_table_inline_block_baseline_vert_rl() {
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

    let table = mason.create_node();
    let tid = table.id();
    mason.set_measure(tid, Some(measure_28x18), std::ptr::null_mut());
    mason.with_style_mut(tid, |s| {
        s.set_display(Display::Grid);
        s.set_display_mode(DisplayMode::Box);
    });

    let ib = mason.create_node();
    let ibid = ib.id();
    mason.set_measure(ibid, Some(measure_14x9), std::ptr::null_mut());
    mason.with_style_mut(ibid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(tid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(ibid),
                baseline: 0.0,
            },
        ],
    );
    mason.append_node(pid, &[tid, ibid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 220.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 18.0,
        "parent should accommodate inline-table baseline vertical-rl"
    );
}

// Ported from css-align/baseline-rules/synthesized-baseline-table-cell-001.html
#[test]
fn synthesized_baseline_table_cell_001() {
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

    // simulate table-cell using Grid child
    let cell = mason.create_node();
    let cid = cell.id();
    mason.set_measure(cid, Some(measure_32x20), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Grid);
        s.set_display_mode(DisplayMode::Box);
    });

    let small = mason.create_node();
    let sid = small.id();
    mason.set_measure(sid, Some(measure_14x9), std::ptr::null_mut());
    mason.with_style_mut(sid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(cid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(sid),
                baseline: 0.0,
            },
        ],
    );
    mason.append_node(pid, &[cid, sid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 240.0, f32::NAN);
    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 20.0,
        "parent should accommodate synthesized table-cell baseline"
    );
}
