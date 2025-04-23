import { layout } from '@nativescript/core/utils';
import type { Gap, GridAutoFlow, Length, LengthAuto, View } from '.';
import { CoreTypes } from '@nativescript/core';
import { mason, node } from './common';
import { AlignContent, AlignSelf, AlignItems, JustifyContent, JustifySelf } from './helpers';

enum StyleKeys {
  DISPLAY = 0,
  POSITION = 4,
  DIRECTION = 8,
  FLEX_DIRECTION = 12,
  FLEX_WRAP = 16,
  OVERFLOW_X = 20,
  OVERFLOW_Y = 24,

  ALIGN_ITEMS = 28,
  ALIGN_SELF = 32,
  ALIGN_CONTENT = 36,

  JUSTIFY_ITEMS = 40,
  JUSTIFY_SELF = 44,
  JUSTIFY_CONTENT = 48,

  INSET_LEFT_TYPE = 52,
  INSET_LEFT_VALUE = 56,
  INSET_RIGHT_TYPE = 60,
  INSET_RIGHT_VALUE = 64,
  INSET_TOP_TYPE = 68,
  INSET_TOP_VALUE = 72,
  INSET_BOTTOM_TYPE = 76,
  INSET_BOTTOM_VALUE = 80,

  MARGIN_LEFT_TYPE = 84,
  MARGIN_LEFT_VALUE = 88,
  MARGIN_RIGHT_TYPE = 92,
  MARGIN_RIGHT_VALUE = 96,
  MARGIN_TOP_TYPE = 100,
  MARGIN_TOP_VALUE = 104,
  MARGIN_BOTTOM_TYPE = 108,
  MARGIN_BOTTOM_VALUE = 112,

  PADDING_LEFT_TYPE = 116,
  PADDING_LEFT_VALUE = 120,
  PADDING_RIGHT_TYPE = 124,
  PADDING_RIGHT_VALUE = 128,
  PADDING_TOP_TYPE = 132,
  PADDING_TOP_VALUE = 136,
  PADDING_BOTTOM_TYPE = 140,
  PADDING_BOTTOM_VALUE = 144,

  BORDER_LEFT_TYPE = 148,
  BORDER_LEFT_VALUE = 152,
  BORDER_RIGHT_TYPE = 156,
  BORDER_RIGHT_VALUE = 160,
  BORDER_TOP_TYPE = 164,
  BORDER_TOP_VALUE = 168,
  BORDER_BOTTOM_TYPE = 172,
  BORDER_BOTTOM_VALUE = 176,

  FLEX_GROW = 180,
  FLEX_SHRINK = 184,

  FLEX_BASIS_TYPE = 188,
  FLEX_BASIS_VALUE = 192,

  WIDTH_TYPE = 196,
  WIDTH_VALUE = 200,
  HEIGHT_TYPE = 204,
  HEIGHT_VALUE = 208,

  MIN_WIDTH_TYPE = 212,
  MIN_WIDTH_VALUE = 216,
  MIN_HEIGHT_TYPE = 220,
  MIN_HEIGHT_VALUE = 224,

  MAX_WIDTH_TYPE = 228,
  MAX_WIDTH_VALUE = 232,
  MAX_HEIGHT_TYPE = 236,
  MAX_HEIGHT_VALUE = 240,

  GAP_ROW_TYPE = 244,
  GAP_ROW_VALUE = 248,
  GAP_COLUMN_TYPE = 252,
  GAP_COLUMN_VALUE = 256,

  ASPECT_RATIO = 260,
  GRID_AUTO_FLOW = 264,
  GRID_COLUMN_START_TYPE = 268,
  GRID_COLUMN_START_VALUE = 272,
  GRID_COLUMN_END_TYPE = 276,
  GRID_COLUMN_END_VALUE = 280,
  GRID_ROW_START_TYPE = 284,
  GRID_ROW_START_VALUE = 288,
  GRID_ROW_END_TYPE = 292,
  GRID_ROW_END_VALUE = 296,
  SCROLLBAR_WIDTH = 300,
  TEXT_ALIGN = 304,
  BOX_SIZING = 308,
  OVERFLOW = 312,
  ITEM_IS_TABLE = 316, //Byte
}

enum TextStyleKeys {
  COLOR = 0,
  DECORATION_LINE = 4,
  DECORATION_COLOR = 8,
  TEXT_ALIGN = 12,
  TEXT_JUSTIFY = 16,
  BACKGROUND_COLOR = 20,
  SIZE = 24,
  TRANSFORM = 28,
  FONT_STYLE_TYPE = 32,
  FONT_STYLE_SLANT = 36,
  TEXT_WRAP = 40,
}

export type OverFlow = 'visible' | 'hidden' | 'scroll';

function parseLengthPercentageAuto(type: number, value: number): LengthAuto {
  switch (type) {
    case 0:
      return 'auto';
    case 1:
      return { value, unit: 'px' };
    case 2:
      return { value, unit: '%' };
  }
}

function parseLengthPercentage(type: number, value: number): Length {
  switch (type) {
    case 1:
      return { value, unit: 'px' };
    case 2:
      return { value, unit: '%' };
  }
}

class StateKeys {
  private constructor(public readonly bits: bigint) {}

  static readonly DISPLAY = new StateKeys(1n << 0n);
  static readonly POSITION = new StateKeys(1n << 1n);
  static readonly DIRECTION = new StateKeys(1n << 2n);
  static readonly FLEX_DIRECTION = new StateKeys(1n << 3n);
  static readonly FLEX_WRAP = new StateKeys(1n << 4n);
  static readonly OVERFLOW_X = new StateKeys(1n << 5n);
  static readonly OVERFLOW_Y = new StateKeys(1n << 6n);
  static readonly ALIGN_ITEMS = new StateKeys(1n << 7n);
  static readonly ALIGN_SELF = new StateKeys(1n << 8n);
  static readonly ALIGN_CONTENT = new StateKeys(1n << 9n);
  static readonly JUSTIFY_ITEMS = new StateKeys(1n << 10n);
  static readonly JUSTIFY_SELF = new StateKeys(1n << 11n);
  static readonly JUSTIFY_CONTENT = new StateKeys(1n << 12n);
  static readonly INSET = new StateKeys(1n << 13n);
  static readonly MARGIN = new StateKeys(1n << 14n);
  static readonly PADDING = new StateKeys(1n << 15n);
  static readonly BORDER = new StateKeys(1n << 16n);
  static readonly FLEX_GROW = new StateKeys(1n << 17n);
  static readonly FLEX_SHRINK = new StateKeys(1n << 18n);
  static readonly FLEX_BASIS = new StateKeys(1n << 19n);
  static readonly SIZE = new StateKeys(1n << 20n);
  static readonly MIN_SIZE = new StateKeys(1n << 21n);
  static readonly MAX_SIZE = new StateKeys(1n << 22n);
  static readonly GAP = new StateKeys(1n << 23n);
  static readonly ASPECT_RATIO = new StateKeys(1n << 24n);
  static readonly GRID_AUTO_FLOW = new StateKeys(1n << 25n);
  static readonly GRID_COLUMN = new StateKeys(1n << 26n);
  static readonly GRID_ROW = new StateKeys(1n << 27n);
  static readonly SCROLLBAR_WIDTH = new StateKeys(1n << 28n);
  static readonly TEXT_ALIGN = new StateKeys(1n << 29n);
  static readonly BOX_SIZING = new StateKeys(1n << 30n);
  static readonly OVERFLOW = new StateKeys(1n << 31n);
  static readonly ITEM_IS_TABLE = new StateKeys(1n << 32n);

  or(other: StateKeys): StateKeys {
    return new StateKeys(this.bits | other.bits);
  }

  and(other: StateKeys): StateKeys {
    return new StateKeys(this.bits & other.bits);
  }

  hasFlag(flag: StateKeys): boolean {
    return (this.bits & flag.bits) !== 0n;
  }
}

class TextStateKeys {
  constructor(public readonly bits: bigint) {}

  static readonly COLOR = new TextStateKeys(1n << 0n);
  static readonly DECORATION_LINE = new TextStateKeys(1n << 1n);
  static readonly DECORATION_COLOR = new TextStateKeys(1n << 2n);
  static readonly TEXT_ALIGN = new TextStateKeys(1n << 3n);
  static readonly TEXT_JUSTIFY = new TextStateKeys(1n << 4n);
  static readonly BACKGROUND_COLOR = new TextStateKeys(1n << 5n);

  static readonly SIZE = new TextStateKeys(1n << 6n);
  static readonly TRANSFORM = new TextStateKeys(1n << 7n);
  static readonly FONT_STYLE = new TextStateKeys(1n << 8n);
  static readonly FONT_STYLE_SLANT = new TextStateKeys(1n << 9n);
  static readonly TEXT_WRAP = new TextStateKeys(1n << 10n);

  or(other: TextStateKeys): TextStateKeys {
    return new TextStateKeys(this.bits | other.bits);
  }

  and(other: TextStateKeys): TextStateKeys {
    return new TextStateKeys(this.bits & other.bits);
  }

  hasFlag(flag: TextStateKeys): boolean {
    return (this.bits & flag.bits) !== 0n;
  }
}

export class Style {
  private view_: View;
  private style_view: DataView;
  private text_style_view?: DataView;
  private isDirty = -1n;
  private isTextDirty = -1n;
  private inBatch = false;
  static fromView(view: View, nativeView, isText = false): Style {
    //console.time('fromView');
    const ret = new Style();
    ret.view_ = view;
    if (__ANDROID__) {
      const style = (nativeView as org.nativescript.mason.masonkit.TextView).getStyle();
      if (!isText) {
        const styleBuffer = style.getValues();
        const buffer = (<any>ArrayBuffer).from(styleBuffer);
        ret.style_view = new DataView(buffer);
      } else {
        const styleBuffer = style.getValues();
        const buffer = (<any>ArrayBuffer).from(styleBuffer);
        ret.style_view = new DataView(buffer);

        const textStyleBuffer = (nativeView as org.nativescript.mason.masonkit.TextView).getTextValues();
        const textBuffer = (<any>ArrayBuffer).from(textStyleBuffer);
        ret.text_style_view = new DataView(textBuffer);
      }
    } else if (__APPLE__) {
      const style = (nativeView as MasonText).style;
      if (!isText) {
        const styleBuffer = style.values;
        const buffer = interop.bufferFromData(styleBuffer);
        ret.style_view = new DataView(buffer);
      } else {
        const styleBuffer = style.values;
        const buffer = interop.bufferFromData(styleBuffer);
        ret.style_view = new DataView(buffer);

        const textStyleBuffer = (nativeView as MasonText).textValues;
        const textBuffer = interop.bufferFromData(textStyleBuffer);
        ret.text_style_view = new DataView(textBuffer);
      }
    }
    //console.timeEnd('fromView');

    return ret;
  }

  resetState() {
    this.isDirty = -1n;
    this.isTextDirty = -1n;
  }

  private syncStyle(isText = false) {
    console.time('syncStyle');
    if (__ANDROID__) {
      if (!isText) {
        const view = this.view.android as org.nativescript.mason.masonkit.View;
        view.syncStyle(this.isDirty.toString());
      } else {
        const view = this.view.android as never as org.nativescript.mason.masonkit.TextView;
        view.syncStyle(this.isDirty.toString(), this.isTextDirty.toString());
      }
    } else if (__APPLE__) {
      if (!isText) {
        const view = this.view.ios as MasonUIView;
        view.syncStyle(this.isDirty.toString());
      } else {
        const view = this.view.ios as MasonText;
        view.syncStyle(this.isDirty.toString(), this.isTextDirty.toString());
      }
    }
    this.resetState();
    console.timeEnd('syncStyle');
  }

  private setOrAppendState(value: StateKeys) {
    if (this.isDirty == -1n) {
      this.isDirty = value.bits;
    } else {
      this.isDirty = this.isDirty | value.bits;
    }
    if (!this.inBatch) {
      this.syncStyle(this.text_style_view != null);
    }
  }

  private setOrAppendTextState(value: TextStateKeys) {
    if (this.isTextDirty == -1n) {
      this.isTextDirty = value.bits;
    } else {
      this.isTextDirty = this.isTextDirty | value.bits;
    }
    if (!this.inBatch) {
      this.syncStyle(this.text_style_view != null);
    }
  }

  batch(fn: (style: Style) => void) {
    this.inBatch = true;
    fn(this);
    this.inBatch = false;
    this.syncStyle(this.text_style_view != null);
  }

  get view(): View {
    return this.view_;
  }

  get color() {
    if (!this.text_style_view) {
      // BLACK ?
      return 0;
    }
    return this.text_style_view.getUint32(TextStyleKeys.COLOR);
  }

  set color(value: number) {
    if (!this.text_style_view) {
      return;
    }
    this.text_style_view.setUint32(TextStyleKeys.COLOR, value, true);
    this.setOrAppendTextState(TextStateKeys.COLOR);
  }

  get backgroundColor() {
    if (!this.text_style_view) {
      // BLACK ?
      return 0;
    }
    return this.text_style_view.getUint32(TextStyleKeys.BACKGROUND_COLOR);
  }

  set backgroundColor(value: number) {
    if (!this.text_style_view) {
      return;
    }
    this.text_style_view.setUint32(TextStyleKeys.BACKGROUND_COLOR, value);
    this.setOrAppendTextState(TextStateKeys.BACKGROUND_COLOR);
  }

  get textWrap() {
    if (!this.text_style_view) {
      // BLACK ?
      return 0;
    }
    return this.text_style_view.getInt32(TextStyleKeys.TEXT_ALIGN);
  }

  set textWrap(value: number) {
    if (!this.text_style_view) {
      return;
    }
    this.text_style_view.setInt32(TextStyleKeys.TEXT_WRAP, value);
    this.setOrAppendTextState(TextStateKeys.TEXT_WRAP);
  }

  get styleView(): DataView {
    return this.style_view;
  }

  get display() {
    switch (this.style_view.getInt32(StyleKeys.DISPLAY)) {
      case 0:
        return 'none';
      case 1:
        return 'flex';
      case 2:
        return 'grid';
      case 3:
        return 'block';
    }
  }

  set display(value: 'none' | 'flex' | 'grid' | 'block') {
    let display = -1;
    switch (value) {
      case 'none':
        display = 0;
        break;
      case 'flex':
        display = 1;
        break;
      case 'grid':
        display = 2;
        break;
      case 'block':
        display = 3;
        break;
    }
    if (display != -1) {
      this.style_view.setInt32(StyleKeys.DISPLAY, display);
      this.setOrAppendState(StateKeys.DISPLAY);
    }
  }

  get position() {
    switch (this.style_view.getInt32(StyleKeys.POSITION)) {
      case 0:
        return 'relative';
      case 1:
        return 'absolute';
    }
  }

  set position(value: 'relative' | 'absolute') {
    let position = -1;
    switch (value) {
      case 'relative':
        position = 0;
        break;
      case 'absolute':
        position = 1;
        break;
    }
    if (position != -1) {
      this.style_view.setInt32(StyleKeys.POSITION, position);
      this.setOrAppendState(StateKeys.POSITION);
    }
  }

  get flexDirection() {
    switch (this.style_view.getInt32(StyleKeys.FLEX_DIRECTION)) {
      case 0:
        return 'column';
      case 1:
        return 'row';
      case 2:
        return 'column-reverse';
      case 3:
        return 'row-reverse';
    }
  }

  set flexDirection(value: 'column' | 'row' | 'column-reverse' | 'row-reverse') {
    let flex = -1;
    switch (value) {
      case 'column':
        flex = 0;
        break;
      case 'row':
        flex = 1;
        break;
      case 'column-reverse':
        flex = 2;
        break;
      case 'row-reverse':
        flex = 3;
        break;
    }
    if (flex != -1) {
      this.style_view.setInt32(StyleKeys.FLEX_DIRECTION, flex);
      this.setOrAppendState(StateKeys.FLEX_DIRECTION);
    }
  }

  get flexWrap() {
    switch (this.style_view.getInt32(StyleKeys.FLEX_WRAP)) {
      case 0:
        return 'no-wrap';
      case 1:
        return 'wrap';
      case 2:
        return 'wrap-reverse';
    }
  }

  set flexWrap(value: 'no-wrap' | 'wrap' | 'wrap-reverse') {
    let wrap = -1;
    switch (value) {
      case 'no-wrap':
        wrap = 0;
        break;
      case 'wrap':
        wrap = 1;
        break;
      case 'wrap-reverse':
        wrap = 2;
        break;
    }
    if (wrap != -1) {
      this.style_view.setInt32(StyleKeys.FLEX_WRAP, wrap);
      this.setOrAppendState(StateKeys.FLEX_WRAP);
    }
  }
  // get flex(): string | 'auto' | 'none' | number | 'initial' {
  //     return this.style[StyleKeys.FLEX];
  // }
  // get flexFlow(): string

  get minWidth() {
    const type = this.style_view.getInt32(StyleKeys.MIN_WIDTH_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MIN_WIDTH_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }
  set minWidth(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MIN_WIDTH_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MIN_WIDTH_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MIN_WIDTH_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MIN_WIDTH_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MIN_WIDTH_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MIN_WIDTH_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MIN_WIDTH_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MIN_WIDTH_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MIN_WIDTH_VALUE, value.value, true);
            break;
        }
        break;
    }

    this.setOrAppendState(StateKeys.MIN_SIZE);
  }

  get minHeight() {
    const type = this.style_view.getInt32(StyleKeys.MIN_HEIGHT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MIN_HEIGHT_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }

  set minHeight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MIN_HEIGHT_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MIN_HEIGHT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MIN_HEIGHT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MIN_HEIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MIN_HEIGHT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MIN_HEIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MIN_HEIGHT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MIN_HEIGHT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MIN_HEIGHT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MIN_SIZE);
  }

  get width() {
    const type = this.style_view.getInt32(StyleKeys.WIDTH_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.WIDTH_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }
  set width(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.WIDTH_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.WIDTH_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.WIDTH_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.WIDTH_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.WIDTH_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.WIDTH_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.WIDTH_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.WIDTH_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.WIDTH_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.SIZE);
  }

  get height() {
    const type = this.style_view.getInt32(StyleKeys.HEIGHT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.HEIGHT_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }
  set height(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.HEIGHT_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.HEIGHT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.HEIGHT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.HEIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.HEIGHT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.HEIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.HEIGHT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.HEIGHT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.HEIGHT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.SIZE);
  }

  get maxWidth() {
    const type = this.style_view.getInt32(StyleKeys.MAX_WIDTH_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MAX_WIDTH_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }
  set maxWidth(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MAX_WIDTH_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MAX_WIDTH_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MAX_WIDTH_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MAX_WIDTH_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MAX_WIDTH_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MAX_WIDTH_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MAX_WIDTH_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MAX_WIDTH_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MAX_WIDTH_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MAX_SIZE);
  }

  get maxHeight() {
    const type = this.style_view.getInt32(StyleKeys.MAX_HEIGHT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MAX_HEIGHT_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }
  set maxHeight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MAX_HEIGHT_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MAX_HEIGHT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MAX_HEIGHT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MAX_HEIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MAX_HEIGHT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MAX_HEIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MAX_HEIGHT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MAX_HEIGHT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MAX_HEIGHT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MAX_SIZE);
  }

  get left(): Length {
    const type = this.style_view.getInt32(StyleKeys.INSET_LEFT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.INSET_LEFT_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set left(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.INSET_LEFT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.INSET_LEFT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.INSET_LEFT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_LEFT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.INSET_LEFT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_LEFT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.INSET_LEFT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.INSET_LEFT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get right(): Length {
    const type = this.style_view.getInt32(StyleKeys.INSET_RIGHT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.INSET_RIGHT_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set right(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.INSET_RIGHT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.INSET_RIGHT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.INSET_RIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_RIGHT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.INSET_RIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_RIGHT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.INSET_RIGHT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.INSET_RIGHT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get top(): Length {
    const type = this.style_view.getInt32(StyleKeys.INSET_TOP_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.INSET_TOP_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set top(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.INSET_TOP_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.INSET_TOP_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.INSET_TOP_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_TOP_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.INSET_TOP_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_TOP_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.INSET_TOP_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.INSET_TOP_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get bottom(): Length {
    const type = this.style_view.getInt32(StyleKeys.INSET_BOTTOM_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.INSET_BOTTOM_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set bottom(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.INSET_BOTTOM_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.INSET_BOTTOM_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.INSET_BOTTOM_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_BOTTOM_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.INSET_BOTTOM_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.INSET_BOTTOM_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.INSET_BOTTOM_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.INSET_BOTTOM_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get marginLeft() {
    const type = this.style_view.getInt32(StyleKeys.MARGIN_LEFT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MARGIN_LEFT_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }

  set marginLeft(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MARGIN_LEFT_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MARGIN_LEFT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MARGIN_LEFT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MARGIN_LEFT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_LEFT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MARGIN_LEFT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_LEFT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MARGIN_LEFT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_LEFT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get marginRight() {
    const type = this.style_view.getInt32(StyleKeys.MARGIN_RIGHT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MARGIN_RIGHT_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }

  set marginRight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MARGIN_RIGHT_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MARGIN_RIGHT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MARGIN_RIGHT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MARGIN_RIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_RIGHT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MARGIN_RIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_RIGHT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MARGIN_RIGHT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_RIGHT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MARGIN);
  }

  get marginTop() {
    const type = this.style_view.getInt32(StyleKeys.MARGIN_TOP_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MARGIN_TOP_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }

  set marginTop(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MARGIN_TOP_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MARGIN_TOP_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MARGIN_TOP_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MARGIN_TOP_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_TOP_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MARGIN_TOP_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_TOP_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MARGIN_TOP_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_TOP_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MARGIN);
  }

  get marginBottom() {
    const type = this.style_view.getInt32(StyleKeys.MARGIN_BOTTOM_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.MARGIN_BOTTOM_VALUE, true);
    return parseLengthPercentageAuto(type, value);
  }
  set marginBottom(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.style_view.setInt32(StyleKeys.MARGIN_BOTTOM_TYPE, 0, true);
        break;
      case 'number':
        this.style_view.setInt32(StyleKeys.MARGIN_BOTTOM_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.MARGIN_BOTTOM_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.MARGIN_BOTTOM_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_BOTTOM_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.MARGIN_BOTTOM_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_BOTTOM_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.MARGIN_BOTTOM_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.MARGIN_BOTTOM_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MARGIN);
  }

  get paddingLeft() {
    const type = this.style_view.getInt32(StyleKeys.PADDING_LEFT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.PADDING_LEFT_VALUE, true);
    return parseLengthPercentage(type, value);
  }
  set paddingLeft(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.PADDING_LEFT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.PADDING_LEFT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.PADDING_LEFT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_LEFT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.PADDING_LEFT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_LEFT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.PADDING_LEFT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.PADDING_LEFT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  get paddingRight() {
    const type = this.style_view.getInt32(StyleKeys.PADDING_RIGHT_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.PADDING_RIGHT_VALUE, true);
    return parseLengthPercentage(type, value);
  }
  set paddingRight(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.PADDING_RIGHT_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.PADDING_RIGHT_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.PADDING_RIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_RIGHT_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.PADDING_RIGHT_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_RIGHT_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.PADDING_RIGHT_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.PADDING_RIGHT_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  get paddingTop() {
    const type = this.style_view.getInt32(StyleKeys.PADDING_TOP_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.PADDING_TOP_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set paddingTop(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.PADDING_TOP_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.PADDING_TOP_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.PADDING_TOP_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_TOP_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.PADDING_TOP_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_TOP_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.PADDING_TOP_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.PADDING_TOP_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  get paddingBottom() {
    const type = this.style_view.getInt32(StyleKeys.PADDING_BOTTOM_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.PADDING_BOTTOM_VALUE, true);
    return parseLengthPercentage(type, value);
  }
  set paddingBottom(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.PADDING_BOTTOM_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.PADDING_BOTTOM_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.PADDING_BOTTOM_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_BOTTOM_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.PADDING_BOTTOM_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.PADDING_BOTTOM_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.PADDING_BOTTOM_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.PADDING_BOTTOM_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  gridGap: Gap;
  gap: Gap;

  get rowGap(): Length {
    const type = this.style_view.getInt32(StyleKeys.GAP_ROW_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.GAP_ROW_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set rowGap(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.GAP_ROW_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.GAP_ROW_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.GAP_ROW_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.GAP_ROW_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.GAP_ROW_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.GAP_ROW_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.GAP_ROW_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.GAP_ROW_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.GAP);
  }

  get columnGap(): Length {
    const type = this.style_view.getInt32(StyleKeys.GAP_COLUMN_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.GAP_COLUMN_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set columnGap(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.GAP_COLUMN_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.GAP_COLUMN_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.GAP_COLUMN_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.GAP_COLUMN_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.GAP_COLUMN_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.GAP_COLUMN_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.GAP_COLUMN_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.GAP_COLUMN_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.GAP);
  }

  get aspectRatio(): number {
    return this.style_view.getFloat32(StyleKeys.ASPECT_RATIO, true);
  }

  set aspectRatio(value: number) {
    this.style_view.setFloat32(StyleKeys.ASPECT_RATIO, value, true);
    this.setOrAppendState(StateKeys.ASPECT_RATIO);
  }

  get flexBasis(): Length {
    const type = this.style_view.getInt32(StyleKeys.FLEX_BASIS_TYPE, true);
    const value = this.style_view.getFloat32(StyleKeys.FLEX_BASIS_VALUE, true);
    return parseLengthPercentage(type, value);
  }

  set flexBasis(value: Length) {
    switch (typeof value) {
      case 'number':
        this.style_view.setInt32(StyleKeys.FLEX_BASIS_TYPE, 1, true);
        this.style_view.setFloat32(StyleKeys.FLEX_BASIS_VALUE, layout.toDevicePixels(value), true);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.style_view.setInt32(StyleKeys.FLEX_BASIS_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.FLEX_BASIS_VALUE, layout.toDevicePixels(value.value), true);
            break;
          case 'px':
            this.style_view.setInt32(StyleKeys.FLEX_BASIS_TYPE, 1, true);
            this.style_view.setFloat32(StyleKeys.FLEX_BASIS_VALUE, value.value, true);
            break;
          case '%':
            this.style_view.setInt32(StyleKeys.FLEX_BASIS_TYPE, 2, true);
            this.style_view.setFloat32(StyleKeys.FLEX_BASIS_VALUE, value.value, true);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.FLEX_BASIS);
  }
  get alignItems() {
    switch (this.style_view.getInt32(StyleKeys.ALIGN_ITEMS, true)) {
      case AlignItems.Normal:
        return 'normal';
      case AlignItems.Start:
        return 'start';
      case AlignItems.End:
        return 'end';
      case AlignItems.FlexStart:
        return 'flex-start';
      case AlignItems.FlexEnd:
        return 'flex-end';
      case AlignItems.Center:
        return 'center';
      case AlignItems.Baseline:
        return 'baseline';
      case AlignItems.Stretch:
        return 'stretch';
    }
  }

  set alignItems(value: 'normal' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch') {
    switch (value) {
      case 'normal':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.Normal, true);
        break;
      case 'start':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.Start, true);
        break;
      case 'end':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.End, true);
        break;
      case 'flex-start':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.FlexStart, true);
        break;
      case 'flex-end':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.FlexEnd, true);
        break;
      case 'center':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.Center, true);
        break;
      case 'baseline':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.Baseline, true);
        break;
      case 'stretch':
        this.style_view.setInt32(StyleKeys.ALIGN_ITEMS, AlignItems.Stretch, true);
        break;
    }
    this.setOrAppendState(StateKeys.ALIGN_ITEMS);
  }

  get alignSelf() {
    switch (this.style_view.getInt32(StyleKeys.ALIGN_SELF, true)) {
      case AlignSelf.Normal:
        return 'normal';
      case AlignSelf.Start:
        return 'start';
      case AlignSelf.End:
        return 'end';
      case AlignSelf.Center:
        return 'center';
      case AlignSelf.Baseline:
        return 'baseline';
      case AlignSelf.Stretch:
        return 'stretch';
      case AlignSelf.FlexStart:
        return 'flex-start';
      case AlignSelf.FlexEnd:
        return 'flex-end';
    }
  }

  set alignSelf(value: 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end') {
    let align = -2;
    switch (value) {
      case 'normal':
        align = AlignSelf.Normal;
        break;
      case 'start':
        align = AlignSelf.Start;
        break;
      case 'end':
        align = AlignSelf.End;
        break;
      case 'center':
        align = AlignSelf.Center;
        break;
      case 'baseline':
        align = AlignSelf.Baseline;
        break;
      case 'stretch':
        align = AlignSelf.Stretch;
        break;
      case 'flex-start':
        align = AlignSelf.FlexStart;
        break;
      case 'flex-end':
        align = AlignSelf.FlexEnd;
        break;
    }
    if (align === -2) {
      this.style_view.setInt32(StyleKeys.ALIGN_SELF, align, true);
      this.setOrAppendState(StateKeys.ALIGN_SELF);
    }
  }

  get alignContent() {
    switch (this.style_view.getInt32(StyleKeys.ALIGN_CONTENT, true)) {
      case AlignContent.Normal:
        return 'normal';
      case AlignContent.SpaceAround:
        return 'space-around';
      case AlignContent.SpaceBetween:
        return 'space-between';
      case AlignContent.SpaceEvenly:
        return 'space-evenly';
      case AlignContent.Center:
        return 'center';
      case AlignContent.End:
        return 'end';
      case AlignContent.Start:
        return 'start';
      case AlignContent.Stretch:
        return 'stretch';
    }
  }

  set alignContent(value: 'normal' | 'space-around' | 'space-between' | 'space-evenly' | 'center' | 'end' | 'start' | 'stretch') {
    switch (value) {
      case 'normal':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.Normal, true);
        break;
      case 'space-around':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.SpaceAround, true);
        break;
      case 'space-between':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.SpaceBetween, true);
        break;
      case 'space-evenly':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.SpaceEvenly, true);
        break;
      case 'center':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.Center, true);
        break;
      case 'end':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.End, true);
        break;
      case 'start':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.Start, true);
        break;
      case 'stretch':
        this.style_view.setInt32(StyleKeys.ALIGN_CONTENT, AlignContent.Stretch, true);
        break;
    }
    this.setOrAppendState(StateKeys.ALIGN_CONTENT);
  }

  justifyItems: JustifyItems;
  justifySelf: JustifySelf;
  get justifyContent() {
    switch (this.style_view.getInt32(StyleKeys.JUSTIFY_CONTENT, true)) {
      case JustifyContent.Normal:
        return 'normal';
      case JustifyContent.Start:
        return 'start';
      case JustifyContent.End:
        return 'end';
      case JustifyContent.Center:
        return 'center';
      case JustifyContent.Stretch:
        return 'stretch';
      case JustifyContent.SpaceBetween:
        return 'space-between';
      case JustifyContent.SpaceAround:
        return 'space-around';
      case JustifyContent.SpaceEvenly:
        return 'space-evenly';
      case JustifyContent.FlexStart:
        return 'flex-start';
      case JustifyContent.FlexEnd:
        return 'flex-end';
    }
  }

  set justifyContent(value: 'normal' | 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'flex-end') {
    switch (value) {
      case 'normal':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.Normal, true);
        break;
      case 'space-around':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.SpaceAround, true);
        break;
      case 'space-between':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.SpaceBetween, true);
        break;
      case 'space-evenly':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.SpaceEvenly, true);
        break;
      case 'center':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.Center, true);
        break;
      case 'end':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.End, true);
        break;
      case 'start':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.Start, true);
        break;
      case 'stretch':
        this.style_view.setInt32(StyleKeys.JUSTIFY_CONTENT, JustifyContent.Stretch, true);
        break;
    }
    this.setOrAppendState(StateKeys.JUSTIFY_CONTENT);
  }
  gridAutoRows: string;
  gridAutoColumns: string;
  get gridAutoFlow(): GridAutoFlow {
    switch (this.style_view.getInt32(StyleKeys.GRID_AUTO_FLOW, true)) {
      case 0:
        return 'row';
      case 1:
        return 'column';
      case 2:
        return 'row dense';
      case 3:
        return 'column dense';
    }
  }

  set gridAutoFlow(value: GridAutoFlow) {
    switch (value) {
      case 'row':
        this.style_view.setInt32(StyleKeys.GRID_AUTO_FLOW, 0, true);
        break;
      case 'column':
        this.style_view.setInt32(StyleKeys.GRID_AUTO_FLOW, 1, true);
        break;
      case 'row dense':
        this.style_view.setInt32(StyleKeys.GRID_AUTO_FLOW, 2, true);
        break;
      case 'column dense':
        this.style_view.setInt32(StyleKeys.GRID_AUTO_FLOW, 3, true);
        break;
    }
  }

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
  get overflow() {
    const x = this.overflowX;
    const y = this.overflowY;
    if (x === y) {
      return x;
    }
    return `${x} ${y}`;
  }

  set overflow(value: OverFlow | `${OverFlow} ${OverFlow}`) {
    switch (value) {
      case 'visible':
        this.style_view.setInt32(StyleKeys.OVERFLOW_X, 0, true);
        this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 0, true);
        break;
      case 'hidden':
        this.style_view.setInt32(StyleKeys.OVERFLOW_X, 1, true);
        this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 1, true);
        break;
      case 'scroll':
        this.style_view.setInt32(StyleKeys.OVERFLOW_X, 2, true);
        this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 2, true);
        break;
      default:
        {
          const values = value.split(' ');
          switch (values[0]) {
            case 'visible':
              this.style_view.setInt32(StyleKeys.OVERFLOW_X, 0, true);
              break;
            case 'hidden':
              this.style_view.setInt32(StyleKeys.OVERFLOW_X, 1, true);
              break;
            case 'scroll':
              this.style_view.setInt32(StyleKeys.OVERFLOW_X, 2, true);
              break;
          }
          switch (values[1]) {
            case 'visible':
              this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 0, true);
              break;
            case 'hidden':
              this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 1, true);
              break;
            case 'scroll':
              this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 2, true);
              break;
          }
        }
        break;
    }
  }
  get overflowX() {
    switch (this.style_view.getInt32(StyleKeys.OVERFLOW_X, true)) {
      case 0:
        return 'visible';
      case 1:
        return 'hidden';
      case 2:
        return 'scroll';
    }
  }

  set overflowX(value: 'visible' | 'hidden' | 'scroll') {
    switch (value) {
      case 'visible':
        this.style_view.setInt32(StyleKeys.OVERFLOW_X, 0, true);
        break;
      case 'hidden':
        this.style_view.setInt32(StyleKeys.OVERFLOW_X, 1, true);
        break;
      case 'scroll':
        this.style_view.setInt32(StyleKeys.OVERFLOW_X, 2, true);
        break;
    }
  }

  get overflowY() {
    switch (this.style_view.getInt32(StyleKeys.OVERFLOW_Y, true)) {
      case 0:
        return 'visible';
      case 1:
        return 'hidden';
      case 2:
        return 'scroll';
    }
  }

  set overflowY(value: 'visible' | 'hidden' | 'scroll') {
    switch (value) {
      case 'visible':
        this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 0, true);
        break;
      case 'hidden':
        this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 1, true);
        break;
      case 'scroll':
        this.style_view.setInt32(StyleKeys.OVERFLOW_Y, 2, true);
        break;
    }
  }

  get flexGrow(): number {
    return this.style_view.getFloat32(StyleKeys.FLEX_GROW, true);
  }

  set flexGrow(value: number) {
    this.style_view.setFloat32(StyleKeys.FLEX_GROW, value, true);
  }

  get flexShrink(): number {
    return this.style_view.getFloat32(StyleKeys.FLEX_SHRINK, true);
  }

  set flexShrink(value: number) {
    this.style_view.setFloat32(StyleKeys.FLEX_SHRINK, value, true);
  }

  get scrollBarWidth(): number | CoreTypes.LengthType {
    return this.style_view.getFloat32(StyleKeys.SCROLLBAR_WIDTH, true);
  }

  set scrollBarWidth(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') {
      this.style_view.setFloat32(StyleKeys.SCROLLBAR_WIDTH, value, true);
    } else if (typeof value === 'object') {
      switch (value.unit) {
        case 'dip':
          this.style_view.setFloat32(StyleKeys.SCROLLBAR_WIDTH, layout.toDevicePixels(value.value), true);
          break;
        case 'px':
          this.style_view.setFloat32(StyleKeys.SCROLLBAR_WIDTH, value.value, true);
          break;
      }
    }
  }

  toJSON() {
    return {
      display: this.display,
      position: this.position,
      flexDirection: this.flexDirection,
      flexWrap: this.flexWrap,
      justifyContent: this.justifyContent,
      alignItems: this.alignItems,
      alignContent: this.alignContent,
      alignSelf: this.alignSelf,
      flexGrow: this.flexGrow,
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      width: this.width,
      height: this.height,
      inset: {
        left: this.left,
        right: this.right,
        top: this.top,
        bottom: this.bottom,
      },
      margin: {
        left: this.marginLeft,
        right: this.marginRight,
        top: this.marginTop,
        bottom: this.marginBottom,
      },
      padding: {
        left: this.paddingLeft,
        right: this.paddingRight,
        top: this.paddingTop,
        bottom: this.paddingBottom,
      },
      gap: this.gap,
      gridAutoFlow: this.gridAutoFlow,
      gridAutoColumns: this.gridAutoColumns,
      gridAutoRows: this.gridAutoRows,
      gridColumn: this.gridColumn,
      gridRow: this.gridRow,
    };
  }
}
