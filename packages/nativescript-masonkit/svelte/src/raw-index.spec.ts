import { describe, expect, it } from 'vitest';
import { dropStaleDuplicate, rawChildIndex, type SvelteDomNode } from './raw-index';

const el = (id: string): SvelteDomNode => ({ nodeType: 1, nativeView: { id } });
const text = (value: string): SvelteDomNode => ({ nodeType: 3, text: value });
const comment = (): SvelteDomNode => ({ nodeType: 8 });

describe('rawChildIndex', () => {
  it('counts only nodes that already own a slot', () => {
    const a = el('a');
    const t = text('Hello ');
    const b = el('b');
    const slots = new Set<SvelteDomNode>([a, t]);
    expect(rawChildIndex([comment(), a, t, b, comment()], b, (n) => slots.has(n))).toBe(2);
  });

  it('skips a text node whose run is not built yet', () => {
    const b = el('b');
    expect(rawChildIndex([text('pending'), b], b, () => false)).toBe(0);
  });

  it('reports a detached child as -1', () => {
    expect(rawChildIndex([el('a')], el('b'), () => true)).toBe(-1);
  });
});

describe('dropStaleDuplicate', () => {
  it('drops the earlier copy after an append', () => {
    const a = el('a');
    const b = el('b');
    const nodes = [a, b, a];
    dropStaleDuplicate(nodes, a, -1);
    expect(nodes).toEqual([b, a]);
  });

  it('keeps the copy at the insertion index', () => {
    const a = el('a');
    const b = el('b');
    const c = el('c');
    const nodes = [a, b, a, c];
    dropStaleDuplicate(nodes, a, 2);
    expect(nodes).toEqual([b, a, c]);
  });

  it('leaves a list without duplicates alone', () => {
    const a = el('a');
    const nodes = [a];
    dropStaleDuplicate(nodes, a, 0);
    expect(nodes).toEqual([a]);
  });
});
