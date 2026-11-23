import { layout as coreLayout } from '@nativescript/core/utils';
import { cssUnits } from './units';
import { masonLayout } from './display-density';
import { isMasonView_, style_ } from './symbols';
import { pickFontFamily } from './fonts';
import { arrayBufferOf, masonEngine } from './panel-helpers';
import { reportCssDiagnostic } from './diagnostics';
import { expandCssShorthand, resolveCssLength as nativeCssLength, resolveCssPosition, resolveCssValues } from './native-css-values';
import { isCssMathFunction, rewriteCssMath, type CssMathResult } from './css-math-text';
import { encodeWindowsBorderImage, encodeWindowsMask, WINDOWS_MASK_PROPERTIES, type WindowsMaskContext } from './mask';
import type { CssMathLength, DimensionLength, GridAutoFlow, Length, LengthAuto, VerticalAlign, View } from '.';
import { Color, CoreTypes, Length as CoreLength, knownFolders } from '@nativescript/core';
import { _parseGridAutoRowsColumns, _setGridAutoRows, _setGridAutoColumns, _parseGridLine, GridTemplates, _parseGridTemplates, _setGridTemplateColumns, _setGridTemplateRows, _getGridTemplateRows, _getGridTemplateColumns } from './utils';

// The Windows shell lays out in XAML DIPs, so its style buffer holds DIPs. Core's Windows density
// is 1 until the window has a XamlRoot, so converting stored early styles unscaled and later ones scaled.
const layout: typeof coreLayout = __WINDOWS__ || __LINUX__ ? { ...coreLayout, getDisplayDensity: () => 1, toDevicePixels: (value: number) => value, toDeviceIndependentPixels: (value: number) => value } : { ...coreLayout, ...masonLayout };

// <style-keys:border-style-codes> generated from tools/scripts/style-keys/style-keys.schema
const enum BorderStyleCode {
  None = 0,
  Hidden = 1,
  Dotted = 2,
  Dashed = 3,
  Solid = 4,
  Double = 5,
  Groove = 6,
  Ridge = 7,
  Inset = 8,
  Outset = 9,
}
// </style-keys:border-style-codes>

// <style-keys:css-parse-kinds>
enum CssParseKind {
  Shadows = 0,
  Filters = 1,
  Length = 2,
  FontSize = 3,
  ClampLength = 4,
  TransformOrigin = 5,
  ObjectPosition = 6,
  LineHeight = 7,
  LetterSpacing = 8,
  TextIndent = 9,
  WordSpacing = 10,
  VerticalAlign = 11,
  Dimension = 12,
  LengthAuto = 13,
  BorderRadius = 14,
  BorderCornerRadius = 15,
  SvgNumberList = 16,
  SvgTransform = 17,
  SvgLength = 18,
  SvgLengthList = 19,
  SvgOpacity = 20,
  SvgAngle = 21,
  SvgAspectRatio = 22,
  SvgNumber = 23,
  SvgDashArray = 24,
}
// </style-keys:css-parse-kinds>

// <style-keys:records>
const enum BorderRadiiRecord {
  STRIDE = 8,
  HORIZONTAL_TOP_LEFT = 0,
  HORIZONTAL_TOP_RIGHT = 1,
  HORIZONTAL_BOTTOM_RIGHT = 2,
  HORIZONTAL_BOTTOM_LEFT = 3,
  VERTICAL_TOP_LEFT = 4,
  VERTICAL_TOP_RIGHT = 5,
  VERTICAL_BOTTOM_RIGHT = 6,
  VERTICAL_BOTTOM_LEFT = 7,
}

const enum CssLengthResultRecord {
  STRIDE = 2,
  KIND = 0,
  VALUE = 1,
}

const enum CssBackgroundWriteRecord {
  STRIDE = 3,
  PROPERTY = 0,
  VALUE = 1,
  CURRENT_COLOR = 2,
}

const enum CssEffectWriteRecord {
  STRIDE = 3,
  PROPERTY = 0,
  VALUE = 1,
  CURRENT_COLOR = 2,
}

const enum CssMaskWriteRecord {
  STRIDE = 2,
  SLOT = 0,
  VALUE = 1,
}
// </style-keys:records>

enum StyleKeys {
  // <style-keys:offsets> generated from tools/scripts/style-keys/style-keys.schema, run `npm run gen:style-keys`
  STYLE_BUFFER_SIZE = 792,

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

  // Each box side group: four types, then four values.
  INSET_LEFT_TYPE = 13,
  INSET_RIGHT_TYPE = 14,
  INSET_TOP_TYPE = 15,
  INSET_BOTTOM_TYPE = 16,
  INSET_LEFT_VALUE = 17, // f32 (17-20)
  INSET_RIGHT_VALUE = 21, // f32 (21-24)
  INSET_TOP_VALUE = 25, // f32 (25-28)
  INSET_BOTTOM_VALUE = 29, // f32 (29-32)

  MARGIN_LEFT_TYPE = 33,
  MARGIN_RIGHT_TYPE = 34,
  MARGIN_TOP_TYPE = 35,
  MARGIN_BOTTOM_TYPE = 36,
  MARGIN_LEFT_VALUE = 37, // f32 (37-40)
  MARGIN_RIGHT_VALUE = 41, // f32 (41-44)
  MARGIN_TOP_VALUE = 45, // f32 (45-48)
  MARGIN_BOTTOM_VALUE = 49, // f32 (49-52)

  PADDING_LEFT_TYPE = 53,
  PADDING_RIGHT_TYPE = 54,
  PADDING_TOP_TYPE = 55,
  PADDING_BOTTOM_TYPE = 56,
  PADDING_LEFT_VALUE = 57, // f32 (57-60)
  PADDING_RIGHT_VALUE = 61, // f32 (61-64)
  PADDING_TOP_VALUE = 65, // f32 (65-68)
  PADDING_BOTTOM_VALUE = 69, // f32 (69-72)

  BORDER_LEFT_TYPE = 73,
  BORDER_RIGHT_TYPE = 74,
  BORDER_TOP_TYPE = 75,
  BORDER_BOTTOM_TYPE = 76,
  BORDER_LEFT_VALUE = 77, // f32 (77-80)
  BORDER_RIGHT_VALUE = 81, // f32 (81-84)
  BORDER_TOP_VALUE = 85, // f32 (85-88)
  BORDER_BOTTOM_VALUE = 89, // f32 (89-92)

  FLEX_GROW = 93, // f32 (93-96)
  FLEX_SHRINK = 97, // f32 (97-100)

  FLEX_BASIS_TYPE = 101,
  FLEX_BASIS_VALUE = 102, // f32 (102-105)

  WIDTH_TYPE = 106,
  HEIGHT_TYPE = 107,
  WIDTH_VALUE = 108, // f32 (108-111)
  HEIGHT_VALUE = 112, // f32 (112-115)

  MIN_WIDTH_TYPE = 116,
  MIN_HEIGHT_TYPE = 117,
  MIN_WIDTH_VALUE = 118, // f32 (118-121)
  MIN_HEIGHT_VALUE = 122, // f32 (122-125)

  MAX_WIDTH_TYPE = 126,
  MAX_HEIGHT_TYPE = 127,
  MAX_WIDTH_VALUE = 128, // f32 (128-131)
  MAX_HEIGHT_VALUE = 132, // f32 (132-135)

  GAP_ROW_TYPE = 136,
  GAP_COLUMN_TYPE = 137,
  GAP_ROW_VALUE = 138, // f32 (138-141)
  GAP_COLUMN_VALUE = 142, // f32 (142-145)

  ASPECT_RATIO = 146, // f32 (146-149)
  GRID_AUTO_FLOW = 150,
  GRID_COLUMN_START_TYPE = 151,
  GRID_COLUMN_END_TYPE = 152,
  GRID_ROW_START_TYPE = 153,
  GRID_ROW_END_TYPE = 154,
  GRID_COLUMN_START_VALUE = 155, // f32 (155-158)
  GRID_COLUMN_END_VALUE = 159, // f32 (159-162)
  GRID_ROW_START_VALUE = 163, // f32 (163-166)
  GRID_ROW_END_VALUE = 167, // f32 (167-170)
  SCROLLBAR_WIDTH = 171, // f32 (171-174)
  ALIGN = 175,
  BOX_SIZING = 176,
  OVERFLOW = 177,
  ITEM_IS_TABLE = 178,
  ITEM_IS_REPLACED = 179,
  DISPLAY_MODE = 180,
  FORCE_INLINE = 181,
  MIN_CONTENT_WIDTH = 182, // f32 (182-185)
  MIN_CONTENT_HEIGHT = 186, // f32 (186-189)
  MAX_CONTENT_WIDTH = 190, // f32 (190-193)
  MAX_CONTENT_HEIGHT = 194, // f32 (194-197)

  BORDER_LEFT_STYLE = 198,
  BORDER_RIGHT_STYLE = 199,
  BORDER_TOP_STYLE = 200,
  BORDER_BOTTOM_STYLE = 201,

  BORDER_LEFT_COLOR = 202, // u32 (202-205)
  BORDER_RIGHT_COLOR = 206, // u32 (206-209)
  BORDER_TOP_COLOR = 210, // u32 (210-213)
  BORDER_BOTTOM_COLOR = 214, // u32 (214-217)

  // Elliptical radii: eight types, eight values, then four squircle exponents.
  BORDER_RADIUS_TOP_LEFT_X_TYPE = 218,
  BORDER_RADIUS_TOP_LEFT_Y_TYPE = 219,
  BORDER_RADIUS_TOP_RIGHT_X_TYPE = 220,
  BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 221,
  BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 222,
  BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 223,
  BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 224,
  BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 225,
  BORDER_RADIUS_TOP_LEFT_X_VALUE = 226, // f32 (226-229)
  BORDER_RADIUS_TOP_LEFT_Y_VALUE = 230, // f32 (230-233)
  BORDER_RADIUS_TOP_RIGHT_X_VALUE = 234, // f32 (234-237)
  BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238, // f32 (238-241)
  BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 242, // f32 (242-245)
  BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 246, // f32 (246-249)
  BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 250, // f32 (250-253)
  BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 254, // f32 (254-257)
  BORDER_RADIUS_TOP_LEFT_EXPONENT = 258, // f32 (258-261)
  BORDER_RADIUS_TOP_RIGHT_EXPONENT = 262, // f32 (262-265)
  BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 266, // f32 (266-269)
  BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270, // f32 (270-273)

  FLOAT = 274,
  CLEAR = 275,
  OBJECT_FIT = 276,

  FONT_METRICS_ASCENT_OFFSET = 277, // f32 (277-280)
  FONT_METRICS_DESCENT_OFFSET = 281, // f32 (281-284)
  FONT_METRICS_X_HEIGHT_OFFSET = 285, // f32 (285-288)
  FONT_METRICS_LEADING_OFFSET = 289, // f32 (289-292)
  FONT_METRICS_CAP_HEIGHT_OFFSET = 293, // f32 (293-296)
  VERTICAL_ALIGN_OFFSET_OFFSET = 297, // f32 (297-300)
  VERTICAL_ALIGN_IS_PERCENT_OFFSET = 301,
  VERTICAL_ALIGN_ENUM_OFFSET = 302,
  FIRST_BASELINE_OFFSET = 306, // f32 (306-309), preserves the three reserved bytes after vertical-align
  Z_INDEX = 310, // i32 (310-313)
  ITEM_IS_LIST = 314,
  ITEM_IS_LIST_ITEM = 315,
  LIST_STYLE_POSITION = 316,
  LIST_STYLE_TYPE = 317,
  LIST_STYLE_POSITION_STATE = 318,
  LIST_STYLE_TYPE_STATE = 319,
  REF_COUNT = 320, // u32 (320-323), copy-on-write share count

  // Inherited text fields. A *_STATE byte is nonzero once the node sets the field.
  FONT_COLOR = 324, // u32 (324-327)
  FONT_COLOR_STATE = 328,
  FONT_SIZE = 329, // f32 (329-332)
  FONT_SIZE_TYPE = 333,
  FONT_SIZE_STATE = 334,
  FONT_WEIGHT = 335, // i32 (335-338)
  FONT_WEIGHT_STATE = 339,
  FONT_STYLE_SLANT = 340, // i32 (340-343)
  FONT_STYLE_TYPE = 344,
  FONT_STYLE_STATE = 345,
  FONT_FAMILY_STATE = 346,
  FONT_RESOLVED_DIRTY = 347,
  BACKGROUND_COLOR = 348, // u32 (348-351)
  BACKGROUND_COLOR_STATE = 352,
  BACKGROUND_COLOR_TYPE = 353,
  DECORATION_LINE = 354,
  DECORATION_LINE_STATE = 355,
  DECORATION_COLOR = 356, // u32 (356-359)
  DECORATION_COLOR_STATE = 360,
  DECORATION_STYLE = 361,
  DECORATION_STYLE_STATE = 362,
  LETTER_SPACING = 363, // f32 (363-366)
  LETTER_SPACING_STATE = 367,
  TEXT_WRAP = 368,
  TEXT_WRAP_STATE = 369,
  WHITE_SPACE = 370,
  WHITE_SPACE_STATE = 371,
  TEXT_TRANSFORM = 372,
  TEXT_TRANSFORM_STATE = 373,
  TEXT_ALIGN = 374,
  TEXT_ALIGN_STATE = 375,
  TEXT_JUSTIFY = 376,
  TEXT_JUSTIFY_STATE = 377,
  TEXT_INDENT = 378, // f32 (378-381)
  TEXT_INDENT_TYPE = 382, // 0 px, 1 %
  TEXT_INDENT_STATE = 383,
  LINE_HEIGHT = 384, // f32 (384-387)
  LINE_HEIGHT_STATE = 388,
  LINE_HEIGHT_TYPE = 389,
  DECORATION_THICKNESS = 390, // f32 (390-393)
  DECORATION_THICKNESS_STATE = 394,
  TEXT_SHADOW_STATE = 395,
  TEXT_OVERFLOW = 396,
  TEXT_OVERFLOW_STATE = 397,

  // Which StateKeys a pseudo-class buffer sets explicitly (same bit layout).
  PSEUDO_SET_MASK_LOW = 398, // i64 (398-405)
  PSEUDO_SET_MASK_HIGH = 406, // i64 (406-413)

  // 414-418 free.
  FONT_VARIANT_NUMERIC = 419, // bitmask
  FONT_VARIANT_NUMERIC_STATE = 420,

  // Up to six inline transform ops, or a full matrix.
  TRANSFORM_COUNT = 422, // number of inline ops (0-6)
  TRANSFORM_FLAGS = 423, // bit 0 HAS_MATRIX, bit 1 IS_3D
  TRANSFORM_OP_0 = 424, // bytes(12) (424-435), type(u8) + pad(3) + a(f32) + b(f32)
  TRANSFORM_OP_1 = 436, // bytes(12) (436-447)
  TRANSFORM_OP_2 = 448, // bytes(12) (448-459)
  TRANSFORM_OP_3 = 460, // bytes(12) (460-471)
  TRANSFORM_OP_4 = 472, // bytes(12) (472-483)
  TRANSFORM_OP_5 = 484, // bytes(12) (484-495)
  TRANSFORM_MATRIX = 496, // bytes(64) (496-559), 16 x f32, 4x4 column-major

  OBJECT_POSITION_X_TYPE = 560, // 0 px, 1 %, 2 keyword
  OBJECT_POSITION_Y_TYPE = 561,
  OBJECT_POSITION_X_VALUE = 562, // f32 (562-565)
  OBJECT_POSITION_Y_VALUE = 566, // f32 (566-569)
  OBJECT_POSITION_STATE = 570,
  WRITING_MODE = 571,
  WRITING_MODE_STATE = 572,
  UNICODE_BIDI = 573,
  UNICODE_BIDI_STATE = 574,
  HYPHENS = 575,
  HYPHENS_STATE = 576,
  CARET_COLOR = 577, // u32 (577-580)
  CARET_COLOR_STATE = 581,
  WORD_SPACING = 582, // f32 (582-585)
  WORD_SPACING_TYPE = 586, // 0 px, 1 %, 2 normal
  WORD_SPACING_STATE = 587,
  FONT_STRETCH = 588, // i32 (588-591), percentage x 100
  FONT_STRETCH_STATE = 592,
  LINE_CLAMP = 593, // i32 (593-596), max lines, 0 none
  LINE_CLAMP_STATE = 597,
  TRANSFORM_ORIGIN_X_TYPE = 598, // 0 px, 1 %
  TRANSFORM_ORIGIN_Y_TYPE = 599,
  TRANSFORM_ORIGIN_X_VALUE = 600, // f32 (600-603)
  TRANSFORM_ORIGIN_Y_VALUE = 604, // f32 (604-607)
  TRANSFORM_ORIGIN_STATE = 608,
  TEXT_ORIENTATION = 609, // 0 mixed, 1 upright, 2 sideways
  TEXT_ORIENTATION_STATE = 610,

  // CSS logical properties, mapped onto physical sides by the box's writing mode and direction.
  // A group's ORDER bytes are its physical slots (top, right, bottom, left; sizes: width, height,
  // min-width, min-height, max-width, max-height) then its logical ones in the order below: 0
  // never written, else the write's LOGICAL_SEQ stamp. A logical value applies to the side it
  // maps to when it was written after that side's physical one. Types are the physical group's.
  LOGICAL_SEQ = 611,
  MARGIN_ORDER = 612, // bytes(8) (612-619)
  MARGIN_BLOCK_START_TYPE = 620,
  MARGIN_INLINE_END_TYPE = 621,
  MARGIN_BLOCK_END_TYPE = 622,
  MARGIN_INLINE_START_TYPE = 623,
  MARGIN_BLOCK_START_VALUE = 624, // f32 (624-627)
  MARGIN_INLINE_END_VALUE = 628, // f32 (628-631)
  MARGIN_BLOCK_END_VALUE = 632, // f32 (632-635)
  MARGIN_INLINE_START_VALUE = 636, // f32 (636-639)
  PADDING_ORDER = 640, // bytes(8) (640-647)
  PADDING_BLOCK_START_TYPE = 648,
  PADDING_INLINE_END_TYPE = 649,
  PADDING_BLOCK_END_TYPE = 650,
  PADDING_INLINE_START_TYPE = 651,
  PADDING_BLOCK_START_VALUE = 652, // f32 (652-655)
  PADDING_INLINE_END_VALUE = 656, // f32 (656-659)
  PADDING_BLOCK_END_VALUE = 660, // f32 (660-663)
  PADDING_INLINE_START_VALUE = 664, // f32 (664-667)
  INSET_ORDER = 668, // bytes(8) (668-675)
  INSET_BLOCK_START_TYPE = 676,
  INSET_INLINE_END_TYPE = 677,
  INSET_BLOCK_END_TYPE = 678,
  INSET_INLINE_START_TYPE = 679,
  INSET_BLOCK_START_VALUE = 680, // f32 (680-683)
  INSET_INLINE_END_VALUE = 684, // f32 (684-687)
  INSET_BLOCK_END_VALUE = 688, // f32 (688-691)
  INSET_INLINE_START_VALUE = 692, // f32 (692-695)
  SIZE_ORDER = 696, // bytes(12) (696-707)
  INLINE_SIZE_TYPE = 708,
  BLOCK_SIZE_TYPE = 709,
  MIN_INLINE_SIZE_TYPE = 710,
  MIN_BLOCK_SIZE_TYPE = 711,
  MAX_INLINE_SIZE_TYPE = 712,
  MAX_BLOCK_SIZE_TYPE = 713,
  INLINE_SIZE_VALUE = 714, // f32 (714-717)
  BLOCK_SIZE_VALUE = 718, // f32 (718-721)
  MIN_INLINE_SIZE_VALUE = 722, // f32 (722-725)
  MIN_BLOCK_SIZE_VALUE = 726, // f32 (726-729)
  MAX_INLINE_SIZE_VALUE = 730, // f32 (730-733)
  MAX_BLOCK_SIZE_VALUE = 734, // f32 (734-737)
  TEXT_COMBINE_UPRIGHT = 738, // 0 none, 1 all, 2-4 digits (that many)
  TEXT_COMBINE_UPRIGHT_STATE = 739,
  TEXT_SPACING_TRIM = 740, // 0 normal, 1 space-all, 2 space-first, 3 trim-start, 4 trim-both, 5 trim-all, 6 auto
  TEXT_SPACING_TRIM_STATE = 741,
  VISIBILITY = 742, // 0 visible, 1 hidden, 2 collapse
  FONT_FEATURES_REVISION = 743, // Rust-owned OpenType feature settings change counter
  BOX_SHADOW_REVISION = 744, // u32 (744-747), Rust-owned box shadow records change counter
  TEXT_SHADOW_REVISION = 748, // u32 (748-751), Rust-owned text shadow records change counter
  FILTER_REVISION = 752, // u32 (752-755), Rust-owned filter records change counter
  BACKDROP_FILTER_REVISION = 756, // u32 (756-759), Rust-owned backdrop-filter records change counter
  BACKGROUND_REVISION = 760, // u32 (760-763), Rust-owned background layers change counter
  TRANSFORM_REVISION = 764, // u32 (764-767), Rust-owned CSS transform list change counter
  CLIP_PATH_REVISION = 768, // u32 (768-771), Rust-owned CSS clip-path change counter
  MASK_REVISION = 772, // u32 (772-775), Rust-owned mask layer list change counter
  BORDER_IMAGE_REVISION = 776, // u32 (776-779), Rust-owned border-image change counter
  MASK_BORDER_REVISION = 780, // u32 (780-783), Rust-owned mask-border change counter
  TEXT_OVERFLOW_TOKEN = 784, // i64 (784-791), Rust-owned text-overflow string handle
  // </style-keys:offsets>
}

export type OverFlow = 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto';

// <style-keys:grid-properties>
const enum GridProperty {
  GridAutoRows = 0,
  GridAutoColumns = 1,
  GridColumn = 2,
  GridColumnStart = 3,
  GridColumnEnd = 4,
  GridRow = 5,
  GridRowStart = 6,
  GridRowEnd = 7,
  GridTemplateRows = 8,
  GridTemplateColumns = 9,
  GridArea = 10,
  GridTemplateAreas = 11,
}
// </style-keys:grid-properties>

function windowsNativeStyle(nativeView: any) {
  return nativeView?.Style;
}

function windowsSetGrid(nativeView: any, property: GridProperty, value: string, fontSize = 0) {
  const s = windowsNativeStyle(nativeView);
  if (!s) return;
  const [_, em, root, width, height] = numericCssContext(value, fontSize);
  s.SetGridCss(property, value, em, root, width, height);
  // Grid values live outside the fixed style buffer. SyncStyle invalidates
  // XAML measure after the Rust write.
  (nativeView as NativeScript.Mason.IMasonElement).SyncStyle(-1, -1, -1, -1);
}

// The buffer holds device pixels; `px` on the way out means a CSS pixel, the
// same as on the way in, so a get/set round-trip is lossless.
function parseDimension(type: number, value: number): DimensionLength {
  switch (type) {
    case 0:
      return 'auto';
    case 1:
      return { value: layout.toDeviceIndependentPixels(value), unit: 'px' };
    case 2:
      return { value, unit: '%' };
    case 3:
      return 'min-content';
    case 4:
      return 'max-content';
    case 5:
      return 'fit-content';
    case 6:
      return `fit-content(${layout.toDeviceIndependentPixels(value)}px)`;
    case 7:
      return `fit-content(${value * 100}%)`;
    case 8:
      return 'stretch';
    case 9:
      return 'content';
  }
}

function parseLengthPercentageAuto(type: number, value: number): LengthAuto {
  return parseDimension(type, value) as LengthAuto;
}

// CSS `px` is a CSS pixel, which is the same size as a dip — so it scales with
// the device, exactly as on the web. This deliberately differs from
// @nativescript/core, where `px` means a literal device pixel; `dppx` is the
// escape hatch for that meaning.
const DEVICE_PIXEL_UNIT = 'dppx';

function isDevicePixelToken(token: string): boolean {
  return token.trim().toLowerCase().endsWith(DEVICE_PIXEL_UNIT);
}

// A declaration that parses to a non-finite number (`1e999px`, `calc(infinity *
// 1px)` after core evaluates it) is not usable; treat it as 0, matching how the
// existing parsers already handle an unparsable value.
function finite(n: number): number {
  if (Number.isFinite(n)) {
    return n;
  }
  reportCssDiagnostic({ kind: 'unparsable-value', name: 'length', value: String(n), detail: 'not a finite number, treated as 0' });
  return 0;
}

const EM_UNIT = /em/i;

// Plain lengths parsed once: px, dip and bare numbers in CSS px (the density can change), % as a 0-1 fraction.
type PlainLength = { percent: boolean; value: number };
const plainLengths = new Map<string, PlainLength | null>();

function plainLength(token: string): PlainLength | null {
  let plain = plainLengths.get(token);
  if (plain === undefined) {
    const fields = expandCssShorthand('length-value', token);
    plain = null;
    if (fields) {
      const [value, unit] = fields;
      const amount = Number(value);
      if (unit === '%') plain = { percent: true, value: amount / 100 };
      else if (unit === '' || unit === 'px' || unit === 'dip') plain = { percent: false, value: amount };
    }
    if (plainLengths.size >= 512) plainLengths.clear();
    plainLengths.set(token, plain);
  }
  return plain;
}

function numericCssContext(value: string, emBasis?: number, scale = layout.toDevicePixels(1)): [number, number, number, number, number] {
  let width = 0;
  let height = 0;
  if (VIEWPORT_UNIT_TEXT.test(value.toLowerCase())) {
    noteViewportUnit();
    width = cssUnits.viewportWidth;
    height = cssUnits.viewportHeight;
    if (width <= 0 || height <= 0) {
      reportCssDiagnostic({ kind: 'unsupported-unit', name: 'length', value, detail: 'viewport size not known yet, resolved to 0' });
      width = height = 0;
    }
  }
  return [scale, emBasis ?? 0, cssUnits.rootFontSize, width, height];
}

function resolveLengthInRust(value: string, emBasis?: number, fontSize = false) {
  return nativeCssLength(value, fontSize ? CssParseKind.FontSize : CssParseKind.Length, ...numericCssContext(value, emBasis));
}

function lengthMathResult(fields: ReturnType<typeof nativeCssLength>): CssMathResult | undefined {
  if (!fields) return undefined;
  const [kind, value] = fields;
  if (kind === 0) return { kind: 'number', value };
  if (kind === 1) return { kind: 'length', px: layout.toDeviceIndependentPixels(value) };
  if (kind === 2) return { kind: 'percent', percent: value * 100 };
  return undefined;
}

export function resolveCssLengthMath(value: string, emBasis?: number) {
  return lengthMathResult(resolveLengthInRust(value, emBasis));
}

/** Replaces math expressions which resolve before layout. */
export function resolveCssMathIn(value: string, emBasis?: number): string {
  return rewriteCssMath(value, (expression) => resolveCssLengthMath(expression, emBasis));
}

function fallbackDevicePx(value: string, raw: string | undefined, unit: string | undefined): number {
  const fn = /^([a-z-]+)\(/.exec(value);
  if (fn) {
    const detail = isCssMathFunction(value) ? `${fn[1]}() mixes % with a length, or doesn't parse, so it can't be evaluated before layout` : `${fn[1]}() is not evaluated here; it resolves only in a stylesheet, where core expands it first`;
    reportCssDiagnostic({ kind: 'not-implemented', name: 'length', value, detail });
    return 0;
  }
  if (unit && unit !== 'px' && unit !== 'dip') {
    reportCssDiagnostic({ kind: 'unsupported-unit', name: 'length', value, detail: `unknown unit "${unit}", treated as CSS px` });
  }
  return finite(Math.fround(layout.toDevicePixels(Number(raw ?? 0))));
}

/** Resolve a CSS length token to device pixels, including direct-setter compatibility. */
function tokenToDevicePx(value: string, emBasis?: number): number {
  const plain = plainLength(value);
  if (plain && !plain.percent) return layout.toDevicePixels(plain.value);
  const fields = resolveLengthInRust(value, emBasis);
  if (fields?.[0] === 0) return layout.toDevicePixels(fields[1]);
  if (fields?.[0] === 1) return fields[1];
  const [amount, unit] = expandCssShorthand('length-prefix', value) ?? [];
  return fallbackDevicePx(value.trim().toLowerCase(), amount, unit);
}

/**
 * Parse the `aspect-ratio` value into the single float the buffer holds.
 *
 * CSS allows `<number>`, a `<ratio>` (`2 / 3`), `auto`, and `auto` alongside a
 * ratio. The buffer is one f32 and NaN means "no ratio", so every shape has
 * to land here first — a raw `'2 / 3'` handed straight to `setFloat32` would
 * coerce to NaN.
 */
export function parseAspectRatio(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : Number.NaN;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return Number.NaN;
  }
  const ratio = expandCssShorthand('aspect-ratio', value)?.[0];
  if (ratio === undefined) {
    reportCssDiagnostic({ kind: 'unparsable-value', name: 'aspect-ratio', value, detail: 'expected a positive <number>, a <ratio> like "2 / 3", or auto' });
  }
  return ratio ? Number(ratio) : Number.NaN;
}

/**
 * Resolve a CSS length to the CSS pixels (== dips) core's `Length` speaks.
 *
 * core's own CSS properties (`width`/`height`/`min-*`/`max-*`) parse a
 * stylesheet declaration with `PercentLength.parse` — a bare `parseFloat` —
 * so `100vh` arrives as the number 100 and `px` as a device pixel rather
 * than Mason's CSS pixel. Returns `undefined` for anything that isn't a
 * plain length (`auto`, a percentage, a keyword, `calc()`), leaving those to
 * their existing paths.
 */
export function cssLengthToDip(value: unknown, emBasis?: number): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const plain = plainLength(value);
  if (plain) {
    return plain.percent ? undefined : plain.value;
  }
  const t = value.trim().toLowerCase();
  const resolved = resolveLengthInRust(t, emBasis);
  if (resolved) {
    if (resolved[0] === 0) return resolved[1];
    if (resolved[0] === 1) return layout.toDeviceIndependentPixels(resolved[1]);
    return undefined;
  }
  // Keep the existing fallback for unknown units in direct string setters.
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?[a-z]+$/.test(t)) return undefined;
  const [amount, unit] = expandCssShorthand('length-prefix', t) ?? [];
  return amount === undefined ? undefined : layout.toDeviceIndependentPixels(fallbackDevicePx(t, amount, unit));
}

const SIZING_KEYWORD = /^(min-content|max-content|fit-content|stretch|content|fit-content\(.+\))$/i;

export function isSizingKeyword(value: unknown): value is string {
  return typeof value === 'string' && SIZING_KEYWORD.test(value.trim());
}

/** Authored CSS math that may need the containing size. Core can carry it as a unit string. */
export function layoutMathText(value: unknown): string | undefined {
  const length = value as { css?: unknown; unit?: unknown } | null;
  const text = typeof value === 'string' ? value : length?.css ?? length?.unit;
  return typeof text === 'string' && text.includes('%') && isCssMathFunction(text) ? text : undefined;
}

/** The keyword carried as the unit of a core length object, if any. */
function sizingKeywordOf(value: { unit?: unknown }): string | undefined {
  return isSizingKeyword(value?.unit) ? (value.unit as string) : undefined;
}

function layoutLengthFromString(value: string, kind: LogicalKind, emBasis?: number): { type: number; value: number } {
  const pointType = kind === 'length' ? 0 : 1;
  const percentType = pointType + 1;
  const plain = plainLength(value);
  if (plain) {
    return plain.percent ? { type: percentType, value: plain.value } : { type: pointType, value: layout.toDevicePixels(plain.value) };
  }
  if (kind !== 'length' && !value.trim()) return { type: 0, value: 0 };
  const mode = kind === 'dimension' ? CssParseKind.Dimension : kind === 'auto' ? CssParseKind.LengthAuto : CssParseKind.Length;
  const fields = nativeCssLength(value, mode, ...numericCssContext(value, emBasis));
  if (fields) {
    const [type, amount] = fields;
    if (kind !== 'length') return { type, value: amount };
    if (type === 2) return { type: percentType, value: amount };
    return { type: pointType, value: type === 0 ? layout.toDevicePixels(amount) : amount };
  }
  const [amount, unit] = expandCssShorthand('length-prefix', value) ?? [];
  if (unit === '%') return { type: percentType, value: Number(amount) / 100 };
  return { type: pointType, value: fallbackDevicePx(value.trim().toLowerCase(), amount, unit) };
}

function parseLengthPercentage(type: number, value: number): Length {
  switch (type) {
    case 0:
      return { value: layout.toDeviceIndependentPixels(value), unit: 'px' };
    case 1:
      return { value, unit: '%' };
  }
}

const enum DisplayMode {
  None = 0,
  Inline = 1,
  Box = 2,
}

// The 128-bit dirty mask as four signed 32-bit words, low to high (the
// syncStyleParts argument order). Plain numbers: BigInt ops allocate.
class StateKeys {
  private constructor(
    public readonly w0: number,
    public readonly w1: number,
    public readonly w2: number,
    public readonly w3: number,
  ) {}

  private static flag(n: number): StateKeys {
    const bit = (1 << (n & 31)) | 0;
    switch (n >> 5) {
      case 0:
        return new StateKeys(bit, 0, 0, 0);
      case 1:
        return new StateKeys(0, bit, 0, 0);
      case 2:
        return new StateKeys(0, 0, bit, 0);
      default:
        return new StateKeys(0, 0, 0, bit);
    }
  }

  static readonly NONE = new StateKeys(0, 0, 0, 0);
  // <style-keys:state> generated from tools/scripts/style-keys/style-keys.schema, run `npm run gen:style-keys`
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
  static readonly INVALIDATE_TEXT = StateKeys.flag(49); // Kotlin's INVALIDATE_TEXT is every bit
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
  static readonly TEXT_INDENT = StateKeys.flag(79);
  static readonly LINE_CLAMP = StateKeys.flag(80);
  static readonly TRANSFORM_ORIGIN = StateKeys.flag(81);
  static readonly TEXT_ORIENTATION = StateKeys.flag(82);
  static readonly TEXT_COMBINE_UPRIGHT = StateKeys.flag(83);
  static readonly TEXT_SPACING_TRIM = StateKeys.flag(84);
  static readonly VISIBILITY = StateKeys.flag(85);
  static readonly FONT_FEATURE_SETTINGS = StateKeys.flag(86);
  // </style-keys:state>


  // <style-keys:state-groups> generated from tools/scripts/style-keys/style-keys.schema
  static readonly WINDOWS_TEXT_CHANGES = new StateKeys(0, -8519680, 388863, 0);
  static readonly FLOW_TYPE = new StateKeys(3, 2052, 0, 0);
  // </style-keys:state-groups>

  /** The mask as one unsigned 128-bit value (tests and diagnostics). */
  get bits(): bigint {
    return wordsToBigInt(this.w0, this.w1, this.w2, this.w3);
  }

  or(other: StateKeys): StateKeys {
    return new StateKeys(this.w0 | other.w0, this.w1 | other.w1, this.w2 | other.w2, this.w3 | other.w3);
  }

  and(other: StateKeys): StateKeys {
    return new StateKeys(this.w0 & other.w0, this.w1 & other.w1, this.w2 & other.w2, this.w3 & other.w3);
  }

  hasFlag(flag: StateKeys): boolean {
    return (this.w0 & flag.w0) !== 0 || (this.w1 & flag.w1) !== 0 || (this.w2 & flag.w2) !== 0 || (this.w3 & flag.w3) !== 0;
  }
}

function wordsToBigInt(w0: number, w1: number, w2: number, w3: number): bigint {
  return BigInt(w0 >>> 0) | (BigInt(w1 >>> 0) << 32n) | (BigInt(w2 >>> 0) << 64n) | (BigInt(w3 >>> 0) << 96n);
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

// Core's Windows currentApp() is the package folder; the app's files are in its app\ folder.
export function windowsAppFile(url: string): string {
  if (!url.startsWith('~/')) return url;
  const app = knownFolders.currentApp().path;
  if (__LINUX__) return app + '/' + url.slice(2);
  // Core's currentApp() is the package's app\ folder; older cores gave the package root.
  const root = /[\\/]app[\\/]?$/i.test(app) ? app.replace(/[\\/]$/, '') : app + '\\app';
  return root + '\\' + url.slice(2).replace(/\//g, '\\');
}

function positionFraction(token: string | undefined, axis: 'x' | 'y'): number | null {
  if (token == null) return null;
  const t = token.trim().toLowerCase();
  if (t === 'center') return 0.5;
  if (t === (axis === 'x' ? 'left' : 'top')) return 0;
  if (t === (axis === 'x' ? 'right' : 'bottom')) return 1;
  if (t.endsWith('%')) {
    const n = parseFloat(t);
    return Number.isFinite(n) ? n / 100 : null;
  }
  return null;
}

export function parseBoxPosition(value: string, fallback = 0.5): { x: number; y: number } {
  const parts = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let x: number | null = null;
  let y: number | null = null;
  for (const part of parts) {
    if ((part === 'top' || part === 'bottom') && y == null) y = positionFraction(part, 'y');
    else if ((part === 'left' || part === 'right') && x == null) x = positionFraction(part, 'x');
    else if (x == null) x = positionFraction(part, 'x');
    else if (y == null) y = positionFraction(part, 'y');
  }
  if (x != null || y != null) return { x: x ?? 0.5, y: y ?? 0.5 };
  return { x: fallback, y: fallback };
}

export function backgroundFit(size: string | null | undefined): number {
  const t = (size ?? '').trim().toLowerCase();
  if (t === 'cover') return 3;
  if (t === 'contain') return 2;
  if (t === '100%' || t === '100% 100%') return 1;
  return 0;
}

export function isSideList(value: string): boolean {
  return expandCssShorthand('margin', String(value ?? '').trim()) !== null;
}

/** One Windows border-radius corner in the buffer's encoding: type 0 = dip, 1 = percent as a 0-1 fraction. */
export type WindowsRadius = { type: 0 | 1; value: number };

/** Corners in CSS shorthand order. */
const RADIUS_KEYS = [
  ['tl', { xType: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, yType: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, xValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE, yValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE }],
  ['tr', { xType: StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, yType: StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, xValue: StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE, yValue: StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE }],
  ['br', { xType: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, yType: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, xValue: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE, yValue: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE }],
  ['bl', { xType: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, yType: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, xValue: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE, yValue: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE }],
] as const;

const resolvedRadii = new Map<string, number[] | null>();

function resolveBorderRadii(value: string, scale: number, emBasis?: number, singleCorner = false): number[] | null {
  const context = numericCssContext(value, emBasis, scale);
  const kind = singleCorner ? CssParseKind.BorderCornerRadius : CssParseKind.BorderRadius;
  const key = `${kind}:${context.join(',')}:${value}`;
  const cached = resolvedRadii.get(key);
  if (cached !== undefined) return cached;
  const fields = resolveCssValues(value, kind, context);
  if (resolvedRadii.size >= 256) resolvedRadii.clear();
  resolvedRadii.set(key, fields);
  return fields;
}

/** Returns the horizontal radii in DIPs or percentage fractions. */
export function parseBorderRadiusShorthand(value: string, emBasis?: number): { tl: WindowsRadius; tr: WindowsRadius; br: WindowsRadius; bl: WindowsRadius } {
  const fields = resolveBorderRadii(String(value ?? ''), 1, emBasis);
  const [tl, tr, br, bl] = RADIUS_KEYS.map<WindowsRadius>((_, index) => {
    const offset = index * CssLengthResultRecord.STRIDE;
    return {
      type: fields?.[offset + CssLengthResultRecord.KIND] === 2 ? 1 : 0,
      value: Math.max(0, fields?.[offset + CssLengthResultRecord.VALUE] ?? 0),
    };
  });
  return { tl, tr, br, bl };
}

/** Corner exponents in CSS corner order, or null when Rust rejects the value. */
export function parseCornerShape(value: string): [number, number, number, number] | null {
  const fields = expandCssShorthand('corner-shape', String(value ?? ''));
  if (!fields) return null;
  const [tl, tr, br, bl] = fields;
  return [Number(tl), Number(tr), Number(br), Number(bl)];
}

function borderWidthInDip(value: string, emBasis?: number): number | null {
  if (!value) return null;
  // Accept the existing `dp` spelling for a numeric Windows width.
  if (/^[+-]?\d*\.?\d+dp$/i.test(value)) return parseFloat(value);
  return cssLengthToDip(value, emBasis) ?? null;
}

/** `currentcolor`, the decoration color's unset value (Constants.UNSET_COLOR on Android). */
export const DECORATION_COLOR_UNSET = 0xdeadbeef;

const DECORATION_LINE_BITS: Record<string, number> = { underline: 1, overline: 2, 'line-through': 4 };
const DECORATION_STYLES = ['solid', 'double', 'dotted', 'dashed', 'wavy'];

function decorationField(name: string, value: string): string | null {
  return expandCssShorthand(name, String(value ?? ''))?.[0] ?? null;
}

export function parseTextDecorationLine(value: string): number | null {
  const field = decorationField('text-decoration-line', value);
  return field == null ? null : Number(field);
}

export function textDecorationLineToCss(mask: number): string {
  if (mask === 8) return 'spelling-error';
  if (mask === 16) return 'grammar-error';
  const names = Object.keys(DECORATION_LINE_BITS).filter((name) => (mask & DECORATION_LINE_BITS[name]) !== 0);
  return names.length ? names.join(' ') : 'none';
}

export function parseTextDecorationStyle(value: string): number | null {
  const field = decorationField('text-decoration-style', value);
  return field == null ? null : Number(field);
}

export function textDecorationStyleToCss(value: number): string {
  return DECORATION_STYLES[value] ?? 'solid';
}

export function parseTextDecorationColor(value: string): number | null {
  const field = decorationField('text-decoration-color', value);
  return field == null ? null : Number(field);
}

export function parseTextDecoration(value: string, resolveLength: (token: string) => number | undefined): { line: number; style: number; color: number; thickness: number } | null {
  const fields = expandCssShorthand('text-decoration', String(value ?? ''));
  if (!fields) return null;
  const [line, style, color, length] = fields;
  const thickness = length === '' ? 0 : resolveLength(length);
  return thickness == null ? null : { line: Number(line), style: Number(style), color: Number(color), thickness };
}

function parseSidesColorShorthand(value: string): { t: number | null; r: number | null; b: number | null; l: number | null } {
  const fields = expandCssShorthand('border-color-values', String(value ?? ''));
  const [t, r, b, l] = fields?.map((field) => field ? Number(field) : null) ?? [null, null, null, null];
  return { t, r, b, l };
}

// CSS logical properties (see StyleKeys.LOGICAL_SEQ): each group's write stamps, logical slots
// and the encoding its values use. Size slots: inline, block, min-inline, min-block,
// max-inline, max-block.
type LogicalKind = 'auto' | 'length' | 'dimension';
interface LogicalGroup {
  order: number;
  half: number;
  types: number;
  values: number;
  kind: (slot: number) => LogicalKind;
  state: (slot: number) => StateKeys;
}
const LOGICAL_GROUPS: Record<'margin' | 'padding' | 'inset' | 'size', LogicalGroup> = {
  margin: { order: StyleKeys.MARGIN_ORDER, half: 4, types: StyleKeys.MARGIN_BLOCK_START_TYPE, values: StyleKeys.MARGIN_BLOCK_START_VALUE, kind: () => 'auto', state: () => StateKeys.MARGIN },
  padding: { order: StyleKeys.PADDING_ORDER, half: 4, types: StyleKeys.PADDING_BLOCK_START_TYPE, values: StyleKeys.PADDING_BLOCK_START_VALUE, kind: () => 'length', state: () => StateKeys.PADDING },
  inset: { order: StyleKeys.INSET_ORDER, half: 4, types: StyleKeys.INSET_BLOCK_START_TYPE, values: StyleKeys.INSET_BLOCK_START_VALUE, kind: () => 'auto', state: () => StateKeys.INSET },
  size: {
    order: StyleKeys.SIZE_ORDER,
    half: 6,
    types: StyleKeys.INLINE_SIZE_TYPE,
    values: StyleKeys.INLINE_SIZE_VALUE,
    kind: (slot) => (slot < 2 ? 'dimension' : 'auto'),
    state: (slot) => (slot < 2 ? StateKeys.SIZE : slot < 4 ? StateKeys.MIN_SIZE : StateKeys.MAX_SIZE),
  },
};
export type LogicalGroupName = keyof typeof LOGICAL_GROUPS;

// <style-keys:layout-math>
const LAYOUT_MATH_TYPE = 10;

const logicalLayoutProperties: Record<LogicalGroupName, readonly string[]> = {
  size: ['inline-size', 'block-size', 'min-inline-size', 'min-block-size', 'max-inline-size', 'max-block-size'],
  margin: ['margin-block-start', 'margin-inline-end', 'margin-block-end', 'margin-inline-start'],
  padding: ['padding-block-start', 'padding-inline-end', 'padding-block-end', 'padding-inline-start'],
  inset: ['inset-block-start', 'inset-inline-end', 'inset-block-end', 'inset-inline-start'],
};

function layoutMathState(property: string): StateKeys | undefined {
  switch (property) {
    case 'width': return StateKeys.SIZE;
    case 'height': return StateKeys.SIZE;
    case 'min-width': return StateKeys.MIN_SIZE;
    case 'min-height': return StateKeys.MIN_SIZE;
    case 'max-width': return StateKeys.MAX_SIZE;
    case 'max-height': return StateKeys.MAX_SIZE;
    case 'flex-basis': return StateKeys.FLEX_BASIS;
    case 'row-gap': return StateKeys.GAP;
    case 'column-gap': return StateKeys.GAP;
    case 'top': return StateKeys.INSET;
    case 'right': return StateKeys.INSET;
    case 'bottom': return StateKeys.INSET;
    case 'left': return StateKeys.INSET;
    case 'margin-top': return StateKeys.MARGIN;
    case 'margin-right': return StateKeys.MARGIN;
    case 'margin-bottom': return StateKeys.MARGIN;
    case 'margin-left': return StateKeys.MARGIN;
    case 'padding-top': return StateKeys.PADDING;
    case 'padding-right': return StateKeys.PADDING;
    case 'padding-bottom': return StateKeys.PADDING;
    case 'padding-left': return StateKeys.PADDING;
    case 'inline-size': return StateKeys.SIZE;
    case 'block-size': return StateKeys.SIZE;
    case 'min-inline-size': return StateKeys.MIN_SIZE;
    case 'min-block-size': return StateKeys.MIN_SIZE;
    case 'max-inline-size': return StateKeys.MAX_SIZE;
    case 'max-block-size': return StateKeys.MAX_SIZE;
    case 'inset-block-start': return StateKeys.INSET;
    case 'inset-inline-end': return StateKeys.INSET;
    case 'inset-block-end': return StateKeys.INSET;
    case 'inset-inline-start': return StateKeys.INSET;
    case 'margin-block-start': return StateKeys.MARGIN;
    case 'margin-inline-end': return StateKeys.MARGIN;
    case 'margin-block-end': return StateKeys.MARGIN;
    case 'margin-inline-start': return StateKeys.MARGIN;
    case 'padding-block-start': return StateKeys.PADDING;
    case 'padding-inline-end': return StateKeys.PADDING;
    case 'padding-block-end': return StateKeys.PADDING;
    case 'padding-inline-start': return StateKeys.PADDING;
  }
}
// </style-keys:layout-math>
const LOGICAL_STAMPS: ReadonlyArray<[order: number, length: number]> = [
  [StyleKeys.MARGIN_ORDER, 8],
  [StyleKeys.PADDING_ORDER, 8],
  [StyleKeys.INSET_ORDER, 8],
  [StyleKeys.SIZE_ORDER, 12],
];
const stampUsed = new Uint8Array(256);
const stampRank = new Uint8Array(256);

/** A length in the buffer's encoding for `kind` (auto: margins, insets, min/max; length: padding; dimension: sizes). */
function layoutLengthValue(value: unknown, kind: LogicalKind, emBasis: number | undefined): { type: number; value: number } | undefined {
  switch (typeof value) {
    case 'string':
      return layoutLengthFromString(value, kind, emBasis);
    case 'number':
      return { type: kind === 'length' ? 0 : 1, value: layout.toDevicePixels(value) };
    case 'object': {
      const length = value as { unit?: string; value: number } | null;
      if (!length) return undefined;
      switch (length.unit) {
        case 'dip':
        case 'px':
          return { type: kind === 'length' ? 0 : 1, value: layout.toDevicePixels(length.value) };
        case '%':
          return { type: kind === 'length' ? 1 : 2, value: length.value };
      }
      const keyword = kind === 'dimension' ? sizingKeywordOf(length) : undefined;
      const text = keyword ?? layoutMathText(length);
      return text ? layoutLengthFromString(text, kind, emBasis) : undefined;
    }
  }
  return undefined;
}

// text-spacing-trim keywords, in their buffer order.

const i32Buffer = new Uint8Array(Int32Array.BYTES_PER_ELEMENT * 4);
const i32View = new Int32Array(i32Buffer.buffer);

function parseCssColor(value: string): number | null {
  const field = expandCssShorthand('color-value', value)?.[0];
  return field == null ? null : Number(field);
}

const cssKeywordCodes = new Map<string, number | undefined>();

function cssKeywordCode(property: string, value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const key = `${property}:${value}`;
  if (cssKeywordCodes.has(key)) return cssKeywordCodes.get(key);
  const field = expandCssShorthand(`keyword:${property}`, value)?.[0];
  const code = field == null ? undefined : Number(field);
  if (cssKeywordCodes.size >= 256) cssKeywordCodes.clear();
  cssKeywordCodes.set(key, code);
  return code;
}

const colorArgbs = new Map<string, number | null>();

function normalizeColorValue(value: number | string | { argb?: number }): number | null {
  switch (typeof value) {
    case 'number':
      return value;
    case 'string': {
      let argb = colorArgbs.get(value);
      if (argb === undefined) {
        argb = parseCssColor(value);
        if (colorArgbs.size >= 512) colorArgbs.clear();
        colorArgbs.set(value, argb);
      }
      return argb;
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

/** Type 0 is device pixels and type 1 is percent. A valid z offset is ignored. */
export function parseTransformOrigin(value: string, emBasis?: number): { xType: number; x: number; yType: number; y: number } | null {
  const fields = resolveCssPosition(value, CssParseKind.TransformOrigin, ...numericCssContext(value, emBasis));
  if (!fields) return null;
  const [xType, x, yType, y] = fields;
  return { xType, x, yType, y };
}

const pendingSyncs: Style[] = [];
let syncsQueued = false;

function flushStyleSyncs() {
  syncsQueued = false;
  // A sync can dirty another style, which then queues a flush of its own.
  const styles = pendingSyncs.splice(0);
  let failure: unknown;
  for (const style of styles) {
    try {
      style._flushScheduledSync();
    } catch (e) {
      failure ??= e;
    }
  }
  if (failure !== undefined) throw failure;
}

function queueStyleSync(style: Style) {
  pendingSyncs.push(style);
  if (!syncsQueued) {
    syncsQueued = true;
    queueMicrotask(flushStyleSyncs);
  }
}

let nodeHelperShared: org.nativescript.mason.masonkit.NodeHelper | undefined;
export function nodeHelper(): org.nativescript.mason.masonkit.NodeHelper {
  return (nodeHelperShared ??= org.nativescript.mason.masonkit.NodeHelper.getShared());
}

function androidWritableStyleBuffer(nativeView: any): java.nio.ByteBuffer {
  if (typeof nativeView?.getWritableStyleBuffer === 'function') {
    return nativeView.getWritableStyleBuffer();
  }
  let style = (nativeView as org.nativescript.mason.masonkit.Element)?.getStyle?.();
  if (!style) {
    // if a non mason view is passed
    style = org.nativescript.mason.masonkit.Mason.getShared().styleForViewOrNode(nativeView);
  }
  return typeof style.getWritableValue === 'function' ? style.getWritableValue() : style.getValues();
}

let appleWritableStyleValues: boolean | undefined;
// Newer frameworks return the node's own (copied-on-write) buffer in one call.
function appleHasWritableStyleValues(nativeView: any): boolean {
  if (appleWritableStyleValues === undefined && nativeView) {
    appleWritableStyleValues = typeof nativeView.mason_writableStyleValues === 'function';
  }
  return !!appleWritableStyleValues;
}

/** Style slots per arena chunk; matches Rust's SLOTS_PER_CHUNK. */
const STYLE_SLOTS_PER_CHUNK = 64;
/** ArrayBuffers over the arena chunks, fetched once each; a style's DataView covers its own slot. */
const styleChunks: ArrayBuffer[] = [];
let styleSlots: boolean | undefined;
let androidMason: any;

/** The view's own style slot index (taking one if it shares a default), or -1. */
function styleSlot(nativeView: any): number {
  if (__ANDROID__) {
    if (styleSlots === undefined) {
      androidMason = org.nativescript.mason.masonkit.Mason.getShared();
      styleSlots = typeof androidMason.prepareStyleSlot === 'function';
    }
    return styleSlots && nativeView instanceof android.view.View ? androidMason.prepareStyleSlot(nativeView) : -1;
  }
  if (styleSlots === undefined && nativeView) {
    styleSlots = typeof nativeView.mason_prepareStyleSlot === 'function';
  }
  return styleSlots ? nativeView.mason_prepareStyleSlot() : -1;
}

/** The ArrayBuffer over arena chunk `chunk`, or undefined past the last chunk. */
function styleChunk(chunk: number): ArrayBuffer | undefined {
  let buffer = styleChunks[chunk];
  if (buffer === undefined) {
    if (__ANDROID__) {
      const data = androidMason.styleChunk(chunk);
      if (!data) return undefined;
      buffer = (<any>ArrayBuffer).from(data);
    } else {
      const data = (NSCMason.shared as any).styleChunk(chunk);
      if (!data) return undefined;
      buffer = interop.bufferFromData(data);
    }
    styleChunks[chunk] = buffer;
  }
  return buffer;
}

function windowsStyleValues(nativeView: any, foreign: boolean) {
  if (foreign && nativeView) return masonEngine().ForeignStyleValues(nativeView);
  if (nativeView?.Node) return masonEngine().StyleValues(nativeView);
  return NativeScript.Mason.Mason.Instance().CreateNode(false).Style.Values;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** A reset (core sends undefined for an unset property) or `initial`/`unset` becomes the CSS initial value. */
function cssInitialIfReset(value: string, initial: string): string {
  const v = value.trim().toLowerCase();
  return v === '' || v === 'initial' || v === 'unset' ? initial : value;
}

/** Serialize a CSS color parsed by the shared Rust grammar. */
export function cssColorToRgba(color: string): string | null {
  const argb = parseCssColor(color);
  if (argb == null) return null;
  const alpha = ((argb >>> 24) / 255).toFixed(4);
  return `rgba(${(argb >>> 16) & 255}, ${(argb >>> 8) & 255}, ${argb & 255}, ${+alpha})`;
}

// Style writes that resolved a viewport unit, kept so a viewport change can write them again, as
// a browser re-resolves vw/vh when the window resizes. Each setter is wrapped once below.
const viewportWrites = new WeakMap<object, Map<string | number, unknown>>();
const viewportStyles = new Set<WeakRef<object>>();
const writeTargets: object[] = [];
const writeNames: string[] = [];
const writeValues: unknown[] = [];
let writeDepth = 0;
const VIEWPORT_UNIT_TEXT = /\d(?:vw|vh|vmin|vmax)\b/i;

/** Marks a style write in progress, so a viewport unit it resolves is remembered against `target[name] = value`. */
export function beginStyleWrite(target: object, name: string, value: unknown): void {
  if (viewportStyles.size !== 0) viewportWrites.get(target)?.delete(name);
  writeTargets[writeDepth] = target;
  writeNames[writeDepth] = name;
  writeValues[writeDepth] = value;
  writeDepth++;
  // Android and iOS parse some CSS text natively, so the text itself marks a viewport unit.
  if (typeof value === 'string' && (value.indexOf('v') !== -1 || value.indexOf('V') !== -1) && VIEWPORT_UNIT_TEXT.test(value)) noteViewportUnit();
}

export function endStyleWrite(): void {
  writeDepth--;
  writeTargets[writeDepth] = writeValues[writeDepth] = undefined as never;
}

function noteViewportUnit() {
  if (!writeDepth) return;
  const index = writeDepth - 1;
  rememberViewportWrite(writeTargets[index], writeNames[index], writeValues[index]);
}

function rememberViewportWrite(target: object, name: string | number, value: unknown) {
  let writes = viewportWrites.get(target);
  if (!writes) {
    writes = new Map();
    viewportWrites.set(target, writes);
    viewportStyles.add(new WeakRef(target));
  }
  writes.set(name, value);
}

/** Writes every style property that used vw/vh/vmin/vmax again, against the current viewport. */
export function refreshViewportUnits(): void {
  for (const ref of viewportStyles) {
    const style = ref.deref() as Record<string, unknown> | undefined;
    const writes = style && viewportWrites.get(style);
    if (!style || !writes || !writes.size) {
      viewportStyles.delete(ref);
      // A later viewport write makes a new map, which tracks the style again.
      if (style) viewportWrites.delete(style);
      continue;
    }
    // A radius shorthand replaces its corner writes. Replay the snapshot in
    // declaration order so the corners written after it still take precedence.
    for (const [name, value] of Array.from(writes)) {
      if (typeof name === 'number') {
        const radius = style as unknown as Style;
        if (typeof value === 'string') radius._writeCornerCss(name, value);
        else radius._writeCornerLength(name, value);
      } else {
        style[name] = value;
      }
    }
  }
}

// Inherited text properties a stylesheet can drop back to inheriting: their *_STATE byte.
const INHERITED_TEXT_STATE = {
  writingMode: [StyleKeys.WRITING_MODE_STATE, StateKeys.WRITING_MODE],
  textOrientation: [StyleKeys.TEXT_ORIENTATION_STATE, StateKeys.TEXT_ORIENTATION],
  textCombineUpright: [StyleKeys.TEXT_COMBINE_UPRIGHT_STATE, StateKeys.TEXT_COMBINE_UPRIGHT],
  textSpacingTrim: [StyleKeys.TEXT_SPACING_TRIM_STATE, StateKeys.TEXT_SPACING_TRIM],
  hyphens: [StyleKeys.HYPHENS_STATE, StateKeys.HYPHENS],
  whiteSpace: [StyleKeys.WHITE_SPACE_STATE, StateKeys.WHITE_SPACE],
  wordSpacing: [StyleKeys.WORD_SPACING_STATE, StateKeys.WORD_SPACING],
  fontStretch: [StyleKeys.FONT_STRETCH_STATE, StateKeys.FONT_STRETCH],
} as const;

export type InheritedTextProperty = keyof typeof INHERITED_TEXT_STATE;

export class Style {
  // <style-keys:writes> generated from tools/scripts/style-keys/style-keys.schema
  private writeAlignContent(alignContent: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.ALIGN_CONTENT, alignContent);
    this.commitState(StateKeys.ALIGN_CONTENT);
  }

  private writeAlignItems(alignItems: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.ALIGN_ITEMS, alignItems);
    this.commitState(StateKeys.ALIGN_ITEMS);
  }

  private writeAlignSelf(alignSelf: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.ALIGN_SELF, alignSelf);
    this.commitState(StateKeys.ALIGN_SELF);
  }

  private writeAspectRatio(aspectRatio: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.ASPECT_RATIO, aspectRatio);
    this.commitState(StateKeys.ASPECT_RATIO);
  }

  private writeBackgroundColor(backgroundColor: number, backgroundColorState: number, backgroundColorType: number) {
    this.prepareMut();
    setUint32(this.style_view, StyleKeys.BACKGROUND_COLOR, backgroundColor);
    setUint8(this.style_view, StyleKeys.BACKGROUND_COLOR_STATE, backgroundColorState);
    setUint8(this.style_view, StyleKeys.BACKGROUND_COLOR_TYPE, backgroundColorType);
    this.commitState(StateKeys.BACKGROUND_COLOR);
  }

  private writeBorderBottomStyle(borderBottomStyle: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_BOTTOM_STYLE, borderBottomStyle);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  private writeBorderBottomWidth(borderBottomType: number, borderBottomValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE, borderBottomType);
    setFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE, borderBottomValue);
    this.commitState(StateKeys.BORDER);
  }

  private writeBorderLeftStyle(borderLeftStyle: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_LEFT_STYLE, borderLeftStyle);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  private writeBorderLeftWidth(borderLeftType: number, borderLeftValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_LEFT_TYPE, borderLeftType);
    setFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE, borderLeftValue);
    this.commitState(StateKeys.BORDER);
  }

  private writeBorderRightStyle(borderRightStyle: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_RIGHT_STYLE, borderRightStyle);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  private writeBorderRightWidth(borderRightType: number, borderRightValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_RIGHT_TYPE, borderRightType);
    setFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE, borderRightValue);
    this.commitState(StateKeys.BORDER);
  }

  private writeBorderTopStyle(borderTopStyle: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_TOP_STYLE, borderTopStyle);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  private writeBorderTopWidth(borderTopType: number, borderTopValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_TOP_TYPE, borderTopType);
    setFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE, borderTopValue);
    this.commitState(StateKeys.BORDER);
  }

  private writeBorderStyles(borderTopStyle: number, borderRightStyle: number, borderBottomStyle: number, borderLeftStyle: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BORDER_TOP_STYLE, borderTopStyle);
    setUint8(this.style_view, StyleKeys.BORDER_RIGHT_STYLE, borderRightStyle);
    setUint8(this.style_view, StyleKeys.BORDER_BOTTOM_STYLE, borderBottomStyle);
    setUint8(this.style_view, StyleKeys.BORDER_LEFT_STYLE, borderLeftStyle);
    this.commitState(StateKeys.BORDER_STYLE);
  }

  private writeCornerShapeTopLeft(borderRadiusTopLeftExponent: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, borderRadiusTopLeftExponent);
    this.commitState(StateKeys.BORDER_RADIUS);
  }

  private writeCornerShapeTopRight(borderRadiusTopRightExponent: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, borderRadiusTopRightExponent);
    this.commitState(StateKeys.BORDER_RADIUS);
  }

  private writeCornerShapeBottomRight(borderRadiusBottomRightExponent: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, borderRadiusBottomRightExponent);
    this.commitState(StateKeys.BORDER_RADIUS);
  }

  private writeCornerShapeBottomLeft(borderRadiusBottomLeftExponent: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, borderRadiusBottomLeftExponent);
    this.commitState(StateKeys.BORDER_RADIUS);
  }

  private writeCornerShape(borderRadiusTopLeftExponent: number, borderRadiusTopRightExponent: number, borderRadiusBottomRightExponent: number, borderRadiusBottomLeftExponent: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, borderRadiusTopLeftExponent);
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, borderRadiusTopRightExponent);
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, borderRadiusBottomRightExponent);
    setFloat32(this.style_view, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, borderRadiusBottomLeftExponent);
    this.commitState(StateKeys.BORDER_RADIUS);
  }

  private writeBoxSizing(boxSizing: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.BOX_SIZING, boxSizing);
    this.commitState(StateKeys.BOX_SIZING);
  }

  private writeClear(clear: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.CLEAR, clear);
    this.commitState(StateKeys.CLEAR);
  }

  private writeDecorationLine(decorationLine: number, decorationLineState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.DECORATION_LINE, decorationLine);
    setUint8(this.style_view, StyleKeys.DECORATION_LINE_STATE, decorationLineState);
    this.commitState(StateKeys.DECORATION_LINE);
  }

  private writeDecorationStyle(decorationStyle: number, decorationStyleState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.DECORATION_STYLE, decorationStyle);
    setUint8(this.style_view, StyleKeys.DECORATION_STYLE_STATE, decorationStyleState);
    this.commitState(StateKeys.DECORATION_STYLE);
  }

  private writeDecorationColor(decorationColor: number, decorationColorState: number) {
    this.prepareMut();
    setUint32(this.style_view, StyleKeys.DECORATION_COLOR, decorationColor);
    setUint8(this.style_view, StyleKeys.DECORATION_COLOR_STATE, decorationColorState);
    this.commitState(StateKeys.DECORATION_COLOR);
  }

  private writeDecorationThickness(decorationThickness: number, decorationThicknessState: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.DECORATION_THICKNESS, decorationThickness);
    setUint8(this.style_view, StyleKeys.DECORATION_THICKNESS_STATE, decorationThicknessState);
    this.commitState(StateKeys.DECORATION_THICKNESS);
  }

  private writeDirection(direction: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.DIRECTION, direction);
    this.commitState(StateKeys.DIRECTION);
  }

  private writeDisplay(display: number, displayMode: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.DISPLAY, display);
    setUint8(this.style_view, StyleKeys.DISPLAY_MODE, displayMode);
    this.commitState(StateKeys.DISPLAY.or(StateKeys.DISPLAY_MODE));
  }

  private writeFlexBasisType(flexBasisType: number, flexBasisValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.FLEX_BASIS_TYPE, flexBasisType);
    setFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE, flexBasisValue);
    this.commitState(StateKeys.FLEX_BASIS);
  }

  private writeFlexDirection(flexDirection: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.FLEX_DIRECTION, flexDirection);
    this.commitState(StateKeys.FLEX_DIRECTION);
  }

  private writeFlexGrow(flexGrow: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.FLEX_GROW, flexGrow);
    this.commitState(StateKeys.FLEX_GROW);
  }

  private writeFlexShrink(flexShrink: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.FLEX_SHRINK, flexShrink);
    this.commitState(StateKeys.FLEX_SHRINK);
  }

  private writeFlexWrap(flexWrap: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.FLEX_WRAP, flexWrap);
    this.commitState(StateKeys.FLEX_WRAP);
  }

  private writeTextDecoration(decorationLine: number, decorationStyle: number, decorationColor: number, decorationThickness: number, decorationLineState: number, decorationStyleState: number, decorationColorState: number, decorationThicknessState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.DECORATION_LINE, decorationLine);
    setUint8(this.style_view, StyleKeys.DECORATION_STYLE, decorationStyle);
    setUint32(this.style_view, StyleKeys.DECORATION_COLOR, decorationColor);
    setFloat32(this.style_view, StyleKeys.DECORATION_THICKNESS, decorationThickness);
    setUint8(this.style_view, StyleKeys.DECORATION_LINE_STATE, decorationLineState);
    setUint8(this.style_view, StyleKeys.DECORATION_STYLE_STATE, decorationStyleState);
    setUint8(this.style_view, StyleKeys.DECORATION_COLOR_STATE, decorationColorState);
    setUint8(this.style_view, StyleKeys.DECORATION_THICKNESS_STATE, decorationThicknessState);
    this.commitState(StateKeys.DECORATION_LINE.or(StateKeys.DECORATION_STYLE).or(StateKeys.DECORATION_COLOR).or(StateKeys.DECORATION_THICKNESS));
  }

  private writeFloat(float: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.FLOAT, float);
    this.commitState(StateKeys.FLOAT);
  }

  private writeFontColorState(fontColorState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.FONT_COLOR_STATE, fontColorState);
    this.commitState(StateKeys.FONT_COLOR);
  }

  private writeFontColor(fontColor: number, fontColorState: number) {
    this.prepareMut();
    setUint32(this.style_view, StyleKeys.FONT_COLOR, fontColor);
    setUint8(this.style_view, StyleKeys.FONT_COLOR_STATE, fontColorState);
    this.commitState(StateKeys.FONT_COLOR);
  }

  private writeFontSize(fontSize: number, fontSizeState: number, fontSizeType: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.FONT_SIZE, fontSize);
    setUint8(this.style_view, StyleKeys.FONT_SIZE_STATE, fontSizeState);
    setUint8(this.style_view, StyleKeys.FONT_SIZE_TYPE, fontSizeType);
    this.commitState(StateKeys.FONT_SIZE);
  }

  private writeFontStretch(fontStretch: number, fontStretchState: number) {
    this.prepareMut();
    setInt32(this.style_view, StyleKeys.FONT_STRETCH, fontStretch);
    setUint8(this.style_view, StyleKeys.FONT_STRETCH_STATE, fontStretchState);
    this.commitState(StateKeys.FONT_STRETCH);
  }

  private writeFontStyle(fontStyleType: number, fontStyleState: number, fontStyleSlant: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.FONT_STYLE_TYPE, fontStyleType);
    setUint8(this.style_view, StyleKeys.FONT_STYLE_STATE, fontStyleState);
    setInt32(this.style_view, StyleKeys.FONT_STYLE_SLANT, fontStyleSlant);
    this.commitState(StateKeys.FONT_STYLE);
  }

  private writeFontWeight(fontWeight: number, fontWeightState: number) {
    this.prepareMut();
    setInt32(this.style_view, StyleKeys.FONT_WEIGHT, fontWeight);
    setUint8(this.style_view, StyleKeys.FONT_WEIGHT_STATE, fontWeightState);
    this.commitState(StateKeys.FONT_WEIGHT);
  }

  private writeColumnGap(gapColumnType: number, gapColumnValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.GAP_COLUMN_TYPE, gapColumnType);
    setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, gapColumnValue);
    this.commitState(StateKeys.GAP);
  }

  private writeGap(gapRowType: number, gapRowValue: number, gapColumnType: number, gapColumnValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.GAP_ROW_TYPE, gapRowType);
    setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, gapRowValue);
    setUint8(this.style_view, StyleKeys.GAP_COLUMN_TYPE, gapColumnType);
    setFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE, gapColumnValue);
    this.commitState(StateKeys.GAP);
  }

  private writeRowGap(gapRowType: number, gapRowValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.GAP_ROW_TYPE, gapRowType);
    setFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE, gapRowValue);
    this.commitState(StateKeys.GAP);
  }

  private writeGridAutoFlow(gridAutoFlow: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.GRID_AUTO_FLOW, gridAutoFlow);
    this.commitState(StateKeys.GRID_AUTO_FLOW);
  }

  private writeHeight(heightType: number, heightValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.HEIGHT_TYPE, heightType);
    setFloat32(this.style_view, StyleKeys.HEIGHT_VALUE, heightValue);
    this.stampPhysical('size', 2);
    this.commitState(StateKeys.SIZE);
  }

  private writeHyphens(hyphens: number, hyphensState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.HYPHENS, hyphens);
    setUint8(this.style_view, StyleKeys.HYPHENS_STATE, hyphensState);
    this.commitState(StateKeys.HYPHENS);
  }

  private writeInsetBottomType(insetBottomType: number, insetBottomValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, insetBottomType);
    setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, insetBottomValue);
    this.stampPhysical('inset', 4);
    this.commitState(StateKeys.INSET);
  }

  private writeInsetLeftType(insetLeftType: number, insetLeftValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.INSET_LEFT_TYPE, insetLeftType);
    setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, insetLeftValue);
    this.stampPhysical('inset', 8);
    this.commitState(StateKeys.INSET);
  }

  private writeInsetRightType(insetRightType: number, insetRightValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.INSET_RIGHT_TYPE, insetRightType);
    setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, insetRightValue);
    this.stampPhysical('inset', 2);
    this.commitState(StateKeys.INSET);
  }

  private writeInsetTopType(insetTopType: number, insetTopValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.INSET_TOP_TYPE, insetTopType);
    setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, insetTopValue);
    this.stampPhysical('inset', 1);
    this.commitState(StateKeys.INSET);
  }

  private writeJustifyContent(justifyContent: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.JUSTIFY_CONTENT, justifyContent);
    this.commitState(StateKeys.JUSTIFY_CONTENT);
  }

  private writeJustifyItems(justifyItems: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.JUSTIFY_ITEMS, justifyItems);
    this.commitState(StateKeys.JUSTIFY_ITEMS);
  }

  private writeJustifySelf(justifySelf: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.JUSTIFY_SELF, justifySelf);
    this.commitState(StateKeys.JUSTIFY_SELF);
  }

  private writeLetterSpacing(letterSpacing: number, letterSpacingState: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.LETTER_SPACING, letterSpacing);
    setUint8(this.style_view, StyleKeys.LETTER_SPACING_STATE, letterSpacingState);
    this.commitState(StateKeys.LETTER_SPACING);
  }

  private writeLineClamp(lineClamp: number, lineClampState: number) {
    this.prepareMut();
    setInt32(this.style_view, StyleKeys.LINE_CLAMP, lineClamp);
    setUint8(this.style_view, StyleKeys.LINE_CLAMP_STATE, lineClampState);
    this.commitState(StateKeys.LINE_CLAMP);
  }

  private writeLineHeight(lineHeight: number, lineHeightState: number, lineHeightType: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.LINE_HEIGHT, lineHeight);
    setUint8(this.style_view, StyleKeys.LINE_HEIGHT_STATE, lineHeightState);
    setUint8(this.style_view, StyleKeys.LINE_HEIGHT_TYPE, lineHeightType);
    this.commitState(StateKeys.LINE_HEIGHT);
  }

  private writeLineHeightState(lineHeightState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.LINE_HEIGHT_STATE, lineHeightState);
    this.commitState(StateKeys.LINE_HEIGHT);
  }

  private writeListStylePosition(listStylePosition: number, listStylePositionState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.LIST_STYLE_POSITION, listStylePosition);
    setUint8(this.style_view, StyleKeys.LIST_STYLE_POSITION_STATE, listStylePositionState);
    this.commitState(StateKeys.LIST_STYLE_POSITION);
  }

  private writeListStyleType(listStyleType: number, listStyleTypeState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.LIST_STYLE_TYPE, listStyleType);
    setUint8(this.style_view, StyleKeys.LIST_STYLE_TYPE_STATE, listStyleTypeState);
    this.commitState(StateKeys.LIST_STYLE_TYPE);
  }

  private writeMarginBottomType(marginBottomType: number, marginBottomValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, marginBottomType);
    setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, marginBottomValue);
    this.stampPhysical('margin', 4);
    this.commitState(StateKeys.MARGIN);
  }

  private writeMarginLeftType(marginLeftType: number, marginLeftValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, marginLeftType);
    setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, marginLeftValue);
    this.stampPhysical('margin', 8);
    this.commitState(StateKeys.MARGIN);
  }

  private writeMarginRightType(marginRightType: number, marginRightValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, marginRightType);
    setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, marginRightValue);
    this.stampPhysical('margin', 2);
    this.commitState(StateKeys.MARGIN);
  }

  private writeMarginTopType(marginTopType: number, marginTopValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MARGIN_TOP_TYPE, marginTopType);
    setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, marginTopValue);
    this.stampPhysical('margin', 1);
    this.commitState(StateKeys.MARGIN);
  }

  private writeMaxHeight(maxHeightType: number, maxHeightValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE, maxHeightType);
    setFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE, maxHeightValue);
    this.stampPhysical('size', 32);
    this.commitState(StateKeys.MAX_SIZE);
  }

  private writeMaxWidth(maxWidthType: number, maxWidthValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MAX_WIDTH_TYPE, maxWidthType);
    setFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE, maxWidthValue);
    this.stampPhysical('size', 16);
    this.commitState(StateKeys.MAX_SIZE);
  }

  private writeMinHeight(minHeightType: number, minHeightValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE, minHeightType);
    setFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE, minHeightValue);
    this.stampPhysical('size', 8);
    this.commitState(StateKeys.MIN_SIZE);
  }

  private writeMinWidth(minWidthType: number, minWidthValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MIN_WIDTH_TYPE, minWidthType);
    setFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE, minWidthValue);
    this.stampPhysical('size', 4);
    this.commitState(StateKeys.MIN_SIZE);
  }

  private writeObjectFit(objectFit: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.OBJECT_FIT, objectFit);
    this.commitState(StateKeys.OBJECT_FIT);
  }

  private writeObjectPosition(objectPositionXType: number, objectPositionYType: number, objectPositionXValue: number, objectPositionYValue: number, objectPositionState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.OBJECT_POSITION_X_TYPE, objectPositionXType);
    setUint8(this.style_view, StyleKeys.OBJECT_POSITION_Y_TYPE, objectPositionYType);
    setFloat32(this.style_view, StyleKeys.OBJECT_POSITION_X_VALUE, objectPositionXValue);
    setFloat32(this.style_view, StyleKeys.OBJECT_POSITION_Y_VALUE, objectPositionYValue);
    setUint8(this.style_view, StyleKeys.OBJECT_POSITION_STATE, objectPositionState);
    this.commitState(StateKeys.OBJECT_POSITION);
  }

  private writeOverflowX(overflowX: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.OVERFLOW_X, overflowX);
    this.commitState(StateKeys.OVERFLOW_X);
  }

  private writeOverflowAxes(overflowX: number, overflowY: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.OVERFLOW_X, overflowX);
    setUint8(this.style_view, StyleKeys.OVERFLOW_Y, overflowY);
    this.commitState(StateKeys.OVERFLOW);
  }

  private writeOverflowY(overflowY: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.OVERFLOW_Y, overflowY);
    this.commitState(StateKeys.OVERFLOW_Y);
  }

  private writePaddingBottomType(paddingBottomType: number, paddingBottomValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, paddingBottomType);
    setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, paddingBottomValue);
    this.stampPhysical('padding', 4);
    this.commitState(StateKeys.PADDING);
  }

  private writePaddingLeftType(paddingLeftType: number, paddingLeftValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.PADDING_LEFT_TYPE, paddingLeftType);
    setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, paddingLeftValue);
    this.stampPhysical('padding', 8);
    this.commitState(StateKeys.PADDING);
  }

  private writePaddingRightType(paddingRightType: number, paddingRightValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, paddingRightType);
    setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, paddingRightValue);
    this.stampPhysical('padding', 2);
    this.commitState(StateKeys.PADDING);
  }

  private writePaddingTopType(paddingTopType: number, paddingTopValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.PADDING_TOP_TYPE, paddingTopType);
    setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, paddingTopValue);
    this.stampPhysical('padding', 1);
    this.commitState(StateKeys.PADDING);
  }

  private writePosition(position: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.POSITION, position);
    this.commitState(StateKeys.POSITION);
  }

  private writeScrollbarWidth(scrollbarWidth: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH, scrollbarWidth);
    this.commitState(StateKeys.SCROLLBAR_WIDTH);
  }

  private writeTextAlign(textAlign: number, textAlignState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_ALIGN, textAlign);
    setUint8(this.style_view, StyleKeys.TEXT_ALIGN_STATE, textAlignState);
    this.commitState(StateKeys.TEXT_ALIGN);
  }

  private writeTextCombineUpright(textCombineUpright: number, textCombineUprightState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_COMBINE_UPRIGHT, textCombineUpright);
    setUint8(this.style_view, StyleKeys.TEXT_COMBINE_UPRIGHT_STATE, textCombineUprightState);
    this.commitState(StateKeys.TEXT_COMBINE_UPRIGHT);
  }

  private writeTextIndent(textIndent: number, textIndentType: number, textIndentState: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.TEXT_INDENT, textIndent);
    setUint8(this.style_view, StyleKeys.TEXT_INDENT_TYPE, textIndentType);
    setUint8(this.style_view, StyleKeys.TEXT_INDENT_STATE, textIndentState);
    this.commitState(StateKeys.TEXT_INDENT);
  }

  private writeTextJustify(textJustify: number, textJustifyState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_JUSTIFY, textJustify);
    setUint8(this.style_view, StyleKeys.TEXT_JUSTIFY_STATE, textJustifyState);
    this.commitState(StateKeys.TEXT_JUSTIFY);
  }

  private writeTextOrientation(textOrientation: number, textOrientationState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_ORIENTATION, textOrientation);
    setUint8(this.style_view, StyleKeys.TEXT_ORIENTATION_STATE, textOrientationState);
    this.commitState(StateKeys.TEXT_ORIENTATION);
  }

  private writeTextOverflow(textOverflow: number, textOverflowState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_OVERFLOW, textOverflow);
    setUint8(this.style_view, StyleKeys.TEXT_OVERFLOW_STATE, textOverflowState);
    this.commitState(StateKeys.TEXT_OVERFLOW);
  }

  private writeTextSpacingTrim(textSpacingTrim: number, textSpacingTrimState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_SPACING_TRIM, textSpacingTrim);
    setUint8(this.style_view, StyleKeys.TEXT_SPACING_TRIM_STATE, textSpacingTrimState);
    this.commitState(StateKeys.TEXT_SPACING_TRIM);
  }

  private writeTextTransform(textTransform: number, textTransformState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_TRANSFORM, textTransform);
    setUint8(this.style_view, StyleKeys.TEXT_TRANSFORM_STATE, textTransformState);
    this.commitState(StateKeys.TEXT_TRANSFORM);
  }

  private writeTextWrap(textWrap: number, textWrapState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TEXT_WRAP, textWrap);
    setUint8(this.style_view, StyleKeys.TEXT_WRAP_STATE, textWrapState);
    this.commitState(StateKeys.TEXT_WRAP);
  }

  private writeTransformOrigin(transformOriginXType: number, transformOriginYType: number, transformOriginXValue: number, transformOriginYValue: number, transformOriginState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.TRANSFORM_ORIGIN_X_TYPE, transformOriginXType);
    setUint8(this.style_view, StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, transformOriginYType);
    setFloat32(this.style_view, StyleKeys.TRANSFORM_ORIGIN_X_VALUE, transformOriginXValue);
    setFloat32(this.style_view, StyleKeys.TRANSFORM_ORIGIN_Y_VALUE, transformOriginYValue);
    setUint8(this.style_view, StyleKeys.TRANSFORM_ORIGIN_STATE, transformOriginState);
    this.commitState(StateKeys.TRANSFORM_ORIGIN);
  }

  private writeUnicodeBidi(unicodeBidi: number, unicodeBidiState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.UNICODE_BIDI, unicodeBidi);
    setUint8(this.style_view, StyleKeys.UNICODE_BIDI_STATE, unicodeBidiState);
    this.commitState(StateKeys.UNICODE_BIDI);
  }

  private writeVisibility(visibility: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.VISIBILITY, visibility);
    this.commitState(StateKeys.VISIBILITY);
  }

  private writeVerticalAlign(verticalAlignOffsetOffset: number, verticalAlignIsPercentOffset: number, verticalAlignEnumOffset: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, verticalAlignOffsetOffset);
    setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, verticalAlignIsPercentOffset);
    setUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, verticalAlignEnumOffset);
    this.commitState(StateKeys.VERTICAL_ALIGN);
  }

  private writeWhiteSpace(whiteSpace: number, whiteSpaceState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.WHITE_SPACE, whiteSpace);
    setUint8(this.style_view, StyleKeys.WHITE_SPACE_STATE, whiteSpaceState);
    this.commitState(StateKeys.WHITE_SPACE);
  }

  private writeWidth(widthType: number, widthValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.WIDTH_TYPE, widthType);
    setFloat32(this.style_view, StyleKeys.WIDTH_VALUE, widthValue);
    this.stampPhysical('size', 1);
    this.commitState(StateKeys.SIZE);
  }

  private writeWritingMode(writingMode: number, writingModeState: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.WRITING_MODE, writingMode);
    setUint8(this.style_view, StyleKeys.WRITING_MODE_STATE, writingModeState);
    this.commitState(StateKeys.WRITING_MODE);
  }

  private writeWordSpacing(wordSpacing: number, wordSpacingType: number, wordSpacingState: number) {
    this.prepareMut();
    setFloat32(this.style_view, StyleKeys.WORD_SPACING, wordSpacing);
    setUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE, wordSpacingType);
    setUint8(this.style_view, StyleKeys.WORD_SPACING_STATE, wordSpacingState);
    this.commitState(StateKeys.WORD_SPACING);
  }

  private writeZIndex(zIndex: number) {
    this.prepareMut();
    setInt32(this.style_view, StyleKeys.Z_INDEX, zIndex);
    this.commitState(StateKeys.Z_INDEX);
  }

  private writeInset(insetTopType: number, insetTopValue: number, insetRightType: number, insetRightValue: number, insetBottomType: number, insetBottomValue: number, insetLeftType: number, insetLeftValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.INSET_TOP_TYPE, insetTopType);
    setFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE, insetTopValue);
    setUint8(this.style_view, StyleKeys.INSET_RIGHT_TYPE, insetRightType);
    setFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE, insetRightValue);
    setUint8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE, insetBottomType);
    setFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE, insetBottomValue);
    setUint8(this.style_view, StyleKeys.INSET_LEFT_TYPE, insetLeftType);
    setFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE, insetLeftValue);
    this.stampPhysical('inset', 15);
    this.commitState(StateKeys.INSET);
  }

  private writeMargin(marginTopType: number, marginTopValue: number, marginRightType: number, marginRightValue: number, marginBottomType: number, marginBottomValue: number, marginLeftType: number, marginLeftValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.MARGIN_TOP_TYPE, marginTopType);
    setFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE, marginTopValue);
    setUint8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE, marginRightType);
    setFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE, marginRightValue);
    setUint8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE, marginBottomType);
    setFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE, marginBottomValue);
    setUint8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE, marginLeftType);
    setFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE, marginLeftValue);
    this.stampPhysical('margin', 15);
    this.commitState(StateKeys.MARGIN);
  }

  private writePadding(paddingTopType: number, paddingTopValue: number, paddingRightType: number, paddingRightValue: number, paddingBottomType: number, paddingBottomValue: number, paddingLeftType: number, paddingLeftValue: number) {
    this.prepareMut();
    setUint8(this.style_view, StyleKeys.PADDING_TOP_TYPE, paddingTopType);
    setFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE, paddingTopValue);
    setUint8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE, paddingRightType);
    setFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE, paddingRightValue);
    setUint8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE, paddingBottomType);
    setFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE, paddingBottomValue);
    setUint8(this.style_view, StyleKeys.PADDING_LEFT_TYPE, paddingLeftType);
    setFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE, paddingLeftValue);
    this.stampPhysical('padding', 15);
    this.commitState(StateKeys.PADDING);
  }
  // </style-keys:writes>

  // <style-keys:accessors>
  get display(): 'none' | 'flex' | 'grid' | 'block' | 'inline' | 'inline-block' | 'inline-flex' | 'inline-grid' {
    const base = getInt8(this.style_view, StyleKeys.DISPLAY);
    const mode = getInt8(this.style_view, StyleKeys.DISPLAY_MODE);
    if (mode === 1) return 'inline';
    if (mode === 2 && base === 3) return 'inline-block';
    if (mode === 2 && base === 1) return 'inline-flex';
    if (mode === 2 && base === 2) return 'inline-grid';
    switch (base) {
      case 0: return 'none';
      case 1: return 'flex';
      case 2: return 'grid';
      case 3: return 'block';
      default: return 'none';
    }
  }
  set display(value: 'none' | 'flex' | 'grid' | 'block' | 'inline' | 'inline-block' | 'inline-flex' | 'inline-grid') {
    switch (cssKeywordCode('display', value)) {
      case 0: this.writeDisplay(0, 0); break;
      case 1: this.writeDisplay(1, 0); break;
      case 2: this.writeDisplay(2, 0); break;
      case 3: this.writeDisplay(3, 0); break;
      case 4: this.writeDisplay(1, 1); break;
      case 5: this.writeDisplay(3, 2); break;
      case 6: this.writeDisplay(1, 2); break;
      case 7: this.writeDisplay(2, 2); break;
    }
  }

  get textOverflow(): 'clip' | 'ellipsis' {
    if (!this.style_view) return 'clip';
    switch (getUint8(this.style_view, StyleKeys.TEXT_OVERFLOW)) {
      case 1: return 'ellipsis';
      case 2: return 'ellipsis';
      default: return 'clip';
    }
  }
  set textOverflow(value: string) {
    if (!this.style_view) return;
    const code = cssKeywordCode('text-overflow', value);
    if (code !== undefined) this.writeTextOverflow(code, 1);
  }

  get transformOrigin(): string {
    if (!(this.style_view && getUint8(this.style_view, StyleKeys.TRANSFORM_ORIGIN_STATE))) return '50% 50%';
    const side = (typeKey: StyleKeys, valueKey: StyleKeys) => {
      const value = getFloat32(this.style_view, valueKey);
      return getUint8(this.style_view, typeKey) === 1 ? `${value}%` : `${layout.toDeviceIndependentPixels(value)}px`;
    };
    return `${side(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, StyleKeys.TRANSFORM_ORIGIN_X_VALUE)} ${side(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, StyleKeys.TRANSFORM_ORIGIN_Y_VALUE)}`;
  }
  set transformOrigin(value: string) {
    if (!this.style_view) return;
    const parsed = parseTransformOrigin(String(value ?? ''), this.emBasisFor(value));
    if (!parsed) return;
    this.writeTransformOrigin(parsed.xType, parsed.yType, parsed.x, parsed.y, 1);
    if (__WINDOWS__) (this.view as any)?._applyWindowsTransform?.();
  }

  /** Transform origin as fractions of the box, or null when unset. */
  transformOriginFraction(width: number, height: number): { x: number; y: number } | null {
    if (!(this.style_view && getUint8(this.style_view, StyleKeys.TRANSFORM_ORIGIN_STATE))) return null;
    const side = (typeKey: StyleKeys, valueKey: StyleKeys, size: number) => {
      const value = getFloat32(this.style_view, valueKey);
      if (getUint8(this.style_view, typeKey) === 1) return value / 100;
      return size > 0 ? layout.toDeviceIndependentPixels(value) / size : 0;
    };
    return { x: side(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, StyleKeys.TRANSFORM_ORIGIN_X_VALUE, width), y: side(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, StyleKeys.TRANSFORM_ORIGIN_Y_VALUE, height) };
  }

  get objectPosition(): string {
    if (!(this.style_view && getUint8(this.style_view, StyleKeys.OBJECT_POSITION_STATE))) return '50% 50%';
    const side = (typeKey: StyleKeys, valueKey: StyleKeys) => {
      const value = getFloat32(this.style_view, valueKey);
      return getUint8(this.style_view, typeKey) === 1 ? `${value}%` : `${value}px`;
    };
    return `${side(StyleKeys.OBJECT_POSITION_X_TYPE, StyleKeys.OBJECT_POSITION_X_VALUE)} ${side(StyleKeys.OBJECT_POSITION_Y_TYPE, StyleKeys.OBJECT_POSITION_Y_VALUE)}`;
  }
  set objectPosition(value: string) {
    if (!this.style_view) return;
    const fields = resolveCssPosition(value, CssParseKind.ObjectPosition, ...numericCssContext(value, this.emBasisFor(value)));
    if (!fields) return;
    const [xType, x, yType, y] = fields;
    this.writeObjectPosition(xType, yType, xType === 0 ? layout.toDeviceIndependentPixels(x) : x, yType === 0 ? layout.toDeviceIndependentPixels(y) : y, 1);
  }

  set textDecoration(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'text-decoration', value,
      () => nodeHelper().setTextDecoration(this.nativeView, value),
      () => this.appleStyle.setTextDecoration(value),
    );
  }

  get textDecorationLine(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getTextDecorationLine(this.nativeView);
    if (__APPLE__) return this.appleStyle.textDecorationLine;
    if (__WINDOWS__ && this.style_view) {
      return textDecorationLineToCss(getUint8(this.style_view, StyleKeys.DECORATION_LINE));
    }
    return '';
  }
  set textDecorationLine(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), 'none');
    this.setPseudoCssStringValue(
      'text-decoration-line', value,
      () => nodeHelper().setTextDecorationLine(this.nativeView, value),
      () => (this.appleStyle.textDecorationLine = value),
    );
  }

  get textDecorationStyle(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getTextDecorationStyle(this.nativeView);
    if (__APPLE__) return this.appleStyle.textDecorationStyle;
    if (__WINDOWS__ && this.style_view) {
      return textDecorationStyleToCss(getUint8(this.style_view, StyleKeys.DECORATION_STYLE));
    }
    return '';
  }
  set textDecorationStyle(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), 'solid');
    this.setPseudoCssStringValue(
      'text-decoration-style', value,
      () => nodeHelper().setTextDecorationStyle(this.nativeView, value),
      () => (this.appleStyle.textDecorationStyle = value),
    );
  }

  get textDecorationColor(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getTextDecorationColor(this.nativeView);
    if (__APPLE__) return this.appleStyle.textDecorationColor;
    if (__WINDOWS__ && this.style_view) {
      const color = getUint32(this.style_view, StyleKeys.DECORATION_COLOR);
      return !getUint8(this.style_view, StyleKeys.DECORATION_COLOR_STATE) || color === DECORATION_COLOR_UNSET ? 'currentcolor' : new Color(color).hex;
    }
    return '';
  }
  set textDecorationColor(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), 'currentcolor');
    this.setPseudoCssStringValue(
      'text-decoration-color', value,
      () => nodeHelper().setTextDecorationColor(this.nativeView, value),
      () => (this.appleStyle.textDecorationColor = value),
    );
  }

  get textDecorationThickness(): number {
    return layout.toDeviceIndependentPixels(getFloat32(this.style_view, StyleKeys.DECORATION_THICKNESS));
  }
  set textDecorationThickness(value: string | number) {
    if (typeof value === 'number') {
      this.writeDecorationThickness(layout.toDevicePixels(finite(value)), 1);
      return;
    }
    const length = decorationField('text-decoration-thickness', value);
    if (length == null) return;
    const devicePx = length === '' ? 0 : tokenToDevicePx(length, this.emBasisFor(length));
    this.writeDecorationThickness(devicePx, 1);
  }

  get textIndent(): string {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.TEXT_INDENT_STATE)) return '0px';
    const unit = getUint8(this.style_view, StyleKeys.TEXT_INDENT_TYPE);
    const amount = getFloat32(this.style_view, StyleKeys.TEXT_INDENT);
    return unit === 1 ? `${amount}%` : `${layout.toDeviceIndependentPixels(amount)}px`;
  }
  set textIndent(value: string | number) {
    if (!this.style_view) return;
    if (typeof value === 'number') {
      this.writeTextIndent(layout.toDevicePixels(value), 0, 1);
      return;
    }
    const css = String(value ?? '');
    const fields = nativeCssLength(css, CssParseKind.TextIndent, ...numericCssContext(css, this.emBasisFor(css)));
    if (!fields) return;
    const [kind, amount] = fields;
    this.writeTextIndent(kind === 2 ? amount * 100 : amount, kind === 2 ? 1 : 0, 1);
  }

  get wordSpacing(): string {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.WORD_SPACING_STATE)) return 'normal';
    const unit = getUint8(this.style_view, StyleKeys.WORD_SPACING_TYPE);
    if (unit === 2) return 'normal';
    const amount = getFloat32(this.style_view, StyleKeys.WORD_SPACING);
    return unit === 1 ? `${amount}%` : `${amount}px`;
  }
  set wordSpacing(value: string | number) {
    if (!this.style_view) return;
    if (typeof value === 'number') {
      this.writeWordSpacing(layout.toDevicePixels(value), 0, 1);
      return;
    }
    const css = value;
    const fields = nativeCssLength(css, CssParseKind.WordSpacing, ...numericCssContext(css, this.emBasisFor(css)));
    if (!fields) return;
    const [kind, amount] = fields;
    this.writeWordSpacing(amount, kind, 1);
  }

  get verticalAlign() {
    const amount = getFloat32(this.style_view, StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET);
    if (getUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET) === 1) return `${amount * 100}%`;
    if (amount !== 0) return `${layout.toDeviceIndependentPixels(amount)}px`;
    switch (getUint8(this.style_view, StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET)) {
      case 1: return 'top';
      case 2: return 'text-top';
      case 3: return 'middle';
      case 4: return 'bottom';
      case 5: return 'text-bottom';
      case 6: return 'sub';
      case 7: return 'super';
      default: return 'baseline';
    }
  }
  set verticalAlign(value: VerticalAlign) {
    if (typeof value === 'string') {
      const fields = nativeCssLength(value, CssParseKind.VerticalAlign, ...numericCssContext(value, this.emBasisFor(value)));
      if (!fields) return;
      const [kind, amount] = fields;
      this.writeVerticalAlign(kind === 3 ? 0 : amount, kind === 2 ? 1 : 0, kind === 3 ? amount : 0);
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) this.writeVerticalAlign(layout.toDevicePixels(value), 0, 0);
    } else if (value && Number.isFinite(value.value)) {
      if (value.unit === '%') this.writeVerticalAlign(value.value, 1, 0);
      else if (value.unit === 'px' || value.unit === 'dip') this.writeVerticalAlign(layout.toDevicePixels(value.value), 0, 0);
    }
  }

  get fontStyle() {
    if (!this.style_view) return 'normal';
    switch (getInt8(this.style_view, StyleKeys.FONT_STYLE_TYPE)) {
      case 1: return 'italic';
      case 2: return 'oblique';
      default: return 'normal';
    }
  }
  set fontStyle(value: string) {
    if (!this.style_view || typeof value !== 'string') return;
    const fields = expandCssShorthand('font-style', value);
    if (fields) this.writeFontStyle(Number(fields[0]), 1, Number(fields[1]));
  }

  get fontWeight() {
    return this.style_view ? getInt32(this.style_view, StyleKeys.FONT_WEIGHT) : 400;
  }
  set fontWeight(value: '100' | '200' | '300' | 'normal' | '400' | '500' | '600' | 'bold' | '700' | '800' | '900' | number) {
    if (!this.style_view) return;
    const weight = typeof value === 'number' ? value : Number(expandCssShorthand('font-weight', value)?.[0]);
    if (weight >= 1 && weight <= 1000) this.writeFontWeight(weight, 1);
  }

  get fontStretch(): string {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.FONT_STRETCH_STATE)) return 'normal';
    const pct = getInt32(this.style_view, StyleKeys.FONT_STRETCH);
    return expandCssShorthand('font-stretch-name', String(pct))?.[0] ?? 'normal';
  }
  set fontStretch(value: string) {
    if (!this.style_view) return;
    const field = expandCssShorthand('font-stretch', value)?.[0];
    if (field !== undefined) this.writeFontStretch(Number(field), 1);
  }

  get textAlignment(): 'left' | 'right' | 'center' | 'justify' | 'start' | 'end' {
    if (!this.style_view) return 'start';
    switch (getUint8(this.style_view, StyleKeys.TEXT_ALIGN)) {
      case 1: return 'left';
      case 2: return 'right';
      case 3: return 'center';
      case 4: return 'justify';
      case 6: return 'end';
      default: return 'start';
    }
  }
  set textAlignment(value: 'left' | 'right' | 'center' | 'justify' | 'start' | 'end') {
    if (!this.style_view) return;
    const code = cssKeywordCode('text-align', value);
    if (code !== undefined) this.writeTextAlign(code, 1);
  }

  get visibility(): 'visible' | 'hidden' | 'collapse' {
    if (!this.style_view) return 'visible';
    switch (getUint8(this.style_view, StyleKeys.VISIBILITY)) {
      case 1: return 'hidden';
      case 2: return 'collapse';
      default: return 'visible';
    }
  }
  set visibility(value: 'visible' | 'hidden' | 'collapse') {
    if (!this.style_view) return;
    const code = cssKeywordCode('visibility', value);
    if (code !== undefined && getUint8(this.style_view, StyleKeys.VISIBILITY) !== code) this.writeVisibility(code);
  }

  get hyphens(): 'manual' | 'none' | 'auto' {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.HYPHENS_STATE)) return 'manual';
    switch (getUint8(this.style_view, StyleKeys.HYPHENS)) {
      case 1: return 'none';
      case 2: return 'auto';
      default: return 'manual';
    }
  }
  set hyphens(value: 'manual' | 'none' | 'auto') {
    if (!this.style_view) return;
    const code = cssKeywordCode('hyphens', value);
    if (code !== undefined) this.writeHyphens(code, 1);
  }

  get writingMode(): 'horizontal-tb' | 'vertical-rl' | 'vertical-lr' {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.WRITING_MODE_STATE)) return 'horizontal-tb';
    switch (getUint8(this.style_view, StyleKeys.WRITING_MODE)) {
      case 1: return 'vertical-rl';
      case 2: return 'vertical-lr';
      default: return 'horizontal-tb';
    }
  }
  set writingMode(value: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr') {
    if (!this.style_view) return;
    const code = cssKeywordCode('writing-mode', value);
    if (code !== undefined) this.writeWritingMode(code, 1);
  }

  get unicodeBidi(): string {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.UNICODE_BIDI_STATE)) return 'normal';
    switch (getUint8(this.style_view, StyleKeys.UNICODE_BIDI)) {
      case 1: return 'embed';
      case 2: return 'bidi-override';
      case 3: return 'isolate';
      case 4: return 'isolate-override';
      case 5: return 'plaintext';
      default: return 'normal';
    }
  }
  set unicodeBidi(value: string) {
    if (!this.style_view) return;
    const code = cssKeywordCode('unicode-bidi', value);
    if (code !== undefined) this.writeUnicodeBidi(code, 1);
  }

  get textOrientation(): 'mixed' | 'upright' | 'sideways' {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.TEXT_ORIENTATION_STATE)) return 'mixed';
    switch (getUint8(this.style_view, StyleKeys.TEXT_ORIENTATION)) {
      case 1: return 'upright';
      case 2: return 'sideways';
      default: return 'mixed';
    }
  }
  set textOrientation(value: 'mixed' | 'upright' | 'sideways' | 'sideways-right') {
    if (!this.style_view) return;
    const code = cssKeywordCode('text-orientation', value);
    if (code !== undefined) this.writeTextOrientation(code, 1);
  }

  get textCombineUpright(): string {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.TEXT_COMBINE_UPRIGHT_STATE)) return 'none';
    switch (getUint8(this.style_view, StyleKeys.TEXT_COMBINE_UPRIGHT)) {
      case 1: return 'all';
      case 2: return 'digits 2';
      case 3: return 'digits 3';
      case 4: return 'digits 4';
      default: return 'none';
    }
  }
  set textCombineUpright(value: string) {
    if (!this.style_view) return;
    const code = cssKeywordCode('text-combine-upright', value);
    if (code !== undefined) this.writeTextCombineUpright(code, 1);
  }

  get textSpacingTrim(): string {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.TEXT_SPACING_TRIM_STATE)) return 'normal';
    switch (getUint8(this.style_view, StyleKeys.TEXT_SPACING_TRIM)) {
      case 1: return 'space-all';
      case 2: return 'space-first';
      case 3: return 'trim-start';
      case 4: return 'trim-both';
      case 5: return 'trim-all';
      case 6: return 'auto';
      default: return 'normal';
    }
  }
  set textSpacingTrim(value: string) {
    if (!this.style_view) return;
    const code = cssKeywordCode('text-spacing-trim', value);
    if (code !== undefined) this.writeTextSpacingTrim(code, 1);
  }

  get alignContent(): 'normal' | 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'flex-end' | undefined {
    if (!this.style_view) return undefined;
    switch (getInt8(this.style_view, StyleKeys.ALIGN_CONTENT)) {
      case -1: return 'normal';
      case 0: return 'start';
      case 1: return 'end';
      case 2: return 'center';
      case 3: return 'stretch';
      case 4: return 'space-between';
      case 5: return 'space-around';
      case 6: return 'space-evenly';
      case 7: return 'flex-start';
      case 8: return 'flex-end';
      default: return undefined;
    }
  }
  set alignContent(value: 'normal' | 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'flex-end') {
    if (!this.style_view) return;
    const code = cssKeywordCode('align-content', value);
    if (code !== undefined) this.writeAlignContent(code);
  }

  get alignItems(): 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end' | undefined {
    if (!this.style_view) return undefined;
    switch (getInt8(this.style_view, StyleKeys.ALIGN_ITEMS)) {
      case -1: return 'normal';
      case 0: return 'start';
      case 1: return 'end';
      case 2: return 'center';
      case 3: return 'baseline';
      case 4: return 'stretch';
      case 5: return 'flex-start';
      case 6: return 'flex-end';
      default: return undefined;
    }
  }
  set alignItems(value: 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end') {
    if (!this.style_view) return;
    const code = cssKeywordCode('align-items', value);
    if (code !== undefined) this.writeAlignItems(code);
  }

  get alignSelf(): 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end' | undefined {
    if (!this.style_view) return undefined;
    switch (getInt8(this.style_view, StyleKeys.ALIGN_SELF)) {
      case -1: return 'normal';
      case 0: return 'start';
      case 1: return 'end';
      case 2: return 'center';
      case 3: return 'baseline';
      case 4: return 'stretch';
      case 5: return 'flex-start';
      case 6: return 'flex-end';
      default: return undefined;
    }
  }
  set alignSelf(value: 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end') {
    if (!this.style_view) return;
    const code = cssKeywordCode('align-self', value);
    if (code !== undefined) this.writeAlignSelf(code);
  }

  get aspectRatio(): number {
    return getFloat32(this.style_view, StyleKeys.ASPECT_RATIO);
  }
  set aspectRatio(value: number | string) {
    const ratio = typeof value === 'number' ? value : parseAspectRatio(value);
    const current = getFloat32(this.style_view, StyleKeys.ASPECT_RATIO);
    if (current === ratio || (Number.isNaN(current) && Number.isNaN(ratio))) return;
    this.writeAspectRatio(ratio);
  }

  get backgroundColor(): number {
    this.flushBackgroundWrites();
    return this.style_view ? getUint32(this.style_view, StyleKeys.BACKGROUND_COLOR) : 0;
  }
  set backgroundColor(value: number | string | { argb?: number }) {
    this.flushBackgroundWrites();
    if (!this.style_view) return;
    const normalized = normalizeColorValue(value);
    if (normalized == null) {
      // Reset to transparent.
      if (getInt8(this.style_view, StyleKeys.BACKGROUND_COLOR_STATE)) {
        this.writeBackgroundColor(0, 0, 0);
      }
      return;
    }
    this.writeBackgroundColor(normalized, 1, 0);
  }

  get borderBottomStyle(): string {
    return this.readBorderStyle(StyleKeys.BORDER_BOTTOM_STYLE);
  }
  set borderBottomStyle(value: string) {
    const code = cssKeywordCode('border-style', value);
    if (code != null) this.writeBorderBottomStyle(code);
  }

  get borderLeftStyle(): string {
    return this.readBorderStyle(StyleKeys.BORDER_LEFT_STYLE);
  }
  set borderLeftStyle(value: string) {
    const code = cssKeywordCode('border-style', value);
    if (code != null) this.writeBorderLeftStyle(code);
  }

  get borderRightStyle(): string {
    return this.readBorderStyle(StyleKeys.BORDER_RIGHT_STYLE);
  }
  set borderRightStyle(value: string) {
    const code = cssKeywordCode('border-style', value);
    if (code != null) this.writeBorderRightStyle(code);
  }

  get borderTopStyle(): string {
    return this.readBorderStyle(StyleKeys.BORDER_TOP_STYLE);
  }
  set borderTopStyle(value: string) {
    const code = cssKeywordCode('border-style', value);
    if (code != null) this.writeBorderTopStyle(code);
  }

  private readBorderStyle(offset: number): string {
    switch (getInt8(this.style_view, offset)) {
      case 1: return 'hidden';
      case 2: return 'dotted';
      case 3: return 'dashed';
      case 4: return 'solid';
      case 5: return 'double';
      case 6: return 'groove';
      case 7: return 'ridge';
      case 8: return 'inset';
      case 9: return 'outset';
      default: return 'none';
    }
  }

  get borderStyle(): string {
    const top = this.borderTopStyle;
    const right = this.borderRightStyle;
    const bottom = this.borderBottomStyle;
    const left = this.borderLeftStyle;
    if (top === bottom && right === left) return top === right ? top : `${top} ${right}`;
    return `${top} ${right} ${bottom} ${left}`;
  }
  set borderStyle(value: string) {
    const fields = expandCssShorthand('border-style-values', value);
    if (!fields) return;
    const [top, right, bottom, left] = fields.map(Number);
    this.writeBorderStyles(top, right, bottom, left);
  }

  get borderBottomWidth() {
    return parseLengthPercentage(getInt8(this.style_view, StyleKeys.BORDER_BOTTOM_TYPE), getFloat32(this.style_view, StyleKeys.BORDER_BOTTOM_VALUE));
  }
  set borderBottomWidth(value: Length) {
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writeBorderBottomWidth(length.type, length.value);
  }

  get borderLeftWidth() {
    return parseLengthPercentage(getInt8(this.style_view, StyleKeys.BORDER_LEFT_TYPE), getFloat32(this.style_view, StyleKeys.BORDER_LEFT_VALUE));
  }
  set borderLeftWidth(value: Length) {
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writeBorderLeftWidth(length.type, length.value);
  }

  get borderRightWidth() {
    return parseLengthPercentage(getInt8(this.style_view, StyleKeys.BORDER_RIGHT_TYPE), getFloat32(this.style_view, StyleKeys.BORDER_RIGHT_VALUE));
  }
  set borderRightWidth(value: Length) {
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writeBorderRightWidth(length.type, length.value);
  }

  get borderTopWidth() {
    return parseLengthPercentage(getInt8(this.style_view, StyleKeys.BORDER_TOP_TYPE), getFloat32(this.style_view, StyleKeys.BORDER_TOP_VALUE));
  }
  set borderTopWidth(value: Length) {
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writeBorderTopWidth(length.type, length.value);
  }

  get cornerShapeTopLeft(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getCornerShapeTopLeft(this.nativeView);
    if (__APPLE__) return this.appleStyle.cornerShapeTopLeft;
    return __WINDOWS__ ? (this._windowsCss.get('corner-shape-top-left') ?? '') : '';
  }
  set cornerShapeTopLeft(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'corner-shape-top-left', value,
      () => nodeHelper().setCornerShapeTopLeft(this.nativeView, value),
      () => (this.appleStyle.cornerShapeTopLeft = value),
    );
  }

  get cornerShapeTopRight(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getCornerShapeTopRight(this.nativeView);
    if (__APPLE__) return this.appleStyle.cornerShapeTopRight;
    return __WINDOWS__ ? (this._windowsCss.get('corner-shape-top-right') ?? '') : '';
  }
  set cornerShapeTopRight(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'corner-shape-top-right', value,
      () => nodeHelper().setCornerShapeTopRight(this.nativeView, value),
      () => (this.appleStyle.cornerShapeTopRight = value),
    );
  }

  get cornerShapeBottomRight(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getCornerShapeBottomRight(this.nativeView);
    if (__APPLE__) return this.appleStyle.cornerShapeBottomRight;
    return __WINDOWS__ ? (this._windowsCss.get('corner-shape-bottom-right') ?? '') : '';
  }
  set cornerShapeBottomRight(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'corner-shape-bottom-right', value,
      () => nodeHelper().setCornerShapeBottomRight(this.nativeView, value),
      () => (this.appleStyle.cornerShapeBottomRight = value),
    );
  }

  get cornerShapeBottomLeft(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getCornerShapeBottomLeft(this.nativeView);
    if (__APPLE__) return this.appleStyle.cornerShapeBottomLeft;
    return __WINDOWS__ ? (this._windowsCss.get('corner-shape-bottom-left') ?? '') : '';
  }
  set cornerShapeBottomLeft(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'corner-shape-bottom-left', value,
      () => nodeHelper().setCornerShapeBottomLeft(this.nativeView, value),
      () => (this.appleStyle.cornerShapeBottomLeft = value),
    );
  }

  get cornerShape(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) return nodeHelper().getCornerShape(this.nativeView);
    if (__APPLE__) return this.appleStyle.cornerShape;
    return __WINDOWS__ ? (this._windowsCss.get('corner-shape') ?? '') : '';
  }
  set cornerShape(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'corner-shape', value,
      () => nodeHelper().setCornerShape(this.nativeView, value),
      () => (this.appleStyle.cornerShape = value),
    );
  }

  get color(): number {
    return this.style_view ? getUint32(this.style_view, StyleKeys.FONT_COLOR) : 0;
  }
  set color(value: number | string | { argb?: number }) {
    if (!this.style_view) return;
    const normalized = normalizeColorValue(value);
    if (normalized == null) {
      // Reset the state so the color inherits again.
      if (getInt8(this.style_view, StyleKeys.FONT_COLOR_STATE)) {
        this.writeFontColorState(0);
      }
      return;
    }
    this.writeFontColor(normalized, 1);
  }

  get boxSizing(): 'border-box' | 'content-box' | undefined {
    if (!this.style_view) return undefined;
    switch (getUint8(this.style_view, StyleKeys.BOX_SIZING)) {
      case 0: return 'border-box';
      case 1: return 'content-box';
      default: return undefined;
    }
  }
  set boxSizing(value: 'border-box' | 'content-box') {
    if (!this.style_view) return;
    const code = cssKeywordCode('box-sizing', value);
    if (code !== undefined) this.writeBoxSizing(code);
  }

  get clear(): 'none' | 'left' | 'right' | 'both' {
    if (!this.style_view) return 'none';
    switch (getUint8(this.style_view, StyleKeys.CLEAR)) {
      case 1: return 'left';
      case 2: return 'right';
      case 3: return 'both';
      default: return 'none';
    }
  }
  set clear(value: 'none' | 'left' | 'right' | 'both') {
    if (!this.style_view) return;
    const code = cssKeywordCode('clear', value);
    if (code !== undefined) this.writeClear(code);
    else this.commitState(StateKeys.CLEAR);
  }

  get direction(): 'inherit' | 'ltr' | 'rtl' {
    if (!this.style_view) return 'inherit';
    switch (getUint8(this.style_view, StyleKeys.DIRECTION)) {
      case 1: return 'ltr';
      case 2: return 'rtl';
      default: return 'inherit';
    }
  }
  set direction(value: 'inherit' | 'ltr' | 'rtl') {
    if (!this.style_view) return;
    const code = cssKeywordCode('direction', value) ?? 0;
    if (getUint8(this.style_view, StyleKeys.DIRECTION) !== code) this.writeDirection(code);
  }

  get flexBasis() {
    const type = getInt8(this.style_view, StyleKeys.FLEX_BASIS_TYPE);
    return this.readLayoutMath('flex-basis', type) ?? parseDimension(type, getFloat32(this.style_view, StyleKeys.FLEX_BASIS_VALUE));
  }
  set flexBasis(value: DimensionLength) {
    if (this.applyLayoutMath('flex-basis', value)) return;
    const length = layoutLengthValue(value, 'dimension', this.emBasisFor(value));
    if (length) this.writeFlexBasisType(length.type, length.value);
  }

  get flexDirection(): 'row' | 'column' | 'row-reverse' | 'column-reverse' | undefined {
    if (!this.style_view) return undefined;
    switch (getUint8(this.style_view, StyleKeys.FLEX_DIRECTION)) {
      case 0: return 'row';
      case 1: return 'column';
      case 2: return 'row-reverse';
      case 3: return 'column-reverse';
      default: return undefined;
    }
  }
  set flexDirection(value: 'row' | 'column' | 'row-reverse' | 'column-reverse') {
    if (!this.style_view) return;
    const code = cssKeywordCode('flex-direction', value);
    if (code !== undefined) this.writeFlexDirection(code);
  }

  get flexGrow(): number {
    return getFloat32(this.style_view, StyleKeys.FLEX_GROW);
  }
  set flexGrow(value: number) {
    if (getFloat32(this.style_view, StyleKeys.FLEX_GROW) === value) return;
    this.writeFlexGrow(value);
  }

  get flexShrink(): number {
    return getFloat32(this.style_view, StyleKeys.FLEX_SHRINK);
  }
  set flexShrink(value: number) {
    if (getFloat32(this.style_view, StyleKeys.FLEX_SHRINK) === value) return;
    this.writeFlexShrink(value);
  }

  get flexWrap(): 'nowrap' | 'wrap' | 'wrap-reverse' | 'balance' | 'balance-reverse' | undefined {
    if (!this.style_view) return undefined;
    switch (getUint8(this.style_view, StyleKeys.FLEX_WRAP)) {
      case 0: return 'nowrap';
      case 1: return 'wrap';
      case 2: return 'wrap-reverse';
      case 3: return 'balance';
      case 4: return 'balance-reverse';
      default: return undefined;
    }
  }
  set flexWrap(value: 'nowrap' | 'no-wrap' | 'wrap' | 'wrap-reverse' | 'balance' | 'balance-reverse') {
    if (!this.style_view) return;
    const code = cssKeywordCode('flex-wrap', value);
    if (code !== undefined) this.writeFlexWrap(code);
  }

  get float(): 'none' | 'left' | 'right' {
    if (!this.style_view) return 'none';
    switch (getUint8(this.style_view, StyleKeys.FLOAT)) {
      case 1: return 'left';
      case 2: return 'right';
      default: return 'none';
    }
  }
  set float(value: 'none' | 'left' | 'right') {
    if (!this.style_view) return;
    const code = cssKeywordCode('float', value) ?? 0;
    if (getUint8(this.style_view, StyleKeys.FLOAT) !== code) this.writeFloat(code);
  }

  get fontSize() {
    if (!this.style_view) return 16;
    const unit = getUint8(this.style_view, StyleKeys.FONT_SIZE_TYPE);
    const size = getFloat32(this.style_view, StyleKeys.FONT_SIZE);
    return unit === 1 ? `${size / 100}%` as never : size;
  }
  set fontSize(value: string | number | { value: number; unit: 'dip' | 'px' | '%' }) {
    if (!this.style_view) return;
    switch (typeof value) {
      case 'string': {
        const fields = resolveLengthInRust(value, isCssMathFunction(value.trim()) ? this.parentEmBasis() : undefined, true);
        if (!fields) break;
        const [kind, amount] = fields;
        this.writeFontSize(kind === 2 ? amount * 100 : kind === 1 ? layout.toDeviceIndependentPixels(amount) : amount, 1, kind === 2 ? 1 : 0);
        break;
      }
      case 'number':
        this.writeFontSize(value, 1, 0);
        break;
      case 'object':
        if (value.unit === 'dip' || value.unit === 'px') this.writeFontSize(finite(value.value), 1, 0);
        else if (value.unit === '%') this.writeFontSize(value.value * 100, 1, 1);
        break;
    }
  }

  get gap(): string {
    const row = this.rowGap;
    const column = this.columnGap;
    const rowCss = typeof row === 'string' ? row : CoreLength.convertToString(row as never);
    const columnCss = typeof column === 'string' ? column : CoreLength.convertToString(column as never);
    return rowCss === columnCss ? rowCss : `${rowCss} ${columnCss}`;
  }
  set gap(value: string) {
    if (typeof value !== 'string') return;
    const gaps = expandCssShorthand('gap', value);
    if (!gaps) return;
    const [rowValue, columnValue] = gaps.map((gap) => gap === 'normal' ? 0 : gap);
    if (layoutMathText(rowValue) || layoutMathText(columnValue)) {
      this.rowGap = rowValue as Length;
      this.columnGap = columnValue as Length;
      return;
    }
    const row = layoutLengthValue(rowValue, 'length', this.emBasisFor(rowValue));
    const column = layoutLengthValue(columnValue, 'length', this.emBasisFor(columnValue));
    if (row && column) this.writeGap(row.type, row.value, column.type, column.value);
  }

  get gridAutoFlow(): GridAutoFlow {
    if (!this.style_view) return 'row';
    switch (getUint8(this.style_view, StyleKeys.GRID_AUTO_FLOW)) {
      case 0: return 'row';
      case 1: return 'column';
      case 2: return 'row dense';
      case 3: return 'column dense';
      default: return undefined;
    }
  }
  set gridAutoFlow(value: GridAutoFlow) {
    if (!this.style_view) return;
    const code = cssKeywordCode('grid-auto-flow', value);
    if (code !== undefined) this.writeGridAutoFlow(code);
  }

  get height() {
    const type = getInt8(this.style_view, StyleKeys.HEIGHT_TYPE);
    return this.readLayoutMath('height', type) ?? parseDimension(type, getFloat32(this.style_view, StyleKeys.HEIGHT_VALUE));
  }
  set height(value: DimensionLength) {
    if (this.applyLayoutMath('height', value)) return;
    const length = layoutLengthValue(value, 'dimension', this.emBasisFor(value));
    if (length) this.writeHeight(length.type, length.value);
  }

  set inset(value: LengthAuto) {
    if (typeof value === 'string' && value.trim()) {
      const sides = expandCssShorthand('inset', value);
      if (!sides) return;
      const wasInBatch = this.inBatch;
      this.inBatch = true;
      try {
        this.top = sides[0] as never;
        this.right = sides[1] as never;
        this.bottom = sides[2] as never;
        this.left = sides[3] as never;
      } finally {
        this.inBatch = wasInBatch;
      }
      this.stampPhysical('inset', 15);
      this.commitState(StateKeys.INSET);
      return;
    }

    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeInset(
      length.type, length.value, length.type, length.value,
      length.type, length.value, length.type, length.value,
    );
  }

  get justifyContent(): 'normal' | 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'flex-end' | undefined {
    if (!this.style_view) return undefined;
    switch (getInt8(this.style_view, StyleKeys.JUSTIFY_CONTENT)) {
      case -1: return 'normal';
      case 0: return 'start';
      case 1: return 'end';
      case 2: return 'center';
      case 3: return 'stretch';
      case 4: return 'space-between';
      case 5: return 'space-around';
      case 6: return 'space-evenly';
      case 7: return 'flex-start';
      case 8: return 'flex-end';
      default: return undefined;
    }
  }
  set justifyContent(value: 'normal' | 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'flex-end') {
    if (!this.style_view) return;
    const code = cssKeywordCode('justify-content', value);
    if (code !== undefined) this.writeJustifyContent(code);
  }

  get justifyItems(): 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end' | undefined {
    if (!this.style_view) return undefined;
    switch (getInt8(this.style_view, StyleKeys.JUSTIFY_ITEMS)) {
      case -1: return 'normal';
      case 0: return 'start';
      case 1: return 'end';
      case 2: return 'center';
      case 3: return 'baseline';
      case 4: return 'stretch';
      case 5: return 'flex-start';
      case 6: return 'flex-end';
      default: return undefined;
    }
  }
  set justifyItems(value: 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end') {
    if (!this.style_view) return;
    const code = cssKeywordCode('justify-items', value);
    if (code !== undefined) this.writeJustifyItems(code);
  }

  get justifySelf(): 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end' | undefined {
    if (!this.style_view) return undefined;
    switch (getInt8(this.style_view, StyleKeys.JUSTIFY_SELF)) {
      case -1: return 'normal';
      case 0: return 'start';
      case 1: return 'end';
      case 2: return 'center';
      case 3: return 'baseline';
      case 4: return 'stretch';
      case 5: return 'flex-start';
      case 6: return 'flex-end';
      default: return undefined;
    }
  }
  set justifySelf(value: 'normal' | 'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'flex-start' | 'flex-end') {
    if (!this.style_view) return;
    const code = cssKeywordCode('justify-self', value);
    if (code !== undefined) this.writeJustifySelf(code);
  }

  get letterSpacing(): CoreTypes.LengthType | number {
    return getFloat32(this.style_view, StyleKeys.LETTER_SPACING);
  }
  set letterSpacing(value: string | CoreTypes.LengthType | number) {
    if (typeof value === 'string') {
      const fields = nativeCssLength(value, CssParseKind.LetterSpacing, ...numericCssContext(value, this.emBasisFor(value)));
      if (fields) this.writeLetterSpacing(fields[1], 1);
    } else if (typeof value === 'number') {
      this.writeLetterSpacing(value, 1);
    } else if (typeof value === 'object') {
      if (value.unit === 'dip' || value.unit === 'px') this.writeLetterSpacing(layout.toDevicePixels(value.value), 1);
    }
  }

  get lineHeight(): CoreTypes.LengthType | number {
    return getFloat32(this.style_view, StyleKeys.LINE_HEIGHT);
  }
  set lineHeight(value: string | CoreTypes.LengthType | number) {
    if (typeof value === 'string') {
      const fields = nativeCssLength(value, CssParseKind.LineHeight, ...numericCssContext(value, this.emBasis()));
      if (!fields) return;
      const [kind, amount] = fields;
      if (kind === 3) this.writeLineHeightState(0);
      else this.writeLineHeight(amount, 1, kind);
    } else if (typeof value === 'number') {
      // The NativeScript numeric API distinguishes unitless multipliers from rem-derived pixels.
      this.writeLineHeight(value, 1, value >= 4 ? 1 : 0);
    } else if (typeof value === 'object') {
      if (value.unit === 'dip') this.writeLineHeight(value.value, 1, 1);
      else if (value.unit === 'px') this.writeLineHeight(layout.toDeviceIndependentPixels(value.value), 1, 1);
    }
  }

  get lineClamp(): number | 'none' {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.LINE_CLAMP_STATE)) return 'none';
    const lines = getInt32(this.style_view, StyleKeys.LINE_CLAMP);
    return lines > 0 ? lines : 'none';
  }
  set lineClamp(value: number | string) {
    if (!this.style_view) return;
    const lines = typeof value === 'number' ? Math.trunc(value) : Number(expandCssShorthand('line-clamp', value)?.[0]);
    if (!Number.isFinite(lines) || lines < 0 || lines > 0x7fffffff) return;
    this.writeLineClamp(lines, 1);
  }

  get listStylePosition(): 'outside' | 'inside' {
    if (!this.style_view) return 'outside';
    switch (getUint8(this.style_view, StyleKeys.LIST_STYLE_POSITION)) {
      case 1: return 'inside';
      default: return 'outside';
    }
  }
  set listStylePosition(value: 'outside' | 'inside') {
    if (!this.style_view) return;
    const code = cssKeywordCode('list-style-position', value);
    if (code !== undefined) this.writeListStylePosition(code, 1);
  }

  get listStyleType(): 'none' | 'custom' | 'disc' | 'circle' | 'square' | 'decimal' {
    if (!this.style_view) return 'none';
    switch (getUint8(this.style_view, StyleKeys.LIST_STYLE_TYPE)) {
      case 1: return 'custom';
      case 2: return 'disc';
      case 3: return 'circle';
      case 4: return 'square';
      case 5: return 'decimal';
      default: return 'none';
    }
  }
  set listStyleType(value: 'none' | 'custom' | 'disc' | 'circle' | 'square' | 'decimal') {
    if (!this.style_view) return;
    const code = cssKeywordCode('list-style-type', value);
    if (code !== undefined) this.writeListStyleType(code, 1);
  }

  set margin(value: LengthAuto) {
    if (typeof value === 'string' && value.trim()) {
      const sides = expandCssShorthand('margin', value);
      if (!sides) return;
      const wasInBatch = this.inBatch;
      this.inBatch = true;
      try {
        this.marginTop = sides[0] as never;
        this.marginRight = sides[1] as never;
        this.marginBottom = sides[2] as never;
        this.marginLeft = sides[3] as never;
      } finally {
        this.inBatch = wasInBatch;
      }
      this.stampPhysical('margin', 15);
      this.commitState(StateKeys.MARGIN);
      return;
    }

    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMargin(
      length.type, length.value, length.type, length.value,
      length.type, length.value, length.type, length.value,
    );
  }

  get marginBottom() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_BOTTOM_TYPE);
    return this.readLayoutMath('margin-bottom', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MARGIN_BOTTOM_VALUE));
  }
  set marginBottom(value: LengthAuto) {
    if (this.applyLayoutMath('margin-bottom', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMarginBottomType(length.type, length.value);
  }

  get marginLeft() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_LEFT_TYPE);
    return this.readLayoutMath('margin-left', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MARGIN_LEFT_VALUE));
  }
  set marginLeft(value: LengthAuto) {
    if (this.applyLayoutMath('margin-left', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMarginLeftType(length.type, length.value);
  }

  get marginRight() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_RIGHT_TYPE);
    return this.readLayoutMath('margin-right', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MARGIN_RIGHT_VALUE));
  }
  set marginRight(value: LengthAuto) {
    if (this.applyLayoutMath('margin-right', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMarginRightType(length.type, length.value);
  }

  get marginTop() {
    const type = getInt8(this.style_view, StyleKeys.MARGIN_TOP_TYPE);
    return this.readLayoutMath('margin-top', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MARGIN_TOP_VALUE));
  }
  set marginTop(value: LengthAuto) {
    if (this.applyLayoutMath('margin-top', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMarginTopType(length.type, length.value);
  }

  get maxHeight() {
    const type = getInt8(this.style_view, StyleKeys.MAX_HEIGHT_TYPE);
    return this.readLayoutMath('max-height', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MAX_HEIGHT_VALUE));
  }
  set maxHeight(value: LengthAuto) {
    if (this.applyLayoutMath('max-height', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMaxHeight(length.type, length.value);
  }

  get maxWidth() {
    const type = getInt8(this.style_view, StyleKeys.MAX_WIDTH_TYPE);
    return this.readLayoutMath('max-width', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MAX_WIDTH_VALUE));
  }
  set maxWidth(value: LengthAuto) {
    if (this.applyLayoutMath('max-width', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMaxWidth(length.type, length.value);
  }

  get minHeight() {
    const type = getInt8(this.style_view, StyleKeys.MIN_HEIGHT_TYPE);
    return this.readLayoutMath('min-height', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MIN_HEIGHT_VALUE));
  }
  set minHeight(value: LengthAuto) {
    if (this.applyLayoutMath('min-height', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMinHeight(length.type, length.value);
  }

  get minWidth() {
    const type = getInt8(this.style_view, StyleKeys.MIN_WIDTH_TYPE);
    return this.readLayoutMath('min-width', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.MIN_WIDTH_VALUE));
  }
  set minWidth(value: LengthAuto) {
    if (this.applyLayoutMath('min-width', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeMinWidth(length.type, length.value);
  }

  get objectFit(): string {
    if (!this.style_view) return 'fill';
    switch (getUint8(this.style_view, StyleKeys.OBJECT_FIT)) {
      case 0: return 'contain';
      case 1: return 'cover';
      case 3: return 'none';
      case 4: return 'scale-down';
      default: return 'fill';
    }
  }
  set objectFit(value: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down') {
    if (!this.style_view) return;
    const code = cssKeywordCode('object-fit', value);
    if (code !== undefined) this.writeObjectFit(code);
  }

  get overflowX(): 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto' | undefined {
    if (!this.style_view) return undefined;
    switch (getUint8(this.style_view, StyleKeys.OVERFLOW_X)) {
      case 0: return 'visible';
      case 1: return 'hidden';
      case 2: return 'scroll';
      case 3: return 'clip';
      case 4: return 'auto';
      default: return undefined;
    }
  }
  set overflowX(value: 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto') {
    if (!this.style_view) return;
    const code = cssKeywordCode('overflow-x', value);
    if (code !== undefined) this.writeOverflowX(code);
  }

  get overflowY(): 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto' | undefined {
    if (!this.style_view) return undefined;
    switch (getUint8(this.style_view, StyleKeys.OVERFLOW_Y)) {
      case 0: return 'visible';
      case 1: return 'hidden';
      case 2: return 'scroll';
      case 3: return 'clip';
      case 4: return 'auto';
      default: return undefined;
    }
  }
  set overflowY(value: 'visible' | 'hidden' | 'scroll' | 'clip' | 'auto') {
    if (!this.style_view) return;
    const code = cssKeywordCode('overflow-y', value);
    if (code !== undefined) this.writeOverflowY(code);
  }

  get overflow() {
    const x = this.overflowX;
    const y = this.overflowY;
    return x === y ? x : `${x} ${y}`;
  }
  set overflow(value: OverFlow | `${OverFlow} ${OverFlow}`) {
    const axes = expandCssShorthand('overflow', value);
    if (!axes) return;
    const codes: Record<string, number> = { "visible": 0, "hidden": 1, "scroll": 2, "clip": 3, "auto": 4 };
    this.writeOverflowAxes(codes[axes[0]], codes[axes[1]]);
  }

  set padding(value: Length) {
    if (typeof value === 'string' && value.trim()) {
      const sides = expandCssShorthand('padding', value);
      if (!sides) return;
      const wasInBatch = this.inBatch;
      this.inBatch = true;
      try {
        this.paddingTop = sides[0] as never;
        this.paddingRight = sides[1] as never;
        this.paddingBottom = sides[2] as never;
        this.paddingLeft = sides[3] as never;
      } finally {
        this.inBatch = wasInBatch;
      }
      this.stampPhysical('padding', 15);
      this.commitState(StateKeys.PADDING);
      return;
    }

    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writePadding(
      length.type, length.value, length.type, length.value,
      length.type, length.value, length.type, length.value,
    );
  }

  get paddingBottom() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_BOTTOM_TYPE);
    return this.readLayoutMath('padding-bottom', type) ?? parseLengthPercentage(type, getFloat32(this.style_view, StyleKeys.PADDING_BOTTOM_VALUE));
  }
  set paddingBottom(value: Length) {
    if (this.applyLayoutMath('padding-bottom', value)) return;
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writePaddingBottomType(length.type, length.value);
  }

  get paddingLeft() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_LEFT_TYPE);
    return this.readLayoutMath('padding-left', type) ?? parseLengthPercentage(type, getFloat32(this.style_view, StyleKeys.PADDING_LEFT_VALUE));
  }
  set paddingLeft(value: Length) {
    if (this.applyLayoutMath('padding-left', value)) return;
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writePaddingLeftType(length.type, length.value);
  }

  get paddingRight() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_RIGHT_TYPE);
    return this.readLayoutMath('padding-right', type) ?? parseLengthPercentage(type, getFloat32(this.style_view, StyleKeys.PADDING_RIGHT_VALUE));
  }
  set paddingRight(value: Length) {
    if (this.applyLayoutMath('padding-right', value)) return;
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writePaddingRightType(length.type, length.value);
  }

  get paddingTop() {
    const type = getInt8(this.style_view, StyleKeys.PADDING_TOP_TYPE);
    return this.readLayoutMath('padding-top', type) ?? parseLengthPercentage(type, getFloat32(this.style_view, StyleKeys.PADDING_TOP_VALUE));
  }
  set paddingTop(value: Length) {
    if (this.applyLayoutMath('padding-top', value)) return;
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writePaddingTopType(length.type, length.value);
  }

  get position(): 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky' | undefined {
    if (!this.style_view) return undefined;
    switch (getUint8(this.style_view, StyleKeys.POSITION)) {
      case 0: return 'static';
      case 1: return 'relative';
      case 2: return 'absolute';
      case 3: return 'fixed';
      case 4: return 'sticky';
      default: return undefined;
    }
  }
  set position(value: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky') {
    if (!this.style_view) return;
    const code = cssKeywordCode('position', value);
    if (code !== undefined) this.writePosition(code);
  }

  get scrollBarWidth(): number | CoreTypes.LengthType {
    return getFloat32(this.style_view, StyleKeys.SCROLLBAR_WIDTH);
  }
  set scrollBarWidth(value: number | CoreTypes.LengthType) {
    if (typeof value === 'number') this.writeScrollbarWidth(value);
    else if (typeof value === 'object' && (value.unit === 'dip' || value.unit === 'px')) this.writeScrollbarWidth(layout.toDevicePixels(value.value));
  }

  get textJustify(): string {
    if (!this.style_view) return 'auto';
    switch (getInt8(this.style_view, StyleKeys.TEXT_JUSTIFY)) {
      case -1: return 'none';
      case 1: return 'inter-word';
      case 2: return 'inter-character';
      case 3: return 'distribute';
      default: return 'auto';
    }
  }
  set textJustify(value: 'none' | 'auto' | 'inter-word' | 'inter-character' | 'distribute') {
    if (!this.style_view) return;
    const code = cssKeywordCode('text-justify', value);
    if (code !== undefined) this.writeTextJustify(code, 1);
  }

  get textTransform(): 'none' | 'capitalize' | 'uppercase' | 'lowercase' {
    if (!this.style_view) return 'none';
    switch (getUint8(this.style_view, StyleKeys.TEXT_TRANSFORM)) {
      case 1: return 'capitalize';
      case 2: return 'uppercase';
      case 3: return 'lowercase';
      default: return 'none';
    }
  }
  set textTransform(value: 'none' | 'capitalize' | 'uppercase' | 'lowercase') {
    if (!this.style_view) return;
    const code = cssKeywordCode('text-transform', value);
    if (code !== undefined) this.writeTextTransform(code, 1);
  }

  get textWrap(): number {
    if (!this.style_view) return 0;
    return getUint8(this.style_view, StyleKeys.TEXT_WRAP);
  }
  set textWrap(value: number | 'wrap' | 'nowrap' | 'balance' | 'pretty' | 'stable') {
    if (!this.style_view) return;
    const code = typeof value === 'number' ? (value >= 0 && value < 3 ? value : undefined) : cssKeywordCode('text-wrap', value);
    if (code !== undefined) this.writeTextWrap(code, 1);
  }

  get whiteSpace(): string {
    if (!this.style_view) return 'normal';
    switch (getUint8(this.style_view, StyleKeys.WHITE_SPACE)) {
      case 1: return 'pre';
      case 2: return 'pre-wrap';
      case 3: return 'pre-line';
      case 4: return 'nowrap';
      case 5: return 'break-spaces';
      default: return 'normal';
    }
  }
  set whiteSpace(value: 'normal' | 'pre' | 'pre-wrap' | 'pre-line' | 'nowrap' | 'break-spaces') {
    if (!this.style_view) return;
    const code = cssKeywordCode('white-space', value);
    if (code !== undefined) this.writeWhiteSpace(code, 1);
  }

  get width() {
    const type = getInt8(this.style_view, StyleKeys.WIDTH_TYPE);
    return this.readLayoutMath('width', type) ?? parseDimension(type, getFloat32(this.style_view, StyleKeys.WIDTH_VALUE));
  }
  set width(value: DimensionLength) {
    if (this.applyLayoutMath('width', value)) return;
    const length = layoutLengthValue(value, 'dimension', this.emBasisFor(value));
    if (length) this.writeWidth(length.type, length.value);
  }

  get zIndex(): number {
    return getInt32(this.style_view, StyleKeys.Z_INDEX);
  }
  set zIndex(value: number) {
    if (getInt32(this.style_view, StyleKeys.Z_INDEX) === value) return;
    this.writeZIndex(value);
  }

  get top() {
    const type = getInt8(this.style_view, StyleKeys.INSET_TOP_TYPE);
    return this.readLayoutMath('top', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.INSET_TOP_VALUE));
  }
  set top(value: LengthAuto) {
    if (this.applyLayoutMath('top', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeInsetTopType(length.type, length.value);
  }

  get right() {
    const type = getInt8(this.style_view, StyleKeys.INSET_RIGHT_TYPE);
    return this.readLayoutMath('right', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.INSET_RIGHT_VALUE));
  }
  set right(value: LengthAuto) {
    if (this.applyLayoutMath('right', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeInsetRightType(length.type, length.value);
  }

  get bottom() {
    const type = getInt8(this.style_view, StyleKeys.INSET_BOTTOM_TYPE);
    return this.readLayoutMath('bottom', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.INSET_BOTTOM_VALUE));
  }
  set bottom(value: LengthAuto) {
    if (this.applyLayoutMath('bottom', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeInsetBottomType(length.type, length.value);
  }

  get left() {
    const type = getInt8(this.style_view, StyleKeys.INSET_LEFT_TYPE);
    return this.readLayoutMath('left', type) ?? parseLengthPercentageAuto(type, getFloat32(this.style_view, StyleKeys.INSET_LEFT_VALUE));
  }
  set left(value: LengthAuto) {
    if (this.applyLayoutMath('left', value)) return;
    const length = layoutLengthValue(value, 'auto', this.emBasisFor(value));
    if (length) this.writeInsetLeftType(length.type, length.value);
  }

  get rowGap() {
    const type = getInt8(this.style_view, StyleKeys.GAP_ROW_TYPE);
    return this.readLayoutMath('row-gap', type) ?? parseLengthPercentage(type, getFloat32(this.style_view, StyleKeys.GAP_ROW_VALUE));
  }
  set rowGap(value: Length) {
    if (this.applyLayoutMath('row-gap', value)) return;
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writeRowGap(length.type, length.value);
  }

  get columnGap() {
    const type = getInt8(this.style_view, StyleKeys.GAP_COLUMN_TYPE);
    return this.readLayoutMath('column-gap', type) ?? parseLengthPercentage(type, getFloat32(this.style_view, StyleKeys.GAP_COLUMN_VALUE));
  }
  set columnGap(value: Length) {
    if (this.applyLayoutMath('column-gap', value)) return;
    const length = layoutLengthValue(value, 'length', this.emBasisFor(value));
    if (length) this.writeColumnGap(length.type, length.value);
  }

  private writeWindowsTextDecoration(name: string, value: string) {
    switch (name) {
      case 'text-decoration': {
        const decoration = parseTextDecoration(value, (token) => cssLengthToDip(token, this.emBasisFor(token)));
        if (decoration) this.writeTextDecoration(decoration.line, decoration.style, decoration.color, decoration.thickness, 1, 1, 1, 1);
        break;
      }
      case 'text-decoration-line': {
        const result = parseTextDecorationLine(value);
        if (result != null) this.writeDecorationLine(result, 1);
        break;
      }
      case 'text-decoration-style': {
        const result = parseTextDecorationStyle(value);
        if (result != null) this.writeDecorationStyle(result, 1);
        break;
      }
      case 'text-decoration-color': {
        const result = parseTextDecorationColor(value);
        if (result != null) this.writeDecorationColor(result, 1);
        break;
      }
      case 'text-decoration-thickness': {
        const length = decorationField(name, value);
        if (length == null) break;
        const thickness = length === '' ? 0 : cssLengthToDip(length, this.emBasisFor(length));
        if (thickness != null) this.writeDecorationThickness(thickness, 1);
        break;
      }
    }
  }

  private writeWindowsCornerShape(name: string, value: string) {
    const fields = expandCssShorthand(name, value);
    if (!fields) return;
    switch (name) {
      case 'corner-shape-top-left': this.writeCornerShapeTopLeft(Number(fields[0])); break;
      case 'corner-shape-top-right': this.writeCornerShapeTopRight(Number(fields[0])); break;
      case 'corner-shape-bottom-right': this.writeCornerShapeBottomRight(Number(fields[0])); break;
      case 'corner-shape-bottom-left': this.writeCornerShapeBottomLeft(Number(fields[0])); break;
      case 'corner-shape': this.writeCornerShape(Number(fields[0]), Number(fields[1]), Number(fields[2]), Number(fields[3])); break;
    }
  }
  // </style-keys:accessors>

  private view_: View;
  // Fetched on first use; see loadBuffer.
  private _sv: DataView | undefined;
  private _i8: Int8Array | undefined;
  private _u8: Uint8Array | undefined;
  private _bufferRequested = false;
  // Dirty mask words (StateKeys layout); `_hasDirty` false means clean.
  private _d0 = 0;
  private _d1 = 0;
  private _d2 = 0;
  private _d3 = 0;
  private _hasDirty = false;
  private inBatch = false;
  private _syncScheduled = false;
  // Buffer bytes before this turn's first write. Frameworks often undo and
  // redo the same values (NativeScript-Vue re-applies every inline style key
  // each render); if the bytes end up unchanged the native sync is skipped.
  // `false` means a write happened without a snapshot, so always sync.
  private _turnSnapshot: Uint8Array | false | undefined = undefined;
  private _synced = false;
  private nativeView: any;
  private nativeNode: any;
  private _pseudo: number;
  // The last border-radius CSS; null when corners were written as numbers (built on read).
  private _borderRadiusCss: string | null | undefined;
  private _appleStyle: MasonStyle | undefined;
  private _backgroundWrites?: string[];
  private _effectWrites?: string[];
  private _maskWrites?: Map<number, string>;

  static fromView(view: View, nativeView): Style {
    const ret = new Style();
    ret.view_ = view;
    ret.nativeView = nativeView;
    return ret;
  }

  private get style_view(): DataView {
    if (!this._bufferRequested) this.loadBuffer();
    return this._sv;
  }

  private set style_view(value: DataView) {
    this._bufferRequested = true;
    this._sv = value;
  }

  private get i8View(): Int8Array {
    if (!this._bufferRequested) this.loadBuffer();
    if (this._i8 === undefined && this._sv) this._i8 = new Int8Array(this._sv.buffer, this._sv.byteOffset, this._sv.byteLength);
    return this._i8;
  }

  private set i8View(value: Int8Array) {
    this._i8 = value;
  }

  private get u8View(): Uint8Array {
    if (!this._bufferRequested) this.loadBuffer();
    if (this._u8 === undefined && this._sv) this._u8 = new Uint8Array(this._sv.buffer, this._sv.byteOffset, this._sv.byteLength);
    return this._u8;
  }

  private set u8View(value: Uint8Array) {
    this._u8 = value;
  }

  /** The native MasonStyle, fetched once (each `nativeView.style` read is a bridge call). */
  private get appleStyle(): MasonStyle {
    if (this._appleStyle === undefined) {
      const view = this._pseudo ? this.pseudoNativeView : this.nativeView;
      this._appleStyle = ((view as MasonElementObjc)?.style ?? NSCMason.shared.styleForViewOrNode(view)) as never;
    }
    return this._appleStyle;
  }

  private applyLayoutMath(property: string, value: unknown): boolean {
    if (!(__ANDROID__ || __APPLE__ || __WINDOWS__ || __LINUX__)) return false;
    const css = layoutMathText(value);
    const state = css ? layoutMathState(property) : undefined;
    if (!css || !state) return false;
    if (VIEWPORT_UNIT_TEXT.test(css)) noteViewportUnit();
    const view = this._pseudo ? this.pseudoNativeView : this.nativeView;
    const flags = this._pseudo;
    let applied: boolean;
    if (__ANDROID__) {
      const helper = nodeHelper() as any;
      const method = flags ? helper.applyLayoutLengthForState : helper.applyLayoutLength;
      if (typeof method !== 'function') return false;
      if (!flags) this.prepareMut();
      applied = flags ? helper.applyLayoutLengthForState(view, flags, property, css) : helper.applyLayoutLength(view, property, css);
    } else if (__APPLE__) {
      const style = this.appleStyle as any;
      const method = flags ? style?.applyLayoutLengthForState : style?.applyLayoutLength;
      if (typeof method !== 'function') return false;
      if (!flags) this.prepareMut();
      applied = flags ? style.applyLayoutLengthForState(flags, property, css) : style.applyLayoutLength(property, css);
    } else {
      const native = windowsNativeStyle(view) as any;
      const method = flags ? native?.ApplyLayoutLengthForState : native?.ApplyLayoutLength;
      if (typeof method !== 'function') return false;
      // Flush pending changes before the Rust write, then reload the projected style.
      if (this._hasDirty) this.syncStyle();
      else if (flags && this.u8View?.length) this.writeWindowsPseudoStyle();
      const [_, font, root, width, height] = numericCssContext(css, this.emBasisFor(css));
      if (flags) {
        applied = native.ApplyLayoutLengthForState(flags, property, css, font, root, width, height);
        if (applied) this.setBuffer(new Uint8Array(masonEngine().ReadPseudoStyleValues(this.nativeNode, flags)).buffer);
      } else {
        applied = native.ApplyLayoutLength(property, css, font, root, width, height);
        if (applied) this.loadBuffer();
      }
    }
    if (applied) this.setOrAppendState(state);
    return true;
  }

  private readLayoutMath(property: string, type: number): CssMathLength | undefined {
    if (type !== LAYOUT_MATH_TYPE) return;
    let css: string | undefined | null;
    const flags = this._pseudo;
    if (__ANDROID__) {
      const helper = nodeHelper() as any;
      css = flags ? helper.layoutLengthCssForState?.(this.pseudoNativeView, flags, property) : helper.layoutLengthCss?.(this.nativeView, property);
    }
    if (__APPLE__) {
      const style = this.appleStyle as any;
      css = flags ? style?.layoutLengthCssForState?.(flags, property) : style?.layoutLengthCss?.(property);
    }
    if (__WINDOWS__ || __LINUX__) {
      const style = windowsNativeStyle(flags ? this.pseudoNativeView : this.nativeView) as any;
      css = flags ? style?.LayoutLengthCssForState?.(flags, property) : style?.LayoutLengthCss?.(property);
    }
    return (css || undefined) as CssMathLength | undefined;
  }

  // The byte views are rarely read, so they are made on demand.
  private setBuffer(buffer: ArrayBuffer, offset?: number, length?: number) {
    this._bufferRequested = true;
    this._sv = new DataView(buffer, offset, length);
    this._i8 = undefined;
    this._u8 = undefined;
  }

  // A new node shares the arena's default buffer. Every style here gets written
  // (core reads defaults right before its setters), so the first access takes
  // the node's own copy: one native fetch instead of a shared read plus a copy.
  private loadBuffer() {
    this._bufferRequested = true;
    if (__ANDROID__ || __APPLE__) {
      const slot = styleSlot(this.nativeView);
      const chunk = slot >= 0 ? styleChunk((slot / STYLE_SLOTS_PER_CHUNK) | 0) : undefined;
      if (chunk) {
        this.setBuffer(chunk, (slot % STYLE_SLOTS_PER_CHUNK) * StyleKeys.STYLE_BUFFER_SIZE, StyleKeys.STYLE_BUFFER_SIZE);
        return;
      }
    }
    if (__ANDROID__) {
      this.setBuffer((<any>ArrayBuffer).from(androidWritableStyleBuffer(this.nativeView)));
    } else if (__APPLE__) {
      const nativeView = this.nativeView;
      let data: NSMutableData | null = null;
      if (appleHasWritableStyleValues(nativeView)) {
        data = nativeView.mason_writableStyleValues();
      }
      if (!data) {
        const style = this.appleStyle;
        style.prepareMut();
        data = style.values;
      }
      this.setBuffer(interop.bufferFromData(data));
    } else if (__WINDOWS__ || __LINUX__) {
      // Live IBuffer over the engine's arena style memory; the @nativescript/windows runtime
      // projects it as a writable ArrayBuffer, so the same StyleKeys-offset writes used on
      // iOS/Android land straight in the node's style.
      //@ts-ignore
      this.setBuffer(arrayBufferOf(windowsStyleValues(this.nativeView, !!this.view_ && !this.view_[isMasonView_])));
    }
  }

  /** The dirty mask as one value, `-1n` when clean (tests and diagnostics). */
  private get isDirty(): bigint {
    return this._hasDirty ? wordsToBigInt(this._d0, this._d1, this._d2, this._d3) : -1n;
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
    ret.pseudoNativeView = nativeView;
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
    } else if (__WINDOWS__ && nativeView?.Node) {
      ret.nativeNode = nativeView.Node;
      ret.setBuffer(new Uint8Array(masonEngine().ReadPseudoStyleValues(ret.nativeNode, mask)).buffer);
      ret.clearPseudoSetMask();
    }

    return ret;
  }

  private pseudoNativeView?: any;

  private clearPseudoSetMask() {
    const LOW_OFFSET = StyleKeys.PSEUDO_SET_MASK_LOW;
    const HIGH_OFFSET = StyleKeys.PSEUDO_SET_MASK_HIGH;

    if (!this.style_view || this.style_view.byteLength < HIGH_OFFSET + 8) {
      return;
    }

    this.style_view.setBigUint64(LOW_OFFSET, 0n, true);
    this.style_view.setBigUint64(HIGH_OFFSET, 0n, true);
  }

  markPseudoSet(key: StateKeys) {
    const LOW_OFFSET = StyleKeys.PSEUDO_SET_MASK_LOW;
    const HIGH_OFFSET = StyleKeys.PSEUDO_SET_MASK_HIGH;

    if (!this.style_view || this.style_view.byteLength < HIGH_OFFSET + 8) return;

    const v = this.style_view;
    setInt32(v, LOW_OFFSET, getInt32(v, LOW_OFFSET) | key.w0);
    setInt32(v, LOW_OFFSET + 4, getInt32(v, LOW_OFFSET + 4) | key.w1);
    setInt32(v, HIGH_OFFSET, getInt32(v, HIGH_OFFSET) | key.w2);
    setInt32(v, HIGH_OFFSET + 4, getInt32(v, HIGH_OFFSET + 4) | key.w3);
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

    if (__WINDOWS__ || __LINUX__) {
      // Android and iOS parse these natively; Windows parses them here into the style buffer.
      if (!this._pseudo) this._windowsCss.set(name, value);
      this.applyWindowsCssString(name, value);
    }
  }

  private setBackgroundCss(name: string, value: string) {
    if ((__ANDROID__ || __APPLE__) && this._pseudo) {
      this.nativeNode?.setPseudoString(this._pseudo, name, value);
      return;
    }
    if (!this.nativeView || !(__ANDROID__ || __APPLE__ || __WINDOWS__ || __LINUX__)) return;
    if ((__WINDOWS__ || __LINUX__) && !this._pseudo) this._windowsCss.set(name, value);
    const currentColor = name === 'background' || name === 'background-image' ? String(this.color) : '';
    const fields = this._backgroundWrites ??= [];
    const offset = fields.length;
    fields.length += CssBackgroundWriteRecord.STRIDE;
    fields[offset + CssBackgroundWriteRecord.PROPERTY] = name;
    fields[offset + CssBackgroundWriteRecord.VALUE] = value.replaceAll('\0', '\uFFFD');
    fields[offset + CssBackgroundWriteRecord.CURRENT_COLOR] = currentColor;
    this.scheduleSync();
  }

  private setEffectCss(name: string, value: string) {
    if (!this.nativeView || !(__ANDROID__ || __APPLE__ || __WINDOWS__ || __LINUX__)) return;
    value = value == null ? '' : String(value);
    if ((__ANDROID__ || __APPLE__) && this._pseudo) {
      this.nativeNode.setPseudoString(this._pseudo, name, value);
      return;
    }
    if ((__WINDOWS__ || __LINUX__) && !this._pseudo) this._windowsCss.set(name, value);
    const style = __WINDOWS__ ? this.style_view : undefined;
    const color = !__WINDOWS__ || (style && getUint8(style, StyleKeys.FONT_COLOR_STATE)) ? String(this.color) : '';
    const fields = this._effectWrites ??= [];
    const offset = fields.length;
    fields.length += CssEffectWriteRecord.STRIDE;
    fields[offset + CssEffectWriteRecord.PROPERTY] = name;
    fields[offset + CssEffectWriteRecord.VALUE] = value.replaceAll('\0', '\uFFFD');
    fields[offset + CssEffectWriteRecord.CURRENT_COLOR] = color;
    this.scheduleSync();
  }

  private flushEffectWrites() {
    const fields = this._effectWrites;
    if (!fields) return;
    this._effectWrites = undefined;
    const payload = JSON.stringify(fields);
    if (__ANDROID__) {
      nodeHelper().applyEffectBatch(this.nativeView, payload);
    } else if (__APPLE__) {
      this.appleStyle.applyEffectBatch(payload);
    } else if (__WINDOWS__ || __LINUX__) {
      NativeScript.Mason.Css.SetCssEffects(this.nativeView, payload, this.emBasis(), cssUnits.rootFontSize,
        cssUnits.viewportWidth, cssUnits.viewportHeight);
    }
  }

  private setMaskCss(name: string, slot: number, value: string) {
    value = value == null ? '' : String(value);
    const write = () => {
      (this._maskWrites ??= new Map()).set(slot, value);
      this.scheduleSync();
    };
    this.setPseudoCssStringValue(name, value, write, write);
  }

  private flushMaskWrites() {
    const pending = this._maskWrites;
    if (!pending) return;
    this._maskWrites = undefined;
    const fields = new Array<string>(pending.size * CssMaskWriteRecord.STRIDE);
    let offset = 0;
    for (const [slot, value] of pending) {
      fields[offset + CssMaskWriteRecord.SLOT] = String(slot);
      fields[offset + CssMaskWriteRecord.VALUE] = value;
      offset += CssMaskWriteRecord.STRIDE;
    }
    const payload = JSON.stringify(fields);
    if (__ANDROID__) {
      nodeHelper().applyMaskBatch(this.nativeView, payload);
    } else if (__APPLE__) {
      this.appleStyle.applyMaskBatch(payload);
    }
  }

  private flushBackgroundWrites() {
    const fields = this._backgroundWrites;
    if (!fields) return;
    this._backgroundWrites = undefined;
    if (__ANDROID__) {
      nodeHelper().applyBackgroundBatch(this.nativeView, JSON.stringify(fields));
    } else if (__APPLE__) {
      this.appleStyle.applyBackgroundBatch(JSON.stringify(fields));
    } else if (__WINDOWS__ || __LINUX__) {
      const color = NativeScript.Mason.Css.SetCssBackground(this.nativeView, JSON.stringify({
        writes: fields,
        units: [this.emBasis(), cssUnits.rootFontSize, cssUnits.viewportWidth, cssUnits.viewportHeight, this.color],
        appRoot: windowsAppFile('~/'),
      }));
      if (color >= 0) this.backgroundColor = color;
    }
  }

  private _windowsCss = new Map<string, string>();

  private _windowsMaskSpec = '';
  private _windowsMaskOverrides?: Map<string, string>;

  private windowsMaskContext(): WindowsMaskContext {
    return {
      gradientUnits: (value) => [
        this.emBasisFor(value) ?? cssUnits.rootFontSize,
        cssUnits.rootFontSize, cssUnits.viewportWidth, cssUnits.viewportHeight,
        (this.color as unknown as number) >>> 0,
      ],
      source: windowsAppFile,
    };
  }

  // The mask longhands arrive one setter at a time (a shorthand sets eight, a keyframe two), so
  // they're sent to Css.SetMask together once the current task is done.
  private scheduleWindowsMask(name: string, value: string) {
    const pending = this._windowsMaskOverrides !== undefined;
    (this._windowsMaskOverrides ??= new Map()).set(name, value);
    if (pending) return;
    Promise.resolve().then(() => {
      const overrides = this._windowsMaskOverrides;
      this._windowsMaskOverrides = undefined;
      const view = this.nativeView;
      if (!view) return;
      // A pseudo-class state's values aren't in _windowsCss; they win over it while applied.
      const css = new Map(this._windowsCss);
      for (const [key, v] of overrides ?? []) css.set(key, v);
      let spec = '';
      try {
        spec = encodeWindowsMask(css, this.windowsMaskContext());
      } catch (_) {}
      if (spec === this._windowsMaskSpec) return;
      this._windowsMaskSpec = spec;
      NativeScript.Mason.Css.SetMask(view, spec);
    });
  }

  private applyWindowsCssString(name: string, value: string) {
    if (WINDOWS_MASK_PROPERTIES.has(name)) {
      this.scheduleWindowsMask(name, typeof value === 'string' ? value : String(value ?? ''));
      return;
    }
    if (name === 'border-image') {
      const view: any = this.nativeView;
      if (!view) return;
      let spec = '';
      try {
        spec = encodeWindowsBorderImage(typeof value === 'string' ? value : '', this.windowsMaskContext());
      } catch (_) {}
      NativeScript.Mason.Css.SetBorderImage(view, spec);
      return;
    }
    if (name === 'font-feature-settings') {
      const view: any = this.nativeView;
      if (view && typeof view.SetFontFeatureSettings === 'function') view.SetFontFeatureSettings(typeof value === 'string' ? value : '');
      return;
    }

    if (name === 'padding' || name === 'margin' || name === 'inset') {
      if (!value?.trim()) return;
      if (name === 'padding') this.padding = value as never;
      else if (name === 'margin') this.margin = value as never;
      else this.inset = value as never;
      return;
    }

    if (!this.style_view) {
      return;
    }
    if (name === 'text-decoration' || name.startsWith('text-decoration-')) {
      this.writeWindowsTextDecoration(name, value);
      return;
    }
    if (name === 'border-radius') {
      this._writeBorderRadius(value, 1);
      return;
    }
    if (name === 'corner-shape' || name.startsWith('corner-shape-')) {
      this.writeWindowsCornerShape(name, value);
      return;
    }

    if (name === 'border' || name === 'border-top' || name === 'border-right' || name === 'border-bottom' || name === 'border-left') {
      const sides: ('top' | 'right' | 'bottom' | 'left')[] = name === 'border' ? ['top', 'right', 'bottom', 'left']
        : name === 'border-top' ? ['top'] : name === 'border-right' ? ['right'] : name === 'border-bottom' ? ['bottom'] : ['left'];
      const fields = expandCssShorthand(name === 'border' ? 'border-components' : 'border-side-components', value);
      if (!fields) return;
      const emBasis = this.emBasisFor(value);
      const widths = fields.slice(0, sides.length).map((width) => borderWidthInDip(width, emBasis));
      const styleCode = fields[sides.length] ? Number(fields[sides.length]) : -1;
      const color = fields[sides.length + 1] ? Number(fields[sides.length + 1]) : null;
      const style = styleCode === -1 ? (widths.some((width) => width !== null) || color !== null ? BorderStyleCode.Solid : null) : styleCode;
      if (style === null && color === null && widths.every((width) => width === null)) return;
      for (const [index, side] of sides.entries()) this.writeBorderSide(side, widths[index], style, color);
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

  // <style-keys:border-accessors> generated from tools/scripts/style-keys/style-keys.schema
  private static readonly borderSideKeys = {
    top: [StyleKeys.BORDER_TOP_TYPE, StyleKeys.BORDER_TOP_VALUE, StyleKeys.BORDER_TOP_STYLE, StyleKeys.BORDER_TOP_COLOR],
    right: [StyleKeys.BORDER_RIGHT_TYPE, StyleKeys.BORDER_RIGHT_VALUE, StyleKeys.BORDER_RIGHT_STYLE, StyleKeys.BORDER_RIGHT_COLOR],
    bottom: [StyleKeys.BORDER_BOTTOM_TYPE, StyleKeys.BORDER_BOTTOM_VALUE, StyleKeys.BORDER_BOTTOM_STYLE, StyleKeys.BORDER_BOTTOM_COLOR],
    left: [StyleKeys.BORDER_LEFT_TYPE, StyleKeys.BORDER_LEFT_VALUE, StyleKeys.BORDER_LEFT_STYLE, StyleKeys.BORDER_LEFT_COLOR],
  } as const;

  // Write the components provided by the shorthand. Its caller commits dirty groups together.
  private writeBorderSide(side: 'top' | 'right' | 'bottom' | 'left', width: number | null, style: number | null, color: number | null) {
    if (!this.style_view) return;
    const [widthType, widthValue, styleKey, colorKey] = Style.borderSideKeys[side];
    this.prepareMut();
    if (width != null) {
      setInt8(this.style_view, widthType, 0);
      setFloat32(this.style_view, widthValue, width);
    }
    if (style != null) setInt8(this.style_view, styleKey, style);
    if (color != null) setUint32(this.style_view, colorKey, color >>> 0);
  }

  get borderTopColor(): string {
    return new Color(getUint32(this.style_view, StyleKeys.BORDER_TOP_COLOR)).hex;
  }
  set borderTopColor(value: number | string | { argb?: number }) {
    this.setBorderSideColor('top', value);
  }

  get borderRightColor(): string {
    return new Color(getUint32(this.style_view, StyleKeys.BORDER_RIGHT_COLOR)).hex;
  }
  set borderRightColor(value: number | string | { argb?: number }) {
    this.setBorderSideColor('right', value);
  }

  get borderBottomColor(): string {
    return new Color(getUint32(this.style_view, StyleKeys.BORDER_BOTTOM_COLOR)).hex;
  }
  set borderBottomColor(value: number | string | { argb?: number }) {
    this.setBorderSideColor('bottom', value);
  }

  get borderLeftColor(): string {
    return new Color(getUint32(this.style_view, StyleKeys.BORDER_LEFT_COLOR)).hex;
  }
  set borderLeftColor(value: number | string | { argb?: number }) {
    this.setBorderSideColor('left', value);
  }
  // </style-keys:border-accessors>

  setBorderColor(value: string) {
    if (!(__WINDOWS__ || __LINUX__ || __ANDROID__ || __APPLE__) || !this.style_view) return;
    const c = parseSidesColorShorthand(String(value ?? ''));
    this.writeBorderSide('top', null, null, c.t);
    this.writeBorderSide('right', null, null, c.r);
    this.writeBorderSide('bottom', null, null, c.b);
    this.writeBorderSide('left', null, null, c.l);
    this.commitState(StateKeys.BORDER_COLOR);
  }

  setBorderSideColor(side: 'top' | 'right' | 'bottom' | 'left', value: number | string | { argb?: number }) {
    if (!this.style_view) return;
    const color = normalizeColorValue(value);
    if (color == null) return;
    this.writeBorderSide(side, null, null, color);
    this.commitState(StateKeys.BORDER_COLOR);
  }

  resetState() {
    this._hasDirty = false;
    this._d0 = this._d1 = this._d2 = this._d3 = 0;
  }

  private flushCssWrites() {
    this.flushBackgroundWrites();
    this.flushEffectWrites();
    this.flushMaskWrites();
  }

  private syncStyle() {
    this.flushCssWrites();
    this._synced = true;
    const snapshot = this._turnSnapshot;
    this._turnSnapshot = undefined;
    if (snapshot && this._hasDirty && bytesEqual(snapshot, this.u8View)) {
      this.resetState();
      return;
    }
    this._sendSync();
    this.resetState();
  }

  private _sendSync() {
    if (__ANDROID__) {
      //@ts-ignore
      const view = this.view?.android ?? (this.view._view as never as org.nativescript.mason.masonkit.Element);
      if (this.view[isMasonView_]) {
        // @ts-ignore - syncStyleParts typings regenerate from the AAR separately.
        view.syncStyleParts(this._d0, this._d1, this._d2, this._d3);
      } else {
        org.nativescript.mason.masonkit.Mason.getShared().syncStyleParts(view, this._d0, this._d1, this._d2, this._d3);
      }
    } else if (__APPLE__) {
      //@ts-ignore
      const view = this.view?.ios ?? (this.view._view as never as MasonText);
      // @ts-ignore
      view.mason_syncStyleParts(this._d0, this._d1, this._d2, this._d3);
    } else if (__WINDOWS__ || __LINUX__) {
      const all = !this._hasDirty;
      const d0 = all ? -1 : this._d0;
      const d1 = all ? -1 : this._d1;
      const d2 = all ? -1 : this._d2;
      const d3 = all ? -1 : this._d3;
      if (!this.view[isMasonView_]) {
        masonEngine().SyncForeignStyle(this.nativeView, d0, d1, d2, d3);
        return;
      }
      // @ts-ignore
      const view = (this.view as any)?.windows ?? this.view._view;
      if (__WINDOWS__ && this._pseudo) this.writeWindowsPseudoStyle();
      (view as NativeScript.Mason.IMasonElement).SyncStyle(d0, d1, d2, d3);
      const text = StateKeys.WINDOWS_TEXT_CHANGES;
      if ((d0 & text.w0) | (d1 & text.w1) | (d2 & text.w2) | (d3 & text.w3)) {
        (this.view as any)?._windowsSyncAnonymousText?.(d0, d1, d2, d3);
      }
      const flow = StateKeys.FLOW_TYPE;
      if (!this._pseudo && (d0 & flow.w0) | (d1 & flow.w1) | (d2 & flow.w2) | (d3 & flow.w3)) {
        (this.view as any)?._windowsFlowTypeChanged?.();
      }
    }
  }

  private writeWindowsPseudoStyle() {
    masonEngine().WritePseudoStyleValues(this.nativeNode, this._pseudo, this.u8View);
  }

  /** The anonymous Windows Text holding a container's own runs inherits the container's text styles. */
  copyTextStyleTo(text: NativeScript.Mason.Text, d0 = -1, d1 = -1, d2 = -1, d3 = -1, block = false) {
    if (!(__WINDOWS__ || __LINUX__) || !this.u8View) return;
    //@ts-ignore
    const target = new Uint8Array(arrayBufferOf(masonEngine().StyleValues(text)));
    target.set(this.u8View.subarray(StyleKeys.FONT_COLOR, StyleKeys.BACKGROUND_COLOR), StyleKeys.FONT_COLOR);
    target.set(this.u8View.subarray(StyleKeys.DECORATION_LINE, StyleKeys.PSEUDO_SET_MASK_LOW), StyleKeys.DECORATION_LINE);
    target.set(this.u8View.subarray(StyleKeys.HYPHENS, StyleKeys.LINE_CLAMP_STATE + 1), StyleKeys.HYPHENS);
    if (block) {
      target[StyleKeys.DISPLAY] = 3;
      target[StyleKeys.DISPLAY_MODE] = DisplayMode.None;
    }
    (text as unknown as NativeScript.Mason.IMasonElement).SyncStyle(d0, d1, d2, d3);
  }

  private setOrAppendState(value: StateKeys) {
    if (this._turnSnapshot === undefined) {
      this._turnSnapshot = false;
    }
    this._d0 |= value.w0;
    this._d1 |= value.w1;
    this._d2 |= value.w2;
    this._d3 |= value.w3;
    this._hasDirty = true;
    this.scheduleSync();
  }

  private scheduleSync() {
    if (!this.inBatch && !this._syncScheduled) {
      this._syncScheduled = true;
      queueStyleSync(this);
    }
  }

  _flushScheduledSync() {
    this._syncScheduled = false;
    this.flushCssWrites();
    if (this._hasDirty) this.syncStyle();
  }

  batch(fn: (style: Style) => void) {
    this.inBatch = true;
    try {
      fn(this);
    } finally {
      this.inBatch = false;
      this.syncStyle();
    }
  }

  get view(): View {
    return this.view_;
  }

  /**
   * The font size `em` resolves against, in CSS px: the element's computed one,
   * with a percentage of the parent's, or the inherited one when unset.
   */
  emBasis(): number {
    if (!this.style_view || getInt8(this.style_view, StyleKeys.FONT_SIZE_STATE) !== 1) {
      return this.parentEmBasis();
    }
    const own = getFloat32(this.style_view, StyleKeys.FONT_SIZE);
    if (own <= 0) {
      return this.parentEmBasis();
    }
    // `0.75em` is stored as 75 (%), not 75px.
    return getInt8(this.style_view, StyleKeys.FONT_SIZE_TYPE) === 1 ? (own / 100) * this.parentEmBasis() : own;
  }

  emBasisFor(value: unknown): number | undefined {
    return typeof value === 'string' && (value.indexOf('m') !== -1 || value.indexOf('M') !== -1) && EM_UNIT.test(value) ? this.emBasis() : undefined;
  }

  /** The nearest existing Mason ancestor style's font size (its own for a pseudo-class style). */
  private parentEmBasis(): number {
    const view = this.view_ as unknown as { parent?: unknown } | undefined;
    let ancestor = (this._pseudo ? view : view?.parent) as { parent?: unknown; [style_]?: Style } | undefined;
    for (let depth = 0; ancestor && depth < 256; depth++) {
      const style = ancestor[style_];
      if (style instanceof Style && style !== this) {
        return style.emBasis();
      }
      ancestor = ancestor.parent as typeof ancestor;
    }
    return cssUnits.rootFontSize;
  }

  private prepareMut() {
    if (this._pseudo) {
      return;
    }
    if (!this._bufferRequested) {
      this.loadBuffer();
    }
    if (this._turnSnapshot === undefined && !this._hasDirty && this._sv) {
      this._turnSnapshot = this._synced ? this.u8View.slice() : false;
    }
    if (getUint32(this._sv, StyleKeys.REF_COUNT) !== 1) {
      // Still shared (a native without the writable fetch): take a copy.
      this.loadBuffer();
    }
  }

  set 'background-color'(value: number | string | { argb?: number }) {
    this.backgroundColor = value;
  }

  get 'background-color'() {
    return this.backgroundColor;
  }

  get styleView(): DataView {
    return this.style_view;
  }

  get hasBoxStyle(): boolean {
    const view = this.style_view;
    if (!view) return false;
    if (getInt8(view, StyleKeys.WIDTH_TYPE) !== 0 || getInt8(view, StyleKeys.HEIGHT_TYPE) !== 0) return true;
    const sides = [StyleKeys.PADDING_LEFT_VALUE, StyleKeys.PADDING_RIGHT_VALUE, StyleKeys.PADDING_TOP_VALUE, StyleKeys.PADDING_BOTTOM_VALUE, StyleKeys.BORDER_LEFT_VALUE, StyleKeys.BORDER_RIGHT_VALUE, StyleKeys.BORDER_TOP_VALUE, StyleKeys.BORDER_BOTTOM_VALUE];
    return sides.some((offset) => getFloat32(view, offset) > 0);
  }

  // CSS logical properties: see StyleKeys.LOGICAL_SEQ.

  /** The next write stamp; at the counter's end every stamp is renumbered by rank, keeping their order. */
  private nextLogicalStamp(): number {
    const view = this.style_view;
    let seq = getUint8(view, StyleKeys.LOGICAL_SEQ);
    if (seq === 255) {
      stampUsed.fill(0);
      for (const [order, length] of LOGICAL_STAMPS) {
        for (let i = 0; i < length; i++) stampUsed[getUint8(view, order + i)] = 1;
      }
      let next = 0;
      for (let stamp = 1; stamp < 256; stamp++) stampRank[stamp] = stampUsed[stamp] ? ++next : 0;
      for (const [order, length] of LOGICAL_STAMPS) {
        for (let i = 0; i < length; i++) setUint8(view, order + i, stampRank[getUint8(view, order + i)]);
      }
      seq = next;
    }
    setUint8(view, StyleKeys.LOGICAL_SEQ, seq + 1);
    return seq + 1;
  }

  /** Stamps the physical slots in `mask` as written now, so they win over older logical values. Free while the group has none. */
  private stampPhysical(group: LogicalGroupName, mask: number) {
    const { order, half } = LOGICAL_GROUPS[group];
    const view = this.style_view;
    // No logical side set: all of the group's stamp bytes are 0.
    const at = order + half;
    if (view.getUint32(at, true) === 0 && (half === 4 || view.getUint16(at + 4, true) === 0)) return;
    const stamp = this.nextLogicalStamp();
    for (let i = 0; i < half; i++) {
      if (mask & (1 << i)) setUint8(view, order + i, stamp);
    }
  }

  /**
   * Sets a logical side (margin, padding, inset: 0 block-start, 1 inline-end, 2 block-end,
   * 3 inline-start; size: see LOGICAL_GROUPS). null or undefined removes it, so the physical
   * value applies again.
   */
  setLogical(group: LogicalGroupName, slot: number, value: unknown) {
    const entry = LOGICAL_GROUPS[group];
    if (this.applyLayoutMath(logicalLayoutProperties[group][slot], value)) return;
    const parsed = value == null || value === '' ? undefined : layoutLengthValue(value, entry.kind(slot), this.emBasisFor(value));
    if (value != null && value !== '' && !parsed) return;
    this.prepareMut();
    const view = this.style_view;
    if (parsed) {
      setUint8(view, entry.order + entry.half + slot, this.nextLogicalStamp());
      setInt8(view, entry.types + slot, parsed.type);
      setFloat32(view, entry.values + slot * 4, parsed.value);
    } else {
      setUint8(view, entry.order + entry.half + slot, 0);
      setInt8(view, entry.types + slot, 0);
      setFloat32(view, entry.values + slot * 4, 0);
    }
    this.commitState(entry.state(slot));
  }

  get gridGap() {
    return this.gap;
  }

  set gridGap(value: string) {
    this.gap = value;
  }

  get gridAutoRows() {
    if (!this.nativeView) {
      return '';
    }

    if (__ANDROID__) {
      return nodeHelper().getGridAutoRows(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridAutoRows;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridAutoRowsCss ?? '') : '';
  }

  set gridAutoRows(value: string) {
    if (!this.nativeView) {
      return;
    }
    // A bare number can't marshal over JNI into the native String setter.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridAutoRows(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridAutoRows = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridAutoRows, value, this.emBasisFor(value));
    }
  }

  get gridAutoColumns() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridAutoColumns(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridAutoColumns;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridAutoColumnsCss ?? '') : '';
  }

  set gridAutoColumns(value: string) {
    if (!this.nativeView) {
      return;
    }
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridAutoColumns(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridAutoColumns = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridAutoColumns, value, this.emBasisFor(value));
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
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridColumn(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridColumn = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridColumn, value);
    }
  }

  get gridColumn() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridColumn(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridColumn;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridColumnCss ?? '') : '';
  }

  get gridColumnStart(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridColumnStart(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridColumnStart;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridColumnStartCss ?? '') : '';
  }

  set gridColumnStart(value: string) {
    if (!this.nativeView) {
      return;
    }
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridColumnStart(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridColumnStart = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridColumnStart, value);
    }
  }

  get gridColumnEnd(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridColumnEnd(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridColumnEnd;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridColumnEndCss ?? '') : '';
  }

  set gridColumnEnd(value: string) {
    if (!this.nativeView) {
      return;
    }
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridColumnEnd(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridColumnEnd = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridColumnEnd, value);
    }
  }

  set gridRow(value: string) {
    if (!this.nativeView) {
      return;
    }
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridRow(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridRow = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridRow, value);
    }
  }

  get gridRow(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridRow(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridRow;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridRowCss ?? '') : '';
  }

  get gridRowStart(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridRowStart(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridRowStart;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridRowStartCss ?? '') : '';
  }

  set gridRowStart(value: string) {
    if (!this.nativeView) {
      return;
    }
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridRowStart(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridRowStart = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridRowStart, value);
    }
  }

  get gridRowEnd(): string {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridRowEnd(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridRowEnd;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridRowEndCss ?? '') : '';
  }

  set gridRowEnd(value: string) {
    if (!this.nativeView) {
      return;
    }
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridRowEnd(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridRowEnd = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridRowEnd, value);
    }
  }

  set gridArea(value: string) {
    if (!this.nativeView) {
      return;
    }
    // See gridAutoRows above.
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridArea(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridArea = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridArea, value);
    }
  }

  get gridArea() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridArea(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridArea;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridAreaCss ?? '') : '';
  }

  set gridTemplateRows(value: string) {
    if (!this.nativeView) {
      return;
    }
    // null clears the template; also guards against a bare number (see gridAutoRows above).
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridTemplateRows(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridTemplateRows = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridTemplateRows, value, this.emBasisFor(value));
    }
  }

  get gridTemplateRows() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridTemplateRows(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridTemplateRows;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridTemplateRowsCss ?? '') : '';
  }

  get gridTemplateColumns() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridTemplateColumns(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridTemplateColumns;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridTemplateColumnsCss ?? '') : '';
  }

  set gridTemplateColumns(value: string) {
    if (!this.nativeView) {
      return;
    }
    // null clears the template; also guards against a bare number (see gridAutoRows above).
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridTemplateColumns(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridTemplateColumns = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridTemplateColumns, value, this.emBasisFor(value));
    }
  }

  get gridTemplateAreas() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getGridTemplateAreas(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.gridTemplateAreas;
    }

    return __WINDOWS__ || __LINUX__ ? ((this.nativeView as any)?.Style?.GridTemplateAreasCss ?? '') : '';
  }

  set gridTemplateAreas(value: string) {
    if (!this.nativeView) {
      return;
    }
    // null clears it; also guards against a bare number (see gridAutoRows above).
    value = value == null ? '' : String(value);
    if (__ANDROID__) {
      nodeHelper().setGridTemplateAreas(this.nativeView, value);
    }

    if (__APPLE__) {
      this.appleStyle.gridTemplateAreas = value;
    }

    if (__WINDOWS__ || __LINUX__) {
      windowsSetGrid(this.nativeView, GridProperty.GridTemplateAreas, value);
    }
  }

  get background() {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackground(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.background;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background') ?? '') : '';
  }

  set background(value: string) {
    value = value == null ? '' : String(value);
    this.setBackgroundCss('background', value);
  }

  get backgroundImage() {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundImage(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.backgroundImage;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-image') ?? '') : '';
  }

  set backgroundImage(value: string) {
    value = value == null ? '' : String(value);
    this.setBackgroundCss('background-image', value);
  }

  get backgroundRepeat() {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundRepeat(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.backgroundRepeat;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-repeat') ?? '') : '';
  }

  set backgroundRepeat(value: string) {
    value = value == null ? '' : String(value);
    this.setBackgroundCss('background-repeat', value);
  }

  get backgroundPosition() {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundPosition(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.backgroundPosition;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-position') ?? '') : '';
  }

  set backgroundPosition(value: string) {
    value = value == null ? '' : String(value);
    this.setBackgroundCss('background-position', value);
  }

  get backgroundSize() {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundSize(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.backgroundSize;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-size') ?? '') : '';
  }

  set backgroundSize(value: string) {
    value = value == null ? '' : String(value);
    this.setBackgroundCss('background-size', value);
  }

  get backgroundClip() {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundClip(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.backgroundClip;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-clip') ?? '') : '';
  }

  set backgroundClip(value: string) {
    value = value == null ? '' : String(value);
    this.setBackgroundCss('background-clip', value);
  }

  get backgroundPositionX(): string {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundPositionX(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.backgroundPositionX;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-position-x') ?? '') : '';
  }

  set backgroundPositionX(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), '0%');
    this.setBackgroundCss('background-position-x', value);
  }

  get backgroundPositionY(): string {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundPositionY(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.backgroundPositionY;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-position-y') ?? '') : '';
  }

  set backgroundPositionY(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), '0%');
    this.setBackgroundCss('background-position-y', value);
  }

  get backgroundOrigin(): string {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundOrigin(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.backgroundOrigin;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-origin') ?? '') : '';
  }

  set backgroundOrigin(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), 'padding-box');
    this.setBackgroundCss('background-origin', value);
  }

  get backgroundAttachment(): string {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundAttachment(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.backgroundAttachment;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-attachment') ?? '') : '';
  }

  set backgroundAttachment(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), 'scroll');
    this.setBackgroundCss('background-attachment', value);
  }

  get backgroundBlendMode(): string {
    this.flushBackgroundWrites();
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBackgroundBlendMode(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.backgroundBlendMode;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('background-blend-mode') ?? '') : '';
  }

  set backgroundBlendMode(value: string) {
    value = cssInitialIfReset(value == null ? '' : String(value), 'normal');
    this.setBackgroundCss('background-blend-mode', value);
  }

  hasBorderRadius(): boolean {
    const view = this.style_view;
    if (!view) return true;
    for (const [, keys] of RADIUS_KEYS) {
      if (getFloat32(view, keys.xValue) !== 0 || getFloat32(view, keys.yValue) !== 0) return true;
    }
    return false;
  }

  get borderRadius() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__ || __APPLE__) {
      const authored = __ANDROID__ ? nodeHelper().getBorderRadius(this.nativeView) : this.appleStyle.borderRadius;
      if (this._borderRadiusCss === null || (!authored && this._borderRadiusCss == null && this.style_view && RADIUS_KEYS.some((_, index) => !this._cornerRadiusIsZero(index)))) {
        return this._radiusCssFromBuffer();
      }
      return this._borderRadiusCss ?? authored;
    }

    if ((__WINDOWS__ || __LINUX__) && this.style_view) {
      return this._radiusCssFromBuffer(1);
    }

    return '';
  }

  set borderRadius(value: string) {
    value = value == null ? '' : String(value);
    if (!__WINDOWS__ && this.nativeView && !this._pseudo && this.style_view) {
      this._writeBorderRadius(value, layout.getDisplayDensity());
      return;
    }
    if (!this._pseudo) this._borderRadiusCss = undefined;
    this.setPseudoCssStringValue(
      'border-radius',
      value,
      () => nodeHelper().setBorderRadius(this.nativeView, value),
      () => (this.appleStyle.borderRadius = value),
    );
  }

  /** One corner from a core length (dip number or `{ value, unit }`) without the string round trip; false when it needs one. */
  _writeCornerLength(corner: number, value: unknown, scale = layout.getDisplayDensity()): boolean {
    let type = 0;
    let amount: number;
    if (typeof value === 'number') {
      amount = Math.min(9999, Math.max(-9999, value)) * scale;
    } else if (value && typeof value === 'object' && typeof (value as { value?: unknown }).value === 'number') {
      const { unit, value: v } = value as { unit?: string; value: number };
      if (unit === '%') {
        type = 1;
        amount = v;
      } else if (unit === 'px' || unit === 'dip') {
        amount = Math.min(9999, Math.max(-9999, v)) * scale;
      } else {
        return false;
      }
    } else {
      return false;
    }
    if (!Number.isFinite(amount) || !this.nativeView || this._pseudo || !this.style_view) return false;
    this._borderRadiusCss = null;
    this.prepareMut();
    this.writeRadiusAxes(corner, type, amount, type, amount);
    this.rememberViewportCorner(corner, value);
    this.commitState(StateKeys.BORDER_RADIUS);
    return true;
  }

  /** Resolves and writes both axes of one CSS corner. */
  _writeCornerCss(corner: number, css: string, scale = layout.getDisplayDensity()): boolean {
    if (!this.nativeView || this._pseudo || !this.style_view) return false;
    const fields = resolveBorderRadii(css, scale, this.emBasisFor(css), true);
    if (fields?.length !== 2 * CssLengthResultRecord.STRIDE) return false;
    this._borderRadiusCss = null;
    this.prepareMut();
    this.writeResolvedRadius(corner, fields, 0, CssLengthResultRecord.STRIDE);
    this.rememberViewportCorner(corner, css);
    this.commitState(StateKeys.BORDER_RADIUS);
    return true;
  }

  private radiusCssAxes(corner: number, scale: number): [string, string] {
    const view = this.style_view;
    const token = (type: number, v: number) => (type === 1 ? `${Math.round(v * 1e5) / 1e3}%` : `${Math.round((v / scale) * 1e3) / 1e3}px`);
    const keys = RADIUS_KEYS[corner][1];
    return [token(getUint8(view, keys.xType), getFloat32(view, keys.xValue)), token(getUint8(view, keys.yType), getFloat32(view, keys.yValue))];
  }

  _cornerRadiusCss(corner: number): string {
    if (!this.style_view || this._cornerRadiusIsZero(corner)) return '0';
    const [h, v] = this.radiusCssAxes(corner, layout.getDisplayDensity());
    return h === v ? h : `${h} ${v}`;
  }

  // The four corners as border-radius CSS, from the buffer.
  private _radiusCssFromBuffer(scale = layout.getDisplayDensity()): string {
    const h: string[] = [];
    const v: string[] = [];
    for (let corner = 0; corner < RADIUS_KEYS.length; corner++) {
      const [x, y] = this.radiusCssAxes(corner, scale);
      h.push(x);
      v.push(y);
    }
    const hs = h.every((t) => t === h[0]) ? h[0] : h.join(' ');
    const vs = v.every((t) => t === v[0]) ? v[0] : v.join(' ');
    return hs === vs ? hs : `${hs} / ${vs}`;
  }

  /** Whether one corner has no radius, read straight from the buffer. */
  _cornerRadiusIsZero(corner: number): boolean {
    const view = this.style_view;
    if (!view) return false;
    const keys = RADIUS_KEYS[corner][1];
    return getFloat32(view, keys.xValue) === 0 && getFloat32(view, keys.yValue) === 0;
  }

  private writeRadiusAxes(corner: number, xType: number, x: number, yType: number, y: number): void {
    const keys = RADIUS_KEYS[corner][1];
    setUint8(this.style_view, keys.xType, xType);
    setFloat32(this.style_view, keys.xValue, __WINDOWS__ ? Math.max(0, x) : x);
    setUint8(this.style_view, keys.yType, yType);
    setFloat32(this.style_view, keys.yValue, __WINDOWS__ ? Math.max(0, y) : y);
  }

  private writeResolvedRadius(corner: number, fields: number[], h: number, v: number): void {
    this.writeRadiusAxes(corner,
      fields[h + CssLengthResultRecord.KIND] - 1, fields[h + CssLengthResultRecord.VALUE],
      fields[v + CssLengthResultRecord.KIND] - 1, fields[v + CssLengthResultRecord.VALUE]);
  }

  private rememberViewportCorner(corner: number, value: unknown): void {
    const writes = viewportWrites.get(this);
    if (writes?.has('borderRadius') || (typeof value === 'string' && VIEWPORT_UNIT_TEXT.test(value))) {
      rememberViewportWrite(this, corner, value);
    } else {
      writes?.delete(corner);
    }
  }

  _writeBorderRadius(value: string, scale: number): boolean {
    const stride = CssLengthResultRecord.STRIDE;
    const vertical = BorderRadiiRecord.VERTICAL_TOP_LEFT * stride;
    const fields = resolveBorderRadii(value, scale, this.emBasisFor(value));
    if (fields?.length !== BorderRadiiRecord.STRIDE * stride) return false;
    this._borderRadiusCss = value;
    this.prepareMut();
    for (let corner = 0; corner < RADIUS_KEYS.length; corner++) {
      const h = corner * stride;
      this.writeResolvedRadius(corner, fields, h, h + vertical);
      viewportWrites.get(this)?.delete(corner);
    }
    this.commitState(StateKeys.BORDER_RADIUS);
    return true;
  }

  get fontFamily(): string {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return nodeHelper().getFontFamily(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.fontFamily;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('font-family') ?? '') : '';
  }

  // `font-family` is a native Style property (builds a FontFace), not a
  // style-buffer field, so it can't be written through the shared buffer.
  set fontFamily(value: string) {
    // A CSS list, possibly quoted (`'Roboto Mono', Courier, monospace`); the natives take one name.
    value = pickFontFamily(value == null ? '' : String(value));
    this.setPseudoCssStringValue(
      'font-family',
      value,
      () => nodeHelper().setFontFamily(this.nativeView, value),
      () => (this.appleStyle.fontFamily = value),
    );
  }

  get border() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getBorder(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.border;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('border') ?? '') : '';
  }

  set border(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'border',
      value,
      () => nodeHelper().setBorder(this.nativeView, value),
      () => (this.appleStyle.border = value),
    );
  }

  get paddingCss() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return nodeHelper().getPaddingCssValue(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.paddingCss;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('padding') ?? '') : '';
  }

  set paddingCss(value: string | number) {
    // a bare number is dip, matching other numeric setters; Android's
    // native parser treats "px" as unscaled device pixels, "dip" as scaled
    const strValue = typeof value === 'number' ? `${value}dip` : value;
    this.setPseudoCssStringValue(
      'padding',
      strValue,
      () => nodeHelper().setPaddingCss(this.nativeView, strValue),
      () => (this.appleStyle.paddingCss = strValue),
    );
  }

  get marginCss() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return nodeHelper().getMarginCssValue(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.marginCss;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('margin') ?? '') : '';
  }

  set marginCss(value: string | number) {
    // See the comment on `paddingCss` above — same dip-vs-px mislabeling fix.
    const strValue = typeof value === 'number' ? `${value}dip` : value;
    this.setPseudoCssStringValue(
      'margin',
      strValue,
      () => nodeHelper().setMarginCss(this.nativeView, strValue),
      () => (this.appleStyle.marginCss = strValue),
    );
  }

  get insetCss() {
    if (!this.nativeView) return '';
    if (__ANDROID__) {
      return nodeHelper().getInsetCssValue(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.insetCss;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('inset') ?? '') : '';
  }

  set insetCss(value: string | number) {
    // See the comment on `paddingCss` above — same dip-vs-px mislabeling fix.
    const strValue = typeof value === 'number' ? `${value}dip` : value;
    this.setPseudoCssStringValue(
      'inset',
      strValue,
      () => nodeHelper().setInsetCss(this.nativeView, strValue),
      () => (this.appleStyle.insetCss = strValue),
    );
  }

  get borderLeft() {
    return '';
  }

  set borderLeft(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'border-left',
      value,
      () => nodeHelper().setBorderLeft(this.nativeView, value),
      () => (this.appleStyle.borderLeft = value),
    );
  }

  get borderTop() {
    return '';
  }

  set borderTop(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'border-top',
      value,
      () => nodeHelper().setBorderTop(this.nativeView, value),
      () => (this.appleStyle.borderTop = value),
    );
  }

  get borderRight() {
    return '';
  }

  set borderRight(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'border-right',
      value,
      () => nodeHelper().setBorderRight(this.nativeView, value),
      () => (this.appleStyle.borderRight = value),
    );
  }

  get borderBottom() {
    return '';
  }

  set borderBottom(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'border-bottom',
      value,
      () => nodeHelper().setBorderBottom(this.nativeView, value),
      () => (this.appleStyle.borderBottom = value),
    );
  }

  get filter() {
    if (!this.nativeView) {
      return '';
    }
    this.flushEffectWrites();
    if (__ANDROID__) {
      return nodeHelper().getFilter(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.filter;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('filter') ?? '') : '';
  }

  set filter(value: string) {
    this.setEffectCss('filter', value);
  }

  get boxShadow() {
    if (!this.nativeView) {
      return '';
    }
    this.flushEffectWrites();
    if (__ANDROID__) {
      return nodeHelper().getBoxShadow(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.boxShadow;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('box-shadow') ?? '') : '';
  }

  set 'box-shadow'(value: string) {
    this.boxShadow = value;
  }

  get 'box-shadow'() {
    return this.boxShadow;
  }

  set boxShadow(value: string) {
    this.setEffectCss('box-shadow', value);
  }

  get transform() {
    if (!this.nativeView) {
      return '';
    }
    if (__ANDROID__) {
      return nodeHelper().getTransform(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.transform;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('transform') ?? '') : '';
  }

  set transform(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'transform',
      value,
      () => nodeHelper().setTransform(this.nativeView, value),
      () => (this.appleStyle.transform = value),
    );
  }

  get textShadow() {
    if (!this.nativeView) {
      return '';
    }
    this.flushEffectWrites();
    if (__ANDROID__) {
      return nodeHelper().getTextShadow(this.nativeView);
    }

    if (__APPLE__) {
      return this.appleStyle.textShadow;
    }

    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('text-shadow') ?? '') : '';
  }

  set textShadow(value: string) {
    this.setEffectCss('text-shadow', value);
  }

  set 'object-position'(value: string) {
    this.objectPosition = value;
  }

  get 'object-position'() {
    return this.objectPosition;
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
      return nodeHelper().getBorderImage(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.borderImage;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('border-image') ?? '') : '';
  }

  set borderImage(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'border-image',
      value,
      () => nodeHelper().setBorderImage(this.nativeView, value),
      () => (this.appleStyle.borderImage = value),
    );
  }

  set 'border-image'(value: string) {
    this.borderImage = value;
  }

  get 'border-image'() {
    return this.borderImage;
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
      return nodeHelper().getFontFeatureSettings(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.fontFeatureSettings;
    }
    return __WINDOWS__ || __LINUX__ ? this._windowsCss.get('font-feature-settings') || 'normal' : 'normal';
  }

  set fontFeatureSettings(value: string) {
    value = value == null ? '' : String(value);
    this.setPseudoCssStringValue(
      'font-feature-settings',
      value,
      () => nodeHelper().setFontFeatureSettings(this.nativeView, value),
      () => (this.appleStyle.fontFeatureSettings = value),
    );
  }

  set 'font-feature-settings'(value: string) {
    this.fontFeatureSettings = value;
  }

  get 'font-feature-settings'() {
    return this.fontFeatureSettings;
  }

  set 'word-spacing'(value: string | number) {
    this.wordSpacing = value;
  }

  get 'word-spacing'() {
    return this.wordSpacing;
  }

  set 'text-indent'(value: string | number) {
    this.textIndent = value;
  }

  get 'text-indent'() {
    return this.textIndent;
  }

  set 'line-clamp'(value: number | string) {
    this.lineClamp = value;
  }

  get 'line-clamp'() {
    return this.lineClamp;
  }

  set '-webkit-line-clamp'(value: number | string) {
    this.lineClamp = value;
  }

  get '-webkit-line-clamp'() {
    return this.lineClamp;
  }

  set 'transform-origin'(value: string) {
    this.transformOrigin = value;
  }

  get 'transform-origin'() {
    return this.transformOrigin;
  }

  get backdropFilter(): string {
    if (!this.nativeView) return '';
    this.flushEffectWrites();
    if (__ANDROID__) {
      return nodeHelper().getBackdropFilter(this.nativeView);
    }
    if (__APPLE__) {
      return this.appleStyle.backdropFilter;
    }
    return __WINDOWS__ || __LINUX__ ? (this._windowsCss.get('backdrop-filter') ?? '') : '';
  }

  set backdropFilter(value: string) {
    this.setEffectCss('backdrop-filter', value);
  }

  set 'backdrop-filter'(value: string) {
    this.backdropFilter = value;
  }

  get 'backdrop-filter'() {
    return this.backdropFilter;
  }

  // <style-keys:mask-accessors> generated from tools/scripts/style-keys/style-keys.schema
  get maskImage(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskImage(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskImage;
    return __WINDOWS__ ? (this._windowsCss.get('mask-image') ?? '') : '';
  }

  set maskImage(value: string) {
    this.setMaskCss('mask-image', 0, value);
  }

  get 'mask-image'() { return this.maskImage; }
  set 'mask-image'(value: string) { this.maskImage = value; }

  get maskSize(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskSize(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskSize;
    return __WINDOWS__ ? (this._windowsCss.get('mask-size') ?? '') : '';
  }

  set maskSize(value: string) {
    this.setMaskCss('mask-size', 1, value);
  }

  get 'mask-size'() { return this.maskSize; }
  set 'mask-size'(value: string) { this.maskSize = value; }

  get maskPosition(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskPosition(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskPosition;
    return __WINDOWS__ ? (this._windowsCss.get('mask-position') ?? '') : '';
  }

  set maskPosition(value: string) {
    this.setMaskCss('mask-position', 2, value);
  }

  get 'mask-position'() { return this.maskPosition; }
  set 'mask-position'(value: string) { this.maskPosition = value; }

  get maskRepeat(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskRepeat(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskRepeat;
    return __WINDOWS__ ? (this._windowsCss.get('mask-repeat') ?? '') : '';
  }

  set maskRepeat(value: string) {
    this.setMaskCss('mask-repeat', 3, value);
  }

  get 'mask-repeat'() { return this.maskRepeat; }
  set 'mask-repeat'(value: string) { this.maskRepeat = value; }

  get maskOrigin(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskOrigin(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskOrigin;
    return __WINDOWS__ ? (this._windowsCss.get('mask-origin') ?? '') : '';
  }

  set maskOrigin(value: string) {
    this.setMaskCss('mask-origin', 4, value);
  }

  get 'mask-origin'() { return this.maskOrigin; }
  set 'mask-origin'(value: string) { this.maskOrigin = value; }

  get maskClip(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskClip(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskClip;
    return __WINDOWS__ ? (this._windowsCss.get('mask-clip') ?? '') : '';
  }

  set maskClip(value: string) {
    this.setMaskCss('mask-clip', 5, value);
  }

  get 'mask-clip'() { return this.maskClip; }
  set 'mask-clip'(value: string) { this.maskClip = value; }

  get maskMode(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskMode(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskMode;
    return __WINDOWS__ ? (this._windowsCss.get('mask-mode') ?? '') : '';
  }

  set maskMode(value: string) {
    this.setMaskCss('mask-mode', 6, value);
  }

  get 'mask-mode'() { return this.maskMode; }
  set 'mask-mode'(value: string) { this.maskMode = value; }

  get maskComposite(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskComposite(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskComposite;
    return __WINDOWS__ ? (this._windowsCss.get('mask-composite') ?? '') : '';
  }

  set maskComposite(value: string) {
    this.setMaskCss('mask-composite', 7, value);
  }

  get 'mask-composite'() { return this.maskComposite; }
  set 'mask-composite'(value: string) { this.maskComposite = value; }

  get clipPath(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getClipPath(this.nativeView);
    if (__APPLE__) return this.appleStyle.clipPath;
    return __WINDOWS__ ? (this._windowsCss.get('clip-path') ?? '') : '';
  }

  set clipPath(value: string) {
    this.setMaskCss('clip-path', 14, value);
  }

  get 'clip-path'() { return this.clipPath; }
  set 'clip-path'(value: string) { this.clipPath = value; }

  get maskBorderSource(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskBorderSource(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskBorderSource;
    return __WINDOWS__ ? (this._windowsCss.get('mask-border-source') ?? '') : '';
  }

  set maskBorderSource(value: string) {
    this.setMaskCss('mask-border-source', 8, value);
  }

  get 'mask-border-source'() { return this.maskBorderSource; }
  set 'mask-border-source'(value: string) { this.maskBorderSource = value; }

  get maskBorderSlice(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskBorderSlice(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskBorderSlice;
    return __WINDOWS__ ? (this._windowsCss.get('mask-border-slice') ?? '') : '';
  }

  set maskBorderSlice(value: string) {
    this.setMaskCss('mask-border-slice', 9, value);
  }

  get 'mask-border-slice'() { return this.maskBorderSlice; }
  set 'mask-border-slice'(value: string) { this.maskBorderSlice = value; }

  get maskBorderWidth(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskBorderWidth(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskBorderWidth;
    return __WINDOWS__ ? (this._windowsCss.get('mask-border-width') ?? '') : '';
  }

  set maskBorderWidth(value: string) {
    this.setMaskCss('mask-border-width', 10, value);
  }

  get 'mask-border-width'() { return this.maskBorderWidth; }
  set 'mask-border-width'(value: string) { this.maskBorderWidth = value; }

  get maskBorderOutset(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskBorderOutset(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskBorderOutset;
    return __WINDOWS__ ? (this._windowsCss.get('mask-border-outset') ?? '') : '';
  }

  set maskBorderOutset(value: string) {
    this.setMaskCss('mask-border-outset', 11, value);
  }

  get 'mask-border-outset'() { return this.maskBorderOutset; }
  set 'mask-border-outset'(value: string) { this.maskBorderOutset = value; }

  get maskBorderRepeat(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskBorderRepeat(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskBorderRepeat;
    return __WINDOWS__ ? (this._windowsCss.get('mask-border-repeat') ?? '') : '';
  }

  set maskBorderRepeat(value: string) {
    this.setMaskCss('mask-border-repeat', 12, value);
  }

  get 'mask-border-repeat'() { return this.maskBorderRepeat; }
  set 'mask-border-repeat'(value: string) { this.maskBorderRepeat = value; }

  get maskBorderMode(): string {
    if (!this.nativeView) return '';
    this.flushMaskWrites();
    if (__ANDROID__) return nodeHelper().getMaskBorderMode(this.nativeView);
    if (__APPLE__) return this.appleStyle.maskBorderMode;
    return __WINDOWS__ ? (this._windowsCss.get('mask-border-mode') ?? '') : '';
  }

  set maskBorderMode(value: string) {
    this.setMaskCss('mask-border-mode', 13, value);
  }

  get 'mask-border-mode'() { return this.maskBorderMode; }
  set 'mask-border-mode'(value: string) { this.maskBorderMode = value; }
  // </style-keys:mask-accessors>

  /** This box's own writing-mode (0 horizontal-tb, 1 vertical-rl, 2 vertical-lr), or -1 when it inherits. */
  get ownWritingMode(): number {
    if (!this.style_view || !getUint8(this.style_view, StyleKeys.WRITING_MODE_STATE)) return -1;
    return getUint8(this.style_view, StyleKeys.WRITING_MODE);
  }

  set 'writing-mode'(value: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr') {
    this.writingMode = value;
  }

  get 'writing-mode'() {
    return this.writingMode;
  }

  set 'text-orientation'(value: 'mixed' | 'upright' | 'sideways') {
    this.textOrientation = value;
  }

  get 'text-orientation'() {
    return this.textOrientation;
  }

  set 'text-combine-upright'(value: string) {
    this.textCombineUpright = value;
  }

  get 'text-combine-upright'() {
    return this.textCombineUpright;
  }

  set 'text-spacing-trim'(value: string) {
    this.textSpacingTrim = value;
  }

  get 'text-spacing-trim'() {
    return this.textSpacingTrim;
  }

  /** Lets an inherited text property inherit again, as when its declaration is removed. */
  unsetInheritedText(name: InheritedTextProperty) {
    const [state, key] = INHERITED_TEXT_STATE[name];
    if (!this.style_view || !getUint8(this.style_view, state)) return;
    this.prepareMut();
    setUint8(this.style_view, state, 0);
    this.commitState(key);
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
      // 0 is `auto`, so a fully transparent caret is stored as transparent white: as invisible, but distinct.
      setUint32(this.style_view, StyleKeys.CARET_COLOR, normalized === 0 ? 0x00ffffff : normalized);
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
      textOrientation: this.textOrientation,
      textCombineUpright: this.textCombineUpright,
      textSpacingTrim: this.textSpacingTrim,
      unicodeBidi: this.unicodeBidi,
      hyphens: this.hyphens,
      caretColor: this.caretColor,
      wordSpacing: this.wordSpacing,
      fontStretch: this.fontStretch,
      textIndent: this.textIndent,
      lineClamp: this.lineClamp,
      transformOrigin: this.transformOrigin,
    };
  }
}

{
  const proto = Style.prototype as unknown as Record<string, unknown>;
  const names = Object.getOwnPropertyNames(proto);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
    const set = descriptor?.set;
    if (!set) continue;
    Object.defineProperty(proto, name, {
      ...descriptor,
      set(this: object, value: unknown) {
        if (typeof value === 'number') {
          if (viewportStyles.size !== 0) viewportWrites.get(this)?.delete(name);
          set.call(this, value);
          return;
        }
        beginStyleWrite(this, name, value);
        try {
          set.call(this, value);
        } finally {
          endStyleWrite();
        }
      },
    });
  }
}

/** `grid-auto-flow` as its buffer value: `row`/`column` and `dense`, in either order. */
export function gridAutoFlowFromString(value: unknown): number | undefined {
  return cssKeywordCode('grid-auto-flow', value);
}
