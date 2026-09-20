import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The `Position` values are a wire format: they cross the JNI and FFI boundaries
// as a single byte written into the style buffer at `StyleKeys.POSITION`. Every
// language keeps its own hand-written copy of the mapping, so a copy that drifts
// does not fail to build: it silently renders the wrong position, and a stale
// prebuilt AAR/xcframework makes it look like a layout bug. This pins them
// together. Rust is the reference because it is what taffy actually reads.

const root = resolve(__dirname, '../..');
const pkg = 'packages/nativescript-masonkit';

function read(file: string): string {
  return readFileSync(resolve(root, file), 'utf8');
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

  it("maps every value in style.ts's getter and setter", () => {
    const source = read(`${pkg}/style.ts`);

    const getter = /get position\(\) \{([\s\S]*?)\n  \}/.exec(source);
    if (!getter) throw new Error('no position getter in style.ts');
    const read_ = [...getter[1].matchAll(/case (\d+):\s*\n\s*return '([a-z]+)'/g)].map((m) => [m[2], Number(m[1])] as [string, number]);
    expect(read_).toEqual(CSS_NAMES.map((name, index) => [name, index]));

    const setter = /set position\(value: ([\s\S]*?)\n  \}/.exec(source);
    if (!setter) throw new Error('no position setter in style.ts');
    const written = [...setter[1].matchAll(/case '([a-z]+)':\s*\n\s*position = (\d+)/g)].map((m) => [m[1], Number(m[2])] as [string, number]);
    expect(written).toEqual(CSS_NAMES.map((name, index) => [name, index]));
  });

  it('accepts every CSS keyword in both HTML parsers', () => {
    const kotlin = /"position" -> when \(value\) \{([\s\S]*?)\n      \}/.exec(read(`${pkg}/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/HTMLParser.kt`));
    if (!kotlin) throw new Error('no position case in HTMLParser.kt');
    expect([...kotlin[1].matchAll(/"([a-z]+)" -> style\.position = Position\.([A-Za-z]+)/g)].map((m) => [m[1], m[2]])).toEqual(NAMES.map((name) => [name.toLowerCase(), name]));

    const swift = /case "position":\s*\n\s*switch value \{([\s\S]*?)\n      \}/.exec(read(`${pkg}/src-native/mason-ios/Mason/Mason/HTMLParser.swift`));
    if (!swift) throw new Error('no position case in HTMLParser.swift');
    expect([...swift[1].matchAll(/case "([a-z]+)": style\.position = \.([A-Za-z]+)/g)].map((m) => [m[1], m[2]])).toEqual(NAMES.map((name) => [name.toLowerCase(), name]));
  });

  it("defaults to static, as on the web", () => {
    // The style buffer is zero-initialised, so the zero value has to be the CSS initial value.
    expect(REFERENCE[0]).toEqual(['Static', 0]);
    expect(read(`${pkg}/properties.ts`)).toContain("cssName: 'position',\n  defaultValue: 'static',");
  });
});
