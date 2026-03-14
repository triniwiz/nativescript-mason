use crate::node::NodeType;
use log::warn;
use crate::style::{DisplayMode, FontMetrics, VerticalAlign, VerticalAlignValue};
use crate::{Id, InlineSegment, Tree};
use taffy::{
    compute_leaf_layout, AvailableSpace, BlockContext, BoxSizing, CoreStyle, Dimension, Display,
    LayoutInput, LayoutOutput, LayoutPartialTree, MaybeMath, MaybeResolve, NodeId, Point,
    ResolveOrZero, Size, SizingMode,
};
                                
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
        is_virtual: bool,
        is_replaced: bool,
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
        is_virtual: bool,
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
        is_virtual: bool,
        is_replaced: bool,
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
                is_virtual,
                is_replaced,
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
            is_virtual,
            is_replaced,
        });

        self.width += total_width;

        // If this child is marked virtual (detached), it should not affect
        // the parent's line height calculations. Keep its size valid but
        // skip updating ascent/descent/top/bottom metrics.
        if is_virtual {
            return;
        }

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

                let element_baseline = baseline.max(0.0).min(height);

                let ascent_contribution =
                    (height - element_baseline) + effective_margin_top + offset;
                let descent_contribution = element_baseline + effective_margin_bottom - offset;

                self.max_ascent = self.max_ascent.max(ascent_contribution.max(0.0));
                self.max_descent = self.max_descent.max(descent_contribution.max(0.0));
            }
            VerticalAlign::Sub => {
                let sub_offset = font_ascent * 0.3;
                let element_baseline = baseline.max(0.0).min(height);
                let ascent_contribution =
                    (height - element_baseline) + effective_margin_top - sub_offset;
                let descent_contribution = element_baseline + effective_margin_bottom + sub_offset;

                self.max_ascent = self.max_ascent.max(ascent_contribution.max(0.0));
                self.max_descent = self.max_descent.max(descent_contribution);
            }
            VerticalAlign::Super => {
                let super_offset = font_ascent * 0.4;
                let element_baseline = baseline.max(0.0).min(height);
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
        is_virtual: bool,
    ) {
        self.items.push(LineItem::BlockChild {
            id,
            width,
            height,
            margin_left,
            margin_right,
            margin_top,
            margin_bottom,
            is_virtual,
        });

        // If virtual, do not let this block child affect the parent's
        // computed line height or width. Its own layout remains valid.
        if is_virtual {
            return;
        }

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

                let element_baseline = baseline.max(0.0).min(height);
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
        is_virtual: bool,
        is_replaced: bool,
    },
    BlockChild {
        id: Id,
        width: f32,
        height: f32,
        margin: taffy::Rect<f32>,
        is_virtual: bool,
    },
    /// Explicit line break (e.g. <br>)
    LineBreak,
}

/// Context for inline formatting
struct InlineFormattingContext {
    available_width: f32,
    lines: Vec<Line>,
    current_line: Line,
    content_box_left: f32,
    content_box_top: f32,
    parent_font: FontMetrics,
    text_align: taffy::TextAlign,
    base_available: f32,
    content_box_left_base: f32,
    float_rects: Vec<taffy::Rect<f32>>,
}

impl InlineFormattingContext {
    fn new(
        available_width: f32,
        content_box_left: f32,
        content_box_top: f32,
        parent_font: FontMetrics,
        text_align: taffy::TextAlign,
        float_rects: Vec<taffy::Rect<f32>>,
    ) -> Self {
        let mut s = Self {
            available_width,
            lines: Vec::new(),
            current_line: Line::new(parent_font),
            content_box_left: content_box_left,
            content_box_top,
            parent_font,
            text_align,
            base_available: available_width,
            content_box_left_base: content_box_left,
            float_rects,
        };

        // Initialize available width for the first line
        s.update_available_for_current_line();
        s
    }

    fn current_y_offset(&self) -> f32 {
        let mut sum = 0.0_f32;
        for line in &self.lines {
            sum += line.height();
        }
        sum + self.content_box_top
    }

    fn update_available_for_current_line(&mut self) {
        let y = self.current_y_offset();
        let mut left_occupied = 0.0_f32;
        let mut right_occupied = 0.0_f32;
        for fr in &self.float_rects {
            if fr.top <= y && fr.top + fr.bottom > y {
                if fr.left <= self.content_box_left_base + 0.1 {
                    left_occupied += fr.right;
                } else {
                    right_occupied += fr.right;
                }
            }
        }

        if self.base_available.is_finite() {
            self.available_width = (self.base_available - left_occupied - right_occupied).max(0.0);
        } else {
            self.available_width = self.base_available;
        }
        self.content_box_left = self.content_box_left_base + left_occupied;
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

    /// Force a line break even if the current line is empty (for <br>)
    fn line_break(&mut self) {
        let mut line = std::mem::replace(&mut self.current_line, Line::new(self.parent_font));

        // If the line is empty, ensure it still contributes the parent's strut
        if line.is_empty() {
            line.max_ascent = line.max_ascent.max(self.parent_font.ascent);
            line.max_descent = line.max_descent.max(self.parent_font.descent);
        }

        self.lines.push(line);
    }

    fn add_text(&mut self, width: f32, ascent: f32, descent: f32) {
        // update available width for the current line before measuring overflow
        self.update_available_for_current_line();
        // If the incoming text run is wider than the available width and we
        // have a finite available width, split it across multiple lines so
        // that a single measured run cannot create a single giant line.
        if self.available_width.is_finite() && width > self.available_width && self.available_width > 0.0 {
            let mut remaining = width;
            let piece = self.available_width;

            while remaining > 0.0 {
                // If current line already has content and adding a piece would overflow,
                // wrap to a new line first.
                if self.would_overflow(piece) {
                    self.wrap_line();
                    self.update_available_for_current_line();
                }

                // If available width is non-positive after update, append remaining as-is.
                if !self.available_width.is_finite() || self.available_width <= 0.0 {
                    self.current_line.add_text(remaining, ascent, descent);
                    remaining = 0.0;
                    break;
                }

                let take = remaining.min(self.available_width);
                self.current_line.add_text(take, ascent, descent);
                remaining -= take;

                // After consuming a piece, if there is still remaining text, force a wrap
                // so the remainder moves to the next line.
                if remaining > 0.0 {
                    self.wrap_line();
                    self.update_available_for_current_line();
                }
            }
        } else {
            if self.would_overflow(width) {
                self.wrap_line();
                self.update_available_for_current_line();
            }
            self.current_line.add_text(width, ascent, descent);
        }
    }

    fn add_inline_child(
        &mut self,
        id: Id,
        size: Size<f32>,
        margin: &taffy::Rect<f32>,
        baseline: f32,
        vertical_align: VerticalAlignValue,
        is_pure_inline: bool,
        is_virtual: bool,
        is_replaced: bool,
    ) {
        let total_width = margin.left + size.width + margin.right;
        self.update_available_for_current_line();
        if self.would_overflow(total_width) {
            self.wrap_line();
            self.update_available_for_current_line();
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
            is_virtual,
            is_replaced,
        );
    }

    fn add_block_child(&mut self, id: Id, size: Size<f32>, margin: taffy::Rect<f32>) {
        // Block children always start on a fresh line
        self.wrap_line();
        self.update_available_for_current_line();

        let mut block_line = Line::new(self.parent_font);
        block_line.add_block_child(
            id,
            size.width,
            size.height,
            margin.left,
            margin.right,
            margin.top,
            margin.bottom,
            false,
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
                PreparedItem::LineBreak => {
                    self.line_break();
                }
                PreparedItem::InlineChild {
                    id,
                    width,
                    height,
                    margin,
                    baseline,
                    vertical_align,
                    is_pure_inline,
                    is_virtual,
                    is_replaced,
                    } => {
                    self.add_inline_child(
                        *id,
                        Size {
                            width: *width,
                            height: *height,
                        },
                        margin,
                        *baseline,
                        *vertical_align,
                        *is_pure_inline,
                        *is_virtual,
                        *is_replaced,
                    );
                }
                PreparedItem::BlockChild {
                    id,
                    width,
                    height,
                    margin,
                    is_virtual,
                } => {
                    self.add_block_child(
                        *id,
                        Size {
                            width: *width,
                            height: *height,
                        },
                        *margin,
                    );
                    // Mark virtual on the block line item so finalize logic can
                    // skip its contribution (we still set layout on the child).
                    if *is_virtual {
                        if let Some(last) = self.lines.last_mut() {
                            if let Some(line_item) = last.items.last_mut() {
                                if let LineItem::BlockChild { is_virtual: v, .. } = line_item {
                                    *v = true;
                                }
                            }
                        }
                    }
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

        for (li, line) in self.lines.iter().enumerate() {
            // Compute a conservative text-derived ascent/descent baseline
            // to avoid runaway contributions from oversized inline children.
            let mut text_ascent = 0.0f32;
            let mut text_descent = 0.0f32;
            for it in &line.items {
                match it {
                    LineItem::Text { ascent, descent, .. } => {
                        text_ascent = text_ascent.max(*ascent);
                        text_descent = text_descent.max(*descent);
                    }
                    _ => {}
                }
            }

            // If no text segments present, fall back to the line's parent font
            if text_ascent == 0.0 {
                text_ascent = line.parent_font.ascent;
            }
            if text_descent == 0.0 {
                text_descent = line.parent_font.descent;
            }

            log::warn!(
                "IFC finalize line={} text_ascent={} text_ascent_bits=0x{:08x} text_descent={} text_descent_bits=0x{:08x} parent_font_ascent={} pf_asc_bits=0x{:08x} parent_font_descent={} pf_desc_bits=0x{:08x}",
                li,
                text_ascent,
                text_ascent.to_bits(),
                text_descent,
                text_descent.to_bits(),
                line.parent_font.ascent,
                line.parent_font.ascent.to_bits(),
                line.parent_font.descent,
                line.parent_font.descent.to_bits(),
            );

            // Allow larger inline elements (drop-caps, inline-blocks) to
            // increase the ascent/descent. By default we cap their contribution
            // to a reasonable multiplier of the text metrics to prevent
            // pathological outliers producing enormous line heights. However,
            // when the line actually contains a large inline child (e.g. an
            // inline image), treat its contribution as authoritative and do
            // not apply the cap so replaced elements can contribute full size.
            let allowed_mult = 6.0f32;
            let allowed_ascent = text_ascent * allowed_mult;
            let allowed_descent = text_descent * allowed_mult;

            // If any inline child in this line is significantly larger than
            // the parent font, assume it's a replaced element (image/video)
            // and skip the sanitizer cap so it contributes its full height.
            let mut has_large_inline_child = false;
            for it in &line.items {
                if let LineItem::InlineChild { is_replaced, .. } = it {
                    if *is_replaced {
                        has_large_inline_child = true;
                        break;
                    }
                }
            }

            let sanitized_max_ascent = if has_large_inline_child {
                line.max_ascent
            } else {
                line.max_ascent.min(allowed_ascent)
            };

            let sanitized_max_descent = if has_large_inline_child {
                line.max_descent
            } else {
                line.max_descent.min(allowed_descent)
            };

            // Compute line height using the sanitized metrics, but still allow
            // top/bottom aligned items to expand the line if necessary (capped).
            let mut line_height = (sanitized_max_ascent + sanitized_max_descent)
                .max(line.max_top_height)
                .max(line.max_bottom_height);

            #[cfg(test)]
            {
                    let _ = (li, line.items.len(), line.width, line.total_width(), line.max_ascent, line.max_descent, sanitized_max_ascent, sanitized_max_descent, line.max_top_height, line.max_bottom_height, line_height);
            }

            log::warn!(
                "IFC finalize line={} items={} max_ascent={} max_descent={} san_ascent={} san_descent={} max_top={} max_bottom={} line_height={} line_height_bits=0x{:08x} total_height_before={}",
                li,
                line.items.len(),
                line.max_ascent,
                line.max_descent,
                sanitized_max_ascent,
                sanitized_max_descent,
                line.max_top_height,
                line.max_bottom_height,
                line_height,
                line_height.to_bits(),
                total_height
            );

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
                    is_virtual,
                    ..
                }) = line.items.first()
                {
                    let x = self.content_box_left + margin_left;
                    let y = y_offset + margin_top;
                    placements.push((*id, x, y));

                    // If this block child is virtual, don't accumulate its
                    // height into the parent's total. The child's own
                    // layout remains set separately.
                    if !*is_virtual {
                        let block_height = height + margin_top + margin_bottom;
                        total_height += block_height;
                        y_offset += block_height;
                        max_width = max_width.max(*width);
                    }
                }
            } else {
                // Debug: log per-line metrics to help diagnose collapsed heights
                log::debug!(
                    "inline: line={} items={} width={} max_ascent={} max_descent={} max_top={} max_bottom={} sanitized_ascent={} sanitized_descent={} line_height={}",
                    li,
                    line.items.len(),
                    line.width,
                    line.max_ascent,
                    line.max_descent,
                    line.max_top_height,
                    line.max_bottom_height,
                    sanitized_max_ascent,
                    sanitized_max_descent,
                    line_height
                );
                // Note: stderr printing removed (keep log::debug for diagnostics)
                // Compute horizontal alignment offset for the line
                let mut cursor_x = self.content_box_left;
                if self.available_width.is_finite() {
                    let line_w = line.total_width();
                    let avail = self.available_width;
                    let mut align_offset = 0.0f32;
                    match self.text_align {
                        // center
                        taffy::TextAlign::LegacyCenter => {
                            if avail > line_w {
                                align_offset = (avail - line_w) / 2.0;
                            }
                        }
                        // right
                        taffy::TextAlign::LegacyRight => {
                            if avail > line_w {
                                align_offset = avail - line_w;
                            }
                        }
                        // left/auto/legacy-left: no offset
                        _ => {}
                    }
                    cursor_x += align_offset;
                }

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
                            is_virtual,
                            is_replaced: _,
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

        // Ensure non-zero total height if we produced lines but sanitization
        // or other logic collapsed heights to zero. In such cases, fall
        // back to at least the parent's line height per line so callers
        // receive a positive content height.
        if total_height == 0.0 && !self.lines.is_empty() {
            total_height = self
                .lines
                .iter()
                .map(|l| {
                    let h = l.height();
                    if h > 0.0 {
                        h
                    } else {
                        self.parent_font.line_height()
                    }
                })
                .sum();
        }

        log::warn!(
            "IFC finalize result lines={} max_width={} total_height={} total_height_bits=0x{:08x}",
            self.lines.len(),
            max_width,
            total_height,
            total_height.to_bits()
        );
        (max_width, total_height, placements)
    }
}

impl Tree {
    fn is_inline_level(&self, child_id: Id) -> bool {
        if let Some(node) = self.inner().nodes.get(child_id) {
            let style = node.style();
            let display_mode = style.display_mode();

            match display_mode {
                // Inline text container or inline-block
                DisplayMode::Inline | DisplayMode::Box => true,
                DisplayMode::ListItem => false,
                DisplayMode::None => {
                    // Check if it's a text node or has force_inline
                    let is_text = node.type_ == NodeType::Text;
                    let is_block = style.get_display() == Display::Block;
                    let force_inline = style.force_inline();

                    force_inline || (is_text && !is_block)
                }
            }
        } else {
            // Missing node entry; conservative default -> block-level
            false
        }
    }

    fn is_block_level(&self, child_id: Id) -> bool {
        !self.is_inline_level(child_id)
    }

    /// Check if a node is an empty inline text container (should have 0x0 size)
    fn is_empty_inline_text(&self, child_id: Id) -> bool {
        let node = &self.nodes()[child_id];
        let style = node.style();

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
            .node_data()
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
            .inner()
            .children
            .get(child_id)
            .map(|children| children.iter().any(|&c| self.is_inline_level(c)))
            .unwrap_or(false);

        !has_inline_children
    }

    /// Get the vertical alignment from child's style
    fn get_vertical_align(&self, child_id: Id) -> VerticalAlignValue {
        if let Some(node) = self.inner().nodes.get(child_id) {
            node.style().vertical_align()
        } else {
            VerticalAlignValue::BASELINE
        }
    }

    /// Get font metrics from node's style, with inheritance fallback
    fn get_font_metrics(&self, node_id: Id) -> FontMetrics {
        let metrics = self.nodes()[node_id].style().font_metrics();
        if metrics.is_set() {
            return metrics;
        }

        // Try to inherit from parent
        if let Some(Some(parent_id)) = self.parents().get(node_id) {
            let parent_metrics = self.nodes()[*parent_id].style().font_metrics();
            if parent_metrics.is_set() {
                return parent_metrics;
            }
        }

        // Return default
        FontMetrics::DEFAULT
    }

    /// Get first baseline for a child element
    /// Returns the distance from the BOTTOM of the element to its baseline
    pub(crate) fn get_child_baseline(&self, child_id: Id) -> f32 {
        let node = &self.nodes()[child_id];
        let style = node.style();

        #[cfg(test)]
        {
            eprintln!("get_child_baseline called for id={:?} type={:?} display_mode={:?} display={:?} size={:?} children_count={}", child_id, node.type_, style.display_mode(), style.get_display(), node.unrounded_layout.size, self.inner().children.get(child_id).map(|c| c.len()).unwrap_or(0));
        }

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
                if let Some(node_data) = self.node_data().get(child_id) {
                    let segments = node_data.inline_segments();
                    for segment in segments.iter() {
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
                // Inline-level block (inline-block / inline-flex / inline-grid)
                // According to spec, the baseline is the first baseline of the
                // element's in-flow inline-level descendants. We perform a
                // depth-first search and compute the baseline relative to the
                // bottom of this element. If none found, fallback to bottom.

                let this_layout = &node.unrounded_layout;

                // Stack of (id, absolute_top_offset) where absolute_top_offset
                // is distance from this element's top to child's top.
                let mut stack: Vec<(Id, f32)> = Vec::new();
                if let Some(children) = self.inner().children.get(child_id) {
                    for &c in children.iter().rev() {
                        let child_layout = &self.nodes()[c].unrounded_layout;
                        stack.push((c, child_layout.location.y));
                    }
                }

                while let Some((did, abs_top)) = stack.pop() {
                    // Consider any descendant that can yield a baseline. This
                    // covers cases where the element is an inline-level flex
                    // or grid container whose inline baseline is provided by
                    // descendants that may themselves be block/flex/grid.
                    let d_baseline = self.get_child_baseline(did);
                    #[cfg(test)]
                    {
                        eprintln!("get_child_baseline(Box) visiting did={:?} d_baseline={}", did, d_baseline);
                    }
                    if d_baseline > 0.0 {
                        let d_layout = &self.nodes()[did].unrounded_layout;
                        // descendant bottom absolute (from this top)
                        let desc_bottom_abs = abs_top + d_layout.size.height;
                        let this_height = this_layout.size.height;
                        let baseline_from_bottom = this_height - desc_bottom_abs + d_baseline;
                        #[cfg(test)]
                        {
                            eprintln!("  found descendant did={:?} d_layout.h={} abs_top={} desc_bottom_abs={} this_h={} baseline_from_bottom={}", did, d_layout.size.height, abs_top, desc_bottom_abs, this_height, baseline_from_bottom);
                        }
                        if baseline_from_bottom > 0.0 {
                            return baseline_from_bottom;
                        } else {
                            // Fallback: if computed baseline collapses to 0 due
                            // to positioning quirks (flex/grid), use the
                            // descendant baseline as a conservative positive
                            // baseline value.
                            return d_baseline;
                        }
                    }

                    // Push grandchildren with accumulated absolute top offsets
                    if let Some(grand) = self.inner().children.get(did) {
                        for &gc in grand.iter().rev() {
                            let gc_layout = &self.nodes()[gc].unrounded_layout;
                            stack.push((gc, abs_top + gc_layout.location.y));
                        }
                    }
                }

                // No inline descendant baseline found -> baseline at bottom
                // As a last resort, scan descendants for inline text segments
                // and return the first found descent as a conservative baseline.
                let mut scan_stack: Vec<Id> = Vec::new();
                if let Some(children) = self.inner().children.get(child_id) {
                    for &c in children.iter().rev() {
                        scan_stack.push(c);
                    }
                }

                while let Some(did) = scan_stack.pop() {
                    if let Some(data) = self.node_data().get(did) {
                        for seg in data.inline_segments().iter() {
                            if let InlineSegment::Text { descent, .. } = seg {
                                return *descent;
                            }
                        }
                    }
                    if let Some(grand) = self.inner().children.get(did) {
                        for &gc in grand.iter().rev() {
                            scan_stack.push(gc);
                        }
                    }
                }

                0.0
            }
            DisplayMode::None | DisplayMode::ListItem => {
                // For text nodes (NodeType::Text), use font metrics
                if node.type_ == NodeType::Text {
                    let metrics = style.font_metrics();
                    if metrics.is_set() {
                        let layout = &node.unrounded_layout;
                        // Clamp baseline to not exceed element height
                        let baseline = layout.padding.bottom + layout.border.bottom + metrics.descent;
                        return baseline.min(layout.size.height.max(0.0));
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
        let node = &self.nodes()[child_id];
        let style = node.style();

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
    fn get_inline_content_size(&self, child_id: Id, available_width: Option<f32>) -> Option<Size<f32>> {
        let nd = self.node_data();
        let node_data = nd.get(child_id)?;
        let segments = node_data.inline_segments();

        if segments.is_empty() {
            return Some(Size::ZERO);
        }

        #[cfg(test)]
            let _ = (child_id, available_width, segments.len());

        // Compute per-line ascent/descent so that explicit line breaks and
        // per-line wrapping produce correct heights (each line can have its
        // own metrics). If a line contains no segments that contribute
        // metrics, fall back to the node's font metrics for that line.
        let mut current_line_width = 0.0f32;
        let mut max_line_width = 0.0f32;
        let mut current_line_ascent = 0.0f32;
        let mut current_line_descent = 0.0f32;
        let mut total_height = 0.0f32;

        let avail = available_width.filter(|v| v.is_finite() && *v > 0.0);

        for segment in segments.iter() {
            match segment {
                InlineSegment::Text { width, ascent, descent, .. } => {
                    if let Some(w) = avail {
                        let mut remaining = *width;
                        while remaining > 0.0 {
                            let take = remaining.min(w);

                            if current_line_width > 0.0 && current_line_width + take > w {
                                // finish current line
                                max_line_width = max_line_width.max(current_line_width);
                                let (a, d) = if current_line_ascent == 0.0 && current_line_descent == 0.0 {
                                    let m = self.get_font_metrics(child_id);
                                    (m.ascent, m.descent)
                                } else {
                                    (current_line_ascent, current_line_descent)
                                };
                                total_height += a + d;
                                current_line_width = 0.0;
                                current_line_ascent = 0.0;
                                current_line_descent = 0.0;
                            }

                            current_line_width += take;
                            current_line_ascent = current_line_ascent.max(*ascent);
                            current_line_descent = current_line_descent.max(*descent);
                            remaining -= take;

                            if remaining > 0.0 {
                                max_line_width = max_line_width.max(current_line_width);
                                let (a, d) = if current_line_ascent == 0.0 && current_line_descent == 0.0 {
                                    let m = self.get_font_metrics(child_id);
                                    (m.ascent, m.descent)
                                } else {
                                    (current_line_ascent, current_line_descent)
                                };
                                total_height += a + d;
                                current_line_width = 0.0;
                                current_line_ascent = 0.0;
                                current_line_descent = 0.0;
                            }
                        }
                    } else {
                        current_line_width += *width;
                        current_line_ascent = current_line_ascent.max(*ascent);
                        current_line_descent = current_line_descent.max(*descent);
                    }
                }
                InlineSegment::InlineChild { id: Some(id), .. } => {
                    let child_size = self.nodes()[*id].unrounded_layout.size;

                    if let Some(w) = avail {
                        if current_line_width > 0.0 && current_line_width + child_size.width > w {
                            max_line_width = max_line_width.max(current_line_width);
                            let (a, d) = if current_line_ascent == 0.0 && current_line_descent == 0.0 {
                                let m = self.get_font_metrics(child_id);
                                (m.ascent, m.descent)
                            } else {
                                (current_line_ascent, current_line_descent)
                            };
                            total_height += a + d;
                            current_line_width = 0.0;
                            current_line_ascent = 0.0;
                            current_line_descent = 0.0;
                        }
                    }

                    current_line_width += child_size.width;
                    current_line_ascent = current_line_ascent.max(child_size.height);
                }
                InlineSegment::InlineChild { id: None, .. } => {}
                InlineSegment::LineBreak => {
                    max_line_width = max_line_width.max(current_line_width);
                    let (a, d) = if current_line_ascent == 0.0 && current_line_descent == 0.0 {
                        let m = self.get_font_metrics(child_id);
                        (m.ascent, m.descent)
                    } else {
                        (current_line_ascent, current_line_descent)
                    };
                    total_height += a + d;
                    current_line_width = 0.0;
                    current_line_ascent = 0.0;
                    current_line_descent = 0.0;
                }
            }
        }

        // finalize last line
        max_line_width = max_line_width.max(current_line_width);
        if current_line_width > 0.0 || !segments.is_empty() {
            let (a, d) = if current_line_ascent == 0.0 && current_line_descent == 0.0 {
                let m = self.get_font_metrics(child_id);
                (m.ascent, m.descent)
            } else {
                (current_line_ascent, current_line_descent)
            };
            total_height += a + d;
        }

        Some(Size { width: max_line_width, height: total_height })
    }

    fn measure_inline_child(&mut self, child_id: Id, inputs: LayoutInput) -> LayoutOutput {
        // debug prints removed

        // Check if this is a replaced element (image, video, etc.)
        let is_replaced = self.nodes()[child_id].style().get_item_is_replaced();

        if is_replaced {
            // Replaced elements use their measure function or intrinsic size
            let child_node_id = NodeId::from(child_id);

            let measure_inputs = LayoutInput {
                known_dimensions: Size::NONE,
                available_space: Size {
                    width: inputs.available_space.width,
                    height: AvailableSpace::MaxContent,
                },
                parent_size: inputs.parent_size,
                ..inputs
            };

            // debug prints removed

            let mut layout = self.compute_child_layout(child_node_id, measure_inputs);

            if let Some(child) = self.nodes_mut().get_mut(child_id) {
                let padding = child
                    .style()
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = child
                    .style()
                    .border()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

                // Content size is the layout size minus padding and border
                let content_size = Size {
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

                child.unrounded_layout.location = Point::zero();
                child.unrounded_layout.border = border;
                child.unrounded_layout.size = layout.size;
                child.unrounded_layout.padding = padding;
                child.unrounded_layout.content_size = content_size;
            }

            #[cfg(target_vendor = "apple")]
            if let Some(data) = self.node_data_mut().get_mut(child_id) {
                if let Some(node) = data.apple_data.as_mut() {
                    log::debug!(
                        "pre-set_computed_size apple child={:?} w={} h={} h_bits=0x{:08x}",
                        child_id,
                        layout.size.width,
                        layout.size.height,
                        layout.size.height.to_bits()
                    );
                    node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
                }
            }

            #[cfg(test)]
                let _ = (child_id, layout.size.width, layout.size.height);

            #[cfg(target_os = "android")]
            if let Some(data) = self.node_data_mut().get_mut(child_id) {
                if let Some(node) = data.android_data.as_mut() {
                    log::debug!(
                        "pre-set_computed_size android child={:?} w={} h={} h_bits=0x{:08x}",
                        child_id,
                        layout.size.width,
                        layout.size.height,
                        layout.size.height.to_bits()
                    );
                    node.set_computed_size(layout.size.width, layout.size.height);
                }
            }
            

            return layout;
        }

        // Check if this is an empty inline text container
        if self.is_empty_inline_text(child_id) {
            // Empty inline elements have 0x0 size
            if let Some(child) = self.nodes_mut().get_mut(child_id) {
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
        let has_measure = self.nodes()[child_id].has_measure;
        let is_text_container = self.nodes()[child_id].is_text_container();

        #[cfg(test)]
            let _ = (child_id, is_replaced, is_text_container, has_measure);

        // If this inline node has a native measure function (but is not a
        // text container), use that measure to populate its size. This covers
        // cases where an element is `display: block` with `display-mode:
        // inline` (pure-inline) but still supplies a native measure. The
        // measure must be invoked after the parent measurement in the IFC
        // flow (the caller ensures phase ordering), so it's safe to call
        // here.
        if has_measure && !is_text_container {
            let measure = self.node_data().get(child_id).unwrap().copy_measure();
            let style = self.nodes()[child_id].style().clone();
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

            let mut layout = compute_leaf_layout(
                inputs,
                &adjusted_style,
                |_val, _basis| 0.0,
                |known_dimensions, available_space| {
                    let measure_known = if is_inline { Size::NONE } else { known_dimensions };
                    // measure was copied via `copy_measure()` earlier; ensure
                    // we invoke it outside long-lived tree locks. This log
                    // helps detect accidental lock-holding during tests.
                    #[cfg(test)]
                    eprintln!("TEST: calling measure for child_id={:?} in measure_inline_child", child_id);
                    measure.measure(measure_known, available_space)
                },
            );

            if let Some(child) = self.nodes_mut().get_mut(child_id) {
                let padding = child
                    .style()
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = child
                    .style()
                    .border()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

                child.unrounded_layout.location = Point::zero();
                child.unrounded_layout.size = layout.size;
                child.unrounded_layout.content_size = layout.content_size;
                child.unrounded_layout.padding = padding;
                child.unrounded_layout.border = border;
            }

            #[cfg(test)]
            crate::test_helpers::call_computed_size(child_id, layout.size.width as f32, layout.size.height as f32);

            #[cfg(target_vendor = "apple")]
            if let Some(data) = self.node_data_mut().get_mut(child_id) {
                if let Some(node) = data.apple_data.as_mut() {
                    node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
                }
            }

            #[cfg(target_os = "android")]
            if let Some(data) = self.node_data_mut().get_mut(child_id) {
                if let Some(node) = data.android_data.as_mut() {
                    node.set_computed_size(layout.size.width, layout.size.height);
                }
            }

      
            return layout;
        }

        // For text containers with measure functions, use the measure function
        // This allows native platforms to measure text
        if is_text_container && has_measure {
            // First, measure all children of this text container
            let grandchild_ids: Vec<Id> = self
                .inner()
                .children
                .get(child_id)
                .cloned()
                .unwrap_or_default();

            let content_available_width = inputs.available_space.width;

            let grandchild_inputs = LayoutInput {
                known_dimensions: Size::NONE,
                available_space: Size {
                    width: content_available_width,
                    height: AvailableSpace::MaxContent,
                },
                parent_size: Size {
                    width: content_available_width.into_option(),
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

            let measure = self.node_data().get(child_id).unwrap().copy_measure();
            let style = self.nodes()[child_id].style().clone();

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

            /*
            let margin = style
                .margin()
                .resolve_or_zero(inputs.parent_size.width, |_,_|0.0);
            let padding = style
                .padding()
                .resolve_or_zero(inputs.parent_size.width, |_,_|0.0);
            let border = style
                .border()
                .resolve_or_zero(inputs.parent_size.width, |_,_|0.0);
            let container_pb = padding + border;
            let pb_sum = container_pb.sum_axes();
            let box_sizing_adjustment = if style.box_sizing() == BoxSizing::ContentBox {
                pb_sum
            } else {
                Size::ZERO
            };

            // Scrollbar gutters are reserved when the `overflow` property is set to `Overflow::Scroll`.
            // However, the axis are switched (transposed) because a node that scrolls vertically needs
            // *horizontal* space to be reserved for a scrollbar
            let scrollbar_gutter = style.overflow().transpose().map(|overflow| match overflow {
                taffy::Overflow::Scroll => style.scrollbar_width(),
                _ => 0.0,
            });
            // TODO: make side configurable based on the `direction` property
            let mut content_box_inset = container_pb;
            content_box_inset.right += scrollbar_gutter.x;
            content_box_inset.bottom += scrollbar_gutter.y;


            let (node_size, node_min_size, node_max_size, aspect_ratio) = match inputs.sizing_mode {
                SizingMode::ContentSize => {
                    let node_size = inputs.known_dimensions;
                    let node_min_size = Size::NONE;
                    let node_max_size = Size::NONE;
                    (node_size, node_min_size, node_max_size, None)
                }
                SizingMode::InherentSize => {
                    let aspect_ratio = style.aspect_ratio();
                    let style_size = style
                        .size()
                        .maybe_resolve(inputs.parent_size, |_,_| 0.0)
                        .maybe_apply_aspect_ratio(aspect_ratio)
                        .maybe_add(box_sizing_adjustment);
                    let style_min_size = style
                        .min_size()
                        .maybe_resolve(inputs.parent_size, |_,_| 0.0)
                        .maybe_apply_aspect_ratio(aspect_ratio)
                        .maybe_add(box_sizing_adjustment);
                    let style_max_size = style
                        .max_size()
                        .maybe_resolve(inputs.parent_size, |_,_| 0.0)
                        .maybe_add(box_sizing_adjustment);

                    let node_size =
                        inputs.known_dimensions.or(style_size.maybe_clamp(style_min_size, style_max_size));
                    (node_size, style_min_size, style_max_size, aspect_ratio)
                }
            };

            // Compute available space
            let available_space = Size {
                width: inputs.known_dimensions
                    .width
                    .map(AvailableSpace::from)
                    .unwrap_or(inputs.available_space.width)
                    .maybe_sub(margin.horizontal_axis_sum())
                    .maybe_set(inputs.known_dimensions.width)
                    .maybe_set(node_size.width)
                    .map_definite_value(|size| {
                        size.maybe_clamp(node_min_size.width, node_max_size.width)
                            - content_box_inset.horizontal_axis_sum()
                    }),
                height: inputs.known_dimensions
                    .height
                    .map(AvailableSpace::from)
                    .unwrap_or(inputs.available_space.height)
                    .maybe_sub(margin.vertical_axis_sum())
                    .maybe_set(inputs.known_dimensions.height)
                    .maybe_set(node_size.height)
                    .map_definite_value(|size| {
                        size.maybe_clamp(node_min_size.height, node_max_size.height)
                            - content_box_inset.vertical_axis_sum()
                    }),
            };

            let child_inputs = taffy::tree::LayoutInput {
                known_dimensions: Size::NONE,
                available_space,
                sizing_mode: SizingMode::InherentSize,
                parent_size: available_space.into_options(),
                ..inputs
            };


            let a = self.compute_child_layout(child_node_id, child_inputs);
            */

            // debug prints removed

            let mut layout = compute_leaf_layout(
                inputs,
                &adjusted_style,
                |_val, _basis| 0.0,
                |known_dimensions, available_space| {
                    let measure_known = if is_inline {
                        Size::NONE
                    } else {
                        known_dimensions
                    };
                    // debug prints removed
                    #[cfg(test)]
                    eprintln!("TEST: calling measure for text-container id={:?} in measure_text_container", child_id);
                    measure.measure(measure_known, available_space)
                },
            );

            if let Some(child) = self.nodes_mut().get_mut(child_id) {
                let padding = child
                    .style()
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = child
                    .style()
                    .border()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

                child.unrounded_layout.location = Point::zero();
                child.unrounded_layout.size = layout.size;
                child.unrounded_layout.content_size = layout.content_size;
                child.unrounded_layout.padding = padding;
                child.unrounded_layout.border = border;
            }

            #[cfg(target_vendor = "apple")]
            if let Some(data) = self.node_data_mut().get_mut(child_id) {
                if let Some(node) = data.apple_data.as_mut() {
                    node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
                }
            }

            #[cfg(test)]
            crate::test_helpers::call_computed_size(child_id, layout.size.width as f32, layout.size.height as f32);

            #[cfg(target_os = "android")]
            if let Some(data) = self.node_data_mut().get_mut(child_id) {
                if let Some(node) = data.android_data.as_mut() {
                    node.set_computed_size(layout.size.width, layout.size.height);
                }
            }

    

            return layout;
        }

        #[cfg(test)]
        {
            let node_layout = self.nodes()[child_id].unrounded_layout.size;
            let _ = (child_id, node_layout.width, node_layout.height);
        }

        // For pure inline elements WITHOUT a measure function,
        // calculate size from content (segments)
        if is_pure_inline {
            // Determine definite available width (if any) to allow wrapping
            let avail_w = match inputs.available_space.width {
                AvailableSpace::Definite(v) => Some(v),
                _ => None,
            };

            // debug prints removed

            if let Some(content_size) = self.get_inline_content_size(child_id, avail_w) {
                // Get padding and border (these still apply to inline elements)
                let padding = self.nodes()[child_id]
                    .style()
                    .get_padding()
                    .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
                let border = self.nodes()[child_id]
                    .style()
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

                if let Some(child) = self.nodes_mut().get_mut(child_id) {
                    child.unrounded_layout.location = Point::zero();
                    child.unrounded_layout.size = size;
                    child.unrounded_layout.content_size = content_size;
                    child.unrounded_layout.padding = padding;
                    child.unrounded_layout.border = border;
                }

                #[cfg(target_vendor = "apple")]
                if let Some(data) = self.node_data_mut().get_mut(child_id) {
                    if let Some(node) = data.apple_data.as_mut() {
                        node.set_computed_size(size.width as f64, size.height as f64);
                    }
                }

                #[cfg(test)]
                crate::test_helpers::call_computed_size(child_id, size.width as f32, size.height as f32);

                #[cfg(target_os = "android")]
                if let Some(data) = self.node_data_mut().get_mut(child_id) {
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

        // For inline-block, inline-flex, or inline-grid (DisplayMode::Box),
        // use normal layout which delegates to the appropriate algorithm
        // (flex, grid, or block) based on the display property.
        let measure_inputs = LayoutInput {
            known_dimensions: Size::NONE,
            available_space: Size {
                width: inputs.available_space.width,
                height: AvailableSpace::MaxContent,
            },
            parent_size: inputs.parent_size,
            ..inputs
        };

        // debug prints removed

        let layout = self.compute_child_layout(child_node_id, measure_inputs);

        if let Some(child) = self.nodes_mut().get_mut(child_id) {
            let padding = child
                .style()
                .get_padding()
                .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);
            let border = child
                .style()
                .border()
                .resolve_or_zero(inputs.parent_size, |_v, _b| 0.0);

            child.unrounded_layout.location = Point::zero();
            child.unrounded_layout.border = border;
            child.unrounded_layout.size = layout.size;
            child.unrounded_layout.padding = padding;
            
            // Preserve the content_size from the layout computation.
            // For scroll containers, this may be larger than size - padding - border.
            // For non-scroll containers, use the computed content_size or calculate it.
            let overflow = child.style().get_overflow();
            let is_scroll_container = matches!(
                overflow.y,
                crate::style::Overflow::Scroll | crate::style::Overflow::Auto | crate::style::Overflow::Hidden
            ) || matches!(
                overflow.x,
                crate::style::Overflow::Scroll | crate::style::Overflow::Auto | crate::style::Overflow::Hidden
            );

            if is_scroll_container {
                // For scroll containers, preserve the full content extent
                child.unrounded_layout.content_size = layout.content_size;
            } else {
                // For non-scroll containers, content_size is the visible content area
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
        }

        #[cfg(target_vendor = "apple")]
        if let Some(data) = self.node_data_mut().get_mut(child_id) {
            if let Some(node) = data.apple_data.as_mut() {
                node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
            }
        }

        #[cfg(test)]
        crate::test_helpers::call_computed_size(child_id, layout.size.width as f32, layout.size.height as f32);

        #[cfg(target_os = "android")]
        if let Some(data) = self.node_data_mut().get_mut(child_id) {
            if let Some(node) = data.android_data.as_mut() {
                node.set_computed_size(layout.size.width, layout.size.height);
            }
        }

        layout
    }

    fn measure_block_child(
        &mut self,
        child_id: Id,
        available_width: AvailableSpace,
        inputs: LayoutInput,
    ) -> LayoutOutput {
        let child_node_id = NodeId::from(child_id);

        let block_inputs = LayoutInput {
            known_dimensions: Size::NONE,
            available_space: Size {
                width: available_width,
                height: inputs.available_space.height,
            },
            parent_size: Size {
                width: available_width.into_option(),
                height: inputs.parent_size.height,
            },
            ..inputs
        };

        let mut layout = self.compute_child_layout(child_node_id, block_inputs);

        // Debug: measured layout for block children (tests may inspect sizes)
        #[cfg(test)]
        {
            let _ = (child_id, layout.size.width, layout.size.height);
        }

        if let AvailableSpace::Definite(value) = available_width {
            if layout.size.width > value {
                layout.size.width = value;
            }
            // Don't clamp content_size for scroll/auto/hidden overflow containers —
            // they need the true content extent for native scroll views
            let overflow = self.nodes()[child_id].style().get_overflow();
            let is_scroll_container = matches!(
                overflow.x,
                crate::style::Overflow::Scroll | crate::style::Overflow::Auto | crate::style::Overflow::Hidden
            );
            if !is_scroll_container && layout.content_size.width > value {
                layout.content_size.width = value;
            }
        }

        if let Some(child) = self.nodes_mut().get_mut(child_id) {
            child.unrounded_layout.size = layout.size;
            child.unrounded_layout.content_size = layout.content_size;
        }

        // Notify platform of computed size
        #[cfg(target_vendor = "apple")]
        if let Some(data) = self.node_data_mut().get_mut(child_id) {
            if let Some(node) = data.apple_data.as_mut() {
                node.set_computed_size(layout.size.width as f64, layout.size.height as f64);
            }
        }

        #[cfg(test)]
        crate::test_helpers::call_computed_size(child_id, layout.size.width, layout.size.height);

        #[cfg(target_os = "android")]
        if let Some(data) = self.node_data_mut().get_mut(child_id) {
            if let Some(node) = data.android_data.as_mut() {
                node.set_computed_size(layout.size.width, layout.size.height);
            }
        }

        layout
    }

    fn collect_child_info(
        &self,
        child_id: Id,
    ) -> (
        Size<f32>,
        taffy::Rect<f32>,
        bool,
        VerticalAlignValue,
        bool,
        bool,
        bool,
    ) {
        let node = &self.nodes()[child_id];
        let margin = node
            .style()
            .get_margin()
            .resolve_or_zero(Size::NONE, |_v, _b| 0.0);
        let size = node.unrounded_layout.size;
        let is_block = self.is_block_level(child_id);
        let vertical_align = self.get_vertical_align(child_id);
        let node_is_virtual = node.is_virtual();
        let is_replaced = node.style().get_item_is_replaced();
        let is_list_item = node.style().get_item_is_list_item();
        (
            size,
            margin,
            is_block,
            vertical_align,
            node_is_virtual,
            is_replaced,
            is_list_item,
        )
    }

    pub fn compute_inline_or_mixed_layout(
        &mut self,
        node_id: NodeId,
        inputs: LayoutInput,
        _block_ctx: Option<&mut BlockContext<'_>>,
    ) -> LayoutOutput {
        let id: Id = node_id.into();
        let child_ids: Vec<Id> = self.inner().children.get(id).cloned().unwrap_or_default();

        let (style, is_text_container, has_measure, type_) = {
            let node = &self.nodes()[id];
            (
                node.style().clone(),
                node.is_text_container(),
                node.has_measure,
                node.type_,
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

        if is_text_container {
            let sizing_mode = match inputs.available_space.width {
                AvailableSpace::Definite(_) => SizingMode::InherentSize,
                AvailableSpace::MinContent | AvailableSpace::MaxContent => SizingMode::ContentSize,
            };

            let child_inputs = LayoutInput {
                known_dimensions: Size::NONE,
                sizing_mode,
                ..inputs
            };

            // Phase 1: Measure non-pure-inline children first.
            // Pure inline children are flattened into the parent's text —
            // their computed sizes must NOT be set before the parent measures,
            // otherwise the native measure includes their heights and inflates
            // the parent's total height.
            for &child_id in &child_ids {
                if self.is_pure_inline(child_id) {
                    continue;
                }
                if self.is_inline_level(child_id) {
                    self.measure_inline_child(child_id, child_inputs);
                } else {
                    self.measure_block_child(child_id, child_inputs.available_space.width, inputs);
                }
            }

            // Compute container size FIRST — the native measure function
            // populates fresh inline segments as a side effect, so we must
            // call it before reading segments for IFC positioning.
            let measure = self.node_data().get(id).unwrap().copy_measure();
            let is_inline = matches!(style.display_mode(), DisplayMode::Inline);
            let _is_block = matches!(style.get_display(), Display::Block);

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

            let mut ret = compute_leaf_layout(
                inputs,
                &adjusted_style,
                |_val, _basis| 0.0,
                |known_dimensions, available_space| {
                    let measure_known = if is_inline {
                        Size::NONE
                    } else {
                        known_dimensions
                    };
                    // Measure callback must be invoked outside of long-held
                    // tree locks; we copy the measure earlier to enforce this.
                    #[cfg(test)]
                    eprintln!("TEST: calling measure for id={:?} in compute_inline_layout parent measure", id);
                    log::debug!("measure-call inline-parent id={:?} known={:?} avail={:?}", id, measure_known, available_space);
                    let meas = measure.measure(measure_known, available_space);
                    meas
                },
            );

            if ret.size.height.is_nan() || ret.size.height.abs() <= 1e-6_f32 {
                log::warn!(
                    "compute_inline_or_mixed_layout: tiny/invalid ret id={:?} ret_size={:?} ret_size_bits=0x{:08x} content_size={:?} content_size_bits=0x{:08x}",
                    id,
                    ret.size,
                    ret.size.height.to_bits(),
                    ret.content_size,
                    ret.content_size.height.to_bits()
                );
            }

            // Phase 2: Now measure pure inline children (after parent).
            // Their sizes are needed for IFC positioning but must not
            // affect the parent's height.
            for &child_id in &child_ids {
                if self.is_pure_inline(child_id) {
                    self.measure_inline_child(child_id, child_inputs);
                }
            }

            // Now get segments (freshly populated by the measure call above)
            let segments = {
                let nd = self.node_data();
                let node_data = nd.get(id).unwrap();
                let guard = node_data.inline_segments();
                let vec = guard.to_vec();
                drop(guard);
                vec
            };

            // If there are children, we need to position them using IFC
            if !child_ids.is_empty() {
                let mut prepared_items: Vec<PreparedItem> = Vec::new();

                // Build prepared items from segments (which include text and inline children)
                for segment in &segments {
                    match segment {
                        InlineSegment::Text { width, ascent, descent, .. } => {
                            prepared_items.push(PreparedItem::Text {
                                width: *width,
                                ascent: *ascent,
                                descent: *descent,
                            });
                        }
                        InlineSegment::LineBreak => {
                            prepared_items.push(PreparedItem::LineBreak);
                        }
                        InlineSegment::InlineChild {
                            id: child_id_opt,
                            baseline,
                        } => {
                            if let Some(child_id) = child_id_opt {
                                let (size, margin, _, vertical_align, node_is_virtual, is_replaced, _is_list_item) =
                                    self.collect_child_info(*child_id);
                                let is_pure_inline = self.is_pure_inline(*child_id);
                                prepared_items.push(PreparedItem::InlineChild {
                                    id: *child_id,
                                    width: size.width,
                                    height: size.height,
                                    margin,
                                    baseline: *baseline,
                                    vertical_align,
                                    is_pure_inline,
                                    is_virtual: node_is_virtual,
                                    is_replaced,
                                });
                            }
                        }
                    }
                }

                // If no segments but we have children, add children directly
                if prepared_items.is_empty() {
                    for &child_id in &child_ids {
                        let (size, margin, is_block, vertical_align, node_is_virtual, is_replaced, is_list_item) =
                            self.collect_child_info(child_id);
                        if is_block {
                            prepared_items.push(PreparedItem::BlockChild {
                                id: child_id,
                                width: size.width,
                                height: size.height,
                                margin,
                                is_virtual: node_is_virtual && is_list_item,
                            });
                        } else {
                            let baseline = self.get_child_baseline(child_id);
                            let is_pure_inline = self.is_pure_inline(child_id);
                            let is_virtual = node_is_virtual && is_list_item;
                            prepared_items.push(PreparedItem::InlineChild {
                                id: child_id,
                                width: size.width,
                                height: size.height,
                                margin,
                                baseline,
                                vertical_align,
                                is_pure_inline,
                                is_virtual,
                                is_replaced,
                            });
                        }
                    }
                }

                // Run IFC to get placements
                let content_available_width = child_inputs
                    .available_space
                    .width
                    .into_option()
                    .unwrap_or(f32::INFINITY);

                let float_rects = self.get_float_rects_simple(id).unwrap_or_default();
                let mut ifc = InlineFormattingContext::new(
                    content_available_width,
                    pb.left,
                    pb.top,
                    parent_font,
                    style.get_text_align(),
                    float_rects,
                );
                ifc.process_items(&prepared_items);
                let (ifc_width, ifc_height, placements) = ifc.finalize();

                // Ensure the native-measured size accommodates inline formatting
                // results (lines / inline-blocks). The IFC returns content height
                // excluding padding; incorporate padding so the parent size grows
                // to fit inline children when necessary.
                let required_height = ifc_height + pb.top + pb.bottom;
                if ret.size.height < required_height {
                    ret.size.height = required_height;
                }
                if ret.content_size.height < ifc_height {
                    ret.content_size.height = ifc_height;
                }

                // If the parent is a list, native list containers (ListView)
                // may position items themselves. In that case, avoid
                // overriding the child's `y` for list-item children.
                let parent_is_list = style.get_item_is_list();
                for (child_id, x, y) in placements.iter() {
                    if let Some(node) = self.nodes_mut().get_mut(*child_id) {
                        node.unrounded_layout.location.x = *x;
                        if parent_is_list && node.is_list_item() {
                            // Leave y untouched so native container can position it.
                        } else {
                            node.unrounded_layout.location.y = *y;
                        }
                    }
                }
            }

            // For scroll/overflow containers, preserve the content_size from 
            // the native measure - this is needed for scrolling to work.
            let is_scroll_container = matches!(
                style.get_overflow().y,
                crate::style::Overflow::Scroll | crate::style::Overflow::Auto | crate::style::Overflow::Hidden
            ) || matches!(
                style.get_overflow().x,
                crate::style::Overflow::Scroll | crate::style::Overflow::Auto | crate::style::Overflow::Hidden
            );

            if is_scroll_container {
                // For scroll containers, content_size should be the actual measured content
                // which may be larger than the layout size (enabling scroll)
                let measured_content = ret.content_size;
                ret.content_size = Size {
                    width: measured_content.width.max(ret.size.width),
                    height: measured_content.height.max(ret.size.height),
                };
            }

            // Update the node's layout
            if let Some(node) = self.nodes_mut().get_mut(id) {
                node.unrounded_layout.size = ret.size;
                node.unrounded_layout.content_size = ret.content_size;
                node.unrounded_layout.padding = padding;
                node.unrounded_layout.border = border;
            }

            // Notify platform of computed size
            #[cfg(target_vendor = "apple")]
            if let Some(data) = self.node_data_mut().get_mut(id) {
                if let Some(node) = data.apple_data.as_mut() {
                    log::warn!("set_computed_size inline-parent id={:?} out={:?} out_bits=0x{:08x} avail={:?} parent={:?}", id, ret.size, ret.size.height.to_bits(), available_space, parent_size);
                    node.set_computed_size(ret.size.width as f64, ret.size.height as f64);
                }
            }

            #[cfg(test)]
            crate::test_helpers::call_computed_size(id, ret.size.width, ret.size.height);

            #[cfg(target_os = "android")]
            if let Some(data) = self.node_data_mut().get_mut(id) {
                if let Some(node) = data.android_data.as_mut() {
                    log::warn!("set_computed_size inline-parent id={:?} out={:?} out_bits=0x{:08x} avail={:?} parent={:?}", id, ret.size, ret.size.height.to_bits(), available_space, parent_size);
                    node.set_computed_size(ret.size.width, ret.size.height);
                }
            }

            return ret;
        }

        let segments = {
            let nd = self.node_data();
            let node_data = nd.get(id).unwrap();
            let guard = node_data.inline_segments();
            let vec = guard.to_vec();
            drop(guard);
            vec
        };

        if child_ids.is_empty() && segments.is_empty() {
            return if has_measure {
                let measure = self.node_data().get(id).unwrap().copy_measure();
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
            };
        }

        let sizing_mode = match inputs.available_space.width {
            AvailableSpace::Definite(_) => SizingMode::InherentSize,
            AvailableSpace::MinContent | AvailableSpace::MaxContent => SizingMode::ContentSize,
        };

        let child_inputs = LayoutInput {
            known_dimensions: Size::NONE,
            sizing_mode,
            ..inputs
        };

        for &child_id in &child_ids {
            if self.is_inline_level(child_id) {
                self.measure_inline_child(child_id, child_inputs);
            } else {
                self.measure_block_child(child_id, child_inputs.available_space.width, inputs);
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
                        ..
                    } => {
                        prepared_items.push(PreparedItem::Text {
                            width: *width,
                            ascent: *ascent,
                            descent: *descent,
                        });
                    }
                    InlineSegment::LineBreak => {
                        prepared_items.push(PreparedItem::LineBreak);
                    }
                    InlineSegment::InlineChild {
                        id: child_id_opt,
                        baseline,
                    } => {
                        if let Some(child_id) = child_id_opt {
                            let (size, margin, _, vertical_align, node_is_virtual, is_replaced, is_list_item) =
                                self.collect_child_info(*child_id);
                            let is_virtual = node_is_virtual && is_list_item;
                            prepared_items.push(PreparedItem::InlineChild {
                                id: *child_id,
                                width: size.width,
                                height: size.height,
                                margin,
                                baseline: *baseline,
                                vertical_align,
                                is_pure_inline: false,
                                is_virtual,
                                is_replaced,
                            });
                        }
                    }
                }
            }
        } else {
            for &child_id in &child_ids {
                let (size, margin, is_block, vertical_align, node_is_virtual, is_replaced, is_list_item) =
                    self.collect_child_info(child_id);
                if is_block {
                    prepared_items.push(PreparedItem::BlockChild {
                        id: child_id,
                        width: size.width,
                        height: size.height,
                        margin,
                        is_virtual: node_is_virtual && is_list_item,
                    });
                } else {
                    let baseline = self.get_child_baseline(child_id);
                    let is_pure_inline = self.is_pure_inline(child_id);
                    let is_virtual = node_is_virtual && is_list_item;
                    prepared_items.push(PreparedItem::InlineChild {
                        id: child_id,
                        width: size.width,
                        height: size.height,
                        margin,
                        baseline,
                        vertical_align,
                        is_pure_inline,
                        is_virtual,
                        is_replaced,
                    });
                }
            }
        }

        for pi in &prepared_items {
            match pi {
                PreparedItem::InlineChild { id: cid, width, height, baseline, .. } => {
                    log::warn!(
                        "prepared_item InlineChild parent={:?} child={:?} w={} h={} h_bits=0x{:08x} baseline={}",
                        id, cid, width, height, height.to_bits(), baseline
                    );
                }
                PreparedItem::Text { width, ascent, descent } => {
                    log::warn!(
                        "prepared_item Text parent={:?} w={} ascent={} descent={}",
                        id, width, ascent, descent
                    );
                }
                _ => {}
            }
        }

        let content_available_width = inputs
            .available_space
            .width
            .into_option()
            .unwrap_or(f32::INFINITY);

        // Pass parent_font to the IFC
        log::warn!(
            "IFC creating id={:?} parent_font_ascent={} asc_bits=0x{:08x} parent_font_descent={} desc_bits=0x{:08x}",
            id,
            parent_font.ascent,
            parent_font.ascent.to_bits(),
            parent_font.descent,
            parent_font.descent.to_bits(),
        );
        let float_rects = self.get_float_rects_simple(id).unwrap_or_default();
        let mut ifc = InlineFormattingContext::new(
            content_available_width,
            pb.left,
            pb.top,
            parent_font,
            style.get_text_align(),
            float_rects,
        );
        ifc.process_items(&prepared_items);

        let (content_width, content_height, placements) = ifc.finalize();

        log::warn!(
            "IFC finalize id={:?} content_width={} content_height={} content_height_bits=0x{:08x} placements={}",
            id,
            content_width,
            content_height,
            content_height.to_bits(),
            placements.len()
        );

        let parent_is_list = style.get_item_is_list();
        for (child_id, x, y) in placements {
            if let Some(node) = self.nodes_mut().get_mut(child_id) {
                node.unrounded_layout.location.x = x;
                if parent_is_list && node.is_list_item() {
                    // Leave y untouched so native container can position it.
                } else {
                    node.unrounded_layout.location.y = y;
                }
            }
        }

        // Compute the final layout using leaf algorithm
        let mut output = compute_leaf_layout(
            inputs,
            &style,
            |_val, _basis| 0.0,
            |_known_dimensions, _available_space| Size {
                width: content_width,
                height: content_height,
            },
        );

        log::warn!(
            "compute_leaf_layout output id={:?} size=({},{}) size_h_bits=0x{:08x} content_size=({},{})",
            id,
            output.size.width,
            output.size.height,
            output.size.height.to_bits(),
            output.content_size.width,
            output.content_size.height,
        );

        // For scroll/overflow containers, ensure content_size reflects the true
        // content extent from IFC, not the clamped layout size. This is critical
        // for native scroll views to know the full scrollable area.
        let is_scroll_container = matches!(
            style.get_overflow().y,
            crate::style::Overflow::Scroll | crate::style::Overflow::Auto | crate::style::Overflow::Hidden
        ) || matches!(
            style.get_overflow().x,
            crate::style::Overflow::Scroll | crate::style::Overflow::Auto | crate::style::Overflow::Hidden
        );

        if is_scroll_container {
            // The IFC-computed content dimensions represent the full content extent.
            // Add padding+border to get the full content box dimensions.
            let full_content_width = content_width + pb.left + pb.right;
            let full_content_height = content_height + pb.top + pb.bottom;

            // content_size should be the larger of computed content and layout size
            // to ensure scroll views know the full scrollable area
            output.content_size = Size {
                width: full_content_width.max(output.size.width),
                height: full_content_height.max(output.size.height),
            };
        } else {
            // For non-scroll containers, content_size is the actual content (without padding/border)
            output.content_size = Size {
                width: content_width,
                height: content_height,
            };
        }

        // Update the node's layout with proper content_size
        if let Some(node) = self.nodes_mut().get_mut(id) {
            node.unrounded_layout.size = output.size;
            node.unrounded_layout.content_size = output.content_size;
            node.unrounded_layout.padding = padding;
            node.unrounded_layout.border = border;
        }

        // Notify platform of computed size
        #[cfg(target_vendor = "apple")]
        if let Some(data) = self.node_data_mut().get_mut(id) {
            if let Some(node) = data.apple_data.as_mut() {
                node.set_computed_size(output.size.width as f64, output.size.height as f64);
            }
        }

        #[cfg(test)]
        crate::test_helpers::call_computed_size(id, output.size.width, output.size.height);

        #[cfg(target_os = "android")]
        if let Some(data) = self.node_data_mut().get_mut(id) {
            if let Some(node) = data.android_data.as_mut() {
                node.set_computed_size(output.size.width, output.size.height);
            }
        }

        output
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
