import { describe, expect, it } from 'vitest';
import { pathCommands, PATH_CLOSE, PATH_CUBIC, PATH_LINE, PATH_MOVE, PATH_QUAD } from './windows-svg-path';

const round = (list: number[]) => list.map((n) => Math.round(n * 1000) / 1000);

describe('pathCommands', () => {
  it('reads absolute and relative lines, H and V', () => {
    expect(pathCommands('M10 10 L20 10 l0 10 H5 v-10 h2 V0 Z')).toEqual([PATH_MOVE, 10, 10, PATH_LINE, 20, 10, PATH_LINE, 20, 20, PATH_LINE, 5, 20, PATH_LINE, 5, 10, PATH_LINE, 7, 10, PATH_LINE, 7, 0, PATH_CLOSE]);
  });

  it('treats pairs after a moveto as linetos', () => {
    expect(pathCommands('m1 1 2 0 0 2z')).toEqual([PATH_MOVE, 1, 1, PATH_LINE, 3, 1, PATH_LINE, 3, 3, PATH_CLOSE]);
  });

  it('splits compact numbers', () => {
    expect(pathCommands('M0-1.5.5-0L1e1,2')).toEqual([PATH_MOVE, 0, -1.5, PATH_LINE, 0.5, 0, PATH_LINE, 10, 2]);
  });

  it('reflects control points for S and T', () => {
    expect(pathCommands('M0 0 C0 10 10 10 10 0 S20 -10 20 0')).toEqual([PATH_MOVE, 0, 0, PATH_CUBIC, 0, 10, 10, 10, 10, 0, PATH_CUBIC, 10, -10, 20, -10, 20, 0]);
    expect(pathCommands('M0 0 Q5 10 10 0 T20 0')).toEqual([PATH_MOVE, 0, 0, PATH_QUAD, 5, 10, 10, 0, PATH_QUAD, 15, -10, 20, 0]);
    // S without a cubic before it uses the current point.
    expect(pathCommands('M0 0 L5 5 S10 10 15 5')).toEqual([PATH_MOVE, 0, 0, PATH_LINE, 5, 5, PATH_CUBIC, 5, 5, 10, 10, 15, 5]);
  });

  it('turns arcs into cubics that end on the endpoint', () => {
    const half = pathCommands('M0 10 A10 10 0 0 1 20 10');
    expect(half.filter((n, i) => i > 2 && n === PATH_CUBIC && (i - 3) % 7 === 0)).toHaveLength(2);
    expect(round(half.slice(-2))).toEqual([20, 10]);
    // The midpoint of a clockwise half circle from the left is the top.
    expect(round(half.slice(8, 10))).toEqual([10, 0]);
  });

  it('reads compact arc flags', () => {
    const arc = pathCommands('M0 0a5 5 0 105 5');
    expect(arc[3]).toBe(PATH_CUBIC);
    expect(round(arc.slice(-2))).toEqual([5, 5]);
  });

  it('draws a zero-radius arc as a line and skips a zero-length one', () => {
    expect(pathCommands('M0 0 A0 5 0 0 1 10 0')).toEqual([PATH_MOVE, 0, 0, PATH_LINE, 10, 0]);
    expect(pathCommands('M0 0 A5 5 0 0 1 0 0')).toEqual([PATH_MOVE, 0, 0]);
  });

  it('keeps what came before an error, and needs a leading moveto', () => {
    expect(pathCommands('M0 0 L10 0 L5')).toEqual([PATH_MOVE, 0, 0, PATH_LINE, 10, 0]);
    expect(pathCommands('M0 0 L10 0 X 5 5')).toEqual([PATH_MOVE, 0, 0, PATH_LINE, 10, 0]);
    expect(pathCommands('L10 0')).toEqual([]);
    expect(pathCommands('')).toEqual([]);
  });
});
