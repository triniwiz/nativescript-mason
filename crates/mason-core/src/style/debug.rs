use crate::style::utils::{
    dimension_to_format_type_value, length_percentage_auto_to_format_type_value,
    length_percentage_to_format_type_value,
};
use crate::Style;
use std::fmt::{Debug, Formatter};
use taffy::{
    CoreStyle, Dimension, GridContainerStyle, LengthPercentage, LengthPercentageAuto, Rect, Size,
};

impl Debug for Style {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let size = self.size();

        let size = DisplaySize::from(size);

        let min_size = DisplaySize::from(self.min_size());

        let max_size = DisplaySize::from(self.max_size());
        f.debug_struct("Style")
            .field("font_metrics", &self.font_metrics())
            .field("verticalAlign", &self.vertical_align())
            .field("display", &self.get_display())
            .field("displayMode", &self.display_mode())
            .field("itemIsTable", &self.get_item_is_table())
            .field("itemIsReplaced", &self.get_item_is_replaced())
            .field("boxSizing", &self.get_box_sizing())
            .field("overflow", &self.get_overflow())
            .field("scrollbarWidth", &self.get_scrollbar_width())
            .field("position", &self.get_position())
            .field("size", &size)
            .field("minSize", &min_size)
            .field("maxSize", &max_size)
            .field("border", &DisplayRect::from(self.get_border()))
            .field("padding", &DisplayRect::from(self.get_padding()))
            .field("margin", &DisplayRect::from(self.get_margin()))
            .field("inset", &DisplayRect::from(self.get_inset()))
            .field("aspectRatio", &self.get_aspect_ratio())
            .field("gap", &DisplaySize::from(self.get_gap()))
            .field("alignItems", &self.get_align_items())
            .field("alignSelf", &self.get_align_self())
            .field("justifyItems", &self.get_justify_items())
            .field("justifySelf", &self.get_justify_self())
            .field("alignContent", &self.get_align_content())
            .field("justifyContent", &self.get_justify_content())
            .field("textAlign", &self.get_text_align())
            .field("flexDirection", &self.get_flex_direction())
            .field("flexWrap", &self.get_flex_wrap())
            .field("flexGrow", &self.get_flex_grow())
            .field("flexShrink", &self.get_flex_shrink())
            .field(
                "flex_basis",
                &dimension_to_format_type_value(self.get_flex_basis()),
            )
            .field("grid_area", &self.grid_area)
            .field("grid_template_areas", &self.get_grid_template_areas_css())
            .field("grid_template_rows", &self.get_grid_template_rows_css())
            .field(
                "grid_template_row_names",
                &self
                    .grid_template_row_names
                    .iter()
                    .map(|value| {
                        value
                            .iter()
                            .map(|value| value.to_string())
                            .collect::<Vec<String>>()
                    })
                    .collect::<Vec<_>>(),
            )
            .field(
                "grid_template_columns",
                &self.get_grid_template_columns_css(),
            )
            .field(
                "grid_template_column_names",
                &self
                    .grid_template_column_names
                    .iter()
                    .map(|value| {
                        value
                            .iter()
                            .map(|value| value.to_string())
                            .collect::<Vec<String>>()
                    })
                    .collect::<Vec<_>>(),
            )
            .field("grid_auto_rows", &self.get_grid_auto_rows_css())
            .field("grid_auto_columns", &self.get_grid_auto_columns_css())
            .field("grid_auto_flow", &self.grid_auto_flow())
            .field("grid_row", &self.get_grid_row_css())
            .field("grid_column", &self.get_grid_column_css())
            .finish()
    }
}

pub struct DisplayRect<T> {
    left: T,
    right: T,
    top: T,
    bottom: T,
}

impl From<Rect<LengthPercentage>> for DisplayRect<LengthPercentage> {
    fn from(value: Rect<LengthPercentage>) -> Self {
        Self {
            left: value.left,
            right: value.right,
            top: value.top,
            bottom: value.bottom,
        }
    }
}

impl std::fmt::Display for DisplayRect<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Rect {{ left: {}, right: {}, top: {}, bottom: {} }}",
            length_percentage_to_format_type_value(self.left),
            length_percentage_to_format_type_value(self.right),
            length_percentage_to_format_type_value(self.top),
            length_percentage_to_format_type_value(self.bottom),
        )
    }
}

impl Debug for DisplayRect<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}

impl From<Rect<LengthPercentageAuto>> for DisplayRect<LengthPercentageAuto> {
    fn from(value: Rect<LengthPercentageAuto>) -> Self {
        Self {
            left: value.left,
            right: value.right,
            top: value.top,
            bottom: value.bottom,
        }
    }
}

impl std::fmt::Display for DisplayRect<LengthPercentageAuto> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Rect {{ left: {}, right: {}, top: {}, bottom: {} }}",
            length_percentage_auto_to_format_type_value(self.left),
            length_percentage_auto_to_format_type_value(self.right),
            length_percentage_auto_to_format_type_value(self.top),
            length_percentage_auto_to_format_type_value(self.bottom),
        )
    }
}

impl Debug for DisplayRect<LengthPercentageAuto> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}

impl std::fmt::Display for Style {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let size = self.size();

        let size = DisplaySize::from(size);

        let min_size = DisplaySize::from(self.min_size());

        let max_size = DisplaySize::from(self.max_size());

        f.debug_struct("Style")
            .field("font_metrics", &self.font_metrics())
            .field("verticalAlign", &self.vertical_align())
            .field("display", &self.get_display())
            .field("displayMode", &self.display_mode())
            .field("itemIsTable", &self.get_item_is_table())
            .field("itemIsReplaced", &self.get_item_is_replaced())
            .field("boxSizing", &self.get_box_sizing())
            .field("overflow", &self.get_overflow())
            .field("scrollbarWidth", &self.get_scrollbar_width())
            .field("position", &self.get_position())
            .field("size", &size)
            .field("minSize", &min_size)
            .field("maxSize", &max_size)
            .field("border", &DisplayRect::from(self.get_border()))
            .field("padding", &DisplayRect::from(self.get_padding()))
            .field("margin", &DisplayRect::from(self.get_margin()))
            .field("inset", &DisplayRect::from(self.get_inset()))
            .field("aspectRatio", &self.get_aspect_ratio())
            .field("gap", &DisplaySize::from(self.get_gap()))
            .field("alignItems", &self.get_align_items())
            .field("alignSelf", &self.get_align_self())
            .field("justifyItems", &self.get_justify_items())
            .field("justifySelf", &self.get_justify_self())
            .field("alignContent", &self.get_align_content())
            .field("justifyContent", &self.get_justify_content())
            .field("textAlign", &self.get_text_align())
            .field("flexDirection", &self.get_flex_direction())
            .field("flexWrap", &self.get_flex_wrap())
            .field("flexGrow", &self.get_flex_grow())
            .field("flexShrink", &self.get_flex_shrink())
            .field(
                "flex_basis",
                &dimension_to_format_type_value(self.get_flex_basis()),
            )
            .field("grid_template_rows", &self.get_grid_template_rows_css())
            .field(
                "grid_template_columns",
                &self.get_grid_template_columns_css(),
            )
            .field("grid_auto_rows", &self.get_grid_auto_rows_css())
            .field("grid_auto_columns", &self.get_grid_auto_columns_css())
            .field("grid_auto_flow", &self.get_grid_auto_flow())
            .field("grid_row", &self.get_grid_row_css())
            .field("grid_column", &self.get_grid_column_css())
            .finish()
    }
}

pub(crate) struct DisplaySize<T> {
    width: T,
    height: T,
}

impl From<Size<Dimension>> for DisplaySize<Dimension> {
    fn from(value: Size<Dimension>) -> Self {
        Self {
            width: value.width,
            height: value.height,
        }
    }
}

impl From<Size<LengthPercentage>> for DisplaySize<LengthPercentage> {
    fn from(value: Size<LengthPercentage>) -> Self {
        Self {
            width: value.width,
            height: value.height,
        }
    }
}

impl std::fmt::Display for DisplaySize<Dimension> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Size {{ width: {}, height: {} }}",
            dimension_to_format_type_value(self.width),
            dimension_to_format_type_value(self.height)
        )
    }
}

impl Debug for DisplaySize<Dimension> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}

impl std::fmt::Display for DisplaySize<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Size {{ width: {}, height: {} }}",
            length_percentage_to_format_type_value(self.width),
            length_percentage_to_format_type_value(self.height)
        )
    }
}

impl Debug for DisplaySize<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}
