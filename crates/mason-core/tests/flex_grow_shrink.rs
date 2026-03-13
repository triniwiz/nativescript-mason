use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

// simple intrinsic measure (zero-sized) so flex distribution dominates
extern "C" fn measure_zero(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(0.0, 0.0)
}

#[test]
fn flex_grow_allocates_space_proportionally() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size { width: Dimension::length(300.0), height: Dimension::auto() });
    });

    let a = mason.create_node(); let aid = a.id();
    let b = mason.create_node(); let bid = b.id();

    mason.append_node(rid, &[aid, bid]);

    mason.set_measure(aid, Some(measure_zero), std::ptr::null_mut());
    mason.set_measure(bid, Some(measure_zero), std::ptr::null_mut());

    mason.with_style_mut(aid, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::length(0.0));
    });
    mason.with_style_mut(bid, |s| {
        s.set_flex_grow(2.0);
        s.set_flex_basis(Dimension::length(0.0));
    });

    mason.compute_wh(rid, 300.0, f32::NAN);

    let la = mason.layout_raw(aid);
    let lb = mason.layout_raw(bid);

    // available width should be split 1:2 ⇒ a ~100, b ~200 (allow small epsilon)
    assert!((la.size.width - 100.0).abs() < 1.0, "flex a width expected ≈100, got {}", la.size.width);
    assert!((lb.size.width - 200.0).abs() < 1.0, "flex b width expected ≈200, got {}", lb.size.width);
}
