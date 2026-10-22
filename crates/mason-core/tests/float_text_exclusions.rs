use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicUsize, Ordering};

static TEXT_MEASURES: AtomicUsize = AtomicUsize::new(0);

extern "C" fn measure_text(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    TEXT_MEASURES.fetch_add(1, Ordering::SeqCst);
    MeasureOutput::make(200.0, 40.0)
}

fn block_root(mason: &mut Mason) -> NodeRef {
    let root = mason.create_node();
    mason.with_style_mut(root.id(), |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
    });
    root
}

fn sized_float(mason: &mut Mason, side: Float, width: f32, margin: f32) -> NodeRef {
    let float = mason.create_node();
    mason.with_style_mut(float.id(), |s| {
        s.set_float(side);
        s.set_size(Size {
            width: Dimension::length(width),
            height: Dimension::length(50.0),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(margin),
            right: LengthPercentageAuto::length(margin),
            top: LengthPercentageAuto::length(margin),
            bottom: LengthPercentageAuto::length(margin),
        });
    });
    float
}

#[test]
fn float_exclusions_are_margin_boxes_with_a_side() {
    let mut mason = Mason::new();
    let root = block_root(&mut mason);
    let left = sized_float(&mut mason, Float::Left, 100.0, 5.0);
    let right = sized_float(&mut mason, Float::Right, 40.0, 0.0);
    mason.append_node(root.id(), &[left.id(), right.id()]);

    mason.compute_wh(root.id(), 200.0, f32::NAN);
    let ex = mason.get_float_exclusions(root.id());
    assert_eq!(ex.len(), 10);
    // The left float's border box sits at (5, 5); its margin box starts at the origin.
    assert_eq!(&ex[0..5], &[0.0, 0.0, 110.0, 60.0, 1.0]);
    assert_eq!(&ex[5..10], &[160.0, 0.0, 40.0, 50.0, 2.0]);
}

#[test]
fn resizing_a_float_remeasures_its_text_sibling() {
    let mut mason = Mason::new();
    let root = block_root(&mut mason);
    let float = sized_float(&mut mason, Float::Left, 100.0, 0.0);
    let text = mason.create_node();
    mason.set_measure(text.id(), Some(measure_text), std::ptr::null_mut());
    mason.append_node(root.id(), &[float.id(), text.id()]);

    mason.compute_wh(root.id(), 200.0, f32::NAN);
    let first = TEXT_MEASURES.load(Ordering::SeqCst);
    assert!(first > 0);

    mason.with_style_mut(float.id(), |s| {
        s.set_size(Size {
            width: Dimension::length(120.0),
            height: Dimension::length(50.0),
        });
    });
    mason.compute_wh(root.id(), 200.0, f32::NAN);
    assert!(
        TEXT_MEASURES.load(Ordering::SeqCst) > first,
        "the text beside a resized float must be measured again"
    );
}

#[test]
fn a_right_float_sits_against_the_content_box_edge() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    mason.with_style_mut(root.id(), |s| {
        s.set_display(Display::Block);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_size(Size {
            width: Dimension::length(300.0),
            height: Dimension::auto(),
        });
        s.set_padding(Rect {
            left: LengthPercentage::length(8.0),
            right: LengthPercentage::length(8.0),
            top: LengthPercentage::length(8.0),
            bottom: LengthPercentage::length(8.0),
        });
    });
    let right = sized_float(&mut mason, Float::Right, 90.0, 0.0);
    mason.append_node(root.id(), &[right.id()]);

    mason.compute_wh(root.id(), 400.0, f32::NAN);
    let ex = mason.get_float_exclusions(root.id());
    // 300 - 2 * 8 = 284 wide content box, so the float's left edge is at 194.
    assert_eq!(&ex[0..5], &[194.0, 0.0, 90.0, 50.0, 2.0]);
}
