// Times relayout of the tree-fanout tree (branching 3, depth 6 = 1093 nodes) when the root width changes.
use mason_core::{
    Dimension, Display, FlexDirection, Id, LengthPercentage, Mason, NodeRef, Rect, Size,
};
use std::time::Instant;

fn build(m: &mut Mason, depth: u32, in_row: bool, keep: &mut Vec<NodeRef>) -> Id {
    let node = m.create_node();
    let id = node.id();
    keep.push(node);
    let row = depth % 2 == 0;
    let mut children = Vec::new();
    if depth > 0 {
        for _ in 0..3 {
            children.push(build(m, depth - 1, row, keep));
        }
    }
    let leaf = depth == 0;
    m.with_style_mut(id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(if row {
            FlexDirection::Row
        } else {
            FlexDirection::Column
        });
        s.set_min_size(Size {
            width: Dimension::length(0.0),
            height: Dimension::auto(),
        });
        if leaf {
            s.set_size(Size {
                width: Dimension::auto(),
                height: Dimension::length(12.0),
            });
        } else {
            let one = LengthPercentage::length(1.0);
            s.set_padding(Rect {
                left: one,
                right: one,
                top: one,
                bottom: one,
            });
            s.set_border(Rect {
                left: one,
                right: one,
                top: one,
                bottom: one,
            });
        }
        if in_row {
            s.set_flex_grow(1.0);
            s.set_flex_shrink(1.0);
            s.set_flex_basis(Dimension::length(0.0));
        }
    });
    if !children.is_empty() {
        m.set_children(id, &children);
    }
    id
}

fn main() {
    let iters: usize = std::env::args()
        .nth(1)
        .and_then(|v| v.parse().ok())
        .unwrap_or(400);
    // "vary": a new width every pass, like a drag resize; default alternates two widths.
    let vary = std::env::args().nth(2).as_deref() == Some("vary");
    let mut m = Mason::new();
    let mut keep = Vec::new();
    let tree = build(&mut m, 6, false, &mut keep);
    let root = m.create_node();
    m.with_style_mut(root.id(), |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Column);
        s.set_size(Size {
            width: Dimension::length(1080.0),
            height: Dimension::auto(),
        });
    });
    m.set_children(root.id(), &[tree]);
    m.with_style_mut(tree, |s| {
        s.set_size(Size {
            width: Dimension::percent(1.0),
            height: Dimension::auto(),
        })
    });

    let mut out = vec![0f32; 1100 * 22];
    m.compute_wh(root.id(), 1080.0, -2.0);
    let mut times = Vec::with_capacity(iters);
    for i in 0..iters {
        let pct = if vary {
            0.5 + (i % 97) as f32 / 194.0
        } else if i % 2 == 0 {
            0.8
        } else {
            1.0
        };
        m.with_style_mut(tree, |s| {
            s.set_size(Size {
                width: Dimension::percent(pct),
                height: Dimension::auto(),
            })
        });
        m.mark_dirty(tree);
        let t = Instant::now();
        m.compute_wh(root.id(), 1080.0, -2.0);
        m.layout_into(root.id(), &mut out);
        times.push(t.elapsed().as_nanos() as f64 / 1e6);
    }
    times.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let n = times.len();
    println!(
        "nodes {} median {:.3} ms p25 {:.3} p75 {:.3} min {:.3} (w={})",
        m.node_count(),
        times[n / 2],
        times[n / 4],
        times[3 * n / 4],
        times[0],
        out[22 + 3]
    );
}
