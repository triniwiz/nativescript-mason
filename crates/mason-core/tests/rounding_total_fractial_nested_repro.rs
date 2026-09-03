use mason_core::*;

// Repro for WebSpec fixture: rounding_total_fractial_nested
//
// A fractional-pixel nested flex column where the two innermost leaves carry
// `position:relative` insets (`bottom`/`top`). Observed on-device: the
// relative-inset offset on seq2/seq3 doesn't land on those nodes at all --
// instead their *parent* (seq1) picks up a matching positional shift, while
// seq2/seq3 themselves report their plain flow position with no offset
// applied.
//
// Expected (from real Chromium, seq2/seq3 offset by their own inset):
//   seq1: x=0 y=0            w=87.390625 h=59.03125
//   seq2: x=0 y=-13.296875   w=87.390625 h=11.984375   (bottom:13.3px)
//   seq3: x=0 y=25.28125     w=87.390625 h=47.046875   (top:13.3px)
// Observed on-device:
//   seq1: y=13 (should be 0)
//   seq2: y=0 (should be -13.296875, i.e. its own inset never applied)
//   seq3: y=38 (should be 25.28125)

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
fn rounding_total_fractial_nested_webspec_shape() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(87.4),
            height: Dimension::length(113.4),
        });
        s.set_flex_direction(FlexDirection::Column);
    });

    let (_child1, child1_id) = fixture_child(&mut mason);
    mason.with_style_mut(child1_id, |s| {
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(20.3),
        });
        s.set_flex_grow(0.7);
        s.set_flex_basis(Dimension::length(50.3));
        s.set_flex_direction(FlexDirection::Column);
    });

    let (_child2, child2_id) = fixture_child(&mut mason);
    mason.with_style_mut(child2_id, |s| {
        s.set_inset(Rect {
            left: LengthPercentageAuto::auto(),
            right: LengthPercentageAuto::auto(),
            top: LengthPercentageAuto::auto(),
            bottom: LengthPercentageAuto::length(13.3),
        });
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(9.9),
        });
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::length(0.3));
    });

    let (_child3, child3_id) = fixture_child(&mut mason);
    mason.with_style_mut(child3_id, |s| {
        s.set_inset(Rect {
            left: LengthPercentageAuto::auto(),
            right: LengthPercentageAuto::auto(),
            top: LengthPercentageAuto::length(13.3),
            bottom: LengthPercentageAuto::auto(),
        });
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(1.1),
        });
        s.set_flex_grow(4.0);
        s.set_flex_basis(Dimension::length(0.3));
    });

    let (_child4, child4_id) = fixture_child(&mut mason);
    mason.with_style_mut(child4_id, |s| {
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(10.0),
        });
        s.set_flex_grow(1.6);
    });

    let (_child5, child5_id) = fixture_child(&mut mason);
    mason.with_style_mut(child5_id, |s| {
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(10.7),
        });
        s.set_flex_grow(1.1);
    });

    mason.append_node(child1_id, &[child2_id, child3_id]);
    mason.append_node(root_id, &[child1_id, child4_id, child5_id]);
    mason.append_node(stage_id, &[root_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 87.390625, 113.390625);
    assert_layout(&mason, child1_id, "child1", 0.0, 0.0, 87.390625, 59.03125);
    assert_layout(&mason, child2_id, "child2", 0.0, -13.296875, 87.390625, 11.984375);
    assert_layout(&mason, child3_id, "child3", 0.0, 25.28125, 87.390625, 47.046875);
    assert_layout(&mason, child4_id, "child4", 0.0, 59.03125, 87.390625, 29.953125);
    assert_layout(&mason, child5_id, "child5", 0.0, 88.984375, 87.390625, 24.40625);
}
