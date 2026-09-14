import { registerElement } from '@nativescript/angular';
import { getMasonKitElements, type GetMasonKitElementsOptions } from '@triniwiz/nativescript-masonkit/elements';

import { masonMeta } from './mason-meta';

export type RegisterElementsOptions = GetMasonKitElementsOptions;

/**
 * Element names this package has already registered, so a second call (module
 * re-import, HMR) is a no-op rather than a duplicate registration.
 */
const registered = new Set<string>();

/**
 * Register MasonKit's elements with `@nativescript/angular`, each with the child
 * bookkeeping meta it needs (see {@link masonMeta}) when it manages children
 * through MasonKit's own child list.
 *
 * The tag list itself — including the "`/web`'s more specific element wins"
 * de-duplication between `/web` and MasonKit's own widgets — comes from the
 * shared {@link getMasonKitElements}, so it can never drift from what other
 * framework integrations register.
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
  for (const { tag, ctor, isContainer } of getMasonKitElements(options)) {
    // Compared lowercase: `getMasonKitElements` already de-dupes case-
    // insensitively across `/web` vs MasonKit's own widgets; this `registered`
    // set only guards against a second *call* to this function re-registering
    // the same tag.
    const key = tag.toLowerCase();
    if (registered.has(key)) {
      continue;
    }
    registered.add(key);
    // Pass the original casing through: `registerElement` also derives the
    // lowercase and kebab-case spellings from it, so registering `'TextArea'`
    // (not `'textarea'`) is what makes `<View>`, `<view>` AND `<text-area>`
    // all resolve.
    registerElement(tag, () => ctor, isContainer ? masonMeta : undefined);
  }
}
