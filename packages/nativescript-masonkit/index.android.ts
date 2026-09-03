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
export { registerAppFontsDirectory } from './fonts';

registerAppFontsDirectory();
