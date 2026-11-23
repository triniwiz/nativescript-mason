import { afterEach, describe, expect, it, vi } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';

function inputStyle() {
  const { style } = styleUnderTest();
  const native = {};
  Reflect.set(style, 'nativeView', native);
  const calls = vi.fn();
  vi.stubGlobal('NativeScript', { Mason: { Css: { SetCssEffects: calls } } });
  return { style, calls, native };
}

afterEach(() => vi.unstubAllGlobals());

describe('text-shadow on a Windows <input>', () => {
  it('sends the whole outline to the native CSS batch', () => {
    const { style, calls, native } = inputStyle();
    const outline = '2.6px 2.6px 0 #2b2340, -2.6px -2.6px 0 #2b2340, 2.6px -2.6px 0 #2b2340, -2.6px 2.6px 0 #2b2340, 0 4.4px 0 #2b2340, 0 7.9px 13.2px rgba(10,6,24,.45)';
    style.textShadow = outline;
    expect(style.textShadow).toBe(outline);
    expect(calls).toHaveBeenCalledTimes(1);
    expect(calls.mock.calls[0][0]).toBe(native);
    expect(JSON.parse(calls.mock.calls[0][1]).slice(0, 2)).toEqual(['text-shadow', outline]);
  });

  it('sends an explicit clear for none', () => {
    const { style, calls } = inputStyle();
    style.textShadow = '0 1px 0 red';
    expect(style.textShadow).toBe('0 1px 0 red');
    style.textShadow = 'none';
    expect(style.textShadow).toBe('none');
    expect(calls).toHaveBeenCalledTimes(2);
    expect(JSON.parse(calls.mock.calls[1][1]).slice(0, 2)).toEqual(['text-shadow', 'none']);
  });
});
