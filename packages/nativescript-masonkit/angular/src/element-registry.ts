import { registerElement } from '@nativescript/angular';
import { Br, Button, Img, Input, Li, Ol, Scroll, Text, TextArea, Ul, View } from '@triniwiz/nativescript-masonkit';
import * as MasonKitWeb from '@triniwiz/nativescript-masonkit/web';

import { masonMeta } from './mason-meta';

/** Anything constructible; the element resolvers are all `() => SomeViewClass`. */
type ElementClass = { new (...args: any[]): any; prototype: any };

export interface RegisterElementsOptions {
  /**
   * Register MasonKit's own elements: `View`, `Text`, `Scroll`, `Img`, `Button`,
   * `Input`, `TextArea`, `Br`, `Ul`, `Ol`, `Li`.
   *
   * @default true
   */
  mason?: boolean;
  /**
   * Register the HTML-shaped elements from `@triniwiz/nativescript-masonkit/web`
   * (`div`, `section`, `p`, `span`, `h1`–`h6`, `blockquote`, `code`, `a`, ...).
   *
   * @default true
   */
  web?: boolean;
}

/**
 * Element names this package has already registered, so a second call (module
 * re-import, HMR) is a no-op rather than a duplicate registration.
 */
const registered = new Set<string>();

/**
 * True when the class manages children through MasonKit's own child list, i.e.
 * when {@link masonMeta} is the right contract for it.
 *
 * `Br` is the notable exception: it is a placeholder that extends core's
 * `ViewBase` and attaches straight to the Mason tree, so it has no child API and
 * must keep the default meta.
 */
function isMasonContainer(cls: ElementClass): boolean {
  const proto = cls?.prototype;
  return !!proto && typeof proto.insertChild === 'function' && typeof proto.addChild === 'function' && typeof proto.removeChild === 'function';
}

function register(name: string, cls: ElementClass): void {
  // Compared lowercase: `registerElement` stores every spelling of a name, so
  // registering `Ul` after `/web` already claimed `ul` would silently overwrite
  // it. Case-insensitive dedupe is what makes "first registration wins" real.
  const key = name?.toLowerCase();
  if (!key || registered.has(key)) {
    return;
  }
  registered.add(key);
  // `registerElement` also stores the lowercase and kebab-case spellings, so a
  // single call covers `<View>`, `<view>` and `<text-area>`.
  registerElement(name, () => cls, isMasonContainer(cls) ? masonMeta : undefined);
}

/**
 * MasonKit's own elements, in the spelling the templates use.
 *
 * Registered *after* the `/web` elements on purpose: `/web` also exports `Ul`,
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
 * Register MasonKit's elements with `@nativescript/angular`, each with the child
 * bookkeeping meta it needs (see {@link masonMeta}).
 *
 * Safe to call more than once - later calls skip names already registered here.
 *
 * ## Shadowing
 *
 * `registerElement` overwrites silently, and `@nativescript/angular` registers
 * every element under its original, lowercase and kebab spellings. MasonKit's
 * `Button`, `Img` and `/web`'s `Span` therefore *replace* core's `Button`,
 * `img` (`Image`) and `Span` for Angular templates. That is the intent - these
 * are the MasonKit-laid-out equivalents - but it is why `mason`/`web` can each
 * be turned off if an app wants to keep the classic widgets.
 */
export function registerMasonKitElements(options: RegisterElementsOptions = {}): void {
  const { mason = true, web = true } = options;

  if (web) {
    for (const exported of Object.values(MasonKitWeb) as ElementClass[]) {
      if (typeof exported !== 'function' || !exported.prototype) {
        continue;
      }
      // Every `/web` class carries its tag via `@CSSType('div')`, which the
      // decorator stamps onto the prototype. Reading it there - rather than
      // `constructor.name` - survives the demo's `uglify: true` release build,
      // where class names are mangled to single letters.
      register(exported.prototype.cssType, exported);
    }
  }

  if (mason) {
    for (const [name, cls] of MASON_ELEMENTS) {
      register(name, cls);
    }
  }
}
