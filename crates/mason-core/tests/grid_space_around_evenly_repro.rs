use mason_core::*;

// Repro for the WebSpec grid_align_content/grid_justify_content
// space_around/space_evenly fixtures. Root cause: utils/mod.rs's
// align_content_to_enum had SpaceAround/SpaceEvenly's wire codes swapped
// relative to align_content_from_enum, so the two keywords decoded back out
// as each other. Fixed there; not a taffy bug.
//
// Tree: a 3x3 `display:grid` root (grid-template-columns/rows: 40px 40px
// 40px) with 9 grid-item children, optionally with padding/border.

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
    assert!(
        ok,
        "{label}: expected x={x} y={y} w={w} h={h}, got x={} y={} w={} h={}",
        l.location.x, l.location.y, l.size.width, l.size.height
    );
}

/// Builds the shared 3x3-grid tree. `with_padding_border` mirrors the
/// `_with_padding_border` fixture variants (`padding: 10px 20px 30px 40px`,
/// `border-width: 2px 4px 6px 8px` — top/right/bottom/left order, matching
/// CSS shorthand order).
fn build_grid(
    mason: &mut Mason,
    configure: impl FnOnce(&mut Style),
    with_padding_border: bool,
) -> (NodeRef, Id, Vec<(NodeRef, Id)>) {
    let (_stage, stage_id) = new_stage(mason);
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Grid);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_size(Size { width: Dimension::length(200.0), height: Dimension::length(200.0) });
        s.set_grid_template_columns_css("40px 40px 40px");
        s.set_grid_template_rows_css("40px 40px 40px");
        if with_padding_border {
            s.set_padding(Rect {
                top: LengthPercentage::length(10.0),
                right: LengthPercentage::length(20.0),
                bottom: LengthPercentage::length(30.0),
                left: LengthPercentage::length(40.0),
            });
            s.set_border(Rect {
                top: LengthPercentage::length(2.0),
                right: LengthPercentage::length(4.0),
                bottom: LengthPercentage::length(6.0),
                left: LengthPercentage::length(8.0),
            });
        }
        configure(s);
    });

    let mut children = vec![];
    for _ in 0..9 {
        let c = mason.create_node();
        let cid = c.id();
        mason.with_style_mut(cid, |s| {
            s.set_position(Position::Relative);
            s.set_display(Display::Flex);
            s.set_box_sizing(BoxSizing::BorderBox);
        });
        children.push((c, cid));
    }
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &children.iter().map(|(_, id)| *id).collect::<Vec<_>>());
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    (root, root_id, children)
}

#[test]
fn grid_align_content_space_around() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_align_content(Some(AlignContent::SPACE_AROUND)), false);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_y = [13.328125_f32, 79.984375, 146.640625];
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                (col as f32) * 40.0,
                expected_y[row],
                40.0,
                40.0,
            );
        }
    }
}

#[test]
fn grid_align_content_space_around_with_padding_border() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_align_content(Some(AlignContent::SPACE_AROUND)), true);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_x0 = 48.0_f32; // border-left 8 + padding-left 40
    let expected_y = [17.328125_f32, 67.984375, 118.640625];
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                expected_x0 + (col as f32) * 40.0,
                expected_y[row],
                40.0,
                40.0,
            );
        }
    }
}

#[test]
fn grid_align_content_space_evenly() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_align_content(Some(AlignContent::SPACE_EVENLY)), false);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_y = [20.0_f32, 80.0, 140.0];
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                (col as f32) * 40.0,
                expected_y[row],
                40.0,
                40.0,
            );
        }
    }
}

#[test]
fn grid_align_content_space_evenly_with_padding_border() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_align_content(Some(AlignContent::SPACE_EVENLY)), true);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_x0 = 48.0_f32;
    let expected_y = [20.0_f32, 68.0, 116.0];
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                expected_x0 + (col as f32) * 40.0,
                expected_y[row],
                40.0,
                40.0,
            );
        }
    }
}

#[test]
fn grid_justify_content_space_around() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_justify_content(Some(JustifyContent::SPACE_AROUND)), false);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_x = [13.328125_f32, 79.984375, 146.640625];
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                expected_x[col],
                (row as f32) * 40.0,
                40.0,
                40.0,
            );
        }
    }
}

#[test]
fn grid_justify_content_space_around_with_padding_border() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_justify_content(Some(JustifyContent::SPACE_AROUND)), true);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_x = [49.328125_f32, 91.984375, 134.640625];
    let expected_y0 = 12.0_f32;
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                expected_x[col],
                expected_y0 + (row as f32) * 40.0,
                40.0,
                40.0,
            );
        }
    }
}

#[test]
fn grid_justify_content_space_evenly() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_justify_content(Some(JustifyContent::SPACE_EVENLY)), false);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_x = [20.0_f32, 80.0, 140.0];
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                expected_x[col],
                (row as f32) * 40.0,
                40.0,
                40.0,
            );
        }
    }
}

#[test]
fn grid_justify_content_space_evenly_with_padding_border() {
    let mut mason = Mason::new();
    let (_root_ref, root_id, children) =
        build_grid(&mut mason, |s| s.set_justify_content(Some(JustifyContent::SPACE_EVENLY)), true);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    let expected_x = [50.0_f32, 92.0, 134.0];
    let expected_y0 = 12.0_f32;
    for row in 0..3 {
        for col in 0..3 {
            let idx = row * 3 + col;
            assert_layout(
                &mason,
                children[idx].1,
                &format!("cell(r{row},c{col})"),
                expected_x[col],
                expected_y0 + (row as f32) * 40.0,
                40.0,
                40.0,
            );
        }
    }
}
