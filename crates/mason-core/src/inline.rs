use crate::tree::Id;
use taffy::Size;
pub struct InlineLineBuilder {
    pub(crate) wrap_width: f32,
    pub(crate) cursor_x: f32,
    pub(crate) cursor_y: f32,
    pub(crate) current: Vec<InlinePlaced>,
    pub(crate) lines: Vec<InlineLine>,
}

impl InlineLineBuilder {
    pub fn new(wrap_width: f32) -> Self {
        Self {
            wrap_width,
            cursor_x: 0.0,
            cursor_y: 0.0,
            current: Vec::new(),
            lines: Vec::new(),
        }
    }

    pub fn push_text(&mut self, width: f32, ascent: f32, descent: f32) {
        self.push_item(InlinePlaced {
            node: None,
            width,
            ascent,
            descent,
        });
    }

    pub fn push_node(&mut self, id: Id, size: Size<f32>, baseline: f32) {
        let ascent = baseline;
        let descent = (size.height - baseline).max(0.0);
        self.push_item(InlinePlaced {
            node: Some(id),
            width: size.width,
            ascent,
            descent,
        });
    }

    pub fn push_item(&mut self, item: InlinePlaced) {
        if self.cursor_x + item.width > self.wrap_width && !self.current.is_empty() {
            self.flush_line();
        }
        self.cursor_x += item.width;
        self.current.push(item);
    }

    fn flush_line(&mut self) {
        if self.current.is_empty() {
            return;
        }
        let mut baseline: f32 = 0.0;
        let mut descent: f32 = 0.0;
        let mut width: f32 = 0.0;
        for item in &self.current {
            baseline = baseline.max(item.ascent);
            descent = descent.max(item.descent);
            width += item.width;
        }
        let height = baseline + descent;
        self.lines.push(InlineLine {
            items: std::mem::take(&mut self.current),
            baseline,
            width,
            height,
            y_offset: self.cursor_y,
        });
        self.cursor_x = 0.0;
        self.cursor_y += height;
    }

    pub(crate) fn finish<F>(mut self, mut place: F) -> (f32, f32)
    where
        F: FnMut(Id, InlineFrame),
    {
        self.flush_line();

        let mut max_width: f32 = 0.0;
        let mut total_height = 0.0;

        for line in &self.lines {
            max_width = max_width.max(line.width);
            total_height = line.y_offset + line.height;
        }

        for line in self.lines {
            let mut x = 0.0;
            for item in line.items {
                if let Some(id) = item.node {
                    place(
                        id,
                        InlineFrame {
                            x,
                            y: line.y_offset + (line.baseline - item.ascent),
                            size: Size {
                                width: item.width,
                                height: item.ascent + item.descent,
                            },
                        },
                    );
                }
                x += item.width;
            }
        }

        (max_width, total_height)
    }
}

pub struct InlinePlaced {
    pub(crate) node: Option<Id>,
    pub(crate) width: f32,
    pub(crate) ascent: f32,
    pub(crate) descent: f32,
}

pub struct InlineLine {
    pub(crate) items: Vec<InlinePlaced>,
    pub(crate) baseline: f32,
    pub(crate) width: f32,
    pub(crate) height: f32,
    pub(crate) y_offset: f32,
}

pub(crate) struct InlineFrame {
    pub(crate) x: f32,
    pub(crate) y: f32,
    pub(crate) size: Size<f32>,
}
