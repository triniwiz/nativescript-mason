import { CoreTypes } from '@nativescript/core';

import { TextBase, ViewBase } from './common';
import { LengthPercentage } from '@nativescript/core/css/parser';

export type Length = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | CoreTypes.LengthPercentUnit | `${number}px` | `${number}%` | `${number}dip`;

export type LengthAuto = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | CoreTypes.LengthPercentUnit | 'auto' | `${number}px` | `${number}%` | `${number}dip`;

export type SizeLength = { width: LengthType; height: LengthType };

export type Position = 'absolute' | 'relative';

export type Display = 'none' | 'flex' | 'grid' | 'block' | 'inline' | 'inline-block' | 'inline-flex' | 'inline-grid';

export type BoxSizing = 'border-box' | 'content-box';

export type Overflow = 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto';

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

export type GridAutoFlow = 'row' | 'column' | 'row dense' | 'column dense' | 'dense';

export type VerticalAlign = 'baseline' | 'sub' | 'super' | 'text-top' | 'text-bottom' | 'middle' | 'top' | 'bottom' | Length | number;

declare module '@nativescript/core/ui/styling/style' {
  interface Style {
    boxSizing: BoxSizing;
    display: Display;
    position: Position;
    flexDirection: FlexDirection;
    flexWrap: FlexWrap;
    flex: string | 'auto' | 'none' | number | 'initial';
    flexFlow: string;
    minWidth: LengthAuto;
    minHeight: LengthAuto;
    width: LengthAuto;
    height: LengthAuto;
    maxWidth: LengthAuto;
    maxHeight: LengthAuto;
    left: LengthAuto;
    right: LengthAuto;
    top: LengthAuto;
    bottom: LengthAuto;
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
    overflow: Overflow | `${Overflow} ${Overflow}`;
    overflowX: Overflow;
    overflowY: Overflow;
    scrollBarWidth: Length;
    verticalAlign: VerticalAlign;
  }
}

interface Style {
  boxSizing: BoxSizing;
  display: Display;
  position: Position;
  flexDirection: FlexDirection;
  flexWrap: FlexWrap;
  flex: string | 'auto' | 'none' | number | 'initial';
  flexFlow: string;
  minWidth: LengthAuto;
  minHeight: LengthAuto;
  width: LengthAuto;
  height: LengthAuto;
  maxWidth: LengthAuto;
  maxHeight: LengthAuto;
  left: LengthAuto;
  right: LengthAuto;
  top: LengthAuto;
  bottom: LengthAuto;
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
  overflow: Overflow | `${Overflow} ${Overflow}`;
  overflowX: Overflow;
  overflowY: Overflow;
  scrollBarWidth: Length;
  verticalAlign: VerticalAlign;
}

interface IViewBase {
  style: Style;
  boxSizing: BoxSizing;
  display: Display;
  position: Position;
  flexDirection: FlexDirection;
  flexWrap: FlexWrap;
  flex: string | 'auto' | 'none' | number | 'initial';
  flexFlow: string;
  width: LengthAuto;
  height: LengthAuto;
  maxWidth: LengthAuto;
  maxHeight: LengthAuto;
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
  verticalAlign: VerticalAlign;
}

class VBase extends ViewBase implements IViewBase {
  style: Style;
}

export class View extends VBase {}

export class TextBase extends VBase {}

export class Text extends TextBase {}

export class Img extends VBase {
  src: string;
}

export class Scroll extends VBase {}

export class Button extends TextBase {}
