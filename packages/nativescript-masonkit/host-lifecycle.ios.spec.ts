import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomLayoutView, View as CoreView } from '@nativescript/core';
import { View } from './view/index.ios';
import { Style } from './style';

// Keep real Mason child operations, iOS deferred inserts, and core parentage.
// Replace UIKit calls at the native boundary; this suite does not measure geometry.
const weakRef = WeakRef.prototype as any;
weakRef.get ??= function (this: WeakRef<object>) { return this.deref(); };

beforeEach(() => {
  vi.spyOn(Style, 'fromView').mockImplementation(() => ({} as Style));
  vi.spyOn(CustomLayoutView.prototype, '_removeViewFromNativeVisualTree').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function host() {
  const children: object[] = [];
  const native = {
    addViewAt(child: object, index: number) {
      expect(children).not.toContain(child);
      children.splice(Math.max(0, Math.min(index, children.length)), 0, child);
    },
    removeView(child: object) {
      const index = children.indexOf(child);
      expect(index).toBeGreaterThanOrEqual(0);
      children.splice(index, 1);
    },
  };
  const view = new View();
  Object.defineProperty(view, '_view', { value: native });
  Object.defineProperty(view, 'nativeViewProtected', { value: native });
  vi.spyOn(view, '_addViewCore').mockImplementation((child, index) => {
    view._addViewToNativeVisualTree(child, index ?? -1);
  });
  vi.spyOn(view, '_removeViewCore').mockImplementation((child) => {
    view._removeViewFromNativeVisualTree(child as any);
  });
  return { view, children, flush: () => (view as any)._masonFlushNativeAdds() };
}

function leaf(id: number, loaded = false) {
  const view = new CoreView();
  const native = { id };
  Object.defineProperty(view, 'nativeViewProtected', { value: native });
  Object.defineProperty(view, 'isLoaded', { value: loaded });
  return view;
}

// Octane detaches before computing the new index, then its Mason adapter calls
// insertChild(view, min(index, getChildrenCount())). Text hosts are core Labels.
function insert(parent: View, child: CoreView, before: CoreView | null = null) {
  const old = child.parent as View | undefined;
  old?.removeChild(child);
  const siblings: CoreView[] = [];
  parent.eachChildView((view) => { siblings.push(view); return true; });
  const index = before === null ? siblings.length : siblings.indexOf(before);
  expect(index).toBeGreaterThanOrEqual(0);
  parent.insertChild(child, Math.min(index, parent.getChildrenCount()));
}

function expectOrder(fixture: ReturnType<typeof host>, expected: CoreView[]) {
  fixture.flush();
  const actual: CoreView[] = [];
  fixture.view.eachChildView((view) => { actual.push(view); return true; });
  expect(actual).toEqual(expected);
  expect(fixture.children).toEqual(expected.map((view) => view.nativeViewProtected));
  for (const child of expected) expect(child.parent).toBe(fixture.view);
}

describe('Octane host child lifecycle through the Mason iOS adapter', () => {
  it('attaches a batch of initially unloaded children in source order', () => {
    const fixture = host();
    const children = Array.from({ length: 12 }, (_, i) => leaf(i));
    for (const child of children) insert(fixture.view, child);
    expectOrder(fixture, children);
  });

  it('moves the last child to the front and the first child to the end', () => {
    const fixture = host();
    const [a, b, c] = [leaf(1), leaf(2), leaf(3)];
    for (const child of [a, b, c]) insert(fixture.view, child);
    insert(fixture.view, c, a);
    expectOrder(fixture, [c, a, b]);
    insert(fixture.view, c);
    expectOrder(fixture, [a, b, c]);
  });

  it('reparents while both hosts have queued native inserts', () => {
    const left = host();
    const right = host();
    const [a, b, c, d] = [leaf(1), leaf(2), leaf(3), leaf(4)];
    insert(left.view, a);
    insert(left.view, b);
    insert(right.view, c);
    insert(right.view, d);
    insert(right.view, b, d);
    expectOrder(left, [a]);
    expectOrder(right, [c, b, d]);
  });

  it('removes a queued child and can reattach the same view later', () => {
    const fixture = host();
    const [a, b] = [leaf(1), leaf(2)];
    insert(fixture.view, a);
    insert(fixture.view, b);
    fixture.view.removeChild(b);
    expect(b.parent).toBeUndefined();
    expectOrder(fixture, [a]);
    insert(fixture.view, b, a);
    expectOrder(fixture, [b, a]);
  });

  it('preserves order when unloaded new views meet already loaded views', () => {
    const fixture = host();
    const [a, b, c] = [leaf(1), leaf(2, true), leaf(3)];
    for (const child of [a, b, c]) insert(fixture.view, child);
    expectOrder(fixture, [a, b, c]);
    insert(fixture.view, b);
    expectOrder(fixture, [a, c, b]);
  });

  it('clears every view and reuses those same views on the next render', () => {
    const fixture = host();
    const children = [leaf(1), leaf(2), leaf(3)];
    for (const child of children) insert(fixture.view, child);
    fixture.view.removeChildren();
    expectOrder(fixture, []);
    for (const child of children) expect(child.parent).toBeUndefined();
    for (const child of [...children].reverse()) insert(fixture.view, child);
    expectOrder(fixture, [...children].reverse());
  });

  it('survives repeated keyed moves without duplicate native children', () => {
    const fixture = host();
    const expected = Array.from({ length: 8 }, (_, i) => leaf(i, true));
    for (const child of expected) insert(fixture.view, child);
    for (let i = 0; i < 32; i++) {
      const [child] = expected.splice((i * 3) % expected.length, 1);
      const target = (i * 5) % (expected.length + 1);
      insert(fixture.view, child, expected[target] ?? null);
      expected.splice(target, 0, child);
      expectOrder(fixture, expected);
    }
  });
});
