use super::{
    angle_factor,
    svg_path::Scanner,
    transform::{multiply_affine, rotate_affine, Affine, AFFINE_IDENTITY},
    LengthContext, SvgAffineRecord as AffineRecord, SvgAspectRatioRecord as Aspect,
    SvgLengthComponentsRecord as Length,
};

pub(super) fn number_list(input: &str) -> Vec<f64> {
    scan_numbers(input.as_bytes()).collect()
}

pub(super) fn dash_array(input: &str) -> Vec<f64> {
    let mut dashes = number_list(input);
    if dashes.iter().any(|&value| value < 0.) || dashes.iter().all(|&value| value == 0.) {
        return Vec::new();
    }
    if dashes.len() % 2 != 0 {
        dashes.extend_from_within(..);
    }
    dashes
}

fn scan_numbers(input: &[u8]) -> impl Iterator<Item = f64> + '_ {
    let mut scanner = Scanner(input);
    scanner.whitespace();
    std::iter::from_fn(move || {
        let value = scanner.number()?;
        scanner.separator();
        Some(value)
    })
}

fn translation(x: f64, y: f64) -> Affine {
    [1., 0., 0., 1., x, y]
}

pub(super) fn transform(input: &str) -> Option<[f64; AffineRecord::STRIDE]> {
    let mut remaining = input.as_bytes();
    let mut result = AFFINE_IDENTITY;
    loop {
        remaining = remaining.trim_ascii_start();
        if let Some(rest) = remaining.strip_prefix(b",") {
            remaining = rest;
            continue;
        }
        if remaining.is_empty() {
            break;
        }
        let name_len = remaining
            .iter()
            .take_while(|byte| byte.is_ascii_alphabetic())
            .count();
        let name = &remaining[..name_len];
        let arguments = remaining[name_len..]
            .trim_ascii_start()
            .strip_prefix(b"(")?;
        let close = arguments.iter().position(|&byte| byte == b')')?;
        let mut args = [0.; 6];
        let mut count = 0;
        for number in scan_numbers(&arguments[..close]) {
            *args.get_mut(count)? = number;
            count += 1;
        }
        let op = match (name, &args[..count]) {
            (b"matrix", [a, b, c, d, x, y]) => [*a, *b, *c, *d, *x, *y],
            (b"translate", [x]) => translation(*x, 0.),
            (b"translate", [x, y]) => translation(*x, *y),
            (b"scale", [x]) => [*x, 0., 0., *x, 0., 0.],
            (b"scale", [x, y]) => [*x, 0., 0., *y, 0., 0.],
            (b"rotate", [angle]) => rotate_affine(angle.to_radians()),
            (b"rotate", [angle, x, y]) => multiply_affine(
                multiply_affine(translation(*x, *y), rotate_affine(angle.to_radians())),
                translation(-x, -y),
            ),
            (b"skewX", [angle]) => [1., 0., angle.to_radians().tan(), 1., 0., 0.],
            (b"skewY", [angle]) => [1., angle.to_radians().tan(), 0., 1., 0., 0.],
            _ => return None,
        };
        result = multiply_affine(result, op);
        remaining = &arguments[close + 1..];
    }
    let mut record = [0.; AffineRecord::STRIDE];
    [
        record[AffineRecord::A],
        record[AffineRecord::B],
        record[AffineRecord::C],
        record[AffineRecord::D],
        record[AffineRecord::X],
        record[AffineRecord::Y],
    ] = result;
    Some(record)
}

fn amount_and_unit(input: &str) -> Option<(f64, String)> {
    let mut scanner = Scanner(input.trim().as_bytes());
    let number = scanner.number()?;
    let unit = std::str::from_utf8(scanner.0)
        .ok()?
        .trim()
        .to_ascii_lowercase();
    Some((number, unit))
}

pub(super) fn number(input: &str) -> Option<f64> {
    let (value, unit) = amount_and_unit(input)?;
    unit.is_empty().then_some(value)
}

pub(super) fn length(input: &str) -> Option<[f64; Length::STRIDE]> {
    let (number, unit) = amount_and_unit(input)?;
    let mut record = [0.; Length::STRIDE];
    match unit.as_str() {
        "%" => record[Length::PERCENT] = number,
        "ex" => record[Length::LENGTH] = number * 8.,
        "" | "px" | "pt" | "pc" | "in" | "cm" | "mm" | "em" => {
            record[Length::LENGTH] = number * LengthContext::for_scale(1.).resolve_factor(&unit);
        }
        _ => return None,
    }
    record
        .iter()
        .all(|value| value.is_finite())
        .then_some(record)
}

pub(super) fn length_list(input: &str) -> Vec<f64> {
    input
        .split(|c: char| c == ',' || c.is_whitespace())
        .filter(|token| !token.is_empty())
        .map_while(length)
        .flatten()
        .collect()
}

pub(super) fn opacity(input: &str) -> Option<f64> {
    let (number, unit) = amount_and_unit(input)?;
    let opacity = match unit.as_str() {
        "" => number,
        "%" => number / 100.,
        _ => return None,
    };
    Some(opacity.clamp(0., 1.))
}

pub(super) fn angle(input: &str) -> Option<f64> {
    let (number, unit) = amount_and_unit(input)?;
    let degrees = if unit.is_empty() {
        number
    } else {
        number * angle_factor(&unit)?
    };
    degrees.is_finite().then_some(degrees)
}

pub(super) fn aspect_ratio(input: &str) -> [f64; Aspect::STRIDE] {
    fn align(value: &str) -> f64 {
        match value {
            "Min" => -1.,
            "Max" => 1.,
            _ => 0.,
        }
    }

    let mut parts = input.split_whitespace();
    let mode = parts.next().unwrap_or_default();
    let mut record = [0.; Aspect::STRIDE];
    record[Aspect::UNIFORM] = f64::from(u8::from(mode != "none"));
    record[Aspect::SLICE] = f64::from(u8::from(parts.next() == Some("slice")));
    if let Some((x, y)) = mode.strip_prefix('x').and_then(|mode| mode.split_once('Y')) {
        record[Aspect::ALIGN_X] = align(x);
        record[Aspect::ALIGN_Y] = align(y);
    }
    record
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn svg_numeric_values_keep_compact_numbers_and_units() {
        assert_eq!(number_list("1-2 .5.25 3E-2,"), [1., -2., 0.5, 0.25, 0.03]);
        assert_eq!(length("0.5 ex"), Some([4., 0.]));
        assert_eq!(length("12.5%"), Some([0., 12.5]));
        assert_eq!(length("2foo"), None);
        assert_eq!(
            length_list("1px, 2%, .5em, 3foo, 10"),
            [1., 0., 0., 2., 8., 0.]
        );
        assert_eq!(opacity("125 %"), Some(1.));
        assert_eq!(opacity("-25%"), Some(0.));
        assert_eq!(dash_array("1,2+3"), [1., 2., 3., 1., 2., 3.]);
        assert!(dash_array("none").is_empty());
        assert!(dash_array("1,-2").is_empty());
        assert_eq!(angle("0.25turn"), Some(90.));
        assert_eq!(aspect_ratio("xMinYMax slice"), [-1., 1., 1., 1.]);
        assert_eq!(aspect_ratio("none"), [0., 0., 0., 0.]);
    }

    #[test]
    fn svg_transforms_preserve_pivot_order_and_number_syntax() {
        assert_eq!(
            transform(" translate (2-3), scale(4 .5) "),
            Some([4., 0., 0., 0.5, 2., -3.])
        );
        let pivot = transform("rotate(90, 10, 20)").unwrap();
        for (actual, expected) in pivot.into_iter().zip([0., 1., -1., 0., 30., 10.]) {
            assert!((actual - expected).abs() < 1e-12);
        }
        assert_eq!(transform("scale(3) skewX("), None);
        assert_eq!(transform(""), Some(AFFINE_IDENTITY));
    }
}
