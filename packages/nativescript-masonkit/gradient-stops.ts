import { tokenizeCss } from './css-shorthands';

// Mirrors GradientStops.kt, for platforms that parse gradients in TS (Windows).

/** A stop with two positions (`red 10% 30%`) is two stops of the same colour. */
export function expandColorStops(stops: string[]): string[] {
  return stops.flatMap((stop) => {
    let parts: string[];
    try {
      parts = tokenizeCss(stop);
    } catch {
      return [stop];
    }
    return parts.length === 3 ? [`${parts[0]} ${parts[1]}`, `${parts[0]} ${parts[2]}`] : [stop];
  });
}

/**
 * Fills in the positions a gradient leaves out, per CSS Images: the first and
 * last stops default to 0 and 1, a position before an earlier one moves up to
 * it, and a run of stops without positions spreads evenly between its neighbours.
 */
export function resolveStopPositions(positions: Array<number | null>): number[] {
  const n = positions.length;
  const resolved = new Array<number>(n).fill(0);
  let anchor = -1;
  for (let i = 0; i < n; i++) {
    let given = positions[i];
    if (given == null) {
      if (i === 0) given = 0;
      else if (i === n - 1) given = 1;
      else continue;
    }
    const position = anchor >= 0 ? Math.max(given, resolved[anchor]) : given;
    resolved[i] = position;
    if (anchor >= 0) {
      const start = resolved[anchor];
      for (let k = anchor + 1; k < i; k++) {
        resolved[k] = start + ((position - start) * (k - anchor)) / (i - anchor);
      }
    }
    anchor = i;
  }
  return resolved;
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

/**
 * A `repeating-*-gradient`'s stops tiled across [0, end], cut at both ends with the colour
 * there, so a non-repeating gradient draws it. A zero-length period is returned unchanged.
 */
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

/**
 * How far past its ending shape a radial gradient reaches inside the box, in multiples of the
 * radius: the farthest corner's normalized distance, at least 1.
 */
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
