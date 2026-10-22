//! Vertical containers. Taffy only knows `horizontal-tb`, so a container in a vertical writing
//! mode runs its flex, grid or block algorithm in a transposed frame: its inline axis becomes
//! taffy's x axis and its block axis taffy's y axis. Style guards handed to taffy while that
//! algorithm runs read sides and sizes in that frame, children are laid out in the physical
//! frame as usual, and the positions the algorithm assigns are turned back to physical ones.

use crate::style::WritingMode;
use crate::tree::{Id, Tree};
use std::cell::{Cell, RefCell};
use taffy::{Layout, LayoutInput, LayoutOutput, Line, NodeId, OofCandidates, Point, Rect, Size};

#[derive(Copy, Clone, Debug, PartialEq, Eq, Default)]
pub(crate) enum LayoutFrame {
    #[default]
    Physical,
    VerticalRl,
    VerticalLr,
}

impl LayoutFrame {
    #[inline(always)]
    pub(crate) fn from_writing_mode(mode: WritingMode) -> Self {
        match mode {
            WritingMode::HorizontalTb => LayoutFrame::Physical,
            WritingMode::VerticalRl => LayoutFrame::VerticalRl,
            WritingMode::VerticalLr => LayoutFrame::VerticalLr,
        }
    }

    #[inline(always)]
    pub(crate) fn is_vertical(self) -> bool {
        self != LayoutFrame::Physical
    }

    #[inline(always)]
    fn is_rl(self) -> bool {
        self == LayoutFrame::VerticalRl
    }

    /// Physical sides to frame sides: inline start/end are top/bottom, block start is the
    /// right edge in `vertical-rl` and the left edge in `vertical-lr`.
    #[inline(always)]
    pub(crate) fn rect<T>(self, r: Rect<T>) -> Rect<T> {
        match self {
            LayoutFrame::Physical => r,
            LayoutFrame::VerticalRl => Rect {
                left: r.top,
                right: r.bottom,
                top: r.right,
                bottom: r.left,
            },
            LayoutFrame::VerticalLr => Rect {
                left: r.top,
                right: r.bottom,
                top: r.left,
                bottom: r.right,
            },
        }
    }

    /// Inverse of [`LayoutFrame::rect`].
    #[inline(always)]
    pub(crate) fn physical_rect<T>(self, r: Rect<T>) -> Rect<T> {
        match self {
            LayoutFrame::Physical => r,
            LayoutFrame::VerticalRl => Rect {
                top: r.left,
                bottom: r.right,
                left: r.bottom,
                right: r.top,
            },
            LayoutFrame::VerticalLr => Rect {
                top: r.left,
                bottom: r.right,
                left: r.top,
                right: r.bottom,
            },
        }
    }

    #[inline(always)]
    pub(crate) fn size<T>(self, s: Size<T>) -> Size<T> {
        if self.is_vertical() {
            s.transpose()
        } else {
            s
        }
    }

    #[inline(always)]
    pub(crate) fn point<T>(self, p: Point<T>) -> Point<T> {
        if self.is_vertical() {
            p.transpose()
        } else {
            p
        }
    }
}

thread_local! {
    /// Frame of the container algorithm currently asking for styles. Only taffy's flex, grid
    /// and block algorithms (and the out-of-flow pass) of a vertical container run inside one.
    static FRAME: Cell<LayoutFrame> = const { Cell::new(LayoutFrame::Physical) };
    /// Children given a layout by a vertical container's algorithm, waiting to be turned
    /// back to physical. Nested containers use the part above their start index.
    static PLACED: RefCell<Vec<Id>> = const { RefCell::new(Vec::new()) };
    /// The child a vertical container is laying out right now. It shares the container's
    /// block axis, so CSS's orthogonal-flow fallbacks for vertical text don't apply to it.
    static PARALLEL_CHILD: Cell<Option<Id>> = const { Cell::new(None) };
}

/// Whether `id` is being laid out by a vertical container, in the same writing mode.
#[inline(always)]
pub(crate) fn is_parallel_flow(id: Id) -> bool {
    PARALLEL_CHILD.with(Cell::get) == Some(id)
}

#[inline(always)]
pub(crate) fn set_parallel_child(id: Option<Id>) -> Option<Id> {
    PARALLEL_CHILD.with(|cell| cell.replace(id))
}

#[inline(always)]
pub(crate) fn current_frame() -> LayoutFrame {
    FRAME.with(Cell::get)
}

#[inline(always)]
pub(crate) fn set_frame(frame: LayoutFrame) -> LayoutFrame {
    FRAME.with(|cell| cell.replace(frame))
}

#[inline(always)]
pub(crate) fn record_placed(id: Id) {
    PLACED.with(|placed| placed.borrow_mut().push(id));
}

/// Resets the frame for a new layout pass and restores the outer one when dropped, so a
/// nested tree computed from a measure callback starts physical too.
pub(crate) struct FramePassGuard(LayoutFrame);

impl FramePassGuard {
    pub(crate) fn enter() -> Self {
        Self(set_frame(LayoutFrame::Physical))
    }
}

impl Drop for FramePassGuard {
    fn drop(&mut self) {
        set_frame(self.0);
    }
}

/// Mirrors a static-position area across a box of `width` (block axis of `vertical-rl`).
#[inline]
fn mirror_axis(sp: &mut taffy::AxisStaticPosition, width: f32) {
    use taffy::AxisStaticEdge;
    let flip = |edge| match edge {
        AxisStaticEdge::Start => AxisStaticEdge::End,
        AxisStaticEdge::End => AxisStaticEdge::Start,
        AxisStaticEdge::Center => AxisStaticEdge::Center,
    };
    sp.area = Line {
        start: width - sp.area.end,
        end: width - sp.area.start,
    };
    sp.align.keyword = flip(sp.align.keyword);
    sp.align.fallback = flip(sp.align.fallback);
}

/// Physical static positions (relative to a box `width` wide) into `frame`.
fn candidates_to_frame(candidates: &mut OofCandidates, frame: LayoutFrame, width: f32) {
    for candidate in candidates.as_mut_slice() {
        let sp = &mut candidate.static_position;
        if frame.is_rl() {
            mirror_axis(&mut sp.x, width);
        }
        *sp = sp.transpose();
    }
}

/// Inverse of [`candidates_to_frame`].
fn candidates_to_physical(candidates: &mut OofCandidates, frame: LayoutFrame, width: f32) {
    for candidate in candidates.as_mut_slice() {
        let sp = &mut candidate.static_position;
        *sp = sp.transpose();
        if frame.is_rl() {
            mirror_axis(&mut sp.x, width);
        }
    }
}

/// A child's physical layout output, as the vertical container laying it out sees it.
pub(crate) fn output_to_frame(output: LayoutOutput, frame: LayoutFrame) -> LayoutOutput {
    let width = output.size.width;
    let mut output = output.transpose();
    candidates_to_frame(&mut output.oof_candidates, frame, width);
    output
}

/// A vertical container's own output, from its frame back to physical.
fn output_to_physical(output: LayoutOutput, frame: LayoutFrame) -> LayoutOutput {
    let mut output = output.transpose();
    let width = output.size.width;
    candidates_to_physical(&mut output.oof_candidates, frame, width);
    output
}

/// A child layout written in its vertical parent's frame, back to physical. `width` is the
/// parent's physical border-box width, which `vertical-rl` positions are mirrored across.
fn layout_to_physical(layout: Layout, frame: LayoutFrame, width: f32) -> Layout {
    let size = layout.size.transpose();
    let x = if frame.is_rl() {
        width - layout.location.y - size.width
    } else {
        layout.location.y
    };
    Layout {
        order: layout.order,
        location: Point {
            x,
            y: layout.location.x,
        },
        size,
        scrollable_overflow_rect: layout.scrollable_overflow_rect.transpose(),
        scrollbar_size: layout.scrollbar_size.transpose(),
        border: frame.physical_rect(layout.border),
        padding: frame.physical_rect(layout.padding),
        margin: frame.physical_rect(layout.margin),
    }
}

/// Runs `algorithm` (plus the out-of-flow pass) for a vertical container in its own frame.
/// Inputs and output stay physical for the caller.
pub(crate) fn layout_in_frame(
    tree: &mut Tree,
    node_id: NodeId,
    inputs: LayoutInput,
    frame: LayoutFrame,
    algorithm: impl FnOnce(&mut Tree, LayoutInput) -> LayoutOutput,
) -> LayoutOutput {
    let start = PLACED.with(|placed| placed.borrow().len());
    let outer = set_frame(frame);
    let mut output = algorithm(tree, inputs.transpose());
    if inputs.run_mode == taffy::RunMode::PerformLayout {
        taffy::compute_oof_layout(tree, node_id, &mut output);
    }
    set_frame(outer);

    let width = output.size.height;
    PLACED.with(|placed| {
        let mut placed = placed.borrow_mut();
        // A child placed twice still holds a single frame layout.
        placed[start..].sort_unstable();
        let mut inner = tree.inner_mut();
        let mut last = None;
        for &id in &placed[start..] {
            if last == Some(id) {
                continue;
            }
            last = Some(id);
            if let Some(node) = inner.nodes.get_mut(id) {
                node.unrounded_layout = layout_to_physical(node.unrounded_layout, frame, width);
            }
        }
        placed.truncate(start);
    });
    output_to_physical(output, frame)
}

/// Frame a vertical container runs its own algorithm in, or `Physical` for every other node.
#[inline]
pub(crate) fn container_frame(tree: &Tree, id: Id) -> LayoutFrame {
    let inner = tree.inner();
    if !inner.has_writing_modes {
        return LayoutFrame::Physical;
    }
    inner.nodes.get(id).map_or(LayoutFrame::Physical, |node| {
        LayoutFrame::from_writing_mode(node.cached_writing_mode)
    })
}
