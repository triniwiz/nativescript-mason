import { afterEach, describe, expect, it, vi } from 'vitest';
import { CoreTypes, unsetValue } from '@nativescript/core';
import { KeyframeAnimation, KeyframeAnimationInfo } from '@nativescript/core/ui/animation/keyframe-animation';
import { CssAnimationParser } from '@nativescript/core/ui/styling/css-animation-parser';
import { easing, interpolatePositionList, interpolateSizeList, sampleTrack } from './css-keyframes';
import { maskPositionProperty, maskSizeProperty } from './properties';

describe('interpolating positions', () => {
  it.each([
    ['0% 0%', '100% 0%', 0.25, '25% 0%'],
    ['10px 20px', '30px 40px', 0.5, '20px 30px'],
    ['left top', 'right bottom', 0.5, '50% 50%'],
    ['center', 'left', 0.5, '25% 50%'],
    ['top', 'bottom', 0.5, '50% 50%'],
    ['0 0', '100% 10px', 0.5, '50% 5px'],
    ['0% 0%, 10px 10px', '100% 100%, 20px 20px', 0.5, '50% 50%, 15px 15px'],
  ])('%s → %s at %s', (from, to, t, expected) => {
    expect(interpolatePositionList(from, to, t)).toBe(expected);
  });

  it.each([
    ['10px 0%', '50% 0%'],
    ['right 10px bottom 5px', '0% 0%'],
    ['0% 0%', '0% 0%, 10% 10%'],
  ])("flips halfway when %s and %s can't be mixed", (from, to) => {
    expect(interpolatePositionList(from, to, 0.4)).toBe(from);
    expect(interpolatePositionList(from, to, 0.6)).toBe(to);
  });
});

describe('interpolating sizes', () => {
  it.each([
    ['100% 100%', '250% 100%', 0.5, '175% 100%'],
    ['10px', '30px', 0.5, '20px auto'],
  ])('%s → %s at %s', (from, to, t, expected) => {
    expect(interpolateSizeList(from, to, t)).toBe(expected);
  });

  it('flips cover and contain halfway', () => {
    expect(interpolateSizeList('cover', 'contain', 0.49)).toBe('cover');
    expect(interpolateSizeList('cover', 'contain', 0.51)).toBe('contain');
  });
});

describe('easing', () => {
  it('is linear for linear and spring', () => {
    expect(easing(CoreTypes.AnimationCurve.linear)(0.3)).toBeCloseTo(0.3, 6);
    expect(easing(CoreTypes.AnimationCurve.spring)(0.3)).toBeCloseTo(0.3, 6);
  });

  it('follows the named cubic-bezier curves', () => {
    // CSS ease at x = 0.5 is about 0.8024.
    expect(easing(CoreTypes.AnimationCurve.ease)(0.5)).toBeCloseTo(0.8024, 3);
    expect(easing(CoreTypes.AnimationCurve.easeInOut)(0.5)).toBeCloseTo(0.5, 4);
    expect(easing(CoreTypes.AnimationCurve.easeIn)(0.5)).toBeLessThan(0.5);
  });

  it('reads core cubic-bezier curves', () => {
    expect(easing(CoreTypes.AnimationCurve.cubicBezier(0, 0, 1, 1))(0.3)).toBeCloseTo(0.3, 4);
  });
});

describe('sampling a track', () => {
  const linear = () => (t: number) => t;

  it('starts from the element value when there is no 0% keyframe', () => {
    const track = { interpolate: interpolatePositionList, stops: [[1000, '0% 0%']] as [number, string][] };
    expect(sampleTrack(track, '100% 0%', 1000, 0, linear)).toBe('100% 0%');
    expect(sampleTrack(track, '100% 0%', 1000, 250, linear)).toBe('75% 0%');
    expect(sampleTrack(track, '100% 0%', 1000, 1000, linear)).toBe('0% 0%');
  });

  it('ends at the element value when there is no 100% keyframe', () => {
    const track = {
      interpolate: interpolatePositionList,
      stops: [
        [0, '0% 0%'],
        [500, '50% 0%'],
      ] as [number, string][],
    };
    expect(sampleTrack(track, '0% 0%', 1000, 750, linear)).toBe('25% 0%');
  });

  it("applies each interval's curve", () => {
    const track = {
      interpolate: interpolatePositionList,
      stops: [
        [0, '0% 0%'],
        [1000, '100% 0%'],
      ] as [number, string][],
    };
    expect(parseFloat(sampleTrack(track, '0% 0%', 1000, 500, () => easing(CoreTypes.AnimationCurve.ease)))).toBeCloseTo(80.24, 2);
  });
});

describe('playing keyframes core has no native animation for', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function viewWithStyle() {
    const sets: Record<string, unknown[]> = {};
    const style: Record<string, unknown> = { maskPosition: '100% 0%' };
    const values: Record<string, unknown> = {};
    const record = (key: string) => ({
      configurable: true,
      get: () => values[key],
      set: (value: unknown) => {
        (sets[key] ??= []).push(value);
        values[key] = value;
      },
    });
    Object.defineProperty(style, maskPositionProperty.keyframe, record(maskPositionProperty.keyframe));
    Object.defineProperty(style, maskSizeProperty.keyframe, record(maskSizeProperty.keyframe));
    return { view: { style } as any, sets };
  }

  function animation(css: string, info: Partial<KeyframeAnimationInfo>) {
    const keyframes = CssAnimationParser.keyframesArrayFromCSS([{ values: ['100%'], declarations: [{ property: 'mask-position', value: css }] }] as any);
    return KeyframeAnimation.keyframeAnimationFromInfo(Object.assign(new KeyframeAnimationInfo(), { name: 'wave', duration: 1000, curve: CoreTypes.AnimationCurve.linear, keyframes }, info));
  }

  it('keeps mask-position in the keyframes', () => {
    const keyframes = CssAnimationParser.keyframesArrayFromCSS([{ values: ['100%'], declarations: [{ property: 'mask-position', value: '0% 0%' }] }] as any);
    expect(keyframes[0].declarations).toEqual([{ property: 'maskPosition', value: '0% 0%' }]);
  });

  it('moves mask-position on its own timeline and resets it after', async () => {
    vi.useFakeTimers();
    const { view, sets } = viewWithStyle();
    const done = animation('0% 0%', { iterations: 1 }).play(view);
    await vi.advanceTimersByTimeAsync(500);
    const halfway = sets[maskPositionProperty.keyframe].at(-1) as string;
    expect(parseFloat(halfway)).toBeGreaterThan(40);
    expect(parseFloat(halfway)).toBeLessThan(60);
    await vi.advanceTimersByTimeAsync(600);
    await done;
    expect(sets[maskPositionProperty.keyframe].at(-1)).toBe(unsetValue);
  });

  it('keeps the last value with animation-fill-mode: forwards', async () => {
    vi.useFakeTimers();
    const { view, sets } = viewWithStyle();
    const done = animation('0% 0%', { iterations: 1, isForwards: true }).play(view);
    await vi.advanceTimersByTimeAsync(1100);
    await done;
    expect(sets[maskPositionProperty.keyframe].at(-1)).toBe('0% 0%');
  });

  it('repeats until cancelled, then resets', async () => {
    vi.useFakeTimers();
    const { view, sets } = viewWithStyle();
    const wave = animation('0% 0%', { iterations: Number.POSITIVE_INFINITY });
    wave.play(view);
    await vi.advanceTimersByTimeAsync(1250);
    expect(parseFloat(sets[maskPositionProperty.keyframe].at(-1) as string)).toBeGreaterThan(60);
    wave.cancel();
    expect(sets[maskPositionProperty.keyframe].at(-1)).toBe(unsetValue);
  });
});
