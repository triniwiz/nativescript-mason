use mason_core::*;

// Repro for the WebSpec gap-percentage cluster: gap_column_gap_percentage_
// cyclic*, gap_column_gap_percentage_flexible*, gap_percentage_row_gap_
// wrapping. All pass here — the real bug is Android-side, not mason-core.
//
// NodeRef::drop garbage-collects a node with no parent/children, so keep
// every NodeRef alive for the test's duration.

fn new_stage(mason: &mut Mason) -> (NodeRef, Id) {
    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size { width: Dimension::length(1024.0), height: Dimension::auto() });
    });
    (stage, stage_id)
}

fn assert_layout(mason: &Mason, id: Id, label: &str, x: f32, y: f32, w: f32, h: f32) {
    let l = mason.layout_raw(id);
    let ok = (l.location.x - x).abs() < 0.05
        && (l.location.y - y).abs() < 0.05
        && (l.size.width - w).abs() < 0.05
        && (l.size.height - h).abs() < 0.05;
    println!(
        "{label}: expected x={x} y={y} w={w} h={h} | got x={} y={} w={} h={}  [{}]",
        l.location.x,
        l.location.y,
        l.size.width,
        l.size.height,
        if ok { "MATCH" } else { "MISMATCH" }
    );
}

#[test]
fn gap_column_gap_percentage_cyclic_shrinkable() {
    // tree: { flex-direction: row, column-gap: 20% }, 3x { width:20px, height:40px }
    // expected: root 60x40; c0 x=0 w=12; c1 x=24 w=12; c2 x=48 w=12
    let mut mason = Mason::new();
    let (_stage, stage_id) = new_stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_gap(Size { width: LengthPercentage::percent(0.20), height: LengthPercentage::length(0.0) });
    });

    let mut children = vec![];
    for _ in 0..3 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(40.0) });
        });
        children.push((c, cid));
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 60.0, 40.0);
    let expected = [(0.0, 12.0), (24.0, 12.0), (48.0, 12.0)];
    for (i, (_, cid)) in children.iter().enumerate() {
        assert_layout(&mason, *cid, &format!("child{i}"), expected[i].0, 0.0, expected[i].1, 40.0);
    }
}

#[test]
fn gap_column_gap_percentage_cyclic_unshrinkable() {
    // tree: { flex-direction: row, column-gap: 20% }, 3x { width:20px, height:40px, flex-shrink:0 }
    // expected: root 60x40; c0 x=0 w=20; c1 x=32 w=20; c2 x=64 w=20
    let mut mason = Mason::new();
    let (_stage, stage_id) = new_stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_gap(Size { width: LengthPercentage::percent(0.20), height: LengthPercentage::length(0.0) });
    });

    let mut children = vec![];
    for _ in 0..3 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(40.0) });
            s.set_flex_shrink(0.0);
        });
        children.push((c, cid));
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 60.0, 40.0);
    let expected = [(0.0, 20.0), (32.0, 20.0), (64.0, 20.0)];
    for (i, (_, cid)) in children.iter().enumerate() {
        assert_layout(&mason, *cid, &format!("child{i}"), expected[i].0, 0.0, expected[i].1, 40.0);
    }
}

#[test]
fn gap_column_gap_percentage_cyclic_partially_shrinkable() {
    // tree: column-gap:50%, children [flex-shrink:0 w20, default(shrink1) w20, flex-shrink:0 w20]
    // expected: root 60x40; c0 x=0 w=20; c1 x=50 w=0; c2 x=80 w=20
    let mut mason = Mason::new();
    let (_stage, stage_id) = new_stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_gap(Size { width: LengthPercentage::percent(0.50), height: LengthPercentage::length(0.0) });
    });

    let force_shrink0 = [true, false, true];
    let mut children = vec![];
    for i in 0..3 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(40.0) });
            if force_shrink0[i] {
                s.set_flex_shrink(0.0);
            }
        });
        children.push((c, cid));
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 60.0, 40.0);
    assert_layout(&mason, children[0].1, "child0", 0.0, 0.0, 20.0, 40.0);
    assert_layout(&mason, children[1].1, "child1", 50.0, 0.0, 0.0, 40.0);
    assert_layout(&mason, children[2].1, "child2", 80.0, 0.0, 20.0, 40.0);
}

#[test]
fn gap_column_gap_percentage_flexible() {
    // tree: row, width:100 height:100, column-gap:10%, row-gap:20px, 3x flex:1
    // expected: root 100x100; c0 x=0 w=26.65625; c1 x=36.65625 w=26.671875; c2 x=73.328125 w=26.671875
    let mut mason = Mason::new();
    let (_stage, stage_id) = new_stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_size(Size { width: Dimension::length(100.0), height: Dimension::length(100.0) });
        s.set_gap(Size { width: LengthPercentage::percent(0.10), height: LengthPercentage::length(20.0) });
    });

    let mut children = vec![];
    for _ in 0..3 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_flex_grow(1.0);
            s.set_flex_shrink(1.0);
            s.set_flex_basis(Dimension::percent(0.0));
        });
        children.push((c, cid));
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, children[0].1, "child0", 0.0, 0.0, 26.65625, 100.0);
    assert_layout(&mason, children[1].1, "child1", 36.65625, 0.0, 26.671875, 100.0);
    assert_layout(&mason, children[2].1, "child2", 73.328125, 0.0, 26.671875, 100.0);
}

#[test]
fn gap_column_gap_percentage_flexible_with_padding() {
    // tree: row, width:100 height:100, column-gap:10%, row-gap:20px, padding:10px, 3x flex:1
    // expected: c0 x=10 w=21.328125; c1 x=39.328125 w=21.34375; c2 x=68.671875 w=21.328125
    let mut mason = Mason::new();
    let (_stage, stage_id) = new_stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_size(Size { width: Dimension::length(100.0), height: Dimension::length(100.0) });
        s.set_gap(Size { width: LengthPercentage::percent(0.10), height: LengthPercentage::length(20.0) });
        s.set_padding(Rect {
            left: LengthPercentage::length(10.0),
            right: LengthPercentage::length(10.0),
            top: LengthPercentage::length(10.0),
            bottom: LengthPercentage::length(10.0),
        });
    });

    let mut children = vec![];
    for _ in 0..3 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_flex_grow(1.0);
            s.set_flex_shrink(1.0);
            s.set_flex_basis(Dimension::percent(0.0));
        });
        children.push((c, cid));
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, children[0].1, "child0", 10.0, 10.0, 21.328125, 80.0);
    assert_layout(&mason, children[1].1, "child1", 39.328125, 10.0, 21.34375, 80.0);
    assert_layout(&mason, children[2].1, "child2", 68.671875, 10.0, 21.328125, 80.0);
}

#[test]
fn gap_percentage_row_gap_wrapping() {
    // tree: row, flex-wrap, width:80, column-gap:10px, row-gap:10%; 9x {w20,h20}
    // expected root 80x60 (3 rows of 20, i.e. row-gap resolves to 0 for the auto-height container)
    let mut mason = Mason::new();
    let (_stage, stage_id) = new_stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_size(Size { width: Dimension::length(80.0), height: Dimension::auto() });
        s.set_gap(Size { width: LengthPercentage::length(10.0), height: LengthPercentage::percent(0.10) });
    });

    let mut children = vec![];
    for _ in 0..9 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(20.0) });
        });
        children.push((c, cid));
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 80.0, 60.0);
    let expected = [
        (0.0, 0.0), (30.0, 0.0), (60.0, 0.0),
        (0.0, 20.0), (30.0, 20.0), (60.0, 20.0),
        (0.0, 40.0), (30.0, 40.0), (60.0, 40.0),
    ];
    for (i, (_, cid)) in children.iter().enumerate() {
        assert_layout(&mason, *cid, &format!("child{i}"), expected[i].0, expected[i].1, 20.0, 20.0);
    }
}

#[test]
fn gap_column_gap_wrap_align_flex_start_and_end() {
    // Explicitly named as a candidate in this cluster's task description,
    // even though it carries no percentage gap (px gap + align-content) —
    // included for completeness. tree: row wrap, align-content: flex-start
    // or flex-end, width:100 height:100, column-gap:10px row-gap:20px, 6x 20x20
    for (align, expected_y0) in [(AlignContent::FLEX_START, 0.0_f32), (AlignContent::FLEX_END, 40.0_f32)] {
        let mut mason = Mason::new();
        let (_stage, stage_id) = new_stage(&mut mason);
        let root = mason.create_node();
        let root_id = root.id();
        mason.with_style_mut(root_id, |s| {
            s.set_position(Position::Absolute);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_flex_direction(FlexDirection::Row);
            s.set_flex_wrap(FlexWrap::Wrap);
            s.set_align_content(Some(align));
            s.set_size(Size { width: Dimension::length(100.0), height: Dimension::length(100.0) });
            s.set_gap(Size { width: LengthPercentage::length(10.0), height: LengthPercentage::length(20.0) });
        });
        let mut children = vec![];
        for _ in 0..6 {
            let c = mason.create_node();
            let cid = c.id();
            mason.with_style_mut(cid, |s| {
                s.set_position(Position::Relative);
                s.set_display(Display::Flex);
                s.set_box_sizing(BoxSizing::BorderBox);
                s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(20.0) });
            });
            children.push((c, cid));
        }
        mason.append_node(stage_id, &[root_id]);
        mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
        mason.compute_wh(stage_id, 1280.0, 2688.0);

        assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
        assert_layout(&mason, children[0].1, "child0(row0)", 0.0, expected_y0, 20.0, 20.0);
    }
}
