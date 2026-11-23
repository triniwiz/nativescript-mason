use super::LengthContext;
use crate::Style;

// <style-keys:grid-properties>
const GRID_PROPERTIES: &[fn(&mut Style, &str, LengthContext)] = &[
    Style::set_grid_auto_rows_css_with_context,
    Style::set_grid_auto_columns_css_with_context,
    |style, value, _| style.set_grid_column_css(value),
    |style, value, _| style.set_grid_column_start_css(value),
    |style, value, _| style.set_grid_column_end_css(value),
    |style, value, _| style.set_grid_row_css(value),
    |style, value, _| style.set_grid_row_start_css(value),
    |style, value, _| style.set_grid_row_end_css(value),
    Style::set_grid_template_rows_css_with_context,
    Style::set_grid_template_columns_css_with_context,
    |style, value, _| style.set_grid_area(value),
    |style, value, _| style.set_grid_template_areas_css(value),
];
// </style-keys:grid-properties>

/// Applies the grid declarations in authored order. The batch contains UTF-8
/// pairs of schema property IDs and CSS values, separated by NUL bytes.
pub fn apply_grid_writes(style: &mut Style, input: &str, context: LengthContext) -> bool {
    let mut fields = input.split('\0');
    let mut writes = Vec::new();
    while let Some(property) = fields.next() {
        let Some(apply) = property.parse::<usize>().ok().and_then(|id| GRID_PROPERTIES.get(id)) else {
            return false;
        };
        let Some(value) = fields.next() else { return false };
        writes.push((apply, value));
    }
    for (apply, value) in writes {
        apply(style, value, context);
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn applies_grid_longhands_and_shorthands_in_order() {
        let mut arena = crate::style::arena::StyleArena::default();
        let mut style = Style::new(&mut arena);
        let context = LengthContext::for_scale(1.);
        let writes = ["10", "1 / 2 / 3 / 4", "6", "5", "2", "tracks", "4", "6"];
        assert!(apply_grid_writes(&mut style, &writes.join("\0"), context));
        assert_eq!(style.get_grid_row_start_css(), "5");
        assert_eq!(style.get_grid_row_end_css(), "3");
        assert_eq!(style.get_grid_column_start_css(), "tracks");
        assert_eq!(style.get_grid_column_end_css(), "6");
        assert!(!apply_grid_writes(&mut style, &["6", "7", "99", "invalid"].join("\0"), context));
        assert_eq!(style.get_grid_row_start_css(), "5");
        assert!(apply_grid_writes(&mut style, "10\0", context));
        assert_eq!(style.get_grid_column_end_css(), "auto");
    }

    #[test]
    fn stores_tracks_from_authored_math_and_units_with_the_same_context() {
        let mut arena = crate::style::arena::StyleArena::default();
        let mut style = Style::new(&mut arena);
        let context = LengthContext {
            scale: 2.,
            font_size: 20.,
            root_font_size: 16.,
            viewport_width: 400.,
            viewport_height: 800.,
        };
        let template = "[rem] repeat(2, [em-end] minmax(calc(1em + 2dppx), 1fr)) fit-content(5vw)";
        let auto = "clamp(1rem, 10vw, 100px) max(10%, 25%) 12pt 0%";
        assert!(apply_grid_writes(&mut style, &["9", template, "0", auto].join("\0"), context));
        assert_eq!(style.get_grid_template_columns_css(), Some(template));
        let (expected, _) = crate::utils::parse_grid_template(
            "[rem] repeat(2, [em-end] minmax(42dppx, 1fr)) fit-content(40dppx)", 1.,
        ).unwrap();
        assert_eq!(style.get_grid_template_columns(), expected);
        assert_eq!(
            style.get_grid_auto_rows(),
            crate::utils::parse_grid_auto_tracks("80dppx 25% 32dppx 0%", 1.).unwrap()
        );
        assert!(apply_grid_writes(&mut style, "9\0calc(50% - 5px)", context));
        assert_eq!(style.get_grid_template_columns_css(), Some(template));
    }
}
