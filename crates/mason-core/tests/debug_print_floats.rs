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

#[test]
fn print_float_rects_for_debug() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size { width: Dimension::length(200.0), height: Dimension::auto() });
    });

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

    mason.with_style_mut(aid, |s| {
        s.set_float(Float::Left);
        s.set_margin(Rect { left: LengthPercentageAuto::length(8.0), right: LengthPercentageAuto::length(0.0), top: LengthPercentageAuto::length(0.0), bottom: LengthPercentageAuto::length(0.0) });
    });
    mason.with_style_mut(bid, |s| {
        s.set_float(Float::Left);
        s.set_clear(taffy::Clear::Left);
        s.set_margin(Rect { left: LengthPercentageAuto::length(5.0), right: LengthPercentageAuto::length(0.0), top: LengthPercentageAuto::length(0.0), bottom: LengthPercentageAuto::length(0.0) });
    });
    mason.with_style_mut(cid, |s| {
        s.set_float(Float::Left);
        s.set_margin(Rect { left: LengthPercentageAuto::length(3.0), right: LengthPercentageAuto::length(0.0), top: LengthPercentageAuto::length(0.0), bottom: LengthPercentageAuto::length(0.0) });
    });

    mason.compute_wh(rid, 200.0, f32::NAN);
    let rects = mason.get_float_rects(rid);
    eprintln!("float rects: {:?}", rects);
    // keep test as a smoke check
    assert!(!rects.is_empty());
}
