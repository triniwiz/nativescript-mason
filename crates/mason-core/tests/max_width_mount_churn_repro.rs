use mason_core::*;

// Mirrors WebSpec: a `scroll` root with 60 constant sibling "rows" plus one
// off-screen fixture subtree that's removed and recreated each round, to
// try to reproduce the same-style/different-result latch seen on-device.
#[test]
fn max_width_survives_mount_unmount_churn() {
    let mut mason = Mason::new();

    let scroll = mason.create_node();
    let scroll_id = scroll.id();
    mason.with_style_mut(scroll_id, |s| {
        s.set_size(Size {
            width: Dimension::length(1280.0),
            height: Dimension::auto(),
        });
    });

    // Constant sibling "rows" - never removed, matching WebSpec's visible
    // fixture-list rows that stay mounted for the whole run.
    let mut row_ids = Vec::new();
    for _ in 0..60 {
        let row = mason.create_node();
        let row_id = row.id();
        mason.with_style_mut(row_id, |s| {
            s.set_size(Size {
                width: Dimension::auto(),
                height: Dimension::length(40.0),
            });
        });
        row_ids.push(row_id);
    }
    mason.append_node(scroll_id, &row_ids);

    // Off-screen staging container - constant, like WebSpec's staging div.
    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });
    mason.append_node(scroll_id, &[stage_id]);

    // Rounds A and B share the same width/max-width pair (600/300), with
    // other pairs interleaved between them.
    let round_styles: Vec<(f32, f32)> = vec![
        (300.0, 300.0), // trivial
        (600.0, 900.0), // under max, no clamp needed
        (600.0, 300.0), // ROUND A - should clamp to 300
        (150.0, 150.0),
        (300.0, 240.0), // should clamp to 240
        (60.0, 60.0),
        (600.0, 300.0), // ROUND B - identical to ROUND A - should ALSO clamp to 300
        (180.0, 180.0),
        (60.0, 60.0),
    ];

    let mut results = Vec::new();

    for (i, &(width, max_width)) in round_styles.iter().enumerate() {
        let fixture_root = mason.create_node();
        let fixture_root_id = fixture_root.id();
        mason.with_style_mut(fixture_root_id, |s| {
            s.set_position(Position::Absolute);
            s.set_size(Size {
                width: Dimension::length(width),
                height: Dimension::auto(),
            });
            s.set_max_size(Size {
                width: Dimension::length(max_width),
                height: Dimension::auto(),
            });
        });
        mason.append_node(stage_id, &[fixture_root_id]);

        // Compute the WHOLE scroll subtree, exactly like the real
        // `<scroll>` root's single computeAndLayout() call does.
        mason.compute_wh(scroll_id, 1280.0, 2688.0);

        let l = mason.layout_raw(fixture_root_id);
        println!(
            "round {i}: width={width} max_width={max_width} -> computed width={}",
            l.size.width
        );
        results.push((i, width, max_width, l.size.width));

        // Unmount before the next round, exactly like FixtureTree being
        // torn down when WebSpec's runFrom() advances to the next fixture.
        mason.remove_node(stage_id, fixture_root_id);
    }

    for (i, width, max_width, computed) in &results {
        let expected = width.min(*max_width);
        assert!(
            (computed - expected).abs() < 0.5,
            "round {i}: width={width} max_width={max_width} expected clamped width {expected}, got {computed}"
        );
    }
}
