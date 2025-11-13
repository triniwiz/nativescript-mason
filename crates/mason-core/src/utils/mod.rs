mod grid;
use crate::style::{DisplayMode, Overflow};
use crate::Style;
pub use grid::*;
use style_atoms::Atom;
use taffy::{
    AlignContent, AlignItems, AlignSelf, AvailableSpace, BoxSizing, Display, FlexDirection,
    FlexWrap, GridAutoFlow, GridPlacement, GridTemplateArea, JustifyContent, Line, Position,
    TextAlign,
};
pub const fn box_sizing_from_enum(value: i32) -> Option<BoxSizing> {
    match value {
        0 => Some(BoxSizing::BorderBox),
        1 => Some(BoxSizing::ContentBox),
        _ => None,
    }
}

pub const fn box_sizing_to_enum(value: BoxSizing) -> i32 {
    match value {
        BoxSizing::BorderBox => 0,
        BoxSizing::ContentBox => 1,
    }
}

pub const fn text_align_from_enum(value: i32) -> Option<TextAlign> {
    match value {
        0 => Some(TextAlign::Auto),
        1 => Some(TextAlign::LegacyLeft),
        2 => Some(TextAlign::LegacyRight),
        3 => Some(TextAlign::LegacyCenter),
        _ => None,
    }
}
pub const fn text_align_to_enum(value: TextAlign) -> i32 {
    match value {
        TextAlign::Auto => 0,
        TextAlign::LegacyLeft => 1,
        TextAlign::LegacyRight => 2,
        TextAlign::LegacyCenter => 3,
    }
}

pub const fn align_content_from_enum(value: i32) -> Option<AlignContent> {
    match value {
        0 => Some(AlignContent::Start),
        1 => Some(AlignContent::End),
        2 => Some(AlignContent::Center),
        3 => Some(AlignContent::Stretch),
        4 => Some(AlignContent::SpaceBetween),
        5 => Some(AlignContent::SpaceAround),
        6 => Some(AlignContent::SpaceEvenly),
        7 => Some(AlignContent::FlexStart),
        8 => Some(AlignContent::FlexEnd),
        _ => None,
    }
}

pub const fn align_content_to_enum(value: AlignContent) -> i32 {
    match value {
        AlignContent::Start => 0,
        AlignContent::End => 1,
        AlignContent::Center => 2,
        AlignContent::Stretch => 3,
        AlignContent::SpaceBetween => 4,
        AlignContent::SpaceEvenly => 5,
        AlignContent::SpaceAround => 6,
        AlignContent::FlexStart => 7,
        AlignContent::FlexEnd => 8,
    }
}

pub const fn align_items_from_enum(value: i32) -> Option<AlignItems> {
    match value {
        0 => Some(AlignItems::Start),
        1 => Some(AlignItems::End),
        2 => Some(AlignItems::Center),
        3 => Some(AlignItems::Baseline),
        4 => Some(AlignItems::Stretch),
        5 => Some(AlignItems::FlexStart),
        6 => Some(AlignItems::FlexEnd),
        _ => None,
    }
}

pub const fn overflow_from_enum(value: i32) -> Option<Overflow> {
    match value {
        0 => Some(Overflow::Visible),
        1 => Some(Overflow::Hidden),
        2 => Some(Overflow::Scroll),
        3 => Some(Overflow::Clip),
        4 => Some(Overflow::Auto),
        _ => None,
    }
}

pub const fn overflow_to_enum(value: Overflow) -> i32 {
    match value {
        Overflow::Visible => 0,
        Overflow::Hidden => 1,
        Overflow::Scroll => 2,
        Overflow::Clip => 3,
        Overflow::Auto => 4,
    }
}

pub const fn align_items_to_enum(value: AlignItems) -> i32 {
    match value {
        AlignItems::Start => 0,
        AlignItems::End => 1,
        AlignItems::Center => 2,
        AlignItems::Baseline => 3,
        AlignItems::Stretch => 4,
        AlignItems::FlexStart => 5,
        AlignItems::FlexEnd => 6,
    }
}

pub const fn align_self_from_enum(value: i32) -> Option<AlignSelf> {
    match value {
        0 => Some(AlignSelf::Start),
        1 => Some(AlignSelf::End),
        2 => Some(AlignSelf::Center),
        3 => Some(AlignSelf::Baseline),
        4 => Some(AlignSelf::Stretch),
        5 => Some(AlignSelf::FlexStart),
        6 => Some(AlignSelf::FlexEnd),
        _ => None,
    }
}

pub const fn align_self_to_enum(value: AlignSelf) -> i32 {
    match value {
        AlignSelf::Start => 0,
        AlignSelf::End => 1,
        AlignSelf::Center => 2,
        AlignSelf::Baseline => 3,
        AlignSelf::Stretch => 4,
        AlignSelf::FlexStart => 5,
        AlignSelf::FlexEnd => 6,
    }
}

pub const fn align_self_op_to_enum(value: Option<AlignSelf>) -> Option<i32> {
    match value {
        None => None,
        Some(value) => Some(match value {
            AlignSelf::Start => 0,
            AlignSelf::End => 1,
            AlignSelf::Center => 2,
            AlignSelf::Baseline => 3,
            AlignSelf::Stretch => 4,
            AlignSelf::FlexStart => 5,
            AlignSelf::FlexEnd => 6,
        }),
    }
}

pub const fn display_from_enum(value: i32) -> Option<Display> {
    match value {
        0 => Some(Display::None),
        1 => Some(Display::Flex),
        2 => Some(Display::Grid),
        3 => Some(Display::Block),
        _ => None,
    }
}

pub const fn display_to_enum(value: Display) -> i32 {
    match value {
        Display::None => 0,
        Display::Flex => 1,
        Display::Grid => 2,
        Display::Block => 3,
    }
}

pub const fn flex_direction_from_enum(value: i32) -> Option<FlexDirection> {
    match value {
        0 => Some(FlexDirection::Row),
        1 => Some(FlexDirection::Column),
        2 => Some(FlexDirection::RowReverse),
        3 => Some(FlexDirection::ColumnReverse),
        _ => None,
    }
}

pub const fn flex_direction_to_enum(value: FlexDirection) -> i32 {
    match value {
        FlexDirection::Row => 0,
        FlexDirection::Column => 1,
        FlexDirection::RowReverse => 2,
        FlexDirection::ColumnReverse => 3,
    }
}

pub const fn flex_wrap_from_enum(value: i32) -> Option<FlexWrap> {
    match value {
        0 => Some(FlexWrap::NoWrap),
        1 => Some(FlexWrap::Wrap),
        2 => Some(FlexWrap::WrapReverse),
        _ => None,
    }
}

pub const fn flex_wrap_to_enum(value: FlexWrap) -> i32 {
    match value {
        FlexWrap::NoWrap => 0,
        FlexWrap::Wrap => 1,
        FlexWrap::WrapReverse => 2,
    }
}

pub const fn justify_content_from_enum(value: i32) -> Option<JustifyContent> {
    match value {
        0 => Some(JustifyContent::Start),
        1 => Some(JustifyContent::End),
        2 => Some(JustifyContent::Center),
        3 => Some(JustifyContent::Stretch),
        4 => Some(JustifyContent::SpaceBetween),
        5 => Some(JustifyContent::SpaceAround),
        6 => Some(JustifyContent::SpaceEvenly),
        7 => Some(JustifyContent::FlexStart),
        8 => Some(JustifyContent::FlexEnd),
        _ => None,
    }
}

pub const fn justify_content_to_enum(value: JustifyContent) -> i32 {
    match value {
        JustifyContent::Start => 0,
        JustifyContent::End => 1,
        JustifyContent::Center => 2,
        JustifyContent::Stretch => 3,
        JustifyContent::SpaceBetween => 4,
        JustifyContent::SpaceAround => 5,
        JustifyContent::SpaceEvenly => 6,
        JustifyContent::FlexStart => 7,
        JustifyContent::FlexEnd => 8,
    }
}

pub const fn position_from_enum(value: i32) -> Option<Position> {
    match value {
        0 => Some(Position::Relative),
        1 => Some(Position::Absolute),
        _ => None,
    }
}

pub const fn position_to_enum(value: Position) -> i32 {
    match value {
        Position::Relative => 0,
        Position::Absolute => 1,
    }
}

pub const fn grid_auto_flow_from_enum(value: i32) -> Option<GridAutoFlow> {
    match value {
        0 => Some(GridAutoFlow::Row),
        1 => Some(GridAutoFlow::Column),
        2 => Some(GridAutoFlow::RowDense),
        3 => Some(GridAutoFlow::ColumnDense),
        _ => None,
    }
}

pub const fn grid_auto_flow_to_enum(value: GridAutoFlow) -> i32 {
    match value {
        GridAutoFlow::Row => 0,
        GridAutoFlow::Column => 1,
        GridAutoFlow::RowDense => 2,
        GridAutoFlow::ColumnDense => 3,
    }
}

pub const fn boxing_size_from_enum(value: i32) -> Option<BoxSizing> {
    match value {
        0 => Some(BoxSizing::BorderBox),
        1 => Some(BoxSizing::ContentBox),
        _ => None,
    }
}

pub const fn boxing_size_to_enum(value: BoxSizing) -> i32 {
    match value {
        BoxSizing::BorderBox => 0,
        BoxSizing::ContentBox => 1,
    }
}

pub const fn display_mode_from_enum(value: i32) -> Option<DisplayMode> {
    match value {
        0 => Some(DisplayMode::None),
        1 => Some(DisplayMode::Inline),
        2 => Some(DisplayMode::Box),
        _ => None,
    }
}

pub const fn display_mode_to_enum(value: DisplayMode) -> i32 {
    match value {
        DisplayMode::None => 0,
        DisplayMode::Inline => 1,
        DisplayMode::Box => 2,
    }
}

pub(crate) fn resolve_fallback_size(
    known: Option<f32>,
    available: AvailableSpace,
    size: Option<f32>,
    style_min: Option<f32>,
    style_max: Option<f32>,
    content_min: f32,
    content_max: f32,
    padding_border: f32,
) -> f32 {
    // known.unwrap_or_else(|| {
    //     let size = size.or(known).unwrap_or_else(|| match available {
    //         AvailableSpace::MinContent => style_min.unwrap_or(content_min),
    //         AvailableSpace::MaxContent => style_max.unwrap_or(content_max.max(f32::INFINITY)),
    //         AvailableSpace::Definite(w) => w,
    //     });
    //
    //     println!("content_min {} ... content_max {}", content_min, content_max);
    //
    //     let min = style_min.unwrap_or(content_min);
    //     let max = style_max.unwrap_or(content_max).max(f32::INFINITY);
    //
    //     size.clamp(min, max) - padding_border
    // })

    if let Some(known) = known {
        return known;
    }

    let size = size
        .or_else(|| match available {
            AvailableSpace::MinContent => style_min.or(Some(content_min)),
            AvailableSpace::MaxContent => style_max.or(Some(content_max)),
            AvailableSpace::Definite(w) => Some(w),
        })
        .unwrap_or(0.);

    if size == 0. {
        return 0.;
    }

    let min = style_min.unwrap_or(content_min);
    let max = style_max.unwrap_or(content_max);

    (size.clamp(min, max) - padding_border).max(0.)
}

#[derive(Clone, Debug)]
pub struct GridTemplateAreas {
    pub areas: Vec<GridTemplateArea<Atom>>,
    pub rows: usize,
    pub columns: usize,
}

pub fn grid_template_areas_to_string(areas: &[GridTemplateArea<Atom>]) -> String {
    if areas.is_empty() {
        return Default::default();
    }

    let max_row = areas.iter().map(|a| a.row_end).max().unwrap_or(0) as usize;
    let max_col = areas.iter().map(|a| a.column_end).max().unwrap_or(0) as usize;

    let mut grid = vec![vec![".".to_string(); max_col]; max_row];

    for area in areas {
        for row in area.row_start as usize..area.row_end as usize {
            for col in area.column_start as usize..area.column_end as usize {
                grid[row][col] = area.name.to_string();
            }
        }
    }

    let rows: Vec<String> = grid
        .into_iter()
        .map(|row| format!("\"{}\"", row.join(" ")))
        .collect();

    rows.join("\n")
}

pub fn grid_placement_to_string(p: &GridPlacement<Atom>) -> String {
    match p {
        GridPlacement::Auto => "auto".into(),
        GridPlacement::Line(n) => n.as_i16().to_string(),
        GridPlacement::Span(n) => format!("span {}", n),
        GridPlacement::NamedLine(name, _) => name.to_string(), // use only the name
        GridPlacement::NamedSpan(name, _) => format!("span {}", name), // span with name
    }
}

pub fn get_grid_area_from_style(style: &Style) -> Option<String> {
    let row = style.get_grid_row();
    let col = style.get_grid_column();
    get_grid_area(row, col)
}

pub fn get_grid_area(
    row: Line<GridPlacement<Atom>>,
    column: Line<GridPlacement<Atom>>,
) -> Option<String> {
    let row_start = grid_placement_to_string(&row.start);
    let row_end = grid_placement_to_string(&row.end);
    let col_start = grid_placement_to_string(&column.start);
    let col_end = grid_placement_to_string(&column.end);

    // All auto → nothing to show
    if row_start == "auto" && row_end == "auto" && col_start == "auto" && col_end == "auto" {
        return None;
    }

    // If all four are the same name, return that single name (e.g. grid-area: myArea)
    if row_start == row_end && row_end == col_start && col_start == col_end && row_start != "auto" {
        return Some(row_start);
    }

    // Collapse start/end if equal (optional shorthand)
    let value = if row_start == row_end && col_start == col_end {
        format!("{} / {}", row_start, col_start)
    } else {
        format!("{} / {} / {} / {}", row_start, col_start, row_end, col_end)
    };

    Some(value)
}

pub fn to_line_css(start: &GridPlacement<Atom>, end: &GridPlacement<Atom>, ) -> Option<String> {
    let start = grid_placement_to_string(start);
    let end = grid_placement_to_string(end);

    // All auto → nothing to show
    if start == "auto" && end == "auto" {
        return None;
    }

    // If both are the same *non-auto* value (like `1 / 1` or `header / header`)
    if start == end && start != "auto" {
        return Some(start);
    }

    // If start and end differ, use CSS shorthand form: "start / end"
    Some(format!("{} / {}", start, end))
}
