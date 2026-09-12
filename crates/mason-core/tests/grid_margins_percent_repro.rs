use mason_core::*;

// Cluster B repro tests for the WebSpec fixtures:
//   grid_margins_auto_margins
//   grid_percent_tracks_indefinite_with_content_overflow
//   grid_percent_tracks_indefinite_with_content_underflow
//   grid_auto_fit_with_empty_auto_track
//
// All 4 base fixtures (20 tests total across their `__{border,content}_box_
// {ltr,rtl}` variants) already PASS in the vendored taffy fork's own
// upstream XML conformance suite (`cd ~/Documents/GitHub/taffy && cargo test
// --test xml -- <name>` — verified before writing this file). So — as with
// Cluster A — the grid track-sizing algorithm itself is confirmed correct
// upstream; these repros check whether mason-core's own wrapper reproduces
// the same numbers.

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
fn grid_margins_auto_margins() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Grid);
        s.set_grid_template_columns_css("40px 40px 40px");
        s.set_grid_template_rows_css("40px 40px 40px");
        s.set_padding(Rect {
            left: LengthPercentage::length(40.0),
            right: LengthPercentage::length(20.0),
            top: LengthPercentage::length(10.0),
            bottom: LengthPercentage::length(30.0),
        });
    });

    let mut children = vec![];
    for i in 1..=9 {
        let c = mason.create_node();
        let cid = c.id();
        match i {
            3 => {
                mason.with_style_mut(cid, |s| {
                    s.set_size(Size {
                        width: Dimension::length(20.0),
                        height: Dimension::auto(),
                    });
                    s.set_justify_self(Some(AlignItems::START));
                    s.set_margin(Rect {
                        left: LengthPercentageAuto::auto(),
                        right: LengthPercentageAuto::auto(),
                        top: LengthPercentageAuto::length(0.0),
                        bottom: LengthPercentageAuto::length(0.0),
                    });
                });
            }
            5 => {
                mason.with_style_mut(cid, |s| {
                    s.set_size(Size {
                        width: Dimension::auto(),
                        height: Dimension::length(20.0),
                    });
                    s.set_align_self(Some(AlignItems::START));
                    s.set_margin(Rect {
                        left: LengthPercentageAuto::length(0.0),
                        right: LengthPercentageAuto::length(0.0),
                        top: LengthPercentageAuto::auto(),
                        bottom: LengthPercentageAuto::auto(),
                    });
                });
            }
            7 => {
                mason.with_style_mut(cid, |s| {
                    s.set_size(Size {
                        width: Dimension::length(20.0),
                        height: Dimension::length(20.0),
                    });
                    s.set_align_self(Some(AlignItems::START));
                    s.set_justify_self(Some(AlignItems::START));
                    s.set_margin(Rect::<LengthPercentageAuto>::auto());
                });
            }
            _ => {}
        }
        mason.append_node(root_id, &[cid]);
        children.push(cid);
    }

    mason.compute(root_id);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 180.0, 160.0);
    assert_layout(&mason, children[0], "seq1", 40.0, 10.0, 40.0, 40.0);
    assert_layout(&mason, children[1], "seq2", 80.0, 10.0, 40.0, 40.0);
    assert_layout(&mason, children[2], "seq3", 130.0, 10.0, 20.0, 40.0);
    assert_layout(&mason, children[3], "seq4", 40.0, 50.0, 40.0, 40.0);
    assert_layout(&mason, children[4], "seq5", 80.0, 60.0, 40.0, 20.0);
    assert_layout(&mason, children[5], "seq6", 120.0, 50.0, 40.0, 40.0);
    assert_layout(&mason, children[6], "seq7", 50.0, 100.0, 20.0, 20.0);
    assert_layout(&mason, children[7], "seq8", 80.0, 90.0, 40.0, 40.0);
    assert_layout(&mason, children[8], "seq9", 120.0, 90.0, 40.0, 40.0);
}

#[test]
fn grid_percent_tracks_indefinite_with_content_overflow() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Grid);
        s.set_grid_template_columns_css("40% 40% 40%");
        s.set_grid_template_rows_css("50% 80%");
    });

    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_grid_row_css("1");
        s.set_grid_column_css("1");
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_grid_row_css("1");
        s.set_grid_column_css("1");
    });

    mason.append_node(root_id, &[c1_id, c2_id]);
    let mut rest = vec![];
    for _ in 0..5 {
        let c = mason.create_node();
        let cid = c.id();
        mason.append_node(root_id, &[cid]);
        rest.push(cid);
    }

    mason.compute(root_id);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, c1_id, "seq1", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, c2_id, "seq2", 0.0, 0.0, 40.0, 50.0);
    assert_layout(&mason, rest[0], "seq3", 40.0, 0.0, 40.0, 50.0);
    assert_layout(&mason, rest[1], "seq4", 80.0, 0.0, 40.0, 50.0);
    assert_layout(&mason, rest[2], "seq5", 0.0, 50.0, 40.0, 80.0);
    assert_layout(&mason, rest[3], "seq6", 40.0, 50.0, 40.0, 80.0);
    assert_layout(&mason, rest[4], "seq7", 80.0, 50.0, 40.0, 80.0);
}

#[test]
fn grid_percent_tracks_indefinite_with_content_underflow() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Grid);
        s.set_grid_template_columns_css("10% 20% 30%");
        s.set_grid_template_rows_css("30% 60%");
    });

    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_grid_row_css("1");
        s.set_grid_column_css("1");
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_grid_row_css("1");
        s.set_grid_column_css("1");
    });

    mason.append_node(root_id, &[c1_id, c2_id]);
    let mut rest = vec![];
    for _ in 0..5 {
        let c = mason.create_node();
        let cid = c.id();
        mason.append_node(root_id, &[cid]);
        rest.push(cid);
    }

    mason.compute(root_id);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, c1_id, "seq1", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, c2_id, "seq2", 0.0, 0.0, 10.0, 30.0);
    assert_layout(&mason, rest[0], "seq3", 10.0, 0.0, 20.0, 30.0);
    assert_layout(&mason, rest[1], "seq4", 30.0, 0.0, 30.0, 30.0);
    assert_layout(&mason, rest[2], "seq5", 0.0, 30.0, 10.0, 60.0);
    assert_layout(&mason, rest[3], "seq6", 10.0, 30.0, 20.0, 60.0);
    assert_layout(&mason, rest[4], "seq7", 30.0, 30.0, 30.0, 60.0);
}

#[test]
fn grid_auto_fit_with_empty_auto_track() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Grid);
        s.set_size(Size {
            width: Dimension::length(120.0),
            height: Dimension::length(120.0),
        });
        s.set_grid_template_columns_css("repeat(auto-fit, 40px)");
        s.set_grid_template_rows_css("40px 40px 40px");
        s.set_justify_content(Some(JustifyContent::SPACE_EVENLY));
    });

    let c1 = mason.create_node();
    let c1_id = c1.id();
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.append_node(root_id, &[c1_id, c2_id]);

    mason.compute(root_id);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 120.0, 120.0);
    assert_layout(&mason, c1_id, "seq1", 13.328125, 0.0, 40.0, 40.0);
    assert_layout(&mason, c2_id, "seq2", 66.65625, 0.0, 40.0, 40.0);
}

// --- WebSpec-shaped variants (abspos root, no explicit size, inside a
// larger definite "stage" -- matching FixtureTree.tsx/cssToStyle.ts's real
// on-device harness) for the two indefinite-percent-track fixtures, whose
// root has NO explicit width/height in the fixture itself. Cluster A found
// a real mason-core-independent-of-taffy divergence specifically in this
// abspos/shrink-to-fit shape (see flexbasis_wrapped_repro.rs) -- checking
// whether grid's own intrinsic/auto sizing has an analogous gap.
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
        s.set_display(Display::Grid);
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

// Matches WebSpec's real on-device shape (percentage grid-track root under
// an indefinite-height "stage" ancestor) more closely than the fixture
// above — this is the one that was actually failing on-device.
#[test]
fn grid_percent_tracks_indefinite_with_content_overflow_webspec_shape() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_grid_template_columns_css("40% 40% 40%");
        s.set_grid_template_rows_css("50% 80%");
    });

    let (_c1, c1_id) = fixture_child(&mut mason);
    mason.with_style_mut(c1_id, |s| {
        s.set_grid_row_css("1");
        s.set_grid_column_css("1");
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });
    let (_c2, c2_id) = fixture_child(&mut mason);
    mason.with_style_mut(c2_id, |s| {
        s.set_grid_row_css("1");
        s.set_grid_column_css("1");
    });
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[c1_id, c2_id]);
    let mut rest = vec![];
    for _ in 0..5 {
        let (_c, cid) = fixture_child(&mut mason);
        mason.append_node(root_id, &[cid]);
        rest.push(cid);
    }

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, c1_id, "seq1", 0.0, 0.0, 100.0, 100.0);
    assert_layout(&mason, c2_id, "seq2", 0.0, 0.0, 40.0, 50.0);
}

// Matches WebSpec's real on-device shape (abspos grid root under an
// auto-height "stage" ancestor) — the fixture above creates root directly,
// skipping that wrapper.
#[test]
fn grid_margins_auto_margins_webspec_shape() {
    let mut mason = Mason::new();
    let (_stage, stage_id) = stage(&mut mason);
    let (_root, root_id) = fixture_root(&mut mason);
    mason.with_style_mut(root_id, |s| {
        s.set_grid_template_columns_css("40px 40px 40px");
        s.set_grid_template_rows_css("40px 40px 40px");
        s.set_padding(Rect {
            left: LengthPercentage::length(40.0),
            right: LengthPercentage::length(20.0),
            top: LengthPercentage::length(10.0),
            bottom: LengthPercentage::length(30.0),
        });
    });

    let (_c1, c1_id) = fixture_child(&mut mason);
    let (_c2, c2_id) = fixture_child(&mut mason);
    let (_c3, c3_id) = fixture_child(&mut mason);
    mason.with_style_mut(c3_id, |s| {
        s.set_size(Size { width: Dimension::length(20.0), height: Dimension::auto() });
        s.set_justify_self(Some(AlignItems::START));
        s.set_margin(Rect {
            left: LengthPercentageAuto::auto(),
            right: LengthPercentageAuto::auto(),
            top: LengthPercentageAuto::length(0.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
    });
    let (_c4, c4_id) = fixture_child(&mut mason);
    let (_c5, c5_id) = fixture_child(&mut mason);
    mason.with_style_mut(c5_id, |s| {
        s.set_size(Size { width: Dimension::auto(), height: Dimension::length(20.0) });
        s.set_align_self(Some(AlignItems::START));
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(0.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::auto(),
            bottom: LengthPercentageAuto::auto(),
        });
    });
    let (_c6, c6_id) = fixture_child(&mut mason);
    let (_c7, c7_id) = fixture_child(&mut mason);
    mason.with_style_mut(c7_id, |s| {
        s.set_size(Size { width: Dimension::length(20.0), height: Dimension::length(20.0) });
        s.set_align_self(Some(AlignItems::START));
        s.set_justify_self(Some(AlignItems::START));
        s.set_margin(Rect::<LengthPercentageAuto>::auto());
    });
    let (_c8, c8_id) = fixture_child(&mut mason);
    let (_c9, c9_id) = fixture_child(&mut mason);

    mason.append_node(stage_id, &[root_id]);
    mason.append_node(
        root_id,
        &[c1_id, c2_id, c3_id, c4_id, c5_id, c6_id, c7_id, c8_id, c9_id],
    );

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 180.0, 160.0);
    assert_layout(&mason, c1_id, "seq1", 40.0, 10.0, 40.0, 40.0);
    assert_layout(&mason, c2_id, "seq2", 80.0, 10.0, 40.0, 40.0);
    assert_layout(&mason, c3_id, "seq3", 130.0, 10.0, 20.0, 40.0);
    assert_layout(&mason, c4_id, "seq4", 40.0, 50.0, 40.0, 40.0);
    assert_layout(&mason, c5_id, "seq5", 80.0, 60.0, 40.0, 20.0);
    assert_layout(&mason, c6_id, "seq6", 120.0, 50.0, 40.0, 40.0);
    assert_layout(&mason, c7_id, "seq7", 50.0, 100.0, 20.0, 20.0);
    assert_layout(&mason, c8_id, "seq8", 80.0, 90.0, 40.0, 40.0);
    assert_layout(&mason, c9_id, "seq9", 120.0, 90.0, 40.0, 40.0);
}
