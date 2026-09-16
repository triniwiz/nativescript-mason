import { registerAppFontsDirectory } from './fonts';

export { View } from './view';
export { Img } from './img';
export { Text } from './text';
export { Scroll } from './scroll';
export { Button } from './button';
export { Input } from './input';
export { Br } from './br';
export { TextNode } from './text-node';
export { Li } from './li';
export { OrderedList as Ol, UnorderedList as Ul } from './list';
export { TextArea } from './textarea';
export * from './web';

export { setCssDiagnostics, getCssDiagnostics, clearCssDiagnostics, formatCssDiagnostics, cssDiagnosticsEnabled } from './diagnostics';
export { setCssUnitContext, cssUnits } from './units';
export { frameworkRegistry, readChildNodes, readLinkedList, type MasonFrameworkAdapter, type MasonNodeKind } from './framework-registry';
export { registerAppFontsDirectory } from './fonts';

export type BoxShadowRenderMode = 'auto' | 'render-node' | 'software';

/**
 * Global override for the Android box shadow backend.
 * 'auto' (default) renders with RenderNode on API 31+ hardware canvases and
 * with bitmaps otherwise; the override applies process-wide, including to
 * already-attached views.
 */
export function setBoxShadowRenderMode(mode: BoxShadowRenderMode): void {
  org.nativescript.mason.masonkit.NodeHelper.getShared().setBoxShadowRenderMode(mode);
}

/**
 * Global override for the software shadow raster scale (a linear scale in
 * (0, 1]); pass null to restore the dynamic downsampling policy. Mostly
 * useful when visually comparing the two backends at equal fidelity.
 */
export function setBoxShadowSoftwareRasterScale(scale: number | null): void {
  org.nativescript.mason.masonkit.NodeHelper.getShared().setBoxShadowSoftwareRasterScale(scale ?? 0);
}

registerAppFontsDirectory();
