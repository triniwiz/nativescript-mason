//! Regression: a style write on one node must not leak into another node that
//! shares the same interned arena slot. The style arena dedupes identical
//! styles; mutating one must copy-on-write it to a private slot first.

use mason_core::*;

fn node(mason: &mut Mason) -> Id {
    let n = mason.create_node();
    let id = n.id();
    std::mem::forget(n);
    id
}

fn align_items_of(mason: &mut Mason, id: Id) -> Option<AlignItems> {
    let mut out = None;
    mason.with_style(id, |s| {
        out = s.get_align_items();
    });
    out
}

#[test]
fn write_on_one_node_does_not_leak_into_an_identically_styled_node() {
    let mut mason = Mason::new();

    // Two nodes with identical default styles may share an arena slot.
    let a = node(&mut mason);
    let b = node(&mut mason);

    assert_eq!(align_items_of(&mut mason, a), None);
    assert_eq!(align_items_of(&mut mason, b), None);

    // Mutate only `a`.
    mason.with_style_mut(a, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(FlexDirection::Row);
        style.set_align_items(Some(AlignItems::CENTER));
    });

    assert_eq!(
        align_items_of(&mut mason, a),
        Some(AlignItems::CENTER),
        "a should have the value we just set"
    );
    assert_eq!(
        align_items_of(&mut mason, b),
        None,
        "b never had align-items set - a's write leaked across an interned slot"
    );
}

#[test]
fn cow_after_a_leaked_write_does_not_carry_the_leak() {
    let mut mason = Mason::new();

    let head = node(&mut mason);
    let host = node(&mut mason);

    mason.with_style_mut(head, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(FlexDirection::Row);
        style.set_align_items(Some(AlignItems::CENTER));
    });

    mason.with_style_mut(host, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(FlexDirection::Column);
    });

    assert_eq!(
        align_items_of(&mut mason, host),
        None,
        "host should not inherit align-items from a shared arena slot"
    );
}
