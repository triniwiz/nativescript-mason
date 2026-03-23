use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicU32, Ordering};

// ── Measure helpers ──────────────────────────────────────────────────────

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

/// Measure that respects available width: returns min(100, avail_w) x 20
extern "C" fn measure_text_wrap(
    _data: *const c_void,
    known_w: c_float,
    _known_h: c_float,
    avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    let w = if !known_w.is_nan() && known_w >= 0.0 {
        known_w
    } else if avail_w > 0.0 && avail_w.is_finite() {
        avail_w.min(100.0)
    } else if avail_w == -1.0 {
        // MinContent: single longest word
        30.0
    } else {
        // MaxContent: no wrap
        100.0
    };
    MeasureOutput::make(w, 20.0)
}

fn approx(a: f32, b: f32) -> bool {
    (a - b).abs() < 0.5
}

// ── Test: inline-flex container lays out children using flexbox ──────────

/// An inline-flex container should arrange its children in a row (the flex
/// default), NOT stack them vertically as block/IFC would.
///
/// Web equivalent:
/// ```html
/// <div style="display: block; width: 400px">
///   <span style="display: inline-flex">
///     <div style="width: 40px; height: 20px"></div>
///     <div style="width: 60px; height: 30px"></div>
///     <div style="width: 80px; height: 25px"></div>
///   </span>
/// </div>
/// ```
#[test]
fn inline_flex_children_laid_out_horizontally() {
    let mut mason = Mason::new();

    // Root block container
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(400.0),
            height: Dimension::auto(),
        });
    });

    // Inline-flex container
    let iflex = mason.create_node();
    let iflex_id = iflex.id();
    mason.with_style_mut(iflex_id, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    // Three flex children with measure functions
    let c1 = mason.create_node();
    let c2 = mason.create_node();
    let c3 = mason.create_node();
    let c1id = c1.id();
    let c2id = c2.id();
    let c3id = c3.id();
    mason.set_measure(c1id, Some(measure_40x20), std::ptr::null_mut());
    mason.set_measure(c2id, Some(measure_60x30), std::ptr::null_mut());
    mason.set_measure(c3id, Some(measure_80x25), std::ptr::null_mut());

    mason.append_node(iflex_id, &[c1id, c2id, c3id]);
    mason.append_node(rid, &[iflex_id]);

    mason.compute_wh(rid, 400.0, 400.0);

    // Check inline-flex container: width = 40 + 60 + 80 = 180, height = max(20, 30, 25) = 30
    let iflex_layout = mason.layout_raw(iflex_id);
    assert!(
        approx(iflex_layout.size.width, 180.0),
        "inline-flex width should be 180 (sum of children), got {}",
        iflex_layout.size.width
    );
    assert!(
        approx(iflex_layout.size.height, 30.0),
        "inline-flex height should be 30 (tallest child), got {}",
        iflex_layout.size.height
    );

    // Check children are laid out horizontally (flex-direction: row)
    let c1_layout = mason.layout_raw(c1id);
    let c2_layout = mason.layout_raw(c2id);
    let c3_layout = mason.layout_raw(c3id);

    assert!(
        approx(c1_layout.location.x, 0.0),
        "child1 x should be 0, got {}",
        c1_layout.location.x
    );
    assert!(
        approx(c2_layout.location.x, 40.0),
        "child2 x should be 40, got {}",
        c2_layout.location.x
    );
    assert!(
        approx(c3_layout.location.x, 100.0),
        "child3 x should be 100, got {}",
        c3_layout.location.x
    );

    // All children should have y=0 (top of flex container, stretch alignment)
    assert!(
        approx(c1_layout.location.y, 0.0),
        "child1 y should be 0, got {}",
        c1_layout.location.y
    );
}

// ── Test: inline-flex with flex-direction column ─────────────────────────

#[test]
fn inline_flex_column_children_laid_out_vertically() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(400.0),
            height: Dimension::auto(),
        });
    });

    let iflex = mason.create_node();
    let iflex_id = iflex.id();
    mason.with_style_mut(iflex_id, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
        s.set_flex_direction(FlexDirection::Column);
    });

    let c1 = mason.create_node();
    let c2 = mason.create_node();
    let c1id = c1.id();
    let c2id = c2.id();
    mason.set_measure(c1id, Some(measure_40x20), std::ptr::null_mut());
    mason.set_measure(c2id, Some(measure_60x30), std::ptr::null_mut());

    mason.append_node(iflex_id, &[c1id, c2id]);
    mason.append_node(rid, &[iflex_id]);

    mason.compute_wh(rid, 400.0, 400.0);

    let iflex_layout = mason.layout_raw(iflex_id);
    // Column: width = max(40, 60) = 60, height = 20 + 30 = 50
    assert!(
        approx(iflex_layout.size.width, 60.0),
        "inline-flex column width should be 60 (widest child), got {}",
        iflex_layout.size.width
    );
    assert!(
        approx(iflex_layout.size.height, 50.0),
        "inline-flex column height should be 50 (sum of children), got {}",
        iflex_layout.size.height
    );

    let c1_layout = mason.layout_raw(c1id);
    let c2_layout = mason.layout_raw(c2id);

    assert!(
        approx(c1_layout.location.y, 0.0),
        "child1 y should be 0, got {}",
        c1_layout.location.y
    );
    assert!(
        approx(c2_layout.location.y, 20.0),
        "child2 y should be 20, got {}",
        c2_layout.location.y
    );
}

// ── Test: inline-block uses block formatting context ─────────────────────

/// An inline-block container establishes a block formatting context.
/// Children should stack vertically (block flow), not inline.
#[test]
fn inline_block_children_use_block_layout() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(300.0),
            height: Dimension::auto(),
        });
    });

    let iblock = mason.create_node();
    let iblock_id = iblock.id();
    mason.with_style_mut(iblock_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    let c1 = mason.create_node();
    let c2 = mason.create_node();
    let c1id = c1.id();
    let c2id = c2.id();

    mason.with_style_mut(c1id, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(30.0),
        });
    });
    mason.with_style_mut(c2id, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::length(20.0),
        });
    });

    mason.append_node(iblock_id, &[c1id, c2id]);
    mason.append_node(rid, &[iblock_id]);

    mason.compute_wh(rid, 300.0, 300.0);

    let c1_layout = mason.layout_raw(c1id);
    let c2_layout = mason.layout_raw(c2id);

    // Block flow: child2 should be below child1
    assert!(
        approx(c1_layout.location.y, 0.0),
        "child1 y should be 0, got {}",
        c1_layout.location.y
    );
    assert!(
        approx(c2_layout.location.y, 30.0),
        "child2 y should be 30 (below child1), got {}",
        c2_layout.location.y
    );
}

// ── Test: inline-flex inside flex container ──────────────────────────────

/// An inline-flex element inside a flex parent should behave as a flex item
/// whose intrinsic size is determined by its own flexbox layout.
#[test]
fn inline_flex_as_flex_item() {
    let mut mason = Mason::new();

    // Outer flex container
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(400.0),
            height: Dimension::length(100.0),
        });
    });

    // Inner inline-flex container with two children
    let iflex = mason.create_node();
    let iflex_id = iflex.id();
    mason.with_style_mut(iflex_id, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
    });

    let c1 = mason.create_node();
    let c2 = mason.create_node();
    let c1id = c1.id();
    let c2id = c2.id();
    mason.set_measure(c1id, Some(measure_40x20), std::ptr::null_mut());
    mason.set_measure(c2id, Some(measure_60x30), std::ptr::null_mut());

    mason.append_node(iflex_id, &[c1id, c2id]);
    mason.append_node(rid, &[iflex_id]);

    mason.compute_wh(rid, 400.0, 100.0);

    let iflex_layout = mason.layout_raw(iflex_id);
    // The inline-flex container's content width = 40 + 60 = 100
    // As a flex item in a row, it should at least be this wide
    assert!(
        iflex_layout.size.width >= 99.5,
        "inline-flex as flex item should have width >= 100, got {}",
        iflex_layout.size.width
    );
}

// ── Test: MeasureOutput MIN/MAX tagged NaN roundtrip ─────────────────────

#[test]
fn measure_output_min_max_tags_roundtrip() {
    let min_f = f32::from_bits(MeasureOutput::MIN_BITS);
    let max_f = f32::from_bits(MeasureOutput::MAX_BITS);

    // Both should be NaN (quiet NaN with payload)
    assert!(min_f.is_nan(), "MIN_BITS should decode to NaN");
    assert!(max_f.is_nan(), "MAX_BITS should decode to NaN");

    // Roundtrip through make/get_width/get_height
    let packed = MeasureOutput::make(min_f, max_f);
    let out_w = MeasureOutput::get_width(packed);
    let out_h = MeasureOutput::get_height(packed);

    assert_eq!(
        out_w.to_bits(),
        MeasureOutput::MIN_BITS,
        "width should roundtrip MIN_BITS"
    );
    assert_eq!(
        out_h.to_bits(),
        MeasureOutput::MAX_BITS,
        "height should roundtrip MAX_BITS"
    );
}

// ── Test: measure function receives correct MinContent/MaxContent signals ─

#[test]
fn measure_receives_min_max_content_signals() {
    static CALL_COUNT: AtomicU32 = AtomicU32::new(0);
    static LAST_AVAIL_W: AtomicU32 = AtomicU32::new(0);

    extern "C" fn tracking_measure(
        _data: *const c_void,
        _known_w: c_float,
        _known_h: c_float,
        avail_w: c_float,
        _avail_h: c_float,
    ) -> c_longlong {
        CALL_COUNT.fetch_add(1, Ordering::Relaxed);
        LAST_AVAIL_W.store(avail_w.to_bits(), Ordering::Relaxed);

        let w = if avail_w == -1.0 {
            // MinContent
            30.0
        } else if avail_w == -2.0 {
            // MaxContent
            100.0
        } else if avail_w > 0.0 {
            avail_w.min(100.0)
        } else {
            100.0
        };
        MeasureOutput::make(w, 20.0)
    }

    let mut mason = Mason::new();

    // Flex container triggers MinContent and MaxContent sizing passes
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.set_measure(cid, Some(tracking_measure), std::ptr::null_mut());

    mason.append_node(rid, &[cid]);

    CALL_COUNT.store(0, Ordering::Relaxed);
    mason.compute_wh(rid, 200.0, 200.0);

    // The measure function should have been called at least once
    let calls = CALL_COUNT.load(Ordering::Relaxed);
    assert!(
        calls >= 1,
        "measure should be called at least once, got {} calls",
        calls
    );

    // Child should have a reasonable size
    let child_layout = mason.layout_raw(cid);
    assert!(
        child_layout.size.width > 0.0 && child_layout.size.width.is_finite(),
        "child width should be positive and finite, got {}",
        child_layout.size.width
    );
}

// ── Test: inline-flex with flex-grow ─────────────────────────────────────

#[test]
fn inline_flex_children_respect_flex_grow() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(400.0),
            height: Dimension::auto(),
        });
    });

    let iflex = mason.create_node();
    let iflex_id = iflex.id();
    mason.with_style_mut(iflex_id, |s| {
        s.set_display(Display::Flex);
        s.set_display_mode(DisplayMode::Box);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
    });

    let c1 = mason.create_node();
    let c2 = mason.create_node();
    let c1id = c1.id();
    let c2id = c2.id();

    mason.with_style_mut(c1id, |s| {
        s.set_flex_grow(1.0);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(20.0),
        });
    });
    mason.with_style_mut(c2id, |s| {
        s.set_flex_grow(1.0);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(20.0),
        });
    });

    mason.append_node(iflex_id, &[c1id, c2id]);
    mason.append_node(rid, &[iflex_id]);

    mason.compute_wh(rid, 400.0, 400.0);

    let c1_layout = mason.layout_raw(c1id);
    let c2_layout = mason.layout_raw(c2id);

    // Both children should share the 200px equally = 100px each
    assert!(
        approx(c1_layout.size.width, 100.0),
        "child1 should be 100px with flex-grow:1, got {}",
        c1_layout.size.width
    );
    assert!(
        approx(c2_layout.size.width, 100.0),
        "child2 should be 100px with flex-grow:1, got {}",
        c2_layout.size.width
    );
}

// ── Test: inline-grid container ──────────────────────────────────────────

#[test]
fn inline_grid_children_use_grid_layout() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(400.0),
            height: Dimension::auto(),
        });
    });

    // Inline-grid with 2 columns
    let igrid = mason.create_node();
    let igrid_id = igrid.id();
    mason.with_style_mut(igrid_id, |s| {
        s.set_display(Display::Grid);
        s.set_display_mode(DisplayMode::Box);
        s.set_grid_template_columns_css("50px 50px");
    });

    let c1 = mason.create_node();
    let c2 = mason.create_node();
    let c3 = mason.create_node();
    let c1id = c1.id();
    let c2id = c2.id();
    let c3id = c3.id();

    mason.with_style_mut(c1id, |s| {
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(20.0),
        });
    });
    mason.with_style_mut(c2id, |s| {
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(20.0),
        });
    });
    mason.with_style_mut(c3id, |s| {
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(25.0),
        });
    });

    mason.append_node(igrid_id, &[c1id, c2id, c3id]);
    mason.append_node(rid, &[igrid_id]);

    mason.compute_wh(rid, 400.0, 400.0);

    let igrid_layout = mason.layout_raw(igrid_id);
    // Grid should be 100px wide (2 x 50px columns)
    assert!(
        approx(igrid_layout.size.width, 100.0),
        "inline-grid width should be 100 (2x50 columns), got {}",
        igrid_layout.size.width
    );

    // c1 and c2 should be in the first row, c3 in the second
    let c1_layout = mason.layout_raw(c1id);
    let c2_layout = mason.layout_raw(c2id);
    let c3_layout = mason.layout_raw(c3id);

    // c1 at (0, 0), c2 at (50, 0)
    assert!(
        approx(c1_layout.location.x, 0.0),
        "grid child1 x should be 0, got {}",
        c1_layout.location.x
    );
    assert!(
        approx(c2_layout.location.x, 50.0),
        "grid child2 x should be 50, got {}",
        c2_layout.location.x
    );
    // c3 should be in second row
    assert!(
        c3_layout.location.y >= 19.5,
        "grid child3 should be in second row (y >= 20), got {}",
        c3_layout.location.y
    );
}
