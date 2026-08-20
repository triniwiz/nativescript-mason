use mason_core::style::DisplayMode;
use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::Display;
use taffy::style::{Dimension, LengthPercentage};

// Ensure inline root containers are not treated like block roots for
// content-box percent resolution — we should leave inline-root behavior unchanged.

#[test]
fn inline_root_child_percent_resolves_to_outer_width() {
    let mut mason = Mason::new();

    // root container with fixed outer width 300 and horizontal padding 20
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        // Use a block display but force the display mode to Inline so the
        // root is treated as an inline-flow root for this test.
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(300.0),
            height: taffy::style::Dimension::auto(),
        });
        s.set_padding(Rect {
            left: LengthPercentage::length(20.0),
            right: LengthPercentage::length(20.0),
            top: LengthPercentage::length(0.0),
            bottom: LengthPercentage::length(0.0),
        });
    });

    // child with 100% width
    let child = mason.create_node();
    let cid = child.id();
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: Dimension::percent(1.0),
            height: Dimension::auto(),
        });
    });

    mason.append_node(rid, &[cid]);

    // compute layout for root with given width (300)
    mason.compute_wh(rid, 300.0, f32::NAN);

    let child_layout = mason.layout_raw(cid);

    // For inline-root we expect child percent to resolve against outer width (300)
    let expected = 300.0;
    assert!(
        (child_layout.size.width - expected).abs() < 0.01,
        "inline-root child width expected {} got {}",
        expected,
        child_layout.size.width
    );
}
