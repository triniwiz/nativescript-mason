import { CoreTypes } from '@nativescript/core';
declare module '@nativescript/core/ui/styling/style' {
  interface Style {
    maxWidth: CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | 'auto';
    maxHeight: CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | 'auto';
  }
}
