use crate::node::BASELINE_QUERY;
use taffy::{AvailableSpace, Size};

const UNBOUNDED: f32 = 1_000_000.0;

#[derive(Debug, Clone, Copy)]
pub enum LineHeight {
    Normal(f32),
    /// StaticLayout carries each line's metrics to the next and grows them to the fonts that line
    /// uses. Rust grows them to the whole text's; TextEngine.prepare rejects texts where those
    /// differ.
    Fixed(f32),
}

impl LineHeight {
    fn px(self) -> f32 {
        match self {
            LineHeight::Normal(px) | LineHeight::Fixed(px) => px,
        }
    }

    fn carries_metrics(self) -> bool {
        matches!(self, LineHeight::Fixed(_))
    }
}

#[derive(Debug, Clone, Copy)]
pub struct LineMetrics {
    pub ascent: i32,
    pub descent: i32,
    pub line_height: LineHeight,
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

#[derive(Debug, Clone, Copy, Default)]
pub struct Paragraph {
    pub first_line_indent_px: i32,
    pub nowrap: bool,
    pub centers_vertically: bool,
}

#[derive(Debug, Clone, Copy)]
pub struct LineBox {
    pub start: u32,
    pub end: u32,
    /// Layout.getLineVisibleEnd: the line's end without the spaces that hang past it, which on
    /// the last line count as visible.
    pub visible_end: u32,
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

struct LineExtent {
    top: i32,
    ascent: i32,
    descent: i32,
}

#[derive(Debug)]
pub struct PreparedText {
    text: Vec<u16>,
    advances: Vec<f32>,
    segments: Vec<Segment>,
    metrics: LineMetrics,
    flow: Flow,
    paragraph: Paragraph,
    one_line_width: f32,
    widest_piece: f32,
    first_piece: f32,
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

fn visible_end(text: &[u16], start: usize, end: usize) -> usize {
    let mut visible_end = end;
    while visible_end > start && is_line_end_space(text[visible_end - 1]) {
        visible_end -= 1;
    }
    visible_end
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
        paragraph: Paragraph,
    ) -> Self {
        let width = |from: usize, to: usize| -> f32 { advances[from..to].iter().sum() };
        let mut segments = Vec::new();
        let mut widest_piece = 0f32;
        let mut first_piece = 0f32;
        let mut start = 0usize;
        for &end in breaks {
            let end = end as usize;
            if end < text.len() && is_line_breaking_hyphen(text[end - 1]) {
                continue;
            }
            let visible_end = visible_end(text, start, end);
            let mut piece_end = end;
            while piece_end > start && is_kotlin_whitespace(text[piece_end - 1]) {
                piece_end -= 1;
            }
            let piece = width(start, piece_end);
            widest_piece = widest_piece.max(piece);
            if start == 0 && piece_end > 0 {
                first_piece = piece;
            }
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
            text: text.to_vec(),
            advances,
            segments,
            metrics,
            flow,
            paragraph,
            one_line_width,
            widest_piece,
            first_piece,
        }
    }

    /// TextEngine.singleLineLayout lays text that fits out as a BoringLayout, whose width is
    /// whole pixels.
    fn fits_one_line(&self, limit: f32) -> bool {
        self.paragraph.first_line_indent_px == 0 && self.one_line_width <= limit - 0.5
    }

    fn drawn_as_boring_layout(&self, lines: &[Line], limit: f32) -> bool {
        self.paragraph.first_line_indent_px == 0
            && lines.len() == 1
            && self.one_line_width.ceil() <= limit
    }

    /// TextEngine.measureLayout's min-content width.
    fn min_content_width(&self) -> f32 {
        let piece = self
            .widest_piece
            .max(self.first_piece + self.paragraph.first_line_indent_px as f32);
        match self.flow {
            Flow::Inline if self.segments.len() <= 1 => {
                self.max_line_width(&self.lines(UNBOUNDED), UNBOUNDED)
            }
            Flow::Inline => ceil_fine(piece),
            Flow::Block => piece.ceil(),
        }
    }

    /// StaticLayoutCacheEntry.maxLineWidth (TextEngine).
    fn max_line_width(&self, lines: &[Line], limit: f32) -> f32 {
        if self.fits_one_line(limit) {
            return self.one_line_width.ceil();
        }
        let last = lines.len().saturating_sub(1);
        let indent = self.paragraph.first_line_indent_px as f32;
        lines
            .iter()
            .enumerate()
            .map(|(i, line)| {
                let width = ceil_fine(self.line_max(line, i == last));
                if i == 0 && indent != 0.0 {
                    (width + indent).max(0.0)
                } else {
                    width
                }
            })
            .fold(0.0, f32::max)
    }

    fn line_length(&self, limit: f32, line_index: usize) -> f32 {
        if line_index == 0 {
            limit - self.paragraph.first_line_indent_px as f32
        } else {
            limit
        }
    }

    fn lines(&self, limit: f32) -> Vec<Line> {
        let mut lines = Vec::new();
        let mut current: Option<Line> = None;
        let mut pending_space = 0f32;
        for segment in &self.segments {
            match current.as_mut() {
                Some(line)
                    if line.width + pending_space + segment.visible_width
                        <= self.line_length(limit, lines.len()) =>
                {
                    line.width += pending_space + segment.visible_width;
                }
                _ => {
                    lines.extend(current.take());
                    let line = if segment.visible_width > self.line_length(limit, lines.len()) {
                        self.break_inside_segment(segment, limit, &mut lines)
                    } else {
                        Line {
                            start: segment.start,
                            width: segment.visible_width,
                        }
                    };
                    current = if line.width > self.line_length(limit, lines.len()) {
                        // Minikin breaks right after a character wider than the line, so the
                        // spaces after it start the next line instead of hanging.
                        lines.push(line);
                        (segment.hanging_space_width > 0.0).then_some(Line {
                            start: segment.visible_end,
                            width: 0.0,
                        })
                    } else {
                        Some(line)
                    };
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
            if line.width > 0.0
                && line.width + advance > self.line_length(limit, lines.len())
                && advance > 0.0
            {
                let visible = line.start as usize..visible_end(&self.text, line.start as usize, i);
                line.width = self.advances[visible].iter().sum();
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

    /// Each line's bottom, the rounded running sum of the line height. LineBoxes.apply takes a line
    /// at the same top as the one before it for that line again, so it adds nothing to the sum.
    fn line_bottoms(&self) -> impl Iterator<Item = i32> {
        let height = self.metrics.line_height.px();
        let mut top = 0;
        let mut sum = 0f32;
        std::iter::repeat_with(move || {
            let bottom = (sum + height).round() as i32;
            if bottom != top {
                sum += height;
                top = bottom;
            }
            bottom
        })
    }

    pub fn line_boxes(&self, width: f32) -> Vec<LineBox> {
        // TextView builds no StaticLayout to draw in a box with no width.
        if !(width > 0.0 && width.is_finite()) {
            return Vec::new();
        }
        let limit = if self.paragraph.nowrap {
            UNBOUNDED
        } else {
            ceil_constraint(width)
        };
        let lines = self.lines(limit);
        let boring_layout = self.drawn_as_boring_layout(&lines, limit);
        lines
            .iter()
            .zip(self.line_extents())
            .enumerate()
            .map(|(i, (line, extent))| {
                let next = lines.get(i + 1);
                let end = next.map_or(self.advances.len() as u32, |next| next.start);
                LineBox {
                    start: line.start,
                    end,
                    visible_end: if next.is_some() {
                        visible_end(&self.text, line.start as usize, end as usize) as u32
                    } else {
                        end
                    },
                    width: if boring_layout {
                        line.width.ceil()
                    } else {
                        self.line_max(line, next.is_none())
                    },
                    baseline: extent.top - extent.ascent,
                    ascent: extent.ascent,
                    descent: extent.descent,
                }
            })
            .collect()
    }

    /// TextNode.LineBoxes.apply.
    fn line_extents(&self) -> impl Iterator<Item = LineExtent> + '_ {
        let LineMetrics {
            ascent,
            descent,
            line_height,
            ..
        } = self.metrics;
        let mut top = 0;
        let mut carried_metrics = (ascent, descent);
        self.line_bottoms().map(move |bottom| {
            let (above, below) = if line_height.carries_metrics() {
                (
                    carried_metrics.0.min(ascent),
                    carried_metrics.1.max(descent),
                )
            } else {
                (ascent, descent)
            };
            let diff = (bottom - top) - (below - above);
            carried_metrics = (above - diff / 2, below + (diff - diff / 2));
            let extent = LineExtent {
                top,
                ascent: carried_metrics.0,
                descent: carried_metrics.1,
            };
            top = bottom;
            extent
        })
    }

    /// Layout.getLineMax, which counts the trailing spaces of the last line.
    fn line_max(&self, line: &Line, last: bool) -> f32 {
        if last {
            self.advances[line.start as usize..].iter().sum()
        } else {
            line.width
        }
    }

    /// TextView.baselineFromTop: the last line's baseline in a content box `content` big.
    fn baseline_from_top(&self, content: Size<Option<f32>>) -> f32 {
        let width = content
            .width
            .filter(|&w| ceil_constraint(w) > 0.0)
            .unwrap_or(UNBOUNDED);
        let lines = self.line_boxes(width);
        let content_height = content.height.unwrap_or(0.0) as i32;
        let text_height = lines.last().map_or(0, |line| line.baseline + line.descent);
        let centring = match lines.as_slice() {
            [line] if content_height > 0 => {
                content_height as f32 / 2.0
                    - (line.baseline as f32 + (line.ascent + line.descent) as f32 / 2.0)
            }
            _ if self.paragraph.centers_vertically && content_height > text_height => {
                (content_height - text_height) as f32 / 2.0
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
        let wraps = !self.paragraph.nowrap;
        let known_width = known.width.filter(|_| self.flow.wraps_at_known_width());
        let constraint = match (known_width, available.width) {
            _ if !wraps => None,
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
        let width =
            if wraps && constraint.is_none() && available.width == AvailableSpace::MinContent {
                self.min_content_width()
            } else {
                self.max_line_width(&lines, limit)
            };
        Size {
            width,
            height: height.max(self.metrics.min_height),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const METRICS: LineMetrics = LineMetrics {
        ascent: -30,
        descent: 8,
        line_height: LineHeight::Normal(43.066),
        min_height: 0.0,
    };

    fn prepared(text: &str, advances: Vec<f32>, breaks: &[u32], flow: Flow) -> PreparedText {
        indented(text, advances, breaks, flow, 0)
    }

    fn indented(
        text: &str,
        advances: Vec<f32>,
        breaks: &[u32],
        flow: Flow,
        indent: i32,
    ) -> PreparedText {
        let text: Vec<u16> = text.encode_utf16().collect();
        let paragraph = Paragraph {
            first_line_indent_px: indent,
            ..Paragraph::default()
        };
        PreparedText::new(&text, advances, breaks, METRICS, flow, paragraph)
    }

    fn unwrapped(text: &str, advance: f32, breaks: &[u32], flow: Flow) -> PreparedText {
        let text_utf16: Vec<u16> = text.encode_utf16().collect();
        let advances = vec![advance; text_utf16.len()];
        let paragraph = Paragraph {
            nowrap: true,
            ..Paragraph::default()
        };
        PreparedText::new(&text_utf16, advances, breaks, METRICS, flow, paragraph)
    }

    fn ten_words_indented(indent: i32) -> PreparedText {
        let text = "a b c d e f g h i j";
        let breaks = [2, 4, 6, 8, 10, 12, 14, 16, 18, 19];
        indented(text, vec![10.0; 19], &breaks, Flow::Block, indent)
    }

    fn starts(text: &PreparedText, width: f32) -> Vec<u32> {
        text.line_boxes(width)
            .iter()
            .map(|line| line.start)
            .collect()
    }

    fn evenly(text: &str, advance: f32, breaks: &[u32], flow: Flow) -> PreparedText {
        prepared(
            text,
            vec![advance; text.encode_utf16().count()],
            breaks,
            flow,
        )
    }

    fn ten_words() -> PreparedText {
        evenly(
            "a b c d e f g h i j",
            10.0,
            &[2, 4, 6, 8, 10, 12, 14, 16, 18, 19],
            Flow::Block,
        )
    }

    fn visible_ends(text: &PreparedText, width: f32) -> Vec<u32> {
        text.line_boxes(width)
            .iter()
            .map(|line| line.visible_end)
            .collect()
    }

    fn lines(text: &PreparedText, width: f32) -> Vec<(u32, u32, f32)> {
        text.line_boxes(width)
            .iter()
            .map(|line| (line.start, line.end, line.width))
            .collect()
    }

    fn measure(text: &PreparedText, width: AvailableSpace) -> Size<f32> {
        text.measure(
            Size::NONE,
            Size {
                width,
                height: AvailableSpace::MaxContent,
            },
        )
    }

    #[test]
    fn no_lines_in_a_box_with_no_width() {
        let text = evenly("Two words", 10.0, &[4, 9], Flow::Block);
        for width in [0.0, -10.0, f32::NAN] {
            assert_eq!(lines(&text, width), [], "lines at {width}");
        }
    }

    #[test]
    fn trailing_spaces_hang_past_the_line_end() {
        let text = evenly("abc de   ", 10.0, &[4, 9], Flow::Block);
        assert_eq!(lines(&text, 65.0), [(0, 9, 60.0)], "at the end of the text");
        let text = evenly("abc     def", 10.0, &[8, 11], Flow::Block);
        assert_eq!(
            lines(&text, 35.0),
            [(0, 8, 30.0), (8, 11, 30.0)],
            "between words"
        );
    }

    #[test]
    fn a_word_wider_than_the_line_breaks_inside_and_the_next_word_joins_its_end() {
        let text = evenly("abcdefg h ijkl", 10.0, &[8, 10, 14], Flow::Block);
        assert_eq!(
            lines(&text, 55.0),
            [(0, 5, 50.0), (5, 10, 40.0), (10, 14, 40.0)]
        );
    }

    #[test]
    fn line_tops_round_the_running_sum_of_the_line_height() {
        let tops: Vec<i32> = ten_words()
            .line_boxes(15.0)
            .iter()
            .map(|line| line.baseline + line.ascent)
            .collect();
        assert_eq!(tops, [0, 43, 86, 129, 172, 215, 258, 301, 345, 388]);
    }

    #[test]
    fn min_content_width() {
        let min_content = |text: &PreparedText| measure(text, AvailableSpace::MinContent).width;
        assert_eq!(
            min_content(&evenly("word", 10.3, &[4], Flow::Inline)),
            42.0,
            "inline text with no break: its one-line width rounded up"
        );
        assert_eq!(
            min_content(&evenly("ab cde", 10.3, &[3, 6], Flow::Inline)),
            30.90625,
            "inline text: its widest piece rounded up to a 64th"
        );
        assert_eq!(
            min_content(&evenly("ab cde", 10.3, &[3, 6], Flow::Block)),
            31.0,
            "block text: its widest piece rounded up to a pixel"
        );
    }

    #[test]
    fn no_break_after_a_line_breaking_hyphen() {
        let text = evenly("well-known ab", 10.0, &[5, 11, 13], Flow::Block);
        assert_eq!(lines(&text, 75.0), [(0, 7, 70.0), (7, 13, 60.0)]);
    }

    #[test]
    fn one_line_text_is_whole_pixels_wide_only_where_it_fits_a_boring_layout() {
        let fits = prepared("ab", vec![15.25, 15.25], &[2], Flow::Block);
        let just_over = prepared("ab", vec![15.25, 15.375], &[2], Flow::Block);
        let definite = AvailableSpace::Definite(31.0);
        assert_eq!(
            measure(&fits, definite).width,
            31.0,
            "0.5 px narrower than the width: measured as a BoringLayout"
        );
        assert_eq!(
            measure(&just_over, definite).width,
            30.625,
            "under 0.5 px narrower: measured as a StaticLayout line"
        );
        assert_eq!(
            lines(&just_over, 31.0),
            [(0, 2, 31.0)],
            "drawn as a BoringLayout once its rounded width fits"
        );
        let wide = prepared("W", vec![30.5], &[1], Flow::Block);
        assert_eq!(
            lines(&wide, 30.0),
            [(0, 1, 30.5)],
            "wider than the width: drawn as a StaticLayout line"
        );
    }

    #[test]
    fn max_content_is_the_one_line_width_without_trailing_spaces_rounded_up() {
        let text = evenly("ab cde  ", 10.3, &[3, 8], Flow::Block);
        let size = measure(&text, AvailableSpace::MaxContent);
        assert_eq!((size.width, size.height), (62.0, 43.0));
    }

    #[test]
    fn a_measure_at_a_definite_width_wraps_to_it() {
        let size = measure(&ten_words(), AvailableSpace::Definite(15.0));
        assert_eq!((size.width, size.height), (10.0, 431.0));
    }

    fn baselines(line_height: LineHeight) -> Vec<i32> {
        let text: Vec<u16> = "a b c d".encode_utf16().collect();
        let metrics = LineMetrics {
            line_height,
            ..METRICS
        };
        let paragraph = Paragraph::default();
        PreparedText::new(
            &text,
            vec![10.0; 7],
            &[2, 4, 6, 7],
            metrics,
            Flow::Block,
            paragraph,
        )
        .line_boxes(15.0)
        .iter()
        .map(|line| line.baseline)
        .collect()
    }

    #[test]
    fn an_explicit_line_height_carries_each_lines_ascent_to_the_next() {
        assert_eq!(baselines(LineHeight::Fixed(49.6)), [36, 86, 135, 185]);
        assert_eq!(
            baselines(LineHeight::Normal(49.6)),
            [36, 85, 135, 184],
            "line-height: normal starts each line from the text's metrics"
        );
    }

    #[test]
    fn an_explicit_line_height_below_the_fonts_is_split_from_the_texts_metrics() {
        assert_eq!(baselines(LineHeight::Fixed(20.4)), [21, 42, 62, 83]);
    }

    #[test]
    fn an_indent_narrows_the_first_line() {
        assert_eq!(starts(&ten_words_indented(0), 45.0), [0, 4, 8, 12, 16]);
        assert_eq!(starts(&ten_words_indented(20), 45.0), [0, 2, 6, 10, 14, 18]);
        assert_eq!(
            starts(&ten_words_indented(-10), 45.0),
            [0, 6, 10, 14, 18],
            "a negative indent widens it"
        );
        assert_eq!(
            starts(&ten_words_indented(60), 45.0),
            [0, 1, 6, 10, 14, 18],
            "an indent wider than the line leaves its first character alone on it"
        );
    }

    #[test]
    fn an_indented_texts_width_counts_the_indent_on_its_first_line() {
        let width = |indent: i32| {
            measure(&ten_words_indented(indent), AvailableSpace::Definite(45.0)).width
        };
        assert_eq!(width(30), 40.0, "a 10 px first line after a 30 px indent");
        assert_eq!(width(-10), 40.0, "a 50 px first line after a -10 px indent");
        let one_word = indented("W", vec![10.0], &[1], Flow::Block, -100);
        assert_eq!(
            measure(&one_word, AvailableSpace::MaxContent).width,
            0.0,
            "a line pulled further left than it is wide is no width"
        );
    }

    #[test]
    fn an_indented_line_is_never_measured_as_a_boring_layout() {
        let text = |indent| indented("ab", vec![15.25, 15.25], &[2], Flow::Block, indent);
        let definite = AvailableSpace::Definite(40.0);
        assert_eq!(measure(&text(0), definite).width, 31.0);
        assert_eq!(measure(&text(1), definite).width, 31.5);
    }

    #[test]
    fn min_content_counts_the_indent_before_the_first_piece() {
        let min_content = |text: &PreparedText| measure(text, AvailableSpace::MinContent).width;
        let text = |flow, indent| indented("ab cde", vec![10.3; 6], &[3, 6], flow, indent);
        assert_eq!(
            min_content(&text(Flow::Block, 15)),
            36.0,
            "20.6 + 15 beats 30.9"
        );
        assert_eq!(
            min_content(&text(Flow::Block, 5)),
            31.0,
            "20.6 + 5 does not"
        );
        assert_eq!(min_content(&text(Flow::Inline, 15)), 35.609375);
        let word = indented("word", vec![10.3; 4], &[4], Flow::Inline, 5);
        assert_eq!(
            min_content(&word),
            46.203125,
            "inline text with no break: the width of its one indented line"
        );
    }

    #[test]
    fn unwrapped_text_stays_on_one_line_at_any_width() {
        let text = unwrapped("ab cde fg", 10.0, &[3, 7, 9], Flow::Block);
        assert_eq!(lines(&text, 25.0), [(0, 9, 90.0)]);
        assert_eq!(lines(&text, 0.0), [], "no lines in a box with no width");
        let size = measure(&text, AvailableSpace::Definite(25.0));
        assert_eq!((size.width, size.height), (90.0, 43.0));
        let known = text.measure(
            Size {
                width: Some(25.0),
                height: None,
            },
            Size {
                width: AvailableSpace::Definite(25.0),
                height: AvailableSpace::MaxContent,
            },
        );
        assert_eq!(known.width, 90.0, "a known width doesn't wrap it either");
    }

    #[test]
    fn unwrapped_texts_min_content_is_its_line() {
        for flow in [Flow::Block, Flow::Inline] {
            let text = unwrapped("ab cde fg", 10.3, &[3, 7, 9], flow);
            assert_eq!(
                measure(&text, AvailableSpace::MinContent).width,
                93.0,
                "{flow:?}"
            );
        }
    }

    fn baseline_in(text: &PreparedText, width: f32, height: f32) -> f32 {
        let size = text.measure(
            Size {
                width: Some(width),
                height: Some(height),
            },
            Size {
                width: AvailableSpace::Definite(BASELINE_QUERY),
                height: AvailableSpace::MaxContent,
            },
        );
        size.width
    }

    #[test]
    fn a_button_centres_several_lines_in_its_box() {
        let lines = |centers_vertically| {
            let text: Vec<u16> = "a b".encode_utf16().collect();
            let paragraph = Paragraph {
                centers_vertically,
                ..Paragraph::default()
            };
            PreparedText::new(
                &text,
                vec![10.0; 3],
                &[2, 3],
                METRICS,
                Flow::Block,
                paragraph,
            )
        };
        assert_eq!(baseline_in(&lines(false), 15.0, 120.0), 75.0);
        assert_eq!(baseline_in(&lines(true), 15.0, 120.0), 92.0);
        assert_eq!(
            baseline_in(&lines(true), 15.0, 80.3),
            75.0,
            "no centring in a box shorter than the lines"
        );
    }

    #[test]
    fn a_line_with_no_height_leaves_the_lines_after_it_where_it_is() {
        assert_eq!(baselines(LineHeight::Fixed(0.416)), [11, 11, 11, 11]);
        assert_eq!(baselines(LineHeight::Fixed(0.7875)), [12, 13, 13, 13]);
    }

    #[test]
    fn a_wrapped_texts_last_line_counts_its_trailing_spaces_in_its_width() {
        let text = evenly("ab cdefg  ", 10.0, &[3, 10], Flow::Block);
        assert_eq!(
            lines(&text, 75.0),
            [(0, 3, 20.0), (3, 10, 70.0)],
            "the last line's two spaces count"
        );
        assert_eq!(measure(&text, AvailableSpace::Definite(75.0)).width, 70.0);
    }

    fn with_a_wide_w(value: &str, breaks: &[u32]) -> PreparedText {
        let advances = value
            .chars()
            .map(|c| if c == 'W' { 35.0 } else { 10.0 })
            .collect();
        prepared(value, advances, breaks, Flow::Block)
    }

    #[test]
    fn spaces_after_a_character_wider_than_the_line_start_the_next_line() {
        let w_b_c = with_a_wide_w("W b c", &[2, 4, 5]);
        assert_eq!(
            lines(&w_b_c, 30.0),
            [(0, 1, 35.0), (1, 4, 20.0), (4, 5, 10.0)],
            "the space leads the next word's line"
        );
        assert_eq!(
            lines(&w_b_c, 15.0),
            [(0, 1, 35.0), (1, 2, 0.0), (2, 4, 10.0), (4, 5, 10.0)],
            "a line of its own when the next word doesn't fit after it"
        );
        assert_eq!(
            lines(&with_a_wide_w("ab W", &[3, 4]), 30.0),
            [(0, 3, 20.0), (3, 4, 35.0)]
        );
        assert_eq!(
            lines(&with_a_wide_w("ab W ", &[3, 5]), 30.0),
            [(0, 3, 20.0), (3, 4, 35.0), (4, 5, 10.0)],
            "a last line of just the trailing space"
        );
    }

    #[test]
    fn a_line_is_visible_up_to_its_hanging_spaces_but_the_last_line_counts_them() {
        let text = evenly("abc  def  ", 10.0, &[5, 10], Flow::Block);
        assert_eq!(visible_ends(&text, 45.0), [3, 10]);
    }

    #[test]
    fn a_line_broken_after_a_space_inside_a_segment_is_visible_and_as_wide_as_up_to_the_space() {
        let text = evenly("((( wxyz", 10.0, &[8], Flow::Block);
        assert_eq!(visible_ends(&text, 45.0), [3, 8]);
        assert_eq!(lines(&text, 45.0), [(0, 4, 30.0), (4, 8, 40.0)]);
    }

    #[test]
    fn a_line_broken_inside_a_word_is_visible_to_its_end() {
        let text = evenly("abcdefg h", 10.0, &[8, 9], Flow::Block);
        assert_eq!(visible_ends(&text, 35.0), [3, 6, 9]);
    }
}
