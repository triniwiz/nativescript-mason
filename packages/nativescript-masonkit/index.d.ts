import { Color, CoreTypes } from '@nativescript/core';

import { TextBase, ViewBase } from './common';
import { LengthPercentage } from '@nativescript/core/css/parser';

export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'color' | 'checkbox' | 'radio' | 'button' | 'submit' | 'reset' | 'file' | 'range';

export type Length = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | CoreTypes.LengthPercentUnit | `${number}px` | `${number}%` | `${number}dip`;

export type LengthAuto = CoreTypes.dip | CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | CoreTypes.LengthPercentUnit | 'auto' | `${number}px` | `${number}%` | `${number}dip`;

export type DimensionKeyword = 'min-content' | 'max-content' | 'fit-content' | 'stretch' | 'content' | `fit-content(${string})`;

export type DimensionLength = LengthAuto | DimensionKeyword;

export type SizeLength = { width: LengthType; height: LengthType };

export type Position = 'absolute' | 'relative';

export type Display = 'none' | 'flex' | 'grid' | 'block' | 'inline' | 'inline-block' | 'inline-flex' | 'inline-grid';

export type BoxSizing = 'border-box' | 'content-box';

export type Overflow = 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto';

export type FlexWrap = 'no-wrap' | 'wrap' | 'wrap-reverse' | 'balance' | 'balance-reverse';

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

export type Float = 'left' | 'right' | 'none';

export type Clear = 'left' | 'right' | 'both' | 'none';

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
    width: DimensionLength;
    height: DimensionLength;
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
    flexBasis: LengthPercentage | DimensionKeyword | string | number;
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
    gridTemplateAreas: string;
    textOverflow: 'clip' | 'ellipsis' | string;
    textWrap: 'nowrap' | 'wrap' | 'balance';
    textTransform: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    overflow: Overflow | `${Overflow} ${Overflow}`;
    overflowX: Overflow;
    overflowY: Overflow;
    scrollBarWidth: Length;
    verticalAlign: VerticalAlign;
    cornerShape: string;
    cornerShapeTopLeft: string;
    cornerShapeTopRight: string;
    cornerShapeBottomRight: string;
    cornerShapeBottomLeft: string;
    objectPosition: string;
    borderStyle: string;
    borderLeftStyle: string;
    borderRightStyle: string;
    borderTopStyle: string;
    borderBottomStyle: string;
    borderImage: string;
    fontStretch: string;
    fontFeatureSettings: string;
    wordSpacing: string;
    hyphens: 'none' | 'manual' | 'auto';
    writingMode: 'horizontal-tb' | 'horizontal-lr' | 'vertical-rl' | 'vertical-lr';
    unicodeBidi: 'normal' | 'embed' | 'bidi-override';
    backdropFilter: string;
    caretColor: string | Color;
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
  width: DimensionLength;
  height: DimensionLength;
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
  flexBasis: LengthPercentage | DimensionKeyword | string | number;
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
  gridTemplateAreas: string;
  textOverflow: 'clip' | 'ellipsis' | string;
  textWrap: 'nowrap' | 'wrap' | 'balance';
  textTransform: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  overflow: Overflow | `${Overflow} ${Overflow}`;
  overflowX: Overflow;
  overflowY: Overflow;
  scrollBarWidth: Length;
  verticalAlign: VerticalAlign;
  cornerShape: string;
  cornerShapeTopLeft: string;
  cornerShapeTopRight: string;
  cornerShapeBottomRight: string;
  cornerShapeBottomLeft: string;
  objectPosition: string;
  borderStyle: string;
  borderLeftStyle: string;
  borderRightStyle: string;
  borderTopStyle: string;
  borderBottomStyle: string;
  borderImage: string;
  fontStretch: string;
  fontFeatureSettings: string;
  wordSpacing: string;
  hyphens: 'none' | 'manual' | 'auto';
  writingMode: 'horizontal-tb' | 'horizontal-lr' | 'vertical-rl' | 'vertical-lr';
  unicodeBidi: 'normal' | 'embed' | 'bidi-override';
  backdropFilter: string;
  caretColor: string | Color;
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
  width: DimensionLength;
  height: DimensionLength;
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
  flexBasis: DimensionLength;
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
  gridTemplateAreas: string;
  textOverflow: 'clip' | 'ellipsis' | string;
  textWrap: 'nowrap' | 'wrap' | 'balance';
  textTransform: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  overflow: Overflow;
  overflowX: Overflow;
  overflowY: Overflow;
  scrollBarWidth: number | CoreTypes.LengthType;
  verticalAlign: VerticalAlign;
  cornerShape: string;
  cornerShapeTopLeft: string;
  cornerShapeTopRight: string;
  cornerShapeBottomRight: string;
  cornerShapeBottomLeft: string;
  objectPosition: string;
  borderStyle: string;
  borderLeftStyle: string;
  borderRightStyle: string;
  borderTopStyle: string;
  borderBottomStyle: string;
  borderImage: string;
  fontStretch: string;
  fontFeatureSettings: string;
  wordSpacing: string;
  hyphens: 'none' | 'manual' | 'auto';
  writingMode: 'horizontal-tb' | 'horizontal-lr' | 'vertical-rl' | 'vertical-lr';
  unicodeBidi: 'normal' | 'embed' | 'bidi-override';
  backdropFilter: string;
  caretColor: string | Color;
  elementFromPoint(x: number, y: number): ViewBase | null;
}

class VBase extends ViewBase implements IViewBase {
  style: Style;

  /**
   * Enable or disable CSS defaults
   * for the entire Mason tree.
   *
   * When `true` every element starts from a clean, browser-normalised slate:
   *  - `box-sizing: border-box`
   *  - `margin: 0`, `padding: 0`, `border-width: 0`
   *  - `background: transparent`
   *  - `list-style: none` on lists
   *  - `display: block` on `<img>`
   *
   * This is a **tree-global** flag; set it **before** creating views for the
   * cleanest result.
   *
   * @example
   * ```ts
   * import { View } from '@triniwiz/nativescript-masonkit';
   * View.preflight = true; // enable at app startup
   * ```
   */
  static preflight: boolean;

  /**
   * Returns the top-most Mason/NativeScript element at a point in this view's
   * visible local coordinate space.
   */
  elementFromPoint(x: number, y: number): ViewBase | null;
}

export class View extends VBase {}

export class TextBase extends VBase {
  textContent: string;
}

export class Text extends TextBase {}

export class Img extends VBase {
  src: string;
}

export class Scroll extends VBase {}

export class Button extends TextBase {}

export class Br extends TextBase {}

export class InputBase extends VBase {}

export class Input extends InputBase {}

export class TextNode {
  data: string;

  readonly length: number;

  appendData(s: string): this;

  deleteData(offset: number, count: number): this;

  insertData(s: string, offset: number): this;

  substringData(offset: number, count: number): string;
}

export class Ul extends VBase {}

export class Ol extends VBase {}

export class Li extends VBase {}

export class TextAreaBase extends InputBase {}

export class TextArea extends TextAreaBase {}
