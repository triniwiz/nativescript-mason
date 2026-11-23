import { withPortableCss } from './portable-css';

export type ColorMatrix = number[];

export type FilterStep = { kind: 'matrix'; matrix: ColorMatrix } | { kind: 'blur'; sigma: number } | { kind: 'shadow'; x: number; y: number; sigma: number; color: string | null };

const IDENTITY: ColorMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function rgb(rows: number[][]): ColorMatrix {
  return [...rows[0], 0, 0, ...rows[1], 0, 0, ...rows[2], 0, 0, 0, 0, 0, 1, 0];
}

function grayscale(a: number): ColorMatrix {
  const k = 1 - clamp01(a);
  return rgb([
    [0.2126 + 0.7874 * k, 0.7152 - 0.7152 * k, 0.0722 - 0.0722 * k],
    [0.2126 - 0.2126 * k, 0.7152 + 0.2848 * k, 0.0722 - 0.0722 * k],
    [0.2126 - 0.2126 * k, 0.7152 - 0.7152 * k, 0.0722 + 0.9278 * k],
  ]);
}

function sepia(a: number): ColorMatrix {
  const k = 1 - clamp01(a);
  return rgb([
    [0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k],
    [0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k],
    [0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k],
  ]);
}

function saturate(s: number): ColorMatrix {
  return rgb([
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ]);
}

function hueRotate(radians: number): ColorMatrix {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return rgb([
    [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
    [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283],
    [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072],
  ]);
}

function linear(slope: number, intercept: number): ColorMatrix {
  return [slope, 0, 0, 0, intercept, 0, slope, 0, 0, intercept, 0, 0, slope, 0, intercept, 0, 0, 0, 1, 0];
}

function alpha(a: number): ColorMatrix {
  return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, clamp01(a), 0];
}

export function composeMatrices(first: ColorMatrix, second: ColorMatrix): ColorMatrix {
  const out: number[] = new Array(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let v = col === 4 ? second[row * 5 + 4] : 0;
      for (let k = 0; k < 4; k++) v += second[row * 5 + k] * first[k * 5 + col];
      out[row * 5 + col] = v;
    }
  }
  return out;
}

// <style-keys:filter-operations>
enum FilterKind {
  Blur = 0,
  Brightness = 1,
  Contrast = 2,
  Saturate = 3,
  HueRotate = 4,
  Invert = 5,
  Opacity = 6,
  Sepia = 7,
  Grayscale = 8,
  DropShadow = 9,
}
// </style-keys:filter-operations>

export function parseCssFilter(value: string, toDip: (token: string) => number | undefined): FilterStep[] {
  const source = (value ?? '').trim();
  const steps: FilterStep[] = [];
  if (!source) return steps;

  return projectFilters((add) => {
    withPortableCss(source, 0, {
      resolveLength: toDip,
      filter: add,
    }, (engine, input) => engine.css_visit_filters(input, source.length));
  });
}

type AddFilter = (kind: number, amount: number, y: number, blur: number, color: string | null) => void;

export function projectCssFilters(records: [number, number, number, number, number][]): FilterStep[] {
  return projectFilters((add) => {
    for (const [kind, amount, y, blur, color] of records) add(kind, amount, y, blur, String(color));
  });
}

function projectFilters(visit: (add: AddFilter) => void): FilterStep[] {
  const steps: FilterStep[] = [];
  const push = (matrix: ColorMatrix) => {
    const last = steps[steps.length - 1];
    if (last?.kind === 'matrix') last.matrix = composeMatrices(last.matrix, matrix);
    else steps.push({ kind: 'matrix', matrix });
  };
  visit((kind, value, y, blur, color) => {
  switch (kind) {
    case FilterKind.Blur:
      if (value > 0) steps.push({ kind: 'blur', sigma: value });
      break;
    case FilterKind.Grayscale:
      push(grayscale(value));
      break;
    case FilterKind.Sepia:
      push(sepia(value));
      break;
    case FilterKind.Saturate:
      push(saturate(Math.max(0, value)));
      break;
    case FilterKind.HueRotate:
      push(hueRotate(value * Math.PI / 180));
      break;
    case FilterKind.Invert: {
      const a = clamp01(value);
      push(linear(1 - 2 * a, a));
      break;
    }
    case FilterKind.Opacity:
      push(alpha(value));
      break;
    case FilterKind.Brightness:
      push(linear(Math.max(0, value), 0));
      break;
    case FilterKind.Contrast: {
      const c = Math.max(0, value);
      push(linear(c, 0.5 - 0.5 * c));
      break;
    }
    case FilterKind.DropShadow:
      steps.push({ kind: 'shadow', x: value, y, sigma: blur / 2, color });
      break;
  }
  });
  return steps.filter((s) => s.kind !== 'matrix' || s.matrix.some((n, i) => Math.abs(n - IDENTITY[i]) > 1e-6));
}

export function encodeCssFilter(steps: FilterStep[], argbOf: (color: string | null) => number): string {
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return steps
    .map((s) => {
      if (s.kind === 'matrix') return 'm,' + s.matrix.map(round).join(',');
      if (s.kind === 'blur') return `b,${round(s.sigma)}`;
      return `d,${round(s.x)},${round(s.y)},${round(s.sigma)},${argbOf(s.color) >>> 0}`;
    })
    .join(';');
}
