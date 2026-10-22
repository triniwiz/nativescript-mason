// Generated from tools/scripts/style-keys/style-keys.schema by tools/scripts/style-keys/generate.mjs. Do not edit.
#pragma once
#include <cstdint>

// Byte offsets into the shared style buffer.
namespace mason_style_keys
{
    inline constexpr uint32_t kStyleBufferSize = 612;

    inline constexpr uint32_t kDisplay = 0;
    inline constexpr uint32_t kPosition = 1;
    inline constexpr uint32_t kDirection = 2;
    inline constexpr uint32_t kFlexDirection = 3;
    inline constexpr uint32_t kFlexWrap = 4;
    inline constexpr uint32_t kOverflowX = 5;
    inline constexpr uint32_t kOverflowY = 6;

    inline constexpr uint32_t kAlignItems = 7;
    inline constexpr uint32_t kAlignSelf = 8;
    inline constexpr uint32_t kAlignContent = 9;

    inline constexpr uint32_t kJustifyItems = 10;
    inline constexpr uint32_t kJustifySelf = 11;
    inline constexpr uint32_t kJustifyContent = 12;

    // Each box side group: four types, then four values.
    inline constexpr uint32_t kInsetLeftType = 13;
    inline constexpr uint32_t kInsetRightType = 14;
    inline constexpr uint32_t kInsetTopType = 15;
    inline constexpr uint32_t kInsetBottomType = 16;
    inline constexpr uint32_t kInsetLeftValue = 17; // f32 (17-20)
    inline constexpr uint32_t kInsetRightValue = 21; // f32 (21-24)
    inline constexpr uint32_t kInsetTopValue = 25; // f32 (25-28)
    inline constexpr uint32_t kInsetBottomValue = 29; // f32 (29-32)

    inline constexpr uint32_t kMarginLeftType = 33;
    inline constexpr uint32_t kMarginRightType = 34;
    inline constexpr uint32_t kMarginTopType = 35;
    inline constexpr uint32_t kMarginBottomType = 36;
    inline constexpr uint32_t kMarginLeftValue = 37; // f32 (37-40)
    inline constexpr uint32_t kMarginRightValue = 41; // f32 (41-44)
    inline constexpr uint32_t kMarginTopValue = 45; // f32 (45-48)
    inline constexpr uint32_t kMarginBottomValue = 49; // f32 (49-52)

    inline constexpr uint32_t kPaddingLeftType = 53;
    inline constexpr uint32_t kPaddingRightType = 54;
    inline constexpr uint32_t kPaddingTopType = 55;
    inline constexpr uint32_t kPaddingBottomType = 56;
    inline constexpr uint32_t kPaddingLeftValue = 57; // f32 (57-60)
    inline constexpr uint32_t kPaddingRightValue = 61; // f32 (61-64)
    inline constexpr uint32_t kPaddingTopValue = 65; // f32 (65-68)
    inline constexpr uint32_t kPaddingBottomValue = 69; // f32 (69-72)

    inline constexpr uint32_t kBorderLeftType = 73;
    inline constexpr uint32_t kBorderRightType = 74;
    inline constexpr uint32_t kBorderTopType = 75;
    inline constexpr uint32_t kBorderBottomType = 76;
    inline constexpr uint32_t kBorderLeftValue = 77; // f32 (77-80)
    inline constexpr uint32_t kBorderRightValue = 81; // f32 (81-84)
    inline constexpr uint32_t kBorderTopValue = 85; // f32 (85-88)
    inline constexpr uint32_t kBorderBottomValue = 89; // f32 (89-92)

    inline constexpr uint32_t kFlexGrow = 93; // f32 (93-96)
    inline constexpr uint32_t kFlexShrink = 97; // f32 (97-100)

    inline constexpr uint32_t kFlexBasisType = 101;
    inline constexpr uint32_t kFlexBasisValue = 102; // f32 (102-105)

    inline constexpr uint32_t kWidthType = 106;
    inline constexpr uint32_t kHeightType = 107;
    inline constexpr uint32_t kWidthValue = 108; // f32 (108-111)
    inline constexpr uint32_t kHeightValue = 112; // f32 (112-115)

    inline constexpr uint32_t kMinWidthType = 116;
    inline constexpr uint32_t kMinHeightType = 117;
    inline constexpr uint32_t kMinWidthValue = 118; // f32 (118-121)
    inline constexpr uint32_t kMinHeightValue = 122; // f32 (122-125)

    inline constexpr uint32_t kMaxWidthType = 126;
    inline constexpr uint32_t kMaxHeightType = 127;
    inline constexpr uint32_t kMaxWidthValue = 128; // f32 (128-131)
    inline constexpr uint32_t kMaxHeightValue = 132; // f32 (132-135)

    inline constexpr uint32_t kGapRowType = 136;
    inline constexpr uint32_t kGapColumnType = 137;
    inline constexpr uint32_t kGapRowValue = 138; // f32 (138-141)
    inline constexpr uint32_t kGapColumnValue = 142; // f32 (142-145)

    inline constexpr uint32_t kAspectRatio = 146; // f32 (146-149)
    inline constexpr uint32_t kGridAutoFlow = 150;
    inline constexpr uint32_t kGridColumnStartType = 151;
    inline constexpr uint32_t kGridColumnEndType = 152;
    inline constexpr uint32_t kGridRowStartType = 153;
    inline constexpr uint32_t kGridRowEndType = 154;
    inline constexpr uint32_t kGridColumnStartValue = 155; // f32 (155-158)
    inline constexpr uint32_t kGridColumnEndValue = 159; // f32 (159-162)
    inline constexpr uint32_t kGridRowStartValue = 163; // f32 (163-166)
    inline constexpr uint32_t kGridRowEndValue = 167; // f32 (167-170)
    inline constexpr uint32_t kScrollbarWidth = 171; // f32 (171-174)
    inline constexpr uint32_t kAlign = 175;
    inline constexpr uint32_t kBoxSizing = 176;
    inline constexpr uint32_t kOverflow = 177;
    inline constexpr uint32_t kItemIsTable = 178;
    inline constexpr uint32_t kItemIsReplaced = 179;
    inline constexpr uint32_t kDisplayMode = 180;
    inline constexpr uint32_t kForceInline = 181;
    inline constexpr uint32_t kMinContentWidth = 182; // f32 (182-185)
    inline constexpr uint32_t kMinContentHeight = 186; // f32 (186-189)
    inline constexpr uint32_t kMaxContentWidth = 190; // f32 (190-193)
    inline constexpr uint32_t kMaxContentHeight = 194; // f32 (194-197)

    inline constexpr uint32_t kBorderLeftStyle = 198;
    inline constexpr uint32_t kBorderRightStyle = 199;
    inline constexpr uint32_t kBorderTopStyle = 200;
    inline constexpr uint32_t kBorderBottomStyle = 201;

    inline constexpr uint32_t kBorderLeftColor = 202; // u32 (202-205)
    inline constexpr uint32_t kBorderRightColor = 206; // u32 (206-209)
    inline constexpr uint32_t kBorderTopColor = 210; // u32 (210-213)
    inline constexpr uint32_t kBorderBottomColor = 214; // u32 (214-217)

    // Elliptical radii: eight types, eight values, then four squircle exponents.
    inline constexpr uint32_t kBorderRadiusTopLeftXType = 218;
    inline constexpr uint32_t kBorderRadiusTopLeftYType = 219;
    inline constexpr uint32_t kBorderRadiusTopRightXType = 220;
    inline constexpr uint32_t kBorderRadiusTopRightYType = 221;
    inline constexpr uint32_t kBorderRadiusBottomRightXType = 222;
    inline constexpr uint32_t kBorderRadiusBottomRightYType = 223;
    inline constexpr uint32_t kBorderRadiusBottomLeftXType = 224;
    inline constexpr uint32_t kBorderRadiusBottomLeftYType = 225;
    inline constexpr uint32_t kBorderRadiusTopLeftXValue = 226; // f32 (226-229)
    inline constexpr uint32_t kBorderRadiusTopLeftYValue = 230; // f32 (230-233)
    inline constexpr uint32_t kBorderRadiusTopRightXValue = 234; // f32 (234-237)
    inline constexpr uint32_t kBorderRadiusTopRightYValue = 238; // f32 (238-241)
    inline constexpr uint32_t kBorderRadiusBottomRightXValue = 242; // f32 (242-245)
    inline constexpr uint32_t kBorderRadiusBottomRightYValue = 246; // f32 (246-249)
    inline constexpr uint32_t kBorderRadiusBottomLeftXValue = 250; // f32 (250-253)
    inline constexpr uint32_t kBorderRadiusBottomLeftYValue = 254; // f32 (254-257)
    inline constexpr uint32_t kBorderRadiusTopLeftExponent = 258; // f32 (258-261)
    inline constexpr uint32_t kBorderRadiusTopRightExponent = 262; // f32 (262-265)
    inline constexpr uint32_t kBorderRadiusBottomRightExponent = 266; // f32 (266-269)
    inline constexpr uint32_t kBorderRadiusBottomLeftExponent = 270; // f32 (270-273)

    inline constexpr uint32_t kFloat = 274;
    inline constexpr uint32_t kClear = 275;
    inline constexpr uint32_t kObjectFit = 276;

    inline constexpr uint32_t kFontMetricsAscentOffset = 277; // f32 (277-280)
    inline constexpr uint32_t kFontMetricsDescentOffset = 281; // f32 (281-284)
    inline constexpr uint32_t kFontMetricsXHeightOffset = 285; // f32 (285-288)
    inline constexpr uint32_t kFontMetricsLeadingOffset = 289; // f32 (289-292)
    inline constexpr uint32_t kFontMetricsCapHeightOffset = 293; // f32 (293-296)
    inline constexpr uint32_t kVerticalAlignOffsetOffset = 297; // f32 (297-300)
    inline constexpr uint32_t kVerticalAlignIsPercentOffset = 301;
    inline constexpr uint32_t kVerticalAlignEnumOffset = 302; // f32 (302-305)
    inline constexpr uint32_t kFirstBaselineOffset = 306; // f32 (306-309)
    inline constexpr uint32_t kZIndex = 310; // i32 (310-313)
    inline constexpr uint32_t kItemIsList = 314;
    inline constexpr uint32_t kItemIsListItem = 315;
    inline constexpr uint32_t kListStylePosition = 316;
    inline constexpr uint32_t kListStyleType = 317;
    inline constexpr uint32_t kListStylePositionState = 318;
    inline constexpr uint32_t kListStyleTypeState = 319;
    inline constexpr uint32_t kRefCount = 320; // u32 (320-323), copy-on-write share count

    // Inherited text fields. A *_STATE byte is nonzero once the node sets the field.
    inline constexpr uint32_t kFontColor = 324; // u32 (324-327)
    inline constexpr uint32_t kFontColorState = 328;
    inline constexpr uint32_t kFontSize = 329; // f32 (329-332)
    inline constexpr uint32_t kFontSizeType = 333;
    inline constexpr uint32_t kFontSizeState = 334;
    inline constexpr uint32_t kFontWeight = 335; // i32 (335-338)
    inline constexpr uint32_t kFontWeightState = 339;
    inline constexpr uint32_t kFontStyleSlant = 340; // i32 (340-343)
    inline constexpr uint32_t kFontStyleType = 344;
    inline constexpr uint32_t kFontStyleState = 345;
    inline constexpr uint32_t kFontFamilyState = 346;
    inline constexpr uint32_t kFontResolvedDirty = 347;
    inline constexpr uint32_t kBackgroundColor = 348; // u32 (348-351)
    inline constexpr uint32_t kBackgroundColorState = 352;
    inline constexpr uint32_t kBackgroundColorType = 353;
    inline constexpr uint32_t kDecorationLine = 354;
    inline constexpr uint32_t kDecorationLineState = 355;
    inline constexpr uint32_t kDecorationColor = 356; // u32 (356-359)
    inline constexpr uint32_t kDecorationColorState = 360;
    inline constexpr uint32_t kDecorationStyle = 361;
    inline constexpr uint32_t kDecorationStyleState = 362;
    inline constexpr uint32_t kLetterSpacing = 363; // f32 (363-366)
    inline constexpr uint32_t kLetterSpacingState = 367;
    inline constexpr uint32_t kTextWrap = 368;
    inline constexpr uint32_t kTextWrapState = 369;
    inline constexpr uint32_t kWhiteSpace = 370;
    inline constexpr uint32_t kWhiteSpaceState = 371;
    inline constexpr uint32_t kTextTransform = 372;
    inline constexpr uint32_t kTextTransformState = 373;
    inline constexpr uint32_t kTextAlign = 374;
    inline constexpr uint32_t kTextAlignState = 375;
    inline constexpr uint32_t kTextJustify = 376;
    inline constexpr uint32_t kTextJustifyState = 377;
    inline constexpr uint32_t kTextIndent = 378; // f32 (378-381)
    inline constexpr uint32_t kTextIndentType = 382; // 0 px, 1 %
    inline constexpr uint32_t kTextIndentState = 383;
    inline constexpr uint32_t kLineHeight = 384; // f32 (384-387)
    inline constexpr uint32_t kLineHeightState = 388;
    inline constexpr uint32_t kLineHeightType = 389;
    inline constexpr uint32_t kDecorationThickness = 390; // f32 (390-393)
    inline constexpr uint32_t kDecorationThicknessState = 394;
    inline constexpr uint32_t kTextShadowState = 395;
    inline constexpr uint32_t kTextOverflow = 396;
    inline constexpr uint32_t kTextOverflowState = 397;

    // Which StateKeys a pseudo-class buffer sets explicitly (same bit layout).
    inline constexpr uint32_t kPseudoSetMaskLow = 398; // i64 (398-405)
    inline constexpr uint32_t kPseudoSetMaskHigh = 406; // i64 (406-413)

    // 414-418 free.
    inline constexpr uint32_t kFontVariantNumeric = 419; // bitmask
    inline constexpr uint32_t kFontVariantNumericState = 420;

    // Up to six inline transform ops, or a full matrix.
    inline constexpr uint32_t kTransformCount = 422; // number of inline ops (0-6)
    inline constexpr uint32_t kTransformFlags = 423; // bit 0 HAS_MATRIX, bit 1 IS_3D
    inline constexpr uint32_t kTransformOp0 = 424; // bytes(12) (424-435), type(u8) + pad(3) + a(f32) + b(f32)
    inline constexpr uint32_t kTransformOp1 = 436; // bytes(12) (436-447)
    inline constexpr uint32_t kTransformOp2 = 448; // bytes(12) (448-459)
    inline constexpr uint32_t kTransformOp3 = 460; // bytes(12) (460-471)
    inline constexpr uint32_t kTransformOp4 = 472; // bytes(12) (472-483)
    inline constexpr uint32_t kTransformOp5 = 484; // bytes(12) (484-495)
    inline constexpr uint32_t kTransformMatrix = 496; // bytes(64) (496-559), 16 x f32, 4x4 column-major

    inline constexpr uint32_t kObjectPositionXType = 560; // 0 px, 1 %, 2 keyword
    inline constexpr uint32_t kObjectPositionYType = 561;
    inline constexpr uint32_t kObjectPositionXValue = 562; // f32 (562-565)
    inline constexpr uint32_t kObjectPositionYValue = 566; // f32 (566-569)
    inline constexpr uint32_t kObjectPositionState = 570;
    inline constexpr uint32_t kWritingMode = 571;
    inline constexpr uint32_t kWritingModeState = 572;
    inline constexpr uint32_t kUnicodeBidi = 573;
    inline constexpr uint32_t kUnicodeBidiState = 574;
    inline constexpr uint32_t kHyphens = 575;
    inline constexpr uint32_t kHyphensState = 576;
    inline constexpr uint32_t kCaretColor = 577; // u32 (577-580)
    inline constexpr uint32_t kCaretColorState = 581;
    inline constexpr uint32_t kWordSpacing = 582; // f32 (582-585)
    inline constexpr uint32_t kWordSpacingType = 586; // 0 px, 1 %, 2 normal
    inline constexpr uint32_t kWordSpacingState = 587;
    inline constexpr uint32_t kFontStretch = 588; // i32 (588-591), percentage x 100
    inline constexpr uint32_t kFontStretchState = 592;
    inline constexpr uint32_t kLineClamp = 593; // i32 (593-596), max lines, 0 none
    inline constexpr uint32_t kLineClampState = 597;
    inline constexpr uint32_t kTransformOriginXType = 598; // 0 px, 1 %
    inline constexpr uint32_t kTransformOriginYType = 599;
    inline constexpr uint32_t kTransformOriginXValue = 600; // f32 (600-603)
    inline constexpr uint32_t kTransformOriginYValue = 604; // f32 (604-607)
    inline constexpr uint32_t kTransformOriginState = 608;
    inline constexpr uint32_t kTextOrientation = 609; // 0 mixed, 1 upright, 2 sideways
    inline constexpr uint32_t kTextOrientationState = 610;
}

// Bit numbers of the 128-bit style dirty mask.
namespace mason_state_keys
{
    inline constexpr uint32_t kDisplay = 0;
    inline constexpr uint32_t kPosition = 1;
    inline constexpr uint32_t kDirection = 2;
    inline constexpr uint32_t kFlexDirection = 3;
    inline constexpr uint32_t kFlexWrap = 4;
    inline constexpr uint32_t kOverflowX = 5;
    inline constexpr uint32_t kOverflowY = 6;
    inline constexpr uint32_t kAlignItems = 7;
    inline constexpr uint32_t kAlignSelf = 8;
    inline constexpr uint32_t kAlignContent = 9;
    inline constexpr uint32_t kJustifyItems = 10;
    inline constexpr uint32_t kJustifySelf = 11;
    inline constexpr uint32_t kJustifyContent = 12;
    inline constexpr uint32_t kInset = 13;
    inline constexpr uint32_t kMargin = 14;
    inline constexpr uint32_t kPadding = 15;
    inline constexpr uint32_t kBorder = 16;
    inline constexpr uint32_t kFlexGrow = 17;
    inline constexpr uint32_t kFlexShrink = 18;
    inline constexpr uint32_t kFlexBasis = 19;
    inline constexpr uint32_t kSize = 20;
    inline constexpr uint32_t kMinSize = 21;
    inline constexpr uint32_t kMaxSize = 22;
    inline constexpr uint32_t kGap = 23;
    inline constexpr uint32_t kAspectRatio = 24;
    inline constexpr uint32_t kGridAutoFlow = 25;
    inline constexpr uint32_t kGridColumn = 26;
    inline constexpr uint32_t kGridRow = 27;
    inline constexpr uint32_t kScrollbarWidth = 28;
    inline constexpr uint32_t kAlign = 29;
    inline constexpr uint32_t kBoxSizing = 30;
    inline constexpr uint32_t kOverflow = 31;
    inline constexpr uint32_t kItemIsTable = 32;
    inline constexpr uint32_t kItemIsReplaced = 33;
    inline constexpr uint32_t kDisplayMode = 34;
    inline constexpr uint32_t kForceInline = 35;
    inline constexpr uint32_t kMinContentWidth = 36;
    inline constexpr uint32_t kMinContentHeight = 37;
    inline constexpr uint32_t kMaxContentWidth = 38;
    inline constexpr uint32_t kMaxContentHeight = 39;
    inline constexpr uint32_t kBorderStyle = 40;
    inline constexpr uint32_t kBorderRadius = 41;
    inline constexpr uint32_t kBorderColor = 42;
    inline constexpr uint32_t kFloat = 43;
    inline constexpr uint32_t kClear = 44;
    inline constexpr uint32_t kObjectFit = 45;
    inline constexpr uint32_t kZIndex = 46;
    inline constexpr uint32_t kListStylePosition = 47;
    inline constexpr uint32_t kListStyleType = 48;
    inline constexpr uint32_t kInvalidateText = 49; // Kotlin's INVALIDATE_TEXT is every bit
    inline constexpr uint32_t kFontColor = 50;
    inline constexpr uint32_t kDecorationLine = 51;
    inline constexpr uint32_t kDecorationColor = 52;
    inline constexpr uint32_t kTextAlign = 53;
    inline constexpr uint32_t kTextJustify = 54;
    inline constexpr uint32_t kBackgroundColor = 55;
    inline constexpr uint32_t kFontSize = 56;
    inline constexpr uint32_t kTextTransform = 57;
    inline constexpr uint32_t kFontStyle = 58;
    inline constexpr uint32_t kFontStyleSlant = 59;
    inline constexpr uint32_t kTextWrap = 60;
    inline constexpr uint32_t kTextOverflow = 61;
    inline constexpr uint32_t kDecorationStyle = 62;
    inline constexpr uint32_t kWhiteSpace = 63;
    inline constexpr uint32_t kFontWeight = 64;
    inline constexpr uint32_t kLineHeight = 65;
    inline constexpr uint32_t kVerticalAlign = 66;
    inline constexpr uint32_t kDecorationThickness = 67;
    inline constexpr uint32_t kTextShadows = 68;
    inline constexpr uint32_t kFontFamily = 69;
    inline constexpr uint32_t kLetterSpacing = 70;
    inline constexpr uint32_t kFontVariantNumeric = 71;
    inline constexpr uint32_t kObjectPosition = 72;
    inline constexpr uint32_t kWritingMode = 73;
    inline constexpr uint32_t kUnicodeBidi = 74;
    inline constexpr uint32_t kHyphens = 75;
    inline constexpr uint32_t kCaretColor = 76;
    inline constexpr uint32_t kWordSpacing = 77;
    inline constexpr uint32_t kFontStretch = 78;
    inline constexpr uint32_t kTextIndent = 79;
    inline constexpr uint32_t kLineClamp = 80;
    inline constexpr uint32_t kTransformOrigin = 81;
    inline constexpr uint32_t kTextOrientation = 82;
}
