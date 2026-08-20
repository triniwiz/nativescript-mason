use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::{Dimension, LengthPercentage};

// Ensure scroll/auto overflow root containers still resolve child percentage
// widths against the parent's content-box.

#[test]
fn scroll_root_child_percent_resolves_to_content_box() {
    let mut mason = Mason::new();

    // root container with fixed outer width 300, horizontal padding 20, overflow auto
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
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
        s.set_overflow(mason_core::Point {
            x: mason_core::style::Overflow::Visible,
            y: mason_core::style::Overflow::Auto,
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

    // expected child width = parent content width = 300 - 20 - 20 = 260
    let expected = 300.0 - 20.0 - 20.0;
    assert!(
        (child_layout.size.width - expected).abs() < 0.01,
        "scroll-root child width should resolve to parent content box: got {} expected {}",
        child_layout.size.width,
        expected
    );
}
