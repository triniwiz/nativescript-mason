package org.nativescript.mason.masonkit

import android.os.Build
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign

data class TextDefaultAttributes(
  var color: Int? = null,
  var fontSize: Any? = null,
  var fontWeight: FontFace.NSCFontWeight? = null,
  var fontStyle: FontFace.NSCFontStyle? = null,
  var fontFamily: String? = null,
  var font: FontFace? = null,
  var textWrap: Styles.TextWrap? = null,
  var whiteSpace: Styles.WhiteSpace? = null,
  var textTransform: Styles.TextTransform? = null,
  var backgroundColor: Int? = null,
  var decorationLine: Styles.DecorationLine? = null,
  var decorationColor: Int? = null,
  var decorationStyle: Styles.DecorationStyle? = null,
  var letterSpacing: Float? = null,
  var lineHeight: Float? = null,
  var lineHeightType: Byte? = null,
  var textAlign: android.text.Layout.Alignment? = null,
  var verticalAlign: VerticalAlign? = null,
  var decorationThickness: Float? = null
) {

  fun sync(style: Style) {
    color = style.resolvedColor
    fontSize = style.resolvedFontSize
    fontWeight = style.fontWeight
    fontStyle = style.fontStyle
    val resolvedFont = style.resolvedFontFace
    fontFamily = resolvedFont.fontFamily
    font = resolvedFont
    textWrap = style.resolvedTextWrap
    whiteSpace = style.resolvedWhiteSpace
    textTransform = style.resolvedTextTransform
    backgroundColor = style.resolvedBackgroundColor
    decorationLine = style.resolvedDecorationLine
    decorationColor = style.resolvedDecorationColor
    decorationStyle = style.resolvedDecorationStyle
    letterSpacing = style.resolvedLetterSpacing
    lineHeight = style.resolvedLineHeight
    lineHeightType = style.resolvedLineHeightType
    textAlign = when (style.resolvedTextAlign) {
      TextAlign.Left, TextAlign.Start -> android.text.Layout.Alignment.ALIGN_NORMAL
      TextAlign.Right, TextAlign.End -> android.text.Layout.Alignment.ALIGN_OPPOSITE
      TextAlign.Center -> android.text.Layout.Alignment.ALIGN_CENTER
      TextAlign.Justify -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          android.text.Layout.Alignment.ALIGN_NORMAL // Justify handled by justificationMode
        } else {
          android.text.Layout.Alignment.ALIGN_NORMAL
        }
      }

      else -> android.text.Layout.Alignment.ALIGN_NORMAL
    }
    verticalAlign = if (!style.isValueInitialized) {
      VerticalAlign.Baseline
    } else {
      style.verticalAlign
    }
  }

  fun copy(attributes: TextDefaultAttributes) {
    color = attributes.color
    fontSize = attributes.fontSize
    fontWeight = attributes.fontWeight
    fontStyle = attributes.fontStyle
    fontFamily = attributes.fontFamily
    font = attributes.font
    textWrap = attributes.textWrap
    whiteSpace = attributes.whiteSpace
    textTransform = attributes.textTransform
    backgroundColor = attributes.backgroundColor
    decorationLine = attributes.decorationLine
    decorationColor = attributes.decorationColor
    decorationStyle = attributes.decorationStyle
    letterSpacing = attributes.letterSpacing
    lineHeight = attributes.lineHeight
    lineHeightType = attributes.lineHeightType
    textAlign = attributes.textAlign
    verticalAlign = attributes.verticalAlign
  }

  companion object {
    fun empty(): TextDefaultAttributes {
      return TextDefaultAttributes()
    }

    fun from(style: Style): TextDefaultAttributes {
      val resolvedFont = style.resolvedFontFace
      return TextDefaultAttributes(
        style.resolvedColor,
        style.resolvedFontSize,
        style.fontWeight,
        style.fontStyle,
        resolvedFont.fontFamily,
        resolvedFont,
        style.resolvedTextWrap,
        style.resolvedWhiteSpace,
        style.resolvedTextTransform,
        style.resolvedBackgroundColor,
        style.resolvedDecorationLine,
        style.resolvedDecorationColor,
        style.resolvedDecorationStyle,
        style.resolvedLetterSpacing,
        style.resolvedLineHeight,
        style.resolvedLineHeightType,
        when (style.resolvedTextAlign) {
          TextAlign.Left, TextAlign.Start -> android.text.Layout.Alignment.ALIGN_NORMAL
          TextAlign.Right, TextAlign.End -> android.text.Layout.Alignment.ALIGN_OPPOSITE
          TextAlign.Center -> android.text.Layout.Alignment.ALIGN_CENTER
          TextAlign.Justify -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              android.text.Layout.Alignment.ALIGN_NORMAL // Justify handled by justificationMode
            } else {
              android.text.Layout.Alignment.ALIGN_NORMAL
            }
          }

          else -> android.text.Layout.Alignment.ALIGN_NORMAL
        },
        style.verticalAlign
      )
    }
  }
}
