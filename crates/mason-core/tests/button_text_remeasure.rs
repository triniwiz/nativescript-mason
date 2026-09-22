use mason_core::{InlineSegment, Mason, MeasureOutput, Size};
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicU32, Ordering};
use taffy::style::{Dimension, Display};

static BUTTON_TEXT_WIDTH: AtomicU32 = AtomicU32::new(40.0f32.to_bits());
static MEASURE_CALLS: AtomicU32 = AtomicU32::new(0);

extern "C" fn measure_button_text(
    _data: *const c_void,
    _known_width: c_float,
    _known_height: c_float,
    _available_width: c_float,
    _available_height: c_float,
) -> c_longlong {
    MEASURE_CALLS.fetch_add(1, Ordering::Relaxed);
    MeasureOutput::make(
        f32::from_bits(BUTTON_TEXT_WIDTH.load(Ordering::Relaxed)),
        20.0,
    )
}

#[test]
fn button_text_change_remeasures_existing_inline_segments() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    mason.with_style_mut(root.id(), |style| {
        style.set_display(Display::Flex);
        style.set_size(Size {
            width: Dimension::length(300.0),
            height: Dimension::auto(),
        });
    });

    let button = mason.create_button_node();
    mason.set_measure(button.id(), Some(measure_button_text), std::ptr::null_mut());
    mason.append_node(root.id(), &[button.id()]);

    BUTTON_TEXT_WIDTH.store(40.0f32.to_bits(), Ordering::Relaxed);
    MEASURE_CALLS.store(0, Ordering::Relaxed);
    mason.compute_wh(root.id(), 300.0, f32::NAN);
    let initial_width = mason.layout_raw(button.id()).size.width;
    assert!(MEASURE_CALLS.load(Ordering::Relaxed) > 0);

    // Android's text measurement populates inline segments as a side effect.
    // Keep those old segments in place to model a reactive text mutation.
    mason.set_segments(
        button.id(),
        vec![InlineSegment::Text {
            flags: 0,
            width: 40.0,
            ascent: 15.0,
            descent: 5.0,
        }],
    );
    mason.compute_wh(root.id(), 300.0, f32::NAN);

    BUTTON_TEXT_WIDTH.store(80.0f32.to_bits(), Ordering::Relaxed);
    MEASURE_CALLS.store(0, Ordering::Relaxed);
    mason.mark_dirty(button.id());
    mason.compute_wh(root.id(), 300.0, f32::NAN);

    let updated_width = mason.layout_raw(button.id()).size.width;
    assert!(
        MEASURE_CALLS.load(Ordering::Relaxed) > 0,
        "a dirty button must remeasure its current text"
    );
    assert!(
        updated_width > initial_width + 30.0,
        "button width should grow with its text: initial={initial_width}, updated={updated_width}"
    );
}
