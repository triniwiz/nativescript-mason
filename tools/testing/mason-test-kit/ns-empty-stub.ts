// Stand-in for @nativescript/core modules that only contribute types or
// platform side effects to the property layer under test. font.ios.ts, for one,
// calls registerCustomFonts() at module scope, which walks the app bundle.
export class ImageSource {}
export class Font {
  static default = new Font();
  fontSize = 14;
  withFontSize() {
    return this;
  }
}
export function registerCustomFonts() {}
export function parseFont() {
  return {};
}
export const FontStyle = { normal: 'normal', italic: 'italic' };
export const FontWeight = { normal: '400', bold: '700' };
export const FontVariationSettings = { parse: () => [], toString: () => '' };
export default {};
