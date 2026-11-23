import { rewriteCssMath, type CssMathResult } from './css-math-text';
import { withPortableCss } from './portable-css';

export * from './css-math-text';

/** Resolve a numeric CSS token to CSS pixels or percentage points. */
export type CssUnitResolver = (n: number, unit: string) => number | { percent: number } | undefined;

/** Evaluate a CSS math function with the caller's unit context. */
export function evaluateCssMath(value: string, resolveUnit: CssUnitResolver): CssMathResult | undefined {
  value = value.trim();
  let invalidUnit = false;
  return withPortableCss(value, 1, {
    resolveUnit(n, unit) {
      const result = resolveUnit(n, unit);
      if (result === undefined) return undefined;
      const number = typeof result === 'number';
      const resolved = number ? result : result.percent;
      if (Number.isNaN(resolved)) {
        invalidUnit = true;
        return undefined;
      }
      return [number ? 1 : 2, resolved];
    },
  }, (engine, input, output) => {
    const kind = engine.css_math_evaluate(input, value.length, output);
    if (kind < 0 || invalidUnit) return undefined;
    const resolved = new Float64Array(engine.memory.buffer, output, 1)[0];
    if (kind === 0) return { kind: 'number', value: resolved };
    if (kind === 1) return { kind: 'length', px: resolved };
    return { kind: 'percent', percent: resolved };
  });
}

/** Replace math functions that resolve with their CSS values. */
export function substituteCssMath(value: string, resolveUnit: CssUnitResolver): string {
  return rewriteCssMath(value, (expression) => evaluateCssMath(expression, resolveUnit));
}
