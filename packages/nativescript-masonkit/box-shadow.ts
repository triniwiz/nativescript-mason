import { withPortableCss } from './portable-css';

export interface BoxShadow {
  inset: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string | null;
}

export function parseBoxShadows(value: string, toDip: (token: string) => number | undefined): BoxShadow[] {
  const source = (value ?? '').trim();
  if (!source) return [];
  const shadows: BoxShadow[] = [];
  withPortableCss(source, 0, {
    resolveLength: toDip,
    shadow(offsetX, offsetY, blur, spread, inset, color) {
      shadows.push({ inset, offsetX, offsetY, blur, spread, color });
    },
  }, (engine, input) => engine.css_visit_shadows(input, source.length));
  return shadows;
}

export function encodeBoxShadows(shadows: BoxShadow[], argbOf: (color: string | null) => number): string {
  return shadows.map((s) => [s.inset ? 1 : 0, s.offsetX, s.offsetY, s.blur, s.spread, argbOf(s.color) >>> 0].join(',')).join(';');
}
