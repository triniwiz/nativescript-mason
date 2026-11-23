//! SVG path data as flat, absolute drawing commands shared by CSS and SVG renderers.
use super::SvgPathRecord as Record;
use std::f64::consts::{FRAC_PI_2, TAU};

type Point = [f64; 2];
const ORIGIN: Point = [0.; 2];
const MOVE: f64 = 0.;
const LINE: f64 = 1.;
const CUBIC: f64 = 2.;
const QUAD: f64 = 3.;
const CLOSE: f64 = 4.;

pub(super) struct Scanner<'a>(pub(super) &'a [u8]);

impl Scanner<'_> {
    pub(super) fn whitespace(&mut self) {
        self.0 = self.0.trim_ascii_start();
    }

    pub(super) fn separator(&mut self) {
        self.whitespace();
        if let Some(rest) = self.0.strip_prefix(b",") {
            self.0 = rest;
            self.whitespace();
        }
    }

    pub(super) fn number(&mut self) -> Option<f64> {
        let source = self.0;
        let digits_end = |i: usize| {
            i + source[i..]
                .iter()
                .take_while(|byte| byte.is_ascii_digit())
                .count()
        };
        let start = usize::from(matches!(source.first(), Some(b'-' | b'+')));
        let mut end = digits_end(start);
        if source.get(end) == Some(&b'.') {
            end = digits_end(end + 1);
            if end == start + 1 {
                return None;
            }
        } else if end == start {
            return None;
        }
        if matches!(source.get(end), Some(b'e' | b'E')) {
            let mut exponent = end + 1;
            if matches!(source.get(exponent), Some(b'-' | b'+')) {
                exponent += 1;
            }
            let finish = digits_end(exponent);
            if finish > exponent {
                end = finish;
            }
        }
        let value: f64 = std::str::from_utf8(&source[..end]).ok()?.parse().ok()?;
        self.0 = &source[end..];
        value.is_finite().then_some(value)
    }

    fn next_number(&mut self) -> Option<f64> {
        self.separator();
        self.number()
    }

    fn point(&mut self, offset: Point) -> Option<Point> {
        let point = [self.number()? + offset[0], self.next_number()? + offset[1]];
        point.iter().all(|v| v.is_finite()).then_some(point)
    }

    fn next_point(&mut self, offset: Point) -> Option<Point> {
        self.separator();
        self.point(offset)
    }

    fn next_flag(&mut self) -> Option<bool> {
        self.separator();
        match self.0.split_first()? {
            (flag @ (b'0' | b'1'), tail) => {
                self.0 = tail;
                Some(*flag == b'1')
            }
            _ => None,
        }
    }
}

#[derive(Default)]
struct Path {
    records: Vec<f64>,
    current: Point,
    start: Point,
    // The second control point of C/S, or the control point of Q/T.
    control: Option<(f64, Point)>,
    closed: bool,
}

impl Path {
    fn emit(&mut self, kind: f64, first: Point, second: Point, end: Point, vertex: bool) {
        let mut record = [0.; Record::STRIDE];
        record[Record::KIND] = kind;
        record[Record::VERTEX_END] = f64::from(u8::from(vertex));
        [record[Record::X1], record[Record::Y1]] = first;
        [record[Record::X2], record[Record::Y2]] = second;
        [record[Record::X], record[Record::Y]] = end;
        self.records.extend(record);
    }

    fn resume_subpath(&mut self) {
        if self.closed {
            self.emit(MOVE, ORIGIN, ORIGIN, self.current, true);
            self.closed = false;
        }
    }

    fn draw(&mut self, kind: f64, first: Point, second: Point, end: Point) {
        self.resume_subpath();
        self.emit(kind, first, second, end, true);
        self.current = end;
        self.control = match kind {
            CUBIC => Some((kind, second)),
            QUAD => Some((kind, first)),
            _ => None,
        };
    }

    fn reflected(&self, kind: f64) -> Point {
        self.control
            .filter(|(previous, _)| *previous == kind)
            .map_or(self.current, |(_, point)| {
                let reflected = std::array::from_fn(|axis| {
                    self.current[axis] + (self.current[axis] - point[axis])
                });
                if reflected.iter().all(|value| value.is_finite()) {
                    reflected
                } else {
                    self.current
                }
            })
    }

    fn segment(&mut self, command: u8, scanner: &mut Scanner<'_>) -> Option<()> {
        let offset = if command.is_ascii_lowercase() {
            self.current
        } else {
            ORIGIN
        };
        match command.to_ascii_uppercase() {
            b'M' => {
                let p = scanner.point(offset)?;
                self.emit(MOVE, ORIGIN, ORIGIN, p, true);
                self.current = p;
                self.start = p;
                self.control = None;
                self.closed = false;
            }
            b'L' => self.draw(LINE, ORIGIN, ORIGIN, scanner.point(offset)?),
            b'H' | b'V' => {
                let axis = usize::from(command.eq_ignore_ascii_case(&b'V'));
                let mut point = self.current;
                point[axis] = offset[axis] + scanner.number()?;
                if !point[axis].is_finite() {
                    return None;
                }
                self.draw(LINE, ORIGIN, ORIGIN, point);
            }
            b'C' => self.draw(
                CUBIC,
                scanner.point(offset)?,
                scanner.next_point(offset)?,
                scanner.next_point(offset)?,
            ),
            b'S' => self.draw(
                CUBIC,
                self.reflected(CUBIC),
                scanner.point(offset)?,
                scanner.next_point(offset)?,
            ),
            b'Q' => self.draw(
                QUAD,
                scanner.point(offset)?,
                ORIGIN,
                scanner.next_point(offset)?,
            ),
            b'T' => self.draw(QUAD, self.reflected(QUAD), ORIGIN, scanner.point(offset)?),
            b'A' => {
                let radii = scanner.point(ORIGIN)?;
                let rotation = scanner.next_number()?;
                let large = scanner.next_flag()?;
                let sweep = scanner.next_flag()?;
                let end = scanner.next_point(offset)?;
                self.arc(end, radii, rotation, large, sweep);
                self.current = end;
                self.control = None;
            }
            b'Z' => {
                self.emit(CLOSE, ORIGIN, ORIGIN, ORIGIN, true);
                self.current = self.start;
                self.control = None;
                self.closed = true;
            }
            _ => return None,
        }
        Some(())
    }

    fn arc(&mut self, end: Point, radii: Point, rotation: f64, large: bool, sweep: bool) {
        let start = self.current;
        if start == end {
            self.resume_subpath();
            return;
        }
        let [mut rx, mut ry] = radii.map(f64::abs);
        if rx == 0. || ry == 0. {
            self.draw(LINE, ORIGIN, ORIGIN, end);
            return;
        }

        // SVG endpoint-to-center conversion. Normalize by the radii first to
        // keep large coordinates from overflowing when their products are squared.
        let (sin, cos) = (rotation % 360.).to_radians().sin_cos();
        let [dx, dy] = [start[0] * 0.5 - end[0] * 0.5, start[1] * 0.5 - end[1] * 0.5];
        let x = cos * dx + sin * dy;
        let y = -sin * dx + cos * dy;
        let correction = (x / rx).hypot(y / ry).max(1.);
        rx *= correction;
        ry *= correction;
        let [ux, uy] = [x / rx, y / ry];
        let norm = ux.hypot(uy);
        if !norm.is_finite() || norm == 0. || !rx.is_finite() || !ry.is_finite() {
            self.draw(LINE, ORIGIN, ORIGIN, end);
            return;
        }
        let sign = if large == sweep { -1. } else { 1. };
        let distance = sign * (1. - norm * norm).max(0.).sqrt();
        let [local_x, local_y] = [uy / norm * distance, -ux / norm * distance];
        let cx = cos * rx * local_x - sin * ry * local_y + start[0] * 0.5 + end[0] * 0.5;
        let cy = sin * rx * local_x + cos * ry * local_y + start[1] * 0.5 + end[1] * 0.5;
        let a = (uy - local_y).atan2(ux - local_x);
        let b = (-uy - local_y).atan2(-ux - local_x);
        let angle = if sweep {
            (b - a).rem_euclid(TAU)
        } else {
            -(a - b).rem_euclid(TAU)
        };
        let segments = ((angle.abs() / FRAC_PI_2 - 1e-7).ceil() as usize).clamp(1, 4);
        let step = angle / segments as f64;
        let k = 4. / 3. * (step / 4.).tan();
        let map = |x: f64, y: f64| {
            [
                cx + rx * cos * x - ry * sin * y,
                cy + rx * sin * x + ry * cos * y,
            ]
        };
        let rollback = self.records.len();
        let was_closed = self.closed;
        self.resume_subpath();
        for i in 0..segments {
            let theta = a + i as f64 * step;
            let (s1, c1) = theta.sin_cos();
            let (s2, c2) = (theta + step).sin_cos();
            let first = map(c1 - k * s1, s1 + k * c1);
            let second = map(c2 + k * s2, s2 - k * c2);
            let last = i + 1 == segments;
            let point = if last { end } else { map(c2, s2) };
            if first
                .into_iter()
                .chain(second)
                .chain(point)
                .any(|v| !v.is_finite())
            {
                self.records.truncate(rollback);
                // Restore a synthetic move if the arc began after close.
                self.closed = was_closed;
                self.draw(LINE, ORIGIN, ORIGIN, end);
                return;
            }
            // Only the last cubic ends at an author-defined vertex.
            self.emit(CUBIC, first, second, point, last);
        }
    }
}

/// Keep complete segments up to the first syntax error, as with an SVG d attribute.
pub fn parse_svg_path(input: &str) -> Vec<f64> {
    let mut scanner = Scanner(input.as_bytes());
    let mut path = Path::default();
    let mut command = 0u8;
    scanner.whitespace();
    while let Some(&next) = scanner.0.first() {
        if b"MmLlHhVvCcSsQqTtAaZz".contains(&next) {
            command = next;
            scanner.0 = &scanner.0[1..];
            scanner.whitespace();
        } else if matches!(command, 0 | b'z' | b'Z') {
            break;
        }
        if path.records.is_empty() && !command.eq_ignore_ascii_case(&b'M') {
            break;
        }
        if path.segment(command, &mut scanner).is_none() {
            break;
        }
        if command.eq_ignore_ascii_case(&b'M') {
            command = if command == b'm' { b'l' } else { b'L' };
        }
        scanner.separator();
    }
    path.records
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_compact_coordinates_and_keeps_the_valid_prefix() {
        let records = parse_svg_path("m10 10 5-5 h2 V3 z l.5.25 X");
        let points: Vec<_> = records
            .chunks_exact(Record::STRIDE)
            .map(|r| (r[Record::KIND], [r[Record::X], r[Record::Y]]))
            .collect();
        assert_eq!(
            points,
            [
                (MOVE, [10., 10.]),
                (LINE, [15., 5.]),
                (LINE, [17., 5.]),
                (LINE, [17., 3.]),
                (CLOSE, ORIGIN),
                (MOVE, [10., 10.]),
                (LINE, [10.5, 10.25]),
            ]
        );
        assert!(parse_svg_path("L1 1").is_empty());
        assert_eq!(
            parse_svg_path("M0 0 L1e1,2e-2 L1").len(),
            Record::STRIDE * 2
        );
    }

    #[test]
    fn arcs_keep_only_author_vertices_and_reset_smooth_controls() {
        let records = parse_svg_path("M0 10 A10 10 0 0120 10 S25 15 30 10");
        let commands: Vec<_> = records.chunks_exact(Record::STRIDE).collect();
        assert_eq!(commands.len(), 4);
        assert_eq!(commands[1][Record::KIND], CUBIC);
        assert_eq!(commands[1][Record::VERTEX_END], 0.);
        assert_eq!(commands[2][Record::VERTEX_END], 1.);
        assert_eq!([commands[2][Record::X], commands[2][Record::Y]], [20., 10.]);
        assert_eq!(
            [commands[3][Record::X1], commands[3][Record::Y1]],
            [20., 10.]
        );

        let kinds: Vec<_> = parse_svg_path("M0 0 A5 5 0 1 0 0 0 A0 5 0 0 1 10 0 Z A5 5 0 1 0 0 0")
            .chunks_exact(Record::STRIDE)
            .map(|r| r[Record::KIND])
            .collect();
        assert_eq!(kinds, [MOVE, LINE, CLOSE, MOVE]);
    }
}
