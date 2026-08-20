use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

extern "C" fn measure_80x50(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(80.0, 50.0)
}

extern "C" fn measure_20x10(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(20.0, 10.0)
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

#[test]
fn spec_inline_table_increases_line_height() {
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

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    let itab = mason.create_node();
    let itid = itab.id();
    mason.set_measure(itid, Some(measure_60x30), std::ptr::null_mut());
    mason.with_style_mut(itid, |s| {
        s.set_display(taffy::style::Display::Grid);
        s.set_display_mode(mason_core::style::DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![InlineSegment::InlineChild {
            id: Some(itid),
            baseline: 0.0,
        }],
    );
    mason.append_node(pid, &[itid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 300.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 30.0,
        "parent should accommodate inline-table height"
    );
}

#[test]
fn spec_inline_grid_baseline_influence() {
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

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    let igr = mason.create_node();
    let igid = igr.id();
    mason.set_measure(igid, Some(measure_60x30), std::ptr::null_mut());
    mason.with_style_mut(igid, |s| {
        s.set_display(taffy::style::Display::Grid);
        s.set_display_mode(mason_core::style::DisplayMode::Box);
    });

    // tiny text run next to grid
    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(igid),
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

    mason.append_node(pid, &[igid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 300.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 30.0,
        "parent should accommodate inline-grid height"
    );
}

#[test]
fn spec_vertical_align_baseline_vs_middle_positions_differ() {
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
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    let a = mason.create_node();
    let aid = a.id();
    mason.set_measure(aid, Some(measure_60x30), std::ptr::null_mut());
    mason.with_style_mut(aid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Box);
        // default baseline
    });

    let b = mason.create_node();
    let bid = b.id();
    mason.set_measure(bid, Some(measure_60x30), std::ptr::null_mut());
    mason.with_style_mut(bid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Box);
        s.set_vertical_align(mason_core::style::VerticalAlignValue::MIDDLE);
    });

    mason.set_segments(
        pid,
        vec![
            InlineSegment::InlineChild {
                id: Some(aid),
                baseline: 0.0,
            },
            InlineSegment::InlineChild {
                id: Some(bid),
                baseline: 0.0,
            },
        ],
    );

    mason.append_node(pid, &[aid, bid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 400.0, f32::NAN);

    let la = mason.layout_raw(aid);
    let lb = mason.layout_raw(bid);
    // Their y positions should differ when one is vertically-middle aligned
    assert!(
        (la.location.y - lb.location.y).abs() > 0.1,
        "baseline vs middle aligned children should have different y positions"
    );
}

#[test]
fn spec_inline_block_increases_line_height() {
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
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_80x50), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Box);
        s.set_item_is_list_item(false);
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

    let child_layout = mason.layout_raw(cid);
    assert!(
        (child_layout.size.width - 80.0).abs() < 1e-3
            && (child_layout.size.height - 50.0).abs() < 1e-3
    );

    let lay = mason.layout_raw(pid);
    assert!(
        lay.size.height + 1e-3 >= 50.0,
        "parent should accommodate inline-block height"
    );
}

#[test]
fn spec_vertical_align_middle_works() {
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

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    // small inline child
    let a = mason.create_node();
    let aid = a.id();
    mason.set_measure(aid, Some(measure_20x10), std::ptr::null_mut());
    mason.with_style_mut(aid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Box);
        s.set_vertical_align(mason_core::style::VerticalAlignValue::MIDDLE);
        s.set_item_is_list_item(false);
    });

    // text container segment (simulate text run)
    mason.set_segments(
        pid,
        vec![InlineSegment::InlineChild {
            id: Some(aid),
            baseline: 5.0,
        }],
    );
    mason.append_node(pid, &[aid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(rid, 300.0, f32::NAN);

    let lay = mason.layout_raw(pid);
    // parent should have positive height and finite
    assert!(lay.size.height > 0.0 && lay.size.height.is_finite());
}
