use mason_core::*;

// Reproduces WebSpec's `min_width_overrides_max_width` fixture: a childless
// `display:flex` root with no explicit size, wrapping a single child whose
// `min-width` (100) exceeds its `max-width` (50) — a legal but conflicting
// CSS state. Per the standard CSS clamp (`used = max(min, min(specified,
// max))`), `min-width` must win: both the child and the shrink-wrapping
// root should end up 100 wide, not 50.
//
// This is a regression test for a real bug introduced (and fixed same
// session) while patching taffy's `determine_container_main_size` for
// max-size shrink-wrap support (see mason-taffy-max-size-shrinkwrap
// memory): the first version of that fix clamped to min_size before
// max_size, so on a min>max conflict the max clamp ran last and silently
// overrode the min. Fixed by clamping to max_size first, then min_size.
#[test]
fn min_width_overrides_max_width_on_shrinkwrap_child() {
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
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
    });

    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_position(Position::Relative);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_min_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(50.0),
            height: Dimension::auto(),
        });
    });

    mason.append_node(stage_id, &[fixture_root_id]);
    mason.append_node(fixture_root_id, &[child_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let root_l = mason.layout_raw(fixture_root_id);
    let child_l = mason.layout_raw(child_id);
    println!(
        "fixture_root width={} height={} | child width={} height={}",
        root_l.size.width, root_l.size.height, child_l.size.width, child_l.size.height
    );

    assert!(
        (child_l.size.width - 100.0).abs() < 0.5,
        "expected min-width to win over the smaller max-width (100), got {}",
        child_l.size.width
    );
    assert!(
        (root_l.size.width - 100.0).abs() < 0.5,
        "expected shrink-wrapping root width 100 (matching its min-width-clamped child), got {}",
        root_l.size.width
    );
}
