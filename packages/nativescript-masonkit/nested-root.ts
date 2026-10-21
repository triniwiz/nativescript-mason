import { isMasonView_ } from './symbols';

export interface MasonRootView {
  readonly ios: {
    node: { computedLayout: { width: number; height: number } };
    mason_isNodeDirty(): boolean;
  };
  readonly nativeViewProtected: unknown;
  readonly parent: any;
  requestLayout(): void;
}

export interface Size {
  width: number;
  height: number;
}

interface PendingRoot {
  compute: () => void;
  reported: Size;
}

// A foreign (non-Mason) view measured through setMeasureForViewBlock runs its
// own layout inside the outer tree's Rust compute. iOS skips re-entrant
// computes while NSCMason.inCompute is set, so a Mason root measured there
// would read a stale computedLayout. Defer those computes and replay them
// once the outer compute returns — the JS mirror of Android's
// Element.computeOrDeferNested and Swift's computeNestedRootLater.
//
// One outer pass can measure the same root under several constraints
// (max-content probe, then definite), so results are cached per constraint
// key instead of trusting the single computedLayout slot.
let depth = 0;
const sizes = new WeakMap<MasonRootView, Map<string, Size>>();
const pending = new Map<MasonRootView, Map<string, PendingRoot>>();
const invalidations = new WeakMap<MasonRootView, number>();
let invalidating = false;
let flushScheduled = false;

/** Runs `measure` as a foreign-view measure from inside a Mason compute (depth counter). */
export function measuringForeign<T>(measure: () => T): T {
  depth++;
  try {
    return measure();
  } finally {
    depth--;
  }
}

function run(view: MasonRootView, key: string, compute: () => void): Size {
  compute();
  const layout = view.ios.node.computedLayout;
  const size = { width: layout.width, height: layout.height };
  let perView = sizes.get(view);
  if (!perView) {
    perView = new Map();
    sizes.set(view, perView);
  }
  perView.set(key, size);
  return size;
}

/**
 * Compute a Mason root measured by a non-Mason parent and return the size the
 * caller must report — `compute` runs the native compute plus its
 * mason_markRootComputeApplied* call; `key` identifies the constraints (e.g.
 * `${w}x${h}`, 'max-content'). A call made from inside an outer Mason compute
 * is deferred: Swift ignores re-entrant computes and would leave a stale
 * computedLayout in place.
 */
export function computeMasonRoot(view: MasonRootView, key: string, compute: () => void): Size {
  if (view.ios.mason_isNodeDirty()) {
    sizes.delete(view);
  }
  if (depth === 0) {
    const perView = pending.get(view);
    if (perView) {
      perView.delete(key);
      if (perView.size === 0) pending.delete(view);
    }
    let size = run(view, key, compute);
    // Nested roots queued during this compute must be flushed in the same
    // pass: when one reports a new size its foreign leaf is dirty, so run
    // this compute again rather than let the tree draw a stale frame.
    for (let i = 0; i < 3 && flushNestedRoots(); i++) {
      size = run(view, key, compute);
    }
    return size;
  }
  const cached = sizes.get(view)?.get(key);
  if (cached) {
    const perView = pending.get(view);
    if (perView) {
      perView.delete(key);
      if (perView.size === 0) pending.delete(view);
    }
    // The host re-offered a constraint we already answered, so it is settling:
    // reset the invalidation cap.
    invalidations.delete(view);
    return cached;
  }
  const layout = view.ios.node.computedLayout;
  let perView = pending.get(view);
  if (!perView) {
    perView = new Map();
    pending.set(view, perView);
  }
  const entry = perView.get(key);
  const reported = entry?.reported ?? { width: layout.width, height: layout.height };
  perView.set(key, { compute, reported });
  if (!flushScheduled) {
    flushScheduled = true;
    setTimeout(flushNestedRoots, 0);
  }
  return reported;
}

/** Run deferred nested-root computes; true when any reported size changed and was invalidated. Exported for tests. */
export function flushNestedRoots(): boolean {
  const queue = [...pending];
  pending.clear();
  flushScheduled = false;
  let invalidated = false;
  for (const [view, perView] of queue) {
    if (!view.nativeViewProtected) continue;
    if (view.ios.mason_isNodeDirty()) {
      sizes.delete(view);
    }
    let changed = false;
    for (const [key, entry] of perView) {
      const size = run(view, key, entry.compute);
      if (size.width !== entry.reported.width || size.height !== entry.reported.height) {
        changed = true;
      }
    }
    if (!changed) continue;
    const count = (invalidations.get(view) ?? 0) + 1;
    invalidations.set(view, count);
    // Safety cap against a host that never settles.
    if (count > 4) continue;
    invalidated = true;
    let leaf: any = view;
    let host: any = view.parent;
    while (host && !host[isMasonView_]) {
      leaf = host;
      host = host.parent;
    }
    if (host && leaf.nativeViewProtected) {
      (globalThis as any).NSCMason.shared.nodeForView(leaf.nativeViewProtected, true).markDirty();
    }
    invalidating = true;
    try {
      view.requestLayout();
    } finally {
      invalidating = false;
    }
  }
  return invalidated;
}

/** Drop a root's cached per-constraint sizes; called from ViewBase.requestLayout. */
export function forgetMasonRootSizes(view: object): void {
  if (invalidating) return;
  sizes.delete(view as MasonRootView);
  invalidations.delete(view as MasonRootView);
}
