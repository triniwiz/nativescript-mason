//! A measure-call budget over a realistic screen: a block root, an app-shell
//! layout with a sidebar and bottom nav, and sections of wrapping media
//! cards. Every text leaf counts its measures, so an exponential re-measure
//! shows up as a number, not a hang.

use mason_core::style::DisplayMode;
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicU64, Ordering};

static MEASURE_CALLS: AtomicU64 = AtomicU64::new(0);

thread_local! {
    /// The Mason handle the measure callback pushes segments through, exactly
    /// as the platform text engines do (`collectAndCacheSegments` on iOS).
    static PUSH_SEGMENTS: std::cell::RefCell<Option<*mut Mason>> =
        const { std::cell::RefCell::new(None) };
}

extern "C" fn measure_text(
    _data: *const c_void,
    known_w: c_float,
    _known_h: c_float,
    avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MEASURE_CALLS.fetch_add(1, Ordering::Relaxed);
    let w = if !known_w.is_nan() && known_w >= 0.0 {
        known_w
    } else if avail_w == -1.0 {
        40.0
    } else if avail_w > 0.0 && avail_w.is_finite() {
        avail_w.min(130.0)
    } else {
        130.0
    };
    // Write the resolved inline segments back, the way a real text engine does.
    PUSH_SEGMENTS.with(|slot| {
        if let Some(mason) = *slot.borrow() {
            let id = unsafe { &*(_data as *const Id) };
            unsafe {
                (*mason).set_segments(
                    *id,
                    vec![InlineSegment::Text {
                        flags: 0,
                        width: w,
                        ascent: 13.0,
                        descent: 3.0,
                    }],
                );
            }
        }
    });

    MeasureOutput::make(w, 16.0)
}

struct App {
    mason: Mason,
    ids: Vec<*mut Id>,
}

impl App {
    fn new() -> Self {
        Self {
            mason: Mason::new(),
            ids: Vec::new(),
        }
    }

    fn node(&mut self) -> Id {
        let n = self.mason.create_node();
        let id = n.id();
        std::mem::forget(n);
        id
    }

    fn text(&mut self) -> Id {
        let n = self.mason.create_text_node();
        let id = n.id();
        std::mem::forget(n);
        self.mason.with_style_mut(id, |s| {
            s.set_display(Display::Block);
            s.set_display_mode(DisplayMode::Inline);
        });
        // Leak the id so the measure callback can read which node it is for,
        // the way the platforms pass their node pointer through.
        let boxed = Box::into_raw(Box::new(id));
        self.ids.push(boxed);
        self.mason
            .set_measure(id, Some(measure_text), boxed as *mut std::ffi::c_void);
        self.mason.set_segments(
            id,
            vec![InlineSegment::Text {
                flags: 0,
                width: 40.0,
                ascent: 13.0,
                descent: 3.0,
            }],
        );
        id
    }

    fn flex(&mut self, dir: FlexDirection) -> Id {
        let id = self.node();
        self.mason.with_style_mut(id, |s| {
            s.set_display(Display::Flex);
            s.set_flex_direction(dir);
        });
        id
    }

    fn gap(&mut self, id: Id, g: f32) {
        self.mason.with_style_mut(id, |s| {
            s.set_gap(Size {
                width: LengthPercentage::length(g),
                height: LengthPercentage::length(g),
            });
        });
    }

    fn padding(&mut self, id: Id, p: f32) {
        self.mason.with_style_mut(id, |s| {
            s.set_padding(Rect {
                left: LengthPercentage::length(p),
                right: LengthPercentage::length(p),
                top: LengthPercentage::length(p),
                bottom: LengthPercentage::length(p),
            });
        });
    }

    /// A poster + title + row-of-meta card, like a media library tile.
    fn media_card(&mut self) -> Id {
        let card = self.flex(FlexDirection::Column);
        self.mason.with_style_mut(card, |s| {
            s.set_size(Size {
                width: Dimension::length(160.0),
                height: Dimension::auto(),
            });
        });

        let frame = self.flex(FlexDirection::Column);

        let poster = self.node();
        self.mason.with_style_mut(poster, |s| {
            s.set_size(Size {
                width: Dimension::length(160.0),
                height: Dimension::length(240.0),
            });
        });

        let content = self.flex(FlexDirection::Column);
        self.gap(content, 4.0);
        self.padding(content, 10.0);

        let title = self.text();

        let meta = self.flex(FlexDirection::Row);
        self.mason.with_style_mut(meta, |s| {
            s.set_justify_content(Some(JustifyContent::SPACE_BETWEEN));
        });
        let rating = self.text();
        let year = self.text();
        self.mason.append_node(meta, &[rating, year]);

        self.mason.append_node(content, &[title, meta]);
        self.mason.append_node(frame, &[poster, content]);
        self.mason.append_node(card, &[frame]);
        card
    }

    /// A section: header (title + subtitle) plus a wrapping grid of cards.
    fn section(&mut self, cards: usize) -> Id {
        let section = self.flex(FlexDirection::Column);
        self.gap(section, 16.0);

        let header = self.flex(FlexDirection::Column);
        self.gap(header, 4.0);
        let title = self.text();
        let subtitle = self.text();
        self.mason.append_node(header, &[title, subtitle]);

        let grid = self.flex(FlexDirection::Row);
        self.mason.with_style_mut(grid, |s| {
            s.set_flex_wrap(FlexWrap::Wrap);
        });
        self.gap(grid, 16.0);
        for _ in 0..cards {
            let card = self.media_card();
            self.mason.append_node(grid, &[card]);
        }

        self.mason.append_node(section, &[header, grid]);
        section
    }

    /// A hidden (display:none) sidebar nav, always present in the shell.
    fn sidebar(&mut self) -> Id {
        let nav = self.flex(FlexDirection::Column);
        self.mason.with_style_mut(nav, |s| {
            s.set_display(Display::None);
            s.set_size(Size {
                width: Dimension::length(220.0),
                height: Dimension::auto(),
            });
        });
        let brand = self.text();
        self.mason.append_node(nav, &[brand]);
        for _ in 0..3 {
            let section = self.flex(FlexDirection::Column);
            self.gap(section, 4.0);
            let heading = self.text();
            let a = self.text();
            let b = self.text();
            let c = self.text();
            self.mason.append_node(section, &[heading, a, b, c]);
            self.mason.append_node(nav, &[section]);
        }
        nav
    }

    fn bottom_nav(&mut self) -> Id {
        let nav = self.flex(FlexDirection::Row);
        self.mason.with_style_mut(nav, |s| {
            s.set_position(Position::Absolute);
            s.set_inset(Rect {
                left: LengthPercentageAuto::length(0.0),
                right: LengthPercentageAuto::length(0.0),
                top: LengthPercentageAuto::auto(),
                bottom: LengthPercentageAuto::length(0.0),
            });
        });
        for _ in 0..4 {
            let link = self.text();
            self.mason.with_style_mut(link, |s| {
                s.set_flex_grow(1.0);
            });
            self.mason.append_node(nav, &[link]);
        }
        nav
    }

    fn top_bar(&mut self) -> Id {
        let bar = self.flex(FlexDirection::Row);
        self.mason.with_style_mut(bar, |s| {
            s.set_justify_content(Some(JustifyContent::SPACE_BETWEEN));
        });
        self.padding(bar, 16.0);
        let brand = self.text();
        let search = self.text();
        self.mason.append_node(bar, &[brand, search]);
        bar
    }

    fn home(&mut self, sections: usize, cards: usize) -> Id {
        let root = self.node();
        self.mason.with_style_mut(root, |s| {
            s.set_display(Display::Block);
            s.set_size(Size {
                width: Dimension::length(402.0),
                height: Dimension::auto(),
            });
        });

        let shell = self.flex(FlexDirection::Column);
        self.mason.with_style_mut(shell, |s| {
            s.set_position(Position::Relative);
        });
        let sidebar = self.sidebar();
        let bottom = self.bottom_nav();

        let main = self.flex(FlexDirection::Column);
        self.mason.with_style_mut(main, |s| {
            // flex: 1; min-width: 0 — grows to fill, shrinks below content size.
            s.set_flex_grow(1.0);
            s.set_flex_shrink(1.0);
            s.set_flex_basis(Dimension::percent(0.0));
            s.set_min_size(Size {
                width: Dimension::length(0.0),
                height: Dimension::auto(),
            });
        });
        let top_bar = self.top_bar();

        let content = self.flex(FlexDirection::Column);
        self.gap(content, 32.0);
        self.padding(content, 24.0);

        for _ in 0..sections {
            let section = self.section(cards);
            self.mason.append_node(content, &[section]);
        }

        self.mason.append_node(main, &[top_bar, content]);
        self.mason.append_node(shell, &[sidebar, main, bottom]);
        self.mason.append_node(root, &[shell]);
        root
    }
}

fn measures(sections: usize, cards: usize) -> (u64, std::time::Duration) {
    let mut app = App::new();
    let root = app.home(sections, cards);
    MEASURE_CALLS.store(0, Ordering::Relaxed);
    let mason_ptr: *mut Mason = &mut app.mason;
    PUSH_SEGMENTS.with(|slot| *slot.borrow_mut() = Some(mason_ptr));
    let start = std::time::Instant::now();
    app.mason.compute_wh(root, 402.0, 874.0);
    let elapsed = start.elapsed();
    PUSH_SEGMENTS.with(|slot| *slot.borrow_mut() = None);
    (MEASURE_CALLS.load(Ordering::Relaxed), elapsed)
}

#[test]
fn home_screen_measure_budget() {
    for (sections, cards) in [(1, 1), (1, 2), (1, 4), (1, 8), (4, 20)] {
        let (calls, elapsed) = measures(sections, cards);
        let leaves = sections * (2 + cards * 3);
        println!(
            "{sections} section(s) x {cards} card(s): {leaves} text leaves, \
             {calls} measure calls ({:.1} per leaf) in {elapsed:?}",
            calls as f64 / leaves as f64
        );

        // Each leaf is measured a small, bounded number of times: min-content,
        // max-content and the resolved size, once per enclosing sizing context.
        // The budget is deliberately loose — it catches a *class* of
        // regression (a measure callback's write-back marking the tree dirty
        // and compounding cache misses up to the root), not an exact number.
        assert!(
            calls < leaves as u64 * 40,
            "{leaves} text leaves took {calls} measure callbacks \
             ({:.0} per leaf) — the layout is re-measuring, not caching",
            calls as f64 / leaves as f64
        );
    }
}
