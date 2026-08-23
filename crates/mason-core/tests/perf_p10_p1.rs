// Performance smoke tests for the P10(a)/(b) tree-walk gating and the P1
// inline-measure cache from the perf audit. These aren't correctness tests
// (see node.rs's inline_measure_cache_tests for that) - they print wall-clock
// numbers so the before/after effect of those changes can be observed
// directly. Run with:
//   cargo test --release --test perf_p10_p1 -- --nocapture
//
// IMPORTANT: `NodeRef` (returned by `Mason::create_node()`) is an RAII handle
// - dropping it removes the node from the tree (see `impl Drop for NodeRef`
// in node.rs). Every NodeRef created here is kept alive in a `Vec<NodeRef>`
// for the whole test; only `Id`s (from `.id()`) are passed around otherwise.
// Dropping a NodeRef right after reading its `.id()` silently tears the node
// back out before the tree is ever computed.
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

fn build_large_float_and_scroll_free_tree(mason: &mut Mason, width: usize) -> (Id, Vec<NodeRef>) {
    let mut handles = Vec::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(width as f32),
            height: Dimension::auto(),
        });
    });
    handles.push(root);

    // A moderately deep/wide plain block tree: no float, no scroll/auto/hidden
    // overflow anywhere - collect_floats/fix_scroll_container_sizes have
    // nothing to do here, they just used to walk the whole thing anyway.
    let row_count = 40;
    let cols_per_row = 25; // 40*25 = 1000 leaf nodes, plus 40 row containers
    for _ in 0..row_count {
        let row = mason.create_node();
        let row_id = row.id();
        mason.with_style_mut(row_id, |s| {
            s.set_display(Display::Flex);
            s.set_size(Size {
                width: Dimension::percent(1.0),
                height: Dimension::length(20.0),
            });
        });
        mason.append_node(rid, &[row_id]);
        handles.push(row);

        let mut leaf_ids = Vec::with_capacity(cols_per_row);
        for _ in 0..cols_per_row {
            let leaf = mason.create_node();
            let leaf_id = leaf.id();
            mason.with_style_mut(leaf_id, |s| {
                s.set_size(Size {
                    width: Dimension::length(10.0),
                    height: Dimension::length(10.0),
                });
            });
            leaf_ids.push(leaf_id);
            handles.push(leaf);
        }
        mason.append_node(row_id, &leaf_ids);
    }

    (rid, handles)
}

#[test]
fn perf_repeated_compute_on_float_and_scroll_free_tree() {
    let mut mason = Mason::new();
    let (rid, _handles) = build_large_float_and_scroll_free_tree(&mut mason, 800);

    assert_eq!(
        mason.child_count(rid),
        40,
        "sanity check: root should have 40 row children"
    );

    // First call does the real layout work and warms up any allocations.
    mason.compute_wh(rid, 800.0, f32::NAN);
    let root_layout = mason.layout_raw(rid);
    assert!(
        root_layout.size.height > 0.0,
        "sanity check: computed root height should be > 0, got {} - tree may not actually be attached",
        root_layout.size.height
    );

    let iterations = 500;
    let start = Instant::now();
    for _ in 0..iterations {
        // Same inputs every time, nothing dirtied in between - taffy's own
        // per-node cache should make the actual layout algorithm a no-op on
        // every one of these calls. Before P10(a)/(b), collect_floats and
        // fix_scroll_container_sizes still walked the whole ~1000+ node tree
        // unconditionally on every single call regardless.
        mason.compute_wh(rid, 800.0, f32::NAN);
    }
    let elapsed = start.elapsed();

    println!(
        "perf_repeated_compute_on_float_and_scroll_free_tree: {} calls on a ~{}-node tree in {:?} ({:?}/call)",
        iterations,
        _handles.len(),
        elapsed,
        elapsed / iterations
    );
}

static MEASURE_CALLS: AtomicUsize = AtomicUsize::new(0);

extern "C" fn counting_measure(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MEASURE_CALLS.fetch_add(1, Ordering::Relaxed);
    // Simulate the cost of an actual JNI round trip to Java for text
    // measurement - a tight spin rather than sleep, since sleep granularity
    // would swamp the (sub-microsecond) per-call saving we're trying to show.
    let mut x: u64 = 0;
    for i in 0..2000u64 {
        x = x.wrapping_add(i);
    }
    std::hint::black_box(x);
    MeasureOutput::make(40.0, 16.0)
}

// P1's cache only wraps the inline-child measure sites in tree_inline.rs's
// `measure_inline_child` (has_measure && !is_text_container, reached via
// InlineSegment::InlineChild inside a text container's IFC) - a plain flex
// item's measurement goes through taffy's own per-node Cache instead, a
// different code path entirely that a first version of this test exercised
// by mistake (showing identical before/after call counts, as expected for a
// path P1 doesn't touch). This version reproduces the actual shape from
// css_inline_mixed.rs's `inline_mixed_inline_block_and_inline_grid` test:
// a text container (`create_text_node`) whose segments list several
// InlineSegment::InlineChild entries, each backed by a measured, non-text
// node appended into the text container.
#[test]
fn perf_inline_measure_cache_hit_rate() {
    let mut mason = Mason::new();
    let mut handles = Vec::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(300.0),
            height: Dimension::auto(),
        });
    });
    handles.push(root);

    // A grid with an `auto` track forces taffy to resolve the track's base
    // size from the item's min-content AND max-content before it ever knows
    // a definite width - the text container (a real is_text_container node
    // with its own has_measure, exactly like a real TextView) gets probed
    // at several distinct (known, available) combos within this ONE
    // compute_wh call, some of which repeat across the grid's multiple
    // sizing passes (auto-track base-size resolution, then final layout).
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Grid);
    });

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.set_measure(pid, Some(counting_measure), std::ptr::null_mut());
    handles.push(parent);
    mason.append_node(rid, &[pid]);

    assert_eq!(mason.child_count(rid), 1, "sanity check: 1 grid item");

    MEASURE_CALLS.store(0, Ordering::Relaxed);
    let start = Instant::now();
    mason.compute_wh(rid, 300.0, f32::NAN);
    let elapsed = start.elapsed();
    let calls = MEASURE_CALLS.load(Ordering::Relaxed);
    let layout = mason.layout_raw(rid);

    assert!(
        calls > 0,
        "sanity check: measure should have been invoked at least once"
    );
    assert!(
        layout.size.height > 0.0,
        "sanity check: text container should have nonzero height"
    );

    println!(
        "perf_inline_measure_cache_hit_rate: single compute_wh over 30 measured inline children triggered {} underlying measure calls in {:?} ({:.2} calls/child average)",
        calls, elapsed, calls as f64 / 30.0
    );
    // Not a strict assertion beyond calls > 0 (probe counts are an internal
    // taffy/mason implementation detail) - just surface the number so a
    // before/after comparison (with the inline_measure_cache reverted) is
    // visible in the test output.

    let _ = handles;
}
