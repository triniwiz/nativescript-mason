use mason_core::*;

// WebSpec `gap_percentage_row_gap_wrapping`. The container's block size is indefinite, so
// its percentage row-gap resolves to zero: Chromium puts the rows at y=0/20/40, height 60.
// As WebSpec computes it: the fixture root is abspos inside a 1024-wide abspos "stage".
fn staged(mason: &mut Mason) -> (Id, Id, Vec<Id>) {
    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });
    std::mem::forget(stage);

    let (root_id, kids) = build(mason);
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_box_sizing(BoxSizing::BorderBox);
    });
    mason.append_node(stage_id, &[root_id]);
    (stage_id, root_id, kids)
}

fn build(mason: &mut Mason) -> (Id, Vec<Id>) {
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
        s.set_gap(Size {
            width: LengthPercentage::length(10.0),
            height: LengthPercentage::percent(0.10),
        });
    });
    std::mem::forget(root);

    let mut kids = Vec::new();
    for _ in 0..9 {
        let child = mason.create_node();
        let id = child.id();
        mason.with_style_mut(id, |s| {
            s.set_size(Size {
                width: Dimension::length(20.0),
                height: Dimension::length(20.0),
            });
        });
        std::mem::forget(child);
        kids.push(id);
    }
    mason.append_node(root_id, &kids);
    (root_id, kids)
}

#[test]
fn percentage_row_gap_against_indefinite_height_is_zero() {
    let mut mason = Mason::new();
    let (root_id, kids) = build(&mut mason);
    mason.compute_wh(root_id, 1280.0, 2688.0);

    let rows: Vec<f32> = [0usize, 3, 6]
        .iter()
        .map(|&i| mason.layout_raw(kids[i]).location.y)
        .collect();
    let root = mason.layout_raw(root_id);
    println!("row ys = {rows:?}  root height = {}", root.size.height);

    assert_eq!(rows, vec![0.0, 20.0, 40.0], "row positions");
    assert_eq!(root.size.height, 60.0, "container height");
}

#[test]
fn percentage_row_gap_under_abspos_stage_is_zero() {
    let mut mason = Mason::new();
    let (stage_id, root_id, kids) = staged(&mut mason);
    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let rows: Vec<f32> = [0usize, 3, 6]
        .iter()
        .map(|&i| mason.layout_raw(kids[i]).location.y)
        .collect();
    let root = mason.layout_raw(root_id);
    println!("staged row ys = {rows:?}  root height = {}", root.size.height);

    assert_eq!(rows, vec![0.0, 20.0, 40.0], "row positions");
    assert_eq!(root.size.height, 60.0, "container height");
}
