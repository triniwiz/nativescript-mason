use mason_core::*;

// Unlike the other max_width_*_repro.rs tests, this calls compute_wh
// directly on a node that already has a real parent — matching
// nativeNodeComputeWithSizeAndLayout's actual call shape from onMeasure.
#[test]
fn max_width_overrides_width_when_computed_directly_on_child_with_parent() {
    let mut mason = Mason::new();

    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });

    let fixture_root = mason.create_node();
    let fixture_root_id = fixture_root.id();
    mason.with_style_mut(fixture_root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
    });

    mason.append_node(stage_id, &[fixture_root_id]);

    mason.compute_wh(fixture_root_id, 1280.0, 2688.0);

    let l = mason.layout_raw(fixture_root_id);
    println!(
        "fixture_root (computed directly, has real parent) width={} height={}",
        l.size.width, l.size.height
    );
    assert!(
        (l.size.width - 100.0).abs() < 0.5,
        "expected clamped width 100, got {}",
        l.size.width
    );
}

#[test]
fn max_width_child_direct_compute_packed_layout_matches() {
    let mut mason = Mason::new();

    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });

    let fixture_root = mason.create_node();
    let fixture_root_id = fixture_root.id();
    mason.with_style_mut(fixture_root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
    });

    mason.append_node(stage_id, &[fixture_root_id]);

    mason.compute_wh(fixture_root_id, 1280.0, 2688.0);

    let packed = mason.layout(fixture_root_id);
    println!("packed[0..8] = {:?}", &packed[0..8.min(packed.len())]);
    // stride is order,x,y,width,height,... => width at index 3
    assert!(
        (packed[3] - 100.0).abs() < 0.5,
        "expected packed width 100, got {}",
        packed[3]
    );
}
