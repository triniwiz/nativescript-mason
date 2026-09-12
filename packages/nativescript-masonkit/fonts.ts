import { knownFolders, path } from '@nativescript/core';

let registered = false;

/**
 * Point the native font resolver at the app's `fonts` folder.
 *
 * iOS needs nothing here: the runtime registers every file in `app/fonts` with
 * CoreText at startup, so a custom `@font-face` family resolves by name.
 * Android has no system-wide registration, so the native side has to be told
 * where the bundled font files live before it can honour a custom family.
 */
export function registerAppFontsDirectory(): void {
  if (!__ANDROID__ || registered) {
    return;
  }
  registered = true;
  try {
    const dir = path.join(knownFolders.currentApp().path, 'fonts');
    org.nativescript.mason.masonkit.AppFonts.setFontsDirectory(dir);
  } catch (e) {
    registered = false;
  }
}
