use mason_core::*;

// `position: static` is the CSS default and ignores `inset`; `position: relative`
// keeps the box in flow but applies `inset` as a correction factor.

fn container(mason: &mut Mason) -> Id {
    let node = mason.create_node();
    let id = node.id();
    mason.with_style_mut(id, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::length(200.0),
        });
    });
    std::mem::forget(node);
    id
}

fn inset_child(mason: &mut Mason, position: Position) -> Id {
    let node = mason.create_node();
    let id = node.id();
    mason.with_style_mut(id, |s| {
        s.set_position(position);
        s.set_size(Size {
            width: Dimension::length(50.0),
            height: Dimension::length(50.0),
        });
        s.set_inset(Rect {
            left: LengthPercentageAuto::length(10.0),
            right: LengthPercentageAuto::auto(),
            top: LengthPercentageAuto::length(20.0),
            bottom: LengthPercentageAuto::auto(),
        });
    });
    std::mem::forget(node);
    id
}

#[test]
fn static_ignores_inset_relative_applies_it() {
    let mut mason = Mason::new();
    let root = container(&mut mason);
    let statically_positioned = inset_child(&mut mason, Position::Static);
    mason.append_node(root, &[statically_positioned]);
    mason.compute(root);

    let l = mason.layout_raw(statically_positioned);
    assert_eq!(
        (l.location.x, l.location.y),
        (0.0, 0.0),
        "position:static must ignore inset"
    );

    let mut mason = Mason::new();
    let root = container(&mut mason);
    let relatively_positioned = inset_child(&mut mason, Position::Relative);
    mason.append_node(root, &[relatively_positioned]);
    mason.compute(root);

    let l = mason.layout_raw(relatively_positioned);
    assert_eq!(
        (l.location.x, l.location.y),
        (10.0, 20.0),
        "position:relative must apply inset as an offset"
    );
}

#[test]
fn static_default_matches_the_web() {
    let mut mason = Mason::new();
    let node = mason.create_node();
    assert_eq!(
        mason.style(node.id()).unwrap().get_position(),
        Position::Static,
        "an unstyled node defaults to position:static, as on the web"
    );
}
