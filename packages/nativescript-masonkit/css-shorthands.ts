import { unsetValue } from '@nativescript/core';
import { expandCssShorthand } from './native-css-values';

export type LonghandValue = string | typeof unsetValue;

export const tokenizeCss = (value: string) => requireExpandedCss('tokenize', value);

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

export const splitMargin = (value: string) => requireExpandedCss('margin', value);
export const splitPadding = (value: string) => requireExpandedCss('padding', value);

export const BORDER_WIDTH_KEYWORDS: ReadonlyMap<string, string> = new Map([
  ['thin', '1'],
  ['medium', '3'],
  ['thick', '5'],
]);
export const splitBorderWidth = (value: string) => requireExpandedCss('border-width', value);
export const splitBorderColor = (value: string) => requireExpandedCss('border-color', value);

export const splitMarginStartEnd = (value: string, name = 'margin-inline') => requireExpandedCss(name, value);
export const splitPaddingStartEnd = (value: string, name = 'padding-inline') => requireExpandedCss(name, value);
export const splitInsetStartEnd = (value: string, name = 'inset-inline') => requireExpandedCss(name, value);
export const splitBorderWidthStartEnd = (value: string, name = 'border-inline-width') => requireExpandedCss(name, value);
export const splitBorderColorStartEnd = (value: string, name = 'border-inline-color') => requireExpandedCss(name, value);
export const splitBorderStyleStartEnd = (value: string, name = 'border-inline-style') => requireExpandedCss(name, value);
export const splitBorderStyle = (value: string) => requireExpandedCss('border-style', value);
export const splitBorderSide = (value: string, name = 'border-top') => requireExpandedCss(name, value);
export const splitBorder = (value: string) => requireExpandedCss('border', value);
export const splitBorderRadius = (value: string) => requireExpandedCss('border-radius', value);

export type CornerRadius = [horizontal: string, vertical: string];

export type CornerIndex = 0 | 1 | 2 | 3;

export function parseCornerRadius(value: string): CornerRadius {
  if (!value.trim()) return ['0', '0'];
  const [horizontal, vertical] = requireExpandedCss('border-corner-radius', value);
  return [horizontal, vertical];
}

// The same few radius strings repeat across a tree, so parse each once. Callers
// get copies: views keep and mutate their corner arrays.
const cornersCache = new Map<string, CornerRadius[]>();

export function borderRadiusCorners(value: string): CornerRadius[] {
  let corners = cornersCache.get(value);
  if (!corners) {
    const axes = requireExpandedCss('border-radius-components', value);
    corners = axes.slice(0, 4).map((horizontal, index) => [horizontal, axes[index + 4]]);
    if (cornersCache.size >= 256) cornersCache.clear();
    cornersCache.set(value, corners);
  }
  return corners.map(([h, v]) => [h, v] as CornerRadius);
}

export function composeBorderRadius(corners: CornerRadius[]): string {
  const horizontal = corners.map(([h]) => h).join(' ');
  if (corners.every(([h, v]) => h === v)) {
    return horizontal;
  }
  return `${horizontal} / ${corners.map(([, v]) => v).join(' ')}`;
}

export function splitBackground(value: string): LonghandValue[] {
  return requireExpandedCss('background', value).map((part) => part || unsetValue);
}

export function requireExpandedCss(name: string, value: string): string[] {
  const fields = expandCssShorthand(name, value);
  if (!fields) throw new Error(`Invalid ${name} value "${value}"`);
  return fields;
}

function splitMaskLayers(name: 'mask' | '-webkit-mask', value: string): string[] {
  const [image, size, position, repeat, origin, clip, mode, composite] = requireExpandedCss(name, value);
  return [image, position, size, repeat, origin, clip, composite, mode];
}

/** `mask` into image, position, size, repeat, origin, clip, composite and mode, per layer. */
export function splitMask(value: string): LonghandValue[] {
  return splitMaskLayers('mask', value);
}

/** A -webkit-mask-composite list as `mask-composite`, with unsupported operators mapped to add. */
export const webkitMaskComposite = (value: string) => requireExpandedCss('webkit-mask-composite-list', value)[0];

/** A -webkit-mask-origin or -clip list as the standard property. */
export const webkitMaskBox = (value: string) => requireExpandedCss('webkit-mask-box-list', value)[0];

/** `-webkit-mask` with its composite operators and box keywords. */
export function splitWebkitMask(value: string): LonghandValue[] {
  return splitMaskLayers('-webkit-mask', value);
}

/** The six image-border longhands in cascade order. */
export function splitMaskBorder(value: string, name: 'mask-border' | '-webkit-mask-box-image' = 'mask-border'): LonghandValue[] {
  return requireExpandedCss(name, value);
}

export const splitOverflow = (value: string) => requireExpandedCss('overflow', value);
export const splitFlexFlow = (value: string): LonghandValue[] => requireExpandedCss('flex-flow', value).map((part) => part || unsetValue);
export function splitFlex(value: string): string[] {
  const [grow, shrink, basis] = requireExpandedCss('flex', value);
  return [grow, shrink, basis || '0%'];
}
export const splitGap = (value: string, name = 'gap') => requireExpandedCss(name, value);
export const splitPlace = (value: string, name = 'place-items') => requireExpandedCss(name, value);

export const splitListStyle = (value: string) => requireExpandedCss('list-style', value);
