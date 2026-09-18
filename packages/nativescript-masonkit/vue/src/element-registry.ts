import { getViewClass, getViewMeta, isKnownView, normalizeElementName, registerElement } from 'nativescript-vue';
import { getMasonKitElements, type ElementClass, type GetMasonKitElementsOptions } from '@triniwiz/nativescript-masonkit/elements';

import { masonMeta } from './mason-meta';

export type InstallMasonKitOptions = GetMasonKitElementsOptions;

/** Names this integration owns, normalized exactly as NativeScript-Vue does. */
const registered = new Set<string>();

/**
 * Keep a tag NativeScript-Vue already registers (core's `Button`, `Span`, ...)
 * reachable as `n<tag>` before MasonKit's element takes over the real name, so
 * `<button>`/`<span>` are MasonKit's and `<nbutton>`/`<nspan>` are core's.
 *
 * Core's `Span` matters most: NativeScript-Vue's `FormattedString` element
 * pushes its children straight into `nativeView.spans`, so
 * `<Label><FormattedString><nspan>` still needs the core class.
 */
function preserveCoreElement(tag: string): void {
  const alias = `n${tag}`;
  if (!isKnownView(tag) || isKnownView(alias)) {
    return;
  }
  // Resolve eagerly: once `tag` is overwritten, `getViewClass(tag)` would
  // return MasonKit's class instead.
  const coreClass = getViewClass(tag);
  registerElement(alias, () => coreClass, getViewMeta(tag));
}

function register(tag: string, cls: ElementClass, isContainer: boolean): void {
  const key = tag ? normalizeElementName(tag) : '';
  if (!key || registered.has(key)) {
    return;
  }

  preserveCoreElement(tag);
  registerElement(tag, () => cls, {
    ...(isContainer ? masonMeta : undefined),
    overwriteExisting: isKnownView(tag),
  });
  registered.add(key);
}

/**
 * Install MasonKit's Vue 3 integration: register all requested MasonKit
 * elements with NativeScript-Vue 3.
 *
 * Call before `createApp(...).start()` so element registration is complete
 * before the first template renders. Idempotent - safe to call repeatedly,
 * including during HMR. Attaches {@link masonMeta} to containers so child
 * order is preserved.
 *
 * The tag list itself — including the "`/web`'s more specific element wins"
 * de-duplication between `/web` and MasonKit's own widgets — comes from the
 * shared {@link getMasonKitElements}, so it can never drift from what other
 * framework integrations register.
 */
export function installMasonKit(options: InstallMasonKitOptions = {}): void {
  for (const { tag, ctor, isContainer } of getMasonKitElements(options)) {
    register(tag, ctor, isContainer);
  }
}
