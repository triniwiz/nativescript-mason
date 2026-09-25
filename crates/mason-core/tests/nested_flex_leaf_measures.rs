// The Nested bench shape: a binary tree of padded boxes alternating wrapping
// flex rows and columns, with wrapped text at every level. A retext must not
// probe the leaf text at widths other than its min-content and final width.
use mason_core::{Id, Mason, MeasureOutput, Size};
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::Mutex;
use taffy::prelude::*;
use taffy::style::{Dimension, Display};

static CALLS: Mutex<Vec<(usize, f32, f32)>> = Mutex::new(Vec::new());

const WORD: f32 = 60.0;
const SPACE: f32 = 8.0;
const WORDS: usize = 8;
const LINE: f32 = 30.0;

fn wrap(width: f32) -> (f32, f32) {
    let (mut lines, mut line, mut widest) = (1.0, 0.0f32, 0.0f32);
    for _ in 0..WORDS {
        let next = if line == 0.0 { WORD } else { line + SPACE + WORD };
        if next > width && line > 0.0 {
            widest = widest.max(line);
            lines += 1.0;
            line = WORD;
        } else {
            line = next;
        }
    }
    (widest.max(line), lines * LINE)
}

extern "C" fn measure(data: *const c_void, kw: c_float, _kh: c_float, aw: c_float, _ah: c_float) -> c_longlong {
    CALLS.lock().unwrap().push((data as usize, kw, aw));
    let w = if kw.is_nan() { aw } else { kw };
    let (width, height) = match w {
        -1.0 => (WORD, WORDS as f32 * LINE),
        -2.0 => wrap(f32::INFINITY),
        w => wrap(w),
    };
    MeasureOutput::make(width, height)
}

fn length(v: f32) -> LengthPercentage {
    LengthPercentage::length(v)
}

/// Rows at even depths, columns at odd; the root is `max`, leaves are depth 0.
fn build(mason: &mut Mason, depth: u32, max: u32, texts: &mut Vec<Id>) -> Id {
    let row = depth % 2 == 0;
    let node = mason.create_node();
    mason.with_style_mut(node.id(), |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(if row { FlexDirection::Row } else { FlexDirection::Column });
        if row {
            s.set_flex_wrap(FlexWrap::Wrap);
            s.set_align_items(Some(AlignItems::FLEX_START));
        }
        s.set_gap(Size { width: length(11.0), height: length(11.0) });
        s.set_padding(Rect { left: length(11.0), right: length(11.0), top: length(11.0), bottom: length(11.0) });
        s.set_border(Rect { left: length(2.75), right: length(2.75), top: length(2.75), bottom: length(2.75) });
        if depth < max {
            s.set_flex_grow(1.0);
            s.set_flex_basis(Dimension::length(0.0));
            s.set_min_size(Size { width: Dimension::length(0.0), height: Dimension::auto() });
        }
    });

    let text = mason.create_text_node();
    if row {
        mason.with_style_mut(text.id(), |s| s.set_flex_basis(Dimension::percent(1.0)));
    }
    mason.set_measure(text.id(), Some(measure), texts.len() as *mut c_void);
    texts.push(text.id());
    let mut children = vec![text.id()];
    std::mem::forget(text);

    if depth > 0 {
        for _ in 0..2 {
            children.push(build(mason, depth - 1, max, texts));
        }
    }
    mason.append_node(node.id(), &children);
    let id = node.id();
    std::mem::forget(node);
    id
}

#[test]
fn retext_measures_each_leaf_at_min_content_and_final_width_only() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let mut texts = vec![];
    let tree = build(&mut mason, 5, 5, &mut texts);
    mason.append_node(root.id(), &[tree]);
    mason.compute_wh(root.id(), 1014.0, f32::NAN);

    CALLS.lock().unwrap().clear();
    for text in &texts {
        mason.mark_dirty(*text);
    }
    mason.compute_wh(root.id(), 1014.0, f32::NAN);

    let calls = CALLS.lock().unwrap().clone();
    let leaf = texts.len() - 1;
    let leaf_calls: Vec<_> = calls.iter().filter(|c| c.0 == leaf).collect();
    assert_eq!(leaf_calls.len(), 2, "leaf measures: {leaf_calls:?}");
    assert!(calls.len() <= 2 * texts.len() + texts.len() / 2, "{} measures for {} texts", calls.len(), texts.len());
}
