use mason_core::*;

// Regression tests for the WebSpec "_on_root" cluster:
//   min_width_overrides_width_on_root
//   max_width_overrides_width_on_root
//   min_height_overrides_height_on_root
//   max_height_overrides_height_on_root
//
// Each fixture is a single childless `position:absolute` node directly under
// WebSpec's off-screen "stage" div, with a min/max-size style conflicting
// with an explicit width/height (e.g. `{min-width:100px, width:50px}` should
// resolve to width 100, min-width winning per the standard CSS clamp).
//
// Root cause: `stage` defaults to `Display::Block`, so a childless abspos
// child routes through `Tree::layout_absolute_children`
// (tree_inline.rs) instead of taffy's own abspos-child algorithms. That
// function resolved but never applied its own min/max clamp — fixed there.

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

#[test]
fn min_width_overrides_width_on_root() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_min_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_size(Size {
            width: Dimension::length(50.0),
            height: Dimension::auto(),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 100.0).abs() < 0.5,
        "expected width 100 (min-width wins over width:50), got {}",
        l.size.width
    );
}

#[test]
fn max_width_overrides_width_on_root() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_max_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.width - 100.0).abs() < 0.5,
        "expected width 100 (max-width wins over width:200), got {}",
        l.size.width
    );
}

#[test]
fn min_height_overrides_height_on_root() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_min_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::length(50.0),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.height - 100.0).abs() < 0.5,
        "expected height 100 (min-height wins over height:50), got {}",
        l.size.height
    );
}

#[test]
fn max_height_overrides_height_on_root() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::length(200.0),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    let l = mason.layout_raw(root_id);
    assert!(
        (l.size.height - 100.0).abs() < 0.5,
        "expected height 100 (max-height wins over height:200), got {}",
        l.size.height
    );
}
