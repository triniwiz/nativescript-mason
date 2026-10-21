import { beforeEach, describe, expect, it, vi } from 'vitest';

type Units = typeof import('./units');

describe('units viewport', () => {
  let units: Units;
  beforeEach(async () => {
    vi.resetModules();
    units = await import('./units');
  });

  it('reads a provider live, once per JS turn', async () => {
    let size = { width: 400, height: 800 };
    const provider = vi.fn(() => size);
    units.setViewportProvider(provider);
    expect(units.cssUnits.viewportWidth).toBe(400);
    expect(units.cssUnits.viewportHeight).toBe(800);
    expect(provider).toHaveBeenCalledTimes(1);

    // Rotated: the next turn sees the new size.
    size = { width: 800, height: 400 };
    expect(units.cssUnits.viewportWidth).toBe(400);
    await Promise.resolve();
    expect(units.cssUnits.viewportWidth).toBe(800);
    expect(units.cssUnits.viewportHeight).toBe(400);
  });

  it('lets setCssUnitContext override the provider, before or after it is installed', () => {
    units.setCssUnitContext({ viewportWidth: 320 });
    units.setViewportProvider(() => ({ width: 400, height: 800 }));
    expect(units.cssUnits.viewportWidth).toBe(320);
    expect(units.cssUnits.viewportHeight).toBe(800);
    units.setCssUnitContext({ viewportHeight: 600 });
    expect(units.cssUnits.viewportHeight).toBe(600);
  });

  it('stays 0 with neither', () => {
    expect(units.cssUnits.viewportWidth).toBe(0);
    expect(units.cssUnits.viewportHeight).toBe(0);
  });
});
