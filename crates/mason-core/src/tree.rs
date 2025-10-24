use crate::node::{InlineSegment, Node, NodeData, NodeRef, NodeType};
use crate::style::{DisplayMode, Style};
use slotmap::{new_key_type, Key, KeyData, SecondaryMap, SlotMap};
use std::fmt::Debug;
use taffy::{
    compute_block_layout, compute_cached_layout, compute_flexbox_layout, compute_grid_layout,
    compute_hidden_layout, compute_leaf_layout, compute_root_layout, round_layout, AvailableSpace,
    CacheTree, ClearState, Display, Layout, LayoutBlockContainer, LayoutInput, LayoutOutput,
    LayoutPartialTree, MaybeResolve, NodeId, PrintTree, ResolveOrZero, RoundTree, Size,
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

#[derive(Debug)]
pub struct Tree {
    pub(crate) nodes: SlotMap<Id, Node>,
    pub(crate) parents: SecondaryMap<Id, Option<Id>>,
    pub(crate) children: SecondaryMap<Id, Vec<Id>>,
    pub(crate) node_data: SecondaryMap<Id, NodeData>,
    pub(crate) use_rounding: bool,
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
            use_rounding: true,
        }
    }

    pub fn with_capacity(value: usize) -> Self {
        Self {
            nodes: SlotMap::with_capacity_and_key(value),
            parents: SecondaryMap::with_capacity(value),
            children: SecondaryMap::with_capacity(value),
            node_data: SecondaryMap::with_capacity(value),
            use_rounding: true,
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
            .and_then(|children| {
                Some(
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
                        .collect::<Vec<_>>(),
                )
            })
            .unwrap_or(vec![])
    }

    pub fn children_id(&self, node_id: Id) -> &[Id] {
        self.children.get(node_id.into()).unwrap()
    }

    pub fn compute_layout(
        &mut self,
        root: NodeId,
        available_space: Size<AvailableSpace>,
        use_rounding: bool,
    ) {
        compute_root_layout(self, root, available_space);
        if use_rounding {
            round_layout(self, root)
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
        let node = Node::new();
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
        let guard = node.guard.clone();
        let id = self.nodes.insert(node);
        self.parents.insert(id, None);
        self.children.insert(id, Vec::new());
        self.node_data.insert(id, NodeData::default());
        NodeRef { id, guard }
    }

    pub fn create_text_node(&mut self) -> NodeRef {
        let mut node = Node::new();
        node.type_ = NodeType::Text;
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

    pub(crate) fn has_children(&self, id: Id) -> bool {
        self.children.get(id).map_or(0, Vec::len) > 0
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
        let is_child = self.children.get_mut(parent)?.iter().any(|&id| id == child);
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
            func(&mut node.style);
            node.mark_dirty();
        }
    }

    fn subtree_has_inline_descendants(&self, id: Id) -> bool {
        let mut stack: Vec<Id> = self
            .children
            .get(id)
            .map(|children| children.iter().rev().copied().collect())
            .unwrap_or_default();

        while let Some(current) = stack.pop() {
            let node = &self.nodes[current];
            let data = &self.node_data[current];
            let mode = node.style.display_mode();

            if node.style.force_inline()
                || node.is_text_container()
                || !data.inline_segments.is_empty()
                || matches!(mode, DisplayMode::Inline | DisplayMode::Box)
            {
                return true;
            }

            if let Some(children) = self.children.get(current) {
                stack.extend(children.iter().rev().copied());
            }
        }

        false
    }

    /// Return true when node should be treated as inline-level or text for run detection.
    fn is_inline_or_text(&self, node_id: Id) -> bool {
        let node = &self.nodes[node_id];
        let data = &self.node_data[node_id];
        let mode = node.style.display_mode();

        node.style.force_inline()
            || node.is_text_container()
            || !data.inline_segments.is_empty()
            || matches!(mode, DisplayMode::Inline | DisplayMode::Box)
            || node.type_ == NodeType::Text
    }
    pub fn compute_inline_layout(&mut self, node_id: NodeId, inputs: LayoutInput) -> LayoutOutput {
        let id: Id = node_id.into();

        // Get inline children from the layout tree
        let inline_children: Vec<Id> = self.children.get(id).cloned().unwrap_or_default();

        // Pre-measure all inline children so they have layouts BEFORE the text measure is called
        for child_id in inline_children.iter() {
            let child_node_id = NodeId::from(*child_id);

            // Measure the inline child - this will compute its layout
            let layout = self.compute_child_layout(
                child_node_id,
                LayoutInput {
                    known_dimensions: Size::NONE, // Let child determine its own size
                    available_space: Size {
                        width: inputs.available_space.width,
                        height: AvailableSpace::MaxContent,
                    },
                    parent_size: inputs.parent_size,
                    ..inputs
                },
            );

            // IMPORTANT: Store the layout so run delegates can read it
            if let Some(child) = self.nodes.get_mut(*child_id) {
                child.unrounded_layout.size = layout.size;
            }

            #[cfg(target_vendor = "apple")]
            if let Some(data) = self.node_data.get_mut(*child_id) {
                if let Some(node) = data.apple_data.as_mut() {
                    node.set_computed_size(layout.size.width as f64, layout.size.height as f64)
                }
            }

            #[cfg(target_os = "android")]
            if let Some(data) = self.node_data.get_mut(*child_id) {
                if let Some(node) = data.android_data.as_mut() {
                    node.set_computed_size(layout.size.width, layout.size.height)
                }
            }
        }

        // NOW call the text container's measure function
        let node = self.nodes.get(id).unwrap();
        let style = node.style.clone();
        let measure = self.node_data.get(id).unwrap().copy_measure();
        let is_text_container = node.is_text_container();
        let has_measure = node.has_measure;

        if is_text_container {
            // Text container: call measure which will build attributed string
            // and collect segments (now inline children have their layouts)
            return compute_leaf_layout(
                inputs,
                &style,
                |_val, _basis| 0.0,
                |known_dimensions, available_space| {
                    // Pass known_dimensions from inputs, not available_space
                    measure.measure(known_dimensions, available_space)
                },
            );
        }

        // Get the segments that were collected
        let segments = {
            let node_data = self.node_data.get(id).unwrap();
            node_data.inline_segments().to_vec()
        };

        // If no segments but has inline children, create segments from children
        let segments = if segments.is_empty() && !inline_children.is_empty() {
            inline_children
                .iter()
                .map(|child_id| InlineSegment::InlineChild {
                    id: Some(*child_id),
                    baseline: 0.0,
                })
                .collect::<Vec<_>>()
        } else {
            segments
        };

        // If still no segments, fallback to measure or zero
        if segments.is_empty() {
            // --- PATCH START ---
            // If this is a leaf node (no children), resolve style size as known_dimensions
            let style_size = style.get_size();
            let known_dimensions = Size {
                width: style_size
                    .width
                    .maybe_resolve(inputs.parent_size.width, |_v, _b| 0.0),
                height: style_size
                    .height
                    .maybe_resolve(inputs.parent_size.height, |_v, _b| 0.0),
            };
            // --- PATCH END ---

            return if has_measure {
                compute_leaf_layout(
                    inputs,
                    &style,
                    |_val, _basis| 0.0,
                    |_, available_space| {
                        // Use known_dimensions for leaf node
                        measure.measure(known_dimensions, available_space)
                    },
                )
            } else {
                compute_leaf_layout(
                    inputs,
                    &style,
                    |_val, _basis| 0.0,
                    |_known_dimensions, _available_space| Size {
                        width: known_dimensions.width.unwrap_or(0.0),
                        height: known_dimensions.height.unwrap_or(0.0),
                    },
                )
            };
        }

        // For non-text inline container (e.g., <span> with children)
        compute_leaf_layout(
            inputs,
            &style,
            |_val, _basis| 0.0,
            |_known_dimensions, _available_space| {
                // Don't use known_dimensions here - compute from segments
                // Calculate padding and border
                let padding = style
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = style
                    .get_border()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let pb = padding + border;

                let inline_available = inputs
                    .available_space
                    .width
                    .into_option()
                    .map(|w| (w - pb.horizontal_components().sum()).max(0.0));

                let available_width = inline_available.unwrap_or(f32::INFINITY);

                // Perform line breaking and layout inline segments
                let mut lines: Vec<Vec<(Option<Id>, f32, f32, f32)>> = vec![];
                let mut current_line: Vec<(Option<Id>, f32, f32, f32)> = vec![];
                let mut current_line_width: f32 = 0.0;
                let mut max_line_width: f32 = 0.0;
                let mut total_height: f32 = 0.0;

                for segment in segments.iter() {
                    match segment {
                        InlineSegment::Text {
                            width,
                            ascent,
                            descent,
                        } => {
                            if current_line_width + width > available_width
                                && !current_line.is_empty()
                            {
                                lines.push(current_line);
                                current_line = vec![];
                                current_line_width = 0.0;
                            }
                            current_line.push((None, *width, *ascent, *descent));
                            current_line_width += width;
                            max_line_width = max_line_width.max(current_line_width);
                        }
                        InlineSegment::InlineChild {
                            id,
                            baseline: descent,
                        } => {
                            if let Some(child_id) = id {
                                let child_id = *child_id;
                                if let Some(child) = self.nodes.get(child_id) {
                                    let child_width = child.unrounded_layout.size.width;
                                    let child_height = child.unrounded_layout.size.height;

                                    let margin = child
                                        .style
                                        .get_margin()
                                        .resolve_or_zero(Size::NONE, |_v, _b| 0.0);
                                    let segment_width = margin.left + child_width + margin.right;

                                    if current_line_width + segment_width > available_width
                                        && !current_line.is_empty()
                                    {
                                        lines.push(current_line);
                                        current_line = vec![];
                                        current_line_width = 0.0;
                                    }

                                    current_line.push((
                                        Some(child_id),
                                        segment_width,
                                        child_height - descent + margin.top,
                                        *descent + margin.bottom,
                                    ));
                                    current_line_width += segment_width;
                                    max_line_width = max_line_width.max(current_line_width);
                                }
                            }
                        }
                    }
                }

                // Add last line
                if !current_line.is_empty() {
                    lines.push(current_line);
                }

                // Calculate total height and position items
                let mut y_offset = pb.top;
                for line in lines.iter() {
                    let line_height = line
                        .iter()
                        .map(|(_, _, ascent, descent)| ascent + descent)
                        .fold(0.0f32, |a, b| a.max(b));

                    let baseline = line
                        .iter()
                        .map(|(_, _, ascent, _)| *ascent)
                        .fold(0.0f32, |a, b| a.max(b));

                    Self::place_line_items(&mut self.nodes, line, pb.left, y_offset, baseline);

                    y_offset += line_height;
                    total_height += line_height;
                }

                let is_block = matches!(style.get_display(), Display::Block);
                let is_inline_or_inline_block = style.display_mode() != DisplayMode::None;

                let resolved_width = if !is_inline_or_inline_block && is_block {
                    // Block: fill available width if present, else content width
                    inline_available
                        .or(inputs.parent_size.width)
                        .unwrap_or(max_line_width)
                } else {
                    // Inline/inline-block: shrink to fit content
                    max_line_width
                };

                Size {
                    width: resolved_width + pb.horizontal_components().sum(),
                    height: total_height + pb.vertical_components().sum(),
                }
            },
        )
    }

    /// Helper to place items in a line at their correct positions
    fn place_line_items(
        nodes: &mut SlotMap<Id, Node>,
        items: &[(Option<Id>, f32, f32, f32)], // (id, width, ascent, descent)
        offset_x: f32,
        offset_y: f32,
        baseline: f32,
    ) {
        let mut cursor_x = offset_x;
        for &(id_opt, width, ascent, descent) in items {
            if let Some(id) = id_opt {
                if let Some(node) = nodes.get_mut(id) {
                    let margin = node
                        .style
                        .get_margin()
                        .resolve_or_zero(Size::NONE, |_v, _b| 0.0);

                    let content_width = width - (margin.left + margin.right);
                    let total_height = ascent + descent;
                    let content_height = total_height - (margin.top + margin.bottom);

                    let x = cursor_x + margin.left;
                    let y = offset_y + margin.top + (baseline - ascent);

                    node.unrounded_layout.location.x = x;
                    node.unrounded_layout.location.y = y;
                    node.unrounded_layout.size.width = content_width.max(0.0);
                    node.unrounded_layout.size.height = content_height.max(0.0);

                    cursor_x = cursor_x + width;
                    continue;
                }
            }

            cursor_x += width;
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
        NodeId::from(<Id as Into<NodeId>>::into(child))
    }
}

impl LayoutPartialTree for Tree {
    type CoreContainerStyle<'a>
        = &'a Style
    where
        Self: 'a;

    fn get_core_container_style(&self, node_id: NodeId) -> Self::CoreContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn resolve_calc_value(&self, _val: *const (), _basis: f32) -> f32 {
        0.0
    }

    fn set_unrounded_layout(&mut self, node_id: NodeId, layout: &Layout) {
        self.node_from_id_mut(node_id).unrounded_layout = *layout;
    }

    fn compute_child_layout(&mut self, node_id: NodeId, inputs: LayoutInput) -> LayoutOutput {
        compute_cached_layout(self, node_id, inputs, |tree, node_id, inputs| {
            let id: Id = node_id.into();
            let node = tree.nodes.get(id).unwrap();
            let has_children = tree.has_children(id);
            let node_data = tree.node_data.get(id).unwrap();
            let force_inline = node.style.force_inline();
            let mode = node.style.display_mode();
            let has_segments = !node_data.inline_segments.is_empty();
            let is_text_container = node.is_text_container();
            // let has_inline_descendants = tree.subtree_has_inline_descendants(id);

            if force_inline || has_segments || is_text_container {
                return tree.compute_inline_layout(node_id, inputs);
            }

            match mode {
                DisplayMode::None => match (node.style.get_display(), has_children) {
                    (Display::None, _) => compute_hidden_layout(tree, node_id),
                    (Display::Block, true) => compute_block_layout(tree, node_id, inputs),
                    (Display::Flex, true) => compute_flexbox_layout(tree, node_id, inputs),
                    (Display::Grid, true) => compute_grid_layout(tree, node_id, inputs),
                    (_, false) => {
                        // LEAF NODE LAYOUT
                        let has_measure = node.has_measure;
                        let style = &node.style;

                        // Compute known dimensions from style (width/height properties)
                        let style_size = style.get_size();
                        // let known_dimensions = Size {
                        //     width: style_size
                        //         .width
                        //         .maybe_resolve(inputs.parent_size.width, |_v, _b| 0.0),
                        //     height: style_size
                        //         .height
                        //         .maybe_resolve(inputs.parent_size.height, |_v, _b| 0.0),
                        // };

                        compute_leaf_layout(
                            inputs,
                            style,
                            |_val, _basis| 0.0,
                            |known_dimensions, available_space| {
                                // Resolve style dimensions and merge with input known dimensions

                                let resolved_width = known_dimensions.width.or_else(|| {
                                    style_size.width.maybe_resolve(
                                        available_space
                                            .width
                                            .into_option()
                                            .or(inputs.parent_size.width),
                                        |_, _| 0.0,
                                    )
                                });

                                let resolved_height = known_dimensions.height.or_else(|| {
                                    style_size.height.maybe_resolve(
                                        available_space
                                            .height
                                            .into_option()
                                            .or(inputs.parent_size.height),
                                        |_, _| 0.0,
                                    )
                                });

                                let final_known = Size {
                                    width: resolved_width,
                                    height: resolved_height,
                                };

                                if !has_measure {
                                    // No measure function: return known dimensions or zero
                                    Size {
                                        width: final_known.width.unwrap_or(0.0),
                                        height: final_known.height.unwrap_or(0.0),
                                    }
                                } else {
                                    // Has measure function: call it with resolved dimensions
                                    node_data.measure(final_known, available_space)
                                }
                            },
                        )
                    }
                },
                DisplayMode::Inline | DisplayMode::Box => {
                    tree.compute_inline_layout(node_id, inputs)
                }
            }
        })
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

impl taffy::LayoutBlockContainer for Tree {
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
}

impl RoundTree for Tree {
    fn get_unrounded_layout(&self, node_id: NodeId) -> &Layout {
        &self.node_from_id(node_id).unrounded_layout
    }

    fn set_final_layout(&mut self, node_id: NodeId, layout: &Layout) {
        self.node_from_id_mut(node_id).final_layout = *layout;
    }
}

impl PrintTree for Tree {
    fn get_debug_label(&self, node_id: NodeId) -> &'static str {
        let node = self.node_from_id(node_id);

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
                DisplayMode::Inline => "ANONYMOUS-INLINE",
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
    fn get_final_layout(&self, node_id: NodeId) -> &Layout {
        &self.nodes[node_id.into()].final_layout
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
