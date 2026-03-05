use std::collections::HashMap;
use crate::node::{drain_deferred_cleanup, Node, NodeData, NodeRef, NodeType};
use crate::style::arena::{StyleArena, StyleHandle};
use crate::style::style_guard::StyleGuard;
use crate::style::{DisplayMode, Style};
use parking_lot::lock_api::{MappedRwLockReadGuard, MappedRwLockWriteGuard};
use parking_lot::{Mutex, RawRwLock, RwLock, RwLockReadGuard, RwLockWriteGuard};
use slotmap::{new_key_type, Key, KeyData, SecondaryMap, SlotMap};
use std::fmt::Debug;
use std::sync::atomic::AtomicU32;
use std::sync::Arc;
use style_atoms::Atom;
use taffy::{compute_block_layout, compute_cached_layout, compute_flexbox_layout, compute_grid_layout, compute_hidden_layout, compute_leaf_layout, compute_root_layout, round_layout, AvailableSpace, BlockContext, CacheTree, ClearState, CoreStyle, Display, Float, Layout, LayoutBlockContainer, LayoutInput, LayoutOutput, LayoutPartialTree, MaybeResolve, NodeId, PrintTree, Rect, ResolveOrZero, RoundTree, Size, TraversePartialTree, TraverseTree, style::Clear};

new_key_type! {
   pub struct Id;
}

impl From<Id> for NodeId {
    fn from(value: Id) -> Self {
        NodeId::from(value.data().as_ffi())
    }
}

impl From<NodeId> for Id {
    fn from(value: NodeId) -> Self {
        KeyData::from_ffi(value.into()).into()
    }
}

#[derive(Clone, Copy, Debug)]
struct SubtreeAnalysis {
    has_children: bool,
    has_mixed_content: bool,
    all_inline: bool,
}

#[derive(Debug)]
/// # Locking Discipline
///
/// `node_data` lives in its own `RwLock` (`Tree.2`), independent of `TreeInner`.
/// During layout:
/// 1. `TreeInner` locks must be short and non-reentrant
/// 2. Never call FFI/measure while holding `TreeInner`
/// 3. Use `copy_measure()` to extract measure data, then call without locks
/// 4. Callbacks may freely access `node_data` (separate lock)
pub(crate) struct TreeInner {
    pub(crate) nodes: SlotMap<Id, Node>,
    pub(crate) parents: SecondaryMap<Id, Option<Id>>,
    pub(crate) children: SecondaryMap<Id, Vec<Id>>,
    // Transient float rectangles collected during pre-layout.
    // Keyed by the container Id (the block/inline container that holds floats).
    pub(crate) float_context: SecondaryMap<Id, Vec<FloatRect>>,
    pub(crate) use_rounding: bool,
    // small nesting counter to avoid re-entrant inline-run aggregation
    pub(crate) inline_run_nesting: usize,
    // pending child ids for the inline run - set_unrounded_layout will consume these
    pub(crate) inline_run_pending: Vec<Id>,
    pub(crate) density: Arc<AtomicU32>,
    pub(crate) style_arena: Box<StyleArena>,
}

impl TreeInner {
    pub fn density(&self) -> &Arc<AtomicU32> {
        &self.density
    }

    pub fn density_mut(&mut self) -> &mut Arc<AtomicU32> {
        &mut self.density
    }

    pub fn new() -> Self {
        Self {
            nodes: Default::default(),
            parents: Default::default(),
            children: Default::default(),
            use_rounding: false,
            inline_run_nesting: 0,
            inline_run_pending: Vec::new(),
            density: Arc::new(AtomicU32::new(1f32.to_bits())),
            style_arena: Box::default(),
            float_context: Default::default(),
        }
    }

    pub fn with_capacity(value: usize) -> Self {
        Self {
            nodes: SlotMap::with_capacity_and_key(value),
            parents: SecondaryMap::with_capacity(value),
            children: SecondaryMap::with_capacity(value),
            float_context: SecondaryMap::with_capacity(value),
            use_rounding: false,
            inline_run_nesting: 0,
            inline_run_pending: Vec::new(),
            density: Arc::new(AtomicU32::new(1f32.to_bits())),
            style_arena: Box::default(),
        }
    }

    #[inline(always)]
    pub fn node_from_id(&self, node_id: NodeId) -> &Node {
        self.nodes.get(node_id.into()).unwrap()
    }

    #[inline(always)]
    pub fn node_from_id_mut(&mut self, node_id: NodeId) -> &mut Node {
        self.nodes.get_mut(node_id.into()).unwrap()
    }

    #[inline(always)]
    pub fn prepare_mut(&mut self, node_id: NodeId) {
        if let Some(node) = self.nodes.get_mut(node_id.into()) {
            let _ = node.style_mut();
        }
    }
}

impl Default for TreeInner {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct FloatRect {
    // Note: `left`/`top` are the position, `right`/`bottom` are used as
    // width/height for compatibility with existing `taffy::Rect` usage in
    // this codebase (i.e. `top + bottom` gives the bottom edge).
    pub left: f32,
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
    pub side: Float,
    pub node: Id,
}

#[derive(Debug, Clone)]
pub struct Tree(
    pub(crate) Arc<RwLock<TreeInner>>,
    pub(crate) Arc<Mutex<Vec<Id>>>,
    pub(crate) Arc<RwLock<SecondaryMap<Id, NodeData>>>,
);

impl Default for Tree {
    fn default() -> Self {
        Self::new()
    }
}

impl Tree {
    /// Returns a reference to the shared deferred-cleanup queue used by `NodeRef::Drop`.
    fn deferred_cleanup_queue(&self) -> &Arc<Mutex<Vec<Id>>> {
        &self.1
    }
}

impl Tree {
    #[inline(always)]
    pub fn prepare_mut(&mut self, node_id: NodeId) {
        self.inner_mut().prepare_mut(node_id);
    }
    pub fn density(&self) -> MappedRwLockReadGuard<'_, RawRwLock, Arc<AtomicU32>> {
        RwLockReadGuard::map(self.0.read(), |v| &v.density)
    }

    pub fn density_mut(&mut self) -> MappedRwLockWriteGuard<'_, RawRwLock, Arc<AtomicU32>> {
        RwLockWriteGuard::map(self.0.write(), |v| &mut v.density)
    }

    pub fn use_rounding(&self) -> bool {
        self.inner().use_rounding
    }

    pub fn set_use_rounding(&mut self, value: bool) {
        self.inner_mut().use_rounding = value;
    }

    pub fn inline_run_nesting(&self) -> usize {
        self.inner().inline_run_nesting
    }

    pub fn set_inline_run_nesting(&mut self, value: usize) {
        self.inner_mut().inline_run_nesting = value;
    }

    pub fn new() -> Self {
        Self(Default::default(), Default::default(), Default::default())
    }

    pub fn with_capacity(value: usize) -> Self {
        Self(
            Arc::new(RwLock::new(TreeInner::with_capacity(value))),
            Default::default(),
            Arc::new(RwLock::new(SecondaryMap::with_capacity(value))),
        )
    }

    fn inner_ptr(&self) -> &Arc<RwLock<TreeInner>> {
        &self.0
    }

    pub(crate) fn inner_mut(&mut self) -> MappedRwLockWriteGuard<'_, RawRwLock, TreeInner> {
        RwLockWriteGuard::map(self.0.write(), |v| v)
    }

    pub(crate) fn inner(&self) -> MappedRwLockReadGuard<'_, RawRwLock, TreeInner> {
        RwLockReadGuard::map(self.0.read(), |v| v)
    }

    pub fn nodes(&self) -> MappedRwLockReadGuard<'_, RawRwLock, SlotMap<Id, Node>> {
        RwLockReadGuard::map(self.0.read(), |v| &v.nodes)
    }

    pub fn nodes_mut(&mut self) -> MappedRwLockWriteGuard<'_, RawRwLock, SlotMap<Id, Node>> {
        RwLockWriteGuard::map(self.0.write(), |v| &mut v.nodes)
    }

    pub fn node_data(&self) -> RwLockReadGuard<'_, SecondaryMap<Id, NodeData>> {
        self.2.read()
    }

    pub fn node_data_mut(&mut self) -> RwLockWriteGuard<'_, SecondaryMap<Id, NodeData>> {
        self.2.write()
    }

    pub fn children_mut(
        &mut self,
    ) -> MappedRwLockWriteGuard<'_, RawRwLock, SecondaryMap<Id, Vec<Id>>> {
        RwLockWriteGuard::map(self.0.write(), |v| &mut v.children)
    }

    pub fn parents(&self) -> MappedRwLockReadGuard<'_, RawRwLock, SecondaryMap<Id, Option<Id>>> {
        RwLockReadGuard::map(self.0.read(), |v| &v.parents)
    }
    pub fn parents_mut(
        &mut self,
    ) -> MappedRwLockWriteGuard<'_, RawRwLock, SecondaryMap<Id, Option<Id>>> {
        RwLockWriteGuard::map(self.0.write(), |v| &mut v.parents)
    }

    pub fn print_tree(&self, root: Id) {
        print_tree(self, root.into());
    }

    #[inline(always)]
    fn node_from_id(&self, node_id: NodeId) -> MappedRwLockReadGuard<'_, RawRwLock, Node> {
        RwLockReadGuard::map(self.0.read(), |v| v.nodes.get(node_id.into()).unwrap())
    }

    #[inline(always)]
    fn node_from_id_mut(&mut self, node_id: NodeId) -> MappedRwLockWriteGuard<'_, RawRwLock, Node> {
        RwLockWriteGuard::map(self.0.write(), |v| v.nodes.get_mut(node_id.into()).unwrap())
    }

    #[inline(always)]
    fn style_from_id(&self, node_id: NodeId) -> MappedRwLockReadGuard<'_, RawRwLock, Style> {
        RwLockReadGuard::map(self.0.read(), |v| {
            v.nodes.get(node_id.into()).unwrap().style()
        })
    }

    #[inline(always)]
    fn style_from_id_mut(
        &mut self,
        node_id: NodeId,
    ) -> MappedRwLockWriteGuard<'_, RawRwLock, Style> {
        RwLockWriteGuard::map(self.0.write(), |v| {
            v.nodes.get_mut(node_id.into()).unwrap().style_mut()
        })
    }

    pub fn get_node_data(&self, node_id: NodeId) -> MappedRwLockReadGuard<'_, RawRwLock, NodeData> {
        RwLockReadGuard::map(self.2.read(), |v| v.get(node_id.into()).unwrap())
    }

    pub fn get_node_data_mut(
        &mut self,
        node_id: NodeId,
    ) -> MappedRwLockWriteGuard<'_, RawRwLock, NodeData> {
        RwLockWriteGuard::map(self.2.write(), |v| v.get_mut(node_id.into()).unwrap())
    }

    pub fn children(&self, node_id: Id) -> Vec<NodeRef> {
        let tree = self.inner();
        tree.children
            .get(node_id)
            .map(|children| {
                children
                    .iter()
                    .map(|child| {
                        let id = *child;
                        let node = tree.nodes.get(id).unwrap();
                        NodeRef {
                            id,
                            guard: Arc::clone(&node.guard),
                            tree: Arc::clone(self.inner_ptr()),
                            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
                            node_data: Arc::clone(&self.2),
                        }
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or(vec![])
    }

    /// Clear transient float context before a layout pass.
    pub fn clear_float_context(&mut self) {
        self.inner_mut().float_context.clear();
    }

    /// Collect floated children (by container) into `float_context`.
    /// This pass only records which children are floated and their side; sizing
    /// and precise rects are computed in a later step.
    pub fn collect_floats(&mut self, root: Id) {
        let mut to_insert: Vec<(Id, Vec<FloatRect>)> = Vec::new();
        {
            let inner = self.inner();
            // Iterate containers and their children, record floated children.
            for (container_id, children) in inner.children.iter() {
                // Skip empty lists
                if children.is_empty() {
                    continue;
                }

                let mut floats: Vec<FloatRect> = Vec::new();

                for &child_id in children.iter() {
                    let node = inner.nodes.get(child_id).unwrap();
                    let float_side = node.style().get_float();
                    if float_side != Float::None {
                        floats.push(FloatRect {
                            left: 0.0,
                            top: 0.0,
                            right: 0.0,
                            bottom: 0.0,
                            side: float_side,
                            node: child_id,
                        });
                    }
                }

                if !floats.is_empty() {
                    to_insert.push((container_id, floats));
                }
            }
        }

        if !to_insert.is_empty() {
            let mut inner_mut = self.inner_mut();
            for (container_id, floats) in to_insert.into_iter() {
                inner_mut.float_context.insert(container_id, floats);
            }
        }
    }

    /// Measure floated children and populate width/height in `float_context`.
    /// Uses the provided `available_space` as a parent reference for resolving
    /// percentage sizes; when a node has a native measure callback, it will be
    /// invoked.
    pub fn measure_place_floats(&mut self, _root: Id, available_space: Size<AvailableSpace>) {
        // Build a list of containers to process under read lock, then perform
        // measurements by acquiring node_data as needed.
        let mut work: Vec<(Id, Vec<Id>)> = Vec::new();
        {
            let inner = self.inner();
            for (container_id, floats) in inner.float_context.iter() {
                let ids = floats.iter().map(|f| f.node).collect::<Vec<_>>();
                if !ids.is_empty() {
                    work.push((container_id, ids));
                }
            }
        }

        if work.is_empty() {
            return;
        }

        // For measurement we will write back sizes into float_context.
        for (container_id, ids) in work.into_iter() {
            for child_id in ids.into_iter() {
                // Extract measure/style under short locks
                let (has_measure, style_size, measure) = {
                    let lock = self.0.read();
                    let node = lock.nodes.get(child_id).unwrap();
                    let has_measure = node.has_measure;
                    let style_size = node.style().get_size();
                    let measure = self.node_data().get(child_id).unwrap().copy_measure();
                    (has_measure, style_size, measure)
                };

                // Resolve style-specified widths/heights against root available space (approx).
                let parent_w = available_space.width.into_option().unwrap_or(0.0);
                let parent_h = available_space.height.into_option().unwrap_or(0.0);

                let resolved_width = style_size
                    .width
                    .maybe_resolve(parent_w, |_, _| 0.0);
                let resolved_height = style_size
                    .height
                    .maybe_resolve(parent_h, |_, _| 0.0);

                let final_known = taffy::Size {
                    width: resolved_width,
                    height: resolved_height,
                };

                let measured = if !has_measure {
                    taffy::Size {
                        width: final_known.width.unwrap_or(0.0),
                        height: final_known.height.unwrap_or(0.0),
                    }
                } else {
                    measure.measure(final_known, available_space)
                };

                // Write back into float_context
                let mut inner_mut = self.inner_mut();
                if let Some(vec) = inner_mut.float_context.get_mut(container_id) {
                    if let Some(fr) = vec.iter_mut().find(|f| f.node == child_id) {
                        fr.right = measured.width; // right := width
                        fr.bottom = measured.height; // bottom := height
                    }
                }
            }

            // After measuring all floats for this container, assign x/y positions
            // using a simple left/right stacking algorithm. Margins and clears are
            // not yet applied here.
            let container_w = available_space.width.into_option().unwrap_or(0.0);
            let mut left_offset = 0.0_f32;
            let mut right_offset = 0.0_f32;
            // Precompute `clear` values for nodes in this container under a read
            // lock so we don't need an immutable borrow while holding the
            // mutable `float_context` entry.
            let mut clear_map: HashMap<Id, Clear> = HashMap::new();
            {
                let inner = self.inner();
                if let Some(orig_vec) = inner.float_context.get(container_id) {
                    for fr in orig_vec.iter() {
                        if let Some(node) = inner.nodes.get(fr.node) {
                            clear_map.insert(fr.node, node.style().get_clear());
                        }
                    }
                }
            }

            let mut inner_mut = self.inner_mut();
            if let Some(vec) = inner_mut.float_context.get_mut(container_id) {
                // place floats with vertical stacking and clear rules
                let mut placed: Vec<FloatRect> = Vec::new();
                for fr in vec.iter_mut() {
                    let width = fr.right;
                    let height = fr.bottom;
                    let side = fr.side;
                    let clear = *clear_map.get(&fr.node).unwrap_or(&Clear::None);

                    let mut y = 0.0_f32;
                    // apply clear constraints initially
                    if matches!(clear, Clear::Left | Clear::Both) {
                        let mut max_bot = 0.0_f32;
                        for p in &placed {
                            if p.side == Float::Left {
                                max_bot = max_bot.max(p.top + p.bottom);
                            }
                        }
                        y = y.max(max_bot);
                    }
                    if matches!(clear, Clear::Right | Clear::Both) {
                        let mut max_bot = 0.0_f32;
                        for p in &placed {
                            if p.side == Float::Right {
                                max_bot = max_bot.max(p.top + p.bottom);
                            }
                        }
                        y = y.max(max_bot);
                    }

                    loop {
                        // compute occupied widths at this y
                        let mut left_occupied = 0.0_f32;
                        let mut right_occupied = 0.0_f32;
                        for p in &placed {
                            let p_top = p.top;
                            let p_bot = p.top + p.bottom;
                            if !(p_bot <= y || p_top >= y + height) {
                                // vertical overlap
                                if p.side == Float::Left {
                                    left_occupied += p.right;
                                } else if p.side == Float::Right {
                                    right_occupied += p.right;
                                }
                            }
                        }

                        if side == Float::Left {
                            let x = left_occupied;
                            if x + width + right_occupied <= container_w + 0.001 {
                                fr.left = x;
                                fr.top = y;
                                placed.push(*fr);
                                break;
                            }
                        } else if side == Float::Right {
                            let x = (container_w - right_occupied) - width;
                            if x >= left_occupied - 0.001 {
                                fr.left = x;
                                fr.top = y;
                                placed.push(*fr);
                                break;
                            }
                        } else {
                            fr.left = left_occupied;
                            fr.top = y;
                            placed.push(*fr);
                            break;
                        }

                        // advance y to next candidate (smallest bottom > y)
                        let mut next_y = f32::INFINITY;
                        for p in &placed {
                            let bot = p.top + p.bottom;
                            if bot > y {
                                next_y = next_y.min(bot);
                            }
                        }
                        if next_y.is_infinite() {
                            // nothing to advance to; push below current floats
                            let mut max_bot = 0.0_f32;
                            for p in &placed {
                                max_bot = max_bot.max(p.top + p.bottom);
                            }
                            y = max_bot;
                        } else {
                            y = next_y;
                        }
                    }
                }
            }
        }
    }

    /// Return cloned float rectangles for a container, if any.
    pub fn get_float_rects(&self, container_id: Id) -> Option<Vec<FloatRect>> {
        let inner = self.inner();
        inner.float_context.get(container_id).cloned()
    }

    /// Return float rects as `taffy::Rect<f32>` for easier consumption by
    /// inline layout code.
    pub fn get_float_rects_simple(&self, container_id: Id) -> Option<Vec<taffy::Rect<f32>>> {
        let inner = self.inner();
        inner
            .float_context
            .get(container_id)
            .map(|vec| vec.iter().map(|fr| Rect { left: fr.left, top: fr.top, right: fr.right, bottom: fr.bottom }).collect())
    }

    pub fn children_id(&self, node_id: Id) -> MappedRwLockReadGuard<'_, RawRwLock, Vec<Id>> {
        RwLockReadGuard::map(self.0.read(), |v| v.children.get(node_id.into()).unwrap())
    }

    fn analyze_subtree(&self, id: Id) -> SubtreeAnalysis {
        let mut has_children = false;
        let mut has_mixed_content = false;
        let mut all_inline = true;

        if let Some(children) = self.inner().children.get(id) {
            has_children = !children.is_empty();

            let mut has_inline = false;
            let mut has_non_inline = false;

            for child_id in children {
                let child = &self.inner().nodes[*child_id];
                let mode = child.style().display_mode();
                let inline_or_box_inline = matches!(mode, DisplayMode::Inline | DisplayMode::Box);
                // Fix: Check for anonymous inline blocks too
                let is_inline = child.style().force_inline() || inline_or_box_inline;

                if is_inline {
                    has_inline = true;
                } else {
                    has_non_inline = true;
                    all_inline = false;
                }

                // Early exit if both found
                if has_inline && has_non_inline {
                    has_mixed_content = true;
                    all_inline = false;
                    break;
                }
            }
        }

        SubtreeAnalysis {
            has_children,
            has_mixed_content,
            all_inline,
        }
    }

    pub fn compute_layout(
        &mut self,
        root: NodeId,
        available_space: Size<AvailableSpace>,
        use_rounding: bool,
    ) {
        // Drain any deferred node removals from NodeRef::Drop before acquiring
        // locks for the layout pass.  This prevents the deferred queue from
        // growing unboundedly and cleans up nodes that couldn't be removed
        // earlier because the tree lock was contended.
        drain_deferred_cleanup(&self.0, self.deferred_cleanup_queue(), &self.2);

        // update tree rounding mode so other helpers (Tree::layout etc.) are consistent
        self.set_use_rounding(use_rounding);

        // reset any inline-run state before doing a full layout pass to avoid
        // stale pending entries / nesting interfering with cached layouts
        self.inner_mut().inline_run_pending.clear();
        self.set_inline_run_nesting(0);

        // Clear and collect floats for the upcoming layout pass. We record
        // floated children per container first; then measure them against the
        // root available space so inline layout can consult approximate sizes.
        self.clear_float_context();
        self.collect_floats(root.into());
        self.measure_place_floats(root.into(), available_space);

        compute_root_layout(self, root, available_space);

        // Post-process scroll containers to clamp their heights to parent's available space.
        // This is done after layout because block layout measures children with intrinsic sizing
        // (MinContent) which doesn't pass the parent's actual available height.
        self.fix_scroll_container_heights(root, available_space.height);

        if use_rounding {
            round_layout(self, root);
        } else {
            // Ensure final_layout mirrors unrounded_layout so prints / consumers that read
            // final_layout get the correct positions even when rounding is disabled.
            let mut nodes = self.nodes_mut();
            for (_id, node) in nodes.iter_mut() {
                node.final_layout = node.unrounded_layout;
            }
        }
    }

    pub fn layout(&self, node: Id) -> MappedRwLockReadGuard<'_, RawRwLock, Layout> {
        if self.use_rounding() {
            return RwLockReadGuard::map(self.0.read(), |v| &v.nodes[node].final_layout);
        }
        RwLockReadGuard::map(self.0.read(), |v| &v.nodes[node].unrounded_layout)
    }

    /// Post-process scroll containers to clamp their heights to the parent's available content area.
    /// This is necessary because block layout measures children with intrinsic sizing (MinContent)
    /// which doesn't constrain scroll containers to their parent's available height.
    fn fix_scroll_container_heights(
        &mut self,
        node_id: NodeId,
        parent_available_height: AvailableSpace,
    ) {
        let id: Id = node_id.into();

        // Get parent's computed layout and style info
        let (layout, padding, border, children, overflow) = {
            let inner = self.0.read();
            let node = inner.nodes.get(id);
            if node.is_none() {
                return;
            }
            let node = node.unwrap();
            let style = node.style();
            let children = inner.children.get(id).cloned().unwrap_or_default();
            (
                node.unrounded_layout,
                style.get_padding(),
                style.get_border(),
                children,
                style.get_overflow(),
            )
        };

        // Check if this node itself is a scroll container that needs clamping
        let is_scroll_container_y = matches!(
            overflow.y,
            crate::style::Overflow::Scroll | crate::style::Overflow::Auto
        );

        if is_scroll_container_y {
            // Get the constraint from parent_available_height
            if let AvailableSpace::Definite(constraint_h) = parent_available_height {
                let mut inner = self.0.write();
                if let Some(node) = inner.nodes.get_mut(id) {
                    if node.unrounded_layout.size.height > constraint_h {
                        // Preserve content_size for scrollable extent
                        if node.unrounded_layout.content_size.height
                            < node.unrounded_layout.size.height
                        {
                            node.unrounded_layout.content_size.height =
                                node.unrounded_layout.size.height;
                        }
                        // Clamp the visible size
                        node.unrounded_layout.size.height = constraint_h;
                    }
                }
            }
        }

        // Calculate available height for children (our content box)
        let padding_top = padding
            .top
            .resolve_or_zero(Some(layout.size.width), |_v, _b| 0.0);
        let padding_bottom = padding
            .bottom
            .resolve_or_zero(Some(layout.size.width), |_v, _b| 0.0);
        let border_top = border
            .top
            .resolve_or_zero(Some(layout.size.width), |_v, _b| 0.0);
        let border_bottom = border
            .bottom
            .resolve_or_zero(Some(layout.size.width), |_v, _b| 0.0);
        let content_box_height =
            layout.size.height - padding_top - padding_bottom - border_top - border_bottom;

        // Recursively process children
        for child_id in children {
            let child_node_id = NodeId::from(child_id);
            // Children get the content box height as their available space
            let child_available = if content_box_height > 0.0 {
                AvailableSpace::Definite(content_box_height)
            } else {
                AvailableSpace::MinContent
            };
            self.fix_scroll_container_heights(child_node_id, child_available);
        }
    }

    fn get_arena(&mut self) -> *mut StyleArena {
        &mut *self.inner_mut().style_arena
    }

    pub fn create_node(&mut self) -> NodeRef {
        let mut node = Node::new(self.get_arena());
        node.inner_style_mut().device_scale = Some(Arc::clone(&*self.density()));
        let guard = node.guard.clone();
        let id = {
            let mut tree = self.inner_mut();
            let id = tree.nodes.insert(node);
            tree.parents.insert(id, None);
            tree.children.insert(id, Vec::new());
            id
        };
        self.2.write().insert(id, NodeData::default());

        NodeRef {
            id,
            guard,
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        }
    }

    pub fn create_anonymous_node(&mut self) -> NodeRef {
        let mut node = Node::new(self.get_arena());
        node.is_anonymous = true;
        node.inner_style_mut().device_scale = Some(Arc::clone(&*self.density()));
        let guard = node.guard.clone();
        let id = {
            let mut tree = self.inner_mut();
            let id = tree.nodes.insert(node);
            tree.parents.insert(id, None);
            tree.children.insert(id, Vec::new());
            id
        };
        self.2.write().insert(id, NodeData::default());
        NodeRef {
            id,
            guard,
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        }
    }

    pub fn create_text_node(&mut self) -> NodeRef {
        // we are defaulting our text element nodes to inline
        let mut node = Node::new_with_handle(self.get_arena(), StyleHandle::DEFAULT_INLINE);
        node.inner_style_mut().device_scale = Some(Arc::clone(&*self.density()));
        node.type_ = NodeType::Text;
        let guard = node.guard.clone();
        let id = {
            let mut tree = self.inner_mut();
            let id = tree.nodes.insert(node);
            tree.parents.insert(id, None);
            tree.children.insert(id, Vec::new());
            id
        };
        self.2.write().insert(id, NodeData::default());
        NodeRef {
            id,
            guard,
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        }
    }

    pub fn create_anonymous_text_node(&mut self) -> NodeRef {
        // should always be inline by default
        let mut node = Node::new_with_handle(self.get_arena(), StyleHandle::DEFAULT_INLINE);
        node.inner_style_mut().device_scale = Some(Arc::clone(&*self.density()));
        node.type_ = NodeType::Text;
        node.is_anonymous = true;
        let guard = node.guard.clone();
        let id = {
            let mut tree = self.inner_mut();
            let id = tree.nodes.insert(node);
            tree.parents.insert(id, None);
            tree.children.insert(id, Vec::new());
            id
        };
        self.2.write().insert(id, NodeData::default());
        NodeRef {
            id,
            guard,
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        }
    }

    pub fn create_image_node(&mut self) -> NodeRef {
        let mut node = Node::new_with_handle(self.get_arena(), StyleHandle::DEFAULT_IMG);
        node.type_ = NodeType::Image;
        node.inner_style_mut().device_scale = Some(Arc::clone(&*self.density()));
        let guard = node.guard.clone();
        let id = {
            let mut tree = self.inner_mut();
            let id = tree.nodes.insert(node);
            tree.parents.insert(id, None);
            tree.children.insert(id, Vec::new());
            id
        };
        self.2.write().insert(id, NodeData::default());
        NodeRef {
            id,
            guard,
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        }
    }

    pub fn create_line_break_node(&mut self) -> NodeRef {
        let mut node = Node::new(self.get_arena());
        node.type_ = NodeType::LineBreak;
        node.inner_style_mut().device_scale = Some(Arc::clone(&*self.density()));
        let guard = node.guard.clone();
        let id = {
            let mut tree = self.inner_mut();
            let id = tree.nodes.insert(node);
            tree.parents.insert(id, None);
            tree.children.insert(id, Vec::new());
            id
        };
        self.2.write().insert(id, NodeData::default());
        NodeRef {
            id,
            guard,
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        }
    }

    pub fn create_list_item_node(&mut self) -> NodeRef {
        let mut node = Node::new_with_handle(self.get_arena(), StyleHandle::DEFAULT_LIST_ITEM);
        node.inner_style_mut().device_scale = Some(Arc::clone(&*self.density()));
        let guard = node.guard.clone();
        let id = {
            let mut tree = self.inner_mut();
            let id = tree.nodes.insert(node);
            tree.parents.insert(id, None);
            tree.children.insert(id, Vec::new());
            id
        };
        self.2.write().insert(id, NodeData::default());
        NodeRef {
            id,
            guard,
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        }
    }

    fn set_parent(&mut self, child: Id, parent: Option<Id>) -> bool {
        let mut tree = self.0.write();
        Tree::set_parent_inner(&mut tree, child, parent)
    }

    fn set_parent_inner(tree: &mut TreeInner, child: Id, parent: Option<Id>) -> bool {
        match tree.parents.insert(child, parent) {
            Some(old_parent) => old_parent != parent,
            None => true,
        }
    }

    pub fn detach(&mut self, child: Id) {
        let mut tree = self.0.write();
        Self::detach_inner(&mut tree, child);
    }

    fn detach_inner(tree: &mut TreeInner, child: Id) {
        if let Some(Some(parent)) = tree.parents.remove(child) {
            if let Some(children) = tree.children.get_mut(parent) {
                children.retain(|&id| id != child);
            }
            if let Some(node) = tree.nodes.get_mut(parent) {
                node.mark_dirty();
            }
        }
    }

    pub fn append(&mut self, parent: Id, child: Id) {
        self.detach(child);
        let same = self.set_parent(child, Some(parent));
        if same {
            let mut tree = self.0.write();
            let children = tree.children.get_mut(parent).unwrap();
            children.push(child);
            Tree::mark_dirty_inner(&mut tree, parent);
        }
    }

    pub fn append_children(&mut self, parent: Id, children: &[Id]) {
        for child in children.iter() {
            self.detach(*child);
            self.append(parent, *child);
        }
    }

    pub fn prepend(&mut self, parent: Id, child: Id) {
        let mut tree = self.0.write();
        Tree::detach_inner(&mut tree, child);
        let same = Tree::set_parent_inner(&mut tree, child, Some(parent));
        if same {
            let children = tree.children.get_mut(parent).unwrap();
            children.insert(0, child);
            Tree::mark_dirty_inner(&mut tree, parent);
        }
    }

    pub fn prepend_children(&mut self, parent: Id, children: &[Id]) {
        let has_parent = self.inner().children.contains_key(parent);
        if has_parent {
            for child in children.iter() {
                self.detach(*child);
            }
        }
        if let Some(nodes) = self.children_mut().get_mut(parent) {
            let mut joined = children.to_vec();
            joined.append(nodes);
            let _ = std::mem::replace(nodes, joined);
        }
    }

    pub fn child_count(&self, node: Id) -> usize {
        self.inner().children.get(node).map_or(0, Vec::len)
    }

    pub fn child_at(&self, node: Id, index: usize) -> Option<NodeRef> {
        let tree = self.0.read();
        let children = tree.children.get(node)?;
        let child_id = children.get(index)?;
        let child_node = tree.nodes.get(*child_id)?;
        Some(NodeRef {
            id: *child_id,
            guard: Arc::clone(&child_node.guard),
            tree: Arc::clone(self.inner_ptr()),
            deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
            node_data: Arc::clone(&self.2),
        })
    }

    pub fn clear(&mut self) {
        let mut tree = self.inner_mut();
        tree.nodes.clear();
        tree.parents.clear();
        tree.children.clear();
        drop(tree);
        self.2.write().clear();
    }

    pub fn is_children_same(&self, node: Id, children: &[Id]) -> bool {
        let tree = self.0.read();
        let Some(ids) = tree.children.get(node) else {
            return false;
        };

        if ids.len() != children.len() {
            return false;
        }

        if ids.is_empty() {
            return true;
        }

        ids == children
    }

    pub fn dirty(&self, node: Id) -> bool {
        self.nodes()
            .get(node)
            .map(|node| node.cache.is_empty())
            .unwrap_or(false)
    }

    fn reparent_then_append(&mut self, parent: Id, child: Id) {
        let mut tree = self.0.write();
        if let Some(Some(parent)) = tree.parents.remove(child) {
            if let Some(children) = tree.children.get_mut(parent) {
                children.retain(|&id| id != child);
            }
            if let Some(node) = tree.nodes.get_mut(parent) {
                node.mark_dirty();
            }
        } else {
            let same = Tree::set_parent_inner(&mut tree, child, Some(parent));
            if same {
                let children = tree.children.get_mut(parent).unwrap();
                children.push(child);
                Tree::mark_dirty_inner(&mut tree, parent);
            }
        }
    }

    fn remove_from_parent(&mut self, parent: Id, node: Id) {
        let mut tree = self.0.write();
        if let Some(children) = tree.children.get_mut(parent) {
            if let Some(position) = children.iter().position(|&id| id == node) {
                children.remove(position);
                if let Some(node) = tree.nodes.get_mut(parent) {
                    node.mark_dirty();
                }
            }
        }
    }

    pub fn insert_after(&mut self, parent: Id, node: Id, reference: Id) {
        let mut tree = self.0.write();
        // Find the position of the reference node
        let Some(children) = tree.children.get(parent) else {
            return;
        };

        if let Some(node_pos) = children.iter().position(|&id| id == reference) {
            // If child is already in the correct position, do nothing
            if node_pos + 1 < children.len() && children[node_pos + 1] == reference {
                return;
            }

            // Detach child from its current parent
            Tree::detach_inner(&mut tree, node);

            // Re-get children after detach (it may have modified the vec)
            let children = tree.children.get_mut(parent).unwrap();

            // Find node position again (may have shifted if child was before it)
            let Some(node_pos) = children.iter().position(|&id| id == reference) else {
                return;
            };

            // Insert after the reference node
            children.insert(node_pos + 1, node);
            tree.parents.insert(node, Some(parent));
        } else {
            // Detach child from its current parent
            Tree::detach_inner(&mut tree, node);

            // Re-get children after detach (it may have modified the vec)
            let children = tree.children.get_mut(parent).unwrap();
            children.push(node);
            tree.parents.insert(node, Some(parent));
            return;
        }
        if let Some(node) = tree.nodes.get_mut(parent) {
            node.mark_dirty();
        }
    }

    pub fn insert_before(&mut self, parent: Id, node: Id, reference: Id) {
        let mut tree = self.0.write();
        // Find the position of the reference node
        let Some(children) = tree.children.get(parent) else {
            return;
        };

        let Some(node_pos) = children.iter().position(|&id| id == reference) else {
            return;
        };

        // If child is already in the correct position, do nothing
        if node_pos > 0 && children[node_pos - 1] == reference {
            return;
        }

        // Detach child from its current parent
        Tree::detach_inner(&mut tree, node);

        // Re-get children after detach (it may have modified the vec)
        let children = tree.children.get_mut(parent).unwrap();

        // Find node position again (may have shifted if child was before it)
        let node_pos = children.iter().position(|&id| id == reference).unwrap();

        // Insert before the reference node
        children.insert(node_pos, node);
        tree.parents.insert(node, Some(parent));

        if let Some(node) = tree.nodes.get_mut(parent) {
            node.mark_dirty();
        }
    }

    pub fn add_child_at_index(&mut self, node: Id, child: Id, index: usize) {
        let mut tree = self.0.write();
        if let Some(children) = tree.children.get(node) {
            if let Some(current_index) = children.iter().position(|&id| id == child) {
                if current_index == index {
                    return;
                }
            }
        }

        Tree::detach_inner(&mut tree, child);

        if let Some(children) = tree.children.get_mut(node) {
            if let Some(current_index) = children.iter().position(|&id| id == child) {
                children.remove(current_index);
                let insert_index = if current_index < index {
                    index - 1
                } else {
                    index
                };
                children.insert(insert_index.min(children.len()), child);
            } else {
                children.insert(index.min(children.len()), child);
            }

            tree.parents.insert(child, Some(node));

            if let Some(node_data) = tree.nodes.get_mut(node) {
                node_data.mark_dirty();
            }
        }
    }

    pub fn mark_dirty(&mut self, node: Id) {
        let mut tree = self.0.write();
        Self::mark_dirty_inner(&mut tree, node);
    }

    fn mark_dirty_inner(tree: &mut TreeInner, node: Id) {
        let mut current = Some(node);
        while let Some(id) = current {
            match tree.nodes[id].mark_dirty() {
                ClearState::AlreadyEmpty => break,
                ClearState::Cleared => {
                    current = tree.parents.get(id).copied().flatten();
                }
            }
        }
    }

    pub fn replace_child_at_index(&mut self, node: Id, child: Id, index: usize) -> Option<NodeRef> {
        let replaced = self.inner().children.get(node).and_then(|children| {
            if index < children.len() {
                Some(children[index])
            } else {
                None
            }
        })?;

        if replaced == child {
            let tree = Arc::clone(&self.inner_ptr());
            let deferred = Arc::clone(self.deferred_cleanup_queue());
            let nd = Arc::clone(&self.2);
            return self.nodes_mut().get_mut(replaced).map(|node| NodeRef {
                id: replaced,
                guard: node.guard.clone(),
                tree,
                deferred_cleanup: deferred,
                node_data: nd,
            });
        }

        self.detach(child);

        if let Some(children) = self.children_mut().get_mut(node) {
            children[index] = child;
        }

        self.parents_mut().remove(replaced);

        self.parents_mut().insert(child, Some(node));

        if let Some(node_data) = self.nodes_mut().get_mut(node) {
            node_data.mark_dirty();
        }

        let tree = Arc::clone(&self.inner_ptr());
        let deferred = Arc::clone(self.deferred_cleanup_queue());
        let nd = Arc::clone(&self.2);
        self.nodes_mut().get_mut(replaced).map(|node| NodeRef {
            id: replaced,
            guard: node.guard.clone(),
            tree,
            deferred_cleanup: deferred,
            node_data: nd,
        })
    }

    pub fn remove_child_at_index(&mut self, node: Id, index: usize) -> Option<NodeRef> {
        let mut tree = self.0.write();
        let tree = &mut tree;
        if let Some(children) = tree.children.get_mut(node) {
            if index < children.len() {
                let removed = children.remove(index);
                Tree::detach_inner(tree, removed);
                return Some(NodeRef {
                    id: removed,
                    guard: Arc::clone(&tree.nodes.get_mut(removed)?.guard),
                    tree: Arc::clone(self.inner_ptr()),
                    deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
                    node_data: Arc::clone(&self.2),
                });
            }
        }
        None
    }

    pub fn remove(&mut self, parent: Id, child: Id) -> Option<NodeRef> {
        let mut tree = self.0.write();
        let is_child = tree.children.get_mut(parent)?.contains(&child);
        if is_child {
            Tree::detach_inner(&mut tree, child);
            tree.nodes.get(child).map(|node| NodeRef {
                id: child,
                guard: Arc::clone(&node.guard),
                tree: Arc::clone(self.inner_ptr()),
                deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
                node_data: Arc::clone(&self.2),
            })
        } else {
            None
        }
    }

    pub fn remove_all(&mut self, parent: Id) {
        let mut tree = self.0.write();
        let tree = &mut tree;
        let mut to_remove: Option<Vec<Id>> = None;
        if let Some(children) = tree.children.get_mut(parent) {
            if children.is_empty() {
                return;
            }

            to_remove = Some(children.clone());

            children.clear();
        }

        if let Some(children) = to_remove {
            for child in children.iter() {
                tree.parents.remove(*child);
            }

            if let Some(node) = tree.nodes.get_mut(parent) {
                node.mark_dirty();
            }
        }
    }

    pub fn root(&self, node: Id) -> Option<NodeRef> {
        let mut current_id = Some(node);
        let mut last_id = current_id;

        while let Some(id) = current_id {
            last_id = Some(id);
            current_id = self.parents().get(id).copied().flatten();
        }

        last_id.and_then(|id| {
            self.nodes().get(id).map(|node_data| NodeRef {
                id,
                guard: node_data.guard.clone(),
                tree: Arc::clone(self.inner_ptr()),
                deferred_cleanup: Arc::clone(self.deferred_cleanup_queue()),
                node_data: Arc::clone(&self.2),
            })
        })
    }

    pub fn with_style<F>(&self, node: Id, func: F)
    where
        F: FnOnce(&Style),
    {
        if let Some(node) = self.nodes().get(node) {
            func(node.style());
        }
    }

    pub fn with_style_mut<F>(&mut self, node: Id, func: F)
    where
        F: FnOnce(&mut Style),
    {
        let mut scale: Option<Arc<AtomicU32>> = None;

        {
            // ......
            let tree = self.0.read();
            if let Some(node) = tree.nodes.get(node) {
                let style = node.style();
                if style.device_scale.is_none() {
                    scale = Some(Arc::clone(&tree.density))
                }
            }
        }

        let mut tree = self.0.write();
        let tree = &mut tree;
        if let Some(node) = tree.nodes.get_mut(node) {
            let style = node.style_mut();
            if let Some(scale) = scale {
                style.device_scale = Some(scale);
            }
            func(style);
            node.mark_dirty();
        }
    }
}

impl TraverseTree for Tree {}

pub struct ChildIter<'a> {
    guard: MappedRwLockReadGuard<'a, RawRwLock, Vec<Id>>,
    position: usize,
}

impl Iterator for ChildIter<'_> {
    type Item = NodeId;
    fn next(&mut self) -> Option<Self::Item> {
        if self.position < self.guard.len() {
            let item = self.guard[self.position];
            self.position += 1;
            Some(NodeId::from(item))
        } else {
            None
        }
    }
}

impl TraversePartialTree for Tree {
    type ChildIter<'a> = ChildIter<'a>;

    fn child_ids(&self, node_id: NodeId) -> Self::ChildIter<'_> {
        let guard = RwLockReadGuard::map(self.0.read(), |v| {
            return v.children.get(node_id.into()).unwrap();
        });
        ChildIter { guard, position: 0 }
    }

    fn child_count(&self, node_id: NodeId) -> usize {
        self.inner()
            .children
            .get(node_id.into())
            .map_or(0, Vec::len)
    }

    fn get_child_id(&self, node_id: NodeId, index: usize) -> NodeId {
        let tree = self.0.read();
        let children = tree.children.get(node_id.into()).unwrap();
        let child: Id = children[index];
        <Id as Into<NodeId>>::into(child)
    }
}

impl LayoutPartialTree for Tree {
    type CoreContainerStyle<'a>
        = StyleGuard<'a>
    where
        Self: 'a;
    type CustomIdent = Atom;

    fn get_core_container_style(&self, node_id: NodeId) -> Self::CoreContainerStyle<'_> {
        StyleGuard(self.style_from_id(node_id))
    }

    fn resolve_calc_value(&self, _val: *const (), _basis: f32) -> f32 {
        0.0
    }

    fn set_unrounded_layout(&mut self, node_id: NodeId, layout: &Layout) {
        // If this node is part of an inline-run we placed, preserve the manual location
        // and only merge the other layout fields. Consume pending entries as they are applied.
        let id: Id = node_id.into();
        let mut tree = self.inner_mut();
        if let Some(pos) = tree.inline_run_pending.iter().position(|&x| x == id) {
            let node = tree.node_from_id_mut(node_id);
            // preserve location, update size/metrics from the computed layout
            node.unrounded_layout.size = layout.size;
            node.unrounded_layout.content_size = layout.content_size;
            node.unrounded_layout.border = layout.border;
            node.unrounded_layout.padding = layout.padding;
            node.unrounded_layout.margin = layout.margin;
            // consume this pending entry
            tree.inline_run_pending.remove(pos);
            // if that was the last pending entry, we can clear the nesting guard
            if tree.inline_run_pending.is_empty() {
                tree.inline_run_nesting = tree.inline_run_nesting.saturating_sub(1);
            }
        } else {
            let node = tree.node_from_id_mut(node_id);
            node.unrounded_layout = *layout;
        }
    }

    fn compute_child_layout(&mut self, node_id: NodeId, inputs: LayoutInput) -> LayoutOutput {
        self.compute_block_child_layout(node_id, inputs, None)
    }
}

impl CacheTree for Tree {
    #[inline]
    fn cache_get(
        &self,
        node_id: NodeId,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
        run_mode: taffy::RunMode,
    ) -> Option<LayoutOutput> {
        self.node_from_id(node_id)
            .cache
            .get(known_dimensions, available_space, run_mode)
    }

    #[inline]
    fn cache_store(
        &mut self,
        node_id: NodeId,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
        run_mode: taffy::RunMode,
        layout_output: taffy::LayoutOutput,
    ) {
        let mut node = self.node_from_id_mut(node_id);
        node.cache
            .store(known_dimensions, available_space, run_mode, layout_output);
        node.set_node_state(false);
    }

    #[inline]
    fn cache_clear(&mut self, node_id: NodeId) {
        let mut node = self.node_from_id_mut(node_id);
        node.cache.clear();
        node.set_node_state(true);
    }
}

impl taffy::LayoutFlexboxContainer for Tree {
    type FlexboxContainerStyle<'a>
        = StyleGuard<'a>
    where
        Self: 'a;

    type FlexboxItemStyle<'a>
        = StyleGuard<'a>
    where
        Self: 'a;

    fn get_flexbox_container_style(&self, node_id: NodeId) -> Self::FlexboxContainerStyle<'_> {
        let style = self.style_from_id(node_id);
        StyleGuard(style)
    }

    fn get_flexbox_child_style(&self, child_node_id: NodeId) -> Self::FlexboxItemStyle<'_> {
        let style = self.style_from_id(child_node_id);
        StyleGuard(style)
    }
}

impl taffy::LayoutGridContainer for Tree {
    type GridContainerStyle<'a>
        = StyleGuard<'a>
    where
        Self: 'a;

    type GridItemStyle<'a>
        = StyleGuard<'a>
    where
        Self: 'a;

    fn get_grid_container_style(&self, node_id: NodeId) -> Self::GridContainerStyle<'_> {
        let style = self.style_from_id(node_id);
        StyleGuard(style)
    }

    fn get_grid_child_style(&self, child_node_id: NodeId) -> Self::GridItemStyle<'_> {
        let style = self.style_from_id(child_node_id);
        StyleGuard(style)
    }
}

impl LayoutBlockContainer for Tree {
    type BlockContainerStyle<'a>
        = StyleGuard<'a>
    where
        Self: 'a;

    type BlockItemStyle<'a>
        = StyleGuard<'a>
    where
        Self: 'a;

    fn get_block_container_style(&self, node_id: NodeId) -> Self::BlockContainerStyle<'_> {
        let style = self.style_from_id(node_id);
        StyleGuard(style)
    }

    fn get_block_child_style(&self, child_node_id: NodeId) -> Self::BlockItemStyle<'_> {
        let style = self.style_from_id(child_node_id);
        StyleGuard(style)
    }

    fn compute_block_child_layout(
        &mut self,
        node_id: NodeId,
        inputs: LayoutInput,
        block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        compute_cached_layout(self, node_id, inputs, |tree, node_id, inputs| {
            let id: Id = node_id.into();
            let (
                has_children,
                display_mode,
                display,
                padding,
                border,
                size,
                is_text_container,
                overflow,
            ) = {
                let inner = tree.0.read();
                let node = inner.nodes.get(id).unwrap();
                let style = node.style();

                let has_children = inner
                    .children
                    .get(id)
                    .map(|children| !children.is_empty())
                    .unwrap_or(false);

                (
                    has_children,
                    style.display_mode(),
                    style.get_display(),
                    style.get_padding(),
                    style.get_border(),
                    style.size(),
                    node.is_text_container(),
                    style.get_overflow(),
                )
            };

            // For scroll/auto overflow containers with auto height, constrain
            // to the parent's available height so the container doesn't expand
            // to fit all content (which would prevent scrolling).
            let mut inputs = inputs;
            let is_scroll_container_y = matches!(
                overflow.y,
                crate::style::Overflow::Scroll | crate::style::Overflow::Auto
            );
            if is_scroll_container_y
                && inputs.known_dimensions.height.is_none()
                && size.height.is_auto()
            {
                // Try available_space first, then fall back to parent_size
                if let AvailableSpace::Definite(h) = inputs.available_space.height {
                    inputs.known_dimensions.height = Some(h);
                } else if let Some(parent_h) = inputs.parent_size.height {
                    // If parent has a definite height, use it to constrain the scroll container
                    inputs.known_dimensions.height = Some(parent_h);
                    inputs.available_space.height = AvailableSpace::Definite(parent_h);
                }
            }

            match display_mode {
                DisplayMode::None => match (display, has_children) {
                    (Display::None, _) => compute_hidden_layout(tree, node_id),
                    (Display::Block, true) => {
                        let analysis = tree.analyze_subtree(id);

                        let mut computed_layout = if analysis.all_inline {
                            tree.compute_inline_layout(node_id, inputs, block_ctx)
                        } else if analysis.has_mixed_content {
                            let children =
                                tree.inner().children.get(id).cloned().unwrap_or_default();
                            tree.compute_mixed_layout(id, children.as_slice(), inputs, block_ctx)
                        } else {
                            compute_block_layout(tree, node_id, inputs, block_ctx)
                        };

                        // For scroll containers, ensure the layout height doesn't exceed
                        // the available space. content_size should retain the full content
                        // extent so native scroll views know the scrollable area.
                        if is_scroll_container_y {
                            if let Some(constrained_h) = inputs.known_dimensions.height {
                                if computed_layout.size.height > constrained_h {
                                    // content_size should be at least the computed size
                                    // to represent the full scrollable content
                                    computed_layout.content_size.height = computed_layout
                                        .content_size
                                        .height
                                        .max(computed_layout.size.height);
                                    // Clamp size to available space
                                    computed_layout.size.height = constrained_h;
                                }
                            }
                        }

                        if is_text_container {
                            if let Some(resolved_height) = size
                                .height
                                .maybe_resolve(inputs.parent_size.height, |_, _| 0.0)
                            {
                                if computed_layout.size.height < resolved_height {
                                    computed_layout.size.height = resolved_height;
                                    // set in layout cache ?
                                }
                            }
                        }

                        computed_layout
                    }
                    (Display::Flex, true) => {
                        let mut computed_layout = compute_flexbox_layout(tree, node_id, inputs);
                        // Constrain scroll container height for flex containers
                        if is_scroll_container_y {
                            if let Some(constrained_h) = inputs.known_dimensions.height {
                                if computed_layout.size.height > constrained_h {
                                    computed_layout.content_size.height = computed_layout
                                        .content_size
                                        .height
                                        .max(computed_layout.size.height);
                                    computed_layout.size.height = constrained_h;
                                }
                            }
                        }
                        computed_layout
                    }
                    (Display::Grid, true) => {
                        let mut computed_layout = compute_grid_layout(tree, node_id, inputs);
                        // Constrain scroll container height for grid containers
                        if is_scroll_container_y {
                            if let Some(constrained_h) = inputs.known_dimensions.height {
                                if computed_layout.size.height > constrained_h {
                                    computed_layout.content_size.height = computed_layout
                                        .content_size
                                        .height
                                        .max(computed_layout.size.height);
                                    computed_layout.size.height = constrained_h;
                                }
                            }
                        }
                        computed_layout
                    }
                    (_, false) => {
                        // Extract data under short locks, then drop before
                        // calling compute_leaf_layout (measure is FFI).
                        let (has_measure, style, style_size, measure) = {
                            let inner = tree.inner();
                            let node = inner.nodes.get(id).unwrap();
                            let has_measure = node.has_measure;
                            let style = node.style().clone();
                            let style_size = style.get_size();
                            let measure = tree.node_data().get(id).unwrap().copy_measure();
                            (has_measure, style, style_size, measure)
                        };

                        compute_leaf_layout(
                            inputs,
                            &style,
                            |_val, _basis| 0.0,
                            |known_dimensions, available_space| {
                                let resolved_width = known_dimensions.width.or_else(|| {
                                    style_size
                                        .width
                                        .maybe_resolve(inputs.parent_size.width, |_, _| 0.0)
                                });

                                let resolved_height = known_dimensions.height.or_else(|| {
                                    style_size
                                        .height
                                        .maybe_resolve(inputs.parent_size.height, |_, _| 0.0)
                                });

                                let final_known = Size {
                                    width: resolved_width,
                                    height: resolved_height,
                                };

                                if !has_measure {
                                    Size {
                                        width: final_known.width.unwrap_or(0.0),
                                        height: final_known.height.unwrap_or(0.0),
                                    }
                                } else {
                                    measure.measure(final_known, available_space)
                                }
                            },
                        )
                    }
                },
                DisplayMode::Inline | DisplayMode::Box => {
                    if display == Display::None {
                        return compute_hidden_layout(tree, node_id);
                    }
                    let mut computed_layout =
                        tree.compute_inline_layout(node_id, inputs, block_ctx);
                    // Constrain scroll container height for inline/box containers
                    if is_scroll_container_y {
                        if let Some(constrained_h) = inputs.known_dimensions.height {
                            if computed_layout.size.height > constrained_h {
                                computed_layout.content_size.height = computed_layout
                                    .content_size
                                    .height
                                    .max(computed_layout.size.height);
                                computed_layout.size.height = constrained_h;
                            }
                        }
                    }
                    computed_layout
                }
                DisplayMode::ListItem => {
                    // Quick path: ask the node to measure the marker (if it
                    // provides a measure function), reserve that width plus a
                    // gap for the marker, then measure/layout children with
                    // the reduced available width. Finally add the reserved
                    // width back to the computed size so the li includes the
                    // marker.

                    // Extract measure data under short locks (measure is FFI).
                    let (has_measure, measure) = {
                        let lock = tree.0.read();
                        let node = lock.nodes.get(id).unwrap();
                        let has_measure = node.has_measure;
                        let measure = if has_measure {
                            Some(tree.node_data().get(id).unwrap().copy_measure())
                        } else {
                            None
                        };
                        (has_measure, measure)
                    };

                    let marker_size = if let Some(m) = measure {
                        // Call the measure function; many native `Li`
                        // implementations return the marker size when
                        // measured.
                        m.measure(Size::NONE, inputs.available_space)
                    } else {
                        Size::ZERO
                    };

                    let marker_width = marker_size.width;
                    let marker_gap = 10.0_f32; // match native gap used in Li
                    let reserved = marker_width + marker_gap;

                    // Adjust available width for children by subtracting
                    // reserved marker space when definite.
                    let adjusted_width = inputs
                        .available_space
                        .width
                        .into_option()
                        .map(|w| (w - reserved).max(0.0));

                    let adjusted_available_width = adjusted_width
                        .map(AvailableSpace::Definite)
                        .unwrap_or(inputs.available_space.width);

                    let adjusted_inputs = LayoutInput {
                        known_dimensions: inputs.known_dimensions,
                        available_space: Size {
                            width: adjusted_available_width,
                            height: inputs.available_space.height,
                        },
                        parent_size: inputs.parent_size,
                        sizing_mode: inputs.sizing_mode,
                        ..inputs
                    };

                    let mut computed_layout = if tree.analyze_subtree(id).all_inline {
                        tree.compute_inline_layout(node_id, adjusted_inputs, block_ctx)
                    } else if tree.analyze_subtree(id).has_mixed_content {
                        let children = tree.inner().children.get(id).cloned().unwrap_or_default();
                        tree.compute_mixed_layout(
                            id,
                            children.as_slice(),
                            adjusted_inputs,
                            block_ctx,
                        )
                    } else {
                        compute_block_layout(tree, node_id, adjusted_inputs, block_ctx)
                    };

                    // Add reserved marker space back into reported size
                    computed_layout.size.width += reserved;
                    computed_layout.content_size.width += reserved;

                    // Honor explicit size on text-containers like other blocks
                    if is_text_container {
                        if let Some(resolved_height) = size
                            .height
                            .maybe_resolve(inputs.parent_size.height, |_, _| 0.0)
                        {
                            if computed_layout.size.height < resolved_height {
                                computed_layout.size.height = resolved_height;
                            }
                        }
                    }

                    computed_layout
                }
            }
        })
    }
}

impl RoundTree for Tree {
    fn get_unrounded_layout(&self, node_id: NodeId) -> Layout {
        self.node_from_id(node_id).unrounded_layout
    }

    fn set_final_layout(&mut self, node_id: NodeId, layout: &Layout) {
        self.node_from_id_mut(node_id).final_layout = *layout;
    }
}

impl PrintTree for Tree {
    fn get_debug_label(&self, node_id: NodeId) -> &'static str {
        let node = self.node_from_id(node_id);

        if node.type_ == NodeType::Image {
            return "IMAGE";
        }

        let mode = node.style().display_mode();
        if node.is_anonymous {
            if node.style().force_inline() {
                return "ANONYMOUS-INLINE";
            }

            return match mode {
                DisplayMode::None => match node.style().get_display() {
                    Display::Block => "ANONYMOUS-BLOCK",
                    Display::Flex => "ANONYMOUS-FLEX",
                    Display::Grid => "ANONYMOUS-GRID",
                    Display::None => "ANONYMOUS-NONE",
                },
                DisplayMode::Inline => {
                    if node.type_ == NodeType::Text {
                        return "ANONYMOUS-INLINE-TEXT";
                    }
                    return "ANONYMOUS-INLINE";
                }
                DisplayMode::Box => match node.style().get_display() {
                    Display::Block => "ANONYMOUS-INLINE-BLOCK",
                    Display::Flex => "ANONYMOUS-INLINE-FLEX",
                    Display::Grid => "ANONYMOUS-INLINE-GRID",
                    Display::None => "NONE",
                },
                DisplayMode::ListItem => "ANONYMOUS-LIST-ITEM",
            };
        }

        if node.style().force_inline() {
            return "INLINE";
        }

        match mode {
            DisplayMode::None => match node.style().get_display() {
                Display::Block => "BLOCK",
                Display::Flex => "FLEX",
                Display::Grid => "GRID",
                Display::None => "NONE",
            },
            DisplayMode::Inline => "INLINE",
            DisplayMode::Box => match node.style().get_display() {
                Display::Block => "INLINE-BLOCK",
                Display::Flex => "INLINE-FLEX",
                Display::Grid => "INLINE-GRID",
                Display::None => "NONE",
            },
            DisplayMode::ListItem => "LIST-ITEM",
        }
    }

    #[inline(always)]
    fn get_final_layout(&self, node_id: NodeId) -> Layout {
        self.nodes()[node_id.into()].final_layout
    }
}

#[cfg(not(target_os = "android"))]
pub fn print_tree(tree: &impl PrintTree, root: NodeId) {
    println!("TREE");
    print_node(tree, root, false, String::new());

    /// Recursive function that prints each node in the tree
    fn print_node(tree: &impl PrintTree, node_id: NodeId, has_sibling: bool, lines_string: String) {
        let layout = &tree.get_final_layout(node_id);
        let display = tree.get_debug_label(node_id);
        let num_children = tree.child_count(node_id);

        let fork_string = if has_sibling {
            "├── "
        } else {
            "└── "
        };
        println!(
            "{lines}{fork} {display} [x: {x:<4} y: {y:<4} w: {width:<4} h: {height:<4} content_w: {content_width:<4} content_h: {content_height:<4} border: l:{bl} r:{br} t:{bt} b:{bb}, padding: l:{pl} r:{pr} t:{pt} b:{pb}] ({key:?})",
            lines = lines_string,
            fork = fork_string,
            display = display,
            x = layout.location.x,
            y = layout.location.y,
            width = layout.size.width,
            height = layout.size.height,
            content_width = layout.content_size.width,
            content_height = layout.content_size.height,
            bl = layout.border.left,
            br = layout.border.right,
            bt = layout.border.top,
            bb = layout.border.bottom,
            pl = layout.padding.left,
            pr = layout.padding.right,
            pt = layout.padding.top,
            pb = layout.padding.bottom,
            key = node_id,
        );
        let bar = if has_sibling { "│   " } else { "    " };
        let new_string = lines_string + bar;

        // Recurse into children
        for (index, child) in tree.child_ids(node_id).enumerate() {
            let has_sibling = index < num_children - 1;
            print_node(tree, child, has_sibling, new_string.clone());
        }
    }
}

#[cfg(target_os = "android")]
pub fn print_tree(tree: &impl PrintTree, root: NodeId) {
    log::info!("TREE");
    print_node(tree, root, false, String::new());

    /// Recursive function that prints each node in the tree
    fn print_node(tree: &impl PrintTree, node_id: NodeId, has_sibling: bool, lines_string: String) {
        let layout = &tree.get_final_layout(node_id);
        let display = tree.get_debug_label(node_id);
        let num_children = tree.child_count(node_id);

        let fork_string = if has_sibling {
            "├── "
        } else {
            "└── "
        };

        log::info!(
            "{lines}{fork} {display} [x: {x:<4} y: {y:<4} w: {width:<4} h: {height:<4} content_w: {content_width:<4} content_h: {content_height:<4} border: l:{bl} r:{br} t:{bt} b:{bb}, padding: l:{pl} r:{pr} t:{pt} b:{pb}] ({key:?})",
            lines = lines_string,
            fork = fork_string,
            display = display,
            x = layout.location.x,
            y = layout.location.y,
            width = layout.size.width,
            height = layout.size.height,
            content_width = layout.content_size.width,
            content_height = layout.content_size.height,
            bl = layout.border.left,
            br = layout.border.right,
            bt = layout.border.top,
            bb = layout.border.bottom,
            pl = layout.padding.left,
            pr = layout.padding.right,
            pt = layout.padding.top,
            pb = layout.padding.bottom,
            key = node_id,
        );
        let bar = if has_sibling { "│   " } else { "    " };
        let new_string = lines_string + bar;

        // Recurse into children
        for (index, child) in tree.child_ids(node_id).enumerate() {
            let has_sibling = index < num_children - 1;
            print_node(tree, child, has_sibling, new_string.clone());
        }
    }
}
