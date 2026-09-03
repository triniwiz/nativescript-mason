// Diagnostic for the super-linear time/memory scaling seen between 10k and
// 100k cards in perf_text_heavy.rs. Builds one 100k-card tree but takes
// checkpoints along the way (build cost per 10k-card chunk, plus a full
// compute_wh() timing at each checkpoint) so we can see the SHAPE of the
// curve instead of 3 widely-spaced data points. Run with:
//   cargo test --release --test perf_text_heavy_diag -- --nocapture
use mason_core::*;
use std::time::Instant;

fn add_card(mason: &mut Mason, parent_id: Id, handles: &mut Vec<NodeRef>, seed: usize) {
    let card = mason.create_node();
    let card_id = card.id();
    mason.with_style_mut(card_id, |s| {
        s.set_display(Display::Block);
        s.set_size(Size {
            width: Dimension::percent(1.0),
            height: Dimension::auto(),
        });
    });
    handles.push(card);

    let title = mason.create_text_node();
    let title_id = title.id();
    mason.with_style_mut(title_id, |s| {
        s.set_display(Display::Block);
        s.set_display_mode(mason_core::style::DisplayMode::Inline);
    });
    mason.set_segments(
        title_id,
        vec![InlineSegment::Text {
            width: 80.0 + (seed % 120) as f32,
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

#[test]
fn diag_incremental_build_and_compute_curve() {
    let mut mason = Mason::new();
    let mut handles = Vec::with_capacity(300_001);
    run_curve(&mut mason, &mut handles);
}

#[test]
fn diag_incremental_build_and_compute_curve_preallocated() {
    // Same workload, but the tree's internal storage (nodes/parents/children/
    // style arena) is pre-sized for the full 300k-node run up front via
    // Mason::with_capacity, instead of growing incrementally chunk by chunk.
    // If this eliminates the noisy/spiky compute_wh timings seen in the
    // default run, that confirms the spikes are reallocation/growth events
    // in the tree's own storage, not an algorithmic cost in layout itself.
    let mut mason = Mason::with_capacity(300_001);
    let mut handles = Vec::with_capacity(300_001);
    run_curve(&mut mason, &mut handles);
}

fn run_curve(mason: &mut Mason, handles: &mut Vec<NodeRef>) {

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

    let chunk = 10_000;
    let chunks = 10; // 10 * 10k = 100k cards total
    let mut cards_so_far = 0usize;
    let mut cumulative_build = std::time::Duration::ZERO;

    println!(
        "{:>10} {:>14} {:>16} {:>18} {:>14} {:>18}",
        "cards", "chunk_build", "us/card(chunk)", "cumulative_build", "compute_wh", "us/node(compute)"
    );

    for _ in 0..chunks {
        let chunk_start = Instant::now();
        for i in 0..chunk {
            add_card(mason, rid, handles, cards_so_far + i);
        }
        let chunk_elapsed = chunk_start.elapsed();
        cumulative_build += chunk_elapsed;
        cards_so_far += chunk;

        let compute_start = Instant::now();
        mason.compute_wh(rid, 360.0, f32::NAN);
        let compute_elapsed = compute_start.elapsed();

        let total_nodes = handles.len();
        println!(
            "{:>10} {:>14.3?} {:>16.3} {:>18.3?} {:>14.3?} {:>18.3}",
            cards_so_far,
            chunk_elapsed,
            chunk_elapsed.as_micros() as f64 / chunk as f64,
            cumulative_build,
            compute_elapsed,
            compute_elapsed.as_micros() as f64 / total_nodes as f64,
        );
    }

    let root_layout = mason.layout_raw(rid);
    assert!(root_layout.size.height > 0.0);
}
