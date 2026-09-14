//! `flex-grow` factors summing to less than 1.
//!
//! CSS distributes only that *fraction* of the free space, and the free space is
//! measured after each item's flex base size — so a `flex-basis` on one item has
//! to be subtracted first. Chromium lays the case below out as 132 / 92 / 184;
//! the WebSpec fixture `flex_grow_less_than_factor_one` is exactly this.

use mason_core::*;

#[test]
fn free_space_is_measured_after_flex_basis() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(500.0),
            height: Dimension::length(200.0),
        });
    });

    let a = mason.create_node();
    let aid = a.id();
    let b = mason.create_node();
    let bid = b.id();
    let c = mason.create_node();
    let cid = c.id();
    mason.append_node(rid, &[aid, bid, cid]);

    mason.with_style_mut(aid, |s| {
        s.set_flex_grow(0.2);
        s.set_flex_shrink(0.0);
        s.set_flex_basis(Dimension::length(40.0));
    });
    mason.with_style_mut(bid, |s| {
        s.set_flex_grow(0.2);
        s.set_flex_shrink(0.0);
    });
    mason.with_style_mut(cid, |s| {
        s.set_flex_grow(0.4);
        s.set_flex_shrink(0.0);
    });

    mason.compute_wh(rid, 500.0, 200.0);

    // free space = 500 - 40 = 460; factors sum to 0.8, so 0.8 * 460 is handed out
    // in 0.2 : 0.2 : 0.4 proportions -> 92 / 92 / 184, and the first item keeps
    // its 40px base on top.
    let (wa, wb, wc) = (
        mason.layout_raw(aid).size.width,
        mason.layout_raw(bid).size.width,
        mason.layout_raw(cid).size.width,
    );
    assert!((wa - 132.0).abs() < 0.5, "item with flex-basis: 40px — expected 132, got {wa}");
    assert!((wb - 92.0).abs() < 0.5, "item with no basis — expected 92, got {wb}");
    assert!((wc - 184.0).abs() < 0.5, "item with double the factor — expected 184, got {wc}");
}
