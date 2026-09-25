package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.os.Build
import android.text.Layout
import android.text.Spanned
import android.text.TextPaint
import android.text.style.CharacterStyle
import kotlin.math.max
import kotlin.math.min

/** Draws `text-decoration` lines for a Layout from its [Spans.DecorationSpan]s. */
internal object TextDecorations {
  private const val SPELLING_COLOR = 0xFFFF0000.toInt()
  private const val GRAMMAR_COLOR = 0xFF008000.toInt()

  private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
  private val runPaint = TextPaint()
  private val path = Path()
  private val runPath = Path()
  private val runBounds = android.graphics.RectF()

  /** Decorations for text the platform TextView drew itself (Button, fallbacks). */
  fun drawPlatform(canvas: Canvas, view: android.widget.TextView) {
    val layout = view.layout ?: return
    val save = canvas.save()
    canvas.translate(view.totalPaddingLeft.toFloat(), view.totalPaddingTop.toFloat())
    draw(canvas, layout)
    canvas.restoreToCount(save)
  }

  fun draw(canvas: Canvas, layout: Layout) {
    val text = layout.text as? Spanned ?: return
    val spans = text.getSpans(0, text.length, Spans.DecorationSpan::class.java)
    if (spans.isEmpty()) return
    for ((index, span) in spans.withIndex()) {
      val start = text.getSpanStart(span)
      val end = text.getSpanEnd(span)
      if (start < 0 || end <= start) continue
      if (isCovered(text, spans, index, start, end)) continue
      val firstLine = layout.getLineForOffset(start)
      val lastLine = layout.getLineForOffset(end - 1)
      for (line in firstLine..lastLine) {
        val lineStart = max(layout.getLineStart(line), start)
        val lineEnd = min(layout.getLineVisibleEnd(line), end)
        if (lineEnd <= lineStart) continue
        // The selection path gives the run's real extent in either direction.
        runPath.rewind()
        layout.getSelectionPath(lineStart, lineEnd, runPath)
        runPath.computeBounds(runBounds, true)
        drawRun(canvas, text, span, lineStart, runBounds.left, runBounds.right, layout.getLineBaseline(line).toFloat(), layout.paint)
      }
    }
  }

  // A text node inherits its container's decoration, so the same line would be
  // drawn twice over the node's range. Skip a span that another span with the
  // same appearance encloses (the earlier one wins when the ranges are equal).
  private fun isCovered(text: Spanned, spans: Array<Spans.DecorationSpan>, index: Int, start: Int, end: Int): Boolean {
    for (i in spans.indices) {
      if (i == index) continue
      val other = spans[i]
      if (!other.sameAppearance(spans[index])) continue
      val os = text.getSpanStart(other)
      val oe = text.getSpanEnd(other)
      if (os > start || oe < end) continue
      if (os < start || oe > end || i < index) return true
    }
    return false
  }

  private fun drawRun(canvas: Canvas, text: Spanned, span: Spans.DecorationSpan, offset: Int, x0: Float, x1: Float, baseline: Float, base: TextPaint) {
    if (x1 - x0 <= 0f) return
    runPaint.set(base)
    for (cs in text.getSpans(offset, offset + 1, CharacterStyle::class.java)) {
      if (cs !== span) cs.updateDrawState(runPaint)
    }
    val fm = runPaint.fontMetrics
    val fontThickness = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) runPaint.underlineThickness else runPaint.textSize / 14f
    val thickness = if (span.thicknessPx > 0f) span.thicknessPx else max(0.5f * Mason.shared.scale, fontThickness)
    val underlineY = baseline + (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) runPaint.underlinePosition else fm.descent * 0.4f)
    val strikeY = baseline + (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) runPaint.strikeThruPosition else fm.ascent * 0.3f)

    val line = span.line
    when {
      line.isSpellingError -> stroke(canvas, x0, x1, underlineY, thickness, SPELLING_COLOR, Styles.DecorationStyle.Wavy)
      line.isGrammarError -> stroke(canvas, x0, x1, underlineY, thickness, GRAMMAR_COLOR, Styles.DecorationStyle.Wavy)
      else -> {
        val color = if (span.color == Constants.UNSET_COLOR.toInt()) runPaint.color else span.color
        if (line.hasUnderline) stroke(canvas, x0, x1, underlineY, thickness, color, span.lineStyle)
        if (line.hasOverline) stroke(canvas, x0, x1, baseline + fm.ascent + thickness / 2f, thickness, color, span.lineStyle)
        if (line.hasLineThrough) stroke(canvas, x0, x1, strikeY, thickness, color, span.lineStyle)
      }
    }
  }

  private fun stroke(canvas: Canvas, x0: Float, x1: Float, y: Float, thickness: Float, color: Int, style: Styles.DecorationStyle) {
    paint.color = color
    paint.strokeWidth = thickness
    paint.pathEffect = null
    paint.strokeCap = Paint.Cap.BUTT
    when (style) {
      Styles.DecorationStyle.Solid -> canvas.drawLine(x0, y, x1, y, paint)
      Styles.DecorationStyle.Double -> {
        canvas.drawLine(x0, y - thickness, x1, y - thickness, paint)
        canvas.drawLine(x0, y + thickness, x1, y + thickness, paint)
      }
      Styles.DecorationStyle.Dotted -> {
        paint.strokeCap = Paint.Cap.ROUND
        paint.pathEffect = DashPathEffect(floatArrayOf(0.01f, thickness * 2f), 0f)
        canvas.drawLine(x0, y, x1, y, paint)
      }
      Styles.DecorationStyle.Dashed -> {
        paint.pathEffect = DashPathEffect(floatArrayOf(thickness * 3f, thickness * 2f), 0f)
        canvas.drawLine(x0, y, x1, y, paint)
      }
      Styles.DecorationStyle.Wavy -> {
        val scale = Mason.shared.scale
        val amplitude = max(scale, thickness)
        val half = max(2f * scale, thickness * 2f)
        path.rewind()
        path.moveTo(x0, y)
        var x = x0
        var up = true
        while (x < x1) {
          val next = min(x + half, x1)
          val ctrl = if (up) y - amplitude * 2f else y + amplitude * 2f
          path.quadTo((x + next) / 2f, ctrl, next, y)
          x = next
          up = !up
        }
        canvas.drawPath(path, paint)
      }
    }
    paint.pathEffect = null
  }
}
