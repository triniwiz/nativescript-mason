import { CoreTypes } from '@nativescript/core';

import { TSCViewBase } from './common';
import { LengthPercentage } from '@nativescript/core/css/parser';

export type Length = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit;

export type LengthAuto = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | 'auto';

export type SizeLength = { width: LengthType; height: LengthType };

export type Position = 'absolute' | 'relative';

export type Display = 'none' | 'flex' | 'grid' | 'block';

export type Overflow = 'visible' | 'hidden' | 'scroll';

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

export type GridAutoFlow = 'row' | 'column' | 'row dense' | 'column dense';

export { applyMixins } from './helpers';

export class TSCView extends TSCViewBase {
  display: Display;
  position: Position;
  flexDirection: FlexDirection;
  flexWrap: FlexWrap;
  flex: string | 'auto' | 'none' | number | 'initial';
  flexFlow: string;
  width: Length;
  height: Length;
  maxWidth: Length;
  maxHeight: Length;
  left: Length;
  right: Length;
  top: Length;
  bottom: Length;
  gridGap: Gap;
  gap: Gap;
  rowGap: Length;
  columnGap: Length;
  aspectRatio: number;
  flexBasis: Length;
  alignItems: AlignItems;
  alignSelf: import('@nativescript/core/ui/layouts/flexbox-layout').AlignSelf;
  alignContent: AlignContent;
  justifyItems: JustifyItems;
  justifySelf: JustifySelf;
  justifyContent: JustifyContent;
  gridAutoRows: string;
  gridAutoColumns: string;
  gridAutoFlow: GridAutoFlow;
  gridRowGap: Gap;
  gridColumnGap: Gap;
  gridArea: string;
  gridColumn: string;
  gridColumnStart: string;
  gridColumnEnd: string;
  gridRow: string;
  gridRowStart: string;
  gridRowEnd: string;
  gridTemplateRows: string;
  gridTemplateColumns: string;
  overflow: Overflow;
  overflowX: Overflow;
  overflowY: Overflow;
  scrollBarWidth: number | CoreTypes.LengthType;
}

export class Grid extends TSCView {}

export class Flex extends TSCView {}

export class Box extends TSCView {}

export class Container extends TSCView {}

declare module '@nativescript/core/ui/styling/style' {
  interface Style {
    display: Display;
    position: Position;
    flexDirection: FlexDirection;
    flexWrap: FlexWrap;
    flex: string | 'auto' | 'none' | number | 'initial';
    flexFlow: string;
    width: LengthPercentage | string | number;
    height: LengthPercentage | string | number;
    maxWidth: LengthPercentage | string | number;
    maxHeight: LengthPercentage | string | number;
    left: Length;
    right: Length;
    top: Length;
    bottom: Length;
    gridGap: Gap;
    gap: Gap;
    rowGap: Length;
    columnGap: Length;
    aspectRatio: number;
    flexBasis: LengthPercentage | string | number;
    alignItems: AlignItems;
    alignSelf: AlignSelf;
    alignContent: AlignContent;
    justifyItems: JustifyItems;
    justifySelf: JustifySelf;
    justifyContent: JustifyContent;
    gridAutoRows: string;
    gridAutoColumns: string;
    gridAutoFlow: GridAutoFlow;
    gridRowGap: Gap;
    gridColumnGap: Gap;
    gridArea: string;
    gridColumn: string;
    gridColumnStart: string;
    gridColumnEnd: string;
    gridRow: string;
    gridRowStart: string;
    gridRowEnd: string;
    gridTemplateRows: string;
    gridTemplateColumns: string;
    overflow: Overflow;
    overflowX: Overflow;
    overflowY: Overflow;
    scrollBarWidth: number | CoreTypes.LengthType;
  }
}
