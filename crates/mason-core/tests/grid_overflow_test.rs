use mason_core::style::DisplayMode;
use mason_core::*;
use taffy::geometry::{Rect, Size};
use taffy::style::{Dimension, Display, LengthPercentage};

// Mimic grid_template_areas_500: Scroll(padding) → body → grid(gap, template) → items(padding+text)
// The grid children should NOT overflow the grid bounds.

extern "C" fn text_measure_content(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    // Simulate "More content than we had before so this column is now quite tall."
    // Natural width ~500px, wraps to multiple lines when constrained
    let natural_w = 500.0_f32;
    let line_h = 18.0_f32;
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

extern "C" fn text_measure_short(
    _data: *const std::ffi::c_void,
    known_w: std::ffi::c_float,
    known_h: std::ffi::c_float,
    avail_w: std::ffi::c_float,
    _avail_h: std::ffi::c_float,
) -> std::ffi::c_longlong {
    let natural_w = 60.0_f32;
    let line_h = 18.0_f32;
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

#[test]
fn grid_areas_children_do_not_overflow() {
    let mut mason = Mason::new();

    // Scroll root: full width 1080, with system bar padding (top=100, bottom=80)
    let scroll = mason.create_node();
    let scroll_id = scroll.id();
    mason.with_style_mut(scroll_id, |s| {
        s.set_display(Display::Block);
        s.set_size(taffy::geometry::Size {
            width: Dimension::auto(),
            height: Dimension::auto(),
        });
        // System bar padding: top=100, bottom=80, left=0, right=0
        s.set_padding(Rect {
            left: LengthPercentage::length(0.0),
            right: LengthPercentage::length(0.0),
            top: LengthPercentage::length(100.0),
            bottom: LengthPercentage::length(80.0),
        });
    });

    // Body wrapper (no explicit sizing)
    let body = mason.create_node();
    let body_id = body.id();
    mason.with_style_mut(body_id, |s| {
        s.set_display(Display::Block);
    });

    // Grid root
    let grid = mason.create_node();
    let grid_id = grid.id();
    mason.with_style_mut(grid_id, |s| {
        s.set_display(Display::Grid);
        s.set_grid_template_areas_css(
            "header header\nsidebar content\nsidebar2 sidebar2\nfooter footer",
        );
        s.set_grid_template_columns_css("100px auto");
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

    // Build tree
    mason.append_node(
        grid_id,
        &[header_id, sidebar_id, content_id, sidebar2_id, footer_id],
    );
    mason.append_node(body_id, &[grid_id]);
    mason.append_node(scroll_id, &[body_id]);

    // Compute with screen width 1080
    mason.compute_wh(scroll_id, 1080.0, f32::NAN);

    let scroll_layout = mason.layout_raw(scroll_id);
    let body_layout = mason.layout_raw(body_id);
    let grid_layout = mason.layout_raw(grid_id);
    let header_layout = mason.layout_raw(header_id);
    let content_layout = mason.layout_raw(content_id);
    let sidebar_layout = mason.layout_raw(sidebar_id);

    eprintln!(
        "scroll: size={:?} padding={:?}",
        scroll_layout.size, scroll_layout.padding
    );
    eprintln!(
        "body:   size={:?} loc={:?}",
        body_layout.size, body_layout.location
    );
    eprintln!(
        "grid:   size={:?} loc={:?}",
        grid_layout.size, grid_layout.location
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

    // Grid should not exceed scroll's content box width
    let scroll_content_w =
        scroll_layout.size.width - scroll_layout.padding.left - scroll_layout.padding.right;
    assert!(
        grid_layout.size.width <= scroll_content_w + 1.0,
        "grid width {} should not exceed scroll content width {}",
        grid_layout.size.width,
        scroll_content_w
    );

    // Content cell should not extend past the grid's right edge
    let content_right = content_layout.location.x + content_layout.size.width;
    assert!(
        content_right <= grid_layout.size.width + 1.0,
        "content right edge {} should not exceed grid width {}",
        content_right,
        grid_layout.size.width
    );

    // Header should span full grid width (2 columns)
    assert!(
        header_layout.size.width <= grid_layout.size.width + 1.0,
        "header width {} should not exceed grid width {}",
        header_layout.size.width,
        grid_layout.size.width
    );
}

// Same test but with horizontal padding on scroll root
#[test]
fn grid_areas_with_horizontal_padding() {
    let mut mason = Mason::new();

    let scroll = mason.create_node();
    let scroll_id = scroll.id();
    mason.with_style_mut(scroll_id, |s| {
        s.set_display(Display::Block);
        // Horizontal padding like system bars on landscape or edge-to-edge
        s.set_padding(Rect {
            left: LengthPercentage::length(40.0),
            right: LengthPercentage::length(40.0),
            top: LengthPercentage::length(100.0),
            bottom: LengthPercentage::length(80.0),
        });
    });

    let body = mason.create_node();
    let body_id = body.id();
    mason.with_style_mut(body_id, |s| {
        s.set_display(Display::Block);
    });

    let grid = mason.create_node();
    let grid_id = grid.id();
    mason.with_style_mut(grid_id, |s| {
        s.set_display(Display::Grid);
        s.set_grid_template_areas_css("header header\nsidebar content\nfooter footer");
        s.set_grid_template_columns_css("100px auto");
        s.set_gap(taffy::geometry::Size {
            width: LengthPercentage::length(8.0),
            height: LengthPercentage::length(8.0),
        });
    });

    let box_pad = Rect {
        left: LengthPercentage::length(10.0),
        right: LengthPercentage::length(10.0),
        top: LengthPercentage::length(10.0),
        bottom: LengthPercentage::length(10.0),
    };

    let header = mason.create_text_node();
    let hid = header.id();
    mason.with_style_mut(hid, |s| {
        s.set_grid_area("header");
        s.set_padding(box_pad.clone());
    });
    mason.set_measure(hid, Some(text_measure_short), std::ptr::null_mut());

    let sidebar = mason.create_text_node();
    let sid = sidebar.id();
    mason.with_style_mut(sid, |s| {
        s.set_grid_area("sidebar");
        s.set_padding(box_pad.clone());
    });
    mason.set_measure(sid, Some(text_measure_short), std::ptr::null_mut());

    let content = mason.create_text_node();
    let cid = content.id();
    mason.with_style_mut(cid, |s| {
        s.set_grid_area("content");
        s.set_padding(box_pad.clone());
    });
    mason.set_measure(cid, Some(text_measure_content), std::ptr::null_mut());

    let footer = mason.create_text_node();
    let fid = footer.id();
    mason.with_style_mut(fid, |s| {
        s.set_grid_area("footer");
        s.set_padding(box_pad.clone());
    });
    mason.set_measure(fid, Some(text_measure_short), std::ptr::null_mut());

    mason.append_node(grid_id, &[hid, sid, cid, fid]);
    mason.append_node(body_id, &[grid_id]);
    mason.append_node(scroll_id, &[body_id]);

    mason.compute_wh(scroll_id, 1080.0, f32::NAN);

    let scroll_layout = mason.layout_raw(scroll_id);
    let body_layout = mason.layout_raw(body_id);
    let grid_layout = mason.layout_raw(grid_id);
    let content_layout = mason.layout_raw(cid);

    eprintln!(
        "scroll: size={:?} padding={:?}",
        scroll_layout.size, scroll_layout.padding
    );
    eprintln!(
        "body:   size={:?} loc={:?}",
        body_layout.size, body_layout.location
    );
    eprintln!(
        "grid:   size={:?} loc={:?}",
        grid_layout.size, grid_layout.location
    );
    eprintln!(
        "content:size={:?} loc={:?}",
        content_layout.size, content_layout.location
    );

    // Scroll content width = 1080 - 40 - 40 = 1000
    let scroll_content_w =
        scroll_layout.size.width - scroll_layout.padding.left - scroll_layout.padding.right;
    assert!(
        (scroll_content_w - 1000.0).abs() < 1.0,
        "scroll content width should be 1000, got {}",
        scroll_content_w
    );

    // Body should fit within scroll content box
    assert!(
        body_layout.size.width <= scroll_content_w + 1.0,
        "body width {} should not exceed scroll content width {}",
        body_layout.size.width,
        scroll_content_w
    );

    // Grid should fit within body
    assert!(
        grid_layout.size.width <= body_layout.size.width + 1.0,
        "grid width {} should not exceed body width {}",
        grid_layout.size.width,
        body_layout.size.width
    );

    // Content should not overflow grid
    let content_right = content_layout.location.x + content_layout.size.width;
    assert!(
        content_right <= grid_layout.size.width + 1.0,
        "content right edge {} should not exceed grid width {}",
        content_right,
        grid_layout.size.width
    );
}
