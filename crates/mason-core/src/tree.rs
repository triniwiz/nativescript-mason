use crate::node::{Node, NodeData, NodeRef, NodeType};
use crate::style::{DisplayMode, Style};
use slotmap::{new_key_type, Key, KeyData, SecondaryMap, SlotMap};
use std::fmt::Debug;
use std::sync::atomic::AtomicU32;
use std::sync::Arc;
use style_atoms::Atom;
use taffy::{
    compute_block_layout, compute_cached_layout, compute_flexbox_layout, compute_grid_layout,
    compute_hidden_layout, compute_leaf_layout, compute_root_layout, round_layout, AvailableSpace,
    BlockContext, CacheTree, ClearState, CoreStyle, Display, Layout, LayoutBlockContainer,
    LayoutInput, LayoutOutput, LayoutPartialTree, MaybeResolve, NodeId, PrintTree, RoundTree, Size,
    TraversePartialTree, TraverseTree,
};

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
pub struct Tree {
    pub(crate) nodes: SlotMap<Id, Node>,
    pub(crate) parents: SecondaryMap<Id, Option<Id>>,
    pub(crate) children: SecondaryMap<Id, Vec<Id>>,
    pub(crate) node_data: SecondaryMap<Id, NodeData>,
    pub(crate) use_rounding: bool,
    // small nesting counter to avoid re-entrant inline-run aggregation
    pub(crate) inline_run_nesting: usize,
    // pending child ids for the inline run - set_unrounded_layout will consume these
    pub(crate) inline_run_pending: Vec<Id>,
    pub(crate) density: Arc<AtomicU32>,
}

impl Default for Tree {
    fn default() -> Self {
        Self::new()
    }
}

impl Tree {
    pub fn new() -> Self {
        Self {
            nodes: Default::default(),
            parents: Default::default(),
            children: Default::default(),
            node_data: Default::default(),
            use_rounding: false,
            inline_run_nesting: 0,
            inline_run_pending: Vec::new(),
            density: Arc::new(AtomicU32::new(1f32.to_bits())),
        }
    }

    pub fn with_capacity(value: usize) -> Self {
        Self {
            nodes: SlotMap::with_capacity_and_key(value),
            parents: SecondaryMap::with_capacity(value),
            children: SecondaryMap::with_capacity(value),
            node_data: SecondaryMap::with_capacity(value),
            use_rounding: false,
            inline_run_nesting: 0,
            inline_run_pending: Vec::new(),
            density: Arc::new(AtomicU32::new(1f32.to_bits())),
        }
    }

    pub fn print_tree(&self, root: Id) {
        print_tree(self, root.into());
    }

    #[inline(always)]
    fn node_from_id(&self, node_id: NodeId) -> &Node {
        self.nodes.get(node_id.into()).unwrap()
    }

    #[inline(always)]
    fn node_from_id_mut(&mut self, node_id: NodeId) -> &mut Node {
        self.nodes.get_mut(node_id.into()).unwrap()
    }

    pub fn get_node_data(&self, node_id: NodeId) -> &NodeData {
        self.node_data.get(node_id.into()).unwrap()
    }

    pub fn get_node_data_mut(&mut self, node_id: NodeId) -> &mut NodeData {
        self.node_data.get_mut(node_id.into()).unwrap()
    }

    pub fn children(&self, node_id: Id) -> Vec<NodeRef> {
        self.children
            .get(node_id)
            .map(|children| {
                children
                    .iter()
                    .map(|child| {
                        let id = *child;
                        let node = self.nodes.get(id).unwrap();
                        NodeRef {
                            id,
                            guard: node.guard.clone(),
                        }
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or(vec![])
    }

    pub fn children_id(&self, node_id: Id) -> &[Id] {
        self.children.get(node_id).unwrap()
    }

    fn analyze_subtree(&self, id: Id) -> SubtreeAnalysis {
        let mut has_children = false;
        let mut has_mixed_content = false;
        let mut all_inline = true;

        if let Some(children) = self.children.get(id) {
            has_children = !children.is_empty();

            let mut has_inline = false;
            let mut has_non_inline = false;

            for child_id in children {
                let child = &self.nodes[*child_id];
                let mode = child.style.display_mode();
                let inline_or_box_inline = matches!(mode, DisplayMode::Inline | DisplayMode::Box);
                // Fix: Check for anonymous inline blocks too
                let is_inline = child.style.force_inline() || inline_or_box_inline;

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
        // update tree rounding mode so other helpers (Tree::layout etc.) are consistent
        self.use_rounding = use_rounding;

        // reset any inline-run state before doing a full layout pass to avoid
        // stale pending entries / nesting interfering with cached layouts
        self.inline_run_pending.clear();
        self.inline_run_nesting = 0;

        compute_root_layout(self, root, available_space);

        if use_rounding {
            round_layout(self, root);
        } else {
            // Ensure final_layout mirrors unrounded_layout so prints / consumers that read
            // final_layout get the correct positions even when rounding is disabled.
            for (_id, node) in self.nodes.iter_mut() {
                node.final_layout = node.unrounded_layout;
            }
        }
    }

    pub fn layout(&self, node: Id) -> &Layout {
        let node = &self.nodes[node];
        if self.use_rounding {
            return &node.final_layout;
        }
        &node.unrounded_layout
    }

    pub fn create_node(&mut self) -> NodeRef {
        let mut node = Node::new();
        node.style.device_scale = Some(Arc::clone(&self.density));
        let guard = node.guard.clone();
        let id = self.nodes.insert(node);
        self.parents.insert(id, None);
        self.children.insert(id, Vec::new());
        self.node_data.insert(id, NodeData::default());
        NodeRef { id, guard }
    }

    pub fn create_anonymous_node(&mut self) -> NodeRef {
        let mut node = Node::new();
        node.is_anonymous = true;
        node.style.device_scale = Some(Arc::clone(&self.density));
        let guard = node.guard.clone();
        let id = self.nodes.insert(node);
        self.parents.insert(id, None);
        self.children.insert(id, Vec::new());
        self.node_data.insert(id, NodeData::default());
        NodeRef { id, guard }
    }

    pub fn create_text_node(&mut self) -> NodeRef {
        let mut node = Node::new();
        node.style.device_scale = Some(Arc::clone(&self.density));
        node.type_ = NodeType::Text;
        // we are defaulting our text element nodes to inline
        node.style.set_display_mode(DisplayMode::Inline);
        let guard = node.guard.clone();
        let id = self.nodes.insert(node);
        self.parents.insert(id, None);
        self.children.insert(id, Vec::new());
        self.node_data.insert(id, NodeData::default());
        NodeRef { id, guard }
    }

    pub fn create_anonymous_text_node(&mut self) -> NodeRef {
        // should always be inline by default
        let mut node = Node::new();
        node.style.device_scale = Some(Arc::clone(&self.density));
        node.type_ = NodeType::Text;
        node.is_anonymous = true;
        node.style.set_display_mode(DisplayMode::Inline);
        let guard = node.guard.clone();
        let id = self.nodes.insert(node);
        self.parents.insert(id, None);
        self.children.insert(id, Vec::new());
        self.node_data.insert(id, NodeData::default());
        NodeRef { id, guard }
    }

    pub fn create_image_node(&mut self) -> NodeRef {
        let mut node = Node::new();
        node.type_ = NodeType::Image;
        node.style.set_item_is_replaced(true);
        node.style.set_display_mode(DisplayMode::Inline);
        node.style.device_scale = Some(Arc::clone(&self.density));
        let guard = node.guard.clone();
        let id = self.nodes.insert(node);
        self.parents.insert(id, None);
        self.children.insert(id, Vec::new());
        self.node_data.insert(id, NodeData::default());
        NodeRef { id, guard }
    }

    pub fn create_line_break_node(&mut self) -> NodeRef {
        let mut node = Node::new();
        node.type_ = NodeType::LineBreak;
        node.style.device_scale = Some(Arc::clone(&self.density));
        let guard = node.guard.clone();
        let id = self.nodes.insert(node);
        self.parents.insert(id, None);
        self.children.insert(id, Vec::new());
        self.node_data.insert(id, NodeData::default());
        NodeRef { id, guard }
    }

    fn set_parent(&mut self, child: Id, parent: Option<Id>) -> bool {
        match self.parents.insert(child, parent) {
            Some(old_parent) => old_parent != parent,
            None => true,
        }
    }

    pub fn detach(&mut self, child: Id) {
        if let Some(Some(parent)) = self.parents.remove(child) {
            if let Some(children) = self.children.get_mut(parent) {
                children.retain(|&id| id != child);
            }
            if let Some(node) = self.nodes.get_mut(parent) {
                node.mark_dirty();
            }
        }
    }

    pub fn append(&mut self, parent: Id, child: Id) {
        self.detach(child);
        let same = self.set_parent(child, Some(parent));
        if same {
            let children = self.children.get_mut(parent).unwrap();
            children.push(child);
            self.mark_dirty(parent);
        }
    }

    pub fn append_children(&mut self, parent: Id, children: &[Id]) {
        for child in children.iter() {
            self.detach(*child);
            self.append(parent, *child);
        }
    }

    pub fn prepend(&mut self, parent: Id, child: Id) {
        self.detach(child);
        let same = self.set_parent(child, Some(parent));
        if same {
            let children = self.children.get_mut(parent).unwrap();
            children.insert(0, child);
            self.mark_dirty(parent);
        }
    }

    pub fn prepend_children(&mut self, parent: Id, children: &[Id]) {
        let has_parent = self.children.contains_key(parent);
        if has_parent {
            for child in children.iter() {
                self.detach(*child);
            }
        }
        if let Some(nodes) = self.children.get_mut(parent) {
            let mut joined = children.to_vec();
            joined.append(nodes);
            let _ = std::mem::replace(nodes, joined);
        }
    }

    pub fn child_count(&self, node: Id) -> usize {
        self.children.get(node).map_or(0, Vec::len)
    }

    pub fn child_at(&self, node: Id, index: usize) -> Option<NodeRef> {
        let children = self.children.get(node)?;
        let child_id = children.get(index)?;
        let child_node = self.nodes.get(*child_id)?;
        Some(NodeRef {
            id: *child_id,
            guard: child_node.guard.clone(),
        })
    }

    pub fn clear(&mut self) {
        self.nodes.clear();
        self.parents.clear();
        self.children.clear();
        self.node_data.clear();
    }

    pub fn is_children_same(&self, node: Id, children: &[Id]) -> bool {
        let Some(ids) = self.children.get(node) else {
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
        self.nodes
            .get(node)
            .map(|node| node.cache.is_empty())
            .unwrap_or(false)
    }

    fn reparent_then_append(&mut self, parent: Id, child: Id) {
        if let Some(Some(parent)) = self.parents.remove(child) {
            if let Some(children) = self.children.get_mut(parent) {
                children.retain(|&id| id != child);
            }
            if let Some(node) = self.nodes.get_mut(parent) {
                node.mark_dirty();
            }
        } else {
            let same = self.set_parent(child, Some(parent));
            if same {
                let children = self.children.get_mut(parent).unwrap();
                children.push(child);
                self.mark_dirty(parent);
            }
        }
    }

    fn remove_from_parent(&mut self, parent: Id, node: Id) {
        if let Some(children) = self.children.get_mut(parent) {
            if let Some(position) = children.iter().position(|&id| id == node) {
                children.remove(position);
                if let Some(node) = self.nodes.get_mut(parent) {
                    node.mark_dirty();
                }
            }
        }
    }

    pub fn insert_after(&mut self, parent: Id, node: Id, reference: Id) {
        // Find the position of the reference node
        let Some(children) = self.children.get(parent) else {
            return;
        };

        if let Some(node_pos) = children.iter().position(|&id| id == reference) {
            // If child is already in the correct position, do nothing
            if node_pos + 1 < children.len() && children[node_pos + 1] == reference {
                return;
            }

            // Detach child from its current parent
            self.detach(node);

            // Re-get children after detach (it may have modified the vec)
            let children = self.children.get_mut(parent).unwrap();

            // Find node position again (may have shifted if child was before it)
            let Some(node_pos) = children.iter().position(|&id| id == reference) else {
                return;
            };

            // Insert after the reference node
            children.insert(node_pos + 1, node);
            self.parents.insert(node, Some(parent));
        } else {
            // Detach child from its current parent
            self.detach(node);

            // Re-get children after detach (it may have modified the vec)
            let children = self.children.get_mut(parent).unwrap();
            children.push(node);
            self.parents.insert(node, Some(parent));
            return;
        }
        if let Some(node) = self.nodes.get_mut(parent) {
            node.mark_dirty();
        }
    }

    pub fn insert_before(&mut self, parent: Id, node: Id, reference: Id) {
        // Find the position of the reference node
        let Some(children) = self.children.get(parent) else {
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
        self.detach(node);

        // Re-get children after detach (it may have modified the vec)
        let children = self.children.get_mut(parent).unwrap();

        // Find node position again (may have shifted if child was before it)
        let node_pos = children.iter().position(|&id| id == reference).unwrap();

        // Insert before the reference node
        children.insert(node_pos, node);
        self.parents.insert(node, Some(parent));

        if let Some(node) = self.nodes.get_mut(parent) {
            node.mark_dirty();
        }
    }

    pub fn add_child_at_index(&mut self, node: Id, child: Id, index: usize) {
        if let Some(children) = self.children.get(node) {
            if let Some(current_index) = children.iter().position(|&id| id == child) {
                if current_index == index {
                    return;
                }
            }
        }

        self.detach(child);

        if let Some(children) = self.children.get_mut(node) {
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

            self.parents.insert(child, Some(node));

            if let Some(node_data) = self.nodes.get_mut(node) {
                node_data.mark_dirty();
            }
        }
    }

    pub fn mark_dirty(&mut self, node: Id) {
        let mut current = Some(node);
        while let Some(id) = current {
            match self.nodes[id].mark_dirty() {
                ClearState::AlreadyEmpty => break,
                ClearState::Cleared => {
                    current = self.parents.get(id).copied().flatten();
                }
            }
        }
    }

    pub fn replace_child_at_index(&mut self, node: Id, child: Id, index: usize) -> Option<NodeRef> {
        let replaced = self.children.get(node).and_then(|children| {
            if index < children.len() {
                Some(children[index])
            } else {
                None
            }
        })?;

        if replaced == child {
            return self.nodes.get_mut(replaced).map(|node| NodeRef {
                id: replaced,
                guard: node.guard.clone(),
            });
        }

        self.detach(child);

        if let Some(children) = self.children.get_mut(node) {
            children[index] = child;
        }

        self.parents.remove(replaced);

        self.parents.insert(child, Some(node));

        if let Some(node_data) = self.nodes.get_mut(node) {
            node_data.mark_dirty();
        }

        self.nodes.get_mut(replaced).map(|node| NodeRef {
            id: replaced,
            guard: node.guard.clone(),
        })
    }

    pub fn remove_child_at_index(&mut self, node: Id, index: usize) -> Option<NodeRef> {
        if let Some(children) = self.children.get_mut(node) {
            if index < children.len() {
                let removed = children.remove(index);
                self.detach(removed);
                return Some(NodeRef {
                    id: removed,
                    guard: self.nodes.get_mut(removed)?.guard.clone(),
                });
            }
        }
        None
    }

    pub fn remove(&mut self, parent: Id, child: Id) -> Option<NodeRef> {
        let is_child = self.children.get_mut(parent)?.contains(&child);
        if is_child {
            self.detach(child);
            self.nodes.get(child).map(|node| NodeRef {
                id: child,
                guard: node.guard.clone(),
            })
        } else {
            None
        }
    }

    pub fn remove_all(&mut self, parent: Id) {
        if let Some(children) = self.children.get_mut(parent) {
            if children.is_empty() {
                return;
            }

            for child in children.iter() {
                self.parents.remove(*child);
            }

            children.clear();

            if let Some(node) = self.nodes.get_mut(parent) {
                node.mark_dirty();
            }
        }
    }

    pub fn root(&self, node: Id) -> Option<NodeRef> {
        let mut current_id = Some(node);
        let mut last_id = current_id;

        while let Some(id) = current_id {
            last_id = Some(id);
            current_id = self.parents.get(id).copied().flatten();
        }

        last_id.and_then(|id| {
            self.nodes.get(id).map(|node_data| NodeRef {
                id,
                guard: node_data.guard.clone(),
            })
        })
    }

    pub fn set_style(&mut self, node: Id, style: Style) {
        if let Some(node) = self.nodes.get_mut(node) {
            node.style.copy_from(&style);
            node.mark_dirty();
        }
    }

    pub fn with_style<F>(&self, node: Id, func: F)
    where
        F: FnOnce(&Style),
    {
        if let Some(node) = self.nodes.get(node) {
            func(&node.style);
        }
    }

    pub fn with_style_mut<F>(&mut self, node: Id, func: F)
    where
        F: FnOnce(&mut Style),
    {
        if let Some(node) = self.nodes.get_mut(node) {
            if node.style.device_scale.is_none() {
                node.style.device_scale = Some(self.density.clone());
            }
            func(&mut node.style);
            node.mark_dirty();
        }
    }
}

impl TraverseTree for Tree {}

pub struct ChildIter<'a>(std::slice::Iter<'a, Id>);
impl Iterator for ChildIter<'_> {
    type Item = NodeId;
    fn next(&mut self) -> Option<Self::Item> {
        self.0.next().copied().map(NodeId::from)
    }
}

impl TraversePartialTree for Tree {
    type ChildIter<'a> = ChildIter<'a>;

    fn child_ids(&self, node_id: NodeId) -> Self::ChildIter<'_> {
        ChildIter(self.children.get(node_id.into()).unwrap().iter())
    }

    fn child_count(&self, node_id: NodeId) -> usize {
        self.children.get(node_id.into()).map_or(0, Vec::len)
    }

    fn get_child_id(&self, node_id: NodeId, index: usize) -> NodeId {
        let children = self.children.get(node_id.into()).unwrap();
        let child: Id = children[index];
        <Id as Into<NodeId>>::into(child)
    }
}

impl LayoutPartialTree for Tree {
    type CoreContainerStyle<'a>
        = &'a Style
    where
        Self: 'a;
    type CustomIdent = Atom;

    fn get_core_container_style(&self, node_id: NodeId) -> Self::CoreContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn resolve_calc_value(&self, _val: *const (), _basis: f32) -> f32 {
        0.0
    }

    fn set_unrounded_layout(&mut self, node_id: NodeId, layout: &Layout) {
        // If this node is part of an inline-run we placed, preserve the manual location
        // and only merge the other layout fields. Consume pending entries as they are applied.
        let id: Id = node_id.into();
        if let Some(pos) = self.inline_run_pending.iter().position(|&x| x == id) {
            let node = self.node_from_id_mut(node_id);
            // preserve location, update size/metrics from the computed layout
            node.unrounded_layout.size = layout.size;
            node.unrounded_layout.content_size = layout.content_size;
            node.unrounded_layout.border = layout.border;
            node.unrounded_layout.padding = layout.padding;
            node.unrounded_layout.margin = layout.margin;
            // consume this pending entry
            self.inline_run_pending.remove(pos);
            // if that was the last pending entry, we can clear the nesting guard
            if self.inline_run_pending.is_empty() {
                self.inline_run_nesting = self.inline_run_nesting.saturating_sub(1);
            }
        } else {
            let node = self.node_from_id_mut(node_id);
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
        self.node_from_id_mut(node_id).cache.store(
            known_dimensions,
            available_space,
            run_mode,
            layout_output,
        )
    }

    #[inline]
    fn cache_clear(&mut self, node_id: NodeId) {
        self.node_from_id_mut(node_id).cache.clear();
    }
}

impl taffy::LayoutFlexboxContainer for Tree {
    type FlexboxContainerStyle<'a>
        = &'a Style
    where
        Self: 'a;

    type FlexboxItemStyle<'a>
        = &'a Style
    where
        Self: 'a;

    fn get_flexbox_container_style(&self, node_id: NodeId) -> Self::FlexboxContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn get_flexbox_child_style(&self, child_node_id: NodeId) -> Self::FlexboxItemStyle<'_> {
        &self.node_from_id(child_node_id).style
    }
}

impl taffy::LayoutGridContainer for Tree {
    type GridContainerStyle<'a>
        = &'a Style
    where
        Self: 'a;

    type GridItemStyle<'a>
        = &'a Style
    where
        Self: 'a;

    fn get_grid_container_style(&self, node_id: NodeId) -> Self::GridContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn get_grid_child_style(&self, child_node_id: NodeId) -> Self::GridItemStyle<'_> {
        &self.node_from_id(child_node_id).style
    }
}

impl LayoutBlockContainer for Tree {
    type BlockContainerStyle<'a>
        = &'a Style
    where
        Self: 'a;
    type BlockItemStyle<'a>
        = &'a Style
    where
        Self: 'a;

    fn get_block_container_style(&self, node_id: NodeId) -> Self::BlockContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn get_block_child_style(&self, child_node_id: NodeId) -> Self::BlockItemStyle<'_> {
        &self.node_from_id(child_node_id).style
    }

    fn compute_block_child_layout(
        &mut self,
        node_id: NodeId,
        inputs: LayoutInput,
        block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        compute_cached_layout(self, node_id, inputs, |tree, node_id, inputs| {
            let id: Id = node_id.into();
            let has_children = tree
                .children
                .get(id)
                .map(|children| !children.is_empty())
                .unwrap_or(false);
            let (display_mode, display, padding, border, size, is_text_container) = {
                let node = tree.nodes.get(id).unwrap();
                (
                    node.style.display_mode(),
                    node.style.get_display(),
                    node.style.get_padding(),
                    node.style.get_border(),
                    node.style.size(),
                    node.is_text_container(),
                )
            };

            match display_mode {
                DisplayMode::None => match (display, has_children) {
                    (Display::None, _) => compute_hidden_layout(tree, node_id),
                    (Display::Block, true) => {
                        let analysis = tree.analyze_subtree(id);

                        let mut computed_layout = if analysis.all_inline {
                            tree.compute_inline_layout(node_id, inputs, block_ctx)
                        } else if analysis.has_mixed_content {
                            let children = tree.children.get(id).cloned().unwrap_or_default();
                            tree.compute_mixed_layout(id, children.as_slice(), inputs, block_ctx)
                        } else {
                            compute_block_layout(tree, node_id, inputs, block_ctx)
                        };

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
                    (Display::Flex, true) => compute_flexbox_layout(tree, node_id, inputs),
                    (Display::Grid, true) => compute_grid_layout(tree, node_id, inputs),
                    (_, false) => {
                        let node = tree.nodes.get(id).unwrap();
                        let has_measure = node.has_measure;
                        let style = &node.style;
                        let style_size = style.get_size();
                        let node_data = tree.node_data.get(id).unwrap();

                        compute_leaf_layout(
                            inputs,
                            style,
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
                                    node_data.measure(final_known, available_space)
                                }
                            },
                        )
                    }
                },
                DisplayMode::Inline | DisplayMode::Box => {
                    if display == Display::None {
                        return compute_hidden_layout(tree, node_id);
                    }
                    tree.compute_inline_layout(node_id, inputs, block_ctx)
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

        if node.is_anonymous {
            if node.style.force_inline() {
                return "ANONYMOUS-INLINE";
            }

            let mode = node.style.display_mode();
            return match mode {
                DisplayMode::None => match node.style.get_display() {
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
                DisplayMode::Box => match node.style.get_display() {
                    Display::Block => "ANONYMOUS-INLINE-BLOCK",
                    Display::Flex => "ANONYMOUS-INLINE-FLEX",
                    Display::Grid => "ANONYMOUS-INLINE-GRID",
                    Display::None => "NONE",
                },
            };
        }

        if node.style.force_inline() {
            return "INLINE";
        }

        let mode = node.style.display_mode();
        match mode {
            DisplayMode::None => match node.style.get_display() {
                Display::Block => "BLOCK",
                Display::Flex => "FLEX",
                Display::Grid => "GRID",
                Display::None => "NONE",
            },
            DisplayMode::Inline => "INLINE",
            DisplayMode::Box => match node.style.get_display() {
                Display::Block => "INLINE-BLOCK",
                Display::Flex => "INLINE-FLEX",
                Display::Grid => "INLINE-GRID",
                Display::None => "NONE",
            },
        }
    }

    #[inline(always)]
    fn get_final_layout(&self, node_id: NodeId) -> Layout {
        self.nodes[node_id.into()].final_layout
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
