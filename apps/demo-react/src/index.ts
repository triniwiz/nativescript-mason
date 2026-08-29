import { startReactApp } from '@nativescript-community/react';
import { Application } from '@nativescript/core';
import { document, makeView, registerElement, scope } from 'dominative';
import { App } from './app';
import { Div, Span } from '@triniwiz/nativescript-masonkit/web';
import { Button, Scroll, View } from '@triniwiz/nativescript-masonkit';

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

safeRegister('div', () => makeMasonElement(Div));
safeRegister('scroll', () => makeMasonElement(Scroll));
delete scope['span'];
safeRegister('span', () => makeMasonElement(Span));
delete scope['button'];
safeRegister('button', () => makeMasonElement(Button));

startReactApp({
  Application,
  root: App,
});
