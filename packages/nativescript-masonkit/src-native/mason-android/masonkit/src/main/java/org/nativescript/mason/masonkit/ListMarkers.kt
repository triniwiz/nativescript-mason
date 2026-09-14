package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.ListStyleType
import org.nativescript.mason.masonkit.enums.TextType
import kotlin.math.max

/**
 * Draws `<li>` markers for a plain container.
 *
 * This is a purely draw-time mechanism with no Taffy-side bookkeeping: it scans
 * the container's own children for ones flavoured `TextType.Li` and paints a
 * bullet/circle/square/number relative to each child's resolved position, inside
 * whatever space the container's `padding-inline-start` already reserved.
 *
 * Shared by [View] and [Scroll] because `<ul>`/`<ol>` are ordinary block
 * containers — with `Div extends Scroll`, a list is a Scroll too, and a marker
 * mechanism living only in View would silently drop every bullet.
 */
internal object ListMarkers {
  fun draw(container: ViewGroup, containerStyle: Style, canvas: Canvas) {
    var liIndex = 0
    for (i in 0 until container.childCount) {
      val child = container.getChildAt(i) as? TextView ?: continue
      if (child.type != TextType.Li) continue
      drawMarker(canvas, containerStyle, child, liIndex++)
    }
  }

  private fun resolveListStyleType(containerStyle: Style, child: TextView): Byte {
    if (containerStyle.isValueInitialized) {
      val isSet = containerStyle.values.get(StyleKeys.LIST_STYLE_TYPE_STATE) != StyleState.INHERIT
      if (isSet) return containerStyle.values.get(StyleKeys.LIST_STYLE_TYPE)
    }
    if (child.style.isValueInitialized) {
      val isSet = child.style.values.get(StyleKeys.LIST_STYLE_TYPE_STATE) != StyleState.INHERIT
      if (isSet) return child.style.values.get(StyleKeys.LIST_STYLE_TYPE)
    }
    return ListStyleType.Disc.value
  }

  private fun drawMarker(canvas: Canvas, containerStyle: Style, child: TextView, position: Int) {
    val listTypeByte = resolveListStyleType(containerStyle, child)
    if (listTypeByte == ListStyleType.None.value) return

    val basePaint = child.style.paint
    val markerPaint = Paint(basePaint).apply {
      color = child.style.resolvedColor
      style = Paint.Style.FILL
      strokeWidth = 0f
    }

    val fm = basePaint.fontMetrics
    val markerSize = basePaint.textSize * 0.35f
    val gap = basePaint.textSize * 0.5f

    // Centre the marker on the first line's box midpoint (text sits centred in
    // the line-height box) — not the bare font baseline, which drifts off-line.
    val fontLineHeight = fm.descent - fm.ascent
    val lhVal = child.style.resolvedLineHeight
    val lhType = child.style.resolvedLineHeightType
    val lineBox = when {
      lhType == StyleState.SET -> max(lhVal * basePaint.density, fontLineHeight)
      lhVal > 0f -> max(lhVal * basePaint.textSize, fontLineHeight)
      else -> fontLineHeight
    }
    val cy = child.top.toFloat() + lineBox / 2f
    // Baseline of the first line derived from the centred line box (fm.ascent is
    // negative, fm.descent positive on Android).
    val baselineY = cy - (fm.ascent + fm.descent) / 2f

    // The marker shape's right edge sits at child.left - gap.
    val markerRight = child.left.toFloat() - gap

    when (listTypeByte) {
      ListStyleType.Disc.value -> {
        val r = markerSize / 2f
        canvas.drawCircle(markerRight - r, cy, r, markerPaint)
      }

      ListStyleType.Circle.value -> {
        val r = markerSize / 2f
        markerPaint.style = Paint.Style.STROKE
        markerPaint.strokeWidth = max(1f, basePaint.textSize * 0.08f)
        canvas.drawCircle(markerRight - r, cy, r, markerPaint)
      }

      ListStyleType.Square.value -> {
        val half = markerSize / 2f
        val cx = markerRight - half
        canvas.drawRect(cx - half, cy - half, cx + half, cy + half, markerPaint)
      }

      ListStyleType.Decimal.value -> {
        val text = "${position + 1}."
        val textWidth = basePaint.measureText(text)
        canvas.drawText(text, markerRight - textWidth, baselineY, markerPaint)
      }

      ListStyleType.Custom.value -> {
        val text = "•"
        val textWidth = basePaint.measureText(text)
        canvas.drawText(text, markerRight - textWidth, baselineY, markerPaint)
      }
    }
  }
}
