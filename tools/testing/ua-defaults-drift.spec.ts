import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Windows applies the UA text defaults from TS; Android and iOS read them from mason-core over FFI.
// This pins the TS copy to the Rust table.

const root = resolve(__dirname, '../..');

function rustTable(): Record<string, number[]> {
  const source = readFileSync(resolve(root, 'crates/mason-core/src/utils/ua_defaults.rs'), 'utf8');
  const body = /fn ua_default_for_tag_raw[\s\S]*?match tag \{([\s\S]*?)_ => None/.exec(source);
  if (!body) throw new Error('no ua_default_for_tag_raw table found');
  const out: Record<string, number[]> = {};
  for (const m of body[1].matchAll(/"([a-z0-9]+)"\s*=>\s*Some\(ua\(([^)]*)\)\)/g)) {
    out[m[1]] = m[2].split(',').map((v) => Number(v.trim()));
  }
  return out;
}

function windowsTable(): Record<string, number[]> {
  const source = readFileSync(resolve(root, 'packages/nativescript-masonkit/text/index.windows.ts'), 'utf8');
  const body = /export const UA_DEFAULTS[^=]*= \{([\s\S]*?)\n\};/.exec(source);
  if (!body) throw new Error('no UA_DEFAULTS table found');
  const out: Record<string, number[]> = {};
  for (const m of body[1].matchAll(/^\s*([a-z0-9]+):\s*\[([^\]]*)\]/gm)) {
    out[m[1]] = m[2].split(',').map((v) => Number(v.trim()));
  }
  return out;
}

describe('the UA text defaults', () => {
  it('match mason-core in text/index.windows.ts', () => {
    const rust = rustTable();
    expect(Object.keys(rust).length).toBeGreaterThan(0);
    expect(windowsTable()).toEqual(rust);
  });
});
