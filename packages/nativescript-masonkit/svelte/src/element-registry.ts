import { NativeViewElementNode, registerElement, registerNativeViewElement } from 'svelte-native/dom';
import { Button, Label, Span } from '@nativescript/core';
import { getMasonKitElements, type GetMasonKitElementsOptions } from '@triniwiz/nativescript-masonkit/elements';
import { MasonElementNode } from './mason-element-node';

export type InstallMasonKitOptions = GetMasonKitElementsOptions;

/**
 * Core elements svelte-native registers under a name MasonKit also claims. They
 * stay reachable with an `n` prefix: `<nbutton>`, `<nlabel>` and `<nspan>`
 * (the last one inside `<label><formattedString>`, which needs core's `Span`).
 */
const CORE_ALIASES: Record<string, () => void> = {
  // Registered under their own names so property-element syntax binds.
  button: () => registerNativeViewElement('nbutton', () => Button),
  label: () => registerNativeViewElement('nlabel', () => Label),
  span: () => registerNativeViewElement('nspan', () => Span, 'spans'),
};

/** Lowercased names this integration owns (svelte-native lowercases too). */
const registered = new Set<string>();

/**
 * Register MasonKit's elements with svelte-native. Call before `svelteNative()`
 * so the first render resolves them. Idempotent, so safe under HMR.
 *
 * The tag list comes from the shared `getMasonKitElements`, so it cannot drift
 * from what the other framework integrations register.
 */
export function installMasonKit(options: InstallMasonKitOptions = {}): void {
  for (const { tag, ctor, isContainer } of getMasonKitElements(options)) {
    const key = tag.toLowerCase();
    if (registered.has(key)) continue;
    CORE_ALIASES[key]?.();
    registerElement(tag, () => (isContainer ? new MasonElementNode(tag, ctor) : new NativeViewElementNode(tag, ctor)), { override: true });
    registered.add(key);
  }
}
