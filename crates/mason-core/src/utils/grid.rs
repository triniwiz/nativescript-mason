use cssparser::{ParseError, Parser, ParserInput, Token};
use std::collections::HashMap;
use style_atoms::Atom;
use taffy::style_helpers::*;
use taffy::{
    style_helpers::fit_content, style_helpers::fr, style_helpers::length, style_helpers::percent,
    GridPlacement, GridTemplateArea, GridTemplateComponent, GridTemplateRepetition,
    LengthPercentage, MinMax, RepetitionCount, TrackSizingFunction,
};

fn parse_repeat<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<GridTemplateRepetition<Atom>, ParseError<'i, ()>> {
    parser.expect_parenthesis_block()?; // consume `(...)`

    parser.parse_nested_block(|parser| {
        // --- Parse repetition type ---
        let repetition_ident = parser.expect_ident_or_string()?.as_ref().to_string();
        let repetition = match repetition_ident.as_str() {
            "auto-fit" => RepetitionCount::AutoFit,
            "auto-fill" => RepetitionCount::AutoFill,
            _ => {
                let count = repetition_ident.parse::<u16>().unwrap_or(0);
                RepetitionCount::Count(count)
            }
        };

        parser.expect_comma()?; // comma after repetition

        // --- Parse tracks and line names ---
        let mut tracks = vec![];
        let mut line_names = vec![];

        while !parser.is_exhausted() {
            // collect all line names before this track
            let mut names: Vec<Atom> = vec![];

            while parser
                .try_parse(|p| p.expect_square_bracket_block())
                .is_ok()
            {
                // parse the content inside `[...]`
                let names_in_brackets = parser.parse_nested_block(|p| {
                    let mut inner_names = Vec::new();
                    while let Ok(name) = p.expect_ident_cloned() {
                        inner_names.push(name.as_ref().into());
                    }
                    Ok(inner_names)
                })?;
                names.extend(names_in_brackets);
            }

            // parse the track size
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

pub fn parse_track_size<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<TrackSizingFunction, ParseError<'i, ()>> {
    // auto
    if parser
        .try_parse(|p| p.expect_ident_matching("auto"))
        .is_ok()
    {
        return Ok(MinMax::AUTO);
    }

    // minmax(...)
    if parser
        .try_parse(|p| p.expect_function_matching("minmax"))
        .is_ok()
    {
        let (min, max) = parser.parse_nested_block(|parser| {
            let min = parse_track_size(parser, device_scale)?;
            parser.expect_comma()?;
            let max = parse_track_size(parser, device_scale)?;
            Ok((min, max))
        })?;

        return Ok(minmax(min.min, max.max));
    }

    // fit-content(...)
    if parser
        .try_parse(|p| p.expect_function_matching("fit-content"))
        .is_ok()
    {
        let lp = parser.parse_nested_block(|parser| {
            let token = parser.next_including_whitespace()?;
            match token {
                Token::Dimension {
                    value, ref unit, ..
                } => match &**unit {
                    "px" => Ok(LengthPercentage::length(*value)),
                    "dip" => Ok(LengthPercentage::length(*value * device_scale)),
                    _ => Err(parser.new_error_for_next_token()),
                },
                Token::Number { value, .. } => Ok(LengthPercentage::length(*value * device_scale)),
                Token::Percentage { unit_value, .. } => Ok(LengthPercentage::percent(*unit_value)),
                _ => Err(parser.new_error_for_next_token()),
            }
        })?;
        return Ok(fit_content(lp));
    }

    // dimensions (px, fr, dip, number (dip))

    match parser.next_including_whitespace() {
        Ok(Token::Dimension {
            value, ref unit, ..
        }) => {
            return match &**unit {
                "px" => Ok(length(*value)),
                "dip" => Ok(length(*value * device_scale)),
                "fr" => Ok(fr(*value)),
                _ => Ok(MinMax::AUTO),
            };
        }
        Ok(Token::Number { value, .. }) => {
            return Ok(length(*value * device_scale));
        }
        _ => {}
    }

    // percentage
    if let Ok(Token::Percentage { unit_value, .. }) = parser.next_including_whitespace() {
        return Ok(percent(*unit_value));
    }

    // min-content / max-content
    if let Ok(ident) = parser.expect_ident() {
        return match ident.as_ref() {
            "min-content" => Ok(MinMax::MIN_CONTENT),
            "max-content" => Ok(MinMax::MAX_CONTENT),
            _ => Ok(MinMax::AUTO),
        };
    }

    Ok(MinMax::AUTO)
}

/// Parses a full grid-template string (rows or columns)
pub fn parse_grid_template(
    input: &str,
    device_scale: f32,
) -> Result<Vec<GridTemplateComponent<Atom>>, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut components = vec![];

    while !parser.is_exhausted() {
        // Skip whitespace
        parser.skip_whitespace();

        // Peek to see if it's a repeat() function
        if parser
            .try_parse(|p| p.expect_function_matching("repeat"))
            .is_ok()
        {
            let repetition = parse_repeat(&mut parser, device_scale)?;
            components.push(GridTemplateComponent::Repeat(repetition));
        } else {
            // Collect line names (optional) before single track
            let mut names: Vec<Atom> = vec![];
            while parser
                .try_parse(|p| p.expect_square_bracket_block())
                .is_ok()
            {
                let inner_names = parser.parse_nested_block(|p| {
                    let mut inner = Vec::new();
                    while let Ok(name) = p.expect_ident_cloned() {
                        inner.push(name.as_ref().into());
                    }
                    Ok(inner)
                })?;
                names.extend(inner_names);
            }

            // Parse the track size
            let track = parse_track_size(&mut parser, device_scale)?;

            components.push(GridTemplateComponent::Single(track));
        }
    }

    Ok(components)
}

pub fn parse_grid_template_areas(
    input: &str,
) -> Result<Vec<GridTemplateArea<Atom>>, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut areas: Vec<GridTemplateArea<Atom>> = Vec::new();
    let mut map: HashMap<Atom, (u16, u16, u16, u16)> = HashMap::new();

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

                let key: Atom = name.into();
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

// Parse a single `grid-placement` value (used for grid-column-start, etc.)
fn parse_grid_placement_with_parser<'i, 't>(
    parser: &mut Parser<'i, 't>,
) -> Result<GridPlacement<Atom>, ParseError<'i, ()>> {
    parser.skip_whitespace();

    if parser
        .try_parse(|p| p.expect_ident_matching("auto"))
        .is_ok()
    {
        return Ok(GridPlacement::Auto);
    }

    // span <number> | span <name>
    if parser
        .try_parse(|p| p.expect_ident_matching("span"))
        .is_ok()
    {
        parser.skip_whitespace();

        if let Ok(Token::Number {
            int_value: Some(num),
            ..
        }) = parser.next_including_whitespace()
        {
            return Ok(GridPlacement::Span(*num as u16));
        }

        if let Ok(ident) = parser.expect_ident_cloned() {
            return Ok(GridPlacement::NamedSpan(Atom::from(ident.as_ref()), 0));
        }

        return Ok(GridPlacement::Span(1));
    }

    // <number>
    if let Ok(Token::Number {
        int_value: Some(num),
        ..
    }) = parser.next_including_whitespace()
    {
        return Ok(GridPlacement::from_line_index(*num as i16));
    }

    // <ident> or <string>
    if let Ok(ident) = parser.expect_ident_cloned() {
        return Ok(GridPlacement::NamedLine(Atom::from(ident.as_ref()), 0));
    }

    Ok(GridPlacement::Auto)
}

pub fn parse_grid_placement(input: &str) -> Result<GridPlacement<Atom>, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    parse_grid_placement_with_parser(&mut parser)
}

/// Parse `grid-column` or `grid-row` shorthand
pub fn parse_grid_placement_shorthand(
    input: &str,
) -> Result<(GridPlacement<Atom>, GridPlacement<Atom>), ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let start = parse_grid_placement_with_parser(&mut parser)?;
    parser.skip_whitespace();
    let end = if parser.try_parse(|p| p.expect_delim('/')).is_ok() {
        parser.skip_whitespace();
        parse_grid_placement_with_parser(&mut parser)?
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

    while !parser.is_exhausted() {
        parts.push(parse_grid_placement_with_parser(&mut parser)?);
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
