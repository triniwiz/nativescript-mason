import { describe, expect, it } from 'vitest';
import { ViewBase } from './common';
import { text_ } from './symbols';

type Child = { id: number; _isMasonChild?: boolean; [text_]?: string };

function host(children: Child[]) {
  const h = Object.create(ViewBase.prototype) as any;
  h._children = children;
  return h;
}

const views = (n: number, from = 0): Child[] => Array.from({ length: n }, (_, i) => ({ id: from + i }));
const textRun = (id: number): Child => ({ id, [text_]: `t${id}` });

function attach(h: any, child: Child) {
  const expectedJs = h._children.indexOf(child);
  const expectedNative = h._nativeIndexFor(expectedJs);
  const got = h._nativeAttachIndex(child, -1);
  expect(got).toEqual({ jsIndex: expectedJs, nativeIndex: expectedNative });
  child._isMasonChild = true;
  return got;
}

describe('_nativeAttachIndex', () => {
  it('matches the scan for children attaching in order', () => {
    const children = views(200);
    const h = host(children);
    for (const c of children) attach(h, c);
  });

  it('matches the scan with text runs interleaved (text attaches immediately)', () => {
    const children: Child[] = [];
    for (let i = 0; i < 60; i++) children.push(...(i % 7 === 3 ? [textRun(1000 + i)] : []), { id: i });
    const h = host(children);
    for (const c of children) if (!(text_ in c)) attach(h, c);
  });

  it('falls back to the scan when a preceding sibling moved', () => {
    const children = views(10);
    const h = host(children);
    for (const c of children.slice(0, 5)) attach(h, c);
    children.splice(2, 0, { id: 99 });
    attach(h, children[6]);
    attach(h, children[7]);
  });

  it('matches the scan after an explicit invalidation', () => {
    const children = views(10);
    const h = host(children);
    for (const c of children.slice(0, 4)) attach(h, c);
    children.splice(1, 1);
    h._invalidateAttachCursor();
    for (const c of children.slice(3)) attach(h, c);
  });

  it('matches the scan for out-of-order attaches', () => {
    const children = views(12);
    const h = host(children);
    for (const i of [5, 0, 11, 6, 1, 7, 2]) attach(h, children[i]);
  });

  it('uses the explicit slot when one is given', () => {
    const children = views(5);
    const h = host(children);
    attach(h, children[0]);
    attach(h, children[1]);
    expect(h._nativeAttachIndex(children[3], 3)).toEqual({ jsIndex: 3, nativeIndex: 2 });
  });
});
