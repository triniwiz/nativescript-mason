use mason_c::node::*;
use mason_c::{mason_debug_stats, mason_init, mason_release, CMason, CMasonNode};
use std::alloc::{GlobalAlloc, Layout, System};
use std::process::Command;
use std::ptr;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

struct TrackingAllocator;
static TRACKED_ARRAY: AtomicUsize = AtomicUsize::new(0);
static ARRAY_FREED: AtomicBool = AtomicBool::new(false);

// Track the returned descriptor itself, independently of its child buffer.
unsafe impl GlobalAlloc for TrackingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        unsafe { System.alloc(layout) }
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        if ptr as usize == TRACKED_ARRAY.load(Ordering::Relaxed) {
            ARRAY_FREED.store(true, Ordering::Relaxed);
        }
        unsafe { System.dealloc(ptr, layout) }
    }
}

#[global_allocator]
static ALLOCATOR: TrackingAllocator = TrackingAllocator;

struct Engine(*mut CMason);
impl Engine {
    fn new() -> Self {
        Self(mason_init())
    }

    fn node(&self) -> Node {
        Node(mason_node_new_node(self.0, false))
    }

    fn stats(&self) -> [i64; 7] {
        let mut stats = [0; 7];
        mason_debug_stats(self.0, stats.as_mut_ptr(), stats.len());
        stats
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

fn isolated(name: &str, run: impl FnOnce()) {
    // Bad slice construction inside extern C aborts rather than unwinding.
    // Separate processes also isolate the C wrapper registry and allocator.
    if std::env::var("MASON_C_CHILD_ARRAY_CASE").as_deref() == Ok(name) {
        run();
        return;
    }
    let output = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", name, "--nocapture"])
        .env("MASON_C_CHILD_ARRAY_CASE", name)
        .env("RUST_BACKTRACE", "0")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{name} failed: {}\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn null_empty_arrays_can_construct_nodes() {
    isolated("null_empty_arrays_can_construct_nodes", || {
        let engine = Engine::new();
        for create in [
            mason_node_new_node_with_children,
            mason_node_new_text_node_with_children,
        ] {
            let node = Node(create(engine.0, ptr::null_mut(), 0));
            assert!(!node.0.is_null());
            assert!(mason_node_get_child_at(engine.0, node.0, 0).is_null());
        }
        assert_eq!(engine.stats()[0], 0);
        assert_eq!(engine.stats()[6], 0);
    });
}

#[test]
fn null_empty_array_clears_children() {
    isolated("null_empty_array_clears_children", || {
        let engine = Engine::new();
        let parent = engine.node();
        let child = engine.node();
        mason_node_add_child(engine.0, parent.0, child.0);
        mason_node_add_children(engine.0, parent.0, ptr::null(), 0);
        mason_node_prepend_children(engine.0, parent.0, ptr::null(), 0);
        let queried = Node(mason_node_get_child_at(engine.0, parent.0, 0));
        assert!(!queried.0.is_null());
        drop(queried);
        mason_node_set_children(engine.0, parent.0, ptr::null(), 0);
        assert!(mason_node_get_child_at(engine.0, parent.0, 0).is_null());
    });
}

#[test]
fn null_empty_array_can_compare_children() {
    isolated("null_empty_array_can_compare_children", || {
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
    });
}

fn destroy_array(array: *mut NodeArray) {
    assert!(!array.is_null());
    TRACKED_ARRAY.store(array as usize, Ordering::Relaxed);
    ARRAY_FREED.store(false, Ordering::Relaxed);
    mason_node_array_destroy(array);
    assert!(
        ARRAY_FREED.load(Ordering::Relaxed),
        "NodeArray descriptor was leaked"
    );
    TRACKED_ARRAY.store(0, Ordering::Relaxed);
}

#[test]
fn child_array_destruction_releases_wrappers_and_descriptor() {
    isolated(
        "child_array_destruction_releases_wrappers_and_descriptor",
        || {
            let engine = Engine::new();
            let parent = engine.node();
            let child = engine.node();
            mason_node_add_child(engine.0, parent.0, child.0);
            let baseline = engine.stats();
            for _ in 0..32 {
                let array = mason_node_get_children(engine.0, parent.0);
                assert_eq!(engine.stats()[6], baseline[6] + 1);
                destroy_array(array);
                assert_eq!(
                    engine.stats()[6],
                    baseline[6],
                    "child wrappers were not unregistered"
                );
                assert_eq!(
                    engine.stats()[0],
                    baseline[0],
                    "original nodes must stay alive"
                );
            }
            drop(child);
            drop(parent);
            assert_eq!(engine.stats()[0], 0);
            assert_eq!(engine.stats()[6], 0);
        },
    );
}

#[test]
fn empty_child_array_destruction_releases_descriptor() {
    isolated("empty_child_array_destruction_releases_descriptor", || {
        let engine = Engine::new();
        let parent = engine.node();
        destroy_array(mason_node_get_children(engine.0, parent.0));
        destroy_array(mason_node_get_children(ptr::null_mut(), ptr::null_mut()));
        assert_eq!(engine.stats()[6], 1);
        mason_node_array_destroy(ptr::null_mut());
    });
}
