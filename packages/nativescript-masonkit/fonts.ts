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

const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math']);

/** Splits a CSS `font-family` list into family names, without their quotes. */
export function parseFontFamilyList(value: string): string[] {
  const families: string[] = [];
  let current = '';
  let quote: string | null = null;
  for (const ch of value) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ',') {
      families.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  families.push(current);
  return families.map((family) => family.trim().replace(/\s+/g, ' ')).filter(Boolean);
}

const availableFamilies = new Set<string>();

/** Whether a named family can be drawn here: installed, registered from the app's fonts folder, or bundled. */
export function isFontFamilyAvailable(family: string): boolean {
  const key = family.toLowerCase();
  if (availableFamilies.has(key)) return true;
  let found = true;
  if (__APPLE__) {
    found = false;
    const names = UIFont.familyNames;
    for (let i = 0; i < names.count; i++) {
      if (names.objectAtIndex(i).toLowerCase() === key) {
        found = true;
        break;
      }
    }
  } else if (__ANDROID__) {
    registerAppFontsDirectory();
    found = org.nativescript.mason.masonkit.AppFonts.resolve(family) != null || !android.graphics.Typeface.create(family, android.graphics.Typeface.NORMAL).equals(android.graphics.Typeface.DEFAULT);
  }
  // Only hits are cached: a family can be registered later, a font file can't disappear.
  if (found) availableFamilies.add(key);
  return found;
}

/**
 * The single family the natives should use for a CSS `font-family` value: the first
 * family in the list that is generic or available, as CSS font matching picks it.
 * Quotes are removed, so `'Mukta Mahee'` and `Mukta Mahee` name the same family.
 * Falls back to the first family named when none is available.
 */
export function pickFontFamily(value: string, isAvailable: (family: string) => boolean = isFontFamilyAvailable): string {
  const families = parseFontFamilyList(value);
  if (families.length === 0) return value;
  return families.find((family) => GENERIC_FAMILIES.has(family.toLowerCase()) || isAvailable(family)) ?? families[0];
}
