use mason_core::*;
use taffy::geometry::Size;
use taffy::style::{Display, FlexDirection, FlexWrap};

/// Verify that a scroll container (Flex) with overflow-x: scroll
/// clamps its visible width while preserving full content width.
#[test]
fn scroll_overflow_x_flex_direct() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Block);
    });

    // Scroll container itself is Flex Row
    let scroll = mason.create_node();
    let scroll_id = scroll.id();
    mason.with_style_mut(scroll_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::NoWrap);
        s.set_overflow(taffy::geometry::Point {
            x: style::Overflow::Scroll,
            y: style::Overflow::Hidden,
        });
    });

    for _ in 0..5 {
        let child = mason.create_node();
        let child_id = child.id();
        mason.with_style_mut(child_id, |s| {
            s.set_size(Size {
                width: taffy::style::Dimension::length(200.0),
                height: taffy::style::Dimension::length(50.0),
            });
        });
        mason.append_node(scroll_id, &[child_id]);
    }

    mason.append_node(root_id, &[scroll_id]);
    mason.compute_wh(root_id, 400.0, f32::NAN);

    let scroll_layout = mason.layout_raw(scroll_id);
    eprintln!(
        "flex_direct: size={:?} scrollable_overflow_rect={:?}",
        scroll_layout.size, scroll_layout.scrollable_overflow_rect
    );

    assert!(
        scroll_layout.size.width <= 401.0,
        "scroll visible width {} should be <= 400",
        scroll_layout.size.width
    );
    assert!(
        scroll_layout.scrollable_overflow_rect.right >= 999.0,
        "scroll content width {} should be >= 1000",
        scroll_layout.scrollable_overflow_rect.right
    );
}

/// Mirrors TransformActivity: Scroll is Block, contains a Flex Row child.
/// This is the real Android structure.
#[test]
fn scroll_overflow_x_block_with_flex_child() {
    let mut mason = Mason::new();

    // Outer container: Flex Column (like "controls" in TransformActivity)
    let controls = mason.create_node();
    let controls_id = controls.id();
    mason.with_style_mut(controls_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
    });

    // Scroll container: Block display, overflow-x scroll (like createScrollView)
    let scroll = mason.create_node();
    let scroll_id = scroll.id();
    mason.with_style_mut(scroll_id, |s| {
        s.set_display(Display::Block);
        s.set_overflow(taffy::geometry::Point {
            x: style::Overflow::Scroll,
            y: style::Overflow::Hidden,
        });
    });

    // Flex Row inside scroll (like presetsRow)
    let row = mason.create_node();
    let row_id = row.id();
    mason.with_style_mut(row_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::NoWrap);
    });

    // 5 buttons each 200px wide
    for _ in 0..5 {
        let child = mason.create_node();
        let child_id = child.id();
        mason.with_style_mut(child_id, |s| {
            s.set_size(Size {
                width: taffy::style::Dimension::length(200.0),
                height: taffy::style::Dimension::length(40.0),
            });
        });
        mason.append_node(row_id, &[child_id]);
    }

    mason.append_node(scroll_id, &[row_id]);
    mason.append_node(controls_id, &[scroll_id]);

    mason.compute_wh(controls_id, 400.0, f32::NAN);

    let scroll_layout = mason.layout_raw(scroll_id);
    let row_layout = mason.layout_raw(row_id);

    eprintln!(
        "block_scroll: size={:?} scrollable_overflow_rect={:?}",
        scroll_layout.size, scroll_layout.scrollable_overflow_rect
    );
    eprintln!(
        "flex_row:     size={:?} scrollable_overflow_rect={:?}",
        row_layout.size, row_layout.scrollable_overflow_rect
    );

    // Scroll visible width should be clamped to parent (400)
    assert!(
        scroll_layout.size.width <= 401.0,
        "scroll visible width {} should be <= 400",
        scroll_layout.size.width
    );

    // Content width should reflect the full row width (1000)
    assert!(
        scroll_layout.scrollable_overflow_rect.right >= 999.0,
        "scroll content width {} should be >= 1000 (row has 5 × 200px children)",
        scroll_layout.scrollable_overflow_rect.right
    );

    // The row inside the scroll should be unconstrained
    assert!(
        row_layout.size.width >= 999.0,
        "row width {} should be >= 1000 (unconstrained by scroll)",
        row_layout.size.width
    );
}
