package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.LineBackgroundSpan
import android.text.style.ReplacementSpan
import android.text.style.UpdateAppearance
import android.view.View
import android.view.ViewGroup
import androidx.core.graphics.withSave
import kotlin.math.roundToInt


class Spans {
  enum class Type {
    View,
    BackgroundColor,
    ForegroundColor,
    DecorationLine,
    Justify,
    Tracking,
    LetterSpacing,
    Size,
    Typeface,
    Upright
  }

  interface NSCSpan {
    val type: Type
  }

  class TypefaceSpan(
    private val typeface: Typeface,
    private val isBold: Boolean = false,
    private val isItalic: Boolean = false
  ) :
    android.text.style.MetricAffectingSpan(),
    NSCSpan {
    override val type: Type
      get() = Type.Typeface

    override fun updateDrawState(tp: TextPaint?) {
      if (isBold && !typeface.isBold) {
        tp?.isFakeBoldText = true
      }
      if (isItalic && !typeface.isItalic) {
        tp?.textSkewX = -0.25f
      }
      tp?.typeface = typeface
    }

    override fun updateMeasureState(textPaint: TextPaint) {
      if (isBold && !typeface.isBold) {
        textPaint.isFakeBoldText = true
      }
      if (isItalic && !typeface.isItalic) {
        textPaint.textSkewX = -0.25f
      }

      textPaint.typeface = typeface
    }
  }

  class RunStyleSpan(
    private val attributes: TextDefaultAttributes,
    private val setColor: Boolean,
    private val measureSize: Float?,
    private val letterSpacingPx: Float?,
    private val typeface: Typeface?,
    private val isBold: Boolean,
    private val isItalic: Boolean
  ) : android.text.style.MetricAffectingSpan(), NSCSpan {
    override val type: Type
      get() = Type.Typeface

    override fun updateDrawState(tp: TextPaint) {
      if (setColor) tp.color = attributes.color ?: Color.BLACK
      if (measureSize != null) {
        tp.textSize = (attributes.fontSize ?: Constants.DEFAULT_FONT_SIZE) * tp.density
      }
      applyMetrics(tp)
    }

    override fun updateMeasureState(tp: TextPaint) {
      if (measureSize != null) tp.textSize = measureSize * tp.density
      applyMetrics(tp)
    }

    private fun applyMetrics(tp: TextPaint) {
      if (letterSpacingPx != null) {
        val textSize = tp.textSize
        if (textSize > 0f) tp.letterSpacing = letterSpacingPx / textSize
      }
      val face = typeface ?: return
      if (isBold && !face.isBold) tp.isFakeBoldText = true
      if (isItalic && !face.isItalic) tp.textSkewX = -0.25f
      tp.typeface = face
    }
  }

  class TypefaceSpan2(family: String) : android.text.style.TypefaceSpan(family), NSCSpan {
    override val type: Type
      get() = Type.Typeface
  }

  /** A text size in device px. AbsoluteSizeSpan takes whole px, which drifts at fractional densities. */
  class PxSizeSpan(val px: Float) : android.text.style.MetricAffectingSpan() {
    override fun updateDrawState(tp: TextPaint) {
      tp.textSize = px
    }

    override fun updateMeasureState(tp: TextPaint) {
      tp.textSize = px
    }
  }

  class SizeSpan(val attributes: TextDefaultAttributes, val scale: Boolean = false) :
    android.text.style.AbsoluteSizeSpan((attributes.fontSize ?: Constants.DEFAULT_FONT_SIZE).roundToInt(), scale),
    NSCSpan {
    override val type: Type
      get() = Type.Size

    override fun getSize(): Int {
      return (attributes.fontSize ?: Constants.DEFAULT_FONT_SIZE).roundToInt()
    }

    override fun updateDrawState(ds: TextPaint) {
      val size = attributes.fontSize ?: Constants.DEFAULT_FONT_SIZE
      if (scale) {
        ds.textSize = size * ds.density
      } else {
        ds.textSize = size
      }
    }
  }

  class ScaleXSpan(scale: Float) : android.text.style.ScaleXSpan(scale), NSCSpan {
    override val type: Type
      get() = Type.Justify
  }

  /**
   * CSS `letter-spacing` tracking via [TextPaint.setLetterSpacing] (EM units) — not
   * ScaleXSpan, which distorts glyph widths. [letterSpacingPx] is physical px;
   * divide by textSize for EMs. Matches iOS `.kern`.
   */
  class LetterSpacingSpan(private val letterSpacingPx: Float) :
    android.text.style.MetricAffectingSpan(), NSCSpan {
    override val type: Type
      get() = Type.LetterSpacing

    override fun updateDrawState(tp: TextPaint?) {
      tp?.let { apply(it) }
    }

    override fun updateMeasureState(textPaint: TextPaint) {
      apply(textPaint)
    }

    private fun apply(tp: TextPaint) {
      val textSize = tp.textSize
      if (textSize > 0f) {
        tp.letterSpacing = letterSpacingPx / textSize
      }
    }
  }

  /**
   * A grapheme kept upright in vertical text (see VerticalText.kt). Its advance along the
   * sideways line is scaled to its upright cell (see [uprightCell]), and it paints clear:
   * TextView draws it upright in that cell. Scaled, not letter-spaced: Minikin drops letter
   * spacing at a line's start. With [combined] it's a text-combine-upright run: its text set
   * horizontally in one 1em cell, squeezed to fit.
   */
  class UprightGlyphSpan(
    internal val glyph: String,
    internal val wide: Boolean,
    internal val rotated: Boolean,
    internal val combined: Boolean = false,
    /** text-spacing-trim: PUNCTUATION_OPENING or _CLOSING keeps that half of the cell, 0 all of it. */
    internal val half: Int = 0,
  ) : android.text.style.MetricAffectingSpan(), NSCSpan {
    override val type: Type
      get() = Type.Upright

    // The cell for the paint last asked about: measure and draw ask with the same one, many
    // times per layout. One reference, so a layout on another thread sees a whole memo.
    private class Memo(
      val typeface: Typeface?, val size: Float, val features: String?, val variations: String?, val cell: UprightCell?,
    )

    private var memo: Memo? = null

    /** Its cell in [paint], or null when it stays sideways (see [uprightCell]). */
    internal fun cell(paint: Paint): UprightCell? {
      val variations = variationsOf(paint)
      memo?.let {
        if (it.size == paint.textSize && it.typeface === paint.typeface &&
          it.features == paint.fontFeatureSettings && it.variations == variations
        ) return it.cell
      }
      var cell = if (combined) UprightCell(paint.textSize) else uprightCell(glyph, wide, rotated, paint)
      if (half != 0 && cell != null) cell = UprightCell(cell.advance / 2f)
      memo = Memo(paint.typeface, paint.textSize, paint.fontFeatureSettings, variations, cell)
      return cell
    }

    // Returns whether the glyph is upright.
    private fun fillCell(tp: TextPaint): Boolean {
      if (tp.textSize <= 0f) return false
      val cell = cell(tp) ?: return false
      val spacing = tp.letterSpacing
      tp.letterSpacing = 0f
      val advance = tp.measureText(glyph)
      tp.letterSpacing = spacing
      if (advance > 0f) tp.textScaleX *= cell.advance / advance
      return true
    }

    override fun updateMeasureState(textPaint: TextPaint) {
      fillCell(textPaint)
    }

    override fun updateDrawState(tp: TextPaint) {
      if (fillCell(tp)) tp.alpha = 0
    }
  }

  // used to track empty children
  class TrackingSpan : android.text.style.ReplacementSpan(), NSCSpan {
    override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
    ): Int {
      return 0
    }

    override fun draw(
      canvas: Canvas,
      text: CharSequence?,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
    ) {
      // noop
    }

    override val type: Type
      get() = Type.Tracking

  }

  class StrikethroughSpan : android.text.style.StrikethroughSpan(), NSCSpan {
    override val type: Type
      get() = Type.DecorationLine
  }

  class UnderlineSpan(val color: Int, private val thicknessPx: Float = 0f) : LineBackgroundSpan,
    NSCSpan {
    override val type: Type
      get() = Type.DecorationLine

    override fun drawBackground(
      canvas: Canvas,
      paint: Paint,
      left: Int,
      right: Int,
      top: Int,
      baseline: Int,
      bottom: Int,
      text: CharSequence,
      start: Int,
      end: Int,
      lineNumber: Int
    ) {
      val oldColor = paint.color
      val oldStrokeWidth = paint.strokeWidth

      paint.color = color

      val fm = paint.fontMetrics
      // Draw underline slightly below baseline using descent
      val y = baseline + fm.descent + (thicknessPx / 2f)

      paint.strokeWidth =
        if (thicknessPx > 0f) thicknessPx else (oldStrokeWidth.takeIf { it > 0f } ?: 1f)

      canvas.drawLine(
        left.toFloat(),
        y,
        right.toFloat(),
        y,
        paint
      )

      paint.color = oldColor
      paint.strokeWidth = oldStrokeWidth
    }
  }

  class UnderlineLineThrough(val color: Int) : android.text.style.CharacterStyle(), NSCSpan {
    override val type: Type
      get() = Type.DecorationLine

    override fun updateDrawState(tp: TextPaint?) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        //  tp?.underlineColor = color
        tp?.isUnderlineText = true
        tp?.isStrikeThruText = true
      }
    }
  }

  class BackgroundColorSpan(val attributes: TextDefaultAttributes) :
    android.text.style.BackgroundColorSpan(attributes.backgroundColor ?: Color.TRANSPARENT),
    NSCSpan {
    override val type: Type
      get() = Type.BackgroundColor

    override fun getBackgroundColor(): Int {
      return attributes.backgroundColor ?: Color.TRANSPARENT
    }

    override fun updateDrawState(textPaint: TextPaint) {
      textPaint.bgColor = attributes.backgroundColor ?: Color.TRANSPARENT
    }
  }

  class ForegroundColorSpan(val attributes: TextDefaultAttributes) :
    android.text.style.ForegroundColorSpan(attributes.color ?: Color.BLACK),
    NSCSpan {
    override val type: Type
      get() = Type.ForegroundColor


    override fun getForegroundColor(): Int {
      return attributes.color ?: Color.BLACK
    }

    override fun updateDrawState(textPaint: TextPaint) {
      textPaint.color = attributes.color ?: Color.BLACK
    }
  }

  class OverlineSpan(
    private val color: Int,
    private val thicknessPx: Float
  ) : LineBackgroundSpan {

    override fun drawBackground(
      canvas: Canvas,
      paint: Paint,
      left: Int,
      right: Int,
      top: Int,
      baseline: Int,
      bottom: Int,
      text: CharSequence,
      start: Int,
      end: Int,
      lineNumber: Int
    ) {
      val oldColor = paint.color
      val oldStrokeWidth = paint.strokeWidth

      paint.color = color
      paint.strokeWidth = thicknessPx

      val fm = paint.fontMetrics
      val y = baseline + fm.ascent   // ascent is negative → above text

      canvas.drawLine(
        left.toFloat(),
        y,
        right.toFloat(),
        y,
        paint
      )

      paint.color = oldColor
      paint.strokeWidth = oldStrokeWidth
    }
  }

  /**
   * `text-decoration` marker. Paint-neutral: TextDecorations draws it after the
   * Layout so run extents and baselines come from the Layout itself.
   */
  class DecorationSpan(
    val line: Styles.DecorationLine,
    val color: Int,
    val lineStyle: Styles.DecorationStyle,
    val thicknessPx: Float
  ) : CharacterStyle(), NSCSpan {
    override val type: Type
      get() = Type.DecorationLine

    override fun updateDrawState(tp: TextPaint?) {}

    fun sameAppearance(other: DecorationSpan): Boolean =
      line == other.line && color == other.color && lineStyle == other.lineStyle && thicknessPx == other.thicknessPx
  }

  class BlockQuoteBackgroundSpan(private val color: Int, private val barWidthPx: Float) :
    LineBackgroundSpan {

    override fun drawBackground(
      canvas: Canvas,
      paint: Paint,
      left: Int,
      right: Int,
      top: Int,
      baseline: Int,
      bottom: Int,
      text: CharSequence,
      start: Int,
      end: Int,
      lineNumber: Int
    ) {
      val oldColor = paint.color
      val oldStyle = paint.style

      paint.color = color
      paint.style = Paint.Style.FILL

      // draw a vertical bar at the left of the line area
      canvas.drawRect(left.toFloat(), top.toFloat(), left + barWidthPx, bottom.toFloat(), paint)

      paint.color = oldColor
      paint.style = oldStyle
    }
  }

  class ViewSpannable(val view: View, val node: Node) : ReplacementSpan(), NSCSpan {

    override val type: Type
      get() = Type.View

    init {
      NodeUtils.detachNow(view)
    }

    override fun getSize(
      paint: Paint,
      text: CharSequence,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
    ): Int {
      val width = node.computedWidth.toInt()
      val height = node.computedHeight.toInt()

      fm?.let {
        val fontHeight = paint.fontMetricsInt.descent - paint.fontMetricsInt.ascent
        val centerY = paint.fontMetricsInt.ascent + fontHeight / 2

        val halfViewHeight = height / 2
        it.ascent = centerY - halfViewHeight
        it.descent = centerY + halfViewHeight
        it.top = it.ascent
        it.bottom = it.descent
      }
      return width
    }

    override fun draw(
      canvas: Canvas,
      text: CharSequence,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
    ) {
      val width = node.computedWidth.toInt()
      val height = node.computedHeight.toInt()

      val fontMetrics = paint.fontMetricsInt
      val fontHeight = fontMetrics.descent - fontMetrics.ascent
      val centerLine = y + fontMetrics.ascent + fontHeight / 2
      val drawTop = centerLine - height / 2

      canvas.withSave {
        translate(x, drawTop.toFloat())
        view.draw(this)
      }
    }
  }

  class BlurredTextShadowSpan(
    private val offsetX: Float,
    private val offsetY: Float,
    private val blurRadius: Float,
    private val color: Int
  ) : CharacterStyle(), UpdateAppearance {

    override fun updateDrawState(tp: TextPaint) {
      tp.setShadowLayer(blurRadius, offsetX, offsetY, color)
    }
  }

  class TextShadowSpan(
    private val offsetX: Float,
    private val offsetY: Float,
    private val shadowColor: Int
  ) : ReplacementSpan() {

    override fun getSize(
      paint: Paint,
      text: CharSequence,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
    ): Int {
      return paint.measureText(text, start, end).toInt()
    }

    override fun draw(
      canvas: Canvas,
      text: CharSequence,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
    ) {
      val originalColor = paint.color

      paint.color = shadowColor
      canvas.drawText(text, start, end, x + offsetX, y + offsetY, paint)

      paint.color = originalColor
      canvas.drawText(text, start, end, x, y.toFloat(), paint)
    }
  }


}
