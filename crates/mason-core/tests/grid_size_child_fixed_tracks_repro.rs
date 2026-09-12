use mason_core::style::DisplayMode;
use mason_core::*;

// WebSpec fixture `grid_size_child_fixed_tracks`: five auto-sized grid items
// with `justify-self: start` / `align-self: start` in a 3x3 grid of 40px
// tracks. A non-stretched auto-width grid item is sized by the fit-content
// formula against its grid area -- `min(max-content, max(min-content, area))`
// -- so every item here should come out 40 wide (their max-contents are 60-80)
// and wrap to two 10px lines.
//
// Ahem at font-size 10 makes the text metrics exact: each `H` is 1em wide and
// the U+200B zero-width spaces are the only soft-wrap opportunities, so a
// string is a list of unbreakable segments whose widths are known up front.

/// Widths of the unbreakable runs, in the order they appear.
const SEQ1: &[f32] = &[20.0, 20.0, 20.0, 20.0]; // "HH<zwsp>HH<zwsp>HH<zwsp>HH"
const SEQ2: &[f32] = &[30.0, 30.0]; // "HHH<zwsp>HHH"
const SEQ3: &[f32] = &[20.0, 40.0]; // "HH<zwsp>HHHH"

const LINE_HEIGHT: f32 = 10.0;

/// Greedy line breaking, the way a real text engine measures.
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
            eprintln!(
                "  measure(known_w={known_w} avail_w={avail_w}) -> {w}x{h}  [{:?}]",
                $segments
            );
            MeasureOutput::make(w, h)
        }
    };
}

ahem_measure!(measure_seq1, SEQ1);
ahem_measure!(measure_seq2, SEQ2);
ahem_measure!(measure_seq3, SEQ3);
ahem_measure!(measure_seq4, SEQ1);
ahem_measure!(measure_seq5, SEQ1);

/// One grid item: a `display:flex` div holding an anonymous text container,
/// mirroring what masonkit builds natively for `<div>text</div>`.
fn add_item(
    mason: &mut Mason,
    parent: Id,
    measure: extern "C" fn(
        *const std::ffi::c_void,
        std::ffi::c_float,
        std::ffi::c_float,
        std::ffi::c_float,
        std::ffi::c_float,
    ) -> std::ffi::c_longlong,
    apply: impl FnOnce(&mut mason_core::style::Style),
) -> Id {
    let item = mason.create_node();
    let item_id = item.id();
    mason.with_style_mut(item_id, |s| {
        s.set_position(Position::Relative);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_align_self(Some(AlignItems::START));
        s.set_justify_self(Some(AlignItems::START));
        apply(s);
    });

    let container = mason.create_text_node();
    let container_id = container.id();
    mason.with_style_mut(container_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.set_measure(container_id, Some(measure), std::ptr::null_mut());

    let text = mason.create_node();
    let text_id = text.id();
    mason.with_style_mut(text_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });

    mason.append_node(container_id, &[text_id]);
    mason.append_node(parent, &[item_id]);
    mason.append_node(item_id, &[container_id]);
    item_id
}

#[test]
fn auto_width_start_aligned_items_get_fit_content_of_their_track() {
    let mut mason = Mason::new();

    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1280.0),
            height: Dimension::auto(),
        });
    });

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Grid);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_size(Size {
            width: Dimension::length(120.0),
            height: Dimension::length(120.0),
        });
        s.set_grid_template_columns_css("40px 40px 40px");
        s.set_grid_template_rows_css("40px 40px 40px");
    });
    mason.append_node(stage_id, &[root_id]);

    let seq1 = add_item(&mut mason, root_id, measure_seq1, |_| {});
    let seq2 = add_item(&mut mason, root_id, measure_seq2, |_| {});
    let seq3 = add_item(&mut mason, root_id, measure_seq3, |_| {});
    let seq4 = add_item(&mut mason, root_id, measure_seq4, |s| {
        s.set_size(Size {
            width: Dimension::length(20.0),
            height: Dimension::auto(),
        });
    });
    let seq5 = add_item(&mut mason, root_id, measure_seq5, |s| {
        s.set_max_size(Size {
            width: Dimension::length(30.0),
            height: Dimension::auto(),
        });
    });

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let expected: [(&str, Id, f32, f32, f32, f32); 5] = [
        ("seq1", seq1, 0.0, 0.0, 40.0, 20.0),
        ("seq2", seq2, 40.0, 0.0, 40.0, 20.0),
        ("seq3", seq3, 80.0, 0.0, 40.0, 20.0),
        ("seq4", seq4, 0.0, 40.0, 20.0, 40.0),
        ("seq5", seq5, 40.0, 40.0, 30.0, 40.0),
    ];

    let mut failures = Vec::new();
    for (name, id, x, y, w, h) in expected {
        let l = mason.layout_raw(id);
        eprintln!(
            "{name}: x={} y={} w={} h={} (expected x={x} y={y} w={w} h={h})",
            l.location.x, l.location.y, l.size.width, l.size.height
        );
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
