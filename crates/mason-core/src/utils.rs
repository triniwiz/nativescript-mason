use crate::style::{DisplayMode, Overflow};
use crate::Style;
use taffy::{AlignContent, AlignItems, AlignSelf, AvailableSpace, BoxSizing, Display, FlexDirection, FlexWrap, GridAutoFlow, JustifyContent, LayoutInput, MaybeMath, MaybeResolve, Position, ResolveOrZero, Size, TextAlign};

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

    let size = size.or_else(|| match available {
        AvailableSpace::MinContent => style_min.or(Some(content_min)),
        AvailableSpace::MaxContent => style_max.or(Some(content_max)),
        AvailableSpace::Definite(w) => Some(w),
    }).unwrap_or(0.);

    if size == 0. {
        return 0.;
    }

    let min = style_min.unwrap_or(content_min);
    let max = style_max.unwrap_or(content_max);

    (size.clamp(min, max) - padding_border).max(0.)
}


pub(crate) fn compute_leaf(
    style: &Style,
    inputs: &LayoutInput,
) -> Size<f32> {

    let padding = style
        .get_padding()
        .resolve_or_zero(inputs.parent_size, |_val, _basis| 0.0);

    let border = style
        .get_border()
        .resolve_or_zero(inputs.parent_size, |_val, _basis| 0.0);

    let size = style
        .get_size()
        .maybe_resolve(inputs.parent_size, |_val, _basis| 0.0);

    let min_size = style
        .get_min_size()
        .maybe_resolve(inputs.parent_size, |_val, _basis| 0.0);

    let max_size = style
        .get_max_size()
        .maybe_resolve(inputs.parent_size, |_val, _basis| 0.0);

    let content_sizes = style.content_sizes();

    let container_pb = padding + border;
    let pbw = container_pb.horizontal_components().sum();
    let pbh = container_pb.vertical_components().sum();
    Size {
        width: resolve_fallback_size(
            inputs.known_dimensions.width,
            inputs.available_space.width,
            size.width,
            min_size.width,
            max_size.width,
            content_sizes.0.width,
            content_sizes.1.width,
            pbw,
        ),
        height: resolve_fallback_size(
            inputs.known_dimensions.height,
            inputs.available_space.height,
            size.height,
            min_size.height,
            max_size.height,
            content_sizes.0.height,
            content_sizes.1.height,
            pbh,
        ),
    }
}