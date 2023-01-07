import { CoreTypes } from '@nativescript/core';

export type Length = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit;

export type LengthAuto = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | 'auto';

export type SizeLength = { width: LengthType; height: LengthType };

export type Position = 'absolute' | 'relative';

export type Display = 'none' | 'flex' | 'grid';

export type FlexWrap = 'no-wrap' | 'wrap' | 'wrap-reverse';

export type FlexDirection = 'column' | 'row' | 'column-reverse' | 'row-reverse';

export type GapTypeUnit = `px` | 'dip' | '%';

export type Gap = `${string}${GapTypeUnit} ${string}${GapTypeUnit}` | SizeLengthType;

export type AlignItems = 'normal' | 'flex-start' | 'flex-end' | 'start' | 'end' | 'center' | 'baseline' | 'stretch';

export type AlignSelf = 'normal' | 'flex-start' | 'flex-end' | 'start' | 'end' | 'center' | 'baseline' | 'stretch';

export type AlignContent = 'normal' | 'flex-start' | 'flex-end' | 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';

export type JustifyItems = AlignItems;

export type JustifySelf = AlignSelf;

export type JustifyContent = AlignContent;

export type GridAutoFlow = 'row' | 'column' | 'row-dense' | 'column-dense';

declare module '@nativescript/core/ui/styling/style' {
  interface Style {
    display: Display;
    position: Position;
    flexDirection: FlexDirection;
    flexWrap: FlexWrap;
    maxWidth: Length;
    maxHeight: Length;
    left: Length;
    right: Length;
    top: Length;
    bottom: Length;
    gap: Gap;
    rowGap: Length;
    columnGap: Length;
    aspectRatio: number;

    alignItems: AlignItems;
    alignSelf: AlignSelf;
    alignContent: AlignContent;

    justifyItems: JustifyItems;
    justifySelf: JustifySelf;
    justifyContent: JustifyContent;

    gridAutoRows: string;
    gridAutoColumns: string;
    gridAutoFlow: GridAutoFlow;

    gridArea: string;

    gridColumn: string;
    gridColumnStart: string;
    gridColumnEnd: string;

    gridRow: string;
    gridRowStart: string;
    gridRowEnd: string;

    gridTemplateRows: string;
    gridTemplateColumns: string;
  }
}
