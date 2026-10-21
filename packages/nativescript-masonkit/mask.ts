// Windows only (mask.windows.ts); iOS and Android parse masks natively.

/** What the encoder needs from the element's style. */
export interface WindowsMaskContext {
  /** A CSS length (not a percentage) in DIPs, or undefined. */
  length(token: string): number | undefined;
  /** A CSS colour as 0xAARRGGBB, or null. */
  color(value: string): number | null;
  linear(value: string): { angle: number; corner?: [number, number]; offsets: number[]; colors: number[] } | null;
  radial(value: string): { cx: number; cy: number; rx: number; ry: number; offsets: number[]; colors: number[] } | null;
  /** A url() target as a path or data URI the native side can load. */
  source(url: string): string;
}

/** background-origin / background-clip keywords; the CSS defaults are padding-box and border-box. */
export interface WindowsBackgroundBoxes {
  origin?: string;
  clip?: string;
}

/** The background-* longhands, each a comma-separated per-layer list. */
export interface WindowsBackgroundLonghands {
  image: string;
  size?: string;
  position?: string;
  repeat?: string;
  origin?: string;
  clip?: string;
  attachment?: string;
  blend?: string;
}

export const WINDOWS_MASK_PROPERTIES: ReadonlySet<string> = new Set();

export function encodeWindowsMask(_css: ReadonlyMap<string, string>, _ctx: WindowsMaskContext): string {
  return '';
}

export function encodeWindowsBackground(_url: string, _size: string, _position: string, _repeat: string, _ctx: WindowsMaskContext, _boxes: WindowsBackgroundBoxes = {}): string {
  return '';
}

export function encodeWindowsGradientBackground(_gradient: string, _size: string, _position: string, _repeat: string, _ctx: WindowsMaskContext, _boxes: WindowsBackgroundBoxes = {}): string {
  return '';
}

export function encodeWindowsColorClip(_clip: string, _ctx: WindowsMaskContext): string {
  return '';
}

export function needsWindowsBackgroundLayers(_css: WindowsBackgroundLonghands): boolean {
  return false;
}

export function encodeWindowsBackgroundLayers(_css: WindowsBackgroundLonghands, _ctx: WindowsMaskContext): string {
  return '';
}

export function hasCustomBackgroundBoxes(_boxes: WindowsBackgroundBoxes): boolean {
  return false;
}

export function encodeWindowsBorderImage(_value: string, _ctx: WindowsMaskContext): string {
  return '';
}
