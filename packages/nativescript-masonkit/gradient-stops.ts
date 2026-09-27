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
