use super::{
    background::{token, top_level_parts, Part},
    length::{resolve, Component, LengthMode, LengthPercentage},
    CssPositionResultRecord, LengthContext,
};
use cssparser::Token;

#[derive(Clone, Debug, PartialEq)]
pub struct Axis {
    pub(super) fraction: f32,
    offset: Option<LengthPercentage>,
}

impl Axis {
    pub(super) const CENTER: Self = Self {
        fraction: 0.5,
        offset: None,
    };
    const START: Self = Self {
        fraction: 0.,
        offset: None,
    };

    pub(super) fn explicit(component: &Component<'_>) -> Option<Self> {
        Some(Self {
            offset: Some(LengthPercentage::parse(component)?),
            ..Self::START
        })
    }

    pub fn math_text(&self, horizontal: bool) -> Option<String> {
        let formula = self.offset.as_ref()?.expression_text()?;
        Some(if self.fraction == 1. {
            let edge = if horizontal { "right" } else { "bottom" };
            format!("{edge} {formula}")
        } else {
            formula.to_owned()
        })
    }

    pub fn has_math(&self) -> bool {
        self.offset
            .as_ref()
            .and_then(LengthPercentage::expression_text)
            .is_some()
    }

    pub(super) fn uses_percentage(&self) -> bool {
        self.offset.as_ref().is_some_and(LengthPercentage::uses_percentage)
    }

    pub fn components(&self, context: LengthContext) -> (f32, f32) {
        let (fraction, length) = self
            .offset
            .as_ref()
            .and_then(|value| value.components(context))
            .unwrap_or_default();
        if self.fraction == 1. {
            (self.fraction - fraction, -length)
        } else {
            (self.fraction + fraction, length)
        }
    }

    pub fn resolve(&self, size: f32, context: LengthContext) -> f32 {
        let offset = self
            .offset
            .as_ref()
            .and_then(|value| value.resolve(context, size))
            .unwrap_or_default();
        let anchor = self.fraction * size;
        if self.fraction == 1. {
            anchor - offset
        } else {
            anchor + offset
        }
    }
}

fn is_ident(token: &Token<'_>, expected: &str) -> bool {
    matches!(token, Token::Ident(name) if name.eq_ignore_ascii_case(expected))
}

pub(super) fn edge(token: &Token<'_>) -> Option<(usize, Axis)> {
    let Token::Ident(name) = token else {
        return None;
    };
    let (axis, fraction) = match name.to_ascii_lowercase().as_str() {
        "left" => (0, 0.),
        "right" => (0, 1.),
        "top" => (1, 0.),
        "bottom" => (1, 1.),
        _ => return None,
    };
    Some((
        axis,
        Axis {
            fraction,
            offset: None,
        },
    ))
}

fn axis_value(component: &Component<'_>) -> Option<Axis> {
    if component
        .literal()
        .is_some_and(|token| is_ident(token, "center"))
    {
        return Some(Axis::CENTER);
    }
    Axis::explicit(component)
}

pub(super) fn parse_axis_position(tokens: &[Component<'_>], axis: usize) -> Option<Axis> {
    match tokens {
        [token] => match token.literal().and_then(edge) {
            Some((direction, value)) => (direction == axis).then_some(value),
            None => axis_value(token),
        },
        [token, offset] => {
            let (direction, mut value) = edge(token.literal()?)?;
            if direction != axis {
                return None;
            }
            value.offset = Some(LengthPercentage::parse(offset)?);
            Some(value)
        }
        _ => None,
    }
}

pub(super) fn simple_position_order<T>(
    terms: &[T],
    side: impl Fn(&T) -> Option<usize>,
) -> Option<[Option<&T>; 2]> {
    let mut axes = [None; 2];
    let mut unassigned = [None; 2];
    let mut unassigned_count = 0;
    for term in terms {
        if let Some(axis) = side(term) {
            if axes[axis].replace(term).is_some() {
                return None;
            }
        } else {
            *unassigned.get_mut(unassigned_count)? = Some(term);
            unassigned_count += 1;
        }
    }
    let mut unassigned = unassigned.into_iter().flatten();
    for axis in &mut axes {
        if axis.is_none() {
            *axis = unassigned.next();
        }
    }
    unassigned.next().is_none().then_some(axes)
}

pub(super) fn parse_position_components(tokens: &[Component<'_>]) -> Option<[Axis; 2]> {
    let mut output = [const { Axis::CENTER }; 2];
    let side = |component: &Component<'_>| component.literal().and_then(edge);
    if tokens.len() <= 2 {
        let terms = simple_position_order(tokens, |token| side(token).map(|(axis, _)| axis))?;
        for (axis, term) in output.iter_mut().zip(terms) {
            if let Some(token) = term {
                *axis = side(token).map(|(_, axis)| axis).or_else(|| axis_value(token))?;
            }
        }
    } else {
        let mut remaining = tokens;
        let mut occupied = [false; 2];
        let mut centered = false;
        while let Some((token, rest)) = remaining.split_first() {
            remaining = rest;
            if token
                .literal()
                .is_some_and(|token| is_ident(token, "center"))
                && !centered
            {
                centered = true;
                continue;
            }
            let (axis, mut value) = side(token)?;
            if occupied[axis] {
                return None;
            }
            occupied[axis] = true;
            if let Some(length) = rest.first().and_then(LengthPercentage::parse) {
                value.offset = Some(length);
                remaining = &rest[1..];
            }
            output[axis] = value;
        }
        if occupied.iter().filter(|&&set| set).count() + usize::from(centered) != 2 {
            return None;
        }
    }
    Some(output)
}

pub(super) fn resolve_position(
    input: &str,
    context: LengthContext,
    transform_origin: bool,
) -> Option<[f64; CssPositionResultRecord::STRIDE]> {
    let parts = top_level_parts(input)?;
    let (first, second) = match parts.as_slice() {
        [Part::Word(first)] => (*first, "center"),
        [Part::Word(first), Part::Word(second)] => (*first, *second),
        [Part::Word(first), Part::Word(second), Part::Word(z)] if transform_origin => {
            if resolve(z, context, LengthMode::Normal)?[0] == 2. {
                return None;
            }
            (*first, *second)
        }
        _ => return None,
    };
    let first_token = token(first);
    let second_token = token(second);
    let first_edge = first_token.as_ref().and_then(edge);
    let second_edge = second_token.as_ref().and_then(edge);
    let swap = matches!(&first_edge, Some((1, _))) || matches!(&second_edge, Some((0, _)));
    if transform_origin
        && swap
        && (!is_keyword(first_token.as_ref()) || !is_keyword(second_token.as_ref()))
    {
        return None;
    }
    let (x, y) = if swap {
        (
            (second, second_token, second_edge),
            (first, first_token, first_edge),
        )
    } else {
        (
            (first, first_token, first_edge),
            (second, second_token, second_edge),
        )
    };

    let component = |(word, token, edge): (&str, Option<Token<'_>>, Option<(usize, Axis)>),
                     axis| {
        if let Some((direction, value)) = edge {
            (axis == direction).then_some([1., f64::from(value.fraction) * 100.])
        } else if token
            .as_ref()
            .is_some_and(|token| is_ident(token, "center"))
        {
            Some([1., 50.])
        } else {
            let [kind, value] = resolve(word, context, LengthMode::Normal)?;
            let fields = match kind {
                0. => [0., value * f64::from(context.scale)],
                1. => [0., value],
                2. => [1., value * 100.],
                _ => return None,
            };
            (fields[1] as f32).is_finite().then_some(fields)
        }
    };
    let [x_type, x_value] = component(x, 0)?;
    let [y_type, y_value] = component(y, 1)?;
    Some([x_type, x_value, y_type, y_value])
}

fn is_keyword(token: Option<&Token<'_>>) -> bool {
    token.is_some_and(|value| edge(value).is_some() || is_ident(value, "center"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_style_positions_with_the_element_context() {
        let context = LengthContext {
            scale: 2.,
            font_size: 14.,
            root_font_size: 16.,
            viewport_width: 200.,
            viewport_height: 100.,
        };
        for (input, origin, expected) in [
            ("top left", true, [1., 0., 1., 0.]),
            ("top", false, [1., 50., 1., 0.]),
            ("bottom 10px", false, [0., 20., 1., 100.]),
            ("calc(1em + 2dppx) 25% 10px", true, [0., 30., 1., 25.]),
            ("right /* x */ 10vw", true, [1., 100., 0., 40.]),
        ] {
            assert_eq!(
                resolve_position(input, context, origin),
                Some(expected),
                "{input}"
            );
        }
        for input in [
            "",
            "left right",
            "bottom 10px",
            "center center 25%",
            "center , top",
        ] {
            assert!(resolve_position(input, context, true).is_none(), "{input}");
        }
    }
}
