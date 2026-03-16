use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

extern "C" fn measure_20x10(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(20.0, 10.0)
}

#[test]
fn grid_two_columns_positions() {
    let mut mason = Mason::new();

    let root = mason.create_node(); let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Grid);
        s.set_size(Size { width: Dimension::length(200.0), height: Dimension::auto() });
        s.set_grid_template_columns_css("100px 100px");
    });

    let a = mason.create_node(); let aid = a.id();
    let b = mason.create_node(); let bid = b.id();

    mason.append_node(rid, &[aid, bid]);

    mason.set_measure(aid, Some(measure_20x10), std::ptr::null_mut());
    mason.set_measure(bid, Some(measure_20x10), std::ptr::null_mut());

    mason.compute_wh(rid, 200.0, f32::NAN);

    let la = mason.layout_raw(aid);
    let lb = mason.layout_raw(bid);

    // Expect first cell at x=0, second cell at x≈100
    assert!((la.location.x - 0.0).abs() < 1.0, "grid a x expected ≈0, got {}", la.location.x);
    assert!((lb.location.x - 100.0).abs() < 1.0, "grid b x expected ≈100, got {}", lb.location.x);
}
