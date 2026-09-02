//! Reproduce the HN comment thread's measure-callback volume in pure Rust.
//!
//! On device a depth-8 thread issued 47k measure callbacks; this test models the
//! same nesting with inline/block text leaves so cache improvements can be
//! validated without the full app.

use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicUsize, Ordering};

static MEASURES: AtomicUsize = AtomicUsize::new(0);
/// When set, block text leaves report 0 for min/max-content probes — which is
/// what the device dump showed (`[min=0.0 max=0.0 def=1348.0]`).
static ZERO_INTRINSICS: AtomicUsize = AtomicUsize::new(0);

const SCREEN_W: f32 = 1080.0;
const PADDING: f32 = 21.0; // .comment padding: 8 @ 2.625 density
const INDENT: f32 = 31.5; // .replies margin-left: 12
const GAP: f32 = 21.0;

/// Stands in for a text leaf: wraps to the offered width, min-content is the
/// widest word. Mirrors what TextEngine reports back through the JNI measure.
extern "C" fn measure_text(
    _data: *const c_void,
    known_width: c_float,
    _known_height: c_float,
    available_width: c_float,
    _available_height: c_float,
) -> c_longlong {
    MEASURES.fetch_add(1, Ordering::Relaxed);

    const TOTAL: f32 = 1300.0; // full unwrapped paragraph width
    const WIDEST_WORD: f32 = 199.0;
    const LINE_H: f32 = 34.0;

    let zero_intrinsics = ZERO_INTRINSICS.load(Ordering::Relaxed) != 0;
    let width = if known_width >= 0.0 {
        known_width
    } else if available_width == -1.0 {
        if zero_intrinsics { 0.0 } else { WIDEST_WORD } // min-content
    } else if available_width == -2.0 {
        if zero_intrinsics { 0.0 } else { TOTAL } // max-content
    } else if available_width > 0.0 {
        available_width.min(TOTAL)
    } else {
        TOTAL
    };

    let lines = (TOTAL / width.max(1.0)).ceil().max(1.0);
    MeasureOutput::make(width, lines * LINE_H)
}

fn flex(mason: &mut Mason, dir: FlexDirection) -> Id {
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    mason.with_style_mut(id, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(dir);
    });
    id
}

/// A text leaf participating in inline/block formatting, not a bare flex item.
fn text(mason: &mut Mason, inline: bool) -> Id {
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    mason.with_style_mut(id, |style| {
        style.set_display(Display::Block);
        style.set_display_mode(if inline {
            DisplayMode::Inline
        } else {
            DisplayMode::Box
        });
    });
    mason.set_measure(id, Some(measure_text), std::ptr::null_mut());
    id
}

fn pad(mason: &mut Mason, id: Id, v: f32) {
    mason.with_style_mut(id, |style| {
        style.set_padding(Rect {
            left: LengthPercentage::length(v),
            right: LengthPercentage::length(v),
            top: LengthPercentage::length(v),
            bottom: LengthPercentage::length(v),
        });
    });
}

fn comment(mason: &mut Mason, child: Option<Id>) -> Id {
    let host = flex(mason, FlexDirection::Column);
    let article = flex(mason, FlexDirection::Column);
    pad(mason, article, PADDING);

    // .comment-head: flex row of inline text leaves + a button
    let head = flex(mason, FlexDirection::Row);
    mason.with_style_mut(head, |style| {
        style.set_gap(Size {
            width: LengthPercentage::length(GAP),
            height: LengthPercentage::length(GAP),
        });
    });
    let head_children = [
        text(mason, true),
        text(mason, true),
        text(mason, true),
        text(mason, true),
    ];
    mason.append_node(head, &head_children);

    // .comment-text: block-level text
    let body = text(mason, false);

    let mut article_children = vec![head, body];
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

/// Build the page: a width-pinned column root holding one deep chain plus a few
/// shallow root comments, matching the fixture (15 comments, max depth 8).
fn build(depth: usize, extra_roots: usize) -> (Mason, Id) {
    let mut mason = Mason::new();
    let root = flex(&mut mason, FlexDirection::Column);
    mason.with_style_mut(root, |style| {
        style.set_width(Dimension::length(SCREEN_W));
    });

    let list = flex(&mut mason, FlexDirection::Column);

    let mut chain = None;
    for _ in 0..depth {
        chain = Some(comment(&mut mason, chain));
    }
    let mut roots = vec![chain.unwrap()];
    for _ in 0..extra_roots {
        roots.push(comment(&mut mason, None));
    }
    mason.append_node(list, &roots);
    mason.append_node(root, &[list]);
    (mason, root)
}

#[test]
fn profile_hn_comment_thread_measure_volume() {
    for zero in [0usize, 1] {
        ZERO_INTRINSICS.store(zero, Ordering::Relaxed);
        eprintln!(
            "\n=== block text intrinsics: {} ===",
            if zero == 1 { "ZERO (as observed on device)" } else { "correct" }
        );
        eprintln!("depth  measures   delta");
        let mut prev = 0usize;
        for depth in [1usize, 2, 4, 6, 8, 10] {
            let (mut mason, root) = build(depth, 3);
            MEASURES.store(0, Ordering::Relaxed);
            mason.compute_wh(root, SCREEN_W, -2.0);
            let n = MEASURES.load(Ordering::Relaxed);
            eprintln!("{depth:>5}  {n:>8}   {}", n.saturating_sub(prev));
            prev = n;
        }
    }
}
