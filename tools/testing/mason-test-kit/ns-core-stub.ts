// Stand-in for the `@nativescript/core` barrel.
//
// The barrel re-exports the entire framework as one module; importing it in Node
// drags in the application lifecycle and the HTTP stack. Every symbol masonkit
// takes from it lives in a leaf module, so this re-exports those directly — the
// classes are the real ones, not fakes, which is the point: properties.ts
// registers onto core's actual property system.
export { Color } from '@nativescript/core/color';
export { Length, PercentLength, FixedLength } from '@nativescript/core/ui/styling/length-shared';
// core-types exports the CoreTypes namespace as a named export, not as the
// module namespace — `import * as` would give a wrapper without .VerticalAlignmentText.
export { CoreTypes } from '@nativescript/core/core-types';
export { makeParser, makeValidator } from '@nativescript/core/core-types/validators';
export { Trace } from '@nativescript/core/trace';
export { Property, CoercibleProperty, InheritedProperty, CssProperty, CssAnimationProperty, InheritedCssProperty, ShorthandProperty, unsetValue, _getProperties, _getStyleProperties } from '@nativescript/core/ui/core/properties';
export { Style } from '@nativescript/core/ui/styling/style';
export { ViewBase } from '@nativescript/core/ui/core/view-base';
export { Font } from '@nativescript/core/ui/styling/font';
export { backgroundColorProperty, borderBottomWidthProperty, borderLeftWidthProperty, borderRightWidthProperty, borderTopWidthProperty, colorProperty, fontSizeProperty, fontStyleProperty, fontWeightProperty, heightProperty, marginBottomProperty, marginLeftProperty, marginRightProperty, marginTopProperty, minHeightProperty, minWidthProperty, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, verticalAlignmentProperty, widthProperty, zIndexProperty } from '@nativescript/core/ui/styling/style-properties';
export { letterSpacingProperty, lineHeightProperty, textAlignmentProperty, textDecorationProperty, textTransformProperty, textShadowProperty } from '@nativescript/core/ui/text-base/text-base-common';
export { getViewById } from '@nativescript/core/ui/core/view-base';
export { CustomLayoutView, View } from '@nativescript/core/ui/core/view';
export { PseudoClassHandler, CSSType } from '@nativescript/core/ui/core/view/view-common';
export { Screen } from '@nativescript/core/platform';

// AddChildFromBuilder is an interface, so it has no runtime export; a value
// import of the name still has to resolve.
export const AddChildFromBuilder = undefined as never;
