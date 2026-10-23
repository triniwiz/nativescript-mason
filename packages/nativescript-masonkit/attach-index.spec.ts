import { describe, expect, it } from 'vitest';
import { ProxyViewContainer } from '@nativescript/core';
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

describe('passthrough hosts', () => {
  // A ProxyViewContainer among the children, its `attached` children already on this view.
  function proxyIn(h: any, attached: number) {
    const proxy = Object.create(ProxyViewContainer.prototype) as any;
    Object.defineProperty(proxy, 'parent', { value: h });
    proxy._getNativeViewsCount = () => attached;
    return proxy;
  }
  const hoisted = (proxy: any) => ({ id: -1, parent: proxy });

  it('places a hoisted child after the siblings before the host', () => {
    const children: any[] = views(3);
    const h = host(children);
    for (const c of children) attach(h, c);
    const proxy = proxyIn(h, 0);
    children.splice(2, 0, proxy);
    // Core hands over the index inside the host: 0 for its first child.
    expect(h._nativeAttachIndex(hoisted(proxy), 0).nativeIndex).toBe(2);
  });

  it('places a hoisted child at its slot inside the host', () => {
    const children: any[] = views(2);
    const h = host(children);
    for (const c of children) attach(h, c);
    const proxy = proxyIn(h, 2);
    children.splice(1, 0, proxy);
    expect(h._nativeAttachIndex(hoisted(proxy), 1).nativeIndex).toBe(2);
    expect(h._nativeAttachIndex(hoisted(proxy), -1).nativeIndex).toBe(3);
  });

  it("counts a host's attached children for the siblings after it", () => {
    const children: any[] = views(3);
    const h = host(children);
    attach(h, children[0]);
    children.splice(1, 0, proxyIn(h, 2));
    // children[2] is the old views(3)[1]: one view and the host's two before it.
    expect(h._nativeIndexFor(2)).toBe(3);
    expect(h._nativeAttachIndex(children[2], -1).nativeIndex).toBe(3);
  });
});
