use mason_core::*;

// Repro tests for WebSpec fixtures: flex_basis_smaller_then_content_with_
// flex_grow_unconstraint_size, flex_basis_unconstraint_row,
// flex_shrink_by_outer_margin_with_max_size,
// justify_content_row_max_width_and_margin, wrapped_column_max_height(_flex).
//
// Each computed the way WebSpec's real harness does it (abspos fixture root
// under a 1024-wide "stage"), matching the sibling repro files
// (`max_width_abspos_flex_repro.rs` et al). The `_direct_maxcontent` variants
// below compute the same shape directly via `MaxContent`, matching taffy's
// own XML conformance suite, to isolate the abspos wrapper from the
// algorithm itself.

fn stage(mason: &mut Mason) -> (NodeRef, Id) {
    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });
    (stage, stage_id)
}

fn fixture_root(mason: &mut Mason) -> (NodeRef, Id) {
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
    });
    (root, root_id)
}

fn fixture_child(mason: &mut Mason) -> (NodeRef, Id) {
    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_position(Position::Relative);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
    });
    (child, child_id)
}

fn assert_layout(mason: &Mason, id: Id, label: &str, x: f32, y: f32, w: f32, h: f32) {
    let l = mason.layout_raw(id);
    assert!(
        (l.location.x - x).abs() < 0.5
            && (l.location.y - y).abs() < 0.5
            && (l.size.width - w).abs() < 0.5
            && (l.size.height - h).abs() < 0.5,
        "{label}: expected x={x} y={y} w={w} h={h}, got x={} y={} w={} h={}",
        l.location.x,
        l.location.y,
        l.size.width,
        l.size.height
    );
}

#[test]
fn flex_basis_smaller_then_content_with_flex_grow_unconstraint_size() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Row);
    });

    let (_c1, c1_id) = fixture_child(&mut mason);
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_basis(Dimension::length(0.0));
        s.set_flex_grow(1.0);
        s.set_flex_direction(FlexDirection::Column);
    });
    let (_gc1, gc1_id) = fixture_child(&mut mason);
    mason.with_style_mut(gc1_id, |s| {
        s.set_size(Size {
            width: Dimension::length(70.0),
            height: Dimension::length(100.0),
        });
    });

    let (_c2, c2_id) = fixture_child(&mut mason);
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_basis(Dimension::length(0.0));
        s.set_flex_grow(1.0);
        s.set_flex_direction(FlexDirection::Column);
    });
    let (_gc2, gc2_id) = fixture_child(&mut mason);
    mason.with_style_mut(gc2_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(100.0),
        });
    });

    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.append_node(c1_id, &[gc1_id]);
    mason.append_node(c2_id, &[gc2_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // root 90x100, c1 0,0 70x100 (-> gc1 70x100), c2 70,0 20x100 (-> gc2 20x100).
    // gc1/gc2 positions are relative to their own parent (c1/c2), not absolute.
    assert_layout(&mason, root_id, "root", 0.0, 0.0, 90.0, 100.0);
    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 70.0, 100.0);
    assert_layout(&mason, gc1_id, "gc1", 0.0, 0.0, 70.0, 100.0);
    assert_layout(&mason, c2_id, "c2", 70.0, 0.0, 20.0, 100.0);
    assert_layout(&mason, gc2_id, "gc2", 0.0, 0.0, 20.0, 100.0);
}

#[test]
fn flex_basis_unconstraint_row() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Row);
    });

    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_flex_basis(Dimension::length(50.0));
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
    });

    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // Both mason's own fixture (per generate.mjs/Chromium) AND the upstream
    // taffy XML test (MaxContent/MaxContent, no abspos wrapper at all) agree
    // the flex-basis(50) does NOT become the child's main-axis size here —
    // width collapses to 0 on both the child and its shrink-wrapping root.
    assert_layout(&mason, root_id, "root", 0.0, 0.0, 0.0, 100.0);
    assert_layout(&mason, child_id, "child", 0.0, 0.0, 0.0, 100.0);
}

#[test]
fn flex_shrink_by_outer_margin_with_max_size() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Column);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(80.0),
        });
    });

    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(0.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(100.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
    });

    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 20.0, 80.0);
    assert_layout(&mason, child_id, "child", 0.0, 100.0, 20.0, 0.0);
}

#[test]
fn justify_content_row_max_width_and_margin() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Row);
        s.set_justify_content(Some(JustifyContent::CENTER));
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });

    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(100.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(0.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
    });

    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 80.0, 20.0);
    assert_layout(&mason, child_id, "child", 90.0, 0.0, 0.0, 20.0);
}

#[test]
fn wrapped_column_max_height() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Column);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_align_items(Some(AlignItems::CENTER));
        s.set_justify_content(Some(JustifyContent::CENTER));
        s.set_align_content(Some(AlignContent::CENTER));
        s.set_size(Size {
            width: Dimension::length(700.0),
            height: Dimension::length(500.0),
        });
    });

    let (_c1, c1_id) = fixture_child(&mut mason);
    mason.with_style_mut(c1_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(500.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(200.0),
        });
    });

    let (_c2, c2_id) = fixture_child(&mut mason);
    mason.with_style_mut(c2_id, |s| {
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::length(200.0),
        });
        s.set_margin(Rect::<LengthPercentageAuto>::length(20.0));
    });

    let (_c3, c3_id) = fixture_child(&mut mason);
    mason.with_style_mut(c3_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });

    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[c1_id, c2_id, c3_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 700.0, 500.0);
    assert_layout(&mason, c1_id, "c1", 250.0, 30.0, 100.0, 200.0);
    assert_layout(&mason, c2_id, "c2", 200.0, 250.0, 200.0, 200.0);
    assert_layout(&mason, c3_id, "c3", 420.0, 200.0, 100.0, 100.0);
}

#[test]
fn wrapped_column_max_height_flex() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Column);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_align_items(Some(AlignItems::CENTER));
        s.set_justify_content(Some(JustifyContent::CENTER));
        s.set_align_content(Some(AlignContent::CENTER));
        s.set_size(Size {
            width: Dimension::length(700.0),
            height: Dimension::length(500.0),
        });
    });

    let (_c1, c1_id) = fixture_child(&mut mason);
    mason.with_style_mut(c1_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(500.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(200.0),
        });
        s.set_flex_grow(1.0);
        s.set_flex_shrink(1.0);
        s.set_flex_basis(Dimension::percent(0.0));
    });

    let (_c2, c2_id) = fixture_child(&mut mason);
    mason.with_style_mut(c2_id, |s| {
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::length(200.0),
        });
        s.set_margin(Rect::<LengthPercentageAuto>::length(20.0));
        s.set_flex_grow(1.0);
        s.set_flex_shrink(1.0);
        s.set_flex_basis(Dimension::percent(0.0));
    });

    let (_c3, c3_id) = fixture_child(&mut mason);
    mason.with_style_mut(c3_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });

    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[c1_id, c2_id, c3_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 700.0, 500.0);
    assert_layout(&mason, c1_id, "c1", 300.0, 0.0, 100.0, 180.0);
    assert_layout(&mason, c2_id, "c2", 250.0, 200.0, 200.0, 180.0);
    assert_layout(&mason, c3_id, "c3", 300.0, 400.0, 100.0, 100.0);
}

// --- Direct MaxContent variants (no stage/abspos wrapper), mirroring taffy's
// own upstream XML test harness exactly (`tests/xml.rs::run_xml_test`
// computes with `AvailableSpace::MaxContent`/`MaxContent` directly on the
// root, no position:absolute involved at all). Used to isolate whether a
// divergence from the WebSpec-shaped repro above is in the abspos
// shrink-to-fit codepath specifically, or a deeper bug that reproduces even
// in the simplest possible harness.
#[test]
fn flex_basis_smaller_then_content_with_flex_grow_unconstraint_size_direct_maxcontent() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
    });

    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_basis(Dimension::length(0.0));
        s.set_flex_grow(1.0);
        s.set_flex_direction(FlexDirection::Column);
    });
    let gc1 = mason.create_node();
    let gc1_id = gc1.id();
    mason.with_style_mut(gc1_id, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(70.0),
            height: Dimension::length(100.0),
        });
    });

    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_basis(Dimension::length(0.0));
        s.set_flex_grow(1.0);
        s.set_flex_direction(FlexDirection::Column);
    });
    let gc2 = mason.create_node();
    let gc2_id = gc2.id();
    mason.with_style_mut(gc2_id, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(100.0),
        });
    });

    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.append_node(c1_id, &[gc1_id]);
    mason.append_node(c2_id, &[gc2_id]);

    mason.compute(root_id); // Size::max_content() both axes

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 90.0, 100.0);
    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 70.0, 100.0);
    assert_layout(&mason, c2_id, "c2", 70.0, 0.0, 20.0, 100.0);
}

#[test]
fn flex_basis_unconstraint_row_direct_maxcontent() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
    });

    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_basis(Dimension::length(50.0));
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
    });

    mason.append_node(root_id, &[child_id]);
    mason.compute(root_id);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 0.0, 100.0);
    assert_layout(&mason, child_id, "child", 0.0, 0.0, 0.0, 100.0);
}

#[test]
fn flex_shrink_by_outer_margin_with_max_size_direct_maxcontent() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(80.0),
        });
    });

    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(0.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(100.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
    });

    mason.append_node(root_id, &[child_id]);
    mason.compute(root_id);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 20.0, 80.0);
    assert_layout(&mason, child_id, "child", 0.0, 100.0, 20.0, 0.0);
}

#[test]
fn justify_content_row_max_width_and_margin_direct_maxcontent() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_justify_content(Some(JustifyContent::CENTER));
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });

    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(100.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(0.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
    });

    mason.append_node(root_id, &[child_id]);
    mason.compute(root_id);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 80.0, 20.0);
    assert_layout(&mason, child_id, "child", 90.0, 0.0, 0.0, 20.0);
}

// --- Regression tests: an abspos `display:flex` node with children dropped
// its own max-size self-clamp. Root cause: `stage()` defaults to
// `Display::Block`, so it dispatches through `Tree::layout_absolute_children`
// (tree_inline.rs) instead of taffy's abspos-child algorithms, and that
// function computed but never applied its own min/max clamp. Fixed there.
#[test]
fn regression_column_max_height_no_margin() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Column);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(80.0),
        });
    });
    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.height - 80.0).abs() < 0.5,
        "expected root height clamped to max-height 80, got {}",
        l.size.height
    );
}

#[test]
fn regression_row_max_width_no_margin() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Row);
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });
    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 80.0).abs() < 0.5,
        "expected root width clamped to max-width 80, got {}",
        l.size.width
    );
}

#[test]
fn regression_column_max_height_with_margin() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_flex_direction(FlexDirection::Column);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(80.0),
        });
    });
    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(0.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(100.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // The child's margin isn't relevant to the max-height clamp itself --
    // this variant just confirms the fix holds with a margined child too.
    let l = mason.layout_raw(root_id);
    let cl = mason.layout_raw(child_id);
    assert!(
        (l.size.height - 80.0).abs() < 0.5,
        "expected root height clamped to max-height 80, got {}",
        l.size.height
    );
    assert!(cl.location.y >= 0.0, "sanity: child y should be non-negative, got {}", cl.location.y);
}

#[test]
fn regression_row_max_width_no_child() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    // Childless abspos flex node: goes through mason-core's LEAF dispatch
    // arm (compute_leaf_layout), which already clamped max-width correctly
    // even before this fix (its own explicit min/max clamp is a separate,
    // already-correct code path from layout_absolute_children).
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 80.0).abs() < 0.5,
        "childless abspos flex root should correctly clamp to max-width 80, got {}",
        l.size.width
    );
}

#[test]
fn regression_row_max_width_empty_child() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });
    let (_child, child_id) = fixture_child(&mut mason);
    // no size set on child at all -- before the fix, merely adding this one
    // unstyled child flipped the correctly-clamped width(80) from
    // regression_row_max_width_no_child to an unclamped ~100.
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 80.0).abs() < 0.5,
        "expected root width clamped to max-width 80 even with a child present, got {}",
        l.size.width
    );
}

#[test]
fn regression_row_max_width_relative_not_abspos() {
    // Same width/max-width/child shape, but the "root" here is an ordinary
    // in-flow (position:relative) flex node computed directly (no abspos,
    // no stage) -- this never went through the buggy layout_absolute_children
    // path in the first place, so it's a sanity check that was never broken.
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });
    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
    });
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(root_id, 1024.0, 768.0);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 80.0).abs() < 0.5,
        "in-flow flex root with a child should still clamp to max-width 80, got {}",
        l.size.width
    );
}

#[test]
fn regression_row_max_width_abspos_definite_available_space() {
    // Same as regression_row_max_width_empty_child, but compute the stage
    // with Size::max_content() instead of a large definite size -- confirms
    // the fix holds regardless of the stage's own available-space mode.
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });
    let (_child, child_id) = fixture_child(&mut mason);
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);
    mason.compute(stage_id);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 80.0).abs() < 0.5,
        "expected max-width 80 to hold under Size::max_content() for the stage too, got {}",
        l.size.width
    );
}

#[test]
fn regression_row_max_width_both_axes_known() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(50.0),
        });
        s.set_max_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
    });
    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(20.0),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 80.0).abs() < 0.5,
        "expected max-width 80 to hold even when both width and height are already definite, got {}",
        l.size.width
    );
}
