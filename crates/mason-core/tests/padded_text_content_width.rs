use mason_core::style::DisplayMode;
use mason_core::{Mason, MeasureOutput, Rect, Size};
use std::ffi::{c_float, c_longlong, c_void};
use taffy::style::{Dimension, Display, LengthPercentage};

/// Ten 40 px words, 20 px lines, wrapped at the known width or else the available width.
extern "C" fn ten_words(
    _data: *const c_void,
    known_width: c_float,
    _known_height: c_float,
    available_width: c_float,
    _available_height: c_float,
) -> c_longlong {
    let width = if known_width >= 0.0 {
        known_width
    } else if available_width == -1.0 {
        40.0
    } else if available_width >= 0.0 {
        available_width
    } else {
        400.0
    };
    let words_per_line = ((width / 40.0).floor() as i32).clamp(1, 10);
    let lines = (10 + words_per_line - 1) / words_per_line;
    MeasureOutput::make(words_per_line.min(10) as f32 * 40.0, lines as f32 * 20.0)
}

fn padded_text_height(container: Display, own_width: Dimension) -> f32 {
    let mut mason = Mason::new();
    let root = mason.create_node();
    mason.with_style_mut(root.id(), |style| {
        style.set_display(container);
        style.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
    });
    let text = mason.create_text_node();
    mason.set_measure(text.id(), Some(ten_words), std::ptr::null_mut());
    mason.with_style_mut(text.id(), |style| {
        style.set_display(Display::Block);
        style.set_display_mode(DisplayMode::None);
        style.set_size(Size {
            width: own_width,
            height: Dimension::auto(),
        });
        style.set_padding(Rect {
            left: LengthPercentage::length(40.0),
            right: LengthPercentage::length(40.0),
            top: LengthPercentage::length(0.0),
            bottom: LengthPercentage::length(0.0),
        });
    });
    mason.append_node(root.id(), &[text.id()]);
    mason.compute_wh(root.id(), 200.0, f32::NAN);
    mason.layout_raw(text.id()).size.height
}

#[test]
fn padded_text_is_measured_at_its_content_width() {
    let mut mismatches = Vec::new();
    for container in [Display::Block, Display::Flex, Display::Grid] {
        for (name, own_width) in [
            ("auto", Dimension::auto()),
            ("200px", Dimension::length(200.0)),
            ("100%", Dimension::percent(1.0)),
        ] {
            // 120 px of content holds three words, so ten words take four lines.
            let height = padded_text_height(container, own_width);
            if height != 80.0 {
                mismatches.push(format!("{container:?}, width {name}: {height}"));
            }
        }
    }
    assert_eq!(mismatches, Vec::<String>::new());
}
