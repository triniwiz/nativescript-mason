import { tokenizeCss } from './css-shorthands';
import type { WindowsBackgroundBoxes, WindowsBackgroundLonghands, WindowsMaskContext } from './mask';
import { pathCommands } from './svg-path';
import { expandColorStops, repeatStops, resolveStopPositions } from './gradient-stops';

// Windows draws masks with Direct2D (CssMask.h) from a JSON spec built here: units, colours and
// gradients are resolved in TS, as for the rest of Windows styling, and the native side only lays
// out and paints. Android and iOS parse the same CSS natively (Mask.kt, Mask.swift).

/** px plus a percentage of whatever the value resolves against. */
type Len = [px: number, pct: number];

type GradientStops = { s: number[]; rp?: 1; p?: Array<number | null>; l?: Array<number | null> };
type WindowsImage = { t: 'img'; src: string } | ({ t: 'lin'; a: number; k?: [number, number] } & GradientStops) | ({ t: 'rad'; c: [number, number]; r: [number, number]; ci?: number; cr?: number } & GradientStops) | { t: 'con'; a: number; c: [number, number]; s: number[] };

const BOX: Record<string, number> = { 'border-box': 0, 'padding-box': 1, 'content-box': 2, 'margin-box': 3, 'fill-box': 0, 'stroke-box': 0, 'view-box': 0, 'no-clip': 3 };
const REPEAT: Record<string, number> = { repeat: 0, 'no-repeat': 1, space: 2, round: 3, stretch: 4 };
const MODE: Record<string, number> = { 'match-source': 0, alpha: 1, luminance: 2 };
const COMPOSITE: Record<string, number> = { add: 0, subtract: 1, intersect: 2, exclude: 3 };
const BLEND = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
const ATTACHMENT: Record<string, number> = { scroll: 0, fixed: 1, local: 2 };

function layerList(value: string | undefined): string[] {
  if (!value) return [];
  const parts: string[] = [''];
  let tokens: string[];
  try {
    tokens = tokenizeCss(value);
  } catch {
    return [];
  }
  for (const token of tokens) {
    if (token === ',') parts.push('');
    else parts[parts.length - 1] += (parts[parts.length - 1] ? ' ' : '') + token;
  }
  return parts.map((p) => p.trim());
}

function at<T>(list: T[], i: number, fallback: T): T {
  return list.length ? list[i % list.length] : fallback;
}

function len(token: string | undefined, ctx: WindowsMaskContext): Len | null {
  if (token == null) return null;
  const t = token.trim().toLowerCase();
  if (t.endsWith('%')) {
    const n = parseFloat(t);
    return Number.isFinite(n) ? [0, n] : null;
  }
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return [parseFloat(t), 0];
  const px = ctx.length(t);
  return px == null || !Number.isFinite(px) ? null : [px, 0];
}

/** The text inside url(...), unquoted. */
export function urlOf(token: string): string | null {
  const m = /^url\(\s*([\s\S]*?)\s*\)$/i.exec(token.trim());
  if (!m) return null;
  let inner = m[1];
  if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) inner = inner.slice(1, -1);
  return inner;
}

function flatStops(offsets: number[], colors: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < colors.length; i++) out.push(offsets[i], colors[i] >>> 0);
  return out;
}

function positionFraction(token: string, axis: 'x' | 'y'): number | null {
  if (token === 'center') return 0.5;
  if (token === (axis === 'x' ? 'left' : 'top')) return 0;
  if (token === (axis === 'x' ? 'right' : 'bottom')) return 1;
  if (token.endsWith('%')) {
    const n = parseFloat(token);
    return Number.isFinite(n) ? n / 100 : null;
  }
  return null;
}

function parseConic(value: string, ctx: WindowsMaskContext): WindowsImage | null {
  const m = /conic-gradient\s*\(([\s\S]*)\)\s*$/i.exec(value.trim());
  if (!m) return null;
  const parts = layerList(m[1]);
  let head = parts[0] ?? '';
  let start = 0;
  let from = 0;
  let cx = 0.5;
  let cy = 0.5;
  if (/^(from\s|at\s|in\s)/i.test(head)) {
    start = 1;
    const fromMatch = /from\s+(-?[\d.]+)(deg|rad|turn|grad)?/i.exec(head);
    if (fromMatch) from = angleDegrees(parseFloat(fromMatch[1]), fromMatch[2] ?? 'deg');
    const atMatch = /\bat\s+(.+)$/i.exec(head);
    if (atMatch) {
      const tokens = atMatch[1].trim().toLowerCase().split(/\s+/);
      let x: number | null = null;
      let y: number | null = null;
      for (const t of tokens) {
        if ((t === 'top' || t === 'bottom') && y == null) y = positionFraction(t, 'y');
        else if (x == null) x = positionFraction(t, 'x');
        else if (y == null) y = positionFraction(t, 'y');
      }
      cx = x ?? 0.5;
      cy = y ?? 0.5;
    }
    head = '';
  }
  const colors: number[] = [];
  const positions: Array<number | null> = [];
  for (const stop of expandColorStops(parts.slice(start))) {
    const pos = /\s+(-?[\d.]+)(%|deg|rad|turn|grad)\s*$/i.exec(stop);
    const color = ctx.color(pos ? stop.slice(0, pos.index).trim() : stop);
    if (color == null) continue;
    colors.push(color >>> 0);
    positions.push(pos ? (pos[2] === '%' ? parseFloat(pos[1]) / 100 : angleDegrees(parseFloat(pos[1]), pos[2]) / 360) : null);
  }
  if (!colors.length) return null;
  const offsets = resolveStopPositions(positions);
  const stops = /^\s*repeating-/i.test(value) ? repeatStops(offsets, colors) : { offsets, colors };
  return { t: 'con', a: from, c: [cx, cy], s: flatStops(stops.offsets, stops.colors) };
}

function angleDegrees(n: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'rad':
      return (n * 180) / Math.PI;
    case 'turn':
      return n * 360;
    case 'grad':
      return n * 0.9;
    default:
      return n;
  }
}

function gradientStops(g: { offsets: number[]; colors: number[]; positions?: Array<number | null>; lengths?: Array<number | null> }, repeating: boolean): GradientStops {
  const out: GradientStops = { s: flatStops(g.offsets, g.colors) };
  if (repeating) out.rp = 1;
  if (g.lengths && g.positions) {
    out.p = g.positions;
    out.l = g.lengths;
  }
  return out;
}

/** One mask/border image, or null for `none` and anything that can't be drawn. */
export function encodeImage(token: string, ctx: WindowsMaskContext): WindowsImage | null {
  const t = token.trim();
  if (!t || t.toLowerCase() === 'none') return null;
  const url = urlOf(t);
  if (url != null) return url ? { t: 'img', src: ctx.source(url) } : null;
  if (/^(repeating-)?conic-gradient\(/i.test(t)) return parseConic(t, ctx);
  const repeating = /^repeating-/i.test(t);
  if (/^(repeating-)?radial-gradient\(/i.test(t)) {
    const g = ctx.radial(t);
    if (!g || !g.colors.length) return null;
    return { t: 'rad', c: [g.cx, g.cy], r: [g.rx, g.ry], ...(g.circle != null && { ci: g.circle }), ...(g.circleRadius != null && { cr: g.circleRadius }), ...gradientStops(g, repeating) };
  }
  if (/^(repeating-)?linear-gradient\(/i.test(t)) {
    const g = ctx.linear(t);
    if (!g || !g.colors.length) return null;
    return { t: 'lin', a: g.angle, ...(g.corner && { k: g.corner }), ...gradientStops(g, repeating) };
  }
  return null;
}

/** A background-position-style value as [x, y], each px + % of (area − tile). */
export function encodePosition(value: string, ctx: WindowsMaskContext): [Len, Len] {
  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const keyword = (t: string) => ['left', 'right', 'top', 'bottom', 'center'].includes(t);
  const edge = (t: string): Len => (t === 'left' || t === 'top' ? [0, 0] : t === 'right' || t === 'bottom' ? [0, 100] : [0, 50]);
  let x: Len = [0, 0];
  let y: Len = [0, 0];
  if (tokens.length === 1) {
    const t = tokens[0];
    if (t === 'top' || t === 'bottom') return [[0, 50], edge(t)];
    if (keyword(t)) return [edge(t), [0, 50]];
    return [len(t, ctx) ?? [0, 0], [0, 50]];
  }
  if (tokens.length === 2) {
    let [a, b] = tokens;
    if (a === 'top' || a === 'bottom' || b === 'left' || b === 'right') [a, b] = [b, a];
    x = keyword(a) ? edge(a) : (len(a, ctx) ?? [0, 0]);
    y = keyword(b) ? edge(b) : (len(b, ctx) ?? [0, 0]);
    return [x, y];
  }
  // 3 or 4 values: keyword offset pairs, offsets measured from the named edge.
  let i = 0;
  const axes: { x?: Len; y?: Len } = {};
  while (i < tokens.length) {
    const kw = tokens[i++];
    const next = tokens[i];
    const offset = next && !keyword(next) ? len(next, ctx) : null;
    if (offset) i++;
    const base = edge(kw);
    const o = offset ?? [0, 0];
    const v: Len = kw === 'right' || kw === 'bottom' ? [0 - o[0], 100 - o[1]] : [base[0] + o[0], base[1] + o[1]];
    if (kw === 'left' || kw === 'right') axes.x = v;
    else if (kw === 'top' || kw === 'bottom') axes.y = v;
    else if (!axes.x) axes.x = v;
    else axes.y = v;
  }
  return [axes.x ?? [0, 50], axes.y ?? [0, 50]];
}

function encodeSize(value: string, ctx: WindowsMaskContext): number[] {
  const t = value.trim().toLowerCase();
  if (t === 'cover') return [1];
  if (t === 'contain') return [2];
  const [w, h = 'auto'] = t.split(/\s+/);
  const lw = w === 'auto' ? null : len(w, ctx);
  const lh = h === 'auto' ? null : len(h, ctx);
  return [0, lw ? 1 : 0, ...(lw ?? [0, 0]), lh ? 1 : 0, ...(lh ?? [0, 0])];
}

function encodeRepeat(value: string): [number, number] {
  const t = value.trim().toLowerCase();
  if (t === 'repeat-x') return [0, 1];
  if (t === 'repeat-y') return [1, 0];
  const [a, b = a] = t.split(/\s+/);
  return [REPEAT[a] ?? 0, REPEAT[b] ?? 0];
}

function cornerRadii(value: string, ctx: WindowsMaskContext): number[] {
  // border-radius grammar: 1-4 horizontal radii [/ 1-4 vertical radii], each a px+% Len.
  const [hPart, vPart] = value.split('/');
  const expand = (part: string | undefined) => {
    const list = (part ?? '').trim().split(/\s+/).filter(Boolean);
    if (!list.length) return null;
    const [a, b = a, c = a, d = b] = list;
    return [a, b, c, d];
  };
  const hs = expand(hPart) ?? ['0', '0', '0', '0'];
  const vs = expand(vPart) ?? hs;
  const out: number[] = [];
  for (let i = 0; i < 4; i++) out.push(...(len(hs[i], ctx) ?? [0, 0]), ...(len(vs[i], ctx) ?? [0, 0]));
  return out;
}

function radiusKind(token: string | undefined): number {
  return token === 'closest-side' ? 1 : token === 'farthest-side' ? 2 : 0;
}

/** clip-path as the native shape spec, or null for none and what can't be drawn. */
export function encodeClipPath(value: string, ctx: WindowsMaskContext): Record<string, unknown> | null {
  let tokens: string[];
  try {
    tokens = tokenizeCss(value.trim());
  } catch {
    return null;
  }
  if (!tokens.length || tokens[0].toLowerCase() === 'none') return null;
  let box = 0;
  let shape: string | null = null;
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower in BOX && lower !== 'no-clip') box = BOX[lower];
    else if (/^[a-z-]+\(/i.test(token)) shape = token;
  }
  if (!shape) return { b: box, s: 0 };
  const m = /^([a-z-]+)\(([\s\S]*)\)$/i.exec(shape);
  if (!m) return null;
  const name = m[1].toLowerCase();
  const args = m[2].trim();
  const v: number[] = [];
  const push = (l: Len | null) => v.push(...(l ?? [0, 0]));
  const insetOf = (sides: Array<Len | null>, round: string | undefined) => {
    for (const s of sides) push(s);
    v.push(...cornerRadii(round ?? '0', ctx));
    return { b: box, s: 1, v };
  };
  const roundSplit = (text: string) => {
    const r = /\s+round\s+/i.exec(text);
    return r ? [text.slice(0, r.index), text.slice(r.index + r[0].length)] : [text, undefined];
  };
  switch (name) {
    case 'inset': {
      const [sidesText, round] = roundSplit(args);
      const list = sidesText.trim().split(/\s+/).filter(Boolean);
      const [a, b = a, c = a, d = b] = list;
      return insetOf([len(a, ctx), len(b, ctx), len(c, ctx), len(d, ctx)], round);
    }
    case 'rect': {
      // rect(top right bottom left): right/bottom measured from the left/top edge.
      const [sidesText, round] = roundSplit(args);
      const [t, r, b, l] = sidesText.split(/[\s,]+/).filter(Boolean);
      const edge = (token: string | undefined, far: boolean): Len | null => {
        if (!token || token === 'auto') return [0, 0];
        const value = len(token, ctx);
        if (!value) return null;
        return far ? [0 - value[0], 100 - value[1]] : value;
      };
      return insetOf([edge(t, false), edge(r, true), edge(b, true), edge(l, false)], round);
    }
    case 'xywh': {
      const [sidesText, round] = roundSplit(args);
      const [x, y, w, h] = sidesText
        .split(/\s+/)
        .filter(Boolean)
        .map((t): Len => len(t, ctx) ?? [0, 0]);
      if (!h) return null;
      return insetOf([y, [0 - (x[0] + w[0]), 100 - x[1] - w[1]], [0 - (y[0] + h[0]), 100 - y[1] - h[1]], x], round);
    }
    case 'circle':
    case 'ellipse': {
      const atIndex = args.search(/(^|\s)at\s/i);
      const radii = (atIndex >= 0 ? args.slice(0, atIndex) : args).trim().split(/\s+/).filter(Boolean);
      const position = atIndex >= 0 ? args.slice(atIndex).replace(/^\s*at\s+/i, '') : 'center';
      // The centre is a plain position in the box, not one offset by a tile.
      const [cx, cy] = encodePosition(position, ctx);
      push(cx);
      push(cy);
      const kinds: number[] = [];
      const count = name === 'circle' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const r = radii[i] ?? (name === 'circle' ? 'closest-side' : 'closest-side');
        kinds.push(radiusKind(r));
        push(radiusKind(r) ? [0, 0] : len(r, ctx));
      }
      return { b: box, s: name === 'circle' ? 2 : 3, v, k: kinds };
    }
    case 'polygon': {
      const list = layerList(args);
      let evenOdd = false;
      if (/^(evenodd|nonzero)$/i.test(list[0] ?? '')) evenOdd = list.shift()!.toLowerCase() === 'evenodd';
      for (const point of list) {
        const [x, y] = point.split(/\s+/);
        push(len(x, ctx));
        push(len(y, ctx));
      }
      return v.length >= 6 ? { b: box, s: 4, v, e: evenOdd } : null;
    }
    case 'path': {
      const list = layerList(args);
      let evenOdd = false;
      if (/^(evenodd|nonzero)$/i.test(list[0] ?? '')) evenOdd = list.shift()!.toLowerCase() === 'evenodd';
      const d = (list[0] ?? '').replace(/^["']|["']$/g, '');
      return d ? { b: box, s: 5, d, e: evenOdd, pc: pathCommands(d) } : null;
    }
    default:
      return null;
  }
}

/** The 9-slice part of mask-border or border-image, or null when it has no image. */
export function encodeNineSlice(parts: { source: string; slice: string; width: string; outset: string; repeat: string; mode?: string }, ctx: WindowsMaskContext, defaults: { width: 'auto' | 'border' }): Record<string, unknown> | null {
  const image = encodeImage(parts.source, ctx);
  if (!image) return null;
  const sliceTokens = parts.slice.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const fill = sliceTokens.includes('fill');
  const nums = sliceTokens.filter((t) => t !== 'fill');
  const [s1 = '0', s2 = s1, s3 = s1, s4 = s2] = nums;
  const sl: number[] = [];
  for (const s of [s1, s2, s3, s4]) sl.push(parseFloat(s) || 0, s.endsWith('%') ? 1 : 0);
  const widthTokens = parts.width.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const [w1 = defaults.width === 'auto' ? 'auto' : '1', w2 = w1, w3 = w1, w4 = w2] = widthTokens;
  const w: number[] = [];
  for (const t of [w1, w2, w3, w4]) {
    if (t === 'auto') w.push(2, 0, 0);
    else if (/^[+]?(\d+\.?\d*|\.\d+)$/.test(t)) w.push(0, parseFloat(t), 0);
    else w.push(1, ...(len(t, ctx) ?? [0, 0]));
  }
  const outsetTokens = parts.outset.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const [o1 = '0', o2 = o1, o3 = o1, o4 = o2] = outsetTokens;
  const o: number[] = [];
  for (const t of [o1, o2, o3, o4]) {
    if (/^[+]?(\d+\.?\d*|\.\d+)$/.test(t)) o.push(0, parseFloat(t));
    else o.push(1, ctx.length(t) ?? 0);
  }
  const [rx = 'stretch', ry = rx] = parts.repeat.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return { i: image, sl, f: fill, w, o, r: [REPEAT[rx] ?? 4, REPEAT[ry] ?? 4], lum: parts.mode?.trim().toLowerCase() === 'luminance' };
}

function maskBorderOf(css: ReadonlyMap<string, string>, ctx: WindowsMaskContext): Record<string, unknown> | null {
  const source = css.get('mask-border-source');
  if (!source) return null;
  return encodeNineSlice(
    {
      source,
      slice: css.get('mask-border-slice') ?? '0',
      width: css.get('mask-border-width') ?? 'auto',
      outset: css.get('mask-border-outset') ?? '0',
      repeat: css.get('mask-border-repeat') ?? 'stretch',
      mode: css.get('mask-border-mode') ?? 'alpha',
    },
    ctx,
    { width: 'auto' },
  );
}

/** mask-*, clip-path and mask-border longhands as the JSON Css.SetMask takes, or '' for none. */
export function encodeWindowsMask(css: ReadonlyMap<string, string>, ctx: WindowsMaskContext): string {
  const images = layerList(css.get('mask-image'));
  const sizes = layerList(css.get('mask-size'));
  const positions = layerList(css.get('mask-position'));
  const repeats = layerList(css.get('mask-repeat'));
  const origins = layerList(css.get('mask-origin'));
  const clips = layerList(css.get('mask-clip'));
  const modes = layerList(css.get('mask-mode'));
  const composites = layerList(css.get('mask-composite'));
  const layers: Array<Record<string, unknown>> = [];
  let drawable = false;
  images.forEach((token, i) => {
    const image = encodeImage(token, ctx);
    if (image) drawable = true;
    const [x, y] = encodePosition(at(positions, i, '0% 0%'), ctx);
    layers.push({
      i: image,
      sz: encodeSize(at(sizes, i, 'auto'), ctx),
      p: [...x, ...y],
      r: encodeRepeat(at(repeats, i, 'repeat')),
      o: BOX[at(origins, i, 'border-box').toLowerCase()] ?? 0,
      c: BOX[at(clips, i, 'border-box').toLowerCase()] ?? 0,
      m: MODE[at(modes, i, 'match-source').toLowerCase()] ?? 0,
      k: COMPOSITE[at(composites, i, 'add').toLowerCase()] ?? 0,
    });
  });
  const spec: Record<string, unknown> = {};
  if (drawable) spec.l = layers;
  const clip = encodeClipPath(css.get('clip-path') ?? '', ctx);
  if (clip) spec.cp = clip;
  const border = maskBorderOf(css, ctx);
  if (border) spec.mb = border;
  return Object.keys(spec).length ? JSON.stringify(spec) : '';
}

const originOf = (boxes: WindowsBackgroundBoxes) => BOX[(boxes.origin ?? '').trim().toLowerCase()] ?? 1;
const clipOf = (boxes: WindowsBackgroundBoxes) => BOX[(boxes.clip ?? '').trim().toLowerCase()] ?? 0;

function backgroundLayer(image: WindowsImage, size: string, position: string, repeat: string, ctx: WindowsMaskContext, boxes: WindowsBackgroundBoxes): string {
  const [x, y] = encodePosition(position || '0% 0%', ctx);
  const layer = { i: image, sz: encodeSize(size || 'auto', ctx), p: [...x, ...y], r: encodeRepeat(repeat || 'repeat'), o: originOf(boxes), c: clipOf(boxes), m: 0, k: 0 };
  return JSON.stringify({ l: [layer] });
}

/** One url() background layer as the JSON Css.SetBackgroundLayers takes, or '' if it can't be drawn. */
export function encodeWindowsBackground(url: string, size: string, position: string, repeat: string, ctx: WindowsMaskContext, boxes: WindowsBackgroundBoxes = {}): string {
  if (!url) return '';
  return backgroundLayer({ t: 'img', src: ctx.source(url) }, size, position, repeat, ctx, boxes);
}

/** A gradient background layer as the JSON Css.SetBackgroundLayers takes, or ''. */
export function encodeWindowsGradientBackground(gradient: string, size: string, position: string, repeat: string, ctx: WindowsMaskContext, boxes: WindowsBackgroundBoxes = {}): string {
  const image = encodeImage(gradient, ctx);
  if (!image || image.t === 'img') return '';
  return backgroundLayer(image, size, position, repeat, ctx, boxes);
}

/** background-color clipped to `clip`, as one transparent layer (the colour is clipped to the bottom layer's box). */
export function encodeWindowsColorClip(clip: string, ctx: WindowsMaskContext): string {
  return backgroundLayer({ t: 'lin', a: 180, s: [0, 0] }, '', '', 'no-repeat', ctx, { clip });
}

/** Whether only the layer painter draws these layers: several of them, a blend mode or a fixed or local attachment. */
export function needsWindowsBackgroundLayers(css: WindowsBackgroundLonghands): boolean {
  if (layerList(css.image).length > 1) return true;
  for (const blend of layerList(css.blend)) if (blend.toLowerCase() !== 'normal') return true;
  for (const attachment of layerList(css.attachment)) if (attachment.toLowerCase() !== 'scroll') return true;
  return false;
}

/** Every background layer, the first on top, as the JSON Css.SetBackgroundLayers takes, or '' if none can be drawn. */
export function encodeWindowsBackgroundLayers(css: WindowsBackgroundLonghands, ctx: WindowsMaskContext): string {
  const images = layerList(css.image);
  const sizes = layerList(css.size);
  const positions = layerList(css.position);
  const repeats = layerList(css.repeat);
  const origins = layerList(css.origin);
  const clips = layerList(css.clip);
  const attachments = layerList(css.attachment);
  const blends = layerList(css.blend);
  const layers: Array<Record<string, unknown>> = [];
  let drawable = false;
  for (let i = 0; i < images.length; i++) {
    const image = encodeImage(images[i], ctx);
    if (image) drawable = true;
    const [x, y] = encodePosition(at(positions, i, '0% 0%'), ctx);
    const blend = BLEND.indexOf(at(blends, i, 'normal').toLowerCase());
    layers.push({
      i: image ?? undefined,
      sz: encodeSize(at(sizes, i, 'auto'), ctx),
      p: [...x, ...y],
      r: encodeRepeat(at(repeats, i, 'repeat')),
      o: BOX[at(origins, i, 'padding-box').toLowerCase()] ?? 1,
      c: BOX[at(clips, i, 'border-box').toLowerCase()] ?? 0,
      m: 0,
      k: 0,
      b: blend < 0 ? 0 : blend,
      a: ATTACHMENT[at(attachments, i, 'scroll').toLowerCase()] ?? 0,
    });
  }
  return drawable ? JSON.stringify({ l: layers }) : '';
}

/** Whether the boxes differ from the CSS defaults, which the plain brush paths assume. */
export function hasCustomBackgroundBoxes(boxes: WindowsBackgroundBoxes): boolean {
  return originOf(boxes) !== 1 || clipOf(boxes) !== 0;
}

const BORDER_IMAGE_REPEAT = new Set(['stretch', 'repeat', 'round', 'space']);

/** The border-image shorthand as the JSON Css.SetBorderImage takes, or '' for none. */
export function encodeWindowsBorderImage(value: string, ctx: WindowsMaskContext): string {
  let tokens: string[];
  try {
    tokens = tokenizeCss(value.trim());
  } catch {
    return '';
  }
  let source = '';
  const groups: string[][] = [[]];
  const repeat: string[] = [];
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (token === '/') groups.push([]);
    else if (BORDER_IMAGE_REPEAT.has(lower)) repeat.push(lower);
    else if (!source && (lower === 'none' || /^[a-z-]+\(/i.test(token))) source = token;
    else groups[groups.length - 1].push(token);
  }
  if (!source) return '';
  const [slice, width, outset] = groups.map((g) => g.join(' '));
  const nine = encodeNineSlice({ source, slice: slice || '100%', width: width || '', outset: outset || '0', repeat: repeat.join(' ') || 'stretch' }, ctx, { width: 'border' });
  return nine ? JSON.stringify({ mb: nine }) : '';
}

/** Longhands that feed Css.SetMask. */
export const WINDOWS_MASK_PROPERTIES = new Set(['mask-image', 'mask-size', 'mask-position', 'mask-repeat', 'mask-origin', 'mask-clip', 'mask-mode', 'mask-composite', 'clip-path', 'mask-border-source', 'mask-border-slice', 'mask-border-width', 'mask-border-outset', 'mask-border-repeat', 'mask-border-mode']);

export type { WindowsBackgroundBoxes, WindowsBackgroundLonghands, WindowsMaskContext };
