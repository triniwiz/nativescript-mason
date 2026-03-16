package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.RectF
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicBlur
import androidx.annotation.RequiresApi
import androidx.core.graphics.withSave
import kotlin.math.abs
import kotlin.math.ceil

/**
 * Renders CSS box-shadow effects using hardware acceleration when available.
 * - API 31+: Uses RenderEffect + RenderNode for GPU-accelerated blur
 * - API 21-30: Uses RenderScript for blur
 */
class BoxShadowRenderer(private val style: Style) {

  // Cached shadow bitmaps for older APIs
  private var cachedOutsetShadows: List<ShadowBitmapEntry>? = null
  private var cachedInsetShadows: List<ShadowBitmapEntry>? = null
  private var cachedWidth = 0f
  private var cachedHeight = 0f
  private var cachedShadowsHash = 0

  // For API 31+
  @RequiresApi(Build.VERSION_CODES.S)
  private var outsetShadowNodes: List<RenderNode>? = null
  @RequiresApi(Build.VERSION_CODES.S)
  private var insetShadowNodes: List<RenderNode>? = null

  private data class ShadowBitmapEntry(
    val bitmap: Bitmap,
    val drawX: Float,
    val drawY: Float,
    val isInset: Boolean
  )

  companion object {
    /**
     * Create a shape bitmap for a rounded rectangle
     */
    fun createShapeBitmap(
      width: Int,
      height: Int,
      radii: FloatArray?,
      pool: CSSFilters.BitmapPool
    ): Bitmap {
      val bitmap = pool.getBitmap(width, height, Bitmap.Config.ARGB_8888)
      bitmap.eraseColor(Color.TRANSPARENT)
      val canvas = Canvas(bitmap)

      val rect = RectF(0f, 0f, width.toFloat(), height.toFloat())
      val paint = Paint().apply {
        style = Paint.Style.FILL
        isAntiAlias = true
        color = Color.WHITE
      }

      if (radii != null) {
        val path = Path()
        path.addRoundRect(rect, radii, Path.Direction.CW)
        canvas.drawPath(path, paint)
      } else {
        canvas.drawRect(rect, paint)
      }

      return bitmap
    }

    /**
     * Create blurred shadow bitmap using RenderScript (API 21-30)
     */
    @Suppress("DEPRECATION")
    fun createBlurredShadowBitmapRS(
      context: Context,
      shapeBitmap: Bitmap,
      blurRadius: Float,
      color: Int,
      pool: CSSFilters.BitmapPool
    ): Bitmap {
      val tintPaint = Paint().apply {
        style = Paint.Style.FILL
        isAntiAlias = true
        colorFilter = PorterDuffColorFilter(color, PorterDuff.Mode.SRC_IN)
      }

      if (blurRadius <= 0f) {
        // No blur - just tint the shape
        val result = pool.getBitmap(shapeBitmap.width, shapeBitmap.height, Bitmap.Config.ARGB_8888)
        result.eraseColor(Color.TRANSPARENT)
        val canvas = Canvas(result)
        canvas.drawBitmap(shapeBitmap, 0f, 0f, tintPaint)
        return result
      }

      val rs = RenderScript.create(context)
      try {
        // Expand bitmap for blur spread
        val pad = ceil(blurRadius * 3f).toInt().coerceAtLeast(0)
        val expandedW = shapeBitmap.width + pad * 2
        val expandedH = shapeBitmap.height + pad * 2

        // Draw shape centered in expanded bitmap
        val tempBitmap = pool.getBitmap(expandedW, expandedH, Bitmap.Config.ARGB_8888)
        tempBitmap.eraseColor(Color.TRANSPARENT)
        val tempCanvas = Canvas(tempBitmap)
        tempCanvas.drawBitmap(shapeBitmap, pad.toFloat(), pad.toFloat(), null)

        // Apply blur
        val input = Allocation.createFromBitmap(rs, tempBitmap)
        val output = Allocation.createTyped(rs, input.type)
        val script = ScriptIntrinsicBlur.create(rs, Element.U8_4(rs))
        script.setRadius(blurRadius.coerceIn(0.0001f, 25f))
        script.setInput(input)
        script.forEach(output)

        val blurred = pool.getBitmap(expandedW, expandedH, Bitmap.Config.ARGB_8888)
        output.copyTo(blurred)

        // Tint the blurred result
        val result = pool.getBitmap(expandedW, expandedH, Bitmap.Config.ARGB_8888)
        result.eraseColor(Color.TRANSPARENT)
        val resultCanvas = Canvas(result)
        resultCanvas.drawBitmap(blurred, 0f, 0f, tintPaint)

        // Return temp bitmaps to pool
        pool.putBitmap(tempBitmap)
        pool.putBitmap(blurred)

        return result
      } finally {
        rs.destroy()
      }
    }
  }

  fun invalidate() {
    cachedOutsetShadows?.forEach { entry ->
      // Don't recycle - pooled bitmaps are managed by the pool
    }
    cachedOutsetShadows = null
    cachedInsetShadows = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      outsetShadowNodes = null
      insetShadowNodes = null
    }
  }

  private fun needsRebuild(width: Float, height: Float): Boolean {
    val shadowsHash = style.boxShadows.hashCode()
    return cachedWidth != width || cachedHeight != height || cachedShadowsHash != shadowsHash
  }

  /**
   * Draw outset (outer) box shadows
   * @param forceLegacy When true, use bitmap-based rendering even on API 31+.
   *   Use this when drawing from parent context where RenderNode effects may not work correctly.
   */
  fun drawOutsetShadows(
    view: android.view.View,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
    forceLegacy: Boolean = false
  ) {
    val outsetShadows = style.boxShadows.filter { !it.inset }
    if (outsetShadows.isEmpty()) return

    if (!forceLegacy && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      drawOutsetShadowsV31(view, canvas, width, height, borderRenderer, outsetShadows)
    } else {
      drawOutsetShadowsLegacy(view.context, canvas, width, height, borderRenderer, outsetShadows)
    }
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private fun drawOutsetShadowsV31(
    view: android.view.View,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
    shadows: List<Shadow.BoxShadow>
  ) {
    if (needsRebuild(width, height)) {
      val nodes = mutableListOf<RenderNode>()
      val hasRadii = borderRenderer.hasRadii()
      val radii = if (hasRadii) borderRenderer.getRadii() else null

      val shapePaint = Paint().apply {
        style = Paint.Style.FILL
        isAntiAlias = true
        color = Color.WHITE
      }
      val shapeRect = RectF()

      for ((index, shadow) in shadows.withIndex().reversed()) {
        // Calculate shape dimensions with spread
        val spread = shadow.spreadRadius
        val shapeW = (width + spread * 2).toInt().coerceAtLeast(1)
        val shapeH = (height + spread * 2).toInt().coerceAtLeast(1)

        // Adjust radii for spread
        val adjustedRadii = if (radii != null) {
          FloatArray(8) { i -> (radii[i] + spread).coerceAtLeast(0f) }
        } else null

        // Create shape node
        val shapeNode = RenderNode("boxShadowOutset$index")
        shapeNode.setPosition(0, 0, shapeW, shapeH)
        val shapeCanvas = shapeNode.beginRecording()
        shapeRect.set(0f, 0f, shapeW.toFloat(), shapeH.toFloat())
        shapePaint.color = Color.WHITE
        if (adjustedRadii != null) {
          val path = Path()
          path.addRoundRect(shapeRect, adjustedRadii, Path.Direction.CW)
          shapeCanvas.drawPath(path, shapePaint)
        } else {
          shapeCanvas.drawRect(shapeRect, shapePaint)
        }
        shapeNode.endRecording()

        // Create color tint effect
        val colorFilter = ColorMatrixColorFilter(
          ColorMatrix(
            floatArrayOf(
              0f, 0f, 0f, 0f, Color.red(shadow.color).toFloat(),
              0f, 0f, 0f, 0f, Color.green(shadow.color).toFloat(),
              0f, 0f, 0f, 0f, Color.blue(shadow.color).toFloat(),
              0f, 0f, 0f, Color.alpha(shadow.color) / 255f, 0f
            )
          )
        )

        val colorEffect = RenderEffect.createColorFilterEffect(colorFilter)

        val shadowEffect = if (shadow.blurRadius > 0f) {
          val blurEffect = RenderEffect.createBlurEffect(
            shadow.blurRadius, shadow.blurRadius, Shader.TileMode.CLAMP
          )
          RenderEffect.createChainEffect(colorEffect, blurEffect)
        } else {
          colorEffect
        }

        // Apply offset
        val offsetX = shadow.offsetX - spread
        val offsetY = shadow.offsetY - spread

        val offsetEffect = RenderEffect.createOffsetEffect(offsetX, offsetY, shadowEffect)

        // Create final shadow node
        val shadowNode = RenderNode("boxShadowOutsetFinal$index")
        shadowNode.setRenderEffect(offsetEffect)

        val blurPad = ceil(shadow.blurRadius * 3f).toInt()
        shadowNode.setPosition(
          0, 0,
          shapeW + abs(offsetX).toInt() + blurPad * 2,
          shapeH + abs(offsetY).toInt() + blurPad * 2
        )

        val shadowCanvas = shadowNode.beginRecording()
        shadowCanvas.drawRenderNode(shapeNode)
        shadowNode.endRecording()

        nodes.add(shadowNode)
      }

      outsetShadowNodes = nodes
      cachedWidth = width
      cachedHeight = height
      cachedShadowsHash = style.boxShadows.hashCode()
    }

    // Draw cached nodes (in reverse order so first shadow is on top)
    outsetShadowNodes?.reversed()?.forEach { node ->
      canvas.drawRenderNode(node)
    }
  }

  private fun drawOutsetShadowsLegacy(
    context: Context,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
    shadows: List<Shadow.BoxShadow>
  ) {
    if (needsRebuild(width, height)) {
      val pool = CSSFilters.getPool(context)
      val entries = mutableListOf<ShadowBitmapEntry>()
      val hasRadii = borderRenderer.hasRadii()
      val radii = if (hasRadii) borderRenderer.getRadii() else null

      for (shadow in shadows.reversed()) {
        val spread = shadow.spreadRadius
        val shapeW = (width + spread * 2).toInt().coerceAtLeast(1)
        val shapeH = (height + spread * 2).toInt().coerceAtLeast(1)

        val adjustedRadii = if (radii != null) {
          FloatArray(8) { i -> (radii[i] + spread).coerceAtLeast(0f) }
        } else null

        // Create shape
        val shapeBitmap = createShapeBitmap(shapeW, shapeH, adjustedRadii, pool)

        // Create blurred shadow
        val shadowBitmap = createBlurredShadowBitmapRS(
          context, shapeBitmap, shadow.blurRadius, shadow.color, pool
        )

        pool.putBitmap(shapeBitmap)

        // Calculate draw position
        val blurPad = ceil(shadow.blurRadius * 3f)
        val drawX = shadow.offsetX - spread - blurPad
        val drawY = shadow.offsetY - spread - blurPad

        entries.add(ShadowBitmapEntry(shadowBitmap, drawX, drawY, false))
      }

      cachedOutsetShadows = entries
      cachedWidth = width
      cachedHeight = height
      cachedShadowsHash = style.boxShadows.hashCode()
    }

    // Draw cached bitmaps (in reverse order so first shadow is on top)
    cachedOutsetShadows?.reversed()?.forEach { entry ->
      canvas.drawBitmap(entry.bitmap, entry.drawX, entry.drawY, null)
    }
  }

  /**
   * Draw inset (inner) box shadows
   */
  fun drawInsetShadows(
    view: android.view.View,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer
  ) {
    val insetShadows = style.boxShadows.filter { it.inset }
    if (insetShadows.isEmpty()) return

    val hasRadii = borderRenderer.hasRadii()

    // Clip to element bounds first
    canvas.withSave {
      if (hasRadii) {
        canvas.clipPath(borderRenderer.getClipPath(width, height))
      } else {
        canvas.clipRect(0f, 0f, width, height)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        drawInsetShadowsV31(view, canvas, width, height, borderRenderer, insetShadows)
      } else {
        drawInsetShadowsLegacy(view.context, canvas, width, height, borderRenderer, insetShadows)
      }
    }
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private fun drawInsetShadowsV31(
    view: android.view.View,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
    shadows: List<Shadow.BoxShadow>
  ) {
    // For inset shadows, we need to draw the inverse - a frame that casts shadow inward
    val hasRadii = borderRenderer.hasRadii()
    val radii = if (hasRadii) borderRenderer.getRadii() else null

    val shapePaint = Paint().apply {
      style = Paint.Style.FILL
      isAntiAlias = true
      color = Color.WHITE
    }
    val shapeRect = RectF()

    for ((index, shadow) in shadows.withIndex().reversed()) {
      val spread = shadow.spreadRadius
      val blurPad = ceil(shadow.blurRadius * 3f).toInt().coerceAtLeast(16)

      // Create outer frame bitmap (the shadow-casting shape)
      val frameW = width.toInt() + blurPad * 2
      val frameH = height.toInt() + blurPad * 2

      val shapeNode = RenderNode("insetShadow$index")
      shapeNode.setPosition(0, 0, frameW, frameH)
      val shapeCanvas = shapeNode.beginRecording()

      // Fill the entire frame
      shapePaint.color = Color.WHITE
      shapeCanvas.drawRect(0f, 0f, frameW.toFloat(), frameH.toFloat(), shapePaint)

      // Cut out the inner area (where no shadow should appear)
      val innerRadii = if (radii != null) {
        FloatArray(8) { i -> (radii[i] - spread).coerceAtLeast(0f) }
      } else null

      shapeRect.set(
        blurPad + spread,
        blurPad + spread,
        blurPad + width - spread,
        blurPad + height - spread
      )

      shapePaint.color = Color.TRANSPARENT
      shapePaint.xfermode = android.graphics.PorterDuffXfermode(PorterDuff.Mode.CLEAR)
      if (innerRadii != null) {
        val cutPath = Path()
        cutPath.addRoundRect(shapeRect, innerRadii, Path.Direction.CW)
        shapeCanvas.drawPath(cutPath, shapePaint)
      } else {
        shapeCanvas.drawRect(shapeRect, shapePaint)
      }
      shapePaint.xfermode = null
      shapePaint.color = Color.WHITE

      shapeNode.endRecording()

      // Apply blur and color
      val colorFilter = ColorMatrixColorFilter(
        ColorMatrix(
          floatArrayOf(
            0f, 0f, 0f, 0f, Color.red(shadow.color).toFloat(),
            0f, 0f, 0f, 0f, Color.green(shadow.color).toFloat(),
            0f, 0f, 0f, 0f, Color.blue(shadow.color).toFloat(),
            0f, 0f, 0f, Color.alpha(shadow.color) / 255f, 0f
          )
        )
      )

      val colorEffect = RenderEffect.createColorFilterEffect(colorFilter)

      val shadowEffect = if (shadow.blurRadius > 0f) {
        val blurEffect = RenderEffect.createBlurEffect(
          shadow.blurRadius, shadow.blurRadius, Shader.TileMode.CLAMP
        )
        RenderEffect.createChainEffect(colorEffect, blurEffect)
      } else {
        colorEffect
      }

      val shadowNode = RenderNode("insetShadowFinal$index")
      shadowNode.setRenderEffect(shadowEffect)
      shadowNode.setPosition(0, 0, frameW, frameH)

      val shadowNodeCanvas = shadowNode.beginRecording()
      shadowNodeCanvas.drawRenderNode(shapeNode)
      shadowNode.endRecording()

      // Draw at offset position
      val drawX = -blurPad + shadow.offsetX
      val drawY = -blurPad + shadow.offsetY
      canvas.withSave {
        canvas.translate(drawX, drawY)
        canvas.drawRenderNode(shadowNode)
      }
    }
  }

  private fun drawInsetShadowsLegacy(
    context: Context,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
    shadows: List<Shadow.BoxShadow>
  ) {
    val pool = CSSFilters.getPool(context)
    val hasRadii = borderRenderer.hasRadii()
    val radii = if (hasRadii) borderRenderer.getRadii() else null

    val shapePaint = Paint().apply {
      style = Paint.Style.FILL
      isAntiAlias = true
      color = Color.WHITE
    }
    val shapeRect = RectF()

    for (shadow in shadows.reversed()) {
      val spread = shadow.spreadRadius
      val blurPad = ceil(shadow.blurRadius * 3f).toInt().coerceAtLeast(16)

      val frameW = width.toInt() + blurPad * 2
      val frameH = height.toInt() + blurPad * 2

      // Create frame bitmap with hole cut out
      val frameBitmap = pool.getBitmap(frameW, frameH, Bitmap.Config.ARGB_8888)
      frameBitmap.eraseColor(Color.TRANSPARENT)
      val frameCanvas = Canvas(frameBitmap)

      // Fill frame
      shapePaint.color = Color.WHITE
      frameCanvas.drawRect(0f, 0f, frameW.toFloat(), frameH.toFloat(), shapePaint)

      // Cut out inner area
      val innerRadii = if (radii != null) {
        FloatArray(8) { i -> (radii[i] - spread).coerceAtLeast(0f) }
      } else null

      shapeRect.set(
        blurPad + spread,
        blurPad + spread,
        blurPad + width - spread,
        blurPad + height - spread
      )

      shapePaint.color = Color.TRANSPARENT
      shapePaint.xfermode = android.graphics.PorterDuffXfermode(PorterDuff.Mode.CLEAR)
      if (innerRadii != null) {
        val cutPath = Path()
        cutPath.addRoundRect(shapeRect, innerRadii, Path.Direction.CW)
        frameCanvas.drawPath(cutPath, shapePaint)
      } else {
        frameCanvas.drawRect(shapeRect, shapePaint)
      }
      shapePaint.xfermode = null
      shapePaint.color = Color.WHITE

      // Create blurred shadow from frame
      val shadowBitmap = createBlurredShadowBitmapRS(
        context, frameBitmap, shadow.blurRadius, shadow.color, pool
      )

      pool.putBitmap(frameBitmap)

      // Draw at offset
      val extraPad = ceil(shadow.blurRadius * 3f)
      val drawX = -blurPad - extraPad + shadow.offsetX
      val drawY = -blurPad - extraPad + shadow.offsetY
      canvas.drawBitmap(shadowBitmap, drawX, drawY, null)

      // Note: shadowBitmap goes back to pool on next invalidate
    }
  }
}
