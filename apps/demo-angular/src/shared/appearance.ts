import { signal } from '@angular/core';
import { Application } from '@nativescript/core';

export type Appearance = 'light' | 'dark';

/**
 * The system appearance on screen. The CSS tokens in `_theme.scss` follow the `ns-light` / `ns-dark` classes
 * NativeScript puts on the root view, so only screens that display the mode need this.
 */
export const appearance = signal<Appearance>('light');

// `systemAppearance()` needs the Android context, which does not exist while the bundle is still evaluating.
Application.on(Application.displayedEvent, () => appearance.set(Application.systemAppearance() === 'dark' ? 'dark' : 'light'));
Application.on(Application.systemAppearanceChangedEvent, (args) => appearance.set(args.newValue === 'dark' ? 'dark' : 'light'));
