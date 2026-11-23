// Windows and Linux send authored mask values to the Rust parser.

/** What the encoder needs from the element's style. */
export interface WindowsMaskContext {
  /** CSS px and ARGB for the native gradient parser. */
  gradientUnits(value: string): [fontSize: number, rootFontSize: number, viewportWidth: number, viewportHeight: number, color: number];
  /** A url() target as a path or data URI the native side can load. */
  source(url: string): string;
}

export const WINDOWS_MASK_PROPERTIES: ReadonlySet<string> = new Set();

export function encodeWindowsMask(_css: ReadonlyMap<string, string>, _ctx: WindowsMaskContext): string {
  return '';
}

export function encodeWindowsBorderImage(_value: string, _ctx: WindowsMaskContext): string {
  return '';
}
