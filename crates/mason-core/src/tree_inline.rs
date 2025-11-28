use crate::node::{Node, NodeType};
use crate::style::{DisplayMode, Overflow};
use crate::{Id, InlineSegment, Tree};
use slotmap::SlotMap;
use taffy::{
    compute_leaf_layout, AvailableSpace, BlockContext, BlockFormattingContext, BoxSizing,
    CollapsibleMarginSet, CoreStyle, Dimension, Display, LayoutInput, LayoutOutput,
    LayoutPartialTree, MaybeMath, MaybeResolve, NodeId, Point, ResolveOrZero, RunMode, Size,
    SizingMode,
};

impl Tree {
    /// Return true when node should be treated as inline-level or text for run detection.
    fn is_inline_or_text(&self, node_id: Id) -> bool {
        let node = &self.nodes[node_id];
        let data = &self.node_data[node_id];
        let mode = node.style.display_mode();
        let mode_inline = matches!(mode, DisplayMode::Inline | DisplayMode::Box);
        node.style.force_inline()
            || node.is_text_container() && mode_inline
            || !data.inline_segments.is_empty()
            || matches!(mode, DisplayMode::Inline | DisplayMode::Box)
    }

    pub(crate) fn compute_mixed_layout(
        &mut self,
        parent: Id,
        child_ids: &[Id],
        inputs: LayoutInput,
        block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        let parent_node = self.nodes.get(parent).unwrap();
        let style = parent_node.style.clone();
        let pb = style
            .get_padding()
            .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0)
            + style
                .get_border()
                .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

        let inline_available = inputs
            .available_space
            .width
            .into_option()
            .map(|w| (w - pb.horizontal_components().sum()).max(0.0));
        let available_width = inline_available.unwrap_or(f32::INFINITY);

        // We'll compute placement Y as pb.top + total_height so placement always
        // happens after any previously accumulated content (blocks or lines).
        let mut _y_offset = pb.top;
        let mut max_line_width = 0.0f32;
        let mut total_height = 0.0f32;

        // Pre-measure all inline children
        for &child_id in child_ids {
            let child_node = self.nodes.get(child_id).unwrap();
            let is_inline = child_node.style.display_mode() == DisplayMode::Inline
                || child_node.style.force_inline();
            if is_inline {
                let layout = self.compute_child_layout(
                    NodeId::from(child_id),
                    LayoutInput {
                        known_dimensions: Size::NONE,
                        available_space: Size {
                            width: AvailableSpace::Definite(available_width),
                            height: AvailableSpace::MaxContent,
                        },
                        parent_size: inputs.parent_size,
                        ..inputs
                    },
                );
                if let Some(child) = self.nodes.get_mut(child_id) {
                    child.unrounded_layout.size = layout.size;
                    child.unrounded_layout.location.x = 0.0;
                    child.unrounded_layout.location.y = 0.0;
                }
            }
        }

        let mut i = 0;
        while i < child_ids.len() {
            let child_id = child_ids[i];
            let child_node = self.nodes.get(child_id).unwrap();
            let is_inline = child_node.style.display_mode() == DisplayMode::Inline
                || child_node.style.force_inline();

            if is_inline {
                // Gather consecutive inlines for this line
                let mut line: Vec<(Id, f32, f32, f32)> = Vec::new();
                let mut line_width = 0.0f32;
                let mut j = i;
                while j < child_ids.len() {
                    let inline_id = child_ids[j];
                    let inline_node = self.nodes.get(inline_id).unwrap();
                    let is_inline = inline_node.style.display_mode() == DisplayMode::Inline
                        || inline_node.style.force_inline();
                    if !is_inline {
                        break;
                    }

                    let margin = inline_node
                        .style
                        .get_margin()
                        .resolve_or_zero(Size::NONE, |_v, _b| 0.0);
                    let w = inline_node.unrounded_layout.size.width;
                    let h = inline_node.unrounded_layout.size.height;
                    let seg_width = margin.left + w + margin.right;
                    let ascent = h + margin.top;
                    let descent = margin.bottom;

                    // Wrap if needed
                    if line_width + seg_width > available_width && !line.is_empty() {
                        // Place current line
                        let line_height = line.iter().map(|(_, _, a, d)| a + d).fold(0.0, f32::max);
                        let baseline = line.iter().map(|(_, _, a, _)| *a).fold(0.0, f32::max);
                        let items: Vec<_> = line
                            .iter()
                            .map(|(id, w, a, d)| (Some(*id), *w, *a, *d))
                            .collect();
                        let line_offset_y = pb.top + total_height;
                        Self::place_line_items(&mut self.nodes, &items, pb.left, line_offset_y, baseline);

                        total_height += line_height;
                        max_line_width = max_line_width.max(line_width);

                        line.clear();
                        line_width = 0.0;
                    }

                    line.push((inline_id, seg_width, ascent, descent));
                    line_width += seg_width;
                    j += 1;
                }

                // Place any remaining inlines in this line
                if !line.is_empty() {
                    let line_height = line.iter().map(|(_, _, a, d)| a + d).fold(0.0, f32::max);
                    let baseline = line.iter().map(|(_, _, a, _)| *a).fold(0.0, f32::max);
                    let items: Vec<_> = line
                        .iter()
                        .map(|(id, w, a, d)| (Some(*id), *w, *a, *d))
                        .collect();
                    let line_offset_y = pb.top + total_height;
                    Self::place_line_items(&mut self.nodes, &items, pb.left, line_offset_y, baseline);

                    total_height += line_height;
                    max_line_width = max_line_width.max(line_width);
                }

                i = j;
            } else {
                // Block: always starts on a new line
                let block_child_node_id = NodeId::from(child_id);
                let block_available_width = inline_available
                    .filter(|w| w.is_finite())
                    .or_else(|| inputs.parent_size.width.filter(|w| w.is_finite()))
                    .unwrap_or(f32::INFINITY);

                let parent_content_width = inputs
                    .available_space
                    .width
                    .into_option()
                    .map(|w| (w - pb.horizontal_components().sum()).max(0.0))
                    .unwrap_or(f32::INFINITY);

                let block_inputs = LayoutInput {
                    known_dimensions: Size::NONE,
                    available_space: Size {
                        width: AvailableSpace::Definite(parent_content_width),
                        height: inputs.available_space.height,
                    },
                    parent_size: Size {
                        width: Some(parent_content_width),
                        height: inputs.parent_size.height,
                    },
                    ..inputs
                };

                let mut block_layout = self.compute_child_layout(block_child_node_id, block_inputs);

                // Clamp the block's width and content width to the parent's content area
                if block_layout.size.width > parent_content_width {
                    block_layout.size.width = parent_content_width;
                }
                if block_layout.content_size.width > parent_content_width {
                    block_layout.content_size.width = parent_content_width;
                }

                if let Some(child) = self.nodes.get_mut(child_id) {
                    child.unrounded_layout.size = block_layout.size;
                    child.unrounded_layout.content_size = block_layout.content_size;

                    let margin = child
                        .style
                        .get_margin()
                        .resolve_or_zero(Size::NONE, |_v, _b| 0.0);
                    // Place block at the current flow position (after accumulated total_height)
                    let child_x = pb.left + margin.left;
                    let child_y = pb.top + total_height + margin.top;

                    child.unrounded_layout.location.x = child_x;
                    child.unrounded_layout.location.y = child_y;

                    let block_height = block_layout.size.height + margin.top + margin.bottom;
                    total_height += block_height;
                    max_line_width = max_line_width.max(block_layout.size.width);
                }

                i += 1;
            }
        }

        // Ensure container content covers actual child extents (y offsets, heights, margins, and rightmost edge).
        {
            let mut min_top = f32::INFINITY;
            let mut max_bottom = -f32::INFINITY;
            let mut max_right = -f32::INFINITY;

            for &child_id in child_ids {
                if let Some(child) = self.nodes.get(child_id) {
                    let margin = child
                        .style
                        .get_margin()
                        .resolve_or_zero(Size::NONE, |_v, _b| 0.0);

                    let top_with_margin = child.unrounded_layout.location.y - margin.top;
                    let bottom_with_margin =
                        child.unrounded_layout.location.y + child.unrounded_layout.size.height + margin.bottom;
                    let right_with_margin =
                        child.unrounded_layout.location.x + child.unrounded_layout.size.width + margin.right;

                    min_top = min_top.min(top_with_margin);
                    max_bottom = max_bottom.max(bottom_with_margin);
                    max_right = max_right.max(right_with_margin);
                }
            }

            if min_top.is_finite() {
                // compute extent relative to container content origin (pb.top / pb.left)
                let content_top = pb.top.min(min_top);
                let extent_height = (max_bottom - content_top).max(total_height);
                total_height = extent_height;
                max_line_width = (max_right - pb.left).max(max_line_width);
            }
        }

        LayoutOutput {
            size: Size {
                width: max_line_width + pb.horizontal_components().sum(),
                height: total_height + pb.vertical_components().sum(),
            },
            content_size: Size {
                width: max_line_width,
                height: total_height,
            },
            first_baselines: Default::default(),
            top_margin: CollapsibleMarginSet::ZERO,
            bottom_margin: CollapsibleMarginSet::ZERO,
            margins_can_collapse_through: false,
        }
    }

    fn compute_inline_layout_inner(
        &mut self,
        node_id: NodeId,
        inputs: LayoutInput,
        block_ctx: &mut BlockContext<'_>,
    ) -> LayoutOutput {
        let id: Id = node_id.into();
        // Get inline children from the layout tree
        let inline_children: Vec<Id> = self.children.get(id).cloned().unwrap_or_default();
        let style = &self.nodes[id].style;
        let LayoutInput {
            known_dimensions,
            parent_size,
            run_mode,
            available_space,
            ..
        } = inputs;

        let (margin, padding, border, box_sizing, overflow, scrollbar_width) = {
            let style = &self.nodes[id].style;
            (
                style.get_margin(),
                style.get_padding(),
                style.border(),
                style.get_box_sizing(),
                style.get_overflow(),
                style.get_scrollbar_width(),
            )
        };

        // Note: both horizontal and vertical percentage padding/borders are resolved against the container's inline size (i.e. width).
        // This is not a bug, but is how CSS is specified (see: https://developer.mozilla.org/en-US/docs/Web/CSS/padding#values)
        let margin = margin.resolve_or_zero(parent_size.width, |_v, _b| 0.0);
        let padding = padding.resolve_or_zero(parent_size.width, |_v, _b| 0.0);
        let border = border.resolve_or_zero(parent_size.width, |_v, _b| 0.0);
        let container_pb = padding + border;
        let pb_sum = container_pb.sum_axes();
        let box_sizing_adjustment = if box_sizing == BoxSizing::ContentBox {
            pb_sum
        } else {
            Size::ZERO
        };

        // Scrollbar gutters are reserved when the `overflow` property is set to `Overflow::Scroll`.
        // However, the axis are switched (transposed) because a node that scrolls vertically needs
        // *horizontal* space to be reserved for a scrollbar
        let scrollbar_gutter = overflow.transpose().map(|overflow| match overflow {
            Overflow::Scroll => scrollbar_width,
            _ => 0.0,
        });
        // TODO: make side configurable based on the `direction` property
        let mut content_box_inset = container_pb;
        content_box_inset.right += scrollbar_gutter.x;
        content_box_inset.bottom += scrollbar_gutter.y;

        // Resolve node's preferred/min/max sizes (width/heights) against the available space (percentages resolve to pixel values)
        // For ContentSize mode, we pretend that the node has no size styles as these should be ignored.
        let (node_size, node_min_size, node_max_size, aspect_ratio) = match inputs.sizing_mode {
            SizingMode::ContentSize => {
                let node_size = known_dimensions;
                let node_min_size = Size::NONE;
                let node_max_size = Size::NONE;
                (node_size, node_min_size, node_max_size, None)
            }
            SizingMode::InherentSize => {
                let aspect_ratio = style.aspect_ratio();
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
                (node_size, style_min_size, style_max_size, aspect_ratio)
            }
        };

        // Compute available space
        let available_space = Size {
            width: known_dimensions
                .width
                .map(AvailableSpace::from)
                .unwrap_or(available_space.width)
                .maybe_sub(margin.horizontal_axis_sum())
                .maybe_set(known_dimensions.width)
                .maybe_set(node_size.width)
                .map_definite_value(|size| {
                    size.maybe_clamp(node_min_size.width, node_max_size.width)
                        - content_box_inset.horizontal_axis_sum()
                }),
            height: known_dimensions
                .height
                .map(AvailableSpace::from)
                .unwrap_or(available_space.height)
                .maybe_sub(margin.vertical_axis_sum())
                .maybe_set(known_dimensions.height)
                .maybe_set(node_size.height)
                .map_definite_value(|size| {
                    size.maybe_clamp(node_min_size.height, node_max_size.height)
                        - content_box_inset.vertical_axis_sum()
                }),
        };

        // Compute size of inline boxes
        let child_inputs = LayoutInput {
            known_dimensions: Size::NONE,
            available_space,
            sizing_mode: SizingMode::InherentSize,
            parent_size: available_space.into_options(),
            ..inputs
        };

        // Pre-measure all inline children so they have layouts BEFORE the text measure is called
        for child_id in inline_children.iter() {
            let child_node_id = NodeId::from(*child_id);
            let child_node = self.nodes.get(*child_id).unwrap();

            // Block-level text nodes need constrained width for wrapping
            // Inline elements (text or otherwise) can measure at MaxContent initially
            let is_block_text = child_node.type_ == NodeType::Text
                && child_node.style.get_display() == Display::Block
                && child_node.style.display_mode() == DisplayMode::None;

            /*
            let measure_width = if is_block_text {
                inline_available_width // Block text needs to wrap within parent width
            } else {
                AvailableSpace::MaxContent // Inline elements measure naturally
            };

            let measure_width = inline_available_width;
            */

            // Measure the inline child - this will compute its layout
            let layout = self.compute_child_layout(child_node_id, child_inputs);
            // let layout = self.compute_child_layout(
            //     child_node_id,
            //     LayoutInput {
            //         known_dimensions: Size::NONE, // Let child determine its own size
            //         available_space: Size {
            //             width: measure_width,
            //             height: AvailableSpace::MaxContent,
            //         },
            //         parent_size: inputs.parent_size,
            //         ..inputs
            //     },
            // );

            // IMPORTANT: Store the layout so run delegates can read it

            if let Some(child) = self.nodes.get_mut(*child_id) {
                let padding = child
                    .style
                    .padding()
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
                    width: layout.size.width
                        - padding.left
                        - padding.right
                        - border.left
                        - border.right,
                    height: layout.size.height
                        - padding.top
                        - padding.bottom
                        - border.top
                        - border.bottom,
                };
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
        let mut style = node.style.clone();

        let measure = self.node_data.get(id).unwrap().copy_measure();
        let is_text_container = node.is_text_container();
        let has_measure = node.has_measure;

        if is_text_container {
            // Text container: call measure which will build attributed string
            // and collect segments (now inline children have their layouts)
            let ignore_known_for_inline_leaf =
                is_text_container && matches!(style.display_mode(), DisplayMode::Inline);
            if ignore_known_for_inline_leaf {
                let mut size = style.size();
                let mut dirty = false;
                if !size.width.is_auto() && size.width.value() == 0.0 {
                    size.width = Dimension::auto();
                    dirty = true;
                }

                if !size.height.is_auto() && size.height.value() == 0.0 {
                    size.height = Dimension::auto();
                    dirty = true;
                }

                if dirty {
                    style.set_size(size);
                }
            }
            return compute_leaf_layout(
                inputs,
                &style,
                |_val, _basis| 0.0,
                |known_dimensions, available_space| {
                    // Pass known_dimensions from inputs, not available_space

                    let measure_known = if ignore_known_for_inline_leaf {
                        Size::NONE
                    } else {
                        known_dimensions
                    };

                    measure.measure(measure_known, available_space)
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

                let mut current_line: Vec<(Option<Id>, f32, f32, f32)> = vec![];
                let mut current_line_width: f32 = 0.0;
                let mut max_line_width: f32 = 0.0;
                let mut total_height: f32 = 0.0;

                // Two-phase: collect lines, then place them in order after iteration.
                let mut lines: Vec<Vec<(Option<Id>, f32, f32, f32)>> = Vec::new();
                let mut line_widths: Vec<f32> = Vec::new();

                let mut finalize_line_collect =
                    |items: &mut Vec<(Option<Id>, f32, f32, f32)>,
                     line_width: &mut f32,
                     lines: &mut Vec<Vec<(Option<Id>, f32, f32, f32)>>,
                     line_widths: &mut Vec<f32>| {
                        if items.is_empty() {
                            return;
                        }
                        lines.push(items.clone());
                        line_widths.push(*line_width);
                        items.clear();
                        *line_width = 0.0;
                    };

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
                                finalize_line_collect(
                                    &mut current_line,
                                    &mut current_line_width,
                                    &mut lines,
                                    &mut line_widths,
                                );
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

                                    if segment_width > 0.0
                                        && current_line_width + segment_width > available_width
                                        && !current_line.is_empty()
                                    {
                                        finalize_line_collect(
                                            &mut current_line,
                                            &mut current_line_width,
                                            &mut lines,
                                            &mut line_widths,
                                        );
                                    }

                                    current_line.push((
                                        Some(child_id),
                                        segment_width,
                                        child_height - *descent + margin.top,
                                        *descent + margin.bottom,
                                    ));
                                    current_line_width += segment_width;
                                    max_line_width = max_line_width.max(current_line_width);
                                }
                            }
                        }
                    }
                }

                // finalize remaining (collect last line)
                finalize_line_collect(
                    &mut current_line,
                    &mut current_line_width,
                    &mut lines,
                    &mut line_widths,
                );

                // Place collected lines in order (top -> bottom). Use pb.top + total_height
                // so lines are placed after any preceding block content already accounted for.
                for (idx, line) in lines.iter().enumerate() {
                    let line_height = line.iter().map(|(_, _, a, d)| a + d).fold(0.0f32, f32::max);
                    let baseline = line.iter().map(|(_, _, a, _)| *a).fold(0.0f32, f32::max);
                    let line_offset_y = pb.top + total_height;
                    Self::place_line_items(&mut self.nodes, line, pb.left, line_offset_y, baseline);
                    total_height += line_height;
                    max_line_width = max_line_width.max(line_widths.get(idx).copied().unwrap_or(0.0));
                }

                // Ensure container content covers actual child extents (y offsets, heights, margins, and rightmost edge).
                // This handles cases where individual inline children extend beyond the summed line metrics.
                {
                    let mut min_top = f32::INFINITY;
                    let mut max_bottom = -f32::INFINITY;
                    let mut max_right = -f32::INFINITY;

                    for child_id in inline_children.iter() {
                        if let Some(child) = self.nodes.get(*child_id) {
                            let margin = child
                                .style
                                .get_margin()
                                .resolve_or_zero(Size::NONE, |_v, _b| 0.0);

                            let top_with_margin = child.unrounded_layout.location.y - margin.top;
                            let bottom_with_margin =
                                child.unrounded_layout.location.y + child.unrounded_layout.size.height + margin.bottom;
                            let right_with_margin =
                                child.unrounded_layout.location.x + child.unrounded_layout.size.width + margin.right;

                            min_top = min_top.min(top_with_margin);
                            max_bottom = max_bottom.max(bottom_with_margin);
                            max_right = max_right.max(right_with_margin);
                        }
                    }

                    if min_top.is_finite() {
                        // compute extent relative to container content origin (pb.top / pb.left)
                        let content_top = pb.top.min(min_top);
                        let extent_height = (max_bottom - content_top).max(total_height);
                        total_height = extent_height;
                        max_line_width = (max_right - pb.left).max(max_line_width);
                    }
                }

                 // (All lines have now been placed in the correct order and total_height accumulated)

                /*
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
                */


                Size {
                    width: max_line_width,
                    height: total_height,
                }
            },
        )
    }

    pub fn compute_inline_layout(
        &mut self,
        node_id: NodeId,
        inputs: LayoutInput,
        block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        let id: Id = node_id.into();

        let LayoutInput {
            known_dimensions,
            parent_size,
            run_mode,
            ..
        } = inputs;

        let (
            padding,
            border,
            padding_border_size,
            box_sizing_adjustment,
            aspect_ratio,
            min_size,
            size,
            max_size,
        ) = {
            let style = &self.nodes[id].style;
            let padding = style
                .padding()
                .resolve_or_zero(parent_size.width, |_v, _b| 0.0);
            let border = style
                .border()
                .resolve_or_zero(parent_size.width, |_v, _b| 0.0);
            let padding_border_size = (padding + border).sum_axes();
            let box_sizing_adjustment = if style.box_sizing() == BoxSizing::ContentBox {
                padding_border_size
            } else {
                Size::ZERO
            };

            (
                padding,
                border,
                padding_border_size,
                box_sizing_adjustment,
                style.aspect_ratio(),
                style.get_min_size(),
                style.get_size(),
                style.get_max_size(),
            )
        };

        // Resolve node's preferred/min/max sizes (width/heights) against the available space (percentages resolve to pixel values)
        // For ContentSize mode, we pretend that the node has no size styles as these should be ignored.
        let (clamped_style_size, min_size, max_size, _aspect_ratio) = match inputs.sizing_mode {
            SizingMode::ContentSize => {
                let node_size = known_dimensions;
                let node_min_size = Size::NONE;
                let node_max_size = Size::NONE;
                (node_size, node_min_size, node_max_size, None)
            }
            SizingMode::InherentSize => {
                let style_size = size
                    .maybe_resolve(parent_size, |_v, _b| 0.0)
                    .maybe_apply_aspect_ratio(aspect_ratio)
                    .maybe_add(box_sizing_adjustment);

                let style_min_size = min_size
                    .maybe_resolve(parent_size, |_v, _b| 0.0)
                    .maybe_apply_aspect_ratio(aspect_ratio)
                    .maybe_add(box_sizing_adjustment);
                let style_max_size = max_size
                    .maybe_resolve(parent_size, |_v, _b| 0.0)
                    .maybe_add(box_sizing_adjustment);

                let node_size =
                    known_dimensions.or(style_size.maybe_clamp(style_min_size, style_max_size));
                (node_size, style_min_size, style_max_size, aspect_ratio)
            }
        };

        // If both min and max in a given axis are set and max <= min then this determines the size in that axis
        let min_max_definite_size = min_size.zip_map(max_size, |min, max| match (min, max) {
            (Some(min), Some(max)) if max <= min => Some(min),
            _ => None,
        });

        let styled_based_known_dimensions = known_dimensions
            .or(min_max_definite_size)
            .or(clamped_style_size)
            .maybe_max(padding_border_size);

        // Short-circuit layout if the container's size is fully determined by the container's size and the run mode
        // is ComputeSize (and thus the container's size is all that we're interested in)
        if run_mode == RunMode::ComputeSize {
            if let Size {
                width: Some(width),
                height: Some(height),
            } = styled_based_known_dimensions
            {
                return LayoutOutput::from_outer_size(Size { width, height });
            }
        }

        // Unwrap the block formatting context if one was passed, or else create a new one
        match block_ctx {
            Some(inherited_bfc) => self.compute_inline_layout_inner(
                node_id,
                LayoutInput {
                    known_dimensions: styled_based_known_dimensions,
                    ..inputs
                },
                inherited_bfc,
            ),
            _ => {
                let mut root_bfc = BlockFormattingContext::new();
                let mut root_ctx = root_bfc.root_block_context();
                self.compute_inline_layout_inner(
                    node_id,
                    LayoutInput {
                        known_dimensions: styled_based_known_dimensions,
                        ..inputs
                    },
                    &mut root_ctx,
                )
            }
        }
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
                    // Skip zero-sized nodes
                    if width == 0.0 && ascent == 0.0 && descent == 0.0 {
                        continue;
                    }

                    let margin = node
                        .style
                        .get_margin()
                        .resolve_or_zero(Size::NONE, |_v, _b| 0.0);

                    // Position the child at the computed flow location. Do NOT overwrite the
                    // child's measured size here — those were set during pre-measure.
                    // Only set the location and advance the cursor.
                    let x = cursor_x + margin.left;
                    let y = offset_y + margin.top;

                    node.unrounded_layout.location.x = x;
                    node.unrounded_layout.location.y = y;

                    // Ensure content_size is present (derived from previously-measured size).
                    node.unrounded_layout.content_size.width =
                        node.unrounded_layout.content_size.width.max(0.0);
                    node.unrounded_layout.content_size.height =
                        node.unrounded_layout.content_size.height.max(0.0);

                    cursor_x += width;
                }
            } else {
                cursor_x += width;
            }
        }
    }
}
