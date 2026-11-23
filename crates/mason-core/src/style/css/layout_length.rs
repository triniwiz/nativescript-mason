use super::length::{Component, LengthPercentage};
use super::LengthContext;
use crate::style::StyleKeys;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Weak};

// <style-keys:layout-math-code>
pub(crate) const BUFFER_TYPE: i8 = 10;
// </style-keys:layout-math-code>

#[derive(Clone, Copy, Debug)]
pub(crate) enum Stamp {
    None,
    Physical(StyleKeys, usize, u32),
    Logical(StyleKeys, usize),
}

pub(crate) fn field(property: &str) -> Option<(StyleKeys, StyleKeys, Stamp, bool)> {
    let field = match property {
        // <style-keys:layout-math>
        "width" => (StyleKeys::WIDTH_TYPE, StyleKeys::WIDTH_VALUE, Stamp::Physical(StyleKeys::SIZE_ORDER, 12, 1), false),
        "height" => (StyleKeys::HEIGHT_TYPE, StyleKeys::HEIGHT_VALUE, Stamp::Physical(StyleKeys::SIZE_ORDER, 12, 2), false),
        "min-width" => (StyleKeys::MIN_WIDTH_TYPE, StyleKeys::MIN_WIDTH_VALUE, Stamp::Physical(StyleKeys::SIZE_ORDER, 12, 4), false),
        "min-height" => (StyleKeys::MIN_HEIGHT_TYPE, StyleKeys::MIN_HEIGHT_VALUE, Stamp::Physical(StyleKeys::SIZE_ORDER, 12, 8), false),
        "max-width" => (StyleKeys::MAX_WIDTH_TYPE, StyleKeys::MAX_WIDTH_VALUE, Stamp::Physical(StyleKeys::SIZE_ORDER, 12, 16), false),
        "max-height" => (StyleKeys::MAX_HEIGHT_TYPE, StyleKeys::MAX_HEIGHT_VALUE, Stamp::Physical(StyleKeys::SIZE_ORDER, 12, 32), false),
        "flex-basis" => (StyleKeys::FLEX_BASIS_TYPE, StyleKeys::FLEX_BASIS_VALUE, Stamp::None, false),
        "row-gap" => (StyleKeys::GAP_ROW_TYPE, StyleKeys::GAP_ROW_VALUE, Stamp::None, false),
        "column-gap" => (StyleKeys::GAP_COLUMN_TYPE, StyleKeys::GAP_COLUMN_VALUE, Stamp::None, false),
        "top" => (StyleKeys::INSET_TOP_TYPE, StyleKeys::INSET_TOP_VALUE, Stamp::Physical(StyleKeys::INSET_ORDER, 8, 1), true),
        "right" => (StyleKeys::INSET_RIGHT_TYPE, StyleKeys::INSET_RIGHT_VALUE, Stamp::Physical(StyleKeys::INSET_ORDER, 8, 2), true),
        "bottom" => (StyleKeys::INSET_BOTTOM_TYPE, StyleKeys::INSET_BOTTOM_VALUE, Stamp::Physical(StyleKeys::INSET_ORDER, 8, 4), true),
        "left" => (StyleKeys::INSET_LEFT_TYPE, StyleKeys::INSET_LEFT_VALUE, Stamp::Physical(StyleKeys::INSET_ORDER, 8, 8), true),
        "margin-top" => (StyleKeys::MARGIN_TOP_TYPE, StyleKeys::MARGIN_TOP_VALUE, Stamp::Physical(StyleKeys::MARGIN_ORDER, 8, 1), true),
        "margin-right" => (StyleKeys::MARGIN_RIGHT_TYPE, StyleKeys::MARGIN_RIGHT_VALUE, Stamp::Physical(StyleKeys::MARGIN_ORDER, 8, 2), true),
        "margin-bottom" => (StyleKeys::MARGIN_BOTTOM_TYPE, StyleKeys::MARGIN_BOTTOM_VALUE, Stamp::Physical(StyleKeys::MARGIN_ORDER, 8, 4), true),
        "margin-left" => (StyleKeys::MARGIN_LEFT_TYPE, StyleKeys::MARGIN_LEFT_VALUE, Stamp::Physical(StyleKeys::MARGIN_ORDER, 8, 8), true),
        "padding-top" => (StyleKeys::PADDING_TOP_TYPE, StyleKeys::PADDING_TOP_VALUE, Stamp::Physical(StyleKeys::PADDING_ORDER, 8, 1), false),
        "padding-right" => (StyleKeys::PADDING_RIGHT_TYPE, StyleKeys::PADDING_RIGHT_VALUE, Stamp::Physical(StyleKeys::PADDING_ORDER, 8, 2), false),
        "padding-bottom" => (StyleKeys::PADDING_BOTTOM_TYPE, StyleKeys::PADDING_BOTTOM_VALUE, Stamp::Physical(StyleKeys::PADDING_ORDER, 8, 4), false),
        "padding-left" => (StyleKeys::PADDING_LEFT_TYPE, StyleKeys::PADDING_LEFT_VALUE, Stamp::Physical(StyleKeys::PADDING_ORDER, 8, 8), false),
        "inline-size" => (StyleKeys::INLINE_SIZE_TYPE, StyleKeys::INLINE_SIZE_VALUE, Stamp::Logical(StyleKeys::SIZE_ORDER, 6), false),
        "block-size" => (StyleKeys::BLOCK_SIZE_TYPE, StyleKeys::BLOCK_SIZE_VALUE, Stamp::Logical(StyleKeys::SIZE_ORDER, 7), false),
        "min-inline-size" => (StyleKeys::MIN_INLINE_SIZE_TYPE, StyleKeys::MIN_INLINE_SIZE_VALUE, Stamp::Logical(StyleKeys::SIZE_ORDER, 8), false),
        "min-block-size" => (StyleKeys::MIN_BLOCK_SIZE_TYPE, StyleKeys::MIN_BLOCK_SIZE_VALUE, Stamp::Logical(StyleKeys::SIZE_ORDER, 9), false),
        "max-inline-size" => (StyleKeys::MAX_INLINE_SIZE_TYPE, StyleKeys::MAX_INLINE_SIZE_VALUE, Stamp::Logical(StyleKeys::SIZE_ORDER, 10), false),
        "max-block-size" => (StyleKeys::MAX_BLOCK_SIZE_TYPE, StyleKeys::MAX_BLOCK_SIZE_VALUE, Stamp::Logical(StyleKeys::SIZE_ORDER, 11), false),
        "inset-block-start" => (StyleKeys::INSET_BLOCK_START_TYPE, StyleKeys::INSET_BLOCK_START_VALUE, Stamp::Logical(StyleKeys::INSET_ORDER, 4), true),
        "inset-inline-end" => (StyleKeys::INSET_INLINE_END_TYPE, StyleKeys::INSET_INLINE_END_VALUE, Stamp::Logical(StyleKeys::INSET_ORDER, 5), true),
        "inset-block-end" => (StyleKeys::INSET_BLOCK_END_TYPE, StyleKeys::INSET_BLOCK_END_VALUE, Stamp::Logical(StyleKeys::INSET_ORDER, 6), true),
        "inset-inline-start" => (StyleKeys::INSET_INLINE_START_TYPE, StyleKeys::INSET_INLINE_START_VALUE, Stamp::Logical(StyleKeys::INSET_ORDER, 7), true),
        "margin-block-start" => (StyleKeys::MARGIN_BLOCK_START_TYPE, StyleKeys::MARGIN_BLOCK_START_VALUE, Stamp::Logical(StyleKeys::MARGIN_ORDER, 4), true),
        "margin-inline-end" => (StyleKeys::MARGIN_INLINE_END_TYPE, StyleKeys::MARGIN_INLINE_END_VALUE, Stamp::Logical(StyleKeys::MARGIN_ORDER, 5), true),
        "margin-block-end" => (StyleKeys::MARGIN_BLOCK_END_TYPE, StyleKeys::MARGIN_BLOCK_END_VALUE, Stamp::Logical(StyleKeys::MARGIN_ORDER, 6), true),
        "margin-inline-start" => (StyleKeys::MARGIN_INLINE_START_TYPE, StyleKeys::MARGIN_INLINE_START_VALUE, Stamp::Logical(StyleKeys::MARGIN_ORDER, 7), true),
        "padding-block-start" => (StyleKeys::PADDING_BLOCK_START_TYPE, StyleKeys::PADDING_BLOCK_START_VALUE, Stamp::Logical(StyleKeys::PADDING_ORDER, 4), false),
        "padding-inline-end" => (StyleKeys::PADDING_INLINE_END_TYPE, StyleKeys::PADDING_INLINE_END_VALUE, Stamp::Logical(StyleKeys::PADDING_ORDER, 5), false),
        "padding-block-end" => (StyleKeys::PADDING_BLOCK_END_TYPE, StyleKeys::PADDING_BLOCK_END_VALUE, Stamp::Logical(StyleKeys::PADDING_ORDER, 6), false),
        "padding-inline-start" => (StyleKeys::PADDING_INLINE_START_TYPE, StyleKeys::PADDING_INLINE_START_VALUE, Stamp::Logical(StyleKeys::PADDING_ORDER, 7), false),
        // </style-keys:layout-math>
        _ => return None,
    };
    Some(field)
}

// Taffy reserves the bottom three bits of its opaque calc handle for tags.
const TAG_BITS: u32 = 3;
const NEXT_LIMIT: u32 = if usize::BITS == 32 {
    u32::MAX >> TAG_BITS
} else {
    u32::MAX
};
#[derive(Default)]
struct LayoutLengths {
    last_id: u32,
    values: HashMap<u32, Weak<LayoutLength>>,
}

static LENGTHS: LazyLock<RwLock<LayoutLengths>> = LazyLock::new(Default::default);

#[derive(Debug)]
pub(crate) struct LayoutLength {
    id: u32,
    value: LengthPercentage,
    context: LengthContext,
    allow_negative: bool,
}

impl LayoutLength {
    pub(crate) fn parse(
        value: &str,
        context: LengthContext,
        allow_negative: bool,
    ) -> Option<Arc<Self>> {
        let component @ Component::Math(..) = Component::parse(value)? else {
            return None;
        };
        let value = LengthPercentage::parse(&component)?;
        let mut lengths = LENGTHS.write();
        let id = lengths
            .last_id
            .checked_add(1)
            .filter(|id| *id <= NEXT_LIMIT)?;
        lengths.last_id = id;
        let length = Arc::new(Self {
            id,
            value,
            context,
            allow_negative,
        });
        lengths.values.insert(id, Arc::downgrade(&length));
        Some(length)
    }

    pub(crate) fn handle(&self) -> *const () {
        handle_from_buffer(f32::from_bits(self.id))
    }
}

impl Drop for LayoutLength {
    fn drop(&mut self) {
        LENGTHS.write().values.remove(&self.id);
    }
}

// Preserve the full integer ID in the value word so the buffer can carry it on 32-bit targets.
pub(crate) fn handle_from_buffer(value: f32) -> *const () {
    std::ptr::without_provenance((value.to_bits() as usize) << TAG_BITS)
}

fn handle_id(handle: *const ()) -> Option<u32> {
    u32::try_from(handle.addr() >> TAG_BITS).ok()
}

pub(crate) fn handle_to_buffer(handle: *const ()) -> f32 {
    f32::from_bits(handle_id(handle).unwrap_or(0))
}

fn lookup(handle: *const ()) -> Option<Arc<LayoutLength>> {
    LENGTHS
        .read()
        .values
        .get(&handle_id(handle)?)
        .and_then(Weak::upgrade)
}

pub(crate) fn source(handle: *const ()) -> Option<String> {
    lookup(handle).and_then(|length| length.value.expression_text().map(str::to_owned))
}

pub(crate) fn describe(handle: *const ()) -> String {
    source(handle).unwrap_or_else(|| "calc(0px)".to_owned())
}

pub(crate) fn resolve(handle: *const (), basis: f32) -> f32 {
    // Styles own the program. Acquiring a strong reference here keeps it alive if the
    // declaration is subsequently replaced. Foreign calc handles are never dereferenced.
    let Some(length) = lookup(handle) else {
        return 0.;
    };
    let resolved = length.value.resolve(length.context, basis).unwrap_or(0.);
    if length.allow_negative {
        resolved
    } else {
        resolved.max(0.)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::style::arena::StyleArena;
    use crate::Style;
    use taffy::Dimension;

    #[test]
    fn layout_math_uses_shared_logical_order_and_property_ranges() {
        let mut arena = StyleArena::default();
        let mut style = Style::new(&mut arena);
        let context = LengthContext::for_scale(1.);

        style.set_width(Dimension::length(80.));
        assert!(style.set_css_layout_length("inline-size", "calc(50% - 12px)", context));
        assert_eq!(resolve(style.get_size().width.into_raw().calc_value(), 100.), 38.);
        style.set_width(Dimension::length(60.));
        assert_eq!(style.get_size().width, Dimension::length(60.));

        let math = "calc(10% - 12px)";
        assert!(style.set_css_layout_length("margin-inline-start", math, context));
        assert!(style.set_css_layout_length("padding-inline-start", math, context));
        assert_eq!(resolve(style.get_margin().left.into_raw().calc_value(), 100.), -2.);
        assert_eq!(resolve(style.get_padding().left.into_raw().calc_value(), 100.), 0.);
        assert!(style.set_css_layout_length("column-gap", "calc(20% + 1px)", context));
        assert_eq!(resolve(style.get_gap().width.into_raw().calc_value(), 100.), 21.);
    }

    #[test]
    fn a_copied_style_keeps_its_length_until_the_last_owner_releases_it() {
        let mut arena = StyleArena::default();
        let mut first = Style::new(&mut arena);
        let context = LengthContext::for_scale(1.);
        assert!(first.set_css_layout_length("width", "calc(50% - 12px)", context));
        let second = first.clone();
        let handle = first.width().into_raw().calc_value();
        assert_eq!(resolve(handle, 100.), 38.);

        first.set_width(Dimension::length(24.));
        first.prune_css_layout_lengths();
        assert_eq!(second.width().into_raw().calc_value(), handle);
        assert_eq!(resolve(handle, 100.), 38.);
        drop(second);
        assert_eq!(resolve(handle, 100.), 0.);
    }
}
