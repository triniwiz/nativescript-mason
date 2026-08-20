use mason_core::style::DisplayMode;
use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::{Display, LengthPercentage, LengthPercentageAuto};

// This test mirrors the ANDROID structure more closely:
// Text containers are NOT leaf nodes — they have inline children (TextNodes)
// AND a measure function on the container itself.
// The grid should still constrain the auto column properly.

extern "C" fn text_measure_short(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    let natural_w = 141.0_f32;
    let line_h = 59.0_f32;

    // Map sentinel values: -1 = MinContent, -2 = MaxContent
    let w = if known_w > 0.0 {
        known_w
    } else if avail_w == -1.0 {
        // MinContent: longest word
        natural_w.min(80.0) // "Header" is one word, ~80px
    } else if avail_w == -2.0 {
        natural_w
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
    let natural_w = 1272.0_f32;
    let min_content_w = 153.0_f32;
    let line_h = 59.0_f32;

    eprintln!("  content_measure: known_w={} avail_w={}", known_w, avail_w);

    let w = if known_w > 0.0 {
        known_w
    } else if avail_w == -1.0 {
        min_content_w
    } else if avail_w == -2.0 {
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
fn grid_text_container_with_children_no_overflow() {
    let mut mason = Mason::new();

    // Scroll root
    let scroll = mason.create_node();
    let scroll_id = scroll.id();
    mason.with_style_mut(scroll_id, |s| {
        s.set_display(Display::Block);
        s.set_padding(Rect {
            left: LengthPercentage::length(0.0),
            right: LengthPercentage::length(0.0),
            top: LengthPercentage::length(290.0),
            bottom: LengthPercentage::length(132.0),
        });
    });

    // Body with margin
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

    // Grid
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

    // Create text containers WITH children (like Android)
    // Each text container is a "text node" with inline children

    // Header: text container with an inline child
    let header = mason.create_text_node();
    let header_id = header.id();
    mason.with_style_mut(header_id, |s| {
        s.set_grid_area("header");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(header_id, Some(text_measure_short), std::ptr::null_mut());
    // Add an inline child to make has_children=true
    let header_text = mason.create_node();
    let header_text_id = header_text.id();
    mason.with_style_mut(header_text_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.append_node(header_id, &[header_text_id]);

    // Sidebar
    let sidebar = mason.create_text_node();
    let sidebar_id = sidebar.id();
    mason.with_style_mut(sidebar_id, |s| {
        s.set_grid_area("sidebar");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(sidebar_id, Some(text_measure_short), std::ptr::null_mut());
    let sidebar_text = mason.create_node();
    let sidebar_text_id = sidebar_text.id();
    mason.with_style_mut(sidebar_text_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.append_node(sidebar_id, &[sidebar_text_id]);

    // Content: text container with children (the problematic one)
    let content = mason.create_text_node();
    let content_id = content.id();
    mason.with_style_mut(content_id, |s| {
        s.set_grid_area("content");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(content_id, Some(text_measure_content), std::ptr::null_mut());
    // Add inline children + line break (like Android: "Content" + br + "More content...")
    let content_text1 = mason.create_node();
    let content_text1_id = content_text1.id();
    mason.with_style_mut(content_text1_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    let content_br = mason.create_line_break_node();
    let content_br_id = content_br.id();
    let content_text2 = mason.create_node();
    let content_text2_id = content_text2.id();
    mason.with_style_mut(content_text2_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.append_node(
        content_id,
        &[content_text1_id, content_br_id, content_text2_id],
    );

    // Sidebar2
    let sidebar2 = mason.create_text_node();
    let sidebar2_id = sidebar2.id();
    mason.with_style_mut(sidebar2_id, |s| {
        s.set_grid_area("sidebar2");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(sidebar2_id, Some(text_measure_short), std::ptr::null_mut());
    let sidebar2_text = mason.create_node();
    let sidebar2_text_id = sidebar2_text.id();
    mason.with_style_mut(sidebar2_text_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.append_node(sidebar2_id, &[sidebar2_text_id]);

    // Footer
    let footer = mason.create_text_node();
    let footer_id = footer.id();
    mason.with_style_mut(footer_id, |s| {
        s.set_grid_area("footer");
        s.set_padding(box_padding.clone());
    });
    mason.set_measure(footer_id, Some(text_measure_short), std::ptr::null_mut());
    let footer_text = mason.create_node();
    let footer_text_id = footer_text.id();
    mason.with_style_mut(footer_text_id, |s| {
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.append_node(footer_id, &[footer_text_id]);

    // Build tree
    mason.append_node(
        grid_id,
        &[header_id, sidebar_id, sidebar2_id, content_id, footer_id],
    );
    mason.append_node(body_id, &[grid_id]);
    mason.append_node(scroll_id, &[body_id]);

    // Compute
    mason.compute_wh(scroll_id, 1080.0, f32::NAN);

    let grid_layout = mason.layout_raw(grid_id);
    let content_layout = mason.layout_raw(content_id);
    let header_layout = mason.layout_raw(header_id);

    eprintln!("grid:    size={:?}", grid_layout.size);
    eprintln!(
        "header:  size={:?} loc={:?}",
        header_layout.size, header_layout.location
    );
    eprintln!(
        "content: size={:?} loc={:?}",
        content_layout.size, content_layout.location
    );

    let expected_body_w = 1080.0 - 80.0;
    let expected_auto_col = expected_body_w - 275.0 - 8.0;

    assert!(
        (grid_layout.size.width - expected_body_w).abs() < 1.0,
        "grid width {} should be {}",
        grid_layout.size.width,
        expected_body_w
    );

    assert!(
        content_layout.size.width <= expected_auto_col + 1.0,
        "content width {} should be <= auto column {} (not overflowing!)",
        content_layout.size.width,
        expected_auto_col
    );

    assert!(
        header_layout.size.width <= grid_layout.size.width + 1.0,
        "header width {} should be <= grid width {}",
        header_layout.size.width,
        grid_layout.size.width
    );
}
