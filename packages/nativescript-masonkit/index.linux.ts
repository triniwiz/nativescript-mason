import { Application } from '@nativescript/core';
import './native.linux';
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
import './inner-html-builder';

export { setCssDiagnostics, getCssDiagnostics, clearCssDiagnostics, formatCssDiagnostics, cssDiagnosticsEnabled } from './diagnostics';
export { setCssUnitContext, cssUnits } from './units';
export { frameworkRegistry, readChildNodes, readLinkedList, type MasonFrameworkAdapter, type MasonNodeKind } from './framework-registry';
export { hasTextRun } from './text-runs';
import { registerAppFontsDirectory } from './fonts';
export { registerAppFontsDirectory };

registerAppFontsDirectory();

// font-manager (or anything adding fonts to fontconfig) raises it: text lays out again
Application.on('fontsChanged', () => mason_gtk_fonts_changed());

export type BoxShadowRenderMode = 'auto' | 'render-node' | 'software';

// Android-only shadow backend overrides; Windows and Linux draw shadows natively.
export function setBoxShadowRenderMode(_mode: BoxShadowRenderMode): void {}

export function setBoxShadowSoftwareRasterScale(_scale: number | null): void {}
