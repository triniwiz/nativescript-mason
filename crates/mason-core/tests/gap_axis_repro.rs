use mason_core::*;

// Confirms which axis of Style::gap()'s Size<LengthPercentage> the flex
// algorithm reads as the *main-axis* gap for a row-direction container.
// column-gap is the CSS property for horizontal spacing (between columns),
// so it must land on Size.width for this to pass.
#[test]
fn column_gap_spaces_items_in_row_direction_flex() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::length(100.0),
        });
        s.set_gap(Size {
            width: LengthPercentage::length(10.0), // column-gap
            height: LengthPercentage::length(0.0), // row-gap
        });
    });

    let widths = [10.0, 20.0, 30.0];
    let mut nodes = vec![];
    let mut ids = vec![];
    for w in widths {
        let n = mason.create_node();
        let id = n.id();
        mason.with_style_mut(id, |s| {
            s.set_size(Size {
                width: Dimension::length(w),
                height: Dimension::length(100.0),
            });
        });
        ids.push(id);
        nodes.push(n);
    }
    mason.append_node(rid, &ids);

    mason.compute_wh(rid, 80.0, 100.0);

    let l0 = mason.layout_raw(ids[0]);
    let l1 = mason.layout_raw(ids[1]);
    let l2 = mason.layout_raw(ids[2]);

    println!("x0={} x1={} x2={}", l0.location.x, l1.location.x, l2.location.x);

    // Expected: 0, 10+10=20, 20+20+10=50 (10px column-gap between each pair)
    assert!((l0.location.x - 0.0).abs() < 0.5, "item0 x expected 0, got {}", l0.location.x);
    assert!((l1.location.x - 20.0).abs() < 0.5, "item1 x expected 20 (gap applied), got {}", l1.location.x);
    assert!((l2.location.x - 50.0).abs() < 0.5, "item2 x expected 50 (gap applied), got {}", l2.location.x);
}
