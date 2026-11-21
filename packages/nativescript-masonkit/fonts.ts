import { knownFolders, path } from '@nativescript/core';

let registered = false;

/**
 * Point the native font resolver at the app's `fonts` folder.
 *
 * iOS needs nothing here: the runtime registers every file in `app/fonts` with
 * CoreText at startup, so a custom `@font-face` family resolves by name.
 * Android and Linux (fontconfig) have no system-wide registration, so the native side has to
 * be told where the bundled font files live before it can honour a custom family.
 */
export function registerAppFontsDirectory(): void {
  if (!(__ANDROID__ || __LINUX__) || registered) {
    return;
  }
  registered = true;
  try {
    const dir = path.join(knownFolders.currentApp().path, 'fonts');
    if (__LINUX__) mason_gtk_register_fonts(dir);
    else org.nativescript.mason.masonkit.AppFonts.setFontsDirectory(dir);
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

/** Available families by lowercased name, mapped to the name the natives should use. */
const availableFamilies = new Map<string, string>();

/**
 * iOS: the family the natives should use for `family`, or undefined if there's no such font.
 * `UIFont.familyNames` leaves out a runtime-registered family that a hidden system font shares
 * (iOS ships a Bebas Neue in CoreUI), though its faces are still listed. A PostScript name
 * resolves to its family.
 */
function resolveAppleFontFamily(family: string, key: string): string | undefined {
  const names = UIFont.familyNames;
  for (let i = 0; i < names.count; i++) {
    if (names.objectAtIndex(i).toLowerCase() === key) return family;
  }
  if (UIFont.fontNamesForFamilyName(family).count > 0) return family;
  return UIFont.fontWithNameSize(family, 12)?.familyName;
}

/** The family name the natives should use for `family`, or undefined if it can't be drawn here. */
export function resolveFontFamily(family: string): string | undefined {
  const key = family.toLowerCase();
  const cached = availableFamilies.get(key);
  if (cached !== undefined) return cached;
  let found: string | undefined = family;
  if (__APPLE__) {
    found = resolveAppleFontFamily(family, key);
  } else if (__ANDROID__) {
    registerAppFontsDirectory();
    found = org.nativescript.mason.masonkit.AppFonts.resolve(family) != null || !android.graphics.Typeface.create(family, android.graphics.Typeface.NORMAL).equals(android.graphics.Typeface.DEFAULT) ? family : undefined;
  }
  // Only hits are cached: a family can be registered later, a font file can't disappear.
  if (found !== undefined) availableFamilies.set(key, found);
  return found;
}

/** Whether a named family can be drawn here: installed, registered from the app's fonts folder, or bundled. */
export function isFontFamilyAvailable(family: string): boolean {
  return resolveFontFamily(family) !== undefined;
}

/**
 * The single family the natives should use for a CSS `font-family` value: the first
 * family in the list that is generic or available, as CSS font matching picks it.
 * Quotes are removed, so `'Mukta Mahee'` and `Mukta Mahee` name the same family.
 * `resolve` may return the name to use instead (on iOS, a PostScript name's family).
 * Falls back to the first family named when none is available.
 */
export function pickFontFamily(value: string, resolve: (family: string) => string | boolean | undefined = resolveFontFamily): string {
  const families = parseFontFamilyList(value);
  if (families.length === 0) return value;
  for (const family of families) {
    if (GENERIC_FAMILIES.has(family.toLowerCase())) return family;
    const resolved = resolve(family);
    if (resolved) return typeof resolved === 'string' ? resolved : family;
  }
  return families[0];
}
