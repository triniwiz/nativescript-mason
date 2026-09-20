use mason_core::*;

// How an absolutely positioned, shrink-to-fit box is sized. Computed as WebSpec does it:
// the fixture root is abspos inside a 1024-wide abspos "stage".
fn stage(mason: &mut Mason) -> Id {
    let stage = mason.create_node();
    let id = stage.id();
    mason.with_style_mut(id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });
    std::mem::forget(stage);
    id
}

fn node(mason: &mut Mason, f: impl FnOnce(&mut mason_core::style::Style)) -> Id {
    let n = mason.create_node();
    let id = n.id();
    mason.with_style_mut(id, f);
    std::mem::forget(n);
    id
}

// `size_defined_by_child_with_padding`: a shrink-to-fit box with 10px padding
// around a 10x10 child is 30x30, and the child keeps its 10x10.
#[test]
fn shrink_to_fit_box_includes_its_own_padding() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root_id = node(&mut mason, |s| {
        s.set_position(Position::Absolute);
        // WebSpec runs with preflight, so every box is border-box, and masonkit's
        // View defaults to display:flex.
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_display(Display::Flex);
        s.set_padding(Rect {
            left: LengthPercentage::length(10.0),
            right: LengthPercentage::length(10.0),
            top: LengthPercentage::length(10.0),
            bottom: LengthPercentage::length(10.0),
        });
    });
    let child_id = node(&mut mason, |s| {
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(10.0),
            height: Dimension::length(10.0),
        });
    });
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let root = mason.layout_raw(root_id);
    let child = mason.layout_raw(child_id);
    println!("root = {:?}  child = {:?} {:?}", root.size, child.location, child.size);
    assert_eq!((root.size.width, root.size.height), (30.0, 30.0), "root");
    assert_eq!((child.size.width, child.size.height), (10.0, 10.0), "child");
}

// `gap_column_gap_percentage_cyclic_shrinkable`: a cyclic percentage column-gap resolves
// against the row's own resulting width (60), giving 12px gaps and shrinking items to 12.
#[test]
fn cyclic_percentage_column_gap_resolves_against_the_resulting_width() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root_id = node(&mut mason, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_gap(Size {
            width: LengthPercentage::percent(0.20),
            height: LengthPercentage::length(0.0),
        });
    });
    let kids: Vec<Id> = (0..3)
        .map(|_| {
            node(&mut mason, |s| {
                s.set_size(Size {
                    width: Dimension::length(20.0),
                    height: Dimension::length(40.0),
                })
            })
        })
        .collect();
    mason.append_node(stage_id, &[root_id]);
    mason.append_node(root_id, &kids);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let root = mason.layout_raw(root_id);
    let xs: Vec<f32> = kids.iter().map(|&k| mason.layout_raw(k).location.x).collect();
    let ws: Vec<f32> = kids.iter().map(|&k| mason.layout_raw(k).size.width).collect();
    println!("root width = {}  xs = {xs:?}  widths = {ws:?}", root.size.width);
    assert_eq!(root.size.width, 60.0, "root width");
    assert_eq!(xs, vec![0.0, 24.0, 48.0], "item positions");
    assert_eq!(ws, vec![12.0, 12.0, 12.0], "item widths");
}
