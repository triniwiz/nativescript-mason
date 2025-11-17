use cssparser::{ParseError, Parser, ParserInput, Token};
use std::collections::HashMap;
use style_atoms::Atom;
use taffy::style_helpers::*;
use taffy::{
    style_helpers::fit_content, style_helpers::fr, style_helpers::length, style_helpers::percent,
    CheapCloneStr, GridPlacement, GridTemplateArea, GridTemplateComponent, GridTemplateRepetition,
    LengthPercentage, MaxTrackSizingFunction, MinMax, MinTrackSizingFunction, RepetitionCount,
    TrackSizingFunction,
};

fn parse_repeat<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<GridTemplateRepetition<Atom>, ParseError<'i, ()>> {
    parser.parse_nested_block(|parser| {
        // --- Parse repetition count ---
        let repetition_ident = parser.expect_ident_or_string()?.as_ref().to_string();
        let repetition = match repetition_ident.as_str() {
            "auto-fit" => RepetitionCount::AutoFit,
            "auto-fill" => RepetitionCount::AutoFill,
            _ => {
                let count = repetition_ident.parse::<u16>().unwrap_or(0);
                RepetitionCount::Count(count)
            }
        };

        parser.expect_comma()?;

        // --- Parse tracks ---
        let mut tracks = vec![];
        let mut line_names = vec![];

        while !parser.is_exhausted() {
            // Collect names before track
            let mut names: Vec<Atom> = vec![];

            while parser
                .try_parse(|p| p.expect_square_bracket_block())
                .is_ok()
            {
                let nested_names = parser.parse_nested_block(|p| {
                    let mut out = Vec::new();
                    while let Ok(name) = p.expect_ident_cloned() {
                        out.push(name.as_ref().into());
                    }
                    Ok(out)
                })?;
                names.extend(nested_names);
            }

            let track = parse_track_size(parser, device_scale)?;
            tracks.push(track);
            line_names.push(names);
        }

        Ok(GridTemplateRepetition {
            count: repetition,
            tracks,
            line_names,
        })
    })
}

fn parse_repeat_inner<'i, 't, S: CheapCloneStr>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<GridTemplateRepetition<S>, ParseError<'i, ()>> {
    // Parse repetition count (number, string, or ident for auto-fit/auto-fill)
    let count = if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
        RepetitionCount::Count(num as u16)
    } else if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
        match ident.as_ref() {
            "auto-fit" => RepetitionCount::AutoFit,
            "auto-fill" => RepetitionCount::AutoFill,
            _ => {
                // Try to parse as number from ident
                if let Ok(num) = ident.parse::<u16>() {
                    RepetitionCount::Count(num)
                } else {
                    return Err(parser.new_custom_error(()));
                }
            }
        }
    } else if let Ok(string) = parser.try_parse(|p| p.expect_string_cloned()) {
        // Handle string case like "4"
        if let Ok(num) = string.parse::<u16>() {
            RepetitionCount::Count(num)
        } else {
            match string.as_ref() {
                "auto-fit" => RepetitionCount::AutoFit,
                "auto-fill" => RepetitionCount::AutoFill,
                _ => return Err(parser.new_custom_error(())),
            }
        }
    } else {
        return Err(parser.new_custom_error(()));
    };

    parser.expect_comma()?;

    // Parse tracks inside repeat()
    let mut tracks = vec![];
    let mut line_names = vec![vec![]]; // Start with empty line names before first track

    // The repeat() must contain at least one track
    loop {
        // Try to parse optional line names [name1 name2 ...]
        while let Ok(()) = parser.try_parse(|p| p.expect_square_bracket_block()) {
            parser.parse_nested_block(|p| {
                let mut names = vec![];
                while let Ok(name) = p.try_parse(|p| p.expect_ident_cloned()) {
                    names.push(name.as_ref().into());
                }
                // Add names to the last line_names entry
                if let Some(last) = line_names.last_mut() {
                    last.extend(names);
                }
                Ok(())
            })?;
        }

        // Try to parse a track sizing function
        if let Ok(track) = parser.try_parse(|p| parse_track_size(p, device_scale)) {
            tracks.push(track);
            // Add new empty vec for line names after this track
            line_names.push(vec![]);
        } else {
            // No more tracks to parse
            break;
        }
    }

    // Must have parsed at least one track
    if tracks.is_empty() {
        return Err(parser.new_custom_error(()));
    }

    Ok(GridTemplateRepetition {
        count,
        tracks,
        line_names,
    })
}

pub fn parse_track_size<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<TrackSizingFunction, ParseError<'i, ()>> {
    // Skip any leading whitespace
    parser.skip_whitespace();

    // Try auto keyword
    if parser
        .try_parse(|p| p.expect_ident_matching("auto"))
        .is_ok()
    {
        return Ok(MinMax::AUTO);
    }

    // Try minmax(...)
    if parser
        .try_parse(|p| p.expect_function_matching("minmax"))
        .is_ok()
    {
        return parser.parse_nested_block(|parser| {
            let min = parse_min_track_size(parser, device_scale)?;
            parser.expect_comma()?;
            let max = parse_max_track_size(parser, device_scale)?;
            Ok(minmax(min, max))
        });
    }

    // Try fit-content(...)
    if parser
        .try_parse(|p| p.expect_function_matching("fit-content"))
        .is_ok()
    {
        let lp =
            parser.parse_nested_block(|parser| parse_length_percentage(parser, device_scale))?;
        return Ok(fit_content(lp));
    }

    // Try min-content / max-content keywords
    if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
        return match ident.as_ref() {
            "min-content" => Ok(MinMax::MIN_CONTENT),
            "max-content" => Ok(MinMax::MAX_CONTENT),
            _ => Err(parser.new_custom_error(())),
        };
    }

    // Try dimensions (px, fr, dip, number) or percentage
    // Use next() instead of next_including_whitespace() - it automatically skips whitespace
    let token = parser.next()?;
    match token {
        Token::Dimension {
            value, ref unit, ..
        } => match &**unit {
            "px" => Ok(length(*value)),
            "dip" => Ok(length(*value * device_scale)),
            "fr" => Ok(fr(*value)),
            _ => Err(parser.new_custom_error(())),
        },
        Token::Number { value, .. } => Ok(length(*value * device_scale)),
        Token::Percentage { unit_value, .. } => Ok(percent(*unit_value)),
        _ => Err(parser.new_custom_error(())),
    }
}

// Helper to parse just length/percentage (for fit-content argument)
fn parse_length_percentage<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<LengthPercentage, ParseError<'i, ()>> {
    parser.skip_whitespace();
    let token = parser.next()?;
    match token {
        Token::Dimension {
            value, ref unit, ..
        } => match &**unit {
            "px" => Ok(LengthPercentage::length(*value)),
            "dip" => Ok(LengthPercentage::length(*value * device_scale)),
            _ => Err(parser.new_custom_error(())),
        },
        Token::Number { value, .. } => Ok(LengthPercentage::length(*value * device_scale)),
        Token::Percentage { unit_value, .. } => Ok(LengthPercentage::percent(*unit_value)),
        _ => Err(parser.new_custom_error(())),
    }
}

// Helper to parse MinTrackSizingFunction (for minmax min value)
fn parse_min_track_size<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<MinTrackSizingFunction, ParseError<'i, ()>> {
    parser.skip_whitespace();

    // Try auto keyword
    if parser
        .try_parse(|p| p.expect_ident_matching("auto"))
        .is_ok()
    {
        return Ok(MinTrackSizingFunction::AUTO);
    }

    // Try min-content / max-content keywords
    if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
        return match ident.as_ref() {
            "min-content" => Ok(MinTrackSizingFunction::MIN_CONTENT),
            "max-content" => Ok(MinTrackSizingFunction::MAX_CONTENT),
            _ => Err(parser.new_custom_error(())),
        };
    }

    // Try dimensions or percentage
    let token = parser.next()?;
    match token {
        Token::Dimension {
            value, ref unit, ..
        } => match &**unit {
            "px" => Ok(MinTrackSizingFunction::length(*value)),
            "dip" => Ok(MinTrackSizingFunction::length(*value * device_scale)),
            _ => Err(parser.new_custom_error(())),
        },
        Token::Number { value, .. } => Ok(MinTrackSizingFunction::length(*value * device_scale)),
        Token::Percentage { unit_value, .. } => Ok(MinTrackSizingFunction::percent(*unit_value)),
        _ => Err(parser.new_custom_error(())),
    }
}

// Helper to parse MaxTrackSizingFunction (for minmax max value)
fn parse_max_track_size<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<MaxTrackSizingFunction, ParseError<'i, ()>> {
    parser.skip_whitespace();

    // Try auto keyword
    if parser
        .try_parse(|p| p.expect_ident_matching("auto"))
        .is_ok()
    {
        return Ok(MaxTrackSizingFunction::AUTO);
    }

    // Try min-content / max-content keywords
    if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
        return match ident.as_ref() {
            "min-content" => Ok(MaxTrackSizingFunction::MIN_CONTENT),
            "max-content" => Ok(MaxTrackSizingFunction::MAX_CONTENT),
            _ => Err(parser.new_custom_error(())),
        };
    }

    // Try dimensions, fr, or percentage
    let token = parser.next()?;
    match token {
        Token::Dimension {
            value, ref unit, ..
        } => match &**unit {
            "px" => Ok(MaxTrackSizingFunction::length(*value)),
            "dip" => Ok(MaxTrackSizingFunction::length(*value * device_scale)),
            "fr" => Ok(MaxTrackSizingFunction::fr(*value)),
            _ => Err(parser.new_custom_error(())),
        },
        Token::Number { value, .. } => Ok(MaxTrackSizingFunction::length(*value * device_scale)),
        Token::Percentage { unit_value, .. } => Ok(MaxTrackSizingFunction::percent(*unit_value)),
        _ => Err(parser.new_custom_error(())),
    }
}

/// Parses a full grid-template string (rows or columns)
pub fn parse_grid_template<S: CheapCloneStr>(
    input: &str,
    device_scale: f32,
) -> Result<(Vec<GridTemplateComponent<S>>, Vec<Vec<S>>), ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut components: Vec<GridTemplateComponent<S>> = Vec::new();
    let mut all_line_names: Vec<Vec<S>> = Vec::new(); // NEW: Track all line names

    while !parser.is_exhausted() {
        parser.skip_whitespace();

        // Parse line names
        let mut names = Vec::<S>::new();
        while parser
            .try_parse(|p| p.expect_square_bracket_block())
            .is_ok()
        {
            let parsed_names = parser.parse_nested_block(|p| {
                let mut inner = Vec::new();
                while let Ok(name) = p.expect_ident_cloned() {
                    inner.push(name.as_ref().into());
                }
                Ok(inner)
            })?;
            names.extend(parsed_names);
        }

        parser.skip_whitespace();

        // Parse repeat() function
        if parser
            .try_parse(|p| p.expect_function_matching("repeat"))
            .is_ok()
        {
            let repetition = parser.parse_nested_block(|p| parse_repeat_inner(p, device_scale))?;

            // Extract line names from the repetition and add to all_line_names
            for line_name_set in &repetition.line_names {
                all_line_names.push(line_name_set.clone());
            }

            components.push(GridTemplateComponent::Repeat(repetition));
            continue;
        }

        // Parse single track
        let track = parse_track_size(&mut parser, device_scale)?;

        // Add line names before this track
        all_line_names.push(names.clone());

        // Create Repeat(count=1) to preserve line names
        let single_repeat = GridTemplateComponent::Repeat(GridTemplateRepetition {
            count: RepetitionCount::Count(1),
            tracks: vec![track],
            line_names: vec![names],
        });
        components.push(single_repeat);
    }

    Ok((components, all_line_names))
}

pub fn parse_grid_template_areas<S: CheapCloneStr>(
    input: &str,
) -> Result<Vec<GridTemplateArea<S>>, ParseError<'_, ()>>
where
    S: std::hash::Hash,
{
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut areas: Vec<GridTemplateArea<S>> = Vec::new();
    let mut map: HashMap<S, (u16, u16, u16, u16)> = HashMap::new();

    let mut row_index = 0;

    while !parser.is_exhausted() {
        parser.skip_whitespace();

        // Expect a string token for each row
        if let Ok(Token::QuotedString(row)) = parser.next_including_whitespace() {
            // Split the row into area names
            let cols: Vec<&str> = row.split_whitespace().collect();

            for (col_index, &name) in cols.iter().enumerate() {
                if name == "." {
                    continue;
                }

                let key: S = name.into();
                map.entry(key.clone())
                    .and_modify(|e| {
                        e.2 = e.2.max(col_index as u16 + 1);
                        e.3 = e.3.max(row_index + 1);
                    })
                    .or_insert((
                        row_index,
                        row_index + 1,
                        col_index as u16,
                        col_index as u16 + 1,
                    ));
            }

            row_index += 1;
        } else {
            // Skip invalid tokens or stop parsing
            parser.next()?;
        }
    }

    for (name, (row_start, row_end, col_start, col_end)) in map {
        areas.push(GridTemplateArea {
            name,
            row_start,
            row_end,
            column_start: col_start,
            column_end: col_end,
        });
    }

    Ok(areas)
}

/// Parses `grid-auto-columns` or `grid-auto-rows`
/// Example: "100px", "1fr", "minmax(50px, 200px)", "100px, 1fr"
pub fn parse_grid_auto_tracks(
    input: &str,
    device_scale: f32,
) -> Result<Vec<TrackSizingFunction>, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut tracks = Vec::new();

    while !parser.is_exhausted() {
        parser.skip_whitespace();

        // Parse a single track size
        let track = parse_track_size(&mut parser, device_scale)?;
        tracks.push(track);

        parser.skip_whitespace();

        // If a comma is present, consume it and continue
        if parser.try_parse(|p| p.expect_delim(',')).is_err() {
            break; // no more tracks
        }
    }

    Ok(tracks)
}

pub enum StartOrEnd {
    Start,
    End,
}

impl StartOrEnd {
    pub fn value(&self) -> &'static str {
        match self {
            StartOrEnd::Start => "start",
            StartOrEnd::End => "end",
        }
    }
}

// Parse a single `grid-placement` value (used for grid-column-start, etc.)
fn parse_grid_placement_with_parser<'i, 't, S: CheapCloneStr>(
    parser: &mut Parser<'i, 't>,
    start_or_end: StartOrEnd,
) -> Result<GridPlacement<S>, ParseError<'i, ()>> {
    parser.skip_whitespace();

    // auto
    if parser
        .try_parse(|p| p.expect_ident_matching("auto"))
        .is_ok()
    {
        return Ok(GridPlacement::Auto);
    }

    // span <integer>? | span <ident> <integer>?
    if parser
        .try_parse(|p| p.expect_ident_matching("span"))
        .is_ok()
    {
        parser.skip_whitespace();

        // span 3
        if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
            return Ok(GridPlacement::Span(num as u16));
        }

        // span <name> [<integer>]?
        if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
            let name = format!("{}-{}", start_or_end.value(), ident.as_ref()).into();

            if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
                return Ok(GridPlacement::NamedSpan(name, num as u16));
            }

            // default = 0
            return Ok(GridPlacement::NamedSpan(name, 0));
        }

        // span "string" [<integer>]?
        if let Ok(string) = parser.try_parse(|p| p.expect_string_cloned()) {
            let name = format!("{}-{}", start_or_end.value(), string.as_ref()).into();

            if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
                return Ok(GridPlacement::NamedSpan(name, num as u16));
            }

            return Ok(GridPlacement::NamedSpan(name, 0));
        }

        return Ok(GridPlacement::Span(1));
    }

    // <integer>
    if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
        return Ok(GridPlacement::from_line_index(num as i16));
    }

    // <ident> [<integer>]?
    if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
        let name = format!("{}-{}", start_or_end.value(), ident.as_ref()).into();

        if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
            return Ok(GridPlacement::NamedLine(name, num as i16));
        }

        // default = 0 (correct)
        return Ok(GridPlacement::NamedLine(name, 0));
    }

    // "string" [<integer>]?
    if let Ok(string) = parser.try_parse(|p| p.expect_string_cloned()) {
        let name = format!("{}-{}", start_or_end.value(), string.as_ref()).into();

        if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
            return Ok(GridPlacement::NamedLine(name, num as i16));
        }

        // default = 0 (correct)
        return Ok(GridPlacement::NamedLine(name, 0));
    }

    Ok(GridPlacement::Auto)
}

pub fn parse_grid_placement<S: CheapCloneStr>(
    input: &str,
    start_or_end: StartOrEnd,
) -> Result<GridPlacement<S>, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    parse_grid_placement_with_parser(&mut parser, start_or_end)
}

/// Parse `grid-column` or `grid-row` shorthand
pub fn parse_grid_placement_shorthand<S: CheapCloneStr>(
    input: &str,
) -> Result<(GridPlacement<S>, GridPlacement<S>), ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let start = parse_grid_placement_with_parser(&mut parser, StartOrEnd::Start)?;
    parser.skip_whitespace();
    let end = if parser.try_parse(|p| p.expect_delim('/')).is_ok() {
        parser.skip_whitespace();
        parse_grid_placement_with_parser(&mut parser, StartOrEnd::End)?
    } else {
        GridPlacement::Auto
    };
    Ok((start, end))
}

#[derive(Debug, Clone, PartialEq)]
pub struct GridAreaPosition {
    pub row_start: GridPlacement<Atom>,
    pub column_start: GridPlacement<Atom>,
    pub row_end: GridPlacement<Atom>,
    pub column_end: GridPlacement<Atom>,
}

/// Parse `grid-area` shorthand (row-start / column-start / row-end / column-end)
pub fn parse_grid_area(input: &str) -> Result<GridAreaPosition, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut parts: Vec<GridPlacement<Atom>> = vec![];

    let count = 0;
    while !parser.is_exhausted() {
        let start_or_end = if count % 2 == 0 {
            StartOrEnd::Start
        } else {
            StartOrEnd::End
        };
        parts.push(parse_grid_placement_with_parser(&mut parser, start_or_end)?);
        parser.skip_whitespace();
        let _ = parser.try_parse(|p| p.expect_delim('/'));
        parser.skip_whitespace();
    }

    Ok(match parts.len() {
        1 => GridAreaPosition {
            row_start: parts[0].clone(),
            column_start: GridPlacement::Auto,
            row_end: GridPlacement::Auto,
            column_end: GridPlacement::Auto,
        },
        2 => GridAreaPosition {
            row_start: parts[0].clone(),
            column_start: parts[1].clone(),
            row_end: GridPlacement::Auto,
            column_end: GridPlacement::Auto,
        },
        3 => GridAreaPosition {
            row_start: parts[0].clone(),
            column_start: parts[1].clone(),
            row_end: parts[2].clone(),
            column_end: GridPlacement::Auto,
        },
        4 => GridAreaPosition {
            row_start: parts[0].clone(),
            column_start: parts[1].clone(),
            row_end: parts[2].clone(),
            column_end: parts[3].clone(),
        },
        _ => GridAreaPosition {
            row_start: GridPlacement::Auto,
            column_start: GridPlacement::Auto,
            row_end: GridPlacement::Auto,
            column_end: GridPlacement::Auto,
        },
    })
}
