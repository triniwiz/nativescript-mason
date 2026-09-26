import { textNode_ } from './symbols';
import type { MasonNodeKind } from './framework-registry';

/** True when `children` (a MasonKit `_children` list) holds the text run built for `node`. */
export function hasTextRun(children: readonly any[], node: unknown): boolean {
  return children.some((child: any) => child?.[textNode_]?.['__raw__'] === node);
}

export interface TextRunReconcileContext {
  _children: any[];
  _nativeRemoveChildNode(node: any, index: number): void;
  _updateTextNode(
    node: any,
    operation: {
      type: 'add' | 'replace' | 'insert';
      index?: number;
      isBreak?: boolean;
    } | null,
  ): void;
}

/**
 * Reconcile the native text runs in `context._children` with the host
 * framework's child nodes.
 *
 * `_children` holds one slot per box: elements and non-empty text runs. The
 * framework's node list also carries nodes that generate no box on the web,
 * and every framework has them - comment anchors for conditional/list
 * rendering and empty text nodes. Neither gets a native run, so run indices
 * come from counting slots, never from a node's position in the framework
 * list. `classify` maps each framework node to its kind: `text` (a run),
 * `break` (a `<br>` run), `element` (a slot with no run) or `none` (no slot).
 */
export function reconcileTextRuns(context: TextRunReconcileContext, nodes: any[], classify: (node: any) => MasonNodeKind): void {
  const textOf = (n: any): string => String(n.text ?? n.data ?? '');
  // A `<br>` that the host already inserted as a `Br` placeholder element
  // (Vue/Angular metas do) is a slot of its own; only synthesise a break run
  // for a framework node MasonKit has no child for.
  const kinds = nodes.map((n) => {
    const kind = classify(n);
    return kind === 'break' && context._children.indexOf(n) > -1 ? 'element' : kind;
  });
  const live = new Set<any>();
  for (let i = 0; i < nodes.length; i++) {
    if (kinds[i] === 'break' || (kinds[i] === 'text' && textOf(nodes[i]) !== '')) {
      live.add(nodes[i]);
    }
  }

  // Drop native runs whose framework node is gone or has become empty.
  for (let i = context._children.length - 1; i >= 0; i--) {
    const child = context._children[i] as any;
    const raw = child?.[textNode_]?.['__raw__'];
    if (raw && !live.has(raw)) {
      context._nativeRemoveChildNode(child[textNode_], i);
      context._children.splice(i, 1);
    }
  }

  let slot = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const kind = kinds[i];
    if (kind === 'none' || (kind === 'text' && textOf(node) === '')) {
      continue;
    }
    if (kind === 'element') {
      slot++;
      continue;
    }
    const existingIndex = context._children.findIndex((child: any) => child?.[textNode_]?.['__raw__'] === node);
    if (existingIndex === slot) {
      // Same node in the same slot: update the run's text in place.
      context._updateTextNode(node, null);
    } else {
      if (existingIndex > -1) {
        const existing = context._children[existingIndex] as any;
        context._nativeRemoveChildNode(existing[textNode_], existingIndex);
        context._children.splice(existingIndex, 1);
      }
      context._updateTextNode(node, { type: 'insert', index: slot, isBreak: kind === 'break' });
    }
    slot++;
  }
}
