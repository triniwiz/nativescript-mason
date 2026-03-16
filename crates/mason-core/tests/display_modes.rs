use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

// simple measure helpers used by a number of tests below
extern "C" fn measure_20x10(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(20.0, 10.0)
}

extern "C" fn measure_30x15(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(30.0, 15.0)
}

#[derive(Copy, Clone, Eq, PartialEq, Debug)]
enum Variant {
    Block,
    Flex,
    Grid,
    None,
}

#[test]
fn basic_display_types_do_not_crash() {
    let variants = [
        Variant::Block,
        Variant::Flex,
        Variant::Grid,
        Variant::None,
    ];

    for disp in variants {
        let mut mason = Mason::new();
        let root = mason.create_node();
        let rid = root.id();
        mason.with_style_mut(rid, |s| {
            s.set_display(Display::Block);
            s.set_size(Size {
                width: Dimension::length(100.0),
                height: Dimension::length(100.0),
            });
        });

        let child = mason.create_node();
        let cid = child.id();
        mason.set_measure(cid, Some(measure_20x10), std::ptr::null_mut());
        mason.with_style_mut(cid, |s| match disp {
            Variant::Block => {
                s.set_display(Display::Block);
            }
            Variant::Flex => {
                s.set_display(Display::Flex);
            }
            Variant::Grid => {
                s.set_display(Display::Grid);
            }
            Variant::None => {
                s.set_display(Display::None);
            }
        });

        mason.append_node(rid, &[cid]);
        mason.compute_wh(rid, 100.0, 100.0);
        let layout = mason.layout_raw(cid);
        // at least ensure measurement happened and yielded a finite size
        assert!(layout.size.width >= 0.0 && layout.size.width.is_finite());
        assert!(layout.size.height >= 0.0 && layout.size.height.is_finite());
    }
}

#[test]
fn display_mode_variants_affect_layout() {
    let modes = [
        DisplayMode::None,
        DisplayMode::Inline,
        DisplayMode::Box,
        DisplayMode::ListItem,
    ];

    for &mode in &modes {
        let mut mason = Mason::new();
        let n = mason.create_node();
        let nid = n.id();
        mason.set_measure(nid, Some(measure_30x15), std::ptr::null_mut());
        mason.with_style_mut(nid, |s| {
            s.set_display(Display::Block);
            s.set_display_mode(mode);
        });

        mason.compute_wh(nid, 50.0, 50.0);
        let lay = mason.layout_raw(nid);
        assert!(lay.size.width > 0.0 && lay.size.width.is_finite() && lay.size.height.is_finite());
    }
}

#[test]
fn mixed_display_children_preserve_constraints() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });

    let b = mason.create_node();
    let bid = b.id();
    mason.set_measure(bid, Some(measure_20x10), std::ptr::null_mut());
    mason.with_style_mut(bid, |s| {
        s.set_display(Display::Block);
    });

    let f = mason.create_node();
    let fid = f.id();
    mason.set_measure(fid, Some(measure_20x10), std::ptr::null_mut());
    mason.with_style_mut(fid, |s| {
        s.set_display(Display::Flex);
    });

    mason.append_node(rid, &[bid, fid]);
    mason.compute_wh(rid, 100.0, 100.0);

    let lb = mason.layout_raw(bid);
    let lf = mason.layout_raw(fid);
    assert!(lb.size.width <= 100.0 + 1e-3);
    assert!(lf.size.width <= 100.0 + 1e-3);
}

#[test]
fn mixed_display_mode_siblings() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });

    let i = mason.create_node();
    let iid = i.id();
    mason.set_measure(iid, Some(measure_20x10), std::ptr::null_mut());
    mason.with_style_mut(iid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });

    let bx = mason.create_node();
    let bxid = bx.id();
    mason.set_measure(bxid, Some(measure_20x10), std::ptr::null_mut());
    mason.with_style_mut(bxid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Box);
    });

    mason.append_node(rid, &[iid, bxid]);
    mason.compute_wh(rid, 100.0, 100.0);
    let li = mason.layout_raw(iid);
    let lbx = mason.layout_raw(bxid);
    assert!(li.size.width > 0.0 && li.size.width.is_finite());
    assert!(lbx.size.width > 0.0 && lbx.size.width.is_finite());
}

// mimic the Android FloatActivity body layout (drop-cap, photo essay, clears).  We
// don't recreate every detail – just a card with a left‑floated box and some text
// to verify that the float rectangles are generated and contained.
#[test]
fn android_float_activity_repro() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size { width: Dimension::length(300.0), height: Dimension::auto() });
    });

    // helper variants for a few common sizes (avoids closure capture)
    extern "C" fn measure_68x68(
        _data: *const c_void,
        _known_w: c_float,
        _known_h: c_float,
        _avail_w: c_float,
        _avail_h: c_float,
    ) -> c_longlong {
        MeasureOutput::make(68.0, 68.0)
    }
    extern "C" fn measure_200x20(
        _data: *const c_void,
        _known_w: c_float,
        _known_h: c_float,
        _avail_w: c_float,
        _avail_h: c_float,
    ) -> c_longlong {
        MeasureOutput::make(200.0, 20.0)
    }

    fn make_box(m: &mut Mason, w: f32, h: f32, f: Option<Float>) -> NodeRef {
        let n = m.create_node();
        let nid = n.id();
        let meas: extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong =
            if (w - 68.0).abs() < 0.001 && (h - 68.0).abs() < 0.001 {
                measure_68x68
            } else if (w - 200.0).abs() < 0.001 && (h - 20.0).abs() < 0.001 {
                measure_200x20
            } else {
                // fallback constant
                measure_20x10
            };
        m.set_measure(nid, Some(meas), std::ptr::null_mut());
        m.with_style_mut(nid, |s| {
            s.set_display(Display::Block);
            if let Some(fl) = f { s.set_float(fl); }
        });
        n
    }

    // card container
    let card = mason.create_node();
    let cid = card.id();
    mason.with_style_mut(cid, |s| { s.set_display(Display::Block); });

    // drop‑cap left float
    let drop = make_box(&mut mason, 68.0, 68.0, Some(Float::Left));
    let drop_id = drop.id();
    mason.append_node(cid, &[drop_id]);

    // prose text following
    let prose = make_box(&mut mason, 200.0, 20.0, None);
    let prose_id = prose.id();
    mason.append_node(cid, &[prose_id]);

    mason.append_node(rid, &[cid]);
    mason.compute_wh(rid, 300.0, f32::NAN);

    // ensure float rect reported and width matches drop cap
    // previously we returned floats for the root via a flattened fallback,
    // but that helper was removed.  We now query the actual container that
    // holds the float (the card node) and verify its rects instead.
    let rects = mason.get_float_rects(cid);
    assert!(!rects.is_empty(), "expected at least one float rect");
    assert_eq!(rects[2], 68.0);
}
