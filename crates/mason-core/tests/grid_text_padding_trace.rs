use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::{Dimension, Display, LengthPercentage};

// Trace what available width the text measure function receives when a text container
// with padding is a grid item inside a grid with "100px auto" columns,
// and the grid's parent has padding.

use std::sync::atomic::{AtomicU32, Ordering};
static MEASURE_CALL_COUNT: AtomicU32 = AtomicU32::new(0);

extern "C" fn text_measure_trace(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    avail_w: std::ffi::c_float,
    avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    let call_num = MEASURE_CALL_COUNT.fetch_add(1, Ordering::Relaxed);
    eprintln!(
        "  MEASURE[{}]: known=({}, {}), avail=({}, {})",
        call_num, known_w, known_h, avail_w, avail_h
    );
    // Simulate text that needs ~200px naturally, wraps if narrower
    let natural_w = 200.0_f32;
    let line_h = 20.0_f32;
    let w = if known_w > 0.0 {
        known_w
    } else if avail_w > 0.0 && avail_w < f32::INFINITY {
        avail_w.min(natural_w)
    } else {
        natural_w
    };
    let lines = (natural_w / w).ceil().max(1.0);
    let h = if known_h > 0.0 {
        known_h
    } else {
        lines * line_h
    };
    MeasureOutput::make(w, h)
}

#[test]
fn grid_text_item_with_padding_receives_correct_available_width() {
    let mut mason = Mason::new();

    // Parent with 40px horizontal padding
    let parent = mason.create_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(Display::Block);
        s.set_padding(Rect {
            left: LengthPercentage::length(40.0),
            right: LengthPercentage::length(40.0),
            top: LengthPercentage::length(0.0),
            bottom: LengthPercentage::length(0.0),
        });
    });

    // Grid with "100px auto" columns
    let grid = mason.create_node();
    let gid = grid.id();
    mason.with_style_mut(gid, |s| {
        s.set_display(Display::Grid);
        s.set_grid_template_columns_css("100px auto");
        s.set_gap(taffy::geometry::Size {
            width: LengthPercentage::length(8.0),
            height: LengthPercentage::length(0.0),
        });
    });

    // Left item (100px column) - simple node
    let left = mason.create_node();
    let lid = left.id();
    mason.with_style_mut(lid, |s| {
        s.set_display(Display::Block);
    });

    // Right item (auto column) - text container with 10px padding
    let right = mason.create_text_node();
    let rid_right = right.id();
    mason.with_style_mut(rid_right, |s| {
        s.set_display(Display::Block);
        s.set_padding(Rect {
            left: LengthPercentage::length(10.0),
            right: LengthPercentage::length(10.0),
            top: LengthPercentage::length(10.0),
            bottom: LengthPercentage::length(10.0),
        });
    });
    mason.set_measure(rid_right, Some(text_measure_trace), std::ptr::null_mut());

    mason.append_node(gid, &[lid, rid_right]);
    mason.append_node(pid, &[gid]);

    MEASURE_CALL_COUNT.store(0, Ordering::Relaxed);
    eprintln!("\n=== Computing layout with parent width 1000 ===");
    mason.compute_wh(pid, 1000.0, f32::NAN);

    let parent_layout = mason.layout_raw(pid);
    let grid_layout = mason.layout_raw(gid);
    let left_layout = mason.layout_raw(lid);
    let right_layout = mason.layout_raw(rid_right);

    eprintln!(
        "parent: size={:?} padding={:?}",
        parent_layout.size, parent_layout.padding
    );
    eprintln!(
        "grid:   size={:?} loc={:?}",
        grid_layout.size, grid_layout.location
    );
    eprintln!(
        "left:   size={:?} loc={:?}",
        left_layout.size, left_layout.location
    );
    eprintln!(
        "right:  size={:?} loc={:?} padding={:?}",
        right_layout.size, right_layout.location, right_layout.padding
    );

    // Parent content box = 1000 - 40 - 40 = 920
    // Grid should be 920 wide
    // Auto column = 920 - 100 - 8 = 812
    // Right item border-box = 812
    // Right item content = 812 - 10 - 10 = 792
    // Text measure should receive avail_w ~= 792

    let parent_content_w = 1000.0 - 40.0 - 40.0;
    assert!(
        (grid_layout.size.width - parent_content_w).abs() < 1.0,
        "grid width {} should be parent content width {}",
        grid_layout.size.width,
        parent_content_w
    );

    let expected_auto_col = parent_content_w - 100.0 - 8.0; // 812
    assert!(
        (right_layout.size.width - expected_auto_col).abs() < 1.0,
        "right item width {} should be auto column width {}",
        right_layout.size.width,
        expected_auto_col
    );

    // Right item should not overflow grid
    let right_edge = right_layout.location.x + right_layout.size.width;
    assert!(
        right_edge <= grid_layout.size.width + 1.0,
        "right edge {} should not exceed grid width {}",
        right_edge,
        grid_layout.size.width
    );
}
