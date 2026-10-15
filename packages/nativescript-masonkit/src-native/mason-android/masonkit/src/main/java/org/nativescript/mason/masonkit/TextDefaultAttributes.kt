package org.nativescript.mason.masonkit

import org.nativescript.fontmanager.FontFace
import org.nativescript.fontmanager.FontStyle
import org.nativescript.fontmanager.FontWeight
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign

class TextDefaultAttributes {
  // A sync only records its source; values resolve on first access, so repeated syncs of one
  // text cost a single resolve.
  private var pendingStyle: Style? = null
  private var pendingFrom: TextDefaultAttributes? = null

  var color: Int? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var fontSize: Int? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var fontWeight: FontWeight? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var fontStyle: FontStyle? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var fontFamily: String? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var font: FontFace? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var textWrap: Styles.TextWrap? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var whiteSpace: Styles.WhiteSpace? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var textTransform: Styles.TextTransform? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var backgroundColor: Int? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var decorationLine: Styles.DecorationLine? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var decorationColor: Int? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var decorationStyle: Styles.DecorationStyle? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var letterSpacing: Float? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var lineHeight: Float? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var lineHeightType: Byte? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var textAlign: android.text.Layout.Alignment? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var verticalAlign: VerticalAlign? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var decorationThickness: Float? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }
  var textShadow: List<Shadow.TextShadow>? = null
    get() {
      resolvePending()
      return field
    }
    set(value) {
      resolvePending()
      field = value
    }

  private fun resolvePending() {
    val style = pendingStyle
    val from = pendingFrom
    if (style == null && from == null) return
    pendingStyle = null
    pendingFrom = null
    if (style != null) resolveFrom(style) else copyFrom(from!!)
  }

  fun sync(style: Style) {
    pendingFrom = null
    pendingStyle = style
  }

  fun sync(attributes: TextDefaultAttributes) {
    if (attributes === this) return
    pendingStyle = null
    pendingFrom = attributes
  }

  private fun resolveFrom(style: Style) {
    // In a batch an inherited value is the parent's resolved one, so read it from the
    // parent's cached attributes instead of walking every ancestor again.
    val parent = if (batchDepth > 0 && style.node.pseudoMask == 0) style.node.parent?.style?.let { cachedFor(it) } else null
    val v = style.values
    fun inherits(stateKey: Int) = parent != null && v.get(stateKey) == StyleState.INHERIT

    color = (if (inherits(StyleKeys.FONT_COLOR_STATE)) parent?.color else null) ?: style.resolvedColor
    fontSize = (if (inherits(StyleKeys.FONT_SIZE_STATE) && v.get(StyleKeys.FONT_SIZE_TYPE) != StyleState.SET) parent?.fontSize else null)
      ?: style.resolvedFontSize
    fontWeight = (if (inherits(StyleKeys.FONT_WEIGHT_STATE)) parent?.fontWeight else null) ?: style.resolvedFontWeight
    fontStyle = (if (inherits(StyleKeys.FONT_STYLE_STATE)) parent?.fontStyle else null) ?: style.resolvedFontStyle
    val resolvedFont = style.resolvedFontFace
    fontFamily = resolvedFont.fontFamily
    font = resolvedFont
    textWrap = (if (inherits(StyleKeys.TEXT_WRAP_STATE)) parent?.textWrap else null) ?: style.resolvedTextWrap
    whiteSpace = (if (inherits(StyleKeys.WHITE_SPACE_STATE)) parent?.whiteSpace else null) ?: style.resolvedWhiteSpace
    textTransform = (if (inherits(StyleKeys.TEXT_TRANSFORM_STATE)) parent?.textTransform else null) ?: style.resolvedTextTransform
    backgroundColor = style.resolvedBackgroundColor
    decorationLine = (if (inherits(StyleKeys.DECORATION_LINE_STATE)) parent?.decorationLine else null) ?: style.resolvedDecorationLine
    decorationColor = (if (inherits(StyleKeys.DECORATION_COLOR_STATE)) parent?.decorationColor else null) ?: style.resolvedDecorationColor
    decorationStyle = (if (inherits(StyleKeys.DECORATION_STYLE_STATE)) parent?.decorationStyle else null) ?: style.resolvedDecorationStyle
    decorationThickness = (if (inherits(StyleKeys.DECORATION_THICKNESS_STATE)) parent?.decorationThickness else null)
      ?: style.resolvedDecorationThickness
    letterSpacing = (if (inherits(StyleKeys.LETTER_SPACING_STATE)) parent?.letterSpacing else null) ?: style.resolvedLetterSpacing
    if (inherits(StyleKeys.LINE_HEIGHT_STATE) && parent?.lineHeight != null && parent.lineHeightType != null) {
      lineHeight = parent.lineHeight
      lineHeightType = parent.lineHeightType
    } else {
      lineHeight = style.resolvedLineHeight
      lineHeightType = style.resolvedLineHeightType
    }
    textAlign = (if (inherits(StyleKeys.TEXT_ALIGN_STATE)) parent?.textAlign else null) ?: when (style.resolvedTextAlign) {
      TextAlign.Left, TextAlign.Start -> android.text.Layout.Alignment.ALIGN_NORMAL
      TextAlign.Right, TextAlign.End -> android.text.Layout.Alignment.ALIGN_OPPOSITE
      TextAlign.Center -> android.text.Layout.Alignment.ALIGN_CENTER
      // Justify is handled by justificationMode.
      else -> android.text.Layout.Alignment.ALIGN_NORMAL
    }
    verticalAlign = if (!style.isValueInitialized) {
      VerticalAlign.Baseline
    } else {
      style.verticalAlign
    }
    textShadow = (if (inherits(StyleKeys.TEXT_SHADOW_STATE)) parent?.textShadow else null) ?: style.resolvedTextShadow
  }

  private fun copyFrom(attributes: TextDefaultAttributes) {
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
    decorationThickness = attributes.decorationThickness
    letterSpacing = attributes.letterSpacing
    lineHeight = attributes.lineHeight
    lineHeightType = attributes.lineHeightType
    textAlign = attributes.textAlign
    verticalAlign = attributes.verticalAlign
    textShadow = attributes.textShadow
  }

  companion object {
    private var batchDepth = 0
    private var batchStamp = 0

    /** The current batch's stamp, or 0 outside a batch. */
    internal val activeBatchStamp: Int
      get() = if (batchDepth > 0) batchStamp else 0

    /** Runs [block] with each style's resolved text attributes computed at most once. No style may change inside. */
    internal fun <T> batch(block: () -> T): T {
      if (batchDepth++ == 0) batchStamp++
      try {
        return block()
      } finally {
        batchDepth--
      }
    }

    private fun cachedFor(style: Style): TextDefaultAttributes {
      style.batchAttrs?.let { if (style.batchAttrsStamp == batchStamp) return it }
      val attrs = TextDefaultAttributes().also { it.resolveFrom(style) }
      style.batchAttrs = attrs
      style.batchAttrsStamp = batchStamp
      return attrs
    }

    fun empty(): TextDefaultAttributes {
      return TextDefaultAttributes()
    }
  }
}
