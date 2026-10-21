use mason_c::node::*;
use mason_c::{mason_debug_stats, mason_init, mason_release, CMason, CMasonNode};
use std::ptr;
use std::sync::{Mutex, MutexGuard};

// The C wrapper registry is process wide, so tests that count it run one at a time.
static SERIAL: Mutex<()> = Mutex::new(());

struct Engine(*mut CMason, #[allow(dead_code)] MutexGuard<'static, ()>);
impl Engine {
    fn new() -> Self {
        let guard = SERIAL.lock().unwrap_or_else(|e| e.into_inner());
        Self(mason_init(), guard)
    }

    fn node(&self) -> Node {
        Node(mason_node_new_node(self.0, false))
    }

    /// (live nodes, live C node wrappers)
    fn counts(&self) -> (i64, i64) {
        let mut stats = [0; 7];
        mason_debug_stats(self.0, stats.as_mut_ptr(), stats.len());
        (stats[0], stats[6])
    }
}
impl Drop for Engine {
    fn drop(&mut self) {
        mason_release(self.0);
    }
}

struct Node(*mut CMasonNode);
impl Drop for Node {
    fn drop(&mut self) {
        mason_node_destroy(self.0);
    }
}

#[test]
fn null_empty_arrays_can_construct_nodes() {
    let engine = Engine::new();
    for create in [
        mason_node_new_node_with_children,
        mason_node_new_text_node_with_children,
    ] {
        let node = Node(create(engine.0, ptr::null_mut(), 0));
        assert!(!node.0.is_null());
        assert!(mason_node_get_child_at(engine.0, node.0, 0).is_null());
    }
}

#[test]
fn null_empty_array_clears_children() {
    let engine = Engine::new();
    let parent = engine.node();
    let child = engine.node();
    mason_node_add_child(engine.0, parent.0, child.0);
    mason_node_set_children(engine.0, parent.0, ptr::null(), 0);
    assert!(mason_node_get_child_at(engine.0, parent.0, 0).is_null());
}

#[test]
fn null_empty_array_can_compare_children() {
    let engine = Engine::new();
    let parent = engine.node();
    assert!(mason_node_is_children_same(
        engine.0,
        parent.0,
        ptr::null(),
        0
    ));
    let child = engine.node();
    mason_node_add_child(engine.0, parent.0, child.0);
    assert!(!mason_node_is_children_same(
        engine.0,
        parent.0,
        ptr::null(),
        0
    ));
}

#[test]
fn child_array_destruction_unregisters_wrappers() {
    let engine = Engine::new();
    let parent = engine.node();
    let child = engine.node();
    mason_node_add_child(engine.0, parent.0, child.0);
    let baseline = engine.counts();
    for _ in 0..3 {
        let array = mason_node_get_children(engine.0, parent.0);
        assert_eq!(engine.counts().1, baseline.1 + 1);
        mason_node_array_destroy(array);
        assert_eq!(engine.counts(), baseline, "wrappers leaked or nodes freed");
    }
}
