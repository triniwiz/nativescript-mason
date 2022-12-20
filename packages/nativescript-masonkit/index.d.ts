import { CoreTypes } from '@nativescript/core';

export type LengthType = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | 'auto';

export type SizeLengthType = { width: LengthType; height: LengthType };

export type PositionType = 'absolute' | 'relative';

export type DisplayType = 'flex' | 'none';

export type FlexWrapType = 'no-wrap' | 'wrap' | 'wrap-reverse';

export type FlexDirectionType = 'column' | 'row' | 'column-reverse' | 'row-reverse';

export type GapTypeUnitType = `px` | 'dip' | '%';

export type GapType = `${string}${GapTypeUnitType} ${string}${GapTypeUnitType}` | SizeLengthType | 'auto';

declare module '@nativescript/core/ui/styling/style' {
  interface Style {
    display: DisplayType;
    position: PositionType;
    flexDirection: FlexDirectionType;
    flexWrap: FlexWrapType;
    maxWidth: LengthType;
    maxHeight: LengthType;
    left: LengthType;
    right: LengthType;
    top: LengthType;
    bottom: LengthType;
    gap: GapType;
    aspectRatio: number;
  }
}
