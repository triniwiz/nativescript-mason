//
//  MasonStyle.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif
import QuartzCore
import CoreText
import FontManager

private func getDimension(_ value: Float,_ type: Int) -> MasonDimension? {
  return MasonDimension.fromValueType(value, type)
}

private func getLengthPercentageAuto(_ value: Float,_ type: Int) -> MasonLengthPercentageAuto? {
  switch (type) {
  case 0: return .Auto
  case 1: return .Points(value)
  case 2: return .Percent(value)
  default:
    return nil
  }
}

private func getLengthPercentage(_ value: Float,_ type: Int) -> MasonLengthPercentage? {
  switch (type) {
  case 0: return .Points(value)
  case 1: return .Percent(value)
  default:
    return nil
  }
}


// <style-keys:records> generated from tools/scripts/style-keys/style-keys.schema
enum StyleRecordKind: UInt8 {
  case boxShadow = 0
  case textShadow = 1
  case filter = 2
  case backdropFilter = 3
  case fontFeatures = 4
}

enum ShadowRecord {
  static let stride = 6
  static let x = 0
  static let y = 1
  static let blur = 2
  static let spread = 3
  static let color = 4
  static let inset = 5
}

enum FilterRecord {
  static let stride = 5
  static let kind = 0
  static let amountOrX = 1
  static let y = 2
  static let blur = 3
  static let color = 4
}

enum FontFeatureRecord {
  static let stride = 2
  static let tag = 0
  static let value = 1
}

enum BackgroundRecord {
  static let stride = 17
  static let imageKind = 0
  static let color = 1
  static let repeatX = 2
  static let repeatY = 3
  static let origin = 4
  static let clip = 5
  static let attachment = 6
  static let sizeKind = 7
  static let positionXFraction = 8
  static let positionXPixels = 9
  static let positionYFraction = 10
  static let positionYPixels = 11
  static let widthFraction = 12
  static let widthPixels = 13
  static let heightFraction = 14
  static let heightPixels = 15
  static let blend = 16
}

enum BackgroundOffsetsRecord {
  static let stride = 4
  static let positionX = 0
  static let positionY = 1
  static let width = 2
  static let height = 3
}

enum BackgroundInputRecord {
  static let stride = 8
  static let color = 0
  static let image = 1
  static let `repeat` = 2
  static let position = 3
  static let size = 4
  static let clip = 5
  static let origin = 6
  static let attachment = 7
}

enum BorderComponentsRecord {
  static let stride = 6
  static let top = 0
  static let right = 1
  static let bottom = 2
  static let left = 3
  static let style = 4
  static let color = 5
}

enum BorderSideComponentsRecord {
  static let stride = 3
  static let width = 0
  static let style = 1
  static let color = 2
}

enum BorderRadiiRecord {
  static let stride = 8
  static let horizontalTopLeft = 0
  static let horizontalTopRight = 1
  static let horizontalBottomRight = 2
  static let horizontalBottomLeft = 3
  static let verticalTopLeft = 4
  static let verticalTopRight = 5
  static let verticalBottomRight = 6
  static let verticalBottomLeft = 7
}

enum ClipPathRecord {
  static let stride = 7
  static let kind = 0
  static let box = 1
  static let evenOdd = 2
  static let radiusXKind = 3
  static let radiusYKind = 4
  static let hasPosition = 5
  static let hasMath = 6
}

enum SvgPathRecord {
  static let stride = 8
  static let kind = 0
  static let vertexEnd = 1
  static let x1 = 2
  static let y1 = 3
  static let x2 = 4
  static let y2 = 5
  static let x = 6
  static let y = 7
}

enum MaskLayerRecord {
  static let stride = 3
  static let clip = 0
  static let mode = 1
  static let composite = 2
}

enum MaskInputRecord {
  static let stride = 8
  static let image = 0
  static let size = 1
  static let position = 2
  static let `repeat` = 3
  static let origin = 4
  static let clip = 5
  static let mode = 6
  static let composite = 7
}

enum NineSliceInputRecord {
  static let stride = 6
  static let source = 0
  static let slice = 1
  static let width = 2
  static let outset = 3
  static let `repeat` = 4
  static let mode = 5
}

enum NineSliceRecord {
  static let stride = 4
  static let fill = 0
  static let repeatX = 1
  static let repeatY = 2
  static let luminance = 3
}

enum NineSliceSideRecord {
  static let stride = 3
  static let kind = 0
  static let value = 1
  static let hasMath = 2
}

enum TextDecorationRecord {
  static let stride = 4
  static let line = 0
  static let style = 1
  static let color = 2
  static let thickness = 3
}

enum CssLengthResultRecord {
  static let stride = 2
  static let kind = 0
  static let value = 1
}

enum CssPositionResultRecord {
  static let stride = 4
  static let xType = 0
  static let xValue = 1
  static let yType = 2
  static let yValue = 3
}

enum CssDeclarationHeaderRecord {
  static let stride = 3
  static let name = 0
  static let value = 1
  static let fieldCount = 2
}

enum CssInlineReplayRecord {
  static let stride = 3
  static let viewportDependent = 0
  static let fontDependent = 1
  static let fontSize = 2
}

enum CssBackgroundWriteRecord {
  static let stride = 3
  static let property = 0
  static let value = 1
  static let currentColor = 2
}

enum CssBackgroundResultRecord {
  static let stride = 8
  static let layersChanged = 0
  static let imagesReplaced = 1
  static let imageDeclaration = 2
  static let shorthandValue = 3
  static let color = 4
  static let colorFromShorthand = 5
  static let lastImageFromShorthand = 6
  static let shorthandReset = 7
}

enum CssEffectWriteRecord {
  static let stride = 3
  static let property = 0
  static let value = 1
  static let currentColor = 2
}

enum CssEffectResultRecord {
  static let stride = 2
  static let value = 0
  static let records = 1
}

enum CssMaskWriteRecord {
  static let stride = 2
  static let slot = 0
  static let value = 1
}

enum CssBorderResultRecord {
  static let stride = 10
  static let topKind = 0
  static let topValue = 1
  static let rightKind = 2
  static let rightValue = 3
  static let bottomKind = 4
  static let bottomValue = 5
  static let leftKind = 6
  static let leftValue = 7
  static let style = 8
  static let color = 9
}

enum CssBorderSideResultRecord {
  static let stride = 4
  static let kind = 0
  static let value = 1
  static let style = 2
  static let color = 3
}

enum GradientInterpolationRecord {
  static let stride = 3
  static let direction = 0
  static let space = 1
  static let hue = 2
}

enum SvgFontPrefixRecord {
  static let stride = 3
  static let italic = 0
  static let weight = 1
  static let size = 2
}

enum SvgCssDeclarationRecord {
  static let stride = 3
  static let name = 0
  static let value = 1
  static let important = 2
}

enum SvgCssSelectorRecord {
  static let stride = 3
  static let type = 0
  static let idCount = 1
  static let classCount = 2
}

enum SvgCssRuleRecord {
  static let stride = 2
  static let selectorCount = 0
  static let declarationCount = 1
}

enum SvgPaintRecord {
  static let stride = 2
  static let kind = 0
  static let value = 1
}

enum CssAnimationLayerRecord {
  static let stride = 1
  static let componentCount = 0
}

enum CssAnimationComponentRecord {
  static let stride = 3
  static let kind = 0
  static let value = 1
  static let unit = 2
}

enum SvgLengthComponentsRecord {
  static let stride = 2
  static let length = 0
  static let percent = 1
}

enum SvgAffineRecord {
  static let stride = 6
  static let a = 0
  static let b = 1
  static let c = 2
  static let d = 3
  static let x = 4
  static let y = 5
}

enum SvgAspectRatioRecord {
  static let stride = 4
  static let alignX = 0
  static let alignY = 1
  static let uniform = 2
  static let slice = 3
}

enum FilterOperationCode {
  static let blur = 0
  static let brightness = 1
  static let contrast = 2
  static let saturate = 3
  static let hueRotate = 4
  static let invert = 5
  static let opacity = 6
  static let sepia = 7
  static let grayscale = 8
  static let dropShadow = 9
}

enum CssParseKind: UInt8 {
  case shadows = 0
  case filters = 1
  case length = 2
  case fontSize = 3
  case clampLength = 4
  case transformOrigin = 5
  case objectPosition = 6
  case lineHeight = 7
  case letterSpacing = 8
  case textIndent = 9
  case wordSpacing = 10
  case verticalAlign = 11
  case dimension = 12
  case lengthAuto = 13
  case borderRadius = 14
  case borderCornerRadius = 15
  case svgNumberList = 16
  case svgTransform = 17
  case svgLength = 18
  case svgLengthList = 19
  case svgOpacity = 20
  case svgAngle = 21
  case svgAspectRatio = 22
  case svgNumber = 23
  case svgDashArray = 24
}
// </style-keys:records>

public struct StyleKeys {
  // <style-keys:offsets> generated from tools/scripts/style-keys/style-keys.schema, run `npm run gen:style-keys`
  public static let STYLE_BUFFER_SIZE = 792

  public static let DISPLAY = 0
  public static let POSITION = 1
  public static let DIRECTION = 2
  public static let FLEX_DIRECTION = 3
  public static let FLEX_WRAP = 4
  public static let OVERFLOW_X = 5
  public static let OVERFLOW_Y = 6

  public static let ALIGN_ITEMS = 7
  public static let ALIGN_SELF = 8
  public static let ALIGN_CONTENT = 9

  public static let JUSTIFY_ITEMS = 10
  public static let JUSTIFY_SELF = 11
  public static let JUSTIFY_CONTENT = 12

  // Each box side group: four types, then four values.
  public static let INSET_LEFT_TYPE = 13
  public static let INSET_RIGHT_TYPE = 14
  public static let INSET_TOP_TYPE = 15
  public static let INSET_BOTTOM_TYPE = 16
  public static let INSET_LEFT_VALUE = 17 // f32 (17-20)
  public static let INSET_RIGHT_VALUE = 21 // f32 (21-24)
  public static let INSET_TOP_VALUE = 25 // f32 (25-28)
  public static let INSET_BOTTOM_VALUE = 29 // f32 (29-32)

  public static let MARGIN_LEFT_TYPE = 33
  public static let MARGIN_RIGHT_TYPE = 34
  public static let MARGIN_TOP_TYPE = 35
  public static let MARGIN_BOTTOM_TYPE = 36
  public static let MARGIN_LEFT_VALUE = 37 // f32 (37-40)
  public static let MARGIN_RIGHT_VALUE = 41 // f32 (41-44)
  public static let MARGIN_TOP_VALUE = 45 // f32 (45-48)
  public static let MARGIN_BOTTOM_VALUE = 49 // f32 (49-52)

  public static let PADDING_LEFT_TYPE = 53
  public static let PADDING_RIGHT_TYPE = 54
  public static let PADDING_TOP_TYPE = 55
  public static let PADDING_BOTTOM_TYPE = 56
  public static let PADDING_LEFT_VALUE = 57 // f32 (57-60)
  public static let PADDING_RIGHT_VALUE = 61 // f32 (61-64)
  public static let PADDING_TOP_VALUE = 65 // f32 (65-68)
  public static let PADDING_BOTTOM_VALUE = 69 // f32 (69-72)

  public static let BORDER_LEFT_TYPE = 73
  public static let BORDER_RIGHT_TYPE = 74
  public static let BORDER_TOP_TYPE = 75
  public static let BORDER_BOTTOM_TYPE = 76
  public static let BORDER_LEFT_VALUE = 77 // f32 (77-80)
  public static let BORDER_RIGHT_VALUE = 81 // f32 (81-84)
  public static let BORDER_TOP_VALUE = 85 // f32 (85-88)
  public static let BORDER_BOTTOM_VALUE = 89 // f32 (89-92)

  public static let FLEX_GROW = 93 // f32 (93-96)
  public static let FLEX_SHRINK = 97 // f32 (97-100)

  public static let FLEX_BASIS_TYPE = 101
  public static let FLEX_BASIS_VALUE = 102 // f32 (102-105)

  public static let WIDTH_TYPE = 106
  public static let HEIGHT_TYPE = 107
  public static let WIDTH_VALUE = 108 // f32 (108-111)
  public static let HEIGHT_VALUE = 112 // f32 (112-115)

  public static let MIN_WIDTH_TYPE = 116
  public static let MIN_HEIGHT_TYPE = 117
  public static let MIN_WIDTH_VALUE = 118 // f32 (118-121)
  public static let MIN_HEIGHT_VALUE = 122 // f32 (122-125)

  public static let MAX_WIDTH_TYPE = 126
  public static let MAX_HEIGHT_TYPE = 127
  public static let MAX_WIDTH_VALUE = 128 // f32 (128-131)
  public static let MAX_HEIGHT_VALUE = 132 // f32 (132-135)

  public static let GAP_ROW_TYPE = 136
  public static let GAP_COLUMN_TYPE = 137
  public static let GAP_ROW_VALUE = 138 // f32 (138-141)
  public static let GAP_COLUMN_VALUE = 142 // f32 (142-145)

  public static let ASPECT_RATIO = 146 // f32 (146-149)
  public static let GRID_AUTO_FLOW = 150
  public static let GRID_COLUMN_START_TYPE = 151
  public static let GRID_COLUMN_END_TYPE = 152
  public static let GRID_ROW_START_TYPE = 153
  public static let GRID_ROW_END_TYPE = 154
  public static let GRID_COLUMN_START_VALUE = 155 // f32 (155-158)
  public static let GRID_COLUMN_END_VALUE = 159 // f32 (159-162)
  public static let GRID_ROW_START_VALUE = 163 // f32 (163-166)
  public static let GRID_ROW_END_VALUE = 167 // f32 (167-170)
  public static let SCROLLBAR_WIDTH = 171 // f32 (171-174)
  public static let ALIGN = 175
  public static let BOX_SIZING = 176
  public static let OVERFLOW = 177
  public static let ITEM_IS_TABLE = 178
  public static let ITEM_IS_REPLACED = 179
  public static let DISPLAY_MODE = 180
  public static let FORCE_INLINE = 181
  public static let MIN_CONTENT_WIDTH = 182 // f32 (182-185)
  public static let MIN_CONTENT_HEIGHT = 186 // f32 (186-189)
  public static let MAX_CONTENT_WIDTH = 190 // f32 (190-193)
  public static let MAX_CONTENT_HEIGHT = 194 // f32 (194-197)

  public static let BORDER_LEFT_STYLE = 198
  public static let BORDER_RIGHT_STYLE = 199
  public static let BORDER_TOP_STYLE = 200
  public static let BORDER_BOTTOM_STYLE = 201

  public static let BORDER_LEFT_COLOR = 202 // u32 (202-205)
  public static let BORDER_RIGHT_COLOR = 206 // u32 (206-209)
  public static let BORDER_TOP_COLOR = 210 // u32 (210-213)
  public static let BORDER_BOTTOM_COLOR = 214 // u32 (214-217)

  // Elliptical radii: eight types, eight values, then four squircle exponents.
  public static let BORDER_RADIUS_TOP_LEFT_X_TYPE = 218
  public static let BORDER_RADIUS_TOP_LEFT_Y_TYPE = 219
  public static let BORDER_RADIUS_TOP_RIGHT_X_TYPE = 220
  public static let BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 221
  public static let BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 222
  public static let BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 223
  public static let BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 224
  public static let BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 225
  public static let BORDER_RADIUS_TOP_LEFT_X_VALUE = 226 // f32 (226-229)
  public static let BORDER_RADIUS_TOP_LEFT_Y_VALUE = 230 // f32 (230-233)
  public static let BORDER_RADIUS_TOP_RIGHT_X_VALUE = 234 // f32 (234-237)
  public static let BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238 // f32 (238-241)
  public static let BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 242 // f32 (242-245)
  public static let BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 246 // f32 (246-249)
  public static let BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 250 // f32 (250-253)
  public static let BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 254 // f32 (254-257)
  public static let BORDER_RADIUS_TOP_LEFT_EXPONENT = 258 // f32 (258-261)
  public static let BORDER_RADIUS_TOP_RIGHT_EXPONENT = 262 // f32 (262-265)
  public static let BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 266 // f32 (266-269)
  public static let BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270 // f32 (270-273)

  public static let FLOAT = 274
  public static let CLEAR = 275
  public static let OBJECT_FIT = 276

  public static let FONT_METRICS_ASCENT_OFFSET = 277 // f32 (277-280)
  public static let FONT_METRICS_DESCENT_OFFSET = 281 // f32 (281-284)
  public static let FONT_METRICS_X_HEIGHT_OFFSET = 285 // f32 (285-288)
  public static let FONT_METRICS_LEADING_OFFSET = 289 // f32 (289-292)
  public static let FONT_METRICS_CAP_HEIGHT_OFFSET = 293 // f32 (293-296)
  public static let VERTICAL_ALIGN_OFFSET_OFFSET = 297 // f32 (297-300)
  public static let VERTICAL_ALIGN_IS_PERCENT_OFFSET = 301
  public static let VERTICAL_ALIGN_ENUM_OFFSET = 302
  public static let FIRST_BASELINE_OFFSET = 306 // f32 (306-309), preserves the three reserved bytes after vertical-align
  public static let Z_INDEX = 310 // i32 (310-313)
  public static let ITEM_IS_LIST = 314
  public static let ITEM_IS_LIST_ITEM = 315
  public static let LIST_STYLE_POSITION = 316
  public static let LIST_STYLE_TYPE = 317
  public static let LIST_STYLE_POSITION_STATE = 318
  public static let LIST_STYLE_TYPE_STATE = 319
  public static let REF_COUNT = 320 // u32 (320-323), copy-on-write share count

  // Inherited text fields. A *_STATE byte is nonzero once the node sets the field.
  public static let FONT_COLOR = 324 // u32 (324-327)
  public static let FONT_COLOR_STATE = 328
  public static let FONT_SIZE = 329 // f32 (329-332)
  public static let FONT_SIZE_TYPE = 333
  public static let FONT_SIZE_STATE = 334
  public static let FONT_WEIGHT = 335 // i32 (335-338)
  public static let FONT_WEIGHT_STATE = 339
  public static let FONT_STYLE_SLANT = 340 // i32 (340-343)
  public static let FONT_STYLE_TYPE = 344
  public static let FONT_STYLE_STATE = 345
  public static let FONT_FAMILY_STATE = 346
  public static let FONT_RESOLVED_DIRTY = 347
  public static let BACKGROUND_COLOR = 348 // u32 (348-351)
  public static let BACKGROUND_COLOR_STATE = 352
  public static let BACKGROUND_COLOR_TYPE = 353
  public static let DECORATION_LINE = 354
  public static let DECORATION_LINE_STATE = 355
  public static let DECORATION_COLOR = 356 // u32 (356-359)
  public static let DECORATION_COLOR_STATE = 360
  public static let DECORATION_STYLE = 361
  public static let DECORATION_STYLE_STATE = 362
  public static let LETTER_SPACING = 363 // f32 (363-366)
  public static let LETTER_SPACING_STATE = 367
  public static let TEXT_WRAP = 368
  public static let TEXT_WRAP_STATE = 369
  public static let WHITE_SPACE = 370
  public static let WHITE_SPACE_STATE = 371
  public static let TEXT_TRANSFORM = 372
  public static let TEXT_TRANSFORM_STATE = 373
  public static let TEXT_ALIGN = 374
  public static let TEXT_ALIGN_STATE = 375
  public static let TEXT_JUSTIFY = 376
  public static let TEXT_JUSTIFY_STATE = 377
  public static let TEXT_INDENT = 378 // f32 (378-381)
  public static let TEXT_INDENT_TYPE = 382 // 0 px, 1 %
  public static let TEXT_INDENT_STATE = 383
  public static let LINE_HEIGHT = 384 // f32 (384-387)
  public static let LINE_HEIGHT_STATE = 388
  public static let LINE_HEIGHT_TYPE = 389
  public static let DECORATION_THICKNESS = 390 // f32 (390-393)
  public static let DECORATION_THICKNESS_STATE = 394
  public static let TEXT_SHADOW_STATE = 395
  public static let TEXT_OVERFLOW = 396
  public static let TEXT_OVERFLOW_STATE = 397

  // Which StateKeys a pseudo-class buffer sets explicitly (same bit layout).
  public static let PSEUDO_SET_MASK_LOW = 398 // i64 (398-405)
  public static let PSEUDO_SET_MASK_HIGH = 406 // i64 (406-413)

  // 414-418 free.
  public static let FONT_VARIANT_NUMERIC = 419 // bitmask
  public static let FONT_VARIANT_NUMERIC_STATE = 420

  // Up to six inline transform ops, or a full matrix.
  public static let TRANSFORM_COUNT = 422 // number of inline ops (0-6)
  public static let TRANSFORM_FLAGS = 423 // bit 0 HAS_MATRIX, bit 1 IS_3D
  public static let TRANSFORM_OP_0 = 424 // bytes(12) (424-435), type(u8) + pad(3) + a(f32) + b(f32)
  public static let TRANSFORM_OP_1 = 436 // bytes(12) (436-447)
  public static let TRANSFORM_OP_2 = 448 // bytes(12) (448-459)
  public static let TRANSFORM_OP_3 = 460 // bytes(12) (460-471)
  public static let TRANSFORM_OP_4 = 472 // bytes(12) (472-483)
  public static let TRANSFORM_OP_5 = 484 // bytes(12) (484-495)
  public static let TRANSFORM_MATRIX = 496 // bytes(64) (496-559), 16 x f32, 4x4 column-major

  public static let OBJECT_POSITION_X_TYPE = 560 // 0 px, 1 %, 2 keyword
  public static let OBJECT_POSITION_Y_TYPE = 561
  public static let OBJECT_POSITION_X_VALUE = 562 // f32 (562-565)
  public static let OBJECT_POSITION_Y_VALUE = 566 // f32 (566-569)
  public static let OBJECT_POSITION_STATE = 570
  public static let WRITING_MODE = 571
  public static let WRITING_MODE_STATE = 572
  public static let UNICODE_BIDI = 573
  public static let UNICODE_BIDI_STATE = 574
  public static let HYPHENS = 575
  public static let HYPHENS_STATE = 576
  public static let CARET_COLOR = 577 // u32 (577-580)
  public static let CARET_COLOR_STATE = 581
  public static let WORD_SPACING = 582 // f32 (582-585)
  public static let WORD_SPACING_TYPE = 586 // 0 px, 1 %, 2 normal
  public static let WORD_SPACING_STATE = 587
  public static let FONT_STRETCH = 588 // i32 (588-591), percentage x 100
  public static let FONT_STRETCH_STATE = 592
  public static let LINE_CLAMP = 593 // i32 (593-596), max lines, 0 none
  public static let LINE_CLAMP_STATE = 597
  public static let TRANSFORM_ORIGIN_X_TYPE = 598 // 0 px, 1 %
  public static let TRANSFORM_ORIGIN_Y_TYPE = 599
  public static let TRANSFORM_ORIGIN_X_VALUE = 600 // f32 (600-603)
  public static let TRANSFORM_ORIGIN_Y_VALUE = 604 // f32 (604-607)
  public static let TRANSFORM_ORIGIN_STATE = 608
  public static let TEXT_ORIENTATION = 609 // 0 mixed, 1 upright, 2 sideways
  public static let TEXT_ORIENTATION_STATE = 610

  // CSS logical properties, mapped onto physical sides by the box's writing mode and direction.
  // A group's ORDER bytes are its physical slots (top, right, bottom, left; sizes: width, height,
  // min-width, min-height, max-width, max-height) then its logical ones in the order below: 0
  // never written, else the write's LOGICAL_SEQ stamp. A logical value applies to the side it
  // maps to when it was written after that side's physical one. Types are the physical group's.
  public static let LOGICAL_SEQ = 611
  public static let MARGIN_ORDER = 612 // bytes(8) (612-619)
  public static let MARGIN_BLOCK_START_TYPE = 620
  public static let MARGIN_INLINE_END_TYPE = 621
  public static let MARGIN_BLOCK_END_TYPE = 622
  public static let MARGIN_INLINE_START_TYPE = 623
  public static let MARGIN_BLOCK_START_VALUE = 624 // f32 (624-627)
  public static let MARGIN_INLINE_END_VALUE = 628 // f32 (628-631)
  public static let MARGIN_BLOCK_END_VALUE = 632 // f32 (632-635)
  public static let MARGIN_INLINE_START_VALUE = 636 // f32 (636-639)
  public static let PADDING_ORDER = 640 // bytes(8) (640-647)
  public static let PADDING_BLOCK_START_TYPE = 648
  public static let PADDING_INLINE_END_TYPE = 649
  public static let PADDING_BLOCK_END_TYPE = 650
  public static let PADDING_INLINE_START_TYPE = 651
  public static let PADDING_BLOCK_START_VALUE = 652 // f32 (652-655)
  public static let PADDING_INLINE_END_VALUE = 656 // f32 (656-659)
  public static let PADDING_BLOCK_END_VALUE = 660 // f32 (660-663)
  public static let PADDING_INLINE_START_VALUE = 664 // f32 (664-667)
  public static let INSET_ORDER = 668 // bytes(8) (668-675)
  public static let INSET_BLOCK_START_TYPE = 676
  public static let INSET_INLINE_END_TYPE = 677
  public static let INSET_BLOCK_END_TYPE = 678
  public static let INSET_INLINE_START_TYPE = 679
  public static let INSET_BLOCK_START_VALUE = 680 // f32 (680-683)
  public static let INSET_INLINE_END_VALUE = 684 // f32 (684-687)
  public static let INSET_BLOCK_END_VALUE = 688 // f32 (688-691)
  public static let INSET_INLINE_START_VALUE = 692 // f32 (692-695)
  public static let SIZE_ORDER = 696 // bytes(12) (696-707)
  public static let INLINE_SIZE_TYPE = 708
  public static let BLOCK_SIZE_TYPE = 709
  public static let MIN_INLINE_SIZE_TYPE = 710
  public static let MIN_BLOCK_SIZE_TYPE = 711
  public static let MAX_INLINE_SIZE_TYPE = 712
  public static let MAX_BLOCK_SIZE_TYPE = 713
  public static let INLINE_SIZE_VALUE = 714 // f32 (714-717)
  public static let BLOCK_SIZE_VALUE = 718 // f32 (718-721)
  public static let MIN_INLINE_SIZE_VALUE = 722 // f32 (722-725)
  public static let MIN_BLOCK_SIZE_VALUE = 726 // f32 (726-729)
  public static let MAX_INLINE_SIZE_VALUE = 730 // f32 (730-733)
  public static let MAX_BLOCK_SIZE_VALUE = 734 // f32 (734-737)
  public static let TEXT_COMBINE_UPRIGHT = 738 // 0 none, 1 all, 2-4 digits (that many)
  public static let TEXT_COMBINE_UPRIGHT_STATE = 739
  public static let TEXT_SPACING_TRIM = 740 // 0 normal, 1 space-all, 2 space-first, 3 trim-start, 4 trim-both, 5 trim-all, 6 auto
  public static let TEXT_SPACING_TRIM_STATE = 741
  public static let VISIBILITY = 742 // 0 visible, 1 hidden, 2 collapse
  public static let FONT_FEATURES_REVISION = 743 // Rust-owned OpenType feature settings change counter
  public static let BOX_SHADOW_REVISION = 744 // u32 (744-747), Rust-owned box shadow records change counter
  public static let TEXT_SHADOW_REVISION = 748 // u32 (748-751), Rust-owned text shadow records change counter
  public static let FILTER_REVISION = 752 // u32 (752-755), Rust-owned filter records change counter
  public static let BACKDROP_FILTER_REVISION = 756 // u32 (756-759), Rust-owned backdrop-filter records change counter
  public static let BACKGROUND_REVISION = 760 // u32 (760-763), Rust-owned background layers change counter
  public static let TRANSFORM_REVISION = 764 // u32 (764-767), Rust-owned CSS transform list change counter
  public static let CLIP_PATH_REVISION = 768 // u32 (768-771), Rust-owned CSS clip-path change counter
  public static let MASK_REVISION = 772 // u32 (772-775), Rust-owned mask layer list change counter
  public static let BORDER_IMAGE_REVISION = 776 // u32 (776-779), Rust-owned border-image change counter
  public static let MASK_BORDER_REVISION = 780 // u32 (780-783), Rust-owned mask-border change counter
  public static let TEXT_OVERFLOW_TOKEN = 784 // i64 (784-791), Rust-owned text-overflow string handle
  // </style-keys:offsets>
  public static let TRANSFORM_OP_SIZE = 12
  public static let MAX_INLINE_TRANSFORM_OPS = 6
  public static let TRANSFORM_FLAG_HAS_MATRIX: UInt8 = 0x01
  public static let TRANSFORM_FLAG_IS_3D: UInt8 = 0x02
  /// An inline op holds a percentage, resolved against the border box when applied.
  public static let TRANSFORM_FLAG_HAS_PERCENT: UInt8 = 0x04
  /// Per-op byte 1: which of `a` / `b` are percentages.
  public static let TRANSFORM_OP_A_PERCENT: UInt8 = 0x01
  public static let TRANSFORM_OP_B_PERCENT: UInt8 = 0x02
}

@objc public enum TransformOpType: UInt8 {
  case none = 0
  case translate = 1
  case translateX = 2
  case translateY = 3
  case scale = 4
  case scaleX = 5
  case scaleY = 6
  case rotate = 7
  case skewX = 8
  case skewY = 9
}


public struct StateKeys: Equatable {
  public let low: UInt64
  public let high: UInt64
  
  public init(low: UInt64, high: UInt64){
    self.low = low
    self.high = high
  }
  
  public init(_ value: UInt64) {
    if(value < 64){
      self.low = 1 << value
      self.high = 0
    }else {
      self.low = 0
      self.high = 1 << (value - 64)
    }
  }
  
  public func contains(_ other: StateKeys) -> Bool {
      return (low & other.low) != 0 ||
             (high & other.high) != 0
  }
  
  public func union(_ other: StateKeys) -> StateKeys {
    return StateKeys(low: self.low | other.low, high: self.high | other.high)
  }

  // Unknown dirty bits still take the layout path.
  internal var requiresLayout: Bool {
    (low & ~Self.paintOnly.low) != 0 || (high & ~Self.paintOnly.high) != 0
  }
  
  public static let none = StateKeys(low: 0, high: 0)
  // <style-keys:state> generated from tools/scripts/style-keys/style-keys.schema, run `npm run gen:style-keys`
  public static let display = StateKeys(0)
  public static let position = StateKeys(1)
  public static let direction = StateKeys(2)
  public static let flexDirection = StateKeys(3)
  public static let flexWrap = StateKeys(4)
  public static let overflowX = StateKeys(5)
  public static let overflowY = StateKeys(6)
  public static let alignItems = StateKeys(7)
  public static let alignSelf = StateKeys(8)
  public static let alignContent = StateKeys(9)
  public static let justifyItems = StateKeys(10)
  public static let justifySelf = StateKeys(11)
  public static let justifyContent = StateKeys(12)
  public static let inset = StateKeys(13)
  public static let margin = StateKeys(14)
  public static let padding = StateKeys(15)
  public static let border = StateKeys(16)
  public static let flexGrow = StateKeys(17)
  public static let flexShrink = StateKeys(18)
  public static let flexBasis = StateKeys(19)
  public static let size = StateKeys(20)
  public static let minSize = StateKeys(21)
  public static let maxSize = StateKeys(22)
  public static let gap = StateKeys(23)
  public static let aspectRatio = StateKeys(24)
  public static let gridAutoFlow = StateKeys(25)
  public static let gridColumn = StateKeys(26)
  public static let gridRow = StateKeys(27)
  public static let scrollbarWidth = StateKeys(28)
  public static let align = StateKeys(29)
  public static let boxSizing = StateKeys(30)
  public static let overflow = StateKeys(31)
  public static let itemIsTable = StateKeys(32)
  public static let itemIsReplaced = StateKeys(33)
  public static let displayMode = StateKeys(34)
  public static let forceInline = StateKeys(35)
  public static let minContentWidth = StateKeys(36)
  public static let minContentHeight = StateKeys(37)
  public static let maxContentWidth = StateKeys(38)
  public static let maxContentHeight = StateKeys(39)
  public static let borderStyle = StateKeys(40)
  public static let borderRadius = StateKeys(41)
  public static let borderColor = StateKeys(42)
  public static let float = StateKeys(43)
  public static let clear = StateKeys(44)
  public static let objectFit = StateKeys(45)
  public static let zIndex = StateKeys(46)
  public static let listStylePosition = StateKeys(47)
  public static let listStyleType = StateKeys(48)
  public static let invalidateText = StateKeys(49) // Kotlin's INVALIDATE_TEXT is every bit
  public static let color = StateKeys(50)
  public static let decorationLine = StateKeys(51)
  public static let decorationColor = StateKeys(52)
  public static let textAlign = StateKeys(53)
  public static let textJustify = StateKeys(54)
  public static let backgroundColor = StateKeys(55)
  public static let fontSize = StateKeys(56)
  public static let textTransform = StateKeys(57)
  public static let fontStyle = StateKeys(58)
  public static let fontStyleSlant = StateKeys(59)
  public static let textWrap = StateKeys(60)
  public static let textOverflow = StateKeys(61)
  public static let decorationStyle = StateKeys(62)
  public static let whiteSpace = StateKeys(63)
  public static let fontWeight = StateKeys(64)
  public static let lineHeight = StateKeys(65)
  public static let verticalAlign = StateKeys(66)
  public static let decorationThinkness = StateKeys(67)
  public static let textShadow = StateKeys(68)
  public static let fontFamily = StateKeys(69)
  public static let letterSpacing = StateKeys(70)
  public static let fontVariantNumeric = StateKeys(71)
  public static let objectPosition = StateKeys(72)
  public static let writingMode = StateKeys(73)
  public static let unicodeBidi = StateKeys(74)
  public static let hyphens = StateKeys(75)
  public static let caretColor = StateKeys(76)
  public static let wordSpacing = StateKeys(77)
  public static let fontStretch = StateKeys(78)
  public static let textIndent = StateKeys(79)
  public static let lineClamp = StateKeys(80)
  public static let transformOrigin = StateKeys(81)
  public static let textOrientation = StateKeys(82)
  public static let textCombineUpright = StateKeys(83)
  public static let textSpacingTrim = StateKeys(84)
  public static let visibility = StateKeys(85)
  public static let fontFeatureSettings = StateKeys(86)
  // </style-keys:state>

  // <style-keys:state-groups> generated from tools/scripts/style-keys/style-keys.schema
  static let textLayout = StateKeys(low: 0xbf63800000000000, high: 0x00000000005deee7)
  static let textVisual = StateKeys(low: 0x409c000000000000, high: 0x0000000000000018)
  static let allText = StateKeys(low: 0xffff800000000000, high: 0x00000000005deeff)
  static let borderPaint = StateKeys(low: 0x0000070000010000, high: 0x0000000000000000)
  static let objectPaint = StateKeys(low: 0x0000200000000000, high: 0x0000000000000100)
  static let paintOnly = StateKeys(low: 0x409c670000000000, high: 0x0000000000021118)
  // </style-keys:state-groups>

  /// Union of all text-relevant keys that may differ in a pseudo buffer.
  public static let pseudoText = StateKeys(
    low: color.low
      | fontSize.low
      | fontWeight.low
      | fontStyle.low
      | fontFamily.low
      | textWrap.low
      | whiteSpace.low
      | textTransform.low
      | decorationLine.low
      | decorationColor.low
      | decorationStyle.low
      | decorationThinkness.low
      | letterSpacing.low
      | textJustify.low
      | backgroundColor.low
      | lineHeight.low
      | textAlign.low
      | textOverflow.low
      | textShadow.low
      | verticalAlign.low,
    high: color.high
      | fontSize.high
      | fontWeight.high
      | fontStyle.high
      | fontFamily.high
      | fontVariantNumeric.high
      | fontFeatureSettings.high
      | textWrap.high
      | whiteSpace.high
      | textTransform.high
      | decorationLine.high
      | decorationColor.high
      | decorationStyle.high
      | decorationThinkness.high
      | letterSpacing.high
      | textJustify.high
      | backgroundColor.high
      | lineHeight.high
      | textAlign.high
      | textOverflow.high
      | textShadow.high
      | verticalAlign.high
  )
}


protocol StyleChangeListener: AnyObject {
  func onStyleChange(_ low: UInt64, _ high: UInt64)
}

internal struct StyleState {
  static let INHERIT: UInt8 = 0
  static let SET: UInt8 = 1
  static let INITIAL: UInt8 = 2
}


struct FontMetrics {
  /// Distance from baseline to top of tallest glyph (positive value)
  let ascent: Float
  /// Distance from baseline to bottom of lowest glyph (positive value)
  let descent: Float
  /// Height of lowercase 'x' (used for middle alignment)
  let x_height: Float
  /// Leading (extra space between lines)
  let leading: Float
  /// Cap height (height of capital letters)
  let cap_height: Float
}

@objc(MasonStyle)
@objcMembers
public class MasonStyle: NSObject {
  // <style-keys:writes> generated from tools/scripts/style-keys/style-keys.schema
  private func writeAlignContent(_ alignContent: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.ALIGN_CONTENT, alignContent)
    setOrAppendState(StateKeys.alignContent)
  }

  private func writeAlignItems(_ alignItems: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.ALIGN_ITEMS, alignItems)
    setOrAppendState(StateKeys.alignItems)
  }

  private func writeAlignSelf(_ alignSelf: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.ALIGN_SELF, alignSelf)
    setOrAppendState(StateKeys.alignSelf)
  }

  private func writeAspectRatio(_ aspectRatio: Float) {
    prepareMut()
    setFloat(StyleKeys.ASPECT_RATIO, aspectRatio)
    setOrAppendState(StateKeys.aspectRatio)
  }

  private func writeBackgroundColor(_ backgroundColor: UInt32, _ backgroundColorState: UInt8, _ backgroundColorType: UInt8) {
    prepareMut()
    setUInt32(StyleKeys.BACKGROUND_COLOR, backgroundColor)
    setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, backgroundColorState)
    setUInt8(StyleKeys.BACKGROUND_COLOR_TYPE, backgroundColorType)
    let state = StateKeys.backgroundColor
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeBorderBottomWidth(_ borderBottomType: UInt8, _ borderBottomValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.BORDER_BOTTOM_TYPE, borderBottomType)
    setFloat(StyleKeys.BORDER_BOTTOM_VALUE, borderBottomValue)
    setOrAppendState(StateKeys.border)
  }

  private func writeBorderLeftWidth(_ borderLeftType: UInt8, _ borderLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.BORDER_LEFT_TYPE, borderLeftType)
    setFloat(StyleKeys.BORDER_LEFT_VALUE, borderLeftValue)
    setOrAppendState(StateKeys.border)
  }

  private func writeBorderRightWidth(_ borderRightType: UInt8, _ borderRightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.BORDER_RIGHT_TYPE, borderRightType)
    setFloat(StyleKeys.BORDER_RIGHT_VALUE, borderRightValue)
    setOrAppendState(StateKeys.border)
  }

  private func writeBorderTopWidth(_ borderTopType: UInt8, _ borderTopValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.BORDER_TOP_TYPE, borderTopType)
    setFloat(StyleKeys.BORDER_TOP_VALUE, borderTopValue)
    setOrAppendState(StateKeys.border)
  }

  private func writeBorderColors(_ borderTopColor: UInt32, _ borderRightColor: UInt32, _ borderBottomColor: UInt32, _ borderLeftColor: UInt32) {
    prepareMut()
    setUInt32(StyleKeys.BORDER_TOP_COLOR, borderTopColor)
    setUInt32(StyleKeys.BORDER_RIGHT_COLOR, borderRightColor)
    setUInt32(StyleKeys.BORDER_BOTTOM_COLOR, borderBottomColor)
    setUInt32(StyleKeys.BORDER_LEFT_COLOR, borderLeftColor)
    setOrAppendState(StateKeys.borderColor)
  }

  private func writeBorderWidth(_ borderTopType: UInt8, _ borderTopValue: Float, _ borderRightType: UInt8, _ borderRightValue: Float, _ borderBottomType: UInt8, _ borderBottomValue: Float, _ borderLeftType: UInt8, _ borderLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.BORDER_TOP_TYPE, borderTopType)
    setFloat(StyleKeys.BORDER_TOP_VALUE, borderTopValue)
    setUInt8(StyleKeys.BORDER_RIGHT_TYPE, borderRightType)
    setFloat(StyleKeys.BORDER_RIGHT_VALUE, borderRightValue)
    setUInt8(StyleKeys.BORDER_BOTTOM_TYPE, borderBottomType)
    setFloat(StyleKeys.BORDER_BOTTOM_VALUE, borderBottomValue)
    setUInt8(StyleKeys.BORDER_LEFT_TYPE, borderLeftType)
    setFloat(StyleKeys.BORDER_LEFT_VALUE, borderLeftValue)
    setOrAppendState(StateKeys.border)
  }

  private func writeCornerShapeTopLeft(_ borderRadiusTopLeftExponent: Float) {
    prepareMut()
    setFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, borderRadiusTopLeftExponent)
    mBorderRender.cssRadius.topLeft.exponent = CGFloat(borderRadiusTopLeftExponent)
    mBorderRender.invalidateCache()
    setOrAppendState(StateKeys.borderRadius)
  }

  private func writeCornerShapeTopRight(_ borderRadiusTopRightExponent: Float) {
    prepareMut()
    setFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, borderRadiusTopRightExponent)
    mBorderRender.cssRadius.topRight.exponent = CGFloat(borderRadiusTopRightExponent)
    mBorderRender.invalidateCache()
    setOrAppendState(StateKeys.borderRadius)
  }

  private func writeCornerShapeBottomRight(_ borderRadiusBottomRightExponent: Float) {
    prepareMut()
    setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, borderRadiusBottomRightExponent)
    mBorderRender.cssRadius.bottomRight.exponent = CGFloat(borderRadiusBottomRightExponent)
    mBorderRender.invalidateCache()
    setOrAppendState(StateKeys.borderRadius)
  }

  private func writeCornerShapeBottomLeft(_ borderRadiusBottomLeftExponent: Float) {
    prepareMut()
    setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, borderRadiusBottomLeftExponent)
    mBorderRender.cssRadius.bottomLeft.exponent = CGFloat(borderRadiusBottomLeftExponent)
    mBorderRender.invalidateCache()
    setOrAppendState(StateKeys.borderRadius)
  }

  private func writeCornerShape(_ borderRadiusTopLeftExponent: Float, _ borderRadiusTopRightExponent: Float, _ borderRadiusBottomRightExponent: Float, _ borderRadiusBottomLeftExponent: Float) {
    prepareMut()
    setFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, borderRadiusTopLeftExponent)
    setFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, borderRadiusTopRightExponent)
    setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, borderRadiusBottomRightExponent)
    setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, borderRadiusBottomLeftExponent)
    mBorderRender.cssRadius.topLeft.exponent = CGFloat(borderRadiusTopLeftExponent)
    mBorderRender.cssRadius.topRight.exponent = CGFloat(borderRadiusTopRightExponent)
    mBorderRender.cssRadius.bottomRight.exponent = CGFloat(borderRadiusBottomRightExponent)
    mBorderRender.cssRadius.bottomLeft.exponent = CGFloat(borderRadiusBottomLeftExponent)
    mBorderRender.invalidateCache()
    setOrAppendState(StateKeys.borderRadius)
  }

  private func writeBoxSizing(_ boxSizing: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.BOX_SIZING, boxSizing)
    setOrAppendState(StateKeys.boxSizing)
  }

  private func writeClear(_ clear: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.CLEAR, clear)
    setOrAppendState(StateKeys.clear)
  }

  private func writeDecorationLine(_ decorationLine: UInt8, _ decorationLineState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.DECORATION_LINE, decorationLine)
    setUInt8(StyleKeys.DECORATION_LINE_STATE, decorationLineState)
    let state = StateKeys.decorationLine
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeDecorationStyle(_ decorationStyle: UInt8, _ decorationStyleState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.DECORATION_STYLE, decorationStyle)
    setUInt8(StyleKeys.DECORATION_STYLE_STATE, decorationStyleState)
    let state = StateKeys.decorationStyle
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeDecorationColor(_ decorationColor: UInt32, _ decorationColorState: UInt8) {
    prepareMut()
    setUInt32(StyleKeys.DECORATION_COLOR, decorationColor)
    setUInt8(StyleKeys.DECORATION_COLOR_STATE, decorationColorState)
    let state = StateKeys.decorationColor
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeDecorationThickness(_ decorationThickness: Float, _ decorationThicknessState: UInt8) {
    prepareMut()
    setFloat(StyleKeys.DECORATION_THICKNESS, decorationThickness)
    setUInt8(StyleKeys.DECORATION_THICKNESS_STATE, decorationThicknessState)
    let state = StateKeys.decorationThinkness
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeDirection(_ direction: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.DIRECTION, direction)
    setOrAppendState(StateKeys.direction)
  }

  private func writeDisplay(_ display: UInt8, _ displayMode: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.DISPLAY, display)
    setUInt8(StyleKeys.DISPLAY_MODE, displayMode)
    setOrAppendState(StateKeys.display.union(StateKeys.displayMode))
  }

  private func writeFlexBasisType(_ flexBasisType: UInt8, _ flexBasisValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.FLEX_BASIS_TYPE, flexBasisType)
    setFloat(StyleKeys.FLEX_BASIS_VALUE, flexBasisValue)
    setOrAppendState(StateKeys.flexBasis)
  }

  private func writeFlexDirection(_ flexDirection: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.FLEX_DIRECTION, flexDirection)
    setOrAppendState(StateKeys.flexDirection)
  }

  private func writeFlexGrow(_ flexGrow: Float) {
    prepareMut()
    setFloat(StyleKeys.FLEX_GROW, flexGrow)
    setOrAppendState(StateKeys.flexGrow)
  }

  private func writeFlexShrink(_ flexShrink: Float) {
    prepareMut()
    setFloat(StyleKeys.FLEX_SHRINK, flexShrink)
    setOrAppendState(StateKeys.flexShrink)
  }

  private func writeFlexWrap(_ flexWrap: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.FLEX_WRAP, flexWrap)
    setOrAppendState(StateKeys.flexWrap)
  }

  private func writeTextDecoration(_ decorationLine: UInt8, _ decorationStyle: UInt8, _ decorationColor: UInt32, _ decorationThickness: Float, _ decorationLineState: UInt8, _ decorationStyleState: UInt8, _ decorationColorState: UInt8, _ decorationThicknessState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.DECORATION_LINE, decorationLine)
    setUInt8(StyleKeys.DECORATION_STYLE, decorationStyle)
    setUInt32(StyleKeys.DECORATION_COLOR, decorationColor)
    setFloat(StyleKeys.DECORATION_THICKNESS, decorationThickness)
    setUInt8(StyleKeys.DECORATION_LINE_STATE, decorationLineState)
    setUInt8(StyleKeys.DECORATION_STYLE_STATE, decorationStyleState)
    setUInt8(StyleKeys.DECORATION_COLOR_STATE, decorationColorState)
    setUInt8(StyleKeys.DECORATION_THICKNESS_STATE, decorationThicknessState)
    let state = StateKeys.decorationLine.union(StateKeys.decorationStyle).union(StateKeys.decorationColor).union(StateKeys.decorationThinkness)
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeFloat(_ float: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.FLOAT, float)
    setOrAppendState(StateKeys.float)
  }

  private func writeFontColor(_ fontColor: UInt32, _ fontColorState: UInt8) {
    prepareMut()
    setUInt32(StyleKeys.FONT_COLOR, fontColor)
    setUInt8(StyleKeys.FONT_COLOR_STATE, fontColorState)
    let state = StateKeys.color
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeFontSize(_ fontSize: Float, _ fontSizeState: UInt8, _ fontSizeType: UInt8) {
    prepareMut()
    setFloat(StyleKeys.FONT_SIZE, fontSize)
    setUInt8(StyleKeys.FONT_SIZE_STATE, fontSizeState)
    setUInt8(StyleKeys.FONT_SIZE_TYPE, fontSizeType)
    let state = StateKeys.fontSize
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeFontStretch(_ fontStretch: Int32, _ fontStretchState: UInt8) {
    prepareMut()
    setInt32(StyleKeys.FONT_STRETCH, fontStretch)
    setUInt8(StyleKeys.FONT_STRETCH_STATE, fontStretchState)
    let state = StateKeys.fontStretch
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeFontStyle(_ fontStyleType: UInt8, _ fontStyleState: UInt8, _ fontStyleSlant: Int32) {
    prepareMut()
    setUInt8(StyleKeys.FONT_STYLE_TYPE, fontStyleType)
    setUInt8(StyleKeys.FONT_STYLE_STATE, fontStyleState)
    setInt32(StyleKeys.FONT_STYLE_SLANT, fontStyleSlant)
    let state = StateKeys.fontStyle
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeFontVariantNumeric(_ fontVariantNumeric: UInt8, _ fontVariantNumericState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.FONT_VARIANT_NUMERIC, fontVariantNumeric)
    setUInt8(StyleKeys.FONT_VARIANT_NUMERIC_STATE, fontVariantNumericState)
    let state = StateKeys.fontVariantNumeric
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeFontWeight(_ fontWeight: Int32, _ fontWeightState: UInt8) {
    prepareMut()
    setInt32(StyleKeys.FONT_WEIGHT, fontWeight)
    setUInt8(StyleKeys.FONT_WEIGHT_STATE, fontWeightState)
    let state = StateKeys.fontWeight
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeColumnGap(_ gapColumnType: UInt8, _ gapColumnValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.GAP_COLUMN_TYPE, gapColumnType)
    setFloat(StyleKeys.GAP_COLUMN_VALUE, gapColumnValue)
    setOrAppendState(StateKeys.gap)
  }

  private func writeGap(_ gapRowType: UInt8, _ gapRowValue: Float, _ gapColumnType: UInt8, _ gapColumnValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.GAP_ROW_TYPE, gapRowType)
    setFloat(StyleKeys.GAP_ROW_VALUE, gapRowValue)
    setUInt8(StyleKeys.GAP_COLUMN_TYPE, gapColumnType)
    setFloat(StyleKeys.GAP_COLUMN_VALUE, gapColumnValue)
    setOrAppendState(StateKeys.gap)
  }

  private func writeRowGap(_ gapRowType: UInt8, _ gapRowValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.GAP_ROW_TYPE, gapRowType)
    setFloat(StyleKeys.GAP_ROW_VALUE, gapRowValue)
    setOrAppendState(StateKeys.gap)
  }

  private func writeGridAutoFlow(_ gridAutoFlow: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.GRID_AUTO_FLOW, gridAutoFlow)
    setOrAppendState(StateKeys.gridAutoFlow)
  }

  private func writeHeight(_ heightType: UInt8, _ heightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.HEIGHT_TYPE, heightType)
    setFloat(StyleKeys.HEIGHT_VALUE, heightValue)
    setOrAppendState(StateKeys.size)
  }

  private func writeHyphens(_ hyphens: UInt8, _ hyphensState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.HYPHENS, hyphens)
    setUInt8(StyleKeys.HYPHENS_STATE, hyphensState)
    let state = StateKeys.hyphens
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeInsetBottomType(_ insetBottomType: UInt8, _ insetBottomValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.INSET_BOTTOM_TYPE, insetBottomType)
    setFloat(StyleKeys.INSET_BOTTOM_VALUE, insetBottomValue)
    setOrAppendState(StateKeys.inset)
  }

  private func writeInsetLeftType(_ insetLeftType: UInt8, _ insetLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.INSET_LEFT_TYPE, insetLeftType)
    setFloat(StyleKeys.INSET_LEFT_VALUE, insetLeftValue)
    setOrAppendState(StateKeys.inset)
  }

  private func writeInsetRightType(_ insetRightType: UInt8, _ insetRightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.INSET_RIGHT_TYPE, insetRightType)
    setFloat(StyleKeys.INSET_RIGHT_VALUE, insetRightValue)
    setOrAppendState(StateKeys.inset)
  }

  private func writeInsetTopType(_ insetTopType: UInt8, _ insetTopValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.INSET_TOP_TYPE, insetTopType)
    setFloat(StyleKeys.INSET_TOP_VALUE, insetTopValue)
    setOrAppendState(StateKeys.inset)
  }

  private func writeJustifyContent(_ justifyContent: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.JUSTIFY_CONTENT, justifyContent)
    setOrAppendState(StateKeys.justifyContent)
  }

  private func writeJustifyItems(_ justifyItems: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.JUSTIFY_ITEMS, justifyItems)
    setOrAppendState(StateKeys.justifyItems)
  }

  private func writeJustifySelf(_ justifySelf: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.JUSTIFY_SELF, justifySelf)
    setOrAppendState(StateKeys.justifySelf)
  }

  private func writeLetterSpacing(_ letterSpacing: Float, _ letterSpacingState: UInt8) {
    prepareMut()
    setFloat(StyleKeys.LETTER_SPACING, letterSpacing)
    setUInt8(StyleKeys.LETTER_SPACING_STATE, letterSpacingState)
    let state = StateKeys.letterSpacing
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeLineHeight(_ lineHeight: Float, _ lineHeightState: UInt8, _ lineHeightType: UInt8) {
    prepareMut()
    setFloat(StyleKeys.LINE_HEIGHT, lineHeight)
    setUInt8(StyleKeys.LINE_HEIGHT_STATE, lineHeightState)
    setUInt8(StyleKeys.LINE_HEIGHT_TYPE, lineHeightType)
    let state = StateKeys.lineHeight
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeLineHeightState(_ lineHeightState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.LINE_HEIGHT_STATE, lineHeightState)
    let state = StateKeys.lineHeight
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeListStylePosition(_ listStylePosition: UInt8, _ listStylePositionState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.LIST_STYLE_POSITION, listStylePosition)
    setUInt8(StyleKeys.LIST_STYLE_POSITION_STATE, listStylePositionState)
    setOrAppendState(StateKeys.listStylePosition)
  }

  private func writeListStyleType(_ listStyleType: UInt8, _ listStyleTypeState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.LIST_STYLE_TYPE, listStyleType)
    setUInt8(StyleKeys.LIST_STYLE_TYPE_STATE, listStyleTypeState)
    setOrAppendState(StateKeys.listStyleType)
  }

  private func writeMarginBottomType(_ marginBottomType: UInt8, _ marginBottomValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MARGIN_BOTTOM_TYPE, marginBottomType)
    setFloat(StyleKeys.MARGIN_BOTTOM_VALUE, marginBottomValue)
    setOrAppendState(StateKeys.margin)
  }

  private func writeMarginLeftType(_ marginLeftType: UInt8, _ marginLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MARGIN_LEFT_TYPE, marginLeftType)
    setFloat(StyleKeys.MARGIN_LEFT_VALUE, marginLeftValue)
    setOrAppendState(StateKeys.margin)
  }

  private func writeMarginRightType(_ marginRightType: UInt8, _ marginRightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MARGIN_RIGHT_TYPE, marginRightType)
    setFloat(StyleKeys.MARGIN_RIGHT_VALUE, marginRightValue)
    setOrAppendState(StateKeys.margin)
  }

  private func writeMarginTopType(_ marginTopType: UInt8, _ marginTopValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MARGIN_TOP_TYPE, marginTopType)
    setFloat(StyleKeys.MARGIN_TOP_VALUE, marginTopValue)
    setOrAppendState(StateKeys.margin)
  }

  private func writeMaxHeight(_ maxHeightType: UInt8, _ maxHeightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MAX_HEIGHT_TYPE, maxHeightType)
    setFloat(StyleKeys.MAX_HEIGHT_VALUE, maxHeightValue)
    setOrAppendState(StateKeys.maxSize)
  }

  private func writeMaxSize(_ maxWidthType: UInt8, _ maxWidthValue: Float, _ maxHeightType: UInt8, _ maxHeightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MAX_WIDTH_TYPE, maxWidthType)
    setFloat(StyleKeys.MAX_WIDTH_VALUE, maxWidthValue)
    setUInt8(StyleKeys.MAX_HEIGHT_TYPE, maxHeightType)
    setFloat(StyleKeys.MAX_HEIGHT_VALUE, maxHeightValue)
    setOrAppendState(StateKeys.maxSize)
  }

  private func writeMaxWidth(_ maxWidthType: UInt8, _ maxWidthValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MAX_WIDTH_TYPE, maxWidthType)
    setFloat(StyleKeys.MAX_WIDTH_VALUE, maxWidthValue)
    setOrAppendState(StateKeys.maxSize)
  }

  private func writeMinHeight(_ minHeightType: UInt8, _ minHeightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MIN_HEIGHT_TYPE, minHeightType)
    setFloat(StyleKeys.MIN_HEIGHT_VALUE, minHeightValue)
    setOrAppendState(StateKeys.minSize)
  }

  private func writeMinSize(_ minWidthType: UInt8, _ minWidthValue: Float, _ minHeightType: UInt8, _ minHeightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MIN_WIDTH_TYPE, minWidthType)
    setFloat(StyleKeys.MIN_WIDTH_VALUE, minWidthValue)
    setUInt8(StyleKeys.MIN_HEIGHT_TYPE, minHeightType)
    setFloat(StyleKeys.MIN_HEIGHT_VALUE, minHeightValue)
    setOrAppendState(StateKeys.minSize)
  }

  private func writeMinWidth(_ minWidthType: UInt8, _ minWidthValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MIN_WIDTH_TYPE, minWidthType)
    setFloat(StyleKeys.MIN_WIDTH_VALUE, minWidthValue)
    setOrAppendState(StateKeys.minSize)
  }

  private func writeObjectFit(_ objectFit: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.OBJECT_FIT, objectFit)
    setOrAppendState(StateKeys.objectFit)
  }

  private func writeOverflowX(_ overflowX: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.OVERFLOW_X, overflowX)
    setOrAppendState(StateKeys.overflowX)
  }

  private func writeOverflow(_ overflowX: UInt8, _ overflowY: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.OVERFLOW_X, overflowX)
    setUInt8(StyleKeys.OVERFLOW_Y, overflowY)
    setOrAppendState(StateKeys.overflowX.union(StateKeys.overflowY))
  }

  private func writeOverflowY(_ overflowY: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.OVERFLOW_Y, overflowY)
    setOrAppendState(StateKeys.overflowY)
  }

  private func writePaddingBottomType(_ paddingBottomType: UInt8, _ paddingBottomValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.PADDING_BOTTOM_TYPE, paddingBottomType)
    setFloat(StyleKeys.PADDING_BOTTOM_VALUE, paddingBottomValue)
    setOrAppendState(StateKeys.padding)
  }

  private func writePaddingLeftType(_ paddingLeftType: UInt8, _ paddingLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.PADDING_LEFT_TYPE, paddingLeftType)
    setFloat(StyleKeys.PADDING_LEFT_VALUE, paddingLeftValue)
    setOrAppendState(StateKeys.padding)
  }

  private func writePaddingRightType(_ paddingRightType: UInt8, _ paddingRightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.PADDING_RIGHT_TYPE, paddingRightType)
    setFloat(StyleKeys.PADDING_RIGHT_VALUE, paddingRightValue)
    setOrAppendState(StateKeys.padding)
  }

  private func writePaddingTopType(_ paddingTopType: UInt8, _ paddingTopValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.PADDING_TOP_TYPE, paddingTopType)
    setFloat(StyleKeys.PADDING_TOP_VALUE, paddingTopValue)
    setOrAppendState(StateKeys.padding)
  }

  private func writePosition(_ position: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.POSITION, position)
    setOrAppendState(StateKeys.position)
  }

  private func writeScrollbarWidth(_ scrollbarWidth: Float) {
    prepareMut()
    setFloat(StyleKeys.SCROLLBAR_WIDTH, scrollbarWidth)
    setOrAppendState(StateKeys.scrollbarWidth)
  }

  private func writeSize(_ widthType: UInt8, _ widthValue: Float, _ heightType: UInt8, _ heightValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.WIDTH_TYPE, widthType)
    setFloat(StyleKeys.WIDTH_VALUE, widthValue)
    setUInt8(StyleKeys.HEIGHT_TYPE, heightType)
    setFloat(StyleKeys.HEIGHT_VALUE, heightValue)
    setOrAppendState(StateKeys.size)
  }

  private func writeTextAlign(_ textAlign: UInt8, _ textAlignState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_ALIGN, textAlign)
    setUInt8(StyleKeys.TEXT_ALIGN_STATE, textAlignState)
    setOrAppendState(StateKeys.textAlign)
  }

  private func writeTextAlignAsAlign(_ textAlign: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_ALIGN, textAlign)
    setOrAppendState(StateKeys.align)
  }

  private func writeTextCombineUpright(_ textCombineUpright: UInt8, _ textCombineUprightState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_COMBINE_UPRIGHT, textCombineUpright)
    setUInt8(StyleKeys.TEXT_COMBINE_UPRIGHT_STATE, textCombineUprightState)
    let state = StateKeys.textCombineUpright
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeTextIndent(_ textIndent: Float, _ textIndentType: UInt8, _ textIndentState: UInt8) {
    prepareMut()
    setFloat(StyleKeys.TEXT_INDENT, textIndent)
    setUInt8(StyleKeys.TEXT_INDENT_TYPE, textIndentType)
    setUInt8(StyleKeys.TEXT_INDENT_STATE, textIndentState)
    let state = StateKeys.textIndent
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeTextJustify(_ textJustify: UInt8, _ textJustifyState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_JUSTIFY, textJustify)
    setUInt8(StyleKeys.TEXT_JUSTIFY_STATE, textJustifyState)
    let state = StateKeys.textJustify
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeTextOrientation(_ textOrientation: UInt8, _ textOrientationState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_ORIENTATION, textOrientation)
    setUInt8(StyleKeys.TEXT_ORIENTATION_STATE, textOrientationState)
    let state = StateKeys.textOrientation
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeTextSpacingTrim(_ textSpacingTrim: UInt8, _ textSpacingTrimState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_SPACING_TRIM, textSpacingTrim)
    setUInt8(StyleKeys.TEXT_SPACING_TRIM_STATE, textSpacingTrimState)
    let state = StateKeys.textSpacingTrim
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeTextTransform(_ textTransform: UInt8, _ textTransformState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_TRANSFORM, textTransform)
    setUInt8(StyleKeys.TEXT_TRANSFORM_STATE, textTransformState)
    let state = StateKeys.textTransform
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeTextWrap(_ textWrap: UInt8, _ textWrapState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TEXT_WRAP, textWrap)
    setUInt8(StyleKeys.TEXT_WRAP_STATE, textWrapState)
    let state = StateKeys.textWrap
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeTransformOrigin(_ transformOriginXType: UInt8, _ transformOriginYType: UInt8, _ transformOriginXValue: Float, _ transformOriginYValue: Float, _ transformOriginState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, transformOriginXType)
    setUInt8(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, transformOriginYType)
    setFloat(StyleKeys.TRANSFORM_ORIGIN_X_VALUE, transformOriginXValue)
    setFloat(StyleKeys.TRANSFORM_ORIGIN_Y_VALUE, transformOriginYValue)
    setUInt8(StyleKeys.TRANSFORM_ORIGIN_STATE, transformOriginState)
    if inBatch {
      setOrAppendState(StateKeys.transformOrigin)
    } else if transformDependsOnOrigin {
      applyTransformFromBuffer()
    }
  }

  private func writeUnicodeBidi(_ unicodeBidi: UInt8, _ unicodeBidiState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.UNICODE_BIDI, unicodeBidi)
    setUInt8(StyleKeys.UNICODE_BIDI_STATE, unicodeBidiState)
    let state = StateKeys.unicodeBidi
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeVerticalAlign(_ verticalAlignOffsetOffset: Float, _ verticalAlignIsPercentOffset: UInt8, _ verticalAlignEnumOffset: UInt8) {
    prepareMut()
    setFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, verticalAlignOffsetOffset)
    setUInt8(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, verticalAlignIsPercentOffset)
    setUInt8(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, verticalAlignEnumOffset)
    let state = StateKeys.verticalAlign
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeWhiteSpace(_ whiteSpace: UInt8, _ whiteSpaceState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.WHITE_SPACE, whiteSpace)
    setUInt8(StyleKeys.WHITE_SPACE_STATE, whiteSpaceState)
    let state = StateKeys.whiteSpace
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeWidth(_ widthType: UInt8, _ widthValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.WIDTH_TYPE, widthType)
    setFloat(StyleKeys.WIDTH_VALUE, widthValue)
    setOrAppendState(StateKeys.size)
  }

  private func writeWritingMode(_ writingMode: UInt8, _ writingModeState: UInt8) {
    prepareMut()
    setUInt8(StyleKeys.WRITING_MODE, writingMode)
    setUInt8(StyleKeys.WRITING_MODE_STATE, writingModeState)
    let state = StateKeys.writingMode
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeWordSpacing(_ wordSpacing: Float, _ wordSpacingType: UInt8, _ wordSpacingState: UInt8) {
    prepareMut()
    setFloat(StyleKeys.WORD_SPACING, wordSpacing)
    setUInt8(StyleKeys.WORD_SPACING_TYPE, wordSpacingType)
    setUInt8(StyleKeys.WORD_SPACING_STATE, wordSpacingState)
    let state = StateKeys.wordSpacing
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeZIndex(_ zIndex: Int32) {
    prepareMut()
    setInt32(StyleKeys.Z_INDEX, zIndex)
    setOrAppendState(StateKeys.zIndex)
  }

  private func writeLineClampText(_ lineClamp: Int32, _ lineClampState: UInt8) {
    prepareMut()
    setInt32(StyleKeys.LINE_CLAMP, lineClamp)
    setUInt8(StyleKeys.LINE_CLAMP_STATE, lineClampState)
    let state = StateKeys.lineClamp
    if (inBatch) {
      setOrAppendState(state)
    } else {
      notifyTextStyleChanged(state)
    }
  }

  private func writeInset(_ insetTopType: UInt8, _ insetTopValue: Float, _ insetRightType: UInt8, _ insetRightValue: Float, _ insetBottomType: UInt8, _ insetBottomValue: Float, _ insetLeftType: UInt8, _ insetLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.INSET_TOP_TYPE, insetTopType)
    setFloat(StyleKeys.INSET_TOP_VALUE, insetTopValue)
    setUInt8(StyleKeys.INSET_RIGHT_TYPE, insetRightType)
    setFloat(StyleKeys.INSET_RIGHT_VALUE, insetRightValue)
    setUInt8(StyleKeys.INSET_BOTTOM_TYPE, insetBottomType)
    setFloat(StyleKeys.INSET_BOTTOM_VALUE, insetBottomValue)
    setUInt8(StyleKeys.INSET_LEFT_TYPE, insetLeftType)
    setFloat(StyleKeys.INSET_LEFT_VALUE, insetLeftValue)
    setOrAppendState(StateKeys.inset)
  }

  private func writeMargin(_ marginTopType: UInt8, _ marginTopValue: Float, _ marginRightType: UInt8, _ marginRightValue: Float, _ marginBottomType: UInt8, _ marginBottomValue: Float, _ marginLeftType: UInt8, _ marginLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.MARGIN_TOP_TYPE, marginTopType)
    setFloat(StyleKeys.MARGIN_TOP_VALUE, marginTopValue)
    setUInt8(StyleKeys.MARGIN_RIGHT_TYPE, marginRightType)
    setFloat(StyleKeys.MARGIN_RIGHT_VALUE, marginRightValue)
    setUInt8(StyleKeys.MARGIN_BOTTOM_TYPE, marginBottomType)
    setFloat(StyleKeys.MARGIN_BOTTOM_VALUE, marginBottomValue)
    setUInt8(StyleKeys.MARGIN_LEFT_TYPE, marginLeftType)
    setFloat(StyleKeys.MARGIN_LEFT_VALUE, marginLeftValue)
    setOrAppendState(StateKeys.margin)
  }

  private func writePadding(_ paddingTopType: UInt8, _ paddingTopValue: Float, _ paddingRightType: UInt8, _ paddingRightValue: Float, _ paddingBottomType: UInt8, _ paddingBottomValue: Float, _ paddingLeftType: UInt8, _ paddingLeftValue: Float) {
    prepareMut()
    setUInt8(StyleKeys.PADDING_TOP_TYPE, paddingTopType)
    setFloat(StyleKeys.PADDING_TOP_VALUE, paddingTopValue)
    setUInt8(StyleKeys.PADDING_RIGHT_TYPE, paddingRightType)
    setFloat(StyleKeys.PADDING_RIGHT_VALUE, paddingRightValue)
    setUInt8(StyleKeys.PADDING_BOTTOM_TYPE, paddingBottomType)
    setFloat(StyleKeys.PADDING_BOTTOM_VALUE, paddingBottomValue)
    setUInt8(StyleKeys.PADDING_LEFT_TYPE, paddingLeftType)
    setFloat(StyleKeys.PADDING_LEFT_VALUE, paddingLeftValue)
    setOrAppendState(StateKeys.padding)
  }
  // </style-keys:writes>

  // <style-keys:accessors> generated from tools/scripts/style-keys/style-keys.schema
  public var display: Display {
    get {
      if visibilityCode == 2 { return .None }
      switch (getInt8(StyleKeys.DISPLAY), getInt8(StyleKeys.DISPLAY_MODE)) {
      case (let base, 0): return Display(rawValue: base)!
      case (_, 1): return .Inline
      case (3, 2): return .InlineBlock
      case (1, 2): return .InlineFlex
      case (2, 2): return .InlineGrid
      default: preconditionFailure("Invalid display encoding")
      }
    }
    set {
      switch newValue {
      case .None: writeDisplay(0, 0)
      case .Flex: writeDisplay(1, 0)
      case .Grid: writeDisplay(2, 0)
      case .Block: writeDisplay(3, 0)
      case .Inline: writeDisplay(3, 1)
      case .InlineBlock: writeDisplay(3, 2)
      case .InlineFlex: writeDisplay(1, 2)
      case .InlineGrid: writeDisplay(2, 2)
      }
      updateDisplayVisibility(newValue)
    }
  }

  public var textOverflow: TextOverflow {
    get { decodeTextOverflow(getInt8(StyleKeys.TEXT_OVERFLOW)) }
    set {
      applyTextOverflow(newValue)
    }
  }

  /// Transform origin in device pixels or a fraction of the box size.
  public var transformOrigin: (x: MasonLengthPercentage, y: MasonLengthPercentage) {
    get {
      guard hasTransformOrigin else { return (.Percent(0.5), .Percent(0.5)) }
      func side(_ type: Int, _ value: Int) -> MasonLengthPercentage {
        let amount = getFloat(value)
        return getUInt8(type) == 1 ? .Percent(amount / 100) : .Points(amount)
      }
      return (side(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, StyleKeys.TRANSFORM_ORIGIN_X_VALUE), side(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, StyleKeys.TRANSFORM_ORIGIN_Y_VALUE))
    }
    set {
      func side(_ value: MasonLengthPercentage) -> (UInt8, Float) {
        switch value {
        case .Points(let value): return (0, value)
        case .Percent(let value): return (1, value * 100)
        case .Zero: return (0, 0)
        }
      }
      let (xType, x) = side(newValue.x)
      let (yType, y) = side(newValue.y)
      writeTransformOrigin(xType, yType, x, y, StyleState.SET)
    }
  }

  internal var hasTransformOrigin: Bool { getUInt8(StyleKeys.TRANSFORM_ORIGIN_STATE) != 0 }

  /// Applies the shorthand as one style write.
  public func setTextDecoration(_ css: String) {
    guard let fields = NSCMason.expandCssShorthand("text-decoration", value: css),
          fields.count == TextDecorationRecord.stride,
          let thickness = resolveDecorationThickness(fields[TextDecorationRecord.thickness]) else { return }
    setParsedTextDecoration(fields, thickness: thickness)
  }

  internal func setParsedTextDecoration(_ fields: [String], thickness: Float) {
    guard fields.count == TextDecorationRecord.stride,
          let line = UInt8(fields[TextDecorationRecord.line]),
          let style = UInt8(fields[TextDecorationRecord.style]),
          let color = UInt32(fields[TextDecorationRecord.color]) else { return }
    writeTextDecoration(line, style, color, thickness, StyleState.SET, StyleState.SET, StyleState.SET, StyleState.SET)
  }

  public var textDecorationLine: String {
    get { decorationLine.cssValue }
    set { if let value = DecorationLine.parse(newValue) { decorationLine = value } }
  }

  public var textDecorationStyle: String {
    get { decorationStyle.cssValue }
    set { if let value = DecorationStyle.parse(newValue) { decorationStyle = value } }
  }

  public var textDecorationColor: String {
    get {
      let color = decorationColor
      return color == Constants.UNSET_COLOR ? "currentcolor" : color.rgbaToHexCSS()
    }
    set { setDecorationColor(css: newValue) }
  }

  /// Text indent as a length or a percentage of the line width.
  public var textIndent: MasonLengthPercentage {
    get {
      let amount = getFloat(StyleKeys.TEXT_INDENT)
      return getUInt8(StyleKeys.TEXT_INDENT_TYPE) == 1 ? .Percent(amount / 100) : .Points(amount)
    }
    set {
      switch newValue {
      case .Points(let value): writeTextIndent(value, 0, StyleState.SET)
      case .Percent(let value): writeTextIndent(value * 100, 1, StyleState.SET)
      case .Zero: writeTextIndent(0, 0, StyleState.SET)
      }
    }
  }

  public var verticalAlign: MasonVerticalAlignValue {
    get { MasonVerticalAlignValue(storedOffset: getFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET), isPercent: getUInt8(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET) == 1, kind: getUInt8(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET)) }
    set { writeVerticalAlign(newValue.offset, newValue.isPercent ? 1 : 0, UInt8(newValue.align.rawValue)) }
  }

  public var fontVariantNumeric: FontVariantNumeric {
    get { FontVariantNumeric(rawValue: getUInt8(StyleKeys.FONT_VARIANT_NUMERIC)) }
    set {
      if newValue != fontVariantNumeric || getUInt8(StyleKeys.FONT_VARIANT_NUMERIC_STATE) != StyleState.SET {
        writeFontVariantNumeric(newValue.rawValue, StyleState.SET)
      }
    }
  }

  public var fontStyle: FontStyle {
    get { FontStyle(rawValue: getInt8(StyleKeys.FONT_STYLE_TYPE)) ?? FontStyle(fontStyle: font.fontDescriptors.style) }
    set { setFontStyle(newValue, 0) }
  }

  public var fontWeight: String {
    get { weightName }
    set {
      guard let fields = NSCMason.expandCssShorthand("font-weight", value: newValue) else { return }
      setParsedFontWeight(fields)
    }
  }

  internal var visibilityCode: UInt8 { getUInt8(StyleKeys.VISIBILITY) }

  internal var hyphens: UInt8 {
    get { getUInt8(StyleKeys.HYPHENS) }
    set {
      writeHyphens(newValue, StyleState.SET)
    }
  }

  internal var writingMode: UInt8 {
    get { getUInt8(StyleKeys.WRITING_MODE) }
    set {
      writeWritingMode(newValue, StyleState.SET)
    }
  }

  internal var unicodeBidi: UInt8 {
    get { getUInt8(StyleKeys.UNICODE_BIDI) }
    set {
      writeUnicodeBidi(newValue, StyleState.SET)
    }
  }

  internal var textOrientation: UInt8 {
    get { getUInt8(StyleKeys.TEXT_ORIENTATION) }
    set {
      writeTextOrientation(newValue, StyleState.SET)
    }
  }

  internal var textCombineUpright: UInt8 {
    get { getUInt8(StyleKeys.TEXT_COMBINE_UPRIGHT) }
    set {
      writeTextCombineUpright(newValue, StyleState.SET)
    }
  }

  internal var textSpacingTrim: UInt8 {
    get { getUInt8(StyleKeys.TEXT_SPACING_TRIM) }
    set {
      writeTextSpacingTrim(newValue, StyleState.SET)
    }
  }

  public var align: Align {
    get { Align(rawValue: getInt8(StyleKeys.TEXT_ALIGN))! }
    set {
      writeTextAlignAsAlign(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var alignContent: AlignContent {
    get { AlignContent(rawValue: getInt8(StyleKeys.ALIGN_CONTENT))! }
    set {
      writeAlignContent(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var alignItems: AlignItems {
    get { AlignItems(rawValue: getInt8(StyleKeys.ALIGN_ITEMS))! }
    set {
      writeAlignItems(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var alignSelf: AlignSelf {
    get { AlignSelf(rawValue: getInt8(StyleKeys.ALIGN_SELF))! }
    set {
      writeAlignSelf(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var aspectRatio: Float? {
    get {
      let value = getFloat(StyleKeys.ASPECT_RATIO)
      return value.isNaN ? nil : value
    }
    set {
      writeAspectRatio(newValue ?? .nan)
    }
  }

  public var backgroundColor: UInt32 {
    get { getUInt32(StyleKeys.BACKGROUND_COLOR) }
    set {
      writeBackgroundColor(newValue, StyleState.SET, 0)
    }
  }

  public func setBorderColor(_ css: String) {
    guard let fields = NSCMason.expandCssShorthand("border-color-values", value: css) else { return }
    let sides = fields.compactMap { UInt32($0) }
    guard sides.count == 4 else { return }
    writeBorderColors(sides[0], sides[1], sides[2], sides[3])
  }

  public var borderWidth: MasonRect<MasonLengthPercentage> {
    get {
      return MasonRect(
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.BORDER_TOP_VALUE), getInt8(StyleKeys.BORDER_TOP_TYPE))!,
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.BORDER_RIGHT_VALUE), getInt8(StyleKeys.BORDER_RIGHT_TYPE))!,
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.BORDER_BOTTOM_VALUE), getInt8(StyleKeys.BORDER_BOTTOM_TYPE))!,
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.BORDER_LEFT_VALUE), getInt8(StyleKeys.BORDER_LEFT_TYPE))!
      )
    }
    set {
      writeBorderWidth(
        UInt8(bitPattern: newValue.top.type),
        newValue.top.value,
        UInt8(bitPattern: newValue.right.type),
        newValue.right.value,
        UInt8(bitPattern: newValue.bottom.type),
        newValue.bottom.value,
        UInt8(bitPattern: newValue.left.type),
        newValue.left.value
      )
    }
  }

  public var cornerShapeTopLeft: String {
    get { CSSBorderRenderer.exponentToCornerShapeToken(Float(mBorderRender.cssRadius.topLeft.exponent)) }
    set {
      guard let exponent = CSSBorderRenderer.parseCornerShapeToken(newValue) else { return }
      writeCornerShapeTopLeft(exponent)
    }
  }

  public var cornerShapeTopRight: String {
    get { CSSBorderRenderer.exponentToCornerShapeToken(Float(mBorderRender.cssRadius.topRight.exponent)) }
    set {
      guard let exponent = CSSBorderRenderer.parseCornerShapeToken(newValue) else { return }
      writeCornerShapeTopRight(exponent)
    }
  }

  public var cornerShapeBottomRight: String {
    get { CSSBorderRenderer.exponentToCornerShapeToken(Float(mBorderRender.cssRadius.bottomRight.exponent)) }
    set {
      guard let exponent = CSSBorderRenderer.parseCornerShapeToken(newValue) else { return }
      writeCornerShapeBottomRight(exponent)
    }
  }

  public var cornerShapeBottomLeft: String {
    get { CSSBorderRenderer.exponentToCornerShapeToken(Float(mBorderRender.cssRadius.bottomLeft.exponent)) }
    set {
      guard let exponent = CSSBorderRenderer.parseCornerShapeToken(newValue) else { return }
      writeCornerShapeBottomLeft(exponent)
    }
  }

  private var authoredCornerShape = ""
  public var cornerShape: String {
    get { authoredCornerShape }
    set {
      authoredCornerShape = newValue
      guard let fields = NSCMason.expandCssShorthand("corner-shape", value: newValue), fields.count == 4,
            let topLeft = Float(fields[0]),
            let topRight = Float(fields[1]),
            let bottomRight = Float(fields[2]),
            let bottomLeft = Float(fields[3]) else { return }
      writeCornerShape(topLeft, topRight, bottomRight, bottomLeft)
    }
  }

  public var color: UInt32 {
    get { getUInt32(StyleKeys.FONT_COLOR) }
    set {
      writeFontColor(newValue, StyleState.SET)
    }
  }

  public var boxSizing: BoxSizing {
    get { BoxSizing(rawValue: getInt8(StyleKeys.BOX_SIZING))! }
    set {
      writeBoxSizing(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var clear: Clear {
    get { Clear(rawValue: getInt8(StyleKeys.CLEAR))! }
    set {
      writeClear(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var decorationColor: UInt32 {
    get { getUInt32(StyleKeys.DECORATION_COLOR) }
    set {
      writeDecorationColor(newValue, StyleState.SET)
    }
  }

  public var decorationLine: DecorationLine {
    get { DecorationLine(rawValue: getInt8(StyleKeys.DECORATION_LINE)) ?? .None }
    set {
      writeDecorationLine(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  public var decorationStyle: DecorationStyle {
    get { DecorationStyle(rawValue: getInt8(StyleKeys.DECORATION_STYLE)) ?? .Solid }
    set {
      writeDecorationStyle(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  /// Device px. Zero uses the font's underline thickness.
  public var decorationThickness: Float {
    get { getFloat(StyleKeys.DECORATION_THICKNESS) }
    set {
      writeDecorationThickness(newValue, StyleState.SET)
    }
  }

  public var direction: Direction {
    get { Direction(rawValue: getInt8(StyleKeys.DIRECTION))! }
    set {
      writeDirection(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var flexBasis: MasonDimension {
    get { MasonDimension.fromValueType(getFloat(StyleKeys.FLEX_BASIS_VALUE), getInt8(StyleKeys.FLEX_BASIS_TYPE)) ?? .Auto }
    set {
      writeFlexBasisType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var flexDirection: FlexDirection {
    get { FlexDirection(rawValue: getInt8(StyleKeys.FLEX_DIRECTION))! }
    set {
      writeFlexDirection(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var flexGrow: Float {
    get { getFloat(StyleKeys.FLEX_GROW) }
    set {
      writeFlexGrow(newValue)
    }
  }

  public var flexShrink: Float {
    get { getFloat(StyleKeys.FLEX_SHRINK) }
    set {
      writeFlexShrink(newValue)
    }
  }

  public var flexWrap: FlexWrap {
    get { FlexWrap(rawValue: getInt8(StyleKeys.FLEX_WRAP))! }
    set {
      writeFlexWrap(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var float: MasonFloat {
    get { MasonFloat(rawValue: getInt8(StyleKeys.FLOAT))! }
    set {
      writeFloat(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var fontSize: Float {
    get { getFloat(StyleKeys.FONT_SIZE) }
    set {
      writeFontSize(newValue, StyleState.SET, 0)
      syncFontMetrics()
    }
  }

  public var gap: MasonSize<MasonLengthPercentage> {
    get {
      return MasonSize(
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.GAP_ROW_VALUE), getInt8(StyleKeys.GAP_ROW_TYPE))!,
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.GAP_COLUMN_VALUE), getInt8(StyleKeys.GAP_COLUMN_TYPE))!
      )
    }
    set {
      writeGap(
        UInt8(bitPattern: newValue.width.type),
        newValue.width.value,
        UInt8(bitPattern: newValue.height.type),
        newValue.height.value
      )
    }
  }

  public var gridAutoFlow: GridAutoFlow {
    get { GridAutoFlow(rawValue: getInt8(StyleKeys.GRID_AUTO_FLOW))! }
    set {
      writeGridAutoFlow(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var height: MasonDimension {
    get { MasonDimension.fromValueType(getFloat(StyleKeys.HEIGHT_VALUE), getInt8(StyleKeys.HEIGHT_TYPE))! }
    set {
      writeHeight(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var inset: MasonRect<MasonLengthPercentageAuto> {
    get {
      return MasonRect(
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_TOP_VALUE), getInt8(StyleKeys.INSET_TOP_TYPE))!,
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_RIGHT_VALUE), getInt8(StyleKeys.INSET_RIGHT_TYPE))!,
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_BOTTOM_VALUE), getInt8(StyleKeys.INSET_BOTTOM_TYPE))!,
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_LEFT_VALUE), getInt8(StyleKeys.INSET_LEFT_TYPE))!
      )
    }
    set {
      writeInset(
        UInt8(bitPattern: newValue.top.type),
        newValue.top.value,
        UInt8(bitPattern: newValue.right.type),
        newValue.right.value,
        UInt8(bitPattern: newValue.bottom.type),
        newValue.bottom.value,
        UInt8(bitPattern: newValue.left.type),
        newValue.left.value
      )
    }
  }

  public var bottomInset: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_BOTTOM_VALUE), getInt8(StyleKeys.INSET_BOTTOM_TYPE))! }
    set {
      writeInsetBottomType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var leftInset: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_LEFT_VALUE), getInt8(StyleKeys.INSET_LEFT_TYPE))! }
    set {
      writeInsetLeftType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var rightInset: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_RIGHT_VALUE), getInt8(StyleKeys.INSET_RIGHT_TYPE))! }
    set {
      writeInsetRightType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var topInset: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.INSET_TOP_VALUE), getInt8(StyleKeys.INSET_TOP_TYPE))! }
    set {
      writeInsetTopType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var justifyContent: JustifyContent {
    get { JustifyContent(rawValue: getInt8(StyleKeys.JUSTIFY_CONTENT))! }
    set {
      writeJustifyContent(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var justifyItems: JustifyItems {
    get { JustifyItems(rawValue: getInt8(StyleKeys.JUSTIFY_ITEMS))! }
    set {
      writeJustifyItems(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var justifySelf: JustifySelf {
    get { JustifySelf(rawValue: getInt8(StyleKeys.JUSTIFY_SELF))! }
    set {
      writeJustifySelf(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var letterSpacing: Float {
    get { getFloat(StyleKeys.LETTER_SPACING) }
    set {
      writeLetterSpacing(newValue, StyleState.SET)
    }
  }

  public var lineHeight: Float {
    get { getFloat(StyleKeys.LINE_HEIGHT) }
    set {
      writeLineHeight(newValue, StyleState.SET, 0)
    }
  }

  public var lineClamp: Int32 {
    get { getInt32(StyleKeys.LINE_CLAMP) }
    set {
      writeLineClampText(max(0, newValue), StyleState.SET)
    }
  }

  public var listStylePosition: ListStylePosition {
    get { ListStylePosition(rawValue: getInt8(StyleKeys.LIST_STYLE_POSITION))! }
    set {
      writeListStylePosition(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  public var listStyleType: ListStyleType {
    get { ListStyleType(rawValue: getInt8(StyleKeys.LIST_STYLE_TYPE))! }
    set {
      writeListStyleType(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
      // A summary can build its marker before the list style is applied.
      if node.detailsRole == MasonDetails.summary { MasonDetails.refreshMarker(node) }
    }
  }

  public var margin: MasonRect<MasonLengthPercentageAuto> {
    get {
      return MasonRect(
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_TOP_VALUE), getInt8(StyleKeys.MARGIN_TOP_TYPE))!,
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_RIGHT_VALUE), getInt8(StyleKeys.MARGIN_RIGHT_TYPE))!,
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_BOTTOM_VALUE), getInt8(StyleKeys.MARGIN_BOTTOM_TYPE))!,
        MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_LEFT_VALUE), getInt8(StyleKeys.MARGIN_LEFT_TYPE))!
      )
    }
    set {
      writeMargin(
        UInt8(bitPattern: newValue.top.type),
        newValue.top.value,
        UInt8(bitPattern: newValue.right.type),
        newValue.right.value,
        UInt8(bitPattern: newValue.bottom.type),
        newValue.bottom.value,
        UInt8(bitPattern: newValue.left.type),
        newValue.left.value
      )
    }
  }

  public var marginBottom: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_BOTTOM_VALUE), getInt8(StyleKeys.MARGIN_BOTTOM_TYPE))! }
    set {
      writeMarginBottomType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var marginLeft: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_LEFT_VALUE), getInt8(StyleKeys.MARGIN_LEFT_TYPE))! }
    set {
      writeMarginLeftType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var marginRight: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_RIGHT_VALUE), getInt8(StyleKeys.MARGIN_RIGHT_TYPE))! }
    set {
      writeMarginRightType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var marginTop: MasonLengthPercentageAuto {
    get { MasonLengthPercentageAuto.fromValueType(getFloat(StyleKeys.MARGIN_TOP_VALUE), getInt8(StyleKeys.MARGIN_TOP_TYPE))! }
    set {
      writeMarginTopType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var maxHeight: MasonDimension {
    get { MasonDimension.fromValueType(getFloat(StyleKeys.MAX_HEIGHT_VALUE), getInt8(StyleKeys.MAX_HEIGHT_TYPE))! }
    set {
      writeMaxHeight(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var maxSize: MasonSize<MasonDimension> {
    get {
      return MasonSize(
        MasonDimension.fromValueType(getFloat(StyleKeys.MAX_WIDTH_VALUE), getInt8(StyleKeys.MAX_WIDTH_TYPE))!,
        MasonDimension.fromValueType(getFloat(StyleKeys.MAX_HEIGHT_VALUE), getInt8(StyleKeys.MAX_HEIGHT_TYPE))!
      )
    }
    set {
      writeMaxSize(
        UInt8(bitPattern: newValue.width.type),
        newValue.width.value,
        UInt8(bitPattern: newValue.height.type),
        newValue.height.value
      )
    }
  }

  public var maxWidth: MasonDimension {
    get { MasonDimension.fromValueType(getFloat(StyleKeys.MAX_WIDTH_VALUE), getInt8(StyleKeys.MAX_WIDTH_TYPE))! }
    set {
      writeMaxWidth(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var minHeight: MasonDimension {
    get { MasonDimension.fromValueType(getFloat(StyleKeys.MIN_HEIGHT_VALUE), getInt8(StyleKeys.MIN_HEIGHT_TYPE))! }
    set {
      writeMinHeight(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var minSize: MasonSize<MasonDimension> {
    get {
      return MasonSize(
        MasonDimension.fromValueType(getFloat(StyleKeys.MIN_WIDTH_VALUE), getInt8(StyleKeys.MIN_WIDTH_TYPE))!,
        MasonDimension.fromValueType(getFloat(StyleKeys.MIN_HEIGHT_VALUE), getInt8(StyleKeys.MIN_HEIGHT_TYPE))!
      )
    }
    set {
      writeMinSize(
        UInt8(bitPattern: newValue.width.type),
        newValue.width.value,
        UInt8(bitPattern: newValue.height.type),
        newValue.height.value
      )
    }
  }

  public var minWidth: MasonDimension {
    get { MasonDimension.fromValueType(getFloat(StyleKeys.MIN_WIDTH_VALUE), getInt8(StyleKeys.MIN_WIDTH_TYPE))! }
    set {
      writeMinWidth(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var objectFit: ObjectFit {
    get { ObjectFit(rawValue: getInt8(StyleKeys.OBJECT_FIT))! }
    set {
      writeObjectFit(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var overflowX: Overflow {
    get { Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_X))! }
    set {
      writeOverflowX(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var overflowY: Overflow {
    get { Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_Y))! }
    set {
      writeOverflowY(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var overflow: MasonPoint<Overflow> {
    get {
      return MasonPoint(
        Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_X))!,
        Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_Y))!
      )
    }
    set {
      writeOverflow(UInt8(bitPattern: newValue.x.rawValue), UInt8(bitPattern: newValue.y.rawValue))
    }
  }

  public var padding: MasonRect<MasonLengthPercentage> {
    get {
      return MasonRect(
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_TOP_VALUE), getInt8(StyleKeys.PADDING_TOP_TYPE))!,
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_RIGHT_VALUE), getInt8(StyleKeys.PADDING_RIGHT_TYPE))!,
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_BOTTOM_VALUE), getInt8(StyleKeys.PADDING_BOTTOM_TYPE))!,
        MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_LEFT_VALUE), getInt8(StyleKeys.PADDING_LEFT_TYPE))!
      )
    }
    set {
      writePadding(
        UInt8(bitPattern: newValue.top.type),
        newValue.top.value,
        UInt8(bitPattern: newValue.right.type),
        newValue.right.value,
        UInt8(bitPattern: newValue.bottom.type),
        newValue.bottom.value,
        UInt8(bitPattern: newValue.left.type),
        newValue.left.value
      )
    }
  }

  public var paddingBottom: MasonLengthPercentage {
    get { MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_BOTTOM_VALUE), getInt8(StyleKeys.PADDING_BOTTOM_TYPE))! }
    set {
      writePaddingBottomType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var paddingLeft: MasonLengthPercentage {
    get { MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_LEFT_VALUE), getInt8(StyleKeys.PADDING_LEFT_TYPE))! }
    set {
      writePaddingLeftType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var paddingRight: MasonLengthPercentage {
    get { MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_RIGHT_VALUE), getInt8(StyleKeys.PADDING_RIGHT_TYPE))! }
    set {
      writePaddingRightType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var paddingTop: MasonLengthPercentage {
    get { MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_TOP_VALUE), getInt8(StyleKeys.PADDING_TOP_TYPE))! }
    set {
      writePaddingTopType(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var position: Position {
    get { Position(rawValue: getInt8(StyleKeys.POSITION))! }
    set {
      writePosition(UInt8(bitPattern: newValue.rawValue))
    }
  }

  public var scrollBarWidth: MasonDimension {
    get { MasonDimension.Points(getFloat(StyleKeys.SCROLLBAR_WIDTH)) }
    set {
      writeScrollbarWidth(newValue.value)
    }
  }

  public var size: MasonSize<MasonDimension> {
    get {
      return MasonSize(
        MasonDimension.fromValueType(getFloat(StyleKeys.WIDTH_VALUE), getInt8(StyleKeys.WIDTH_TYPE))!,
        MasonDimension.fromValueType(getFloat(StyleKeys.HEIGHT_VALUE), getInt8(StyleKeys.HEIGHT_TYPE))!
      )
    }
    set {
      writeSize(
        UInt8(bitPattern: newValue.width.type),
        newValue.width.value,
        UInt8(bitPattern: newValue.height.type),
        newValue.height.value
      )
    }
  }

  public var textAlign: TextAlign {
    get { TextAlign(rawValue: getInt8(StyleKeys.TEXT_ALIGN))! }
    set {
      writeTextAlign(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  public var textJustify: TextJustify {
    get { TextJustify(rawValue: getInt8(StyleKeys.TEXT_JUSTIFY)) ?? .Auto }
    set {
      guard newValue != textJustify else { return }
      writeTextJustify(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  public var textTransform: TextTransform {
    get { TextTransform(rawValue: getInt8(StyleKeys.TEXT_TRANSFORM))! }
    set {
      writeTextTransform(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  public var textWrap: TextWrap {
    get { TextWrap(rawValue: getInt8(StyleKeys.TEXT_WRAP))! }
    set {
      writeTextWrap(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  public var whiteSpace: WhiteSpace {
    get { WhiteSpace(rawValue: getInt8(StyleKeys.WHITE_SPACE))! }
    set {
      writeWhiteSpace(UInt8(bitPattern: newValue.rawValue), StyleState.SET)
    }
  }

  public var width: MasonDimension {
    get { MasonDimension.fromValueType(getFloat(StyleKeys.WIDTH_VALUE), getInt8(StyleKeys.WIDTH_TYPE))! }
    set {
      writeWidth(UInt8(bitPattern: newValue.type), newValue.value)
    }
  }

  public var zIndex: Int32 {
    get { getInt32(StyleKeys.Z_INDEX) }
    set {
      writeZIndex(newValue)
    }
  }
  // </style-keys:accessors>

  // <style-keys:native-methods> generated from tools/scripts/style-keys/style-keys.schema
  public var borderWidthCompat: MasonLengthPercentageRectCompat {
    get { MasonLengthPercentageRectCompat(borderWidth) }
    set { borderWidth = newValue.intoMasonRect() }
  }

  public var gapCompat: MasonLengthPercentageSizeCompat {
    get { MasonLengthPercentageSizeCompat(gap) }
    set { gap = newValue.intoMasonSize() }
  }

  public var sizeCompatHeight: MasonDimensionCompat {
    get { MasonDimensionCompat(value: height) }
    set { height = newValue.dimension }
  }

  public var insetCompat: MasonLengthPercentageAutoRectCompat {
    get { MasonLengthPercentageAutoRectCompat(inset) }
    set { inset = newValue.intoMasonRect() }
  }

  public var marginCompat: MasonLengthPercentageAutoRectCompat {
    get { MasonLengthPercentageAutoRectCompat(margin) }
    set { margin = newValue.intoMasonRect() }
  }

  public var maxSizeCompat: MasonDimensionSizeCompat {
    get { MasonDimensionSizeCompat(maxSize) }
    set { maxSize = newValue.intoMasonSize() }
  }

  public var minSizeCompat: MasonDimensionSizeCompat {
    get { MasonDimensionSizeCompat(minSize) }
    set { minSize = newValue.intoMasonSize() }
  }

  public var overflowCompat: MasonOverflowPointCompat {
    get { MasonOverflowPointCompat(overflowX, overflowY) }
    set { overflow = MasonPoint(newValue.x, newValue.y) }
  }

  public var paddingCompat: MasonLengthPercentageRectCompat {
    get { MasonLengthPercentageRectCompat(padding) }
    set { padding = newValue.intoMasonRect() }
  }

  public var sizeCompat: MasonDimensionSizeCompat {
    get { MasonDimensionSizeCompat(size) }
    set { size = newValue.intoMasonSize() }
  }

  public var sizeCompatWidth: MasonDimensionCompat {
    get { MasonDimensionCompat(value: width) }
    set { width = newValue.dimension }
  }

  public func setInsetLeft(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    leftInset = length
  }

  public func setInsetRight(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    rightInset = length
  }

  public func setInsetTop(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    topInset = length
  }

  public func setInsetBottom(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    bottomInset = length
  }

  public func setInsetWithValueType(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    inset = MasonRect(uniform: length)
  }

  public func setMarginLeft(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    marginLeft = length
  }

  public func setMarginRight(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    marginRight = length
  }

  public func setMarginTop(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    marginTop = length
  }

  public func setMarginBottom(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    marginBottom = length
  }

  public func setMarginWithValueType(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentageAuto(value, type) else { return }
    margin = MasonRect(uniform: length)
  }

  public func setPaddingLeft(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    paddingLeft = length
  }

  public func setPaddingRight(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    paddingRight = length
  }

  public func setPaddingTop(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    paddingTop = length
  }

  public func setPaddingBottom(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    paddingBottom = length
  }

  public func setPaddingWithValueType(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    padding = MasonRect(uniform: length)
  }

  public func setBorderLeftWidth(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeBorderLeftWidth(UInt8(bitPattern: length.type), length.value)
  }

  public func setBorderRightWidth(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeBorderRightWidth(UInt8(bitPattern: length.type), length.value)
  }

  public func setBorderTopWidth(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeBorderTopWidth(UInt8(bitPattern: length.type), length.value)
  }

  public func setBorderBottomWidth(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeBorderBottomWidth(UInt8(bitPattern: length.type), length.value)
  }

  public func setBorderWidth(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    borderWidth = MasonRect(uniform: length)
  }

  public func setFlexBasis(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    flexBasis = length
  }

  public func setMinSizeWidth(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    minSize = MasonSize(length, minSize.height)
  }

  public func setMinSizeHeight(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    minSize = MasonSize(minSize.width, length)
  }

  public func setMinSizeWidthHeight(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    minSize = MasonSize(length, length)
  }

  public func setSizeWidth(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    width = length
  }

  public func setSizeHeight(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    height = length
  }

  public func setSizeWidthHeight(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    size = MasonSize(length, length)
  }

  public func setMaxSizeWidth(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    maxSize = MasonSize(length, maxSize.height)
  }

  public func setMaxSizeHeight(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    maxSize = MasonSize(maxSize.width, length)
  }

  public func setMaxSizeWidthHeight(_ value: Float, _ type: Int) {
    guard let length = getDimension(value, type) else { return }
    maxSize = MasonSize(length, length)
  }

  public func setGapRow(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeRowGap(UInt8(bitPattern: length.type), length.value)
  }

  public func setGapColumn(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeColumnGap(UInt8(bitPattern: length.type), length.value)
  }

  public func setRowGap(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeRowGap(UInt8(bitPattern: length.type), length.value)
  }

  public func setColumnGap(_ value: Float, _ type: Int) {
    guard let length = getLengthPercentage(value, type) else { return }
    writeColumnGap(UInt8(bitPattern: length.type), length.value)
  }
  // </style-keys:native-methods>

  public internal(set) var font: NSCFontFace!
  private var _cachedResolvedFont: NSCFontFace? = nil
  private var _resolvedFontKey: UInt64 = 0
  internal var fontMetrics: FontMetrics {
    get {
      return FontMetrics(ascent:  getFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET), descent:  getFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET), x_height: getFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET), leading: getFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET), cap_height: getFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET))
    }

    set {
      prepareMut()
      setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, newValue.ascent)
      setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, newValue.descent)
      setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, newValue.x_height)
      setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, newValue.leading)
      setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, newValue.cap_height)
    }
  }

  /// Update font metrics on a Mason node when font changes.
  /// When called during a Rust measure callback (inMeasure == true),
  /// the write is deferred to avoid deadlocking the rwlock.
  internal func syncFontMetrics(){
    if inMeasure {
      pendingMetricsSync = true
      return
    }
    syncFontMetricsNow()
  }

  /// Writes the current font's metrics into the style buffer.
  ///
  /// Returns whether any of them actually changed, so a deferred flush knows
  /// whether to dirty the node and ask for another layout pass — re-resolving
  /// the same font must not, or measure/flush/relayout loops forever.
  @discardableResult
  private func syncFontMetricsNow() -> Bool {
    guard let baseFont = font.uiFont else {return false}

    // `font.uiFont` is built at a fixed size; size it to the actual fontSize so
    // metrics feed the correct line-box height (else font-size doesn't relayout).
    let size = CGFloat(resolvedFontSize)
    let font = size > 0 ? baseFont.withSize(size) : baseFont

    let scale = NSCMason.scale
    let ascent = Float(font.ascender) * scale
    let descent = Float(-font.descender) * scale  // Make it positive
    // let lineHeight = Float(font.lineHeight) * scale
    let xHeight = Float(font.xHeight) * scale
    let capHeight = Float(font.capHeight) * scale
    let leading = Float(font.leading) * scale

    var changed = false
    func write(_ offset: Int, _ value: Float) {
      if getFloat(offset) != value {
        setFloat(offset, value)
        changed = true
      }
    }

    write(StyleKeys.FONT_METRICS_ASCENT_OFFSET, ascent)
    write(StyleKeys.FONT_METRICS_DESCENT_OFFSET, descent)
    write(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, xHeight)
    write(StyleKeys.FONT_METRICS_LEADING_OFFSET, leading)
    write(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, capHeight)
    return changed
  }

  /// Flush deferred font metrics sync after measure callback returns.
  /// Returns true if the flush actually changed the metrics (caller should
  /// mark the node dirty). A pending flush that resolves to the same numbers
  /// returns false — see `syncFontMetricsNow()`.
  internal func flushPendingMetricsSync() -> Bool {
    if !pendingMetricsSync { return false }
    pendingMetricsSync = false
    return syncFontMetricsNow()
  }



  // Weight tracking
  internal var weight = UIFont.Weight.regular
  private var weightName = "normal"


  // Guard flag: true while inside Rust measure callback (read lock held, no buffer writes)
  internal var inMeasure = false
  internal var pendingMetricsSync = false

  internal var isDirty: UInt64 = 0
  // high 64-bit half for expanded 128-bit state keys
  internal var isDirtyHigh: UInt64 = 0
  /// Monotonically increasing counter bumped on every style sync.
  /// Used by MasonNode to invalidate cached getDefaultAttributes().
  internal private(set) var styleVersion: UInt64 = 0 {
    didSet { MasonStyle.resolveEpoch &+= 1 }
  }

  /// Changes on any style write, style sync or tree change, which clears every `resolvedMemo`.
  internal static var resolveEpoch: UInt64 = 1
  internal var resolvedMemo = ResolvedMemo()

  unowned(unsafe) let node: MasonNode
  var inBatch = false {
    didSet {
      if (!inBatch) {
        if((!gridWrites.isEmpty || isDirty != 0 || isDirtyHigh != 0) && !pendingInvalidation.contains(.invalidating)){
          pendingInvalidation = pendingInvalidation.union(.pending)
        }
        updateNativeStyle()
      }
    }
  }

  internal var isValueInitialized: Bool  = false

  private weak var styleChangeListener: StyleChangeListener? = nil

  internal func setStyleChangeListener(listener: StyleChangeListener?) {
    styleChangeListener = listener
  }


  internal func notifyTextStyleChanged(_ low: UInt64, _ high: UInt64) {
    styleVersion &+= 1
    styleChangeListener?.onStyleChange(low, high)
  }

  internal func notifyTextStyleChanged(_ state: StateKeys) {
    styleVersion &+= 1
    styleChangeListener?.onStyleChange(state.low, state.high)
  }

  public func prepareMut() {
    // Every native style write passes here: the next layout pass re-applies this view.
    node.appliedStyleVersion = .max
    MasonStyle.resolveEpoch &+= 1
    if (node.isPlaceholder) {
      return
    }

    if cachedBytes != nil && getInt32(StyleKeys.REF_COUNT) == 1 {
      isValueInitialized = true
      if writableValue == nil { writableValue = readableValue }
      return
    }

    let slot = mason_style_prepare_slot(node.mason.nativePtr, node.nativePtr)
    guard slot >= 0 else {
      fatalError("Could not allocate style buffer")
    }
    isValueInitialized = true
    self.slot = slot
    writableValue = MasonSlotData(node.mason.styleSlotBytes(slot), StyleKeys.STYLE_BUFFER_SIZE, owner: node.mason)
  }

  /// The style slot this style owns, or -1 while it still shares a default.
  internal private(set) var slot: Int32 = -1

  /// Gives this style its own slot if it shares one; returns the slot index, or -1.
  internal func prepareSlot() -> Int32 {
    prepareMut()
    if slot < 0 { slot = mason_style_prepare_slot(node.mason.nativePtr, node.nativePtr) }
    return slot
  }

  private lazy var placeHolderValue: NSMutableData = {
    // Rust's STYLE_BUFFER_SIZE: every StyleKeys offset must be readable.
    let buffer = NSMutableData(length: StyleKeys.STYLE_BUFFER_SIZE)


    setFloat(StyleKeys.ASPECT_RATIO, Float.nan, buffer: buffer)
    // default shrink to 1
    setFloat(StyleKeys.FLEX_SHRINK, 1, buffer: buffer)

    setFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, 1, buffer: buffer)
    setFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, 1, buffer: buffer)
    setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, 1, buffer: buffer)
    setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, 1, buffer: buffer)


    // Default font metrics

    setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, 14, buffer: buffer)
    setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, 4, buffer: buffer)
    setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, 7, buffer: buffer)
    setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, 0, buffer: buffer)
    setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, 10, buffer: buffer)

    setFloat(StyleKeys.FIRST_BASELINE_OFFSET, Float.nan, buffer: buffer)




    setInt8(StyleKeys.OBJECT_FIT, ObjectFit.Fill.rawValue, buffer: buffer)
    setInt8(StyleKeys.DISPLAY, Display.Block.rawValue, buffer: buffer)

    // default Normal -> -1
    setInt8(StyleKeys.ALIGN_ITEMS, -1, buffer: buffer)
    setInt8(StyleKeys.ALIGN_SELF, -1, buffer: buffer)
    setInt8(StyleKeys.ALIGN_CONTENT, -1, buffer: buffer)

    setInt8(StyleKeys.JUSTIFY_ITEMS, -1, buffer: buffer)
    setInt8(StyleKeys.JUSTIFY_SELF, -1, buffer: buffer)
    setInt8(StyleKeys.JUSTIFY_CONTENT, -1, buffer: buffer)

    setInt8(StyleKeys.MARGIN_LEFT_TYPE, 1, buffer: buffer)
    setInt8(StyleKeys.MARGIN_TOP_TYPE, 1, buffer: buffer)
    setInt8(StyleKeys.MARGIN_RIGHT_TYPE, 1, buffer: buffer)
    setInt8(StyleKeys.MARGIN_BOTTOM_TYPE, 1, buffer: buffer)

    setInt32(StyleKeys.REF_COUNT, 1)


    guard let buffer else {
      // todo
      fatalError("Could not allocate style buffer")
    }

    isValueInitialized = true
    return buffer
  }()

  private var writableValue: NSMutableData? = nil { didSet { refreshBytes() } }
  private var readableValue: NSMutableData? = nil { didSet { refreshBytes() } }
  private var cachedBytes: UnsafeRawPointer? = nil

  private func refreshBytes() {
    cachedBytes = (writableValue ?? readableValue).map { UnsafeRawPointer($0.bytes) }
  }

  @inline(__always) private var readBytes: UnsafeRawPointer {
    if let bytes = cachedBytes { return bytes }
    return values.bytes
  }


  public var values: NSMutableData {
    get {
      if(node.isPlaceholder){
        return placeHolderValue
      }

      let value = writableValue ?? readableValue

      guard let value = value else {

        var length = 0
        guard let bytes = mason_style_get_style_data(node.mason.nativePtr, node.nativePtr, &length), length > 0 else {
          fatalError("Could not allocate style buffer")
        }

        isValueInitialized = true

        readableValue = MasonSlotData(UnsafeMutableRawPointer(mutating: bytes), length, owner: node.mason)

        return readableValue!

      }
      return value
    }
  }

  public init(node: MasonNode) {
    self.node = node
    super.init()
    font =  NSCFontFace(family: "sans-serif")
    mBackground = Background(style: self)
  }

  internal func invalidateStyle(_ state: Int64) {
    if state == 0 {
      return
    }

    if (isDirty > 0) {
      (node.view as? MasonElement)?.invalidateLayout()
    }
  }

  internal func setOrAppendState(_ value: StateKeys) {
    clearLogicalSides(value)
    setStateFromHalves(value.low, value.high)
  }

  // MARK: CSS logical sides (see StyleKeys.LOGICAL_SEQ)

  private static let logicalStamps: [(order: Int, length: Int)] = [
    (StyleKeys.MARGIN_ORDER, 8), (StyleKeys.PADDING_ORDER, 8), (StyleKeys.INSET_ORDER, 8), (StyleKeys.SIZE_ORDER, 12),
  ]
  private static let logicalGroups: [(key: StateKeys, order: Int, half: Int)] = [
    (.margin, StyleKeys.MARGIN_ORDER, 4), (.padding, StyleKeys.PADDING_ORDER, 4), (.inset, StyleKeys.INSET_ORDER, 4),
    (StateKeys.size.union(.minSize).union(.maxSize), StyleKeys.SIZE_ORDER, 6),
  ]
  private static let logicalKeys = logicalGroups.reduce(StateKeys(low: 0, high: 0)) { $0.union($1.key) }

  /// A native write of a box side is a physical declaration: the group's logical sides (the
  /// UA margins) give way to it. The TypeScript layer stamps sides one by one instead.
  private func clearLogicalSides(_ value: StateKeys) {
    if !value.contains(MasonStyle.logicalKeys) { return }
    var prepared = false
    for (key, order, half) in MasonStyle.logicalGroups where value.contains(key) {
      for i in 0..<half where getUInt8(order + half + i) != 0 {
        // The buffer may be shared with other nodes.
        if !prepared {
          prepareMut()
          prepared = true
        }
        setUInt8(order + half + i, 0)
      }
    }
  }

  /// The next write stamp; at the counter's end every stamp is renumbered by rank, keeping their order.
  private func nextLogicalStamp() -> UInt8 {
    var seq = getUInt8(StyleKeys.LOGICAL_SEQ)
    if seq == UInt8.max {
      var used = [Bool](repeating: false, count: 256)
      for (order, length) in MasonStyle.logicalStamps {
        for i in 0..<length { used[Int(getUInt8(order + i))] = true }
      }
      var rank = [UInt8](repeating: 0, count: 256)
      var next: UInt8 = 0
      for stamp in 1..<256 where used[stamp] {
        next += 1
        rank[stamp] = next
      }
      for (order, length) in MasonStyle.logicalStamps {
        for i in 0..<length { setUInt8(order + i, rank[Int(getUInt8(order + i))]) }
      }
      seq = next
    }
    setUInt8(StyleKeys.LOGICAL_SEQ, seq + 1)
    return seq + 1
  }

  /// Margins as logical sides, in device px, so a vertical box gets them on its block axis:
  /// a block text element's UA margins (`margin-block`, `margin-inline`).
  internal func setLogicalMargin(blockStart: Float, inlineEnd: Float, blockEnd: Float, inlineStart: Float) {
    prepareMut()
    for (slot, value) in [blockStart, inlineEnd, blockEnd, inlineStart].enumerated() {
      setUInt8(StyleKeys.MARGIN_ORDER + 4 + slot, nextLogicalStamp())
      setInt8(StyleKeys.MARGIN_BLOCK_START_TYPE + slot, 1)
      setFloat(StyleKeys.MARGIN_BLOCK_START_VALUE + slot * 4, value)
    }
    setStateFromHalves(StateKeys.margin.low, StateKeys.margin.high)
  }

  // Helpers to set full 128-bit masks (low/high halves)
  internal func setStateFromHalves(_ low: UInt64, _ high: UInt64) {
    let changed = StateKeys(low: low, high: high)
    if changed.contains(.textOverflow), getUInt8(StyleKeys.TEXT_OVERFLOW) < 2, textOverflowTokenKey != 0 {
      _ = installTextOverflow(getUInt8(StyleKeys.TEXT_OVERFLOW), token: nil)
    }
    if isDirty == 0 && isDirtyHigh == 0 {
      isDirty = low
      isDirtyHigh = high
    } else {
      isDirty |= low
      isDirtyHigh |= high
    }
    if (!inBatch) {
      if((isDirty != 0 || isDirtyHigh != 0) && !pendingInvalidation.contains(.invalidating)){
        pendingInvalidation = pendingInvalidation.union(.pending)
      }
      updateNativeStyle()
    }
    if changed.contains(StateKeys.display.union(.displayMode).union(.position).union(.float).union(.visibility)) {
      node.onFlowTypeChanged()
    }
  }


  private struct InvalidationState {
      let rawValue: UInt64

     init(rawValue: UInt64) {
       self.rawValue = rawValue
     }

     init() {
       self.rawValue = 0
     }

    static let none = InvalidationState()
    static let pending = InvalidationState(rawValue: 1 << 0)
    static let invalidating = InvalidationState(rawValue: 1 << 1)

    func contains(_ other: InvalidationState) -> Bool{
      return (self.rawValue & other.rawValue) != 0
    }

    func union(_ other: InvalidationState) -> InvalidationState {
      return InvalidationState(rawValue: self.rawValue | other.rawValue)
    }
  }

  private var pendingInvalidation: InvalidationState = .none

  private func updateTextStyle() {
    if (node.nativePtr == nil) {
      return
    }

    let lowDirty = isDirty
    let highDirty = isDirtyHigh
    if (lowDirty > 0 || highDirty > 0) {
      // Forward the intersection of dirty flags and text keys so the
      // engine takes the correct layout vs visual-only branch.
      let mask = StateKeys.allText
      let state = StateKeys(low: lowDirty & mask.low, high: highDirty & mask.high)

      if (state != .none) {
        pendingInvalidation = pendingInvalidation.union(.pending)
        notifyTextStyleChanged(state)
      }
    }
  }

  // CSS transform programs share their parsed list with the Rust style arena.
  private final class NativeTransformProgram {
    let handle: OpaquePointer
    let usesBoxSize: Bool

    init?(_ value: String) {
      guard let handle = value.withCString({ mason_css_transform_parse($0) }) else { return nil }
      self.handle = handle
      usesBoxSize = mason_css_transform_uses_box_size(handle)
    }

    deinit { mason_css_transform_release(handle) }

    func matrix(for size: CGSize, style: MasonStyle) -> CATransform3D {
      let viewport = NSCMason.viewportSize
      return withUnsafeTemporaryAllocation(of: Float.self, capacity: 16) { values in
        guard mason_css_transform_matrix(handle, Float(size.width), Float(size.height), style.fontSize,
                                         NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height),
                                         values.baseAddress) else { return CATransform3DIdentity }
        return CATransform3D(
          m11: CGFloat(values[0]), m12: CGFloat(values[1]), m13: CGFloat(values[2]), m14: CGFloat(values[3]),
          m21: CGFloat(values[4]), m22: CGFloat(values[5]), m23: CGFloat(values[6]), m24: CGFloat(values[7]),
          m31: CGFloat(values[8]), m32: CGFloat(values[9]), m33: CGFloat(values[10]), m34: CGFloat(values[11]),
          m41: CGFloat(values[12]), m42: CGFloat(values[13]), m43: CGFloat(values[14]), m44: CGFloat(values[15])
        )
      }
    }
  }

  private var transformProgram: NativeTransformProgram?

  private func installTransform(_ value: String) {
    let program = NativeTransformProgram(value)
    transformProgram = program
    guard !node.isPlaceholder else { return }
    let mason = node.mason
    if mason.inCompute { mason.deferStyleRecords(self) }
    else { prepareMut() }
    mason_css_transform_install(mason.inCompute ? nil : mason.nativePtr, node.nativePtr, program?.handle)
  }

  internal func applyTransformFromBuffer() {
    guard let view = node.view else { return }
    if let program = transformProgram {
      DispatchQueue.main.async { [weak self, weak view] in
        guard let self, let view, self.transformProgram === program else { return }
        let size = view.bounds.size
        let matrix = program.matrix(for: size, style: self)
        let turn = self.node.inlineTurn
        if CATransform3DIsAffine(matrix) {
          view.layer.transform = CATransform3DIdentity
          let affine = self.aboutTransformOrigin(CATransform3DGetAffineTransform(matrix), size)
          view.transform = affine.rotated(by: turn)
        } else {
          view.transform = .identity
          let about = self.layerTransformAboutOrigin(matrix, size)
          view.layer.transform = turn == 0 ? about : CATransform3DConcat(CATransform3DMakeRotation(turn, 0, 0, 1), about)
        }
        self.updateShadowLayer(for: view.bounds)
      }
      return
    }
    let count = Int(getUInt8(StyleKeys.TRANSFORM_COUNT))
    let flags = getUInt8(StyleKeys.TRANSFORM_FLAGS)

    let turn = node.inlineTurn
    if count == 0 && (flags & StyleKeys.TRANSFORM_FLAG_HAS_MATRIX) == 0 {
      if turn != 0 {
        view.backingLayer.transform = CATransform3DIdentity
        view.transform = CGAffineTransform(rotationAngle: turn)
        return
      }
      // Only reset if currently transformed
      if view.transform != .identity || !CATransform3DIsIdentity(view.backingLayer.transform) {
        if Thread.isMainThread {
          view.transform = .identity; view.backingLayer.transform = CATransform3DIdentity
          updateShadowLayer(for: view.bounds)
        } else {
          DispatchQueue.main.async { [weak self] in
            view.transform = .identity; view.backingLayer.transform = CATransform3DIdentity
            self?.updateShadowLayer(for: view.bounds)
          }
        }
      }
      return
    }

    if (flags & StyleKeys.TRANSFORM_FLAG_HAS_MATRIX) != 0 {
      let base = StyleKeys.TRANSFORM_MATRIX
      if (flags & StyleKeys.TRANSFORM_FLAG_IS_3D) != 0 {
        // Full 4x4 matrix
        var t = CATransform3DIdentity
        t.m11 = CGFloat(getFloat(base));      t.m12 = CGFloat(getFloat(base + 4))
        t.m13 = CGFloat(getFloat(base + 8));  t.m14 = CGFloat(getFloat(base + 12))
        t.m21 = CGFloat(getFloat(base + 16)); t.m22 = CGFloat(getFloat(base + 20))
        t.m23 = CGFloat(getFloat(base + 24)); t.m24 = CGFloat(getFloat(base + 28))
        t.m31 = CGFloat(getFloat(base + 32)); t.m32 = CGFloat(getFloat(base + 36))
        t.m33 = CGFloat(getFloat(base + 40)); t.m34 = CGFloat(getFloat(base + 44))
        t.m41 = CGFloat(getFloat(base + 48)); t.m42 = CGFloat(getFloat(base + 52))
        t.m43 = CGFloat(getFloat(base + 56)); t.m44 = CGFloat(getFloat(base + 60))
        DispatchQueue.main.async { [weak self] in
          let about = self?.layerTransformAboutOrigin(t, view.bounds.size) ?? t
          view.backingLayer.transform = turn == 0 ? about : CATransform3DConcat(CATransform3DMakeRotation(turn, 0, 0, 1), about)
          self?.updateShadowLayer(for: view.bounds)
        }
      } else {
        // 2D affine embedded in 4x4
        let a = CGFloat(getFloat(base)); let b = CGFloat(getFloat(base + 4))
        let c = CGFloat(getFloat(base + 16)); let d = CGFloat(getFloat(base + 20))
        let tx = CGFloat(getFloat(base + 48)); let ty = CGFloat(getFloat(base + 52))
        let affine = CGAffineTransform(a: a, b: b, c: c, d: d, tx: tx, ty: ty)
        DispatchQueue.main.async { [weak self] in
          view.transform = (self?.aboutTransformOrigin(affine, view.bounds.size) ?? affine).rotated(by: turn)
          self?.updateShadowLayer(for: view.bounds)
        }
      }
    } else {
      // Compose inline ops; percentages resolve against the size on the main thread.
      let ops: [(type: TransformOpType, percent: UInt8, a: CGFloat, b: CGFloat)] = (0..<count).map { i in
        let opBase = StyleKeys.TRANSFORM_OP_0 + i * StyleKeys.TRANSFORM_OP_SIZE
        return (TransformOpType(rawValue: getUInt8(opBase)) ?? .none, getUInt8(opBase + 1),
                CGFloat(getFloat(opBase + 4)), CGFloat(getFloat(opBase + 8)))
      }
      DispatchQueue.main.async { [weak self] in
        let size = view.bounds.size
        let composed = MasonStyle.composeTransformOps(ops, size: size)
        view.transform = (self?.aboutTransformOrigin(composed, size) ?? composed).rotated(by: turn)
        self?.updateShadowLayer(for: view.bounds)
      }
    }
  }

  static func composeTransformOps(_ ops: [(type: TransformOpType, percent: UInt8, a: CGFloat, b: CGFloat)], size: CGSize) -> CGAffineTransform {
      var affine = CGAffineTransform.identity
      for op in ops {
        let type = op.type
        var a = op.a
        var b = op.b
        if op.percent & StyleKeys.TRANSFORM_OP_A_PERCENT != 0 { a = a / 100 * size.width }
        if op.percent & StyleKeys.TRANSFORM_OP_B_PERCENT != 0 { b = b / 100 * size.height }
        switch type {
        case .translate: affine = affine.translatedBy(x: a, y: b)
        case .translateX: affine = affine.translatedBy(x: a, y: 0)
        case .translateY: affine = affine.translatedBy(x: 0, y: b)
        case .scale: affine = affine.scaledBy(x: a, y: b)
        case .scaleX: affine = affine.scaledBy(x: a, y: 1)
        case .scaleY: affine = affine.scaledBy(x: 1, y: b)
        case .rotate: affine = affine.rotated(by: a * .pi / 180.0)
        case .skewX:
          let t = tan(a * .pi / 180.0)
          affine = affine.concatenating(CGAffineTransform(a: 1, b: 0, c: t, d: 1, tx: 0, ty: 0))
        case .skewY:
          let t = tan(a * .pi / 180.0)
          affine = affine.concatenating(CGAffineTransform(a: 1, b: t, c: 0, d: 1, tx: 0, ty: 0))
        case .none: break
        }
      }
      return affine
  }

  // UIKit transforms about the centre (the layer's anchor, which Mason's frames rely on),
  // so a transform-origin elsewhere is applied by moving it to the centre and back.
  private func transformOriginOffset(_ size: CGSize) -> CGPoint {
    guard hasTransformOrigin else { return .zero }
    func side(_ type: Int, _ value: Int, _ length: CGFloat) -> CGFloat {
      let v = CGFloat(getFloat(value))
      return (getUInt8(type) == 1 ? length * v / 100 : v / CGFloat(NSCMason.scale)) - length / 2
    }
    return CGPoint(x: side(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, StyleKeys.TRANSFORM_ORIGIN_X_VALUE, size.width),
                   y: side(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, StyleKeys.TRANSFORM_ORIGIN_Y_VALUE, size.height))
  }

  internal func aboutTransformOrigin(_ t: CGAffineTransform, _ size: CGSize) -> CGAffineTransform {
    let d = transformOriginOffset(size)
    if d == .zero { return t }
    return CGAffineTransform(translationX: -d.x, y: -d.y).concatenating(t).concatenating(CGAffineTransform(translationX: d.x, y: d.y))
  }

  internal func layerTransformAboutOrigin(_ t: CATransform3D, _ size: CGSize) -> CATransform3D {
    let d = transformOriginOffset(size)
    if d == .zero { return t }
    return CATransform3DConcat(CATransform3DConcat(CATransform3DMakeTranslation(-d.x, -d.y, 0), t), CATransform3DMakeTranslation(d.x, d.y, 0))
  }



  internal func getUInt8(_ index: Int) -> UInt8 {
    return readBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee
  }

  internal func setUInt8(_ index: Int, _ value: UInt8, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
  }


  internal func getInt8(_ index: Int) -> Int8 {
    return readBytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee
  }

  internal func setInt8(_ index: Int, _ value: Int8, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee = value
  }


  internal func getInt16(_ index: Int) -> Int16 {
    return readBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee
  }

  private func setInt16(_ index: Int, _ value: Int16) {
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee = value
  }


  internal func getUInt32(_ index: Int) -> UInt32 {
    return readBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee
  }

  internal func setUInt32(_ index: Int, _ value: UInt32, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
  }

  internal func getInt32(_ index: Int) -> Int32 {
    return readBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
  }

  internal func setInt32(_ index: Int, _ value: Int32, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
  }

  internal func getFloat(_ index: Int) -> Float {
    return readBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
  }

  internal func setFloat(_ index: Int, _ value: Float, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
  }

  private func updateFloatField(offset: Int, value: Float, state: StateKeys){
    prepareMut()
    setFloat(offset, value)
    setOrAppendState(state)
  }


  static func getUInt8(_ index: Int, _ buffer: NSData) -> UInt8 {
    return buffer.bytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee
  }

  static func setUInt8(_ index: Int, _ value: UInt8, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
  }

  static func getInt8(_ index: Int, _ buffer: NSData) -> Int8 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee
  }

  static func setInt8(_ index: Int, _ value: Int8, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee = value
  }


  static func getInt16(_ index: Int, _ buffer: NSData) -> Int16 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee
  }

  static func setInt16(_ index: Int, _ value: Int16, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee = value
  }

  static func getUInt32(_ index: Int, _ buffer: NSData) -> UInt32 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee
  }

  static func setUInt32(_ index: Int, _ value: UInt32, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
  }

  static func getInt32(_ index: Int, _ buffer: NSData) -> Int32 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
  }

  static func setInt32(_ index: Int, _ value: Int32, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
  }

  static func getFloat(_ index: Int, _ buffer: NSData) -> Float {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
  }

  static func setFloat(_ index: Int, _ value: Float, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
  }


  // Mark: - resetAllBorders

  internal func resetAllBorders(){
    mBorderRender.resetAllBorders()
  }






  // MARK: - zIndex



  internal func setResolvedVerticalAlign(_ kind: Int, _ amount: Float) {
    writeVerticalAlign(kind == 3 ? 0 : amount, kind == 2 ? 1 : 0, kind == 3 ? UInt8(amount) : 0)
  }


  // MARK: - ObjectFit


  // MARK: - Float




  // MARK: - Text Style Properties

  public func setColor(ui color: UIColor) {
    self.color = color.toUInt32()
  }

  public func setColor(css color: String) {
    guard let color = parseColorArgb(color) else { return }
    self.color = color
  }


  // Created on first parse: views without a filter shouldn't pay for one.
  private var mFilterStorage: CSSFilters.CSSFilter?
  var mFilter: CSSFilters.CSSFilter {
    if let filter = mFilterStorage { return filter }
    let filter = CSSFilters.CSSFilter()
    mFilterStorage = filter
    return filter
  }

  private struct FilterContext: Equatable {
    let fontSize: Float
    let rootFontSize: Float
    let viewport: CGSize
    let color: UInt32
  }

  private var filterContext: FilterContext {
    FilterContext(fontSize: resolvedFontSize, rootFontSize: NSCMason.rootFontSize,
                  viewport: NSCMason.viewportSize, color: color)
  }
  private var baseFilterProgram: NativeFilterProgram?
  private var baseFilterContext: FilterContext?
  private var baseFilter: [CSSFilters.Filter] = []
  private var activeFilterProgram: NativeFilterProgram?
  private var activeFilterContext: FilterContext?

  private var filterCss = ""
  public var filter: String {
    get { filterCss }
    set {
      let program = newValue == filterCss ? baseFilterProgram : NativeFilterProgram(newValue)
      let filters = CSSFilters.project(program, style: self, store: true)
      applyAuthoredFilter(newValue, program: program, filters: filters, context: filterContext)
    }
  }

  private func applyAuthoredFilter(_ value: String, program: NativeFilterProgram?,
                                   filters: [CSSFilters.Filter], context: FilterContext) {
    // Whether inline text is merged into its parent's depends on the filter.
    if value.isEmpty != filterCss.isEmpty, let parent = node.parent?.view as? MasonText {
      parent.requestLayout()
    }
    filterCss = value
    baseFilterProgram = program
    baseFilterContext = context
    baseFilter = filters
    installFilter(filters, program: program, context: context)
    if !filters.isEmpty, let view = node.view { mFilter.apply(to: view) }
  }

  private func installFilter(_ filters: [CSSFilters.Filter], program: NativeFilterProgram?, context: FilterContext) {
    activeFilterProgram = program
    activeFilterContext = context
    if filters.isEmpty { mFilterStorage?.replaceFilters([]) }
    else { mFilter.replaceFilters(filters) }
  }

  private var resolvedPseudoFilter: NativeFilterProgram? {
    let mask = node.pseudoMask
    for state in PSEUDO_CSS_ORDER.reversed() {
      let isActive = state == .default ? mask == 0 : (mask & state.rawValue) != 0
      if isActive, let program = node.pseudoFilter(state.rawValue) { return program }
    }
    return nil
  }

  internal var resolvedFilterString: String { resolvedPseudoFilter?.css ?? filter }

  internal func preparedResolvedFilter() -> CSSFilters.CSSFilter? {
    let pseudo = resolvedPseudoFilter
    guard let program = pseudo ?? baseFilterProgram else {
      if let current = mFilterStorage, !current.filters.isEmpty { current.reset() }
      activeFilterProgram = nil
      return nil
    }
    let context = filterContext
    if activeFilterProgram !== program || activeFilterContext != context {
      if pseudo == nil {
        if baseFilterContext != context {
          baseFilter = CSSFilters.project(program, style: self, store: true)
          baseFilterContext = context
        }
        installFilter(baseFilter, program: program, context: context)
      } else {
        installFilter(CSSFilters.project(program, style: self, store: false), program: program, context: context)
      }
    }
    guard let filter = mFilterStorage, !filter.filters.isEmpty else { return nil }
    return filter
  }

  /// Apply at the end of draw() so background, text, and border are filtered together.
  internal func applyResolvedFilter(in context: CGContext, rect: CGRect, view: UIView? = nil) {
    if let filter = preparedResolvedFilter(), let view { filter.apply(to: view) }
  }

  internal var mBackground: Background!
  public func applyBackgroundBatch(_ payload: String) {
    guard let fields = cssBatchFields(payload, stride: CssBackgroundWriteRecord.stride) else { return }
    mBackground.applyCompiled(fields, initialColor: color, fontSize: resolvedFontSize)
  }

  public func applyEffectBatch(_ payload: String) {
    guard let fields = cssBatchFields(payload, stride: CssEffectWriteRecord.stride) else { return }
    applyCompiledEffects(fields, initialColor: color, fontSize: resolvedFontSize)
  }

  public func applyMaskBatch(_ payload: String) {
    guard let fields = cssBatchFields(payload, stride: CssMaskWriteRecord.stride) else { return }
    applyCompiledMask(fields)
  }

  private func cssBatchFields(_ payload: String, stride: Int) -> [String]? {
    guard let fields = (try? JSONSerialization.jsonObject(with: Data(payload.utf8))) as? [String],
          !fields.isEmpty, fields.count.isMultiple(of: stride) else { return nil }
    return fields
  }

  public var background: String  {
    set {
      mBackground.parseBackground(newValue)
    }
    get {
      return mBackground.css
    }
  }


  public var backgroundImage: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-image", value: newValue)
    }
    get {
      if(mBackground.layers.isEmpty){
        return ""
      }
      let img = mBackground.layers.map { layer in
        layer.image ?? ""
      }.joined(separator: ",")

      if(!img.isEmpty){
        return img + ";"
      }

      return ""
    }
  }

  public var backgroundRepeat: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-repeat", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { layer in
        layer.repeatType.rawValue
      }.joined(separator: ",")
    }
  }


  public var backgroundPosition: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-position", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.position?.cssValue ?? "0% 0%" }.joined(separator: ", ")
    }
  }


  public var backgroundSize: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-size", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.size?.cssValue ?? "auto" }.joined(separator: ", ")
    }
  }



  public var backgroundClip: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-clip", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.clip.rawValue }.joined(separator: ", ")
    }
  }

  public var backgroundPositionX: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-position-x", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.position?.x.cssValue(horizontal: true) ?? "0%" }.joined(separator: ", ")
    }
  }

  public var backgroundPositionY: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-position-y", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.position?.y.cssValue(horizontal: false) ?? "0%" }.joined(separator: ", ")
    }
  }

  public var backgroundOrigin: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-origin", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.origin.rawValue }.joined(separator: ", ")
    }
  }

  public var backgroundAttachment: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-attachment", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.attachment.rawValue }.joined(separator: ", ")
    }
  }

  public var backgroundBlendMode: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-blend-mode", value: newValue)
    }
    get {
      if mBackground.layers.isEmpty { return "" }
      return mBackground.layers.map { $0.blendMode.rawValue }.joined(separator: ", ")
    }
  }


  public func getBackgroundColor() -> String {
    if(getUInt8(StyleKeys.BACKGROUND_COLOR_STATE) != StyleState.SET){
      return ""
    }
    return backgroundColor.rgbaToHexCSS()
  }

  public func setBackgroundColor(string color: String) {
    guard let color = parseColor(color) else {return}
    mBackground.color = color
  }

  public func setBackgroundColor(ui color: UIColor) {
    backgroundColor = color.toUInt32()
  }


  public func setLineHeight(_ value: Float, _ isRelative: Bool) {
    writeLineHeight(value, StyleState.SET, isRelative ? 0 : 1)
  }

  internal func setResolvedFontSize(_ amount: Float, isPercent: Bool) {
    writeFontSize(isPercent ? amount * 100 : amount, StyleState.SET, isPercent ? 1 : 0)
    syncFontMetrics()
  }

  internal func setParsedFontStretch(_ code: Int32) {
    writeFontStretch(code, StyleState.SET)
  }

  internal func setResolvedLineHeight(_ amount: Float, kind: Int) {
    if kind == 3 {
      writeLineHeightState(StyleState.INHERIT)
    } else {
      setLineHeight(amount, kind == 0)
    }
  }

  internal func setResolvedWordSpacing(_ amount: Float, kind: UInt8) {
    writeWordSpacing(amount, kind, StyleState.SET)
  }

  public var fontVariantNumericString: String {
    get { fontVariantNumeric.cssValue }
    set { fontVariantNumeric = FontVariantNumeric.parse(newValue) }
  }


  public func setDecorationColor(ui color: UIColor) {
    decorationColor = color.toUInt32()
  }

  public func setDecorationColor(css color: String) {
    guard let field = NSCMason.expandCssShorthand("text-decoration-color", value: color)?.first,
          let argb = UInt32(field) else { return }
    decorationColor = argb
  }




  private func resolveDecorationThickness(_ length: String) -> Float? {
    length.isEmpty ? 0 : parseLength(self, length.lowercased())
  }

  public func applyListStyleType(_ css: String) {
    guard let code = NSCMason.htmlKeyword("list-style-type", css),
          let value = ListStyleType(rawValue: code) else { return }
    listStyleType = value
  }

  public func applyListStylePosition(_ css: String) {
    guard let code = NSCMason.htmlKeyword("list-style-position", css),
          let value = ListStylePosition(rawValue: code) else { return }
    listStylePosition = value
  }

  public func setFontStyle(_ style: FontStyle, _ slant: Int32) {
    let angle = style == .Oblique ? slant : 0
    guard style != fontStyle || angle != getInt32(StyleKeys.FONT_STYLE_SLANT)
          || getUInt8(StyleKeys.FONT_STYLE_STATE) != StyleState.SET else { return }
    font.style = fontDescriptorStyle(style, angle)
    invalidateResolvedFontCache()
    writeFontStyle(UInt8(bitPattern: style.rawValue), StyleState.SET, angle)
    syncFontMetrics()
  }

  internal func setParsedFontStyle(_ fields: [String]) {
    guard fields.count == 2, let code = Int8(fields[0]), let style = FontStyle(rawValue: code),
          let slant = Int32(fields[1]) else { return }
    setFontStyle(style, slant)
  }

  private func fontDescriptorStyle(_ style: FontStyle, _ slant: Int32) -> NSCFontStyle {
    switch style {
    case .Normal: return .normal()
    case .Italic: return .italic()
    case .Oblique: return .oblique(withAngle: Int(slant))
    }
  }


  internal var internalFontStyle: NSCFontStyle {
    fontDescriptorStyle(fontStyle, getInt32(StyleKeys.FONT_STYLE_SLANT))
  }

  internal func toFontWeight(weight: Int) -> (String, UIFont.Weight, NSCFontWeight) {
    if weight >= 100 && weight <= 1000 {
      switch weight {
      case 100..<200:
        return ("thin", .thin, .thin)
      case 200..<300:
        return ("extraLight", .ultraLight, .extraLight)
      case 300..<400:
        return ("light", .light, .light)
      case 400..<500:
        return ("normal", .regular, .normal)
      case 500..<600:
        return ("medium", .medium, .medium)
      case 600..<700:
        return ("semiBold", .semibold, .semiBold)
      case 700..<800:
        return ("bold", .bold, .bold)
      case 800..<900:
        return ("extraBold", .heavy, .extraBold)
      case 900..<1000:
        return ("black", .black, .black)
      default:
        break
      }
    }
    return ("thin", .thin, .thin)
  }

  public var fontFamily: String {
    get {
      return font.family
    }
    set {
      prepareMut()
      let oldFamily = font.family
      if (oldFamily != newValue) {
        guard let oldFont = font else {return}
        // Create new font with updated family
        font = NSCFontFace(family: newValue)
        font.weight = oldFont.weight
        font.style = oldFont.style
        font.fontDescriptors.display = oldFont.fontDescriptors.display

        font.loadSync(nil)

        syncFontMetrics()

        setUInt8(StyleKeys.FONT_FAMILY_STATE, StyleState.SET)
        invalidateResolvedFontCache()

        if(inBatch){
          setOrAppendState(StateKeys.fontFamily)
        }else {
          notifyTextStyleChanged(StateKeys.fontFamily)
        }
      }
    }
  }

  internal func setParsedFontFamilies(_ families: [String]) {
    guard let first = families.first else { return }
    let selected = families.first { family in
      let name = family.lowercased()
      return Self.genericFamilies.contains(name)
        || ["ui-rounded", "emoji", "math"].contains(name)
        || UIFont.familyNames.contains { $0.caseInsensitiveCompare(family) == .orderedSame }
    }
    fontFamily = selected ?? first
  }

  internal func setParsedFontWeight(_ fields: [String]) {
    guard fields.count == 2, let cssWeight = Int(fields[0]) else { return }
    let (_, platformWeight, faceWeight) = toFontWeight(weight: min(max(cssWeight, 100), 999))
    let stored = Int32(faceWeight.rawValue)
    let name = fields[1].isEmpty ? String(stored) : fields[1]
    guard name != weightName || stored != getInt32(StyleKeys.FONT_WEIGHT)
          || getUInt8(StyleKeys.FONT_WEIGHT_STATE) != StyleState.SET else { return }
    weight = platformWeight
    weightName = name
    font.weight = faceWeight
    invalidateResolvedFontCache()
    writeFontWeight(stored, StyleState.SET)
    syncFontMetrics()
  }

  private var detachedTextOverflowTokenKey: UInt64 = 0

  deinit {
    if detachedTextOverflowTokenKey != 0 {
      mason_css_text_overflow_release_detached(detachedTextOverflowTokenKey)
    }
  }

  private var textOverflowTokenKey: UInt64 {
    readBytes.load(fromByteOffset: StyleKeys.TEXT_OVERFLOW_TOKEN, as: UInt64.self)
  }

  private func readTextOverflowToken() -> String? {
    let fields = mason_css_text_overflow_token(textOverflowTokenKey)
    guard let owner = fields.owner else { return nil }
    defer { mason_css_shorthand_release(owner) }
    guard let text = fields.data?.pointee else { return nil }
    return String(decoding: UnsafeBufferPointer(start: text.bytes, count: Int(text.len)), as: UTF8.self)
  }

  private func decodeTextOverflow(_ kind: Int8) -> TextOverflow {
    switch kind {
    case 1: return .Ellipse(nil)
    case 2: return .Ellipse(readTextOverflowToken())
    case 3: return .Custom(readTextOverflowToken() ?? "")
    default: return .Clip
    }
  }

  private func applyTextOverflow(_ flow: TextOverflow) {
    let token: String? = switch flow {
    case .Ellipse(let token): token
    case .Custom(let token): token
    case .Clip: nil
    }
    guard installTextOverflow(UInt8(flow.rawValue), token: token) else { return }
    if inBatch { setOrAppendState(.textOverflow) }
    else { notifyTextStyleChanged(.textOverflow) }
  }

  private func installTextOverflow(_ kind: UInt8, token: String?) -> Bool {
    if node.isPlaceholder {
      if detachedTextOverflowTokenKey != 0 { mason_css_text_overflow_release_detached(detachedTextOverflowTokenKey) }
      if var text = token {
        detachedTextOverflowTokenKey = text.withUTF8 { bytes in
          mason_css_text_overflow_detached(CMasonCssText(bytes: bytes.baseAddress, len: UInt(bytes.count)))
        }
      } else {
        detachedTextOverflowTokenKey = 0
      }
      values.mutableBytes.storeBytes(of: detachedTextOverflowTokenKey, toByteOffset: StyleKeys.TEXT_OVERFLOW_TOKEN, as: UInt64.self)
      setUInt8(StyleKeys.TEXT_OVERFLOW, kind)
      setUInt8(StyleKeys.TEXT_OVERFLOW_STATE, StyleState.SET)
      return true
    }
    let mason = node.mason
    let deferred = mason.inCompute
    if !deferred { prepareMut() }
    var text = token ?? ""
    text.withUTF8 { bytes in
      mason_css_text_overflow_set(deferred ? nil : mason.nativePtr, node.nativePtr, kind,
        CMasonCssText(bytes: bytes.baseAddress, len: UInt(bytes.count)))
    }
    if deferred { mason.deferStyleRecords(self, textChanges: .textOverflow) }
    return !deferred
  }

  public func setTextOverflow(_ flow: TextOverflow, _ value: String){}

  public var textOverflowCompat: TextOverflowCompat {
    get {
      return TextOverflowCompat(flow: textOverflow)
    }
    set {
      textOverflow = newValue.flow
    }
  }

  private func updateDisplayVisibility(_ value: Display) {
    // A zero-sized UIView can still draw unclipped.
    node.view?.isHidden = value == .None || hidesView || MasonDetails.isHidden(node)
  }

  /// `visibility: hidden` or `collapse`: the view isn't drawn, though a hidden one keeps its box.
  internal var hidesView: Bool {
    return visibilityCode != 0
  }

  internal var textShadows: [TextShadow] = []
  private var textShadowCss = ""
  public var textShadow: String {
    get { textShadowCss }
    set { applyTextShadow(newValue, shadows: ShadowParser.parseTextShadow(style: self, value: newValue)) }
  }

  private func applyTextShadow(_ value: String, shadows: [TextShadow]) {
    textShadowCss = value
    textShadows = shadows
    if node.isPlaceholder {
      prepareMut()
      setUInt8(StyleKeys.TEXT_SHADOW_STATE, shadows.isEmpty ? StyleState.INHERIT : StyleState.SET)
    }
    if node.isPlaceholder || !node.mason.inCompute { notifyTextStyleChanged(StateKeys.textShadow) }
  }

  internal var boxShadows: [BoxShadow] = []
  internal lazy var mBoxShadowRenderer: BoxShadowRenderer = {
    BoxShadowRenderer(style: self)
  }()
  
  /// Shadow layer for rendering outset shadows outside view bounds
  internal lazy var mShadowLayer: MasonShadowLayer = {
    MasonShadowLayer(style: self)
  }()
  private var shadowLayerAdded = false
  private weak var shadowLayerParent: CALayer?

  /// An opaque color fills the whole border box, hiding whatever lies under the element.
  internal var paintsOpaqueBorderBox: Bool {
    guard (resolvedBackgroundColor >> 24) == 0xFF, filter.isEmpty else { return false }
    return (mBackground?.layers.last?.clip ?? .borderBox) == .borderBox
  }

  /// Background or opacity changed without a relayout: re-decide how the shadow is drawn.
  internal func refreshShadowMode(_ viewLayer: CALayer) {
    if shadowLayerAdded && !mShadowLayer.isHidden { mShadowLayer.updateMode(viewLayer: viewLayer) }
  }
  
  private var boxShadowCss = ""
  public var boxShadow: String {
    get { boxShadowCss }
    set { applyBoxShadow(newValue, shadows: ShadowParser.parseBoxShadow(style: self, value: newValue)) }
  }

  private func applyBoxShadow(_ value: String, shadows: [BoxShadow]) {
    boxShadowCss = value
    boxShadows = shadows
    if let view = node.view {
      syncShadowLayer(view, viewBounds: view.bounds)

      // Invalidate draw flags so _cachedHasBoxShadow is recalculated before the next draw.
      if let masonView = view as? MasonUIView {
        masonView.invalidateDrawFlags()
      } else {
        view.setNeedsDisplay()
      }
    }
  }

  /// Attach + position the outset box-shadow layer in the SUPERVIEW's layer,
  /// below the child, so it paints beyond the child's bounds and sits behind it
  /// (hosting it in the child's own layer renders the opaque fill as black wedges
  /// over the child's transparent rounded corners).
  private func syncShadowLayer(_ view: UIView, viewBounds: CGRect) {
    let hasOutsetShadows = boxShadows.contains { !$0.inset }
    // A mask clips everything outside the element's box, and the shadow lies wholly outside
    // it; hosted in the superview it would escape the mask, so it is hidden instead.
    guard hasOutsetShadows, !isMasked else {
      if shadowLayerAdded { mShadowLayer.isHidden = true }
      return
    }
    mShadowLayer.isHidden = false

    guard let superview = view.superview else { return }
    let host = superview.backingLayer

    if !shadowLayerAdded || shadowLayerParent !== host {
      mShadowLayer.removeFromSuperlayer()
      if let childLayer = view.backingLayer as CALayer?, superview.backingLayer.sublayers?.contains(childLayer) == true {
        superview.backingLayer.insertSublayer(mShadowLayer, below: childLayer)
      } else {
        superview.backingLayer.insertSublayer(mShadowLayer, at: 0)
      }
      shadowLayerAdded = true
      shadowLayerParent = host
    }

    mShadowLayer.updateBounds(viewBounds: viewBounds, viewLayer: view.backingLayer)
  }

  /// Detach the outset-shadow layer (it lives in the superview's layer, so
  /// removing the child alone leaves a ghost shadow). Call on view removal.
  internal func removeShadowLayer() {
    if shadowLayerAdded {
      mShadowLayer.removeFromSuperlayer()
      shadowLayerAdded = false
      shadowLayerParent = nil
    }
    mFilterStorage?.layer.removeFromSuperlayer()
  }

  /// Reset shadow-layer bookkeeping when the layer was pulled externally.
  /// Idempotent; does NOT touch the layer (the caller already removed it).
  internal func markShadowLayerDetached() {
    shadowLayerAdded = false
    shadowLayerParent = nil
  }

  /// Call this from layoutSubviews to update shadow layer bounds
  internal func updateShadowLayer(for bounds: CGRect) {
    guard let view = node.view else { return }
    syncShadowLayer(view, viewBounds: bounds)
    mFilterStorage?.syncOutputGeometry()
  }

  internal lazy var mBorderRender: CSSBorderRenderer  = {
    CSSBorderRenderer(style: self)
  }()


  private var authoredBorderRadius = ""
  public var borderRadius: String {
    get { authoredBorderRadius }
    set {
      authoredBorderRadius = newValue
      CSSBorderRenderer.parseBorderRadius(self, newValue)
      (node.view as? MasonUIView)?.invalidateDrawFlags()
    }
  }

  internal func setCompiledBorderRadius(_ css: String, radii: [MasonLengthPercentage]) {
    authoredBorderRadius = css
    CSSBorderRenderer.applyResolvedBorderRadius(self, radii)
    (node.view as? MasonUIView)?.invalidateDrawFlags()
  }

  public var border: String {
    get {
      return mBorderRender.css
    }
    set {
      mBorderRender.parseBorderShorthand(newValue)
    }
  }

  public var paddingCss: String {
    get {
      return padding.cssValue
    }
    set {
      CSSBorderRenderer.parsePaddingShorthand(self, newValue)
    }
  }

  public var marginCss: String {
    get {
      return margin.cssValue
    }
    set {
      CSSBorderRenderer.parseMarginShorthand(self, newValue)
    }
  }

  public var insetCss: String {
    get {
      return inset.cssValue
    }
    set {
      CSSBorderRenderer.parseInsetShorthand(self, newValue)
    }
  }

  public var borderLeft: String = "" {
    didSet {
      mBorderRender.parseBorderSideShorthand(.left, borderLeft)
    }
  }

  public var borderTop: String = "" {
    didSet {
      mBorderRender.parseBorderSideShorthand(.top, borderTop)
    }
  }

  public var borderRight: String = "" {
    didSet {
      mBorderRender.parseBorderSideShorthand(.right, borderRight)
    }
  }

  public var borderBottom: String = "" {
    didSet {
      mBorderRender.parseBorderSideShorthand(.bottom, borderBottom)
    }
  }

  internal var mBorderLeft: CSSBorderRenderer.BorderSide {
    return mBorderRender.left
  }
  
  internal var mBorderTop: CSSBorderRenderer.BorderSide {
    return mBorderRender.top
  }

  internal var mBorderRight: CSSBorderRenderer.BorderSide {
    return mBorderRender.right
  }
  
  internal var mBorderBottom: CSSBorderRenderer.BorderSide {
    return mBorderRender.bottom
  }
  









  public func setScrollBarWidth(_ value: Float) {
    scrollBarWidth = MasonDimension.Points(value);
  }

  public func setSizeWidth(_ width: MasonDimension) {
    self.width = width
  }

  public func setSizeHeight(_ height: MasonDimension) {
    self.height = height
  }

  public func setSizePoints(_ width: Float, _ height: Float) {
    size = MasonSize(.Points(width), .Points(height))
  }

  private var gridCssCache: [Int: String] = [:]
  private var gridWrites: [String] = []

  private func readGridCss(_ property: Int, _ read: () -> String) -> String {
    if let cached = gridCssCache[property] { return cached }
    let value = read()
    gridCssCache[property] = value
    return value
  }

  private func queueGridCss(_ property: Int, _ value: String) {
    gridWrites.append(String(property))
    gridWrites.append(value.replacingOccurrences(of: "\0", with: "\u{FFFD}"))
    if !inBatch && !pendingInvalidation.contains(.invalidating) {
      pendingInvalidation = pendingInvalidation.union(.pending)
      updateNativeStyle()
    }
  }

  public func applyLayoutLength(_ property: String, _ value: String) -> Bool {
    applyLayoutLengthForState(0, property, value)
  }

  public func applyLayoutLengthForState(_ flags: UInt16, _ property: String, _ value: String) -> Bool {
    guard !node.isPlaceholder && !node.mason.inCompute else { return false }
    if flags == 0 { prepareMut() }
    let viewport = NSCMason.viewportSize
    return property.withCString { name in
      value.withCString { css in
        mason_css_apply_layout_length_for_state(node.mason.nativePtr, node.nativePtr, flags, name, css,
          resolvedFontSize, NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height))
      }
    }
  }

  public func layoutLengthCss(_ property: String) -> String? {
    layoutLengthCssForState(0, property)
  }

  public func layoutLengthCssForState(_ flags: UInt16, _ property: String) -> String? {
    return property.withCString { name in
      NativeHelpers.toSwiftString { mason_css_copy_layout_length_for_state(node.mason.nativePtr, node.nativePtr, flags, name) }
    }
  }

  private func flushGridCss() -> Bool {
    guard !gridWrites.isEmpty else { return false }
    let input = Array(gridWrites.joined(separator: "\0").utf8)
    gridWrites.removeAll(keepingCapacity: true)
    gridCssCache.removeAll(keepingCapacity: true)
    let viewport = NSCMason.viewportSize
    input.withUnsafeBufferPointer {
      mason_css_apply_grid(node.mason.nativePtr, node.nativePtr,
        CMasonCssText(bytes: $0.baseAddress, len: UInt($0.count)),
        resolvedFontSize, NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height))
    }
    return true
  }

  // <style-keys:grid-accessors>
  public var gridAutoRows: String {
    get { readGridCss(0) { NativeHelpers.toSwiftString { mason_style_get_grid_auto_rows_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(0, newValue) }
  }

  public var gridAutoColumns: String {
    get { readGridCss(1) { NativeHelpers.toSwiftString { mason_style_get_grid_auto_columns_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(1, newValue) }
  }

  public var gridColumn: String {
    get { readGridCss(2) { NativeHelpers.toSwiftString { mason_style_get_grid_column_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(2, newValue) }
  }

  public var gridColumnStart: String {
    get { readGridCss(3) { NativeHelpers.toSwiftString { mason_style_get_grid_column_start_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(3, newValue) }
  }

  public var gridColumnEnd: String {
    get { readGridCss(4) { NativeHelpers.toSwiftString { mason_style_get_grid_column_end_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(4, newValue) }
  }

  public var gridRow: String {
    get { readGridCss(5) { NativeHelpers.toSwiftString { mason_style_get_grid_row_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(5, newValue) }
  }

  public var gridRowStart: String {
    get { readGridCss(6) { NativeHelpers.toSwiftString { mason_style_get_grid_row_start_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(6, newValue) }
  }

  public var gridRowEnd: String {
    get { readGridCss(7) { NativeHelpers.toSwiftString { mason_style_get_grid_row_end_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(7, newValue) }
  }

  public var gridTemplateRows: String {
    get { readGridCss(8) { NativeHelpers.toSwiftString { mason_style_get_grid_template_rows_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(8, newValue) }
  }

  public var gridTemplateColumns: String {
    get { readGridCss(9) { NativeHelpers.toSwiftString { mason_style_get_grid_template_columns_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(9, newValue) }
  }

  public var gridArea: String {
    get { readGridCss(10) { NativeHelpers.toSwiftString { mason_style_get_grid_area_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(10, newValue) }
  }

  public var gridTemplateAreas: String {
    get { readGridCss(11) { NativeHelpers.toSwiftString { mason_style_get_grid_template_areas_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }
    set { queueGridCss(11, newValue) }
  }
  // </style-keys:grid-accessors>

  /// Whether a buffer transform pivots on a set transform-origin or holds a percentage, so it
  /// must be reapplied on resize.
  internal var transformDependsOnOrigin: Bool {
    if let program = transformProgram { return program.usesBoxSize || hasTransformOrigin }
    let flags = getUInt8(StyleKeys.TRANSFORM_FLAGS)
    if flags & StyleKeys.TRANSFORM_FLAG_HAS_PERCENT != 0 { return true }
    return hasTransformOrigin && (getUInt8(StyleKeys.TRANSFORM_COUNT) != 0
      || (flags & StyleKeys.TRANSFORM_FLAG_HAS_MATRIX) != 0)
  }

  private var _transformRaw: String?
  public var transform: String {
    set {
      _transformRaw = newValue
      installTransform(newValue)
      applyTransformFromBuffer()
    }
    get {
      return _transformRaw ?? ""
    }
  }
  

  // MARK: - border-image (string-based, parsed natively)
  
  // Native drawing state for the image border, created when a declaration is set.
  internal var mBorderImageStorage: BorderImage?
  /// Set once a pseudo state carries `border-image`; until then draws skip the pseudo lookup.
  internal var hasPseudoBorderImage = false

  @objc public var borderImage: String = "" {
    didSet {
      if borderImage != oldValue { borderImageChanged() }
    }
  }
  
  
  // MARK: - backdrop-filter (string-based, parsed natively)

  // Created on first parse, like mFilter; layoutSubviews checks it on every view.
  private var mBackdropFilterStorage: CSSFilters.CSSFilter?
  var mBackdropFilter: CSSFilters.CSSFilter {
    if let filter = mBackdropFilterStorage { return filter }
    let filter = CSSFilters.CSSFilter()
    mBackdropFilterStorage = filter
    return filter
  }

  private var backdropFilterCss = ""
  @objc public var backdropFilter: String {
    get { backdropFilterCss }
    set { installBackdropFilter(newValue, filters: CSSFilters.setStyleFilter(newValue, style: self, backdrop: true)) }
  }

  private func installBackdropFilter(_ value: String, filters: [CSSFilters.Filter]) {
    backdropFilterCss = value
    if filters.isEmpty {
      if let current = mBackdropFilterStorage, !current.filters.isEmpty {
        current.reset()
        node.view?.backingLayer.sublayers?.first(where: { $0.name == CSSFilters.backdropLayerName })?.removeFromSuperlayer()
        if let view = node.view { CSSFilters.BackdropPaint.sync(view.backingLayer) }
      }
      return
    }

    mBackdropFilter.replaceFilters(filters)
    if let view = node.view {
      // Border-radius clip is independent of overflow and re-queried per frame.
      mBackdropFilter.applyAsBackdrop(to: view, clipPathProvider: { [weak self, weak view] in
        guard let self = self, let view = view, self.mBorderRender.hasRadii() else { return nil }
        return self.mBorderRender.getClipPath(rect: view.bounds, radius: self.mBorderRender.radius)
      })
    }
  }

  @nonobjc internal func applyCompiledEffects(_ fields: [String], initialColor: UInt32, fontSize: Float) {
    guard !fields.isEmpty, fields.count.isMultiple(of: CssEffectWriteRecord.stride) else { return }
    let attached = !node.isPlaceholder
    let deferred = attached && node.mason.inCompute
    if attached && !deferred { prepareMut() }
    let viewport = NSCMason.viewportSize
    let rootFontSize = NSCMason.rootFontSize
    var input = fields.joined(separator: "\u{0}")
    guard let batch = input.withUTF8({ bytes in
      mason_css_effect_batch_apply(attached && !deferred ? node.mason.nativePtr : nil,
        attached ? node.nativePtr : nil, CMasonCssText(bytes: bytes.baseAddress, len: UInt(bytes.count)),
        1, fontSize, rootFontSize, Float(viewport.width), Float(viewport.height), initialColor)
    }) else { return }
    defer { mason_css_effect_batch_release(batch) }

    func apply(_ kind: StyleRecordKind, _ install: (String, UnsafeBufferPointer<Double>, CMasonCssEffectView) -> Void) {
      let effect = mason_css_effect_batch_get(batch, kind.rawValue)
      guard effect.present else { return }
      if deferred { node.mason.deferStyleRecords(self, kind: kind) }
      let value = String(decoding: UnsafeBufferPointer(start: effect.value.bytes, count: Int(effect.value.len)), as: UTF8.self)
      let records = UnsafeBufferPointer(start: effect.values, count: Int(effect.len))
      install(value, records, effect)
    }
    apply(.filter) { value, records, effect in
      let program = effect.filter.map { NativeFilterProgram(value, handle: $0) }
      let context = FilterContext(fontSize: fontSize, rootFontSize: rootFontSize, viewport: viewport, color: effect.current_color)
      applyAuthoredFilter(value, program: program, filters: CSSFilters.decode(records), context: context)
    }
    apply(.backdropFilter) { value, records, _ in installBackdropFilter(value, filters: CSSFilters.decode(records)) }
    apply(.boxShadow) { value, records, _ in applyBoxShadow(value, shadows: ShadowParser.readBoxShadows(records)) }
    apply(.textShadow) { value, records, _ in applyTextShadow(value, shadows: ShadowParser.readTextShadows(records)) }
  }

  /// Keep the backdrop layer sized to the host view: `backdropFilter` is usually set before the
  /// view has a size.
  func updateBackdropFrames(for bounds: CGRect) {
    guard let backdrop = mBackdropFilterStorage, !backdrop.filters.isEmpty, let view = node.view else { return }
    if let backdropLayer = view.backingLayer.sublayers?.first(where: { $0.name == CSSFilters.backdropLayerName }) {
      // The box's own paint, moved just above the backdrop, stays where the view's layer paints.
      let host = view.backingLayer
      let paint = CSSFilters.BackdropPaint.layer(of: host)
      if backdropLayer.frame != bounds || (paint.map { $0.frame != host.bounds } ?? false) {
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        backdropLayer.frame = bounds
        paint?.frame = host.bounds
        CATransaction.commit()
      }
    }
  }
  
  
  // MARK: - mask-* (string-based, parsed natively; see Mask.swift)

  // Created on first use, so an element that never sets a mask pays nothing.
  internal var mMaskStorage: Mask?
  /// Set once a pseudo state carries a mask longhand; until then masks skip the pseudo lookup.
  internal var hasPseudoMask = false
  // Set once any mask property changes; until then there is nothing to sync.
  internal var maskEverSet = false

  // The authored layer and mask-border longhands share the Rust record layout.
  private static let emptyMaskInputs = Array(repeating: "", count: MaskInputRecord.stride + NineSliceInputRecord.stride)
  internal private(set) var maskInputs = MasonStyle.emptyMaskInputs

  private func setMaskInput(_ index: Int, _ value: String) {
    maskInputs[index] = value
    maskChanged()
  }

  internal func applyCompiledMask(_ fields: [String]) {
    let stride = CssMaskWriteRecord.stride
    guard !fields.isEmpty, fields.count.isMultiple(of: stride) else { return }
    var clip: String?
    for offset in Swift.stride(from: 0, to: fields.count, by: stride) {
      guard let slot = Int(fields[offset + CssMaskWriteRecord.slot]), slot >= 0 else { continue }
      let value = fields[offset + CssMaskWriteRecord.value]
      if slot == maskInputs.count {
        clip = value
      } else if slot < maskInputs.count {
        maskInputs[slot] = value
      }
    }
    if let clip {
      clipPath = clip
    } else {
      maskChanged()
    }
  }

  @nonobjc internal private(set) var clipPathProgram: NativeClipPath?

  private func updateClipPath(from previous: String) {
    if clipPath != previous {
      let program = NativeClipPath(clipPath)
      clipPathProgram = program
      NativeClipPath.install(program, on: self)
    }
    maskChanged()
  }

  // <style-keys:mask-accessors> generated from tools/scripts/style-keys/style-keys.schema
  static let maskPropertyNames = [
    "mask-image",
    "mask-size",
    "mask-position",
    "mask-repeat",
    "mask-origin",
    "mask-clip",
    "mask-mode",
    "mask-composite",
    "clip-path",
    "mask-border-source",
    "mask-border-slice",
    "mask-border-width",
    "mask-border-outset",
    "mask-border-repeat",
    "mask-border-mode",
  ]

  @objc public var maskImage: String {
    get { maskInputs[0] }
    set { setMaskInput(0, newValue) }
  }

  @objc public var maskSize: String {
    get { maskInputs[1] }
    set { setMaskInput(1, newValue) }
  }

  @objc public var maskPosition: String {
    get { maskInputs[2] }
    set { setMaskInput(2, newValue) }
  }

  @objc public var maskRepeat: String {
    get { maskInputs[3] }
    set { setMaskInput(3, newValue) }
  }

  @objc public var maskOrigin: String {
    get { maskInputs[4] }
    set { setMaskInput(4, newValue) }
  }

  @objc public var maskClip: String {
    get { maskInputs[5] }
    set { setMaskInput(5, newValue) }
  }

  @objc public var maskMode: String {
    get { maskInputs[6] }
    set { setMaskInput(6, newValue) }
  }

  @objc public var maskComposite: String {
    get { maskInputs[7] }
    set { setMaskInput(7, newValue) }
  }

  @objc public var clipPath: String = "" {
    didSet { updateClipPath(from: oldValue) }
  }

  @objc public var maskBorderSource: String {
    get { maskInputs[8] }
    set { setMaskInput(8, newValue) }
  }

  @objc public var maskBorderSlice: String {
    get { maskInputs[9] }
    set { setMaskInput(9, newValue) }
  }

  @objc public var maskBorderWidth: String {
    get { maskInputs[10] }
    set { setMaskInput(10, newValue) }
  }

  @objc public var maskBorderOutset: String {
    get { maskInputs[11] }
    set { setMaskInput(11, newValue) }
  }

  @objc public var maskBorderRepeat: String {
    get { maskInputs[12] }
    set { setMaskInput(12, newValue) }
  }

  @objc public var maskBorderMode: String {
    get { maskInputs[13] }
    set { setMaskInput(13, newValue) }
  }
  // </style-keys:mask-accessors>

  private var fontFeatureSettingsCss = "normal"
  private var fontFeatures: [[CFString: Any]]?

  @objc public var fontFeatureSettings: String {
    get { fontFeatureSettingsCss }
    set {
      if fontFeatures != nil, newValue == fontFeatureSettingsCss { return }
      let features = withStyleCssRecords(self, newValue, kind: .fontFeatures) { records -> [[CFString: Any]]? in
        guard records.baseAddress != nil else { return nil }
        return stride(from: 0, to: records.count, by: FontFeatureRecord.stride).map { index in
          let tag = UInt32(records[index + FontFeatureRecord.tag])
          let bytes = (0..<4).map { UInt8(truncatingIfNeeded: tag >> ($0 * 8)) }
          return [kCTFontOpenTypeFeatureTag: String(decoding: bytes, as: UTF8.self),
                  kCTFontOpenTypeFeatureValue: UInt32(records[index + FontFeatureRecord.value])]
        }
      }
      guard let features else { return }
      fontFeatures = features
      fontFeatureSettingsCss = newValue
      if node.isPlaceholder || !node.mason.inCompute {
        if inBatch { setOrAppendState(.fontFeatureSettings) }
        else { notifyTextStyleChanged(.fontFeatureSettings) }
      }
    }
  }
  @nonobjc internal var resolvedFontFeatures: [[CFString: Any]] {
    fontFeatures ?? parentStyleWithTextValues?.resolvedFontFeatures ?? []
  }
  
  public func updateNativeStyle() {
    if(inBatch || pendingInvalidation.contains(.invalidating) || pendingInvalidation.rawValue == 0){
      return
    }
    
    let element = node.view as? MasonElement
    var needsLayout = flushGridCss()

    if (isDirty != 0 || isDirtyHigh != 0) {
      let state = StateKeys(low: isDirty, high: isDirtyHigh)

      // Update the version before notifying the text engine.
      styleVersion &+= 1
      updateTextStyle()
      
      if(isDirty > 0){
        if(state.contains(.zIndex)){
          element?.uiView.backingLayer.zPosition = CGFloat(zIndex)
          if zIndex < 0 { element?.uiView.superview?.backingLayer.setNeedsDisplay() }
        }
      }

      // Dispatch caret-color to input views
      if state.contains(.caretColor) {
        notifyTextStyleChanged(.caretColor)
      }

      if state.contains(.objectPaint), let image = node.view as? Img {
        if state.contains(.objectFit) { image.setObjectFit(objectFit) }
        image.masonLayer.setNeedsLayout()
      }

      if state.contains(.transformOrigin) && transformDependsOnOrigin {
        applyTransformFromBuffer()
      }

      if state.contains(.borderPaint) {
        mBorderRender.invalidateCache()
        if let view = node.view as? MasonUIView {
          view.invalidateDrawFlags()
        } else {
          node.view?.setNeedsDisplay()
        }
        if state.contains(.borderRadius) { node.view?.setNeedsLayout() }
      }

      if state.contains(.paintOnly) { node.view?.setNeedsDisplay() }
      
      isDirty = 0
      isDirtyHigh = 0
      needsLayout = needsLayout || state.requiresLayout
    }

    if needsLayout {
      pendingInvalidation = pendingInvalidation.union(.invalidating)
      element?.requestLayout()
    }
    pendingInvalidation = .none
  }

  public override var description: String {
    var aspectRatioDesc = "undefined"
    if let aspectRatio = self.aspectRatio {
      aspectRatioDesc = String(describing: aspectRatio)
    }
    
    let overflowDesc = overflowX == overflowY
    ? overflowX.cssValue
    : "\(overflowX.cssValue) \(overflowY.cssValue)"
    
    let parts: [String] = [
      "display: \(display.cssValue)",
      "position: \(position.cssValue)",
      "flexDirection: \(flexDirection.cssValue)",
      "overflow: \(overflowDesc)",
      "flexWrap: \(flexWrap.cssValue)",
      "alignItems: \(alignItems.cssValue)",
      "alignSelf: \(alignSelf.cssValue)",
      "alignContent: \(alignContent.cssValue)",
      "justifyItems: \(justifyItems.cssValue)",
      "justifySelf: \(justifySelf.cssValue)",
      "justifyContent: \(justifyContent.cssValue)",
      "margin: \(margin.cssValue)",
      "padding: \(padding.cssValue)",
      "border: \(border)",
      "gap: \(gap.cssValue)",
      "flexGrow: \(flexGrow)",
      "flexShrink: \(flexShrink)",
      "flexBasis: \(flexBasis.cssValue)",
      "size: \(size.cssValue)",
      "minSize: \(minSize.cssValue)",
      "maxSize: \(maxSize.cssValue)",
      "aspectRatio: \(aspectRatioDesc)",
      "gridAutoRows: \(gridAutoRows)",
      "gridAutoColumns: \(gridAutoColumns)",
      "gridColumn: \(gridColumn)",
      "gridRow: \(gridRow)",
      "gridTemplateRows: \(gridTemplateRows)",
      "gridTemplateColumns: \(gridTemplateColumns)",
      "scrollBarWidth: \(scrollBarWidth)"
    ]
    
    let joined = parts.joined(separator: ",\n  ")
    
    return """
        (MasonStyle) {
          \(joined)
        }
        """
  }
}


// Mark resolved props
extension MasonStyle {
  // Parent's style for inherited text properties. Must NOT gate on
  // isValueInitialized: that flag lags JS style writes by a beat, but the
  // underlying buffer is already correct, so gating on it can find no
  // "initialized" ancestor and silently fall back to unset (0) values.
  private var parentStyleWithTextValues: MasonStyle? {
    return node.parent?.style
  }
  
  private static func resolvedFontCacheKey(family: String, weight: NSCFontWeight, style: NSCFontStyle) -> UInt64 {
    var hasher = Hasher()
    hasher.combine(family)
    hasher.combine(weight)
    hasher.combine(style)
    return UInt64(bitPattern: Int64(hasher.finalize()))
  }
  
  // Loaded faces for the generic families, shared by every text view: loading
  // one resolves the system font and was paid again by each new view. Custom
  // @font-face families can finish loading later, so they are never cached.
  private static let genericFamilies: Set<String> = ["sans-serif", "serif", "monospace", "system", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace", "-apple-system", "cursive", "fantasy"]
  private static var loadedGenericFaces: [String: NSCFontFace] = [:]

  /// A loaded face for `face`'s family and style when it is a generic family (main thread).
  internal static func loadedGenericFace(like face: NSCFontFace) -> NSCFontFace? {
    let family = face.family.lowercased()
    guard genericFamilies.contains(family) else { return nil }
    let key = "\(family)|\(face.style.type.rawValue)"
    if let cached = loadedGenericFaces[key] { return cached }
    let loaded = NSCFontFace(family: face.family)
    loaded.style = face.style
    loaded.loadSync(nil)
    guard loaded.font != nil else { return nil }
    loadedGenericFaces[key] = loaded
    return loaded
  }

  internal func invalidateResolvedFontCache() {
    _cachedResolvedFont = nil
    _resolvedFontKey = 0
  }
  
  internal var resolvedFontFace: NSCFontFace {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.fontFace {
      return value
    }
    let value = resolvedFontFaceUncached
    resolvedMemo.fontFace = value
    return value
  }

  private var resolvedFontFaceUncached: NSCFontFace {
    let familyState = getUInt8(StyleKeys.FONT_FAMILY_STATE)
    let weightState = getUInt8(StyleKeys.FONT_WEIGHT_STATE)
    let styleState = getUInt8(StyleKeys.FONT_STYLE_STATE)
    
    // If all font properties are inherited, use parent's font face
    if (familyState == StyleState.INHERIT && weightState == StyleState.INHERIT && styleState == StyleState.INHERIT) {
      return parentStyleWithTextValues?.resolvedFontFace ?? font
    }
    
    // If family is inherited but weight/style are set, need to create a new FontFace
    let baseFamily = if (familyState == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontFace.family ?? font.family
    } else {
      font.family
    }
    
    let resolvedWeight = if (weightState == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontWeight
      ?? storedFontWeight()
    } else {
      storedFontWeight()
    }
    
    let resolvedStyle = if (styleState == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedInternalFontStyle ?? internalFontStyle
    } else {
      internalFontStyle
    }
    
    
    // If everything matches current font, return it
    if (font.family == baseFamily && font.weight == resolvedWeight && font.fontDescriptors.style == resolvedStyle) {
      return font
    }
    
    // Check one-slot cache
    let key = MasonStyle.resolvedFontCacheKey(family: baseFamily, weight: resolvedWeight, style: resolvedStyle)
    if let cached = _cachedResolvedFont, _resolvedFontKey == key {
      return cached
    }
    
    // Create a new FontFace with resolved properties and cache it
    let resolvedFont = NSCFontFace(family: baseFamily)
    resolvedFont.weight = resolvedWeight
    resolvedFont.style = resolvedStyle
    _cachedResolvedFont = resolvedFont
    _resolvedFontKey = key
    
    return resolvedFont
  }
  
  // MARK: - Pseudo-aware resolution helpers

  /// Resolve a UInt32 property with pseudo-state overlay.
  /// Returns the base value unless an active pseudo buffer overrides it.
  /// Only reads from pseudo buffers where the property was explicitly marked via `markPseudoSet`.
  internal func resolvePseudoByte(_ valueKey: Int, _ stateKey: Int, _ base: UInt8, _ key: StateKeys) -> UInt8 {
    let mask = node.pseudoMask
    if mask == 0 { return base }
    var result = base
    for state in PSEUDO_CSS_ORDER {
      if (mask & state.rawValue) != 0 {
        if let buf = node.getPseudoBufferRaw(state.rawValue),
           buf.count > stateKey {
          let lowOfs = StyleKeys.PSEUDO_SET_MASK_LOW
          let highOfs = StyleKeys.PSEUDO_SET_MASK_HIGH
          guard buf.count >= highOfs + 8 else { continue }
          let base = buf.baseAddress!
          var setLow: UInt64 = 0
          var setHigh: UInt64 = 0
          memcpy(&setLow, base + lowOfs, 8)
          memcpy(&setHigh, base + highOfs, 8)
          let isSet = (setLow & key.low) != 0 || (setHigh & key.high) != 0
          if isSet {
            result = base.advanced(by: valueKey).pointee
          }
        }
      }
    }
    return result
  }

  internal func resolvePseudoUInt32(_ valueKey: Int, _ stateKey: Int, _ base: UInt32, _ key: StateKeys) -> UInt32 {
    let mask = node.pseudoMask
    if mask == 0 { return base }
    var result = base
    for state in PSEUDO_CSS_ORDER {
      if (mask & state.rawValue) != 0 {
        if let buf = node.getPseudoBufferRaw(state.rawValue),
           buf.count > stateKey {
          // Check if this property was explicitly set in the pseudo buffer
          let lowOfs = StyleKeys.PSEUDO_SET_MASK_LOW
          let highOfs = StyleKeys.PSEUDO_SET_MASK_HIGH
          guard buf.count >= highOfs + 8 else { continue }
          let base = buf.baseAddress!
          var setLow: UInt64 = 0
          var setHigh: UInt64 = 0
          memcpy(&setLow, base + lowOfs, 8)
          memcpy(&setHigh, base + highOfs, 8)
          let isSet = (setLow & key.low) != 0 || (setHigh & key.high) != 0
          if isSet {
            var val: UInt32 = 0
            memcpy(&val, base + valueKey, 4)
            result = val
          }
        }
      }
    }
    return result
  }

  // Resolved properties that handle inheritance
  internal var resolvedColor: UInt32 {
    let state = getUInt8(StyleKeys.FONT_COLOR_STATE)
    let base: UInt32 = if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedColor ?? getUInt32(StyleKeys.FONT_COLOR)
    } else {
      getUInt32(StyleKeys.FONT_COLOR)
    }
    return resolvePseudoUInt32(StyleKeys.FONT_COLOR, StyleKeys.FONT_COLOR_STATE, base, .color)
  }

  internal var resolvedFontSize: Float {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.fontSize {
      return value
    }
    let value = resolvedFontSizeUncached
    resolvedMemo.fontSize = value
    return value
  }

  private var resolvedFontSizeUncached: Float {
    let state = getUInt8(StyleKeys.FONT_SIZE_STATE)
    let type = getUInt8(StyleKeys.FONT_SIZE_TYPE)
    // PERCENT == 1
    if (type == StyleState.SET) {
      let parentFontSize = {
        if let parent = node.parent, parent.style.isValueInitialized {
          return parent.style.resolvedFontSize
        }else {
          return Constants.DEFAULT_FONT_SIZE
        }
      }()
      
      return resolvePercentageFontSize(parentFontSize)
    }
    
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontSize ?? getFloat(StyleKeys.FONT_SIZE)
    } else {
      getFloat(StyleKeys.FONT_SIZE)
    }
  }
  
  internal func resolvePercentageFontSize(_ parentFontSize: Float) -> Float {
    let percent = getFloat(StyleKeys.FONT_SIZE) / 100
    return max(parentFontSize * percent, 0)
  }
  
  internal var resolvedFontWeight: NSCFontWeight {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.fontWeight {
      return value
    }
    let value = resolvedFontWeightUncached
    resolvedMemo.fontWeight = value
    return value
  }

  private func storedFontWeight() -> NSCFontWeight {
    let value = Int(getInt32(StyleKeys.FONT_WEIGHT))
    return NSCFontWeight(rawValue: value) ?? toFontWeight(weight: min(max(value, 100), 999)).2
  }

  private var resolvedFontWeightUncached: NSCFontWeight {
    let state = getUInt8(StyleKeys.FONT_WEIGHT_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontWeight
      ?? storedFontWeight()
    } else {
      storedFontWeight()
    }
  }
  
  internal var resolvedFontStyle: FontStyle{
    let state = getUInt8(StyleKeys.FONT_STYLE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontStyle ?? fontStyle
    } else {
      fontStyle
    }
  }
  
  internal var resolvedInternalFontStyle: NSCFontStyle {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.internalFontStyle {
      return value
    }
    let value = resolvedInternalFontStyleUncached
    resolvedMemo.internalFontStyle = value
    return value
  }

  private var resolvedInternalFontStyleUncached: NSCFontStyle {
    let state = getUInt8(StyleKeys.FONT_STYLE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedInternalFontStyle ?? internalFontStyle
    } else {
      internalFontStyle
    }
  }
  
  internal var resolvedBackgroundColor: UInt32 {
    // background-color is NOT inherited in CSS - each element has its own.
    // Only return the color if explicitly set on this element.
    let state = getUInt8(StyleKeys.BACKGROUND_COLOR_STATE)
    let base: UInt32 = if (state == StyleState.SET) {
      getUInt32(StyleKeys.BACKGROUND_COLOR)
    } else {
      0 // transparent - do not inherit from parent
    }
    return resolvePseudoUInt32(StyleKeys.BACKGROUND_COLOR, StyleKeys.BACKGROUND_COLOR_STATE, base, .backgroundColor)
  }
  
  internal var resolvedDecorationLine: DecorationLine {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.decorationLine {
      return value
    }
    let value = resolvedDecorationLineUncached
    resolvedMemo.decorationLine = value
    return value
  }

  private var resolvedDecorationLineUncached: DecorationLine {
    let state = getUInt8(StyleKeys.DECORATION_LINE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationLine ?? DecorationLine(rawValue:
                                                                            getInt8(StyleKeys.DECORATION_LINE)
      ) ?? .None
    } else {
      DecorationLine(rawValue: getInt8(StyleKeys.DECORATION_LINE)) ?? .None
    }
  }
  
  internal var resolvedDecorationColor: UInt32{
    let state = getUInt8(StyleKeys.DECORATION_COLOR_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationColor
      ?? getUInt32(StyleKeys.DECORATION_COLOR)
    } else {
      getUInt32(StyleKeys.DECORATION_COLOR)
    }
  }
  
  internal var resolvedDecorationThickness: Float {
    let state = getUInt8(StyleKeys.DECORATION_THICKNESS_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationThickness
      ?? getFloat(StyleKeys.DECORATION_THICKNESS)
    } else {
      getFloat(StyleKeys.DECORATION_THICKNESS)
    }
  }

  internal var resolvedDecorationStyle: DecorationStyle {
    let state = getUInt8(StyleKeys.DECORATION_STYLE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationStyle ?? DecorationStyle(rawValue:
                                                                              getInt8(StyleKeys.DECORATION_STYLE)
      )!
    } else {
      DecorationStyle(rawValue: getInt8(StyleKeys.DECORATION_STYLE))!
    }
  }
  
  internal var resolvedLetterSpacing: Float {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.letterSpacing {
      return value
    }
    let value = resolvedLetterSpacingUncached
    resolvedMemo.letterSpacing = value
    return value
  }

  private var resolvedLetterSpacingUncached: Float {
    let state = getUInt8(StyleKeys.LETTER_SPACING_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLetterSpacing
      ?? getFloat(StyleKeys.LETTER_SPACING)
    } else {
      getFloat(StyleKeys.LETTER_SPACING)
    }
  }

  internal var resolvedFontVariantNumeric: FontVariantNumeric {
    let state = getUInt8(StyleKeys.FONT_VARIANT_NUMERIC_STATE)
    let base: UInt8 = if state == StyleState.INHERIT {
      parentStyleWithTextValues?.resolvedFontVariantNumeric.rawValue
      ?? getUInt8(StyleKeys.FONT_VARIANT_NUMERIC)
    } else {
      getUInt8(StyleKeys.FONT_VARIANT_NUMERIC)
    }
    let pseudoRaw = resolvePseudoByte(StyleKeys.FONT_VARIANT_NUMERIC, StyleKeys.FONT_VARIANT_NUMERIC_STATE, base, .fontVariantNumeric)
    return FontVariantNumeric(rawValue: pseudoRaw)
  }

  internal var resolvedTextWrap: TextWrap {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textWrap {
      return value
    }
    let value = resolvedTextWrapUncached
    resolvedMemo.textWrap = value
    return value
  }

  private var resolvedTextWrapUncached: TextWrap {
    let state = getUInt8(StyleKeys.TEXT_WRAP_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextWrap ?? TextWrap(
        rawValue: getInt8(
          StyleKeys.TEXT_WRAP
        )
      )!
    } else {
      TextWrap(rawValue: getInt8(StyleKeys.TEXT_WRAP))!
    }
  }
  
  internal var resolvedWhiteSpace: WhiteSpace {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.whiteSpace {
      return value
    }
    let value = resolvedWhiteSpaceUncached
    resolvedMemo.whiteSpace = value
    return value
  }

  private var resolvedWhiteSpaceUncached: WhiteSpace {
    let state = getUInt8(StyleKeys.WHITE_SPACE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedWhiteSpace
      ?? WhiteSpace(rawValue: getInt8(StyleKeys.WHITE_SPACE))!
    } else {
      WhiteSpace(rawValue: getInt8(StyleKeys.WHITE_SPACE))!
    }
  }
  
  internal var resolvedTextTransform: TextTransform {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textTransform {
      return value
    }
    let value = resolvedTextTransformUncached
    resolvedMemo.textTransform = value
    return value
  }

  private var resolvedTextTransformUncached: TextTransform {
    let state = getUInt8(StyleKeys.TEXT_TRANSFORM_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextTransform
      ?? TextTransform(rawValue: getInt8(StyleKeys.TEXT_TRANSFORM))!
    } else {
      TextTransform(rawValue: getInt8(StyleKeys.TEXT_TRANSFORM))!
    }
  }
  
  internal var resolvedTextAlign: TextAlign {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textAlign {
      return value
    }
    let value = resolvedTextAlignUncached
    resolvedMemo.textAlign = value
    return value
  }

  private var resolvedTextAlignUncached: TextAlign {
    let state = getUInt8(StyleKeys.TEXT_ALIGN_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextAlign ?? TextAlign(
        rawValue: getInt8(
          StyleKeys.TEXT_ALIGN
        )
      )!
    } else {
      TextAlign(rawValue: getInt8(StyleKeys.TEXT_ALIGN))!
    }
  }
  
  internal var resolvedTextJustify: TextJustify {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textJustify {
      return value
    }
    let value = resolvedTextJustifyUncached
    resolvedMemo.textJustify = value
    return value
  }

  private var resolvedTextJustifyUncached: TextJustify {
    if getUInt8(StyleKeys.TEXT_JUSTIFY_STATE) == StyleState.INHERIT, let parent = parentStyleWithTextValues {
      return parent.resolvedTextJustify
    }
    // An unset buffer holds no valid value.
    return TextJustify(rawValue: getInt8(StyleKeys.TEXT_JUSTIFY)) ?? .Auto
  }
  
  internal var resolvedLineHeight: Float {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.lineHeight {
      return value
    }
    let value = resolvedLineHeightUncached
    resolvedMemo.lineHeight = value
    return value
  }

  private var resolvedLineHeightUncached: Float {
    let state = getUInt8(StyleKeys.LINE_HEIGHT_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLineHeight
      ?? getFloat(StyleKeys.LINE_HEIGHT)
    } else {
      getFloat(StyleKeys.LINE_HEIGHT)
    }
  }
  
  internal var resolvedLineHeightType: UInt8 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.lineHeightType {
      return value
    }
    let value = resolvedLineHeightTypeUncached
    resolvedMemo.lineHeightType = value
    return value
  }

  private var resolvedLineHeightTypeUncached: UInt8 {
    let state = getUInt8(StyleKeys.LINE_HEIGHT_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLineHeightType
      ?? getUInt8(StyleKeys.LINE_HEIGHT_TYPE)
    } else {
      getUInt8(StyleKeys.LINE_HEIGHT_TYPE)
    }
  }
  
  
  // Reset methods
  func resetFontFamilyToInherit() {
    prepareMut()
    setUInt8(StyleKeys.FONT_FAMILY_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontFamily)
  }
  
  func resetFontWeightToInherit() {
    prepareMut()
    setUInt8(StyleKeys.FONT_WEIGHT_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontWeight)
  }
  
  func resetFontStyleToInherit() {
    prepareMut()
    setUInt8(StyleKeys.FONT_STYLE_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontWeight)
  }

  func resetFontVariantNumericToInherit() {
    prepareMut()
    setUInt8(StyleKeys.FONT_VARIANT_NUMERIC_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontVariantNumeric)
  }

  internal var resolvedBorderImageString: String {
    for state in PSEUDO_CSS_ORDER.reversed() {
      if node.hasPseudo(state) {
        if let s = node.getPseudoString(state.rawValue, "border-image"), !s.isEmpty {
          return s
        }
      }
    }
    return borderImage
  }

  internal var resolvedBackdropFilterString: String {
    for state in PSEUDO_CSS_ORDER.reversed() {
      if node.hasPseudo(state) {
        if let s = node.getPseudoString(state.rawValue, "backdrop-filter"), !s.isEmpty {
          return s
        }
      }
    }
    return backdropFilter
  }


  // caret-color inherits, but `auto` (the initial value) inherits as `auto` and means this element's
  // own currentColor - not the color of whichever ancestor the inheritance chain ends at.
  internal var resolvedCaretColor: UInt32 {
    return explicitCaretColor ?? resolvedColor
  }

  // The nearest explicit caret-color, here or inherited. The JS setter stores `auto` as SET with 0.
  private var explicitCaretColor: UInt32? {
    if getUInt8(StyleKeys.CARET_COLOR_STATE) == StyleState.SET {
      let color = getUInt32(Int(StyleKeys.CARET_COLOR))
      return color != 0 ? color : nil
    }
    return parentStyleWithTextValues?.explicitCaretColor
  }

  /// word-spacing here or inherited: device px, a percentage of the space advance, or none.
  internal var resolvedWordSpacingValue: (value: Float, isPercent: Bool)? {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.wordSpacingValue {
      return value
    }
    let value = resolvedWordSpacingValueUncached
    resolvedMemo.wordSpacingValue = value
    return value
  }

  private var resolvedWordSpacingValueUncached: (value: Float, isPercent: Bool)? {
    let state = getUInt8(StyleKeys.WORD_SPACING_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedWordSpacingValue
    }
    if state != StyleState.SET { return nil }
    switch getUInt8(StyleKeys.WORD_SPACING_TYPE) {
    case 0: return (getFloat(StyleKeys.WORD_SPACING), false)
    case 1: return (getFloat(StyleKeys.WORD_SPACING), true)
    default: return nil
    }
  }

  internal var resolvedWordSpacing: Float {
    let state = getUInt8(StyleKeys.WORD_SPACING_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedWordSpacing ?? getFloat(StyleKeys.WORD_SPACING)
    }
    if state == StyleState.SET {
      return getFloat(StyleKeys.WORD_SPACING)
    }
    return 0
  }

  internal var resolvedWritingMode: UInt8 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.writingMode {
      return value
    }
    let value = resolvedWritingModeUncached
    resolvedMemo.writingMode = value
    return value
  }

  private var resolvedWritingModeUncached: UInt8 {
    let state = getUInt8(StyleKeys.WRITING_MODE_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedWritingMode ?? getUInt8(StyleKeys.WRITING_MODE)
    }
    return getUInt8(StyleKeys.WRITING_MODE)
  }

  /// text-orientation: 0 mixed, 1 upright, 2 sideways.
  /// text-spacing-trim: 0 normal, 1 space-all, 2 space-first, 3 trim-start, 4 trim-both, 5 trim-all, 6 auto.
  internal var resolvedTextSpacingTrim: UInt8 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textSpacingTrim {
      return value
    }
    let value = resolvedTextSpacingTrimUncached
    resolvedMemo.textSpacingTrim = value
    return value
  }

  private var resolvedTextSpacingTrimUncached: UInt8 {
    let state = getUInt8(StyleKeys.TEXT_SPACING_TRIM_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedTextSpacingTrim ?? getUInt8(StyleKeys.TEXT_SPACING_TRIM)
    }
    return getUInt8(StyleKeys.TEXT_SPACING_TRIM)
  }

  /// text-combine-upright: 0 none, 1 all, 2-4 digits (that many).
  internal var resolvedTextCombineUpright: UInt8 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textCombineUpright {
      return value
    }
    let value = resolvedTextCombineUprightUncached
    resolvedMemo.textCombineUpright = value
    return value
  }

  private var resolvedTextCombineUprightUncached: UInt8 {
    let state = getUInt8(StyleKeys.TEXT_COMBINE_UPRIGHT_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedTextCombineUpright ?? getUInt8(StyleKeys.TEXT_COMBINE_UPRIGHT)
    }
    return getUInt8(StyleKeys.TEXT_COMBINE_UPRIGHT)
  }

  internal var resolvedTextOrientation: UInt8 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textOrientation {
      return value
    }
    let value = resolvedTextOrientationUncached
    resolvedMemo.textOrientation = value
    return value
  }

  private var resolvedTextOrientationUncached: UInt8 {
    let state = getUInt8(StyleKeys.TEXT_ORIENTATION_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedTextOrientation ?? getUInt8(StyleKeys.TEXT_ORIENTATION)
    }
    return getUInt8(StyleKeys.TEXT_ORIENTATION)
  }

  internal var resolvedUnicodeBidi: UInt8 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.unicodeBidi {
      return value
    }
    let value = resolvedUnicodeBidiUncached
    resolvedMemo.unicodeBidi = value
    return value
  }

  private var resolvedUnicodeBidiUncached: UInt8 {
    let state = getUInt8(StyleKeys.UNICODE_BIDI_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedUnicodeBidi ?? getUInt8(StyleKeys.UNICODE_BIDI)
    }
    return getUInt8(StyleKeys.UNICODE_BIDI)
  }

  internal var resolvedHyphens: UInt8 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.hyphens {
      return value
    }
    let value = resolvedHyphensUncached
    resolvedMemo.hyphens = value
    return value
  }

  private var resolvedHyphensUncached: UInt8 {
    let state = getUInt8(StyleKeys.HYPHENS_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedHyphens ?? getUInt8(StyleKeys.HYPHENS)
    }
    return getUInt8(StyleKeys.HYPHENS)
  }

  /// text-indent here or inherited: device px, or a percentage when `isPercent`.
  internal var resolvedTextIndent: (value: Float, isPercent: Bool) {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.textIndent {
      return value
    }
    let value = resolvedTextIndentUncached
    resolvedMemo.textIndent = value
    return value
  }

  private var resolvedTextIndentUncached: (value: Float, isPercent: Bool) {
    if getUInt8(StyleKeys.TEXT_INDENT_STATE) == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedTextIndent ?? (0, false)
    }
    return (getFloat(StyleKeys.TEXT_INDENT), getUInt8(StyleKeys.TEXT_INDENT_TYPE) == 1)
  }

  /// line-clamp here or inherited: the most lines shown, 0 for none.
  internal var resolvedLineClamp: Int32 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.lineClamp {
      return value
    }
    let value = resolvedLineClampUncached
    resolvedMemo.lineClamp = value
    return value
  }

  private var resolvedLineClampUncached: Int32 {
    if getUInt8(StyleKeys.LINE_CLAMP_STATE) == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedLineClamp ?? 0
    }
    return max(0, getInt32(StyleKeys.LINE_CLAMP))
  }

  internal var resolvedFontStretch: Int32 {
    if resolvedMemo.epoch != MasonStyle.resolveEpoch {
      resolvedMemo = ResolvedMemo(epoch: MasonStyle.resolveEpoch)
    } else if let value = resolvedMemo.fontStretch {
      return value
    }
    let value = resolvedFontStretchUncached
    resolvedMemo.fontStretch = value
    return value
  }

  private var resolvedFontStretchUncached: Int32 {
    let state = getUInt8(StyleKeys.FONT_STRETCH_STATE)
    if state == StyleState.INHERIT {
      return parentStyleWithTextValues?.resolvedFontStretch ?? getInt32(StyleKeys.FONT_STRETCH)
    }
    return getInt32(StyleKeys.FONT_STRETCH)
  }
}

/// Inherited text values a style resolved during one `MasonStyle.resolveEpoch`.
internal struct ResolvedMemo {
  var epoch: UInt64 = 0
  var fontFace: NSCFontFace?
  var fontSize: Float?
  var fontWeight: NSCFontWeight?
  var internalFontStyle: NSCFontStyle?
  var decorationLine: DecorationLine?
  var letterSpacing: Float?
  var textWrap: TextWrap?
  var whiteSpace: WhiteSpace?
  var textTransform: TextTransform?
  var textAlign: TextAlign?
  var textJustify: TextJustify?
  var lineHeight: Float?
  var lineHeightType: UInt8?
  var wordSpacingValue: (value: Float, isPercent: Bool)??
  var writingMode: UInt8?
  var textSpacingTrim: UInt8?
  var textCombineUpright: UInt8?
  var textOrientation: UInt8?
  var unicodeBidi: UInt8?
  var hyphens: UInt8?
  var textIndent: (value: Float, isPercent: Bool)?
  var lineClamp: Int32?
  var fontStretch: Int32?
}

/// Style slots per arena chunk; matches Rust's `SLOTS_PER_CHUNK`.
internal enum MasonStyleSlots {
  static let perChunk = 64
}

/// A fixed-size NSMutableData over memory Mason owns (a style slot or chunk); it never copies or resizes.
@objc(MasonSlotData)
public final class MasonSlotData: NSMutableData {
  private let ptr: UnsafeMutableRawPointer
  private let size: Int
  /// Keeps the arena that owns the memory alive.
  private let owner: AnyObject?

  internal init(_ ptr: UnsafeMutableRawPointer, _ size: Int, owner: AnyObject?) {
    self.ptr = ptr
    self.size = size
    self.owner = owner
    super.init()
  }

  required init?(coder: NSCoder) {
    fatalError("MasonSlotData can't be decoded")
  }

  public override var length: Int {
    get { size }
    set { precondition(newValue == size, "MasonSlotData is fixed-size") }
  }

  public override var bytes: UnsafeRawPointer { UnsafeRawPointer(ptr) }

  public override var mutableBytes: UnsafeMutableRawPointer { ptr }
}
