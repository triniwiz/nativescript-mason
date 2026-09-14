use mason_core::*;

// Reproduces WebSpec's `flex_basis_smaller_than_main_dimen_row`/`_column`
// fixtures (and contributed to `flex_shrink_*`/`flex_grow_within_constrained_*`
// failing too): a flex item with BOTH a definite `flex-basis` and a `width`
// (or `height`, on the cross-cutting axis) set, where flex-basis should win
// on the main axis per the flexbox algorithm (flex-basis, not width/height,
// is the main-axis flex base size).
//
// FIXED: this was NOT a taffy bug — `determine_flex_base_size` correctly
// resolved `child.flex_basis` to the definite flex-basis value (verified by
// instrumenting the vendored taffy fork directly). The bug was in
// mason-core's own leaf-measurement closure (`Tree::compute_child_layout`'s
// `(_, false)` leaf branch in `tree.rs`, passed to taffy's own
// `compute_leaf_layout`): it always fell back to the node's CSS
// width/height when `known_dimensions` was `None`, regardless of
// `inputs.sizing_mode`. Taffy's `SizingMode::ContentSize` is used
// specifically to measure a leaf's *intrinsic content size* while
// "pretending it has no size styles" (see taffy's own `leaf.rs`:
// `SizingMode::ContentSize => { node_size = known_dimensions; node_min_size
// = Size::NONE; node_max_size = Size::NONE }`) — flexbox's "automatic
// minimum size" pass (step 4.5 of the flexbox algorithm) calls back into
// this exact mode to get a flex item's *content*-based minimum, then uses
// it to clamp the flex-basis-derived hypothetical main size. By ignoring
// `sizing_mode` and returning the styled width (50) as if it were the
// measured content size, mason-core fed the automatic-minimum-size clamp a
// bogus min of 50 — clamping `flex_basis` (10) up to 50 and making
// flex-basis (and flex-shrink, which also depends on the same automatic
// minimum) unable to size a childless flex item below its own width/height.
// Fixed by gating the style-size/min/max fallback in that leaf closure on
// `inputs.sizing_mode == SizingMode::InherentSize`, matching taffy's own
// `compute_leaf_layout` semantics. See mason-flexbox-contentsize-leaf-fallback
// memory.
#[test]
fn flex_basis_overrides_width_row() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        // flex-direction: row (default)
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
    });

    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_flex_basis(Dimension::length(10.0));
        s.set_size(Size {
            width: Dimension::length(50.0),
            height: Dimension::length(50.0),
        });
    });
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(root_id, 100.0, 100.0);

    let l = mason.layout_raw(child_id);
    println!("child width={} height={}", l.size.width, l.size.height);
    assert!(
        (l.size.width - 10.0).abs() < 0.5,
        "expected flex-basis(10) to override width(50) on the main axis, got {}",
        l.size.width
    );
}

// Companion case in the cross (column) direction: `flex-direction: column`
// with the same shape reproduces `flex_basis_smaller_than_main_dimen_column`.
#[test]
fn flex_basis_overrides_height_column() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_size(Size {
            width: Dimension::auto(),
            height: Dimension::length(100.0),
        });
    });

    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_flex_basis(Dimension::length(10.0));
        s.set_size(Size {
            width: Dimension::length(50.0),
            height: Dimension::length(50.0),
        });
    });
    mason.append_node(root_id, &[child_id]);
    mason.compute_wh(root_id, 100.0, 100.0);

    let l = mason.layout_raw(child_id);
    println!("child width={} height={}", l.size.width, l.size.height);
    assert!(
        (l.size.height - 10.0).abs() < 0.5,
        "expected flex-basis(10) to override height(50) on the main axis, got {}",
        l.size.height
    );
}

// Reproduces `flex_shrink_flex_grow_row`: two equal-shrink flex items whose
// combined width (500 (each) -> 1000 total) overflows a 500-wide container.
// With flex-shrink:1 on both and no flex-basis override, each should shrink
// to 250. Before the fix, the automatic-minimum-size bug clamped each item's
// hypothetical size to its own styled width (500), which `resolve_flexible_
// lengths`' scaled-shrink-factor math cannot shrink below — so neither item
// shrank at all and both stayed at their full 500 width, overflowing the
// container.
#[test]
fn flex_shrink_distributes_when_items_have_no_content() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(500.0),
            height: Dimension::length(500.0),
        });
    });

    // NodeRef::drop garbage-collects a node with no parent and no children,
    // so each child must be appended before its NodeRef goes out of scope
    // (appending inside the loop, not batched after) — otherwise it's freed
    // as soon as the loop iteration ends.
    let mut children = vec![];
    for _ in 0..2 {
        let child = mason.create_node();
        let child_id = child.id();
        mason.with_style_mut(child_id, |s| {
            s.set_size(Size {
                width: Dimension::length(500.0),
                height: Dimension::length(100.0),
            });
            s.set_flex_grow(0.0);
            s.set_flex_shrink(1.0);
        });
        mason.append_node(root_id, &[child_id]);
        children.push(child_id);
    }
    mason.compute_wh(root_id, 500.0, 500.0);

    for (i, &child_id) in children.iter().enumerate() {
        let l = mason.layout_raw(child_id);
        println!("child[{i}] width={} height={}", l.size.width, l.size.height);
        assert!(
            (l.size.width - 250.0).abs() < 0.5,
            "expected equal-shrink item {i} to shrink to 250, got {}",
            l.size.width
        );
    }
}
