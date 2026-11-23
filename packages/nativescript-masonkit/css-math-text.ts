export type CssMathResult = { kind: 'length'; px: number } | { kind: 'percent'; percent: number } | { kind: 'number'; value: number };

const MATH_FUNCTION = /^(calc|min|max|clamp)\(/i;
const MATH_FUNCTION_ANYWHERE = /(?<![\w-])(calc|min|max|clamp)\(/i;
const URL = /(?<![\w-])url\(/i;

/** Whether `value` is a single math function, e.g. `calc(1rem + 2px)`. */
export function isCssMathFunction(value: string): boolean {
  return MATH_FUNCTION.test(value.trim());
}

/** Whether `value` holds a math function anywhere. */
export function hasCssMathFunction(value: string): boolean {
  return MATH_FUNCTION_ANYWHERE.test(value);
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** A result as CSS text: `12px`, `50%` or `1.5`. */
export function cssMathText(result: CssMathResult): string {
  switch (result.kind) {
    case 'length':
      return `${round(result.px)}px`;
    case 'percent':
      return `${round(result.percent)}%`;
    case 'number':
      return `${round(result.value)}`;
  }
}

export function rewriteCssMath(value: string, evaluate: (expression: string) => CssMathResult | undefined): string {
  if (!hasCssMathFunction(value)) {
    return value;
  }
  const pattern = new RegExp(`${URL.source}|${MATH_FUNCTION_ANYWHERE.source}`, 'gi');
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    const open = match.index + match[0].length - 1;
    const close = closingParen(value, open);
    if (close === -1) {
      break;
    }
    pattern.lastIndex = close + 1;
    // A url() is opaque: a data: URL may contain anything.
    if (/^url\(/i.test(match[0])) {
      continue;
    }
    const result = evaluate(value.slice(match.index, close + 1));
    if (result) {
      out += value.slice(last, match.index) + cssMathText(result);
      last = close + 1;
    }
  }
  return out + value.slice(last);
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
