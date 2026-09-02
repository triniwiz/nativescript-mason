//! Regression: a wide row inside nested column flex containers should not
//! inflate every ancestor's width. `min-width: auto` applies only on the main
//! axis, so a column item's width minimum is 0 and it should stretch to the
//! container.

use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

const CONTAINER: f32 = 1000.0;
const ITEM_W: f32 = 150.0;
const ITEMS: usize = 4; // 4 * 150 = 600 wide row
const PADDING: f32 = 20.0;
const INDENT: f32 = 30.0;

/// A leaf that refuses to be narrower than ITEM_W (like a short inline label).
extern "C" fn measure_fixed(
    _data: *const c_void,
    known_width: c_float,
    _known_height: c_float,
    _available_width: c_float,
    _available_height: c_float,
) -> c_longlong {
    let w = if known_width >= 0.0 {
        known_width.max(ITEM_W)
    } else {
        ITEM_W
    };
    MeasureOutput::make(w, 20.0)
}

fn flex(mason: &mut Mason, direction: FlexDirection) -> Id {
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    mason.with_style_mut(id, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(direction);
    });
    id
}

fn leaf(mason: &mut Mason) -> Id {
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    mason.set_measure(id, Some(measure_fixed), std::ptr::null_mut());
    id
}

/// `.comment`: column box with padding, containing a wide row + optional replies.
fn comment(mason: &mut Mason, child: Option<Id>) -> Id {
    let host = flex(mason, FlexDirection::Column);

    let article = flex(mason, FlexDirection::Column);
    mason.with_style_mut(article, |style| {
        style.set_padding(Rect {
            left: LengthPercentage::length(PADDING),
            right: LengthPercentage::length(PADDING),
            top: LengthPercentage::length(PADDING),
            bottom: LengthPercentage::length(PADDING),
        });
    });

    // The wide, non-wrapping header row.
    let head = flex(mason, FlexDirection::Row);
    let head_children: Vec<Id> = (0..ITEMS).map(|_| leaf(mason)).collect();
    mason.append_node(head, &head_children);

    let mut article_children = vec![head];
    if let Some(child) = child {
        let replies = flex(mason, FlexDirection::Column);
        mason.with_style_mut(replies, |style| {
            style.set_margin(Rect {
                left: LengthPercentageAuto::length(INDENT),
                right: LengthPercentageAuto::length(0.0),
                top: LengthPercentageAuto::length(0.0),
                bottom: LengthPercentageAuto::length(0.0),
            });
        });
        mason.append_node(replies, &[child]);
        article_children.push(replies);
    }
    mason.append_node(article, &article_children);
    mason.append_node(host, &[article]);
    host
}

#[test]
fn nested_column_items_should_not_inflate_past_container() {
    for depth in [1usize, 2, 4, 8] {
        let mut mason = Mason::new();
        let root = flex(&mut mason, FlexDirection::Column);
        // Pin the root width like the app does with `width: 100%`.
        mason.with_style_mut(root, |style| {
            style.set_width(Dimension::length(CONTAINER));
        });

        let mut nested = None;
        for _ in 0..depth {
            nested = Some(comment(&mut mason, nested));
        }
        mason.append_node(root, &[nested.unwrap()]);

        // Definite container width, unconstrained height — same as the app's
        // computeAndLayout(1080, -2).
        mason.compute_wh(root, CONTAINER, -2.0);

        let root_w = mason.layout_raw(root).size.width;
        let outer_w = mason.layout_raw(nested.unwrap()).size.width;
        let expected_row = ITEM_W * ITEMS as f32;

        eprintln!(
            "depth={depth} root_w={root_w} outermost_comment_w={outer_w} \
             (container={CONTAINER}, inner row needs {expected_row})"
        );

        assert!(
            outer_w <= CONTAINER + 0.5,
            "depth={depth}: outermost column box is {outer_w}, wider than {CONTAINER}"
        );
    }
}

#[test]
fn default_align_items_should_be_stretch_not_start() {
    let mut mason = Mason::new();
    let root = flex(&mut mason, FlexDirection::Column);
    mason.with_style_mut(root, |style| {
        style.set_width(Dimension::length(CONTAINER));
    });
    let child = flex(&mut mason, FlexDirection::Column);
    let l = leaf(&mut mason);
    mason.append_node(child, &[l]);
    mason.append_node(root, &[child]);

    let mut align = None;
    mason.with_style(root, |s| { align = s.get_align_items(); });
    eprintln!("default align_items on a flex container = {align:?}");

    mason.compute_wh(root, CONTAINER, -2.0);
    let cl = mason.layout_raw(child);
    eprintln!("child: x={} w={} (container={CONTAINER})", cl.location.x, cl.size.width);

    assert_eq!(
        cl.size.width, CONTAINER,
        "a column flex item with align-items:normal must stretch to the container width"
    );
}
