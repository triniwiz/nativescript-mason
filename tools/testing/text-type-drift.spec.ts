import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// `TextType` is hand-copied into every file that needs it, and the copies are
// what map a `<pre>`/`<strong>`/`<em>` element onto its native text type. Two
// of them (tree/index.ios.ts, tree/index.windows.ts) had silently stopped at
// `Pre = 13`, so on iOS those tags fell through `createTextView`'s switch to an
// untyped view: no UA margin, no bold, no italic, no link handling — with no
// error anywhere. This pins every copy to the same list.
//
// The Swift/Kotlin enums are declaration-ordered rather than explicitly
// numbered, so they are checked by order and name instead of by value.

const root = resolve(__dirname, '../..');
const pkg = 'packages/nativescript-masonkit';

const TS_SOURCES = [`${pkg}/web.ts`, `${pkg}/tree/index.ios.ts`, `${pkg}/tree/index.android.ts`, `${pkg}/tree/index.windows.ts`, `${pkg}/text/index.ios.ts`, `${pkg}/text/index.android.ts`];

function read(file: string): string {
  return readFileSync(resolve(root, file), 'utf8');
}

function tsTextType(file: string): Array<[string, number]> {
  const block = /enum TextType \{([\s\S]*?)\n\}/.exec(read(file));
  if (!block) throw new Error(`no TextType enum in ${file}`);
  return [...block[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)\s*=\s*(\d+)/gm)].map((m) => [m[1], Number(m[2])]);
}

// web.ts is the spelling the elements registry is built from, so it is the reference.
const REFERENCE = tsTextType(`${pkg}/web.ts`);

describe('the TextType enum', () => {
  it('numbers its members contiguously from zero', () => {
    expect(REFERENCE.map(([, value]) => value)).toEqual(REFERENCE.map((_, index) => index));
  });

  for (const file of TS_SOURCES) {
    it(`agrees with web.ts in ${file}`, () => {
      expect(tsTextType(file)).toEqual(REFERENCE);
    });
  }

  it('agrees with MasonTextType in MasonText.swift', () => {
    const source = read(`${pkg}/src-native/mason-ios/Mason/Mason/text/MasonText.swift`);
    const block = /enum MasonTextType[\s\S]*?\{([\s\S]*?)\n\s*public typealias RawValue/.exec(source);
    if (!block) throw new Error('no MasonTextType enum found');
    const declared = [...block[1].matchAll(/^\s*case ([A-Za-z][A-Za-z0-9]*)\s*$/gm)].map((m) => m[1]);
    expect(declared).toEqual(REFERENCE.map(([name]) => name));

    // The Swift raw values come from a hand-written switch, not declaration order.
    const raw = [...source.matchAll(/case \.([A-Za-z][A-Za-z0-9]*):\s*\n\s*return (\d+)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
    expect(raw.slice(0, REFERENCE.length)).toEqual(REFERENCE);
  });

  it('agrees with the Kotlin TextType enum', () => {
    const source = read(`${pkg}/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/enums/TextType.kt`);
    const block = /enum class TextType\(val value: Byte\) \{([\s\S]*?);/.exec(source);
    if (!block) throw new Error('no Kotlin TextType enum found');
    const declared = [...block[1].matchAll(/([A-Z][A-Za-z0-9]*)\s*\(\s*(\d+)\s*\)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
    expect(declared).toEqual(REFERENCE);
  });

  it('has a createTextView case for every member on each platform', () => {
    for (const file of [`${pkg}/tree/index.ios.ts`, `${pkg}/tree/index.android.ts`]) {
      const source = read(file);
      const fn = /createTextView\([\s\S]*?\n  \}/.exec(source);
      if (!fn) throw new Error(`no createTextView in ${file}`);
      const handled = new Set([...fn[0].matchAll(/case TextType\.([A-Za-z][A-Za-z0-9]*)/g)].map((m) => m[1]));
      // `None` is the fallthrough default, so it needs no explicit case.
      const missing = REFERENCE.map(([name]) => name).filter((name) => name !== 'None' && !handled.has(name));
      expect(missing, `${file} silently falls through to an untyped text view for these`).toEqual([]);
    }
  });
});
