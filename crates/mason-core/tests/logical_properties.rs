use mason_core::style::WritingMode;
use mason_core::*;

// CSS logical properties map onto physical sides by the box's writing mode and direction; a
// logical value applies when it was written after the physical one on its side.

const BLOCK_START: usize = 0;
const INLINE_END: usize = 1;
const BLOCK_END: usize = 2;
const INLINE_START: usize = 3;

fn px(v: f32) -> LengthPercentageAuto {
    LengthPercentageAuto::length(v)
}

fn margins(mason: &Mason, id: Id) -> [f32; 4] {
    let l = mason.layout_raw(id);
    [l.margin.top, l.margin.right, l.margin.bottom, l.margin.left]
}

/// A 100x100 child of a block root in `mode`, styled by `apply`.
fn child(mode: WritingMode, apply: impl FnOnce(&mut mason_core::style::Style)) -> (Mason, Id, Id) {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    std::mem::forget(root);
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(mode);
        s.set_size(Size {
            width: Dimension::length(400.0),
            height: Dimension::length(400.0),
        });
    });
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    mason.with_style_mut(id, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
        apply(s);
    });
    mason.append_node(root_id, &[id]);
    mason.compute_wh(root_id, 400.0, 400.0);
    (mason, root_id, id)
}

fn all_sides(s: &mut mason_core::style::Style) {
    s.set_logical_margin(BLOCK_START, px(1.0));
    s.set_logical_margin(INLINE_END, px(2.0));
    s.set_logical_margin(BLOCK_END, px(3.0));
    s.set_logical_margin(INLINE_START, px(4.0));
}

#[test]
fn horizontal_ltr_maps_block_to_top_and_bottom_and_inline_start_to_left() {
    let (mason, _, id) = child(WritingMode::HorizontalTb, all_sides);
    assert_eq!(margins(&mason, id), [1.0, 2.0, 3.0, 4.0]);
}

#[test]
fn rtl_puts_inline_start_on_the_right() {
    let (mason, _, id) = child(WritingMode::HorizontalTb, |s| {
        s.set_direction(taffy::Direction::Rtl);
        all_sides(s);
    });
    assert_eq!(margins(&mason, id), [1.0, 4.0, 3.0, 2.0]);
}

#[test]
fn vertical_rl_puts_block_start_on_the_right_and_inline_start_on_top() {
    let (mason, _, id) = child(WritingMode::VerticalRl, all_sides);
    assert_eq!(margins(&mason, id), [4.0, 1.0, 2.0, 3.0]);
}

#[test]
fn vertical_lr_puts_block_start_on_the_left() {
    let (mason, _, id) = child(WritingMode::VerticalLr, all_sides);
    assert_eq!(margins(&mason, id), [4.0, 3.0, 2.0, 1.0]);
}

#[test]
fn the_later_of_a_physical_and_a_logical_value_wins_its_side() {
    // margin-left after margin-inline-start: the physical one.
    let (mason, _, id) = child(WritingMode::HorizontalTb, |s| {
        s.set_logical_margin(INLINE_START, px(4.0));
        s.set_left_margin(px(9.0));
    });
    assert_eq!(margins(&mason, id)[3], 9.0);
    // margin-inline-start after margin-left: the logical one.
    let (mason, _, id) = child(WritingMode::HorizontalTb, |s| {
        s.set_left_margin(px(9.0));
        s.set_logical_margin(INLINE_START, px(4.0));
    });
    assert_eq!(margins(&mason, id)[3], 4.0);
}

#[test]
fn a_physical_value_on_another_side_keeps_the_logical_one() {
    // UA-style block margins, then an author margin-left, in vertical-rl: the block-end margin
    // lands on the left, where the newer physical value wins; block-start stays on the right.
    let (mason, _, id) = child(WritingMode::VerticalRl, |s| {
        s.set_logical_margin(BLOCK_START, px(16.0));
        s.set_logical_margin(BLOCK_END, px(16.0));
        s.set_left_margin(px(5.0));
    });
    assert_eq!(margins(&mason, id), [0.0, 16.0, 0.0, 5.0]);
}

#[test]
fn an_inherited_writing_mode_maps_the_childs_sides() {
    // The root is vertical-rl; the child only inherits it.
    let (mut mason, root, id) = child(WritingMode::VerticalRl, |s| {
        s.set_logical_margin(BLOCK_START, px(7.0));
    });
    assert_eq!(margins(&mason, id), [0.0, 7.0, 0.0, 0.0]);
    let l = mason.layout_raw(id);
    assert_eq!(l.location.x, 400.0 - 100.0 - 7.0);
    // Back to horizontal: block-start is the top again.
    mason.with_style_mut(root, |s| s.set_writing_mode(WritingMode::HorizontalTb));
    mason.compute_wh(root, 400.0, 400.0);
    assert_eq!(margins(&mason, id), [7.0, 0.0, 0.0, 0.0]);
}

#[test]
fn inline_size_is_the_height_in_vertical_text() {
    let (mason, _, id) = child(WritingMode::VerticalRl, |s| {
        s.set_logical_size(0, Dimension::length(60.0));
        s.set_logical_size(1, Dimension::length(30.0));
    });
    let l = mason.layout_raw(id);
    assert_eq!((l.size.width, l.size.height), (30.0, 60.0));
    let (mason, _, id) = child(WritingMode::HorizontalTb, |s| {
        s.set_logical_size(0, Dimension::length(60.0));
    });
    assert_eq!(mason.layout_raw(id).size.width, 60.0);
}

#[test]
fn logical_padding_and_insets_map_too() {
    let (mason, _, id) = child(WritingMode::VerticalRl, |s| {
        s.set_logical_padding(BLOCK_START, LengthPercentage::length(6.0));
        s.set_position(Position::Relative);
        s.set_logical_inset(INLINE_START, px(10.0));
    });
    let l = mason.layout_raw(id);
    assert_eq!(l.padding.right, 6.0);
    assert_eq!(l.location.y, 10.0);
}

#[test]
fn stamps_keep_their_order_past_the_counters_end() {
    let (mason, _, id) = child(WritingMode::HorizontalTb, |s| {
        for i in 0..300 {
            if i % 2 == 0 {
                s.set_logical_margin(INLINE_START, px(4.0));
            } else {
                s.set_left_margin(px(9.0));
            }
        }
        // The last write was physical, then a logical block-start.
        s.set_logical_margin(BLOCK_START, px(2.0));
    });
    assert_eq!(margins(&mason, id), [2.0, 0.0, 0.0, 9.0]);
}
