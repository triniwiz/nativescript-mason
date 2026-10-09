import { describe, expect, it } from 'vitest';
import { encodeBoxShadows, parseBoxShadows } from './box-shadow';

const px = (token: string) => (token.endsWith('em') ? parseFloat(token) * 16 : parseFloat(token));

describe('parseBoxShadows', () => {
  it('is empty for none', () => {
    expect(parseBoxShadows('none', px)).toEqual([]);
    expect(parseBoxShadows('', px)).toEqual([]);
  });

  it('reads offsets, blur, spread, inset and colour in any order', () => {
    expect(parseBoxShadows('inset 0 4px 10px 2px rgba(0,0,0,0.45)', px)).toEqual([{ inset: true, offsetX: 0, offsetY: 4, blur: 10, spread: 2, color: 'rgba(0,0,0,0.45)' }]);
    expect(parseBoxShadows('#fff 1px 2px', px)).toEqual([{ inset: false, offsetX: 1, offsetY: 2, blur: 0, spread: 0, color: '#fff' }]);
  });

  it('splits a list on commas outside functions', () => {
    const shadows = parseBoxShadows('-6px -6px 0 #fdcb6e, 6px 6px 0 rgb(9, 132, 227)', px);
    expect(shadows.map((s) => s.color)).toEqual(['#fdcb6e', 'rgb(9, 132, 227)']);
  });

  it('resolves em and clamps a negative blur', () => {
    expect(parseBoxShadows('1em 0 -2px red', px)[0]).toMatchObject({ offsetX: 16, blur: 0 });
  });
});

describe('encodeBoxShadows', () => {
  it('writes one record per shadow', () => {
    const encoded = encodeBoxShadows(parseBoxShadows('inset 1px 2px 3px 4px red, 0 0 5px blue', px), (c) => (c === 'red' ? 0xffff0000 : 0xff0000ff));
    expect(encoded).toBe(`1,1,2,3,4,${0xffff0000};0,0,0,5,0,${0xff0000ff}`);
  });
});
