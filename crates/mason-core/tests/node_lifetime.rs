use mason_core::*;

fn subtree(mason: &mut Mason, host: &NodeRef) -> (NodeRef, Vec<NodeRef>) {
    let root = mason.create_node();
    let mut refs = Vec::new();
    for _ in 0..3 {
        let child = mason.create_node();
        mason.add_child(root.id(), child.id());
        for _ in 0..2 {
            let grandchild = mason.create_node();
            mason.add_child(child.id(), grandchild.id());
            refs.push(grandchild);
        }
        refs.push(child);
    }
    mason.add_child(host.id(), root.id());
    (root, refs)
}

#[test]
fn unmounted_subtree_is_freed_in_any_drop_order() {
    let mut mason = Mason::new();
    let host = mason.create_node();
    let baseline = mason.node_count();

    for order in 0..3 {
        let (root, mut refs) = subtree(&mut mason, &host);
        assert_eq!(mason.node_count(), baseline + 10);
        drop(mason.remove_child(host.id(), root.id()));
        match order {
            0 => {
                drop(root);
                drop(refs);
            }
            1 => {
                drop(refs);
                drop(root);
            }
            _ => {
                refs.reverse();
                let tail = refs.split_off(4);
                drop(tail);
                drop(root);
                drop(refs);
            }
        }
        assert_eq!(mason.node_count(), baseline, "drop order {order}");
    }
}

#[test]
fn referenced_descendants_survive_and_are_freed_later() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let child = mason.create_node();
    mason.add_child(root.id(), child.id());
    let baseline = mason.node_count();

    drop(root);
    assert_eq!(mason.node_count(), baseline - 1);
    drop(child);
    assert_eq!(mason.node_count(), baseline - 2);
}

#[test]
fn a_node_with_a_parent_is_kept_until_detached() {
    let mut mason = Mason::new();
    let parent = mason.create_node();
    let child = mason.create_node();
    let child_id = child.id();
    mason.add_child(parent.id(), child_id);
    let baseline = mason.node_count();

    drop(child);
    assert_eq!(mason.node_count(), baseline, "still in the parent's children");

    drop(mason.remove_child(parent.id(), child_id));
    assert_eq!(mason.node_count(), baseline - 1);
}

#[test]
fn remove_children_frees_unreferenced_children() {
    let mut mason = Mason::new();
    let parent = mason.create_node();
    let kept = mason.create_node();
    for _ in 0..5 {
        let child = mason.create_node();
        mason.add_child(parent.id(), child.id());
    }
    mason.add_child(parent.id(), kept.id());
    let baseline = mason.node_count();

    mason.remove_children(parent.id());
    assert_eq!(mason.node_count(), baseline - 5, "the referenced child stays");
    drop(kept);
    assert_eq!(mason.node_count(), baseline - 6);
}

#[test]
fn repeated_mount_unmount_does_not_grow() {
    let mut mason = Mason::new();
    let host = mason.create_node();
    let baseline = mason.node_count();
    for _ in 0..50 {
        let (root, refs) = subtree(&mut mason, &host);
        drop(mason.remove_child(host.id(), root.id()));
        drop(refs);
        drop(root);
    }
    assert_eq!(mason.node_count(), baseline);
}
