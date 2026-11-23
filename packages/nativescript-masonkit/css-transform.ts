import { withPortableCss } from './portable-css';

export type Matrix2D = [number, number, number, number, number, number];

export function parseAngle(token: string): number {
  return withPortableCss(token, 0, {}, (engine, input) => engine.css_angle(input, token.length));
}

export function parseCssTransform(value: string, toDip: (token: string) => number | undefined, size: { width: number; height: number }): Matrix2D | null {
  const source = (value ?? '').trim();
  if (!source) return null;
  return withPortableCss(source, 6, { resolveLength: toDip }, (engine, input, output) => {
    if (!engine.css_evaluate_affine(input, source.length, size.width, size.height, output)) return null;
    const matrix = new Float64Array(engine.memory.buffer, output, 6);
    const [a, b, c, d, x, y] = matrix;
    return [a, b, c, d, x, y];
  });
}
