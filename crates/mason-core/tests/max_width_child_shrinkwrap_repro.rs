use mason_core::*;

// Reproduces `max_width_overrides_width` (non-"_on_root" variant) from the
// WebSpec conformance suite: the fixture ROOT itself carries no explicit
// size — it's a `display:flex` container that should shrink-wrap around its
// single child. The CHILD carries width:200/max-width:100 and, per real
// Chromium (the `expected` rect this fixture was captured from), both the
// child AND the shrink-wrapping root end up 100 wide.
//
// FIXED (was a confirmed upstream taffy bug): `determine_container_main_size()`
// in taffy's `compute/flexbox.rs`, in the branch that handles a *definite*
// (but not-yet-final) available main-axis space — which is exactly what an
// absolutely-positioned, no-inset, shrink-to-fit container gets handed as
// its "upper bound" — computed each item's contribution from `flex_basis`
// and `min_size` only; `max_size` never entered the computation, unlike the
// sibling `AvailableSpace::MinContent | AvailableSpace::MaxContent` branch,
// which already folded it in via `maybe_clamp(style_min, style_max)`.
//
// Not fixable in mason-core: mason-core delegates straight to taffy's own
// `compute_flexbox_layout` (see `Tree::compute_block_child_layout` in
// `crates/mason-core/src/tree.rs`) with no clamping logic of its own in this
// path. Patched upstream in our fork (triniwiz/taffy, branch `mason-fixes`,
// commit c9728ea, based on DioxusLabs/taffy@520ff53) by adding a max_size
// clamp to `item_main_length`, applied BEFORE the min_size clamp so a
// conflicting min>max case still resolves in min's favor (see the sibling
// `min_width_overrides_max_width_repro.rs` regression test); mason's
// `Cargo.toml` now pins `taffy` to that fork/rev. See
// mason-taffy-max-size-shrinkwrap memory.
#[test]
fn shrinkwrap_root_uses_child_clamped_width_not_preferred_width() {
    let mut mason = Mason::new();

    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_position(Position::Absolute);
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });

    // Fixture root: WebSpec's FIXTURE_DEFAULTS (display:flex, border-box)
    // plus position:absolute forced onto roots — no explicit width/height,
    // so it should shrink-wrap its single child.
    let fixture_root = mason.create_node();
    let fixture_root_id = fixture_root.id();
    mason.with_style_mut(fixture_root_id, |s| {
        s.set_position(Position::Absolute);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
    });

    // Child: WebSpec's FIXTURE_DEFAULTS for a non-root node (display:flex,
    // border-box, position:relative) plus the fixture's own declared style.
    let child = mason.create_node();
    let child_id = child.id();
    mason.with_style_mut(child_id, |s| {
        s.set_position(Position::Relative);
        s.set_display(Display::Flex);
        s.set_box_sizing(BoxSizing::BorderBox);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
    });

    mason.append_node(stage_id, &[fixture_root_id]);
    mason.append_node(fixture_root_id, &[child_id]);

    mason.compute_wh(stage_id, 1280.0, 2688.0);

    let root_l = mason.layout_raw(fixture_root_id);
    let child_l = mason.layout_raw(child_id);
    println!(
        "fixture_root width={} height={} | child width={} height={}",
        root_l.size.width, root_l.size.height, child_l.size.width, child_l.size.height
    );

    assert!(
        (child_l.size.width - 100.0).abs() < 0.5,
        "expected child clamped width 100, got {}",
        child_l.size.width
    );
    assert!(
        (root_l.size.width - 100.0).abs() < 0.5,
        "expected shrink-wrapping root width 100 (matching its clamped child), got {}",
        root_l.size.width
    );
}
