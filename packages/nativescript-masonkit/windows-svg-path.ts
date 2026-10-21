// SVG path data as absolute drawing commands, for Direct2D geometry (CssMask.h hit tests
// clip-path: path() with it). Arcs become cubics (SVG 2, appendix B.2.4).

/** Opcodes in the flat command list: M x y, L x y, C x1 y1 x2 y2 x y, Q x1 y1 x y, Z. */
export const PATH_MOVE = 0;
export const PATH_LINE = 1;
export const PATH_CUBIC = 2;
export const PATH_QUAD = 3;
export const PATH_CLOSE = 4;

const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
const COMMANDS = 'MmLlHhVvCcSsQqTtAaZz';

function arcToCubics(out: number[], x1: number, y1: number, rx: number, ry: number, rotation: number, large: number, sweep: number, x2: number, y2: number) {
  if (x1 === x2 && y1 === y2) return;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (rx === 0 || ry === 0) {
    out.push(PATH_LINE, x2, y2);
    return;
  }
  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const theta = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  else if (sweep && delta < 0) delta += 2 * Math.PI;
  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9));
  const step = delta / segments;
  const t = (4 / 3) * Math.tan(step / 4);
  const map = (ux: number, uy: number): [number, number] => [cx + rx * cos * ux - ry * sin * uy, cy + rx * sin * ux + ry * cos * uy];
  for (let i = 0; i < segments; i++) {
    const a = theta + i * step;
    const b = a + step;
    const c1 = map(Math.cos(a) - t * Math.sin(a), Math.sin(a) + t * Math.cos(a));
    const c2 = map(Math.cos(b) + t * Math.sin(b), Math.sin(b) - t * Math.cos(b));
    const end = i === segments - 1 ? [x2, y2] : map(Math.cos(b), Math.sin(b));
    out.push(PATH_CUBIC, c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
  }
}

/**
 * Path data as a flat list of absolute commands. Like an SVG renderer, it keeps everything
 * before the first error, and is empty when the data doesn't start with a moveto.
 */
export function pathCommands(d: string): number[] {
  const out: number[] = [];
  let i = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++;
  };
  const num = (): number | null => {
    skip();
    NUMBER.lastIndex = i;
    const m = NUMBER.exec(d);
    if (!m) return null;
    i = NUMBER.lastIndex;
    return parseFloat(m[0]);
  };
  const flag = (): number | null => {
    skip();
    const c = d[i];
    if (c !== '0' && c !== '1') return null;
    i++;
    return c === '1' ? 1 : 0;
  };

  let cmd = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  // The previous segment's second control point, for S (cubic) and T (quadratic).
  let cubicCtrl: [number, number] | null = null;
  let quadCtrl: [number, number] | null = null;

  for (;;) {
    skip();
    if (i >= d.length) break;
    const c = d[i];
    if (/[a-zA-Z]/.test(c)) {
      if (!COMMANDS.includes(c)) break;
      cmd = c;
      i++;
    } else if (!cmd || cmd === 'z' || cmd === 'Z') {
      break;
    }
    if (!out.length && cmd !== 'M' && cmd !== 'm') break;
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    const upper = cmd.toUpperCase();
    let nextCubic: [number, number] | null = null;
    let nextQuad: [number, number] | null = null;

    if (upper === 'Z') {
      out.push(PATH_CLOSE);
      x = startX;
      y = startY;
      cubicCtrl = quadCtrl = null;
      continue;
    }
    if (upper === 'M' || upper === 'L' || upper === 'T') {
      const px = num();
      const py = px == null ? null : num();
      if (px == null || py == null) break;
      const tx = px + ox;
      const ty = py + oy;
      if (upper === 'M') {
        out.push(PATH_MOVE, tx, ty);
        startX = tx;
        startY = ty;
        // Further pairs after a moveto are linetos.
        cmd = rel ? 'l' : 'L';
      } else if (upper === 'L') {
        out.push(PATH_LINE, tx, ty);
      } else {
        const ctrl: [number, number] = quadCtrl ? [2 * x - quadCtrl[0], 2 * y - quadCtrl[1]] : [x, y];
        out.push(PATH_QUAD, ctrl[0], ctrl[1], tx, ty);
        nextQuad = ctrl;
      }
      x = tx;
      y = ty;
    } else if (upper === 'H' || upper === 'V') {
      const v = num();
      if (v == null) break;
      if (upper === 'H') x = v + ox;
      else y = v + oy;
      out.push(PATH_LINE, x, y);
    } else if (upper === 'C' || upper === 'S' || upper === 'Q') {
      const count = upper === 'C' ? 6 : 4;
      const args: number[] = [];
      for (let k = 0; k < count; k++) {
        const v = num();
        if (v == null) break;
        args.push(v + (k % 2 === 0 ? ox : oy));
      }
      if (args.length < count) break;
      if (upper === 'C') {
        out.push(PATH_CUBIC, ...args);
        nextCubic = [args[2], args[3]];
      } else if (upper === 'S') {
        const c1: [number, number] = cubicCtrl ? [2 * x - cubicCtrl[0], 2 * y - cubicCtrl[1]] : [x, y];
        out.push(PATH_CUBIC, c1[0], c1[1], ...args);
        nextCubic = [args[0], args[1]];
      } else {
        out.push(PATH_QUAD, ...args);
        nextQuad = [args[0], args[1]];
      }
      x = args[count - 2];
      y = args[count - 1];
    } else {
      const rx = num();
      const ry = rx == null ? null : num();
      const rotation = ry == null ? null : num();
      const large = rotation == null ? null : flag();
      const sweep = large == null ? null : flag();
      const px = sweep == null ? null : num();
      const py = px == null ? null : num();
      if (rx == null || ry == null || rotation == null || large == null || sweep == null || px == null || py == null) break;
      const tx = px + ox;
      const ty = py + oy;
      arcToCubics(out, x, y, rx, ry, rotation, large, sweep, tx, ty);
      x = tx;
      y = ty;
    }
    cubicCtrl = nextCubic;
    quadCtrl = nextQuad;
  }
  return out;
}
