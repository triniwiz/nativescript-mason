import { describe, expect, it } from 'vitest';
import { gridAutoFlowFromString } from './style';

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
