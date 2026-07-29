import type { ViewClassMeta } from '@nativescript/angular';

/**
 * The subset of MasonKit's `ViewBase` child API this meta drives.
 *
 * Typed structurally rather than against the real class so the meta can also be
 * attached to subclasses declared outside this package (e.g. an app's own
 * `View` subclass) without a nominal dependency.
 */
interface MasonChildOps {
  /**
   * MasonKit's raw child list. Unlike `_viewChildren` it includes text-node and
   * placeholder (`<br>`) entries, and it is the list `insertChild` splices into.
   */
  _children: unknown[];
  getChildIndex(child: unknown): number;
  insertChild(child: unknown, atIndex: number): void;
  addChild(child: unknown): void;
  removeChild(child: unknown): void;
}

/**
 * Index of `child` in the parent's raw `_children` list, or -1.
 *
 * Deliberately *not* `parent.getChildIndex()`: that walks `_viewChildren`, which
 * filters out text nodes and placeholders, so its indices drift from the ones
 * `insertChild()` splices into as soon as a container mixes views and text. The
 * only index `insertChild` accepts is a `_children` index, so that is what we
 * compute. `getChildIndex` stays as the fallback for a container that predates
 * `_children` or overrides the lookup.
 */
function rawChildIndex(parent: MasonChildOps, child: unknown): number {
  if (child == null) {
    return -1;
  }
  const children = parent._children;
  if (Array.isArray(children)) {
    return children.indexOf(child);
  }
  return typeof parent.getChildIndex === 'function' ? parent.getChildIndex(child) : -1;
}

/**
 * `ViewClassMeta` that routes Angular's visual-tree mutations through MasonKit's
 * own child bookkeeping.
 *
 * ## Why every MasonKit element needs this
 *
 * MasonKit's `ViewBase` extends `CustomLayoutView`, **not** `LayoutBase`.
 * `@nativescript/angular`'s `ViewUtil` branches on `view instanceof LayoutBase`,
 * so without a meta a MasonKit container falls into the generic fallbacks:
 *
 * - `addToVisualTree` → `parent._addChildFromBuilder(name, child)`, which is a
 *   plain `addChild()` append. The resolved `next` sibling is **discarded**, so
 *   anything Angular inserts in the middle of a container (`*ngIf` toggling on,
 *   `*ngFor` reordering, a router swap) lands at the end and the Taffy tree ends
 *   up in a different order than the template.
 * - `removeFromVisualTree` → core's `parent._removeView(child)`, which bypasses
 *   MasonKit's `removeChild()` entirely. The native view detaches but the entry
 *   stays in `_children`, and since `_children` is what drives native insertion
 *   indices (`_nativeIndexFor`), every later insert into that container is
 *   misplaced - the classic "nested components lay out wrong" symptom.
 *
 * Routing through `insertChild`/`addChild`/`removeChild` keeps the Taffy tree,
 * the `_children` bookkeeping and the native view tree in step. This is the same
 * contract `frameMeta`/`formattedStringMeta` use for their containers.
 *
 * ## Why `insertChild` must not throw
 *
 * `next` is whatever `ViewUtil.findNextVisual()` resolved to, which is not
 * guaranteed to be a node MasonKit ever tracked. MasonKit's own `insertBefore()`
 * throws `NotFoundError` for an unknown reference; thrown from here that would
 * abort the component's change detection and blank it. An unknown reference
 * simply degrades to an append, exactly as `insertToLayout` does for classic
 * layouts.
 *
 * Invisible nodes (Angular's `CommentNode`/`TextNode`) are intentionally left to
 * `ViewUtil`'s default handling: it assigns `parent.text`, which MasonKit's
 * `textProperty.setNative` already reconciles into real native text nodes.
 */
export const masonMeta: ViewClassMeta = {
  insertChild(parent: MasonChildOps, child: unknown, next?: unknown): void {
    const index = rawChildIndex(parent, next);
    if (index > -1) {
      parent.insertChild(child, index);
    } else {
      parent.addChild(child);
    }
  },
  removeChild(parent: MasonChildOps, child: unknown): void {
    parent.removeChild(child);
  },
};
