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
import kotlin.math.ceil

/**
 * Renders outset shadows with RenderNode on API 31+ and shared, downsampled bitmaps otherwise.
 */
class BoxShadowRenderer(private val style: Style) {

  private val attachStateListener = object : android.view.View.OnAttachStateChangeListener {
    override fun onViewAttachedToWindow(view: android.view.View) = Unit

    override fun onViewDetachedFromWindow(view: android.view.View) {
      release()
    }
  }

  init {
    (style.node.view as? android.view.View)?.addOnAttachStateChangeListener(attachStateListener)
  }

  // Cached shadow bitmaps for older APIs
  private var cachedOutsetShadows: List<ShadowBitmapEntry>? = null
  private var cachedWidth = 0f
  private var cachedHeight = 0f
  private var cachedShadowsHash = 0
  private val tmpRadii = FloatArray(8)
  private val tmpPath = Path()
  private val tmpRect = RectF()

  // Cached filtered outset/inset shadow lists to avoid .filter{} per frame
  private var cachedOutsetList: List<Shadow.BoxShadow>? = null
  private var cachedOutsetListHash = 0

  @RequiresApi(Build.VERSION_CODES.S)
  private var outsetShadowNodes: List<RenderNode>? = null

  private data class ShadowBitmapEntry(
    val bitmap: Bitmap,
    val drawX: Float,
    val drawY: Float,
    val drawWidth: Float,
    val drawHeight: Float,
  )

  companion object {
    /** Maximum bitmap dimension (width or height) to prevent OOM.
     *  A 2048x2048 ARGB_8888 bitmap is 16 MB - safe for most devices. */
    private const val MAX_BITMAP_DIM = 2048
    private const val RENDER_EFFECT_BLUR_SCALE = 0.5f
    private val scaledBitmapPaint = Paint(Paint.FILTER_BITMAP_FLAG)

    internal fun rasterScale(blurRadius: Float): Float =
      when {
        blurRadius <= 4f -> 1f
        blurRadius < 12f -> 0.5f
        else -> 0.25f
      }

    /**
     * Create a shape bitmap for a rounded rectangle
     */
    fun createShapeBitmap(
      width: Int,
      height: Int,
      radii: FloatArray?,
      pool: CSSFilters.BitmapPool,
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
      pool: CSSFilters.BitmapPool,
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

  fun invalidate() = release()

  /** Drop heavy bitmap references as soon as the owning view leaves the UI. */
  fun release() {
    cachedOutsetShadows = null
    cachedOutsetList = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) outsetShadowNodes = null
    resetCacheKey()
  }

  private fun resetCacheKey() {
    cachedWidth = 0f
    cachedHeight = 0f
    cachedShadowsHash = 0
  }

  private fun needsRebuild(width: Float, height: Float): Boolean {
    val shadowsHash = style.boxShadowsHash()
    return cachedWidth != width || cachedHeight != height || cachedShadowsHash != shadowsHash
  }

  /**
   * Draw outset (outer) box shadows
   */
  fun drawOutsetShadows(
    view: android.view.View,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
  ) {
    if (width <= 0f || height <= 0f) return
    val shadows = style.boxShadows
    // Build outset list only when cache is dirty; reuse otherwise
    if (cachedOutsetList == null || cachedOutsetListHash != style.boxShadowsHash()) {
      val list = ArrayList<Shadow.BoxShadow>(shadows.size)
      for (i in shadows.indices) {
        val s = shadows[i]
        if (!s.inset) list.add(s)
      }
      cachedOutsetList = list
      cachedOutsetListHash = style.boxShadowsHash()
    }
    val outsetShadows = cachedOutsetList!!
    if (outsetShadows.isEmpty()) return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && canvas.isHardwareAccelerated) {
      drawOutsetShadowsV31(canvas, width, height, borderRenderer, outsetShadows)
    } else {
      drawOutsetShadowsLegacy(view, canvas, width, height, borderRenderer, outsetShadows)
    }
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private fun drawOutsetShadowsV31(
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
    shadows: List<Shadow.BoxShadow>,
  ) {
    if (outsetShadowNodes == null || needsRebuild(width, height)) {
      cachedOutsetShadows = null
      val radii = if (borderRenderer.hasRadii()) borderRenderer.getRadii() else null
      val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
      val rect = RectF()

      outsetShadowNodes = shadows.withIndex().reversed().map { (index, shadow) ->
        val spread = shadow.spreadRadius
        val shapeWidth = (width + spread * 2).toInt().coerceAtLeast(1)
        val shapeHeight = (height + spread * 2).toInt().coerceAtLeast(1)
        val blurPad = ceil(shadow.blurRadius * 3f).toInt()
        val node = RenderNode("boxShadowOutset$index")
        node.setPosition(0, 0, shapeWidth + blurPad * 2, shapeHeight + blurPad * 2)
        node.translationX = shadow.offsetX - spread - blurPad
        node.translationY = shadow.offsetY - spread - blurPad

        val colorEffect = RenderEffect.createColorFilterEffect(
          ColorMatrixColorFilter(
            ColorMatrix(
              floatArrayOf(
                0f, 0f, 0f, 0f, Color.red(shadow.color).toFloat(),
                0f, 0f, 0f, 0f, Color.green(shadow.color).toFloat(),
                0f, 0f, 0f, 0f, Color.blue(shadow.color).toFloat(),
                0f, 0f, 0f, Color.alpha(shadow.color) / 255f, 0f,
              )
            )
          )
        )
        node.setRenderEffect(
          if (shadow.blurRadius > 0f) {
            RenderEffect.createChainEffect(
              colorEffect,
              RenderEffect.createBlurEffect(
                shadow.blurRadius * RENDER_EFFECT_BLUR_SCALE,
                shadow.blurRadius * RENDER_EFFECT_BLUR_SCALE,
                Shader.TileMode.DECAL,
              ),
            )
          } else {
            colorEffect
          }
        )

        val adjustedRadii = radii?.let {
          for (i in it.indices) tmpRadii[i] = (it[i] + spread).coerceAtLeast(0f)
          tmpRadii
        }
        val recording = node.beginRecording()
        rect.set(
          blurPad.toFloat(),
          blurPad.toFloat(),
          (blurPad + shapeWidth).toFloat(),
          (blurPad + shapeHeight).toFloat(),
        )
        if (adjustedRadii == null) {
          recording.drawRect(rect, paint)
        } else {
          tmpPath.reset()
          tmpPath.addRoundRect(rect, adjustedRadii, Path.Direction.CW)
          recording.drawPath(tmpPath, paint)
        }
        node.endRecording()
        node
      }
      cachedWidth = width
      cachedHeight = height
      cachedShadowsHash = style.boxShadowsHash()
    }

    canvas.withSave {
      val interior = borderRenderer.getOuterClipPath(width, height)
      if (interior.isEmpty) clipOutRect(0f, 0f, width, height) else clipOutPath(interior)
      outsetShadowNodes?.asReversed()?.forEach(::drawRenderNode)
    }
  }

  private fun drawOutsetShadowsLegacy(
    view: android.view.View,
    canvas: Canvas,
    width: Float,
    height: Float,
    borderRenderer: BorderRenderer,
    shadows: List<Shadow.BoxShadow>
  ) {
    if (width <= 0f || height <= 0f) return

    if (cachedOutsetShadows == null || needsRebuild(width, height)) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) outsetShadowNodes = null
      val context = view.context
      val pool = CSSFilters.getPool(context)
      val entries = mutableListOf<ShadowBitmapEntry>()
      val hasRadii = borderRenderer.hasRadii()
      val radii = if (hasRadii) borderRenderer.getRadii() else null

      for (shadow in shadows.reversed()) {
        val spread = shadow.spreadRadius
        val shapeW = (width + spread * 2).toInt().coerceAtLeast(1)
        val shapeH = (height + spread * 2).toInt().coerceAtLeast(1)
        val scale = rasterScale(shadow.blurRadius)

        // Destination bounds stay full size; only the raster backing is reduced.
        val blurPad = ceil(shadow.blurRadius * 3f).toInt()
        val expandedW = shapeW + blurPad * 2
        val expandedH = shapeH + blurPad * 2
        val rasterShapeW = ceil(shapeW * scale).toInt().coerceAtLeast(1)
        val rasterShapeH = ceil(shapeH * scale).toInt().coerceAtLeast(1)
        val rasterBlur = shadow.blurRadius * scale
        val rasterBlurPad = ceil(rasterBlur * 3f).toInt()
        val rasterExpandedW = rasterShapeW + rasterBlurPad * 2
        val rasterExpandedH = rasterShapeH + rasterBlurPad * 2

        // Skip this shadow if bitmap would exceed safe limits
        if (rasterExpandedW > MAX_BITMAP_DIM || rasterExpandedH > MAX_BITMAP_DIM || rasterExpandedW <= 0 || rasterExpandedH <= 0) {
          continue
        }

        val adjustedRadii = if (radii != null) {
          for (i in 0 until 8) tmpRadii[i] = (radii[i] + spread).coerceAtLeast(0f) * scale
          tmpRadii
        } else null

        val drawX = shadow.offsetX - spread - blurPad.toFloat()
        val drawY = shadow.offsetY - spread - blurPad.toFloat()
        val clearRadii = radii?.let { source -> FloatArray(8) { source[it] * scale } }
        val key = SharedBoxShadowCache.Key(
          SharedBoxShadowCache.floatBits(width),
          SharedBoxShadowCache.floatBits(height),
          adjustedRadii?.map(SharedBoxShadowCache::floatBits) ?: emptyList(),
          SharedBoxShadowCache.floatBits(rasterBlur),
          SharedBoxShadowCache.floatBits(spread),
          shadow.color,
          SharedBoxShadowCache.floatBits(shadow.offsetX),
          SharedBoxShadowCache.floatBits(shadow.offsetY),
          context.resources.displayMetrics.densityDpi,
          SharedBoxShadowCache.floatBits(scale),
        )
        val shadowBitmap = SharedBoxShadowCache.get(key) ?: run {
          val shapeBitmap = createShapeBitmap(
            rasterShapeW,
            rasterShapeH,
            adjustedRadii,
            pool,
          )
          val rendered = createBlurredShadowBitmapRS(
            context,
            shapeBitmap,
            rasterBlur,
            shadow.color,
            pool,
          )
          pool.putBitmap(shapeBitmap)
          clearOutsetShadowInterior(
            rendered,
            -drawX * scale,
            -drawY * scale,
            width * scale,
            height * scale,
            clearRadii,
          )
          SharedBoxShadowCache.put(key, rendered)
          rendered
        }

        entries.add(
          ShadowBitmapEntry(
            shadowBitmap,
            drawX,
            drawY,
            expandedW.toFloat(),
            expandedH.toFloat(),
          )
        )
      }

      cachedOutsetShadows = entries
      cachedWidth = width
      cachedHeight = height
      cachedShadowsHash = style.boxShadowsHash()
    }

    // Draw cached bitmaps (in reverse order so first shadow is on top)
    cachedOutsetShadows?.let { entries ->
      for (i in entries.indices.reversed()) {
        val entry = entries[i]
        tmpRect.set(
          entry.drawX,
          entry.drawY,
          entry.drawX + entry.drawWidth,
          entry.drawY + entry.drawHeight,
        )
        canvas.drawBitmap(entry.bitmap, null, tmpRect, scaledBitmapPaint)
      }
    }
  }

  private fun clearOutsetShadowInterior(
    bitmap: Bitmap,
    left: Float,
    top: Float,
    width: Float,
    height: Float,
    radii: FloatArray?
  ) {
    bitmap.setHasAlpha(true)
    val canvas = Canvas(bitmap)
    val clearPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.FILL
      xfermode = android.graphics.PorterDuffXfermode(PorterDuff.Mode.CLEAR)
    }
    val rect = RectF(left, top, left + width, top + height)
    if (radii != null) {
      tmpPath.reset()
      tmpPath.addRoundRect(rect, radii, Path.Direction.CW)
      canvas.drawPath(tmpPath, clearPaint)
    } else {
      canvas.drawRect(rect, clearPaint)
    }
    clearPaint.xfermode = null
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
    if (width <= 0f || height <= 0f) return
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
    val tmpRadii = FloatArray(8)
    val tmpPath = Path()

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
        for (i in 0 until 8) tmpRadii[i] = (radii[i] - spread).coerceAtLeast(0f)
        tmpRadii
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
        tmpPath.reset()
        tmpPath.addRoundRect(shapeRect, innerRadii, Path.Direction.CW)
        shapeCanvas.drawPath(tmpPath, shapePaint)
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
    if (width <= 0f || height <= 0f) return

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

      // Calculate expanded dimensions with blur
      val expandedPad = ceil(shadow.blurRadius * 3f).toInt()
      val expandedW = frameW + expandedPad * 2
      val expandedH = frameH + expandedPad * 2

      // Skip this shadow if bitmap would exceed safe limits
      if (expandedW > MAX_BITMAP_DIM || expandedH > MAX_BITMAP_DIM || expandedW <= 0 || expandedH <= 0) {
        continue
      }

      // Create frame bitmap with hole cut out
      val frameBitmap = pool.getBitmap(frameW, frameH, Bitmap.Config.ARGB_8888)
      frameBitmap.eraseColor(Color.TRANSPARENT)
      val frameCanvas = Canvas(frameBitmap)

      // Fill frame
      shapePaint.color = Color.WHITE
      frameCanvas.drawRect(0f, 0f, frameW.toFloat(), frameH.toFloat(), shapePaint)

      // Cut out inner area
      val tmpRadii = FloatArray(8)
      val tmpPath = Path()
      val innerRadii = if (radii != null) {
        for (i in 0 until 8) tmpRadii[i] = (radii[i] - spread).coerceAtLeast(0f)
        tmpRadii
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
        tmpPath.reset()
        tmpPath.addRoundRect(shapeRect, innerRadii, Path.Direction.CW)
        frameCanvas.drawPath(tmpPath, shapePaint)
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
