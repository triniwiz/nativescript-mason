import { withPortableCss } from './portable-css';

/**
 * Rewrite CSS color functions with the caller's color resolver, preserving
 * legacy comma syntax and functions that still contain unresolved variables.
 */
export function resolveCssColors(value: string, toRgba: (color: string) => string | null): string {
  if (!value || !value.includes('(')) return value;
  let result = '';
  let last = 0;
  withPortableCss(value, 0, {
    colorRange(start, end) {
      const color = value.slice(start, end);
      result += value.slice(last, start) + (toRgba(color) ?? color);
      last = end;
    },
  }, (engine, input) => engine.css_visit_color_functions(input, value.length));
  return last === 0 ? value : result + value.slice(last);
}
