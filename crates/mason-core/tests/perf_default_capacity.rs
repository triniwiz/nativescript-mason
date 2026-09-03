// Validates the Mason::new() default-capacity bump (128 -> 512) against the
// use case it actually targets: a single small-to-medium real screen, not
// a 100k-node mega-stress tree (see perf_text_heavy_diag.rs for that - the
// bump doesn't meaningfully change the story at that scale, since even 512
// still needs hundreds of doublings to reach 300k). The perf-audit's own
// baseline scenario was 287 nodes, so this checks a range around that.
// Run with:
//   cargo test --release --test perf_default_capacity -- --nocapture --test-threads=1
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

fn run_once(mason: &mut Mason, n_cards: usize) -> (std::time::Duration, std::time::Duration) {
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
        add_card(mason, rid, &mut handles, i);
    }
    let build_elapsed = build_start.elapsed();

    let compute_start = Instant::now();
    mason.compute_wh(rid, 360.0, f32::NAN);
    let compute_elapsed = compute_start.elapsed();

    let root_layout = mason.layout_raw(rid);
    assert!(root_layout.size.height > 0.0);

    (build_elapsed, compute_elapsed)
}

fn bench_capacity(n_cards: usize, capacity: Option<usize>, label: &str, trials: usize) {
    let mut build_total = std::time::Duration::ZERO;
    let mut compute_total = std::time::Duration::ZERO;
    let mut build_min = std::time::Duration::MAX;
    let mut compute_min = std::time::Duration::MAX;

    for _ in 0..trials {
        let mut mason = match capacity {
            Some(c) => Mason::with_capacity(c),
            None => Mason::new(),
        };
        let (build, compute) = run_once(&mut mason, n_cards);
        build_total += build;
        compute_total += compute;
        build_min = build_min.min(build);
        compute_min = compute_min.min(compute);
    }

    println!(
        "{:<28} n={:>5}  avg_build={:>10.3?}  min_build={:>10.3?}  avg_compute={:>10.3?}  min_compute={:>10.3?}",
        label,
        n_cards,
        build_total / trials as u32,
        build_min,
        compute_total / trials as u32,
        compute_min,
    );
}

#[test]
fn compare_old_vs_new_default_capacity() {
    let trials = 200;
    for n_cards in [50, 100, 287, 500] {
        bench_capacity(n_cards, Some(128), "old default (128)", trials);
        bench_capacity(n_cards, Some(512), "new default (512)", trials);
        bench_capacity(n_cards, None, "Mason::new() (actual)", trials);
        println!("---");
    }
}
