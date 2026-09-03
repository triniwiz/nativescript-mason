import { render } from '@nativescript-community/solid-js';
import { Application } from '@nativescript/core';
import { document, makeView, registerElement, scope } from 'dominative';
import { App } from './app';
import { View } from '@triniwiz/nativescript-masonkit';
import { getMasonKitElements } from '@triniwiz/nativescript-masonkit/elements';

// Enable CSS preflight — browser-style normalization (box-sizing: border-box, margin: 0, etc.)
View.preflight = true;

/**
 * A dominative element backed by a mason view that accepts BOTH nested element
 * children (laid out by mason) and raw text-node children (rendered as mason
 * text nodes).
 *
 * dominative's stock policies don't cover this mix:
 *  - `layout` adds element children but silently drops text nodes
 *    (`if (!child.__dominative_isNative) return`)
 *  - `builder`/`makeText` flattens to a single `.text` string, losing the
 *    nested structure mason supports (e.g. nested coloured <span>s).
 *
 * So we start from the `layout` policy (for element children) and route text
 * nodes straight to mason's own `insertBefore`, which already creates a native
 * `MasonTextNode` per text node and positions it by index. `super.*` reaches
 * mason's real methods because undom only shadows them on the prototype chain
 * ABOVE this subclass.
 *
 * In-place text edits (`node.textContent = …`) are NOT handled here — once mason
 * adopts the text node it proxies the node's `data` accessor to the backing
 * native node, so edits propagate with no framework glue.
 */
function makeMasonElement(base: any) {
  const view: any = makeView(base, { childrenPolicy: 'layout' });

  return class MasonElement extends view {
    constructor(...args: any[]) {
      super(...args);
      this.__dominative_role = 'Layout';
    }

    __dominative_onInsertChild(child: any, ref: any) {
      // Text node → mason's text-node-aware insert. `ref` can be null even
      // when it's not the last child (dominative only tracks native element
      // refs); recover via the DOM next-sibling like the element branch below.
      if (child.nodeType === 3) {
        let effectiveRef = ref;
        if (!effectiveRef) {
          const nextSib = (child as any).nextSibling;
          if (nextSib != null) {
            effectiveRef = nextSib;
          }
        }
        try {
          super.insertBefore(child, effectiveRef ?? null);
          return;
        } catch (e) {
          // effectiveRef not trackable in the tree; fall back to plain insert
          super.insertBefore(child, ref ?? null);
          return;
        }
      }
      // Element child with no ref: dominative may have null-ified a text-node
      // anchor (e.g. SolidJS inserts br/span before a text sibling).
      // Recover the insertion position from the DOM next-sibling, which points
      // at the element that should come *after* child in the native tree.
      if (!ref) {
        const nextSib = (child as any).nextSibling;
        if (nextSib != null) {
          try {
            // mason's insertBefore resolves text-node refs via textNode_ lookup
            super.insertBefore(child, nextSib);
            return;
          } catch (e) {
            // nextSib not trackable in the Mason tree; fall through to addChild
          }
        }
        this.addChild(child);
        return;
      }
      // Element child with a native ref → standard layout insert.
      super.__dominative_onInsertChild(child, ref);
    }

    __dominative_onRemoveChild(child: any) {
      // Text node → mason removes the native MasonTextNode stamped on it
      // (super.removeChild = mason's, which now handles framework text nodes).
      if (child.nodeType === 3) {
        super.removeChild(child);
        return;
      }
      super.__dominative_onRemoveChild(child);
    }
  };
}

function safeRegister(key: string, maker: () => any) {
  try {
    registerElement(key, maker());
  } catch (e) {
    console.error(`[mason-reg] FAILED '${key}':`, e?.message ?? e, e?.stack);
  }
}

// Register every tag MasonKit can back, from the single canonical list
// (`@triniwiz/nativescript-masonkit/elements`) shared with the Angular
// integration — so this demo can't silently drift out of parity with it.
// Container elements (View, Div, headings, inline formatting, ...) get the
// dominative-aware `makeMasonElement` wrapper; leaf/void widgets (Img, Br,
// Input, TextArea) are registered as plain native views.
for (const { tag, ctor, isContainer } of getMasonKitElements()) {
  const key = tag.toLowerCase();
  // dominative pre-registers some tags (e.g. `span`, `button`) against core
  // NativeScript's own widgets; clear those so MasonKit's version wins.
  if (scope[key]) {
    delete scope[key];
  }
  safeRegister(key, () => (isContainer ? makeMasonElement(ctor) : makeView(ctor, {})));
}

Application.run({
  create: () => {
    render(App, document.body);
    return document;
  },
});
