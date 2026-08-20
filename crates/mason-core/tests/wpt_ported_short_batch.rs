use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::Display;

extern "C" fn measure_40x30(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(40.0, 30.0)
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

extern "C" fn measure_80x25(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(80.0, 25.0)
}

// Ported WPT-style short batch: baseline synthesis, baseline with flex, inline-flex basic

// Ported from css-flexbox/baseline-synthesis-001.html
// Baseline synthesis: inline parent with text run and an inline-block child
#[test]
fn baseline_synthesis_001() {
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
        s.set_display_mode(DisplayMode::Inline);
    });

    // inline-block child measured 40x30
    let ib = mason.create_node();
    let ibid = ib.id();
    mason.set_measure(ibid, Some(measure_40x30), std::ptr::null_mut());
    mason.with_style_mut(ibid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    // text run with small ascent/descent
    mason.set_segments(
        pid,
        vec![
            InlineSegment::Text {
                flags: 0,
                width: 20.0,
                ascent: 8.0,
                descent: 2.0,
            },
            InlineSegment::InlineChild {
                id: Some(ibid),
                baseline: 0.0,
            },
        ],
    );

    mason.append_node(pid, &[ibid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 300.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    // parent must accommodate taller inline-block (30)
    assert!(
        pl.size.height + 1e-3 >= 30.0,
        "parent should accommodate taller inline-block child"
    );
}

// Ported from css-flexbox/baseline-outside-flex-item.html
// Baseline outside flex item: inline parent with inline-flex and an inline-block
#[test]
fn baseline_outside_flex_item() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(320.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let iflex = mason.create_node();
    let ifid = iflex.id();
    mason.set_measure(ifid, Some(measure_20x10), std::ptr::null_mut());
    mason.with_style_mut(ifid, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    let ib = mason.create_node();
    let ibid = ib.id();
    mason.set_measure(ibid, Some(measure_40x30), std::ptr::null_mut());
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

    mason.compute_wh(pid, 320.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 30.0,
        "parent should accommodate taller inline child"
    );
}

// Ported from css-flexbox/inline-flex.html
// Inline-flex basic: inline parent with inline-flex measured 80x25
#[test]
fn inline_flex() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(280.0),
            height: taffy::style::Dimension::auto(),
        });
    });

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let iflex = mason.create_node();
    let ifid = iflex.id();
    mason.set_measure(ifid, Some(measure_80x25), std::ptr::null_mut());
    mason.with_style_mut(ifid, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.set_segments(
        pid,
        vec![InlineSegment::InlineChild {
            id: Some(ifid),
            baseline: 0.0,
        }],
    );

    mason.append_node(pid, &[ifid]);
    mason.append_node(rid, &[pid]);

    mason.compute_wh(pid, 280.0, f32::NAN);

    let pl = mason.layout_raw(pid);
    assert!(
        pl.size.height + 1e-3 >= 25.0,
        "parent should accommodate inline-flex child's height"
    );
}
