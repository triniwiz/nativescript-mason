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
fn float_respects_margins_in_placement() {
    let mut mason = Mason::new();

    // root container with definite width
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size { width: Dimension::length(200.0), height: Dimension::auto() });
    });

    // single float child
    let a = mason.create_node();
    let aid = a.id();
    mason.append_node(rid, &[aid]);

    mason.set_measure(aid, Some(measure_small), std::ptr::null_mut());

    mason.with_style_mut(aid, |s| {
        s.set_float(Float::Left);
        // left margin 10, right margin 5
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(10.0),
            right: LengthPercentageAuto::length(5.0),
            top: LengthPercentageAuto::length(0.0),
            bottom: LengthPercentageAuto::length(0.0),
        });
    });

    mason.compute_wh(rid, 200.0, f32::NAN);
    let rects = mason.get_float_rects(rid);
    assert!(rects.len() >= 4, "expected at least one float rect");

    let a_left = rects[0];
    let a_w = rects[2];

    // The float's border-box left should be offset by the left margin (10.0)
    assert!((a_left - 10.0).abs() < 0.001, "float left should include left margin");
    // width should remain measured content width (30.0)
    assert!((a_w - 30.0).abs() < 0.001, "float width should be measured width");
}
