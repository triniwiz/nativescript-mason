import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';

const calls: Array<[string, unknown[]]> = [];
const record =
  (name: string) =>
  (...args: unknown[]) => {
    calls.push([name, args]);
  };

beforeEach(() => {
  calls.length = 0;
  (globalThis as any).NativeScript = {
    Mason: { Css: { SetBackgroundLayers: record('layers'), ApplyBackgroundImage: record('image'), ApplyLinearGradient: record('linear'), ApplyRadialGradientAt: record('radial'), ClearBackground: record('clear') } },
  };
});

afterEach(() => {
  delete (globalThis as any).NativeScript;
});

describe('url() backgrounds', () => {
  it('draws an SVG data URL holding gradient elements as an image', () => {
    const t = styleUnderTest();
    const svg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><linearGradient id='g'/><circle r='5' fill='url(%23g)'/></svg>";
    (t.style as any).applyWindowsCssString('background', `url("${svg}") center / contain no-repeat`);
    const layers = calls.find(([name]) => name === 'layers');
    expect(layers).toBeDefined();
    expect(JSON.parse(layers![1][1] as string).l[0].i).toEqual({ t: 'img', src: svg });
  });
});
