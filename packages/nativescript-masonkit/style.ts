import { layout } from '@nativescript/core/utils';
import type { GridAutoFlow, Length, LengthAuto, View } from '.';
import { CoreTypes, Length as CoreLength, PercentLength as CorePercentLength } from '@nativescript/core';
import { AlignContent, AlignSelf, AlignItems, JustifyContent, JustifySelf, _parseGridAutoRowsColumns, _setGridAutoRows, _setGridAutoColumns, _parseGridLine, JustifyItems, GridTemplates, _parseGridTemplates, _setGridTemplateColumns, _setGridTemplateRows, _getGridTemplateRows, _getGridTemplateColumns } from './utils';
import { isMasonView_ } from './common';

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
  ITEM_IS_TABLE = 316,
  ITEM_IS_REPLACED = 320,
  DISPLAY_MODE = 324,
  FORCE_INLINE = 328,
  MIN_CONTENT_WIDTH = 332,
  MIN_CONTENT_HEIGHT = 336,
  MAX_CONTENT_WIDTH = 340,
  MAX_CONTENT_HEIGHT = 344,

  // ----------------------------
  // Border Style (per side)
  // ----------------------------
  BORDER_LEFT_STYLE = 348,
  BORDER_RIGHT_STYLE = 352,
  BORDER_TOP_STYLE = 356,
  BORDER_BOTTOM_STYLE = 360,

  // ----------------------------
  // Border Color (per side)
  // ----------------------------
  BORDER_LEFT_COLOR = 364,
  BORDER_RIGHT_COLOR = 368,
  BORDER_TOP_COLOR = 372,
  BORDER_BOTTOM_COLOR = 376,

  // ============================================================
  // Border Radius (elliptical + squircle exponent)
  // Each corner = 20 bytes:
  //   x_type (4), x_value (4), y_type (4), y_value (4), exponent (4)
  // ============================================================

  // ----------------------------
  // Top-left corner (20 bytes)
  // ----------------------------
  BORDER_RADIUS_TOP_LEFT_X_TYPE = 380,
  BORDER_RADIUS_TOP_LEFT_X_VALUE = 384,
  BORDER_RADIUS_TOP_LEFT_Y_TYPE = 388,
  BORDER_RADIUS_TOP_LEFT_Y_VALUE = 392,
  BORDER_RADIUS_TOP_LEFT_EXPONENT = 396,

  // ----------------------------
  // Top-right corner
  // ----------------------------
  BORDER_RADIUS_TOP_RIGHT_X_TYPE = 400,
  BORDER_RADIUS_TOP_RIGHT_X_VALUE = 404,
  BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 408,
  BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 412,
  BORDER_RADIUS_TOP_RIGHT_EXPONENT = 416,

  // ----------------------------
  // Bottom-right corner
  // ----------------------------
  BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 420,
  BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 424,
  BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 428,
  BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 432,
  BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 436,

  // ----------------------------
  // Bottom-left corner
  // ----------------------------
  BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 440,
  BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 444,
  BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 448,
  BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 452,
  BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 456,
}

enum TextStyleKeys {
  COLOR = 0,
  COLOR_STATE = 4, // 0 = inherit, 1 = set
  SIZE = 8,
  SIZE_TYPE = 12,
  SIZE_STATE = 13,
  FONT_WEIGHT = 16,
  FONT_WEIGHT_STATE = 20,
  FONT_STYLE_SLANT = 24,
  FONT_STYLE_TYPE = 28, // shifted +4 from 24
  FONT_STYLE_STATE = 29,
  FONT_FAMILY_STATE = 30,
  FONT_RESOLVED_DIRTY = 31, // single-byte flag
  BACKGROUND_COLOR = 32,
  BACKGROUND_COLOR_STATE = 36,
  DECORATION_LINE = 40,
  DECORATION_LINE_STATE = 44,
  DECORATION_COLOR = 48,
  DECORATION_COLOR_STATE = 52,
  DECORATION_STYLE = 56,
  DECORATION_STYLE_STATE = 60,
  LETTER_SPACING = 64,
  LETTER_SPACING_STATE = 68,
  TEXT_WRAP = 72,
  TEXT_WRAP_STATE = 76,
  WHITE_SPACE = 80,
  WHITE_SPACE_STATE = 84,
  TRANSFORM = 88,
  TRANSFORM_STATE = 92,
  TEXT_ALIGN = 96,
  TEXT_ALIGN_STATE = 100,
  TEXT_JUSTIFY = 104,
  TEXT_JUSTIFY_STATE = 108,
  TEXT_INDENT = 112,
  TEXT_INDENT_STATE = 116,
  TEXT_OVERFLOW = 120,
  TEXT_OVERFLOW_STATE = 124,
  LINE_HEIGHT = 128,
  LINE_HEIGHT_TYPE = 132,
  LINE_HEIGHT_STATE = 133,
}

export type OverFlow = 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto';

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
    case 0:
      return { value, unit: 'px' };
    case 1:
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
  static readonly ITEM_IS_REPLACED = new StateKeys(1n << 33n);
  static readonly DISPLAY_MODE = new StateKeys(1n << 34n);
  static readonly FORCE_INLINE = new StateKeys(1n << 35n);
  static readonly MIN_CONTENT_WIDTH = new StateKeys(1n << 36n);
  static readonly MIN_CONTENT_HEIGHT = new StateKeys(1n << 37n);
  static readonly MAX_CONTENT_WIDTH = new StateKeys(1n << 38n);
  static readonly MAX_CONTENT_HEIGHT = new StateKeys(1n << 39n);
  static readonly BORDER_STYLE = new StateKeys(1n << 40n);
  static readonly BORDER_RADIUS = new StateKeys(1n << 41n);
  static readonly BORDER_COLOR = new StateKeys(1n << 42n);

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
  static readonly ALL = new TextStateKeys(-1n);
  static readonly NONE = new TextStateKeys(0n);
  static readonly COLOR = new TextStateKeys(1n << 0n);
  static readonly SIZE = new TextStateKeys(1n << 1n);
  static readonly FONT_WEIGHT = new TextStateKeys(1n << 2n);
  static readonly FONT_STYLE = new TextStateKeys(1n << 3n);
  static readonly FONT_FAMILY = new TextStateKeys(1n << 4n);
  static readonly LETTER_SPACING = new TextStateKeys(1n << 5n);
  static readonly DECORATION_LINE = new TextStateKeys(1n << 6n);
  static readonly DECORATION_COLOR = new TextStateKeys(1n << 7n);
  static readonly DECORATION_STYLE = new TextStateKeys(1n << 8n);
  static readonly BACKGROUND_COLOR = new TextStateKeys(1n << 9n);
  static readonly TEXT_WRAP = new TextStateKeys(1n << 10n);
  static readonly WHITE_SPACE = new TextStateKeys(1n << 11n);
  static readonly TRANSFORM = new TextStateKeys(1n << 12n);
  static readonly TEXT_JUSTIFY = new TextStateKeys(1n << 13n);
  static readonly TEXT_OVERFLOW = new TextStateKeys(1n << 14n);
  static readonly LINE_HEIGHT = new TextStateKeys(1n << 15n);
  static readonly TEXT_ALIGN = new TextStateKeys(1n << 16n);

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

const getInt8 = (view: DataView, offset: number) => {
  return view.getInt8(offset);
};

const setInt8 = (view: DataView, offset: number, value: number) => {
  view.setInt8(offset, value);
};

const getUint8 = (view: DataView, offset: number) => {
  return view.getUint8(offset);
};

const setUint8 = (view: DataView, offset: number, value: number) => {
  view.setUint8(offset, value);
};

const getInt16 = (view: DataView, offset: number) => {
  return view.getInt16(offset, true);
};

const setInt16 = (view: DataView, offset: number, value: number) => {
  view.setInt16(offset, value, true);
};

const getUint32 = (view: DataView, offset: number) => {
  return view.getUint32(offset, true);
};

const setUint32 = (view: DataView, offset: number, value: number) => {
  view.setUint32(offset, value, true);
};

const getInt32 = (view: DataView, offset: number) => {
  return view.getInt32(offset, true);
};

const setInt32 = (view: DataView, offset: number, value: number) => {
  view.setInt32(offset, value, true);
};

const getFloat32 = (view: DataView, offset: number) => {
  return view.getFloat32(offset, true);
};

const setFloat32 = (view: DataView, offset: number, value: number) => {
  view.setFloat32(offset, value, true);
};

export class Style {
  private view_: View;
  private style_view: DataView;
  private text_style_view?: DataView;
  private isDirty = -1n;
  private isTextDirty = -1n;
  private inBatch = false;
  private nativeView: any;
  static fromView(view: View, nativeView): Style {
    //console.time('fromView');
    const ret = new Style();
    ret.view_ = view;
    ret.nativeView = nativeView;
    if (__ANDROID__) {
      let style = (nativeView as org.nativescript.mason.masonkit.Element)?.getStyle?.();
      if (!style) {
        // if a non mason view is passed
        style = org.nativescript.mason.masonkit.Mason.getShared().styleForView(nativeView);
      }
      const styleBuffer = style.getValues();
      const buffer = (<any>ArrayBuffer).from(styleBuffer);
      ret.style_view = new DataView(buffer);

      const textStyleBuffer = style.getTextValues();
      const textBuffer = (<any>ArrayBuffer).from(textStyleBuffer);
      ret.text_style_view = new DataView(textBuffer);
    } else if (__APPLE__) {
      let style: MasonStyle = nativeView?.style as never;
      if (!style) {
        style = NSCMason.shared.styleForView(nativeView) as never;
      }
      const styleBuffer = style.values;

      const buffer = interop.bufferFromData(styleBuffer);
      ret.style_view = new DataView(buffer);

      //@ts-ignore
      const textStyleBuffer = style.textValues;

      const textBuffer = interop.bufferFromData(textStyleBuffer);
      ret.text_style_view = new DataView(textBuffer);
    }
    //console.timeEnd('fromView');

    return ret;
  }

  resetState() {
    this.isDirty = -1n;
    this.isTextDirty = -1n;
  }

  private syncStyle() {
    if (__ANDROID__) {
      const view = this.view.android as never as org.nativescript.mason.masonkit.Element;
      view.syncStyle(this.isDirty.toString(), this.isTextDirty.toString());
    } else if (__APPLE__) {
      const view = this.view.ios as never as MasonText;
      // @ts-ignore
      view.mason_syncStyle(this.isDirty.toString(), this.isTextDirty.toString());
    }
    this.resetState();
  }

  private setOrAppendState(value: StateKeys) {
    if (this.isDirty == -1n) {
      this.isDirty = value.bits;
    } else {
      this.isDirty = this.isDirty | value.bits;
    }
    if (!this.inBatch) {
      this.syncStyle();
    }
  }

  private setOrAppendTextState(value: TextStateKeys) {
    if (this.isTextDirty == -1n) {
      this.isTextDirty = value.bits;
    } else {
      this.isTextDirty = this.isTextDirty | value.bits;
    }

    if (!this.inBatch) {
      this.syncStyle();
    }
  }

  batch(fn: (style: Style) => void) {
    this.inBatch = true;
    fn(this);
    this.inBatch = false;
    this.syncStyle();
  }

  get view(): View {
    return this.view_;
  }

  get boxSizing(): 'border-box' | 'content-box' {
    switch (getUint32(this.style_view, StyleKeys.BOX_SIZING)) {
      case 0:
        return 'border-box';
      case 1:
        return 'content-box';
    }
  }

  set boxSizing(value: 'border-box' | 'content-box') {
    let boxSizing = -1;
    switch (value) {
      case 'border-box':
        boxSizing = 0;
        break;
      case 'content-box':
        boxSizing = 1;
        break;
    }

    if (boxSizing !== -1) {
      setUint32(this.style_view, StyleKeys.BOX_SIZING, boxSizing);
      this.setOrAppendState(StateKeys.BOX_SIZING);
    }
  }

  get fontSize() {
    if (!this.text_style_view) {
      // BLACK ?
      return 16;
    }

    const type = getUint8(this.text_style_view, TextStyleKeys.SIZE_TYPE);
    const value = getInt32(this.text_style_view, TextStyleKeys.SIZE);
    if (type === 1) {
      return `${value / 100}%` as never;
    }

    return value;
  }

  set fontSize(value: number | { value: number; unit: 'dip' | 'px' | '%' }) {
    if (!this.text_style_view) {
      return;
    }

    switch (typeof value) {
      case 'number':
        setInt32(this.text_style_view, TextStyleKeys.SIZE, value);
        setInt8(this.text_style_view, TextStyleKeys.SIZE_STATE, 1);
        setInt8(this.text_style_view, TextStyleKeys.SIZE_TYPE, 0);
        this.setOrAppendTextState(TextStateKeys.SIZE);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.text_style_view, TextStyleKeys.SIZE, value.value);
            setInt8(this.text_style_view, TextStyleKeys.SIZE_STATE, 1);
            setInt8(this.text_style_view, TextStyleKeys.SIZE_TYPE, 0);
            this.setOrAppendTextState(TextStateKeys.SIZE);
            break;
          case 'px':
            setInt32(this.text_style_view, TextStyleKeys.SIZE, layout.toDeviceIndependentPixels(value.value));
            setInt8(this.text_style_view, TextStyleKeys.SIZE_STATE, 1);
            setInt8(this.text_style_view, TextStyleKeys.SIZE_TYPE, 0);
            this.setOrAppendTextState(TextStateKeys.SIZE);
            break;
          case '%':
            setInt32(this.text_style_view, TextStyleKeys.SIZE, value.value * 100);
            setInt8(this.text_style_view, TextStyleKeys.SIZE_STATE, 1);
            setInt8(this.text_style_view, TextStyleKeys.SIZE_TYPE, 1);
            this.setOrAppendTextState(TextStateKeys.SIZE);
            break;
        }
        break;
    }

    if (value && typeof value === 'object') {
    } else {
    }
  }

  get fontStyle() {
    if (!this.text_style_view) {
      // normal ?
      return 'normal';
    }
    switch (getInt32(this.text_style_view, TextStyleKeys.FONT_STYLE_TYPE)) {
      case 0:
        return 'normal';
      case 1:
        return 'italic';
      case 2:
        return 'oblique';
      default:
        return 'normal';
    }
  }

  set fontStyle(value: 'normal' | 'italic' | 'oblique' | `oblique ${number}deg`) {
    if (!this.text_style_view) {
      return;
    }
    let style = -1;

    switch (value) {
      case 'normal':
        style = 0;
        break;
      case 'italic':
        style = 1;
        break;
      case 'oblique':
        style = 2;
        break;
    }
    if (style !== -1) {
      setInt32(this.text_style_view, TextStyleKeys.FONT_STYLE_TYPE, style);
      setInt8(this.text_style_view, TextStyleKeys.FONT_STYLE_STATE, 1);
      this.setOrAppendTextState(TextStateKeys.FONT_STYLE);
    }
  }

  get fontWeight() {
    if (!this.text_style_view) {
      // BLACK ?
      return 400;
    }

    return getInt32(this.text_style_view, TextStyleKeys.FONT_WEIGHT);
  }

  set fontWeight(value: '100' | '200' | '300' | 'normal' | '400' | '500' | '600' | 'bold' | '700' | '800' | '900' | number) {
    if (!this.text_style_view) {
      return;
    }
    let weight = -1;
    switch (value) {
      case '100':
        weight = 100;
        break;
      case '200':
        weight = 200;
        break;
      case '300':
        weight = 300;
        break;
      case 'normal':
      case '400':
        weight = 400;
        break;
      case '500':
        weight = 500;
        break;
      case '600':
        weight = 600;
        break;
      case '700':
      case 'bold':
        weight = 700;
        break;
      case '800':
        weight = 800;
        break;
      case '900':
        weight = 900;
        break;
      default:
        if (typeof value === 'number' && value >= 100 && value <= 1000) {
          weight = value;
        }
        break;
    }
    if (weight !== -1) {
      setInt32(this.text_style_view, TextStyleKeys.FONT_WEIGHT, weight);
      setInt8(this.text_style_view, TextStyleKeys.FONT_WEIGHT_STATE, 1);
      this.setOrAppendTextState(TextStateKeys.FONT_WEIGHT);
    }
  }

  get color() {
    if (!this.text_style_view) {
      // BLACK ?
      return 0;
    }

    return getUint32(this.text_style_view, TextStyleKeys.COLOR);
  }

  set color(value: number) {
    if (!this.text_style_view) {
      return;
    }
    setUint32(this.text_style_view, TextStyleKeys.COLOR, value);
    setInt8(this.text_style_view, TextStyleKeys.COLOR_STATE, 1);
    this.setOrAppendTextState(TextStateKeys.COLOR);
  }

  get backgroundColor() {
    if (!this.text_style_view) {
      // BLACK ?
      return 0;
    }
    return getUint32(this.text_style_view, TextStyleKeys.BACKGROUND_COLOR);
  }

  set backgroundColor(value: number) {
    if (!this.text_style_view) {
      return;
    }
    setUint32(this.text_style_view, TextStyleKeys.BACKGROUND_COLOR, value);
    setInt8(this.text_style_view, TextStyleKeys.BACKGROUND_COLOR_STATE, 1);
    this.setOrAppendTextState(TextStateKeys.BACKGROUND_COLOR);
  }

  get textWrap() {
    if (!this.text_style_view) {
      // BLACK ?
      return 0;
    }
    return getInt32(this.text_style_view, TextStyleKeys.TEXT_WRAP);
  }

  set textWrap(value: number | 'nowrap' | 'wrap' | 'balance') {
    if (!this.text_style_view) {
      return;
    }

    let wrap = -1;

    switch (value) {
      case 'nowrap':
        wrap = 0;
        break;
      case 'wrap':
        wrap = 1;
        break;
      case 'balance':
        wrap = 2;
        break;
    }

    if (typeof value === 'number' && value >= 0 && value < 3) {
      wrap = value;
    }

    if (wrap !== -1) {
      setInt32(this.text_style_view, TextStyleKeys.TEXT_WRAP, wrap);
      setInt8(this.text_style_view, TextStyleKeys.TEXT_WRAP_STATE, 1);
      this.setOrAppendTextState(TextStateKeys.TEXT_WRAP);
    }
  }

  get styleView(): DataView {
    return this.style_view;
  }

  get display() {
    switch (getInt32(this.style_view, StyleKeys.DISPLAY)) {
      case 0:
        return 'none';
      case 1:
        return 'flex';
      case 2:
        return 'grid';
      case 3:
        return 'block';
      case 4:
        return 'inline';
      case 5:
        return 'inline-block';
      case 6:
        return 'inline-flex';
      case 7:
        return 'inline-grid';
      default:
        return 'none';
    }
  }

  set display(value: 'none' | 'flex' | 'grid' | 'block' | 'inline' | 'inline-block' | 'inline-flex' | 'inline-grid') {
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
      case 'inline':
        display = 4;
        break;
      case 'inline-block':
        display = 5;
        break;
      case 'inline-flex':
        display = 6;
        break;
      case 'inline-grid':
        display = 7;
        break;
    }
    if (display != -1) {
      setInt32(this.style_view, StyleKeys.DISPLAY, display);
      this.setOrAppendState(StateKeys.DISPLAY);
    }
  }

  get position() {
    switch (getInt32(this.style_view, StyleKeys.POSITION)) {
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
      setInt32(this.style_view, StyleKeys.POSITION, position);
      this.setOrAppendState(StateKeys.POSITION);
    }
  }

  get flexDirection() {
    switch (getInt32(this.style_view, StyleKeys.FLEX_DIRECTION)) {
      case 0:
        return 'column';
      case 1:
        return 'row';
      case 2:
        return 'row-reverse';
      case 3:
        return 'column-reverse';
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
      case 'row-reverse':
        flex = 2;
        break;
      case 'column-reverse':
        flex = 3;
        break;
    }
    if (flex != -1) {
      setInt32(this.style_view, StyleKeys.FLEX_DIRECTION, flex);
      this.setOrAppendState(StateKeys.FLEX_DIRECTION);
    }
  }

  get flexWrap() {
    switch (getInt32(this.style_view, StyleKeys.FLEX_WRAP)) {
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
      setInt32(this.style_view, StyleKeys.FLEX_WRAP, wrap);
      this.setOrAppendState(StateKeys.FLEX_WRAP);
    }
  }
  // get flex(): string | 'auto' | 'none' | number | 'initial' {
  //     return this.style[StyleKeys.FLEX];
  // }
  // get flexFlow(): string

  get minWidth() {
    const type = getInt32(this.style_view, StyleKeys.MIN_WIDTH_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set minWidth(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, value.value);
            break;
        }
        break;
    }

    this.setOrAppendState(StateKeys.MIN_SIZE);
  }

  get minHeight() {
    const type = getInt32(this.style_view, StyleKeys.MIN_HEIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set minHeight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MIN_SIZE);
  }

  get width() {
    const type = getInt32(this.style_view, StyleKeys.WIDTH_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.WIDTH_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set width(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.WIDTH_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.WIDTH_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.WIDTH_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.SIZE);
  }

  get height() {
    const type = getInt32(this.style_view, StyleKeys.HEIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.HEIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set height(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.HEIGHT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.HEIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.HEIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.SIZE);
  }

  get maxWidth() {
    const type = getInt32(this.style_view, StyleKeys.MAX_WIDTH_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set maxWidth(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MAX_SIZE);
  }

  get maxHeight() {
    const type = getInt32(this.style_view, StyleKeys.MAX_HEIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set maxHeight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MAX_SIZE);
  }

  get borderLeftWidth(): Length {
    const type = getInt32(this.style_view, StyleKeys.BORDER_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderLeftWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.BORDER);
  }

  get borderRightWidth(): Length {
    const type = getInt32(this.style_view, StyleKeys.BORDER_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderRightWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.BORDER);
  }

  get borderTopWidth(): Length {
    const type = getInt32(this.style_view, StyleKeys.BORDER_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderTopWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.BORDER_TOP_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.BORDER_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.BORDER_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.BORDER_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.BORDER);
  }

  get borderBottomWidth(): Length {
    const type = getInt32(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderBottomWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.BORDER);
  }

  get left(): LengthAuto {
    const type = getInt32(this.style_view, StyleKeys.INSET_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set left(value: LengthAuto) {
    if (value === 'auto') {
      setInt32(this.style_view, StyleKeys.INSET_LEFT_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.INSET_LEFT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.INSET_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.INSET_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.INSET_LEFT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get right(): LengthAuto {
    const type = getInt32(this.style_view, StyleKeys.INSET_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set right(value: LengthAuto) {
    if (value === 'auto') {
      setInt32(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get top(): LengthAuto {
    const type = getInt32(this.style_view, StyleKeys.INSET_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set top(value: LengthAuto) {
    if (value === 'auto') {
      setInt32(this.style_view, StyleKeys.INSET_TOP_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.INSET_TOP_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.INSET_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.INSET_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.INSET_TOP_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get bottom(): LengthAuto {
    const type = getInt32(this.style_view, StyleKeys.INSET_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set bottom(value: LengthAuto) {
    if (value === 'auto') {
      setInt32(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.INSET);
  }

  get marginLeft() {
    const type = getInt32(this.style_view, StyleKeys.MARGIN_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set marginLeft(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MARGIN);
  }

  get marginRight() {
    const type = getInt32(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set marginRight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MARGIN);
  }

  get marginTop() {
    const type = getInt32(this.style_view, StyleKeys.MARGIN_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set marginTop(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MARGIN);
  }

  get marginBottom() {
    const type = getInt32(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set marginBottom(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.MARGIN);
  }

  set padding(value: Length) {
    this.inBatch = true;
    this.paddingBottom = this.paddingLeft = this.paddingRight = this.paddingTop = value;
    this.inBatch = false;
    this.setOrAppendState(StateKeys.PADDING);
  }

  get paddingLeft() {
    const type = getInt32(this.style_view, StyleKeys.PADDING_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE);
    return parseLengthPercentage(type, value);
  }

  set paddingLeft(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  get paddingRight() {
    const type = getInt32(this.style_view, StyleKeys.PADDING_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE);
    return parseLengthPercentage(type, value);
  }
  set paddingRight(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  get paddingTop() {
    const type = getInt32(this.style_view, StyleKeys.PADDING_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE);
    return parseLengthPercentage(type, value);
  }

  set paddingTop(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.PADDING_TOP_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.PADDING_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.PADDING_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.PADDING_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  get paddingBottom() {
    const type = getInt32(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE);
    return parseLengthPercentage(type, value);
  }
  set paddingBottom(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.PADDING);
  }

  get gridGap() {
    return this.gap;
  }

  set gridGap(value: string) {
    this.gap = value;
  }

  get gap() {
    if (CoreLength.equals(this.rowGap as never, this.columnGap as never)) {
      return `${CoreLength.convertToString(this.rowGap as never)}`;
    }
    return `${CoreLength.convertToString(this.rowGap as never)} ${CoreLength.convertToString(this.columnGap as never)}`;
  }

  set gap(value: string) {
    if (typeof value === 'string') {
      const values = value.split(/\s+/).filter((item) => item.trim().length !== 0);

      const length = values.length;
      if (length === 0) {
        return;
      }

      if (length === 1) {
        const row = values[0];
        this.rowGap = CoreLength.parse(row) as never;
        this.columnGap = CoreLength.parse(row) as never;
      }

      if (length > 1) {
        const row = values[0];
        const column = values[1];
        this.rowGap = CoreLength.parse(row) as never;
        this.columnGap = CoreLength.parse(column) as never;
      }
    }
  }

  get rowGap(): Length {
    const type = getInt32(this.style_view, StyleKeys.GAP_ROW_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE);
    return parseLengthPercentage(type, value);
  }

  set rowGap(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.GAP_ROW_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.GAP_ROW_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.GAP_ROW_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.GAP_ROW_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, value.value);
            break;
        }
        break;
    }

    this.setOrAppendState(StateKeys.GAP);
  }

  get columnGap(): Length {
    const type = getInt32(this.style_view, StyleKeys.GAP_COLUMN_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE);
    return parseLengthPercentage(type, value);
  }

  set columnGap(value: Length) {
    switch (typeof value) {
      case 'number':
        setInt32(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.GAP);
  }

  get aspectRatio(): number {
    return getFloat32(this.style_view, StyleKeys.ASPECT_RATIO);
  }

  set aspectRatio(value: number) {
    setFloat32(this.style_view, StyleKeys.ASPECT_RATIO, value);
    this.setOrAppendState(StateKeys.ASPECT_RATIO);
  }

  get flexBasis(): LengthAuto {
    const type = getInt32(this.style_view, StyleKeys.FLEX_BASIS_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set flexBasis(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        setInt32(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 0);
        break;
      case 'number':
        setInt32(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            setInt32(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            setInt32(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, value.value);
            break;
          case '%':
            setInt32(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, value.value);
            break;
        }
        break;
    }
    this.setOrAppendState(StateKeys.FLEX_BASIS);
  }
  get alignItems() {
    switch (getInt32(this.style_view, StyleKeys.ALIGN_ITEMS)) {
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
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.Normal);
        break;
      case 'start':
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.Start);
        break;
      case 'end':
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.End);
        break;
      case 'flex-start':
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.FlexStart);
        break;
      case 'flex-end':
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.FlexEnd);
        break;
      case 'center':
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.Center);
        break;
      case 'baseline':
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.Baseline);
        break;
      case 'stretch':
        setInt32(this.style_view, StyleKeys.ALIGN_ITEMS, AlignItems.Stretch);
        break;
    }
    this.setOrAppendState(StateKeys.ALIGN_ITEMS);
  }

  get alignSelf() {
    switch (getInt32(this.style_view, StyleKeys.ALIGN_SELF)) {
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
      setInt32(this.style_view, StyleKeys.ALIGN_SELF, align);
      this.setOrAppendState(StateKeys.ALIGN_SELF);
    }
  }

  get alignContent() {
    switch (getInt32(this.style_view, StyleKeys.ALIGN_CONTENT)) {
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
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.Normal);
        break;
      case 'space-around':
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.SpaceAround);
        break;
      case 'space-between':
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.SpaceBetween);
        break;
      case 'space-evenly':
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.SpaceEvenly);
        break;
      case 'center':
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.Center);
        break;
      case 'end':
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.End);
        break;
      case 'start':
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.Start);
        break;
      case 'stretch':
        setInt32(this.style_view, StyleKeys.ALIGN_CONTENT, AlignContent.Stretch);
        break;
    }
    this.setOrAppendState(StateKeys.ALIGN_CONTENT);
  }

  get justifyItems() {
    switch (getInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS)) {
      case JustifyItems.Normal:
        return 'normal';
      case JustifyItems.Start:
        return 'start';
      case JustifyItems.End:
        return 'end';
      case JustifyItems.Center:
        return 'center';
      case JustifyItems.Baseline:
        return 'baseline';
      case JustifyItems.Stretch:
        return 'stretch';
      case JustifyItems.FlexStart:
        return 'flex-start';
      case JustifyItems.FlexEnd:
        return 'flex-end';
    }
  }
  set justifyItems(value: 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end') {
    switch (value) {
      case 'normal':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.Normal);
        break;
      case 'start':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.Start);
        break;
      case 'end':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.End);
        break;
      case 'center':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.Center);
        break;
      case 'baseline':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.Baseline);
        break;
      case 'stretch':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.Stretch);
        break;
      case 'flex-start':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.FlexStart);
        break;
      case 'flex-end':
        setInt32(this.style_view, StyleKeys.JUSTIFY_ITEMS, JustifyItems.FlexEnd);
        break;
    }
    this.setOrAppendState(StateKeys.JUSTIFY_ITEMS);
  }

  get justifySelf() {
    switch (getInt32(this.style_view, StyleKeys.JUSTIFY_SELF)) {
      case JustifySelf.Normal:
        return 'normal';
      case JustifySelf.Start:
        return 'start';
      case JustifySelf.End:
        return 'end';
      case JustifySelf.Center:
        return 'center';
      case JustifySelf.Baseline:
        return 'baseline';
      case JustifySelf.Stretch:
        return 'stretch';
      case JustifySelf.FlexStart:
        return 'flex-start';
      case JustifySelf.FlexEnd:
        return 'flex-end';
    }
  }

  set justifySelf(value: 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end') {
    switch (value) {
      case 'normal':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.Normal);
        break;
      case 'start':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.Start);
        break;
      case 'end':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.End);
        break;
      case 'center':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.Center);
        break;
      case 'baseline':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.Baseline);
        break;
      case 'stretch':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.Stretch);
        break;
      case 'flex-start':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.FlexStart);
        break;
      case 'flex-end':
        setInt32(this.style_view, StyleKeys.JUSTIFY_SELF, JustifySelf.FlexEnd);
        break;
    }
    this.setOrAppendState(StateKeys.JUSTIFY_SELF);
  }

  get justifyContent() {
    switch (getInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT)) {
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
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.Normal);
        break;
      case 'space-around':
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.SpaceAround);
        break;
      case 'space-between':
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.SpaceBetween);
        break;
      case 'space-evenly':
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.SpaceEvenly);
        break;
      case 'center':
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.Center);
        break;
      case 'end':
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.End);
        break;
      case 'start':
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.Start);
        break;
      case 'stretch':
        setInt32(this.style_view, StyleKeys.JUSTIFY_CONTENT, JustifyContent.Stretch);
        break;
    }
    this.setOrAppendState(StateKeys.JUSTIFY_CONTENT);
  }
  get gridAutoRows() {
    if (!this.nativeView) {
      return '';
    }

    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridAutoRows(this.nativeView);
    }

    return '';
  }

  set gridAutoRows(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridAutoRows(this.nativeView, value);
    }
  }

  get gridAutoColumns() {
    if (!this.nativeView) {
      return '';
    }
    return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridAutoColumns(this.nativeView);
  }

  set gridAutoColumns(value: string) {
    if (!this.nativeView) {
      return;
    }
    org.nativescript.mason.masonkit.NodeHelper.getShared().setGridAutoColumns(this.nativeView, value);
  }

  get gridAutoFlow(): GridAutoFlow {
    switch (getInt32(this.style_view, StyleKeys.GRID_AUTO_FLOW)) {
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
        setInt32(this.style_view, StyleKeys.GRID_AUTO_FLOW, 0);
        break;
      case 'column':
        setInt32(this.style_view, StyleKeys.GRID_AUTO_FLOW, 1);
        break;
      case 'row dense':
        setInt32(this.style_view, StyleKeys.GRID_AUTO_FLOW, 2);
        break;
      case 'column dense':
        setInt32(this.style_view, StyleKeys.GRID_AUTO_FLOW, 3);
        break;
    }

    this.setOrAppendState(StateKeys.GRID_AUTO_FLOW);
  }

  get gridRowGap() {
    return this.rowGap;
  }

  set gridRowGap(value: Length) {
    this.rowGap = value;
  }

  get gridColumnGap() {
    return this.columnGap;
  }

  set gridColumnGap(value: Length) {
    this.columnGap = value;
  }

  set gridColumn(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridColumn(this.nativeView, value);
    }
  }

  get gridColumn() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridColumn(this.nativeView);
    }
    return '';
  }

  get gridColumnStart(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridColumnStart(this.nativeView);
    }
    return '';
  }

  set gridColumnStart(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridColumnStart(this.nativeView, value);
    }
  }

  get gridColumnEnd(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridColumnEnd(this.nativeView);
    }
    return '';
  }

  set gridColumnEnd(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridColumnEnd(this.nativeView, value);
    }
  }

  set gridRow(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridRow(this.nativeView, value);
    }
  }

  get gridRow(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridRow(this.nativeView);
    }
    return '';
  }

  get gridRowStart(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridRowStart(this.nativeView);
    }
    return '';
  }

  set gridRowStart(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridRowStart(this.nativeView, value);
    }
  }

  get gridRowEnd(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridRowEnd(this.nativeView);
    }
    return '';
  }

  set gridRowEnd(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridRowEnd(this.nativeView, value);
    }
  }

  set gridArea(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridArea(this.nativeView, value);
    }
  }

  get gridArea() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridArea(this.nativeView);
    }
    return '';
  }

  set gridTemplateRows(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateRows(this.nativeView, value);
    }
  }

  get gridTemplateRows() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridTemplateRows(this.nativeView);
    }
    return '';
  }

  get gridTemplateColumns() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridTemplateColumns(this.nativeView);
    }
    return '';
  }

  set gridTemplateColumns(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateColumns(this.nativeView, value);
    }
  }

  get gridTemplateAreas() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridTemplateAreas(this.nativeView);
    }
    return '';
  }

  set gridTemplateAreas(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateAreas(this.nativeView, value);
    }
  }

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
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 0);
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 0);
        break;
      case 'hidden':
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 1);
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 1);
        break;
      case 'scroll':
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 2);
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 2);
        break;
      default:
        {
          const values = value.split(' ');
          switch (values[0]) {
            case 'visible':
              setInt32(this.style_view, StyleKeys.OVERFLOW_X, 0);
              break;
            case 'hidden':
              setInt32(this.style_view, StyleKeys.OVERFLOW_X, 1);
              break;
            case 'scroll':
              setInt32(this.style_view, StyleKeys.OVERFLOW_X, 2);
              break;
            case 'clip':
              setInt32(this.style_view, StyleKeys.OVERFLOW_X, 3);
              break;
            case 'auto':
              setInt32(this.style_view, StyleKeys.OVERFLOW_X, 4);
              break;
          }
          switch (values[1]) {
            case 'visible':
              setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 0);
              break;
            case 'hidden':
              setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 1);
              break;
            case 'scroll':
              setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 2);
              break;
            case 'clip':
              setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 3);
              break;
            case 'auto':
              setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 4);
              break;
          }
        }
        break;
    }

    this.setOrAppendState(StateKeys.OVERFLOW);
  }
  get overflowX() {
    switch (getInt32(this.style_view, StyleKeys.OVERFLOW_X)) {
      case 0:
        return 'visible';
      case 1:
        return 'hidden';
      case 2:
        return 'scroll';
    }
  }

  set overflowX(value: OverFlow) {
    let dirty = false;
    switch (value) {
      case 'visible':
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 0);
        dirty = true;
        break;
      case 'hidden':
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 1);
        dirty = true;
        break;
      case 'scroll':
        dirty = true;
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 2);
        break;
      case 'clip':
        dirty = true;
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 3);
        break;
      case 'auto':
        dirty = true;
        setInt32(this.style_view, StyleKeys.OVERFLOW_X, 4);
        break;
    }
    if (dirty) {
      this.setOrAppendState(StateKeys.OVERFLOW_X);
    }
  }

  get overflowY() {
    switch (getInt32(this.style_view, StyleKeys.OVERFLOW_Y)) {
      case 0:
        return 'visible';
      case 1:
        return 'hidden';
      case 2:
        return 'scroll';
      case 3:
        return 'clip';
      case 4:
        return 'auto';
    }
  }

  set overflowY(value: OverFlow) {
    let dirty = false;
    switch (value) {
      case 'visible':
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 0);
        dirty = true;
        break;
      case 'hidden':
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 1);
        dirty = true;
        break;
      case 'scroll':
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 2);
        org.nativescript.mason.masonkit.NodeHelper.getShared().setOverflowX(this.nativeView, org.nativescript.mason.masonkit.enums.Overflow.Scroll);
        dirty = true;
        break;
      case 'clip':
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 3);
        dirty = true;
        break;
      case 'auto':
        setInt32(this.style_view, StyleKeys.OVERFLOW_Y, 4);
        dirty = true;
        break;
    }
    if (dirty) {
      this.setOrAppendState(StateKeys.OVERFLOW_Y);
    }
  }

  get flexGrow(): number {
    return getFloat32(this.style_view, StyleKeys.FLEX_GROW);
  }

  set flexGrow(value: number) {
    setFloat32(this.style_view, StyleKeys.FLEX_GROW, value);
    this.setOrAppendState(StateKeys.FLEX_GROW);
  }

  get flexShrink(): number {
    return getFloat32(this.style_view, StyleKeys.FLEX_SHRINK);
  }

  set flexShrink(value: number) {
    setFloat32(this.style_view, StyleKeys.FLEX_SHRINK, value);
    this.setOrAppendState(StateKeys.FLEX_SHRINK);
  }

  get scrollBarWidth(): number | CoreTypes.LengthType {
    return getFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH);
  }

  set scrollBarWidth(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') {
      setFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH, value);
      this.setOrAppendState(StateKeys.SCROLLBAR_WIDTH);
    } else if (typeof value === 'object') {
      switch (value.unit) {
        case 'dip':
          setFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH, layout.toDevicePixels(value.value));
          this.setOrAppendState(StateKeys.SCROLLBAR_WIDTH);
          break;
        case 'px':
          setFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH, value.value);
          this.setOrAppendState(StateKeys.SCROLLBAR_WIDTH);
          break;
      }
    }
  }

  get letterSpacing(): number | CoreTypes.LengthType {
    return getFloat32(this.text_style_view, TextStyleKeys.LETTER_SPACING);
  }

  set letterSpacing(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') {
      setFloat32(this.text_style_view, TextStyleKeys.LETTER_SPACING, value);
      setUint8(this.text_style_view, TextStyleKeys.LETTER_SPACING_STATE, 1);
      this.setOrAppendTextState(TextStateKeys.LETTER_SPACING);
    } else if (typeof value === 'object') {
      switch (value.unit) {
        case 'dip':
          setFloat32(this.text_style_view, TextStyleKeys.LETTER_SPACING, layout.toDevicePixels(value.value));
          setUint8(this.text_style_view, TextStyleKeys.LETTER_SPACING_STATE, 1);
          this.setOrAppendTextState(TextStateKeys.LETTER_SPACING);
          break;
        case 'px':
          setFloat32(this.text_style_view, TextStyleKeys.LETTER_SPACING, value.value);
          setUint8(this.text_style_view, TextStyleKeys.LETTER_SPACING_STATE, 1);
          this.setOrAppendTextState(TextStateKeys.LETTER_SPACING);
          break;
      }
    }
  }

  get lineHeight(): number | CoreTypes.LengthType {
    return getFloat32(this.text_style_view, TextStyleKeys.LINE_HEIGHT);
  }

  set lineHeight(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') {
      setFloat32(this.text_style_view, TextStyleKeys.LINE_HEIGHT, value);
      setUint8(this.text_style_view, TextStyleKeys.LINE_HEIGHT_STATE, 1);
      setUint8(this.text_style_view, TextStyleKeys.LINE_HEIGHT_TYPE, 0);
      this.setOrAppendTextState(TextStateKeys.LINE_HEIGHT);
    } else if (typeof value === 'object') {
      switch (value.unit) {
        case 'dip':
          setFloat32(this.text_style_view, TextStyleKeys.LETTER_SPACING, layout.toDevicePixels(value.value));
          setUint8(this.text_style_view, TextStyleKeys.LINE_HEIGHT_STATE, 1);
          setUint8(this.text_style_view, TextStyleKeys.LINE_HEIGHT_TYPE, 1);
          this.setOrAppendTextState(TextStateKeys.LETTER_SPACING);
          break;
        case 'px':
          setFloat32(this.text_style_view, TextStyleKeys.LETTER_SPACING, value.value);
          setUint8(this.text_style_view, TextStyleKeys.LINE_HEIGHT_STATE, 1);
          setUint8(this.text_style_view, TextStyleKeys.LINE_HEIGHT_TYPE, 1);
          this.setOrAppendTextState(TextStateKeys.LETTER_SPACING);
          break;
      }
    }
  }

  get textOverflow() {
    if (!this.text_style_view) {
      // clip ?
      return 'clip';
    }
    const type = getInt32(this.text_style_view, TextStyleKeys.TEXT_OVERFLOW);
    switch (type) {
      case 0:
        return 'clip';
      case 1:
        return 'ellipsis';
      default:
    }

    if (__ANDROID__) {
      // @ts-ignore
      const overflow = this.view_._view.getTextOverflow();
    }

    if (__APPLE__) {
      // @ts-ignore
      const overflow = this.view_._view.textOverflow;
    }

    return 'clip';
  }

  set textOverflow(value: 'clip' | 'ellipsis' | `${string}`) {
    if (!this.text_style_view) {
      return;
    }

    let flow = -1;

    switch (value) {
      case 'clip':
        flow = 0;
        break;
      case 'ellipsis':
        flow = 1;
        break;
      default:
        {
          if (__ANDROID__) {
            // @ts-ignore
            const overflow = this.view_._view.getTextOverflow();
          }

          if (__APPLE__) {
            // @ts-ignore
            const overflow = this.view_._view.textOverflow;
          }
        }
        break;
    }

    if (flow !== -1) {
      setInt32(this.text_style_view, TextStyleKeys.TEXT_OVERFLOW, flow);
      setInt8(this.text_style_view, TextStyleKeys.TEXT_OVERFLOW_STATE, 1);
      this.setOrAppendTextState(TextStateKeys.TEXT_OVERFLOW);
    }
  }

  get textAlignment() {
    if (!this.text_style_view) {
      // clip ?
      return 'start';
    }
    const type = getInt32(this.text_style_view, TextStyleKeys.TEXT_ALIGN);
    switch (type) {
      case 0:
        // auto
        return 'start';
      case 1:
        return 'left';
      case 2:
        return 'right';
      case 3:
        return 'center';
      case 4:
        return 'justify';
      case 5:
        return 'start';
      case 6:
        return 'end';
      default:
        return 'start';
    }
  }

  set textAlignment(value: 'left' | 'right' | 'center' | 'justify' | 'start' | 'end') {
    if (!this.text_style_view) {
      return;
    }

    let align = -1;

    switch (value) {
      case 'left':
        align = 1;
        break;
      case 'right':
        align = 2;
        break;
      case 'center':
        align = 3;
        break;
      case 'justify':
        align = 4;
        break;
      case 'start':
        align = 5;
        break;
      case 'end':
        align = 6;
        break;
      default:
        break;
    }

    if (align !== -1) {
      setInt32(this.text_style_view, TextStyleKeys.TEXT_ALIGN, align);
      setInt8(this.text_style_view, TextStyleKeys.TEXT_ALIGN_STATE, 1);
      this.setOrAppendTextState(TextStateKeys.TEXT_ALIGN);
    }
  }

  get background() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackground(this.nativeView);
    }
    return '';
  }

  set background(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setBackground(this.nativeView, value);
    }
  }

  get border() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBorder(this.nativeView);
    }
    return '';
  }

  set border(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setBorder(this.nativeView, value);
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
      aspectRatio: this.aspectRatio,
      flexBasis: this.flexBasis,
      overflow: this.overflow,
      flexShrink: this.flexShrink,
      scrollBarWidth: this.scrollBarWidth,
      gap: this.gap,
      gridArea: this.gridArea,
      gridAutoFlow: this.gridAutoFlow,
      gridAutoColumns: this.gridAutoColumns,
      gridAutoRows: this.gridAutoRows,
      gridColumn: this.gridColumn,
      gridRow: this.gridRow,
      gridTemplateRows: this.gridTemplateRows,
      gridTemplateColumns: this.gridTemplateColumns,
    };
  }
}
