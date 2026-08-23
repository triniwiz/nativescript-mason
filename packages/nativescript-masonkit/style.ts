import { layout } from '@nativescript/core/utils';
import type { DimensionLength, GridAutoFlow, Length, LengthAuto, VerticalAlign, View } from '.';
import { Color, CoreTypes, Length as CoreLength, PercentLength as CorePercentLength } from '@nativescript/core';
import { AlignContent, AlignSelf, AlignItems, JustifyContent, JustifySelf, _parseGridAutoRowsColumns, _setGridAutoRows, _setGridAutoColumns, _parseGridLine, JustifyItems, GridTemplates, _parseGridTemplates, _setGridTemplateColumns, _setGridTemplateRows, _getGridTemplateRows, _getGridTemplateColumns, Float, Clear } from './utils';

enum StyleKeys {
  DISPLAY = 0,
  POSITION = 1,
  DIRECTION = 2,
  FLEX_DIRECTION = 3,
  FLEX_WRAP = 4,
  OVERFLOW_X = 5,
  OVERFLOW_Y = 6,

  ALIGN_ITEMS = 7,
  ALIGN_SELF = 8,
  ALIGN_CONTENT = 9,

  JUSTIFY_ITEMS = 10,
  JUSTIFY_SELF = 11,
  JUSTIFY_CONTENT = 12,

  // Contiguous types, then contiguous values per group
  INSET_LEFT_TYPE = 13,
  INSET_RIGHT_TYPE = 14,
  INSET_TOP_TYPE = 15,
  INSET_BOTTOM_TYPE = 16,
  INSET_LEFT_VALUE = 17, // f32 (4 bytes: 17-20)
  INSET_RIGHT_VALUE = 21, // f32 (4 bytes: 21-24)
  INSET_TOP_VALUE = 25, // f32 (4 bytes: 25-28)
  INSET_BOTTOM_VALUE = 29, // f32 (4 bytes: 29-32)

  MARGIN_LEFT_TYPE = 33,
  MARGIN_RIGHT_TYPE = 34,
  MARGIN_TOP_TYPE = 35,
  MARGIN_BOTTOM_TYPE = 36,
  MARGIN_LEFT_VALUE = 37, // f32 (4 bytes: 37-40)
  MARGIN_RIGHT_VALUE = 41, // f32 (4 bytes: 41-44)
  MARGIN_TOP_VALUE = 45, // f32 (4 bytes: 45-48)
  MARGIN_BOTTOM_VALUE = 49, // f32 (4 bytes: 49-52)

  PADDING_LEFT_TYPE = 53,
  PADDING_RIGHT_TYPE = 54,
  PADDING_TOP_TYPE = 55,
  PADDING_BOTTOM_TYPE = 56,
  PADDING_LEFT_VALUE = 57, // f32 (4 bytes: 57-60)
  PADDING_RIGHT_VALUE = 61, // f32 (4 bytes: 61-64)
  PADDING_TOP_VALUE = 65, // f32 (4 bytes: 65-68)
  PADDING_BOTTOM_VALUE = 69, // f32 (4 bytes: 69-72)

  BORDER_LEFT_TYPE = 73,
  BORDER_RIGHT_TYPE = 74,
  BORDER_TOP_TYPE = 75,
  BORDER_BOTTOM_TYPE = 76,
  BORDER_LEFT_VALUE = 77, // f32 (4 bytes: 77-80)
  BORDER_RIGHT_VALUE = 81, // f32 (4 bytes: 81-84)
  BORDER_TOP_VALUE = 85, // f32 (4 bytes: 85-88)
  BORDER_BOTTOM_VALUE = 89, // f32 (4 bytes: 89-92)

  FLEX_GROW = 93, // f32 (4 bytes: 93-96)
  FLEX_SHRINK = 97, // f32 (4 bytes: 97-100)

  FLEX_BASIS_TYPE = 101,
  FLEX_BASIS_VALUE = 102, // f32 (4 bytes: 102-105)

  WIDTH_TYPE = 106,
  HEIGHT_TYPE = 107,
  WIDTH_VALUE = 108, // f32 (4 bytes: 108-111)
  HEIGHT_VALUE = 112, // f32 (4 bytes: 112-115)

  MIN_WIDTH_TYPE = 116,
  MIN_HEIGHT_TYPE = 117,
  MIN_WIDTH_VALUE = 118, // f32 (4 bytes: 118-121)
  MIN_HEIGHT_VALUE = 122, // f32 (4 bytes: 122-125)

  MAX_WIDTH_TYPE = 126,
  MAX_HEIGHT_TYPE = 127,
  MAX_WIDTH_VALUE = 128, // f32 (4 bytes: 128-131)
  MAX_HEIGHT_VALUE = 132, // f32 (4 bytes: 132-135)

  GAP_ROW_TYPE = 136,
  GAP_COLUMN_TYPE = 137,
  GAP_ROW_VALUE = 138, // f32 (4 bytes: 138-141)
  GAP_COLUMN_VALUE = 142, // f32 (4 bytes: 142-145)

  ASPECT_RATIO = 146, // f32 (4 bytes: 146-149)
  GRID_AUTO_FLOW = 150,
  GRID_COLUMN_START_TYPE = 151,
  GRID_COLUMN_END_TYPE = 152,
  GRID_ROW_START_TYPE = 153,
  GRID_ROW_END_TYPE = 154,
  GRID_COLUMN_START_VALUE = 155, // f32 (4 bytes: 155-158)
  GRID_COLUMN_END_VALUE = 159, // f32 (4 bytes: 159-162)
  GRID_ROW_START_VALUE = 163, // f32 (4 bytes: 163-166)
  GRID_ROW_END_VALUE = 167, // f32 (4 bytes: 167-170)
  SCROLLBAR_WIDTH = 171, // float (4 bytes: 171-174)
  ALIGN = 175,
  BOX_SIZING = 176,
  OVERFLOW = 177,
  ITEM_IS_TABLE = 178,
  ITEM_IS_REPLACED = 179,
  DISPLAY_MODE = 180,
  FORCE_INLINE = 181,
  MIN_CONTENT_WIDTH = 182, // float (4 bytes: 182-185)
  MIN_CONTENT_HEIGHT = 186, // float (4 bytes: 186-189)
  MAX_CONTENT_WIDTH = 190, // float (4 bytes: 190-193)
  MAX_CONTENT_HEIGHT = 194, // float (4 bytes: 194-197)

  // Border Style (per side)
  BORDER_LEFT_STYLE = 198,
  BORDER_RIGHT_STYLE = 199,
  BORDER_TOP_STYLE = 200,
  BORDER_BOTTOM_STYLE = 201,

  // Border Color (per side)
  BORDER_LEFT_COLOR = 202, // u32 (4 bytes: 202-205)
  BORDER_RIGHT_COLOR = 206, // u32 (4 bytes: 206-209)
  BORDER_TOP_COLOR = 210, // u32 (4 bytes: 210-213)
  BORDER_BOTTOM_COLOR = 214, // u32 (4 bytes: 214-217)

  BORDER_RADIUS_TOP_LEFT_X_TYPE = 218,
  BORDER_RADIUS_TOP_LEFT_Y_TYPE = 219,
  BORDER_RADIUS_TOP_RIGHT_X_TYPE = 220,
  BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 221,
  BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 222,
  BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 223,
  BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 224,
  BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 225,

  BORDER_RADIUS_TOP_LEFT_X_VALUE = 226, // f32 (4 bytes: 226-229)
  BORDER_RADIUS_TOP_LEFT_Y_VALUE = 230, // f32 (4 bytes: 230-233)
  BORDER_RADIUS_TOP_RIGHT_X_VALUE = 234, // f32 (4 bytes: 234-237)
  BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238, // f32 (4 bytes: 238-241)
  BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 242, // f32 (4 bytes: 242-245)
  BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 246, // f32 (4 bytes: 246-249)
  BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 250, // f32 (4 bytes: 250-253)
  BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 254, // f32 (4 bytes: 254-257)

  BORDER_RADIUS_TOP_LEFT_EXPONENT = 258, // f32 (4 bytes: 258-261)
  BORDER_RADIUS_TOP_RIGHT_EXPONENT = 262, // f32 (4 bytes: 262-265)
  BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 266, // f32 (4 bytes: 266-269)
  BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270, // f32 (4 bytes: 270-273)

  // Float
  FLOAT = 274,
  CLEAR = 275,

  OBJECT_FIT = 276,

  FONT_METRICS_ASCENT_OFFSET = 277, // float (4 bytes: 277-280)
  FONT_METRICS_DESCENT_OFFSET = 281, // float (4 bytes: 281-284)
  FONT_METRICS_X_HEIGHT_OFFSET = 285, // float (4 bytes: 285-288)
  FONT_METRICS_LEADING_OFFSET = 289, // float (4 bytes: 289-292)
  FONT_METRICS_CAP_HEIGHT_OFFSET = 293, // float (4 bytes: 293-296)
  VERTICAL_ALIGN_OFFSET_OFFSET = 297, // float (4 bytes: 297-300)
  VERTICAL_ALIGN_IS_PERCENT_OFFSET = 301,
  VERTICAL_ALIGN_ENUM_OFFSET = 302, // float (4 bytes: 302-305)
  FIRST_BASELINE_OFFSET = 306, // float (4 bytes: 306-309)
  Z_INDEX = 310, // float (4 bytes: 310-313)
  ITEM_IS_LIST = 314,
  ITEM_IS_LIST_ITEM = 315,
  LIST_STYLE_POSITION = 316,
  LIST_STYLE_TYPE = 317,
  LIST_STYLE_POSITION_STATE = 318,
  LIST_STYLE_TYPE_STATE = 319,

  REF_COUNT = 320, // int

  FONT_COLOR = 324, // int
  FONT_COLOR_STATE = 328, //byte
  FONT_SIZE = 329, //int
  FONT_SIZE_TYPE = 333, //byte
  FONT_SIZE_STATE = 334, //byte
  FONT_WEIGHT = 335, // int
  FONT_WEIGHT_STATE = 339, // byte
  FONT_STYLE_SLANT = 340, // int
  FONT_STYLE_TYPE = 344, //byte
  FONT_STYLE_STATE = 345, //byte
  FONT_FAMILY_STATE = 346, //byte
  FONT_RESOLVED_DIRTY = 347, //byte
  BACKGROUND_COLOR = 348, //int
  BACKGROUND_COLOR_STATE = 352, //byte
  BACKGROUND_COLOR_TYPE = 353, //byte
  DECORATION_LINE = 354, //byte
  DECORATION_LINE_STATE = 355, //byte
  DECORATION_COLOR = 356, //int
  DECORATION_COLOR_STATE = 360, //byte
  DECORATION_STYLE = 361, //byte
  DECORATION_STYLE_STATE = 362, //byte
  LETTER_SPACING = 363, //int
  LETTER_SPACING_STATE = 367, //byte
  TEXT_WRAP = 368, //byte
  TEXT_WRAP_STATE = 369, //byte
  WHITE_SPACE = 370, //byte
  WHITE_SPACE_STATE = 371, //byte
  TEXT_TRANSFORM = 372, //byte
  TEXT_TRANSFORM_STATE = 373, //byte
  TEXT_ALIGN = 374, //byte
  TEXT_ALIGN_STATE = 375, //byte
  TEXT_JUSTIFY = 376, //byte
  TEXT_JUSTIFY_STATE = 377, //byte
  TEXT_INDENT = 378, // int
  TEXT_INDENT_TYPE = 382, // byte
  TEXT_INDENT_STATE = 383, // byte
  LINE_HEIGHT = 384, // int
  LINE_HEIGHT_STATE = 388, // byte
  LINE_HEIGHT_TYPE = 389, //byte
  DECORATION_THICKNESS = 390, // int
  DECORATION_THICKNESS_STATE = 394, // byte
  TEXT_SHADOW_STATE = 395, //byte
  TEXT_OVERFLOW = 396,
  TEXT_OVERFLOW_STATE = 397,

  // Pseudo set mask: 128-bit bitmask (two longs) tracking which properties
  // were explicitly set on a pseudo style buffer. Uses the same bit layout
  // as StateKeys. Zero-copy: lives in the style buffer itself.
  PSEUDO_SET_MASK_LOW = 398, // long (8 bytes: 398-405)
  PSEUDO_SET_MASK_HIGH = 406, // long (8 bytes: 406-413)

  // font-variant-numeric bitmask (byte) + state
  FONT_VARIANT_NUMERIC = 419, // byte (bitmask)
  FONT_VARIANT_NUMERIC_STATE = 420, // byte

  OBJECT_POSITION_X_TYPE = 560, // byte (0=px, 1=%, 2=keyword)
  OBJECT_POSITION_Y_TYPE = 561, // byte
  OBJECT_POSITION_X_VALUE = 562, // f32 (4 bytes: 562-565)
  OBJECT_POSITION_Y_VALUE = 566, // f32 (4 bytes: 566-569)
  OBJECT_POSITION_STATE = 570, // byte
  WRITING_MODE = 571, // byte
  WRITING_MODE_STATE = 572, // byte
  UNICODE_BIDI = 573, // byte
  UNICODE_BIDI_STATE = 574, // byte
  HYPHENS = 575, // byte
  HYPHENS_STATE = 576, // byte
  CARET_COLOR = 577, // u32 (4 bytes: 577-580)
  CARET_COLOR_STATE = 581, // byte
  WORD_SPACING = 582, // f32 (4 bytes: 582-585)
  WORD_SPACING_TYPE = 586, // byte (0=px, 1=%, 2=normal)
  WORD_SPACING_STATE = 587, // byte
  FONT_STRETCH = 588, // i32 (4 bytes: 588-591) percentage * 100
  FONT_STRETCH_STATE = 592, // byte
}

export type OverFlow = 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto';

// Windows: the native Style.UpdateGrid takes all grid strings at once. To set one while preserving
// the others, read the current values back from the Grid*Css getters. (Layout grid props like
// grid-auto-flow and gap are buffer-stored and already flow through the live style buffer.)
function windowsSetGrid(nativeView: any, field: string, value: string) {
  const s = nativeView?.Style;
  if (!s) return;
  const g: any = {
    gridAutoRows: s.GridAutoRowsCss,
    gridAutoColumns: s.GridAutoColumnsCss,
    gridColumn: s.GridColumnCss,
    gridColumnStart: s.GridColumnStartCss,
    gridColumnEnd: s.GridColumnEndCss,
    gridRow: s.GridRowCss,
    gridRowStart: s.GridRowStartCss,
    gridRowEnd: s.GridRowEndCss,
    gridTemplateRows: s.GridTemplateRowsCss,
    gridTemplateColumns: s.GridTemplateColumnsCss,
    gridArea: s.GridAreaCss,
    gridTemplateAreas: s.GridTemplateAreasCss,
  };
  g[field] = value ?? '';
  // `grid-row` / `grid-column` are SHORTHANDS for their `{start,end}` pair. UpdateGrid applies the
  // shorthand first and then the start/end parts — and the parts (read back here as their defaults
  // before this change) would overwrite the span we just set, collapsing the item to a single track.
  // Derive start/end from the shorthand so the three stay consistent (`span 2` -> start `span 2`,
  // end auto; `1 / 3` -> start `1`, end `3`).
  if (field === 'gridRow' || field === 'gridColumn') {
    const parts = String(value ?? '')
      .split('/')
      .map((p) => p.trim());
    g[field + 'Start'] = parts[0] ?? '';
    g[field + 'End'] = parts.length > 1 ? (parts[1] ?? '') : '';
  }
  s.UpdateGrid(g.gridAutoRows, g.gridAutoColumns, g.gridColumn, g.gridColumnStart, g.gridColumnEnd, g.gridRow, g.gridRowStart, g.gridRowEnd, g.gridTemplateRows, g.gridTemplateColumns, g.gridArea, g.gridTemplateAreas);
  // UpdateGrid mutates the node's (non-buffer) grid placement directly; unlike a buffer write it does
  // not mark the node dirty / invalidate XAML measure, so a grid ITEM's placement change wouldn't
  // re-run the parent container's grid layout. SyncStyle marks the node dirty + InvalidateMeasure,
  // which propagates up to the container.
  try {
    (nativeView as NativeScript.Mason.IMasonElement).SyncStyle('0', '0');
  } catch (_) {}
}

function parseDimension(type: number, value: number): DimensionLength {
  switch (type) {
    case 0:
      return 'auto';
    case 1:
      return { value, unit: 'px' };
    case 2:
      return { value, unit: '%' };
    case 3:
      return 'min-content';
    case 4:
      return 'max-content';
    case 5:
      return 'fit-content';
    case 6:
      return `fit-content(${value}px)`;
    case 7:
      return `fit-content(${value}%)`;
    case 8:
      return 'stretch';
    case 9:
      return 'content';
  }
}

function parseLengthPercentageAuto(type: number, value: number): LengthAuto {
  return parseDimension(type, value) as LengthAuto;
}

function dimensionFromString(value: string): { type: number; value: number } {
  const t = value.trim();
  if (t === '' || t === 'auto') {
    return { type: 0, value: 0 };
  }
  switch (t) {
    case 'min-content':
      return { type: 3, value: 0 };
    case 'max-content':
      return { type: 4, value: 0 };
    case 'fit-content':
      return { type: 5, value: 0 };
    case 'stretch':
      return { type: 8, value: 0 };
    case 'content':
      return { type: 9, value: 0 };
  }
  if (t.startsWith('fit-content(') && t.endsWith(')')) {
    const limit = t.slice('fit-content('.length, -1).trim();
    if (limit.endsWith('%')) {
      return { type: 7, value: parseFloat(limit) || 0 };
    }
    const n = parseFloat(limit) || 0;
    return { type: 6, value: limit.endsWith('px') ? n : layout.toDevicePixels(n) };
  }
  if (t.endsWith('%')) {
    return { type: 2, value: parseFloat(t) || 0 };
  }
  const n = parseFloat(t) || 0;
  return { type: 1, value: t.endsWith('px') ? n : layout.toDevicePixels(n) };
}

function parseLengthPercentage(type: number, value: number): Length {
  switch (type) {
    case 0:
      return { value, unit: 'px' };
    case 1:
      return { value, unit: '%' };
  }
}

const enum DisplayMode {
  None = 0,
  Inline = 1,
  Box = 2,
}

class StateKeys {
  private constructor(public readonly bits: bigint) {}

  private static flag(n: number): StateKeys {
    return new StateKeys(1n << BigInt(n));
  }

  static readonly NONE = new StateKeys(0n);
  static readonly DISPLAY = StateKeys.flag(0);
  static readonly POSITION = StateKeys.flag(1);
  static readonly DIRECTION = StateKeys.flag(2);
  static readonly FLEX_DIRECTION = StateKeys.flag(3);
  static readonly FLEX_WRAP = StateKeys.flag(4);
  static readonly OVERFLOW_X = StateKeys.flag(5);
  static readonly OVERFLOW_Y = StateKeys.flag(6);
  static readonly ALIGN_ITEMS = StateKeys.flag(7);
  static readonly ALIGN_SELF = StateKeys.flag(8);
  static readonly ALIGN_CONTENT = StateKeys.flag(9);
  static readonly JUSTIFY_ITEMS = StateKeys.flag(10);
  static readonly JUSTIFY_SELF = StateKeys.flag(11);
  static readonly JUSTIFY_CONTENT = StateKeys.flag(12);
  static readonly INSET = StateKeys.flag(13);
  static readonly MARGIN = StateKeys.flag(14);
  static readonly PADDING = StateKeys.flag(15);
  static readonly BORDER = StateKeys.flag(16);
  static readonly FLEX_GROW = StateKeys.flag(17);
  static readonly FLEX_SHRINK = StateKeys.flag(18);
  static readonly FLEX_BASIS = StateKeys.flag(19);
  static readonly SIZE = StateKeys.flag(20);
  static readonly MIN_SIZE = StateKeys.flag(21);
  static readonly MAX_SIZE = StateKeys.flag(22);
  static readonly GAP = StateKeys.flag(23);
  static readonly ASPECT_RATIO = StateKeys.flag(24);
  static readonly GRID_AUTO_FLOW = StateKeys.flag(25);
  static readonly GRID_COLUMN = StateKeys.flag(26);
  static readonly GRID_ROW = StateKeys.flag(27);
  static readonly SCROLLBAR_WIDTH = StateKeys.flag(28);
  static readonly ALIGN = StateKeys.flag(29);
  static readonly BOX_SIZING = StateKeys.flag(30);
  static readonly OVERFLOW = StateKeys.flag(31);
  static readonly ITEM_IS_TABLE = StateKeys.flag(32);
  static readonly ITEM_IS_REPLACED = StateKeys.flag(33);
  static readonly DISPLAY_MODE = StateKeys.flag(34);
  static readonly FORCE_INLINE = StateKeys.flag(35);
  static readonly MIN_CONTENT_WIDTH = StateKeys.flag(36);
  static readonly MIN_CONTENT_HEIGHT = StateKeys.flag(37);
  static readonly MAX_CONTENT_WIDTH = StateKeys.flag(38);
  static readonly MAX_CONTENT_HEIGHT = StateKeys.flag(39);
  static readonly BORDER_STYLE = StateKeys.flag(40);
  static readonly BORDER_RADIUS = StateKeys.flag(41);
  static readonly BORDER_COLOR = StateKeys.flag(42);
  static readonly FLOAT = StateKeys.flag(43);
  static readonly CLEAR = StateKeys.flag(44);
  static readonly OBJECT_FIT = StateKeys.flag(45);
  static readonly Z_INDEX = StateKeys.flag(46);
  static readonly LIST_STYLE_POSITION = StateKeys.flag(47);
  static readonly LIST_STYLE_TYPE = StateKeys.flag(48);
  static readonly INVALIDATE_TEXT = StateKeys.flag(49);
  static readonly FONT_COLOR = StateKeys.flag(50);
  static readonly DECORATION_LINE = StateKeys.flag(51);
  static readonly DECORATION_COLOR = StateKeys.flag(52);
  static readonly TEXT_ALIGN = StateKeys.flag(53);
  static readonly TEXT_JUSTIFY = StateKeys.flag(54);
  static readonly BACKGROUND_COLOR = StateKeys.flag(55);
  static readonly FONT_SIZE = StateKeys.flag(56);
  static readonly TEXT_TRANSFORM = StateKeys.flag(57);
  static readonly FONT_STYLE = StateKeys.flag(58);
  static readonly FONT_STYLE_SLANT = StateKeys.flag(59);
  static readonly TEXT_WRAP = StateKeys.flag(60);
  static readonly TEXT_OVERFLOW = StateKeys.flag(61);
  static readonly DECORATION_STYLE = StateKeys.flag(62);
  static readonly WHITE_SPACE = StateKeys.flag(63);
  static readonly FONT_WEIGHT = StateKeys.flag(64);
  static readonly LINE_HEIGHT = StateKeys.flag(65);
  static readonly VERTICAL_ALIGN = StateKeys.flag(66);
  static readonly DECORATION_THICKNESS = StateKeys.flag(67);
  static readonly TEXT_SHADOWS = StateKeys.flag(68);
  static readonly FONT_FAMILY = StateKeys.flag(69);
  static readonly LETTER_SPACING = StateKeys.flag(70);
  static readonly FONT_VARIANT_NUMERIC = StateKeys.flag(71);
  static readonly OBJECT_POSITION = StateKeys.flag(72);
  static readonly WRITING_MODE = StateKeys.flag(73);
  static readonly UNICODE_BIDI = StateKeys.flag(74);
  static readonly HYPHENS = StateKeys.flag(75);
  static readonly CARET_COLOR = StateKeys.flag(76);
  static readonly WORD_SPACING = StateKeys.flag(77);
  static readonly FONT_STRETCH = StateKeys.flag(78);

  // compatibility: return low bits when code expects single 64-bit value
  get bitsLow(): bigint {
    return this.bits;
  }

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

const splitBigIntToInt64Parts = (value: bigint): [string, string] => {
  const MASK64 = (1n << 64n) - 1n;
  const LOW = value & MASK64;
  let HIGH = value >> 64n;

  // Ensure HIGH fits into signed 64-bit range
  const SIGN_BIT = 1n << 63n;
  if ((HIGH & SIGN_BIT) !== 0n) {
    // convert to signed representation
    HIGH = HIGH - (1n << 64n);
  }

  let lowSigned = LOW;
  if ((LOW & SIGN_BIT) !== 0n) {
    lowSigned = LOW - (1n << 64n);
  }

  return [lowSigned.toString(), HIGH.toString()];
};

// Android-only fast path for syncStyle(): splits the 128-bit dirty mask into
// four signed 32-bit words instead of two 64-bit decimal strings. Plain JS
// `number` <-> Java `int` marshalling is a completely standard, unambiguous
// {N} bridge path; encoding as decimal strings instead forced the receiving
// side (Element.syncStyle(String,String)) through Long.parseUnsignedLong with
// a BigInteger fallback on every single style write. Recombined bit-exactly
// on the Kotlin side via (high32 << 32) | (low32 & 0xffffffff) - see
// Element.syncStyleParts.
const splitBigIntToInt32Parts = (value: bigint): [number, number, number, number] => {
  const MASK64 = (1n << 64n) - 1n;
  const MASK32 = 0xffffffffn;
  const LOW = value & MASK64;
  const HIGH = (value >> 64n) & MASK64;

  const lowLow32 = Number(BigInt.asIntN(32, LOW & MASK32));
  const lowHigh32 = Number(BigInt.asIntN(32, (LOW >> 32n) & MASK32));
  const highLow32 = Number(BigInt.asIntN(32, HIGH & MASK32));
  const highHigh32 = Number(BigInt.asIntN(32, (HIGH >> 32n) & MASK32));

  return [lowLow32, lowHigh32, highLow32, highHigh32];
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

// Split a comma-separated list at top level only (commas inside parentheses, e.g. rgba(0,0,0,.5),
// are kept with their token).
function splitTopLevelCommas(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim().length) out.push(cur);
  return out;
}

// Map a CSS gradient direction token to a CSS angle in degrees (0deg = to top, 90deg = to right).
function parseGradientAngle(token: string): number {
  const t = token.trim().toLowerCase();
  const deg = /^(-?[\d.]+)deg$/.exec(t);
  if (deg) return parseFloat(deg[1]);
  if (/^(-?[\d.]+)turn$/.exec(t)) return parseFloat(t) * 360;
  if (/^(-?[\d.]+)rad$/.exec(t)) return (parseFloat(t) * 180) / Math.PI;
  if (t === 'to top') return 0;
  if (t === 'to right') return 90;
  if (t === 'to bottom') return 180;
  if (t === 'to left') return 270;
  if (t === 'to top right' || t === 'to right top') return 45;
  if (t === 'to bottom right' || t === 'to right bottom') return 135;
  if (t === 'to bottom left' || t === 'to left bottom') return 225;
  if (t === 'to top left' || t === 'to left top') return 315;
  return 180; // CSS default is 'to bottom'
}

// Parse `linear-gradient(<dir>?, <color> <stop>?, ...)` into a CSS angle + per-stop argb + offsets.
function parseLinearGradientCss(value: string): { angle: number; offsets: number[]; colors: number[] } | null {
  const m = /linear-gradient\s*\(([\s\S]*)\)\s*$/i.exec(value.trim());
  if (!m) return null;
  const parts = splitTopLevelCommas(m[1])
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  let angle = 180;
  let start = 0;
  if (/^(to\s|-?[\d.]+(deg|rad|turn))/i.test(parts[0])) {
    angle = parseGradientAngle(parts[0]);
    start = 1;
  }
  const colors: number[] = [];
  const offsets: number[] = [];
  const stops = parts.slice(start);
  for (let i = 0; i < stops.length; i++) {
    // A stop is `<color> [<percentage>]`; the color is everything up to a trailing % offset.
    const stop = stops[i];
    const pct = /\s+(-?[\d.]+)%\s*$/.exec(stop);
    const colorStr = pct ? stop.slice(0, pct.index).trim() : stop;
    const argb = normalizeColorValue(colorStr);
    if (argb == null) continue;
    colors.push(argb >>> 0);
    offsets.push(pct ? parseFloat(pct[1]) / 100 : -1);
  }
  if (colors.length < 1) return null;
  // Fill any unspecified offsets evenly across [0,1].
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] < 0) offsets[i] = offsets.length > 1 ? i / (offsets.length - 1) : 0;
  }
  return { angle, offsets, colors };
}

// Parse one side of a padding/margin shorthand into a Length the buffer setters accept.
function parseSideLength(tok: string | number): any {
  if (typeof tok === 'number') return tok;
  const t = String(tok).trim();
  if (t === 'auto') return 'auto';
  const m = /^(-?[\d.]+)(px|%)?$/.exec(t);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (m[2] === 'px') return { value: n, unit: 'px' };
  if (m[2] === '%') return { value: n, unit: '%' };
  return n; // bare number = dip
}

// Expand a CSS padding/margin shorthand (number or 1-4 space-separated values) to per-side lengths.
function parseSidesShorthand(value: string | number): { top: any; right: any; bottom: any; left: any } {
  if (typeof value === 'number') return { top: value, right: value, bottom: value, left: value };
  const parts = String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(parseSideLength);
  switch (parts.length) {
    case 1:
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    case 2:
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3:
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4:
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    default:
      return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

// Parse a CSS `border-radius` shorthand into per-corner px radii. Handles 1-4 space-separated
// values (CSS order: top-left, top-right, bottom-right, bottom-left) and ignores the optional
// `/ <vertical>` part (we treat radii as circular). `parseFloat` strips the `px` unit.
function parseBorderRadiusShorthand(value: string): { tl: number; tr: number; br: number; bl: number } {
  const horizontal = String(value ?? '')
    .split('/')[0]
    .trim();
  const vals = horizontal.length ? horizontal.split(/\s+/).map((v) => parseFloat(v) || 0) : [0];
  switch (vals.length) {
    case 1:
      return { tl: vals[0], tr: vals[0], br: vals[0], bl: vals[0] };
    case 2:
      return { tl: vals[0], tr: vals[1], br: vals[0], bl: vals[1] };
    case 3:
      return { tl: vals[0], tr: vals[1], br: vals[2], bl: vals[1] };
    default:
      return { tl: vals[0], tr: vals[1], br: vals[2], bl: vals[3] };
  }
}

// Split on top-level whitespace, keeping parenthesised groups (e.g. `rgba(0,0,0,.5)`) intact.
function splitTopLevelSpaces(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(ch)) {
      if (cur.length) {
        out.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

// Parse a `border` / `border-<side>` shorthand (`<width> <style> <color>`, any order) into px width,
// border-style enum and argb color; each is null when absent.
function parseBorderShorthand(value: string): { width: number | null; style: number | null; color: number | null } {
  let width: number | null = null;
  let style: number | null = null;
  let color: number | null = null;
  for (const tok of splitTopLevelSpaces(String(value ?? '').trim())) {
    const s = borderStyleToEnum(tok);
    if (s !== -1) {
      style = s;
      continue;
    }
    const lower = tok.toLowerCase();
    if (lower === 'thin') {
      width = 1;
      continue;
    }
    if (lower === 'medium') {
      width = 3;
      continue;
    }
    if (lower === 'thick') {
      width = 5;
      continue;
    }
    if (/^-?\d*\.?\d+(px|dip|dp|rem|em|pt)?$/i.test(tok)) {
      const n = parseFloat(tok);
      if (!isNaN(n)) {
        width = n;
        continue;
      }
    }
    const c = normalizeColorValue(tok);
    if (c != null) color = c;
  }
  return { width, style, color };
}

// Parse a 1-4 token `border-color` shorthand into per-side argb (CSS order top/right/bottom/left).
function parseSidesColorShorthand(value: string): { t: number | null; r: number | null; b: number | null; l: number | null } {
  const cols = splitTopLevelSpaces(String(value ?? '').trim()).map((t) => normalizeColorValue(t));
  switch (cols.length) {
    case 0:
      return { t: null, r: null, b: null, l: null };
    case 1:
      return { t: cols[0], r: cols[0], b: cols[0], l: cols[0] };
    case 2:
      return { t: cols[0], r: cols[1], b: cols[0], l: cols[1] };
    case 3:
      return { t: cols[0], r: cols[1], b: cols[2], l: cols[1] };
    default:
      return { t: cols[0], r: cols[1], b: cols[2], l: cols[3] };
  }
}

const i8Buffer = new Int8Array(4);

const f32Buffer = new Uint8Array(Float32Array.BYTES_PER_ELEMENT * 4);
const f32View = new Float32Array(f32Buffer.buffer);

const i32Buffer = new Uint8Array(Int32Array.BYTES_PER_ELEMENT * 4);
const i32View = new Int32Array(i32Buffer.buffer);

function normalizeColorValue(value: number | string | { argb?: number }): number | null {
  switch (typeof value) {
    case 'number':
      return value;
    case 'string':
      try {
        return new Color(value).argb;
      } catch (_) {
        return null;
      }
    case 'object':
      if (value instanceof Color) {
        return value.argb;
      }
      if (value && typeof value.argb === 'number') {
        return value.argb;
      }
      return null;
    default:
      return null;
  }
}

const BORDER_STYLE_VALUES = ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'] as const;

function borderStyleToEnum(value: string): number {
  const idx = BORDER_STYLE_VALUES.indexOf(value as any);
  return idx === -1 ? -1 : idx;
}

function borderStyleFromEnum(value: number): string {
  return BORDER_STYLE_VALUES[value] ?? 'none';
}

function parseObjectPosition(value: string): { xType: number; xVal: number; yType: number; yVal: number } | null {
  const keywords: Record<string, { type: number; val: number }> = {
    left: { type: 1, val: 0 },
    center: { type: 1, val: 50 },
    right: { type: 1, val: 100 },
    top: { type: 1, val: 0 },
    bottom: { type: 1, val: 100 },
  };

  const parts = value.trim().split(/\s+/);
  if (parts.length === 0) return null;

  function parseComponent(s: string): { type: number; val: number } | null {
    const kw = keywords[s];
    if (kw) return kw;
    if (s.endsWith('%')) return { type: 1, val: parseFloat(s) };
    return { type: 0, val: parseFloat(s) };
  }

  if (parts.length === 1) {
    const c = parseComponent(parts[0]);
    if (!c) return null;
    return { xType: c.type, xVal: c.val, yType: 1, yVal: 50 };
  }

  const x = parseComponent(parts[0]);
  const y = parseComponent(parts[1]);
  if (!x || !y) return null;
  return { xType: x.type, xVal: x.val, yType: y.type, yVal: y.val };
}

const FONT_STRETCH_KEYWORDS: Record<string, number> = {
  'ultra-condensed': 5000,
  'extra-condensed': 6250,
  condensed: 7500,
  'semi-condensed': 8750,
  normal: 10000,
  'semi-expanded': 11250,
  expanded: 12500,
  'extra-expanded': 15000,
  'ultra-expanded': 20000,
};

function fontStretchToValue(value: string): number {
  const trimmed = value.trim();
  const kw = FONT_STRETCH_KEYWORDS[trimmed];
  if (kw !== undefined) return kw;
  if (trimmed.endsWith('%')) {
    const pct = parseFloat(trimmed);
    if (isNaN(pct) || pct < 0) return -1;
    return Math.round(pct * 100);
  }
  return -1;
}

function fontStretchFromValue(v: number): string {
  for (const [kw, val] of Object.entries(FONT_STRETCH_KEYWORDS)) {
    if (val === v) return kw;
  }
  return `${v / 100}%`;
}

export class Style {
  private view_: View;
  private style_view: DataView;
  private i8View: Int8Array;
  private u8View: Uint8Array;
  private isDirty = -1n;
  private inBatch = false;
  private _syncScheduled = false;
  private nativeView: any;
  private nativeNode: any;
  private _pseudo: number;
  static fromView(view: View, nativeView): Style {
    //console.time('fromView');
    const ret = new Style();
    ret.view_ = view;
    ret.nativeView = nativeView;
    if (__ANDROID__) {
      let style = (nativeView as org.nativescript.mason.masonkit.Element)?.getStyle?.();
      if (!style) {
        // if a non mason view is passed
        style = org.nativescript.mason.masonkit.Mason.getShared().styleForViewOrNode(nativeView);
      }
      const styleBuffer = style.getValues();
      const buffer = (<any>ArrayBuffer).from(styleBuffer);
      ret.style_view = new DataView(buffer);
      ret.i8View = new Int8Array(buffer);
      ret.u8View = new Uint8Array(buffer);
    } else if (__APPLE__) {
      let style: MasonStyle = nativeView?.style as never;
      if (!style) {
        style = NSCMason.shared.styleForViewOrNode(nativeView) as never;
      }
      const styleBuffer = style.values;

      const buffer = interop.bufferFromData(styleBuffer);
      ret.style_view = new DataView(buffer);
      ret.i8View = new Int8Array(buffer);
      ret.u8View = new Uint8Array(buffer);
    } else if (__WINDOWS__) {
      let style: NativeScript.Mason.Style = (nativeView as NativeScript.Mason.IMasonElement)?.Style as never;
      if (!style) {
        style = NativeScript.Mason.Mason.Instance().CreateNode(false).Style as never;
      }
      // Live IBuffer over the engine's arena style memory; the @nativescript/windows runtime
      // projects it as a writable ArrayBuffer, so the same StyleKeys-offset writes used on
      // iOS/Android land straight in the node's style.
      //@ts-ignore
      const buffer = NSWinRT.interop.arrayBufferFromBuffer(style.Values) as ArrayBuffer;
      ret.style_view = new DataView(buffer);
      ret.i8View = new Int8Array(buffer);
      ret.u8View = new Uint8Array(buffer);
    }
    //console.timeEnd('fromView');

    return ret;
  }
  static fromPseudo(pseudo: string, view: View, nativeView) {
    var mask = -1;
    switch (pseudo) {
      case 'normal':
        return Style.fromView(view, nativeView);
      case 'hover':
        mask = 1;
        break;
      case 'focus':
        mask = 4;
        break;
      case 'highlighted':
      case 'pressed':
      case 'active':
        mask = 2;
        break;
      case 'disabled':
        mask = 64;
        break;
      default:
        break;
    }
    if (mask === -1) {
      return null;
    }
    const ret = new Style();
    ret._pseudo = mask;
    ret.view_ = view;

    if (__ANDROID__) {
      let node = (nativeView as org.nativescript.mason.masonkit.Element)?.getNode?.();
      if (!node) {
        // if a non mason view is passed
        node = org.nativescript.mason.masonkit.Mason.getShared().nodeForView(nativeView);
      }

      ret.nativeNode = node;
      const pseudoBuffer = node.preparePseudoBuffer(mask);

      const buffer = (<any>ArrayBuffer).from(pseudoBuffer);
      ret.style_view = new DataView(buffer);
      ret.i8View = new Int8Array(buffer);
      ret.u8View = new Uint8Array(buffer);
      ret.clearPseudoSetMask();
    } else if (__APPLE__) {
      let node: MasonNode = nativeView?.node as never;
      if (!node) {
        node = NSCMason.shared.nodeForView(nativeView, false) as never;
      }

      ret.nativeNode = node;

      //@ts-ignore
      const pseudoBuffer = node.preparePseudoBuffer(mask);

      const buffer = interop.bufferFromData(pseudoBuffer);
      ret.style_view = new DataView(buffer);
      ret.i8View = new Int8Array(buffer);
      ret.u8View = new Uint8Array(buffer);
      ret.clearPseudoSetMask();
    }

    return ret;
  }

  private clearPseudoSetMask() {
    const LOW_OFFSET = StyleKeys.PSEUDO_SET_MASK_LOW;
    const HIGH_OFFSET = StyleKeys.PSEUDO_SET_MASK_HIGH;

    if (this.style_view.byteLength < HIGH_OFFSET + 8) {
      return;
    }

    this.style_view.setBigUint64(LOW_OFFSET, 0n, true);
    this.style_view.setBigUint64(HIGH_OFFSET, 0n, true);
  }

  markPseudoSet(key: StateKeys) {
    const LOW_OFFSET = StyleKeys.PSEUDO_SET_MASK_LOW;
    const HIGH_OFFSET = StyleKeys.PSEUDO_SET_MASK_HIGH;

    if (this.style_view.byteLength < HIGH_OFFSET + 8) return;

    const low = this.style_view.getBigUint64(LOW_OFFSET, true);
    const high = this.style_view.getBigUint64(HIGH_OFFSET, true);

    const MASK64 = (1n << 64n) - 1n;
    const keyLow = key.bits & MASK64;
    const keyHigh = (key.bits >> 64n) & MASK64;

    this.style_view.setBigUint64(LOW_OFFSET, low | keyLow, true);
    this.style_view.setBigUint64(HIGH_OFFSET, high | keyHigh, true);
  }

  private commitState(value: StateKeys) {
    if (this._pseudo) {
      this.markPseudoSet(value);
    } else {
      this.setOrAppendState(value);
    }
  }

  private setPseudoCssStringValue(name: string, value: string, applyAndroid: () => void, applyApple: () => void) {
    if (!this.nativeView) {
      return;
    }

    if (__ANDROID__) {
      if (this._pseudo) {
        this.nativeNode.setPseudoString(this._pseudo, name, value);
      } else {
        applyAndroid();
      }
    }

    if (__APPLE__) {
      if (this._pseudo) {
        (this.nativeNode as MasonNode).setPseudoString(this._pseudo, name, value);
      } else {
        applyApple();
      }
    }

    if (__WINDOWS__) {
      // Android/Apple parse these CSS-string props in native setters; on Windows we write the
      // buffer-backed ones (border-radius) directly to the live style buffer so VisualApply renders
      // them. Border stroke / box-shadow / gradients still need the Css decoration overlay (TODO).
      this.applyWindowsCssString(name, value);
    }
  }

  // Apply a CSS-string property on Windows. Buffer-backed props (border-radius) are written to the
  // live style buffer for VisualApply; gradients use the native Css helper to paint the Panel
  // background directly.
  private applyWindowsCssString(name: string, value: string) {
    // `background` shorthand: gradient -> native Css gradient brush; solid color -> BACKGROUND_COLOR
    // buffer (VisualApply paints it). Switching between them must override the other, so a gradient
    // clears the solid bg first, and a solid write lets VisualApply repaint over a prior gradient brush.
    if (name === 'background' || name === 'background-image') {
      const v = typeof value === 'string' ? value : String(value ?? '');
      if (/linear-gradient/i.test(v)) {
        const g = parseLinearGradientCss(v);
        if (g && g.colors.length) {
          if (this.style_view) {
            this.prepareMut();
            setUint32(this.style_view, StyleKeys.BACKGROUND_COLOR, 0);
            this.commitState(StateKeys.BACKGROUND_COLOR);
          }
          try {
            // Pass stops as an "offset:argb,..." string — WinRT array_view params don't marshal
            // reliably from the NS-Windows JS runtime (plain arrays -> E_FAIL, typed arrays -> crash).
            const stops = g.offsets.map((o, i) => o + ':' + (g.colors[i] >>> 0)).join(',');
            NativeScript.Mason.Css.ApplyLinearGradient(this.nativeView, g.angle, stops);
          } catch (_) {}
        }
      } else if (v.trim().length && !/gradient/i.test(v)) {
        // Solid color background; reuse the backgroundColor buffer setter -> VisualApply repaints,
        // overriding any gradient brush set previously.
        this.backgroundColor = v as never;
      }
      return;
    }

    // padding / margin SHORTHANDS route here (paddingProperty/marginProperty -> paddingCss/marginCss).
    // Expand to the per-side buffer setters, which Mason already applies in layout.
    if (name === 'padding' || name === 'margin') {
      const s = parseSidesShorthand(value as never);
      if (name === 'padding') {
        this.paddingTop = s.top;
        this.paddingRight = s.right;
        this.paddingBottom = s.bottom;
        this.paddingLeft = s.left;
      } else {
        this.marginTop = s.top;
        this.marginRight = s.right;
        this.marginBottom = s.bottom;
        this.marginLeft = s.left;
      }
      return;
    }

    if (!this.style_view) {
      return;
    }
    if (name === 'border-radius') {
      const r = parseBorderRadiusShorthand(value);
      this.prepareMut();
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE, r.tl);
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE, r.tl);
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE, r.tr);
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE, r.tr);
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE, r.br);
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE, r.br);
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE, r.bl);
      setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE, r.bl);
      // Type bytes: 0 = length (px).
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, 0);
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, 0);
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, 0);
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, 0);
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, 0);
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, 0);
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, 0);
      setUint8(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, 0);
      this.commitState(StateKeys.BORDER_RADIUS);
      return;
    }

    if (name === 'border' || name === 'border-top' || name === 'border-right' || name === 'border-bottom' || name === 'border-left') {
      const p = parseBorderShorthand(value);
      let style = p.style;
      if (style == null && (p.width != null || p.color != null)) style = 4; // solid
      const sides: ('left' | 'right' | 'top' | 'bottom')[] = name === 'border' ? ['left', 'right', 'top', 'bottom'] : name === 'border-left' ? ['left'] : name === 'border-right' ? ['right'] : name === 'border-top' ? ['top'] : ['bottom'];
      for (const s of sides) this.writeBorderSide(s, p.width, style, p.color);
      this.commitState(StateKeys.BORDER);
      this.commitState(StateKeys.BORDER_STYLE);
      this.commitState(StateKeys.BORDER_COLOR);
      return;
    }

    if (name === 'border-color') {
      const c = parseSidesColorShorthand(value);
      this.writeBorderSide('top', null, null, c.t);
      this.writeBorderSide('right', null, null, c.r);
      this.writeBorderSide('bottom', null, null, c.b);
      this.writeBorderSide('left', null, null, c.l);
      this.commitState(StateKeys.BORDER_COLOR);
      return;
    }
  }

  // Write one side's border width/style/color into the style buffer; null components are skipped.
  private writeBorderSide(side: 'left' | 'right' | 'top' | 'bottom', width: number | null, style: number | null, color: number | null) {
    if (!this.style_view) return;
    const W = side === 'left' ? StyleKeys.BORDER_LEFT_VALUE : side === 'right' ? StyleKeys.BORDER_RIGHT_VALUE : side === 'top' ? StyleKeys.BORDER_TOP_VALUE : StyleKeys.BORDER_BOTTOM_VALUE;
    const T = side === 'left' ? StyleKeys.BORDER_LEFT_TYPE : side === 'right' ? StyleKeys.BORDER_RIGHT_TYPE : side === 'top' ? StyleKeys.BORDER_TOP_TYPE : StyleKeys.BORDER_BOTTOM_TYPE;
    const S = side === 'left' ? StyleKeys.BORDER_LEFT_STYLE : side === 'right' ? StyleKeys.BORDER_RIGHT_STYLE : side === 'top' ? StyleKeys.BORDER_TOP_STYLE : StyleKeys.BORDER_BOTTOM_STYLE;
    const C = side === 'left' ? StyleKeys.BORDER_LEFT_COLOR : side === 'right' ? StyleKeys.BORDER_RIGHT_COLOR : side === 'top' ? StyleKeys.BORDER_TOP_COLOR : StyleKeys.BORDER_BOTTOM_COLOR;
    this.prepareMut();
    if (width != null) {
      setInt8(this.style_view, T, 0);
      setFloat32(this.style_view, W, width);
    }
    if (style != null) setInt8(this.style_view, S, style);
    if (color != null) setUint32(this.style_view, C, color >>> 0);
  }

  setBorderColor(value: string) {
    if (!__WINDOWS__ || !this.style_view) return;
    const c = parseSidesColorShorthand(String(value ?? ''));
    this.writeBorderSide('top', null, null, c.t);
    this.writeBorderSide('right', null, null, c.r);
    this.writeBorderSide('bottom', null, null, c.b);
    this.writeBorderSide('left', null, null, c.l);
    this.commitState(StateKeys.BORDER_COLOR);
  }

  resetState() {
    this.isDirty = -1n;
  }

  private syncStyle() {
    if (__ANDROID__) {
      const [lowLow, lowHigh, highLow, highHigh] = splitBigIntToInt32Parts(this.isDirty);
      //@ts-ignore
      const view = this.view?.android ?? (this.view._view as never as org.nativescript.mason.masonkit.Element);
      // @ts-ignore - syncStyleParts is a newer native method; typings regenerate from the AAR separately.
      view.syncStyleParts(lowLow, lowHigh, highLow, highHigh);
    } else if (__APPLE__) {
      const [low, high] = splitBigIntToInt64Parts(this.isDirty);
      //@ts-ignore
      const view = this.view?.ios ?? (this.view._view as never as MasonText);
      // @ts-ignore
      view.mason_syncStyle(low, high);
    } else if (__WINDOWS__) {
      const [low, high] = splitBigIntToInt64Parts(this.isDirty);
      // @ts-ignore
      const view = (this.view as any)?.windows ?? this.view._view;
      (view as NativeScript.Mason.IMasonElement).SyncStyle(low, high);
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
      // Coalesce rapid-fire property changes (e.g. CSS batch apply) into a
      // single syncStyle() call on the next microtask. This avoids N
      // separate JNI/FFI round-trips when N properties change in the same
      // JS turn.
      if (!this._syncScheduled) {
        this._syncScheduled = true;
        queueMicrotask(() => {
          this._syncScheduled = false;
          if (this.isDirty !== -1n) {
            this.syncStyle();
          }
        });
      }
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

  private prepareMut() {
    // always mut
    if (this._pseudo) {
      return;
    }
    const ref = getUint32(this.style_view, StyleKeys.REF_COUNT);
    if (ref !== 1) {
      if (__APPLE__) {
        let style: MasonStyle = this.nativeView?.style as never;
        if (!style) {
          style = NSCMason.shared.styleForViewOrNode(this.nativeView) as never;
        }

        style.prepareMut();

        const styleBuffer = style.values;

        const buffer = interop.bufferFromData(styleBuffer);
        this.style_view = new DataView(buffer);
        this.i8View = new Int8Array(buffer);
        this.u8View = new Uint8Array(buffer);
      }

      if (__ANDROID__) {
        let style = (this.nativeView as org.nativescript.mason.masonkit.Element)?.getStyle?.();
        if (!style) {
          // if a non mason view is passed
          style = org.nativescript.mason.masonkit.Mason.getShared().styleForViewOrNode(this.nativeView);
        }
        style.prepareMut();
        const styleBuffer = style.getValues();
        const buffer = (<any>ArrayBuffer).from(styleBuffer);
        this.style_view = new DataView(buffer);
        this.i8View = new Int8Array(buffer);
        this.u8View = new Uint8Array(buffer);
      }

      if (__WINDOWS__) {
        let style: NativeScript.Mason.Style = (this.nativeView as NativeScript.Mason.IMasonElement)?.Style as never;
        if (!style) {
          style = NativeScript.Mason.Mason.Instance().CreateNode(false).Style as never;
        }
        style.PrepareForMutation();
        const buffer = style.Values as never as ArrayBuffer;
        this.style_view = new DataView(buffer);
        this.i8View = new Int8Array(buffer);
        this.u8View = new Uint8Array(buffer);
      }
    }
  }

  get boxSizing(): 'border-box' | 'content-box' {
    switch (getUint8(this.style_view, StyleKeys.BOX_SIZING)) {
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
      this.prepareMut();
      setUint8(this.style_view, StyleKeys.BOX_SIZING, boxSizing);
      this.commitState(StateKeys.BOX_SIZING);
    }
  }

  get fontSize() {
    if (!this.style_view) {
      // BLACK ?
      return 16;
    }

    const type = getUint8(this.style_view, StyleKeys.FONT_SIZE_TYPE);
    const value = getInt32(this.style_view, StyleKeys.FONT_SIZE);
    if (type === 1) {
      return `${value / 100}%` as never;
    }

    return value;
  }

  set fontSize(value: number | { value: number; unit: 'dip' | 'px' | '%' }) {
    if (!this.style_view) {
      return;
    }

    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt32(this.style_view, StyleKeys.FONT_SIZE, value);
        setInt8(this.style_view, StyleKeys.FONT_SIZE_STATE, 1);
        setInt8(this.style_view, StyleKeys.FONT_SIZE_TYPE, 0);
        this.commitState(StateKeys.FONT_SIZE);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt32(this.style_view, StyleKeys.FONT_SIZE, layout.toDeviceIndependentPixels(value.value));
            setInt8(this.style_view, StyleKeys.FONT_SIZE_STATE, 1);
            setInt8(this.style_view, StyleKeys.FONT_SIZE_TYPE, 0);
            this.commitState(StateKeys.FONT_SIZE);
            break;
          case 'px':
            this.prepareMut();
            setInt32(this.style_view, StyleKeys.FONT_SIZE, value.value);
            setInt8(this.style_view, StyleKeys.FONT_SIZE_STATE, 1);
            setInt8(this.style_view, StyleKeys.FONT_SIZE_TYPE, 0);
            this.commitState(StateKeys.FONT_SIZE);
            break;
          case '%':
            this.prepareMut();
            setInt32(this.style_view, StyleKeys.FONT_SIZE, value.value * 100);
            setInt8(this.style_view, StyleKeys.FONT_SIZE_STATE, 1);
            setInt8(this.style_view, StyleKeys.FONT_SIZE_TYPE, 1);
            this.commitState(StateKeys.FONT_SIZE);
            break;
        }
        break;
    }
  }

  get fontStyle() {
    if (!this.style_view) {
      // normal ?
      return 'normal';
    }
    switch (getInt32(this.style_view, StyleKeys.FONT_STYLE_TYPE)) {
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
    if (!this.style_view) {
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
      this.prepareMut();
      setInt32(this.style_view, StyleKeys.FONT_STYLE_TYPE, style);
      setInt8(this.style_view, StyleKeys.FONT_STYLE_STATE, 1);
      this.commitState(StateKeys.FONT_STYLE);
    }
  }

  get fontWeight() {
    if (!this.style_view) {
      // BLACK ?
      return 400;
    }

    return getInt32(this.style_view, StyleKeys.FONT_WEIGHT);
  }

  set fontWeight(value: '100' | '200' | '300' | 'normal' | '400' | '500' | '600' | 'bold' | '700' | '800' | '900' | number) {
    if (!this.style_view) {
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
      this.prepareMut();
      setInt32(this.style_view, StyleKeys.FONT_WEIGHT, weight);
      setInt8(this.style_view, StyleKeys.FONT_WEIGHT_STATE, 1);
      this.commitState(StateKeys.FONT_WEIGHT);
    }
  }

  get color() {
    if (!this.style_view) {
      // BLACK ?
      return 0;
    }

    return getUint32(this.style_view, StyleKeys.FONT_COLOR);
  }

  set color(value: number | string | { argb?: number }) {
    if (!this.style_view) {
      return;
    }
    const normalized = normalizeColorValue(value);
    if (normalized == null) {
      return;
    }
    this.prepareMut();
    setUint32(this.style_view, StyleKeys.FONT_COLOR, normalized);
    setInt8(this.style_view, StyleKeys.FONT_COLOR_STATE, 1);

    this.commitState(StateKeys.FONT_COLOR);
  }

  set 'background-color'(value: number | string | { argb?: number }) {
    this.backgroundColor = value;
  }

  get 'background-color'() {
    return this.backgroundColor;
  }

  get backgroundColor() {
    if (!this.style_view) {
      // BLACK ?
      return 0;
    }
    return getUint32(this.style_view, StyleKeys.BACKGROUND_COLOR);
  }

  set backgroundColor(value: number | string | { argb?: number }) {
    if (!this.style_view) {
      return;
    }
    const normalized = normalizeColorValue(value);
    if (normalized == null) {
      return;
    }
    this.prepareMut();
    setUint32(this.style_view, StyleKeys.BACKGROUND_COLOR, normalized);
    setInt8(this.style_view, StyleKeys.BACKGROUND_COLOR_STATE, 1);
    setInt8(this.style_view, StyleKeys.BACKGROUND_COLOR_TYPE, 0);
    this.commitState(StateKeys.BACKGROUND_COLOR);
  }

  get textWrap() {
    if (!this.style_view) {
      // BLACK ?
      return 0;
    }
    return getInt32(this.style_view, StyleKeys.TEXT_WRAP);
  }

  set textWrap(value: number | 'nowrap' | 'wrap' | 'balance') {
    if (!this.style_view) {
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
      this.prepareMut();
      setInt32(this.style_view, StyleKeys.TEXT_WRAP, wrap);
      setInt8(this.style_view, StyleKeys.TEXT_WRAP_STATE, 1);
      this.commitState(StateKeys.TEXT_WRAP);
    }
  }

  get styleView(): DataView {
    return this.style_view;
  }

  get display() {
    const mode = getInt8(this.style_view, StyleKeys.DISPLAY_MODE);
    if (mode === DisplayMode.Inline) {
      return 'inline';
    }

    switch (getInt8(this.style_view, StyleKeys.DISPLAY)) {
      case 0:
        return 'none';
      case 1:
        if (mode === DisplayMode.Box) {
          return 'inline-flex';
        }
        return 'flex';
      case 2:
        if (mode === DisplayMode.Box) {
          return 'inline-grid';
        }
        return 'grid';
      case 3:
        if (mode === DisplayMode.Box) {
          return 'inline-block';
        }
        return 'block';
      default:
        return 'none';
    }
  }

  set display(value: 'none' | 'flex' | 'grid' | 'block' | 'inline' | 'inline-block' | 'inline-flex' | 'inline-grid') {
    let display = -1;
    let displayMode = 0;
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
        // inline
        display = 1;
        displayMode = 1;
        break;
      case 'inline-block':
        // inline-block
        display = 3;
        displayMode = 2;
        break;
      case 'inline-flex':
        display = 1;
        displayMode = 2;
        break;
      case 'inline-grid':
        display = 2;
        displayMode = 2;
        break;
    }
    if (display != -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.DISPLAY, display);
      setInt8(this.style_view, StyleKeys.DISPLAY_MODE, displayMode);
      if (this.isDirty == -1n) {
        this.isDirty = StateKeys.DISPLAY_MODE.bits;
      } else {
        this.isDirty = this.isDirty | StateKeys.DISPLAY_MODE.bits;
      }
      this.commitState(StateKeys.DISPLAY.and(StateKeys.DISPLAY_MODE));
    }
  }

  get position() {
    switch (getInt8(this.style_view, StyleKeys.POSITION)) {
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
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.POSITION, position);
      this.commitState(StateKeys.POSITION);
    }
  }

  get flexDirection() {
    switch (getInt8(this.style_view, StyleKeys.FLEX_DIRECTION)) {
      case 0:
        return 'row';
      case 1:
        return 'column';
      case 2:
        return 'row-reverse';
      case 3:
        return 'column-reverse';
    }
  }

  set flexDirection(value: 'column' | 'row' | 'column-reverse' | 'row-reverse') {
    let flex = -1;
    switch (value) {
      case 'row':
        flex = 0;
        break;
      case 'column':
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
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.FLEX_DIRECTION, flex);
      this.commitState(StateKeys.FLEX_DIRECTION);
    }
  }

  get flexWrap() {
    switch (getInt8(this.style_view, StyleKeys.FLEX_WRAP)) {
      case 0:
        return 'no-wrap';
      case 1:
        return 'wrap';
      case 2:
        return 'wrap-reverse';
      case 3:
        return 'balance';
      case 4:
        return 'balance-reverse';
    }
  }

  set flexWrap(value: 'no-wrap' | 'wrap' | 'wrap-reverse' | 'balance' | 'balance-reverse') {
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
      case 'balance':
        wrap = 3;
        break;
      case 'balance-reverse':
        wrap = 4;
        break;
    }
    if (wrap != -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.FLEX_WRAP, wrap);
      this.commitState(StateKeys.FLEX_WRAP);
    }
  }
  // get flex(): string | 'auto' | 'none' | number | 'initial' {
  //     return this.style[StyleKeys.FLEX];
  // }
  // get flexFlow(): string

  get minWidth() {
    const type = getInt8(this.style_view, StyleKeys.MIN_WIDTH_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set minWidth(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MIN_WIDTH_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, value.value);
            break;
        }
        break;
    }

    this.commitState(StateKeys.MIN_SIZE);
  }

  get minHeight() {
    const type = getInt8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set minHeight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.MIN_SIZE);
  }

  get width() {
    const type = getInt8(this.style_view, StyleKeys.WIDTH_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.WIDTH_VALUE);
    return parseDimension(type, value);
  }
  set width(value: DimensionLength) {
    switch (typeof value) {
      case 'string': {
        this.prepareMut();
        const dim = dimensionFromString(value);
        setInt8(this.style_view, StyleKeys.WIDTH_TYPE, dim.type);
        setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, dim.value);
        break;
      }
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.WIDTH_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.WIDTH_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.SIZE);
  }

  get height() {
    const type = getInt8(this.style_view, StyleKeys.HEIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.HEIGHT_VALUE);
    return parseDimension(type, value);
  }
  set height(value: DimensionLength) {
    switch (typeof value) {
      case 'string': {
        this.prepareMut();
        const dim = dimensionFromString(value);
        setInt8(this.style_view, StyleKeys.HEIGHT_TYPE, dim.type);
        setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, dim.value);
        break;
      }
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.HEIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.HEIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.SIZE);
  }

  get maxWidth() {
    const type = getInt8(this.style_view, StyleKeys.MAX_WIDTH_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set maxWidth(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MAX_WIDTH_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.MAX_SIZE);
  }

  get maxHeight() {
    const type = getInt8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set maxHeight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.MAX_SIZE);
  }

  get borderLeftWidth(): Length {
    const type = getInt8(this.style_view, StyleKeys.BORDER_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderLeftWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.BORDER);
  }

  get borderRightWidth(): Length {
    const type = getInt8(this.style_view, StyleKeys.BORDER_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderRightWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.BORDER);
  }

  get borderTopWidth(): Length {
    const type = getInt8(this.style_view, StyleKeys.BORDER_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderTopWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.BORDER_TOP_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.BORDER);
  }

  get borderBottomWidth(): Length {
    const type = getInt8(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE);
    return parseLengthPercentage(type, value);
  }

  set borderBottomWidth(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.BORDER);
  }

  set inset(value: LengthAuto) {
    var type;
    var insetValue;

    switch (typeof value) {
      case 'string':
        type = 0;
        insetValue = 0;
        break;
      case 'number':
        type = 1;
        insetValue = layout.toDevicePixels(value);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            type = 1;
            insetValue = layout.toDevicePixels(value.value);
            break;
          case 'px':
            type = 1;
            insetValue = value.value;
            break;
          case '%':
            type = 2;
            insetValue = value.value;
            break;
        }
        break;
    }

    if (type !== undefined && insetValue !== undefined) {
      this.prepareMut();
      i8Buffer.fill(type);

      this.u8View.set(i8Buffer, StyleKeys.INSET_LEFT_TYPE);

      f32View.fill(insetValue);

      this.u8View.set(f32Buffer, StyleKeys.INSET_LEFT_VALUE);

      this.commitState(StateKeys.INSET);
    }
  }

  get left(): LengthAuto {
    const type = getInt8(this.style_view, StyleKeys.INSET_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set left(value: LengthAuto) {
    if (value === 'auto') {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.INSET_LEFT_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.INSET_LEFT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_LEFT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.INSET);
  }

  get right(): LengthAuto {
    const type = getInt8(this.style_view, StyleKeys.INSET_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set right(value: LengthAuto) {
    if (value === 'auto') {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_RIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.INSET);
  }

  get top(): LengthAuto {
    const type = getInt8(this.style_view, StyleKeys.INSET_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set top(value: LengthAuto) {
    if (value === 'auto') {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.INSET_TOP_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.INSET_TOP_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_TOP_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.INSET);
  }

  get bottom(): LengthAuto {
    const type = getInt8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set bottom(value: LengthAuto) {
    if (value === 'auto') {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, 0);
      return;
    }
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.INSET);
  }

  set margin(value: LengthAuto) {
    var type;
    var marginValue;

    switch (typeof value) {
      case 'string':
        type = 0;
        marginValue = 0;
        break;
      case 'number':
        type = 1;
        marginValue = layout.toDevicePixels(value);
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            type = 1;
            marginValue = layout.toDevicePixels(value.value);
            break;
          case 'px':
            type = 1;
            marginValue = value.value;
            break;
          case '%':
            type = 2;
            marginValue = value.value;
            break;
        }
        break;
    }

    if (type !== undefined && marginValue !== undefined) {
      this.prepareMut();
      i8Buffer.fill(type);

      this.u8View.set(i8Buffer, StyleKeys.MARGIN_LEFT_TYPE);

      f32View.fill(marginValue);

      this.u8View.set(f32Buffer, StyleKeys.MARGIN_LEFT_VALUE);

      this.commitState(StateKeys.MARGIN);
    }
  }

  get marginLeft() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set marginLeft(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.MARGIN);
  }

  get marginRight() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set marginRight(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.MARGIN);
  }

  get marginTop() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE);
    return parseLengthPercentageAuto(type, value);
  }

  set marginTop(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_TOP_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.MARGIN);
  }

  get marginBottom() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE);
    return parseLengthPercentageAuto(type, value);
  }
  set marginBottom(value: LengthAuto) {
    switch (typeof value) {
      case 'string':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 0);
        break;
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.MARGIN);
  }

  set padding(value: Length) {
    this.inBatch = true;
    this.paddingBottom = this.paddingLeft = this.paddingRight = this.paddingTop = value;
    this.inBatch = false;
    this.commitState(StateKeys.PADDING);
  }

  get paddingLeft() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_LEFT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE);
    return parseLengthPercentage(type, value);
  }

  set paddingLeft(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_LEFT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.PADDING);
  }

  get paddingRight() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE);
    return parseLengthPercentage(type, value);
  }
  set paddingRight(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.PADDING);
  }

  get paddingTop() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_TOP_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE);
    return parseLengthPercentage(type, value);
  }

  set paddingTop(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.PADDING_TOP_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_TOP_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_TOP_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.PADDING);
  }

  get paddingBottom() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE);
    return parseLengthPercentage(type, value);
  }
  set paddingBottom(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.PADDING);
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
    const type = getInt8(this.style_view, StyleKeys.GAP_ROW_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE);
    return parseLengthPercentage(type, value);
  }

  set rowGap(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.GAP_ROW_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.GAP_ROW_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.GAP_ROW_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.GAP_ROW_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, value.value);
            break;
        }
        break;
    }

    this.commitState(StateKeys.GAP);
  }

  get columnGap(): Length {
    const type = getInt8(this.style_view, StyleKeys.GAP_COLUMN_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE);
    return parseLengthPercentage(type, value);
  }

  set columnGap(value: Length) {
    switch (typeof value) {
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 0);
            setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.GAP_COLUMN_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.GAP);
  }

  get aspectRatio(): number {
    return getFloat32(this.style_view, StyleKeys.ASPECT_RATIO);
  }

  set aspectRatio(value: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.ASPECT_RATIO, value);
    this.commitState(StateKeys.ASPECT_RATIO);
  }

  get flexBasis(): DimensionLength {
    const type = getInt8(this.style_view, StyleKeys.FLEX_BASIS_TYPE);
    const value = getFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE);
    return parseDimension(type, value);
  }

  set flexBasis(value: DimensionLength) {
    switch (typeof value) {
      case 'string': {
        this.prepareMut();
        const dim = dimensionFromString(value);
        setInt8(this.style_view, StyleKeys.FLEX_BASIS_TYPE, dim.type);
        setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, dim.value);
        break;
      }
      case 'number':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, layout.toDevicePixels(value));
        break;
      case 'object':
        switch (value.unit) {
          case 'dip':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, layout.toDevicePixels(value.value));
            break;
          case 'px':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 1);
            setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, value.value);
            break;
          case '%':
            this.prepareMut();
            setInt8(this.style_view, StyleKeys.FLEX_BASIS_TYPE, 2);
            setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, value.value);
            break;
        }
        break;
    }
    this.commitState(StateKeys.FLEX_BASIS);
  }
  get alignItems() {
    switch (getInt8(this.style_view, StyleKeys.ALIGN_ITEMS)) {
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
    let align = -1;
    switch (value) {
      case 'normal':
        align = AlignItems.Normal;
        break;
      case 'start':
        align = AlignItems.Start;
        break;
      case 'end':
        align = AlignItems.End;
        break;
      case 'flex-start':
        align = AlignItems.FlexStart;
        break;
      case 'flex-end':
        align = AlignItems.FlexEnd;
        break;
      case 'center':
        align = AlignItems.Center;
        break;
      case 'baseline':
        align = AlignItems.Baseline;
        break;
      case 'stretch':
        align = AlignItems.Stretch;
        break;
    }
    if (align !== -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.ALIGN_ITEMS, align);
      this.commitState(StateKeys.ALIGN_ITEMS);
    }
  }

  get alignSelf() {
    switch (getInt8(this.style_view, StyleKeys.ALIGN_SELF)) {
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
    if (align !== -2) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.ALIGN_SELF, align);
      this.commitState(StateKeys.ALIGN_SELF);
    }
  }

  get alignContent() {
    switch (getInt8(this.style_view, StyleKeys.ALIGN_CONTENT)) {
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
    let align = -1;
    switch (value) {
      case 'normal':
        align = AlignContent.Normal;
        break;
      case 'space-around':
        align = AlignContent.SpaceAround;
        break;
      case 'space-between':
        align = AlignContent.SpaceBetween;
        break;
      case 'space-evenly':
        align = AlignContent.SpaceEvenly;
        break;
      case 'center':
        align = AlignContent.Center;
        break;
      case 'end':
        align = AlignContent.End;
        break;
      case 'start':
        align = AlignContent.Start;
        break;
      case 'stretch':
        align = AlignContent.Stretch;
        break;
    }
    if (align !== -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.ALIGN_CONTENT, align);
      this.commitState(StateKeys.ALIGN_CONTENT);
    }
  }

  get justifyItems() {
    switch (getInt8(this.style_view, StyleKeys.JUSTIFY_ITEMS)) {
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
    let v = -1;
    switch (value) {
      case 'normal':
        v = JustifyItems.Normal;
        break;
      case 'start':
        v = JustifyItems.Start;
        break;
      case 'end':
        v = JustifyItems.End;
        break;
      case 'center':
        v = JustifyItems.Center;
        break;
      case 'baseline':
        v = JustifyItems.Baseline;
        break;
      case 'stretch':
        v = JustifyItems.Stretch;
        break;
      case 'flex-start':
        v = JustifyItems.FlexStart;
        break;
      case 'flex-end':
        v = JustifyItems.FlexEnd;
        break;
    }
    if (v !== -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.JUSTIFY_ITEMS, v);
      this.commitState(StateKeys.JUSTIFY_ITEMS);
    }
  }

  get justifySelf() {
    switch (getInt8(this.style_view, StyleKeys.JUSTIFY_SELF)) {
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
    let v = -1;
    switch (value) {
      case 'normal':
        v = JustifySelf.Normal;
        break;
      case 'start':
        v = JustifySelf.Start;
        break;
      case 'end':
        v = JustifySelf.End;
        break;
      case 'center':
        v = JustifySelf.Center;
        break;
      case 'baseline':
        v = JustifySelf.Baseline;
        break;
      case 'stretch':
        v = JustifySelf.Stretch;
        break;
      case 'flex-start':
        v = JustifySelf.FlexStart;
        break;
      case 'flex-end':
        v = JustifySelf.FlexEnd;
        break;
    }
    if (v !== -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.JUSTIFY_SELF, v);
      this.commitState(StateKeys.JUSTIFY_SELF);
    }
  }

  get justifyContent() {
    switch (getInt8(this.style_view, StyleKeys.JUSTIFY_CONTENT)) {
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
    let v = -1;
    switch (value) {
      case 'normal':
        v = JustifyContent.Normal;
        break;
      case 'space-around':
        v = JustifyContent.SpaceAround;
        break;
      case 'space-between':
        v = JustifyContent.SpaceBetween;
        break;
      case 'space-evenly':
        v = JustifyContent.SpaceEvenly;
        break;
      case 'center':
        v = JustifyContent.Center;
        break;
      case 'end':
        v = JustifyContent.End;
        break;
      case 'start':
        v = JustifyContent.Start;
        break;
      case 'stretch':
        v = JustifyContent.Stretch;
        break;
      case 'flex-start':
        v = JustifyContent.FlexStart;
        break;
      case 'flex-end':
        v = JustifyContent.FlexEnd;
        break;
    }
    if (v !== -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.JUSTIFY_CONTENT, v);
      this.commitState(StateKeys.JUSTIFY_CONTENT);
    }
  }
  get gridAutoRows() {
    if (!this.nativeView) {
      return '';
    }

    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridAutoRows(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridAutoRows;
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

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridAutoRows = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridAutoRows', value);
    }
  }

  get gridAutoColumns() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridAutoColumns(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridAutoColumns;
    }

    return '';
  }

  set gridAutoColumns(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridAutoColumns(this.nativeView, value);
    }

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridAutoColumns = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridAutoColumns', value);
    }
  }

  get gridAutoFlow(): GridAutoFlow {
    switch (getInt8(this.style_view, StyleKeys.GRID_AUTO_FLOW)) {
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
    const v = ({ row: 0, column: 1, 'row dense': 2, 'column dense': 3 } as Record<string, number>)[value];
    if (v !== undefined) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.GRID_AUTO_FLOW, v);
      this.commitState(StateKeys.GRID_AUTO_FLOW);
    }
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

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridColumn = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridColumn', value);
    }
  }

  get gridColumn() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridColumn(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridColumn;
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

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridColumnStart;
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

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridColumnStart = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridColumnStart', value);
    }
  }

  get gridColumnEnd(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridColumnEnd(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridColumnEnd;
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

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridColumnEnd = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridColumnEnd', value);
    }
  }

  set gridRow(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridRow(this.nativeView, value);
    }

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridRow = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridRow', value);
    }
  }

  get gridRow(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridRow(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridRow;
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

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridRowStart;
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

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridRowStart = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridRowStart', value);
    }
  }

  get gridRowEnd(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridRowEnd(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridRowEnd;
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

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridRowEnd = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridRowEnd', value);
    }
  }

  set gridArea(value: string) {
    if (!this.nativeView) {
      return;
    }
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridArea(this.nativeView, value);
    }

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridArea = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridArea', value);
    }
  }

  get gridArea() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridArea(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridArea;
    }

    return '';
  }

  set gridTemplateRows(value: string) {
    if (!this.nativeView) {
      return;
    }
    // Reset (e.g. a media query toggling grid-rows off) passes null; the native
    // setters are non-null, so coerce to '' which clears the template.
    value = value ?? '';
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateRows(this.nativeView, value);
    }

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridTemplateRows = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridTemplateRows', value);
    }
  }

  get gridTemplateRows() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridTemplateRows(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridTemplateRows;
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

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridTemplateColumns;
    }

    return '';
  }

  set gridTemplateColumns(value: string) {
    if (!this.nativeView) {
      return;
    }
    // Reset (e.g. a media query toggling grid-cols off) passes null; the native
    // setters are non-null, so coerce to '' which clears the template.
    value = value ?? '';
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateColumns(this.nativeView, value);
    }

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridTemplateColumns = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridTemplateColumns', value);
    }
  }

  get gridTemplateAreas() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getGridTemplateAreas(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.gridTemplateAreas;
    }

    return '';
  }

  set gridTemplateAreas(value: string) {
    if (!this.nativeView) {
      return;
    }
    // Reset passes null; the native setters are non-null, coerce to '' (clears it).
    value = value ?? '';
    if (__ANDROID__) {
      org.nativescript.mason.masonkit.NodeHelper.getShared().setGridTemplateAreas(this.nativeView, value);
    }

    if (__APPLE__) {
      (this.nativeView as MasonElementObjc).style.gridTemplateAreas = value;
    }

    if (__WINDOWS__) {
      windowsSetGrid(this.nativeView, 'gridTemplateAreas', value);
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
    const overflowMap: Record<string, number> = { visible: 0, hidden: 1, scroll: 2, clip: 3, auto: 4 };
    this.prepareMut();
    switch (value) {
      case 'visible':
      case 'hidden':
      case 'scroll':
      case 'clip':
      case 'auto': {
        const v = overflowMap[value];
        setInt8(this.style_view, StyleKeys.OVERFLOW_X, v);
        setInt8(this.style_view, StyleKeys.OVERFLOW_Y, v);
        break;
      }
      default: {
        const values = value.split(' ');
        const x = overflowMap[values[0]];
        const y = overflowMap[values[1]];
        if (x !== undefined) setInt8(this.style_view, StyleKeys.OVERFLOW_X, x);
        if (y !== undefined) setInt8(this.style_view, StyleKeys.OVERFLOW_Y, y);
        break;
      }
    }
    this.commitState(StateKeys.OVERFLOW);
  }
  get overflowX() {
    switch (getInt8(this.style_view, StyleKeys.OVERFLOW_X)) {
      case 0:
        return 'visible';
      case 1:
        return 'hidden';
      case 2:
        return 'scroll';
    }
  }

  set overflowX(value: OverFlow) {
    const v = ({ visible: 0, hidden: 1, scroll: 2, clip: 3, auto: 4 } as Record<string, number>)[value];
    if (v !== undefined) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.OVERFLOW_X, v);
      this.commitState(StateKeys.OVERFLOW_X);
    }
  }

  get overflowY() {
    switch (getInt8(this.style_view, StyleKeys.OVERFLOW_Y)) {
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
    const v = ({ visible: 0, hidden: 1, scroll: 2, clip: 3, auto: 4 } as Record<string, number>)[value];
    if (v !== undefined) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.OVERFLOW_Y, v);
      this.commitState(StateKeys.OVERFLOW_Y);
    }
  }

  get flexGrow(): number {
    return getFloat32(this.style_view, StyleKeys.FLEX_GROW);
  }

  set flexGrow(value: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.FLEX_GROW, value);
    this.commitState(StateKeys.FLEX_GROW);
  }

  get flexShrink(): number {
    return getFloat32(this.style_view, StyleKeys.FLEX_SHRINK);
  }

  set flexShrink(value: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.FLEX_SHRINK, value);
    this.commitState(StateKeys.FLEX_SHRINK);
  }

  get scrollBarWidth(): number | CoreTypes.LengthType {
    return getFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH);
  }

  set scrollBarWidth(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') {
      this.prepareMut();
      setFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH, value);
      this.commitState(StateKeys.SCROLLBAR_WIDTH);
    } else if (typeof value === 'object') {
      switch (value.unit) {
        case 'dip':
          this.prepareMut();
          setFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH, layout.toDevicePixels(value.value));
          this.commitState(StateKeys.SCROLLBAR_WIDTH);
          break;
        case 'px':
          this.prepareMut();
          setFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH, value.value);
          this.commitState(StateKeys.SCROLLBAR_WIDTH);
          break;
      }
    }
  }

  get letterSpacing(): number | CoreTypes.LengthType {
    return getFloat32(this.style_view, StyleKeys.LETTER_SPACING);
  }

  set letterSpacing(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') {
      this.prepareMut();
      setFloat32(this.style_view, StyleKeys.LETTER_SPACING, value);
      setUint8(this.style_view, StyleKeys.LETTER_SPACING_STATE, 1);
      this.commitState(StateKeys.LETTER_SPACING);
    } else if (typeof value === 'object') {
      switch (value.unit) {
        case 'dip':
          this.prepareMut();
          setFloat32(this.style_view, StyleKeys.LETTER_SPACING, layout.toDevicePixels(value.value));
          setUint8(this.style_view, StyleKeys.LETTER_SPACING_STATE, 1);
          this.commitState(StateKeys.LETTER_SPACING);
          break;
        case 'px':
          this.prepareMut();
          setFloat32(this.style_view, StyleKeys.LETTER_SPACING, value.value);
          setUint8(this.style_view, StyleKeys.LETTER_SPACING_STATE, 1);
          this.commitState(StateKeys.LETTER_SPACING);
          break;
      }
    }
  }

  get lineHeight(): number | CoreTypes.LengthType {
    return getFloat32(this.style_view, StyleKeys.LINE_HEIGHT);
  }

  set lineHeight(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') {
      this.prepareMut();
      setFloat32(this.style_view, StyleKeys.LINE_HEIGHT, value);
      setUint8(this.style_view, StyleKeys.LINE_HEIGHT_STATE, 1);
      // Values ≥ 4 are rem-derived px values (smallest Tailwind rem = leading-3: 0.75rem→12).
      // Values < 4 are genuine CSS unitless multipliers (leading-loose=2, leading-normal=1.5).
      setUint8(this.style_view, StyleKeys.LINE_HEIGHT_TYPE, value >= 4 ? 1 : 0);
      this.commitState(StateKeys.LINE_HEIGHT);
    } else if (typeof value === 'object') {
      switch (value.unit) {
        case 'dip':
          this.prepareMut();
          setFloat32(this.style_view, StyleKeys.LINE_HEIGHT, layout.toDevicePixels(value.value));
          setUint8(this.style_view, StyleKeys.LINE_HEIGHT_STATE, 1);
          setUint8(this.style_view, StyleKeys.LINE_HEIGHT_TYPE, 1);
          this.commitState(StateKeys.LINE_HEIGHT);
          break;
        case 'px':
          this.prepareMut();
          setFloat32(this.style_view, StyleKeys.LINE_HEIGHT, value.value);
          setUint8(this.style_view, StyleKeys.LINE_HEIGHT_STATE, 1);
          setUint8(this.style_view, StyleKeys.LINE_HEIGHT_TYPE, 1);
          this.commitState(StateKeys.LINE_HEIGHT);
          break;
      }
    }
  }

  get textOverflow() {
    if (!this.style_view) {
      // clip ?
      return 'clip';
    }
    const type = getInt32(this.style_view, StyleKeys.TEXT_OVERFLOW);
    switch (type) {
      case 0:
        return 'clip';
      case 1:
        return 'ellipsis';
      default:
    }

    return 'clip';
  }

  set textOverflow(value: 'clip' | 'ellipsis' | `${string}`) {
    if (!this.style_view) {
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
        // noop
        break;
    }

    if (flow !== -1) {
      this.prepareMut();
      setInt32(this.style_view, StyleKeys.TEXT_OVERFLOW, flow);
      setInt8(this.style_view, StyleKeys.TEXT_OVERFLOW_STATE, 1);
      this.commitState(StateKeys.TEXT_OVERFLOW);
    }
  }

  get textAlignment() {
    if (!this.style_view) {
      // clip ?
      return 'start';
    }
    const type = getInt32(this.style_view, StyleKeys.TEXT_ALIGN);
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
    if (!this.style_view) {
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
      this.prepareMut();
      setInt32(this.style_view, StyleKeys.TEXT_ALIGN, align);
      setInt8(this.style_view, StyleKeys.TEXT_ALIGN_STATE, 1);
      this.commitState(StateKeys.TEXT_ALIGN);
    }
  }

  get textTransform() {
    if (!this.style_view) {
      return 'none';
    }
    const type = getInt8(this.style_view, StyleKeys.TEXT_TRANSFORM);
    switch (type) {
      case 1:
        return 'capitalize';
      case 2:
        return 'uppercase';
      case 3:
        return 'lowercase';
      default:
        return 'none';
    }
  }

  set textTransform(value: 'none' | 'capitalize' | 'uppercase' | 'lowercase') {
    if (!this.style_view) {
      return;
    }

    let transform = -1;

    switch (value) {
      case 'none':
        transform = 0;
        break;
      case 'capitalize':
        transform = 1;
        break;
      case 'uppercase':
        transform = 2;
        break;
      case 'lowercase':
        transform = 3;
        break;
      default:
        break;
    }

    if (transform !== -1) {
      this.prepareMut();
      setInt8(this.style_view, StyleKeys.TEXT_TRANSFORM, transform);
      setInt8(this.style_view, StyleKeys.TEXT_TRANSFORM_STATE, 1);
      this.commitState(StateKeys.TEXT_TRANSFORM);
    }
  }

  get background() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackground(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.background;
    }

    return '';
  }

  set background(value: string) {
    this.setPseudoCssStringValue(
      'background',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBackground(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.background = value),
    );
  }

  get backgroundImage() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackgroundImage(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.backgroundImage;
    }

    return '';
  }

  set backgroundImage(value: string) {
    this.setPseudoCssStringValue(
      'background-image',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBackgroundImage(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.backgroundImage = value),
    );
  }

  get backgroundRepeat() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackgroundRepeat(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.backgroundRepeat;
    }

    return '';
  }

  set backgroundRepeat(value: string) {
    this.setPseudoCssStringValue(
      'background-repeat',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBackgroundRepeat(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.backgroundRepeat = value),
    );
  }

  get backgroundPosition() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackgroundPosition(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.backgroundPosition;
    }

    return '';
  }

  set backgroundPosition(value: string) {
    this.setPseudoCssStringValue(
      'background-position',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBackgroundPosition(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.backgroundPosition = value),
    );
  }

  get backgroundSize() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackgroundSize(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.backgroundSize;
    }

    return '';
  }

  set backgroundSize(value: string) {
    this.setPseudoCssStringValue(
      'background-size',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBackgroundSize(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.backgroundSize = value),
    );
  }

  get backgroundClip() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackgroundClip(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.backgroundClip;
    }

    return '';
  }

  set backgroundClip(value: string) {
    this.setPseudoCssStringValue(
      'background-clip',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBackgroundClip(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.backgroundClip = value),
    );
  }

  get borderRadius() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBorderRadius(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.borderRadius;
    }

    return '';
  }

  set borderRadius(value: string) {
    this.setPseudoCssStringValue(
      'border-radius',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBorderRadius(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.borderRadius = value),
    );
  }

  set textDecoration(value: string) {
    this.setPseudoCssStringValue(
      'text-decoration',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setTextDecoration(this.nativeView, value),
      () => (this.nativeView as MasonElementObjc).style.setTextDecoration(value),
    );
  }

  get border() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBorder(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.border;
    }
    return '';
  }

  set border(value: string) {
    this.setPseudoCssStringValue(
      'border',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBorder(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.border = value),
    );
  }

  get paddingCss() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getPaddingCssValue(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.paddingCss;
    }
    return '';
  }

  set paddingCss(value: string | number) {
    const strValue = typeof value === 'number' ? `${value}px` : value;
    this.setPseudoCssStringValue(
      'padding',
      strValue,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setPaddingCss(this.nativeView, strValue),
      () => ((this.nativeView as MasonElementObjc).style.paddingCss = strValue),
    );
  }

  get marginCss() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getMarginCssValue(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.marginCss;
    }
    return '';
  }

  set marginCss(value: string | number) {
    const strValue = typeof value === 'number' ? `${value}px` : value;
    this.setPseudoCssStringValue(
      'margin',
      strValue,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setMarginCss(this.nativeView, strValue),
      () => ((this.nativeView as MasonElementObjc).style.marginCss = strValue),
    );
  }

  get insetCss() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getInsetCssValue(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.insetCss;
    }
    return '';
  }

  set insetCss(value: string | number) {
    const strValue = typeof value === 'number' ? `${value}px` : value;
    this.setPseudoCssStringValue(
      'inset',
      strValue,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setInsetCss(this.nativeView, strValue),
      () => ((this.nativeView as MasonElementObjc).style.insetCss = strValue),
    );
  }

  get borderLeft() {
    return '';
  }

  set borderLeft(value: string) {
    this.setPseudoCssStringValue(
      'border-left',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBorderLeft(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.borderLeft = value),
    );
  }

  get borderTop() {
    return '';
  }

  set borderTop(value: string) {
    this.setPseudoCssStringValue(
      'border-top',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBorderTop(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.borderTop = value),
    );
  }

  get borderRight() {
    return '';
  }

  set borderRight(value: string) {
    this.setPseudoCssStringValue(
      'border-right',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBorderRight(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.borderRight = value),
    );
  }

  get borderBottom() {
    return '';
  }

  set borderBottom(value: string) {
    this.setPseudoCssStringValue(
      'border-bottom',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBorderBottom(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.borderBottom = value),
    );
  }

  get filter() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getFilter(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.filter;
    }

    return '';
  }

  set filter(value: string) {
    this.setPseudoCssStringValue(
      'filter',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setFilter(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.filter = value),
    );
  }

  get boxShadow() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBoxShadow(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.boxShadow;
    }

    return '';
  }

  set 'box-shadow'(value: string) {
    this.boxShadow = value;
  }

  get 'box-shadow'() {
    return this.boxShadow;
  }

  set boxShadow(value: string) {
    this.setPseudoCssStringValue(
      'box-shadow',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBoxShadow(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.boxShadow = value),
    );
  }

  get transform() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getTransform(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.transform;
    }

    return '';
  }

  set transform(value: string) {
    this.setPseudoCssStringValue(
      'transform',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setTransform(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.transform = value),
    );
  }

  get verticalAlign() {
    const isPercent = getUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET) == 1;
    const value = getFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET);
    if (isPercent) {
      return `${value * 100}%`;
    }
    if (value > 0) {
      return `${value}px`;
    }
    switch (getUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET)) {
      case 0:
        return 'baseline';
      case 1:
        return 'top';
      case 2:
        return 'text-top';
      case 3:
        return 'middle';
      case 4:
        return 'bottom';
      case 5:
        return 'text-bottom';
      case 6:
        return 'sub';
      case 7:
        return 'super';
      default:
        // throw ??
        return 'baseline';
    }
  }

  set verticalAlign(value: VerticalAlign) {
    switch (value) {
      case 'baseline':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
        break;
      case 'top':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 1);
        break;
      case 'text-top':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 2);
        break;
      case 'middle':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 3);
        break;
      case 'bottom':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 4);
        break;
      case 'text-bottom':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 5);
        break;
      case 'sub':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 6);
        break;
      case 'super':
        this.prepareMut();
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
        setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0);
        setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 7);
        break;
      default: {
        switch (typeof value) {
          case 'number':
            this.prepareMut();
            setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
            setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, value * layout.getDisplayDensity());
            setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
            break;
          case 'string':
            {
              try {
                const parsed = CorePercentLength.parse(value);
                if (typeof parsed === 'object' && parsed !== null && 'unit' in parsed) {
                  switch (parsed.unit) {
                    case '%':
                      this.prepareMut();
                      setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 1);
                      setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, parsed.value);
                      setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
                      break;
                    case 'px':
                      this.prepareMut();
                      setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
                      setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, parsed.value);
                      setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
                      break;
                    case 'dip':
                      this.prepareMut();
                      setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
                      setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, parsed.value * layout.getDisplayDensity());
                      setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
                      break;
                  }
                }
              } catch (error) {}
            }
            break;
          case 'object':
            if (value !== null && 'unit' in value) {
              switch (value.unit) {
                case '%':
                  this.prepareMut();
                  setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 1);
                  setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, value.value);
                  setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
                  break;
                case 'px':
                  this.prepareMut();
                  setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
                  setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, value.value);
                  setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
                  break;
                case 'dip':
                  this.prepareMut();
                  setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0);
                  setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, value.value * layout.getDisplayDensity());
                  setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0);
                  break;
              }
            }
            break;
        }
      }
    }
    this.commitState(StateKeys.VERTICAL_ALIGN);
  }

  get textShadow() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getTextShadow(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.textShadow;
    }

    return '';
  }

  set textShadow(value: string) {
    this.setPseudoCssStringValue(
      'text-shadow',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setTextShadow(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.textShadow = value),
    );
  }

  get zIndex(): number {
    return getInt32(this.style_view, StyleKeys.Z_INDEX);
  }

  set zIndex(value: number) {
    this.prepareMut();
    setInt32(this.style_view, StyleKeys.Z_INDEX, value);
    this.commitState(StateKeys.Z_INDEX);
  }

  get float() {
    switch (getInt8(this.style_view, StyleKeys.FLOAT)) {
      case Float.None:
        return 'none';
      case Float.Left:
        return 'left';
      case Float.Right:
        return 'right';
    }
    return 'none';
  }

  set float(value: 'none' | 'left' | 'right') {
    const current = getInt8(this.style_view, StyleKeys.FLOAT);
    let enumVal: number;
    switch (value) {
      case 'none':
        enumVal = Float.None;
        break;
      case 'left':
        enumVal = Float.Left;
        break;
      case 'right':
        enumVal = Float.Right;
        break;
      default:
        enumVal = Float.None;
    }

    if (current === enumVal) {
      return;
    }

    this.prepareMut();
    setInt8(this.style_view, StyleKeys.FLOAT, enumVal);
    this.commitState(StateKeys.FLOAT);
  }

  get clear() {
    switch (getInt8(this.style_view, StyleKeys.CLEAR)) {
      case Clear.None:
        return 'none';
      case Clear.Left:
        return 'left';
      case Clear.Right:
        return 'right';
      case Clear.Both:
        return 'both';
    }
    return 'none';
  }

  set clear(value: 'none' | 'left' | 'right' | 'both') {
    switch (value) {
      case 'none':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.CLEAR, Clear.None);
        break;
      case 'left':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.CLEAR, Clear.Left);
        break;
      case 'right':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.CLEAR, Clear.Right);
        break;
      case 'both':
        this.prepareMut();
        setInt8(this.style_view, StyleKeys.CLEAR, Clear.Both);
        break;
    }
    this.commitState(StateKeys.CLEAR);
  }

  set cornerShape(value: string) {
    this.setPseudoCssStringValue(
      'corner-shape',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setCornerShape(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.cornerShape = value),
    );
  }

  get cornerShape(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getCornerShape(this.nativeView);
    }

    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.cornerShape;
    }

    return '';
  }

  get cornerShapeTopLeft() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getCornerShapeTopLeft(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.cornerShapeTopLeft;
    }
    return '';
  }

  set cornerShapeTopLeft(value: string) {
    this.setPseudoCssStringValue(
      'corner-shape-top-left',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setCornerShapeTopLeft(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.cornerShapeTopLeft = value),
    );
  }

  get cornerShapeTopRight() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getCornerShapeTopRight(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.cornerShapeTopRight;
    }
    return '';
  }

  set cornerShapeTopRight(value: string) {
    this.setPseudoCssStringValue(
      'corner-shape-top-right',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setCornerShapeTopRight(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.cornerShapeTopRight = value),
    );
  }

  get cornerShapeBottomRight() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getCornerShapeBottomRight(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.cornerShapeBottomRight;
    }
    return '';
  }

  set cornerShapeBottomRight(value: string) {
    this.setPseudoCssStringValue(
      'corner-shape-bottom-right',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setCornerShapeBottomRight(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.cornerShapeBottomRight = value),
    );
  }

  get cornerShapeBottomLeft() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getCornerShapeBottomLeft(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.cornerShapeBottomLeft;
    }
    return '';
  }

  set cornerShapeBottomLeft(value: string) {
    this.setPseudoCssStringValue(
      'corner-shape-bottom-left',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setCornerShapeBottomLeft(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.cornerShapeBottomLeft = value),
    );
  }

  get objectPosition(): string {
    if (!this.style_view) return '50% 50%';
    const state = getUint8(this.style_view, StyleKeys.OBJECT_POSITION_STATE);
    if (!state) return '50% 50%';
    const xType = getUint8(this.style_view, StyleKeys.OBJECT_POSITION_X_TYPE);
    const yType = getUint8(this.style_view, StyleKeys.OBJECT_POSITION_Y_TYPE);
    const xVal = getFloat32(this.style_view, StyleKeys.OBJECT_POSITION_X_VALUE);
    const yVal = getFloat32(this.style_view, StyleKeys.OBJECT_POSITION_Y_VALUE);
    const x = xType === 1 ? `${xVal}%` : `${xVal}px`;
    const y = yType === 1 ? `${yVal}%` : `${yVal}px`;
    return `${x} ${y}`;
  }

  set objectPosition(value: string) {
    if (!this.style_view) return;
    const parsed = parseObjectPosition(value);
    if (!parsed) return;
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.OBJECT_POSITION_X_TYPE, parsed.xType);
    setUint8(this.style_view, StyleKeys.OBJECT_POSITION_Y_TYPE, parsed.yType);
    setFloat32(this.style_view, StyleKeys.OBJECT_POSITION_X_VALUE, parsed.xVal);
    setFloat32(this.style_view, StyleKeys.OBJECT_POSITION_Y_VALUE, parsed.yVal);
    setUint8(this.style_view, StyleKeys.OBJECT_POSITION_STATE, 1);
    this.commitState(StateKeys.OBJECT_POSITION);
  }

  set 'object-position'(value: string) {
    this.objectPosition = value;
  }

  get 'object-position'() {
    return this.objectPosition;
  }

  get borderLeftStyle(): string {
    return borderStyleFromEnum(getInt8(this.style_view, StyleKeys.BORDER_LEFT_STYLE));
  }

  set borderLeftStyle(value: string) {
    const v = borderStyleToEnum(value);
    if (v === -1) return;
    this.prepareMut();
    setInt8(this.style_view, StyleKeys.BORDER_LEFT_STYLE, v);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  get borderRightStyle(): string {
    return borderStyleFromEnum(getInt8(this.style_view, StyleKeys.BORDER_RIGHT_STYLE));
  }

  set borderRightStyle(value: string) {
    const v = borderStyleToEnum(value);
    if (v === -1) return;
    this.prepareMut();
    setInt8(this.style_view, StyleKeys.BORDER_RIGHT_STYLE, v);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  get borderTopStyle(): string {
    return borderStyleFromEnum(getInt8(this.style_view, StyleKeys.BORDER_TOP_STYLE));
  }

  set borderTopStyle(value: string) {
    const v = borderStyleToEnum(value);
    if (v === -1) return;
    this.prepareMut();
    setInt8(this.style_view, StyleKeys.BORDER_TOP_STYLE, v);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  get borderBottomStyle(): string {
    return borderStyleFromEnum(getInt8(this.style_view, StyleKeys.BORDER_BOTTOM_STYLE));
  }

  set borderBottomStyle(value: string) {
    const v = borderStyleToEnum(value);
    if (v === -1) return;
    this.prepareMut();
    setInt8(this.style_view, StyleKeys.BORDER_BOTTOM_STYLE, v);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  get borderStyle(): string {
    const l = this.borderLeftStyle;
    const r = this.borderRightStyle;
    const t = this.borderTopStyle;
    const b = this.borderBottomStyle;
    if (l === r && r === t && t === b) return l;
    if (t === b && l === r) return `${t} ${l}`;
    return `${t} ${r} ${b} ${l}`;
  }

  set borderStyle(value: string) {
    const parts = value.trim().split(/\s+/);
    let t: string, r: string, b: string, l: string;
    switch (parts.length) {
      case 1:
        t = r = b = l = parts[0];
        break;
      case 2:
        t = b = parts[0];
        r = l = parts[1];
        break;
      case 3:
        t = parts[0];
        r = l = parts[1];
        b = parts[2];
        break;
      case 4:
        t = parts[0];
        r = parts[1];
        b = parts[2];
        l = parts[3];
        break;
      default:
        return;
    }
    const te = borderStyleToEnum(t);
    const re = borderStyleToEnum(r);
    const be = borderStyleToEnum(b);
    const le = borderStyleToEnum(l);
    if (te === -1 || re === -1 || be === -1 || le === -1) return;
    this.prepareMut();
    setInt8(this.style_view, StyleKeys.BORDER_TOP_STYLE, te);
    setInt8(this.style_view, StyleKeys.BORDER_RIGHT_STYLE, re);
    setInt8(this.style_view, StyleKeys.BORDER_BOTTOM_STYLE, be);
    setInt8(this.style_view, StyleKeys.BORDER_LEFT_STYLE, le);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  set 'border-style'(value: string) {
    this.borderStyle = value;
  }

  get 'border-style'() {
    return this.borderStyle;
  }

  get borderImage(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBorderImage(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.borderImage;
    }
    return '';
  }

  set borderImage(value: string) {
    this.setPseudoCssStringValue(
      'border-image',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBorderImage(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.borderImage = value),
    );
  }

  set 'border-image'(value: string) {
    this.borderImage = value;
  }

  get 'border-image'() {
    return this.borderImage;
  }

  get fontStretch(): string {
    if (!this.style_view) return 'normal';
    const state = getUint8(this.style_view, StyleKeys.FONT_STRETCH_STATE);
    if (!state) return 'normal';
    const pct = getInt32(this.style_view, StyleKeys.FONT_STRETCH);
    return fontStretchFromValue(pct);
  }

  set fontStretch(value: string) {
    if (!this.style_view) return;
    const pct = fontStretchToValue(value);
    if (pct === -1) return;
    this.prepareMut();
    setInt32(this.style_view, StyleKeys.FONT_STRETCH, pct);
    setUint8(this.style_view, StyleKeys.FONT_STRETCH_STATE, 1);
    this.commitState(StateKeys.FONT_STRETCH);
  }

  set 'font-stretch'(value: string) {
    this.fontStretch = value;
  }

  get 'font-stretch'() {
    return this.fontStretch;
  }

  get fontFeatureSettings(): string {
    if (!this.nativeView) return 'normal';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getFontFeatureSettings(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.fontFeatureSettings;
    }
    return 'normal';
  }

  set fontFeatureSettings(value: string) {
    this.setPseudoCssStringValue(
      'font-feature-settings',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setFontFeatureSettings(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.fontFeatureSettings = value),
    );
  }

  set 'font-feature-settings'(value: string) {
    this.fontFeatureSettings = value;
  }

  get 'font-feature-settings'() {
    return this.fontFeatureSettings;
  }

  get wordSpacing(): string {
    if (!this.style_view) return 'normal';
    const state = getUint8(this.style_view, StyleKeys.WORD_SPACING_STATE);
    if (!state) return 'normal';
    const type = getUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE);
    if (type === 2) return 'normal';
    const value = getFloat32(this.style_view, StyleKeys.WORD_SPACING);
    return type === 1 ? `${value}%` : `${value}px`;
  }

  set wordSpacing(value: string | number) {
    if (!this.style_view) return;
    this.prepareMut();
    if (value === 'normal') {
      setUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE, 2);
      setFloat32(this.style_view, StyleKeys.WORD_SPACING, 0);
    } else if (typeof value === 'number') {
      setUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE, 0);
      setFloat32(this.style_view, StyleKeys.WORD_SPACING, layout.toDevicePixels(value));
    } else {
      const trimmed = value.trim();
      if (trimmed === 'normal') {
        setUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE, 2);
        setFloat32(this.style_view, StyleKeys.WORD_SPACING, 0);
      } else if (trimmed.endsWith('%')) {
        setUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE, 1);
        setFloat32(this.style_view, StyleKeys.WORD_SPACING, parseFloat(trimmed));
      } else {
        setUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE, 0);
        setFloat32(this.style_view, StyleKeys.WORD_SPACING, layout.toDevicePixels(parseFloat(trimmed)));
      }
    }
    setUint8(this.style_view, StyleKeys.WORD_SPACING_STATE, 1);
    this.commitState(StateKeys.WORD_SPACING);
  }

  set 'word-spacing'(value: string | number) {
    this.wordSpacing = value;
  }

  get 'word-spacing'() {
    return this.wordSpacing;
  }

  get hyphens(): 'none' | 'manual' | 'auto' {
    if (!this.style_view) return 'manual';
    const state = getUint8(this.style_view, StyleKeys.HYPHENS_STATE);
    if (!state) return 'manual';
    switch (getUint8(this.style_view, StyleKeys.HYPHENS)) {
      case 0:
        return 'manual';
      case 1:
        return 'none';
      case 2:
        return 'auto';
      default:
        return 'manual';
    }
  }

  set hyphens(value: 'none' | 'manual' | 'auto') {
    let v = -1;
    switch (value) {
      case 'manual':
        v = 0;
        break;
      case 'none':
        v = 1;
        break;
      case 'auto':
        v = 2;
        break;
    }
    if (v === -1) return;
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.HYPHENS, v);
    setUint8(this.style_view, StyleKeys.HYPHENS_STATE, 1);
    this.commitState(StateKeys.HYPHENS);
  }

  get backdropFilter(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return org.nativescript.mason.masonkit.NodeHelper.getShared().getBackdropFilter(this.nativeView);
    }
    if (__APPLE__) {
      return (this.nativeView as MasonElementObjc).style.backdropFilter;
    }
    return '';
  }

  set backdropFilter(value: string) {
    this.setPseudoCssStringValue(
      'backdrop-filter',
      value,
      () => org.nativescript.mason.masonkit.NodeHelper.getShared().setBackdropFilter(this.nativeView, value),
      () => ((this.nativeView as MasonElementObjc).style.backdropFilter = value),
    );
  }

  set 'backdrop-filter'(value: string) {
    this.backdropFilter = value;
  }

  get 'backdrop-filter'() {
    return this.backdropFilter;
  }

  get writingMode(): 'horizontal-tb' | 'vertical-rl' | 'vertical-lr' {
    if (!this.style_view) return 'horizontal-tb';
    const state = getUint8(this.style_view, StyleKeys.WRITING_MODE_STATE);
    if (!state) return 'horizontal-tb';
    switch (getUint8(this.style_view, StyleKeys.WRITING_MODE)) {
      case 0:
        return 'horizontal-tb';
      case 1:
        return 'vertical-rl';
      case 2:
        return 'vertical-lr';
      default:
        return 'horizontal-tb';
    }
  }

  set writingMode(value: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr') {
    let v = -1;
    switch (value) {
      case 'horizontal-tb':
        v = 0;
        break;
      case 'vertical-rl':
        v = 1;
        break;
      case 'vertical-lr':
        v = 2;
        break;
    }
    if (v === -1) return;
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.WRITING_MODE, v);
    setUint8(this.style_view, StyleKeys.WRITING_MODE_STATE, 1);
    this.commitState(StateKeys.WRITING_MODE);
  }

  set 'writing-mode'(value: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr') {
    this.writingMode = value;
  }

  get 'writing-mode'() {
    return this.writingMode;
  }

  get unicodeBidi(): string {
    if (!this.style_view) return 'normal';
    const state = getUint8(this.style_view, StyleKeys.UNICODE_BIDI_STATE);
    if (!state) return 'normal';
    switch (getUint8(this.style_view, StyleKeys.UNICODE_BIDI)) {
      case 0:
        return 'normal';
      case 1:
        return 'embed';
      case 2:
        return 'bidi-override';
      case 3:
        return 'isolate';
      case 4:
        return 'isolate-override';
      case 5:
        return 'plaintext';
      default:
        return 'normal';
    }
  }

  set unicodeBidi(value: string) {
    let v = -1;
    switch (value) {
      case 'normal':
        v = 0;
        break;
      case 'embed':
        v = 1;
        break;
      case 'bidi-override':
        v = 2;
        break;
      case 'isolate':
        v = 3;
        break;
      case 'isolate-override':
        v = 4;
        break;
      case 'plaintext':
        v = 5;
        break;
    }
    if (v === -1) return;
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.UNICODE_BIDI, v);
    setUint8(this.style_view, StyleKeys.UNICODE_BIDI_STATE, 1);
    this.commitState(StateKeys.UNICODE_BIDI);
  }

  set 'unicode-bidi'(value: string) {
    this.unicodeBidi = value;
  }

  get 'unicode-bidi'() {
    return this.unicodeBidi;
  }

  get caretColor(): string {
    if (!this.style_view) return 'auto';
    const state = getUint8(this.style_view, StyleKeys.CARET_COLOR_STATE);
    if (!state) return 'auto';
    const argb = getUint32(this.style_view, StyleKeys.CARET_COLOR);
    if (argb === 0) return 'auto';
    const a = (argb >>> 24) & 0xff;
    const r = (argb >>> 16) & 0xff;
    const g = (argb >>> 8) & 0xff;
    const b = argb & 0xff;
    return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
  }

  set caretColor(value: string | number) {
    if (!this.style_view) return;
    this.prepareMut();
    if (value === 'auto') {
      setUint32(this.style_view, StyleKeys.CARET_COLOR, 0);
      setUint8(this.style_view, StyleKeys.CARET_COLOR_STATE, 1);
    } else {
      const normalized = normalizeColorValue(value);
      if (normalized == null) return;
      setUint32(this.style_view, StyleKeys.CARET_COLOR, normalized);
      setUint8(this.style_view, StyleKeys.CARET_COLOR_STATE, 1);
    }
    this.commitState(StateKeys.CARET_COLOR);
  }

  set 'caret-color'(value: string | number) {
    this.caretColor = value;
  }

  get 'caret-color'() {
    return this.caretColor;
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
      filter: this.filter,
      zIndex: this.zIndex,
      backgroundColor: this.backgroundColor,
      objectPosition: this.objectPosition,
      borderStyle: this.borderStyle,
      writingMode: this.writingMode,
      unicodeBidi: this.unicodeBidi,
      hyphens: this.hyphens,
      caretColor: this.caretColor,
      wordSpacing: this.wordSpacing,
      fontStretch: this.fontStretch,
    };
  }
}
