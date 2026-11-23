import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';

const requests: Array<{ writes: string[]; units: number[]; appRoot: string }> = [];
let parsedColor = -1;

beforeEach(() => {
  requests.length = 0;
  parsedColor = -1;
  (globalThis as any).NativeScript = {
    Mason: { Css: { SetCssBackground: (_view: unknown, request: string) => {
      requests.push(JSON.parse(request));
      return parsedColor;
    } } },
  };
});

afterEach(() => {
  delete (globalThis as any).NativeScript;
});

function backgroundStyle() {
  const { style } = styleUnderTest();
  Reflect.set(style, 'nativeView', {});
  return style;
}

describe('Windows backgrounds', () => {
  it('flushes the unmodified gradient before returning a synchronous getter', () => {
    const style = backgroundStyle();
    const css = 'linear-gradient(to right in oklab, red, blue)';
    style.background = css;
    expect(requests).toHaveLength(0);
    expect(style.background).toBe(css);
    expect(requests[0]?.writes).toEqual(['background', css, '0']);
  });

  it('passes the original SVG URL and app root to the native parser', () => {
    const style = backgroundStyle();
    const svg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><linearGradient id='g'/><circle r='5' fill='url(%23g)'/></svg>";
    const css = `url("${svg}") center / contain no-repeat`;
    style.background = css;
    expect(style.background).toBe(css);
    expect(requests[0]?.writes).toEqual(['background', css, '0']);
    expect(requests[0]?.appRoot).toMatch(/\\app\\$/);
  });

  it('sends all writes in setter order in one call per turn', async () => {
    const style = backgroundStyle();
    Reflect.set(style, 'inBatch', false);
    const css = 'url(~/a.png) center / cover no-repeat, none';
    style.background = css;
    style.backgroundPositionX = '20%';
    style.backgroundRepeat = 'round, space';
    style.backgroundPosition = 'right bottom';
    style.backgroundPositionY = 'bottom 10px';
    expect(requests).toHaveLength(0);
    await Promise.resolve();
    expect(requests).toHaveLength(1);
    expect(requests[0]?.writes).toEqual([
      'background', css, '0',
      'background-position-x', '20%', '',
      'background-repeat', 'round, space', '',
      'background-position', 'right bottom', '',
      'background-position-y', 'bottom 10px', '',
    ]);

    style.backgroundSize = 'contain';
    await Promise.resolve();
    expect(requests[1]?.writes).toEqual(['background-size', 'contain', '']);
  });

  it('reads the Rust shorthand fill and flushes it before a typed fill write', () => {
    const style = backgroundStyle();
    parsedColor = 0xff123456;
    style.background = '#123456';
    expect(style.backgroundColor).toBe(0xff123456);

    parsedColor = -1;
    style.backgroundClip = 'text';
    expect(style.backgroundColor).toBe(0xff123456);

    parsedColor = 0xffabcdef;
    style.background = '#abcdef';
    style.backgroundColor = 0xff112233;
    expect(style.backgroundColor).toBe(0xff112233);
    expect(requests.map((request) => request.writes[0])).toEqual(['background', 'background-clip', 'background']);
  });
});
