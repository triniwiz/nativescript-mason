import { parseBoxShadows } from './box-shadow';
import { parseAngle } from './css-transform';

export type ColorMatrix = number[];

export type FilterStep = { kind: 'matrix'; matrix: ColorMatrix } | { kind: 'blur'; sigma: number } | { kind: 'shadow'; x: number; y: number; sigma: number; color: string | null };

const IDENTITY: ColorMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

function amount(arg: string, fallback: number): number {
  const t = arg.trim();
  if (!t) return fallback;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return fallback;
  return t.endsWith('%') ? n / 100 : n;
}

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

const FUNCTION = /([a-z-]+)\s*\(((?:[^()]|\([^()]*\))*)\)/gi;

export function parseCssFilter(value: string, toDip: (token: string) => number | undefined): FilterStep[] {
  const steps: FilterStep[] = [];
  const v = (value ?? '').trim();
  if (!v || v === 'none') return steps;
  const push = (matrix: ColorMatrix) => {
    const last = steps[steps.length - 1];
    if (last && last.kind === 'matrix') last.matrix = composeMatrices(last.matrix, matrix);
    else steps.push({ kind: 'matrix', matrix });
  };
  for (const match of v.matchAll(FUNCTION)) {
    const name = match[1].toLowerCase();
    const arg = match[2];
    switch (name) {
      case 'blur': {
        const t = arg.trim();
        const sigma = t ? (toDip(t) ?? parseFloat(t)) : 0;
        if (Number.isFinite(sigma) && sigma > 0) steps.push({ kind: 'blur', sigma });
        break;
      }
      case 'grayscale':
        push(grayscale(amount(arg, 1)));
        break;
      case 'sepia':
        push(sepia(amount(arg, 1)));
        break;
      case 'saturate':
        push(saturate(Math.max(0, amount(arg, 1))));
        break;
      case 'hue-rotate':
        push(hueRotate(arg.trim() ? parseAngle(arg) : 0));
        break;
      case 'invert': {
        const a = clamp01(amount(arg, 1));
        push(linear(1 - 2 * a, a));
        break;
      }
      case 'opacity':
        push(alpha(amount(arg, 1)));
        break;
      case 'brightness':
        push(linear(Math.max(0, amount(arg, 1)), 0));
        break;
      case 'contrast': {
        const c = Math.max(0, amount(arg, 1));
        push(linear(c, 0.5 - 0.5 * c));
        break;
      }
      case 'drop-shadow': {
        const shadow = parseBoxShadows(arg, toDip)[0];
        if (shadow) steps.push({ kind: 'shadow', x: shadow.offsetX, y: shadow.offsetY, sigma: shadow.blur / 2, color: shadow.color });
        break;
      }
    }
  }
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
