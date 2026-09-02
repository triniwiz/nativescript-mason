//! Does a style write on one node leak into another node that was interned
//! into the same arena slot?
//!
//! Two freshly-created nodes have identical (default) styles, so the hash-
//! deduping style arena can hand them the same slot. Mutating one must
//! copy-on-write it out of that slot; if the write lands in the shared slot
//! instead, the second node silently inherits it.
//!
//! Motivating symptom: an `hn-comment` host in the demo comes out of layout
//! with `align-items: center` that no CSS rule sets and no TS setter ever
//! wrote, in the combination (flex-direction: column + align-items: center) -
//! which is what you get if a node inherits `center` from a `.comment-head`
//! sibling-slot and then COWs when its own `flex-direction` is written.

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

    // Two nodes with identical styles - candidates for interning.
    let a = node(&mut mason);
    let b = node(&mut mason);

    assert_eq!(align_items_of(&mut mason, a), None, "a starts unset");
    assert_eq!(align_items_of(&mut mason, b), None, "b starts unset");

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

    // Mirrors the real tree: a `.comment-head` (row + center) and an
    // `hn-comment` host (column, no align-items) created as defaults first.
    let head = node(&mut mason);
    let host = node(&mut mason);

    mason.with_style_mut(head, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(FlexDirection::Row);
        style.set_align_items(Some(AlignItems::CENTER));
    });

    // Now give the host its own (different) style. If the host was sharing a
    // slot that `head` mutated, this COW copies the poisoned slot.
    mason.with_style_mut(host, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(FlexDirection::Column);
    });

    assert_eq!(
        align_items_of(&mut mason, host),
        None,
        "host only ever set display + flex-direction, but came out with \
         align-items - exactly the (column + center) combination seen on device"
    );
}
