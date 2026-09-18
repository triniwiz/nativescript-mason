import { Application } from '@nativescript/core';
import { ref } from 'nativescript-vue';

export type Appearance = 'light' | 'dark';

/**
 * The system appearance currently on screen.
 *
 * The app follows the OS: Android's `AppTheme` is `Theme.AppCompat.DayNight`
 * (with `values-night` resources and `uiMode` in `configChanges`), and
 * NativeScript swaps `ns-light` / `ns-dark` on the root view whenever the
 * system setting changes. The CSS tokens in app.css key off those classes, so
 * this ref exists only for screens that want to display the current mode.
 */
export const appearance = ref<Appearance>('light');

// `systemAppearance()` needs the Android context, which does not exist while
// the bundle is still evaluating - read it once the app is up instead.
Application.on(Application.displayedEvent, () => {
  appearance.value = Application.systemAppearance() === 'dark' ? 'dark' : 'light';
});

Application.on(Application.systemAppearanceChangedEvent, (args) => {
  appearance.value = args.newValue === 'dark' ? 'dark' : 'light';
});
