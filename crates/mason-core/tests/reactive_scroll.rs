use mason_core::*;

fn sized(mason: &mut Mason, node: Id, width: f32, height: f32) {
    mason.with_style_mut(node, |s| {
        s.set_size(Size {
            width: Dimension::length(width),
            height: Dimension::length(height),
        });
        s.set_flex_shrink(0.0);
    });
}

fn scroll_fixture(display: Display, child_size: (f32, f32)) -> (Mason, NodeRef, NodeRef) {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let child = mason.create_node();
    sized(&mut mason, root.id(), 100.0, 60.0);
    mason.with_style_mut(root.id(), |s| {
        s.set_display(display);
        s.set_flex_direction(FlexDirection::Column);
        s.set_overflow(Point {
            x: style::Overflow::Scroll,
            y: style::Overflow::Scroll,
        });
    });
    sized(&mut mason, child.id(), child_size.0, child_size.1);
    mason.append(root.id(), child.id());
    (mason, root, child)
}

fn rect(mason: &Mason, node: Id) -> [f32; 4] {
    let l = mason.layout_raw(node);
    [
        l.size.width,
        l.size.height,
        l.scrollable_overflow_rect.right,
        l.scrollable_overflow_rect.bottom,
    ]
}

fn equal(actual: [f32; 4], expected: [f32; 4]) {
    for (a, e) in actual.into_iter().zip(expected) {
        assert!(
            (a - e).abs() < 0.01,
            "expected {expected:?}, got {actual:?}"
        );
    }
}

fn content_size_round_trip(display: Display) {
    let (mut mason, root, child) = scroll_fixture(display, (300.0, 200.0));
    for size in [(300.0, 200.0), (40.0, 20.0), (500.0, 400.0), (300.0, 200.0)] {
        sized(&mut mason, child.id(), size.0, size.1);
        let (mut fresh, fresh_root, _child) = scroll_fixture(display, size);
        fresh.compute(fresh_root.id());
        for _ in 0..2 {
            mason.compute(root.id());
            equal(rect(&mason, root.id()), rect(&fresh, fresh_root.id()));
            equal(rect(&mason, root.id()), [100.0, 60.0, size.0, size.1]);
        }
    }
}

#[test]
fn flex_scroll_extents_grow_and_shrink_with_content() {
    content_size_round_trip(Display::Flex);
}

#[test]
fn block_scroll_extents_grow_and_shrink_with_content() {
    content_size_round_trip(Display::Block);
}

#[test]
fn hiding_and_removing_scroll_content_contracts_the_overflow_rect() {
    let (mut mason, root, child) = scroll_fixture(Display::Flex, (300.0, 200.0));
    mason.compute(root.id());
    equal(rect(&mason, root.id()), [100.0, 60.0, 300.0, 200.0]);
    mason.with_style_mut(child.id(), |s| s.set_display(Display::None));
    mason.compute(root.id());
    equal(rect(&mason, root.id()), [100.0, 60.0, 0.0, 0.0]);
    mason.with_style_mut(child.id(), |s| s.set_display(Display::Block));
    mason.compute(root.id());
    equal(rect(&mason, root.id()), [100.0, 60.0, 300.0, 200.0]);
    mason.remove_child(root.id(), child.id());
    for _ in 0..2 {
        mason.compute(root.id());
        equal(rect(&mason, root.id()), [100.0, 60.0, 100.0, 60.0]);
    }
}
