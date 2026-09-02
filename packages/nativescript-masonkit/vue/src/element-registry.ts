import { isKnownView, normalizeElementName, registerElement } from 'nativescript-vue';
import { Br, Button, Img, Input, Li, Ol, Scroll, Text, TextArea, Ul, View } from '@triniwiz/nativescript-masonkit';
import * as MasonKitWeb from '@triniwiz/nativescript-masonkit/web';

import { masonMeta } from './mason-meta';

type ElementClass = { new (...args: any[]): any; prototype: any };

export interface RegisterElementsOptions {
  /** Register MasonKit elements (`View`, `Text`, etc.). @default true */
  mason?: boolean;
  /** Register HTML-shaped elements from `@triniwiz/nativescript-masonkit/web`. @default true */
  web?: boolean;
}

/** Names this integration owns, normalized exactly as NativeScript-Vue does. */
const registered = new Set<string>();

function isMasonContainer(cls: ElementClass): boolean {
  const proto = cls?.prototype;
  return !!proto && typeof proto.insertChild === 'function' && typeof proto.addChild === 'function' && typeof proto.removeChild === 'function';
}

function register(name: string, cls: ElementClass): void {
  const key = name ? normalizeElementName(name) : '';
  if (!key || registered.has(key)) {
    return;
  }

  // Overwrite NativeScript core elements (e.g. Button, Span) so templates
  // resolve to MasonKit's Taffy-backed equivalents after installation.
  registerElement(name, () => cls, {
    ...(isMasonContainer(cls) ? masonMeta : undefined),
    overwriteExisting: isKnownView(name),
  });
  registered.add(key);
}

const MASON_ELEMENTS: Array<[string, ElementClass]> = [
  ['View', View],
  ['Text', Text],
  ['Scroll', Scroll],
  ['Img', Img],
  ['Button', Button],
  ['Input', Input],
  ['TextArea', TextArea],
  ['Br', Br],
  ['Ul', Ul],
  ['Ol', Ol],
  ['Li', Li],
];

/**
 * Register all requested MasonKit elements with NativeScript-Vue 3.
 * Idempotent; attaches {@link masonMeta} to containers so child order is preserved.
 */
export function registerMasonKitElements(options: RegisterElementsOptions = {}): void {
  const { mason = true, web = true } = options;

  if (web) {
    for (const exported of Object.values(MasonKitWeb) as ElementClass[]) {
      if (typeof exported !== 'function' || !exported.prototype) {
        continue;
      }
      register(exported.prototype.cssType, exported);
    }
  }

  if (mason) {
    for (const [name, cls] of MASON_ELEMENTS) {
      register(name, cls);
    }
  }
}
