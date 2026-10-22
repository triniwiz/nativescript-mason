//! Child list mutations must agree with a freshly built final tree,
//! both immediately and on a subsequent unchanged compute.
use mason_core::*;

fn close(actual: f32, expected: f32) {
    assert!(
        (actual - expected).abs() < 0.01,
        "expected {expected}, got {actual}"
    );
}

fn geometry(mason: &Mason, ids: &[Id]) -> Vec<[f32; 6]> {
    ids.iter()
        .map(|&id| {
            let l = mason.layout_raw(id);
            [
                l.location.x,
                l.location.y,
                l.size.width,
                l.size.height,
                l.scrollable_overflow_rect.right,
                l.scrollable_overflow_rect.bottom,
            ]
        })
        .collect()
}

fn assert_geometry(actual: &[[f32; 6]], expected: &[[f32; 6]]) {
    assert_eq!(actual.len(), expected.len());
    for (node, (a, e)) in actual.iter().zip(expected).enumerate() {
        for (field, (&a, &e)) in a.iter().zip(e).enumerate() {
            assert!(
                (a - e).abs() < 0.01,
                "node {node}, geometry field {field}: expected {e}, got {a}"
            );
        }
    }
}

fn column(mason: &mut Mason, id: Id) {
    mason.with_style_mut(id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_flex_shrink(0.0);
    });
}

// A two-level container on each side catches invalidation that stops at the
// immediate parent. The three leaves have heights 10, 40 and 20 respectively.
struct ChildrenFixture {
    mason: Mason,
    nodes: Vec<NodeRef>,
}

impl ChildrenFixture {
    fn new(left: &[usize], right: &[usize]) -> Self {
        let mut mason = Mason::new();
        let nodes: Vec<_> = (0..8).map(|_| mason.create_node()).collect();
        for node in &nodes[..5] {
            column(&mut mason, node.id());
        }
        for (node, height) in nodes[5..].iter().zip([10.0, 40.0, 20.0]) {
            mason.with_style_mut(node.id(), |s| {
                s.set_size(Size {
                    width: Dimension::length(30.0),
                    height: Dimension::length(height),
                });
                s.set_flex_shrink(0.0);
            });
        }
        mason.append_node(nodes[0].id(), &[nodes[1].id(), nodes[2].id()]);
        mason.append(nodes[1].id(), nodes[3].id());
        mason.append(nodes[2].id(), nodes[4].id());
        mason.set_children(
            nodes[3].id(),
            &left.iter().map(|&i| nodes[i].id()).collect::<Vec<_>>(),
        );
        mason.set_children(
            nodes[4].id(),
            &right.iter().map(|&i| nodes[i].id()).collect::<Vec<_>>(),
        );
        Self { mason, nodes }
    }

    fn id(&self, index: usize) -> Id {
        self.nodes[index].id()
    }

    fn check(&mut self, left: &[usize], right: &[usize]) {
        let mut fresh = Self::new(left, right);
        let active: Vec<_> = (0..5).chain(left.iter().chain(right).copied()).collect();
        let ids: Vec<_> = active.iter().map(|&i| self.id(i)).collect();
        let expected_ids: Vec<_> = active.iter().map(|&i| fresh.id(i)).collect();
        fresh.mason.compute_wh(fresh.id(0), 100.0, f32::NAN);
        for _ in 0..2 {
            self.mason.compute_wh(self.id(0), 100.0, f32::NAN);
            assert_geometry(
                &geometry(&self.mason, &ids),
                &geometry(&fresh.mason, &expected_ids),
            );
        }
        for (parent, children) in [(3, left), (4, right)] {
            assert_eq!(self.mason.child_count(self.id(parent)), children.len());
            for (slot, &child) in children.iter().enumerate() {
                assert_eq!(
                    self.mason
                        .child_at_index(self.id(parent), slot)
                        .unwrap()
                        .id(),
                    self.id(child)
                );
                assert_eq!(
                    self.mason.get_root(self.id(child)).unwrap().id(),
                    self.id(0)
                );
            }
        }
        let heights = [10.0, 40.0, 20.0];
        close(
            self.mason.layout_raw(self.id(0)).size.height,
            left.iter().chain(right).map(|&i| heights[i - 5]).sum(),
        );
    }
}

#[test]
fn replacing_a_child_updates_all_ancestors() {
    let mut tree = ChildrenFixture::new(&[5], &[]);
    tree.check(&[5], &[]);
    let removed = tree
        .mason
        .replace_child_at_index(tree.id(3), tree.id(6), 0)
        .unwrap();
    assert_eq!(removed.id(), tree.id(5));
    tree.check(&[6], &[]);
    tree.mason.replace_child_at_index(tree.id(3), tree.id(5), 0);
    tree.check(&[5], &[]);
}

#[test]
fn replacing_with_an_existing_sibling_preserves_the_target() {
    // Reusing a sibling shifts the target's index when that sibling is detached.
    for (index, incoming, expected) in [(2, 5, vec![6, 5]), (0, 7, vec![7, 6])] {
        let mut tree = ChildrenFixture::new(&[5, 6, 7], &[]);
        tree.check(&[5, 6, 7], &[]);
        tree.mason
            .replace_child_at_index(tree.id(3), tree.id(incoming), index);
        tree.check(&expected, &[]);
    }
}

#[test]
fn reorder_and_bulk_removal_preserve_order_and_detach_removed_children() {
    let mut tree = ChildrenFixture::new(&[5, 6, 7], &[]);
    tree.check(&[5, 6, 7], &[]);
    tree.mason
        .set_children(tree.id(3), &[tree.id(7), tree.id(5), tree.id(6)]);
    tree.check(&[7, 5, 6], &[]);
    tree.mason.set_children(tree.id(3), &[tree.id(5)]);
    tree.check(&[5], &[]);
    for index in [6, 7] {
        assert_eq!(
            tree.mason.get_root(tree.id(index)).unwrap().id(),
            tree.id(index),
            "removed child must be detached"
        );
    }
}

#[test]
fn bulk_reparenting_updates_both_ancestor_chains() {
    let mut tree = ChildrenFixture::new(&[5, 6], &[7]);
    tree.check(&[5, 6], &[7]);
    tree.mason
        .set_children(tree.id(4), &[tree.id(7), tree.id(6)]);
    tree.check(&[5], &[7, 6]);
    tree.mason
        .set_children(tree.id(3), &[tree.id(5), tree.id(6)]);
    tree.check(&[5, 6], &[7]);
}
