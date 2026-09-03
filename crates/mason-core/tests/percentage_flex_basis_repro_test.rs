use mason_core::*;

// Reproduces WebSpec's `percentage_flex_basis*` cluster (8 fixtures) — all
// have a flex container with a DEFINITE main size and children whose
// flex-basis/min/max are percentages. Purpose: determine whether this is a
// mason-core/taffy bug (percentage resolution against a definite parent) or
// an Android-layer measure latch, before digging further.

// NodeRef::drop garbage-collects a node with no parent and no children (see
// flexbasis_repro_test.rs), so the root's NodeRef must be kept alive for the
// lifetime of the test — returning only its Id (and dropping the NodeRef at
// the end of this helper) silently deletes the root out from under the tree.
fn root(width: f32, height: f32, direction: FlexDirection) -> (Mason, NodeRef, Id) {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(direction);
        s.set_size(Size {
            width: Dimension::length(width),
            height: Dimension::length(height),
        });
    });
    (mason, root, root_id)
}

fn assert_layout(mason: &Mason, id: Id, label: &str, x: f32, y: f32, w: f32, h: f32) {
    let l = mason.layout_raw(id);
    assert!(
        (l.location.x - x).abs() < 0.5
            && (l.location.y - y).abs() < 0.5
            && (l.size.width - w).abs() < 0.5
            && (l.size.height - h).abs() < 0.5,
        "{label}: expected x={x} y={y} w={w} h={h}, got x={} y={} w={} h={}",
        l.location.x,
        l.location.y,
        l.size.width,
        l.size.height
    );
}

#[test]
fn percentage_flex_basis() {
    let (mut mason, _root, root_id) = root(200.0, 200.0, FlexDirection::Row);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.5));
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.25));
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 200.0);

    assert_layout(&mason, root_id, "root", 0.0, 0.0, 200.0, 200.0);
    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 125.0, 200.0);
    assert_layout(&mason, c2_id, "c2", 125.0, 0.0, 75.0, 200.0);
}

#[test]
fn percentage_flex_basis_cross() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Column);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.5));
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.25));
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 200.0, 250.0);
    assert_layout(&mason, c2_id, "c2", 0.0, 250.0, 200.0, 150.0);
}

#[test]
fn percentage_flex_basis_cross_max_height() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Column);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::percent(0.6),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(4.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::percent(0.2),
        });
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 200.0, 240.0);
    assert_layout(&mason, c2_id, "c2", 0.0, 240.0, 200.0, 80.0);
}

#[test]
fn percentage_flex_basis_cross_max_width() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Column);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_max_size(Size {
            width: Dimension::percent(0.6),
            height: Dimension::auto(),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(4.0);
        s.set_flex_basis(Dimension::percent(0.15));
        s.set_max_size(Size {
            width: Dimension::percent(0.2),
            height: Dimension::auto(),
        });
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 120.0, 100.0);
    assert_layout(&mason, c2_id, "c2", 0.0, 100.0, 40.0, 300.0);
}

#[test]
fn percentage_flex_basis_cross_min_height() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Column);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_min_size(Size {
            width: Dimension::auto(),
            height: Dimension::percent(0.6),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(2.0);
        s.set_min_size(Size {
            width: Dimension::auto(),
            height: Dimension::percent(0.1),
        });
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 200.0, 240.0);
    assert_layout(&mason, c2_id, "c2", 0.0, 240.0, 200.0, 160.0);
}

#[test]
fn percentage_flex_basis_cross_min_width() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Column);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_min_size(Size {
            width: Dimension::percent(0.6),
            height: Dimension::auto(),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(4.0);
        s.set_flex_basis(Dimension::percent(0.15));
        s.set_min_size(Size {
            width: Dimension::percent(0.2),
            height: Dimension::auto(),
        });
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 200.0, 100.0);
    assert_layout(&mason, c2_id, "c2", 0.0, 100.0, 200.0, 300.0);
}

#[test]
fn percentage_flex_basis_main_max_height() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Row);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::percent(0.6),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(4.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_max_size(Size {
            width: Dimension::auto(),
            height: Dimension::percent(0.2),
        });
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 52.0, 240.0);
    assert_layout(&mason, c2_id, "c2", 52.0, 0.0, 148.0, 80.0);
}

#[test]
fn percentage_flex_basis_main_max_width() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Row);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.15));
        s.set_max_size(Size {
            width: Dimension::percent(0.6),
            height: Dimension::auto(),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(4.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_max_size(Size {
            width: Dimension::percent(0.2),
            height: Dimension::auto(),
        });
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 120.0, 400.0);
    assert_layout(&mason, c2_id, "c2", 120.0, 0.0, 40.0, 400.0);
}

#[test]
fn percentage_flex_basis_main_min_width() {
    let (mut mason, _root, root_id) = root(200.0, 400.0, FlexDirection::Row);
    let c1 = mason.create_node();
    let c1_id = c1.id();
    mason.with_style_mut(c1_id, |s| {
        s.set_flex_grow(1.0);
        s.set_flex_basis(Dimension::percent(0.15));
        s.set_min_size(Size {
            width: Dimension::percent(0.6),
            height: Dimension::auto(),
        });
    });
    let c2 = mason.create_node();
    let c2_id = c2.id();
    mason.with_style_mut(c2_id, |s| {
        s.set_flex_grow(4.0);
        s.set_flex_basis(Dimension::percent(0.1));
        s.set_min_size(Size {
            width: Dimension::percent(0.2),
            height: Dimension::auto(),
        });
    });
    mason.append_node(root_id, &[c1_id, c2_id]);
    mason.compute_wh(root_id, 200.0, 400.0);

    assert_layout(&mason, c1_id, "c1", 0.0, 0.0, 120.0, 400.0);
    assert_layout(&mason, c2_id, "c2", 120.0, 0.0, 80.0, 400.0);
}
