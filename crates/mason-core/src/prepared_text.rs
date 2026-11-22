use crate::node::BASELINE_QUERY;
use taffy::{AvailableSpace, Size};

const UNBOUNDED: f32 = 1_000_000.0;

#[derive(Debug, Clone, Copy)]
pub struct LineMetrics {
    pub ascent: i32,
    pub descent: i32,
    pub height: f32,
    pub min_height: f32,
}

/// Whether the text is inline (a span) or a block of its own; TextEngine sizes their
/// min-content differently.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Flow {
    Block,
    Inline,
}

impl Flow {
    fn wraps_at_known_width(self) -> bool {
        self == Flow::Block
    }
}

#[derive(Debug, Clone, Copy)]
pub struct LineBox {
    pub start: u32,
    pub end: u32,
    pub width: f32,
    pub baseline: i32,
    pub ascent: i32,
    pub descent: i32,
}

/// The text from one line-break opportunity to the next.
#[derive(Debug, Clone, Copy)]
struct Segment {
    start: u32,
    visible_end: u32,
    visible_width: f32,
    hanging_space_width: f32,
}

struct Line {
    start: u32,
    width: f32,
}

#[derive(Debug)]
pub struct PreparedText {
    advances: Vec<f32>,
    segments: Vec<Segment>,
    metrics: LineMetrics,
    flow: Flow,
    one_line_width: f32,
    widest_piece: f32,
}

fn ceil_fine(v: f32) -> f32 {
    (v * 64.0 - 0.01).ceil() / 64.0
}

fn ceil_constraint(v: f32) -> f32 {
    (v - 1.0 / 64.0).ceil()
}

/// TextLine.isLineEndSpace: whitespace that hangs past the end of a line.
fn is_line_end_space(c: u16) -> bool {
    matches!(c, 0x20 | 0x09 | 0x1680 | 0x205F | 0x3000)
        || ((0x2000..=0x200A).contains(&c) && c != 0x2007)
}

/// Kotlin's Char.isWhitespace, which TextEngine trims min-content pieces with.
fn is_kotlin_whitespace(c: u16) -> bool {
    matches!(
        c,
        0x09..=0x0D | 0x1C..=0x20 | 0xA0 | 0x1680 | 0x2000..=0x200A | 0x2028 | 0x2029 | 0x202F | 0x205F | 0x3000
    )
}

/// Minikin breaks after these only when it hyphenates (Hyphenator::isLineBreakingHyphen), and
/// prepared text never hyphenates.
fn is_line_breaking_hyphen(c: u16) -> bool {
    matches!(
        c,
        0x2D | 0xAD | 0x58A | 0x5BE | 0x1400 | 0x2010 | 0x2013 | 0x2027 | 0x2E17 | 0x2E40
    )
}

impl PreparedText {
    /// `breaks` are ICU's line-break opportunities in `text`, as UTF-16 offsets.
    pub fn new(
        text: &[u16],
        advances: Vec<f32>,
        breaks: &[u32],
        metrics: LineMetrics,
        flow: Flow,
    ) -> Self {
        let width = |from: usize, to: usize| -> f32 { advances[from..to].iter().sum() };
        let mut segments = Vec::new();
        let mut widest_piece = 0f32;
        let mut start = 0usize;
        for &end in breaks {
            let end = end as usize;
            if end < text.len() && is_line_breaking_hyphen(text[end - 1]) {
                continue;
            }
            let mut visible_end = end;
            while visible_end > start && is_line_end_space(text[visible_end - 1]) {
                visible_end -= 1;
            }
            let mut piece_end = end;
            while piece_end > start && is_kotlin_whitespace(text[piece_end - 1]) {
                piece_end -= 1;
            }
            widest_piece = widest_piece.max(width(start, piece_end));
            segments.push(Segment {
                start: start as u32,
                visible_end: visible_end as u32,
                visible_width: width(start, visible_end),
                hanging_space_width: width(visible_end, end),
            });
            start = end;
        }
        let one_line_width = width(0, segments.last().map_or(0, |s| s.visible_end as usize));
        PreparedText {
            advances,
            segments,
            metrics,
            flow,
            one_line_width,
            widest_piece,
        }
    }

    /// TextEngine.singleLineLayout lays text that fits out as a BoringLayout, whose width is
    /// whole pixels.
    fn fits_one_line(&self, limit: f32) -> bool {
        self.one_line_width <= limit - 0.5
    }

    fn drawn_as_boring_layout(&self, lines: &[Line], limit: f32) -> bool {
        lines.len() == 1 && self.one_line_width.ceil() <= limit
    }

    /// TextEngine.measureLayout's min-content width.
    fn min_content_width(&self) -> f32 {
        match self.flow {
            Flow::Inline if self.segments.len() <= 1 => self.one_line_width.ceil(),
            Flow::Inline => ceil_fine(self.widest_piece),
            Flow::Block => self.widest_piece.ceil(),
        }
    }

    fn lines(&self, limit: f32) -> Vec<Line> {
        let mut lines = Vec::new();
        let mut current: Option<Line> = None;
        let mut pending_space = 0f32;
        for segment in &self.segments {
            match current.as_mut() {
                Some(line) if line.width + pending_space + segment.visible_width <= limit => {
                    line.width += pending_space + segment.visible_width;
                }
                _ => {
                    lines.extend(current.take());
                    current = Some(if segment.visible_width > limit {
                        self.break_inside_segment(segment, limit, &mut lines)
                    } else {
                        Line {
                            start: segment.start,
                            width: segment.visible_width,
                        }
                    });
                }
            }
            pending_space = segment.hanging_space_width;
        }
        lines.extend(current);
        lines
    }

    /// Puts a segment wider than the line on lines of its own, breaking between characters as
    /// StaticLayout does, and returns the last of them.
    fn break_inside_segment(&self, segment: &Segment, limit: f32, lines: &mut Vec<Line>) -> Line {
        let mut line = Line {
            start: segment.start,
            width: 0.0,
        };
        for i in segment.start as usize..segment.visible_end as usize {
            let advance = self.advances[i];
            if line.width > 0.0 && line.width + advance > limit && advance > 0.0 {
                lines.push(line);
                line = Line {
                    start: i as u32,
                    width: 0.0,
                };
            }
            line.width += advance;
        }
        line
    }

    /// Each line's bottom: the running float sum of the line height, rounded, as
    /// NormalLineHeightSpan places it.
    fn line_bottoms(&self) -> impl Iterator<Item = i32> {
        let height = self.metrics.height;
        std::iter::successors(Some(height), move |bottom| Some(bottom + height))
            .map(|b| b.round() as i32)
    }

    pub fn line_boxes(&self, width: f32) -> Vec<LineBox> {
        let limit = ceil_constraint(width);
        let lines = self.lines(limit);
        let boring_layout = self.drawn_as_boring_layout(&lines, limit);
        let LineMetrics {
            ascent, descent, ..
        } = self.metrics;
        let mut top = 0;
        lines
            .iter()
            .zip(self.line_bottoms())
            .enumerate()
            .map(|(i, (line, bottom))| {
                let diff = (bottom - top) - (descent - ascent);
                let line_ascent = ascent - diff / 2;
                let end = lines
                    .get(i + 1)
                    .map_or(self.advances.len() as u32, |next| next.start);
                let line_box = LineBox {
                    start: line.start,
                    end,
                    width: if boring_layout {
                        line.width.ceil()
                    } else {
                        line.width
                    },
                    baseline: top - line_ascent,
                    ascent: line_ascent,
                    descent: descent + (diff - diff / 2),
                };
                top = bottom;
                line_box
            })
            .collect()
    }

    /// TextView.baselineFromTop: the last line's baseline in a content box `content` big.
    fn baseline_from_top(&self, content: Size<Option<f32>>) -> f32 {
        let width = content
            .width
            .filter(|&w| ceil_constraint(w) > 0.0)
            .unwrap_or(UNBOUNDED);
        let lines = self.line_boxes(width);
        let content_height = content.height.unwrap_or(0.0) as i32;
        let centring = match lines.as_slice() {
            [line] if content_height > 0 => {
                content_height as f32 / 2.0
                    - (line.baseline as f32 + (line.ascent + line.descent) as f32 / 2.0)
            }
            _ => 0.0,
        };
        centring + lines.last().map_or(0, |line| line.baseline) as f32
    }

    pub fn measure(&self, known: Size<Option<f32>>, available: Size<AvailableSpace>) -> Size<f32> {
        if available.width == AvailableSpace::Definite(BASELINE_QUERY) {
            return Size {
                width: self.baseline_from_top(known),
                height: BASELINE_QUERY,
            };
        }
        let known_width = known.width.filter(|_| self.flow.wraps_at_known_width());
        let constraint = match (known_width, available.width) {
            (Some(w), _) if w > 0.0 => Some(ceil_constraint(w)),
            (_, AvailableSpace::Definite(w)) if w > 0.0 && w.is_finite() => {
                Some(ceil_constraint(w))
            }
            _ => None,
        };
        let limit = constraint.unwrap_or(UNBOUNDED);
        let lines = self.lines(limit);
        let height = lines
            .len()
            .checked_sub(1)
            .and_then(|last| self.line_bottoms().nth(last))
            .unwrap_or(0) as f32;
        let width = if constraint.is_none() && available.width == AvailableSpace::MinContent {
            self.min_content_width()
        } else if self.fits_one_line(limit) {
            self.one_line_width.ceil()
        } else {
            lines.iter().map(|l| ceil_fine(l.width)).fold(0.0, f32::max)
        };
        Size {
            width,
            height: height.max(self.metrics.min_height),
        }
    }
}
