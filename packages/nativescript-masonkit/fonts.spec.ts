import { describe, expect, it } from 'vitest';
import { parseFontFamilyList, pickFontFamily } from './fonts';

describe('parseFontFamilyList', () => {
  it('splits a list and removes quotes', () => {
    expect(parseFontFamilyList(`'Roboto Mono', "Courier New", monospace`)).toEqual(['Roboto Mono', 'Courier New', 'monospace']);
  });

  it('keeps commas inside quotes and collapses unquoted spacing', () => {
    expect(parseFontFamilyList(`"A, B",  Mukta   Mahee ,serif`)).toEqual(['A, B', 'Mukta Mahee', 'serif']);
  });

  it('drops empty entries', () => {
    expect(parseFontFamilyList(` , Caveat,`)).toEqual(['Caveat']);
    expect(parseFontFamilyList('')).toEqual([]);
  });
});

describe('pickFontFamily', () => {
  const installed =
    (...families: string[]) =>
    (family: string) =>
      families.includes(family);

  it('unquotes a single family', () => {
    expect(pickFontFamily(`'Caveat'`, installed('Caveat'))).toBe('Caveat');
  });

  it('takes the first available family in the list', () => {
    expect(pickFontFamily(`'Roboto Mono', Courier, monospace`, installed('Courier'))).toBe('Courier');
    expect(pickFontFamily(`'Roboto Mono', Courier, monospace`, installed('Roboto Mono', 'Courier'))).toBe('Roboto Mono');
  });

  it('treats generic families as always available', () => {
    expect(pickFontFamily(`Missing, cursive`, installed())).toBe('cursive');
  });

  it('falls back to the first family named', () => {
    expect(pickFontFamily(`'Missing One', "Missing Two"`, installed())).toBe('Missing One');
  });

  it('passes keywords and empty values through', () => {
    expect(pickFontFamily('inherit', installed())).toBe('inherit');
    expect(pickFontFamily('', installed())).toBe('');
  });
});
