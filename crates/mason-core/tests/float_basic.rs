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

// Measure function: returns 40x12
extern "C" fn measure_medium(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(40.0, 12.0)
}

#[test]
fn floats_basic_positions_and_sizes() {
    let mut mason = Mason::new();

    // root container
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| { s.set_display(Display::Block); });

    // two inline children that will float
    let a = mason.create_node();
    let b = mason.create_node();
    let aid = a.id();
    let bid = b.id();

    mason.append_node(rid, &[aid, bid]);

    // Set measures
    mason.set_measure(aid, Some(measure_small), std::ptr::null_mut());
    mason.set_measure(bid, Some(measure_medium), std::ptr::null_mut());

    // Set floats
    mason.with_style_mut(aid, |s| { s.set_float(Float::Left); });
    mason.with_style_mut(bid, |s| { s.set_float(Float::Right); });

    // Compute layout with a definite width
    mason.compute_wh(rid, 200.0, f32::NAN);

    // Get float rects
    let rects = mason.get_float_rects(rid);
    // Expect two rects: [l,t,w,h, l2,t2,w2,h2]
    assert!(rects.len() == 8, "expected 8 floats entries, got {}", rects.len());

    // first rect is left float (a)
    let a_left = rects[0];
    let a_top = rects[1];
    let a_w = rects[2];
    let a_h = rects[3];

    assert!((a_left - 0.0).abs() < 0.001, "left float x should be 0");
    assert!((a_top - 0.0).abs() < 0.001, "left float y should be 0");
    assert!((a_w - 30.0).abs() < 0.001, "left float width");
    assert!((a_h - 10.0).abs() < 0.001, "left float height");

    // second rect is right float (b)
    let b_left = rects[4];
    let b_top = rects[5];
    let b_w = rects[6];
    let b_h = rects[7];

    assert!((b_w - 40.0).abs() < 0.001, "right float width");
    assert!((b_h - 12.0).abs() < 0.001, "right float height");
    // right float left should be container_w - width (since no right offset yet)
    assert!((b_left - (200.0 - b_w)).abs() < 1.0, "right float left");
}
