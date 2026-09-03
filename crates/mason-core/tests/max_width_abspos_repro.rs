use mason_core::*;

// Reproduces the WebSpec harness structure: an outer position:absolute
// staging container (width 1024, no display set -> Block) wraps the fixture
// root, which is ALSO forced to position:absolute (no inset set) and carries
// the fixture's own explicit width + max-width, laid out against a
// definite device-screen-sized available space (matches computeAndLayout's
// w=1280 h=2688 seen in the real app logs).
#[test]
fn max_width_overrides_width_when_root_is_nested_abspos() {
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

    // Definite available space matching the real device screen dims from
    // the logcat capture (w=1280.0 h=2688.0).
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let l = mason.layout_raw(fixture_root_id);
    println!("fixture_root width={} height={}", l.size.width, l.size.height);
    assert!(
        (l.size.width - 100.0).abs() < 0.5,
        "expected clamped width 100, got {}",
        l.size.width
    );
}
