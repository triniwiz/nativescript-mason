import { describe, expect, it } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';

// The native Input takes text-shadow through SetTextShadow, encoded as for Text: one
// "inset,x,y,blur,spread,argb" entry per shadow, ';'-separated.
function inputStyle() {
  const t = styleUnderTest();
  const calls: string[] = [];
  (t.style as any).nativeView = { SetTextShadow: (spec: string) => calls.push(spec) };
  return { style: t.style as any, calls };
}

const parse = (spec: string) => spec.split(';').map((entry) => entry.split(',').map(Number));

describe('text-shadow on a Windows <input>', () => {
  it('hands every layer of an outline to the native input', () => {
    const { style, calls } = inputStyle();
    style.textShadow = '2.6px 2.6px 0 #2b2340, -2.6px -2.6px 0 #2b2340, 2.6px -2.6px 0 #2b2340, -2.6px 2.6px 0 #2b2340, 0 4.4px 0 #2b2340, 0 7.9px 13.2px rgba(10,6,24,.45)';
    expect(calls).toHaveLength(1);
    const layers = parse(calls[0]);
    expect(layers).toHaveLength(6);
    const ink = 0xff2b2340;
    expect(layers.slice(0, 5)).toEqual([
      [0, 2.6, 2.6, 0, 0, ink],
      [0, -2.6, -2.6, 0, 0, ink],
      [0, 2.6, -2.6, 0, 0, ink],
      [0, -2.6, 2.6, 0, 0, ink],
      [0, 0, 4.4, 0, 0, ink],
    ]);
    const [inset, x, y, blur, spread, argb] = layers[5];
    expect([inset, x, y, blur, spread]).toEqual([0, 0, 7.9, 13.2, 0]);
    expect(argb >>> 24).toBe(Math.round(0.45 * 255));
    expect(argb & 0xffffff).toBe(0x0a0618);
  });

  it('clears the shadow with an empty list', () => {
    const { style, calls } = inputStyle();
    style.textShadow = '0 1px 0 red';
    style.textShadow = 'none';
    expect(calls).toHaveLength(2);
    expect(calls[1]).toBe('');
  });

  it('keeps the value for the getter', () => {
    const { style } = inputStyle();
    style.textShadow = '0 1px 0 red';
    expect(style.textShadow).toBe('0 1px 0 red');
  });
});
