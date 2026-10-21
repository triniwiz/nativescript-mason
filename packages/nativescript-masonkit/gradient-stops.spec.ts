import { describe, expect, it } from 'vitest';
import { expandColorStops, radialReach, repeatRadial, repeatStops, resolveStopPositions } from './gradient-stops';

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

// Same cases as MaskParsingTest.kt's repeatGradientStops tests.
describe('repeatStops', () => {
  const a = 0xff000000;
  const b = 0x00000000;

  it('tiles a hard-stop run across 0..1', () => {
    const { offsets, colors } = repeatStops([0, 0.25, 0.25, 0.5], [a, a, b, b]);
    expect(offsets[0]).toBe(0);
    expect(offsets[offsets.length - 1]).toBe(1);
    for (let i = 1; i < offsets.length; i++) expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]);
    expect(colors[0]).toBe(a);
    expect(colors[colors.length - 1]).toBe(b);
    const at50 = offsets.flatMap((o, i) => (o === 0.5 ? [colors[i]] : []));
    expect(at50).toContain(a);
    expect(at50).toContain(b);
    expect(offsets.filter((o) => o === 0.75).length).toBeGreaterThanOrEqual(2);
  });

  it('cuts mid-period runs with the interpolated colour', () => {
    const red = 0xffff0000;
    const blue = 0xff0000ff;
    const { offsets, colors } = repeatStops([0.1, 0.5], [red, blue]);
    expect(offsets[0]).toBe(0);
    expect(offsets[offsets.length - 1]).toBe(1);
    // 0 sits 0.3 into the run [-0.3, 0.1]: three quarters of the way to blue.
    const first = colors[0];
    expect(first >>> 24).toBe(0xff);
    expect((first >>> 16) & 0xff).toBeGreaterThanOrEqual(60);
    expect((first >>> 16) & 0xff).toBeLessThanOrEqual(70);
    expect(first & 0xff).toBeGreaterThanOrEqual(185);
    expect(first & 0xff).toBeLessThanOrEqual(195);
  });

  it('leaves a zero period alone', () => {
    expect(repeatStops([0.5, 0.5], [1, 2])).toEqual({ offsets: [0.5, 0.5], colors: [1, 2] });
  });

  it('caps the stop count for tiny periods', () => {
    expect(repeatStops([0, 0.00011], [a, b]).offsets.length).toBeLessThanOrEqual(2050);
  });

  it('tiles past 1 when asked', () => {
    const { offsets } = repeatStops([0, 0.5], [a, b], 2);
    expect(offsets[offsets.length - 1]).toBe(2);
    expect(offsets).toContain(1.5);
  });
});

describe('repeatRadial', () => {
  it('reaches the farthest corner', () => {
    expect(radialReach(0.5, 0.5, Math.SQRT1_2, Math.SQRT1_2)).toBeCloseTo(1);
    expect(radialReach(0.5, 0.5, 0.5, 0.5)).toBeCloseTo(Math.SQRT2);
  });

  it('grows the radii and keeps the period in box terms', () => {
    const g = repeatRadial({ cx: 0.5, cy: 0.5, rx: 0.5, ry: 0.5, offsets: [0, 0.25], colors: [0xff000000, 0] });
    expect(g.rx).toBeCloseTo(0.5 * Math.SQRT2);
    expect(g.offsets[g.offsets.length - 1]).toBe(1);
    // A run is 0.25 of the old radius, so 0.125 of the box, in both encodings.
    expect(g.offsets[1] * g.rx).toBeCloseTo(0.125);
  });
});
