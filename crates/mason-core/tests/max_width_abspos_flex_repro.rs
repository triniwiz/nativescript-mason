use mason_core::*;

// Same shape as max_width_abspos_repro.rs's
// `max_width_overrides_width_when_root_is_nested_abspos`, but with
// `display: flex` on the fixture root — matching WebSpec's real
// `FIXTURE_DEFAULTS` (`{ display: 'flex', boxSizing: 'border-box',
// position: 'relative' }`, with `position` overridden to `absolute` for
// root nodes), which the original repro omitted. This is the WebSpec
// `max_width_overrides_width_on_root` fixture's exact real shape (a
// childless `display:flex` leaf). Confirms `display:flex` on a childless
// node doesn't change the (already-correct) clamp outcome — ruling out
// "the fixture root being flex rather than block" as a cause of that
// fixture's real-device failure, which is a genuine Android-layer bug (see
// mason-android-maxwidth-applylayoutflat-latch memory), not a mason-core one.
#[test]
fn max_width_overrides_width_on_root_with_flex_display() {
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

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let l = mason.layout_raw(fixture_root_id);
    println!("fixture_root width={} height={}", l.size.width, l.size.height);
    assert!(
        (l.size.width - 100.0).abs() < 0.5,
        "expected clamped width 100, got {}",
        l.size.width
    );
}
