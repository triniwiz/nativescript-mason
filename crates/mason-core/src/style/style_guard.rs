use crate::Style;
use parking_lot::lock_api::MappedRwLockReadGuard;
use parking_lot::RawRwLock;
use std::ops::Deref;
use style_atoms::Atom;
use taffy::{
    AbsoluteAxis, AbstractAxis, AlignContent, AlignItems, AlignSelf, BlockContainerStyle,
    BlockItemStyle, BoxGenerationMode, BoxSizing, Clear, CoreStyle, Dimension, Display,
    FlexDirection, FlexWrap, FlexboxContainerStyle, FlexboxItemStyle, Float,
    GenericGridTemplateComponent, GridAutoFlow, GridContainerStyle, GridItemStyle, GridPlacement,
    GridTemplateArea, GridTemplateComponent, GridTemplateRepetition, JustifyContent,
    LengthPercentage, LengthPercentageAuto, Line, Point, Position, Rect, Size, TextAlign,
    TrackSizingFunction,
};

pub struct StyleGuard<'a>(pub(crate) MappedRwLockReadGuard<'a, RawRwLock, Style>);

impl<'a> Deref for StyleGuard<'a> {
    type Target = Style;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<'a> CoreStyle for StyleGuard<'a> {
    type CustomIdent = Atom;

    #[inline(always)]
    fn box_generation_mode(&self) -> BoxGenerationMode {
        match self.get_display() {
            Display::None => BoxGenerationMode::None,
            _ => BoxGenerationMode::Normal,
        }
    }
    #[inline(always)]
    fn is_block(&self) -> bool {
        matches!(self.get_display(), Display::Block)
    }

    #[inline(always)]
    fn is_compressible_replaced(&self) -> bool {
        self.get_item_is_replaced()
    }

    #[inline(always)]
    fn box_sizing(&self) -> BoxSizing {
        self.get_box_sizing()
    }

    #[inline(always)]
    fn overflow(&self) -> Point<taffy::Overflow> {
        let flow = self.get_overflow();
        Point {
            x: flow.x.into(),
            y: flow.y.into(),
        }
    }

    #[inline(always)]
    fn scrollbar_width(&self) -> f32 {
        self.get_scrollbar_width()
    }

    #[inline(always)]
    fn position(&self) -> Position {
        self.get_position()
    }
    #[inline(always)]
    fn inset(&self) -> Rect<LengthPercentageAuto> {
        self.get_inset()
    }

    #[inline(always)]
    fn size(&self) -> Size<Dimension> {
        self.get_size()
    }

    #[inline(always)]
    fn min_size(&self) -> Size<Dimension> {
        self.get_min_size()
    }

    #[inline(always)]
    fn max_size(&self) -> Size<Dimension> {
        self.get_max_size()
    }

    #[inline(always)]
    fn aspect_ratio(&self) -> Option<f32> {
        self.get_aspect_ratio()
    }

    #[inline(always)]
    fn margin(&self) -> Rect<LengthPercentageAuto> {
        self.get_margin()
    }

    #[inline(always)]
    fn padding(&self) -> Rect<LengthPercentage> {
        self.get_padding()
    }
    #[inline(always)]
    fn border(&self) -> Rect<LengthPercentage> {
        self.get_border()
    }
}

impl<'a> BlockContainerStyle for StyleGuard<'a> {
    #[inline(always)]
    fn text_align(&self) -> TextAlign {
        self.get_text_align()
    }
}

impl<'a> BlockItemStyle for StyleGuard<'a> {
    #[inline(always)]
    fn is_table(&self) -> bool {
        self.get_item_is_table()
    }

    #[inline(always)]
    fn float(&self) -> Float {
        self.get_float()
    }

    #[inline(always)]
    fn clear(&self) -> Clear {
        self.get_clear()
    }
}

impl<'a> FlexboxContainerStyle for StyleGuard<'a> {
    #[inline(always)]
    fn flex_direction(&self) -> FlexDirection {
        self.get_flex_direction()
    }

    #[inline(always)]
    fn flex_wrap(&self) -> FlexWrap {
        self.get_flex_wrap()
    }

    #[inline(always)]
    fn gap(&self) -> Size<LengthPercentage> {
        self.get_gap()
    }

    #[inline(always)]
    fn align_content(&self) -> Option<AlignContent> {
        self.get_align_content()
    }

    #[inline(always)]
    fn align_items(&self) -> Option<AlignItems> {
        self.get_align_items()
    }

    #[inline(always)]
    fn justify_content(&self) -> Option<JustifyContent> {
        self.get_justify_content()
    }
}

impl<'a> FlexboxItemStyle for StyleGuard<'a> {
    #[inline(always)]
    fn flex_basis(&self) -> Dimension {
        self.get_flex_basis()
    }

    #[inline(always)]
    fn flex_grow(&self) -> f32 {
        self.get_flex_grow()
    }

    #[inline(always)]
    fn flex_shrink(&self) -> f32 {
        self.get_flex_shrink()
    }

    #[inline(always)]
    fn align_self(&self) -> Option<AlignSelf> {
        self.get_align_self()
    }
}

impl<'a> GridContainerStyle for StyleGuard<'a> {
    type Repetition<'b>
        = &'b GridTemplateRepetition<Atom>
    where
        Self: 'b;

    type TemplateTrackList<'b>
        = core::iter::Map<
        core::slice::Iter<'b, GridTemplateComponent<Atom>>,
        fn(
            &'b GridTemplateComponent<Atom>,
        ) -> GenericGridTemplateComponent<Atom, &'b GridTemplateRepetition<Atom>>,
    >
    where
        Self: 'b;

    type AutoTrackList<'b>
        = core::iter::Copied<core::slice::Iter<'b, TrackSizingFunction>>
    where
        Self: 'b;
    type TemplateLineNames<'b>
        = core::iter::Map<
        core::slice::Iter<'b, Vec<Atom>>,
        fn(&Vec<Atom>) -> core::slice::Iter<'_, Atom>,
    >
    where
        Self: 'b;

    type GridTemplateAreas<'b>
        = core::iter::Cloned<core::slice::Iter<'b, GridTemplateArea<Atom>>>
    where
        Self: 'b;

    #[inline(always)]
    fn grid_template_rows(&self) -> Option<Self::TemplateTrackList<'_>> {
        Some(
            self.grid_template_rows
                .iter()
                .map(|value| value.as_component_ref()),
        )
    }

    #[inline(always)]
    fn grid_template_columns(&self) -> Option<Self::TemplateTrackList<'_>> {
        Some(
            self.grid_template_columns
                .iter()
                .map(|value| value.as_component_ref()),
        )
    }

    #[inline(always)]
    fn grid_auto_rows(&self) -> Self::AutoTrackList<'_> {
        self.grid_auto_rows.iter().copied()
    }

    #[inline(always)]
    fn grid_auto_columns(&self) -> Self::AutoTrackList<'_> {
        self.grid_auto_columns.iter().copied()
    }

    #[inline(always)]
    fn grid_template_areas(&self) -> Option<Self::GridTemplateAreas<'_>> {
        Some(self.grid_template_areas.iter().cloned())
    }

    #[inline(always)]
    fn grid_template_column_names(&self) -> Option<Self::TemplateLineNames<'_>> {
        Some(
            self.grid_template_column_names
                .iter()
                .map(|names| names.iter()),
        )
    }

    #[inline(always)]
    fn grid_template_row_names(&self) -> Option<Self::TemplateLineNames<'_>> {
        Some(
            self.grid_template_row_names
                .iter()
                .map(|names| names.iter()),
        )
    }

    #[inline(always)]
    fn grid_auto_flow(&self) -> GridAutoFlow {
        self.get_grid_auto_flow()
    }

    #[inline(always)]
    fn gap(&self) -> Size<LengthPercentage> {
        self.get_gap()
    }

    #[inline(always)]
    fn align_content(&self) -> Option<AlignContent> {
        self.get_align_content()
    }

    #[inline(always)]
    fn justify_content(&self) -> Option<JustifyContent> {
        self.get_justify_content()
    }

    #[inline(always)]
    fn align_items(&self) -> Option<AlignItems> {
        self.get_align_items()
    }

    #[inline(always)]
    fn justify_items(&self) -> Option<AlignItems> {
        self.get_justify_items()
    }

    #[inline(always)]
    fn grid_template_tracks(&self, axis: AbsoluteAxis) -> Option<Self::TemplateTrackList<'_>> {
        match axis {
            AbsoluteAxis::Horizontal => self.grid_template_columns(),
            AbsoluteAxis::Vertical => self.grid_template_rows(),
        }
    }

    #[inline(always)]
    fn grid_align_content(&self, axis: AbstractAxis) -> AlignContent {
        match axis {
            AbstractAxis::Inline => self.get_justify_content().unwrap_or(AlignContent::Stretch),
            AbstractAxis::Block => self.get_align_content().unwrap_or(AlignContent::Stretch),
        }
    }
}

impl<'a> GridItemStyle for StyleGuard<'a> {
    #[inline(always)]
    fn grid_row(&self) -> Line<GridPlacement<Atom>> {
        self.get_grid_row()
    }

    #[inline(always)]
    fn grid_column(&self) -> Line<GridPlacement<Atom>> {
        self.get_grid_column()
    }

    #[inline(always)]
    fn align_self(&self) -> Option<AlignSelf> {
        self.get_align_self()
    }

    #[inline(always)]
    fn justify_self(&self) -> Option<AlignSelf> {
        self.get_justify_self()
    }

    #[inline(always)]
    fn grid_placement(&self, axis: AbsoluteAxis) -> Line<GridPlacement<Atom>> {
        match axis {
            AbsoluteAxis::Horizontal => self.grid_column(),
            AbsoluteAxis::Vertical => self.grid_row(),
        }
    }
}
