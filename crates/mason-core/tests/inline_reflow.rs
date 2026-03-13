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

extern "C" fn measure_68x68(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(68.0, 68.0)
}

#[test]
fn long_unbreakable_text_runs_wrap_into_lines() {
    let mut mason = Mason::new();

    // root container with a definite width so wrapping occurs
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size { width: taffy::style::Dimension::length(200.0), height: taffy::style::Dimension::auto() });
    });

    // a pure inline text container (no native measure) containing a single very wide text run
    let inline = mason.create_text_node();
    let iid = inline.id();
    mason.with_style_mut(iid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    // set a huge measured text run; our reflow should split this across multiple lines
    mason.set_segments(iid, vec![InlineSegment::Text { flags: 0, width: 1000.0, ascent: 10.0, descent: 4.0 }]);
    mason.append_node(rid, &[iid]);

    mason.compute_wh(rid, 200.0, f32::NAN);

    let lay = mason.layout_raw(iid);
    // content width should not exceed container width after wrapping
    assert!(lay.size.width <= 200.0 + 1e-3, "inline width should be constrained by container width");
    // content height should be > single line height (indicates wrapping occurred)
    assert!(lay.size.height > 10.0 + 4.0, "expected multiple lines after wrapping");
}

#[test]
fn drop_cap_float_causes_wrapping_around_float() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size { width: taffy::style::Dimension::length(300.0), height: taffy::style::Dimension::auto() });
    });

    // drop cap float
    let drop = mason.create_node();
    let drop_id = drop.id();
    mason.set_measure(drop_id, Some(measure_68x68), std::ptr::null_mut());
    mason.with_style_mut(drop_id, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_float(taffy::style::Float::Left);
    });

    // prose text following
    let prose = mason.create_text_node();
    let pid = prose.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    // a large text run that should wrap and flow around the float
    mason.set_segments(pid, vec![InlineSegment::Text { flags: 0, width: 600.0, ascent: 12.0, descent: 4.0 }]);

    // assemble: place float and prose directly in the root container
    mason.append_node(rid, &[drop_id, pid]);
    mason.compute_wh(rid, 300.0, f32::NAN);

    let rects = mason.get_float_rects(rid);
    assert!(!rects.is_empty(), "expected float rects for drop cap");

    // ensure prose had a positive height (wrapped content)
    let lay = mason.layout_raw(pid);
    assert!(lay.size.height > 0.0 && lay.size.height.is_finite());
}

#[test]
fn inline_block_increases_line_height_for_baseline() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size { width: taffy::style::Dimension::length(200.0), height: taffy::style::Dimension::auto() });
    });

    // parent text container
    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });

    // inline-block child
    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(measure_80x50), std::ptr::null_mut());
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Box);
    });

    // Place the inline-child into the parent's segments
    mason.set_segments(pid, vec![InlineSegment::InlineChild { id: Some(cid), baseline: 0.0 }]);
    mason.append_node(pid, &[cid]);
    mason.append_node(rid, &[pid]);

    // Compute starting at the parent text container so inline measurements
    // are resolved in the same available width context.
    mason.compute_wh(pid, 200.0, f32::NAN);

    let child_layout = mason.layout_raw(cid);
    // Debug print to help diagnose measurements
    println!("child layout: w={} h={}", child_layout.size.width, child_layout.size.height);
    // Child should have been measured to the expected size
    assert!((child_layout.size.width - 80.0).abs() < 1e-3 && (child_layout.size.height - 50.0).abs() < 1e-3, "inline-block child measured size should be preserved");

    let lay = mason.layout_raw(pid);
    // Parent's computed height should be at least the child's height (line expanded)
    assert!(lay.size.height + 1e-3 >= 50.0, "parent should accommodate inline-block height");
}
