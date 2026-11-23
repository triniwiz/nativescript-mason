// The Windows compositor takes a row-major color matrix. Consecutive color
// operations compose into a single matrix until a spatial operation intervenes.
use mason_core::style::css::{Filter, FilterKind};

type Matrix = [f64; 20];

const IDENTITY: Matrix = [
    1., 0., 0., 0., 0., 0., 1., 0., 0., 0., 0., 0., 1., 0., 0., 0., 0., 0., 1., 0.,
];

fn rgb(rows: [[f64; 3]; 3]) -> Matrix {
    let mut matrix = IDENTITY;
    for (row, values) in rows.iter().enumerate() {
        matrix[row * 5..row * 5 + 3].copy_from_slice(values);
    }
    matrix
}

fn linear(slope: f64, intercept: f64) -> Matrix {
    let mut matrix = IDENTITY;
    for row in 0..3 {
        matrix[row * 5 + row] = slope;
        matrix[row * 5 + 4] = intercept;
    }
    matrix
}

fn lerp_color(amount: f64, full: [[f64; 3]; 3]) -> Matrix {
    let mut matrix = rgb(full);
    let amount = amount.clamp(0., 1.);
    for (value, identity) in matrix.iter_mut().zip(IDENTITY) {
        *value = identity + (*value - identity) * amount;
    }
    matrix
}

fn matrix_of(kind: FilterKind, a: f64) -> Option<Matrix> {
    use FilterKind::*;
    Some(match kind {
        Brightness => linear(a.max(0.), 0.),
        Contrast => {
            let a = a.max(0.);
            linear(a, (1. - a) * 0.5)
        }
        Invert => {
            let a = a.clamp(0., 1.);
            linear(1. - 2. * a, a)
        }
        Opacity => {
            let mut matrix = IDENTITY;
            matrix[18] = a.clamp(0., 1.);
            matrix
        }
        Grayscale => lerp_color(a, [[0.2126, 0.7152, 0.0722]; 3]),
        Sepia => lerp_color(
            a,
            [
                [0.393, 0.769, 0.189],
                [0.349, 0.686, 0.168],
                [0.272, 0.534, 0.131],
            ],
        ),
        Saturate => {
            let a = a.max(0.);
            let c = 1. - a;
            rgb([
                [0.213 * c + a, 0.715 * c, 0.072 * c],
                [0.213 * c, 0.715 * c + a, 0.072 * c],
                [0.213 * c, 0.715 * c, 0.072 * c + a],
            ])
        }
        HueRotate => {
            let (s, c) = a.to_radians().sin_cos();
            rgb([
                [
                    0.213 + c * 0.787 - s * 0.213,
                    0.715 - c * 0.715 - s * 0.715,
                    0.072 - c * 0.072 + s * 0.928,
                ],
                [
                    0.213 - c * 0.213 + s * 0.143,
                    0.715 + c * 0.285 + s * 0.140,
                    0.072 - c * 0.072 - s * 0.283,
                ],
                [
                    0.213 - c * 0.213 - s * 0.787,
                    0.715 - c * 0.715 + s * 0.715,
                    0.072 + c * 0.928 + s * 0.072,
                ],
            ])
        }
        Blur | DropShadow => return None,
    })
}

fn compose(first: Matrix, second: Matrix) -> Matrix {
    std::array::from_fn(|index| {
        let (row, col) = (index / 5, index % 5);
        let offset = if col == 4 { second[row * 5 + 4] } else { 0. };
        offset
            + (0..4)
                .map(|k| second[row * 5 + k] * first[k * 5 + col])
                .sum::<f64>()
    })
}

pub(crate) fn windows_filter_spec(filters: impl IntoIterator<Item = Filter>) -> String {
    use std::fmt::Write;

    let mut spec = String::new();
    let mut matrix = IDENTITY;
    let flush_matrix = |spec: &mut String, matrix: Matrix| {
        if matrix
            .iter()
            .zip(IDENTITY)
            .any(|(v, identity)| (v - identity).abs() > 1e-6)
        {
            spec.push('m');
            for value in matrix {
                let _ = write!(spec, ",{value:.6}");
            }
            spec.push(';');
        }
    };

    for Filter {
        kind,
        args: [x, y, blur, argb],
    } in filters
    {
        if let Some(next) = matrix_of(kind, x) {
            matrix = compose(matrix, next);
            continue;
        }
        if matches!(kind, FilterKind::Blur) && x == 0. {
            continue;
        }
        flush_matrix(&mut spec, matrix);
        matrix = IDENTITY;
        match kind {
            FilterKind::Blur => {
                let _ = write!(spec, "b,{x:.6};");
            }
            FilterKind::DropShadow => {
                let sigma = blur / 2.;
                let argb = argb as u32;
                let _ = write!(spec, "d,{x:.6},{y:.6},{sigma:.6},{argb};");
            }
            _ => unreachable!(),
        }
    }
    flush_matrix(&mut spec, matrix);
    spec.pop();
    spec
}
