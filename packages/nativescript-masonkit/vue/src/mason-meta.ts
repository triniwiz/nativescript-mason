import type { NSVElement, NSVViewMeta } from 'nativescript-vue';

interface MasonChildOps {
  _children?: unknown[];
  insertChild(child: unknown, atIndex: number): void;
  addChild(child: unknown): void;
  removeChild(child: unknown): void;
}

/**
 * Nodes that occupy a slot in MasonKit's raw child list: elements and
 * non-empty text nodes. Empty text nodes (Vue's keyed-fragment anchors) get no
 * native text run, mirroring `textProperty.setNative` in the base package.
 */
function isVisualOrTextNode(node: { nodeType?: unknown; text?: unknown }): boolean {
  const t = node.nodeType;
  if (t === 'text' || t === 3) {
    return (node.text ?? '') !== '';
  }
  return t === 'element' || t === 1;
}

/** Convert Vue's element-only insertion index to MasonKit's raw child index. */
function rawChildIndex(parent: NSVElement, child: NSVElement): number {
  const childNodes = parent.childNodes ?? [];
  const childIndex = childNodes.indexOf(child);
  if (childIndex < 0) return -1;

  let rawIndex = 0;
  for (let i = 0; i < childIndex; i++) {
    if (isVisualOrTextNode(childNodes[i])) rawIndex++;
  }
  return rawIndex;
}

/**
 * NativeScript-Vue metadata that routes child insertions/removals through
 * MasonKit's raw child APIs, preserving order across text and comment nodes.
 */
export const masonMeta: Partial<NSVViewMeta> = {
  nodeOps: {
    insert(child: NSVElement, parent: NSVElement, atIndex?: number): void {
      const parentView = parent.nativeView as MasonChildOps;
      if (typeof atIndex !== 'number') {
        // Appends arrive without an index; route through MasonKit's append path
        // so text nodes do not throw off the insertion point.
        parentView.addChild(child.nativeView);
        return;
      }

      // Vue counts only elements; MasonKit includes native text runs, so map
      // the insertion index to the raw child list.
      const index = rawChildIndex(parent, child);
      const rawIndex = index > -1 ? index : atIndex;

      // Keyed fragments may supply an index while appending before a comment
      // anchor that occupies no MasonKit slot. Treat that as an append too.
      if (Array.isArray(parentView._children) && rawIndex >= parentView._children.length) {
        parentView.addChild(child.nativeView);
      } else {
        parentView.insertChild(child.nativeView, rawIndex);
      }
    },
    remove(child: NSVElement, parent: NSVElement): void {
      (parent.nativeView as MasonChildOps).removeChild(child.nativeView);
    },
  },
};
