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

/// A block's inline content sits in an anonymous block text container; its lines run along
/// the block's definite height.
#[test]
fn anonymous_block_text_takes_its_line_length_from_a_fixed_height_vertical_parent() {
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

    let vertical = mason.create_node();
    let vertical_id = vertical.id();
    mason.with_style_mut(vertical_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(40.0),
        });
    });
    mason.append_node(root_id, &[vertical_id]);

    let container = mason.create_text_node();
    let container_id = container.id();
    mason.with_style_mut(container_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::None);
    });
    mason.set_measure(container_id, Some(measure_seven), std::ptr::null_mut());
    mason.append_node(vertical_id, &[container_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // Two "HH" pairs fit in each 40px line: four lines, 40 thick.
    check(
        &mason,
        &[("vertical", vertical_id, 0.0, 0.0, 40.0, 40.0), ("container", container_id, 0.0, 0.0, 40.0, 40.0)],
    );
}

#[test]
fn vertical_block_in_a_horizontal_block_parent_sizes_its_width_to_its_lines() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(300.0),
            height: Dimension::auto(),
        });
    });
    mason.append_node(stage_id, &[root_id]);

    // Block flow would stretch an auto width to 300; a vertical box's width is its lines.
    let vertical = add_text_div(&mut mason, root_id, measure_seven, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(40.0),
        });
    });
    let horizontal = add_text_div(&mut mason, root_id, measure_three, |s| {
        s.set_display(Display::Block);
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("vertical", vertical, 0.0, 0.0, 40.0, 40.0),
            ("horizontal", horizontal, 0.0, 40.0, 300.0, 10.0),
        ],
    );
}

#[test]
fn vertical_text_with_no_definite_height_wraps_at_the_viewport_height() {
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

    // Nothing above sets a height, so the 100px viewport is the line length: five 20px runs
    // per line, two lines of 10px.
    let vertical = add_text_div(&mut mason, root_id, measure_seven, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalLr);
    });

    mason.compute_wh(stage_id, 1280.0, 100.0);

    check(&mason, &[("vertical", vertical, 0.0, 0.0, 20.0, 100.0)]);
}

ahem_measure!(measure_two, &[20.0; 2]);

fn add_text_run(mason: &mut Mason, parent: Id, measure: MeasureFn) -> Id {
    let container = mason.create_text_node();
    let id = container.id();
    mason.with_style_mut(id, |s| s.set_display_mode(DisplayMode::Inline));
    mason.set_measure(id, Some(measure), std::ptr::null_mut());
    mason.append_node(parent, &[id]);
    id
}

/// `xs` are the expected x of the first run, the box and the second run.
fn inline_flow(mode: WritingMode, xs: [f32; 3]) {
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

    let vertical = mason.create_node();
    let vertical_id = vertical.id();
    mason.with_style_mut(vertical_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(mode);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
    });
    mason.append_node(root_id, &[vertical_id]);

    // "HH HH HH" (60 along the line), a 30x16 inline-block, then "HH HH" (40).
    let first = add_text_run(&mut mason, vertical_id, measure_three);
    let boxed = mason.create_node();
    let box_id = boxed.id();
    mason.with_style_mut(box_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_size(Size {
            width: Dimension::length(30.0),
            height: Dimension::length(16.0),
        });
    });
    mason.append_node(vertical_id, &[box_id]);
    let second = add_text_run(&mut mason, vertical_id, measure_two);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // Line 1: the first run and the box, centred on the box's 30px thickness. Line 2: the
    // second run. vertical-rl stacks lines from the right, vertical-lr from the left.
    check(
        &mason,
        &[
            ("vertical", vertical_id, 0.0, 0.0, 40.0, 100.0),
            ("first", first, xs[0], 0.0, 10.0, 60.0),
            ("box", box_id, xs[1], 60.0, 30.0, 16.0),
            ("second", second, xs[2], 0.0, 10.0, 40.0),
        ],
    );
}

#[test]
fn inline_children_of_a_vertical_rl_box_flow_down_its_lines() {
    inline_flow(WritingMode::VerticalRl, [20.0, 10.0, 0.0]);
}

#[test]
fn inline_children_of_a_vertical_lr_box_flow_down_its_lines() {
    inline_flow(WritingMode::VerticalLr, [10.0, 0.0, 30.0]);
}

/// Not writing-mode specific: an inline-block counted as 0x0 while its line was sized, so an
/// auto-width box came out too narrow and wrapped content that fits.
#[test]
fn inline_block_counts_toward_its_lines_intrinsic_width() {
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

    let paragraph = mason.create_node();
    let paragraph_id = paragraph.id();
    mason.with_style_mut(paragraph_id, |s| s.set_display(Display::Block));
    mason.append_node(root_id, &[paragraph_id]);

    let first = add_text_run(&mut mason, paragraph_id, measure_three);
    let boxed = mason.create_node();
    let box_id = boxed.id();
    mason.with_style_mut(box_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_size(Size {
            width: Dimension::length(30.0),
            height: Dimension::length(16.0),
        });
    });
    mason.append_node(paragraph_id, &[box_id]);
    let second = add_text_run(&mut mason, paragraph_id, measure_two);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let l = mason.layout_raw(paragraph_id);
    assert!(
        (l.size.width - 130.0).abs() < 0.5,
        "paragraph width {} (want 130: 60 + 30 + 40)",
        l.size.width
    );
    let (f, b, s2) = (
        mason.layout_raw(first),
        mason.layout_raw(box_id),
        mason.layout_raw(second),
    );
    assert!(
        (f.location.x - 0.0).abs() < 0.5
            && (b.location.x - 60.0).abs() < 0.5
            && (s2.location.x - 90.0).abs() < 0.5,
        "one line expected: first x={} box x={} second x={}",
        f.location.x,
        b.location.x,
        s2.location.x
    );
}

ahem_measure!(measure_empty, &[]);

/// What a text container's measure saw of its inline box: the box's size as a platform reads it
/// to place the box in its text.
struct BoxProbe {
    mason: *const Mason,
    span: Option<Id>,
    seen: Vec<(f32, f32)>,
}

extern "C" fn measure_three_and_probe(
    data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    let probe = unsafe { &mut *(data as *mut BoxProbe) };
    if let Some(span) = probe.span {
        let size = unsafe { (*probe.mason).unrounded_size(span) };
        probe.seen.push((size.width, size.height));
    }
    let (w, h) = measure_segments(THREE_PAIRS, known_w, avail_w);
    MeasureOutput::make(w, if known_h > 0.0 { known_h } else { h })
}

/// A text container (a `<p>` or a block's anonymous run) holding an empty `<span>` styled
/// `display: inline-block; width: 30px; height: 16px`, itself a text container. Returns every
/// size of the span the container's measure saw.
fn text_inline_block(mode: Option<WritingMode>) -> Vec<(f32, f32)> {
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

    let block = mason.create_node();
    let block_id = block.id();
    mason.with_style_mut(block_id, |s| {
        s.set_display(Display::Block);
        if let Some(mode) = mode {
            s.set_writing_mode(mode);
            s.set_size(Size {
                width: Dimension::auto(),
                height: Dimension::length(100.0),
            });
        }
    });
    mason.append_node(root_id, &[block_id]);

    let mut probe = Box::new(BoxProbe { mason: &mason, span: None, seen: Vec::new() });
    let container = mason.create_text_node();
    let container_id = container.id();
    mason.with_style_mut(container_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::None);
    });
    mason.set_measure(container_id, Some(measure_three_and_probe), &mut *probe as *mut BoxProbe as *mut std::ffi::c_void);
    mason.append_node(block_id, &[container_id]);

    let span = mason.create_text_node();
    let span_id = span.id();
    mason.with_style_mut(span_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_size(Size {
            width: Dimension::length(30.0),
            height: Dimension::length(16.0),
        });
    });
    mason.set_measure(span_id, Some(measure_empty), std::ptr::null_mut());
    mason.append_node(container_id, &[span_id]);
    probe.span = Some(span_id);
    probe.mason = &mason;

    mason.compute_wh(stage_id, 1280.0, 2688.0);
    std::mem::take(&mut probe.seen)
}

fn assert_box_sizes(seen: &[(f32, f32)]) {
    assert!(!seen.is_empty(), "the container was never measured");
    assert!(
        seen.iter().all(|&(w, h)| (w - 30.0).abs() < 0.5 && (h - 16.0).abs() < 0.5),
        "the container's measure saw the span as {seen:?} (want 30x16 each time)"
    );
}

#[test]
fn text_inline_block_keeps_its_size_while_horizontal_text_is_measured() {
    assert_box_sizes(&text_inline_block(None));
}

#[test]
fn text_inline_block_keeps_its_size_while_vertical_text_is_measured() {
    assert_box_sizes(&text_inline_block(Some(WritingMode::VerticalRl)));
}
