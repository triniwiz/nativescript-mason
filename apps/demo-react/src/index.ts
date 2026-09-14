import { document, makeView, registerElement, scope } from 'dominative';
import { startNativeScriptApp } from '@tanstack/react-nativescript-router';
import { router } from './app';
import { View } from '@triniwiz/nativescript-masonkit';
import { getMasonKitElements } from '@triniwiz/nativescript-masonkit/elements';

// Enable CSS preflight — browser-style normalization (box-sizing: border-box, margin: 0, etc.)
View.preflight = true;

/**
 * A dominative element backed by a mason view that accepts BOTH nested element
 * children and raw text-node children, rendered as mason text nodes.
 *
 * Ported as-is from demo-solid/src/index.ts: this glue lives at the dominative
 * layer, not the framework layer, so it's identical for React.
 */
function makeMasonElement(base: any) {
  const view: any = makeView(base, { childrenPolicy: 'layout' });

  return class MasonElement extends view {
    constructor(...args: any[]) {
      super(...args);
      this.__dominative_role = 'Layout';
    }

    __dominative_onInsertChild(child: any, ref: any) {
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
          super.insertBefore(child, ref ?? null);
          return;
        }
      }
      if (!ref) {
        const nextSib = (child as any).nextSibling;
        if (nextSib != null) {
          try {
            super.insertBefore(child, nextSib);
            return;
          } catch (e) {
            // fall through to addChild
          }
        }
        this.addChild(child);
        return;
      }
      super.__dominative_onInsertChild(child, ref);
    }

    __dominative_onRemoveChild(child: any) {
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
  } catch (e: any) {
    console.error(`[mason-reg] FAILED '${key}':`, e?.message ?? e, e?.stack);
  }
}

// Register every tag MasonKit can back, from the single canonical list
// (`@triniwiz/nativescript-masonkit/elements`) shared with demo-solid and the
// Angular integration — so this demo can't silently drift out of parity
// with them (previously only div/scroll/span/button were wired up here).
for (const { tag, ctor, isContainer } of getMasonKitElements()) {
  const key = tag.toLowerCase();
  // dominative pre-registers some tags (e.g. `span`, `button`) against core
  // NativeScript's own widgets; clear those so MasonKit's version wins.
  if (scope[key]) {
    delete scope[key];
  }
  safeRegister(key, () => (isContainer ? makeMasonElement(ctor) : makeView(ctor, {})));
}

void startNativeScriptApp({
  router,
  actionBarVisibility: 'always',
});
