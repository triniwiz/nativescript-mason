use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::geometry::{Rect, Size};
use taffy::style::{Dimension, Display, LengthPercentage, LengthPercentageAuto, Position};

// An absolutely positioned box's containing block is its positioned ancestor's
// PADDING box (CSS Position 3, §4.1), so `top: 0; right: 0` sits in the corner
// of the border, not inset by the padding. A container with an inline child is
// laid out by mason's own inline path (`layout_absolute_children`), which used
// to resolve insets against the content box instead.

extern "C" fn measure_40x20(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(40.0, 20.0)
}

const WIDTH: f32 = 300.0;
const PADDING: f32 = 15.0;
const BORDER: f32 = 1.0;
// 20px line + padding + border on both sides.
const HEIGHT: f32 = 20.0 + 2.0 * (PADDING + BORDER);

fn assert_rect(mason: &Mason, id: Id, label: &str, x: f32, y: f32, w: f32, h: f32) {
    let l = mason.layout_raw(id);
    assert!(
        (l.location.x - x).abs() < 0.5
            && (l.location.y - y).abs() < 0.5
            && (l.size.width - w).abs() < 0.5
            && (l.size.height - h).abs() < 0.5,
        "{label}: expected x={x} y={y} w={w} h={h}, got x={} y={} w={} h={}",
        l.location.x,
        l.location.y,
        l.size.width,
        l.size.height
    );
}

// The NodeRef owns the node, so callers keep it alive for the test's duration.
fn abs_child(
    mason: &mut Mason,
    size: Size<Dimension>,
    inset: Rect<LengthPercentageAuto>,
) -> (NodeRef, Id) {
    let child = mason.create_node();
    let id = child.id();
    mason.with_style_mut(id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(size);
        s.set_inset(inset);
    });
    (child, id)
}

fn inset(
    top: f32,
    right: Option<f32>,
    bottom: Option<f32>,
    left: Option<f32>,
) -> Rect<LengthPercentageAuto> {
    let side =
        |v: Option<f32>| v.map_or(LengthPercentageAuto::auto(), LengthPercentageAuto::length);
    Rect {
        top: if top.is_nan() {
            LengthPercentageAuto::auto()
        } else {
            LengthPercentageAuto::length(top)
        },
        right: side(right),
        bottom: side(bottom),
        left: side(left),
    }
}

#[test]
fn abspos_children_of_an_inline_container_use_its_padding_box() {
    let mut mason = Mason::new();

    let parent = mason.create_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Relative);
        s.set_size(Size {
            width: Dimension::length(WIDTH),
            height: Dimension::auto(),
        });
        s.set_padding(Rect {
            left: LengthPercentage::length(PADDING),
            right: LengthPercentage::length(PADDING),
            top: LengthPercentage::length(PADDING),
            bottom: LengthPercentage::length(PADDING),
        });
        s.set_border(Rect {
            left: LengthPercentage::length(BORDER),
            right: LengthPercentage::length(BORDER),
            top: LengthPercentage::length(BORDER),
            bottom: LengthPercentage::length(BORDER),
        });
    });

    // The inline child is what sends the parent down the inline layout path.
    let label = mason.create_text_node();
    let label_id = label.id();
    mason.set_measure(label_id, Some(measure_40x20), std::ptr::null_mut());
    mason.with_style_mut(label_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let fixed = Size {
        width: Dimension::length(10.0),
        height: Dimension::length(10.0),
    };
    let (_top_right, top_right) = abs_child(&mut mason, fixed, inset(0.0, Some(0.0), None, None));
    let (_bottom_left, bottom_left) = abs_child(
        &mut mason,
        fixed,
        inset(f32::NAN, None, Some(0.0), Some(0.0)),
    );
    let (_stretched, stretched) = abs_child(
        &mut mason,
        Size {
            width: Dimension::auto(),
            height: Dimension::auto(),
        },
        inset(0.0, Some(0.0), Some(0.0), Some(0.0)),
    );
    let (_half, half) = abs_child(
        &mut mason,
        Size {
            width: Dimension::percent(0.5),
            height: Dimension::length(10.0),
        },
        inset(0.0, None, None, Some(0.0)),
    );

    mason.append_node(pid, &[label_id, top_right, bottom_left, stretched, half]);
    mason.compute_wh(pid, WIDTH, f32::NAN);

    let padding_box_w = WIDTH - 2.0 * BORDER;
    let padding_box_h = HEIGHT - 2.0 * BORDER;

    assert_rect(&mason, pid, "container", 0.0, 0.0, WIDTH, HEIGHT);
    assert_rect(
        &mason,
        top_right,
        "top: 0; right: 0",
        WIDTH - BORDER - 10.0,
        BORDER,
        10.0,
        10.0,
    );
    assert_rect(
        &mason,
        bottom_left,
        "bottom: 0; left: 0",
        BORDER,
        HEIGHT - BORDER - 10.0,
        10.0,
        10.0,
    );
    assert_rect(
        &mason,
        stretched,
        "inset: 0",
        BORDER,
        BORDER,
        padding_box_w,
        padding_box_h,
    );
    assert_rect(
        &mason,
        half,
        "width: 50%",
        BORDER,
        BORDER,
        padding_box_w * 0.5,
        10.0,
    );
}

#[test]
fn abspos_child_with_auto_insets_stays_at_its_static_position() {
    let mut mason = Mason::new();

    let parent = mason.create_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(Display::Block);
        s.set_position(Position::Relative);
        s.set_size(Size {
            width: Dimension::length(WIDTH),
            height: Dimension::auto(),
        });
        s.set_padding(Rect {
            left: LengthPercentage::length(PADDING),
            right: LengthPercentage::length(PADDING),
            top: LengthPercentage::length(PADDING),
            bottom: LengthPercentage::length(PADDING),
        });
        s.set_border(Rect {
            left: LengthPercentage::length(BORDER),
            right: LengthPercentage::length(BORDER),
            top: LengthPercentage::length(BORDER),
            bottom: LengthPercentage::length(BORDER),
        });
    });

    let label = mason.create_text_node();
    let label_id = label.id();
    mason.set_measure(label_id, Some(measure_40x20), std::ptr::null_mut());
    mason.with_style_mut(label_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let (_child, child) = abs_child(
        &mut mason,
        Size {
            width: Dimension::length(10.0),
            height: Dimension::length(10.0),
        },
        inset(f32::NAN, None, None, None),
    );

    mason.append_node(pid, &[label_id, child]);
    mason.compute_wh(pid, WIDTH, f32::NAN);

    // With every inset auto the box keeps its static position, which starts at
    // the content box.
    let content = PADDING + BORDER;
    assert_rect(&mason, child, "auto insets", content, content, 10.0, 10.0);
}
