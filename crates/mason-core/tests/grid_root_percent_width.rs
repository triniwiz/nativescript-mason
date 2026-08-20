use mason_core::*;
use taffy::geometry::Rect;
use taffy::style::{Dimension, LengthPercentage};

// Ensure grid root containers resolve child percentage widths against
// the parent's content-box when appropriate.

#[test]
fn grid_root_child_percent_resolves_to_content_box() {
    let mut mason = Mason::new();

    // root grid container with fixed outer width 300 and horizontal padding 20
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Grid);
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

    // child with 100% width placed as grid item
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
        "grid-root child width should resolve to parent content box: got {} expected {}",
        child_layout.size.width,
        expected
    );
}

#[test]
fn grid_root_grandchild_percent_resolves_to_content_box() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(taffy::style::Display::Grid);
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

    let child = mason.create_node();
    let cid = child.id();
    mason.with_style_mut(cid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: Dimension::percent(1.0),
            height: Dimension::auto(),
        });
    });

    let grandchild = mason.create_node();
    let gid = grandchild.id();
    mason.with_style_mut(gid, |s| {
        s.set_display(taffy::style::Display::Block);
        s.set_size(taffy::geometry::Size {
            width: Dimension::percent(0.5),
            height: Dimension::auto(),
        });
    });

    mason.append_node(cid, &[gid]);
    mason.append_node(rid, &[cid]);

    mason.compute_wh(rid, 300.0, f32::NAN);

    let child_layout = mason.layout_raw(cid);
    let grandchild_layout = mason.layout_raw(gid);

    let root_content = 300.0 - 20.0 - 20.0;
    assert!(
        (child_layout.size.width - root_content).abs() < 0.01,
        "child should be root content width"
    );
    assert!(
        (grandchild_layout.size.width - (root_content * 0.5)).abs() < 0.01,
        "grandchild should be half of root content width after propagation"
    );
}
