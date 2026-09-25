/** The parts of a svelte-native DOM node the index mapping reads. */
export interface SvelteDomNode {
  nodeType?: number;
  text?: string;
  propAttribute?: string | null;
  nativeView?: unknown;
}

/**
 * Map a child's position in svelte-native's `childNodes` to MasonKit's raw
 * child index: the number of preceding nodes that already own a slot in the
 * parent's `_children` (elements, and text nodes whose run exists). A text
 * node's run is only built once the parent's text is applied, so counting
 * every non-empty text node would overshoot before the parent has loaded.
 */
export function rawChildIndex(childNodes: readonly SvelteDomNode[], child: SvelteDomNode, occupiesSlot: (node: SvelteDomNode) => boolean): number {
  const at = childNodes.indexOf(child);
  if (at < 0) return -1;
  let raw = 0;
  for (let i = 0; i < at; i++) {
    if (occupiesSlot(childNodes[i])) raw++;
  }
  return raw;
}

/**
 * svelte-native's insertBefore/appendChild don't detach a node that already
 * belongs to the same parent, so a keyed move leaves it in `childNodes` twice.
 * Drop the stale copy: the first one for an append (index < 0), otherwise the
 * one not at `index`.
 */
export function dropStaleDuplicate<T>(childNodes: T[], child: T, index: number): void {
  const first = childNodes.indexOf(child);
  const last = childNodes.lastIndexOf(child);
  if (first === last) return;
  if (index < 0) {
    childNodes.splice(first, 1);
  } else {
    childNodes.splice(first === index ? last : first, 1);
  }
}
