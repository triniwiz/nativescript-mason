// Stand-in for masonkit's `./utils` in Node tests.
//
// `utils/` is platform-split (index.android.ts / index.ios.ts) with only a
// shared index.d.ts, and both implementations import `../common`, which pulls in
// the whole NativeScript UI layer. So it has to be aliased away.
//
// The enums are read out of the real index.d.ts at load time rather than
// re-typed here — a hand-copied table would be a fifth place these values live
// and would drift silently.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DTS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/nativescript-masonkit/utils/index.d.ts');

function readConstEnums(source: string): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  const enumRe = /export const enum (\w+)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = enumRe.exec(source)) !== null) {
    const members: Record<string, number> = {};
    for (const [, name, value] of match[2].matchAll(/(\w+)\s*=\s*(-?\d+)/g)) {
      members[name] = Number(value);
    }
    out[match[1]] = members;
  }
  return out;
}

const enums = readConstEnums(readFileSync(DTS, 'utf8'));

function requireEnum(name: string): Record<string, number> {
  const found = enums[name];
  if (!found || Object.keys(found).length === 0) {
    throw new Error(`utils-stub: no "export const enum ${name}" found in ${DTS}`);
  }
  return found;
}

export const AlignContent = requireEnum('AlignContent');
export const AlignItems = requireEnum('AlignItems');
export const AlignSelf = requireEnum('AlignSelf');
export const JustifyContent = requireEnum('JustifyContent');
export const JustifyItems = requireEnum('JustifyItems');
export const JustifySelf = requireEnum('JustifySelf');
export const Float = requireEnum('Float');
export const Clear = requireEnum('Clear');
export const FlexWrap = requireEnum('FlexWrap');
export const FlexDirection = requireEnum('FlexDirection');
export const PositionType = requireEnum('PositionType');

// `GridTemplates` is an interface in the real module; only present so a value
// import of the name resolves.
export const GridTemplates = {};

// The View-taking setters/getters need a live native node, so they are inert
// here. Grid track parsing is covered separately once the pure parsers are
// lifted out of the two platform files.
export function _parseGridTemplates(_value: string): any[] {
  return [];
}
export function _parseGridAutoRowsColumns(_value: string): any[] {
  return [];
}
export function _parseGridLine(_value: any): { value: number; type: number } {
  return { value: 0, type: 0 };
}
export function _setGridTemplateRows(..._args: any[]): void {}
export function _setGridTemplateColumns(..._args: any[]): void {}
export function _getGridTemplateRows(..._args: any[]): any {
  return undefined;
}
export function _getGridTemplateColumns(..._args: any[]): any {
  return undefined;
}
export function _setGridAutoRows(..._args: any[]): void {}
export function _setGridAutoColumns(..._args: any[]): void {}
export function _forceStyleUpdate(..._args: any[]): void {}
