import { afterEach, describe, expect, it } from 'vitest';
import { layout } from '@nativescript/core/utils';
import { displayDensity, masonLayout, setDisplayDensity } from './display-density';

describe('display density', () => {
  afterEach(() => setDisplayDensity(0));

  it("follows core's density until a change is recorded", () => {
    expect(displayDensity()).toBe(layout.getDisplayDensity());
  });

  it('converts with the density recorded after a configuration change', () => {
    const core = layout.getDisplayDensity();
    setDisplayDensity(core + 0.5);
    expect(masonLayout.toDevicePixels(10)).toBeCloseTo(10 * (core + 0.5));
    expect(masonLayout.toDeviceIndependentPixels(10 * (core + 0.5))).toBeCloseTo(10);
    setDisplayDensity(core);
    expect(displayDensity()).toBe(core);
  });
});
