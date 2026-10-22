use mason_core::style::{DisplayMode, WritingMode};
use mason_core::*;

// Vertical containers: block, flex and grid containers in a vertical writing mode lay their
// children out along a vertical inline axis, with blocks stacking right to left
// (`vertical-rl`) or left to right (`vertical-lr`). Ahem at 10px: each `H` is 10 wide and
// zero-width spaces split "HH" pairs, so a line holds as many 20px pairs as fit.

const LINE_HEIGHT: f32 = 10.0;

fn measure_segments(segments: &[f32], known_w: f32, avail_w: f32) -> (f32, f32) {
    let min_content = segments.iter().cloned().fold(0.0f32, f32::max);
    let max_content: f32 = segments.iter().sum();
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

ahem_measure!(measure_three, &[20.0; 3]);
ahem_measure!(measure_seven, &[20.0; 7]);

type MeasureFn = extern "C" fn(
    *const std::ffi::c_void,
    std::ffi::c_float,
    std::ffi::c_float,
    std::ffi::c_float,
    std::ffi::c_float,
) -> std::ffi::c_longlong;

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

fn add_box(mason: &mut Mason, parent: Id, apply: impl FnOnce(&mut mason_core::style::Style)) -> Id {
    let node = mason.create_node();
    let id = node.id();
    mason.with_style_mut(id, |s| {
        s.set_box_sizing(BoxSizing::BorderBox);
        apply(s);
    });
    mason.append_node(parent, &[id]);
    id
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

fn fixed(width: f32, height: f32) -> Size<Dimension> {
    Size {
        width: if width > 0.0 {
            Dimension::length(width)
        } else {
            Dimension::auto()
        },
        height: if height > 0.0 {
            Dimension::length(height)
        } else {
            Dimension::auto()
        },
    }
}

fn px_rect<T: Copy>(f: impl Fn(f32) -> T, top: f32, right: f32, bottom: f32, left: f32) -> Rect<T> {
    Rect {
        left: f(left),
        right: f(right),
        top: f(top),
        bottom: f(bottom),
    }
}

/// Paragraphs in a 100px-tall vertical block: each is one 10px line of three pairs,
/// stretched along the 100px inline axis, stacked across.
fn block_flow(mode: WritingMode, xs: [f32; 3]) {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(mode);
        s.set_size(fixed(0.0, 100.0));
    });
    let p: Vec<Id> = (0..3)
        .map(|_| {
            add_text_div(&mut mason, root, measure_three, |s| {
                s.set_display(Display::Block)
            })
        })
        .collect();

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 30.0, 100.0),
            ("p0", p[0], xs[0], 0.0, 10.0, 100.0),
            ("p1", p[1], xs[1], 0.0, 10.0, 100.0),
            ("p2", p[2], xs[2], 0.0, 10.0, 100.0),
        ],
    );
}

#[test]
fn vertical_rl_blocks_stack_right_to_left() {
    block_flow(WritingMode::VerticalRl, [20.0, 10.0, 0.0]);
}

#[test]
fn vertical_lr_blocks_stack_left_to_right() {
    block_flow(WritingMode::VerticalLr, [0.0, 10.0, 20.0]);
}

#[test]
fn vertical_block_children_wrap_at_the_container_height() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(0.0, 40.0));
    });
    // Seven pairs at two per 40px line: four lines.
    let p = add_text_div(&mut mason, root, measure_seven, |s| {
        s.set_display(Display::Block)
    });
    let q = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block)
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 60.0, 40.0),
            ("p", p, 20.0, 0.0, 40.0, 40.0),
            ("q", q, 0.0, 0.0, 20.0, 40.0),
        ],
    );
}

#[test]
fn vertical_block_margins_collapse_along_the_block_axis() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::FlowRoot);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(0.0, 100.0));
        s.set_padding(px_rect(LengthPercentage::length, 0.0, 4.0, 0.0, 0.0));
    });
    // In vertical-rl the block-start margin is the right one; 8 and 5 collapse to 8.
    let a = add_box(&mut mason, root, |s| {
        s.set_display(Display::Block);
        s.set_size(fixed(10.0, 0.0));
        s.set_margin(px_rect(LengthPercentageAuto::length, 6.0, 0.0, 0.0, 8.0));
    });
    let b = add_box(&mut mason, root, |s| {
        s.set_display(Display::Block);
        s.set_size(fixed(10.0, 0.0));
        s.set_margin(px_rect(LengthPercentageAuto::length, 0.0, 5.0, 0.0, 0.0));
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // Width: 4 padding + 10 + 8 + 10 = 32. `a` keeps its 6px inline-start (top) margin.
    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 32.0, 100.0),
            ("a", a, 18.0, 6.0, 10.0, 94.0),
            ("b", b, 0.0, 0.0, 10.0, 100.0),
        ],
    );
}

#[test]
fn vertical_flex_row_runs_down() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Flex);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(50.0, 100.0));
        s.set_justify_content(Some(JustifyContent::CENTER));
        s.set_gap(Size {
            width: LengthPercentage::length(10.0),
            height: LengthPercentage::length(0.0),
        });
    });
    // Items are 20 tall along the main (inline) axis and stretch across it.
    let items: Vec<Id> = (0..2)
        .map(|_| add_box(&mut mason, root, |s| s.set_size(fixed(0.0, 20.0))))
        .collect();

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // 20 + 10 + 20 centered in 100: starts at 25.
    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 50.0, 100.0),
            ("i0", items[0], 0.0, 25.0, 50.0, 20.0),
            ("i1", items[1], 0.0, 55.0, 50.0, 20.0),
        ],
    );
}

#[test]
fn vertical_rl_flex_column_runs_right_to_left() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(100.0, 50.0));
        s.set_align_items(Some(AlignItems::START));
    });
    let a = add_box(&mut mason, root, |s| s.set_size(fixed(20.0, 10.0)));
    let b = add_box(&mut mason, root, |s| s.set_size(fixed(30.0, 10.0)));

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("a", a, 80.0, 0.0, 20.0, 10.0),
            ("b", b, 50.0, 0.0, 30.0, 10.0),
        ],
    );
}

#[test]
fn vertical_lr_grid_columns_run_down() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Grid);
        s.set_writing_mode(WritingMode::VerticalLr);
        s.set_grid_template_columns_css("30px 40px");
        s.set_grid_template_rows_css("15px 25px");
    });
    let cells: Vec<Id> = (0..4).map(|_| add_box(&mut mason, root, |_| {})).collect();

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // Columns are rows of the page: 30 then 40 tall. Rows stack left to right.
    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 40.0, 70.0),
            ("c0", cells[0], 0.0, 0.0, 15.0, 30.0),
            ("c1", cells[1], 0.0, 30.0, 15.0, 40.0),
            ("c2", cells[2], 15.0, 0.0, 25.0, 30.0),
            ("c3", cells[3], 15.0, 30.0, 25.0, 40.0),
        ],
    );
}

#[test]
fn horizontal_child_of_a_vertical_container_sizes_its_height_to_its_lines() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(200.0, 100.0));
    });
    // An orthogonal flow: 40 wide (its inline size), two lines of pairs, 20 tall.
    let h = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::HorizontalTb);
        s.set_size(fixed(40.0, 0.0));
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(&mason, &[("h", h, 160.0, 0.0, 40.0, 20.0)]);
}

#[test]
fn auto_width_horizontal_child_wraps_at_the_vertical_containers_width() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalLr);
        s.set_size(fixed(50.0, 100.0));
    });
    let h = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::HorizontalTb);
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    // Fit-content in the container's 50px width: wider than its 60px max-content allows,
    // so it takes all 50 and wraps two pairs, then one.
    check(&mason, &[("h", h, 0.0, 0.0, 50.0, 20.0)]);
}

#[test]
fn short_vertical_container_in_horizontal_flow_is_as_tall_as_its_content() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_size(fixed(200.0, 0.0));
    });
    let vertical = add_box(&mut mason, root, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
    });
    let p = add_text_div(&mut mason, vertical, measure_three, |s| {
        s.set_display(Display::Block)
    });

    mason.compute_wh(stage_id, 1280.0, 500.0);

    // Fit-content: three pairs are 60 long, well under the 500px viewport.
    check(
        &mason,
        &[
            ("vertical", vertical, 0.0, 0.0, 10.0, 60.0),
            ("p", p, 0.0, 0.0, 10.0, 60.0),
        ],
    );
}

#[test]
fn absolute_child_of_a_vertical_rl_container_uses_physical_insets() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Relative);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(100.0, 80.0));
    });
    let a = add_box(&mut mason, root, |s| {
        s.set_position(Position::Absolute);
        s.set_size(fixed(10.0, 20.0));
        s.set_inset(Rect {
            left: LengthPercentageAuto::auto(),
            right: LengthPercentageAuto::length(5.0),
            top: LengthPercentageAuto::length(7.0),
            bottom: LengthPercentageAuto::auto(),
        });
    });
    let b = add_box(&mut mason, root, |s| {
        s.set_position(Position::Absolute);
        s.set_size(fixed(10.0, 20.0));
        s.set_inset(Rect {
            left: LengthPercentageAuto::length(3.0),
            right: LengthPercentageAuto::auto(),
            top: LengthPercentageAuto::auto(),
            bottom: LengthPercentageAuto::length(4.0),
        });
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("a", a, 85.0, 7.0, 10.0, 20.0),
            ("b", b, 3.0, 56.0, 10.0, 20.0),
        ],
    );
}

#[test]
fn nested_vertical_containers_keep_their_physical_positions() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(0.0, 100.0));
        s.set_padding(px_rect(LengthPercentage::length, 2.0, 3.0, 0.0, 0.0));
    });
    let inner = add_box(&mut mason, root, |s| s.set_display(Display::Block));
    let p: Vec<Id> = (0..2)
        .map(|_| {
            add_text_div(&mut mason, inner, measure_three, |s| {
                s.set_display(Display::Block)
            })
        })
        .collect();

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 23.0, 100.0),
            ("inner", inner, 0.0, 2.0, 20.0, 98.0),
            ("p0", p[0], 10.0, 0.0, 10.0, 98.0),
            ("p1", p[1], 0.0, 0.0, 10.0, 98.0),
        ],
    );
}

#[test]
fn vertical_container_in_horizontal_flow_takes_the_viewport_as_its_inline_size() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalLr);
    });
    let p = add_text_div(&mut mason, root, measure_seven, |s| {
        s.set_display(Display::Block)
    });

    // No definite height anywhere: the 100px viewport, five pairs a line, two lines.
    mason.compute_wh(stage_id, 1280.0, 100.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 20.0, 100.0),
            ("p", p, 0.0, 0.0, 20.0, 100.0),
        ],
    );
}

#[test]
fn relayout_of_a_vertical_container_is_stable() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(0.0, 100.0));
    });
    let p: Vec<Id> = (0..2)
        .map(|_| {
            add_text_div(&mut mason, root, measure_three, |s| {
                s.set_display(Display::Block)
            })
        })
        .collect();

    let expected = [
        ("p0", p[0], 10.0, 0.0, 10.0, 100.0),
        ("p1", p[1], 0.0, 0.0, 10.0, 100.0),
    ];
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    check(&mason, &expected);
    // A cached pass must not turn the positions again.
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    check(&mason, &expected);
    // Neither must a pass that only re-lays out one child.
    mason.with_style_mut(p[1], |s| s.set_size(fixed(10.0, 0.0)));
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    check(&mason, &expected);
}

#[test]
fn absolute_box_with_a_static_position_in_a_vertical_rl_container() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let cb = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Relative);
        s.set_size(fixed(300.0, 300.0));
        s.set_padding(px_rect(LengthPercentage::length, 0.0, 0.0, 0.0, 50.0));
    });
    let vertical = add_box(&mut mason, cb, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(30.0, 100.0));
    });
    let p = add_box(&mut mason, vertical, |s| {
        s.set_display(Display::Block);
        s.set_size(fixed(10.0, 0.0));
    });
    // Where it would sit in flow: block-start (right) edge just left of `p`.
    let abs = add_box(&mut mason, vertical, |s| {
        s.set_position(Position::Absolute);
        s.set_size(fixed(10.0, 10.0));
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(
        &mason,
        &[
            ("vertical", vertical, 50.0, 0.0, 30.0, 100.0),
            ("p", p, 20.0, 0.0, 10.0, 100.0),
            ("abs", abs, 60.0, 0.0, 10.0, 10.0),
        ],
    );
}

// Ports of the WebSpec fixtures in tools/scripts/gentests/custom_element_tests/css_vertical_*,
// with Chrome's rects.

ahem_measure!(measure_one, &[20.0; 1]);

#[test]
fn webspec_css_vertical_rl_block_flow() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Absolute);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(0.0, 100.0));
    });
    let a = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block)
    });
    let b = add_text_div(&mut mason, root, measure_seven, |s| {
        s.set_display(Display::Block);
        s.set_margin(px_rect(LengthPercentageAuto::length, 0.0, 8.0, 0.0, 5.0));
    });
    let c = add_box(&mut mason, root, |s| {
        s.set_display(Display::Block);
        s.set_size(fixed(15.0, 0.0));
        s.set_margin(px_rect(LengthPercentageAuto::length, 0.0, 3.0, 0.0, 0.0));
        s.set_padding(px_rect(LengthPercentage::length, 10.0, 0.0, 0.0, 0.0));
    });

    mason.compute_wh(stage_id, 1024.0, 1024.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 58.0, 100.0),
            ("a", a, 48.0, 0.0, 10.0, 100.0),
            ("b", b, 20.0, 0.0, 20.0, 100.0),
            ("c", c, 0.0, 0.0, 15.0, 100.0),
        ],
    );
}

#[test]
fn webspec_css_vertical_lr_block_flow() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Absolute);
        s.set_writing_mode(WritingMode::VerticalLr);
        s.set_size(fixed(0.0, 40.0));
        s.set_padding(px_rect(LengthPercentage::length, 0.0, 0.0, 0.0, 8.0));
        s.set_border(px_rect(LengthPercentage::length, 2.0, 0.0, 0.0, 0.0));
    });
    let a = add_text_div(&mut mason, root, measure_seven, |s| {
        s.set_display(Display::Block)
    });
    let b = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block);
        s.set_margin(px_rect(LengthPercentageAuto::length, 0.0, 0.0, 0.0, 4.0));
    });

    mason.compute_wh(stage_id, 1024.0, 1024.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 112.0, 40.0),
            ("a", a, 8.0, 2.0, 70.0, 38.0),
            ("b", b, 82.0, 2.0, 30.0, 38.0),
        ],
    );
}

#[test]
fn webspec_css_vertical_rl_flex_row() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Flex);
        s.set_position(Position::Absolute);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(50.0, 100.0));
        s.set_justify_content(Some(JustifyContent::CENTER));
        s.set_gap(Size {
            width: LengthPercentage::length(10.0),
            height: LengthPercentage::length(0.0),
        });
    });
    let a = add_box(&mut mason, root, |s| {
        s.set_display(Display::Flex);
        s.set_size(fixed(0.0, 20.0));
    });
    let b = add_box(&mut mason, root, |s| {
        s.set_display(Display::Flex);
        s.set_size(fixed(30.0, 20.0));
    });
    let c = add_text_div(&mut mason, root, measure_one, |s| {
        s.set_display(Display::Flex)
    });

    mason.compute_wh(stage_id, 1024.0, 1024.0);

    check(
        &mason,
        &[
            ("a", a, 0.0, 10.0, 50.0, 20.0),
            ("b", b, 20.0, 40.0, 30.0, 20.0),
            ("c", c, 0.0, 70.0, 50.0, 20.0),
        ],
    );
}

#[test]
fn webspec_css_vertical_rl_flex_column() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Flex);
        s.set_position(Position::Absolute);
        s.set_flex_direction(FlexDirection::Column);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(100.0, 50.0));
        s.set_align_items(Some(AlignItems::START));
        s.set_gap(Size {
            width: LengthPercentage::length(0.0),
            height: LengthPercentage::length(5.0),
        });
    });
    let a = add_box(&mut mason, root, |s| s.set_size(fixed(20.0, 10.0)));
    let b = add_box(&mut mason, root, |s| {
        s.set_size(fixed(30.0, 10.0));
        s.set_flex_grow(1.0);
    });

    mason.compute_wh(stage_id, 1024.0, 1024.0);

    check(
        &mason,
        &[
            ("a", a, 80.0, 0.0, 20.0, 10.0),
            ("b", b, 0.0, 0.0, 75.0, 10.0),
        ],
    );
}

#[test]
fn webspec_css_vertical_lr_grid() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Grid);
        s.set_position(Position::Absolute);
        s.set_writing_mode(WritingMode::VerticalLr);
        s.set_grid_template_columns_css("30px 40px");
        s.set_grid_template_rows_css("15px 25px");
        s.set_gap(Size {
            width: LengthPercentage::length(3.0),
            height: LengthPercentage::length(2.0),
        });
    });
    let cells: Vec<Id> = (0..4)
        .map(|_| add_box(&mut mason, root, |s| s.set_display(Display::Flex)))
        .collect();

    mason.compute_wh(stage_id, 1024.0, 1024.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 42.0, 73.0),
            ("c0", cells[0], 0.0, 0.0, 15.0, 30.0),
            ("c1", cells[1], 0.0, 33.0, 15.0, 40.0),
            ("c2", cells[2], 17.0, 0.0, 25.0, 30.0),
            ("c3", cells[3], 17.0, 33.0, 25.0, 40.0),
        ],
    );
}

#[test]
fn webspec_css_vertical_rl_orthogonal_child() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Absolute);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(50.0, 100.0));
    });
    let a = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::HorizontalTb);
    });
    let b = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::HorizontalTb);
        s.set_size(fixed(25.0, 0.0));
    });

    mason.compute_wh(stage_id, 1024.0, 1024.0);

    check(
        &mason,
        &[
            ("a", a, 0.0, 0.0, 50.0, 20.0),
            ("b", b, -25.0, 0.0, 25.0, 30.0),
        ],
    );
}

#[test]
fn webspec_css_vertical_rl_nested() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Absolute);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(0.0, 100.0));
        s.set_padding(px_rect(LengthPercentage::length, 2.0, 3.0, 0.0, 0.0));
    });
    let inner = add_box(&mut mason, root, |s| s.set_display(Display::Block));
    let p: Vec<Id> = (0..2)
        .map(|_| {
            add_text_div(&mut mason, inner, measure_three, |s| {
                s.set_display(Display::Block)
            })
        })
        .collect();
    let lr = add_text_div(&mut mason, root, measure_three, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalLr);
    });

    mason.compute_wh(stage_id, 1024.0, 1024.0);

    check(
        &mason,
        &[
            ("root", root, 0.0, 0.0, 33.0, 100.0),
            ("inner", inner, 10.0, 2.0, 20.0, 98.0),
            ("p0", p[0], 10.0, 0.0, 10.0, 98.0),
            ("p1", p[1], 0.0, 0.0, 10.0, 98.0),
            ("lr", lr, 0.0, 2.0, 10.0, 98.0),
        ],
    );
}

ahem_measure!(measure_eleven_cells, &[9.0; 11]);

/// A vertical paragraph holding an inline element, its text sent as one segment per upright
/// cell: the flow runs down its 100px height, so the eleven 9px cells are one line, not one
/// line each across its 10px width.
#[test]
fn vertical_text_with_an_inline_child_flows_its_segments_down_the_line() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let row = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
    });
    let p = mason.create_text_node();
    let p_id = p.id();
    mason.with_style_mut(p_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(0.0, 100.0));
        s.set_font_metrics_values(8.0, 2.0, 5.0, 0.0, 7.0);
    });
    mason.set_measure(p_id, Some(measure_eleven_cells), std::ptr::null_mut());
    let span = mason.create_text_node();
    let span_id = span.id();
    mason.with_style_mut(span_id, |s| s.set_display_mode(DisplayMode::Inline));
    mason.append_node(row, &[p_id]);
    mason.append_node(p_id, &[span_id]);
    let cell = InlineSegment::Text {
        flags: 0,
        width: 9.0,
        ascent: 8.0,
        descent: 2.0,
    };
    mason.set_segments(p_id, vec![cell; 11]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    check(&mason, &[("p", p_id, 0.0, 0.0, 10.0, 100.0)]);
}

/// Columns overflowing a vertical-rl scroll container to the left are moved right by that
/// overflow, so the content box runs from 0 and a scroll view started at its end reaches them.
fn rl_scroller(overflow: mason_core::style::Overflow) -> (Mason, Id, Vec<Id>) {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(50.0, 100.0));
        s.set_overflow(Point {
            x: overflow,
            y: mason_core::style::Overflow::Visible,
        });
    });
    let columns = (0..3)
        .map(|_| {
            add_box(&mut mason, root, |s| {
                s.set_display(Display::Block);
                s.set_size(fixed(30.0, 0.0));
            })
        })
        .collect();
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    (mason, root, columns)
}

#[test]
fn vertical_rl_scroll_container_moves_left_overflow_into_its_content_box() {
    let (mason, root, c) = rl_scroller(mason_core::style::Overflow::Scroll);
    check(
        &mason,
        &[
            ("c0", c[0], 60.0, 0.0, 30.0, 100.0),
            ("c1", c[1], 30.0, 0.0, 30.0, 100.0),
            ("c2", c[2], 0.0, 0.0, 30.0, 100.0),
        ],
    );
    let l = mason.layout_raw(root);
    assert_eq!(l.scrollable_overflow_rect.right, 90.0);
}

#[test]
fn clipped_vertical_rl_box_keeps_its_columns_overflowing_left() {
    let (mason, _, c) = rl_scroller(mason_core::style::Overflow::Hidden);
    check(
        &mason,
        &[
            ("c0", c[0], 20.0, 0.0, 30.0, 100.0),
            ("c2", c[2], -40.0, 0.0, 30.0, 100.0),
        ],
    );
}

/// Floats in vertical-rl: `left` is line-left (the top) and `right` line-right (the bottom),
/// both at the block-start (right) edge. Their exclusions are in the container's own frame,
/// where its sideways text is laid out: x along the lines, y across them from the block start.
#[test]
fn floats_in_vertical_rl_sit_at_the_line_ends_with_exclusions_in_the_frame() {
    let mut mason = Mason::new();
    let stage_id = stage(&mut mason);
    let root = add_box(&mut mason, stage_id, |s| {
        s.set_display(Display::Block);
        s.set_writing_mode(WritingMode::VerticalRl);
        s.set_size(fixed(100.0, 100.0));
    });
    let left = add_box(&mut mason, root, |s| {
        s.set_display(Display::Block);
        s.set_float(Float::Left);
        s.set_size(fixed(20.0, 30.0));
    });
    let right = add_box(&mut mason, root, |s| {
        s.set_display(Display::Block);
        s.set_float(Float::Right);
        s.set_size(fixed(10.0, 15.0));
    });
    mason.compute_wh(stage_id, 1280.0, 2688.0);
    check(
        &mason,
        &[
            ("left", left, 80.0, 0.0, 20.0, 30.0),
            ("right", right, 90.0, 85.0, 10.0, 15.0),
        ],
    );
    assert_eq!(
        mason.get_float_exclusions(root),
        vec![0.0, 0.0, 30.0, 20.0, 1.0, 85.0, 0.0, 15.0, 10.0, 2.0]
    );
}
