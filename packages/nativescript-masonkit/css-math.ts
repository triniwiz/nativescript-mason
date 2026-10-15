/**
 * CSS math functions: `calc()`, `min()`, `max()` and `clamp()`.
 *
 * Core only evaluates values containing `calc(`, with `@csstools/css-calc`,
 * which knows neither the root font size nor the viewport: `calc(0.75rem -
 * 1px)` comes back unevaluated, and `clamp(2rem, 1.5rem + 1.875vw, 2.5rem)` is
 * never evaluated at all. MasonKit knows both, so it evaluates them itself.
 *
 * Every length is resolved to CSS px as it is read, through the caller's
 * `resolveUnit`, so the expression only ever adds px to px. A percentage can't
 * be resolved here (its basis is only known at layout), so it is carried
 * along on its own: an expression that ends up purely in `%` is still a
 * percentage, but one that mixes `%` with a length (`calc(100% - 20px)`) is
 * left unresolved.
 */

/**
 * Resolves `n<unit>` to CSS px, or to a percentage where a unit means one in
 * this context (`em` on `font-size`), or undefined for a unit it can't
 * resolve. A `%` it leaves undefined stays a percentage.
 */
export type CssUnitResolver = (n: number, unit: string) => number | { percent: number } | undefined;

export type CssMathResult = { kind: 'length'; px: number } | { kind: 'percent'; percent: number } | { kind: 'number'; value: number };

/** A length (px), a percentage (pct) or both, or a plain number. */
interface Value {
  number: boolean;
  px: number;
  pct: number;
}

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

type Token = { type: 'number'; value: number; unit: string } | { type: 'op'; op: string } | { type: 'open'; fn: string } | { type: 'close' } | { type: 'comma' };

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i;
const UNIT = /^(%|[a-z]+)/i;
const IDENT = /^[a-z-]+/i;

function tokenize(source: string): Token[] | undefined {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const rest = source.slice(i);
    const previous = tokens[tokens.length - 1];
    // A sign belongs to the number unless it follows an operand.
    const signAllowed = !previous || previous.type === 'op' || previous.type === 'open' || previous.type === 'comma';
    const number = (signAllowed || (ch !== '+' && ch !== '-')) && NUMBER.exec(rest);
    if (number) {
      i += number[0].length;
      const unit = UNIT.exec(source.slice(i));
      if (unit) {
        i += unit[0].length;
      }
      tokens.push({ type: 'number', value: parseFloat(number[0]), unit: unit ? unit[0].toLowerCase() : '' });
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', op: ch });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'open', fn: '' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'close' });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }
    const ident = IDENT.exec(rest);
    if (ident && source[i + ident[0].length] === '(') {
      tokens.push({ type: 'open', fn: ident[0].toLowerCase() });
      i += ident[0].length + 1;
      continue;
    }
    return undefined;
  }
  return tokens;
}

class Parser {
  private at = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly resolveUnit: CssUnitResolver,
  ) {}

  done(): boolean {
    return this.at === this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.at];
  }

  private next(): Token | undefined {
    return this.tokens[this.at++];
  }

  sum(): Value | undefined {
    let left = this.product();
    while (left) {
      const token = this.peek();
      if (token?.type !== 'op' || (token.op !== '+' && token.op !== '-')) {
        break;
      }
      this.next();
      const right = this.product();
      if (!right || right.number !== left.number) {
        return undefined;
      }
      const sign = token.op === '+' ? 1 : -1;
      left = { number: left.number, px: left.px + sign * right.px, pct: left.pct + sign * right.pct };
    }
    return left;
  }

  private product(): Value | undefined {
    let left = this.operand();
    while (left) {
      const token = this.peek();
      if (token?.type !== 'op' || (token.op !== '*' && token.op !== '/')) {
        break;
      }
      this.next();
      const right = this.operand();
      if (!right) {
        return undefined;
      }
      if (token.op === '*') {
        // One side has to be a plain number.
        if (left.number) {
          left = { number: right.number, px: right.px * left.px, pct: right.pct * left.px };
        } else if (right.number) {
          left = { number: false, px: left.px * right.px, pct: left.pct * right.px };
        } else {
          return undefined;
        }
      } else {
        // Only by a number; dividing by zero gives an infinity the caller rejects.
        if (!right.number) {
          return undefined;
        }
        left = { number: left.number, px: left.px / right.px, pct: left.pct / right.px };
      }
    }
    return left;
  }

  private operand(): Value | undefined {
    const token = this.next();
    if (!token) {
      return undefined;
    }
    if (token.type === 'number') {
      if (token.unit === '') {
        return { number: true, px: token.value, pct: 0 };
      }
      const resolved = this.resolveUnit(token.value, token.unit);
      if (resolved === undefined) {
        return token.unit === '%' ? { number: false, px: 0, pct: token.value } : undefined;
      }
      return typeof resolved === 'number' ? { number: false, px: resolved, pct: 0 } : { number: false, px: 0, pct: resolved.percent };
    }
    if (token.type === 'open') {
      return this.call(token.fn);
    }
    return undefined;
  }

  private call(fn: string): Value | undefined {
    const args: Value[] = [];
    for (;;) {
      const arg = this.sum();
      if (!arg) {
        return undefined;
      }
      args.push(arg);
      const token = this.next();
      if (token?.type === 'close') {
        break;
      }
      if (token?.type !== 'comma') {
        return undefined;
      }
    }
    switch (fn) {
      case '':
      case 'calc':
        return args.length === 1 ? args[0] : undefined;
      case 'min':
        return compare(args, Math.min);
      case 'max':
        return compare(args, Math.max);
      case 'clamp': {
        if (args.length !== 3) {
          return undefined;
        }
        const [min, preferred, max] = args;
        const upper = compare([preferred, max], Math.min);
        return upper && compare([min, upper], Math.max);
      }
      default:
        return undefined;
    }
  }
}

/**
 * min()/max() over values of one kind. A length and a percentage can't be
 * compared before layout, so mixing them is unresolved.
 */
function compare(args: Value[], pick: (...values: number[]) => number): Value | undefined {
  const [first] = args;
  if (args.some((arg) => arg.number !== first.number)) {
    return undefined;
  }
  if (first.number) {
    return { number: true, px: pick(...args.map((arg) => arg.px)), pct: 0 };
  }
  if (args.every((arg) => arg.pct === 0)) {
    return { number: false, px: pick(...args.map((arg) => arg.px)), pct: 0 };
  }
  if (args.every((arg) => arg.px === 0)) {
    return { number: false, px: 0, pct: pick(...args.map((arg) => arg.pct)) };
  }
  return undefined;
}

/**
 * Evaluate one math function, e.g. `clamp(1rem, 2.5vw, 2rem)`, or undefined
 * when it isn't one, doesn't parse, or mixes `%` with a length.
 */
export function evaluateCssMath(value: string, resolveUnit: CssUnitResolver): CssMathResult | undefined {
  const source = value.trim();
  if (!MATH_FUNCTION.test(source)) {
    return undefined;
  }
  const tokens = tokenize(source);
  if (!tokens) {
    return undefined;
  }
  const parser = new Parser(tokens, resolveUnit);
  const result = parser.sum();
  if (!result || !parser.done()) {
    return undefined;
  }
  if (result.number) {
    return Number.isFinite(result.px) ? { kind: 'number', value: result.px } : undefined;
  }
  if (result.pct !== 0 && result.px !== 0) {
    return undefined;
  }
  if (result.pct !== 0) {
    return Number.isFinite(result.pct) ? { kind: 'percent', percent: result.pct } : undefined;
  }
  return Number.isFinite(result.px) ? { kind: 'length', px: result.px } : undefined;
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

/**
 * Replace every math function in `value` that resolves with its result,
 * leaving the rest of the value (and any function that doesn't resolve) as it
 * was: `0 0 calc(0.5rem + 1px) red` becomes `0 0 9px red`.
 */
export function substituteCssMath(value: string, resolveUnit: CssUnitResolver): string {
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
    const result = evaluateCssMath(value.slice(match.index, close + 1), resolveUnit);
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
