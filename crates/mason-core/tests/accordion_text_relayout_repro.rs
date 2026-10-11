// An accordion inside a card: a column flex card body holds a block
// root of block items, each with a flex header around one line of wrapping text.
// Moving a body div from one item to another must relayout every header's text at
// the header's width, not at a narrower intrinsic-sizing probe width.
//
// The bodies' min-content is wider than the headers', so a moved body changes the
// accordion's min-content width and the card's min-content probe reaches every item
// (even untouched ones) at a width it hasn't seen. The items' final layouts are cache
// hits, so nothing may write a probe's size into the text nodes along the way.
use mason_core::{Id, Mason, MeasureOutput, Size};
use std::ffi::{c_float, c_longlong, c_void};
use taffy::prelude::*;
use taffy::style::{Dimension, Display};

const LINE: f32 = 24.0;

/// (min-content width, max-content width) of each text, indexed by measure data.
const TEXTS: [(f32, f32); 6] = [
    (108.0, 279.0),
    (108.0, 190.0),
    (108.0, 192.0),
    (150.0, 900.0),
    (170.0, 700.0),
    (190.0, 800.0),
];

fn wrap(index: usize, width: f32) -> (f32, f32) {
    let (min, max) = TEXTS[index];
    let width = width.max(min).min(max);
    (width, LINE * (max / width).ceil())
}

extern "C" fn measure(
    data: *const c_void,
    kw: c_float,
    kh: c_float,
    aw: c_float,
    _ah: c_float,
) -> c_longlong {
    let index = data as usize;
    let (min, max) = TEXTS[index];
    let w = if kw.is_nan() { aw } else { kw };
    let (width, height) = match w {
        -1.0 => wrap(index, min),
        -2.0 => wrap(index, max),
        w if w.is_nan() => wrap(index, max),
        w => wrap(index, w),
    };
    let height = if kh.is_nan() { height } else { kh };
    MeasureOutput::make(width, height)
}

fn edges(v: f32) -> Rect<LengthPercentage> {
    Rect {
        left: LengthPercentage::length(v),
        right: LengthPercentage::length(v),
        top: LengthPercentage::length(v),
        bottom: LengthPercentage::length(v),
    }
}

fn text(mason: &mut Mason, index: usize) -> Id {
    let node = mason.create_text_node();
    mason.set_measure(node.id(), Some(measure), index as *mut c_void);
    let id = node.id();
    std::mem::forget(node);
    id
}

fn div(mason: &mut Mason) -> Id {
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    id
}

struct Accordion {
    root: Id,
    items: Vec<Id>,
    headers: Vec<Id>,
    spans: Vec<Id>,
    bodies: Vec<Id>,
}

fn build(mason: &mut Mason) -> Accordion {
    let root = div(mason);
    mason.with_style_mut(root, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_size(Size {
            width: Dimension::length(708.0),
            height: Dimension::auto(),
        });
    });
    let col = div(mason);
    mason.with_style_mut(col, |s| {
        s.set_flex_shrink(0.0);
        s.set_size(Size {
            width: Dimension::percent(0.5),
            height: Dimension::auto(),
        });
    });
    let card = div(mason);
    mason.with_style_mut(card, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_border(edges(1.0));
    });
    let card_body = div(mason);
    mason.with_style_mut(card_body, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_align_items(Some(AlignItems::STRETCH));
        s.set_flex_grow(1.0);
        s.set_gap(Size {
            width: LengthPercentage::length(8.0),
            height: LengthPercentage::length(8.0),
        });
        s.set_padding(edges(11.0));
    });
    let accordion = div(mason);

    let (mut items, mut headers, mut spans, mut bodies) = (vec![], vec![], vec![], vec![]);
    for i in 0..3 {
        let item = div(mason);
        mason.with_style_mut(item, |s| s.set_border(edges(1.0)));
        let header = div(mason);
        mason.with_style_mut(header, |s| {
            s.set_display(Display::Flex);
            s.set_align_items(Some(AlignItems::CENTER));
            s.set_size(Size {
                width: Dimension::percent(1.0),
                height: Dimension::auto(),
            });
            s.set_padding(edges(12.0));
        });
        let span = text(mason, i);
        mason.append_node(header, &[span]);
        mason.append_node(item, &[header]);

        let body = div(mason);
        mason.with_style_mut(body, |s| s.set_padding(edges(16.0)));
        let body_text = text(mason, 3 + i);
        mason.append_node(body, &[body_text]);

        items.push(item);
        headers.push(header);
        spans.push(span);
        bodies.push(body);
    }
    mason.append_node(accordion, &items);
    mason.append_node(card_body, &[accordion]);
    mason.append_node(card, &[card_body]);
    mason.append_node(col, &[card]);
    mason.append_node(root, &[col]);
    Accordion {
        root,
        items,
        headers,
        spans,
        bodies,
    }
}

fn assert_headers_fit(mason: &Mason, acc: &Accordion, when: &str) {
    for (i, (&header, &span)) in acc.headers.iter().zip(&acc.spans).enumerate() {
        let header_layout = mason.layout_raw(header);
        let span_layout = mason.layout_raw(span);
        let content_width = header_layout.size.width - 24.0;
        let (width, height) = wrap(i, content_width);
        assert!(
            (span_layout.size.width - width).abs() < 1.0
                && (span_layout.size.height - height).abs() < 1.0,
            "{when}: span {i} is {:?}, expected {width}x{height} inside header {:?}",
            span_layout.size,
            header_layout.size
        );
        assert!(
            (header_layout.size.height - (height + 24.0)).abs() < 1.0,
            "{when}: header {i} is {:?}, its span needs height {height}",
            header_layout.size
        );
    }
}

#[test]
fn moving_an_accordion_body_relayouts_header_text_at_header_width() {
    let mut mason = Mason::new();
    let acc = build(&mut mason);

    mason.append_node(acc.items[0], &[acc.bodies[0]]);
    mason.compute_wh(acc.root, 708.0, 1200.0);
    assert_headers_fit(&mason, &acc, "initial");
    let item_width = mason.layout_raw(acc.items[1]).size.width;
    assert!((item_width - 330.0).abs() < 0.5, "item width {item_width}");

    // Same tick: close item 0, open item 1.
    std::mem::forget(mason.remove_node(acc.items[0], acc.bodies[0]));
    mason.add_child_at_index(acc.items[1], acc.bodies[1], 1);
    mason.compute_wh(acc.root, 708.0, 1200.0);
    assert_headers_fit(&mason, &acc, "after moving the body");

    // And back again.
    std::mem::forget(mason.remove_node(acc.items[1], acc.bodies[1]));
    mason.add_child_at_index(acc.items[2], acc.bodies[2], 1);
    mason.compute_wh(acc.root, 708.0, 1200.0);
    assert_headers_fit(&mason, &acc, "after moving the body again");
}

#[test]
fn opening_an_accordion_body_relayouts_header_text_at_header_width() {
    let mut mason = Mason::new();
    let acc = build(&mut mason);

    mason.compute_wh(acc.root, 708.0, 1200.0);
    assert_headers_fit(&mason, &acc, "initial");

    mason.add_child_at_index(acc.items[1], acc.bodies[1], 1);
    mason.compute_wh(acc.root, 708.0, 1200.0);
    assert_headers_fit(&mason, &acc, "after opening item 1");
}
