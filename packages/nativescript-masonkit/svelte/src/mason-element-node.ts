import { NativeViewElementNode } from 'svelte-native/dom';
import { hasTextRun } from '@triniwiz/nativescript-masonkit';
import { dropStaleDuplicate, rawChildIndex, type SvelteDomNode } from './raw-index';

interface MasonParentView {
  _children?: unknown[];
  insertChild(child: unknown, atIndex: number): void;
  addChild(child: unknown): void;
  removeChild(child: unknown): void;
}

/**
 * svelte-native only inserts by index into a core `LayoutBase`; any other parent
 * gets `_addChildFromBuilder`, an append, and `_removeView`, which skips
 * MasonKit's child list. A MasonKit container instead inserts at the raw index
 * its text runs and elements share, and removes through `removeChild`.
 */
export class MasonElementNode extends NativeViewElementNode {
  onInsertedChild(childNode: any, index: number): void {
    dropStaleDuplicate(this.childNodes as unknown[], childNode, index);
    if (!(childNode instanceof NativeViewElementNode) || (childNode as any).propAttribute || !this.nativeView) {
      super.onInsertedChild(childNode, index);
      return;
    }
    const parentView = this.nativeView as unknown as MasonParentView;
    const childView = childNode.nativeView;
    const children = (parentView._children ?? []) as unknown[];
    // A keyed move: take it out first so it is never attached twice.
    if (children.includes(childView)) {
      parentView.removeChild(childView);
    }
    const occupies = (node: SvelteDomNode) => (node.nodeType === 3 ? hasTextRun(children, node) : node.nativeView != null && children.includes(node.nativeView));
    const raw = index < 0 ? -1 : rawChildIndex(this.childNodes as any[], childNode as any, occupies);
    if (raw < 0 || raw >= children.length) {
      parentView.addChild(childView);
    } else {
      parentView.insertChild(childView, raw);
    }
  }

  onRemovedChild(childNode: any): void {
    if (!(childNode instanceof NativeViewElementNode) || (childNode as any).propAttribute || !this.nativeView || !childNode.nativeView) {
      super.onRemovedChild(childNode);
      return;
    }
    (this.nativeView as unknown as MasonParentView).removeChild(childNode.nativeView);
  }
}
