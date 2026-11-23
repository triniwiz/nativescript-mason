package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.text.TextPaint
import android.view.View
import dalvik.annotation.optimization.CriticalNative
import dalvik.annotation.optimization.FastNative
import org.nativescript.fontmanager.FontFace
import org.nativescript.fontmanager.FontStyle
import org.nativescript.fontmanager.FontWeight
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.enums.Align
import org.nativescript.mason.masonkit.enums.AlignContent
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.BorderStyle
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Clear
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.FontVariantNumeric
import org.nativescript.mason.masonkit.enums.GridAutoFlow
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.JustifyItems
import org.nativescript.mason.masonkit.enums.JustifySelf
import org.nativescript.mason.masonkit.enums.ListStylePosition
import org.nativescript.mason.masonkit.enums.ListStyleType
import org.nativescript.mason.masonkit.enums.ObjectFit
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

internal fun Int.argbToCssHex(): String {
  // Android color ints are ARGB (0xAARRGGBB). Convert to CSS-style #RRGGBB or #RRGGBBAA.
  val color = this.toUInt()
  val a = ((color shr 24) and 0xFFu).toInt()
  val r = ((color shr 16) and 0xFFu).toInt()
  val g = ((color shr 8) and 0xFFu).toInt()
  val b = (color and 0xFFu).toInt()
  if (a == 255) {
    return "#%02X%02X%02X".format(r, g, b)
  }
  return "#%02X%02X%02X%02X".format(r, g, b, a)
}

internal fun <T> parsePhysicalEdges(property: String, value: String, parse: (String) -> T?): Rect<T>? {
  val words = Mason.expandCssShorthand(property, value) ?: return null
  return parsePhysicalEdges(words, parse)
}

internal fun <T> parsePhysicalEdges(words: Array<String>, parse: (String) -> T?): Rect<T>? {
  if (words.size != 4) return null
  val sides = words.map { parse(it) ?: return null }
  return Rect(sides[0], sides[1], sides[2], sides[3])
}

fun parsePaddingShorthand(style: Style, value: String) {
  val cleaned = value.trim().removeSuffix(";").trimEnd()
  if (cleaned.isEmpty()) {
    style.padding = Rect.uniform(LengthPercentage.Points(0f))
  } else {
    parsePhysicalEdges("padding", cleaned, ::parseLengthPercentage)?.let { style.padding = it }
  }
}

fun parseMarginShorthand(style: Style, value: String) {
  val cleaned = value.trim().removeSuffix(";").trimEnd()
  val rect: Rect<LengthPercentageAuto> = if (cleaned.isEmpty()) Rect.uniform(LengthPercentageAuto.Zero)
    else parsePhysicalEdges("margin", cleaned, ::parseLengthPercentageAuto) ?: return
  style.margin = rect
}

fun parseInsetShorthand(style: Style, value: String) {
  val cleaned = value.trim().removeSuffix(";").trimEnd()
  val rect: Rect<LengthPercentageAuto> = if (cleaned.isEmpty()) Rect.uniform(LengthPercentageAuto.Zero)
    else parsePhysicalEdges("inset", cleaned, ::parseLengthPercentageAuto) ?: return
  style.inset = rect
}

// <style-keys:records> generated from tools/scripts/style-keys/style-keys.schema
internal enum class StyleRecordKind(val id: Int) {
  BOX_SHADOW(0),
  TEXT_SHADOW(1),
  FILTER(2),
  BACKDROP_FILTER(3),
  FONT_FEATURES(4),
}

internal object ShadowRecord {
  const val STRIDE = 6
  const val X = 0
  const val Y = 1
  const val BLUR = 2
  const val SPREAD = 3
  const val COLOR = 4
  const val INSET = 5
}

internal object FilterRecord {
  const val STRIDE = 5
  const val KIND = 0
  const val AMOUNT_OR_X = 1
  const val Y = 2
  const val BLUR = 3
  const val COLOR = 4
}

internal object FontFeatureRecord {
  const val STRIDE = 2
  const val TAG = 0
  const val VALUE = 1
}

internal object BackgroundRecord {
  const val STRIDE = 17
  const val IMAGE_KIND = 0
  const val COLOR = 1
  const val REPEAT_X = 2
  const val REPEAT_Y = 3
  const val ORIGIN = 4
  const val CLIP = 5
  const val ATTACHMENT = 6
  const val SIZE_KIND = 7
  const val POSITION_X_FRACTION = 8
  const val POSITION_X_PIXELS = 9
  const val POSITION_Y_FRACTION = 10
  const val POSITION_Y_PIXELS = 11
  const val WIDTH_FRACTION = 12
  const val WIDTH_PIXELS = 13
  const val HEIGHT_FRACTION = 14
  const val HEIGHT_PIXELS = 15
  const val BLEND = 16
}

internal object BackgroundOffsetsRecord {
  const val STRIDE = 4
  const val POSITION_X = 0
  const val POSITION_Y = 1
  const val WIDTH = 2
  const val HEIGHT = 3
}

internal object BackgroundInputRecord {
  const val STRIDE = 8
  const val COLOR = 0
  const val IMAGE = 1
  const val REPEAT = 2
  const val POSITION = 3
  const val SIZE = 4
  const val CLIP = 5
  const val ORIGIN = 6
  const val ATTACHMENT = 7
}

internal object BorderComponentsRecord {
  const val STRIDE = 6
  const val TOP = 0
  const val RIGHT = 1
  const val BOTTOM = 2
  const val LEFT = 3
  const val STYLE = 4
  const val COLOR = 5
}

internal object BorderSideComponentsRecord {
  const val STRIDE = 3
  const val WIDTH = 0
  const val STYLE = 1
  const val COLOR = 2
}

internal object BorderRadiiRecord {
  const val STRIDE = 8
  const val HORIZONTAL_TOP_LEFT = 0
  const val HORIZONTAL_TOP_RIGHT = 1
  const val HORIZONTAL_BOTTOM_RIGHT = 2
  const val HORIZONTAL_BOTTOM_LEFT = 3
  const val VERTICAL_TOP_LEFT = 4
  const val VERTICAL_TOP_RIGHT = 5
  const val VERTICAL_BOTTOM_RIGHT = 6
  const val VERTICAL_BOTTOM_LEFT = 7
}

internal object ClipPathRecord {
  const val STRIDE = 7
  const val KIND = 0
  const val BOX = 1
  const val EVEN_ODD = 2
  const val RADIUS_X_KIND = 3
  const val RADIUS_Y_KIND = 4
  const val HAS_POSITION = 5
  const val HAS_MATH = 6
}

internal object SvgPathRecord {
  const val STRIDE = 8
  const val KIND = 0
  const val VERTEX_END = 1
  const val X1 = 2
  const val Y1 = 3
  const val X2 = 4
  const val Y2 = 5
  const val X = 6
  const val Y = 7
}

internal object MaskLayerRecord {
  const val STRIDE = 3
  const val CLIP = 0
  const val MODE = 1
  const val COMPOSITE = 2
}

internal object MaskInputRecord {
  const val STRIDE = 8
  const val IMAGE = 0
  const val SIZE = 1
  const val POSITION = 2
  const val REPEAT = 3
  const val ORIGIN = 4
  const val CLIP = 5
  const val MODE = 6
  const val COMPOSITE = 7
}

internal object NineSliceInputRecord {
  const val STRIDE = 6
  const val SOURCE = 0
  const val SLICE = 1
  const val WIDTH = 2
  const val OUTSET = 3
  const val REPEAT = 4
  const val MODE = 5
}

internal object NineSliceRecord {
  const val STRIDE = 4
  const val FILL = 0
  const val REPEAT_X = 1
  const val REPEAT_Y = 2
  const val LUMINANCE = 3
}

internal object NineSliceSideRecord {
  const val STRIDE = 3
  const val KIND = 0
  const val VALUE = 1
  const val HAS_MATH = 2
}

internal object TextDecorationRecord {
  const val STRIDE = 4
  const val LINE = 0
  const val STYLE = 1
  const val COLOR = 2
  const val THICKNESS = 3
}

internal object CssLengthResultRecord {
  const val STRIDE = 2
  const val KIND = 0
  const val VALUE = 1
}

internal object CssPositionResultRecord {
  const val STRIDE = 4
  const val X_TYPE = 0
  const val X_VALUE = 1
  const val Y_TYPE = 2
  const val Y_VALUE = 3
}

internal object CssDeclarationHeaderRecord {
  const val STRIDE = 3
  const val NAME = 0
  const val VALUE = 1
  const val FIELD_COUNT = 2
}

internal object CssInlineReplayRecord {
  const val STRIDE = 3
  const val VIEWPORT_DEPENDENT = 0
  const val FONT_DEPENDENT = 1
  const val FONT_SIZE = 2
}

internal object CssBackgroundWriteRecord {
  const val STRIDE = 3
  const val PROPERTY = 0
  const val VALUE = 1
  const val CURRENT_COLOR = 2
}

internal object CssBackgroundResultRecord {
  const val STRIDE = 8
  const val LAYERS_CHANGED = 0
  const val IMAGES_REPLACED = 1
  const val IMAGE_DECLARATION = 2
  const val SHORTHAND_VALUE = 3
  const val COLOR = 4
  const val COLOR_FROM_SHORTHAND = 5
  const val LAST_IMAGE_FROM_SHORTHAND = 6
  const val SHORTHAND_RESET = 7
}

internal object CssEffectWriteRecord {
  const val STRIDE = 3
  const val PROPERTY = 0
  const val VALUE = 1
  const val CURRENT_COLOR = 2
}

internal object CssEffectResultRecord {
  const val STRIDE = 2
  const val VALUE = 0
  const val RECORDS = 1
}

internal object CssMaskWriteRecord {
  const val STRIDE = 2
  const val SLOT = 0
  const val VALUE = 1
}

internal object CssBorderResultRecord {
  const val STRIDE = 10
  const val TOP_KIND = 0
  const val TOP_VALUE = 1
  const val RIGHT_KIND = 2
  const val RIGHT_VALUE = 3
  const val BOTTOM_KIND = 4
  const val BOTTOM_VALUE = 5
  const val LEFT_KIND = 6
  const val LEFT_VALUE = 7
  const val STYLE = 8
  const val COLOR = 9
}

internal object CssBorderSideResultRecord {
  const val STRIDE = 4
  const val KIND = 0
  const val VALUE = 1
  const val STYLE = 2
  const val COLOR = 3
}

internal object GradientInterpolationRecord {
  const val STRIDE = 3
  const val DIRECTION = 0
  const val SPACE = 1
  const val HUE = 2
}

internal object AndroidPaintReadRecord {
  const val STRIDE = 6
  const val VALUES = 0
  const val IMAGES = 1
  const val OFFSETS = 2
  const val GRADIENTS = 3
  const val GRADIENT_INFO = 4
  const val SNAPSHOT = 5
}

internal object AndroidGradientInfoRecord {
  const val STRIDE = 6
  const val KIND = 0
  const val REPEATING = 1
  const val STOP_COUNT = 2
  const val DIRECTION = 3
  const val SPACE = 4
  const val HUE = 5
}

internal object SvgFontPrefixRecord {
  const val STRIDE = 3
  const val ITALIC = 0
  const val WEIGHT = 1
  const val SIZE = 2
}

internal object SvgCssDeclarationRecord {
  const val STRIDE = 3
  const val NAME = 0
  const val VALUE = 1
  const val IMPORTANT = 2
}

internal object SvgCssSelectorRecord {
  const val STRIDE = 3
  const val TYPE = 0
  const val ID_COUNT = 1
  const val CLASS_COUNT = 2
}

internal object SvgCssRuleRecord {
  const val STRIDE = 2
  const val SELECTOR_COUNT = 0
  const val DECLARATION_COUNT = 1
}

internal object SvgPaintRecord {
  const val STRIDE = 2
  const val KIND = 0
  const val VALUE = 1
}

internal object CssAnimationLayerRecord {
  const val STRIDE = 1
  const val COMPONENT_COUNT = 0
}

internal object CssAnimationComponentRecord {
  const val STRIDE = 3
  const val KIND = 0
  const val VALUE = 1
  const val UNIT = 2
}

internal object SvgLengthComponentsRecord {
  const val STRIDE = 2
  const val LENGTH = 0
  const val PERCENT = 1
}

internal object SvgAffineRecord {
  const val STRIDE = 6
  const val A = 0
  const val B = 1
  const val C = 2
  const val D = 3
  const val X = 4
  const val Y = 5
}

internal object SvgAspectRatioRecord {
  const val STRIDE = 4
  const val ALIGN_X = 0
  const val ALIGN_Y = 1
  const val UNIFORM = 2
  const val SLICE = 3
}

internal object FilterOperationCode {
  const val BLUR = 0
  const val BRIGHTNESS = 1
  const val CONTRAST = 2
  const val SATURATE = 3
  const val HUE_ROTATE = 4
  const val INVERT = 5
  const val OPACITY = 6
  const val SEPIA = 7
  const val GRAYSCALE = 8
  const val DROP_SHADOW = 9
}

internal object CssParseKind {
  const val SHADOWS = 0
  const val FILTERS = 1
  const val LENGTH = 2
  const val FONT_SIZE = 3
  const val CLAMP_LENGTH = 4
  const val TRANSFORM_ORIGIN = 5
  const val OBJECT_POSITION = 6
  const val LINE_HEIGHT = 7
  const val LETTER_SPACING = 8
  const val TEXT_INDENT = 9
  const val WORD_SPACING = 10
  const val VERTICAL_ALIGN = 11
  const val DIMENSION = 12
  const val LENGTH_AUTO = 13
  const val BORDER_RADIUS = 14
  const val BORDER_CORNER_RADIUS = 15
  const val SVG_NUMBER_LIST = 16
  const val SVG_TRANSFORM = 17
  const val SVG_LENGTH = 18
  const val SVG_LENGTH_LIST = 19
  const val SVG_OPACITY = 20
  const val SVG_ANGLE = 21
  const val SVG_ASPECT_RATIO = 22
  const val SVG_NUMBER = 23
  const val SVG_DASH_ARRAY = 24
}
// </style-keys:records>

object StyleKeys {
  // <style-keys:offsets> generated from tools/scripts/style-keys/style-keys.schema, run `npm run gen:style-keys`
  const val STYLE_BUFFER_SIZE = 792

  const val DISPLAY = 0
  const val POSITION = 1
  const val DIRECTION = 2
  const val FLEX_DIRECTION = 3
  const val FLEX_WRAP = 4
  const val OVERFLOW_X = 5
  const val OVERFLOW_Y = 6

  const val ALIGN_ITEMS = 7
  const val ALIGN_SELF = 8
  const val ALIGN_CONTENT = 9

  const val JUSTIFY_ITEMS = 10
  const val JUSTIFY_SELF = 11
  const val JUSTIFY_CONTENT = 12

  // Each box side group: four types, then four values.
  const val INSET_LEFT_TYPE = 13
  const val INSET_RIGHT_TYPE = 14
  const val INSET_TOP_TYPE = 15
  const val INSET_BOTTOM_TYPE = 16
  const val INSET_LEFT_VALUE = 17 // f32 (17-20)
  const val INSET_RIGHT_VALUE = 21 // f32 (21-24)
  const val INSET_TOP_VALUE = 25 // f32 (25-28)
  const val INSET_BOTTOM_VALUE = 29 // f32 (29-32)

  const val MARGIN_LEFT_TYPE = 33
  const val MARGIN_RIGHT_TYPE = 34
  const val MARGIN_TOP_TYPE = 35
  const val MARGIN_BOTTOM_TYPE = 36
  const val MARGIN_LEFT_VALUE = 37 // f32 (37-40)
  const val MARGIN_RIGHT_VALUE = 41 // f32 (41-44)
  const val MARGIN_TOP_VALUE = 45 // f32 (45-48)
  const val MARGIN_BOTTOM_VALUE = 49 // f32 (49-52)

  const val PADDING_LEFT_TYPE = 53
  const val PADDING_RIGHT_TYPE = 54
  const val PADDING_TOP_TYPE = 55
  const val PADDING_BOTTOM_TYPE = 56
  const val PADDING_LEFT_VALUE = 57 // f32 (57-60)
  const val PADDING_RIGHT_VALUE = 61 // f32 (61-64)
  const val PADDING_TOP_VALUE = 65 // f32 (65-68)
  const val PADDING_BOTTOM_VALUE = 69 // f32 (69-72)

  const val BORDER_LEFT_TYPE = 73
  const val BORDER_RIGHT_TYPE = 74
  const val BORDER_TOP_TYPE = 75
  const val BORDER_BOTTOM_TYPE = 76
  const val BORDER_LEFT_VALUE = 77 // f32 (77-80)
  const val BORDER_RIGHT_VALUE = 81 // f32 (81-84)
  const val BORDER_TOP_VALUE = 85 // f32 (85-88)
  const val BORDER_BOTTOM_VALUE = 89 // f32 (89-92)

  const val FLEX_GROW = 93 // f32 (93-96)
  const val FLEX_SHRINK = 97 // f32 (97-100)

  const val FLEX_BASIS_TYPE = 101
  const val FLEX_BASIS_VALUE = 102 // f32 (102-105)

  const val WIDTH_TYPE = 106
  const val HEIGHT_TYPE = 107
  const val WIDTH_VALUE = 108 // f32 (108-111)
  const val HEIGHT_VALUE = 112 // f32 (112-115)

  const val MIN_WIDTH_TYPE = 116
  const val MIN_HEIGHT_TYPE = 117
  const val MIN_WIDTH_VALUE = 118 // f32 (118-121)
  const val MIN_HEIGHT_VALUE = 122 // f32 (122-125)

  const val MAX_WIDTH_TYPE = 126
  const val MAX_HEIGHT_TYPE = 127
  const val MAX_WIDTH_VALUE = 128 // f32 (128-131)
  const val MAX_HEIGHT_VALUE = 132 // f32 (132-135)

  const val GAP_ROW_TYPE = 136
  const val GAP_COLUMN_TYPE = 137
  const val GAP_ROW_VALUE = 138 // f32 (138-141)
  const val GAP_COLUMN_VALUE = 142 // f32 (142-145)

  const val ASPECT_RATIO = 146 // f32 (146-149)
  const val GRID_AUTO_FLOW = 150
  const val GRID_COLUMN_START_TYPE = 151
  const val GRID_COLUMN_END_TYPE = 152
  const val GRID_ROW_START_TYPE = 153
  const val GRID_ROW_END_TYPE = 154
  const val GRID_COLUMN_START_VALUE = 155 // f32 (155-158)
  const val GRID_COLUMN_END_VALUE = 159 // f32 (159-162)
  const val GRID_ROW_START_VALUE = 163 // f32 (163-166)
  const val GRID_ROW_END_VALUE = 167 // f32 (167-170)
  const val SCROLLBAR_WIDTH = 171 // f32 (171-174)
  const val ALIGN = 175
  const val BOX_SIZING = 176
  const val OVERFLOW = 177
  const val ITEM_IS_TABLE = 178
  const val ITEM_IS_REPLACED = 179
  const val DISPLAY_MODE = 180
  const val FORCE_INLINE = 181
  const val MIN_CONTENT_WIDTH = 182 // f32 (182-185)
  const val MIN_CONTENT_HEIGHT = 186 // f32 (186-189)
  const val MAX_CONTENT_WIDTH = 190 // f32 (190-193)
  const val MAX_CONTENT_HEIGHT = 194 // f32 (194-197)

  const val BORDER_LEFT_STYLE = 198
  const val BORDER_RIGHT_STYLE = 199
  const val BORDER_TOP_STYLE = 200
  const val BORDER_BOTTOM_STYLE = 201

  const val BORDER_LEFT_COLOR = 202 // u32 (202-205)
  const val BORDER_RIGHT_COLOR = 206 // u32 (206-209)
  const val BORDER_TOP_COLOR = 210 // u32 (210-213)
  const val BORDER_BOTTOM_COLOR = 214 // u32 (214-217)

  // Elliptical radii: eight types, eight values, then four squircle exponents.
  const val BORDER_RADIUS_TOP_LEFT_X_TYPE = 218
  const val BORDER_RADIUS_TOP_LEFT_Y_TYPE = 219
  const val BORDER_RADIUS_TOP_RIGHT_X_TYPE = 220
  const val BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 221
  const val BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 222
  const val BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 223
  const val BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 224
  const val BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 225
  const val BORDER_RADIUS_TOP_LEFT_X_VALUE = 226 // f32 (226-229)
  const val BORDER_RADIUS_TOP_LEFT_Y_VALUE = 230 // f32 (230-233)
  const val BORDER_RADIUS_TOP_RIGHT_X_VALUE = 234 // f32 (234-237)
  const val BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238 // f32 (238-241)
  const val BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 242 // f32 (242-245)
  const val BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 246 // f32 (246-249)
  const val BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 250 // f32 (250-253)
  const val BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 254 // f32 (254-257)
  const val BORDER_RADIUS_TOP_LEFT_EXPONENT = 258 // f32 (258-261)
  const val BORDER_RADIUS_TOP_RIGHT_EXPONENT = 262 // f32 (262-265)
  const val BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 266 // f32 (266-269)
  const val BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270 // f32 (270-273)

  const val FLOAT = 274
  const val CLEAR = 275
  const val OBJECT_FIT = 276

  const val FONT_METRICS_ASCENT_OFFSET = 277 // f32 (277-280)
  const val FONT_METRICS_DESCENT_OFFSET = 281 // f32 (281-284)
  const val FONT_METRICS_X_HEIGHT_OFFSET = 285 // f32 (285-288)
  const val FONT_METRICS_LEADING_OFFSET = 289 // f32 (289-292)
  const val FONT_METRICS_CAP_HEIGHT_OFFSET = 293 // f32 (293-296)
  const val VERTICAL_ALIGN_OFFSET_OFFSET = 297 // f32 (297-300)
  const val VERTICAL_ALIGN_IS_PERCENT_OFFSET = 301
  const val VERTICAL_ALIGN_ENUM_OFFSET = 302
  const val FIRST_BASELINE_OFFSET = 306 // f32 (306-309), preserves the three reserved bytes after vertical-align
  const val Z_INDEX = 310 // i32 (310-313)
  const val ITEM_IS_LIST = 314
  const val ITEM_IS_LIST_ITEM = 315
  const val LIST_STYLE_POSITION = 316
  const val LIST_STYLE_TYPE = 317
  const val LIST_STYLE_POSITION_STATE = 318
  const val LIST_STYLE_TYPE_STATE = 319
  const val REF_COUNT = 320 // u32 (320-323), copy-on-write share count

  // Inherited text fields. A *_STATE byte is nonzero once the node sets the field.
  const val FONT_COLOR = 324 // u32 (324-327)
  const val FONT_COLOR_STATE = 328
  const val FONT_SIZE = 329 // f32 (329-332)
  const val FONT_SIZE_TYPE = 333
  const val FONT_SIZE_STATE = 334
  const val FONT_WEIGHT = 335 // i32 (335-338)
  const val FONT_WEIGHT_STATE = 339
  const val FONT_STYLE_SLANT = 340 // i32 (340-343)
  const val FONT_STYLE_TYPE = 344
  const val FONT_STYLE_STATE = 345
  const val FONT_FAMILY_STATE = 346
  const val FONT_RESOLVED_DIRTY = 347
  const val BACKGROUND_COLOR = 348 // u32 (348-351)
  const val BACKGROUND_COLOR_STATE = 352
  const val BACKGROUND_COLOR_TYPE = 353
  const val DECORATION_LINE = 354
  const val DECORATION_LINE_STATE = 355
  const val DECORATION_COLOR = 356 // u32 (356-359)
  const val DECORATION_COLOR_STATE = 360
  const val DECORATION_STYLE = 361
  const val DECORATION_STYLE_STATE = 362
  const val LETTER_SPACING = 363 // f32 (363-366)
  const val LETTER_SPACING_STATE = 367
  const val TEXT_WRAP = 368
  const val TEXT_WRAP_STATE = 369
  const val WHITE_SPACE = 370
  const val WHITE_SPACE_STATE = 371
  const val TEXT_TRANSFORM = 372
  const val TEXT_TRANSFORM_STATE = 373
  const val TEXT_ALIGN = 374
  const val TEXT_ALIGN_STATE = 375
  const val TEXT_JUSTIFY = 376
  const val TEXT_JUSTIFY_STATE = 377
  const val TEXT_INDENT = 378 // f32 (378-381)
  const val TEXT_INDENT_TYPE = 382 // 0 px, 1 %
  const val TEXT_INDENT_STATE = 383
  const val LINE_HEIGHT = 384 // f32 (384-387)
  const val LINE_HEIGHT_STATE = 388
  const val LINE_HEIGHT_TYPE = 389
  const val DECORATION_THICKNESS = 390 // f32 (390-393)
  const val DECORATION_THICKNESS_STATE = 394
  const val TEXT_SHADOW_STATE = 395
  const val TEXT_OVERFLOW = 396
  const val TEXT_OVERFLOW_STATE = 397

  // Which StateKeys a pseudo-class buffer sets explicitly (same bit layout).
  const val PSEUDO_SET_MASK_LOW = 398 // i64 (398-405)
  const val PSEUDO_SET_MASK_HIGH = 406 // i64 (406-413)

  // 414-418 free.
  const val FONT_VARIANT_NUMERIC = 419 // bitmask
  const val FONT_VARIANT_NUMERIC_STATE = 420

  // Up to six inline transform ops, or a full matrix.
  const val TRANSFORM_COUNT = 422 // number of inline ops (0-6)
  const val TRANSFORM_FLAGS = 423 // bit 0 HAS_MATRIX, bit 1 IS_3D
  const val TRANSFORM_OP_0 = 424 // bytes(12) (424-435), type(u8) + pad(3) + a(f32) + b(f32)
  const val TRANSFORM_OP_1 = 436 // bytes(12) (436-447)
  const val TRANSFORM_OP_2 = 448 // bytes(12) (448-459)
  const val TRANSFORM_OP_3 = 460 // bytes(12) (460-471)
  const val TRANSFORM_OP_4 = 472 // bytes(12) (472-483)
  const val TRANSFORM_OP_5 = 484 // bytes(12) (484-495)
  const val TRANSFORM_MATRIX = 496 // bytes(64) (496-559), 16 x f32, 4x4 column-major

  const val OBJECT_POSITION_X_TYPE = 560 // 0 px, 1 %, 2 keyword
  const val OBJECT_POSITION_Y_TYPE = 561
  const val OBJECT_POSITION_X_VALUE = 562 // f32 (562-565)
  const val OBJECT_POSITION_Y_VALUE = 566 // f32 (566-569)
  const val OBJECT_POSITION_STATE = 570
  const val WRITING_MODE = 571
  const val WRITING_MODE_STATE = 572
  const val UNICODE_BIDI = 573
  const val UNICODE_BIDI_STATE = 574
  const val HYPHENS = 575
  const val HYPHENS_STATE = 576
  const val CARET_COLOR = 577 // u32 (577-580)
  const val CARET_COLOR_STATE = 581
  const val WORD_SPACING = 582 // f32 (582-585)
  const val WORD_SPACING_TYPE = 586 // 0 px, 1 %, 2 normal
  const val WORD_SPACING_STATE = 587
  const val FONT_STRETCH = 588 // i32 (588-591), percentage x 100
  const val FONT_STRETCH_STATE = 592
  const val LINE_CLAMP = 593 // i32 (593-596), max lines, 0 none
  const val LINE_CLAMP_STATE = 597
  const val TRANSFORM_ORIGIN_X_TYPE = 598 // 0 px, 1 %
  const val TRANSFORM_ORIGIN_Y_TYPE = 599
  const val TRANSFORM_ORIGIN_X_VALUE = 600 // f32 (600-603)
  const val TRANSFORM_ORIGIN_Y_VALUE = 604 // f32 (604-607)
  const val TRANSFORM_ORIGIN_STATE = 608
  const val TEXT_ORIENTATION = 609 // 0 mixed, 1 upright, 2 sideways
  const val TEXT_ORIENTATION_STATE = 610

  // CSS logical properties, mapped onto physical sides by the box's writing mode and direction.
  // A group's ORDER bytes are its physical slots (top, right, bottom, left; sizes: width, height,
  // min-width, min-height, max-width, max-height) then its logical ones in the order below: 0
  // never written, else the write's LOGICAL_SEQ stamp. A logical value applies to the side it
  // maps to when it was written after that side's physical one. Types are the physical group's.
  const val LOGICAL_SEQ = 611
  const val MARGIN_ORDER = 612 // bytes(8) (612-619)
  const val MARGIN_BLOCK_START_TYPE = 620
  const val MARGIN_INLINE_END_TYPE = 621
  const val MARGIN_BLOCK_END_TYPE = 622
  const val MARGIN_INLINE_START_TYPE = 623
  const val MARGIN_BLOCK_START_VALUE = 624 // f32 (624-627)
  const val MARGIN_INLINE_END_VALUE = 628 // f32 (628-631)
  const val MARGIN_BLOCK_END_VALUE = 632 // f32 (632-635)
  const val MARGIN_INLINE_START_VALUE = 636 // f32 (636-639)
  const val PADDING_ORDER = 640 // bytes(8) (640-647)
  const val PADDING_BLOCK_START_TYPE = 648
  const val PADDING_INLINE_END_TYPE = 649
  const val PADDING_BLOCK_END_TYPE = 650
  const val PADDING_INLINE_START_TYPE = 651
  const val PADDING_BLOCK_START_VALUE = 652 // f32 (652-655)
  const val PADDING_INLINE_END_VALUE = 656 // f32 (656-659)
  const val PADDING_BLOCK_END_VALUE = 660 // f32 (660-663)
  const val PADDING_INLINE_START_VALUE = 664 // f32 (664-667)
  const val INSET_ORDER = 668 // bytes(8) (668-675)
  const val INSET_BLOCK_START_TYPE = 676
  const val INSET_INLINE_END_TYPE = 677
  const val INSET_BLOCK_END_TYPE = 678
  const val INSET_INLINE_START_TYPE = 679
  const val INSET_BLOCK_START_VALUE = 680 // f32 (680-683)
  const val INSET_INLINE_END_VALUE = 684 // f32 (684-687)
  const val INSET_BLOCK_END_VALUE = 688 // f32 (688-691)
  const val INSET_INLINE_START_VALUE = 692 // f32 (692-695)
  const val SIZE_ORDER = 696 // bytes(12) (696-707)
  const val INLINE_SIZE_TYPE = 708
  const val BLOCK_SIZE_TYPE = 709
  const val MIN_INLINE_SIZE_TYPE = 710
  const val MIN_BLOCK_SIZE_TYPE = 711
  const val MAX_INLINE_SIZE_TYPE = 712
  const val MAX_BLOCK_SIZE_TYPE = 713
  const val INLINE_SIZE_VALUE = 714 // f32 (714-717)
  const val BLOCK_SIZE_VALUE = 718 // f32 (718-721)
  const val MIN_INLINE_SIZE_VALUE = 722 // f32 (722-725)
  const val MIN_BLOCK_SIZE_VALUE = 726 // f32 (726-729)
  const val MAX_INLINE_SIZE_VALUE = 730 // f32 (730-733)
  const val MAX_BLOCK_SIZE_VALUE = 734 // f32 (734-737)
  const val TEXT_COMBINE_UPRIGHT = 738 // 0 none, 1 all, 2-4 digits (that many)
  const val TEXT_COMBINE_UPRIGHT_STATE = 739
  const val TEXT_SPACING_TRIM = 740 // 0 normal, 1 space-all, 2 space-first, 3 trim-start, 4 trim-both, 5 trim-all, 6 auto
  const val TEXT_SPACING_TRIM_STATE = 741
  const val VISIBILITY = 742 // 0 visible, 1 hidden, 2 collapse
  const val FONT_FEATURES_REVISION = 743 // Rust-owned OpenType feature settings change counter
  const val BOX_SHADOW_REVISION = 744 // u32 (744-747), Rust-owned box shadow records change counter
  const val TEXT_SHADOW_REVISION = 748 // u32 (748-751), Rust-owned text shadow records change counter
  const val FILTER_REVISION = 752 // u32 (752-755), Rust-owned filter records change counter
  const val BACKDROP_FILTER_REVISION = 756 // u32 (756-759), Rust-owned backdrop-filter records change counter
  const val BACKGROUND_REVISION = 760 // u32 (760-763), Rust-owned background layers change counter
  const val TRANSFORM_REVISION = 764 // u32 (764-767), Rust-owned CSS transform list change counter
  const val CLIP_PATH_REVISION = 768 // u32 (768-771), Rust-owned CSS clip-path change counter
  const val MASK_REVISION = 772 // u32 (772-775), Rust-owned mask layer list change counter
  const val BORDER_IMAGE_REVISION = 776 // u32 (776-779), Rust-owned border-image change counter
  const val MASK_BORDER_REVISION = 780 // u32 (780-783), Rust-owned mask-border change counter
  const val TEXT_OVERFLOW_TOKEN = 784 // i64 (784-791), Rust-owned text-overflow string handle
  // </style-keys:offsets>
  const val TRANSFORM_OP_SIZE = 12
  const val MAX_INLINE_TRANSFORM_OPS = 6
  const val TRANSFORM_FLAG_HAS_MATRIX = 0x01
  const val TRANSFORM_FLAG_IS_3D = 0x02
}

object TransformOpType {
  const val NONE = 0
  const val TRANSLATE = 1
  const val TRANSLATE_X = 2
  const val TRANSLATE_Y = 3
  const val SCALE = 4
  const val SCALE_X = 5
  const val SCALE_Y = 6
  const val ROTATE = 7
  const val SKEW_X = 8
  const val SKEW_Y = 9
}

class StateKeys internal constructor(val low: Long, val high: Long) {
  companion object {
    @JvmStatic
    fun flag(n: Int): StateKeys =
      if (n < 64) StateKeys(1L shl n, 0L) else StateKeys(0L, 1L shl (n - 64))

    val NONE = StateKeys(0L, 0L)
    val INVALIDATE_TEXT = StateKeys(-1L, -1L)
    // <style-keys:state> generated from tools/scripts/style-keys/style-keys.schema, run `npm run gen:style-keys`
    val DISPLAY = flag(0)
    val POSITION = flag(1)
    val DIRECTION = flag(2)
    val FLEX_DIRECTION = flag(3)
    val FLEX_WRAP = flag(4)
    val OVERFLOW_X = flag(5)
    val OVERFLOW_Y = flag(6)
    val ALIGN_ITEMS = flag(7)
    val ALIGN_SELF = flag(8)
    val ALIGN_CONTENT = flag(9)
    val JUSTIFY_ITEMS = flag(10)
    val JUSTIFY_SELF = flag(11)
    val JUSTIFY_CONTENT = flag(12)
    val INSET = flag(13)
    val MARGIN = flag(14)
    val PADDING = flag(15)
    val BORDER = flag(16)
    val FLEX_GROW = flag(17)
    val FLEX_SHRINK = flag(18)
    val FLEX_BASIS = flag(19)
    val SIZE = flag(20)
    val MIN_SIZE = flag(21)
    val MAX_SIZE = flag(22)
    val GAP = flag(23)
    val ASPECT_RATIO = flag(24)
    val GRID_AUTO_FLOW = flag(25)
    val GRID_COLUMN = flag(26)
    val GRID_ROW = flag(27)
    val SCROLLBAR_WIDTH = flag(28)
    val ALIGN = flag(29)
    val BOX_SIZING = flag(30)
    val OVERFLOW = flag(31)
    val ITEM_IS_TABLE = flag(32)
    val ITEM_IS_REPLACED = flag(33)
    val DISPLAY_MODE = flag(34)
    val FORCE_INLINE = flag(35)
    val MIN_CONTENT_WIDTH = flag(36)
    val MIN_CONTENT_HEIGHT = flag(37)
    val MAX_CONTENT_WIDTH = flag(38)
    val MAX_CONTENT_HEIGHT = flag(39)
    val BORDER_STYLE = flag(40)
    val BORDER_RADIUS = flag(41)
    val BORDER_COLOR = flag(42)
    val FLOAT = flag(43)
    val CLEAR = flag(44)
    val OBJECT_FIT = flag(45)
    val Z_INDEX = flag(46)
    val LIST_STYLE_POSITION = flag(47)
    val LIST_STYLE_TYPE = flag(48)
    val FONT_COLOR = flag(50)
    val DECORATION_LINE = flag(51)
    val DECORATION_COLOR = flag(52)
    val TEXT_ALIGN = flag(53)
    val TEXT_JUSTIFY = flag(54)
    val BACKGROUND_COLOR = flag(55)
    val FONT_SIZE = flag(56)
    val TEXT_TRANSFORM = flag(57)
    val FONT_STYLE = flag(58)
    val FONT_STYLE_SLANT = flag(59)
    val TEXT_WRAP = flag(60)
    val TEXT_OVERFLOW = flag(61)
    val DECORATION_STYLE = flag(62)
    val WHITE_SPACE = flag(63)
    val FONT_WEIGHT = flag(64)
    val LINE_HEIGHT = flag(65)
    val VERTICAL_ALIGN = flag(66)
    val DECORATION_THICKNESS = flag(67)
    val TEXT_SHADOWS = flag(68)
    val FONT_FAMILY = flag(69)
    val LETTER_SPACING = flag(70)
    val FONT_VARIANT_NUMERIC = flag(71)
    val OBJECT_POSITION = flag(72)
    val WRITING_MODE = flag(73)
    val UNICODE_BIDI = flag(74)
    val HYPHENS = flag(75)
    val CARET_COLOR = flag(76)
    val WORD_SPACING = flag(77)
    val FONT_STRETCH = flag(78)
    val TEXT_INDENT = flag(79)
    val LINE_CLAMP = flag(80)
    val TRANSFORM_ORIGIN = flag(81)
    val TEXT_ORIENTATION = flag(82)
    val TEXT_COMBINE_UPRIGHT = flag(83)
    val TEXT_SPACING_TRIM = flag(84)
    val VISIBILITY = flag(85)
    val FONT_FEATURE_SETTINGS = flag(86)
    // </style-keys:state>

    // <style-keys:state-groups> generated from tools/scripts/style-keys/style-keys.schema
    val TEXT_LAYOUT = StateKeys(0xbf63800000000000UL.toLong(), 0x00000000005deee7L)
    val TEXT_VISUAL = StateKeys(0x409c000000000000L, 0x0000000000000018L)
    val ALL_TEXT = StateKeys(0xffff800000000000UL.toLong(), 0x00000000005deeffL)
    val LAYOUT_MASK = StateKeys(0xbf6398ffffffffffUL.toLong(), 0x00000000007deee7L)
    val BORDER_PAINT = StateKeys(0x0000070000010000L, 0x0000000000000000L)
    val OBJECT_PAINT = StateKeys(0x0000200000000000L, 0x0000000000000100L)
    // </style-keys:state-groups>

    val TREE_HINTS: StateKeys = FLOAT or OVERFLOW_X or OVERFLOW_Y or OVERFLOW or WRITING_MODE or
      TEXT_ORIENTATION or TEXT_COMBINE_UPRIGHT

    fun hasFlag(low: Long, high: Long, flag: StateKeys): Boolean =
      ((low and flag.low) != 0L) || ((high and flag.high) != 0L)

    fun hasFlag(low: Long, high: Long, otherLow: Long, otherHigh: Long): Boolean =
      ((low and otherLow) != 0L) || ((high and otherHigh) != 0L)
  }

  // compatibility: return low bits when code expects single 64-bit value
  val bits: Long get() = low

  infix fun or(other: StateKeys): StateKeys = StateKeys(low or other.low, high or other.high)
  infix fun and(other: StateKeys): StateKeys = StateKeys(low and other.low, high and other.high)
  infix fun hasFlag(flag: StateKeys): Boolean =
    ((low and flag.low) != 0L) || ((high and flag.high) != 0L)

  // `and`/`or` always allocate a new instance, so reference equality (the
  // default for a plain class) never matches StateKeys.NONE even when both
  // bit-fields are actually zero. Value equality is required for callers
  // that compare a masked result against StateKeys.NONE.
  override fun equals(other: Any?): Boolean =
    other is StateKeys && low == other.low && high == other.high

  override fun hashCode(): Int = 31 * low.hashCode() + high.hashCode()
}

interface StyleChangeListener {
  fun onChange(low: Long, high: Long)
}

private const val DEFAULT_FONT_FAMILY = "sans-serif"

internal fun toAndroidLayoutDirection(direction: Direction): Int = when (direction) {
  Direction.LTR -> android.view.View.LAYOUT_DIRECTION_LTR
  Direction.RTL -> android.view.View.LAYOUT_DIRECTION_RTL
  Direction.Inherit -> android.view.View.LAYOUT_DIRECTION_INHERIT
}

internal object StyleState {
  const val INHERIT: Byte = 0
  const val SET: Byte = 1
}

class Style internal constructor(@Transient internal var node: Node) {
  // <style-keys:writes> generated from tools/scripts/style-keys/style-keys.schema
  private fun writeAlign(align: Byte) {
    prepareMut()
    values.put(StyleKeys.ALIGN, align)
    setOrAppendState(StateKeys.ALIGN)
  }

  private fun writeAlignContent(alignContent: Byte) {
    prepareMut()
    values.put(StyleKeys.ALIGN_CONTENT, alignContent)
    setOrAppendState(StateKeys.ALIGN_CONTENT)
  }

  private fun writeAlignItems(alignItems: Byte) {
    prepareMut()
    values.put(StyleKeys.ALIGN_ITEMS, alignItems)
    setOrAppendState(StateKeys.ALIGN_ITEMS)
  }

  private fun writeAlignSelf(alignSelf: Byte) {
    prepareMut()
    values.put(StyleKeys.ALIGN_SELF, alignSelf)
    setOrAppendState(StateKeys.ALIGN_SELF)
  }

  private fun writeAspectRatio(aspectRatio: Float) {
    prepareMut()
    values.putFloat(StyleKeys.ASPECT_RATIO, aspectRatio)
    setOrAppendState(StateKeys.ASPECT_RATIO)
  }

  private fun writeBorderBottomStyle(borderBottomStyle: Byte) {
    prepareMut()
    values.put(StyleKeys.BORDER_BOTTOM_STYLE, borderBottomStyle)
    setOrAppendState(StateKeys.BORDER_STYLE)
  }

  private fun writeBorderBottomWidth(borderBottomType: Byte, borderBottomValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_BOTTOM_TYPE, borderBottomType)
    values.putFloat(StyleKeys.BORDER_BOTTOM_VALUE, borderBottomValue)
    setOrAppendState(StateKeys.BORDER)
  }

  private fun writeBorderLeftStyle(borderLeftStyle: Byte) {
    prepareMut()
    values.put(StyleKeys.BORDER_LEFT_STYLE, borderLeftStyle)
    setOrAppendState(StateKeys.BORDER_STYLE)
  }

  private fun writeBorderLeftWidth(borderLeftType: Byte, borderLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_LEFT_TYPE, borderLeftType)
    values.putFloat(StyleKeys.BORDER_LEFT_VALUE, borderLeftValue)
    setOrAppendState(StateKeys.BORDER)
  }

  private fun writeBorderRightStyle(borderRightStyle: Byte) {
    prepareMut()
    values.put(StyleKeys.BORDER_RIGHT_STYLE, borderRightStyle)
    setOrAppendState(StateKeys.BORDER_STYLE)
  }

  private fun writeBorderRightWidth(borderRightType: Byte, borderRightValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_RIGHT_TYPE, borderRightType)
    values.putFloat(StyleKeys.BORDER_RIGHT_VALUE, borderRightValue)
    setOrAppendState(StateKeys.BORDER)
  }

  private fun writeBorderTopStyle(borderTopStyle: Byte) {
    prepareMut()
    values.put(StyleKeys.BORDER_TOP_STYLE, borderTopStyle)
    setOrAppendState(StateKeys.BORDER_STYLE)
  }

  private fun writeBorderTopWidth(borderTopType: Byte, borderTopValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_TOP_TYPE, borderTopType)
    values.putFloat(StyleKeys.BORDER_TOP_VALUE, borderTopValue)
    setOrAppendState(StateKeys.BORDER)
  }

  private fun writeBorderStyles(borderTopStyle: Byte, borderRightStyle: Byte, borderBottomStyle: Byte, borderLeftStyle: Byte) {
    prepareMut()
    values.put(StyleKeys.BORDER_TOP_STYLE, borderTopStyle)
    values.put(StyleKeys.BORDER_RIGHT_STYLE, borderRightStyle)
    values.put(StyleKeys.BORDER_BOTTOM_STYLE, borderBottomStyle)
    values.put(StyleKeys.BORDER_LEFT_STYLE, borderLeftStyle)
    setOrAppendState(StateKeys.BORDER_STYLE)
  }

  private fun writeBorderColors(borderTopColor: Int, borderRightColor: Int, borderBottomColor: Int, borderLeftColor: Int) {
    prepareMut()
    values.putInt(StyleKeys.BORDER_TOP_COLOR, borderTopColor)
    values.putInt(StyleKeys.BORDER_RIGHT_COLOR, borderRightColor)
    values.putInt(StyleKeys.BORDER_BOTTOM_COLOR, borderBottomColor)
    values.putInt(StyleKeys.BORDER_LEFT_COLOR, borderLeftColor)
    setOrAppendState(StateKeys.BORDER_COLOR)
  }

  private fun writeBorderWidth(borderTopType: Byte, borderTopValue: Float, borderRightType: Byte, borderRightValue: Float, borderBottomType: Byte, borderBottomValue: Float, borderLeftType: Byte, borderLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_TOP_TYPE, borderTopType)
    values.putFloat(StyleKeys.BORDER_TOP_VALUE, borderTopValue)
    values.put(StyleKeys.BORDER_RIGHT_TYPE, borderRightType)
    values.putFloat(StyleKeys.BORDER_RIGHT_VALUE, borderRightValue)
    values.put(StyleKeys.BORDER_BOTTOM_TYPE, borderBottomType)
    values.putFloat(StyleKeys.BORDER_BOTTOM_VALUE, borderBottomValue)
    values.put(StyleKeys.BORDER_LEFT_TYPE, borderLeftType)
    values.putFloat(StyleKeys.BORDER_LEFT_VALUE, borderLeftValue)
    setOrAppendState(StateKeys.BORDER)
  }

  private fun writeBorderTopLeftRadius(borderRadiusTopLeftXType: Byte, borderRadiusTopLeftXValue: Float, borderRadiusTopLeftYType: Byte, borderRadiusTopLeftYValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, borderRadiusTopLeftXType)
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE, borderRadiusTopLeftXValue)
    values.put(StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, borderRadiusTopLeftYType)
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE, borderRadiusTopLeftYValue)
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeBorderTopRightRadius(borderRadiusTopRightXType: Byte, borderRadiusTopRightXValue: Float, borderRadiusTopRightYType: Byte, borderRadiusTopRightYValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, borderRadiusTopRightXType)
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE, borderRadiusTopRightXValue)
    values.put(StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, borderRadiusTopRightYType)
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE, borderRadiusTopRightYValue)
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeBorderBottomRightRadius(borderRadiusBottomRightXType: Byte, borderRadiusBottomRightXValue: Float, borderRadiusBottomRightYType: Byte, borderRadiusBottomRightYValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, borderRadiusBottomRightXType)
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE, borderRadiusBottomRightXValue)
    values.put(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, borderRadiusBottomRightYType)
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE, borderRadiusBottomRightYValue)
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeBorderBottomLeftRadius(borderRadiusBottomLeftXType: Byte, borderRadiusBottomLeftXValue: Float, borderRadiusBottomLeftYType: Byte, borderRadiusBottomLeftYValue: Float) {
    prepareMut()
    values.put(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, borderRadiusBottomLeftXType)
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE, borderRadiusBottomLeftXValue)
    values.put(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, borderRadiusBottomLeftYType)
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE, borderRadiusBottomLeftYValue)
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeCornerShapeTopLeft(borderRadiusTopLeftExponent: Float) {
    prepareMut()
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, borderRadiusTopLeftExponent)
    invalidateBorderRenderer()
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeCornerShapeTopRight(borderRadiusTopRightExponent: Float) {
    prepareMut()
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, borderRadiusTopRightExponent)
    invalidateBorderRenderer()
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeCornerShapeBottomRight(borderRadiusBottomRightExponent: Float) {
    prepareMut()
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, borderRadiusBottomRightExponent)
    invalidateBorderRenderer()
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeCornerShapeBottomLeft(borderRadiusBottomLeftExponent: Float) {
    prepareMut()
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, borderRadiusBottomLeftExponent)
    invalidateBorderRenderer()
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeCornerShape(borderRadiusTopLeftExponent: Float, borderRadiusTopRightExponent: Float, borderRadiusBottomRightExponent: Float, borderRadiusBottomLeftExponent: Float) {
    prepareMut()
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, borderRadiusTopLeftExponent)
    values.putFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, borderRadiusTopRightExponent)
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, borderRadiusBottomRightExponent)
    values.putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, borderRadiusBottomLeftExponent)
    invalidateBorderRenderer()
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  private fun writeBoxSizing(boxSizing: Byte) {
    prepareMut()
    values.put(StyleKeys.BOX_SIZING, boxSizing)
    setOrAppendState(StateKeys.BOX_SIZING)
  }

  private fun writeClear(clear: Byte) {
    prepareMut()
    values.put(StyleKeys.CLEAR, clear)
    setOrAppendState(StateKeys.CLEAR)
  }

  private fun writeDecorationLine(decorationLine: Byte, decorationLineState: Byte) {
    prepareMut()
    values.put(StyleKeys.DECORATION_LINE, decorationLine)
    values.put(StyleKeys.DECORATION_LINE_STATE, decorationLineState)
    val state = StateKeys.DECORATION_LINE
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeDecorationStyle(decorationStyle: Byte, decorationStyleState: Byte) {
    prepareMut()
    values.put(StyleKeys.DECORATION_STYLE, decorationStyle)
    values.put(StyleKeys.DECORATION_STYLE_STATE, decorationStyleState)
    val state = StateKeys.DECORATION_STYLE
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeDecorationColor(decorationColor: Int, decorationColorState: Byte) {
    prepareMut()
    values.putInt(StyleKeys.DECORATION_COLOR, decorationColor)
    values.put(StyleKeys.DECORATION_COLOR_STATE, decorationColorState)
    val state = StateKeys.DECORATION_COLOR
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeDecorationThickness(decorationThickness: Float, decorationThicknessState: Byte) {
    prepareMut()
    values.putFloat(StyleKeys.DECORATION_THICKNESS, decorationThickness)
    values.put(StyleKeys.DECORATION_THICKNESS_STATE, decorationThicknessState)
    val state = StateKeys.DECORATION_THICKNESS
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeDirection(direction: Byte) {
    prepareMut()
    values.put(StyleKeys.DIRECTION, direction)
    setOrAppendState(StateKeys.DIRECTION)
  }

  private fun writeDisplay(display: Byte, displayMode: Byte) {
    prepareMut()
    values.put(StyleKeys.DISPLAY, display)
    values.put(StyleKeys.DISPLAY_MODE, displayMode)
    setOrAppendState(arrayOf(StateKeys.DISPLAY, StateKeys.DISPLAY_MODE))
  }

  private fun writeFlexBasisType(flexBasisType: Byte, flexBasisValue: Float) {
    prepareMut()
    values.put(StyleKeys.FLEX_BASIS_TYPE, flexBasisType)
    values.putFloat(StyleKeys.FLEX_BASIS_VALUE, flexBasisValue)
    setOrAppendState(StateKeys.FLEX_BASIS)
  }

  private fun writeFlexDirection(flexDirection: Byte) {
    prepareMut()
    values.put(StyleKeys.FLEX_DIRECTION, flexDirection)
    setOrAppendState(StateKeys.FLEX_DIRECTION)
  }

  private fun writeFlexGrow(flexGrow: Float) {
    prepareMut()
    values.putFloat(StyleKeys.FLEX_GROW, flexGrow)
    setOrAppendState(StateKeys.FLEX_GROW)
  }

  private fun writeFlexShrink(flexShrink: Float) {
    prepareMut()
    values.putFloat(StyleKeys.FLEX_SHRINK, flexShrink)
    setOrAppendState(StateKeys.FLEX_SHRINK)
  }

  private fun writeFlexWrap(flexWrap: Byte) {
    prepareMut()
    values.put(StyleKeys.FLEX_WRAP, flexWrap)
    setOrAppendState(StateKeys.FLEX_WRAP)
  }

  private fun writeTextDecoration(decorationLine: Byte, decorationStyle: Byte, decorationColor: Int, decorationThickness: Float, decorationLineState: Byte, decorationStyleState: Byte, decorationColorState: Byte, decorationThicknessState: Byte) {
    prepareMut()
    values.put(StyleKeys.DECORATION_LINE, decorationLine)
    values.put(StyleKeys.DECORATION_STYLE, decorationStyle)
    values.putInt(StyleKeys.DECORATION_COLOR, decorationColor)
    values.putFloat(StyleKeys.DECORATION_THICKNESS, decorationThickness)
    values.put(StyleKeys.DECORATION_LINE_STATE, decorationLineState)
    values.put(StyleKeys.DECORATION_STYLE_STATE, decorationStyleState)
    values.put(StyleKeys.DECORATION_COLOR_STATE, decorationColorState)
    values.put(StyleKeys.DECORATION_THICKNESS_STATE, decorationThicknessState)
    val state = StateKeys.DECORATION_LINE or StateKeys.DECORATION_STYLE or StateKeys.DECORATION_COLOR or StateKeys.DECORATION_THICKNESS
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeFloat(float: Byte) {
    prepareMut()
    values.put(StyleKeys.FLOAT, float)
    setOrAppendState(StateKeys.FLOAT)
  }

  private fun writeFontColor(fontColor: Int, fontColorState: Byte) {
    prepareMut()
    values.putInt(StyleKeys.FONT_COLOR, fontColor)
    values.put(StyleKeys.FONT_COLOR_STATE, fontColorState)
    val state = StateKeys.FONT_COLOR
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeFontSize(fontSize: Float, fontSizeState: Byte, fontSizeType: Byte) {
    prepareMut()
    values.putFloat(StyleKeys.FONT_SIZE, fontSize)
    values.put(StyleKeys.FONT_SIZE_STATE, fontSizeState)
    values.put(StyleKeys.FONT_SIZE_TYPE, fontSizeType)
    val state = StateKeys.FONT_SIZE
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeFontStretch(fontStretch: Int, fontStretchState: Byte) {
    prepareMut()
    values.putInt(StyleKeys.FONT_STRETCH, fontStretch)
    values.put(StyleKeys.FONT_STRETCH_STATE, fontStretchState)
    val state = StateKeys.FONT_STRETCH
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeFontStyle(fontStyleType: Byte, fontStyleState: Byte, fontStyleSlant: Int) {
    prepareMut()
    values.put(StyleKeys.FONT_STYLE_TYPE, fontStyleType)
    values.put(StyleKeys.FONT_STYLE_STATE, fontStyleState)
    values.putInt(StyleKeys.FONT_STYLE_SLANT, fontStyleSlant)
    val state = StateKeys.FONT_STYLE
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeFontVariantNumeric(fontVariantNumeric: Byte, fontVariantNumericState: Byte) {
    prepareMut()
    values.put(StyleKeys.FONT_VARIANT_NUMERIC, fontVariantNumeric)
    values.put(StyleKeys.FONT_VARIANT_NUMERIC_STATE, fontVariantNumericState)
    val state = StateKeys.FONT_VARIANT_NUMERIC
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeFontWeight(fontWeight: Int, fontWeightState: Byte) {
    prepareMut()
    values.putInt(StyleKeys.FONT_WEIGHT, fontWeight)
    values.put(StyleKeys.FONT_WEIGHT_STATE, fontWeightState)
    val state = StateKeys.FONT_WEIGHT
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeColumnGap(gapColumnType: Byte, gapColumnValue: Float) {
    prepareMut()
    values.put(StyleKeys.GAP_COLUMN_TYPE, gapColumnType)
    values.putFloat(StyleKeys.GAP_COLUMN_VALUE, gapColumnValue)
    setOrAppendState(StateKeys.GAP)
  }

  private fun writeGap(gapRowType: Byte, gapRowValue: Float, gapColumnType: Byte, gapColumnValue: Float) {
    prepareMut()
    values.put(StyleKeys.GAP_ROW_TYPE, gapRowType)
    values.putFloat(StyleKeys.GAP_ROW_VALUE, gapRowValue)
    values.put(StyleKeys.GAP_COLUMN_TYPE, gapColumnType)
    values.putFloat(StyleKeys.GAP_COLUMN_VALUE, gapColumnValue)
    setOrAppendState(StateKeys.GAP)
  }

  private fun writeRowGap(gapRowType: Byte, gapRowValue: Float) {
    prepareMut()
    values.put(StyleKeys.GAP_ROW_TYPE, gapRowType)
    values.putFloat(StyleKeys.GAP_ROW_VALUE, gapRowValue)
    setOrAppendState(StateKeys.GAP)
  }

  private fun writeGridAutoFlow(gridAutoFlow: Byte) {
    prepareMut()
    values.put(StyleKeys.GRID_AUTO_FLOW, gridAutoFlow)
    setOrAppendState(StateKeys.GRID_AUTO_FLOW)
  }

  private fun writeHeight(heightType: Byte, heightValue: Float) {
    prepareMut()
    values.put(StyleKeys.HEIGHT_TYPE, heightType)
    values.putFloat(StyleKeys.HEIGHT_VALUE, heightValue)
    setOrAppendState(StateKeys.SIZE)
  }

  private fun writeHyphens(hyphens: Byte, hyphensState: Byte) {
    prepareMut()
    values.put(StyleKeys.HYPHENS, hyphens)
    values.put(StyleKeys.HYPHENS_STATE, hyphensState)
    val state = StateKeys.HYPHENS
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeInsetBottomType(insetBottomType: Byte, insetBottomValue: Float) {
    prepareMut()
    values.put(StyleKeys.INSET_BOTTOM_TYPE, insetBottomType)
    values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, insetBottomValue)
    setOrAppendState(StateKeys.INSET)
  }

  private fun writeInsetLeftType(insetLeftType: Byte, insetLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.INSET_LEFT_TYPE, insetLeftType)
    values.putFloat(StyleKeys.INSET_LEFT_VALUE, insetLeftValue)
    setOrAppendState(StateKeys.INSET)
  }

  private fun writeInsetRightType(insetRightType: Byte, insetRightValue: Float) {
    prepareMut()
    values.put(StyleKeys.INSET_RIGHT_TYPE, insetRightType)
    values.putFloat(StyleKeys.INSET_RIGHT_VALUE, insetRightValue)
    setOrAppendState(StateKeys.INSET)
  }

  private fun writeInsetTopType(insetTopType: Byte, insetTopValue: Float) {
    prepareMut()
    values.put(StyleKeys.INSET_TOP_TYPE, insetTopType)
    values.putFloat(StyleKeys.INSET_TOP_VALUE, insetTopValue)
    setOrAppendState(StateKeys.INSET)
  }

  private fun writeJustifyContent(justifyContent: Byte) {
    prepareMut()
    values.put(StyleKeys.JUSTIFY_CONTENT, justifyContent)
    setOrAppendState(StateKeys.JUSTIFY_CONTENT)
  }

  private fun writeJustifyItems(justifyItems: Byte) {
    prepareMut()
    values.put(StyleKeys.JUSTIFY_ITEMS, justifyItems)
    setOrAppendState(StateKeys.JUSTIFY_ITEMS)
  }

  private fun writeJustifySelf(justifySelf: Byte) {
    prepareMut()
    values.put(StyleKeys.JUSTIFY_SELF, justifySelf)
    setOrAppendState(StateKeys.JUSTIFY_SELF)
  }

  private fun writeLetterSpacing(letterSpacing: Float, letterSpacingState: Byte) {
    prepareMut()
    values.putFloat(StyleKeys.LETTER_SPACING, letterSpacing)
    values.put(StyleKeys.LETTER_SPACING_STATE, letterSpacingState)
    val state = StateKeys.LETTER_SPACING
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeLineClamp(lineClamp: Int, lineClampState: Byte) {
    prepareMut()
    values.putInt(StyleKeys.LINE_CLAMP, lineClamp)
    values.put(StyleKeys.LINE_CLAMP_STATE, lineClampState)
    setOrAppendState(StateKeys.LINE_CLAMP)
  }

  private fun writeLineHeight(lineHeight: Float, lineHeightState: Byte, lineHeightType: Byte) {
    prepareMut()
    values.putFloat(StyleKeys.LINE_HEIGHT, lineHeight)
    values.put(StyleKeys.LINE_HEIGHT_STATE, lineHeightState)
    values.put(StyleKeys.LINE_HEIGHT_TYPE, lineHeightType)
    val state = StateKeys.LINE_HEIGHT
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeLineHeightState(lineHeightState: Byte) {
    prepareMut()
    values.put(StyleKeys.LINE_HEIGHT_STATE, lineHeightState)
    val state = StateKeys.LINE_HEIGHT
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeListStylePosition(listStylePosition: Byte, listStylePositionState: Byte) {
    prepareMut()
    values.put(StyleKeys.LIST_STYLE_POSITION, listStylePosition)
    values.put(StyleKeys.LIST_STYLE_POSITION_STATE, listStylePositionState)
    setOrAppendState(StateKeys.LIST_STYLE_POSITION)
  }

  private fun writeListStyleType(listStyleType: Byte, listStyleTypeState: Byte) {
    prepareMut()
    values.put(StyleKeys.LIST_STYLE_TYPE, listStyleType)
    values.put(StyleKeys.LIST_STYLE_TYPE_STATE, listStyleTypeState)
    setOrAppendState(StateKeys.LIST_STYLE_TYPE)
  }

  private fun writeMarginBottomType(marginBottomType: Byte, marginBottomValue: Float) {
    prepareMut()
    values.put(StyleKeys.MARGIN_BOTTOM_TYPE, marginBottomType)
    values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, marginBottomValue)
    setOrAppendState(StateKeys.MARGIN)
  }

  private fun writeMarginLeftType(marginLeftType: Byte, marginLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.MARGIN_LEFT_TYPE, marginLeftType)
    values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, marginLeftValue)
    setOrAppendState(StateKeys.MARGIN)
  }

  private fun writeMarginRightType(marginRightType: Byte, marginRightValue: Float) {
    prepareMut()
    values.put(StyleKeys.MARGIN_RIGHT_TYPE, marginRightType)
    values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, marginRightValue)
    setOrAppendState(StateKeys.MARGIN)
  }

  private fun writeMarginTopType(marginTopType: Byte, marginTopValue: Float) {
    prepareMut()
    values.put(StyleKeys.MARGIN_TOP_TYPE, marginTopType)
    values.putFloat(StyleKeys.MARGIN_TOP_VALUE, marginTopValue)
    setOrAppendState(StateKeys.MARGIN)
  }

  private fun writeMaxHeight(maxHeightType: Byte, maxHeightValue: Float) {
    prepareMut()
    values.put(StyleKeys.MAX_HEIGHT_TYPE, maxHeightType)
    values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, maxHeightValue)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  private fun writeMaxSize(maxWidthType: Byte, maxWidthValue: Float, maxHeightType: Byte, maxHeightValue: Float) {
    prepareMut()
    values.put(StyleKeys.MAX_WIDTH_TYPE, maxWidthType)
    values.putFloat(StyleKeys.MAX_WIDTH_VALUE, maxWidthValue)
    values.put(StyleKeys.MAX_HEIGHT_TYPE, maxHeightType)
    values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, maxHeightValue)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  private fun writeMaxWidth(maxWidthType: Byte, maxWidthValue: Float) {
    prepareMut()
    values.put(StyleKeys.MAX_WIDTH_TYPE, maxWidthType)
    values.putFloat(StyleKeys.MAX_WIDTH_VALUE, maxWidthValue)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  private fun writeMinHeight(minHeightType: Byte, minHeightValue: Float) {
    prepareMut()
    values.put(StyleKeys.MIN_HEIGHT_TYPE, minHeightType)
    values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, minHeightValue)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  private fun writeMinSize(minWidthType: Byte, minWidthValue: Float, minHeightType: Byte, minHeightValue: Float) {
    prepareMut()
    values.put(StyleKeys.MIN_WIDTH_TYPE, minWidthType)
    values.putFloat(StyleKeys.MIN_WIDTH_VALUE, minWidthValue)
    values.put(StyleKeys.MIN_HEIGHT_TYPE, minHeightType)
    values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, minHeightValue)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  private fun writeMinWidth(minWidthType: Byte, minWidthValue: Float) {
    prepareMut()
    values.put(StyleKeys.MIN_WIDTH_TYPE, minWidthType)
    values.putFloat(StyleKeys.MIN_WIDTH_VALUE, minWidthValue)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  private fun writeObjectFit(objectFit: Byte) {
    prepareMut()
    values.put(StyleKeys.OBJECT_FIT, objectFit)
    setOrAppendState(StateKeys.OBJECT_FIT)
  }

  private fun writeOverflowX(overflowX: Byte) {
    prepareMut()
    values.put(StyleKeys.OVERFLOW_X, overflowX)
    setOrAppendState(StateKeys.OVERFLOW_X)
  }

  private fun writeOverflow(overflowX: Byte, overflowY: Byte) {
    prepareMut()
    values.put(StyleKeys.OVERFLOW_X, overflowX)
    values.put(StyleKeys.OVERFLOW_Y, overflowY)
    setOrAppendState(arrayOf(StateKeys.OVERFLOW_X, StateKeys.OVERFLOW_Y))
  }

  private fun writeOverflowY(overflowY: Byte) {
    prepareMut()
    values.put(StyleKeys.OVERFLOW_Y, overflowY)
    setOrAppendState(StateKeys.OVERFLOW_Y)
  }

  private fun writePaddingBottomType(paddingBottomType: Byte, paddingBottomValue: Float) {
    prepareMut()
    values.put(StyleKeys.PADDING_BOTTOM_TYPE, paddingBottomType)
    values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, paddingBottomValue)
    setOrAppendState(StateKeys.PADDING)
  }

  private fun writePaddingLeftType(paddingLeftType: Byte, paddingLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.PADDING_LEFT_TYPE, paddingLeftType)
    values.putFloat(StyleKeys.PADDING_LEFT_VALUE, paddingLeftValue)
    setOrAppendState(StateKeys.PADDING)
  }

  private fun writePaddingRightType(paddingRightType: Byte, paddingRightValue: Float) {
    prepareMut()
    values.put(StyleKeys.PADDING_RIGHT_TYPE, paddingRightType)
    values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, paddingRightValue)
    setOrAppendState(StateKeys.PADDING)
  }

  private fun writePaddingTopType(paddingTopType: Byte, paddingTopValue: Float) {
    prepareMut()
    values.put(StyleKeys.PADDING_TOP_TYPE, paddingTopType)
    values.putFloat(StyleKeys.PADDING_TOP_VALUE, paddingTopValue)
    setOrAppendState(StateKeys.PADDING)
  }

  private fun writePosition(position: Byte) {
    prepareMut()
    values.put(StyleKeys.POSITION, position)
    setOrAppendState(StateKeys.POSITION)
  }

  private fun writeScrollbarWidth(scrollbarWidth: Float) {
    prepareMut()
    values.putFloat(StyleKeys.SCROLLBAR_WIDTH, scrollbarWidth)
    setOrAppendState(StateKeys.SCROLLBAR_WIDTH)
  }

  private fun writeSize(widthType: Byte, widthValue: Float, heightType: Byte, heightValue: Float) {
    prepareMut()
    values.put(StyleKeys.WIDTH_TYPE, widthType)
    values.putFloat(StyleKeys.WIDTH_VALUE, widthValue)
    values.put(StyleKeys.HEIGHT_TYPE, heightType)
    values.putFloat(StyleKeys.HEIGHT_VALUE, heightValue)
    setOrAppendState(StateKeys.SIZE)
  }

  private fun writeTextAlign(textAlign: Byte, textAlignState: Byte) {
    prepareMut()
    values.put(StyleKeys.TEXT_ALIGN, textAlign)
    values.put(StyleKeys.TEXT_ALIGN_STATE, textAlignState)
    setOrAppendState(StateKeys.TEXT_ALIGN)
  }

  private fun writeTextCombineUpright(textCombineUpright: Byte, textCombineUprightState: Byte) {
    prepareMut()
    values.put(StyleKeys.TEXT_COMBINE_UPRIGHT, textCombineUpright)
    values.put(StyleKeys.TEXT_COMBINE_UPRIGHT_STATE, textCombineUprightState)
    val state = StateKeys.TEXT_COMBINE_UPRIGHT
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeTextIndent(textIndent: Float, textIndentType: Byte, textIndentState: Byte) {
    prepareMut()
    values.putFloat(StyleKeys.TEXT_INDENT, textIndent)
    values.put(StyleKeys.TEXT_INDENT_TYPE, textIndentType)
    values.put(StyleKeys.TEXT_INDENT_STATE, textIndentState)
    val state = StateKeys.TEXT_INDENT
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeTextJustify(textJustify: Byte, textJustifyState: Byte) {
    prepareMut()
    values.put(StyleKeys.TEXT_JUSTIFY, textJustify)
    values.put(StyleKeys.TEXT_JUSTIFY_STATE, textJustifyState)
    val state = StateKeys.TEXT_JUSTIFY
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeTextOrientation(textOrientation: Byte, textOrientationState: Byte) {
    prepareMut()
    values.put(StyleKeys.TEXT_ORIENTATION, textOrientation)
    values.put(StyleKeys.TEXT_ORIENTATION_STATE, textOrientationState)
    val state = StateKeys.TEXT_ORIENTATION
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeTextSpacingTrim(textSpacingTrim: Byte, textSpacingTrimState: Byte) {
    prepareMut()
    values.put(StyleKeys.TEXT_SPACING_TRIM, textSpacingTrim)
    values.put(StyleKeys.TEXT_SPACING_TRIM_STATE, textSpacingTrimState)
    val state = StateKeys.TEXT_SPACING_TRIM
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeTextTransform(textTransform: Byte, textTransformState: Byte) {
    prepareMut()
    values.put(StyleKeys.TEXT_TRANSFORM, textTransform)
    values.put(StyleKeys.TEXT_TRANSFORM_STATE, textTransformState)
    val state = StateKeys.TEXT_TRANSFORM
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeTextWrap(textWrap: Byte, textWrapState: Byte) {
    prepareMut()
    values.put(StyleKeys.TEXT_WRAP, textWrap)
    values.put(StyleKeys.TEXT_WRAP_STATE, textWrapState)
    val state = StateKeys.TEXT_WRAP
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeTransformOrigin(transformOriginXType: Byte, transformOriginYType: Byte, transformOriginXValue: Float, transformOriginYValue: Float, transformOriginState: Byte) {
    prepareMut()
    values.put(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, transformOriginXType)
    values.put(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, transformOriginYType)
    values.putFloat(StyleKeys.TRANSFORM_ORIGIN_X_VALUE, transformOriginXValue)
    values.putFloat(StyleKeys.TRANSFORM_ORIGIN_Y_VALUE, transformOriginYValue)
    values.put(StyleKeys.TRANSFORM_ORIGIN_STATE, transformOriginState)
    setOrAppendState(StateKeys.TRANSFORM_ORIGIN)
  }

  private fun writeUnicodeBidi(unicodeBidi: Byte, unicodeBidiState: Byte) {
    prepareMut()
    values.put(StyleKeys.UNICODE_BIDI, unicodeBidi)
    values.put(StyleKeys.UNICODE_BIDI_STATE, unicodeBidiState)
    val state = StateKeys.UNICODE_BIDI
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeVerticalAlign(verticalAlignOffsetOffset: Float, verticalAlignIsPercentOffset: Byte, verticalAlignEnumOffset: Byte) {
    prepareMut()
    values.putFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, verticalAlignOffsetOffset)
    values.put(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, verticalAlignIsPercentOffset)
    values.put(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, verticalAlignEnumOffset)
    val state = StateKeys.VERTICAL_ALIGN
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeWhiteSpace(whiteSpace: Byte, whiteSpaceState: Byte) {
    prepareMut()
    values.put(StyleKeys.WHITE_SPACE, whiteSpace)
    values.put(StyleKeys.WHITE_SPACE_STATE, whiteSpaceState)
    val state = StateKeys.WHITE_SPACE
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeWidth(widthType: Byte, widthValue: Float) {
    prepareMut()
    values.put(StyleKeys.WIDTH_TYPE, widthType)
    values.putFloat(StyleKeys.WIDTH_VALUE, widthValue)
    setOrAppendState(StateKeys.SIZE)
  }

  private fun writeWritingMode(writingMode: Byte, writingModeState: Byte) {
    prepareMut()
    values.put(StyleKeys.WRITING_MODE, writingMode)
    values.put(StyleKeys.WRITING_MODE_STATE, writingModeState)
    val state = StateKeys.WRITING_MODE
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeWordSpacing(wordSpacing: Float, wordSpacingType: Byte, wordSpacingState: Byte) {
    prepareMut()
    values.putFloat(StyleKeys.WORD_SPACING, wordSpacing)
    values.put(StyleKeys.WORD_SPACING_TYPE, wordSpacingType)
    values.put(StyleKeys.WORD_SPACING_STATE, wordSpacingState)
    val state = StateKeys.WORD_SPACING
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeZIndex(zIndex: Int) {
    prepareMut()
    values.putInt(StyleKeys.Z_INDEX, zIndex)
    setOrAppendState(StateKeys.Z_INDEX)
  }

  private fun writeBackgroundColorNative(backgroundColor: Int, backgroundColorState: Byte) {
    prepareMut()
    values.putInt(StyleKeys.BACKGROUND_COLOR, backgroundColor)
    values.put(StyleKeys.BACKGROUND_COLOR_STATE, backgroundColorState)
    val state = StateKeys.BACKGROUND_COLOR
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private fun writeInset(insetTopType: Byte, insetTopValue: Float, insetRightType: Byte, insetRightValue: Float, insetBottomType: Byte, insetBottomValue: Float, insetLeftType: Byte, insetLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.INSET_TOP_TYPE, insetTopType)
    values.putFloat(StyleKeys.INSET_TOP_VALUE, insetTopValue)
    values.put(StyleKeys.INSET_RIGHT_TYPE, insetRightType)
    values.putFloat(StyleKeys.INSET_RIGHT_VALUE, insetRightValue)
    values.put(StyleKeys.INSET_BOTTOM_TYPE, insetBottomType)
    values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, insetBottomValue)
    values.put(StyleKeys.INSET_LEFT_TYPE, insetLeftType)
    values.putFloat(StyleKeys.INSET_LEFT_VALUE, insetLeftValue)
    setOrAppendState(StateKeys.INSET)
  }

  private fun writeMargin(marginTopType: Byte, marginTopValue: Float, marginRightType: Byte, marginRightValue: Float, marginBottomType: Byte, marginBottomValue: Float, marginLeftType: Byte, marginLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.MARGIN_TOP_TYPE, marginTopType)
    values.putFloat(StyleKeys.MARGIN_TOP_VALUE, marginTopValue)
    values.put(StyleKeys.MARGIN_RIGHT_TYPE, marginRightType)
    values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, marginRightValue)
    values.put(StyleKeys.MARGIN_BOTTOM_TYPE, marginBottomType)
    values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, marginBottomValue)
    values.put(StyleKeys.MARGIN_LEFT_TYPE, marginLeftType)
    values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, marginLeftValue)
    setOrAppendState(StateKeys.MARGIN)
  }

  private fun writePadding(paddingTopType: Byte, paddingTopValue: Float, paddingRightType: Byte, paddingRightValue: Float, paddingBottomType: Byte, paddingBottomValue: Float, paddingLeftType: Byte, paddingLeftValue: Float) {
    prepareMut()
    values.put(StyleKeys.PADDING_TOP_TYPE, paddingTopType)
    values.putFloat(StyleKeys.PADDING_TOP_VALUE, paddingTopValue)
    values.put(StyleKeys.PADDING_RIGHT_TYPE, paddingRightType)
    values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, paddingRightValue)
    values.put(StyleKeys.PADDING_BOTTOM_TYPE, paddingBottomType)
    values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, paddingBottomValue)
    values.put(StyleKeys.PADDING_LEFT_TYPE, paddingLeftType)
    values.putFloat(StyleKeys.PADDING_LEFT_VALUE, paddingLeftValue)
    setOrAppendState(StateKeys.PADDING)
  }
  // </style-keys:writes>

  // <style-keys:accessors> generated from tools/scripts/style-keys/style-keys.schema
  private fun readDisplayFrom(buffer: ByteBuffer): Display {
    val base = buffer.get(StyleKeys.DISPLAY).toInt()
    val mode = buffer.get(StyleKeys.DISPLAY_MODE).toInt()
    return when {
      mode == 0 -> Display.from(base.toByte())
      mode == 1 -> Display.Inline
      mode == 2 && base == 3 -> Display.InlineBlock
      mode == 2 && base == 1 -> Display.InlineFlex
      mode == 2 && base == 2 -> Display.InlineGrid
      mode == 3 -> Display.ListItem
      else -> error("Invalid display encoding")
    }
  }

  var display: Display
    get() {
      if (visibilityCode == 2.toByte()) return Display.None
      return resolvePseudo(StateKeys.DISPLAY, readDisplayFrom(values), ::readDisplayFrom)
    }
    set(value) {
      when (value) {
        Display.None -> writeDisplay(0, 0)
        Display.Flex -> writeDisplay(1, 0)
        Display.Grid -> writeDisplay(2, 0)
        Display.Block -> writeDisplay(3, 0)
        Display.Inline -> writeDisplay(3, 1)
        Display.InlineBlock -> writeDisplay(3, 2)
        Display.InlineFlex -> writeDisplay(1, 2)
        Display.InlineGrid -> writeDisplay(2, 2)
        Display.ListItem -> writeDisplay(3, 3)
      }
      updateDisplayVisibility(value)
    }

  var textOverflow: Styles.TextOverflow
    get() = decodeTextOverflow(values.get(StyleKeys.TEXT_OVERFLOW))
    set(value) {
      applyTextOverflow(value)
    }

  /** CSS transform origin as two axes. */
  var transformOrigin: String
    get() {
      if (values.get(StyleKeys.TRANSFORM_ORIGIN_STATE) == StyleState.INHERIT) return "50% 50%"
      val scale = node.mason.scale
      fun side(typeKey: Int, valueKey: Int): String {
        val value = values.getFloat(valueKey)
        return if (values.get(typeKey).toInt() == 1) "${cssNumber(value)}%" else "${cssNumber(value / scale)}px"
      }
      return "${side(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, StyleKeys.TRANSFORM_ORIGIN_X_VALUE)} ${side(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, StyleKeys.TRANSFORM_ORIGIN_Y_VALUE)}"
    }
    set(value) {
      val mason = node.mason
      val fields = Mason.nativeParseCss(value, CssParseKind.TRANSFORM_ORIGIN, mason.scale, fontSize.toFloat(),
        mason.rootFontSize, mason.viewportWidth, mason.viewportHeight, 0) ?: return
      if (fields.size != CssPositionResultRecord.STRIDE) return
      setResolvedTransformOrigin(fields[CssPositionResultRecord.X_VALUE].toFloat(),
        fields[CssPositionResultRecord.X_TYPE] == 1.0, fields[CssPositionResultRecord.Y_VALUE].toFloat(),
        fields[CssPositionResultRecord.Y_TYPE] == 1.0)
    }

  internal fun setResolvedTransformOrigin(x: Float, xIsPercent: Boolean, y: Float, yIsPercent: Boolean) {
    writeTransformOrigin(if (xIsPercent) 1 else 0, if (yIsPercent) 1 else 0, x, y, StyleState.SET)
  }

  /** Applies the shorthand as one style write. */
  fun setTextDecoration(css: String) {
    val fields = Mason.expandCssShorthand("text-decoration", css) ?: return
    val thickness = fields.getOrNull(TextDecorationRecord.THICKNESS)?.let { resolveDecorationThickness(it) } ?: return
    setParsedTextDecoration(fields, thickness)
  }

  internal fun setParsedTextDecoration(fields: Array<String>, thickness: Float) {
    if (fields.size != TextDecorationRecord.STRIDE) return
    val line = fields[TextDecorationRecord.LINE].toByteOrNull() ?: return
    val style = fields[TextDecorationRecord.STYLE].toByteOrNull() ?: return
    val color = fields[TextDecorationRecord.COLOR].toUIntOrNull()?.toInt() ?: return
    writeTextDecoration(line, style, color, thickness, StyleState.SET, StyleState.SET, StyleState.SET, StyleState.SET)
  }

  var textDecorationLine: String
    get() = decorationLine.cssValue
    set(value) { Styles.DecorationLine.parse(value)?.let { decorationLine = it } }

  var textDecorationStyle: String
    get() = decorationStyle.cssValue
    set(value) { Styles.DecorationStyle.parse(value)?.let { decorationStyle = it } }

  var textDecorationColor: String
    get() {
      val color = decorationColor
      return if (color == Constants.UNSET_COLOR.toInt()) "currentcolor" else color.argbToCssHex()
    }
    set(value) {
      Mason.expandCssShorthand("text-decoration-color", value)
        ?.firstOrNull()?.toUIntOrNull()?.let { decorationColor = it.toInt() }
    }

  /** Text indent as a length or a percentage of the line width. */
  var textIndent: String
    get() {
      if (values.get(StyleKeys.TEXT_INDENT_STATE) == StyleState.INHERIT) return "0px"
      val amount = values.getFloat(StyleKeys.TEXT_INDENT)
      return if (values.get(StyleKeys.TEXT_INDENT_TYPE).toInt() == 1) "${cssNumber(amount)}%"
      else "${cssNumber(amount / node.mason.scale)}px"
    }
    set(value) {
      val fields = textIndentFields(value) ?: return
      setResolvedTextIndent(fields[CssLengthResultRecord.VALUE].toFloat(), fields[CssLengthResultRecord.KIND] == 2.0)
    }

  var verticalAlign: VerticalAlign
    get() = VerticalAlign.fromTypeValue(values.get(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET), values.get(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET).toInt() == 1, values.getFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET))
      ?: throw IllegalArgumentException("Invalid vertical-align value")
    set(value) {
      when (value) {
        VerticalAlign.Length -> writeVerticalAlign(value.value, 0, 0)
        VerticalAlign.Percent -> writeVerticalAlign(value.value, 1, 0)
        else -> writeVerticalAlign(0f, 0, value.type)
      }
    }

  var fontVariantNumeric: Int
    get() = values.get(StyleKeys.FONT_VARIANT_NUMERIC).toInt() and 0xFF
    set(value) {
      if (value != fontVariantNumeric || values.get(StyleKeys.FONT_VARIANT_NUMERIC_STATE) != StyleState.SET) {
        writeFontVariantNumeric(value.toByte(), StyleState.SET)
      }
    }

  private fun readFontStyle(buffer: ByteBuffer): FontStyle = decodeFontStyle(buffer.get(StyleKeys.FONT_STYLE_TYPE), buffer.getInt(StyleKeys.FONT_STYLE_SLANT))

  var fontStyle: FontStyle
    get() = readFontStyle(values)
    set(value) = applyFontStyle(value)

  var fontWeight: FontWeight
    get() = FontWeight.from(values.getInt(StyleKeys.FONT_WEIGHT))
    set(value) = applyFontWeight(value)

  var fontStretch: String
    get() {
      if (values.get(StyleKeys.FONT_STRETCH_STATE) == StyleState.INHERIT) return "normal"
      val pct = values.getInt(StyleKeys.FONT_STRETCH)
      return Mason.expandCssShorthand("font-stretch-name", pct.toString())?.firstOrNull() ?: "normal"
    }
    set(value) {
      val field = Mason.expandCssShorthand("font-stretch", value)?.firstOrNull()?.toIntOrNull() ?: return
      writeFontStretch(field, StyleState.SET)
    }

  internal val visibilityCode: Byte
    get() = values.get(StyleKeys.VISIBILITY)

  internal var hyphens: Byte
    get() = values.get(StyleKeys.HYPHENS)
    set(value) {
      writeHyphens(value, StyleState.SET)
    }

  internal var writingMode: Byte
    get() = values.get(StyleKeys.WRITING_MODE)
    set(value) {
      writeWritingMode(value, StyleState.SET)
    }

  internal var unicodeBidi: Byte
    get() = values.get(StyleKeys.UNICODE_BIDI)
    set(value) {
      writeUnicodeBidi(value, StyleState.SET)
    }

  internal var textOrientation: Byte
    get() = values.get(StyleKeys.TEXT_ORIENTATION)
    set(value) {
      writeTextOrientation(value, StyleState.SET)
    }

  internal var textCombineUpright: Byte
    get() = values.get(StyleKeys.TEXT_COMBINE_UPRIGHT)
    set(value) {
      writeTextCombineUpright(value, StyleState.SET)
    }

  internal var textSpacingTrim: Byte
    get() = values.get(StyleKeys.TEXT_SPACING_TRIM)
    set(value) {
      writeTextSpacingTrim(value, StyleState.SET)
    }

  var align: Align
    get() {
      val base = Align.from(values.get(StyleKeys.ALIGN))
      return resolvePseudo(StateKeys.ALIGN, base) { buf ->
        Align.from(buf.get(StyleKeys.ALIGN))
      }
    }
    set(value) {
      writeAlign(value.value)
    }

  var alignContent: AlignContent
    get() {
      val base = AlignContent.from(values.get(StyleKeys.ALIGN_CONTENT))
      return resolvePseudo(StateKeys.ALIGN_CONTENT, base) { buf ->
        AlignContent.from(buf.get(StyleKeys.ALIGN_CONTENT))
      }
    }
    set(value) {
      writeAlignContent(value.value)
    }

  var alignItems: AlignItems
    get() {
      val base = AlignItems.from(values.get(StyleKeys.ALIGN_ITEMS))
      return resolvePseudo(StateKeys.ALIGN_ITEMS, base) { buf ->
        AlignItems.from(buf.get(StyleKeys.ALIGN_ITEMS))
      }
    }
    set(value) {
      writeAlignItems(value.value)
    }

  var alignSelf: AlignSelf
    get() {
      val base = AlignSelf.from(values.get(StyleKeys.ALIGN_SELF))
      return resolvePseudo(StateKeys.ALIGN_SELF, base) { buf ->
        AlignSelf.from(buf.get(StyleKeys.ALIGN_SELF))
      }
    }
    set(value) {
      writeAlignSelf(value.value)
    }

  var aspectRatio: Float?
    get() {
      val base = values.getFloat(StyleKeys.ASPECT_RATIO).takeUnless { it.isNaN() }
      return resolvePseudo(StateKeys.ASPECT_RATIO, base) { buf ->
        buf.getFloat(StyleKeys.ASPECT_RATIO).takeUnless { it.isNaN() }
      }
    }
    set(value) {
      writeAspectRatio(value ?: Float.NaN)
    }

  var backgroundColor: Int
    get() = values.getInt(StyleKeys.BACKGROUND_COLOR)
    set(value) {
      writeBackgroundColorNative(value, StyleState.SET)
    }

  var borderBottomStyle: BorderStyle
    get() {
      val base = BorderStyle.from(values.get(StyleKeys.BORDER_BOTTOM_STYLE))
      return resolvePseudo(StateKeys.BORDER_STYLE, base) { buf ->
        BorderStyle.from(buf.get(StyleKeys.BORDER_BOTTOM_STYLE))
      }
    }
    set(value) {
      if (value == borderBottomStyle) return
      writeBorderBottomStyle(value.value)
    }

  var borderLeftStyle: BorderStyle
    get() {
      val base = BorderStyle.from(values.get(StyleKeys.BORDER_LEFT_STYLE))
      return resolvePseudo(StateKeys.BORDER_STYLE, base) { buf ->
        BorderStyle.from(buf.get(StyleKeys.BORDER_LEFT_STYLE))
      }
    }
    set(value) {
      if (value == borderLeftStyle) return
      writeBorderLeftStyle(value.value)
    }

  var borderRightStyle: BorderStyle
    get() {
      val base = BorderStyle.from(values.get(StyleKeys.BORDER_RIGHT_STYLE))
      return resolvePseudo(StateKeys.BORDER_STYLE, base) { buf ->
        BorderStyle.from(buf.get(StyleKeys.BORDER_RIGHT_STYLE))
      }
    }
    set(value) {
      if (value == borderRightStyle) return
      writeBorderRightStyle(value.value)
    }

  var borderTopStyle: BorderStyle
    get() {
      val base = BorderStyle.from(values.get(StyleKeys.BORDER_TOP_STYLE))
      return resolvePseudo(StateKeys.BORDER_STYLE, base) { buf ->
        BorderStyle.from(buf.get(StyleKeys.BORDER_TOP_STYLE))
      }
    }
    set(value) {
      if (value == borderTopStyle) return
      writeBorderTopStyle(value.value)
    }

  var borderStyle: Rect<BorderStyle>
    get() {
      val base = Rect(
        BorderStyle.from(values.get(StyleKeys.BORDER_TOP_STYLE)),
        BorderStyle.from(values.get(StyleKeys.BORDER_RIGHT_STYLE)),
        BorderStyle.from(values.get(StyleKeys.BORDER_BOTTOM_STYLE)),
        BorderStyle.from(values.get(StyleKeys.BORDER_LEFT_STYLE))
      )
      return resolvePseudo(StateKeys.BORDER_STYLE, base) { buf ->
        Rect(
          BorderStyle.from(buf.get(StyleKeys.BORDER_TOP_STYLE)),
          BorderStyle.from(buf.get(StyleKeys.BORDER_RIGHT_STYLE)),
          BorderStyle.from(buf.get(StyleKeys.BORDER_BOTTOM_STYLE)),
          BorderStyle.from(buf.get(StyleKeys.BORDER_LEFT_STYLE))
        )
      }
    }
    set(value) {
      writeBorderStyles(
        value.top.value,
        value.right.value,
        value.bottom.value,
        value.left.value
      )
    }

  var borderColor: Rect<Int>
    get() {
      val base = Rect(
        values.getInt(StyleKeys.BORDER_TOP_COLOR),
        values.getInt(StyleKeys.BORDER_RIGHT_COLOR),
        values.getInt(StyleKeys.BORDER_BOTTOM_COLOR),
        values.getInt(StyleKeys.BORDER_LEFT_COLOR)
      )
      return resolvePseudo(StateKeys.BORDER_COLOR, base) { buf ->
        Rect(
          buf.getInt(StyleKeys.BORDER_TOP_COLOR),
          buf.getInt(StyleKeys.BORDER_RIGHT_COLOR),
          buf.getInt(StyleKeys.BORDER_BOTTOM_COLOR),
          buf.getInt(StyleKeys.BORDER_LEFT_COLOR)
        )
      }
    }
    set(value) {
      writeBorderColors(
        value.top,
        value.right,
        value.bottom,
        value.left
      )
    }

  var borderBottomWidth: LengthPercentage
    get() {
      val base = LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_BOTTOM_TYPE), values.getFloat(StyleKeys.BORDER_BOTTOM_VALUE))!!
      return resolvePseudo(StateKeys.BORDER, base) { buf ->
        LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_BOTTOM_TYPE), buf.getFloat(StyleKeys.BORDER_BOTTOM_VALUE))!!
      }
    }
    set(value) {
      if (values.get(StyleKeys.BORDER_BOTTOM_TYPE) == value.type && values.getFloat(StyleKeys.BORDER_BOTTOM_VALUE) == value.value) return
      writeBorderBottomWidth(value.type, value.value)
    }

  var borderLeftWidth: LengthPercentage
    get() {
      val base = LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_LEFT_TYPE), values.getFloat(StyleKeys.BORDER_LEFT_VALUE))!!
      return resolvePseudo(StateKeys.BORDER, base) { buf ->
        LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_LEFT_TYPE), buf.getFloat(StyleKeys.BORDER_LEFT_VALUE))!!
      }
    }
    set(value) {
      if (values.get(StyleKeys.BORDER_LEFT_TYPE) == value.type && values.getFloat(StyleKeys.BORDER_LEFT_VALUE) == value.value) return
      writeBorderLeftWidth(value.type, value.value)
    }

  var borderRightWidth: LengthPercentage
    get() {
      val base = LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RIGHT_TYPE), values.getFloat(StyleKeys.BORDER_RIGHT_VALUE))!!
      return resolvePseudo(StateKeys.BORDER, base) { buf ->
        LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_RIGHT_TYPE), buf.getFloat(StyleKeys.BORDER_RIGHT_VALUE))!!
      }
    }
    set(value) {
      if (values.get(StyleKeys.BORDER_RIGHT_TYPE) == value.type && values.getFloat(StyleKeys.BORDER_RIGHT_VALUE) == value.value) return
      writeBorderRightWidth(value.type, value.value)
    }

  var borderTopWidth: LengthPercentage
    get() {
      val base = LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_TOP_TYPE), values.getFloat(StyleKeys.BORDER_TOP_VALUE))!!
      return resolvePseudo(StateKeys.BORDER, base) { buf ->
        LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_TOP_TYPE), buf.getFloat(StyleKeys.BORDER_TOP_VALUE))!!
      }
    }
    set(value) {
      if (values.get(StyleKeys.BORDER_TOP_TYPE) == value.type && values.getFloat(StyleKeys.BORDER_TOP_VALUE) == value.value) return
      writeBorderTopWidth(value.type, value.value)
    }

  var borderWidth: Rect<LengthPercentage>
    get() {
      val base = Rect(
        LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_TOP_TYPE), values.getFloat(StyleKeys.BORDER_TOP_VALUE))!!,
        LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RIGHT_TYPE), values.getFloat(StyleKeys.BORDER_RIGHT_VALUE))!!,
        LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_BOTTOM_TYPE), values.getFloat(StyleKeys.BORDER_BOTTOM_VALUE))!!,
        LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_LEFT_TYPE), values.getFloat(StyleKeys.BORDER_LEFT_VALUE))!!
      )
      return resolvePseudo(StateKeys.BORDER, base) { buf ->
        Rect(
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_TOP_TYPE), buf.getFloat(StyleKeys.BORDER_TOP_VALUE))!!,
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_RIGHT_TYPE), buf.getFloat(StyleKeys.BORDER_RIGHT_VALUE))!!,
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_BOTTOM_TYPE), buf.getFloat(StyleKeys.BORDER_BOTTOM_VALUE))!!,
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.BORDER_LEFT_TYPE), buf.getFloat(StyleKeys.BORDER_LEFT_VALUE))!!
        )
      }
    }
    set(value) {
      writeBorderWidth(
        value.top.type,
        value.top.value,
        value.right.type,
        value.right.value,
        value.bottom.type,
        value.bottom.value,
        value.left.type,
        value.left.value
      )
    }

  var borderTopLeftRadius: Point<LengthPercentage>
    get() = Point(
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE))!!,
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE))!!
    )
    set(value) {
      writeBorderTopLeftRadius(
        value.x.type,
        value.x.value,
        value.y.type,
        value.y.value
      )
    }

  var borderTopRightRadius: Point<LengthPercentage>
    get() = Point(
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE))!!,
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE))!!
    )
    set(value) {
      writeBorderTopRightRadius(
        value.x.type,
        value.x.value,
        value.y.type,
        value.y.value
      )
    }

  var borderBottomRightRadius: Point<LengthPercentage>
    get() = Point(
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE))!!,
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE))!!
    )
    set(value) {
      writeBorderBottomRightRadius(
        value.x.type,
        value.x.value,
        value.y.type,
        value.y.value
      )
    }

  var borderBottomLeftRadius: Point<LengthPercentage>
    get() = Point(
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE))!!,
      LengthPercentage.fromTypeValue(values.get(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE), values.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE))!!
    )
    set(value) {
      writeBorderBottomLeftRadius(
        value.x.type,
        value.x.value,
        value.y.type,
        value.y.value
      )
    }

  var cornerShapeTopLeft: String
    get() {
      val base = values.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT)
      val exponent = resolvePseudo(StateKeys.BORDER_RADIUS, base) { it.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT) }
      return exponentToCornerShapeToken(exponent)
    }
    set(value) {
      parseCornerShapeToken(value)?.let { writeCornerShapeTopLeft(it) }
    }

  var cornerShapeTopRight: String
    get() {
      val base = values.getFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT)
      val exponent = resolvePseudo(StateKeys.BORDER_RADIUS, base) { it.getFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT) }
      return exponentToCornerShapeToken(exponent)
    }
    set(value) {
      parseCornerShapeToken(value)?.let { writeCornerShapeTopRight(it) }
    }

  var cornerShapeBottomRight: String
    get() {
      val base = values.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT)
      val exponent = resolvePseudo(StateKeys.BORDER_RADIUS, base) { it.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT) }
      return exponentToCornerShapeToken(exponent)
    }
    set(value) {
      parseCornerShapeToken(value)?.let { writeCornerShapeBottomRight(it) }
    }

  var cornerShapeBottomLeft: String
    get() {
      val base = values.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT)
      val exponent = resolvePseudo(StateKeys.BORDER_RADIUS, base) { it.getFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT) }
      return exponentToCornerShapeToken(exponent)
    }
    set(value) {
      parseCornerShapeToken(value)?.let { writeCornerShapeBottomLeft(it) }
    }

  var cornerShape: String = ""
    set(value) {
      field = value
      applyCornerShape(value)
    }

  internal fun applyCornerShape(value: String) {
    val fields = Mason.expandCssShorthand("corner-shape", value) ?: return
    if (fields.size != 4) return
    val (topLeft, topRight, bottomRight, bottomLeft) = fields.map { it.toFloatOrNull() ?: return }
    writeCornerShape(topLeft, topRight, bottomRight, bottomLeft)
  }

  var color: Int
    get() = values.getInt(StyleKeys.FONT_COLOR)
    set(value) {
      writeFontColor(value, StyleState.SET)
    }

  var boxSizing: BoxSizing
    get() {
      val base = BoxSizing.from(values.get(StyleKeys.BOX_SIZING))
      return resolvePseudo(StateKeys.BOX_SIZING, base) { buf ->
        BoxSizing.from(buf.get(StyleKeys.BOX_SIZING))
      }
    }
    set(value) {
      writeBoxSizing(value.value)
    }

  var clear: Clear
    get() {
      val base = Clear.from(values.get(StyleKeys.CLEAR))
      return resolvePseudo(StateKeys.CLEAR, base) { buf ->
        Clear.from(buf.get(StyleKeys.CLEAR))
      }
    }
    set(value) {
      writeClear(value.value)
    }

  var decorationColor: Int
    get() = values.getInt(StyleKeys.DECORATION_COLOR)
    set(value) {
      writeDecorationColor(value, StyleState.SET)
    }

  var decorationLine: Styles.DecorationLine
    get() = Styles.DecorationLine.from(values.get(StyleKeys.DECORATION_LINE))
    set(value) {
      writeDecorationLine(value.value, StyleState.SET)
    }

  var decorationStyle: Styles.DecorationStyle
    get() = Styles.DecorationStyle.from(values.get(StyleKeys.DECORATION_STYLE))
    set(value) {
      writeDecorationStyle(value.value, StyleState.SET)
    }

  /** Device px. Zero uses the font's underline thickness. */
  var decorationThickness: Float
    get() = values.getFloat(StyleKeys.DECORATION_THICKNESS)
    set(value) {
      writeDecorationThickness(value, StyleState.SET)
    }

  var direction: Direction
    get() {
      val base = Direction.from(values.get(StyleKeys.DIRECTION))
      return resolvePseudo(StateKeys.DIRECTION, base) { buf ->
        Direction.from(buf.get(StyleKeys.DIRECTION))
      }
    }
    set(value) {
      writeDirection(value.value)
    }

  var flexBasis: Dimension
    get() {
      val base = Dimension.fromTypeValue(values.get(StyleKeys.FLEX_BASIS_TYPE), values.getFloat(StyleKeys.FLEX_BASIS_VALUE))!!
      return resolvePseudo(StateKeys.FLEX_BASIS, base) { buf ->
        Dimension.fromTypeValue(buf.get(StyleKeys.FLEX_BASIS_TYPE), buf.getFloat(StyleKeys.FLEX_BASIS_VALUE))!!
      }
    }
    set(value) {
      writeFlexBasisType(value.type, value.value)
    }

  var flexDirection: FlexDirection
    get() {
      val base = FlexDirection.from(values.get(StyleKeys.FLEX_DIRECTION))
      return resolvePseudo(StateKeys.FLEX_DIRECTION, base) { buf ->
        FlexDirection.from(buf.get(StyleKeys.FLEX_DIRECTION))
      }
    }
    set(value) {
      writeFlexDirection(value.value)
    }

  var flexGrow: Float
    get() {
      val base = values.getFloat(StyleKeys.FLEX_GROW)
      return resolvePseudo(StateKeys.FLEX_GROW, base) { buf ->
        buf.getFloat(StyleKeys.FLEX_GROW)
      }
    }
    set(value) {
      writeFlexGrow(value)
    }

  var flexShrink: Float
    get() {
      val base = values.getFloat(StyleKeys.FLEX_SHRINK)
      return resolvePseudo(StateKeys.FLEX_SHRINK, base) { buf ->
        buf.getFloat(StyleKeys.FLEX_SHRINK)
      }
    }
    set(value) {
      writeFlexShrink(value)
    }

  var flexWrap: FlexWrap
    get() {
      val base = FlexWrap.from(values.get(StyleKeys.FLEX_WRAP))
      return resolvePseudo(StateKeys.FLEX_WRAP, base) { buf ->
        FlexWrap.from(buf.get(StyleKeys.FLEX_WRAP))
      }
    }
    set(value) {
      writeFlexWrap(value.value)
    }

  var float: org.nativescript.mason.masonkit.enums.Float
    get() {
      val base = org.nativescript.mason.masonkit.enums.Float.from(values.get(StyleKeys.FLOAT))
      return resolvePseudo(StateKeys.FLOAT, base) { buf ->
        org.nativescript.mason.masonkit.enums.Float.from(buf.get(StyleKeys.FLOAT))
      }
    }
    set(value) {
      writeFloat(value.value)
      node.dirty()
    }

  var fontSize: Float
    get() = values.getFloat(StyleKeys.FONT_SIZE)
    set(value) {
      writeFontSize(value, StyleState.SET, 0)
    }

  var gap: Size<LengthPercentage>
    get() {
      val base = Size(
        LengthPercentage.fromTypeValue(values.get(StyleKeys.GAP_ROW_TYPE), values.getFloat(StyleKeys.GAP_ROW_VALUE))!!,
        LengthPercentage.fromTypeValue(values.get(StyleKeys.GAP_COLUMN_TYPE), values.getFloat(StyleKeys.GAP_COLUMN_VALUE))!!
      )
      return resolvePseudo(StateKeys.GAP, base) { buf ->
        Size(
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.GAP_ROW_TYPE), buf.getFloat(StyleKeys.GAP_ROW_VALUE))!!,
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.GAP_COLUMN_TYPE), buf.getFloat(StyleKeys.GAP_COLUMN_VALUE))!!
        )
      }
    }
    set(value) {
      writeGap(
        value.width.type,
        value.width.value,
        value.height.type,
        value.height.value
      )
    }

  var gridAutoFlow: GridAutoFlow
    get() {
      val base = GridAutoFlow.from(values.get(StyleKeys.GRID_AUTO_FLOW))
      return resolvePseudo(StateKeys.GRID_AUTO_FLOW, base) { buf ->
        GridAutoFlow.from(buf.get(StyleKeys.GRID_AUTO_FLOW))
      }
    }
    set(value) {
      writeGridAutoFlow(value.value)
    }

  var inset: Rect<LengthPercentageAuto>
    get() {
      val base = Rect(
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.INSET_TOP_TYPE), values.getFloat(StyleKeys.INSET_TOP_VALUE))!!,
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.INSET_RIGHT_TYPE), values.getFloat(StyleKeys.INSET_RIGHT_VALUE))!!,
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.INSET_BOTTOM_TYPE), values.getFloat(StyleKeys.INSET_BOTTOM_VALUE))!!,
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.INSET_LEFT_TYPE), values.getFloat(StyleKeys.INSET_LEFT_VALUE))!!
      )
      return resolvePseudo(StateKeys.INSET, base) { buf ->
        Rect(
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.INSET_TOP_TYPE), buf.getFloat(StyleKeys.INSET_TOP_VALUE))!!,
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.INSET_RIGHT_TYPE), buf.getFloat(StyleKeys.INSET_RIGHT_VALUE))!!,
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.INSET_BOTTOM_TYPE), buf.getFloat(StyleKeys.INSET_BOTTOM_VALUE))!!,
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.INSET_LEFT_TYPE), buf.getFloat(StyleKeys.INSET_LEFT_VALUE))!!
        )
      }
    }
    set(value) {
      writeInset(
        value.top.type,
        value.top.value,
        value.right.type,
        value.right.value,
        value.bottom.type,
        value.bottom.value,
        value.left.type,
        value.left.value
      )
    }

  var justifyContent: JustifyContent
    get() {
      val base = JustifyContent.from(values.get(StyleKeys.JUSTIFY_CONTENT))
      return resolvePseudo(StateKeys.JUSTIFY_CONTENT, base) { buf ->
        JustifyContent.from(buf.get(StyleKeys.JUSTIFY_CONTENT))
      }
    }
    set(value) {
      writeJustifyContent(value.value)
    }

  var justifyItems: JustifyItems
    get() {
      val base = JustifyItems.from(values.get(StyleKeys.JUSTIFY_ITEMS))
      return resolvePseudo(StateKeys.JUSTIFY_ITEMS, base) { buf ->
        JustifyItems.from(buf.get(StyleKeys.JUSTIFY_ITEMS))
      }
    }
    set(value) {
      writeJustifyItems(value.value)
    }

  var justifySelf: JustifySelf
    get() {
      val base = JustifySelf.from(values.get(StyleKeys.JUSTIFY_SELF))
      return resolvePseudo(StateKeys.JUSTIFY_SELF, base) { buf ->
        JustifySelf.from(buf.get(StyleKeys.JUSTIFY_SELF))
      }
    }
    set(value) {
      writeJustifySelf(value.value)
    }

  var letterSpacing: Float
    get() = values.getFloat(StyleKeys.LETTER_SPACING)
    set(value) {
      writeLetterSpacing(value, StyleState.SET)
    }

  var lineHeight: Float
    get() = values.getFloat(StyleKeys.LINE_HEIGHT)
    set(value) {
      writeLineHeight(value, StyleState.SET, 0)
    }

  var lineClamp: Int
    get() = if (values.get(StyleKeys.LINE_CLAMP_STATE) == StyleState.INHERIT) 0 else values.getInt(StyleKeys.LINE_CLAMP)
    set(value) {
      writeLineClamp(value.coerceAtLeast(0), StyleState.SET)
    }

  var listStylePosition: ListStylePosition
    get() = ListStylePosition.from(values.get(StyleKeys.LIST_STYLE_POSITION))
    set(value) {
      writeListStylePosition(value.value, StyleState.SET)
    }

  var listStyleType: ListStyleType
    get() = ListStyleType.from(values.get(StyleKeys.LIST_STYLE_TYPE))
    set(value) {
      writeListStyleType(value.value, StyleState.SET)
      // A summary can build its marker before the list style is applied.
      if (node.detailsRole == Details.SUMMARY) Details.refreshMarker(node)
    }

  var margin: Rect<LengthPercentageAuto>
    get() {
      val base = Rect(
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE))!!,
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE))!!,
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_BOTTOM_TYPE), values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE))!!,
        LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE))!!
      )
      return resolvePseudo(StateKeys.MARGIN, base) { buf ->
        Rect(
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.MARGIN_TOP_TYPE), buf.getFloat(StyleKeys.MARGIN_TOP_VALUE))!!,
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.MARGIN_RIGHT_TYPE), buf.getFloat(StyleKeys.MARGIN_RIGHT_VALUE))!!,
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.MARGIN_BOTTOM_TYPE), buf.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE))!!,
          LengthPercentageAuto.fromTypeValue(buf.get(StyleKeys.MARGIN_LEFT_TYPE), buf.getFloat(StyleKeys.MARGIN_LEFT_VALUE))!!
        )
      }
    }
    set(value) {
      writeMargin(
        value.top.type,
        value.top.value,
        value.right.type,
        value.right.value,
        value.bottom.type,
        value.bottom.value,
        value.left.type,
        value.left.value
      )
    }

  var marginBottom: LengthPercentageAuto
    get() = LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_BOTTOM_TYPE), values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE))!!
    set(value) {
      writeMarginBottomType(value.type, value.value)
    }

  var marginLeft: LengthPercentageAuto
    get() = LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE))!!
    set(value) {
      writeMarginLeftType(value.type, value.value)
    }

  var marginRight: LengthPercentageAuto
    get() = LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE))!!
    set(value) {
      writeMarginRightType(value.type, value.value)
    }

  var marginTop: LengthPercentageAuto
    get() = LengthPercentageAuto.fromTypeValue(values.get(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE))!!
    set(value) {
      writeMarginTopType(value.type, value.value)
    }

  var maxHeight: Dimension
    get() {
      val base = Dimension.fromTypeValue(values.get(StyleKeys.MAX_HEIGHT_TYPE), values.getFloat(StyleKeys.MAX_HEIGHT_VALUE))!!
      return resolvePseudo(StateKeys.MAX_SIZE, base) { buf ->
        Dimension.fromTypeValue(buf.get(StyleKeys.MAX_HEIGHT_TYPE), buf.getFloat(StyleKeys.MAX_HEIGHT_VALUE))!!
      }
    }
    set(value) {
      writeMaxHeight(value.type, value.value)
    }

  var maxSize: Size<Dimension>
    get() {
      val base = Size(
        Dimension.fromTypeValue(values.get(StyleKeys.MAX_WIDTH_TYPE), values.getFloat(StyleKeys.MAX_WIDTH_VALUE))!!,
        Dimension.fromTypeValue(values.get(StyleKeys.MAX_HEIGHT_TYPE), values.getFloat(StyleKeys.MAX_HEIGHT_VALUE))!!
      )
      return resolvePseudo(StateKeys.MAX_SIZE, base) { buf ->
        Size(
          Dimension.fromTypeValue(buf.get(StyleKeys.MAX_WIDTH_TYPE), buf.getFloat(StyleKeys.MAX_WIDTH_VALUE))!!,
          Dimension.fromTypeValue(buf.get(StyleKeys.MAX_HEIGHT_TYPE), buf.getFloat(StyleKeys.MAX_HEIGHT_VALUE))!!
        )
      }
    }
    set(value) {
      writeMaxSize(
        value.width.type,
        value.width.value,
        value.height.type,
        value.height.value
      )
    }

  var maxWidth: Dimension
    get() {
      val base = Dimension.fromTypeValue(values.get(StyleKeys.MAX_WIDTH_TYPE), values.getFloat(StyleKeys.MAX_WIDTH_VALUE))!!
      return resolvePseudo(StateKeys.MAX_SIZE, base) { buf ->
        Dimension.fromTypeValue(buf.get(StyleKeys.MAX_WIDTH_TYPE), buf.getFloat(StyleKeys.MAX_WIDTH_VALUE))!!
      }
    }
    set(value) {
      writeMaxWidth(value.type, value.value)
    }

  var minHeight: Dimension
    get() {
      val base = Dimension.fromTypeValue(values.get(StyleKeys.MIN_HEIGHT_TYPE), values.getFloat(StyleKeys.MIN_HEIGHT_VALUE))!!
      return resolvePseudo(StateKeys.MIN_SIZE, base) { buf ->
        Dimension.fromTypeValue(buf.get(StyleKeys.MIN_HEIGHT_TYPE), buf.getFloat(StyleKeys.MIN_HEIGHT_VALUE))!!
      }
    }
    set(value) {
      writeMinHeight(value.type, value.value)
    }

  var minSize: Size<Dimension>
    get() {
      val base = Size(
        Dimension.fromTypeValue(values.get(StyleKeys.MIN_WIDTH_TYPE), values.getFloat(StyleKeys.MIN_WIDTH_VALUE))!!,
        Dimension.fromTypeValue(values.get(StyleKeys.MIN_HEIGHT_TYPE), values.getFloat(StyleKeys.MIN_HEIGHT_VALUE))!!
      )
      return resolvePseudo(StateKeys.MIN_SIZE, base) { buf ->
        Size(
          Dimension.fromTypeValue(buf.get(StyleKeys.MIN_WIDTH_TYPE), buf.getFloat(StyleKeys.MIN_WIDTH_VALUE))!!,
          Dimension.fromTypeValue(buf.get(StyleKeys.MIN_HEIGHT_TYPE), buf.getFloat(StyleKeys.MIN_HEIGHT_VALUE))!!
        )
      }
    }
    set(value) {
      writeMinSize(
        value.width.type,
        value.width.value,
        value.height.type,
        value.height.value
      )
    }

  var minWidth: Dimension
    get() {
      val base = Dimension.fromTypeValue(values.get(StyleKeys.MIN_WIDTH_TYPE), values.getFloat(StyleKeys.MIN_WIDTH_VALUE))!!
      return resolvePseudo(StateKeys.MIN_SIZE, base) { buf ->
        Dimension.fromTypeValue(buf.get(StyleKeys.MIN_WIDTH_TYPE), buf.getFloat(StyleKeys.MIN_WIDTH_VALUE))!!
      }
    }
    set(value) {
      writeMinWidth(value.type, value.value)
    }

  var objectFit: ObjectFit
    get() {
      val base = ObjectFit.from(values.get(StyleKeys.OBJECT_FIT))
      return resolvePseudo(StateKeys.OBJECT_FIT, base) { buf ->
        ObjectFit.from(buf.get(StyleKeys.OBJECT_FIT))
      }
    }
    set(value) {
      writeObjectFit(value.value)
    }

  var overflowX: Overflow
    get() {
      val base = Overflow.from(values.get(StyleKeys.OVERFLOW_X))
      return resolvePseudo(StateKeys.OVERFLOW_X, base) { buf ->
        Overflow.from(buf.get(StyleKeys.OVERFLOW_X))
      }
    }
    set(value) {
      writeOverflowX(value.value)
    }

  var overflowY: Overflow
    get() {
      val base = Overflow.from(values.get(StyleKeys.OVERFLOW_Y))
      return resolvePseudo(StateKeys.OVERFLOW_Y, base) { buf ->
        Overflow.from(buf.get(StyleKeys.OVERFLOW_Y))
      }
    }
    set(value) {
      writeOverflowY(value.value)
    }

  var overflow: Point<Overflow>
    get() = Point(overflowX, overflowY)
    set(value) {
      writeOverflow(value.x.value, value.y.value)
    }

  var padding: Rect<LengthPercentage>
    get() {
      val base = Rect(
        LengthPercentage.fromTypeValue(values.get(StyleKeys.PADDING_TOP_TYPE), values.getFloat(StyleKeys.PADDING_TOP_VALUE))!!,
        LengthPercentage.fromTypeValue(values.get(StyleKeys.PADDING_RIGHT_TYPE), values.getFloat(StyleKeys.PADDING_RIGHT_VALUE))!!,
        LengthPercentage.fromTypeValue(values.get(StyleKeys.PADDING_BOTTOM_TYPE), values.getFloat(StyleKeys.PADDING_BOTTOM_VALUE))!!,
        LengthPercentage.fromTypeValue(values.get(StyleKeys.PADDING_LEFT_TYPE), values.getFloat(StyleKeys.PADDING_LEFT_VALUE))!!
      )
      return resolvePseudo(StateKeys.PADDING, base) { buf ->
        Rect(
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.PADDING_TOP_TYPE), buf.getFloat(StyleKeys.PADDING_TOP_VALUE))!!,
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.PADDING_RIGHT_TYPE), buf.getFloat(StyleKeys.PADDING_RIGHT_VALUE))!!,
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.PADDING_BOTTOM_TYPE), buf.getFloat(StyleKeys.PADDING_BOTTOM_VALUE))!!,
          LengthPercentage.fromTypeValue(buf.get(StyleKeys.PADDING_LEFT_TYPE), buf.getFloat(StyleKeys.PADDING_LEFT_VALUE))!!
        )
      }
    }
    set(value) {
      writePadding(
        value.top.type,
        value.top.value,
        value.right.type,
        value.right.value,
        value.bottom.type,
        value.bottom.value,
        value.left.type,
        value.left.value
      )
    }

  var position: Position
    get() {
      val base = Position.from(values.get(StyleKeys.POSITION))
      return resolvePseudo(StateKeys.POSITION, base) { buf ->
        Position.from(buf.get(StyleKeys.POSITION))
      }
    }
    set(value) {
      writePosition(value.value)
    }

  var scrollBarWidth: Float
    get() {
      val base = values.getFloat(StyleKeys.SCROLLBAR_WIDTH)
      return resolvePseudo(StateKeys.SCROLLBAR_WIDTH, base) { buf ->
        buf.getFloat(StyleKeys.SCROLLBAR_WIDTH)
      }
    }
    set(value) {
      writeScrollbarWidth(value)
    }

  var size: Size<Dimension>
    get() {
      val base = Size(
        Dimension.fromTypeValue(values.get(StyleKeys.WIDTH_TYPE), values.getFloat(StyleKeys.WIDTH_VALUE))!!,
        Dimension.fromTypeValue(values.get(StyleKeys.HEIGHT_TYPE), values.getFloat(StyleKeys.HEIGHT_VALUE))!!
      )
      return resolvePseudo(StateKeys.SIZE, base) { buf ->
        Size(
          Dimension.fromTypeValue(buf.get(StyleKeys.WIDTH_TYPE), buf.getFloat(StyleKeys.WIDTH_VALUE))!!,
          Dimension.fromTypeValue(buf.get(StyleKeys.HEIGHT_TYPE), buf.getFloat(StyleKeys.HEIGHT_VALUE))!!
        )
      }
    }
    set(value) {
      writeSize(
        value.width.type,
        value.width.value,
        value.height.type,
        value.height.value
      )
    }

  var textAlign: TextAlign
    get() = TextAlign.from(values.get(StyleKeys.TEXT_ALIGN))
    set(value) {
      writeTextAlign(value.value, StyleState.SET)
    }

  var textJustify: TextJustify
    get() = TextJustify.from(values.get(StyleKeys.TEXT_JUSTIFY))
    set(value) {
      writeTextJustify(value.value, StyleState.SET)
    }

  var textTransform: Styles.TextTransform
    get() = Styles.TextTransform.from(values.get(StyleKeys.TEXT_TRANSFORM))
    set(value) {
      writeTextTransform(value.value, StyleState.SET)
    }

  var textWrap: TextWrap
    get() = TextWrap.from(values.get(StyleKeys.TEXT_WRAP))
    set(value) {
      writeTextWrap(value.value, StyleState.SET)
    }

  var whiteSpace: Styles.WhiteSpace
    get() = Styles.WhiteSpace.from(values.get(StyleKeys.WHITE_SPACE))
    set(value) {
      writeWhiteSpace(value.value, StyleState.SET)
    }

  var zIndex: Int
    get() {
      val base = values.getInt(StyleKeys.Z_INDEX)
      return resolvePseudo(StateKeys.Z_INDEX, base) { buf ->
        buf.getInt(StyleKeys.Z_INDEX)
      }
    }
    set(value) {
      writeZIndex(value)
    }
  // </style-keys:accessors>

  // <style-keys:native-methods> generated from tools/scripts/style-keys/style-keys.schema
  fun setInsetLeft(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeInsetLeftType(type, value)
  }

  fun setInsetRight(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeInsetRightType(type, value)
  }

  fun setInsetTop(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeInsetTopType(type, value)
  }

  fun setInsetBottom(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeInsetBottomType(type, value)
  }

  fun setInsetWithValueType(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeInset(type, value, type, value, type, value, type, value)
  }

  fun setMarginLeft(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeMarginLeftType(type, value)
  }

  fun setMarginRight(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeMarginRightType(type, value)
  }

  fun setMarginTop(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeMarginTopType(type, value)
  }

  fun setMarginBottom(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeMarginBottomType(type, value)
  }

  fun setMarginWithValueType(value: Float, type: Byte) {
    if (LengthPercentageAuto.isValid(type, value)) writeMargin(type, value, type, value, type, value, type, value)
  }

  fun setPaddingLeft(value: Float, type: Byte) {
    if (LengthPercentage.isValid(type, value)) writePaddingLeftType(type, value)
  }

  fun setPaddingRight(value: Float, type: Byte) {
    if (LengthPercentage.isValid(type, value)) writePaddingRightType(type, value)
  }

  fun setPaddingTop(value: Float, type: Byte) {
    if (LengthPercentage.isValid(type, value)) writePaddingTopType(type, value)
  }

  fun setPaddingBottom(value: Float, type: Byte) {
    if (LengthPercentage.isValid(type, value)) writePaddingBottomType(type, value)
  }

  fun setPaddingWithValueType(value: Float, type: Byte) {
    if (LengthPercentage.isValid(type, value)) writePadding(type, value, type, value, type, value, type, value)
  }

  fun setBorderLeftWidth(value: Float, type: Byte) {
    LengthPercentage.fromTypeValue(type, value)?.let { borderLeftWidth = it }
  }

  fun setBorderRightWidth(value: Float, type: Byte) {
    LengthPercentage.fromTypeValue(type, value)?.let { borderRightWidth = it }
  }

  fun setBorderTopWidth(value: Float, type: Byte) {
    LengthPercentage.fromTypeValue(type, value)?.let { borderTopWidth = it }
  }

  fun setBorderBottomWidth(value: Float, type: Byte) {
    LengthPercentage.fromTypeValue(type, value)?.let { borderBottomWidth = it }
  }

  fun setBorderWidth(value: Float, type: Byte) {
    LengthPercentage.fromTypeValue(type, value)?.let { borderWidth = Rect.uniform(it) }
  }

  fun setFlexBasis(value: Float, type: Byte) {
    if (Dimension.isValid(type, value)) writeFlexBasisType(type, value)
  }

  fun setMinSizeWidth(value: Float, type: Byte) {
    if (Dimension.isValid(type, value)) writeMinWidth(type, value)
  }

  fun setMinSizeWidth(value: Dimension) {
    writeMinWidth(value.type, value.value)
  }

  fun setMinSizeHeight(value: Float, type: Byte) {
    if (Dimension.isValid(type, value)) writeMinHeight(type, value)
  }

  fun setMinSizeHeight(value: Dimension) {
    writeMinHeight(value.type, value.value)
  }

  fun setSizeWidth(value: Float, type: Byte) {
    if (Dimension.isValid(type, value)) writeWidth(type, value)
  }

  fun setSizeWidth(value: Dimension) {
    writeWidth(value.type, value.value)
  }

  fun setSizeHeight(value: Float, type: Byte) {
    if (Dimension.isValid(type, value)) writeHeight(type, value)
  }

  fun setSizeHeight(value: Dimension) {
    writeHeight(value.type, value.value)
  }

  fun setMaxSizeWidth(value: Float, type: Byte) {
    if (Dimension.isValid(type, value)) writeMaxWidth(type, value)
  }

  fun setMaxSizeWidth(value: Dimension) {
    writeMaxWidth(value.type, value.value)
  }

  fun setMaxSizeHeight(value: Float, type: Byte) {
    if (Dimension.isValid(type, value)) writeMaxHeight(type, value)
  }

  fun setMaxSizeHeight(value: Dimension) {
    writeMaxHeight(value.type, value.value)
  }

  fun setGapRow(value: Float, type: Byte) {
    if (LengthPercentage.isValid(type, value)) writeRowGap(type, value)
  }

  fun setGapColumn(value: Float, type: Byte) {
    if (LengthPercentage.isValid(type, value)) writeColumnGap(type, value)
  }
  // </style-keys:native-methods>

  internal var isValueInitialized: Boolean = false

  internal var fontDirty = false
    private set(value) {
      field = value
      if (value) pendingMetricsStyles[this] = true
    }

  // Guard flag: true while inside Rust measure callback (read lock held, no buffer writes)
  @JvmField
  internal var inMeasure = false
  internal var pendingMetricsSync = false
    private set(value) {
      field = value
      if (value) pendingMetricsStyles[this] = true
    }

  // Published fontmanager fires reload listeners off the main thread.
  private var mReloadListener: ((FontFace, String?) -> Unit)? = null
  private val reloadListener: (FontFace, String?) -> Unit
    get() {
      mReloadListener?.let { return it }
      val listener: (FontFace, String?) -> Unit = { _, _ ->
        if (android.os.Looper.myLooper() === android.os.Looper.getMainLooper()) {
          syncFontMetrics()
        } else {
          android.os.Handler(android.os.Looper.getMainLooper()).post { syncFontMetrics() }
        }
      }
      mReloadListener = listener
      return listener
    }

  // Lazily constructed: FontFace's own constructor (fontmanager) spins up a
  // dedicated single-thread Executor with no way to shut it down, so eagerly
  // creating one per Style would leak an OS thread per node, including plain
  // layout divs that never touch a font property. Deferring construction
  // until font is actually read or written avoids that for the common case.
  private var _font: FontFace? = null
  var font: FontFace
    get() {
      var current = _font
      if (current == null) {
        current = FontFace(DEFAULT_FONT_FAMILY).apply {
          addOnReloadListener(reloadListener)
        }
        _font = current
      }
      return current
    }
    set(value) {
      val old = _font
      if (old !== value) {
        _font = value
        old?.removeOnReloadListener(reloadListener)
        value.addOnReloadListener(reloadListener)
        invalidateResolvedFontFace()
      }
    }

  // Cached resolved font face - invalidated when font properties change
  private var _cachedResolvedFontFace: FontFace? = null
  private var _resolvedFontFaceDirty = true

  /**
   * Called when this node's place in the tree changes: `resolvedFontFace`
   * inherits through `node.parent`, and a face resolved while the subtree was
   * still unparented resolved against no inheritance at all.
   */
  internal fun invalidateInheritedTextCaches() {
    invalidateResolvedFontFace()
  }

  private fun invalidateResolvedFontFace() {
    _resolvedFontFaceDirty = true
    _cachedResolvedFontFace = null
    fontDirty = true
  }

  // FontFace.load queues a callback per call while loading; keep one per style.
  private var fontLoadPendingFor: FontFace? = null

  /**
   * A FontFace only gets a Typeface once something calls `load()`. The face
   * that ends up rendering text is often an *ancestor's* (font-family
   * inherits), and the ancestor is usually a plain layout div that never
   * measures text -- so nothing on its own side ever loads it. Kick the load
   * off from whoever actually resolved to it, and re-apply once it lands.
   */
  private fun ensureResolvedFontLoaded(face: FontFace) {
    if (face.font != null || fontLoadPendingFor === face) return
    val v = node.view as? android.view.View ?: return
    fontLoadPendingFor = face
    face.load(v.context) { _ ->
      v.post {
        if (fontLoadPendingFor === face) fontLoadPendingFor = null
        invalidateResolvedFontFace()
        val metricsChanged = syncFontMetrics()
        notifyTextStyleChanged(StateKeys.FONT_FAMILY)
        if (metricsChanged) {
          node.dirty()
          v.invalidate()
          v.requestLayout()
        }
      }
    }
  }

  data class FontMetrics(
    val ascent: Float,
    val descent: Float,
    val xHeight: Float,
    val leading: Float,
    val capHeight: Float
  ) {
    companion object {
      @JvmStatic
      fun from(style: Style): FontMetrics {
        return FontMetrics(
          style.values.getFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET)
        )
      }
    }
  }


  private var defaultPaint: TextPaint? = null

  internal val paint: TextPaint
    get() {
      return if (node.view is TextContainer) {
        (node.view as TextContainer).getPaint()
      } else {
        val p = defaultPaint ?: TextPaint().also { defaultPaint = it }
        p.textSize =
          Constants.DEFAULT_FONT_SIZE * ((node.view as? View)?.resources?.displayMetrics?.scaledDensity
            ?: Mason.shared.scale)
        p
      }
    }

  internal fun getFontMetrics(): FontMetrics {
    return FontMetrics.from(this)
  }

  private var xBounds: android.graphics.Rect? = null

  private var capBounds: android.graphics.Rect? = null


  /**
   * Update font metrics on a Mason node when font changes.
   * When called during a Rust measure callback (inMeasure == true),
   * write is deferred to avoid deadlocking the rwlock.
   */
  internal fun syncFontMetrics(): Boolean {
    if (!fontDirty) return false
    if (inMeasure) {
      pendingMetricsSync = true
      return false
    }
    return syncFontMetricsNow()
  }

  private fun syncFontMetricsNow(): Boolean {
    val m = sharedFontMetrics(
      paint,
      xBounds ?: android.graphics.Rect().also { xBounds = it },
      capBounds ?: android.graphics.Rect().also { capBounds = it }
    )
    val ascent = m[0]
    val descent = m[1]
    val leading = m[2]
    val xHeight = m[3]
    val capHeight = m[4]

    if (fmSynced && fmAscent == ascent && fmDescent == descent && fmXHeight == xHeight &&
      fmLeading == leading && fmCapHeight == capHeight
    ) {
      fontDirty = false
      return false
    }
    fmSynced = true
    fmAscent = ascent
    fmDescent = descent
    fmXHeight = xHeight
    fmLeading = leading
    fmCapHeight = capHeight

    prepareMut()
    values.putFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, ascent)
    values.putFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, descent)
    values.putFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, xHeight)
    values.putFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, leading)
    values.putFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, capHeight)
    fontDirty = false
    return true
  }

  private var fmSynced = false
  private var fmAscent = 0f
  private var fmDescent = 0f
  private var fmXHeight = 0f
  private var fmLeading = 0f
  private var fmCapHeight = 0f

  /**
   * Flush deferred font metrics sync after measure callback returns.
   * Returns true only when the native metrics actually changed.
   */
  internal fun flushPendingMetricsSync(): Boolean {
    if (!pendingMetricsSync) return false
    pendingMetricsSync = false
    return syncFontMetricsNow()
  }

  /**
   * Clear metrics when node no longer has text
   */
  internal fun clearFontMetrics() {
    prepareMut()
    values.putFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, 14f)
    values.putFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, 4f)
    values.putFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, 7f)
    values.putFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, 0f)
    values.putFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, 10f)
  }

  private var mPlaceholderBuffer: ByteBuffer? = null
  private val mPlaceholder: ByteBuffer
    get() = mPlaceholderBuffer ?: createPlaceholder().also { mPlaceholderBuffer = it }

  private fun createPlaceholder(): ByteBuffer {
    isValueInitialized = true
    // use the same capacity set in rust
    return ByteBuffer.allocateDirect(StyleKeys.STYLE_BUFFER_SIZE).apply {
      order(ByteOrder.nativeOrder())

      // default ratio to NAN
      putFloat(StyleKeys.ASPECT_RATIO, Float.NaN)
      // default shrink to 1
      putFloat(StyleKeys.FLEX_SHRINK, 1f)

      putFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, 1f)
      putFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, 1f)
      putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, 1f)
      putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, 1f)


      // Default font metrics

      putFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, 14f)
      putFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, 4f)
      putFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, 7f)
      putFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, 0f)
      putFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, 10f)

      putFloat(StyleKeys.FIRST_BASELINE_OFFSET, Float.NaN)

      put(StyleKeys.OBJECT_FIT, ObjectFit.Fill.value)
      put(StyleKeys.DISPLAY, Display.Block.value)

      // default Normal -> -1
      put(StyleKeys.ALIGN_ITEMS, -1)
      put(StyleKeys.ALIGN_SELF, -1)
      put(StyleKeys.ALIGN_CONTENT, -1)

      put(StyleKeys.JUSTIFY_ITEMS, -1)
      put(StyleKeys.JUSTIFY_SELF, -1)
      put(StyleKeys.JUSTIFY_CONTENT, -1)

      put(StyleKeys.MARGIN_LEFT_TYPE, 1)
      put(StyleKeys.MARGIN_TOP_TYPE, 1)
      put(StyleKeys.MARGIN_RIGHT_TYPE, 1)
      put(StyleKeys.MARGIN_BOTTOM_TYPE, 1)
      put(StyleKeys.REF_COUNT, 1)
    }
  }
  private var mValues: ByteBuffer? = null

  private var mWritableValue: ByteBuffer? = null

  // Bumped on every style write path so draw-time caches can skip re-reading the buffer.
  internal var styleVersion = 0
    set(value) {
      field = value
      writeEpoch++
    }

  fun prepareMut() {
    if (node.isPlaceholder) {
      return
    }
    styleVersion++

    // REF_COUNT is a u32 - must read the full width, not just the low byte,
    // or a shared count whose low byte happens to be 1 (257, 513, ...) looks
    // exclusively owned and the write corrupts every node sharing the buffer.
    val current = mWritableValue ?: mValues
    if (current != null && current.getInt(StyleKeys.REF_COUNT) == 1) {
      isValueInitialized = true
      if (mWritableValue == null) mWritableValue = current
      return
    }

    // Rust holds its lock during compute: write the current buffer and let updateNativeStyle sync it after.
    if (node.mason.inCompute) {
      isValueInitialized = true
      mWritableValue = values
      return
    }
    // Copying off a shared default restores that default in place for its other users.
    sharedBufferEpoch++
    val slot = nativePrepareStyleSlot(node.mason.nativePtr, node.nativePtr)
    isValueInitialized = true
    this.slot = slot
    mWritableValue = node.mason.styleSlot(slot) ?: error("Could not allocate style buffer")
  }

  /** The style slot this style owns, or -1 while it still shares a default. */
  internal var slot = -1
    private set

  /** Gives this style its own slot if it shares one; returns the slot index, or -1. */
  internal fun prepareSlot(): Int {
    if (node.isPlaceholder || node.mason.inCompute) return -1
    prepareMut()
    if (slot < 0) slot = nativePrepareStyleSlot(node.mason.nativePtr, node.nativePtr)
    return slot
  }

  val writableValue: ByteBuffer
    get() {
      if (node.isPlaceholder) {
        return mPlaceholder
      }
      prepareMut()

      return (mWritableValue)!!
    }

  val values: ByteBuffer
    get() {
      if (node.isPlaceholder) return mPlaceholder
      if (mWritableValue != null) return mWritableValue!!
      if (mValues != null) return mValues!!
      // During compute Rust holds the lock — use placeholder to avoid deadlock
      if (node.mason.inCompute) {
        return mPlaceholder
      }
      val buffer = node.mason.styleSlot(nativeStyleSlot(node.mason.nativePtr, node.nativePtr))
        ?: error("Could not read style buffer")
      mValues = buffer
      return buffer
    }

  internal var isDirty = -1L
  internal var isDirtyHigh = -1L
  private fun isDirtyEmpty(): Boolean = (isDirty == -1L && isDirtyHigh == -1L)

  internal fun setOrAppendState(value: StateKeys) {
    clearLogicalSides(value)
    styleVersion++
    if (isDirtyEmpty()) {
      isDirty = value.low
      isDirtyHigh = value.high
    } else {
      isDirty = isDirty or value.low
      isDirtyHigh = isDirtyHigh or value.high
    }
    if (!inBatch) {
      updateNativeStyle()
    }
  }

  internal fun setOrAppendState(keys: Array<StateKeys>) {
    styleVersion++
    for (value in keys) {
      clearLogicalSides(value)
      if (isDirtyEmpty()) {
        isDirty = value.low
        isDirtyHigh = value.high
      } else {
        isDirty = isDirty or value.low
        isDirtyHigh = isDirtyHigh or value.high
      }
    }
    if (!inBatch) {
      updateNativeStyle()
    }
  }

  // CSS logical sides (see StyleKeys.LOGICAL_SEQ)

  /**
   * A native write of a box side is a physical declaration: the group's logical sides (the UA
   * margins) give way to it. The TypeScript layer stamps sides one by one instead.
   */
  private fun clearLogicalSides(value: StateKeys) {
    if (!(value hasFlag LOGICAL_STATE_KEYS)) return
    var prepared = false
    for (g in LOGICAL_GROUP_KEYS.indices) {
      if (!(value hasFlag LOGICAL_GROUP_KEYS[g])) continue
      val first = LOGICAL_GROUP_ORDERS[g] + LOGICAL_GROUP_HALVES[g]
      for (i in first until first + LOGICAL_GROUP_HALVES[g]) {
        if (values.get(i).toInt() == 0) continue
        // The buffer may be shared with other nodes.
        if (!prepared) {
          prepareMut()
          prepared = true
        }
        values.put(i, 0)
      }
    }
  }

  /** The next write stamp; at the counter's end every stamp is renumbered by rank, keeping their order. */
  private fun nextLogicalStamp(): Int {
    val buffer = values
    var seq = buffer.get(StyleKeys.LOGICAL_SEQ).toInt() and 0xFF
    if (seq == 255) {
      val used = BooleanArray(256)
      for (g in LOGICAL_GROUP_ORDERS.indices) {
        val order = LOGICAL_GROUP_ORDERS[g]
        for (i in order until order + LOGICAL_GROUP_HALVES[g] * 2) used[buffer.get(i).toInt() and 0xFF] = true
      }
      val rank = IntArray(256)
      var next = 0
      for (stamp in 1 until 256) if (used[stamp]) rank[stamp] = ++next
      for (g in LOGICAL_GROUP_ORDERS.indices) {
        val order = LOGICAL_GROUP_ORDERS[g]
        for (i in order until order + LOGICAL_GROUP_HALVES[g] * 2) buffer.put(i, rank[buffer.get(i).toInt() and 0xFF].toByte())
      }
      seq = next
    }
    buffer.put(StyleKeys.LOGICAL_SEQ, (seq + 1).toByte())
    return seq + 1
  }

  /**
   * Margins as logical sides, in device px, so a vertical box gets them on its block axis: a
   * block text element's UA margins (`margin-block`, `margin-inline`).
   */
  internal fun setLogicalMargin(blockStart: Float, inlineEnd: Float, blockEnd: Float, inlineStart: Float) {
    prepareMut()
    val buffer = values
    val sides = floatArrayOf(blockStart, inlineEnd, blockEnd, inlineStart)
    for (slot in 0 until 4) {
      buffer.put(StyleKeys.MARGIN_ORDER + 4 + slot, nextLogicalStamp().toByte())
      buffer.put(StyleKeys.MARGIN_BLOCK_START_TYPE + slot, 1)
      buffer.putFloat(StyleKeys.MARGIN_BLOCK_START_VALUE + slot * 4, sides[slot])
    }
    setStateFromHalves(StateKeys.MARGIN.low, StateKeys.MARGIN.high)
  }

  private fun updateTextStyle() {
    if (node.nativePtr == 0L) {
      return
    }

    if (!isDirtyEmpty()) {
      // Forward dirty ∩ ALL_TEXT: onTextStyleChanged picks the layout-vs-visual
      // branch from the exact flags, so it must carry every text key (a hand-picked
      // subset previously dropped font-size, letter-spacing, etc.). Mirrors iOS.
      val stateLow = isDirty and StateKeys.ALL_TEXT.low
      val stateHigh = isDirtyHigh and StateKeys.ALL_TEXT.high

      if (stateLow != 0L || stateHigh != 0L) {
        // Background needs its holder created before the change is dispatched.
        if ((stateLow and StateKeys.BACKGROUND_COLOR.low) != 0L ||
          (stateHigh and StateKeys.BACKGROUND_COLOR.high) != 0L
        ) {
          if (mBackground == null) {
            mBackground = Background(this)
          }
        }
        notifyTextStyleChanged(stateLow, stateHigh)
        // Repaint this node's own view: notifyTextStyleChanged routes to the
        // styleChangeListener (often an ancestor that can't target this view), so
        // visual-only changes like backgroundColor would otherwise not repaint.
        // Mirrors iOS MasonUIView.onStyleChange (unconditional setNeedsDisplay).
        (node.view as? android.view.View)?.invalidate()
      }
      return
    }
  }

  internal fun setStateFromHalves(low: Long, high: Long) {
    if (StateKeys.hasFlag(low, high, StateKeys.TEXT_OVERFLOW) && textOverflowKind < 2 && textOverflowTokenKey != 0L) {
      installTextOverflow(textOverflowKind, null)
    }
    styleVersion++
    if (isDirtyEmpty()) {
      isDirty = low
      isDirtyHigh = high
    } else {
      isDirty = isDirty or low
      isDirtyHigh = isDirtyHigh or high
    }
    // JS-driven font-face changes bypass the Kotlin setters that normally invalidate
    // the cache, so without this resolvedFontFace returns a stale FontFace/Typeface.
    if (StateKeys.hasFlag(low, high, StateKeys.FONT_WEIGHT) ||
      StateKeys.hasFlag(low, high, StateKeys.FONT_STYLE) ||
      StateKeys.hasFlag(low, high, StateKeys.FONT_FAMILY)
    ) {
      invalidateResolvedFontFace()
    }
    // Likewise for `display`: the setter hides the view, but a JS write only reaches the buffer,
    // and a view that was laid out before going `display: none` keeps drawing at its old frame.
    if (StateKeys.hasFlag(low, high, StateKeys.DISPLAY) || StateKeys.hasFlag(low, high, StateKeys.VISIBILITY)) {
      (node.view as? View)?.let { view ->
        val visibility = if (display == Display.None || node.detailsHidden || hidesView) View.INVISIBLE else View.VISIBLE
        // GONE is `visibility: collapse` or a queued removal (NodeUtils); both outrank display.
        if (view.visibility != visibility && view.visibility != View.GONE) view.visibility = visibility
      }
    }
    if (!inBatch) {
      updateNativeStyle()
    }
  }

  private fun resetState() {
    isDirty = -1
    isDirtyHigh = -1L
  }

  var inBatch: Boolean = false
    set(value) {
      val changed = field && !value
      field = value
      if (changed) {
        // updateNativeStyle() already calls updateTextStyle() internally —
        // calling it here too walked the text-style subtree twice per batch.
        updateNativeStyle()
      }
    }

  fun configure(block: (Style) -> Unit) {
    inBatch = true
    block(this)
    inBatch = false
  }

  private var styleChangeListener: StyleChangeListener? = null

  internal fun setStyleChangeListener(listener: StyleChangeListener?) {
    styleChangeListener = listener
  }

  @Suppress("NOTHING_TO_INLINE")
  private inline fun notifyTextStyleChanged(low: Long, high: Long) {
    styleChangeListener?.onChange(low, high)
  }

  @Suppress("NOTHING_TO_INLINE")
  internal inline fun notifyTextStyleChanged(state: StateKeys) {
    styleChangeListener?.onChange(state.low, state.high)
  }

  private inline val isMutable: Boolean
    get() {
      return values.getInt(StyleKeys.REF_COUNT) == 1
    }

  // allow overriding of the display
  internal var forceInline: Boolean
    get() {
      return values.get(StyleKeys.FORCE_INLINE) != Constants.ZERO
    }
    set(value) {
      prepareMut()
      values.put(
        StyleKeys.FORCE_INLINE, if (value) {
          1
        } else {
          0
        }
      )
      setOrAppendState(StateKeys.FORCE_INLINE)
    }

  internal var mFilter: CSSFilters.CSSFilter? = null
    private set
  private var baseFilter: CSSFilters.CSSFilter? = null
  private var activePseudoFilter: NativeFilterProgram? = null

  private var filterCss = ""
  var filter: String
    get() = filterCss
    set(value) = applyFilter(value, CSSFilters.setStyleFilter(value, this))

  private fun applyFilter(value: String, filter: CSSFilters.CSSFilter) {
    // Whether inline text is merged into its parent's depends on the filter.
    if (value.isEmpty() != filterCss.isEmpty()) {
      (node.parent?.view as? TextView)?.engine?.invalidateInlineSegments()
    }
    filterCss = value
    val hadFilters = mFilter?.filters?.isNotEmpty() ?: false
    baseFilter = filter
    mFilter = filter
    activePseudoFilter = null
    if (filter.filters.isNotEmpty() || (value.isEmpty() && hadFilters)) {
      (node.view as? View)?.invalidate()
    }
  }

  // Transform

  internal var mTransformRaw: String = ""
  private var transformProgram: NativeTransformProgram? = null

  /** The part of the transform view properties can't hold (see [decompose]); drawn by [beginMask]. */
  internal var transformShear = 0f
    private set

  /** An invalid value is ignored, as a browser drops the declaration. */
  var transform: String
    get() = mTransformRaw
    set(value) {
      val program = NativeTransformProgram.parse(value) ?: return
      program.install(this)
      mTransformRaw = value
      transformProgram = program.takeUnless { it.isEmpty }
      applyTransformToView()
    }

  private val hasCssTransform: Boolean
    get() = transformProgram != null

  /**
   * Sets the pivot from transform-origin (device px from the left/top edge, or % of the size).
   * Without one, a transformed view pivots at its centre and others keep theirs unless [reset].
   * A writing-mode turn alone pivots at the centre.
   */
  private fun applyPivot(v: View, hasTransform: Boolean, reset: Boolean = false) {
    val w = v.width
    val h = v.height
    val originSet = values.get(StyleKeys.TRANSFORM_ORIGIN_STATE) != StyleState.INHERIT
    if (!originSet || (!hasTransform && node.inlineTurn != 0f)) {
      if (reset && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
        v.resetPivot()
      } else if ((hasTransform || reset || originSet) && w > 0 && h > 0) {
        v.pivotX = w / 2f; v.pivotY = h / 2f
      }
      return
    }
    val xPercent = values.get(StyleKeys.TRANSFORM_ORIGIN_X_TYPE).toInt() == 1
    val yPercent = values.get(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE).toInt() == 1
    // A percentage needs the size; onSizeChanged applies it once known.
    if ((xPercent || yPercent) && (w <= 0 || h <= 0)) return
    val x = values.getFloat(StyleKeys.TRANSFORM_ORIGIN_X_VALUE)
    val y = values.getFloat(StyleKeys.TRANSFORM_ORIGIN_Y_VALUE)
    v.pivotX = if (xPercent) x / 100f * w else x
    v.pivotY = if (yPercent) y / 100f * h else y
  }

  // A pivot set in pixels does not follow the size, so a set origin is re-applied on resize.
  internal fun onViewSizeChanged(v: View) {
    // translate() percentages are of the box.
    if (hasCssTransform) {
      applyTransformToView()
      return
    }
    if (values.get(StyleKeys.TRANSFORM_ORIGIN_STATE) != StyleState.INHERIT) {
      applyPivot(v, hasCssTransform)
    }
  }

  // Without a CSS transform the view's transform properties are left alone,
  // so transforms set on the view directly (e.g. animations) survive a resize.
  internal fun onElementSizeChanged(v: View) {
    if (hasCssTransform || node.inlineTurn != 0f) {
      applyTransformToView()
    } else {
      onViewSizeChanged(v)
    }
  }

  internal fun applyTransformToView() {
    val v = node.view as? View ?: return
    val program = transformProgram

    if (program == null) {
      applyPivot(v, false)
      v.translationX = 0f; v.translationY = 0f
      v.scaleX = 1f; v.scaleY = 1f; v.rotation = node.inlineTurn
      if (transformShear != 0f) transformShear = 0f
      v.invalidate()
      return
    }

    // Percentages in translate() are of the border box, so this reruns on resize.
    val t = decompose(program.affine(v.width.toFloat(), v.height.toFloat(), LengthContext.forStyle(this)))
    applyPivot(v, true)
    v.translationX = t.translationX; v.translationY = t.translationY
    v.rotation = t.rotation + node.inlineTurn; v.scaleX = t.scaleX; v.scaleY = t.scaleY
    transformShear = t.shear
    // The shear is drawn in draw(), which a ViewGroup with willNotDraw skips.
    if (t.shear != 0f && v is android.view.ViewGroup) v.setWillNotDraw(false)
    v.invalidate()
  }

  private val resolvedPseudoFilter: NativeFilterProgram?
    get() {
      for (i in PSEUDO_CSS_ORDER.indices.reversed()) {
        val state = PSEUDO_CSS_ORDER[i]
        if (node.hasPseudo(state)) node.pseudoFilter(state.mask)?.let { return it }
      }
      return null
    }

  internal val resolvedFilterString: String
    get() = resolvedPseudoFilter?.css ?: filter

  internal fun updateResolvedFilter() {
    val program = resolvedPseudoFilter
    if (program === activePseudoFilter) return
    val hadFilters = mFilter?.filters?.isNotEmpty() ?: false
    mFilter = if (program == null) baseFilter else CSSFilters.project(program, this)
    activePseudoFilter = program
    if (hadFilters || mFilter?.filters?.isNotEmpty() == true) {
      (node.view as? View)?.invalidate()
    }
  }

  internal var mBackground: Background? = null
  internal var mBackgroundRaw: String = ""
  var background: String
    get() = mBackgroundRaw
    set(value) {
      if (value.isEmpty()) {
        mBackground?.clear()
      } else {
        val background = mBackground ?: Background(this)
        if (background.replaceLayers(value, shorthand = true)) {
          background.install()
          mBackground = background
          mBackgroundRaw = value
          (node.view as? View)?.invalidate()
        }
      }

    }

  var backgroundImage: String
    get() {
      return mBackground?.layers?.joinToString(",", "", ";") { it.image.toString() } ?: ""
    }
    set(value) {
      val background = mBackground ?: Background(this)
      if (!background.replaceLayers(value, shorthand = false)) return
      background.install()
      mBackground = background
      isValueInitialized = true
      (node.view as? android.view.View)?.invalidate()
    }

  var backgroundRepeat: String
    get() {
      if (mBackground?.layers.isNullOrEmpty()) return ""
      return mBackground!!.layers.joinToString(",") { it.repeat.value }
    }
    set(value) {
      if (mBackground == null) mBackground = Background(this)
      mBackground!!.applyBackgroundRepeat(value)
    }

  private fun perLayerCss(map: (BackgroundLayer) -> String): String {
    val layers = mBackground?.layers
    if (layers.isNullOrEmpty()) return ""
    return layers.joinToString(", ", transform = map)
  }

  private fun ensureBackground(): Background {
    return mBackground ?: Background(this).also { mBackground = it }
  }

  internal fun applyCompiledBackground(fields: Array<String>, initialColor: Int, fontSize: Float) {
    ensureBackground().applyCompiled(fields, initialColor, fontSize)
  }

  var backgroundPosition: String
    get() = perLayerCss { it.position?.cssValue ?: "0% 0%" }
    set(value) = ensureBackground().applyBackgroundPosition(value)

  var backgroundPositionX: String
    get() = perLayerCss { it.position?.x?.cssValue(true) ?: "0%" }
    set(value) = ensureBackground().applyBackgroundPositionX(value)

  var backgroundPositionY: String
    get() = perLayerCss { it.position?.y?.cssValue(false) ?: "0%" }
    set(value) = ensureBackground().applyBackgroundPositionY(value)

  var backgroundSize: String
    get() = perLayerCss { it.size?.cssValue ?: "auto" }
    set(value) = ensureBackground().applyBackgroundSize(value)

  var backgroundClip: String
    get() = perLayerCss { it.clip.css }
    set(value) = ensureBackground().applyBackgroundClip(value)

  var backgroundOrigin: String
    get() = perLayerCss { it.origin.css }
    set(value) = ensureBackground().applyBackgroundOrigin(value)

  var backgroundAttachment: String
    get() = perLayerCss { it.attachment.css }
    set(value) = ensureBackground().applyBackgroundAttachment(value)

  var backgroundBlendMode: String
    get() = perLayerCss { it.blendMode.css }
    set(value) = ensureBackground().applyBackgroundBlendMode(value)

  fun setBackgroundColor(value: String) {
    parseColor(value)?.let { setParsedBackgroundColor(it) }
  }

  internal fun setParsedBackgroundColor(color: Int) {
    prepareMut()
    ensureBackground().color = color
  }



  fun setColor(value: String) {
    parseColor(value)?.let {
      color = it
    }
  }

  var fontFamily: String
    get() {
      return font.fontFamily
    }
    set(value) {
      prepareMut()
      val oldFamily = font.fontFamily
      if (oldFamily != value) {
        val oldFont = font
        // Create new font with updated family
        font.removeOnReloadListener(reloadListener)
        val ctx = (node.view as? android.view.View)?.context
        font = FontFace(value, AppFonts.resolve(value, ctx)).apply {
          weight = oldFont.weight
          style = oldFont.style
          display = oldFont.display
          addOnReloadListener(reloadListener)
        }

        values.put(StyleKeys.FONT_FAMILY_STATE, StyleState.SET)
        if (inBatch) {
          setOrAppendState(StateKeys.FONT_FAMILY)
        } else {
          notifyTextStyleChanged(StateKeys.FONT_FAMILY)
        }
      }
    }

  var fontVariant: String
    get() {
      return font.variationSettings
    }
    set(value) {
      font.variationSettings = value
      notifyTextStyleChanged(StateKeys.INVALIDATE_TEXT)
    }

  internal fun setParsedFontStretch(code: Int) {
    writeFontStretch(code, StyleState.SET)
  }

  private var fontFeatureSettingsCss = "normal"
  private var fontFeatures: String? = null

  var fontFeatureSettings: String
    get() = fontFeatureSettingsCss
    set(value) {
      if (fontFeatures != null && value == fontFeatureSettingsCss) return
      val records = installStyleCssRecords(this, value, StyleRecordKind.FONT_FEATURES) ?: return
      fontFeatures = (records.indices step FontFeatureRecord.STRIDE).joinToString(", ") { index ->
        val tag = records[index + FontFeatureRecord.TAG].toLong()
        val name = CharArray(4) { byte -> ((tag shr (byte * 8)) and 0xff).toInt().toChar() }.concatToString()
        val quote = if ('\'' in name) '"' else '\''
        "$quote$name$quote ${records[index + FontFeatureRecord.VALUE].toLong()}"
      }
      fontFeatureSettingsCss = value
      if (node.isPlaceholder || !node.mason.inCompute) {
        if (inBatch) setOrAppendState(StateKeys.FONT_FEATURE_SETTINGS)
        else notifyTextStyleChanged(StateKeys.FONT_FEATURE_SETTINGS)
      }
    }

  internal val resolvedFontFeatures: String
    get() = fontFeatures ?: parentStyleWithTextValues?.resolvedFontFeatures.orEmpty()

  internal val fontFeaturesForPaint: String
    get() {
      val numeric = FontVariantNumeric.toFontFeatureSettings(resolvedFontVariantNumeric)
      val custom = resolvedFontFeatures
      return when {
        numeric.isEmpty() -> custom
        custom.isEmpty() -> numeric
        else -> "$numeric, $custom"
      }
    }

  var fontKerning: String
    get() {
      return font.kerning
    }
    set(value) {
      font.kerning = value
      notifyTextStyleChanged(StateKeys.INVALIDATE_TEXT)
    }

  var fontVariantLigatures: String
    get() {
      return font.variantLigatures
    }
    set(value) {
      font.variantLigatures = value
      notifyTextStyleChanged(StateKeys.INVALIDATE_TEXT)
    }


  private fun applyFontWeight(value: FontWeight) {
    if (value == fontWeight && values.get(StyleKeys.FONT_WEIGHT_STATE) == StyleState.SET) return
    // Weight lives in the buffer; only a face this style already owns needs it.
    _font?.weight = value
    invalidateResolvedFontFace()
    writeFontWeight(value.weight, StyleState.SET)
  }

  internal fun setParsedFontWeight(weight: Int) {
    fontWeight = FontWeight.from(weight)
  }

  private fun applyFontStyle(value: FontStyle) {
    val (type, slant) = when (value) {
      FontStyle.Normal -> 0.toByte() to 0
      FontStyle.Italic -> 1.toByte() to 0
      is FontStyle.Oblique -> 2.toByte() to value.angle
    }
    if (values.get(StyleKeys.FONT_STYLE_STATE) == StyleState.SET && fontStyle == value) return
    _font?.style = value
    invalidateResolvedFontFace()
    writeFontStyle(type, StyleState.SET, slant)
  }

  private fun decodeFontStyle(type: Byte, slant: Int): FontStyle = when (type.toInt()) {
    1 -> FontStyle.Italic
    2 -> FontStyle.Oblique(slant)
    else -> FontStyle.Normal
  }

  internal fun setParsedFontStyle(fields: Array<String>) {
    val style = when (fields.firstOrNull()) {
      "0" -> FontStyle.Normal
      "1" -> FontStyle.Italic
      "2" -> FontStyle.Oblique(fields.getOrNull(1)?.toIntOrNull() ?: return)
      else -> return
    }
    fontStyle = style
  }

  var fontVariantNumericString: String
    get() = FontVariantNumeric.toCssString(fontVariantNumeric)
    set(value) {
      fontVariantNumeric = FontVariantNumeric.parse(value)
    }




  internal fun setResolvedVerticalAlign(kind: Int, amount: Float) {
    writeVerticalAlign(if (kind == 3) 0f else amount, if (kind == 2) 1 else 0,
      if (kind == 3) amount.toInt().toByte() else 0)
  }


  private fun resolveDecorationThickness(length: String): Float? =
    if (length.isEmpty()) 0f else parseLength(this, length.lowercase())

  fun setLineHeight(value: Float, isRelative: Boolean) {
    writeLineHeight(value, StyleState.SET, if (isRelative) 0 else 1)
  }

  private fun textIndentFields(value: String): DoubleArray? {
    val mason = node.mason
    return Mason.nativeParseCss(value, CssParseKind.TEXT_INDENT, mason.scale, resolvedFontSize,
      mason.rootFontSize, mason.viewportWidth, mason.viewportHeight, 0)
      ?.takeIf { it.size == CssLengthResultRecord.STRIDE }
  }

  internal fun setResolvedFontSize(amount: Float, isPercent: Boolean) {
    writeFontSize(if (isPercent) amount * 100f else amount, StyleState.SET, if (isPercent) 1 else 0)
  }

  internal fun setResolvedLineHeight(amount: Float, kind: Int) {
    if (kind == 3) {
      writeLineHeightState(StyleState.INHERIT)
    } else {
      setLineHeight(amount, kind == 0)
    }
  }

  internal fun setResolvedWordSpacing(amount: Float, kind: Int) {
    writeWordSpacing(amount, kind.toByte(), StyleState.SET)
  }

  /** text-indent: [value] in CSS px, or a percentage of the line length when [isPercent]. */
  fun setTextIndent(value: Float, isPercent: Boolean) {
    writeTextIndent(if (isPercent) value else value * node.mason.scale, if (isPercent) 1 else 0, StyleState.SET)
  }

  internal fun setResolvedTextIndent(value: Float, isPercent: Boolean) {
    writeTextIndent(if (isPercent) value * 100f else value, if (isPercent) 1 else 0, StyleState.SET)
  }

  /** transform-origin: each axis in CSS px from the left/top edge, or a percentage of the size. */
  fun setTransformOrigin(x: Float, xIsPercent: Boolean, y: Float, yIsPercent: Boolean) {
    val scale = node.mason.scale
    setResolvedTransformOrigin(if (xIsPercent) x else x * scale, xIsPercent, if (yIsPercent) y else y * scale, yIsPercent)
  }

  private fun cssNumber(v: Float): String =
    if (v == v.toLong().toFloat()) v.toLong().toString() else v.toString()

  private class DetachedTextOverflowToken(val key: Long)
  private var detachedTextOverflowToken: DetachedTextOverflowToken? = null
  private val textOverflowTokenKey: Long get() = values.getLong(StyleKeys.TEXT_OVERFLOW_TOKEN)

  private fun readTextOverflowToken(): String? = Mason.nativeTextOverflowToken(textOverflowTokenKey)

  private fun decodeTextOverflow(kind: Byte): Styles.TextOverflow = when (kind.toInt()) {
    1 -> Styles.TextOverflow.from(Styles.TextOverflow.Ellipse.value)
    2 -> readTextOverflowToken()?.let { Styles.TextOverflow.ellipse(it) } ?: Styles.TextOverflow.from(Styles.TextOverflow.Custom.value)
    3 -> Styles.TextOverflow.from(Styles.TextOverflow.Custom.value, readTextOverflowToken())
    else -> Styles.TextOverflow.Clip
  }

  private fun applyTextOverflow(flow: Styles.TextOverflow) {
    val token = flow.token
    val kind: Byte = when (flow) {
      Styles.TextOverflow.Clip -> 0
      Styles.TextOverflow.Ellipse -> if (token == null) 1 else 2
      Styles.TextOverflow.Custom -> 3
    }
    if (!installTextOverflow(kind, if (kind == 3.toByte()) token ?: "" else token)) return
    if (inBatch) setOrAppendState(StateKeys.TEXT_OVERFLOW)
    else notifyTextStyleChanged(StateKeys.TEXT_OVERFLOW)
  }

  private fun installTextOverflow(kind: Byte, token: String?): Boolean {
    if (node.isPlaceholder) {
      detachedTextOverflowToken?.let { Mason.nativeReleaseDetachedTextOverflowToken(it.key) }
      detachedTextOverflowToken = token?.let {
        val key = Mason.nativeDetachedTextOverflowToken(it.encodeToByteArray())
        DetachedTextOverflowToken(key).also { owner ->
          node.mason.gc.track(owner) { Mason.nativeReleaseDetachedTextOverflowToken(key) }
        }
      }
      values.putLong(StyleKeys.TEXT_OVERFLOW_TOKEN, detachedTextOverflowToken?.key ?: 0)
      values.put(StyleKeys.TEXT_OVERFLOW, kind)
      values.put(StyleKeys.TEXT_OVERFLOW_STATE, StyleState.SET)
      return true
    }
    val mason = node.mason
    val deferred = mason.inCompute
    if (!deferred) prepareMut()
    Mason.nativeSetTextOverflow(if (deferred) 0L else mason.nativePtr, node.nativePtr, kind, token?.encodeToByteArray())
    if (deferred) mason.deferStyleRecords(this, textChanges = StateKeys.TEXT_OVERFLOW)
    return !deferred
  }

  private fun updateDisplayVisibility(value: Display) {
    // Mason positions children itself. GONE is reserved for visibility: collapse and removal.
    (node.view as? View)?.visibility =
      if (value == Display.None || node.detailsHidden || hidesView) View.INVISIBLE else View.VISIBLE
  }

  // `visibility: hidden` or `collapse`: the view isn't drawn, though a hidden one keeps its box.
  internal val hidesView: Boolean
    get() = visibilityCode != 0.toByte()









  fun setMargin(left: Float, top: Float, right: Float, bottom: Float) {
    margin = Rect(
      LengthPercentageAuto.Points(
        top
      ),
      LengthPercentageAuto.Points(
        right
      ),
      LengthPercentageAuto.Points(
        bottom
      ),
      LengthPercentageAuto.Points(
        left
      ),
    )
  }

  fun setMargin(left: Int, top: Int, right: Int, bottom: Int) {
    margin = Rect(
      LengthPercentageAuto.Points(
        top.toFloat()
      ),
      LengthPercentageAuto.Points(
        right.toFloat()
      ),
      LengthPercentageAuto.Points(
        bottom.toFloat()
      ),
      LengthPercentageAuto.Points(
        left.toFloat()
      )
    )
  }








  fun setPadding(left: Float, top: Float, right: Float, bottom: Float) {
    padding = Rect(
      LengthPercentage.Points(
        top
      ),
      LengthPercentage.Points(
        right
      ),
      LengthPercentage.Points(
        bottom
      ),
      LengthPercentage.Points(
        left
      )
    )
  }

  fun setPadding(left: Int, top: Int, right: Int, bottom: Int) {
    padding = Rect(
      LengthPercentage.Points(
        top.toFloat()
      ),
      LengthPercentage.Points(
        right.toFloat()
      ),
      LengthPercentage.Points(
        bottom.toFloat()
      ),
      LengthPercentage.Points(
        left.toFloat()
      )
    )
  }






  internal var boxShadows: List<Shadow.BoxShadow> = listOf()
  private var mHasOutsetBoxShadow = false

  /** Fast check used in draw paths to avoid `.filter { !it.inset }` allocations. */
  fun hasOutsetBoxShadow(): Boolean = mHasOutsetBoxShadow

  private var mBoxShadowRaw: String = ""
  private var mBoxShadowRendererOrNull: BoxShadowRenderer? = null
  internal val mBoxShadowRenderer: BoxShadowRenderer
    get() = mBoxShadowRendererOrNull ?: BoxShadowRenderer(this).also { mBoxShadowRendererOrNull = it }

  // Computed once per write in the boxShadow setter; readers (renderer cache
  // keys, filtered-list checks) call boxShadowsHash() on every draw.
  private var mBoxShadowsHash = 0

  private fun computeBoxShadowsHash(list: List<Shadow.BoxShadow>): Int {
    var result = 1
    for (s in list) {
      result = 31 * result + s.offsetX.hashCode()
      result = 31 * result + s.offsetY.hashCode()
      result = 31 * result + s.blurRadius.hashCode()
      result = 31 * result + s.spreadRadius.hashCode()
      result = 31 * result + s.color
      result = 31 * result + if (s.inset) 1 else 0
    }
    return result
  }

  fun boxShadowsHash(): Int = mBoxShadowsHash

  var boxShadow: String
    get() = mBoxShadowRaw
    set(value) = applyBoxShadow(value, Shadow.setStyleBoxShadows(this, value))

  private fun applyBoxShadow(value: String, shadows: List<Shadow.BoxShadow>) {
    mBoxShadowRaw = value
    boxShadows = shadows
    mBoxShadowsHash = computeBoxShadowsHash(shadows)
    mHasOutsetBoxShadow = shadows.any { !it.inset }
    mBoxShadowRenderer.invalidate()
    val view = node.view as? android.view.View
    if (view != null) {
      view.invalidate()
      if (mHasOutsetBoxShadow) {
        (view.parent as? android.view.View)?.invalidate()
      }
    }
  }

  internal var textShadows: List<Shadow.TextShadow> = listOf()
  private var textShadowCss = ""
  var textShadow: String
    get() = textShadowCss
    set(value) = applyTextShadow(value, Shadow.setStyleTextShadows(this, value))

  private fun applyTextShadow(value: String, shadows: List<Shadow.TextShadow>) {
    textShadowCss = value
    textShadows = shadows
    if (node.isPlaceholder) {
      val state = if (shadows.isEmpty()) StyleState.INHERIT else StyleState.SET
      values.put(StyleKeys.TEXT_SHADOW_STATE, state)
    }
    if (node.isPlaceholder || !node.mason.inCompute) notifyTextShadowChanged()
  }

  internal fun notifyTextShadowChanged() = notifyTextStyleChanged(StateKeys.TEXT_SHADOWS)

  internal var mBorder: String = ""
  private var mBorderRendererOrNull: BorderRenderer? = null
  internal val mBorderRenderer: BorderRenderer
    get() = mBorderRendererOrNull ?: BorderRenderer(this).also { mBorderRendererOrNull = it }

  internal fun invalidateBorderRenderer() {
    mBorderRendererOrNull?.invalidate()
  }

  internal val mBorderRendererExists: Boolean
    get() = mBorderRendererOrNull != null

  // Any non-zero border width or radius in the buffer (bit patterns, so -0 counts too).
  internal fun mayHaveBorderOrRadius(): Boolean {
    if (node.pseudoMask != 0) return true
    val v = values
    return v.getLong(StyleKeys.BORDER_LEFT_VALUE) != 0L ||
      v.getLong(StyleKeys.BORDER_LEFT_VALUE + 8) != 0L ||
      v.getLong(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE) != 0L ||
      v.getLong(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE + 8) != 0L ||
      v.getLong(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE + 16) != 0L ||
      v.getLong(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE + 24) != 0L
  }

  internal fun invalidateBorderRendererSize() {
    mBorderRendererOrNull?.invalidateSize()
  }
  private var mBorderLeftOrNull: Border? = null
  internal val mBorderLeft: Border
    get() = mBorderLeftOrNull ?: Border(this, Border.Side.Left).also { mBorderLeftOrNull = it }

  private var mBorderTopOrNull: Border? = null
  internal val mBorderTop: Border
    get() = mBorderTopOrNull ?: Border(this, Border.Side.Top).also { mBorderTopOrNull = it }

  private var mBorderRightOrNull: Border? = null
  internal val mBorderRight: Border
    get() = mBorderRightOrNull ?: Border(this, Border.Side.Right).also { mBorderRightOrNull = it }

  private var mBorderBottomOrNull: Border? = null
  internal val mBorderBottom: Border
    get() = mBorderBottomOrNull ?: Border(this, Border.Side.Bottom).also { mBorderBottomOrNull = it }


  var border: String
    get() {
      return mBorder
    }
    set(value) {
      parseBorderShorthand(this, value)
    }

  var borderLeft: String = ""
    set(value) {
      field = value
      parseBorderSideShorthand(this, Border.Side.Left, value)
    }

  var borderTop: String = ""
    set(value) {
      field = value
      parseBorderSideShorthand(this, Border.Side.Top, value)
    }

  var borderRight: String = ""
    set(value) {
      field = value
      parseBorderSideShorthand(this, Border.Side.Right, value)
    }

  var borderBottom: String = ""
    set(value) {
      field = value
      parseBorderSideShorthand(this, Border.Side.Bottom, value)
    }

  private var authoredBorderRadius = ""
  var borderRadius: String
    get() = authoredBorderRadius
    set(value) {
      authoredBorderRadius = value
      parseBorderRadius(this, value)
    }

  internal fun setCompiledBorderRadius(css: String, radii: List<LengthPercentage>) {
    authoredBorderRadius = css
    applyResolvedBorderRadius(this, radii)
  }

  var paddingCss: String
    get() = padding.cssValue
    set(value) {
      parsePaddingShorthand(this, value)
    }

  var marginCss: String
    get() = margin.cssValue
    set(value) {
      parseMarginShorthand(this, value)
    }

  var insetCss: String
    get() = inset.cssValue
    set(value) {
      parseInsetShorthand(this, value)
    }

  // ============================================================
  // border-image (string-based)
  // ============================================================
  var borderImage: String = ""
    set(value) {
      if (value == field) return
      field = value
      val program = NativeNineSlice.parseBorderImage(value, color)
      NativeNineSlice.install(program, this, mask = false)
      mBorderImage = program?.let(::BorderImage)
      (node.view as? android.view.View)?.invalidate()
    }

  internal var mBorderImage: BorderImage? = null

  // ============================================================
  // backdrop-filter (string-based)
  // ============================================================
  internal var mBackdropFilter: CSSFilters.CSSFilter? = null

  // Filters content BEHIND the view; unlike setRenderEffect, children stay sharp.
  internal var mBackdropHelper: BackdropHelper? = null

  private var backdropFilterCss = ""
  var backdropFilter: String
    get() = backdropFilterCss
    set(value) = installBackdropFilter(value, CSSFilters.setStyleFilter(value, this, backdrop = true))

  private fun installBackdropFilter(value: String, filter: CSSFilters.CSSFilter) {
    backdropFilterCss = value
    mBackdropFilter = filter.takeIf { it.filters.isNotEmpty() }
    applyBackdropFilter()
  }

  internal fun applyCompiledEffects(fields: Array<String>, initialColor: Int, fontSize: Float) {
    if (fields.isEmpty() || fields.size % CssEffectWriteRecord.STRIDE != 0) return
    val mason = node.mason
    val attached = !node.isPlaceholder
    val deferred = attached && mason.inCompute
    if (attached && !deferred) prepareMut()
    val batch = Mason.nativeApplyEffectBatch(
      if (attached && !deferred) mason.nativePtr else 0L, if (attached) node.nativePtr else 0L,
      fields.joinToString("\u0000").encodeToByteArray(), mason.scale, fontSize, mason.rootFontSize,
      mason.viewportWidth, mason.viewportHeight, initialColor,
    ) ?: return
    fun apply(kind: StyleRecordKind, install: (String, DoubleArray) -> Unit) {
      val base = kind.id * CssEffectResultRecord.STRIDE
      val value = batch[base + CssEffectResultRecord.VALUE] as? String ?: return
      val records = batch[base + CssEffectResultRecord.RECORDS] as? DoubleArray ?: return
      if (deferred) mason.deferStyleRecords(this, kind)
      install(value, records)
    }
    apply(StyleRecordKind.FILTER) { value, records -> applyFilter(value, CSSFilters.decode(value, records)) }
    apply(StyleRecordKind.BACKDROP_FILTER) { value, records -> installBackdropFilter(value, CSSFilters.decode(value, records)) }
    apply(StyleRecordKind.BOX_SHADOW) { value, records -> applyBoxShadow(value, Shadow.readBoxShadows(records)) }
    apply(StyleRecordKind.TEXT_SHADOW) { value, records -> applyTextShadow(value, Shadow.readTextShadows(records)) }
  }

  private fun applyBackdropFilter() {
    val view = node.view as? android.view.View ?: return

    // Never apply the filter to the view's OWN output: that blurs children.
    if (android.os.Build.VERSION.SDK_INT >= 31) view.setRenderEffect(null)

    val filter = mBackdropFilter
    if (filter == null || filter.filters.isEmpty()) {
      mBackdropHelper?.disable()
      mBackdropHelper = null
      view.invalidate()
      return
    }

    val helper = mBackdropHelper ?: BackdropHelper(view).also { mBackdropHelper = it }
    helper.setFilter(filter)
    view.invalidate()
  }

  // ============================================================
  // mask-* (string-based; see Mask.kt)
  // ============================================================
  // Created on first write, so unmasked elements pay one null check per draw.
  internal var mMask: Mask? = null

  internal fun ensureMask(): Mask = mMask ?: Mask(this).also { mMask = it }

  internal fun applyCompiledMask(fields: Array<String>) {
    val stride = CssMaskWriteRecord.STRIDE
    if (fields.size % stride != 0) return
    val clipSlot = MaskInputRecord.STRIDE + NineSliceInputRecord.STRIDE
    var mask: Mask? = null
    var clip: String? = null
    for (offset in fields.indices step stride) {
      val slot = fields[offset + CssMaskWriteRecord.SLOT].toIntOrNull() ?: continue
      val value = fields[offset + CssMaskWriteRecord.VALUE]
      if (slot == clipSlot) {
        clip = value
      } else if (slot in 0 until clipSlot) {
        if (mMask == null && value.isBlank()) continue
        val target = mask ?: ensureMask()
        target.setBase(slot, value)
        mask = target
      }
    }
    val clipTarget = clip?.takeIf { mClipPath != null || it.isNotBlank() }?.let { value ->
      ensureClipPath().also { it.setBase(value) }
    }
    // Both changed() methods schedule the same draw and parent shadow refresh.
    if (mask != null) mask.changed() else clipTarget?.changed()
  }

  private fun setMaskLonghand(index: Int, value: String) {
    if (mMask == null && value.isBlank()) return
    ensureMask().set(index, value)
  }

  // <style-keys:mask-accessors> generated from tools/scripts/style-keys/style-keys.schema
  var maskImage: String
    get() = mMask?.get(Mask.IMAGE) ?: ""
    set(value) = setMaskLonghand(Mask.IMAGE, value)

  var maskSize: String
    get() = mMask?.get(Mask.SIZE) ?: ""
    set(value) = setMaskLonghand(Mask.SIZE, value)

  var maskPosition: String
    get() = mMask?.get(Mask.POSITION) ?: ""
    set(value) = setMaskLonghand(Mask.POSITION, value)

  var maskRepeat: String
    get() = mMask?.get(Mask.REPEAT) ?: ""
    set(value) = setMaskLonghand(Mask.REPEAT, value)

  var maskOrigin: String
    get() = mMask?.get(Mask.ORIGIN) ?: ""
    set(value) = setMaskLonghand(Mask.ORIGIN, value)

  var maskClip: String
    get() = mMask?.get(Mask.CLIP) ?: ""
    set(value) = setMaskLonghand(Mask.CLIP, value)

  var maskMode: String
    get() = mMask?.get(Mask.MODE) ?: ""
    set(value) = setMaskLonghand(Mask.MODE, value)

  var maskComposite: String
    get() = mMask?.get(Mask.COMPOSITE) ?: ""
    set(value) = setMaskLonghand(Mask.COMPOSITE, value)

  var clipPath: String
    get() = mClipPath?.get() ?: ""
    set(value) = setClipPathValue(value)

  var maskBorderSource: String
    get() = mMask?.get(Mask.BORDER_SOURCE) ?: ""
    set(value) = setMaskLonghand(Mask.BORDER_SOURCE, value)

  var maskBorderSlice: String
    get() = mMask?.get(Mask.BORDER_SLICE) ?: ""
    set(value) = setMaskLonghand(Mask.BORDER_SLICE, value)

  var maskBorderWidth: String
    get() = mMask?.get(Mask.BORDER_WIDTH) ?: ""
    set(value) = setMaskLonghand(Mask.BORDER_WIDTH, value)

  var maskBorderOutset: String
    get() = mMask?.get(Mask.BORDER_OUTSET) ?: ""
    set(value) = setMaskLonghand(Mask.BORDER_OUTSET, value)

  var maskBorderRepeat: String
    get() = mMask?.get(Mask.BORDER_REPEAT) ?: ""
    set(value) = setMaskLonghand(Mask.BORDER_REPEAT, value)

  var maskBorderMode: String
    get() = mMask?.get(Mask.BORDER_MODE) ?: ""
    set(value) = setMaskLonghand(Mask.BORDER_MODE, value)
  // </style-keys:mask-accessors>

  // ============================================================
  // clip-path (string-based; see ClipPath.kt)
  // ============================================================
  // Created on first write, so unclipped elements pay one null check per draw.
  internal var mClipPath: ClipPath? = null

  internal fun ensureClipPath(): ClipPath = mClipPath ?: ClipPath(this).also { mClipPath = it }

  private fun setClipPathValue(value: String) {
    if (mClipPath == null && value.isBlank()) return
    ensureClipPath().set(value)
  }

  fun setBorderStyle(value: BorderStyle) {
    borderStyle = Rect.uniform(value)
  }

  fun setBorderColor(value: Int) {
    borderColor = Rect.uniform(value)
  }












  internal val isSizeAuto: Boolean
    get() {
      return values.get(StyleKeys.WIDTH_TYPE) == Constants.ZERO
        && values.get(StyleKeys.HEIGHT_TYPE) == Constants.ZERO
    }

  internal fun setSize(width: Int, height: Int) {
    val points = Dimension.Kind.Points.value
    writeSize(points, width.toFloat(), points, height.toFloat())
  }


  fun setSizePoints(width: Float, height: Float) {
    val points = Dimension.Kind.Points.value
    writeSize(points, width, points, height)
  }










  fun setGap(widthValue: Float, widthType: Byte, heightValue: Float, heightType: Byte) {
    if (LengthPercentage.isValid(widthType, widthValue) && LengthPercentage.isValid(
        heightType,
        heightValue
      )
    ) {
      writeGap(widthType, widthValue, heightType, heightValue)
    }
  }



  /* legacy helpers */
  fun setGridAutoRows(value: Array<MinMax>) {
    gridAutoRows = value.cssValue
  }

  fun setGridAutoColumns(value: Array<MinMax>) {
    gridAutoColumns = value.cssValue
  }

  fun setGridColumn(value: Line<GridPlacement>) {
    gridColumn = value.cssValue
  }

  fun setGridColumnStart(value: GridPlacement) {
    gridColumnStart = value.cssValue
  }

  fun setGridRow(value: Line<GridPlacement>) {
    gridRow = value.cssValue
  }

  fun setGridTemplateRows(value: Array<GridTemplate>) {
    gridTemplateRows = value.cssValue
  }

  fun setGridTemplateColumns(value: Array<GridTemplate>) {
    gridTemplateColumns = value.cssValue
  }

  /* legacy helpers */

  private var gridCssCache: MutableMap<Int, String>? = null
  private var gridWrites: MutableList<String>? = null

  private inline fun readGridCss(property: Int, read: () -> String): String {
    val cache = gridCssCache ?: mutableMapOf<Int, String>().also { gridCssCache = it }
    return cache.getOrPut(property, read)
  }

  private fun queueGridCss(property: Int, value: String) {
    val writes = gridWrites ?: mutableListOf<String>().also { gridWrites = it }
    writes.add(property.toString())
    writes.add(value.replace('\u0000', '\uFFFD'))
    if (!inBatch) {
      node.dirty()
      updateNativeStyle()
    }
  }

  internal fun applyLayoutLength(property: String, value: String, flags: Int = 0): Boolean {
    val mason = node.mason
    if (node.isPlaceholder || mason.inCompute) return false
    if (flags == 0) prepareMut()
    val applied = nativeApplyLayoutLength(mason.nativePtr, node.nativePtr, flags, property, value,
      resolvedFontSize, mason.rootFontSize, mason.viewportWidth, mason.viewportHeight)
    if (applied && flags != 0) node.pseudoLayoutLengthChanged(flags)
    return applied
  }

  internal fun layoutLengthCss(property: String, flags: Int = 0): String? =
    nativeLayoutLengthCss(node.mason.nativePtr, node.nativePtr, flags, property)

  private fun flushGridCss(): Boolean {
    val writes = gridWrites ?: return false
    gridWrites = null
    gridCssCache?.clear()
    val mason = node.mason
    nativeApplyGridWrites(mason.nativePtr, node.nativePtr, writes.joinToString("\u0000").toByteArray(),
      resolvedFontSize, mason.rootFontSize, mason.viewportWidth, mason.viewportHeight)
    return true
  }

  // <style-keys:grid-accessors>
  var gridAutoRows: String
    get() = readGridCss(0) { nativeGetGridAutoRows(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(0, value)

  var gridAutoColumns: String
    get() = readGridCss(1) { nativeGetGridAutoColumns(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(1, value)

  var gridColumn: String
    get() = readGridCss(2) { nativeGetGridColumn(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(2, value)

  var gridColumnStart: String
    get() = readGridCss(3) { nativeGetGridColumnStart(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(3, value)

  var gridColumnEnd: String
    get() = readGridCss(4) { nativeGetGridColumnEnd(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(4, value)

  var gridRow: String
    get() = readGridCss(5) { nativeGetGridRow(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(5, value)

  var gridRowStart: String
    get() = readGridCss(6) { nativeGetGridRowStart(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(6, value)

  var gridRowEnd: String
    get() = readGridCss(7) { nativeGetGridRowEnd(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(7, value)

  var gridTemplateRows: String
    get() = readGridCss(8) { nativeGetGridTemplateRows(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(8, value)

  var gridTemplateColumns: String
    get() = readGridCss(9) { nativeGetGridTemplateColumns(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(9, value)

  var gridArea: String
    get() = readGridCss(10) { nativeGetGridArea(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(10, value)

  var gridTemplateAreas: String
    get() = readGridCss(11) { nativeGetGridTemplateAreas(node.mason.nativePtr, node.nativePtr) ?: "" }
    set(value) = queueGridCss(11, value)
  // </style-keys:grid-accessors>

  internal fun updateNativeStyle() {
    if (node.nativePtr == 0L) {
      return
    }

    // During compute Rust holds the lock — defer native style sync to avoid deadlock
    if (node.mason.inCompute) {
      return
    }

    // Mark the style as initialized so ViewUtils.render() draws
    // backgrounds, borders, etc. This is the first point where TS-driven
    // style writes reach Kotlin (via syncStyle → setStateFromHalves).
    val firstSync = !isValueInitialized
    isValueInitialized = true

    updateTextStyle()

    val stateKeys = StateKeys(isDirty, isDirtyHigh)
    // A first sync counts too: until then display reads as unset, whatever its value.
    if (firstSync || stateKeys.hasFlag(StateKeys.DISPLAY) || stateKeys.hasFlag(StateKeys.DISPLAY_MODE) ||
      stateKeys.hasFlag(StateKeys.POSITION) || stateKeys.hasFlag(StateKeys.FLOAT)
    ) {
      node.onFlowTypeChanged(firstSync)
    }
    val directionDirty = stateKeys.hasFlag(StateKeys.DIRECTION)
    if (directionDirty) {
      val androidView = node.view as? android.view.View
      androidView?.layoutDirection = toAndroidLayoutDirection(direction)
    }

    val zIndexChanged = stateKeys.hasFlag(StateKeys.Z_INDEX)

    if (stateKeys.hasFlag(StateKeys.BORDER_PAINT)) {
      invalidateBorderRenderer()
    }

    // Dispatch caret-color to input views
    val caretColorDirty = stateKeys.hasFlag(StateKeys.CARET_COLOR)
    if (caretColorDirty) {
      notifyTextStyleChanged(StateKeys.CARET_COLOR)
    }

    if (stateKeys.hasFlag(StateKeys.TRANSFORM_ORIGIN)) {
      (node.view as? View)?.takeIf { it is Element }?.let { applyPivot(it, hasCssTransform, reset = true) }
    }

    if (stateKeys.hasFlag(StateKeys.OBJECT_PAINT)) {
      (node.view as? android.widget.ImageView)?.invalidate()
    }

    val gridChanged = flushGridCss()
    if (gridChanged || !isDirtyEmpty()) {
      // Purely-visual writes (colors, border-style/-radius, shadows,
      // decorations, list-style-type, object-fit, z-index, caret-color,
      // object-position, ...) can't change this node's contribution to Taffy
      // layout — their own targeted repaint already happened above (border
      // renderer, caret/object-position dispatch) or happens via the fallback
      // View.invalidate() below, so skip the native recompute + relayout.
      val layoutAffecting = gridChanged || stateKeys.hasFlag(StateKeys.LAYOUT_MASK)

      if (zIndexChanged) {
        (node.parent?.view as? org.nativescript.mason.masonkit.View)?.onChildZIndexChanged()
      }

      // Rust sets its float/scroll/writing-mode tree hints only in a native mark, so this one must not dedup.
      if (StateKeys.hasFlag(isDirty, isDirtyHigh, StateKeys.TREE_HINTS)) node.dirty(force = true)
      resetState()
      if (layoutAffecting) {
        (node.view as? Element)?.invalidateLayout()
      }
      if (gridChanged || !layoutAffecting) {
        (node.view as? View)?.invalidate()
      }
    }
  }

  fun getNativeMargins(): Rect<LengthPercentageAuto> {

    var marginLeft: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginRight: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginTop: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginBottom: LengthPercentageAuto = LengthPercentageAuto.Auto

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
    )?.let {
      marginLeft = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
    )?.let {
      marginRight = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
    )?.let {
      marginTop = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_BOTTOM_TYPE), values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
    )?.let {
      marginBottom = it
    }

    return Rect(marginTop, marginRight, marginBottom, marginLeft)
  }

  fun getNativeSize(): Size<Dimension> {
    val width = Dimension.fromTypeValue(
      values.get(StyleKeys.WIDTH_TYPE), values.getFloat(StyleKeys.WIDTH_VALUE)
    )
    val height = Dimension.fromTypeValue(
      values.get(StyleKeys.HEIGHT_TYPE), values.getFloat(StyleKeys.HEIGHT_VALUE)
    )
    return Size(width as Dimension, height as Dimension)
  }

  override fun toString(): String {
    var ret = "(MasonStyle)("
    ret += "display: ${display.cssValue}, \n"
    ret += "position: ${position.cssValue}, \n"
    ret += "inset: ${inset.cssValue}, \n"
    ret += "flexDirection: ${flexDirection.cssValue}, \n"
    ret += "flexWrap: ${flexWrap.cssValue}, \n"
    ret += "overflow: ${overflow.cssValue}, \n"
    ret += "alignItems: ${alignItems.cssValue}, \n"
    ret += "alignSelf: ${alignSelf.cssValue}, \n"
    ret += "alignContent: ${alignContent.cssValue}, \n"
    ret += "justifyItems: ${justifyItems.cssValue}, \n"
    ret += "justifySelf: ${justifySelf.cssValue}, \n"
    ret += "justifyContent: ${justifyContent.cssValue}, \n"
    ret += "margin: ${margin.cssValue}, \n"
    ret += "padding: ${padding.cssValue}, \n"
    ret += "border: ${borderWidth.cssValue}, \n"
    ret += "gap: ${gap.cssValue}, \n"
    ret += "flexGrow: ${flexGrow}, \n"
    ret += "flexShrink: ${flexShrink}, \n"
    ret += "flexBasis: ${flexBasis.cssValue}, \n"
    ret += "size: ${size.cssValue}, \n"
    ret += "minSize: ${minSize.cssValue}, \n"
    ret += "maxSize: ${maxSize.cssValue}, \n"
    ret += "aspectRatio: ${
      if (aspectRatio == null) {
        "undefined"
      } else {
        aspectRatio
      }
    }, \n"
    ret += "gridAutoRows: $gridAutoRows, \n"
    ret += "gridAutoColumns: $gridAutoColumns, \n"
    ret += "gridColumn: $gridColumn, \n"
    ret += "gridRow: $gridRow, \n"
    ret += "gridTemplateRows: $gridTemplateRows, \n"
    ret += "gridTemplateColumns: $gridTemplateColumns \n"

    ret += "overflowX: ${overflowX.cssValue} \n"
    ret += "overflowY: ${overflowY.cssValue} \n"
    ret += "scrollBarWidth: $scrollBarWidth \n"
    ret += "textAlign: ${textAlign.cssValue} \n"
    ret += "boxSizing: ${boxSizing.cssValue} \n"
    ret += ")"

    return ret
  }


  /* Resolved Styles */

  private val parentStyleWithValues: Style?
    get() {
      var parent = node.parent
      while (parent != null) {
        // Check if parent has text values initialized
        if (parent.style.isValueInitialized) {
          return parent.style
        }
        parent = parent.parent
      }
      return null
    }

  // Resolved text attributes cached for one TextDefaultAttributes.batch.
  internal var batchAttrs: TextDefaultAttributes? = null
  internal var batchAttrsStamp = 0

  // Inherited values read while measuring, memoized for one batch (a bit per value).
  private var memoStamp = 0
  private var memoMask = 0
  private var memoWritingMode: Byte = 0
  private var memoUnicodeBidi: Byte = 0
  private var memoHyphens: Byte = 0
  private var memoTextOrientation: Byte = 0
  private var memoTextCombine: Byte = 0
  private var memoTextSpacingTrim: Byte = 0
  private var memoTextIndent = 0f
  private var memoTextIndentType: Byte = 0
  private var memoLineClamp = 0
  private lateinit var memoTextAlign: TextAlign

  private fun memoHas(bit: Int): Boolean {
    val stamp = TextDefaultAttributes.activeBatchStamp
    if (stamp == 0) return false
    if (stamp != memoStamp) {
      memoStamp = stamp
      memoMask = 0
      return false
    }
    return memoMask and bit != 0
  }

  private fun memoPut(bit: Int) {
    val stamp = TextDefaultAttributes.activeBatchStamp
    if (stamp != 0 && stamp == memoStamp) memoMask = memoMask or bit
  }

  // Parent's style for inherited text properties. Must NOT gate on
  // isValueInitialized: that flag lags JS style writes by a microtask, but
  // the underlying buffer is already correct, so gating on it can find no
  // "initialized" ancestor and silently fall back to unset (0) values.
  private val parentStyleWithTextValues: Style?
    get() = node.parent?.style

  // Store the resolved FontFace - cached and invalidated when font properties change
  internal val resolvedFontFace: FontFace
    get() {
      if (!_resolvedFontFaceDirty && _cachedResolvedFontFace != null) {
        return _cachedResolvedFontFace!!.also { ensureResolvedFontLoaded(it) }
      }

      val familyState = values.get(StyleKeys.FONT_FAMILY_STATE)
      val weightState = values.get(StyleKeys.FONT_WEIGHT_STATE)
      val styleState = values.get(StyleKeys.FONT_STYLE_STATE)

      // If all font properties are inherited, use parent's font face
      val parentFace = parentStyleWithTextValues?.resolvedFontFace
      if (familyState == StyleState.INHERIT && weightState == StyleState.INHERIT && styleState == StyleState.INHERIT && (parentFace != null || _font != null)) {
        val result = parentFace ?: font
        _cachedResolvedFontFace = result
        _resolvedFontFaceDirty = false
        ensureResolvedFontLoaded(result)
        return result
      }

      // If family is inherited but weight/style are set, need to create a new FontFace
      // Reading `font` would build a private FontFace per node; the shared cache covers plain descriptors.
      val ownFamily = _font?.fontFamily ?: DEFAULT_FONT_FAMILY
      val baseFamily = if (familyState == StyleState.INHERIT) {
        parentFace?.fontFamily ?: ownFamily
      } else {
        ownFamily
      }

      val resolvedWeight = if (weightState == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontWeight
          ?: FontWeight.from(values.getInt(StyleKeys.FONT_WEIGHT))
      } else {
        FontWeight.from(values.getInt(StyleKeys.FONT_WEIGHT))
      }

      val resolvedStyle = if (styleState == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontStyle ?: fontStyle
      } else {
        fontStyle
      }

      // If everything matches current font, return it
      val own = _font
      if (own != null && own.fontFamily == baseFamily && own.weight == resolvedWeight && own.style == resolvedStyle) {
        _cachedResolvedFontFace = font
        _resolvedFontFaceDirty = false
        ensureResolvedFontLoaded(font)
        return font
      }

      // Nothing here has customized feature-settings/kerning/etc. yet, so this
      // (family, weight, style) descriptor can safely be resolved from the
      // shared cache instead of paying its own private load() round-trip.
      val view = node.view as? View
      val resolvedFont = if (view != null) {
        sharedFontFace(baseFamily, resolvedWeight, resolvedStyle, view.context) {
          view.post {
            fontDirty = true
            // Flattened spans were built into the parent before this face loaded.
            (node.view as? TextContainer)?.engine?.invalidateInlineSegments()
            val metricsChanged = syncFontMetrics()
            if (metricsChanged) {
              node.dirty()
              view.invalidate()
              view.requestLayout()
            }
          }
        }.also {
          if (it.font != null) fontDirty = true
        }
      } else {
        FontFace(baseFamily, AppFonts.resolve(baseFamily)).apply {
          weight = resolvedWeight
          style = resolvedStyle
        }
      }

      _cachedResolvedFontFace = resolvedFont
      _resolvedFontFaceDirty = false
      ensureResolvedFontLoaded(resolvedFont)
      return resolvedFont
    }

  // Resolve an Int property with pseudo-state overlay.
  // Uses PSEUDO_SET_MASK bitmask to determine if the property was explicitly set
  // in the pseudo buffer (pseudo buffers are cloned from base, so state bytes alone
  // are unreliable).
  internal fun resolvePseudoInt(valueKey: Int, stateKey: Int, base: Int, key: StateKeys): Int {
    val mask = node.pseudoMask
    if (mask == 0) return base
    var result = base
    for (state in PSEUDO_CSS_ORDER) {
      if (mask and state.mask != 0) {
        val buf = node.getPseudoBuffer(state.mask)
        if (buf.capacity() >= StyleKeys.PSEUDO_SET_MASK_HIGH + 8) {
          val setLow = buf.getLong(StyleKeys.PSEUDO_SET_MASK_LOW)
          val setHigh = buf.getLong(StyleKeys.PSEUDO_SET_MASK_HIGH)
          if ((setLow and key.low) != 0L || (setHigh and key.high) != 0L) {
            result = buf.getInt(valueKey)
          }
        }
      }
    }
    return result
  }

  // Resolve a Byte property with pseudo-state overlay.
  private fun resolvePseudoByte(valueKey: Int, stateKey: Int, base: Byte, key: StateKeys): Byte {
    val mask = node.pseudoMask
    if (mask == 0) return base
    var result = base
    for (state in PSEUDO_CSS_ORDER) {
      if (mask and state.mask != 0) {
        val buf = node.getPseudoBuffer(state.mask)
        if (buf.capacity() >= StyleKeys.PSEUDO_SET_MASK_HIGH + 8) {
          val setLow = buf.getLong(StyleKeys.PSEUDO_SET_MASK_LOW)
          val setHigh = buf.getLong(StyleKeys.PSEUDO_SET_MASK_HIGH)
          if ((setLow and key.low) != 0L || (setHigh and key.high) != 0L) {
            result = buf.get(valueKey)
          }
        }
      }
    }
    return result
  }

  // Resolve a Float property with pseudo-state overlay.
  private fun resolvePseudoFloat(valueKey: Int, stateKey: Int, base: Float, key: StateKeys): Float {
    val mask = node.pseudoMask
    if (mask == 0) return base
    var result = base
    for (state in PSEUDO_CSS_ORDER) {
      if (mask and state.mask != 0) {
        val buf = node.getPseudoBuffer(state.mask)
        if (buf.capacity() >= StyleKeys.PSEUDO_SET_MASK_HIGH + 8) {
          val setLow = buf.getLong(StyleKeys.PSEUDO_SET_MASK_LOW)
          val setHigh = buf.getLong(StyleKeys.PSEUDO_SET_MASK_HIGH)
          if ((setLow and key.low) != 0L || (setHigh and key.high) != 0L) {
            result = buf.getFloat(valueKey)
          }
        }
      }
    }
    return result
  }

  /**
   * Generic pseudo resolution using the bitmask. Works for ANY property
   * (layout or visual) — checks the PSEUDO_SET_MASK bits in the pseudo buffer.
   * Use this for properties that don't have _STATE bytes.
   */
  internal inline fun <T> resolvePseudo(key: StateKeys, base: T, getter: (ByteBuffer) -> T): T {
    val mask = node.pseudoMask
    if (mask == 0) return base
    var result = base
    for (state in PSEUDO_CSS_ORDER) {
      if (mask and state.mask != 0) {
        val buf = node.getPseudoBuffer(state.mask)
        if (buf.capacity() >= StyleKeys.PSEUDO_SET_MASK_HIGH + 8) {
          val setLow = buf.getLong(StyleKeys.PSEUDO_SET_MASK_LOW)
          val setHigh = buf.getLong(StyleKeys.PSEUDO_SET_MASK_HIGH)
          if ((setLow and key.low) != 0L || (setHigh and key.high) != 0L) {
            result = getter(buf)
          }
        }
      }
    }
    return result
  }

  // Resolved properties that handle inheritance
  internal val resolvedColor: Int
    get() {
      val state = values.get(StyleKeys.FONT_COLOR_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedColor ?: values.getInt(StyleKeys.FONT_COLOR)
      } else {
        values.getInt(StyleKeys.FONT_COLOR)
      }
      return resolvePseudoInt(
        StyleKeys.FONT_COLOR,
        StyleKeys.FONT_COLOR_STATE,
        base,
        StateKeys.FONT_COLOR
      )
    }

  internal val resolvedFontSize: Float
    get() {
      val state = values.get(StyleKeys.FONT_SIZE_STATE)
      val type = values.get(StyleKeys.FONT_SIZE_TYPE)
      // PERCENT == 1
      if (type == StyleState.SET) {
        val parentFontSize =
          node.parent?.takeIf { it.style.isValueInitialized }?.style?.resolvedFontSize
            ?: Constants.DEFAULT_FONT_SIZE
        val base = resolvePercentageFontSize(parentFontSize)
        return resolvePseudoFloat(
          StyleKeys.FONT_SIZE,
          StyleKeys.FONT_SIZE_STATE,
          base,
          StateKeys.FONT_SIZE
        )
      }
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontSize ?: values.getFloat(StyleKeys.FONT_SIZE)
      } else {
        values.getFloat(StyleKeys.FONT_SIZE)
      }
      return resolvePseudoFloat(
        StyleKeys.FONT_SIZE,
        StyleKeys.FONT_SIZE_STATE,
        base,
        StateKeys.FONT_SIZE
      )
    }

  internal fun resolvePercentageFontSize(parentFontSize: Float): Float {
    val percent = values.getFloat(StyleKeys.FONT_SIZE) / 100f
    return (parentFontSize * percent).coerceAtLeast(0f)
  }

  internal val resolvedFontWeight: FontWeight
    get() {
      val state = values.get(StyleKeys.FONT_WEIGHT_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontWeight
          ?: FontWeight.from(values.getInt(StyleKeys.FONT_WEIGHT))
      } else {
        FontWeight.from(values.getInt(StyleKeys.FONT_WEIGHT))
      }
      val pseudoRaw = resolvePseudoInt(
        StyleKeys.FONT_WEIGHT,
        StyleKeys.FONT_WEIGHT_STATE,
        values.getInt(StyleKeys.FONT_WEIGHT),
        StateKeys.FONT_WEIGHT
      )
      return if (node.pseudoMask != 0 && pseudoRaw != values.getInt(StyleKeys.FONT_WEIGHT)) {
        FontWeight.from(pseudoRaw)
      } else {
        base
      }
    }

  internal val resolvedFontStyle: FontStyle
    get() {
      val state = values.get(StyleKeys.FONT_STYLE_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontStyle ?: fontStyle
      } else {
        fontStyle
      }
      return resolvePseudo(StateKeys.FONT_STYLE, base, ::readFontStyle)
    }

  val resolvedBackgroundColor: Int
    get() {
      // background-color is NOT inherited in CSS - each element has its own.
      val state = values.get(StyleKeys.BACKGROUND_COLOR_STATE)
      val base = if (state == StyleState.SET) {
        values.getInt(StyleKeys.BACKGROUND_COLOR)
      } else {
        0 // transparent - do not inherit from parent
      }
      return resolvePseudoInt(
        StyleKeys.BACKGROUND_COLOR,
        StyleKeys.BACKGROUND_COLOR_STATE,
        base,
        StateKeys.BACKGROUND_COLOR
      )
    }

  internal val resolvedDecorationLine: Styles.DecorationLine
    get() {
      val state = values.get(StyleKeys.DECORATION_LINE_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationLine ?: Styles.DecorationLine.from(
          values.get(StyleKeys.DECORATION_LINE)
        )
      } else {
        Styles.DecorationLine.from(values.get(StyleKeys.DECORATION_LINE))
      }
      val pseudoRaw = resolvePseudoByte(
        StyleKeys.DECORATION_LINE,
        StyleKeys.DECORATION_LINE_STATE,
        values.get(StyleKeys.DECORATION_LINE),
        StateKeys.DECORATION_LINE
      )
      return if (node.pseudoMask != 0 && pseudoRaw != values.get(StyleKeys.DECORATION_LINE)) {
        Styles.DecorationLine.from(pseudoRaw)
      } else {
        base
      }
    }

  internal val resolvedDecorationColor: Int
    get() {
      val state = values.get(StyleKeys.DECORATION_COLOR_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationColor
          ?: values.getInt(StyleKeys.DECORATION_COLOR)
      } else {
        values.getInt(StyleKeys.DECORATION_COLOR)
      }
      return resolvePseudoInt(
        StyleKeys.DECORATION_COLOR,
        StyleKeys.DECORATION_COLOR_STATE,
        base,
        StateKeys.DECORATION_COLOR
      )
    }

  internal val resolvedDecorationStyle: Styles.DecorationStyle
    get() {
      val state = values.get(StyleKeys.DECORATION_STYLE_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationStyle ?: Styles.DecorationStyle.from(
          values.get(StyleKeys.DECORATION_STYLE)
        )
      } else {
        Styles.DecorationStyle.from(values.get(StyleKeys.DECORATION_STYLE))
      }
      val pseudoRaw = resolvePseudoByte(
        StyleKeys.DECORATION_STYLE,
        StyleKeys.DECORATION_STYLE_STATE,
        values.get(StyleKeys.DECORATION_STYLE),
        StateKeys.DECORATION_STYLE
      )
      return if (node.pseudoMask != 0 && pseudoRaw != values.get(StyleKeys.DECORATION_STYLE)) {
        Styles.DecorationStyle.from(pseudoRaw)
      } else {
        base
      }
    }


  internal val resolvedDecorationThickness: Float
    get() {
      val state = values.get(StyleKeys.DECORATION_THICKNESS_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationThickness
          ?: values.getFloat(StyleKeys.DECORATION_THICKNESS)
      } else {
        values.getFloat(StyleKeys.DECORATION_THICKNESS)
      }
      return resolvePseudoFloat(
        StyleKeys.DECORATION_THICKNESS,
        StyleKeys.DECORATION_THICKNESS_STATE,
        base,
        StateKeys.DECORATION_THICKNESS
      )
    }


  internal val resolvedLetterSpacing: Float
    get() {
      val state = values.get(StyleKeys.LETTER_SPACING_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedLetterSpacing
          ?: values.getFloat(StyleKeys.LETTER_SPACING)
      } else {
        values.getFloat(StyleKeys.LETTER_SPACING)
      }
      return resolvePseudoFloat(
        StyleKeys.LETTER_SPACING,
        StyleKeys.LETTER_SPACING_STATE,
        base,
        StateKeys.LETTER_SPACING
      )
    }

  internal val resolvedFontVariantNumeric: Int
    get() {
      val state = values.get(StyleKeys.FONT_VARIANT_NUMERIC_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontVariantNumeric?.toByte()
          ?: values.get(StyleKeys.FONT_VARIANT_NUMERIC)
      } else {
        values.get(StyleKeys.FONT_VARIANT_NUMERIC)
      }
      return resolvePseudoByte(
        StyleKeys.FONT_VARIANT_NUMERIC,
        StyleKeys.FONT_VARIANT_NUMERIC_STATE,
        base,
        StateKeys.FONT_VARIANT_NUMERIC
      ).toInt() and 0xFF
    }

  internal val resolvedTextWrap: TextWrap
    get() {
      val state = values.get(StyleKeys.TEXT_WRAP_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextWrap ?: TextWrap.from(
          values.get(
            StyleKeys.TEXT_WRAP
          )
        )
      } else {
        TextWrap.from(values.get(StyleKeys.TEXT_WRAP))
      }
      val pseudoRaw = resolvePseudoByte(
        StyleKeys.TEXT_WRAP,
        StyleKeys.TEXT_WRAP_STATE,
        values.get(StyleKeys.TEXT_WRAP),
        StateKeys.TEXT_WRAP
      )
      return if (node.pseudoMask != 0 && pseudoRaw != values.get(StyleKeys.TEXT_WRAP)) {
        TextWrap.from(pseudoRaw)
      } else {
        base
      }
    }

  internal val resolvedWhiteSpace: Styles.WhiteSpace
    get() {
      val state = values.get(StyleKeys.WHITE_SPACE_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedWhiteSpace
          ?: Styles.WhiteSpace.from(values.get(StyleKeys.WHITE_SPACE))
      } else {
        Styles.WhiteSpace.from(values.get(StyleKeys.WHITE_SPACE))
      }
      val pseudoRaw = resolvePseudoByte(
        StyleKeys.WHITE_SPACE,
        StyleKeys.WHITE_SPACE_STATE,
        values.get(StyleKeys.WHITE_SPACE),
        StateKeys.WHITE_SPACE
      )
      return if (node.pseudoMask != 0 && pseudoRaw != values.get(StyleKeys.WHITE_SPACE)) {
        Styles.WhiteSpace.from(pseudoRaw)
      } else {
        base
      }
    }

  internal val resolvedTextTransform: Styles.TextTransform
    get() {
      val state = values.get(StyleKeys.TEXT_TRANSFORM_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextTransform
          ?: Styles.TextTransform.from(values.get(StyleKeys.TEXT_TRANSFORM))
      } else {
        Styles.TextTransform.from(values.get(StyleKeys.TEXT_TRANSFORM))
      }
      val pseudoRaw = resolvePseudoByte(
        StyleKeys.TEXT_TRANSFORM,
        StyleKeys.TEXT_TRANSFORM_STATE,
        values.get(StyleKeys.TEXT_TRANSFORM),
        StateKeys.TEXT_TRANSFORM
      )
      return if (node.pseudoMask != 0 && pseudoRaw != values.get(StyleKeys.TEXT_TRANSFORM)) {
        Styles.TextTransform.from(pseudoRaw)
      } else {
        base
      }
    }

  internal val resolvedTextAlign: TextAlign
    get() {
      if (memoHas(MEMO_TEXT_ALIGN)) return memoTextAlign
      val state = values.get(StyleKeys.TEXT_ALIGN_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextAlign ?: TextAlign.from(
          values.get(
            StyleKeys.TEXT_ALIGN
          )
        )
      } else {
        TextAlign.from(values.get(StyleKeys.TEXT_ALIGN))
      }
      val pseudoRaw = resolvePseudoByte(
        StyleKeys.TEXT_ALIGN,
        StyleKeys.TEXT_ALIGN_STATE,
        values.get(StyleKeys.TEXT_ALIGN),
        StateKeys.TEXT_ALIGN
      )
      val value = if (node.pseudoMask != 0 && pseudoRaw != values.get(StyleKeys.TEXT_ALIGN)) {
        TextAlign.from(pseudoRaw)
      } else {
        base
      }
      memoTextAlign = value
      memoPut(MEMO_TEXT_ALIGN)
      return value
    }

  internal val resolvedTextJustify: TextJustify
    get() {
      val state = values.get(StyleKeys.TEXT_JUSTIFY_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextJustify ?: TextJustify.from(
          values.get(
            StyleKeys.TEXT_JUSTIFY
          )
        )
      } else {
        TextJustify.from(values.get(StyleKeys.TEXT_JUSTIFY))
      }
      val pseudoRaw = resolvePseudoByte(
        StyleKeys.TEXT_JUSTIFY,
        StyleKeys.TEXT_JUSTIFY_STATE,
        values.get(StyleKeys.TEXT_JUSTIFY),
        StateKeys.TEXT_JUSTIFY
      )
      return if (node.pseudoMask != 0 && pseudoRaw != values.get(StyleKeys.TEXT_JUSTIFY)) {
        TextJustify.from(pseudoRaw)
      } else {
        base
      }
    }

  internal val resolvedLineHeight: Float
    get() {
      val state = values.get(StyleKeys.LINE_HEIGHT_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedLineHeight
          ?: values.getFloat(StyleKeys.LINE_HEIGHT)
      } else {
        values.getFloat(StyleKeys.LINE_HEIGHT)
      }
      return resolvePseudoFloat(
        StyleKeys.LINE_HEIGHT,
        StyleKeys.LINE_HEIGHT_STATE,
        base,
        StateKeys.LINE_HEIGHT
      )
    }

  internal val resolvedLineHeightType: Byte
    get() {
      val state = values.get(StyleKeys.LINE_HEIGHT_STATE)
      val base = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedLineHeightType
          ?: values.get(StyleKeys.LINE_HEIGHT_TYPE)
      } else {
        values.get(StyleKeys.LINE_HEIGHT_TYPE)
      }
      return resolvePseudoByte(
        StyleKeys.LINE_HEIGHT_TYPE,
        StyleKeys.LINE_HEIGHT_STATE,
        base,
        StateKeys.LINE_HEIGHT
      )
    }


  internal val resolvedTextShadow: List<Shadow.TextShadow>
    get() {
      val state = values.get(StyleKeys.TEXT_SHADOW_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextShadow ?: textShadows
      } else {
        textShadows
      }
    }

  // Reset methods
  fun resetFontFamilyToInherit() {
    prepareMut()
    values.put(StyleKeys.FONT_FAMILY_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.FONT_FAMILY)
  }

  fun resetFontWeightToInherit() {
    prepareMut()
    values.put(StyleKeys.FONT_WEIGHT_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.FONT_WEIGHT)
  }

  fun resetFontStyleToInherit() {
    prepareMut()
    values.put(StyleKeys.FONT_STYLE_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.FONT_STYLE)
  }

  internal val resolvedListStyleType: ListStyleType
    get() {
      return parentStyleWithTextValues?.resolvedListStyleType ?: ListStyleType.from(
        values.get(
          StyleKeys.LIST_STYLE_TYPE
        )
      )
    }

  internal val resolvedListStyleTypeRaw: Byte
    get() {
      return parentStyleWithTextValues?.resolvedListStyleTypeRaw ?: values.get(
        StyleKeys.LIST_STYLE_TYPE
      )
    }

  internal val resolvedListStylePosition: ListStylePosition
    get() {
      return parentStyleWithTextValues?.resolvedListStylePosition ?: ListStylePosition.from(
        values.get(StyleKeys.LIST_STYLE_POSITION)
      )
    }

  // caret-color inherits, but `auto` (the initial value) inherits as `auto` and means this element's
  // own currentColor - not the color of whichever ancestor the inheritance chain ends at.
  internal val resolvedCaretColor: Int
    get() = explicitCaretColor ?: resolvedColor

  // The nearest explicit caret-color, here or inherited. The JS setter stores `auto` as SET with 0.
  private val explicitCaretColor: Int?
    get() {
      if (values.get(StyleKeys.CARET_COLOR_STATE) == StyleState.SET) {
        return values.getInt(StyleKeys.CARET_COLOR).takeIf { it != 0 }
      }
      return parentStyleWithTextValues?.explicitCaretColor
    }

  internal val resolvedWordSpacing: Float
    get() {
      val state = values.get(StyleKeys.WORD_SPACING_STATE)
      return if (state == StyleState.SET || state == StyleState.INHERIT) {
        if (state == StyleState.INHERIT) {
          parentStyleWithTextValues?.resolvedWordSpacing ?: values.getFloat(StyleKeys.WORD_SPACING)
        } else {
          values.getFloat(StyleKeys.WORD_SPACING)
        }
      } else {
        0f
      }
    }

  internal val resolvedWordSpacingType: Byte
    get() {
      val type = values.get(StyleKeys.WORD_SPACING_TYPE)
      return if (values.get(StyleKeys.WORD_SPACING_STATE) == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedWordSpacingType ?: type
      } else {
        type
      }
    }

  internal val resolvedWritingMode: Byte
    get() {
      if (memoHas(MEMO_WRITING_MODE)) return memoWritingMode
      val state = values.get(StyleKeys.WRITING_MODE_STATE)
      val value = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedWritingMode ?: values.get(StyleKeys.WRITING_MODE)
      } else {
        values.get(StyleKeys.WRITING_MODE)
      }
      memoWritingMode = value
      memoPut(MEMO_WRITING_MODE)
      return value
    }

  /** text-orientation: 0 mixed, 1 upright, 2 sideways. */
  internal val resolvedTextOrientation: Byte
    get() {
      if (memoHas(MEMO_TEXT_ORIENTATION)) return memoTextOrientation
      val state = values.get(StyleKeys.TEXT_ORIENTATION_STATE)
      val value = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextOrientation ?: values.get(StyleKeys.TEXT_ORIENTATION)
      } else {
        values.get(StyleKeys.TEXT_ORIENTATION)
      }
      memoTextOrientation = value
      memoPut(MEMO_TEXT_ORIENTATION)
      return value
    }

  /** text-spacing-trim: 0 normal, 1 space-all, 2 space-first, 3 trim-start, 4 trim-both, 5 trim-all, 6 auto. */
  internal val resolvedTextSpacingTrim: Byte
    get() {
      if (memoHas(MEMO_TEXT_SPACING_TRIM)) return memoTextSpacingTrim
      val state = values.get(StyleKeys.TEXT_SPACING_TRIM_STATE)
      val value = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextSpacingTrim ?: values.get(StyleKeys.TEXT_SPACING_TRIM)
      } else {
        values.get(StyleKeys.TEXT_SPACING_TRIM)
      }
      memoTextSpacingTrim = value
      memoPut(MEMO_TEXT_SPACING_TRIM)
      return value
    }

  /** text-combine-upright: 0 none, 1 all, 2-4 digits (that many). */
  internal val resolvedTextCombineUpright: Byte
    get() {
      if (memoHas(MEMO_TEXT_COMBINE)) return memoTextCombine
      val state = values.get(StyleKeys.TEXT_COMBINE_UPRIGHT_STATE)
      val value = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextCombineUpright ?: values.get(StyleKeys.TEXT_COMBINE_UPRIGHT)
      } else {
        values.get(StyleKeys.TEXT_COMBINE_UPRIGHT)
      }
      memoTextCombine = value
      memoPut(MEMO_TEXT_COMBINE)
      return value
    }

  internal val resolvedUnicodeBidi: Byte
    get() {
      if (memoHas(MEMO_UNICODE_BIDI)) return memoUnicodeBidi
      val state = values.get(StyleKeys.UNICODE_BIDI_STATE)
      val value = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedUnicodeBidi ?: values.get(StyleKeys.UNICODE_BIDI)
      } else {
        values.get(StyleKeys.UNICODE_BIDI)
      }
      memoUnicodeBidi = value
      memoPut(MEMO_UNICODE_BIDI)
      return value
    }

  internal val resolvedHyphens: Byte
    get() {
      if (memoHas(MEMO_HYPHENS)) return memoHyphens
      val state = values.get(StyleKeys.HYPHENS_STATE)
      val value = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedHyphens ?: values.get(StyleKeys.HYPHENS)
      } else {
        values.get(StyleKeys.HYPHENS)
      }
      memoHyphens = value
      memoPut(MEMO_HYPHENS)
      return value
    }

  internal val resolvedFontStretch: Int
    get() {
      val state = values.get(StyleKeys.FONT_STRETCH_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontStretch ?: values.getInt(StyleKeys.FONT_STRETCH)
      } else {
        values.getInt(StyleKeys.FONT_STRETCH)
      }
    }

  // text-indent: device px, or percent (0..100) when the type is 1.
  internal val resolvedTextIndent: Float
    get() {
      resolveTextIndent()
      return memoTextIndent
    }

  internal val resolvedTextIndentIsPercent: Boolean
    get() {
      resolveTextIndent()
      return memoTextIndentType.toInt() == 1
    }

  // Value and type come from the same style, so resolve them together.
  private fun resolveTextIndent() {
    if (memoHas(MEMO_TEXT_INDENT)) return
    val parent = if (values.get(StyleKeys.TEXT_INDENT_STATE) == StyleState.INHERIT) parentStyleWithTextValues else null
    if (parent != null) {
      parent.resolveTextIndent()
      memoTextIndent = parent.memoTextIndent
      memoTextIndentType = parent.memoTextIndentType
    } else {
      memoTextIndent = values.getFloat(StyleKeys.TEXT_INDENT)
      memoTextIndentType = values.get(StyleKeys.TEXT_INDENT_TYPE)
    }
    memoPut(MEMO_TEXT_INDENT)
  }

  // Max visible lines, 0 for none. Resolved like an inherited text property.
  internal val resolvedLineClamp: Int
    get() {
      if (memoHas(MEMO_LINE_CLAMP)) return memoLineClamp
      val state = values.get(StyleKeys.LINE_CLAMP_STATE)
      val value = if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedLineClamp ?: values.getInt(StyleKeys.LINE_CLAMP)
      } else {
        values.getInt(StyleKeys.LINE_CLAMP)
      }
      memoLineClamp = value
      memoPut(MEMO_LINE_CLAMP)
      return value
    }

  internal val textOverflowKind: Byte get() = values.get(StyleKeys.TEXT_OVERFLOW)
  internal val textOverflowEllipsis: Boolean get() = textOverflowKind != Styles.TextOverflow.Clip.value


  /* Resolved Styles */

  companion object {
    init {
      Mason.initLib()
    }

    private val pendingMetricsStyles = java.util.WeakHashMap<Style, Boolean>()

    internal var sharedBufferEpoch = 0

    // Bumped with any style's styleVersion, for caches that depend on more than one node's style.
    internal var writeEpoch = 0L

    @JvmStatic
    internal fun flushPendingMetrics(forRoot: Node) {
      if (pendingMetricsStyles.isEmpty()) return
      val it = pendingMetricsStyles.entries.iterator()
      while (it.hasNext()) {
        val e = it.next()
        val s = e.key
        if (s == null || (!s.fontDirty && !s.pendingMetricsSync)) {
          it.remove()
          continue
        }
        if ((s.node.getRootNode() ?: s.node) !== forRoot) continue
        it.remove()
        val changed = if (s.pendingMetricsSync) s.flushPendingMetricsSync() else s.syncFontMetrics()
        if (changed) {
          s.node.dirty()
        }
      }
    }

    // Shared per (family, weight, style): constructing a FontFace always hops
    // through its own single-thread Executor before `.font` is non-null, so
    // sharing one instance across nodes with the same descriptor avoids
    // paying that load round-trip more than once.
    private val sharedFontFaces = java.util.concurrent.ConcurrentHashMap<String, FontFace>()

    private fun fontFaceCacheKey(family: String, weight: FontWeight, style: FontStyle): String {
      val italic = style is FontStyle.Italic
      return "$family|${weight.weight}|$italic"
    }

    /**
     * Returns a shared FontFace for (family, weight, style), constructing and
     * kicking off its load only the first time. Safe only for a freshly
     * resolved descriptor that nothing has customized yet (feature-settings,
     * kerning, ...) -- callers that later mutate those on the returned
     * instance would leak the change to every other sharer.
     */
    internal fun sharedFontFace(
      family: String,
      weight: FontWeight,
      style: FontStyle,
      context: android.content.Context,
      onReady: () -> Unit
    ): FontFace {
      val key = fontFaceCacheKey(family, weight, style)
      sharedFontFaces[key]?.let { return it }
      val face = FontFace(family, AppFonts.resolve(family, context)).apply {
        this.weight = weight
        this.style = style
      }
      val winner = sharedFontFaces.putIfAbsent(key, face) ?: face
      if (winner.font == null) {
        winner.load(context) { _ -> onReady() }
      }
      return winner
    }

    private data class FontMetricsKey(val typeface: Typeface?, val textSize: Float, val variation: String?)

    private val fontMetricsCache = HashMap<FontMetricsKey, FloatArray>()

    private fun sharedFontMetrics(
      paint: Paint,
      xBounds: android.graphics.Rect,
      capBounds: android.graphics.Rect
    ): FloatArray {
      val variation = if (android.os.Build.VERSION.SDK_INT >= 26) paint.fontVariationSettings else null
      val key = FontMetricsKey(paint.typeface, paint.textSize, variation)
      fontMetricsCache[key]?.let { return it }
      val fm = paint.fontMetrics

      // Use absolute ascent (Android reports negative ascent); sanitize tiny/NaN values
      var ascent = abs(fm.ascent)
      var descent = fm.descent
      val EPS = 1e-6f
      if (ascent.isNaN() || ascent < EPS) {
        ascent = 14f
      }
      if (descent.isNaN() || descent < 0f || descent < EPS) {
        descent = 4f
      }

      // Android doesn't directly expose x-height or cap-height
      // We approximate them based on the font
      val xHeight = getXHeight(paint, xBounds) ?: (ascent * 0.5f)
      val capHeight = getCapHeight(paint, capBounds) ?: (ascent * 0.7f)
      val values = floatArrayOf(ascent, descent, fm.leading, xHeight, capHeight)
      if (fontMetricsCache.size >= 64) fontMetricsCache.clear()
      fontMetricsCache[key] = values
      return values
    }

    /**
     * Get x-height by measuring lowercase 'x'
     */
    internal fun getXHeight(paint: Paint, xBounds: android.graphics.Rect): Float? {
      paint.getTextBounds("x", 0, 1, xBounds)
      return if (xBounds.height() > 0) xBounds.height().toFloat() else null
    }

    /**
     * Get cap-height by measuring uppercase 'H'
     */
    internal fun getCapHeight(paint: Paint, capBounds: android.graphics.Rect): Float? {
      paint.getTextBounds("H", 0, 1, capBounds)
      return if (capBounds.height() > 0) capBounds.height().toFloat() else null
    }

    // width/height parameters come from the actual view bounds.  using
    // node.computedWidth/Height could be stale (zero during initial layout),
    // which would result in a 0×0 clip and prevent any background from
    // painting.  callers should supply the measured view dimensions.
    internal fun applyClip(
      canvas: Canvas,
      clip: BackgroundClip,
      style: Style,
      width: Float,
      height: Float
    ) {
      val node = style.node
      // fall back to computed dimensions only if the passed values are <= 0
      val w = if (width > 0f) width else node.computedWidth
      val h = if (height > 0f) height else node.computedHeight

      val borderLeft = node.computedBorderLeft
      val borderTop = node.computedBorderTop
      val borderRight = node.computedBorderRight
      val borderBottom = node.computedBorderBottom

      val paddingLeft = node.computedPaddingLeft
      val paddingTop = node.computedPaddingTop
      val paddingRight = node.computedPaddingRight
      val paddingBottom = node.computedPaddingBottom

      when (clip) {
        // Text-clipped layers paint through the glyphs (TextView); elsewhere as border-box.
        BackgroundClip.BORDER_BOX, BackgroundClip.TEXT -> {
          // Border box = full view bounds
          val p = style.mBorderRenderer.getOuterClipPath(w, h)
          canvas.clipPath(p)
        }

        BackgroundClip.PADDING_BOX -> {
          // Padding box = inset by border widths
          val p = style.mBorderRenderer.getClipPath(w, h)
          canvas.clipPath(p)
        }

        BackgroundClip.CONTENT_BOX -> {
          // Content box = inset by border + padding
          canvas.clipRect(
            borderLeft + paddingLeft,
            borderTop + paddingTop,
            w - borderRight - paddingRight,
            h - borderBottom - paddingBottom
          )
        }
      }
    }

    internal fun applyOverflowClip(
      style: Style,
      canvas: Canvas,
      node: Node,
      widthOverride: Float = node.computedWidth,
      heightOverride: Float = node.computedHeight,
      includeBorderRadius: Boolean = false
    ) {
      val overflowX = style.values.get(StyleKeys.OVERFLOW_X)
      val overflowY = style.values.get(StyleKeys.OVERFLOW_Y)

      // Nothing to do if both axes are visible
      if (overflowX == Overflow.Visible.value && overflowY == Overflow.Visible.value) return

      val width = if (widthOverride > 0f) widthOverride else node.computedWidth
      val height = if (heightOverride > 0f) heightOverride else node.computedHeight

      val paddingLeft = node.computedPaddingLeft
      val paddingTop = node.computedPaddingTop
      val paddingRight = node.computedPaddingRight
      val paddingBottom = node.computedPaddingBottom

      // Clip per the CSS overflow spec:
      // Hidden(1), Scroll(2), Clip(3) → always clip
      // Auto(4) → clip only when content overflows
      // Visible(0) → never clip
      val clipX = when (overflowX.toInt()) {
        1, 2, 3 -> true
        4 -> style.node.overflowWidth > width
        else -> false
      }

      val clipY = when (overflowY.toInt()) {
        1, 2, 3 -> true
        4 -> style.node.overflowHeight > height
        else -> false
      }

      if (!clipX && !clipY) return

      val scroll = node.view as? Scroll

      // For Scroll views the canvas has already been translated by
      // -scrollX/-scrollY (Android applies the scroll offset in
      // View.draw(Canvas, ViewGroup, long) before dispatchDraw is called).
      // Offset the clip rect so it tracks the scrolled viewport.
      val scrollOX = scroll?.scrollX?.toFloat() ?: 0f
      val scrollOY = scroll?.scrollY?.toFloat() ?: 0f

      val clipLeft = (if (clipX) paddingLeft else 0f) + scrollOX
      val clipTop = (if (clipY) paddingTop else 0f) + scrollOY
      val clipRight = (if (clipX) width - paddingRight else width) + scrollOX
      val clipBottom = (if (clipY) height - paddingBottom else height) + scrollOY

      // Defensive guard: if computed clip rect is inverted or degenerate, skip clipping
      if (clipRight > clipLeft && clipBottom > clipTop) {
        if (includeBorderRadius) {
          style.mBorderRenderer.updateCache(width, height)
          if (style.mBorderRenderer.hasRadii()) {
            style.mBorderRenderer.clipToScrolledPaddingBox(canvas, width, height, scrollOX, scrollOY)
          }
        }
        canvas.clipRect(clipLeft, clipTop, clipRight, clipBottom)
      }

    }

    @CriticalNative
    @JvmStatic
    external fun nativeStyleSlot(
      mason: Long,
      node: Long,
    ): Int

    @CriticalNative
    @JvmStatic
    external fun nativePseudoStyleSlot(
      mason: Long,
      node: Long,
      flags: Int,
    ): Int

    @CriticalNative
    @JvmStatic
    external fun nativePreparePseudoSlot(
      mason: Long,
      node: Long,
      flags: Int,
    ): Int

    @CriticalNative
    @JvmStatic
    external fun nativePrepareStyleSlot(
      mason: Long,
      node: Long,
    ): Int

    @JvmStatic
    external fun nativeStyleChunk(
      mason: Long,
      chunk: Int,
    ): ByteBuffer?


    @JvmStatic
    external fun nativeApplyLayoutLength(mason: Long, node: Long, flags: Int, property: String, value: String,
      fontSize: Float, rootFontSize: Float, viewportWidth: Float, viewportHeight: Float): Boolean

    @JvmStatic
    external fun nativeLayoutLengthCss(mason: Long, node: Long, flags: Int, property: String): String?

    @JvmStatic
    external fun nativeApplyGridWrites(mason: Long, node: Long, input: ByteArray,
                                       fontSize: Float, rootFontSize: Float, viewportWidth: Float, viewportHeight: Float)

    @JvmStatic
    external fun nativeNonBufferData(
      mason: Long,
      node: Long,
      flags: Int,
      gridAutoRows: String?,
      gridAutoColumns: String?,
      gridColumn: String?,
      gridColumnStart: String?,
      gridColumnEnd: String?,
      gridRow: String?,
      gridRowStart: String?,
      gridRowEnd: String?,
      gridTemplateRows: String?,
      gridTemplateColumns: String?,
      gridArea: String?,
      gridTemplateAreas: String?,
    )


    @JvmStatic
    external fun nativeGetGridArea(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridTemplateAreas(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridAutoRows(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridAutoColumns(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridColumn(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridColumnStart(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridColumnEnd(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridRow(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridRowStart(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridRowEnd(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridTemplateRows(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridTemplateColumns(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeUpdateWithValues(
      mason: Long,
      node: Long,
      display: Byte,
      position: Byte,
      direction: Byte,
      flexDirection: Byte,
      flexWrap: Byte,
      overflow: Byte,
      alignItems: Byte,
      alignSelf: Byte,
      alignContent: Byte,
      justifyItems: Byte,
      justifySelf: Byte,
      justifyContent: Byte,

      insetLeftType: Byte,
      insetLeftValue: Float,
      insetRightType: Byte,
      insetRightValue: Float,
      insetTopType: Byte,
      insetTopValue: Float,
      insetBottomType: Byte,
      insetBottomValue: Float,

      marginLeftType: Byte,
      marginLeftValue: Float,
      marginRightType: Byte,
      marginRightValue: Float,
      marginTopType: Byte,
      marginTopValue: Float,
      marginBottomType: Byte,
      marginBottomValue: Float,

      paddingLeftType: Byte,
      paddingLeftValue: Float,
      paddingRightType: Byte,
      paddingRightValue: Float,
      paddingTopType: Byte,
      paddingTopValue: Float,
      paddingBottomType: Byte,
      paddingBottomValue: Float,

      borderLeftType: Byte,
      borderLeftValue: Float,
      borderRightType: Byte,
      borderRightValue: Float,
      borderTopType: Byte,
      borderTopValue: Float,
      borderBottomType: Byte,
      borderBottomValue: Float,

      flexGrow: Float,
      flexShrink: Float,

      flexBasisType: Byte,
      flexBasisValue: Float,

      widthType: Byte,
      widthValue: Float,
      heightType: Byte,
      heightValue: Float,

      minWidthType: Byte,
      minWidthValue: Float,
      minHeightType: Byte,
      minHeightValue: Float,

      maxWidthType: Byte,
      maxWidthValue: Float,
      maxHeightType: Byte,
      maxHeightValue: Float,

      gapRowType: Byte,
      gapRowValue: Float,
      gapColumnType: Byte,
      gapColumnValue: Float,

      aspectRatio: Float,

      gridAutoRows: String?,
      gridAutoColumns: String?,
      gridAutoFlow: Byte,
      gridColumn: String?,
      gridColumnStart: String?,
      gridColumnEnd: String?,
      gridRow: String?,
      gridRowStart: String?,
      gridRowEnd: String?,
      gridTemplateRows: String?,
      gridTemplateColumns: String?,
      overflowX: Byte,
      overflowY: Byte,
      scrollbarWidth: Float,
      textAlign: Byte,
      boxSizing: Byte,
      gridArea: String?,
      gridTemplateAreas: String?,
    )
  }
}

private const val MEMO_WRITING_MODE = 1
private const val MEMO_UNICODE_BIDI = 2
private const val MEMO_HYPHENS = 4
private const val MEMO_TEXT_ALIGN = 8
private const val MEMO_TEXT_INDENT = 16
private const val MEMO_LINE_CLAMP = 32
private const val MEMO_TEXT_ORIENTATION = 64
private const val MEMO_TEXT_COMBINE = 128
private const val MEMO_TEXT_SPACING_TRIM = 256

// Logical side groups: their state key, ORDER offset and logical slot count (see StyleKeys.LOGICAL_SEQ).
private val LOGICAL_GROUP_KEYS = arrayOf(
  StateKeys.MARGIN, StateKeys.PADDING, StateKeys.INSET, StateKeys.SIZE or StateKeys.MIN_SIZE or StateKeys.MAX_SIZE,
)
private val LOGICAL_GROUP_ORDERS = intArrayOf(StyleKeys.MARGIN_ORDER, StyleKeys.PADDING_ORDER, StyleKeys.INSET_ORDER, StyleKeys.SIZE_ORDER)
private val LOGICAL_GROUP_HALVES = intArrayOf(4, 4, 4, 6)
private val LOGICAL_STATE_KEYS = LOGICAL_GROUP_KEYS.reduce { a, b -> a or b }
