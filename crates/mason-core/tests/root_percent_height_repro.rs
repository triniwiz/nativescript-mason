use mason_core::*;
use taffy::geometry::Size;
use taffy::style::{Dimension, Display};

/// A `display: block` root with `width: auto; height: 100%`, computed against
/// the definite box the host hands it. The root must take the available
/// space (auto width stretch-fits, 100% height resolves against it) rather
/// than sizing to its content.
#[test]
fn block_root_percent_height_resolves_against_available_space() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::percent(1.0),
        });
    });

    // A child far bigger than the box, so content sizing is distinguishable.
    let child = mason.create_node();
    let cid = child.id();
    mason.with_style_mut(cid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(3000.0),
            height: Dimension::length(5000.0),
        });
    });
    mason.append_node(rid, &[cid]);

    mason.compute_wh(rid, 1206.0, 2334.0);

    let root_layout = mason.layout_raw(rid);
    println!("root -> {:?}", root_layout.size);
    assert!(
        (root_layout.size.width - 1206.0).abs() < 0.01,
        "root width expected 1206 got {}",
        root_layout.size.width
    );
    assert!(
        (root_layout.size.height - 2334.0).abs() < 0.01,
        "root height expected 2334 got {}",
        root_layout.size.height
    );
}
