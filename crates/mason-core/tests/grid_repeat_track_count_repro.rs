// Isolated repro for a suspected off-by-one in `repeat()` grid-template-column
// expansion: `repeat(5, 100px)` should produce 5 tracks, so 5 same-sized
// children auto-placed left-to-right land at x = 0, 100, 200, 300, 400.
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

extern "C" fn measure_100x10(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(100.0, 10.0)
}

#[test]
fn grid_repeat_five_columns_positions() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Grid);
        s.set_size(Size {
            width: Dimension::length(500.0),
            height: Dimension::auto(),
        });
        s.set_grid_template_columns_css("repeat(5, 100px)");
    });

    let mut ids = vec![];
    for _ in 0..5 {
        let n = mason.create_node();
        let id = n.id();
        mason.set_measure(id, Some(measure_100x10), std::ptr::null_mut());
        mason.append_node(rid, &[id]);
        ids.push(id);
    }

    mason.compute_wh(rid, 500.0, f32::NAN);

    for (i, id) in ids.iter().enumerate() {
        let l = mason.layout_raw(*id);
        let expected_x = (i as f32) * 100.0;
        println!("child {i}: x={}, y={}, w={}, h={}", l.location.x, l.location.y, l.size.width, l.size.height);
        assert!(
            (l.location.x - expected_x).abs() < 1.0,
            "child {i}: expected x≈{expected_x}, got {}",
            l.location.x
        );
    }
}
