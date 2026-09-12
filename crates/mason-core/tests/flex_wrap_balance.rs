use mason_core::*;

fn leaf_with_width(mason: &mut Mason, width: f32) -> NodeRef {
    let node = mason.create_node();
    let id = node.id();
    mason.with_style_mut(id, |s| {
        s.set_size(Size {
            width: Dimension::length(width),
            height: Dimension::length(10.0),
        });
    });
    node
}

#[test]
fn flex_wrap_balance_uses_balanced_line_breaks() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_wrap(FlexWrap::Balance);
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
    });

    let first = leaf_with_width(&mut mason, 70.0);
    let second = leaf_with_width(&mut mason, 20.0);
    let third = leaf_with_width(&mut mason, 20.0);
    let fourth = leaf_with_width(&mut mason, 20.0);

    mason.append_node(
        root_id,
        &[first.id(), second.id(), third.id(), fourth.id()],
    );
    mason.compute_wh(root_id, 100.0, f32::NAN);

    assert_eq!(mason.layout_raw(first.id()).location.y, 0.0);
    assert_eq!(mason.layout_raw(second.id()).location.y, 10.0);
    assert_eq!(mason.layout_raw(third.id()).location.y, 10.0);
    assert_eq!(mason.layout_raw(fourth.id()).location.y, 10.0);
}
