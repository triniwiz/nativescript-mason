use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::{Dimension, LengthPercentage};

// Regression reproducer: ensure percent-width children inside a padded
// topmost/root block resolve against the parent's content-box.

#[test]
fn regress_grid_root_padding_content_box() {
    let mut mason = Mason::new();

    // root container with fixed outer width 1080 and horizontal padding 30
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(1080.0),
            height: taffy::style::Dimension::auto(),
        });
        s.set_padding(Rect {
            left: LengthPercentage::length(30.0),
            right: LengthPercentage::length(30.0),
            top: LengthPercentage::length(0.0),
            bottom: LengthPercentage::length(0.0),
        });
    });

    // child with 50% width should resolve to (1080 - 30 - 30) * 0.5
    let child = mason.create_node();
    let cid = child.id();
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: Dimension::percent(0.5),
            height: Dimension::auto(),
        });
    });

    mason.append_node(rid, &[cid]);

    mason.compute_wh(rid, 1080.0, f32::NAN);

    let child_layout = mason.layout_raw(cid);

    let expected = (1080.0 - 30.0 - 30.0) * 0.5;
    assert!(
        (child_layout.size.width - expected).abs() < 0.1,
        "child width should resolve to parent content box: got {} expected {}",
        child_layout.size.width,
        expected
    );
}
