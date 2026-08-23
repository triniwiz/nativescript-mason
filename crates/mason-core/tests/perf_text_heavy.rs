// Text-heavy scale/stress tests: build a feed-like tree of N text-bearing
// "cards" (title + wrapped body text, like a news-feed screen) and see
// whether it holds up - and how the timing scales - at 1k/10k/100k cards.
// Not correctness tests; run with:
//   cargo test --release --test perf_text_heavy -- --nocapture
//
// NodeRef (from Mason::create_node()/create_text_node()) is an RAII handle -
// dropping it removes the node from the tree. Every handle created here is
// kept alive in the returned Vec<NodeRef> for the whole test.
use mason_core::*;
use std::time::Instant;

/// One "card": a block container with a title text node and a body text
/// node, each carrying several Text segments of varying width so real
/// wrapping/line-breaking work happens (not just a single fixed-size box).
fn add_card(mason: &mut Mason, parent_id: Id, handles: &mut Vec<NodeRef>, seed: usize) {
    let card = mason.create_node();
    let card_id = card.id();
    mason.with_style_mut(card_id, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::percent(1.0),
            height: Dimension::auto(),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(0.0),
            right: LengthPercentageAuto::length(0.0),
            top: LengthPercentageAuto::length(0.0),
            bottom: LengthPercentageAuto::length(8.0),
        });
    });
    handles.push(card);

    let title = mason.create_text_node();
    let title_id = title.id();
    mason.with_style_mut(title_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });
    // A short title: one run, usually fits on one line.
    let title_width = 80.0 + (seed % 120) as f32;
    mason.set_segments(
        title_id,
        vec![InlineSegment::Text {
            width: title_width,
            ascent: 14.0,
            descent: 4.0,
            flags: 0,
        }],
    );
    handles.push(title);

    let body = mason.create_text_node();
    let body_id = body.id();
    mason.with_style_mut(body_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });
    // A body made of several runs (like separate words/spans) whose combined
    // width usually exceeds the card width, forcing wrapping across lines -
    // varies per card so cards differ in line count.
    let run_count = 4 + (seed % 5);
    let mut segments = Vec::with_capacity(run_count);
    for r in 0..run_count {
        segments.push(InlineSegment::Text {
            width: 40.0 + ((seed + r * 7) % 60) as f32,
            ascent: 12.0,
            descent: 4.0,
            flags: 0,
        });
    }
    mason.set_segments(body_id, segments);
    handles.push(body);

    mason.append_node(card_id, &[title_id, body_id]);
    mason.append_node(parent_id, &[card_id]);
}

fn run_scale(n_cards: usize) {
    let mut mason = Mason::new();
    let mut handles = Vec::with_capacity(n_cards * 3 + 1);

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::length(360.0),
            height: Dimension::auto(),
        });
    });
    handles.push(root);

    let build_start = Instant::now();
    for i in 0..n_cards {
        add_card(&mut mason, rid, &mut handles, i);
    }
    let build_elapsed = build_start.elapsed();

    assert_eq!(
        mason.child_count(rid),
        n_cards,
        "sanity check: root should have {} card children",
        n_cards
    );

    let compute_start = Instant::now();
    mason.compute_wh(rid, 360.0, f32::NAN);
    let compute_elapsed = compute_start.elapsed();

    let root_layout = mason.layout_raw(rid);
    assert!(
        root_layout.size.height > 0.0,
        "sanity check: root height should be > 0 after computing {} cards, got {}",
        n_cards,
        root_layout.size.height
    );
    assert!(
        root_layout.size.width <= 360.0 + 1e-3,
        "sanity check: root width should stay within the 360px constraint"
    );

    // Incremental update: dirty a single card deep in the tree (simulating
    // "one item's content changed") and recompute - this is the realistic
    // steady-state cost, not the initial full build.
    let mid_card_title_handle_idx = 1 + (n_cards / 2) * 3; // root + cards*(card,title,body)
    let mid_title_id = handles[mid_card_title_handle_idx].id();
    mason.with_style_mut(mid_title_id, |_s| {
        // no-op mutation is enough to dirty the node via with_style_mut
    });

    let incremental_start = Instant::now();
    mason.compute_wh(rid, 360.0, f32::NAN);
    let incremental_elapsed = incremental_start.elapsed();

    println!(
        "n={:>7}  build={:>10.3?}  full_compute={:>10.3?}  incremental_recompute={:>10.3?}  total_nodes={}",
        n_cards,
        build_elapsed,
        compute_elapsed,
        incremental_elapsed,
        handles.len(),
    );
}

#[test]
fn text_heavy_1k() {
    run_scale(1_000);
}

#[test]
fn text_heavy_10k() {
    run_scale(10_000);
}

#[test]
fn text_heavy_100k() {
    run_scale(100_000);
}
