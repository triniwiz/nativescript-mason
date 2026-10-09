use mason_core::style::DisplayMode;
use mason_core::*;
use taffy::geometry::{Rect, Size};
use taffy::style::{Dimension, Display, LengthPercentageAuto, Position};

// An absolutely positioned inline element (an absolute <span>, <button>, <img>) is
// out of flow and blockified, so it must not change how its container lays out
// its in-flow block children: a block container stays on block layout, where
// sibling margins collapse.

fn block(mason: &mut Mason, margin_top: f32, margin_bottom: f32) -> (NodeRef, Id) {
    let node = mason.create_node();
    let id = node.id();
    mason.with_style_mut(id, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(30.0),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(0.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(margin_top),
            bottom: LengthPercentageAuto::length(margin_bottom),
        });
    });
    (node, id)
}

fn layout_y(mason: &Mason, id: Id) -> (f32, f32) {
    let l = mason.layout_raw(id);
    (l.location.y, l.size.height)
}

fn container_with(abs_inline: bool) -> (f32, f32) {
    let mut mason = Mason::new();
    let parent = mason.create_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Relative);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
    });

    let (_a, a) = block(&mut mason, 0.0, 20.0);
    let (_b, b) = block(&mut mason, 20.0, 0.0);

    let badge = mason.create_node();
    let badge_id = badge.id();
    mason.with_style_mut(badge_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
        s.set_size(Size {
            width: Dimension::length(10.0),
            height: Dimension::length(10.0),
        });
        if abs_inline {
            s.set_position(Position::Absolute);
        }
    });

    if abs_inline {
        mason.append_node(pid, &[a, b, badge_id]);
    } else {
        mason.append_node(pid, &[a, b]);
    }
    mason.compute_wh(pid, 200.0, f32::NAN);

    let (b_y, _) = layout_y(&mason, b);
    let (_, height) = layout_y(&mason, pid);
    (b_y, height)
}

#[test]
fn an_absolute_inline_child_keeps_sibling_margins_collapsing() {
    // 30 + max(20, 20) collapsed margin = 50; the container is 80 tall.
    let without = container_with(false);
    assert_eq!(without, (50.0, 80.0), "baseline block layout");

    let with = container_with(true);
    assert_eq!(
        with, without,
        "an absolute inline child changed the block layout"
    );
}
