use super::{CssLengthResultRecord as Record, LengthContext};
use cssparser::{ParseError, Parser, ParserInput, Token};
use std::sync::Arc;

#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u8)]
enum Unit {
    Px = 0,
    Percent = 1,
    DevicePixel = 2,
    Em = 3,
    Rem = 4,
    Vw = 5,
    Vh = 6,
    Vmin = 7,
    Vmax = 8,
    Pt = 9,
    Pc = 10,
    In = 11,
    Cm = 12,
    Mm = 13,
    Q = 14,
}

const UNITS: [&str; 15] = [
    "px", "%", "dppx", "em", "rem", "vw", "vh", "vmin", "vmax", "pt", "pc", "in", "cm", "mm", "q",
];

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct LiteralLength(f32, Unit);

impl LiteralLength {
    pub(super) const ZERO: Self = Self(0., Unit::Px);

    pub(super) fn is_percentage(self) -> bool {
        self.1 == Unit::Percent
    }

    pub(super) fn is_negative(self) -> bool {
        self.0 < 0.
    }

    pub(super) fn parse(token: &Token<'_>) -> Option<Self> {
        let (value, unit) = match token {
            Token::Number { value, .. } => (*value, Unit::Px),
            Token::Percentage { unit_value, .. } => (*unit_value * 100., Unit::Percent),
            Token::Dimension { value, unit, .. } => {
                let unit = match unit.to_ascii_lowercase().as_str() {
                    "px" | "dip" => Unit::Px,
                    "dppx" => Unit::DevicePixel,
                    "em" => Unit::Em,
                    "rem" => Unit::Rem,
                    "vw" => Unit::Vw,
                    "vh" => Unit::Vh,
                    "vmin" => Unit::Vmin,
                    "vmax" => Unit::Vmax,
                    "pt" => Unit::Pt,
                    "pc" => Unit::Pc,
                    "in" => Unit::In,
                    "cm" => Unit::Cm,
                    "mm" => Unit::Mm,
                    "q" => Unit::Q,
                    // Mason has historically accepted unknown units as px.
                    _ => Unit::Px,
                };
                (*value, unit)
            }
            _ => return None,
        };
        value.is_finite().then_some(Self(value, unit))
    }

    /// Fraction of the reference size and a length in the context's output units.
    pub fn components(self, context: LengthContext) -> (f32, f32) {
        if self.1 == Unit::Percent {
            (self.0 / 100., 0.)
        } else {
            (0., self.resolve(context, 0.))
        }
    }

    pub(super) fn resolve(self, context: LengthContext, basis: f32) -> f32 {
        if self.1 == Unit::Percent {
            return self.0 * basis / 100.;
        }
        context
            .resolve(self.0, UNITS[self.1 as usize])
            .unwrap_or(0.)
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum LengthMode {
    Normal,
    FontSize,
    ClampScalar,
}

fn is_unit(unit: &str) -> bool {
    matches!(
        unit,
        "px" | "dip"
            | "dp"
            | "dppx"
            | "em"
            | "rem"
            | "vw"
            | "vh"
            | "vmin"
            | "vmax"
            | "pt"
            | "pc"
            | "in"
            | "cm"
            | "mm"
            | "q"
    )
}

pub(super) fn token_value(token: Token<'_>, raw: &str) -> Option<(f64, String)> {
    let (number, unit) = match token {
        Token::Number { value, .. } => (f64::from(value), String::new()),
        Token::Percentage { unit_value, .. } => (f64::from(unit_value) * 100., "%".into()),
        Token::Dimension { value, unit, .. } => (f64::from(value), unit.to_ascii_lowercase()),
        _ => return None,
    };
    let raw_end = raw.len().saturating_sub(unit.len());
    let precise = raw
        .get(..raw_end)
        .and_then(|text| text.parse::<f64>().ok())
        .unwrap_or(number);
    precise.is_finite().then_some((precise, unit))
}

pub(super) fn scalar_fields(value: &str) -> Option<[String; 2]> {
    let value = value.trim().trim_end_matches(';').trim();
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    parser.skip_whitespace();
    let start = parser.position();
    let token = parser.next().ok()?.clone();
    let (value, unit) = token_value(token, parser.slice_from(start))?;
    if !parser.is_exhausted() || !unit.is_empty() && unit != "%" && !is_unit(&unit) {
        return None;
    }
    Some([value.to_string(), unit])
}

/// Return the first numeric token for compatibility with direct style setters
/// that have historically treated unsupported units as CSS pixels.
pub(super) fn scalar_prefix(value: &str) -> Option<[String; 2]> {
    let value = value.trim_start();
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    let start = parser.position();
    let token = parser.next().ok()?.clone();
    let (value, unit) = token_value(token, parser.slice_from(start))?;
    Some([value.to_string(), unit])
}

#[derive(Clone, Copy)]
struct Value {
    length: f64,
    fraction: f64,
    number: bool,
}

impl Value {
    fn number(value: f64) -> Self {
        Self {
            length: value,
            fraction: 0.,
            number: true,
        }
    }
    fn length(value: f64) -> Self {
        Self {
            length: value,
            fraction: 0.,
            number: false,
        }
    }
    fn percent(fraction: f64) -> Self {
        Self {
            length: 0.,
            fraction,
            number: false,
        }
    }
    fn scale(self, factor: f64) -> Self {
        Self {
            length: self.length * factor,
            fraction: self.fraction * factor,
            ..self
        }
    }

    fn packed(self) -> Option<[f64; Record::STRIDE]> {
        let (kind, value) = if self.number {
            (0., self.length)
        } else if self.fraction != 0. {
            if self.length != 0. {
                return None;
            }
            (2., self.fraction)
        } else {
            (1., self.length)
        };
        if !value.is_finite() {
            return None;
        }
        let mut fields = [0.; Record::STRIDE];
        fields[Record::KIND] = kind;
        fields[Record::VALUE] = value;
        Some(fields)
    }
}

#[derive(Clone, Copy)]
struct Context<'a> {
    units: LengthContext,
    percent_basis: Option<f64>,
    font_percent: bool,
    font_fallback: bool,
    clamp: bool,
    unit_kind: UnitKind<'a>,
}

#[derive(Clone, Copy)]
enum UnitKind<'a> {
    Length,
    Angle,
    Ratio,
    Percentage,
    Custom(&'a dyn Fn(f64, &str) -> Option<PortableMathUnit>),
}

impl Context<'_> {
    fn new(units: LengthContext) -> Self {
        Self {
            units,
            percent_basis: None,
            font_percent: false,
            font_fallback: false,
            clamp: false,
            unit_kind: UnitKind::Length,
        }
    }

    fn resolve(self, value: f64, unit: &str) -> Option<Value> {
        if unit.is_empty() {
            return Some(Value::number(if self.clamp {
                value.clamp(-9999., 9999.)
            } else {
                value
            }));
        }
        match self.unit_kind {
            UnitKind::Angle => {
                let factor = if unit == "%" {
                    self.percent_basis? / 100.
                } else {
                    super::angle_factor(unit)?
                };
                return Some(Value::length(value * factor));
            }
            UnitKind::Ratio => return (unit == "%").then(|| Value::number(value / 100.)),
            UnitKind::Percentage => return (unit == "%").then(|| Value::length(value / 100.)),
            UnitKind::Custom(resolve) => {
                return match resolve(value, unit) {
                    Some(PortableMathUnit::Length(value)) => Some(Value::length(value)),
                    Some(PortableMathUnit::Percent(value)) => Some(Value::percent(value)),
                    None if unit == "%" => Some(Value::percent(value)),
                    None => None,
                };
            }
            UnitKind::Length => {}
        }
        if unit == "%" {
            if let Some(basis) = self.percent_basis {
                return Some(Value::length(value * basis / 100.));
            }
        }
        if unit == "%" || unit == "em" && self.font_percent {
            return Some(if self.font_fallback && unit == "%" {
                let font_size = if self.units.font_size > 0. {
                    self.units.font_size
                } else {
                    self.units.root_font_size
                };
                Value::length(value * f64::from(font_size) * f64::from(self.units.scale) / 100.)
            } else {
                Value::percent(if unit == "%" { value / 100. } else { value })
            });
        }
        if !is_unit(unit) {
            return None;
        }
        let value = if self.clamp {
            value.clamp(-9999., 9999.)
        } else {
            value
        };
        // Resolve the unit once as a factor so the expression retains f64 precision.
        Some(Value::length(value * self.units.resolve_factor(unit)))
    }
}

fn compare(a: Value, b: Value, select: fn(f64, f64) -> f64) -> Option<Value> {
    if a.number != b.number {
        return None;
    }
    if a.fraction == 0. && b.fraction == 0. {
        return Some(Value {
            length: select(a.length, b.length),
            ..a
        });
    }
    (a.length == 0. && b.length == 0.).then(|| Value::percent(select(a.fraction, b.fraction)))
}

type CssResult<'i> = Result<Expression, ParseError<'i, ()>>;

#[derive(Clone, Copy, Debug, PartialEq)]
enum MathFunction {
    Calc,
    Min,
    Max,
    Clamp,
}

impl MathFunction {
    fn from_name(name: &str) -> Option<Self> {
        if name.eq_ignore_ascii_case("calc") {
            Some(Self::Calc)
        } else if name.eq_ignore_ascii_case("min") {
            Some(Self::Min)
        } else if name.eq_ignore_ascii_case("max") {
            Some(Self::Max)
        } else if name.eq_ignore_ascii_case("clamp") {
            Some(Self::Clamp)
        } else {
            None
        }
    }
}

pub(super) fn is_math(token: &Token<'_>) -> bool {
    matches!(token, Token::Function(name) if MathFunction::from_name(name).is_some())
}

/// A parsed value can be evaluated again when the viewport, font size, or
/// device scale changes. Operator chains stay flat to bound evaluation depth.
#[derive(Debug, PartialEq)]
pub(super) struct Expression(Term);

#[derive(Debug, PartialEq)]
enum Term {
    Literal(f64, String),
    Sum(Box<Expression>, Vec<(char, Expression)>),
    Product(Box<Expression>, Vec<(char, Expression)>),
    Function(MathFunction, Vec<Expression>),
    Group(Box<Expression>),
}

impl Expression {
    fn evaluate(&self, context: Context) -> Option<Value> {
        match &self.0 {
            Term::Literal(value, unit) => context.resolve(*value, unit),
            Term::Group(inner) => inner.evaluate(context),
            Term::Sum(first, rest) => {
                rest.iter()
                    .try_fold(first.evaluate(context)?, |mut left, (op, right)| {
                        let right = right.evaluate(context)?;
                        if left.number != right.number {
                            return None;
                        }
                        let right = right.scale(if *op == '+' { 1. } else { -1. });
                        left.length += right.length;
                        left.fraction += right.fraction;
                        Some(left)
                    })
            }
            Term::Product(first, rest) => {
                rest.iter()
                    .try_fold(first.evaluate(context)?, |left, (op, right)| {
                        let right = right.evaluate(context)?;
                        Some(match op {
                            '*' if left.number => right.scale(left.length),
                            '*' if right.number => left.scale(right.length),
                            '/' if right.number && right.length != 0. => {
                                left.scale(1. / right.length)
                            }
                            _ => return None,
                        })
                    })
            }
            Term::Function(function, args) => {
                let context = Context {
                    clamp: false,
                    ..context
                };
                match function {
                    MathFunction::Calc => args.first()?.evaluate(context),
                    MathFunction::Min | MathFunction::Max => {
                        let select = if matches!(function, MathFunction::Min) {
                            f64::min
                        } else {
                            f64::max
                        };
                        let (first, rest) = args.split_first()?;
                        rest.iter()
                            .try_fold(first.evaluate(context)?, |left, right| {
                                compare(left, right.evaluate(context)?, select)
                            })
                    }
                    MathFunction::Clamp => {
                        let [lower, preferred, upper] = args.as_slice() else {
                            return None;
                        };
                        let preferred = compare(
                            preferred.evaluate(context)?,
                            upper.evaluate(context)?,
                            f64::min,
                        )?;
                        compare(lower.evaluate(context)?, preferred, f64::max)
                    }
                }
            }
        }
    }

    fn packed(&self, context: Context) -> Option<[f64; Record::STRIDE]> {
        let mut result = self.evaluate(context)?.packed()?;
        // Preserve a standalone 0% as a percentage when the fraction is zero.
        if matches!(&self.0, Term::Literal(_, unit) if unit == "%") {
            result[Record::KIND] = 2.;
        }
        Some(result)
    }

    pub(super) fn resolve(&self, units: LengthContext) -> Option<[f64; Record::STRIDE]> {
        self.packed(Context::new(units))
    }

    pub(super) fn uses_percentage(&self) -> bool {
        match &self.0 {
            Term::Literal(_, unit) => unit == "%",
            Term::Group(inner) => inner.uses_percentage(),
            Term::Sum(first, rest) | Term::Product(first, rest) => {
                first.uses_percentage() || rest.iter().any(|(_, term)| term.uses_percentage())
            }
            Term::Function(_, args) => args.iter().any(Self::uses_percentage),
        }
    }

    pub(super) fn resolve_length_at(&self, units: LengthContext, basis: f32) -> Option<f32> {
        let value = self.evaluate(Context {
            percent_basis: Some(f64::from(basis)),
            ..Context::new(units)
        })?;
        let length = if value.number {
            value.length * f64::from(units.scale)
        } else {
            value.length
        } as f32;
        length.is_finite().then_some(length)
    }

    pub(super) fn resolve_portable_length(
        &self,
        basis: f64,
        resolve_length: &impl Fn(&str) -> Option<f64>,
    ) -> Option<f64> {
        let resolve_unit = |value, unit: &str| {
            let length = if unit == "%" {
                value / 100. * basis
            } else {
                resolve_length(&format!("{value}{unit}")).unwrap_or(value)
            };
            Some(PortableMathUnit::Length(length))
        };
        let [_, value] = self.packed(Context {
            unit_kind: UnitKind::Custom(&resolve_unit),
            ..Context::new(LengthContext::for_scale(1.))
        })?;
        Some(value)
    }

    pub(super) fn resolve_angle(&self, units: LengthContext) -> Option<f64> {
        self.evaluate(Context {
            unit_kind: UnitKind::Angle,
            ..Context::new(units)
        })?
        .packed()
        .map(|fields| fields[Record::VALUE])
    }

    pub(super) fn resolve_angular_position(&self) -> Option<f32> {
        let value = self.evaluate(Context {
            unit_kind: UnitKind::Angle,
            percent_basis: Some(360.),
            ..Context::new(LengthContext::for_scale(1.))
        })?;
        let fraction = if value.number {
            if value.length <= 1. {
                value.length
            } else {
                value.length / 100.
            }
        } else {
            value.length / 360.
        } as f32;
        fraction.is_finite().then_some(fraction)
    }

    pub(super) fn resolve_ratio(&self, units: LengthContext) -> Option<f64> {
        self.evaluate(Context {
            unit_kind: UnitKind::Ratio,
            ..Context::new(units)
        })?
        .packed()
        .map(|fields| fields[Record::VALUE])
    }

    pub(super) fn resolve_percentage(&self) -> Option<f64> {
        let value = self.evaluate(Context {
            unit_kind: UnitKind::Percentage,
            ..Context::new(LengthContext::for_scale(1.))
        })?;
        (!value.number && value.length.is_finite()).then_some(value.length)
    }

    pub(super) fn resolve_number(&self) -> Option<f32> {
        let value = self.evaluate(Context::new(LengthContext::for_scale(1.)))?;
        let number = value.length as f32;
        (value.number && number.is_finite()).then_some(number)
    }
}

fn operator(parser: &mut Parser<'_, '_>, allowed: &str) -> Option<char> {
    parser
        .try_parse(|p| match p.next() {
            Ok(Token::Delim(c)) if allowed.contains(*c) => Ok(*c),
            _ => Err(()),
        })
        .ok()
}

fn signed_number_next(parser: &mut Parser<'_, '_>) -> bool {
    let state = parser.state();
    let signed = matches!(
        parser.next(),
        Ok(Token::Number { has_sign: true, .. }
            | Token::Dimension { has_sign: true, .. }
            | Token::Percentage { has_sign: true, .. })
    );
    parser.reset(&state);
    signed
}

fn sum<'i>(parser: &mut Parser<'i, '_>, depth: u8) -> CssResult<'i> {
    let first = product(parser, depth)?;
    let mut rest = Vec::new();
    while let Some(op) =
        operator(parser, "+-").or_else(|| signed_number_next(parser).then_some('+'))
    {
        rest.push((op, product(parser, depth)?));
    }
    Ok(if rest.is_empty() {
        first
    } else {
        Expression(Term::Sum(Box::new(first), rest))
    })
}

fn product<'i>(parser: &mut Parser<'i, '_>, depth: u8) -> CssResult<'i> {
    let first = operand(parser, depth)?;
    let mut rest = Vec::new();
    while let Some(op) = operator(parser, "*/") {
        rest.push((op, operand(parser, depth)?));
    }
    Ok(if rest.is_empty() {
        first
    } else {
        Expression(Term::Product(Box::new(first), rest))
    })
}

fn operand<'i>(parser: &mut Parser<'i, '_>, depth: u8) -> CssResult<'i> {
    parser.skip_whitespace();
    let start = parser.position();
    let token = parser.next()?.clone();
    if depth >= 32 {
        return Err(parser.new_custom_error(()));
    }
    match token {
        Token::ParenthesisBlock => parser.parse_nested_block(|p| {
            sum(p, depth + 1).map(|term| Expression(Term::Group(Box::new(term))))
        }),
        Token::Function(name) => {
            let function =
                MathFunction::from_name(&name).ok_or_else(|| parser.new_custom_error(()))?;
            parser.parse_nested_block(|p| {
                let args = match function {
                    MathFunction::Calc => vec![sum(p, depth + 1)?],
                    _ => p.parse_comma_separated(|p| sum(p, depth + 1))?,
                };
                if matches!(function, MathFunction::Clamp) && args.len() != 3 {
                    return Err(p.new_custom_error(()));
                }
                Ok(Expression(Term::Function(function, args)))
            })
        }
        token => token_value(token, parser.slice_from(start))
            .map(|(value, unit)| Expression(Term::Literal(value, unit)))
            .ok_or_else(|| parser.new_custom_error(())),
    }
}

pub(super) fn parse_component<'i>(parser: &mut Parser<'i, '_>) -> CssResult<'i> {
    operand(parser, 0)
}

/// A component in a property grammar can be a literal or an entire math function.
pub(super) enum Component<'i> {
    Literal(Token<'i>),
    Math(Arc<Expression>, &'i str),
}

impl<'i> Component<'i> {
    pub(super) fn read(parser: &mut Parser<'i, '_>) -> Result<Self, ParseError<'i, ()>> {
        parser.skip_whitespace();
        let state = parser.state();
        let start = parser.position();
        let token = parser.next()?.clone();
        if !is_math(&token) {
            return Ok(Self::Literal(token));
        }
        parser.reset(&state);
        let value = parse_component(parser)?;
        Ok(Self::Math(Arc::new(value), parser.slice_from(start)))
    }

    pub(super) fn parse(value: &'i str) -> Option<Self> {
        let mut input = ParserInput::new(value);
        let mut parser = Parser::new(&mut input);
        parser.parse_entirely(Self::read).ok()
    }

    pub(super) fn literal(&self) -> Option<&Token<'i>> {
        match self {
            Self::Literal(token) => Some(token),
            Self::Math(..) => None,
        }
    }

    pub(super) fn angle(&self) -> Option<f32> {
        match self {
            Self::Literal(token) => super::angle(token),
            Self::Math(expression, _) => {
                let angle = expression.resolve_angle(LengthContext::for_scale(1.))? as f32;
                angle.is_finite().then_some(angle)
            }
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub(super) enum LengthPercentage {
    Literal(LiteralLength),
    Math(Arc<Expression>, Arc<str>),
}

impl LengthPercentage {
    pub(super) const ZERO: Self = Self::Literal(LiteralLength::ZERO);

    pub(super) fn parse(value: &Component<'_>) -> Option<Self> {
        match value {
            Component::Literal(token) => Self::from_token(token),
            Component::Math(expression, source) => {
                expression.resolve_length_at(LengthContext::for_scale(1.), 1.)?;
                Some(Self::Math(Arc::clone(expression), Arc::from(*source)))
            }
        }
    }

    pub(super) fn from_token(token: &Token<'_>) -> Option<Self> {
        LiteralLength::parse(token).map(Self::Literal)
    }

    pub(super) fn expression_text(&self) -> Option<&str> {
        match self {
            Self::Math(_, source) => Some(source),
            Self::Literal(_) => None,
        }
    }

    pub(super) fn uses_percentage(&self) -> bool {
        match self {
            Self::Literal(length) => length.is_percentage(),
            Self::Math(expression, _) => expression.uses_percentage(),
        }
    }

    pub(super) fn resolve(&self, context: LengthContext, basis: f32) -> Option<f32> {
        match self {
            Self::Literal(length) => Some(length.resolve(context, basis)),
            Self::Math(expression, _) => expression.resolve_length_at(context, basis),
        }
    }

    pub(super) fn components(&self, context: LengthContext) -> Option<(f32, f32)> {
        let expression = match self {
            Self::Literal(length) => return Some(length.components(context)),
            Self::Math(expression, _) => expression,
        };
        let value = expression.evaluate(Context::new(context))?;
        let length = if value.number {
            value.length * f64::from(context.scale)
        } else {
            value.length
        } as f32;
        let fraction = value.fraction as f32;
        (length.is_finite() && fraction.is_finite()).then_some((fraction, length))
    }
}

pub fn resolve(
    input: &str,
    units: LengthContext,
    mode: LengthMode,
) -> Option<[f64; Record::STRIDE]> {
    let input = input.trim().trim_end_matches(';').trim();
    if input.contains('(') && super::background::top_level_parts(input)?.len() != 1 {
        return None;
    }
    let mut parser_input = ParserInput::new(input);
    let mut parser = Parser::new(&mut parser_input);
    let expression = parse_component(&mut parser).ok()?;
    if !parser.is_exhausted() {
        return None;
    }
    let context = Context {
        font_percent: mode == LengthMode::FontSize,
        clamp: mode == LengthMode::ClampScalar,
        ..Context::new(units)
    };
    expression.packed(context).or_else(|| {
        if mode != LengthMode::FontSize {
            return None;
        }
        expression.packed(Context {
            font_fallback: true,
            ..Context::new(units)
        })
    })
}

/// An absolute length or percentage points supplied by a portable CSS math caller.
pub enum PortableMathUnit {
    Length(f64),
    Percent(f64),
}

/// Evaluate a math function with units supplied by the host.
pub fn resolve_portable_math(
    input: &str,
    resolve_unit: impl Fn(f64, &str) -> Option<PortableMathUnit>,
) -> Option<[f64; Record::STRIDE]> {
    let input = input.trim();
    if super::background::top_level_parts(input)?.len() != 1 {
        return None;
    }
    let Component::Math(expression, _) = Component::parse(input)? else {
        return None;
    };
    expression.packed(Context {
        unit_kind: UnitKind::Custom(&resolve_unit),
        ..Context::new(LengthContext::for_scale(1.))
    })
}

/// Reads one component in a surrounding value grammar, such as a grid track list.
pub(crate) fn resolve_component<'i>(
    parser: &mut Parser<'i, '_>,
    units: LengthContext,
) -> Result<[f64; Record::STRIDE], ParseError<'i, ()>> {
    let percent = parser.try_parse(|p| match p.next() {
        Ok(Token::Percentage { unit_value, .. }) => Ok(f64::from(*unit_value)),
        _ => Err(()),
    });
    if let Ok(value) = percent {
        return value
            .is_finite()
            .then_some([2., value])
            .ok_or_else(|| parser.new_custom_error(()));
    }
    parse_component(parser)?
        .resolve(units)
        .ok_or_else(|| parser.new_custom_error(()))
}

/// Resolves a CSS box length to device points or a percentage fraction.
pub(super) fn resolve_box_length(
    value: &str,
    context: LengthContext,
    clamp: bool,
) -> Option<[f64; 2]> {
    if !clamp && value.eq_ignore_ascii_case("auto") {
        return Some([3., 0.]);
    }
    let mode = if clamp {
        LengthMode::ClampScalar
    } else {
        LengthMode::Normal
    };
    let [kind, amount] = resolve(value, context, mode)?;
    let packed = if kind == 0. {
        [1., amount * f64::from(context.scale)]
    } else {
        [kind, amount]
    };
    (packed[1] as f32).is_finite().then_some(packed)
}

/// Resolves a CSS size to the style buffer's dimension tags.
pub(super) fn resolve_dimension(
    input: &str,
    units: LengthContext,
    intrinsic: bool,
) -> Option<[f64; 2]> {
    let input = input.trim().trim_end_matches(';').trim();
    let mut tokens = ParserInput::new(input);
    let mut parser = Parser::new(&mut tokens);
    match parser.next().ok()?.clone() {
        Token::Ident(name) => {
            if !parser.is_exhausted() {
                return None;
            }
            let kind = match name.to_ascii_lowercase().as_str() {
                "auto" => 0.,
                "min-content" if intrinsic => 3.,
                "max-content" if intrinsic => 4.,
                "fit-content" if intrinsic => 5.,
                "stretch" if intrinsic => 8.,
                "content" if intrinsic => 9.,
                _ => return None,
            };
            Some([kind, 0.])
        }
        Token::Function(name) if intrinsic && name.eq_ignore_ascii_case("fit-content") => {
            if super::background::top_level_parts(input)?.len() != 1 {
                return None;
            }
            let [kind, value] = parser
                .parse_nested_block(|inner| {
                    let start = inner.position();
                    while inner.next().is_ok() {}
                    resolved_dimension_length(inner.slice_from(start), units)
                        .ok_or_else(|| inner.new_custom_error::<_, ()>(()))
                })
                .ok()?;
            (parser.is_exhausted() && value >= 0.)
                .then_some([if kind == 2. { 7. } else { 6. }, value])
        }
        _ => resolved_dimension_length(input, units),
    }
}

fn resolved_dimension_length(input: &str, units: LengthContext) -> Option<[f64; 2]> {
    let [kind, value] = resolve(input, units, LengthMode::Normal)?;
    let value = if kind == 0. {
        value * f64::from(units.scale)
    } else {
        value
    };
    (value as f32)
        .is_finite()
        .then_some([if kind == 2. { 2. } else { 1. }, value])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn context() -> LengthContext {
        LengthContext {
            scale: 2.,
            font_size: 10.,
            root_font_size: 16.,
            viewport_width: 400.,
            viewport_height: 800.,
        }
    }

    #[test]
    fn dimensions_resolve_keywords_and_fit_content_in_buffer_units() {
        for (input, expected) in [
            ("MIN-CONTENT", [3., 0.]),
            ("fit-content", [5., 0.]),
            ("fit-content(calc(1rem + 3px))", [6., 38.]),
            ("fit-content(calc(50% - 10%))", [7., 0.4]),
            ("fit-content(0%)", [7., 0.]),
            ("fit-content(3dppx)", [6., 3.]),
            ("stretch", [8., 0.]),
            ("content", [9., 0.]),
        ] {
            assert_eq!(
                resolve_dimension(input, context(), true),
                Some(expected),
                "{input}"
            );
        }
        assert_eq!(resolve_dimension("AuTo", context(), false), Some([0., 0.]));
        assert_eq!(
            resolve_dimension("calc(2px + 1rem)", context(), false),
            Some([1., 36.])
        );
        for input in [
            "fit-content(-3px)",
            "fit-content(2px",
            "fit-content(2px) 3px",
            "auto 2px",
        ] {
            assert_eq!(resolve_dimension(input, context(), true), None, "{input}");
        }
        assert_eq!(resolve_dimension("min-content", context(), false), None);
    }

    #[test]
    fn resolves_css_units_and_nested_math_in_device_units() {
        for (css, result) in [
            ("calc(0.75rem - 1px)", [1., 22.]),
            ("calc(1rem + (2em * 3))", [1., 152.]),
            ("calc(1px -2px)", [1., -2.]),
            ("calc(1px + 3dppx)", [1., 5.]),
            ("clamp(1rem, 10vw, 2rem)", [1., 64.]),
            ("max(10rem, 50vw, 1px)", [1., 400.]),
            ("calc(50% - 10%)", [2., 0.4]),
            ("min(10%, 20%)", [2., 0.1]),
            ("calc(1.5 * 2)", [0., 3.]),
            ("-2.5e1PX", [1., -50.]),
            ("0%", [2., 0.]),
        ] {
            assert_eq!(
                resolve(css, context(), LengthMode::Normal),
                Some(result),
                "{css}"
            );
        }
        for css in [
            "calc(100% - 1px)",
            "calc(1px",
            "calc(1px * 1px)",
            "calc(1px / 0)",
            "max(1px, 3, 2px)",
            "calc(1ch + 2px)",
            "10px 2px",
        ] {
            assert_eq!(resolve(css, context(), LengthMode::Normal), None, "{css}");
        }
    }

    #[test]
    fn keeps_font_size_parent_relative_and_clamps_only_scalar_lengths() {
        assert_eq!(
            resolve("calc(1.5em)", context(), LengthMode::FontSize),
            Some([2., 1.5])
        );
        assert_eq!(
            resolve(
                "clamp(12px, 0.75em, 0.75em)",
                context(),
                LengthMode::FontSize
            ),
            Some([1., 24.])
        );
        assert_eq!(
            resolve("1e20px", context(), LengthMode::ClampScalar),
            Some([1., 19998.])
        );
        assert_eq!(scalar_fields("+2.5E1PX"), Some(["25".into(), "px".into()]));
        assert_eq!(scalar_fields("4pxx"), None);
    }
}
