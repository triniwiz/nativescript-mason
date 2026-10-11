/**
 * Resolves CSS colour functions the native parsers don't read.
 *
 * String-valued properties (`box-shadow`, `background`, `border`, `filter`,
 * `text-shadow`, ...) reach Android, iOS and Windows as the CSS text, and
 * their parsers know hex, `rgb()`/`hsl()` and named colours only, so
 * `0 2px 4px color-mix(in oklch, #000 4%, transparent)` would draw opaque
 * black. Each colour function is replaced by its `rgba()` value first.
 *
 * Values that still hold a `var()` are left alone: there's nothing to resolve
 * against yet.
 */

const COLOR_FUNCTION = /(?<![\w-])(color-mix|oklch|oklab|lab|lch|hwb|color|rgba?|hsla?)\(/gi;
// `rgb()`/`hsl()` only need resolving in their space-separated form.
const LEGACY_FUNCTION = /^(rgba?|hsla?)$/i;
const VAR = /var\(/i;

/**
 * @param toRgba resolves one colour (`oklch(60% 0.2 240)`) to `rgba(...)`, or
 * returns null when it can't.
 */
export function resolveCssColors(value: string, toRgba: (color: string) => string | null): string {
  if (!value || !value.includes('(')) {
    return value;
  }
  let out = '';
  let last = 0;
  COLOR_FUNCTION.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = COLOR_FUNCTION.exec(value))) {
    const open = match.index + match[0].length - 1;
    const close = closingParen(value, open);
    if (close === -1) {
      break;
    }
    const call = value.slice(match.index, close + 1);
    const skip = (LEGACY_FUNCTION.test(match[1]) && call.includes(',')) || VAR.test(call);
    out += value.slice(last, match.index) + ((skip ? null : toRgba(call)) ?? call);
    last = close + 1;
    COLOR_FUNCTION.lastIndex = last;
  }
  return last === 0 ? value : out + value.slice(last);
}

function closingParen(value: string, open: number): number {
  let depth = 0;
  for (let i = open; i < value.length; i++) {
    if (value[i] === '(') {
      depth++;
    } else if (value[i] === ')' && --depth === 0) {
      return i;
    }
  }
  return -1;
}
