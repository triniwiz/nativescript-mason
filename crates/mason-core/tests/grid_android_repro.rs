use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::{Dimension, Display, LengthPercentage, LengthPercentageAuto};

// Reproduce the Android grid_template_areas_500 layout exactly:
// Scroll(vertical padding) → body(40px margin) → grid("275px auto", 8px gap) → text containers with children

extern "C" fn text_measure_short(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    // Simulate short text like "Header", "Sidebar", "Footer"
    let natural_w = 141.0_f32; // "Header" measured width on Android
    let line_h = 59.0_f32;
    let w = if known_w > 0.0 {
        known_w
    } else if avail_w > 0.0 && avail_w < f32::INFINITY {
        avail_w.min(natural_w)
    } else {
        natural_w
    };
    let h = if known_h > 0.0 { known_h } else { line_h };
    MeasureOutput::make(w, h)
}

extern "C" fn text_measure_content(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    // Simulate "Content\nMore content than we had before so this column is now quite tall."
    // natural width ~1272px on Android, wraps when constrained
    // min-content (longest word) ~ 153px
    let natural_w = 1272.0_f32;
    let min_content_w = 153.0_f32;
    let line_h = 59.0_f32;

    let w = if known_w > 0.0 {
        known_w
    } else if avail_w == -1.0 {
        // MinContent: return longest word width
        min_content_w
    } else if avail_w == -2.0 {
        // MaxContent: return natural text width
        natural_w
    } else if avail_w > 0.0 && avail_w < f32::INFINITY {
        avail_w.min(natural_w)
    } else {
        natural_w
    };

    let content_lines = (natural_w / w.max(1.0)).ceil().max(1.0);
    let h = if known_h > 0.0 {
        known_h
    } else {
        content_lines * line_h
    };
    MeasureOutput::make(w, h)
}

#[test]
fn grid_android_repro_no_overflow() {
    let mut mason = Mason::new();

    // Scroll root: full width 1080, with system bar padding (vertical only)
    let scroll = mason.create_node();
    let scroll_id = scroll.id();
    mason.with_style_mut(scroll_id, |s| {
        s.set_display(Display::Block);
        // System bar padding: top=290, bottom=132, left=0, right=0
        s.set_padding(Rect {
            left: LengthPercentage::length(0.0),
            right: LengthPercentage::length(0.0),
            top: LengthPercentage::length(290.0),
            bottom: LengthPercentage::length(132.0),
        });
    });

    // Body with 40px uniform margin
    let body = mason.create_node();
    let body_id = body.id();
    mason.with_style_mut(body_id, |s| {
        s.set_display(Display::Block);
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(40.0),
            right: LengthPercentageAuto::length(40.0),
            top: LengthPercentageAuto::length(40.0),
            bottom: LengthPercentageAuto::length(40.0),
        });
    });

    // Grid with "275px auto" columns and 8px gap
    let grid = mason.create_node();
    let grid_id = grid.id();
    mason.with_style_mut(grid_id, |s| {
        s.set_display(Display::Grid);
        s.set_grid_template_areas_css(
            "\"header header\"\n\"sidebar content\"\n\"sidebar2 sidebar2\"\n\"footer footer\"",
        );
        s.set_grid_template_columns_css("275px auto");
        s.set_gap(taffy::geometry::Size {
            width: LengthPercentage::length(8.0),
            height: LengthPercentage::length(8.0),
        });
    });

    let box_padding = Rect {
        left: LengthPercentage::length(10.0),
        right: LengthPercentage::length(10.0),
        top: LengthPercentage::length(10.0),
        bottom: LengthPercentage::length(10.0),
    };

    // Header (text container with short text)
    let header = mason.create_text_node();
    let header_id = header.id();
    mason.with_style_mut(header_id, |s| {
        s.set_grid_area("header");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(header_id, Some(text_measure_short), std::ptr::null_mut());

    // Sidebar
    let sidebar = mason.create_text_node();
    let sidebar_id = sidebar.id();
    mason.with_style_mut(sidebar_id, |s| {
        s.set_grid_area("sidebar");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(sidebar_id, Some(text_measure_short), std::ptr::null_mut());

    // Content (text container with long text)
    let content = mason.create_text_node();
    let content_id = content.id();
    mason.with_style_mut(content_id, |s| {
        s.set_grid_area("content");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(content_id, Some(text_measure_content), std::ptr::null_mut());

    // Sidebar2
    let sidebar2 = mason.create_text_node();
    let sidebar2_id = sidebar2.id();
    mason.with_style_mut(sidebar2_id, |s| {
        s.set_grid_area("sidebar2");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(sidebar2_id, Some(text_measure_short), std::ptr::null_mut());

    // Footer
    let footer = mason.create_text_node();
    let footer_id = footer.id();
    mason.with_style_mut(footer_id, |s| {
        s.set_grid_area("footer");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(footer_id, Some(text_measure_short), std::ptr::null_mut());

    // Build tree: scroll → body → grid → items
    mason.append_node(
        grid_id,
        &[header_id, sidebar_id, sidebar2_id, content_id, footer_id],
    );
    mason.append_node(body_id, &[grid_id]);
    mason.append_node(scroll_id, &[body_id]);

    // Compute with screen width 1080
    mason.compute_wh(scroll_id, 1080.0, f32::NAN);

    let scroll_layout = mason.layout_raw(scroll_id);
    let body_layout = mason.layout_raw(body_id);
    let grid_layout = mason.layout_raw(grid_id);
    let header_layout = mason.layout_raw(header_id);
    let sidebar_layout = mason.layout_raw(sidebar_id);
    let content_layout = mason.layout_raw(content_id);
    let footer_layout = mason.layout_raw(footer_id);

    eprintln!(
        "scroll: size={:?} padding={:?}",
        scroll_layout.size, scroll_layout.padding
    );
    eprintln!(
        "body:   size={:?} loc={:?}",
        body_layout.size, body_layout.location
    );
    eprintln!(
        "grid:   size={:?} loc={:?} scrollable_overflow_rect={:?}",
        grid_layout.size, grid_layout.location, grid_layout.scrollable_overflow_rect
    );
    eprintln!(
        "header: size={:?} loc={:?}",
        header_layout.size, header_layout.location
    );
    eprintln!(
        "sidebar:size={:?} loc={:?}",
        sidebar_layout.size, sidebar_layout.location
    );
    eprintln!(
        "content:size={:?} loc={:?}",
        content_layout.size, content_layout.location
    );
    eprintln!(
        "footer: size={:?} loc={:?}",
        footer_layout.size, footer_layout.location
    );

    // Expected:
    // scroll width = 1080, no horizontal padding
    // body width = 1080 - 40 - 40 = 1000
    // grid width = 1000 (stretches to body content width)
    // fixed column = 275, gap = 8, auto column = 1000 - 275 - 8 = 717
    // content item width = 717 (not 1292!)

    let expected_body_w = 1080.0 - 40.0 - 40.0;
    assert!(
        (body_layout.size.width - expected_body_w).abs() < 1.0,
        "body width {} should be {}",
        body_layout.size.width,
        expected_body_w
    );

    assert!(
        (grid_layout.size.width - expected_body_w).abs() < 1.0,
        "grid width {} should be {}",
        grid_layout.size.width,
        expected_body_w
    );

    let expected_auto_col = expected_body_w - 275.0 - 8.0; // 717
    assert!(
        content_layout.size.width <= expected_auto_col + 1.0,
        "content width {} should be <= auto column {} (not overflowing!)",
        content_layout.size.width,
        expected_auto_col
    );

    // Header spans 2 columns: should be <= grid width
    assert!(
        header_layout.size.width <= grid_layout.size.width + 1.0,
        "header width {} should be <= grid width {}",
        header_layout.size.width,
        grid_layout.size.width
    );

    // No item should overflow the grid
    let content_right = content_layout.location.x + content_layout.size.width;
    assert!(
        content_right <= grid_layout.size.width + 1.0,
        "content right edge {} should not exceed grid width {}",
        content_right,
        grid_layout.size.width
    );
}
