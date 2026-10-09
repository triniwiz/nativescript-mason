export type Matrix2D = [number, number, number, number, number, number];

const IDENTITY: Matrix2D = [1, 0, 0, 1, 0, 0];

function multiply(m: Matrix2D, n: Matrix2D): Matrix2D {
  return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
}

export function parseAngle(token: string): number {
  const t = token.trim().toLowerCase();
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return 0;
  if (t.endsWith('grad')) return (n * Math.PI) / 200;
  if (t.endsWith('rad')) return n;
  if (t.endsWith('turn')) return n * 2 * Math.PI;
  return (n * Math.PI) / 180;
}

export function parseCssTransform(value: string, toDip: (token: string) => number | undefined, size: { width: number; height: number }): Matrix2D | null {
  const s = (value ?? '').trim();
  if (!s || s === 'none') return null;
  const length = (token: string | undefined, axis: number): number => {
    if (token == null) return 0;
    const t = token.trim();
    if (t.endsWith('%')) return (parseFloat(t) / 100) * axis;
    return toDip(t) ?? parseFloat(t) ?? 0;
  };
  const num = (token: string | undefined, fallback: number): number => {
    if (token == null || token.trim() === '') return fallback;
    const t = token.trim();
    const n = t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t);
    return Number.isFinite(n) ? n : fallback;
  };
  let m: Matrix2D = IDENTITY;
  let found = false;
  const re = /([a-zA-Z0-9]+)\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s))) {
    const name = match[1].toLowerCase();
    const args = match[2].split(/\s*,\s*|\s+/).filter((a) => a !== '');
    let f: Matrix2D | null = null;
    switch (name) {
      case 'translate':
      case 'translate3d':
        f = [1, 0, 0, 1, length(args[0], size.width), length(args[1], size.height)];
        break;
      case 'translatex':
        f = [1, 0, 0, 1, length(args[0], size.width), 0];
        break;
      case 'translatey':
        f = [1, 0, 0, 1, 0, length(args[0], size.height)];
        break;
      case 'scale':
      case 'scale3d': {
        const sx = num(args[0], 1);
        f = [sx, 0, 0, num(args[1], sx), 0, 0];
        break;
      }
      case 'scalex':
        f = [num(args[0], 1), 0, 0, 1, 0, 0];
        break;
      case 'scaley':
        f = [1, 0, 0, num(args[0], 1), 0, 0];
        break;
      case 'rotate':
      case 'rotatez': {
        const a = parseAngle(args[0] ?? '0');
        f = [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
        break;
      }
      case 'skew':
        f = [1, Math.tan(parseAngle(args[1] ?? '0')), Math.tan(parseAngle(args[0] ?? '0')), 1, 0, 0];
        break;
      case 'skewx':
        f = [1, 0, Math.tan(parseAngle(args[0] ?? '0')), 1, 0, 0];
        break;
      case 'skewy':
        f = [1, Math.tan(parseAngle(args[0] ?? '0')), 0, 1, 0, 0];
        break;
      case 'matrix':
        if (args.length >= 6) f = args.slice(0, 6).map((a) => parseFloat(a) || 0) as Matrix2D;
        break;
      case 'matrix3d':
        if (args.length >= 16) {
          const v = args.map((a) => parseFloat(a) || 0);
          f = [v[0], v[1], v[4], v[5], v[12], v[13]];
        }
        break;
    }
    if (!f) continue;
    found = true;
    m = multiply(m, f);
  }
  return found ? m : null;
}
