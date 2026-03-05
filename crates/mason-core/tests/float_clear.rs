use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

extern "C" fn measure_small(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(30.0, 10.0)
}

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
fn clear_left_pushes_below_left_floats() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| { s.set_display(Display::Block); });

    let a = mason.create_node();
    let b = mason.create_node();
    let aid = a.id();
    let bid = b.id();
    mason.append_node(rid, &[aid, bid]);

    mason.set_measure(aid, Some(measure_small), std::ptr::null_mut());
    mason.set_measure(bid, Some(measure_medium), std::ptr::null_mut());

    mason.with_style_mut(aid, |s| { s.set_float(Float::Left); });
    mason.with_style_mut(bid, |s| { s.set_float(Float::Left); s.set_clear(taffy::Clear::Left); });

    mason.compute_wh(rid, 200.0, f32::NAN);
    let rects = mason.get_float_rects(rid);
    // expect a at y=0 and b pushed below a (y=10)
    assert!((rects[1] - 0.0).abs() < 0.001);
    assert!((rects[5] - 10.0).abs() < 0.001);
}
