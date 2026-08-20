mod grid;
use crate::style::{
    BorderStyle, DisplayMode, Hyphens, ObjectFit, Overflow, UnicodeBidi, WritingMode,
};
use crate::Style;
pub use grid::*;
use style_atoms::Atom;
use taffy::{
    AlignContent, AlignContentKeyword, AlignItems, AlignItemsKeyword, AlignSelf, BoxSizing, Clear,
    Direction, Display, FlexDirection, FlexWrap, Float, GridAutoFlow, GridPlacement,
    GridTemplateArea, JustifyContent, Line, Position, TextAlign,
};

pub const fn border_style_from_enum(value: i8) -> Option<BorderStyle> {
    match value {
        0 => Some(BorderStyle::None),
        1 => Some(BorderStyle::Hidden),
        2 => Some(BorderStyle::Dotted),
        3 => Some(BorderStyle::Dashed),
        4 => Some(BorderStyle::Solid),
        5 => Some(BorderStyle::Double),
        6 => Some(BorderStyle::Groove),
        7 => Some(BorderStyle::Ridge),
        8 => Some(BorderStyle::Inset),
        9 => Some(BorderStyle::Outset),
        _ => None,
    }
}
pub const fn border_style_to_enum(value: BorderStyle) -> i8 {
    match value {
        BorderStyle::None => 0,
        BorderStyle::Hidden => 1,
        BorderStyle::Dotted => 2,
        BorderStyle::Dashed => 3,
        BorderStyle::Solid => 4,
        BorderStyle::Double => 5,
        BorderStyle::Groove => 6,
        BorderStyle::Ridge => 7,
        BorderStyle::Inset => 8,
        BorderStyle::Outset => 9,
    }
}

pub const fn box_sizing_from_enum(value: i8) -> Option<BoxSizing> {
    match value {
        0 => Some(BoxSizing::BorderBox),
        1 => Some(BoxSizing::ContentBox),
        _ => None,
    }
}

pub const fn box_sizing_to_enum(value: BoxSizing) -> i8 {
    match value {
        BoxSizing::BorderBox => 0,
        BoxSizing::ContentBox => 1,
    }
}

pub const fn text_align_from_enum(value: i8) -> Option<TextAlign> {
    match value {
        0 => Some(TextAlign::Auto),
        1 => Some(TextAlign::LegacyLeft),
        2 => Some(TextAlign::LegacyRight),
        3 => Some(TextAlign::LegacyCenter),
        _ => None,
    }
}
pub const fn text_align_to_enum(value: TextAlign) -> i8 {
    match value {
        TextAlign::Auto => 0,
        TextAlign::LegacyLeft => 1,
        TextAlign::LegacyRight => 2,
        TextAlign::LegacyCenter => 3,
    }
}

pub const fn align_content_from_enum(value: i8) -> Option<AlignContent> {
    match value {
        0 => Some(AlignContent::START),
        1 => Some(AlignContent::END),
        2 => Some(AlignContent::CENTER),
        3 => Some(AlignContent::STRETCH),
        4 => Some(AlignContent::SPACE_BETWEEN),
        5 => Some(AlignContent::SPACE_AROUND),
        6 => Some(AlignContent::SPACE_EVENLY),
        7 => Some(AlignContent::FLEX_START),
        8 => Some(AlignContent::FLEX_END),
        _ => None,
    }
}

pub const fn align_content_to_enum(value: AlignContent) -> i8 {
    match value.keyword {
        AlignContentKeyword::Start => 0,
        AlignContentKeyword::End => 1,
        AlignContentKeyword::Center => 2,
        AlignContentKeyword::Stretch => 3,
        AlignContentKeyword::SpaceBetween => 4,
        AlignContentKeyword::SpaceEvenly => 5,
        AlignContentKeyword::SpaceAround => 6,
        AlignContentKeyword::FlexStart => 7,
        AlignContentKeyword::FlexEnd => 8,
    }
}

pub const fn align_items_from_enum(value: i8) -> Option<AlignItems> {
    match value {
        0 => Some(AlignItems::START),
        1 => Some(AlignItems::END),
        2 => Some(AlignItems::CENTER),
        3 => Some(AlignItems::BASELINE),
        4 => Some(AlignItems::STRETCH),
        5 => Some(AlignItems::FLEX_START),
        6 => Some(AlignItems::FLEX_END),
        7 => Some(AlignItems::SELF_START),
        8 => Some(AlignItems::SELF_END),
        _ => None,
    }
}

pub const fn overflow_from_enum(value: i8) -> Option<Overflow> {
    match value {
        0 => Some(Overflow::Visible),
        1 => Some(Overflow::Hidden),
        2 => Some(Overflow::Scroll),
        3 => Some(Overflow::Clip),
        4 => Some(Overflow::Auto),
        _ => None,
    }
}

pub const fn overflow_to_enum(value: Overflow) -> i8 {
    match value {
        Overflow::Visible => 0,
        Overflow::Hidden => 1,
        Overflow::Scroll => 2,
        Overflow::Clip => 3,
        Overflow::Auto => 4,
    }
}

pub const fn align_items_to_enum(value: AlignItems) -> i8 {
    match value.keyword {
        AlignItemsKeyword::Start => 0,
        AlignItemsKeyword::End => 1,
        AlignItemsKeyword::Center => 2,
        AlignItemsKeyword::Baseline => 3,
        AlignItemsKeyword::Stretch => 4,
        AlignItemsKeyword::FlexStart => 5,
        AlignItemsKeyword::FlexEnd => 6,
        AlignItemsKeyword::SelfStart => 7,
        AlignItemsKeyword::SelfEnd => 8,
    }
}

pub const fn align_self_from_enum(value: i8) -> Option<AlignSelf> {
    match value {
        0 => Some(AlignSelf::START),
        1 => Some(AlignSelf::END),
        2 => Some(AlignSelf::CENTER),
        3 => Some(AlignSelf::BASELINE),
        4 => Some(AlignSelf::STRETCH),
        5 => Some(AlignSelf::FLEX_START),
        6 => Some(AlignSelf::FLEX_END),
        7 => Some(AlignSelf::SELF_START),
        8 => Some(AlignSelf::SELF_END),
        _ => None,
    }
}

pub const fn align_self_to_enum(value: AlignSelf) -> i8 {
    match value.keyword {
        AlignItemsKeyword::Start => 0,
        AlignItemsKeyword::End => 1,
        AlignItemsKeyword::Center => 2,
        AlignItemsKeyword::Baseline => 3,
        AlignItemsKeyword::Stretch => 4,
        AlignItemsKeyword::FlexStart => 5,
        AlignItemsKeyword::FlexEnd => 6,
        AlignItemsKeyword::SelfStart => 7,
        AlignItemsKeyword::SelfEnd => 8,
    }
}

pub const fn align_self_op_to_enum(value: Option<AlignSelf>) -> Option<i8> {
    match value {
        None => None,
        Some(value) => Some(match value.keyword {
            AlignItemsKeyword::Start => 0,
            AlignItemsKeyword::End => 1,
            AlignItemsKeyword::Center => 2,
            AlignItemsKeyword::Baseline => 3,
            AlignItemsKeyword::Stretch => 4,
            AlignItemsKeyword::FlexStart => 5,
            AlignItemsKeyword::FlexEnd => 6,
            AlignItemsKeyword::SelfStart => 7,
            AlignItemsKeyword::SelfEnd => 8,
        }),
    }
}

pub const fn display_from_enum(value: i8) -> Option<Display> {
    match value {
        0 => Some(Display::None),
        1 => Some(Display::Flex),
        2 => Some(Display::Grid),
        3 => Some(Display::Block),
        4 => Some(Display::FlowRoot),
        _ => None,
    }
}

pub const fn display_to_enum(value: Display) -> i8 {
    match value {
        Display::None => 0,
        Display::Flex => 1,
        Display::Grid => 2,
        Display::Block => 3,
        Display::FlowRoot => 4,
    }
}

pub const fn flex_direction_from_enum(value: i8) -> Option<FlexDirection> {
    match value {
        0 => Some(FlexDirection::Row),
        1 => Some(FlexDirection::Column),
        2 => Some(FlexDirection::RowReverse),
        3 => Some(FlexDirection::ColumnReverse),
        _ => None,
    }
}

pub const fn flex_direction_to_enum(value: FlexDirection) -> i8 {
    match value {
        FlexDirection::Row => 0,
        FlexDirection::Column => 1,
        FlexDirection::RowReverse => 2,
        FlexDirection::ColumnReverse => 3,
    }
}

pub const fn flex_wrap_from_enum(value: i8) -> Option<FlexWrap> {
    match value {
        0 => Some(FlexWrap::NoWrap),
        1 => Some(FlexWrap::Wrap),
        2 => Some(FlexWrap::WrapReverse),
        3 => Some(FlexWrap::Balance),
        4 => Some(FlexWrap::BalanceReverse),
        _ => None,
    }
}

pub const fn flex_wrap_to_enum(value: FlexWrap) -> i8 {
    match value {
        FlexWrap::NoWrap => 0,
        FlexWrap::Wrap => 1,
        FlexWrap::WrapReverse => 2,
        FlexWrap::Balance => 3,
        FlexWrap::BalanceReverse => 4,
    }
}

pub const fn justify_content_from_enum(value: i8) -> Option<JustifyContent> {
    match value {
        0 => Some(JustifyContent::START),
        1 => Some(JustifyContent::END),
        2 => Some(JustifyContent::CENTER),
        3 => Some(JustifyContent::STRETCH),
        4 => Some(JustifyContent::SPACE_BETWEEN),
        5 => Some(JustifyContent::SPACE_AROUND),
        6 => Some(JustifyContent::SPACE_EVENLY),
        7 => Some(JustifyContent::FLEX_START),
        8 => Some(JustifyContent::FLEX_END),
        _ => None,
    }
}

pub const fn justify_content_to_enum(value: JustifyContent) -> i8 {
    match value.keyword {
        AlignContentKeyword::Start => 0,
        AlignContentKeyword::End => 1,
        AlignContentKeyword::Center => 2,
        AlignContentKeyword::Stretch => 3,
        AlignContentKeyword::SpaceBetween => 4,
        AlignContentKeyword::SpaceAround => 5,
        AlignContentKeyword::SpaceEvenly => 6,
        AlignContentKeyword::FlexStart => 7,
        AlignContentKeyword::FlexEnd => 8,
    }
}

pub const fn position_from_enum(value: i8) -> Option<Position> {
    match value {
        0 => Some(Position::Relative),
        1 => Some(Position::Absolute),
        _ => None,
    }
}

pub const fn position_to_enum(value: Position) -> i8 {
    match value {
        Position::Relative => 0,
        Position::Absolute => 1,
    }
}

pub const fn grid_auto_flow_from_enum(value: i8) -> Option<GridAutoFlow> {
    match value {
        0 => Some(GridAutoFlow::Row),
        1 => Some(GridAutoFlow::Column),
        2 => Some(GridAutoFlow::RowDense),
        3 => Some(GridAutoFlow::ColumnDense),
        _ => None,
    }
}

pub const fn grid_auto_flow_to_enum(value: GridAutoFlow) -> i8 {
    match value {
        GridAutoFlow::Row => 0,
        GridAutoFlow::Column => 1,
        GridAutoFlow::RowDense => 2,
        GridAutoFlow::ColumnDense => 3,
    }
}

pub const fn boxing_size_from_enum(value: i8) -> Option<BoxSizing> {
    match value {
        0 => Some(BoxSizing::BorderBox),
        1 => Some(BoxSizing::ContentBox),
        _ => None,
    }
}

pub const fn boxing_size_to_enum(value: BoxSizing) -> i8 {
    match value {
        BoxSizing::BorderBox => 0,
        BoxSizing::ContentBox => 1,
    }
}

pub const fn display_mode_from_enum(value: i8) -> Option<DisplayMode> {
    match value {
        0 => Some(DisplayMode::None),
        1 => Some(DisplayMode::Inline),
        2 => Some(DisplayMode::Box),
        3 => Some(DisplayMode::ListItem),
        _ => None,
    }
}

pub const fn display_mode_to_enum(value: DisplayMode) -> i8 {
    match value {
        DisplayMode::None => 0,
        DisplayMode::Inline => 1,
        DisplayMode::Box => 2,
        DisplayMode::ListItem => 3,
    }
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

fn remove_start_end_prefixes(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let bytes = text.as_bytes();
    let mut i = 0;

    while i < bytes.len() {
        // Check for "start-" prefix
        if i + 6 <= bytes.len() && &text[i..i + 6] == "start-" {
            i += 6; // skip "start-"
            continue;
        }
        // Check for "end-" prefix
        if i + 4 <= bytes.len() && &text[i..i + 4] == "end-" {
            i += 4; // skip "end-"
            continue;
        }

        // Copy current character
        result.push(bytes[i] as char);
        i += 1;
    }

    result
}

pub fn grid_placement_to_string(p: &GridPlacement<Atom>) -> String {
    match p {
        GridPlacement::Auto => "auto".into(),
        GridPlacement::Line(n) => n.as_i16().to_string(),
        GridPlacement::Span(n) => format!("span {}", n),
        GridPlacement::NamedLine(name, idx) => {
            if *idx == 0 {
                remove_start_end_prefixes(name)
            } else {
                format!("{} {}", name, idx)
            }
        }
        GridPlacement::NamedSpan(name, idx) => {
            if *idx == 0 {
                format!("span {}", remove_start_end_prefixes(name))
            } else {
                format!("span {} {}", idx, name)
            }
        }
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

pub fn to_line_css(start: &GridPlacement<Atom>, end: &GridPlacement<Atom>) -> Option<String> {
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

pub const fn float_from_enum(value: i8) -> Option<Float> {
    match value {
        0 => Some(Float::None),
        1 => Some(Float::Left),
        2 => Some(Float::Right),
        _ => None,
    }
}

pub const fn float_to_enum(value: Float) -> i8 {
    match value {
        Float::None => 0,
        Float::Left => 1,
        Float::Right => 2,
    }
}

pub const fn clear_from_enum(value: i8) -> Option<Clear> {
    match value {
        0 => Some(Clear::None),
        1 => Some(Clear::Left),
        2 => Some(Clear::Right),
        3 => Some(Clear::Both),
        _ => None,
    }
}

pub const fn clear_to_enum(value: Clear) -> i8 {
    match value {
        Clear::None => 0,
        Clear::Left => 1,
        Clear::Right => 2,
        Clear::Both => 3,
    }
}

pub const fn object_fit_from_enum(value: i8) -> Option<ObjectFit> {
    match value {
        0 => Some(ObjectFit::Contain),
        1 => Some(ObjectFit::Cover),
        2 => Some(ObjectFit::Fill),
        3 => Some(ObjectFit::None),
        4 => Some(ObjectFit::ScaleDown),
        _ => None,
    }
}

pub const fn object_to_enum(value: ObjectFit) -> i8 {
    match value {
        ObjectFit::Contain => 0,
        ObjectFit::Cover => 1,
        ObjectFit::Fill => 2,
        ObjectFit::None => 3,
        ObjectFit::ScaleDown => 4,
    }
}

pub const fn direction_from_enum(value: i8) -> Option<Direction> {
    match value {
        1 => Some(Direction::Ltr),
        2 => Some(Direction::Rtl),
        _ => None,
    }
}

pub const fn direction_to_enum(value: Direction) -> i8 {
    match value {
        Direction::Ltr => 1,
        Direction::Rtl => 2,
    }
}

pub const fn writing_mode_to_enum(value: WritingMode) -> i8 {
    match value {
        WritingMode::HorizontalTb => 0,
        WritingMode::VerticalRl => 1,
        WritingMode::VerticalLr => 2,
    }
}

pub const fn writing_mode_from_enum(value: i8) -> Option<WritingMode> {
    match value {
        0 => Some(WritingMode::HorizontalTb),
        1 => Some(WritingMode::VerticalRl),
        2 => Some(WritingMode::VerticalLr),
        _ => None,
    }
}

pub const fn unicode_bidi_to_enum(value: UnicodeBidi) -> i8 {
    match value {
        UnicodeBidi::Normal => 0,
        UnicodeBidi::Embed => 1,
        UnicodeBidi::BidiOverride => 2,
        UnicodeBidi::Isolate => 3,
        UnicodeBidi::IsolateOverride => 4,
        UnicodeBidi::Plaintext => 5,
    }
}

pub const fn unicode_bidi_from_enum(value: i8) -> Option<UnicodeBidi> {
    match value {
        0 => Some(UnicodeBidi::Normal),
        1 => Some(UnicodeBidi::Embed),
        2 => Some(UnicodeBidi::BidiOverride),
        3 => Some(UnicodeBidi::Isolate),
        4 => Some(UnicodeBidi::IsolateOverride),
        5 => Some(UnicodeBidi::Plaintext),
        _ => None,
    }
}

pub const fn hyphens_to_enum(value: Hyphens) -> i8 {
    match value {
        Hyphens::Manual => 0,
        Hyphens::None => 1,
        Hyphens::Auto => 2,
    }
}

pub const fn hyphens_from_enum(value: i8) -> Option<Hyphens> {
    match value {
        0 => Some(Hyphens::Manual),
        1 => Some(Hyphens::None),
        2 => Some(Hyphens::Auto),
        _ => None,
    }
}
