use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

// Measure function: returns 30x10
extern "C" fn measure_small(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(30.0, 10.0)
}

#[test]
fn stacked_floats_with_margins_and_clear() {
    let mut mason = Mason::new();

    // root container with definite width
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size { width: Dimension::length(200.0), height: Dimension::auto() });
    });

    // three float children appended in order
    let a = mason.create_node();
    let b = mason.create_node();
    let c = mason.create_node();
    let aid = a.id();
    let bid = b.id();
    let cid = c.id();
    mason.append_node(rid, &[aid, bid, cid]);

    mason.set_measure(aid, Some(measure_small), std::ptr::null_mut());
    mason.set_measure(bid, Some(measure_small), std::ptr::null_mut());
    mason.set_measure(cid, Some(measure_small), std::ptr::null_mut());

    // A: left float with left margin
    mason.with_style_mut(aid, |s| {
        s.set_float(Float::Left);
        s.set_margin(Rect {
                left: LengthPercentageAuto::length(8.0),
                right: LengthPercentageAuto::length(0.0),
                top: LengthPercentageAuto::length(0.0),
                bottom: LengthPercentageAuto::length(0.0),
        });
    });

    // B: left float that clears left; should be pushed below A
    mason.with_style_mut(bid, |s| {
        s.set_float(Float::Left);
        s.set_clear(taffy::Clear::Left);
        s.set_margin(Rect {
                left: LengthPercentageAuto::length(5.0),
                right: LengthPercentageAuto::length(0.0),
                top: LengthPercentageAuto::length(0.0),
                bottom: LengthPercentageAuto::length(0.0),
        });
    });

    // C: left float no clear; should be placed after B
    mason.with_style_mut(cid, |s| {
        s.set_float(Float::Left);
        s.set_margin(Rect {
                left: LengthPercentageAuto::length(3.0),
                right: LengthPercentageAuto::length(0.0),
                top: LengthPercentageAuto::length(0.0),
                bottom: LengthPercentageAuto::length(0.0),
        });
    });

    mason.compute_wh(rid, 200.0, f32::NAN);
    let rects = mason.get_float_rects(rid);
    assert!(rects.len() >= 12, "expected three float rects (len>=12)");

    // rects layout: [a_l, a_t, a_w, a_h, b_l, b_t, b_w, b_h, c_l, c_t, c_w, c_h]
    let a_left = rects[0];
    let a_top = rects[1];
    let a_w = rects[2];

    let b_left = rects[4];
    let b_top = rects[5];

    let c_left = rects[8];
    let c_top = rects[9];

    // A should start at y=0 and include left margin offset
    assert!((a_top - 0.0).abs() < 0.001, "A should be at top");
    assert!((a_left - 8.0).abs() < 0.001, "A left should include left margin");
    assert!((a_w - 30.0).abs() < 0.001, "A width should be measured width");

    // B must be pushed below A because of clear:left
    assert!(b_top >= a_top + a_w * 0.0 + 9.9, "B should be placed below A (b_top={}, a_h={})", b_top, a_w);

    // C should be after B vertically (y >= b_top)
    assert!(c_top >= b_top - 0.001, "C should be at or below B");
}
