import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSchema } from '../scripts/style-keys/generate.mjs';
import { styleUnderTest } from './mason-test-kit/style-under-test';
import { styleKey } from './mason-test-kit/style-keys';

// Position is one signed byte in the style buffer. The CSS keyword schema,
// public typed enums, and Rust layout decoder must agree on its meaning.

const root = resolve(__dirname, '../..');
const pkg = 'packages/nativescript-masonkit';

function read(file: string): string {
  return readFileSync(resolve(root, file), 'utf8').replace(/\r\n/g, '\n');
}

// `position_to_enum` in mason-core is the source of truth.
function rustPositions(): Array<[string, number]> {
  const source = read('crates/mason-core/src/utils/mod.rs');
  const block = /pub const fn position_to_enum\(value: Position\) -> i8 \{([\s\S]*?)\n\}/.exec(source);
  if (!block) throw new Error('no position_to_enum found');
  return [...block[1].matchAll(/Position::([A-Za-z]+) => (\d+)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
}

const REFERENCE = rustPositions();
const NAMES = REFERENCE.map(([name]) => name);
const CSS_NAMES = NAMES.map((name) => name.toLowerCase());

describe('the Position enum', () => {
  it('covers the five CSS position values, numbered from zero', () => {
    expect(NAMES).toEqual(['Static', 'Relative', 'Absolute', 'Fixed', 'Sticky']);
    expect(REFERENCE.map(([, value]) => value)).toEqual(REFERENCE.map((_, index) => index));
  });

  it('round-trips through position_from_enum', () => {
    const source = read('crates/mason-core/src/utils/mod.rs');
    const block = /pub const fn position_from_enum\(value: i8\) -> Option<Position> \{([\s\S]*?)\n\}/.exec(source);
    if (!block) throw new Error('no position_from_enum found');
    const parsed = [...block[1].matchAll(/(\d+) => Some\(Position::([A-Za-z]+)\)/g)].map((m) => [m[2], Number(m[1])] as [string, number]);
    expect(parsed).toEqual(REFERENCE);
  });

  it('agrees with the Kotlin Position enum', () => {
    const source = read(`${pkg}/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/enums/Position.kt`);
    const block = /enum class Position\(val value: Byte\) \{([\s\S]*?);/.exec(source);
    if (!block) throw new Error('no Kotlin Position enum found');
    const declared = [...block[1].matchAll(/([A-Z][A-Za-z0-9]*)\s*\(\s*(\d+)\s*\)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
    expect(declared).toEqual(REFERENCE);

    const from = [...source.matchAll(/(\d+)\.toByte\(\) -> ([A-Z][A-Za-z0-9]*)/g)].map((m) => [m[2], Number(m[1])] as [string, number]);
    expect(from).toEqual(REFERENCE);
  });

  it('agrees with the Swift Position enum', () => {
    const source = read(`${pkg}/src-native/mason-ios/Mason/Mason/Enums.swift`);
    // Enums.swift holds many enums, so scope to this one before matching cases.
    const enumBlock = /@objc\(MasonPosition\)\npublic enum Position: Int, RawRepresentable \{([\s\S]*?)\n\}/.exec(source);
    if (!enumBlock) throw new Error('no Swift Position enum found');
    const body = enumBlock[1];

    const declared = [...body.matchAll(/^\s*case ([A-Za-z][A-Za-z0-9]*)\s*$/gm)].map((m) => m[1]);
    expect(declared).toEqual(NAMES);

    // Swift's raw values come from a hand-written switch, not declaration order.
    const rawValue = /public var rawValue: RawValue \{([\s\S]*?)\n  \}/.exec(body);
    if (!rawValue) throw new Error('no Position rawValue switch found');
    const raw = [...rawValue[1].matchAll(/case \.([A-Za-z][A-Za-z0-9]*):\s*\n\s*return (\d+)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
    expect(raw).toEqual(REFERENCE);

    const init = /public init\?\(rawValue: RawValue\) \{([\s\S]*?)\n  \}/.exec(body);
    if (!init) throw new Error('no Position init?(rawValue:) found');
    const parsed = [...init[1].matchAll(/case (\d+):\s*\n\s*self = \.([A-Za-z][A-Za-z0-9]*)/g)].map((m) => [m[2], Number(m[1])] as [string, number]);
    expect(parsed).toEqual(REFERENCE);
  });

  it('agrees with every PositionType mirror in TypeScript', () => {
    for (const file of [`${pkg}/utils/index.d.ts`, `${pkg}/utils/index.ios.ts`, `${pkg}/utils/index.android.ts`, `${pkg}/utils/index.windows.ts`]) {
      const block = /enum PositionType \{([\s\S]*?)\n\}/.exec(read(file));
      if (!block) throw new Error(`no PositionType enum in ${file}`);
      const declared = [...block[1].matchAll(/([A-Za-z][A-Za-z0-9]*)\s*=\s*(\d+)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
      expect(declared, file).toEqual(REFERENCE);
    }
  });

  it('agrees with the Windows IDL enum', () => {
    const block = /enum Position\s*\{([\s\S]*?)\};/.exec(read(`${pkg}/src-native/windows/Mason/MasonEnums.idl`));
    if (!block) throw new Error('no Position enum in MasonEnums.idl');
    const declared = [...block[1].matchAll(/([A-Za-z][A-Za-z0-9]*)\s*=\s*(\d+)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
    expect(declared).toEqual(REFERENCE);
  });

  it('writes and reads every keyword through the TypeScript style API', () => {
    const t = styleUnderTest();
    for (const [name, index] of REFERENCE) {
      const keyword = name.toLowerCase() as typeof t.style.position;
      t.style.position = keyword;
      expect(t.getInt8(styleKey('POSITION')), keyword).toBe(index);
      expect(t.style.position).toBe(keyword);
    }
  });

  it('uses the Rust position codes in the shared keyword schema', () => {
    const { keywords } = parseSchema(read('tools/scripts/style-keys/style-keys.schema'));
    const entry = keywords.find((entry) => entry.properties.includes('position'));
    expect([...entry.values.entries()]).toEqual(CSS_NAMES.map((name, index) => [name, { code: index, html: index }]));
  });

  it('defaults to static, as on the web', () => {
    // The style buffer is zero-initialised, so the zero value has to be the CSS initial value.
    expect(REFERENCE[0]).toEqual(['Static', 0]);
    expect(read(`${pkg}/properties.ts`)).toContain("cssName: 'position',\n  defaultValue: 'static',");
  });
});
