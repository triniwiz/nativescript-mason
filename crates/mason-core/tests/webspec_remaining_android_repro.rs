use mason_core::*;

// Both of these were Android-only WebSpec failures, and neither was a layout
// bug: mason-core computes them correctly here, and on device the wrong numbers
// came from a node reading stale padding/margin/size out of the shared
// copy-on-write style buffer (see Style.prepareMut's REF_COUNT read). These
// tests pin the layout side down so a future regression here can be told apart
// from a style-plumbing one.
//
// Each mirrors the WebSpec harness's real mount shape:
//   stage (abspos, width 1024, height auto)
//     -> fixture root (abspos, flex, border-box)   [base.css `body > *`]
//        -> children       (relative, flex, border-box) [test_base_style.css]

fn stage(mason: &mut Mason) -> (NodeRef, Id) {
    let stage = mason.create_node();
    let id = stage.id();
    mason.with_style_mut(id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });
    (stage, id)
}

fn fixture_root(mason: &mut Mason) -> (NodeRef, Id) {
    let root = mason.create_node();
    let id = root.id();
    mason.with_style_mut(id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
    });
    (root, id)
}

fn fixture_child(mason: &mut Mason) -> (NodeRef, Id) {
    let child = mason.create_node();
    let id = child.id();
    mason.with_style_mut(id, |s| {
        s.set_position(Position::Relative);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
    });
    (child, id)
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

// WebSpec: absolute_layout_align_items_and_justify_content_center_and_bottom_position
//
// Root 110x100, align-items:center, justify-content:center. One abspos child
// 60x40 with only `bottom:10px` set. The child has no left/right/top, so its
// x comes from the container's static position (justify-content:center ->
// (110-60)/2 = 25) and its y from `bottom` (100-40-10 = 50).
#[test]
fn abs_align_justify_center_and_bottom_position() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(110.0),
            height: Dimension::length(100.0),
        });
        s.set_align_items(Some(AlignItems::CENTER));
        s.set_justify_content(Some(JustifyContent::CENTER));
    });

    let (_child, child_id) = fixture_child(&mut mason);
    mason.with_style_mut(child_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(60.0),
            height: Dimension::length(40.0),
        });
        s.set_inset(Rect {
            left: LengthPercentageAuto::auto(),
            right: LengthPercentageAuto::auto(),
            top: LengthPercentageAuto::auto(),
            bottom: LengthPercentageAuto::length(10.0),
        });
    });

    mason.append_node(root_id, &[child_id]);
    mason.append_node(stage_id, &[root_id]);
    mason.compute(stage_id);

    assert_layout(&mason, root_id, "seq0", 0.0, 0.0, 110.0, 100.0);
    assert_layout(&mason, child_id, "seq1", 25.0, 50.0, 60.0, 40.0);
}

// WebSpec: flex_grow_in_at_most_container
//
// Root 100x100 row, align-items:flex-start. seq1 is an auto-sized row flex
// item whose only child (seq2) is flex-basis:0 / flex-grow:1. seq1's main size
// shrink-to-fits its content (0) and align-items:flex-start leaves its cross
// size at its content height (0), so both come out 0x0 -- flex-grow has
// nothing to distribute inside a zero-width line.
#[test]
fn flex_grow_in_at_most_container() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
        s.set_flex_direction(FlexDirection::Row);
        s.set_align_items(Some(AlignItems::FLEX_START));
    });

    let (_mid, mid_id) = fixture_child(&mut mason);
    mason.with_style_mut(mid_id, |s| {
        s.set_flex_direction(FlexDirection::Row);
    });

    let (_leaf, leaf_id) = fixture_child(&mut mason);
    mason.with_style_mut(leaf_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::length(0.0));
    });

    mason.append_node(mid_id, &[leaf_id]);
    mason.append_node(root_id, &[mid_id]);
    mason.append_node(stage_id, &[root_id]);
    mason.compute(stage_id);

    assert_layout(&mason, root_id, "seq0", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, mid_id, "seq1", 0.0, 0.0, 0.0, 0.0);
    assert_layout(&mason, leaf_id, "seq2", 0.0, 0.0, 0.0, 0.0);
}
