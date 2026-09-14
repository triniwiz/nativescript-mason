//! Repro for the WebSpec fixture `width_smaller_then_content_with_flex_grow_small_size`.
//!
//! An outer row (`width: 10px`) with two flex-grow:1 columns, each column
//! containing one fixed-size box wider than the shared 5px slot. Root stays
//! at its definite 10px width; the columns split it 5/5 regardless of their
//! content's min-content size, and the content boxes keep their own size
//! (columns clip / overflow, they don't grow to fit).

use mason_core::*;

#[test]
fn root_definite_width_wins_over_child_min_content() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_size(Size {
            width: Dimension::length(10.0),
            height: Dimension::auto(),
        });
    });

    let col_a = mason.create_node();
    let aid = col_a.id();
    let col_b = mason.create_node();
    let bid = col_b.id();
    mason.append_node(rid, &[aid, bid]);

    for (id, dir) in [(aid, FlexDirection::Column), (bid, FlexDirection::Column)] {
        mason.with_style_mut(id, |s| {
            s.set_display(Display::Flex);
            s.set_flex_direction(dir);
            s.set_flex_grow(1.0);
            s.set_size(Size {
                width: Dimension::length(0.0),
                height: Dimension::auto(),
            });
        });
    }

    let box_a = mason.create_node();
    let box_a_id = box_a.id();
    mason.with_style_mut(box_a_id, |s| {
        s.set_size(Size {
            width: Dimension::length(70.0),
            height: Dimension::length(100.0),
        });
    });
    mason.append_node(aid, &[box_a_id]);

    let box_b = mason.create_node();
    let box_b_id = box_b.id();
    mason.with_style_mut(box_b_id, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::length(100.0),
        });
    });
    mason.append_node(bid, &[box_b_id]);

    mason.compute_wh(rid, 10.0, 100.0);

    let root_l = mason.layout_raw(rid);
    assert!((root_l.size.width - 10.0).abs() < 0.5, "root width expected 10, got {}", root_l.size.width);
    assert!((root_l.size.height - 100.0).abs() < 0.5, "root height expected 100, got {}", root_l.size.height);

    let a_l = mason.layout_raw(aid);
    let b_l = mason.layout_raw(bid);
    assert!((a_l.size.width - 5.0).abs() < 0.5, "col a width expected 5, got {}", a_l.size.width);
    assert!((a_l.location.x - 0.0).abs() < 0.5, "col a x expected 0, got {}", a_l.location.x);
    assert!((b_l.size.width - 5.0).abs() < 0.5, "col b width expected 5, got {}", b_l.size.width);
    assert!((b_l.location.x - 5.0).abs() < 0.5, "col b x expected 5, got {}", b_l.location.x);

    let box_a_l = mason.layout_raw(box_a_id);
    let box_b_l = mason.layout_raw(box_b_id);
    assert!((box_a_l.size.width - 70.0).abs() < 0.5, "box a width expected 70, got {}", box_a_l.size.width);
    assert!((box_b_l.size.width - 20.0).abs() < 0.5, "box b width expected 20, got {}", box_b_l.size.width);
}
