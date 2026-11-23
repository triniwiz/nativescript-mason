import { withPortableCss } from './portable-css';

/** A stop with two positions (`red 10% 30%`) is two stops of the same colour. */
export function expandColorStops(stops: string[]): string[] {
  return stops.flatMap((stop) => withPortableCss(stop, 3, {}, (engine, input, output) => {
    if (!engine.css_double_stop(input, stop.length, output)) return [stop];
    const [colorStart, colorEnd, firstStart, firstEnd, secondStart, secondEnd] = new Uint32Array(engine.memory.buffer, output, 6);
    const color = stop.slice(colorStart, colorEnd);
    return [`${color} ${stop.slice(firstStart, firstEnd)}`, `${color} ${stop.slice(secondStart, secondEnd)}`];
  }));
}

/**
 * Fills in the positions a gradient leaves out, per CSS Images: the first and
 * last stops default to 0 and 1, a position before an earlier one moves up to
 * it, and a run of stops without positions spreads evenly between its neighbours.
 */
export function resolveStopPositions(positions: Array<number | null>): number[] {
  return withPortableCss('', positions.length * 2, {}, (engine, _input, output) => {
    const input = new Float64Array(engine.memory.buffer, output, positions.length * 2);
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      input[i * 2] = position == null ? 0 : 1;
      input[i * 2 + 1] = position ?? 0;
    }
    engine.css_resolve_stop_positions(output, positions.length);
    const resolved = new Float64Array(engine.memory.buffer, output, positions.length * 2);
    return Array.from({ length: positions.length }, (_, i) => resolved[i * 2 + 1]);
  });
}

const MAX_REPEATED_STOPS = 2048;

function mixArgb(a: number, b: number, f: number): number {
  let out = 0;
  for (const shift of [24, 16, 8, 0]) {
    const ca = (a >>> shift) & 0xff;
    const cb = (b >>> shift) & 0xff;
    out |= Math.round(ca + (cb - ca) * f) << shift;
  }
  return out >>> 0;
}

function colorAt(offsets: number[], colors: number[], t: number, fromRight: boolean): number {
  const n = offsets.length;
  if (t < offsets[0] || (!fromRight && t === offsets[0])) return colors[0] >>> 0;
  for (let i = 1; i < n; i++) {
    if (t < offsets[i] || (!fromRight && t === offsets[i])) {
      const span = offsets[i] - offsets[i - 1];
      return mixArgb(colors[i - 1], colors[i], span > 0 ? (t - offsets[i - 1]) / span : 1);
    }
  }
  return colors[n - 1] >>> 0;
}

/** A repeating gradient's stops tiled across [0, end], so a plain gradient draws it. */
export function repeatStops(offsets: number[], colors: number[], end = 1): { offsets: number[]; colors: number[] } {
  const n = offsets.length;
  if (n < 2 || colors.length !== n) return { offsets, colors };
  const first = offsets[0];
  const period = offsets[n - 1] - first;
  if (!(period > 1e-4)) return { offsets, colors };
  const tiledOffsets: number[] = [];
  const tiledColors: number[] = [];
  for (let k = Math.floor(-first / period); first + k * period <= end && tiledOffsets.length < MAX_REPEATED_STOPS; k++) {
    for (let i = 0; i < n; i++) {
      tiledOffsets.push(offsets[i] + k * period);
      tiledColors.push(colors[i] >>> 0);
    }
  }
  const outOffsets = [0];
  const outColors = [colorAt(tiledOffsets, tiledColors, 0, true)];
  for (let i = 0; i < tiledOffsets.length; i++) {
    if (tiledOffsets[i] > 0 && tiledOffsets[i] < end) {
      outOffsets.push(tiledOffsets[i]);
      outColors.push(tiledColors[i]);
    }
  }
  outOffsets.push(end);
  outColors.push(colorAt(tiledOffsets, tiledColors, end, false));
  return { offsets: outOffsets, colors: outColors };
}

/** How far past its ending shape a radial gradient reaches in the box, in radii (at least 1). */
export function radialReach(cx: number, cy: number, rx: number, ry: number): number {
  let reach = 1;
  for (const x of [0, 1]) {
    for (const y of [0, 1]) reach = Math.max(reach, Math.hypot((x - cx) / rx, (y - cy) / ry));
  }
  return reach;
}

/** A repeating radial gradient as a plain one: stops tiled to the farthest corner, radii grown to match. */
export function repeatRadial<T extends { rx: number; ry: number; offsets: number[]; colors: number[] }>(g: T & { cx: number; cy: number }): T {
  const reach = radialReach(g.cx, g.cy, g.rx, g.ry);
  const tiled = repeatStops(g.offsets, g.colors, reach);
  return { ...g, rx: g.rx * reach, ry: g.ry * reach, offsets: tiled.offsets.map((o) => o / reach), colors: tiled.colors };
}
