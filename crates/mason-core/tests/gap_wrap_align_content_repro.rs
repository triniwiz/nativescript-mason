use mason_core::*;

// Repro for gap_column_gap_wrap_align_flex_start/end: flex-wrap + align-content
// + fixed-px row/column gap, using the real stage-wrapped dispatch shape.
// Both pass — confirms mason-core is not the cause of the on-device failure.

fn assert_layout(mason: &Mason, id: Id, label: &str, x: f32, y: f32, w: f32, h: f32) {
    let l = mason.layout_raw(id);
    println!("{label}: got x={} y={} w={} h={}", l.location.x, l.location.y, l.size.width, l.size.height);
    assert!(
        (l.location.x - x).abs() < 0.5 && (l.location.y - y).abs() < 0.5
            && (l.size.width - w).abs() < 0.5 && (l.size.height - h).abs() < 0.5,
        "{label}: expected x={x} y={y} w={w} h={h}, got x={} y={} w={} h={}",
        l.location.x, l.location.y, l.size.width, l.size.height
    );
}

#[test]
fn gap_column_gap_wrap_align_flex_end_webspec_shape() {
    let mut mason = Mason::new();
    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size { width: Dimension::length(1024.0), height: Dimension::auto() });
    });

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_align_content(Some(AlignContent::FLEX_END));
        s.set_size(Size { width: Dimension::length(100.0), height: Dimension::length(100.0) });
        s.set_gap(Size { width: LengthPercentage::length(10.0), height: LengthPercentage::length(20.0) });
    });
    let mut children = vec![];
    let mut child_refs = vec![];
    for _ in 0..6 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(20.0) });
        });
        children.push(cid);
        child_refs.push(c);
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, children[0], "seq1", 0.0, 40.0, 20.0, 20.0);
    assert_layout(&mason, children[1], "seq2", 30.0, 40.0, 20.0, 20.0);
    assert_layout(&mason, children[2], "seq3", 60.0, 40.0, 20.0, 20.0);
    assert_layout(&mason, children[3], "seq4", 0.0, 80.0, 20.0, 20.0);
    assert_layout(&mason, children[4], "seq5", 30.0, 80.0, 20.0, 20.0);
    assert_layout(&mason, children[5], "seq6", 60.0, 80.0, 20.0, 20.0);
}

#[test]
fn gap_column_gap_wrap_align_flex_start_webspec_shape() {
    let mut mason = Mason::new();
    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size { width: Dimension::length(1024.0), height: Dimension::auto() });
    });

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_align_content(Some(AlignContent::FLEX_START));
        s.set_size(Size { width: Dimension::length(100.0), height: Dimension::length(100.0) });
        s.set_gap(Size { width: LengthPercentage::length(10.0), height: LengthPercentage::length(20.0) });
    });
    let mut children = vec![];
    let mut child_refs = vec![];
    for _ in 0..6 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
            s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(20.0) });
        });
        children.push(cid);
        child_refs.push(c);
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children);
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, children[0], "seq1", 0.0, 0.0, 20.0, 20.0);
    assert_layout(&mason, children[1], "seq2", 30.0, 0.0, 20.0, 20.0);
    assert_layout(&mason, children[2], "seq3", 60.0, 0.0, 20.0, 20.0);
    assert_layout(&mason, children[3], "seq4", 0.0, 40.0, 20.0, 20.0);
    assert_layout(&mason, children[4], "seq5", 30.0, 40.0, 20.0, 20.0);
    assert_layout(&mason, children[5], "seq6", 60.0, 40.0, 20.0, 20.0);
}
