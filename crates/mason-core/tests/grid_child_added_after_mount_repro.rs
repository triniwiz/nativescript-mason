use mason_core::*;

// Repro for the css-grid-generator app: an absolutely-positioned overlay
// grid starts with ZERO children (mount + compute), then the app adds ONE
// new child post-mount (tap-to-place-a-div) and expects it to lay out at
// its grid-area immediately, with no further explicit re-mount of siblings.
#[test]
fn grid_overlay_child_added_after_initial_zero_child_compute() {
    let mut mason = Mason::new();

    let container = mason.create_node();
    let container_id = container.id();
    mason.with_style_mut(container_id, |s| {
        s.set_size(Size {
            width: Dimension::length(500.0),
            height: Dimension::length(500.0),
        });
        s.set_position(Position::Relative);
    });

    let overlay = mason.create_node();
    let overlay_id = overlay.id();
    mason.with_style_mut(overlay_id, |s| {
        s.set_display(Display::Grid);
        s.set_position(Position::Absolute);
        s.set_inset(Rect {
            left: LengthPercentageAuto::length(0.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(0.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
        s.set_size(Size {
            width: Dimension::percent(1.0),
            height: Dimension::percent(1.0),
        });
        s.set_grid_template_columns_css("repeat(5, 1fr)");
        s.set_grid_template_rows_css("repeat(5, 1fr)");
    });
    mason.append_node(container_id, &[overlay_id]);

    // Initial mount: overlay grid has zero children, exactly like
    // `state.childarea = []` on first render.
    mason.compute_layout(container_id, Size::max_content());
    let before = mason.layout_raw(overlay_id);
    assert!(
        (before.size.width - 500.0).abs() < 0.5 && (before.size.height - 500.0).abs() < 0.5,
        "overlay should already be 500x500 before any child is added, got {:?}",
        before.size
    );

    // User taps a start cell then an end cell -> exactly one new child is
    // appended to the already-computed overlay grid, matching
    // `state.childarea.push(area)` -> Vue mounts one new v-for item.
    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_grid_area("1 / 1 / 2 / 2");
        s.set_border(Rect {
            left: LengthPercentage::length(1.0),
            right: LengthPercentage::length(1.0),
            top: LengthPercentage::length(1.0),
            bottom: LengthPercentage::length(1.0),
        });
        s.set_padding(Rect {
            left: LengthPercentage::length(4.0),
            right: LengthPercentage::length(4.0),
            top: LengthPercentage::length(4.0),
            bottom: LengthPercentage::length(4.0),
        });
    });
    mason.append_node(overlay_id, &[child_id]);

    mason.compute_layout(container_id, Size::max_content());
    let child_layout = mason.layout_raw(child_id);

    assert!(
        child_layout.size.width > 1.0 && child_layout.size.height > 1.0,
        "newly-added .divN child should be laid out at its 1/5 x 1/5 grid cell, got zero/near-zero size {:?} (this is the 'tap a box, nothing colored appears' bug)",
        child_layout.size
    );
}
