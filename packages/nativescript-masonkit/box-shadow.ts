export interface BoxShadow {
  inset: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string | null;
}

function splitOutsideParens(value: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && separator.test(ch)) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?[a-z]*$/i;

export function parseBoxShadows(value: string, toDip: (token: string) => number | undefined): BoxShadow[] {
  const v = (value ?? '').trim();
  if (!v || v === 'none') return [];
  const shadows: BoxShadow[] = [];
  for (const layer of splitOutsideParens(v, /,/)) {
    const lengths: number[] = [];
    let inset = false;
    let color: string | null = null;
    for (const token of splitOutsideParens(layer, /\s/)) {
      if (token.toLowerCase() === 'inset') inset = true;
      else if (LENGTH.test(token)) lengths.push(toDip(token) ?? parseFloat(token) ?? 0);
      else color = token;
    }
    if (lengths.length < 2) continue;
    shadows.push({ inset, offsetX: lengths[0], offsetY: lengths[1], blur: Math.max(0, lengths[2] ?? 0), spread: lengths[3] ?? 0, color });
  }
  return shadows;
}

export function encodeBoxShadows(shadows: BoxShadow[], argbOf: (color: string | null) => number): string {
  return shadows.map((s) => [s.inset ? 1 : 0, s.offsetX, s.offsetY, s.blur, s.spread, argbOf(s.color) >>> 0].join(',')).join(';');
}
