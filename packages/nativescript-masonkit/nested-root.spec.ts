import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeMasonRoot, flushNestedRoots, forgetMasonRootSizes, measuringForeign, type MasonRootView } from './nested-root';
import { isMasonView_ } from './symbols';

function fakeView(layout = { width: 0, height: 0 }) {
  const view: any = {
    ios: {
      node: { computedLayout: layout },
      mason_isNodeDirty: () => view.__dirty,
    },
    nativeViewProtected: {},
    parent: null,
    requestLayout: vi.fn(),
    __dirty: true,
  };
  return view as MasonRootView & { __dirty: boolean };
}

const markDirty = vi.fn();
const nodeForView = vi.fn(() => ({ markDirty }));

beforeEach(() => {
  vi.useFakeTimers();
  markDirty.mockClear();
  nodeForView.mockClear();
  (globalThis as any).NSCMason = { shared: { nodeForView } };
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as any).NSCMason;
});

describe('computeMasonRoot', () => {
  it('computes immediately when not nested inside a foreign measure', () => {
    const view = fakeView();
    const compute = vi.fn(() => {
      view.ios.node.computedLayout.width = 360;
      view.__dirty = false;
    });
    const size = computeMasonRoot(view, '360x120', compute);
    expect(compute).toHaveBeenCalledTimes(1);
    expect(size).toEqual({ width: 360, height: 0 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('defers a nested compute to the timer flush and invalidates the foreign leaf', () => {
    const host: any = { [isMasonView_]: true };
    const glass: any = { nativeViewProtected: { tag: 'glass' }, parent: host };
    const child = fakeView();
    child.parent = glass;
    const compute = vi.fn(() => {
      child.ios.node.computedLayout.width = 360;
      child.ios.node.computedLayout.height = 120;
      child.__dirty = false;
    });

    const reported = measuringForeign(() => computeMasonRoot(child, '360x120', compute));
    expect(compute).not.toHaveBeenCalled();
    expect(reported).toEqual({ width: 0, height: 0 });

    vi.runAllTimers();
    expect(compute).toHaveBeenCalledTimes(1);
    expect(nodeForView).toHaveBeenCalledWith(glass.nativeViewProtected, true);
    expect(markDirty).toHaveBeenCalledTimes(1);
    expect(child.requestLayout).toHaveBeenCalledTimes(1);
  });

  it('does not invalidate when the deferred compute leaves the reported size unchanged', () => {
    const child = fakeView({ width: 360, height: 120 });
    child.parent = { [isMasonView_]: true };
    const compute = vi.fn(() => {
      child.__dirty = false;
    });

    measuringForeign(() => computeMasonRoot(child, '360x120', compute));
    vi.runAllTimers();
    expect(compute).toHaveBeenCalledTimes(1);
    expect(nodeForView).not.toHaveBeenCalled();
    expect(child.requestLayout).not.toHaveBeenCalled();
  });

  it('converges when a host measures under two alternating keys', () => {
    const child = fakeView();
    child.parent = { [isMasonView_]: true };
    const sizes: Record<string, { width: number; height: number }> = {
      k1: { width: 0, height: 120 },
      k2: { width: 360, height: 120 },
    };
    const computeFor = (k: string) => () => {
      child.ios.node.computedLayout = { ...sizes[k] };
      child.__dirty = false;
    };

    // Pass 1: both keys miss the cache, so both are deferred.
    measuringForeign(() => {
      const r1 = computeMasonRoot(child, 'k1', computeFor('k1'));
      const r2 = computeMasonRoot(child, 'k2', computeFor('k2'));
      expect(r1).toEqual({ width: 0, height: 0 });
      expect(r2).toEqual({ width: 0, height: 0 });
    });
    vi.runAllTimers();
    // The flush computed both keys and invalidated once.
    expect(child.requestLayout).toHaveBeenCalledTimes(1);
    expect(markDirty).toHaveBeenCalledTimes(1);

    // Pass 2: both keys hit their cached sizes — nothing queued or invalidated.
    measuringForeign(() => {
      expect(computeMasonRoot(child, 'k1', computeFor('k1'))).toEqual(sizes.k1);
      expect(computeMasonRoot(child, 'k2', computeFor('k2'))).toEqual(sizes.k2);
    });
    vi.runAllTimers();
    expect(child.requestLayout).toHaveBeenCalledTimes(1);
    expect(markDirty).toHaveBeenCalledTimes(1);
  });

  it('re-defers when the node is dirty at measure time', () => {
    const child = fakeView();
    child.parent = { [isMasonView_]: true };
    const compute = vi.fn(() => {
      child.ios.node.computedLayout.width = 100;
      child.__dirty = false;
    });
    measuringForeign(() => computeMasonRoot(child, 'k', compute));
    vi.runAllTimers();
    expect(compute).toHaveBeenCalledTimes(1);

    child.__dirty = true;
    const again = vi.fn();
    measuringForeign(() => computeMasonRoot(child, 'k', again));
    expect(again).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(again).toHaveBeenCalledTimes(1);
  });

  it('forgets cached sizes on requestLayout except during the flush invalidation', () => {
    const child = fakeView();
    child.parent = { [isMasonView_]: true };
    const compute = vi.fn(() => {
      child.ios.node.computedLayout.width = 100;
      child.__dirty = false;
    });
    measuringForeign(() => computeMasonRoot(child, 'k', compute));
    vi.runAllTimers();
    expect(compute).toHaveBeenCalledTimes(1);
    expect(child.requestLayout).toHaveBeenCalledTimes(1);

    // Simulate requestLayout climbing through the flush's own invalidation:
    // the cache must survive so the next measure still hits it.
    (child.requestLayout as any).mockImplementation(() => forgetMasonRootSizes(child));
    measuringForeign(() => {
      expect(computeMasonRoot(child, 'k', compute)).toEqual({ width: 100, height: 0 });
    });

    // An unrelated requestLayout drops the cache.
    forgetMasonRootSizes(child);
    child.__dirty = false;
    const again = vi.fn();
    measuringForeign(() => computeMasonRoot(child, 'k', again));
    expect(again).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(again).toHaveBeenCalledTimes(1);
  });

  it('caps invalidations at 4 while still computing sizes', () => {
    const child = fakeView();
    child.parent = { [isMasonView_]: true };
    let w = 0;
    const compute = vi.fn(() => {
      w += 10;
      child.ios.node.computedLayout.width = w;
      child.__dirty = false;
    });
    for (let i = 0; i < 6; i++) {
      measuringForeign(() => computeMasonRoot(child, `k${i}`, compute));
      flushNestedRoots();
    }
    expect(child.requestLayout).toHaveBeenCalledTimes(4);
    expect(compute).toHaveBeenCalledTimes(6);
    vi.runAllTimers();
  });

  it('resets the invalidation cap on a nested cache hit', () => {
    const child = fakeView();
    child.parent = { [isMasonView_]: true };
    let w = 0;
    const bump = () => {
      w += 10;
      child.ios.node.computedLayout.width = w;
      child.__dirty = false;
    };
    // Four changing flushes hit the cap.
    for (let i = 0; i < 4; i++) {
      measuringForeign(() => computeMasonRoot(child, `k${i}`, bump));
      flushNestedRoots();
    }
    expect(child.requestLayout).toHaveBeenCalledTimes(4);

    // A nested cache hit (host re-offering an answered key) resets the cap.
    measuringForeign(() => computeMasonRoot(child, 'k0', vi.fn()));
    // A further changed flush invalidates again.
    measuringForeign(() => computeMasonRoot(child, 'k5', bump));
    flushNestedRoots();
    expect(child.requestLayout).toHaveBeenCalledTimes(5);
    expect(markDirty).toHaveBeenCalledTimes(5);
    vi.runAllTimers();
  });

  it('flushes a nested root inside the same top-level compute pass', () => {
    const inner = fakeView();
    inner.parent = { [isMasonView_]: true };
    const innerCompute = vi.fn(() => {
      inner.ios.node.computedLayout.width = 100;
      inner.__dirty = false;
    });
    const outer = fakeView();
    const outerCompute = vi.fn(() => {
      measuringForeign(() => computeMasonRoot(inner, 'k', innerCompute));
      outer.__dirty = false;
    });

    const size = computeMasonRoot(outer, 'outer', outerCompute);

    expect(innerCompute).toHaveBeenCalledTimes(1);
    // The outer compute re-ran because the nested root reported a new size.
    expect(outerCompute).toHaveBeenCalledTimes(2);
    expect(size).toEqual({ width: 0, height: 0 });
    expect(inner.requestLayout).toHaveBeenCalledTimes(1);
    vi.runAllTimers();
    expect(outerCompute).toHaveBeenCalledTimes(2);
  });

  it('skips entries whose view lost its native view before the flush', () => {
    const child = fakeView();
    child.parent = { [isMasonView_]: true };
    const compute = vi.fn();

    measuringForeign(() => computeMasonRoot(child, 'k', compute));
    (child as any).nativeViewProtected = null;
    vi.runAllTimers();
    expect(compute).not.toHaveBeenCalled();
    expect(child.requestLayout).not.toHaveBeenCalled();
  });
});
