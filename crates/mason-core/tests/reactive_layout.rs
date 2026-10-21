//! Common reactive UI updates must agree with a freshly built final tree,
//! both immediately and on a subsequent unchanged compute.
use mason_core::style::DisplayMode;
use mason_core::*;
use std::cell::Cell;
use std::ffi::{c_float, c_longlong, c_void};

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

// Deterministic native-text stand-in: 10px characters and 20px lines.
// Each fixture owns its callback data; parallel tests share no mutable globals.
extern "C" fn measure_text(
    data: *const c_void,
    known_w: c_float,
    known_h: c_float,
    available_w: c_float,
    _available_h: c_float,
) -> c_longlong {
    let text_width = unsafe { &*(data as *const Cell<f32>) }.get();
    let width = if !known_w.is_nan() {
        known_w
    } else {
        match available_w {
            -1.0 => text_width.min(10.0),
            w if w >= 0.0 => text_width.min(w),
            _ => text_width,
        }
    };
    let height = if !known_h.is_nan() {
        known_h
    } else if text_width == 0.0 {
        0.0
    } else {
        (text_width / width.max(1.0)).ceil() * 20.0
    };
    MeasureOutput::make(width, height)
}

struct TextFixture {
    mason: Mason,
    nodes: [NodeRef; 3],
    text_width: Box<Cell<f32>>,
}

impl TextFixture {
    fn new(display: Display, text_width: f32) -> Self {
        let mut mason = Mason::new();
        let nodes = [
            mason.create_node(),
            mason.create_node(),
            mason.create_text_node(),
        ];
        column(&mut mason, nodes[0].id());
        mason.with_style_mut(nodes[0].id(), |s| {
            s.set_size(Size {
                width: Dimension::percent(1.0),
                height: Dimension::auto(),
            });
        });
        mason.with_style_mut(nodes[1].id(), |s| {
            s.set_display(display);
            s.set_flex_direction(FlexDirection::Column);
            if display == Display::Grid {
                s.set_grid_template_columns_css("1fr");
            }
        });
        mason.with_style_mut(nodes[2].id(), |s| {
            s.set_display_mode(DisplayMode::Box);
            s.set_min_size(Size {
                width: Dimension::length(0.0),
                height: Dimension::auto(),
            });
        });
        let mut text_width = Box::new(Cell::new(text_width));
        mason.set_measure(
            nodes[2].id(),
            Some(measure_text),
            (&mut *text_width as *mut Cell<f32>).cast(),
        );
        mason.append(nodes[0].id(), nodes[1].id());
        mason.append(nodes[1].id(), nodes[2].id());
        Self {
            mason,
            nodes,
            text_width,
        }
    }

    fn check(&mut self, display: Display, width: f32, height: f32) {
        let ids = self.nodes.each_ref().map(NodeRef::id);
        let mut fresh = Self::new(display, self.text_width.get());
        fresh.mason.compute_wh(fresh.nodes[0].id(), width, height);
        let expected = geometry(&fresh.mason, &fresh.nodes.each_ref().map(NodeRef::id));
        for _ in 0..2 {
            self.mason.compute_wh(ids[0], width, height);
            assert_geometry(&geometry(&self.mason, &ids), &expected);
        }
    }
}

fn content_round_trip(display: Display) {
    let mut tree = TextFixture::new(display, 40.0);
    for width in [40.0, 240.0, 0.0, 70.0, 40.0] {
        tree.text_width.set(width);
        tree.mason.mark_dirty(tree.nodes[2].id());
        tree.check(display, 100.0, f32::NAN);
        let expected_height = (width / 100.0).ceil() * 20.0;
        close(
            tree.mason.layout_raw(tree.nodes[0].id()).size.height,
            expected_height,
        );
    }
}

#[test]
fn flex_text_grows_wraps_clears_and_shrinks() {
    content_round_trip(Display::Flex);
}

#[test]
fn grid_text_grows_wraps_clears_and_shrinks() {
    content_round_trip(Display::Grid);
}

#[test]
fn inline_segments_grow_clear_and_return_to_the_initial_content() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let text = mason.create_text_node();
    mason.with_style_mut(root.id(), |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
    });
    mason.append(root.id(), text.id());
    for line_height in [20.0, 60.0, 0.0, 20.0] {
        let segments = if line_height == 0.0 {
            vec![]
        } else {
            vec![InlineSegment::Text {
                flags: 0,
                width: 40.0,
                ascent: line_height * 0.75,
                descent: line_height * 0.25,
            }]
        };
        mason.set_segments(text.id(), segments.clone());
        let mut fresh = Mason::new();
        let fresh_root = fresh.create_node();
        let fresh_text = fresh.create_text_node();
        fresh.with_style_mut(fresh_root.id(), |s| {
            s.set_size(Size {
                width: Dimension::length(100.0),
                height: Dimension::auto(),
            });
        });
        fresh.set_segments(fresh_text.id(), segments);
        fresh.append(fresh_root.id(), fresh_text.id());
        fresh.compute(fresh_root.id());
        for _ in 0..2 {
            mason.compute(root.id());
            assert_geometry(
                &geometry(&mason, &[root.id(), text.id()]),
                &geometry(&fresh, &[fresh_root.id(), fresh_text.id()]),
            );
            if line_height != 0.0 {
                close(mason.layout_raw(root.id()).size.height, line_height);
            }
        }
    }
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
fn append_then_remove_the_largest_child_updates_ancestors() {
    let mut tree = ChildrenFixture::new(&[5], &[]);
    tree.check(&[5], &[]);
    tree.mason.append(tree.id(3), tree.id(6));
    tree.check(&[5, 6], &[]);
    tree.mason.remove_child_at_index(tree.id(3), 1);
    tree.check(&[5], &[]);
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

#[test]
fn width_min_max_and_margins_reset_to_auto() {
    let mut tree = ChildrenFixture::new(&[5], &[]);
    tree.check(&[5], &[]);
    tree.mason.with_style_mut(tree.id(3), |s| {
        s.set_size(Size {
            width: Dimension::length(80.0),
            height: Dimension::auto(),
        });
        s.set_min_size(Size {
            width: Dimension::length(60.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(70.0),
            height: Dimension::auto(),
        });
        s.set_margin(Rect {
            left: LengthPercentageAuto::length(5.0),
            right: LengthPercentageAuto::length(5.0),
            top: LengthPercentageAuto::length(7.0),
            bottom: LengthPercentageAuto::length(9.0),
        });
    });
    tree.mason.compute_wh(tree.id(0), 100.0, f32::NAN);
    close(tree.mason.layout_raw(tree.id(3)).size.width, 70.0);
    close(tree.mason.layout_raw(tree.id(0)).size.height, 26.0);
    tree.mason.with_style_mut(tree.id(3), |s| {
        s.set_size(Size::auto());
        s.set_min_size(Size::auto());
        s.set_max_size(Size::auto());
        s.set_margin(Rect::zero());
    });
    tree.check(&[5], &[]);
}

#[test]
fn hidden_subtree_can_change_content_then_be_shown_again() {
    let mut tree = ChildrenFixture::new(&[5], &[7]);
    tree.check(&[5], &[7]);
    tree.mason
        .with_style_mut(tree.id(1), |s| s.set_display(Display::None));
    tree.mason.compute_wh(tree.id(0), 100.0, f32::NAN);
    close(tree.mason.layout_raw(tree.id(0)).size.height, 20.0);
    tree.mason.append(tree.id(3), tree.id(6));
    tree.mason.compute_wh(tree.id(0), 100.0, f32::NAN);
    close(tree.mason.layout_raw(tree.id(0)).size.height, 20.0);
    tree.mason
        .with_style_mut(tree.id(1), |s| s.set_display(Display::Flex));
    tree.check(&[5, 6], &[7]);
}

#[test]
fn flex_growth_can_be_enabled_then_reset() {
    let mut tree = ChildrenFixture::new(&[5], &[7]);
    tree.mason.with_style_mut(tree.id(0), |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(200.0),
        })
    });
    for (grow, expected) in [(0.0, 10.0), (1.0, 180.0), (0.0, 10.0)] {
        tree.mason
            .with_style_mut(tree.id(1), |s| s.set_flex_grow(grow));
        for _ in 0..2 {
            tree.mason.compute(tree.id(0));
            close(tree.mason.layout_raw(tree.id(1)).size.height, expected);
        }
    }
}

#[test]
fn resizing_width_reflows_text_and_percentage_children_then_restores_them() {
    let mut tree = TextFixture::new(Display::Flex, 240.0);
    tree.mason.with_style_mut(tree.nodes[1].id(), |s| {
        s.set_size(Size {
            width: Dimension::percent(0.5),
            height: Dimension::auto(),
        })
    });
    for width in [400.0, 200.0, 600.0, 400.0] {
        let mut fresh = TextFixture::new(Display::Flex, 240.0);
        fresh.mason.with_style_mut(fresh.nodes[1].id(), |s| {
            s.set_size(Size {
                width: Dimension::percent(0.5),
                height: Dimension::auto(),
            })
        });
        fresh.mason.compute_wh(fresh.nodes[0].id(), width, f32::NAN);
        for _ in 0..2 {
            tree.mason.compute_wh(tree.nodes[0].id(), width, f32::NAN);
            assert_geometry(
                &geometry(&tree.mason, &tree.nodes.each_ref().map(NodeRef::id)),
                &geometry(&fresh.mason, &fresh.nodes.each_ref().map(NodeRef::id)),
            );
            close(
                tree.mason.layout_raw(tree.nodes[1].id()).size.width,
                width * 0.5,
            );
            close(
                tree.mason.layout_raw(tree.nodes[0].id()).size.height,
                (240.0 / (width * 0.5)).ceil() * 20.0,
            );
        }
    }
}

#[test]
fn height_only_resize_updates_percentage_height_and_returns_to_initial_size() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let child = mason.create_node();
    mason.with_style_mut(root.id(), |s| {
        s.set_size(Size {
            width: Dimension::percent(1.0),
            height: Dimension::percent(1.0),
        })
    });
    mason.with_style_mut(child.id(), |s| {
        s.set_size(Size {
            width: Dimension::percent(0.5),
            height: Dimension::percent(0.5),
        })
    });
    mason.append(root.id(), child.id());
    for height in [200.0, 80.0, 400.0, 200.0] {
        for _ in 0..2 {
            mason.compute_wh(root.id(), 100.0, height);
            close(mason.layout_raw(root.id()).size.height, height);
            close(mason.layout_raw(child.id()).size.width, 50.0);
            close(mason.layout_raw(child.id()).size.height, height * 0.5);
        }
    }
}
