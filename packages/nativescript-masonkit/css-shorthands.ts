import { unsetValue } from '@nativescript/core';

export type LonghandValue = string | typeof unsetValue;

export function tokenizeCss(value: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let depth = 0;
  let quote = '';
  let escaped = false;
  const flush = () => {
    if (current) {
      tokens.push(current);
      current = '';
    }
  };
  for (const ch of value) {
    if (quote) {
      current += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      if (depth === 0) {
        throw new Error(`Unbalanced ")" in "${value}"`);
      }
      depth--;
    } else if (depth === 0 && /\s/.test(ch)) {
      flush();
      continue;
    } else if (depth === 0 && (ch === ',' || ch === '/')) {
      flush();
      tokens.push(ch);
      continue;
    }
    current += ch;
  }
  if (depth !== 0 || quote) {
    throw new Error(`Unterminated "${quote || '('}" in "${value}"`);
  }
  flush();
  return tokens;
}

export interface CssLength {
  value: number;
  unit: 'dip' | 'px' | '%';
  css: string;
}

export function cssLength(css: string, parse: (value: string) => unknown): CssLength {
  let parsed: unknown;
  try {
    parsed = parse(css);
  } catch {
    parsed = undefined;
  }
  if (typeof parsed === 'number') {
    return { value: parsed, unit: 'dip', css };
  }
  if (parsed && typeof parsed === 'object') {
    return { ...(parsed as Omit<CssLength, 'css'>), css };
  }
  return { value: 0, unit: 'dip', css };
}

export function isCssLength(value: unknown): value is CssLength {
  return typeof (value as CssLength | null)?.css === 'string';
}

const KEBAB_SEGMENT = /-([a-z])/g;

/** "background-color" -> "backgroundColor". */
export function toCamelCase(prop: string): string {
  return prop.replace(KEBAB_SEGMENT, (_, c: string) => c.toUpperCase());
}

const LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?([a-z]+|%)?$/i;
const FUNCTION = /^[a-z-]+\(.*\)$/is;

function isLength(token: string): boolean {
  return LENGTH.test(token) || FUNCTION.test(token);
}

/**
 * The space-separated values of a 1–4 value shorthand. Core's own splitter
 * also accepts commas between them, so they are skipped rather than rejected.
 */
function values(value: string, accepts: (token: string) => boolean): string[] {
  const tokens = tokenizeCss(value).filter((token) => token !== ',');
  for (const token of tokens) {
    if (!accepts(token)) {
      throw new Error(`Unexpected "${token}" in "${value}"`);
    }
  }
  return tokens;
}

function expandSides<T>(parts: T[], value: string): [T, T, T, T] {
  switch (parts.length) {
    case 1:
      return [parts[0], parts[0], parts[0], parts[0]];
    case 2:
      return [parts[0], parts[1], parts[0], parts[1]];
    case 3:
      return [parts[0], parts[1], parts[2], parts[1]];
    case 4:
      return [parts[0], parts[1], parts[2], parts[3]];
    default:
      throw new Error(`Expected 1 to 4 values in "${value}"`);
  }
}

function sides(accepts: (token: string) => boolean) {
  return (value: string): string[] => expandSides(values(value, accepts), value);
}

export const splitMargin = sides((token) => token === 'auto' || isLength(token));
export const splitPadding = sides(isLength);

export const BORDER_WIDTH_KEYWORDS: ReadonlyMap<string, string> = new Map([
  ['thin', '1'],
  ['medium', '3'],
  ['thick', '5'],
]);
export const splitBorderWidth = sides((token) => BORDER_WIDTH_KEYWORDS.has(token) || isLength(token));

export const splitBorderColor = sides((token) => token !== '/');

export function splitBorderRadius(value: string): string[] {
  const tokens = values(value, (token) => token === '/' || isLength(token));
  const slash = tokens.indexOf('/');
  const horizontal = slash === -1 ? tokens : tokens.slice(0, slash);
  const vertical = slash === -1 ? undefined : tokens.slice(slash + 1);
  if (vertical && (vertical.length === 0 || vertical.includes('/'))) {
    throw new Error(`Expected one "/" between radii in "${value}"`);
  }
  const h = expandSides(horizontal, value);
  const v = vertical ? expandSides(vertical, value) : undefined;
  return h.map((radius, i) => (v ? `${radius} ${v[i]}` : radius));
}

export type CornerRadius = [horizontal: string, vertical: string];

export type CornerIndex = 0 | 1 | 2 | 3;

export function parseCornerRadius(value: string): CornerRadius {
  const [h = '0', v = h] = tokenizeCss(value);
  return [h, v];
}

export function borderRadiusCorners(value: string): CornerRadius[] {
  return splitBorderRadius(value).map(parseCornerRadius);
}

export function composeBorderRadius(corners: CornerRadius[]): string {
  const horizontal = corners.map(([h]) => h).join(' ');
  if (corners.every(([h, v]) => h === v)) {
    return horizontal;
  }
  return `${horizontal} / ${corners.map(([, v]) => v).join(' ')}`;
}

const IMAGE_FUNCTION = /^(url|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(/i;
const REPEAT_SINGLE = new Set(['repeat-x', 'repeat-y']);
const REPEAT = new Set(['repeat', 'space', 'round', 'no-repeat']);
const ATTACHMENT = new Set(['scroll', 'fixed', 'local']);
const BOX = new Set(['border-box', 'padding-box', 'content-box']);
const POSITION_KEYWORD = new Set(['left', 'right', 'top', 'bottom', 'center']);
const SIZE_KEYWORD = new Set(['auto', 'cover', 'contain']);

function isColorCandidate(token: string): boolean {
  return token !== '/' && token !== 'none' && !IMAGE_FUNCTION.test(token) && !LENGTH.test(token) && ![REPEAT_SINGLE, REPEAT, ATTACHMENT, BOX, POSITION_KEYWORD, SIZE_KEYWORD].some((keywords) => keywords.has(token));
}

interface BackgroundLayer {
  color?: string;
  image?: string;
  repeat?: string;
  position?: string;
  size?: string;
  origin?: string;
  clip?: string;
  attachment?: string;
}

const LAYER_INITIAL = { image: 'none', repeat: 'repeat', position: '0% 0%', size: 'auto', clip: 'border-box', origin: 'padding-box', attachment: 'scroll' };

function parseBackgroundLayer(tokens: string[], value: string, isFinal: boolean): BackgroundLayer {
  const layer: BackgroundLayer = {};
  let boxes = 0;
  const invalid = () => new Error(`Unexpected "${tokens.join(' ')}" in background "${value}"`);
  let i = 0;
  const run = (accepts: (token: string) => boolean, max: number) => {
    const start = i;
    while (i < tokens.length && i - start < max && accepts(tokens[i])) {
      i++;
    }
    return tokens.slice(start, i).join(' ');
  };
  while (i < tokens.length) {
    const token = tokens[i];
    if (layer.image === undefined && (token === 'none' || IMAGE_FUNCTION.test(token))) {
      layer.image = token;
      i++;
    } else if (layer.repeat === undefined && REPEAT_SINGLE.has(token)) {
      layer.repeat = token;
      i++;
    } else if (layer.repeat === undefined && REPEAT.has(token)) {
      layer.repeat = run((t) => REPEAT.has(t), 2);
    } else if (layer.attachment === undefined && ATTACHMENT.has(token)) {
      layer.attachment = token;
      i++;
    } else if (boxes < 2 && BOX.has(token)) {
      if (boxes === 0) {
        layer.origin = token;
      }
      layer.clip = token;
      boxes++;
      i++;
    } else if (layer.position === undefined && (POSITION_KEYWORD.has(token) || LENGTH.test(token))) {
      layer.position = run((t) => POSITION_KEYWORD.has(t) || LENGTH.test(t), 4);
      if (tokens[i] === '/') {
        i++;
        const size = run((t) => SIZE_KEYWORD.has(t) || LENGTH.test(t), 2).split(' ');
        if (!size[0] || (size.length === 2 && size.some((t) => t === 'cover' || t === 'contain'))) {
          throw invalid();
        }
        layer.size = size.join(' ');
      }
    } else if (isFinal && layer.color === undefined && isColorCandidate(token)) {
      layer.color = token;
      i++;
    } else {
      throw invalid();
    }
  }
  return layer;
}

export function splitBackground(value: string): LonghandValue[] {
  const layerTokens: string[][] = [[]];
  for (const token of tokenizeCss(value)) {
    if (token === ',') {
      layerTokens.push([]);
    } else {
      layerTokens[layerTokens.length - 1].push(token);
    }
  }
  const layers = layerTokens.map((tokens, i) => {
    if (tokens.length === 0) {
      throw new Error(`Empty layer in background "${value}"`);
    }
    return parseBackgroundLayer(tokens, value, i === layerTokens.length - 1);
  });
  const perLayer = (part: keyof typeof LAYER_INITIAL, read: (layer: BackgroundLayer) => string | undefined): LonghandValue => {
    const parts = layers.map(read);
    return parts.some((p) => p !== undefined) ? parts.map((p) => p ?? LAYER_INITIAL[part]).join(', ') : unsetValue;
  };
  return [layers[layers.length - 1].color ?? unsetValue, perLayer('image', (layer) => layer.image), perLayer('repeat', (layer) => layer.repeat), perLayer('position', (layer) => layer.position), perLayer('size', (layer) => layer.size), perLayer('clip', (layer) => layer.clip), perLayer('origin', (layer) => layer.origin), perLayer('attachment', (layer) => layer.attachment)];
}

function keywordList(value: string, allowed: ReadonlySet<string>, max: number): string[] {
  const tokens = tokenizeCss(value);
  if (tokens.length === 0 || tokens.length > max || !tokens.every((token) => allowed.has(token))) {
    throw new Error(`Expected 1 to ${max} of ${[...allowed].join(', ')} in "${value}"`);
  }
  return tokens;
}

const OVERFLOW = new Set(['visible', 'hidden', 'clip', 'scroll', 'auto']);

export function splitOverflow(value: string): string[] {
  const [x, y = x] = keywordList(value, OVERFLOW, 2);
  return [x, y];
}

const FLEX_DIRECTION = new Set(['row', 'row-reverse', 'column', 'column-reverse']);
const FLEX_WRAP = new Set(['nowrap', 'wrap', 'wrap-reverse']);

export function splitFlexFlow(value: string): LonghandValue[] {
  const tokens = keywordList(value, new Set([...FLEX_DIRECTION, ...FLEX_WRAP]), 2);
  const direction = tokens.filter((token) => FLEX_DIRECTION.has(token));
  const wrap = tokens.filter((token) => FLEX_WRAP.has(token));
  if (direction.length > 1 || wrap.length > 1) {
    throw new Error(`Expected at most one direction and one wrap in "${value}"`);
  }
  return [direction[0] ?? unsetValue, wrap[0] ?? unsetValue];
}

const FLEX_FACTOR = /^\+?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const FLEX_BASIS_KEYWORD = new Set(['auto', 'content', 'min-content', 'max-content', 'fit-content']);

export function splitFlex(value: string): string[] {
  const tokens = tokenizeCss(value);
  if (tokens.length === 1 && tokens[0] === 'none') {
    return ['0', '0', 'auto'];
  }
  if (tokens.length === 1 && tokens[0] === 'auto') {
    return ['1', '1', 'auto'];
  }
  let grow: string | undefined;
  let shrink: string | undefined;
  let basis: string | undefined;
  let i = 0;
  const takeFactors = () => {
    if (grow === undefined && FLEX_FACTOR.test(tokens[i] ?? '')) {
      grow = tokens[i++];
      if (FLEX_FACTOR.test(tokens[i] ?? '')) {
        shrink = tokens[i++];
      }
    }
  };
  const takeBasis = () => {
    if (basis === undefined && i < tokens.length && (FLEX_BASIS_KEYWORD.has(tokens[i]) || (isLength(tokens[i]) && !tokens[i].startsWith('-')))) {
      basis = tokens[i++];
    }
  };
  takeFactors();
  takeBasis();
  takeFactors();
  if (i !== tokens.length || i === 0) {
    throw new Error(`Expected [<grow> <shrink>?] || <basis> in flex "${value}"`);
  }
  return [grow ?? '1', shrink ?? '1', basis ?? '0%'];
}

export function splitGap(value: string): string[] {
  const tokens = values(value, (token) => token === 'normal' || isLength(token));
  if (tokens.length === 0 || tokens.length > 2) {
    throw new Error(`Expected 1 or 2 values in gap "${value}"`);
  }
  const [row, column = row] = tokens;
  return [row, column];
}
