import { Br, Button, Img, Input, Li, Ol, Scroll, Text, TextArea, Ul, View } from '.';
import * as MasonKitWeb from './web';

/** Anything constructible; the element resolvers are all `() => SomeViewClass`. */
export type ElementClass = { new (...args: any[]): any; prototype: any };

export interface GetMasonKitElementsOptions {
  /**
   * Include MasonKit's own elements: `View`, `Text`, `Scroll`, `Img`, `Button`,
   * `Input`, `TextArea`, `Br`, `Ul`, `Ol`, `Li`.
   *
   * @default true
   */
  mason?: boolean;
  /**
   * Include the HTML-shaped elements from `@triniwiz/nativescript-masonkit/web`
   * (`div`, `section`, `p`, `span`, `h1`-`h6`, `blockquote`, `code`, `em`, `i`,
   * `pre`, `a`, ...).
   *
   * @default true
   */
  web?: boolean;
}

export interface MasonKitElementEntry {
  /**
   * Tag name in its canonical spelling — lowercase HTML-style for `/web`
   * elements (`'div'`, `'h1'`), PascalCase for MasonKit's own widgets
   * (`'View'`, `'TextArea'`). De-duplication against other entries is
   * case-insensitive, but the original casing is preserved here because some
   * host frameworks (`@nativescript/angular`) derive additional spellings
   * (kebab-case) from it — lowercasing `'TextArea'` up front would silently
   * drop the `<text-area>` spelling.
   */
  tag: string;
  ctor: ElementClass;
  /**
   * True when the class manages children through MasonKit's own child list
   * (`insertChild`/`addChild`/`removeChild`) — i.e. it can host nested
   * elements and needs container-aware wiring in a host framework.
   *
   * False for leaf/void widgets (`Img`, `Br`, `Input`, `TextArea`) that have
   * no child API.
   */
  isContainer: boolean;
}

/**
 * True when the class manages children through MasonKit's own child list, i.e.
 * when a host framework needs container-aware wiring (Angular's `masonMeta`,
 * or a dominative-based demo's `makeMasonElement` wrapper) rather than
 * leaf/void handling.
 *
 * `Br` is the notable exception: it is a placeholder that extends core's
 * `ViewBase` and attaches straight to the Mason tree, so it has no child API.
 */
function isMasonContainer(cls: ElementClass): boolean {
  const proto = cls?.prototype;
  return !!proto && typeof proto.insertChild === 'function' && typeof proto.addChild === 'function' && typeof proto.removeChild === 'function';
}

/**
 * MasonKit's own elements, in the spelling the templates use.
 *
 * Listed *after* the `/web` elements on purpose: `/web` also exports `Ul`,
 * `Ol` and `Li`, and where the two overlap the rule is "the more specific one
 * wins" - `/web`'s `Li` is an inline `Text` subclass, so `<li>` stays inline,
 * while `<view>`, `<img>`, `<button>`, `<input>` and `<br>` resolve to the base
 * package's fully-featured widgets.
 */
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
 * The canonical, single-source-of-truth list of every tag MasonKit can back —
 * both the `/web` HTML-shaped elements and MasonKit's own widgets — with the
 * "more specific one wins" de-duplication already applied.
 *
 * Every host-framework integration (Angular, or a demo's own `registerElement`
 * loop) should build its tag registration off this list instead of hand-
 * maintaining its own, so adding a new tag here reaches every framework at
 * once instead of silently drifting between them.
 */
export function getMasonKitElements(options: GetMasonKitElementsOptions = {}): MasonKitElementEntry[] {
  const { mason = true, web = true } = options;
  const seen = new Set<string>();
  const out: MasonKitElementEntry[] = [];

  function add(tag: string | undefined, cls: ElementClass): void {
    const key = tag?.toLowerCase();
    if (!key || typeof cls !== 'function' || !cls.prototype || seen.has(key)) {
      return;
    }
    seen.add(key);
    // Preserve the original casing (see `MasonKitElementEntry.tag`) — only the
    // dedupe key is lowercased.
    out.push({ tag: tag as string, ctor: cls, isContainer: isMasonContainer(cls) });
  }

  if (web) {
    for (const exported of Object.values(MasonKitWeb) as ElementClass[]) {
      if (typeof exported !== 'function' || !exported.prototype) {
        continue;
      }
      // Every `/web` class carries its tag via `@CSSType('div')`, which the
      // decorator stamps onto the prototype. Reading it there - rather than
      // `constructor.name` - survives a release build's class-name mangling.
      add(exported.prototype.cssType, exported);
    }
  }

  if (mason) {
    for (const [name, cls] of MASON_ELEMENTS) {
      add(name, cls);
    }
  }

  return out;
}
