import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { clearCssDiagnostics, getCssDiagnostics, setCssDiagnostics } from './diagnostics';
import { gridParts } from './properties';
import { gridAutoFlowFromString, resolveGridTrackUnits } from './style';
import { setCssUnitContext } from './units';

describe('grid-auto-flow keywords', () => {
  it.each([
    ['row', 0],
    ['column', 1],
    ['dense', 2],
    ['row dense', 2],
    ['dense row', 2],
    ['column dense', 3],
    ['dense column', 3],
    ['  Column   DENSE ', 3],
  ])('%s', (value, expected) => {
    expect(gridAutoFlowFromString(value)).toBe(expected);
  });

  it.each(['', 'row column', 'dense dense', 'row dense column', 'sideways', 'column column'])('rejects %j', (value) => {
    expect(gridAutoFlowFromString(value)).toBeUndefined();
  });
});

describe('grid placement shorthands fill omitted ends', () => {
  it('copies a lone custom ident into the end', () => {
    expect(gridParts('main', 2)).toEqual(['main', 'main']);
  });

  it.each(['2', 'main 2', 'span 2', 'auto', 'span main'])('uses auto after %j', (value) => {
    expect(gridParts(value, 2)).toEqual([value, 'auto']);
  });

  it('grid-area copies the matching start, per CSS Grid', () => {
    expect(gridParts('a', 4)).toEqual(['a', 'a', 'a', 'a']);
    expect(gridParts('a / b', 4)).toEqual(['a', 'b', 'a', 'b']);
    expect(gridParts('a / b / c', 4)).toEqual(['a', 'b', 'c', 'b']);
    expect(gridParts('2', 4)).toEqual(['2', 'auto', 'auto', 'auto']);
    expect(gridParts('1 / 2', 4)).toEqual(['1', '2', 'auto', 'auto']);
  });

  it('throws on too many or empty parts', () => {
    expect(() => gridParts('1 / 2 / 3', 2)).toThrow();
    expect(() => gridParts('1 / ', 2)).toThrow();
  });
});

describe('grid track lists resolve relative units', () => {
  beforeEach(() => {
    setScreenScale(2);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
  });

  afterEach(() => {
    setCssDiagnostics(false);
    clearCssDiagnostics();
  });

  it('leaves units the native parser reads alone', () => {
    const value = '[a] 100px 1fr 20% minmax(10dip, 1fr) repeat(auto-fill, minmax(100px, 1fr)) [b]';
    expect(resolveGridTrackUnits(value)).toBe(value);
  });

  it('resolves rem, em, pt and viewport units to CSS px', () => {
    expect(resolveGridTrackUnits('2rem 1fr')).toBe('32px 1fr');
    expect(resolveGridTrackUnits('2em 1fr', 10)).toBe('20px 1fr');
    expect(resolveGridTrackUnits('10vw 50vh 10vmin 10vmax')).toBe('40px 400px 40px 80px');
    expect(resolveGridTrackUnits('minmax(10rem, 1fr) fit-content(5rem)')).toBe('minmax(160px, 1fr) fit-content(80px)');
    expect(resolveGridTrackUnits('repeat(auto-fill, minmax(12.5rem, 1fr))')).toBe('repeat(auto-fill, minmax(200px, 1fr))');
  });

  it('keeps line names that look like units untouched', () => {
    expect(resolveGridTrackUnits('[rem] 1rem [em-end] 1fr')).toBe('[rem] 16px [em-end] 1fr');
  });

  it('evaluates math functions', () => {
    expect(resolveGridTrackUnits('calc(1rem + 4px) 1fr')).toBe('20px 1fr');
    expect(resolveGridTrackUnits('minmax(min(10rem, 100px), 1fr)')).toBe('minmax(100px, 1fr)');
    expect(resolveGridTrackUnits('clamp(1rem, 10vw, 100px)')).toBe('40px');
  });

  it('reports a math function that mixes % with a length', () => {
    setCssDiagnostics(true);
    clearCssDiagnostics();
    expect(resolveGridTrackUnits('calc(100% - 20px) 1fr')).toBe('calc(100% - 20px) 1fr');
    expect(getCssDiagnostics().some((d) => d.name === 'grid track list')).toBe(true);
  });
});
