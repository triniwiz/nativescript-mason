use crate::node::NodeType;
use crate::style::{DisplayMode, DisplaySize, FontMetrics, VerticalAlign, VerticalAlignValue};
use crate::{Id, InlineSegment, Tree};
use taffy::{
    compute_leaf_layout, AvailableSpace, BlockContext, BoxSizing, CoreStyle, Dimension, Display,
    LayoutInput, LayoutOutput, LayoutPartialTree, MaybeMath, MaybeResolve, NodeId, Point,
    ResolveOrZero, Size, SizingMode,
};
use taffy::prelude::auto;

/// Represents an item in a line during inline layout
#[derive(Clone, Debug)]
enum LineItem {
    /// Text segment with metrics
    Text {
        width: f32,
        ascent: f32,
        descent: f32,
    },
    /// Inline child (inline, inline-block, image, etc.)
    InlineChild {
        id: Id,
        width: f32,
        height: f32,
        margin_left: f32,
        margin_right: f32,
        margin_top: f32,
        margin_bottom: f32,
        baseline: f32,
        vertical_align: VerticalAlignValue,
    },
    /// Block-level child that breaks the flow
    BlockChild {
        id: Id,
        height: f32,
        width: f32,
        margin_left: f32,
        margin_right: f32,
        margin_top: f32,
        margin_bottom: f32,
    },
}

/// A completed line ready for placement
struct Line {
    items: Vec<LineItem>,
    width: f32,
    /// Parent font metrics for text-relative alignments
    parent_font: FontMetrics,
    /// Maximum ascent above baseline
    max_ascent: f32,
    /// Maximum descent below baseline
    max_descent: f32,
    /// Maximum height of top-aligned items
    max_top_height: f32,
    /// Maximum height of bottom-aligned items
    max_bottom_height: f32,
}

impl Line {
    fn new(parent_font: FontMetrics) -> Self {
        let font = parent_font.or_default();
        Self {
            items: Vec::new(),
            width: 0.0,
            parent_font: font,
            // Start with zero - only add strut contribution when text is present
            max_ascent: 0.0,
            max_descent: 0.0,
            max_top_height: 0.0,
            max_bottom_height: 0.0,
        }
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    fn height(&self) -> f32 {
        let baseline_height = self.max_ascent + self.max_descent;
        baseline_height
            .max(self.max_top_height)
            .max(self.max_bottom_height)
    }

    fn baseline(&self) -> f32 {
        self.max_ascent
    }

    fn add_text(&mut self, width: f32, ascent: f32, descent: f32) {
        self.items.push(LineItem::Text {
            width,
            ascent,
            descent,
        });
        self.width += width;
        // Text establishes the struct - ensure minimum from parent font
        self.max_ascent = self.max_ascent.max(ascent).max(self.parent_font.ascent);
        self.max_descent = self.max_descent.max(descent).max(self.parent_font.descent);
    }

    #[allow(clippy::too_many_arguments)]
    fn add_inline_child(
        &mut self,
        id: Id,
        width: f32,
        height: f32,
        margin_left: f32,
        margin_right: f32,
        margin_top: f32,
        margin_bottom: f32,
        baseline: f32,
        vertical_align: VerticalAlignValue,
        is_pure_inline: bool,
    ) {
        // For 0x0 elements, still add them but don't let them affect line metrics
        if width == 0.0 && height == 0.0 {
            self.items.push(LineItem::InlineChild {
                id,
                width,
                height,
                margin_left,
                margin_right,
                margin_top,
                margin_bottom,
                baseline,
                vertical_align,
            });
            self.width += margin_left + margin_right;
            return;
        }

        // For pure inline elements, vertical margins are ignored
        let effective_margin_top = if is_pure_inline { 0.0 } else { margin_top };
        let effective_margin_bottom = if is_pure_inline { 0.0 } else { margin_bottom };

        let total_width = margin_left + width + margin_right;
        let total_height = effective_margin_top + height + effective_margin_bottom;

        self.items.push(LineItem::InlineChild {
            id,
            width,
            height,
            margin_left,
            margin_right,
            margin_top: effective_margin_top,
            margin_bottom: effective_margin_bottom,
            baseline,
            vertical_align,
        });

        self.width += total_width;

        // Ensure we always have at least the parent font's strut
        // This establishes the text reference for text-top/text-bottom
        let font_ascent = self.parent_font.ascent;
        let font_descent = self.parent_font.descent;

        // Calculate contribution to line height based on alignment
        match vertical_align.align {
            VerticalAlign::Top => {
                // Top-aligned elements don't affect baseline metrics directly
                // They just need enough room from the top of the line
                self.max_top_height = self.max_top_height.max(total_height);
            }
            VerticalAlign::TextTop => {
                // Element's top aligns with parent font's ascender line
                // The ascender line is font_ascent above the baseline
                //
                // We need:
                // 1. At least font_ascent above baseline (for the text reference)
                // 2. If element is taller than font_ascent, the excess goes below baseline

                self.max_ascent = self.max_ascent.max(font_ascent);

                // If element extends below the ascender line
                let below_ascender = total_height - font_ascent;
                if below_ascender > 0.0 {
                    // This extends below the baseline by (below_ascender - 0) since
                    // the ascender IS at font_ascent above baseline
                    self.max_descent = self.max_descent.max(below_ascender);
                }
            }
            VerticalAlign::Bottom => {
                // Bottom-aligned elements need room from the bottom of the line
                self.max_bottom_height = self.max_bottom_height.max(total_height);
            }
            VerticalAlign::TextBottom => {
                // Element's bottom aligns with parent font's descender line
                // The descender line is font_descent below the baseline
                //
                // We need:
                // 1. At least font_descent below baseline (for the text reference)
                // 2. If element is taller than font_descent, the excess goes above baseline

                self.max_descent = self.max_descent.max(font_descent);

                // If element extends above the descender line
                let above_descender = total_height - font_descent;
                if above_descender > 0.0 {
                    self.max_ascent = self.max_ascent.max(above_descender);
                }
            }
            VerticalAlign::Baseline => {
                let offset = if vertical_align.is_percent {
                    self.parent_font.line_height() * vertical_align.offset / 100.0
                } else {
                    vertical_align.offset
                };

                let element_baseline = baseline.max(0.0);

                let ascent_contribution =
                    (height - element_baseline) + effective_margin_top + offset;
                let descent_contribution = element_baseline + effective_margin_bottom - offset;

                self.max_ascent = self.max_ascent.max(ascent_contribution.max(0.0));
                self.max_descent = self.max_descent.max(descent_contribution.max(0.0));
            }
            VerticalAlign::Sub => {
                let sub_offset = font_ascent * 0.3;
                let element_baseline = baseline.max(0.0);
                let ascent_contribution =
                    (height - element_baseline) + effective_margin_top - sub_offset;
                let descent_contribution = element_baseline + effective_margin_bottom + sub_offset;

                self.max_ascent = self.max_ascent.max(ascent_contribution.max(0.0));
                self.max_descent = self.max_descent.max(descent_contribution);
            }
            VerticalAlign::Super => {
                let super_offset = font_ascent * 0.4;
                let element_baseline = baseline.max(0.0);
                let ascent_contribution =
                    (height - element_baseline) + effective_margin_top + super_offset;
                let descent_contribution =
                    element_baseline + effective_margin_bottom - super_offset;

                self.max_ascent = self.max_ascent.max(ascent_contribution);
                self.max_descent = self.max_descent.max(descent_contribution.max(0.0));
            }
            VerticalAlign::Middle => {
                // Middle aligns the vertical midpoint of the element with
                // the baseline plus half the x-height
                let x_height = self.parent_font.x_height;
                let half_x_height = x_height / 2.0;
                let element_half_height = total_height / 2.0;

                // The middle point should be at baseline + half_x_height
                // Element extends element_half_height above and below this point
                let ascent_contribution = element_half_height + half_x_height;
                let descent_contribution = element_half_height - half_x_height;

                self.max_ascent = self.max_ascent.max(ascent_contribution.max(0.0));
                self.max_descent = self.max_descent.max(descent_contribution.max(0.0));
            }
        }
    }

    fn add_block_child(
        &mut self,
        id: Id,
        width: f32,
        height: f32,
        margin_left: f32,
        margin_right: f32,
        margin_top: f32,
        margin_bottom: f32,
    ) {
        self.items.push(LineItem::BlockChild {
            id,
            width,
            height,
            margin_left,
            margin_right,
            margin_top,
            margin_bottom,
        });
        self.max_ascent = margin_top + height + margin_bottom;
        self.max_descent = 0.0;
        self.width = width;
    }

    fn total_width(&self) -> f32 {
        self.width
    }

    fn calculate_y_position(
        &self,
        y_offset: f32,
        height: f32,
        margin_top: f32,
        margin_bottom: f32,
        baseline: f32,
        vertical_align: VerticalAlignValue,
    ) -> f32 {
        let line_height = self.height();
        let line_baseline = self.baseline();
        let font_ascent = self.parent_font.ascent;
        let font_descent = self.parent_font.descent;

        match vertical_align.align {
            VerticalAlign::Top => {
                // Top of element (including margin) at top of line
                y_offset + margin_top
            }
            VerticalAlign::TextTop => {
                // Top of element aligns with top of parent font (ascender line)
                // Ascender line is at: y_offset + line_baseline - font_ascent
                let ascender_y = y_offset + line_baseline - font_ascent;
                ascender_y + margin_top
            }
            VerticalAlign::Bottom => {
                // Bottom of element (including margin) at bottom of line
                y_offset + line_height - height - margin_bottom
            }
            VerticalAlign::TextBottom => {
                // Bottom of element aligns with bottom of parent font (descender line)
                // Descender line is at: y_offset + line_baseline + font_descent
                let descender_y = y_offset + line_baseline + font_descent;
                descender_y - height - margin_bottom
            }
            VerticalAlign::Baseline => {
                let offset = if vertical_align.is_percent {
                    self.parent_font.line_height() * vertical_align.offset / 100.0
                } else {
                    vertical_align.offset
                };

                let element_baseline = baseline.max(0.0);
                // Position so element's baseline aligns with line baseline
                y_offset + line_baseline - (height - element_baseline) - offset
            }
            VerticalAlign::Sub => {
                let sub_offset = font_ascent * 0.3;
                let element_baseline = baseline.max(0.0);
                y_offset + line_baseline - (height - element_baseline) + sub_offset
            }
            VerticalAlign::Super => {
                let super_offset = font_ascent * 0.4;
                let element_baseline = baseline.max(0.0);
                y_offset + line_baseline - (height - element_baseline) - super_offset
            }
            VerticalAlign::Middle => {
                // Middle of element aligns with baseline + half x-height
                let half_x_height = self.parent_font.x_height / 2.0;
                let middle_target_y = y_offset + line_baseline - half_x_height;
                let element_middle = height / 2.0;
                middle_target_y - element_middle + margin_top
            }
        }
    }
}

/// Prepared item for layout
#[derive(Clone, Debug)]
enum PreparedItem {
    Text {
        width: f32,
        ascent: f32,
        descent: f32,
    },
    InlineChild {
        id: Id,
        width: f32,
        height: f32,
        margin: taffy::Rect<f32>,
        baseline: f32,
        vertical_align: VerticalAlignValue,
        is_pure_inline: bool,
    },
    BlockChild {
        id: Id,
        width: f32,
        height: f32,
        margin: taffy::Rect<f32>,
    },
}

/// Context for inline formatting
struct InlineFormattingContext {
    available_width: f32,
    lines: Vec<Line>,
    current_line: Line,
    content_box_left: f32,
    content_box_top: f32,
    parent_font: FontMetrics,
}

impl InlineFormattingContext {
    fn new(
        available_width: f32,
        content_box_left: f32,
        content_box_top: f32,
        parent_font: FontMetrics,
    ) -> Self {
        Self {
            available_width,
            lines: Vec::new(),
            current_line: Line::new(parent_font),
            content_box_left,
            content_box_top,
            parent_font,
        }
    }

    fn would_overflow(&self, width: f32) -> bool {
        !self.current_line.is_empty()
            && self.available_width.is_finite()
            && self.current_line.total_width() + width > self.available_width
    }

    fn wrap_line(&mut self) {
        if !self.current_line.is_empty() {
            let line = std::mem::replace(&mut self.current_line, Line::new(self.parent_font));
            self.lines.push(line);
        }
    }

    fn add_text(&mut self, width: f32, ascent: f32, descent: f32) {
        if self.would_overflow(width) {
            self.wrap_line();
        }
        self.current_line.add_text(width, ascent, descent);
    }

    fn add_inline_child(
        &mut self,
        id: Id,
        size: Size<f32>,
        margin: taffy::Rect<f32>,
        baseline: f32,
        vertical_align: VerticalAlignValue,
        is_pure_inline: bool,
    ) {
        let total_width = margin.left + size.width + margin.right;

        if self.would_overflow(total_width) {
            self.wrap_line();
        }

        self.current_line.add_inline_child(
            id,
            size.width,
            size.height,
            margin.left,
            margin.right,
            margin.top,
            margin.bottom,
            baseline,
            vertical_align,
            is_pure_inline,
        );
    }

    fn add_block_child(&mut self, id: Id, size: Size<f32>, margin: taffy::Rect<f32>) {
        self.wrap_line();

        let mut block_line = Line::new(self.parent_font);
        block_line.add_block_child(
            id,
            size.width,
            size.height,
            margin.left,
            margin.right,
            margin.top,
            margin.bottom,
        );
        self.lines.push(block_line);
    }

    fn process_items(&mut self, items: &[PreparedItem]) {
        for item in items {
            match item {
                PreparedItem::Text {
                    width,
                    ascent,
                    descent,
                } => {
                    self.add_text(*width, *ascent, *descent);
                }
                PreparedItem::InlineChild {
                    id,
                    width,
                    height,
                    margin,
                    baseline,
                    vertical_align,
                    is_pure_inline,
                } => {
                    self.add_inline_child(
                        *id,
                        Size {
                            width: *width,
                            height: *height,
                        },
                        *margin,
                        *baseline,
                        *vertical_align,
                        *is_pure_inline,
                    );
                }
                PreparedItem::BlockChild {
                    id,
                    width,
                    height,
                    margin,
                } => {
                    self.add_block_child(
                        *id,
                        Size {
                            width: *width,
                            height: *height,
                        },
                        *margin,
                    );
                }
            }
        }
    }

    fn finalize(&mut self) -> (f32, f32, Vec<(Id, f32, f32)>) {
        self.wrap_line();

        let mut total_height = 0.0;
        let mut max_width = 0.0f32;
        let mut y_offset = self.content_box_top;
        let mut placements: Vec<(Id, f32, f32)> = Vec::new();

        for line in &self.lines {
            let line_height = line.height();

            let is_block_line = line.items.len() == 1
                && matches!(line.items.first(), Some(LineItem::BlockChild { .. }));

            if is_block_line {
                if let Some(LineItem::BlockChild {
                    id,
                    height,
                    width,
                    margin_left,
                    margin_top,
                    margin_bottom,
                    ..
                }) = line.items.first()
                {
                    let x = self.content_box_left + margin_left;
                    let y = y_offset + margin_top;
                    placements.push((*id, x, y));

                    let block_height = height + margin_top + margin_bottom;
                    total_height += block_height;
                    y_offset += block_height;
                    max_width = max_width.max(*width);
                }
            } else {
                let mut cursor_x = self.content_box_left;

                for item in &line.items {
                    match item {
                        LineItem::Text { width, .. } => {
                            cursor_x += width;
                        }
                        LineItem::InlineChild {
                            id,
                            width,
                            height,
                            margin_left,
                            margin_right,
                            margin_top,
                            margin_bottom,
                            baseline,
                            vertical_align,
                        } => {
                            // For 0x0 elements, place at top of line (y_offset)
                            // They have no visual impact but need a valid position
                            if *width == 0.0 && *height == 0.0 {
                                let y = y_offset; // Top of content area
                                let x = cursor_x + margin_left;
                                placements.push((*id, x, y));
                                // Still advance cursor by margins
                                cursor_x += margin_left + margin_right;
                                continue;
                            }

                            let y = line.calculate_y_position(
                                y_offset,
                                *height,
                                *margin_top,
                                *margin_bottom,
                                *baseline,
                                *vertical_align,
                            );

                            let x = cursor_x + margin_left;
                            placements.push((*id, x, y));
                            cursor_x += margin_left + width + margin_right;
                        }
                        LineItem::BlockChild { .. } => {}
                    }
                }

                total_height += line_height;
                y_offset += line_height;
                max_width = max_width.max(line.width);
            }
        }

        (max_width, total_height, placements)
    }
}

impl Tree {
    fn is_inline_level(&self, child_id: Id) -> bool {
        let node = &self.nodes[child_id];
        let style = &node.style;
        let display_mode = style.display_mode();

        match display_mode {
            // Inline text container or inline-block
            DisplayMode::Inline | DisplayMode::Box => true,
            DisplayMode::None => {
                // Check if it's a text node or has force_inline
                let is_text = node.type_ == NodeType::Text;
                let is_block = style.get_display() == Display::Block;
                let force_inline = style.force_inline();

                force_inline || (is_text && !is_block)
            }
        }
    }

    fn is_block_level(&self, child_id: Id) -> bool {
        !self.is_inline_level(child_id)
    }

    /// Check if a node is an empty inline text container (should have 0x0 size)
    fn is_empty_inline_text(&self, child_id: Id) -> bool {
        let node = &self.nodes[child_id];
        let style = &node.style;

        // Replaced elements (images) are never empty inline text
        if style.get_item_is_replaced() {
            return false;
        }

        // Only applies to DisplayMode::Inline (not Box/inline-block)
        if style.display_mode() != DisplayMode::Inline {
            return false;
        }

        // If it has a measure function, it's not empty (native text measurement)
        if node.has_measure {
            return false;
        }

        // Check if it has text segments
        let has_text_segments = self
            .node_data
            .get(child_id)
            .map(|data| {
                data.inline_segments()
                    .iter()
                    .any(|seg| matches!(seg, InlineSegment::Text { .. }))
            })
            .unwrap_or(false);

        if has_text_segments {
            return false;
        }

        // Check if it has inline children
        let has_inline_children = self
            .children
            .get(child_id)
            .map(|children| children.iter().any(|&c| self.is_inline_level(c)))
            .unwrap_or(false);

        !has_inline_children
    }

    /// Get the vertical alignment from child's style
    fn get_vertical_align(&self, child_id: Id) -> VerticalAlignValue {
        self.nodes[child_id].style.vertical_align()
    }

    /// Get font metrics from node's style, with inheritance fallback
    fn get_font_metrics(&self, node_id: Id) -> FontMetrics {
        let metrics = self.nodes[node_id].style.font_metrics();
        if metrics.is_set() {
            return metrics;
        }

        // Try to inherit from parent
        if let Some(Some(parent_id)) = self.parents.get(node_id) {
            let parent_metrics = self.nodes[*parent_id].style.font_metrics();
            if parent_metrics.is_set() {
                return parent_metrics;
            }
        }

        // Return default
        FontMetrics::DEFAULT
    }

    /// Get first baseline for a child element
    /// Returns the distance from the BOTTOM of the element to its baseline
    fn get_child_baseline(&self, child_id: Id) -> f32 {
        let node = &self.nodes[child_id];
        let style = &node.style;

        // 1. Check for explicit first baseline set by native platform
        if let Some(baseline) = style.first_baseline() {
            return baseline;
        }

        // 2. For replaced elements (images), baseline is at bottom
        if style.get_item_is_replaced() {
            return 0.0;
        }

        // 3. For elements with overflow != visible, baseline is at bottom
        let overflow = style.overflow();
        if overflow.x != taffy::Overflow::Visible || overflow.y != taffy::Overflow::Visible {
            return 0.0;
        }

        // 4. Check display mode to determine baseline behavior
        let display_mode = style.display_mode();

        match display_mode {
            DisplayMode::Inline => {
                // Inline text container - check for text segments
                if let Some(node_data) = self.node_data.get(child_id) {
                    let segments = node_data.inline_segments();
                    for segment in segments {
                        if let InlineSegment::Text { descent, .. } = segment {
                            // Text baseline is descent from bottom of text
                            // For a container, add padding/border
                            let layout = &node.unrounded_layout;
                            let baseline = layout.padding.bottom + layout.border.bottom + *descent;
                            return baseline;
                        }
                    }
                }

                // No text segments - try font metrics
                let metrics = style.font_metrics();
                if metrics.is_set() {
                    let layout = &node.unrounded_layout;
                    return layout.padding.bottom + layout.border.bottom + metrics.descent;
                }

                // Empty inline with no text - baseline at bottom
                0.0
            }
            DisplayMode::Box => {
                // Inline-block - try to get baseline from first inline child with text
                if let Some(children) = self.children.get(child_id) {
                    for &grandchild_id in children {
                        if self.is_inline_level(grandchild_id) {
                            let grandchild_baseline = self.get_child_baseline(grandchild_id);
                            if grandchild_baseline > 0.0 {
                                let grandchild_layout = &self.nodes[grandchild_id].unrounded_layout;
                                let this_layout = &node.unrounded_layout;

                                // Calculate baseline from bottom of this element
                                let child_bottom =
                                    grandchild_layout.location.y + grandchild_layout.size.height;
                                let this_height = this_layout.size.height;

                                return (this_height - child_bottom + grandchild_baseline).max(0.0);
                            }
                        }
                    }
                }

                // Inline-block without text children - bottom sits on baseline
                0.0
            }
            DisplayMode::None => {
                // For text nodes (NodeType::Text), use font metrics
                if node.type_ == NodeType::Text {
                    let metrics = style.font_metrics();
                    if metrics.is_set() {
                        let layout = &node.unrounded_layout;
                        return layout.padding.bottom + layout.border.bottom + metrics.descent;
                    }
                    return FontMetrics::DEFAULT.descent;
                }

                // Default: bottom sits on baseline
                0.0
            }
        }
    }

    /// Check if a node is a pure inline container (DisplayMode::Inline)
    /// Pure inline containers ignore explicit size styling and use content size
    fn is_pure_inline(&self, child_id: Id) -> bool {
        let node = &self.nodes[child_id];
        let style = &node.style;

        // Replaced elements are not pure inline
        if style.get_item_is_replaced() {
            return false;
        }

        // Must be DisplayMode::Inline (not Box/inline-block)
        if style.display_mode() != DisplayMode::Inline {
            return false;
        }

        true
    }

    /// Get the content size from inline segments for a pure inline element
    fn get_inline_content_size(&self, child_id: Id) -> Option<Size<f32>> {
        let node_data = self.node_data.get(child_id)?;
        let segments = node_data.inline_segments();

        if segments.is_empty() {
            return Some(Size::ZERO);
        }

        let mut total_width = 0.0f32;
        let mut max_ascent = 0.0f32;
        let mut max_descent = 0.0f32;

        for segment in segments {
            match segment {
                InlineSegment::Text {
                    width,
                    ascent,
                    descent,
                } => {
                    total_width += width;
                    max_ascent = max_ascent.max(*ascent);
                    max_descent = max_descent.max(*descent);
                }
                InlineSegment::InlineChild { id: Some(id), .. } => {
                    // Get child size
                    let child_size = self.nodes[*id].unrounded_layout.size;
                    total_width += child_size.width;
                    // For inline children, treat their height as contributing to line height
                    // This is simplified - proper handling would use baseline alignment
                    max_ascent = max_ascent.max(child_size.height);
                }
                InlineSegment::InlineChild { id: None, .. } => {}
            }
        }

        let height = max_ascent + max_descent;
        Some(Size {
            width: total_width,
            height,
        })
    }

    fn measure_inline_child(&mut self, child_id: Id, inputs: LayoutInput) -> LayoutOutput {
        // Check if this is a replaced element (image, video, etc.)
        let is_replaced = self.nodes[child_id].style.get_item_is_replaced();

        if is_replaced {
            // Replaced elements use their measure function or intrinsic size
            let child_node_id = NodeId::from(child_id);

            let measure_inputs = LayoutInput {
                known_dimensions: Size::NONE,
                available_space: Size {
                    width: inputs.available_space.width,
                    height: AvailableSpace::MaxContent,
                },
                sizing_mode: SizingMode::InherentSize,
                parent_size: inputs.parent_size,
                ..inputs
            };

            let layout = self.compute_child_layout(child_node_id, measure_inputs);

            if let Some(child) = self.nodes.get_mut(child_id) {
                let padding = child
                    .style
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = child
                    .style
                    .border()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

                // Content size is the layout size minus padding and border
                let content_size = Size {
                    width: (layout.size.width - padding.left - padding.right - border.left - border.right).max(0.0),
                    height: (layout.size.height - padding.top - padding.bottom - border.top - border.bottom).max(0.0),
                };

                child.unrounded_layout.location = Point::zero();
                child.unrounded_layout.border = border;
                child.unrounded_layout.size = layout.size;
                child.unrounded_layout.padding = padding;
                child.unrounded_layout.content_size = content_size;
            }

            #[cfg(target_vendor = "apple")]
            if let Some(data) = self.node_data.get_mut(child_id) {
                if let Some(node) = data.apple_data.as_mut() {
                    node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
                }
            }

            #[cfg(target_os = "android")]
            if let Some(data) = self.node_data.get_mut(child_id) {
                if let Some(node) = data.android_data.as_mut() {
                    node.set_computed_size(layout.size.width, layout.size.height);
                }
            }

            return layout;
        }
        
        // Check if this is an empty inline text container
        if self.is_empty_inline_text(child_id) {
            // Empty inline elements have 0x0 size
            if let Some(child) = self.nodes.get_mut(child_id) {
                child.unrounded_layout.location = Point::zero();
                child.unrounded_layout.size = Size::ZERO;
                child.unrounded_layout.content_size = Size::ZERO;
                child.unrounded_layout.padding = taffy::Rect::zero();
                child.unrounded_layout.border = taffy::Rect::zero();
            }

            return LayoutOutput {
                size: Size::ZERO,
                content_size: Size::ZERO,
                first_baselines: Point::NONE,
                top_margin: taffy::CollapsibleMarginSet::ZERO,
                bottom_margin: taffy::CollapsibleMarginSet::ZERO,
                margins_can_collapse_through: true,
            };
        }

        let child_node_id = NodeId::from(child_id);
        let is_pure_inline = self.is_pure_inline(child_id);

        // Check if this node has a measure function (native text measurement)
        let has_measure = self.nodes[child_id].has_measure;
        let is_text_container = self.nodes[child_id].is_text_container();

        // For text containers with measure functions, use the measure function
        // This allows native platforms to measure text
        if is_text_container && has_measure {
            // First, measure all children of this text container
            let grandchild_ids: Vec<Id> = self
                .children
                .get(child_id)
                .cloned()
                .unwrap_or_default();

            let content_available_width = inputs
                .available_space
                .width
                .into_option()
                .unwrap_or(f32::INFINITY);

            let grandchild_inputs = LayoutInput {
                known_dimensions: Size::NONE,
                available_space: Size {
                    width: AvailableSpace::Definite(content_available_width),
                    height: AvailableSpace::MaxContent,
                },
                sizing_mode: SizingMode::InherentSize,
                parent_size: Size {
                    width: Some(content_available_width),
                    height: inputs.parent_size.height,
                },
                ..inputs
            };

            // Measure all grandchildren (children of this text container)
            for &grandchild_id in &grandchild_ids {
                if self.is_inline_level(grandchild_id) {
                    self.measure_inline_child(grandchild_id, grandchild_inputs);
                } else {
                    self.measure_block_child(grandchild_id, content_available_width, inputs);
                }
            }

            let measure = self.node_data.get(child_id).unwrap().copy_measure();
            let style = self.nodes[child_id].style.clone();

            let is_inline = matches!(style.display_mode(), DisplayMode::Inline);

            let mut adjusted_style = style.clone();

            if is_inline {
                let mut size = adjusted_style.size();
                if !size.width.is_auto() && size.width.value() == 0.0 {
                    size.width = Dimension::auto();
                }
                if !size.height.is_auto() && size.height.value() == 0.0 {
                    size.height = Dimension::auto();
                }
                adjusted_style.set_size(size);
            }

            let layout = compute_leaf_layout(
                inputs,
                &adjusted_style,
                |_val, _basis| 0.0,
                |known_dimensions, available_space| {
                    let measure_known = if is_inline {
                        Size::NONE
                    } else {
                        known_dimensions
                    };
                    measure.measure(measure_known, available_space)
                },
            );

            if let Some(child) = self.nodes.get_mut(child_id) {
                let padding = child
                    .style
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = child
                    .style
                    .border()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

                child.unrounded_layout.location = Point::zero();
                child.unrounded_layout.size = layout.size;
                child.unrounded_layout.content_size = layout.content_size;
                child.unrounded_layout.padding = padding;
                child.unrounded_layout.border = border;
            }

            #[cfg(target_vendor = "apple")]
            if let Some(data) = self.node_data.get_mut(child_id) {
                if let Some(node) = data.apple_data.as_mut() {
                    node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
                }
            }

            #[cfg(target_os = "android")]
            if let Some(data) = self.node_data.get_mut(child_id) {
                if let Some(node) = data.android_data.as_mut() {
                    node.set_computed_size(layout.size.width, layout.size.height);
                }
            }

            return layout;
        }

        // For pure inline elements WITHOUT a measure function,
        // calculate size from content (segments)
        if is_pure_inline {
            if let Some(content_size) = self.get_inline_content_size(child_id) {
                // Get padding and border (these still apply to inline elements)
                let padding = self.nodes[child_id]
                    .style
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = self.nodes[child_id]
                    .style
                    .border()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

                let size = Size {
                    width: content_size.width
                        + padding.left
                        + padding.right
                        + border.left
                        + border.right,
                    height: content_size.height
                        + padding.top
                        + padding.bottom
                        + border.top
                        + border.bottom,
                };

                if let Some(child) = self.nodes.get_mut(child_id) {
                    child.unrounded_layout.location = Point::zero();
                    child.unrounded_layout.size = size;
                    child.unrounded_layout.content_size = content_size;
                    child.unrounded_layout.padding = padding;
                    child.unrounded_layout.border = border;
                }

                #[cfg(target_vendor = "apple")]
                if let Some(data) = self.node_data.get_mut(child_id) {
                    if let Some(node) = data.apple_data.as_mut() {
                        node.set_computed_size(size.width as f64, size.height as f64);
                    }
                }

                #[cfg(target_os = "android")]
                if let Some(data) = self.node_data.get_mut(child_id) {
                    if let Some(node) = data.android_data.as_mut() {
                        node.set_computed_size(size.width, size.height);
                    }
                }

                return LayoutOutput {
                    size,
                    content_size,
                    first_baselines: Point::NONE,
                    top_margin: taffy::CollapsibleMarginSet::ZERO,
                    bottom_margin: taffy::CollapsibleMarginSet::ZERO,
                    margins_can_collapse_through: false,
                };
            }
        }

        // For inline-block (DisplayMode::Box) or replaced elements, use normal layout
        let measure_inputs = LayoutInput {
            known_dimensions: Size::NONE,
            available_space: Size {
                width: inputs.available_space.width,
                height: AvailableSpace::MaxContent,
            },
            sizing_mode: SizingMode::InherentSize,
            parent_size: inputs.parent_size,
            ..inputs
        };

        let layout = self.compute_child_layout(child_node_id, measure_inputs);

        if let Some(child) = self.nodes.get_mut(child_id) {
            let padding = child
                .style
                .get_padding()
                .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
            let border = child
                .style
                .border()
                .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

            child.unrounded_layout.location = Point::zero();
            child.unrounded_layout.border = border;
            child.unrounded_layout.size = layout.size;
            child.unrounded_layout.padding = padding;
            child.unrounded_layout.content_size = Size {
                width: (layout.size.width
                    - padding.left
                    - padding.right
                    - border.left
                    - border.right)
                    .max(0.0),
                height: (layout.size.height
                    - padding.top
                    - padding.bottom
                    - border.top
                    - border.bottom)
                    .max(0.0),
            };
        }

        #[cfg(target_vendor = "apple")]
        if let Some(data) = self.node_data.get_mut(child_id) {
            if let Some(node) = data.apple_data.as_mut() {
                node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
            }
        }

        #[cfg(target_os = "android")]
        if let Some(data) = self.node_data.get_mut(child_id) {
            if let Some(node) = data.android_data.as_mut() {
                node.set_computed_size(layout.size.width, layout.size.height);
            }
        }

        layout
    }

    fn measure_block_child(
        &mut self,
        child_id: Id,
        available_width: f32,
        inputs: LayoutInput,
    ) -> LayoutOutput {
        let child_node_id = NodeId::from(child_id);

        let block_inputs = LayoutInput {
            known_dimensions: Size::NONE,
            available_space: Size {
                width: AvailableSpace::Definite(available_width),
                height: inputs.available_space.height,
            },
            parent_size: Size {
                width: Some(available_width),
                height: inputs.parent_size.height,
            },
            ..inputs
        };

        let mut layout = self.compute_child_layout(child_node_id, block_inputs);

        if layout.size.width > available_width {
            layout.size.width = available_width;
        }
        if layout.content_size.width > available_width {
            layout.content_size.width = available_width;
        }

        if let Some(child) = self.nodes.get_mut(child_id) {
            child.unrounded_layout.size = layout.size;
            child.unrounded_layout.content_size = layout.content_size;
        }

        layout
    }

    fn collect_child_info(
        &self,
        child_id: Id,
    ) -> (Size<f32>, taffy::Rect<f32>, bool, VerticalAlignValue) {
        let node = &self.nodes[child_id];
        let margin = node
            .style
            .get_margin()
            .resolve_or_zero(Size::NONE, |_v, _b| 0.0);
        let size = node.unrounded_layout.size;
        let is_block = self.is_block_level(child_id);
        let vertical_align = self.get_vertical_align(child_id);
        (size, margin, is_block, vertical_align)
    }

    pub fn compute_inline_or_mixed_layout(
        &mut self,
        node_id: NodeId,
        inputs: LayoutInput,
        _block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        let id: Id = node_id.into();
        let child_ids: Vec<Id> = self.children.get(id).cloned().unwrap_or_default();

        let (style, is_text_container, has_measure) = {
            let node = &self.nodes[id];
            (
                node.style.clone(),
                node.is_text_container(),
                node.has_measure,
            )
        };

        // Get parent font metrics for this container
        let parent_font = self.get_font_metrics(id);

        let LayoutInput {
            known_dimensions,
            parent_size,
            available_space,
            ..
        } = inputs;

        let padding = style
            .get_padding()
            .resolve_or_zero(parent_size.width, |_v, _b| 0.0);
        let border = style
            .border()
            .resolve_or_zero(parent_size.width, |_v, _b| 0.0);
        let pb = padding + border;
        let box_sizing = style.get_box_sizing();
        let box_sizing_adjustment = if box_sizing == BoxSizing::ContentBox {
            pb.sum_axes()
        } else {
            Size::ZERO
        };

        let aspect_ratio = style.aspect_ratio();
        let (_node_size, _node_min_size, _node_max_size) = match inputs.sizing_mode {
            SizingMode::ContentSize => (known_dimensions, Size::NONE, Size::NONE),
            SizingMode::InherentSize => {
                let style_size = style
                    .size()
                    .maybe_resolve(parent_size, |_v, _b| 0.0)
                    .maybe_apply_aspect_ratio(aspect_ratio)
                    .maybe_add(box_sizing_adjustment);
                let style_min_size = style
                    .min_size()
                    .maybe_resolve(parent_size, |_v, _b| 0.0)
                    .maybe_apply_aspect_ratio(aspect_ratio)
                    .maybe_add(box_sizing_adjustment);
                let style_max_size = style
                    .max_size()
                    .maybe_resolve(parent_size, |_v, _b| 0.0)
                    .maybe_add(box_sizing_adjustment);

                let node_size =
                    known_dimensions.or(style_size.maybe_clamp(style_min_size, style_max_size));
                (node_size, style_min_size, style_max_size)
            }
        };

        let content_available_width = available_space
            .width
            .into_option()
            .map(|w| (w - pb.horizontal_components().sum()).max(0.0))
            .unwrap_or(f32::INFINITY);

        if is_text_container {
            let child_inputs = LayoutInput {
                known_dimensions: Size::NONE,
                available_space: Size {
                    width: AvailableSpace::Definite(content_available_width),
                    height: AvailableSpace::MaxContent,
                },
                sizing_mode: SizingMode::InherentSize,
                parent_size: Size {
                    width: Some(content_available_width),
                    height: parent_size.height,
                },
                ..inputs
            };

            // Measure all children first
            for &child_id in &child_ids {
                if self.is_inline_level(child_id) {
                    self.measure_inline_child(child_id, child_inputs);
                } else {
                    self.measure_block_child(child_id, content_available_width, inputs);
                }
            }

            // Get segments from native text measurement
            let segments = {
                let node_data = self.node_data.get(id).unwrap();
                node_data.inline_segments().to_vec()
            };

            // If there are children, we need to position them using IFC
            if !child_ids.is_empty() {
                let mut prepared_items: Vec<PreparedItem> = Vec::new();

                // Build prepared items from segments (which include text and inline children)
                for segment in &segments {
                    match segment {
                        InlineSegment::Text { width, ascent, descent } => {
                            prepared_items.push(PreparedItem::Text {
                                width: *width,
                                ascent: *ascent,
                                descent: *descent,
                            });
                        }
                        InlineSegment::InlineChild { id: child_id_opt, baseline } => {
                            if let Some(child_id) = child_id_opt {
                                let (size, margin, _, vertical_align) = self.collect_child_info(*child_id);
                                let is_pure_inline = self.is_pure_inline(*child_id);
                                prepared_items.push(PreparedItem::InlineChild {
                                    id: *child_id,
                                    width: size.width,
                                    height: size.height,
                                    margin,
                                    baseline: *baseline,
                                    vertical_align,
                                    is_pure_inline,
                                });
                            }
                        }
                    }
                }

                // If no segments but we have children, add children directly
                if prepared_items.is_empty() {
                    for &child_id in &child_ids {
                        let (size, margin, is_block, vertical_align) = self.collect_child_info(child_id);
                        if is_block {
                            prepared_items.push(PreparedItem::BlockChild {
                                id: child_id,
                                width: size.width,
                                height: size.height,
                                margin,
                            });
                        } else {
                            let baseline = self.get_child_baseline(child_id);
                            let is_pure_inline = self.is_pure_inline(child_id);
                            prepared_items.push(PreparedItem::InlineChild {
                                id: child_id,
                                width: size.width,
                                height: size.height,
                                margin,
                                baseline,
                                vertical_align,
                                is_pure_inline,
                            });
                        }
                    }
                }

                // Run IFC to get placements
                let mut ifc = InlineFormattingContext::new(
                    content_available_width,
                    pb.left,
                    pb.top,
                    parent_font,
                );
                ifc.process_items(&prepared_items);
                let (_, _, placements) = ifc.finalize();

                // Apply placements to children
                for (child_id, x, y) in placements {
                    if let Some(node) = self.nodes.get_mut(child_id) {
                        node.unrounded_layout.location.x = x;
                        node.unrounded_layout.location.y = y;
                    }
                }
            }

            // Now use native measure for the container's size
            let measure = self.node_data.get(id).unwrap().copy_measure();
            let is_inline = matches!(style.display_mode(), DisplayMode::Inline);
            let is_block = matches!(style.get_display(), Display::Block);

            let mut adjusted_style = style.clone();
            if is_inline {
                let mut size = adjusted_style.size();
                if !size.width.is_auto() && size.width.value() == 0.0 {
                    size.width = Dimension::auto();
                }
                if !size.height.is_auto() && size.height.value() == 0.0 {
                    size.height = Dimension::auto();
                }
                adjusted_style.set_size(size);
            }

            let ret =  compute_leaf_layout(
                inputs,
                &adjusted_style,
                |_val, _basis| 0.0,
                |known_dimensions, available_space| {
                    let measure_known = if is_inline {
                        Size::NONE
                    } else {
                        known_dimensions
                    };
                    measure.measure(measure_known, available_space)
                },
            );

            // if is_block && !size.height.is_auto() {
            //     adjusted_style.set_size(
            //         Size {
            //             width: size.width,
            //             height: auto()
            //         }
            //     );
            // }

            return ret;
        }

        let segments = {
            let node_data = self.node_data.get(id).unwrap();
            node_data.inline_segments().to_vec()
        };

        if child_ids.is_empty() && segments.is_empty() {
            return if has_measure {
                let measure = self.node_data.get(id).unwrap().copy_measure();
                compute_leaf_layout(
                    inputs,
                    &style,
                    |_val, _basis| 0.0,
                    |known_dimensions, available_space| {
                        measure.measure(known_dimensions, available_space)
                    },
                )
            } else {
                compute_leaf_layout(inputs, &style, |_val, _basis| 0.0, |_, _| Size::ZERO)
            }
        }

        let child_inputs = LayoutInput {
            known_dimensions: Size::NONE,
            available_space: Size {
                width: AvailableSpace::Definite(content_available_width),
                height: AvailableSpace::MaxContent,
            },
            sizing_mode: SizingMode::InherentSize,
            parent_size: Size {
                width: Some(content_available_width),
                height: parent_size.height,
            },
            ..inputs
        };

        for &child_id in &child_ids {
            if self.is_inline_level(child_id) {
                self.measure_inline_child(child_id, child_inputs);
            } else {
                self.measure_block_child(child_id, content_available_width, inputs);
            }
        }

        let mut prepared_items: Vec<PreparedItem> = Vec::new();

        if !segments.is_empty() && child_ids.is_empty() {
            for segment in &segments {
                match segment {
                    InlineSegment::Text {
                        width,
                        ascent,
                        descent,
                    } => {
                        prepared_items.push(PreparedItem::Text {
                            width: *width,
                            ascent: *ascent,
                            descent: *descent,
                        });
                    }
                    InlineSegment::InlineChild {
                        id: child_id_opt,
                        baseline,
                    } => {
                        if let Some(child_id) = child_id_opt {
                            let (size, margin, _, vertical_align) =
                                self.collect_child_info(*child_id);
                            prepared_items.push(PreparedItem::InlineChild {
                                id: *child_id,
                                width: size.width,
                                height: size.height,
                                margin,
                                baseline: *baseline,
                                vertical_align,
                                is_pure_inline: false,
                            });
                        }
                    }
                }
            }
        } else {
            for &child_id in &child_ids {
                let (size, margin, is_block, vertical_align) = self.collect_child_info(child_id);
                if is_block {
                    prepared_items.push(PreparedItem::BlockChild {
                        id: child_id,
                        width: size.width,
                        height: size.height,
                        margin,
                    });
                } else {
                    let baseline = self.get_child_baseline(child_id);
                    let is_pure_inline = self.is_pure_inline(child_id);
                    prepared_items.push(PreparedItem::InlineChild {
                        id: child_id,
                        width: size.width,
                        height: size.height,
                        margin,
                        baseline,
                        vertical_align,
                        is_pure_inline
                    });
                }
            }
        }

        // Pass parent_font to the IFC
        let mut ifc =
            InlineFormattingContext::new(content_available_width, pb.left, pb.top, parent_font);
        ifc.process_items(&prepared_items);

        let (content_width, content_height, placements) = ifc.finalize();

        for (child_id, x, y) in placements {
            if let Some(node) = self.nodes.get_mut(child_id) {
                node.unrounded_layout.location.x = x;
                node.unrounded_layout.location.y = y;
            }
        }

        compute_leaf_layout(
            inputs,
            &style,
            |_val, _basis| 0.0,
            |_known_dimensions, _available_space| Size {
                width: content_width,
                height: content_height,
            },
        )
    }

    pub fn compute_inline_layout(
        &mut self,
        node_id: NodeId,
        inputs: LayoutInput,
        block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        self.compute_inline_or_mixed_layout(node_id, inputs, block_ctx)
    }

    pub(crate) fn compute_mixed_layout(
        &mut self,
        parent: Id,
        _child_ids: &[Id],
        inputs: LayoutInput,
        _block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        let node_id = NodeId::from(parent);
        self.compute_inline_or_mixed_layout(node_id, inputs, None)
    }
}
