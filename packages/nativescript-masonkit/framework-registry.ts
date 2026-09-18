/**
 * Framework adapters teach MasonKit how to read a host framework's child list
 * and map each framework node to the kind of slot it occupies in the Mason
 * layout tree.
 *
 * Adapters live in three places:
 *   1. The built-in defaults in this module (DOM-shim and NativeScript Core).
 *   2. Framework subpackages such as `@triniwiz/nativescript-masonkit-angular`
 *      and `@triniwiz/nativescript-masonkit-vue`, which register adapters for
 *      non-standard node shapes.
 *   3. App code, for custom renderers.
 */

export type MasonNodeKind = 'text' | 'break' | 'element' | 'none';

export interface MasonFrameworkAdapter {
  name: string;
  /**
   * Return the framework element that carries `childNodes` / `firstChild` for
   * this view, or `null` / `undefined` if this adapter does not apply.
   */
  getElement(view: any): any | null | undefined;
  /** Return the canonical list of framework child nodes for the element. */
  getChildren(element: any): any[];
  /** Classify a framework node into a MasonKit slot kind. */
  classify(node: any): MasonNodeKind;
  /**
   * When `true` and `getChildren` returns an empty array, a synthetic text node
   * is created for direct `.text` writes (DOM-shim frameworks). When `false`,
   * an empty child list is reconciled normally and the function returns.
   */
  syntheticTextOnEmpty?: boolean;
}

class FrameworkRegistry {
  private adapters: MasonFrameworkAdapter[] = [];
  private cache = new WeakMap<object, { adapter: MasonFrameworkAdapter; element: any } | null>();

  /**
   * Later registrations are checked first. Framework subpackages import this
   * module before registering, so their adapters always run ahead of the
   * built-in defaults below.
   */
  register(adapter: MasonFrameworkAdapter): void {
    this.adapters.unshift(adapter);
  }

  /** Find the first adapter that claims this view, using a cached result. */
  find(view: any): MasonFrameworkAdapter | undefined {
    return this.resolve(view)?.adapter;
  }

  /** Return the framework element for this view, or `null` if none matches. */
  getElement(view: any): any | null {
    return this.resolve(view)?.element ?? null;
  }

  private resolve(view: any): { adapter: MasonFrameworkAdapter; element: any } | null {
    if (view == null || typeof view !== 'object') {
      return null;
    }
    const cached = this.cache.get(view);
    if (cached !== undefined) {
      return cached;
    }
    for (const adapter of this.adapters) {
      const element = adapter.getElement(view);
      if (element != null) {
        const result = { adapter, element };
        this.cache.set(view, result);
        return result;
      }
    }
    this.cache.set(view, null);
    return null;
  }
}

export const frameworkRegistry = new FrameworkRegistry();

// ---------------------------------------------------------------------------
// Helpers shared by the built-in adapters and framework subpackages
// ---------------------------------------------------------------------------

function isStandardDomNode(node: any): boolean {
  if (node == null) {
    return false;
  }
  const type = node.nodeType;
  if (type === 'text' || type === 3) {
    return node.nodeName !== 'TextNode';
  }
  if (type === 'element' || type === 1) {
    return node.nodeName !== 'TextNode' && node.nodeName !== 'CommentNode';
  }
  if (type === 'comment' || type === 8) {
    return node.nodeName !== 'CommentNode';
  }
  return false;
}

export function readLinkedList(element: any): any[] {
  const nodes: any[] = [];
  let child = element.firstChild;
  while (child) {
    nodes.push(child);
    child = child.nextSibling;
  }
  return nodes;
}

export function readChildNodes(element: any): any[] {
  if (!Array.isArray(element.childNodes)) {
    return [];
  }
  // Some DOM shims expose the same nodes through both `childNodes` and the
  // linked `nextSibling` chain. Preserve order while skipping duplicates.
  const seen = new Set<any>();
  return (element.childNodes as any[]).filter((n) => {
    if (seen.has(n)) {
      return false;
    }
    seen.add(n);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Built-in adapters. Registration order matters: later registrations are
// checked first, so the DOM-shim adapter runs ahead of the NativeScript Core
// fallback, and framework subpackage adapters (registered after this module
// loads) run ahead of both.
// ---------------------------------------------------------------------------

/**
 * NativeScript Core adapter.
 *
 * Core views expose a `firstChild` / `nextSibling` linked list where text is
 * represented by objects with `nodeName === 'TextNode'` rather than standard
 * DOM nodeType values. This is the fallback when no DOM-shim or framework
 * adapter has claimed the view.
 */
frameworkRegistry.register({
  name: 'nativescript-core',
  getElement(view) {
    return view.firstChild !== undefined ? view : null;
  },
  getChildren: readLinkedList,
  classify(node) {
    if (node.nodeType === 'text' || node.nodeName === 'TextNode' || node.constructor?.name === 'TextNode') {
      return 'text';
    }
    if (node.nodeName === 'br') {
      return 'break';
    }
    return 'element';
  },
  syntheticTextOnEmpty: false,
});

/**
 * Standard DOM-shim adapter.
 *
 * Covers any renderer that exposes a web-like DOM surface: `childNodes` (array
 * or linked list), `nodeType` 1/3/8, and `text`/`data` for text content. This
 * includes react-nativescript, dominative/Solid, and Svelte Native when its
 * element is reachable from the native view.
 */
frameworkRegistry.register({
  name: 'dom-shim',
  getElement(view) {
    // React / Solid: the native view is the DOM element.
    if (Array.isArray(view.childNodes)) {
      return view;
    }
    // Svelte Native stores its element separately.
    const svelteEl = view.__SvelteNativeElement__;
    if (svelteEl && (Array.isArray(svelteEl.childNodes) || svelteEl.firstChild !== undefined)) {
      return svelteEl;
    }
    // Generic linked-list DOM (e.g. undom, jsdom, or a host that extends the
    // native view with firstChild/nextSibling).
    if (view.firstChild !== undefined && isStandardDomNode(view.firstChild)) {
      return view;
    }
    return null;
  },
  getChildren(element) {
    if (Array.isArray(element.childNodes)) {
      return readChildNodes(element);
    }
    if (element.firstChild !== undefined) {
      return readLinkedList(element);
    }
    return [];
  },
  classify(node) {
    if (node.nodeType === 'text' || node.nodeType === 3) {
      return 'text';
    }
    if (node.nodeType === 'element' || node.nodeType === 1) {
      return 'element';
    }
    return 'none';
  },
  syntheticTextOnEmpty: true,
});
