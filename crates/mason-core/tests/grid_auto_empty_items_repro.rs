use mason_core::*;

#[test]
fn grid_auto_places_empty_items_into_all_explicit_tracks() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Grid);
        s.set_size(Size {
            width: Dimension::length(500.0),
            height: Dimension::length(500.0),
        });
        s.set_grid_template_columns_css("repeat(5, 1fr)");
        s.set_grid_template_rows_css("repeat(5, 1fr)");
        s.set_grid_auto_flow(taffy::style::GridAutoFlow::RowDense);
    });

    let mut child_ids = Vec::with_capacity(25);
    for _ in 0..25 {
        let child = mason.create_node();
        let child_id = child.id();
        mason.append_node(root_id, &[child_id]);
        child_ids.push(child_id);
    }

    mason.compute_wh(root_id, 500.0, 500.0);

    for (index, child_id) in child_ids.into_iter().enumerate() {
        let layout = mason.layout_raw(child_id);
        assert!(
            (layout.size.width - 100.0).abs() < 0.5 && (layout.size.height - 100.0).abs() < 0.5,
            "child {index} should stretch to one 100x100 grid cell, got {:?}",
            layout.size
        );

        let expected_x = ((index % 5) as f32) * 100.0;
        let expected_y = ((index / 5) as f32) * 100.0;
        assert!(
            (layout.location.x - expected_x).abs() < 0.5 && (layout.location.y - expected_y).abs() < 0.5,
            "child {index} should be at ({expected_x}, {expected_y}), got {:?}",
            layout.location
        );
    }
}
