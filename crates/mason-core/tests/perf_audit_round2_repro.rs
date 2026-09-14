// Regression + perf tests for the round-2 perf-audit fixes:
//   1. set_segments/append_segment/clear_segments/set_measure now mark_dirty
//      (correctness bug: a stale cached layout could otherwise survive a
//      text-content or measure-function change).
//   2. compute_layout's children-list sanitize pass is gated behind a
//      `structure_dirty` flag instead of running unconditionally every call.
//   3. with_style_mut skips cache invalidation entirely when the closure
//      wrote back the same value the style already had.
//
// Run with: cargo test --release --test perf_audit_round2_repro -- --nocapture
use mason_core::style::DisplayMode;
use mason_core::*;
use std::time::Instant;
use taffy::style::{Dimension, Display};

/// (1) Correctness: changing a text container's segments after the first
/// compute must be reflected on the next compute at the same available
/// width. Without `mark_dirty` in `set_segments`, taffy's per-node cache
/// slot for `Definite(200.0)` still holds the pre-change result and the
/// second `compute_wh` silently returns it unchanged.
#[test]
fn set_segments_after_first_compute_is_not_stale() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
    });

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.with_style_mut(pid, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(DisplayMode::Inline);
    });
    mason.append_node(rid, &[pid]);

    mason.set_segments(
        pid,
        vec![InlineSegment::Text {
            flags: 0,
            width: 10.0,
            ascent: 8.0,
            descent: 2.0,
        }],
    );
    mason.compute_wh(rid, 200.0, f32::NAN);
    let h1 = mason.layout_raw(pid).size.height;
    assert!(h1 > 0.0, "sanity check: text container should have nonzero height, got {h1}");

    // Much taller line, same available width.
    mason.set_segments(
        pid,
        vec![InlineSegment::Text {
            flags: 0,
            width: 10.0,
            ascent: 80.0,
            descent: 20.0,
        }],
    );
    mason.compute_wh(rid, 200.0, f32::NAN);
    let h2 = mason.layout_raw(pid).size.height;

    assert!(
        h2 > h1 + 10.0,
        "expected the segment change to be reflected (h1={h1}, h2={h2}) - if h2 == h1, \
         set_segments isn't marking the node dirty and a stale cached layout is being reused"
    );
}

/// (2)+(3) Perf: repeatedly re-apply the *same* size to a deeply-nested leaf
/// and recompute - a genuinely no-op style write, as happens whenever a
/// reactive UI re-applies an unchanged style object every render. Before the
/// fixes, `with_style_mut` unconditionally dirtied the whole ancestor chain
/// on every call (forcing a real recompute every time) and `compute_layout`
/// unconditionally re-walked every container's children list regardless.
fn build_deep_tree(mason: &mut Mason, depth: usize, leaves_per_level: usize) -> (Id, Id, Vec<NodeRef>) {
    let mut handles = Vec::new();
    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(800.0),
            height: Dimension::auto(),
        });
    });
    handles.push(root);

    let mut parent_id = rid;
    let mut deepest_leaf = rid;
    for _ in 0..depth {
        let container = mason.create_node();
        let cid = container.id();
        mason.with_style_mut(cid, |s| {
            s.set_display(Display::Block);
            s.set_size(Size {
                width: Dimension::percent(1.0),
                height: Dimension::auto(),
            });
        });
        mason.append_node(parent_id, &[cid]);
        handles.push(container);

        for _ in 0..leaves_per_level {
            let leaf = mason.create_node();
            let lid = leaf.id();
            mason.with_style_mut(lid, |s| {
                s.set_size(Size {
                    width: Dimension::length(10.0),
                    height: Dimension::length(10.0),
                });
            });
            mason.append_node(cid, &[lid]);
            deepest_leaf = lid;
            handles.push(leaf);
        }

        parent_id = cid;
    }

    (rid, deepest_leaf, handles)
}

#[test]
fn perf_repeated_noop_style_mut_then_compute() {
    let mut mason = Mason::new();
    let depth = 40;
    let (rid, leaf_id, handles) = build_deep_tree(&mut mason, depth, 10);

    mason.compute_wh(rid, 800.0, f32::NAN);
    let root_layout = mason.layout_raw(rid);
    assert!(
        root_layout.size.height > 0.0,
        "sanity check: computed root height should be > 0"
    );

    let iterations = 500;
    let start = Instant::now();
    for _ in 0..iterations {
        // Re-apply the exact value the leaf already has.
        mason.with_style_mut(leaf_id, |s| {
            s.set_size(Size {
                width: Dimension::length(10.0),
                height: Dimension::length(10.0),
            });
        });
        mason.compute_wh(rid, 800.0, f32::NAN);
    }
    let elapsed = start.elapsed();

    println!(
        "perf_repeated_noop_style_mut_then_compute: {} no-op style writes + computes over a {}-deep/~{}-node tree in {:?} ({:?}/iter)",
        iterations,
        depth,
        handles.len(),
        elapsed,
        elapsed / iterations
    );
}
