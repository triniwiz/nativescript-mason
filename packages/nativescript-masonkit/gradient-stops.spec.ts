import { describe, expect, it } from 'vitest';
import { expandColorStops, resolveStopPositions } from './gradient-stops';

// Same cases as GradientStopsTest.kt, so Windows places stops the way Android does.
describe('expandColorStops', () => {
  it('turns two positions into two stops of one colour', () => {
    expect(expandColorStops(['blue', 'red 10% 30%', 'green'])).toEqual(['blue', 'red 10%', 'red 30%', 'green']);
  });

  it('keeps colour functions with spaces whole', () => {
    expect(expandColorStops(['rgb(0, 0, 255) 0% 50%'])).toEqual(['rgb(0, 0, 255) 0%', 'rgb(0, 0, 255) 50%']);
  });

  it('leaves single-position stops and hints untouched', () => {
    const stops = ['red 10%', '40%', 'rgba(0, 0, 0, 0.5)'];
    expect(expandColorStops(stops)).toEqual(stops);
  });
});

describe('resolveStopPositions', () => {
  const close = (actual: number[], expected: number[]) => expected.forEach((e, i) => expect(actual[i]).toBeCloseTo(e, 6));

  it('spreads unpositioned stops evenly', () => {
    close(resolveStopPositions([null, null, null]), [0, 0.5, 1]);
  });

  it('spreads unpositioned stops between their neighbours', () => {
    close(resolveStopPositions([null, 0.8, null, null]), [0, 0.8, 0.9, 1]);
    close(resolveStopPositions([0.1, null, null]), [0.1, 0.55, 1]);
  });

  it('moves a position before an earlier one up to it', () => {
    close(resolveStopPositions([0.5, 0.2, null]), [0.5, 0.5, 1]);
  });

  it('puts a lone stop at the start', () => {
    close(resolveStopPositions([null]), [0]);
  });
});
