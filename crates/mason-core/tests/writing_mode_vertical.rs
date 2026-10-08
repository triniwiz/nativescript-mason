use mason_core::style::{DisplayMode, WritingMode};
use mason_core::*;

// A `writing-mode: vertical-*` box inside a horizontal layout: its lines run along its
// height, so its line length comes from the height it is offered and its width is the
// thickness of the stacked lines. Ahem at 10px makes the text exact: each `H` is 10 wide
// and U+200B zero-width spaces are the only soft-wrap opportunities.

const LINE_HEIGHT: f32 = 10.0;

/// Seven "HH" runs, e.g. "HH<zwsp>HH<zwsp>...".
const SEVEN_PAIRS: &[f32] = &[20.0; 7];
/// Three "HH" runs.
const THREE_PAIRS: &[f32] = &[20.0; 3];

/// Greedy line breaking in the platform's horizontal frame: width is the line length.
fn measure_segments(segments: &[f32], known_w: f32, avail_w: f32) -> (f32, f32) {
    let min_content = segments.iter().cloned().fold(0.0f32, f32::max);
    let max_content: f32 = segments.iter().sum();
    // -1 = MinContent, -2 = MaxContent (mason's available-space sentinels)
    let wrap_at = if known_w > 0.0 {
        known_w
    } else if avail_w == -1.0 {
        min_content
    } else if avail_w == -2.0 || !(avail_w > 0.0) || avail_w == f32::INFINITY {
        max_content
    } else {
        avail_w
    };
    let mut widest = 0.0f32;
    let mut lines = 1.0f32;
    let mut line = 0.0f32;
    for &seg in segments {
        if line > 0.0 && line + seg > wrap_at + 0.01 {
            widest = widest.max(line);
            lines += 1.0;
            line = seg;
        } else {
            line += seg;
        }
    }
    widest = widest.max(line);
    (widest, lines * LINE_HEIGHT)
}

macro_rules! ahem_measure {
    ($name:ident, $segments:expr) => {
        extern "C" fn $name(
            _data: *const std::ffi::c_void,
            known_w: std::ffi::c_float,
            known_h: std::ffi::c_float,
            avail_w: std::ffi::c_float,
            _avail_h: std::ffi::c_float,
        ) -> std::ffi::c_longlong {
            let (w, h) = measure_segments($segments, known_w, avail_w);
            let h = if known_h > 0.0 { known_h } else { h };
            MeasureOutput::make(w, h)
        }
    };
}

ahem_measure!(measure_seven, SEVEN_PAIRS);
ahem_measure!(measure_three, THREE_PAIRS);

type MeasureFn = extern "C" fn(
    *const std::ffi::c_void,
    std::ffi::c_float,
    std::ffi::c_float,
    std::ffi::c_float,
    std::ffi::c_float,
) -> std::ffi::c_longlong;

/// A div holding an anonymous text container, as masonkit builds for `<div>text</div>`.
/// The container doesn't set a writing mode: it inherits the div's.
fn add_text_div(
    mason: &mut Mason,
    parent: Id,
    measure: MeasureFn,
    apply: impl FnOnce(&mut mason_core::style::Style),
) -> Id {
    let item = mason.create_node();
    let item_id = item.id();
    mason.with_style_mut(item_id, |s| {
        s.set_box_sizing(BoxSizing::BorderBox);
        apply(s);
    });

    let container = mason.create_text_node();
    let container_id = container.id();
    mason.with_style_mut(container_id, |s| s.set_display_mode(DisplayMode::Inline));
    mason.set_measure(container_id, Some(measure), std::ptr::null_mut());

    mason.append_node(parent, &[item_id]);
    mason.append_node(item_id, &[container_id]);
    item_id
}

fn stage(mason: &mut Mason) -> Id {
    let stage = mason.create_node();
    let id = stage.id();
    mason.with_style_mut(id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1280.0),
            height: Dimension::auto(),
        });
    });
    std::mem::forget(stage);
    id
}

fn check(mason: &Mason, expected: &[(&str, Id, f32, f32, f32, f32)]) {
    let mut failures = Vec::new();
    for &(name, id, x, y, w, h) in expected {
        let l = mason.layout_raw(id);
        if (l.location.x - x).abs() > 0.5
            || (l.location.y - y).abs() > 0.5
            || (l.size.width - w).abs() > 0.5
            || (l.size.height - h).abs() > 0.5
        {
            failures.push(format!(
                "{name}: got {}x{} at ({}, {}), want {w}x{h} at ({x}, {y})",
                l.size.width, l.size.height, l.location.x, l.location.y
            ));
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}

/// WebSpec fixture `grid_relayout_vertical_text`.
fn grid_fixture(mode: WritingMode) {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Grid);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_grid_template_columns_css("min-content");
        s.set_grid_template_rows_css("40px");
    });
    mason.append_node(stage_id, &[root_id]);

    let vertical = add_text_div(&mut mason, root_id, measure_seven, |s| {
        s.set_display(Display::Flex);
        s.set_writing_mode(mode);
    });
    let horizontal = add_text_div(&mut mason, root_id, measure_three, |s| {
        s.set_display(Display::Flex);
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("root", root_id, 0.0, 0.0, 40.0, 60.0),
            ("vertical", vertical, 0.0, 0.0, 40.0, 40.0),
            ("horizontal", horizontal, 0.0, 40.0, 40.0, 20.0),
        ],
    );
}

#[test]
fn vertical_lr_text_takes_its_line_length_from_the_grid_row() {
    grid_fixture(WritingMode::VerticalLr);
}

#[test]
fn vertical_rl_text_takes_its_line_length_from_the_grid_row() {
    grid_fixture(WritingMode::VerticalRl);
}

#[test]
fn vertical_block_with_a_fixed_height_under_an_auto_height_parent() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_align_items(Some(AlignItems::START));
    });
    mason.append_node(stage_id, &[root_id]);

    // Its own 40px height is the line length; nothing above it has a definite height.
    let vertical = add_text_div(&mut mason, root_id, measure_seven, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(40.0),
        });
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(&mason, &[("vertical", vertical, 0.0, 0.0, 40.0, 40.0)]);
}
