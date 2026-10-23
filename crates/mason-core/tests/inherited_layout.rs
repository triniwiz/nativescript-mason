use mason_core::style::{DisplayMode, WritingMode};
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};

// Seven 20px words, with a 10px line height. Like native text measurement,
// this callback receives horizontal constraints even for a vertical text box.
extern "C" fn measure(
    _data: *const c_void,
    known_w: c_float,
    known_h: c_float,
    available_w: c_float,
    _available_h: c_float,
) -> c_longlong {
    let width = if known_w > 0.0 {
        known_w
    } else if available_w == -1.0 {
        20.0
    } else if available_w > 0.0 {
        available_w.min(140.0)
    } else {
        140.0
    };
    let words_per_line = (width / 20.0).floor().max(1.0);
    let height = if known_h > 0.0 {
        known_h
    } else {
        (7.0 / words_per_line).ceil() * 10.0
    };
    MeasureOutput::make(width.min(140.0), height)
}

struct Fixture {
    mason: Mason,
    nodes: Vec<NodeRef>,
}

impl Fixture {
    fn new(mode: WritingMode, depth: usize, display: Display) -> Self {
        let mut mason = Mason::new();
        let mut nodes = vec![mason.create_node()];
        mason.with_style_mut(nodes[0].id(), |s| {
            s.set_display(Display::Flex);
            s.set_flex_direction(FlexDirection::Column);
            if mode != WritingMode::HorizontalTb {
                s.set_writing_mode(mode);
            }
            s.set_size(Size {
                width: Dimension::length(200.0),
                height: Dimension::length(120.0),
            });
        });
        for _ in 0..depth {
            let child = mason.create_node();
            mason.with_style_mut(child.id(), |s| {
                s.set_display(display);
                s.set_flex_direction(FlexDirection::Column);
                s.set_flex_shrink(0.0);
                s.set_size(Size {
                    width: Dimension::length(100.0),
                    height: Dimension::length(60.0),
                });
            });
            mason.append(nodes.last().unwrap().id(), child.id());
            nodes.push(child);
        }
        let text = mason.create_text_node();
        mason.with_style_mut(text.id(), |s| s.set_display_mode(DisplayMode::Inline));
        mason.set_measure(text.id(), Some(measure), std::ptr::null_mut());
        mason.append(nodes.last().unwrap().id(), text.id());
        nodes.push(text);
        Self { mason, nodes }
    }

    fn geometry(&self) -> Vec<[f32; 4]> {
        self.nodes
            .iter()
            .map(|node| {
                let l = self.mason.layout_raw(node.id());
                [l.location.x, l.location.y, l.size.width, l.size.height]
            })
            .collect()
    }

    fn compute(&mut self) {
        self.mason.compute(self.nodes[0].id());
    }
}

fn round_trip(depth: usize, display: Display) {
    let mut tree = Fixture::new(WritingMode::HorizontalTb, depth, display);
    tree.compute();
    let initial = tree.geometry();
    let mut changed = false;
    for mode in [
        WritingMode::VerticalRl,
        WritingMode::VerticalLr,
        WritingMode::HorizontalTb,
    ] {
        tree.mason
            .with_style_mut(tree.nodes[0].id(), |s| s.set_writing_mode(mode));
        let mut fresh = Fixture::new(mode, depth, display);
        fresh.compute();
        let expected = fresh.geometry();
        changed |= expected != initial;
        for _ in 0..2 {
            tree.compute();
            for (index, (actual, expected)) in tree.geometry().iter().zip(&expected).enumerate() {
                for (&a, &e) in actual.iter().zip(expected) {
                    assert!(
                        (a - e).abs() < 0.01,
                        "{mode:?}, node {index}: expected {expected:?}, got {actual:?}"
                    );
                }
            }
        }
    }
    assert!(
        changed,
        "fixture must exercise different geometry across writing modes"
    );
}

#[test]
fn inherited_writing_mode_changes_relayout_block_descendants() {
    round_trip(1, Display::Block);
}

#[test]
fn inherited_writing_mode_changes_relayout_nested_block_descendants() {
    round_trip(2, Display::Block);
}

#[test]
fn inherited_writing_mode_changes_relayout_flex_descendants() {
    round_trip(1, Display::Flex);
}

#[test]
fn buffer_backed_mode_changes_invalidate_inherited_layout() {
    use mason_core::style::StyleKeys;
    let mut tree = Fixture::new(WritingMode::HorizontalTb, 2, Display::Block);
    tree.compute();
    for (mode, state) in [(WritingMode::VerticalRl, 1), (WritingMode::HorizontalTb, 0)] {
        // The native bindings mutate this shared buffer, then call mark_dirty.
        let (ptr, len) = tree.mason.style_data_raw_mut(tree.nodes[0].id());
        assert!(!ptr.is_null());
        // SAFETY: the root owns this buffer, the engine stays alive, and no
        // other references or layout calls access it during these writes.
        let data = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
        data[StyleKeys::WRITING_MODE as usize] =
            mason_core::utils::writing_mode_to_enum(mode) as u8;
        data[StyleKeys::WRITING_MODE_STATE as usize] = state;
        tree.mason.mark_dirty(tree.nodes[0].id());
        let mut fresh = Fixture::new(mode, 2, Display::Block);
        fresh.compute();
        for _ in 0..2 {
            tree.compute();
            assert_eq!(tree.geometry(), fresh.geometry());
        }
    }
}

fn two_hosts(in_second: bool) -> Fixture {
    let mut tree = Fixture::new(WritingMode::HorizontalTb, 2, Display::Block);
    let second = tree.mason.create_node();
    tree.mason.with_style_mut(second.id(), |s| {
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(60.0),
        });
        s.set_flex_shrink(0.0);
        s.set_writing_mode(WritingMode::VerticalRl);
    });
    tree.mason.append(tree.nodes[0].id(), second.id());
    if in_second {
        tree.mason.append(second.id(), tree.nodes[2].id());
    }
    tree.nodes.push(second);
    tree
}

#[test]
fn moving_a_subtree_between_writing_modes_relayouts_it() {
    let mut tree = two_hosts(false);
    tree.compute();
    for second in [true, false, true] {
        let parent = tree.nodes[if second { 4 } else { 1 }].id();
        tree.mason.append(parent, tree.nodes[2].id());
        let mut fresh = two_hosts(second);
        fresh.compute();
        for _ in 0..2 {
            tree.compute();
            assert_eq!(tree.geometry(), fresh.geometry());
        }
    }
}

#[test]
fn a_detached_subtree_computed_as_a_root_drops_the_inherited_mode() {
    let detached = |second: bool| {
        let mut tree = two_hosts(second);
        tree.compute();
        let parent = tree.nodes[if second { 4 } else { 1 }].id();
        tree.mason.remove_child(parent, tree.nodes[2].id());
        tree.mason.compute_wh(tree.nodes[2].id(), 100.0, 60.0);
        [2, 3].map(|i| tree.mason.layout_raw(tree.nodes[i].id()).size)
    };
    let (vertical, horizontal) = (detached(true), detached(false));
    assert_eq!(vertical, horizontal);
}

static ORIENTED_MEASURES: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

extern "C" fn counted_measure(
    data: *const c_void,
    known_w: c_float,
    known_h: c_float,
    available_w: c_float,
    available_h: c_float,
) -> c_longlong {
    ORIENTED_MEASURES.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    measure(data, known_w, known_h, available_w, available_h)
}

#[test]
fn inherited_text_orientation_changes_remeasure_text() {
    use mason_core::style::StyleKeys;
    use std::sync::atomic::Ordering;
    let mut tree = Fixture::new(WritingMode::VerticalRl, 2, Display::Block);
    let text = tree.nodes[3].id();
    tree.mason
        .set_measure(text, Some(counted_measure), std::ptr::null_mut());
    tree.compute();
    let root = tree.nodes[0].id();
    let measures = || ORIENTED_MEASURES.load(Ordering::SeqCst);

    tree.mason.mark_dirty(root);
    let before = measures();
    tree.compute();
    assert_eq!(
        measures(),
        before,
        "an unchanged root keeps the text's measure"
    );

    for (orientation, state) in [(1, 1), (2, 1), (0, 0)] {
        let (ptr, len) = tree.mason.style_data_raw_mut(root);
        assert!(!ptr.is_null());
        // SAFETY: the root owns this buffer, the engine stays alive, and no
        // other references or layout calls access it during these writes.
        let data = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
        data[StyleKeys::TEXT_ORIENTATION as usize] = orientation;
        data[StyleKeys::TEXT_ORIENTATION_STATE as usize] = state;
        tree.mason.mark_dirty(root);
        let before = measures();
        tree.compute();
        assert!(
            measures() > before,
            "text-orientation {orientation} must remeasure the text"
        );
        assert_eq!(tree.mason.resolved_text_orientation(text), orientation);
    }
}

#[test]
fn text_inherits_white_space_from_an_ancestor() {
    use mason_core::style::StyleKeys;
    fn set(mason: &mut Mason, id: Id, value: u8) {
        let (ptr, len) = mason.style_data_raw_mut(id);
        // SAFETY: the node owns this buffer and nothing else touches it during the write.
        let data = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
        data[StyleKeys::WHITE_SPACE as usize] = value;
        data[StyleKeys::WHITE_SPACE_STATE as usize] = 1;
    }
    let mut tree = Fixture::new(WritingMode::HorizontalTb, 2, Display::Block);
    let text = tree.nodes[3].id();
    assert_eq!(tree.mason.resolved_white_space(text), 0);

    set(&mut tree.mason, tree.nodes[0].id(), 1);
    assert_eq!(tree.mason.resolved_white_space(text), 1, "pre from the root");

    set(&mut tree.mason, tree.nodes[2].id(), 4);
    assert_eq!(tree.mason.resolved_white_space(text), 4, "the nearest ancestor wins");

    set(&mut tree.mason, text, 0);
    assert_eq!(tree.mason.resolved_white_space(text), 0, "its own normal wins");
}
