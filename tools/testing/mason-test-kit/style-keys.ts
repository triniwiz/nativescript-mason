// StyleKeys offsets, read out of style.ts itself.
//
// `enum StyleKeys` isn't exported, and hand-copying the table into the test
// would make it a fifth place these offsets live — the drift it exists to catch.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STYLE_TS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/nativescript-masonkit/style.ts');

function parse(): Record<string, number> {
  const source = readFileSync(STYLE_TS, 'utf8');
  const block = /enum StyleKeys \{([\s\S]*?)\n\}/.exec(source);
  if (!block) throw new Error(`style-keys: no "enum StyleKeys" block in ${STYLE_TS}`);
  const out: Record<string, number> = {};
  for (const [, name, value] of block[1].matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(-?\d+)\s*,?/gm)) {
    out[name] = Number(value);
  }
  return out;
}

const keys = parse();

export function styleKey(name: string): number {
  const offset = keys[name];
  if (offset === undefined) throw new Error(`style-keys: StyleKeys.${name} not found in style.ts`);
  return offset;
}

export const StyleKeys: Readonly<Record<string, number>> = keys;
