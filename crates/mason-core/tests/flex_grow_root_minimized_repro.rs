use mason_core::*;

// Repro for WebSpec fixture: flex_grow_root_minimized
//
// abspos flex root (width:100, min-height:100, max-height:500, column) with
// one flex-grow:1 child (also column, min-height:100, max-height:500), whose
// own two children are flex-basis:200/flex-grow:1 and height:100 (no grow).
// Root and its child both have indefinite (auto) height, so flex-grow should
// have nothing to distribute — final sizes should come purely from
// flex-basis/height, clamped by min/max.
//
// Expected (from real Chromium):
//   seq0 (root): 100x300   seq1: 100x300   seq2: 100x200   seq3: 100x100 @ y=200
// Observed on-device: root/seq1 come out 100x400, seq3 100x200 @ y=200 --
// the non-growing seq3 gains an extra 100 it should never receive.

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
fn flex_grow_root_minimized_webspec_shape() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_min_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(500.0),
        });
        s.set_flex_direction(FlexDirection::Column);
    });

    let (_child1, child1_id) = fixture_child(&mut mason);
    mason.with_style_mut(child1_id, |s| {
        s.set_min_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(500.0),
        });
        s.set_flex_grow(1.0);
        s.set_flex_direction(FlexDirection::Column);
    });

    let (_child2, child2_id) = fixture_child(&mut mason);
    mason.with_style_mut(child2_id, |s| {
        s.set_flex_basis(Dimension::length(200.0));
        s.set_flex_grow(1.0);
    });

    let (_child3, child3_id) = fixture_child(&mut mason);
    mason.with_style_mut(child3_id, |s| {
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
    });

    mason.append_node(child1_id, &[child2_id, child3_id]);
    mason.append_node(root_id, &[child1_id]);
    mason.append_node(stage_id, &[root_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 300.0);
    assert_layout(&mason, child1_id, "child1", 0.0, 0.0, 100.0, 300.0);
    assert_layout(&mason, child2_id, "child2", 0.0, 0.0, 100.0, 200.0);
    assert_layout(&mason, child3_id, "child3", 0.0, 200.0, 100.0, 100.0);
}
