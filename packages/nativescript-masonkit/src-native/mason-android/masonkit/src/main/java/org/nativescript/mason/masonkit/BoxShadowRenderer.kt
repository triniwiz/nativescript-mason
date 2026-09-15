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
import android.util.LruCache
import androidx.annotation.RequiresApi
import androidx.core.graphics.withSave
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.ceil

/**
 * Renders box shadows with RenderNode on API 31+ hardware canvases and with
 * shared, downsampled bitmaps otherwise.
 *
 * Both paths take the same blur sigma ([BLUR_SIGMA_SCALE] × CSS blur radius) so
 * shadows look identical regardless of the active backend; [renderModeOverride]
 * forces a backend globally. Outset and inset shadows are cached per view and
 * rebuilt only when size, border radii, shadow style, or global configuration
 * change — steady-state drawing is a handful of draw calls per frame.
 */
class BoxShadowRenderer(private val style: Style) {

  enum class RenderMode {
    AUTO,
    RENDER_NODE,
    SOFTWARE,
  }

  private val attachStateListener = object : android.view.View.OnAttachStateChangeListener {
    override fun onViewAttachedToWindow(view: android.view.View) = Unit

    override fun onViewDetachedFromWindow(view: android.view.View) {
      release()
    }
  }

  init {
    (style.node.view as? android.view.View)?.addOnAttachStateChangeListener(attachStateListener)
  }

  /** Rebuild condition shared by the outset and inset caches. */
  private class CacheKey {
    var width = 0f
    var height = 0f
    var shadowsHash = 0
    var radiiHash = 0
    var configurationVersion = -1

    fun matches(width: Float, height: Float, shadowsHash: Int, radiiHash: Int): Boolean =
      this.width == width && this.height == height && this.shadowsHash == shadowsHash &&
        this.radiiHash == radiiHash &&
        this.configurationVersion == BoxShadowRenderer.configurationVersion.get()

    fun store(width: Float, height: Float, shadowsHash: Int, radiiHash: Int) {
      this.width = width
      this.height = height
      this.shadowsHash = shadowsHash
      this.radiiHash = radiiHash
      this.configurationVersion = BoxShadowRenderer.configurationVersion.get()
    }

    fun reset() {
      width = 0f
      height = 0f
      shadowsHash = 0
      radiiHash = 0
      configurationVersion = -1
    }
  }

  private val outsetKey = CacheKey()
  private val insetKey = CacheKey()

  // Cached shadow bitmaps for older APIs
  private var cachedOutsetShadows: List<ShadowBitmapEntry>? = null
  private var cachedInsetShadows: List<ShadowBitmapEntry>? = null
  private val tmpRadii = FloatArray(8)
  private val tmpPath = Path()
  private val tmpRect = RectF()

  // Cached filtered outset/inset shadow lists to avoid .filter{} per frame
  private var cachedOutsetList: List<Shadow.BoxShadow>? = null
  private var cachedOutsetListHash = 0
  private var cachedInsetList: List<Shadow.BoxShadow>? = null
  private var cachedInsetListHash = 0

  @RequiresApi(Build.VERSION_CODES.S)
  private var outsetShadowNodes: List<RenderNode>? = null

  @RequiresApi(Build.VERSION_CODES.S)
  private var insetShadowNodes: List<RenderNode>? = null

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

    /** Upper bound on cached RenderEffects; distinct (sigma, color) pairs. */
    private const val MAX_CACHED_EFFECTS = 64

    /** CSS blur is a diameter; RenderEffect/RenderScript blur takes a sigma. */
    private const val BLUR_SIGMA_SCALE = 0.5f

    private val scaledBitmapPaint = Paint(Paint.FILTER_BITMAP_FLAG)

    private val configurationVersion = AtomicInteger()

    /** Global backend override; AUTO follows the SDK/canvas check in [useRenderNode]. */
    @JvmStatic
    var renderModeOverride: RenderMode? = null
      set(value) {
        if (field != value) {
          field = value
          configurationVersion.incrementAndGet()
        }
      }

    /** Null selects the dynamic policy; otherwise accepts a linear scale in (0, 1]. */
    @JvmStatic
    var softwareRasterScaleOverride: Float? = null
      set(value) {
        require(value == null || value > 0f && value <= 1f) {
          "softwareRasterScaleOverride must be null or in (0, 1]"
        }
        if (field != value) {
          field = value
          configurationVersion.incrementAndGet()
        }
      }

    internal fun rasterScale(blurRadius: Float): Float =
      softwareRasterScaleOverride ?: when {
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
     * Create blurred shadow bitmap using RenderScript (API 21-30).
     * [blurRadius] is the CSS blur radius; the same sigma scale as the
     * RenderEffect path is applied here so both backends match.
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

      // Expand bitmap for blur spread
      val pad = ceil(blurRadius * 3f).toInt().coerceAtLeast(0)
      val expandedW = shapeBitmap.width + pad * 2
      val expandedH = shapeBitmap.height + pad * 2

      // Draw shape centered in expanded bitmap
      val tempBitmap = pool.getBitmap(expandedW, expandedH, Bitmap.Config.ARGB_8888)
      tempBitmap.eraseColor(Color.TRANSPARENT)
      val tempCanvas = Canvas(tempBitmap)
      tempCanvas.drawBitmap(shapeBitmap, pad.toFloat(), pad.toFloat(), null)

      // Apply blur. The RenderScript context is shared, so the per-call
      // allocations must be destroyed here rather than with the context.
      val blurred = pool.getBitmap(expandedW, expandedH, Bitmap.Config.ARGB_8888)
      synchronized(renderScriptLock) {
        val rs = renderScript(context)
        val input = Allocation.createFromBitmap(rs, tempBitmap)
        val output = Allocation.createTyped(rs, input.type)
        try {
          val script = blurScript(rs)
          script.setRadius((blurRadius * BLUR_SIGMA_SCALE).coerceIn(0.0001f, 25f))
          script.setInput(input)
          script.forEach(output)
          output.copyTo(blurred)
        } finally {
          input.destroy()
          output.destroy()
        }
      }

      // Tint the blurred result
      val result = pool.getBitmap(expandedW, expandedH, Bitmap.Config.ARGB_8888)
      result.eraseColor(Color.TRANSPARENT)
      val resultCanvas = Canvas(result)
      resultCanvas.drawBitmap(blurred, 0f, 0f, tintPaint)

      // Return temp bitmaps to pool
      pool.putBitmap(tempBitmap)
      pool.putBitmap(blurred)

      return result
    }

    private val renderScriptLock = Any()

    @Volatile
    private var sharedRenderScript: RenderScript? = null

    @Suppress("DEPRECATION")
    private var sharedBlurScript: ScriptIntrinsicBlur? = null

    /** One blur intrinsic per process; callers hold [renderScriptLock] because the script is not reentrant. */
    @Suppress("DEPRECATION")
    private fun blurScript(rs: RenderScript): ScriptIntrinsicBlur =
      sharedBlurScript ?: ScriptIntrinsicBlur.create(rs, Element.U8_4(rs)).also { sharedBlurScript = it }

    /**
     * One RenderScript context per process. Creating one per blur was the
     * dominant cost of cache misses (and of the legacy inset path before it
     * was cached). Thread-safe; first use may block on creation.
     */
    @Suppress("DEPRECATION")
    private fun renderScript(context: Context): RenderScript {
      sharedRenderScript?.let { return it }
      return synchronized(renderScriptLock) {
        sharedRenderScript
          ?: RenderScript.create(context.applicationContext).also { sharedRenderScript = it }
      }
    }

    /** ColorFilter effect mapping a white shape to [color], shared by both RenderNode paths. */
    @RequiresApi(Build.VERSION_CODES.S)
    private fun tintColorEffect(color: Int): RenderEffect =
      RenderEffect.createColorFilterEffect(
        ColorMatrixColorFilter(
          ColorMatrix(
            floatArrayOf(
              0f, 0f, 0f, 0f, Color.red(color).toFloat(),
              0f, 0f, 0f, 0f, Color.green(color).toFloat(),
              0f, 0f, 0f, 0f, Color.blue(color).toFloat(),
              0f, 0f, 0f, Color.alpha(color) / 255f, 0f,
            )
          )
        )
      )

    /**
     * Tint + blur effect for a shadow. RenderEffects are immutable and safe
     * to share across RenderNodes, so they are cached process-wide keyed by
     * (sigma, color) — this is what keeps resize-driven node rebuilds cheap.
     */
    @RequiresApi(Build.VERSION_CODES.S)
    internal fun shadowEffect(blurRadius: Float, color: Int): RenderEffect {
      val radius = blurRadius * BLUR_SIGMA_SCALE
      val key = 31L * java.lang.Float.floatToIntBits(radius) + color
      var effect = effectCache.get(key)
      if (effect == null) {
        val colorEffect = tintColorEffect(color)
        effect = if (blurRadius > 0f) {
          RenderEffect.createChainEffect(
            colorEffect,
            RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.DECAL),
          )
        } else {
          colorEffect
        }
        effectCache.put(key, effect)
      }
      return effect
    }

    private val effectCache = LruCache<Long, RenderEffect>(MAX_CACHED_EFFECTS)

    /**
     * Whether the RenderNode backend may draw to [canvas]. RENDER_NODE on a
     * software canvas falls back to the bitmap path (RenderEffect needs GPU).
     */
    internal fun useRenderNode(canvas: Canvas): Boolean {
      val mode = renderModeOverride ?: RenderMode.AUTO
      return mode != RenderMode.SOFTWARE &&
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
        canvas.isHardwareAccelerated
    }
  }

  fun invalidate() = release()

  /** Drop heavy bitmap/node references as soon as the owning view leaves the UI. */
  fun release() {
    cachedOutsetShadows = null
    cachedInsetShadows = null
    cachedOutsetList = null
    cachedInsetList = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      outsetShadowNodes = null
      insetShadowNodes = null
    }
    outsetKey.reset()
    insetKey.reset()
  }

  private fun radiiHash(borderRenderer: BorderRenderer): Int {
    if (!borderRenderer.hasRadii()) return 0
    val radii = borderRenderer.getRadii()
    var result = 1
    for (i in radii.indices) result = 31 * result + radii[i].toBits()
    return result
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

    if (useRenderNode(canvas)) {
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
    val radiiHash = radiiHash(borderRenderer)
    val shadowsHash = style.boxShadowsHash()
    if (outsetShadowNodes == null || !outsetKey.matches(width, height, shadowsHash, radiiHash)) {
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

        node.setRenderEffect(shadowEffect(shadow.blurRadius, shadow.color))

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
      outsetKey.store(width, height, shadowsHash, radiiHash)
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

    val radiiHash = radiiHash(borderRenderer)
    val shadowsHash = style.boxShadowsHash()
    if (cachedOutsetShadows == null || !outsetKey.matches(width, height, shadowsHash, radiiHash)) {
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
      outsetKey.store(width, height, shadowsHash, radiiHash)
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
    val shadows = style.boxShadows
    // Build inset list only when cache is dirty; reuse otherwise
    if (cachedInsetList == null || cachedInsetListHash != style.boxShadowsHash()) {
      val list = ArrayList<Shadow.BoxShadow>(shadows.size)
      for (i in shadows.indices) {
        val s = shadows[i]
        if (s.inset) list.add(s)
      }
      cachedInsetList = list
      cachedInsetListHash = style.boxShadowsHash()
    }
    val insetShadows = cachedInsetList!!
    if (insetShadows.isEmpty()) return

    val hasRadii = borderRenderer.hasRadii()

    // Clip to element bounds first
    canvas.withSave {
      if (hasRadii) {
        canvas.clipPath(borderRenderer.getClipPath(width, height))
      } else {
        canvas.clipRect(0f, 0f, width, height)
      }

      if (useRenderNode(canvas)) {
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
    val radiiHash = radiiHash(borderRenderer)
    val shadowsHash = style.boxShadowsHash()
    if (insetShadowNodes == null || !insetKey.matches(width, height, shadowsHash, radiiHash)) {
      cachedInsetShadows = null
      // For inset shadows, we draw the inverse - a frame that casts shadow
      // inward. The frame is recorded once and cached; the offset is baked
      // into node translation so drawing is a plain pass.
      val radii = if (borderRenderer.hasRadii()) borderRenderer.getRadii() else null

      val shapePaint = Paint().apply {
        style = Paint.Style.FILL
        isAntiAlias = true
        color = Color.WHITE
      }
      val shapeRect = RectF()
      val nodeRadii = FloatArray(8)
      val nodePath = Path()

      insetShadowNodes = shadows.withIndex().reversed().map { (index, shadow) ->
        val spread = shadow.spreadRadius
        val blurPad = ceil(shadow.blurRadius * 3f).toInt().coerceAtLeast(16)

        // Create outer frame bitmap (the shadow-casting shape)
        val frameW = width.toInt() + blurPad * 2
        val frameH = height.toInt() + blurPad * 2

        val shapeNode = RenderNode("insetShadow$index")
        shapeNode.setPosition(0, 0, frameW, frameH)
        val shapeCanvas = shapeNode.beginRecording()

        // Fill the entire frame
        shapeCanvas.drawRect(0f, 0f, frameW.toFloat(), frameH.toFloat(), shapePaint)

        // Cut out the inner area (where no shadow should appear)
        val innerRadii = if (radii != null) {
          for (i in 0 until 8) nodeRadii[i] = (radii[i] - spread).coerceAtLeast(0f)
          nodeRadii
        } else null

        shapeRect.set(
          blurPad + spread,
          blurPad + spread,
          blurPad + width - spread,
          blurPad + height - spread
        )

        shapePaint.xfermode = android.graphics.PorterDuffXfermode(PorterDuff.Mode.CLEAR)
        if (innerRadii != null) {
          nodePath.reset()
          nodePath.addRoundRect(shapeRect, innerRadii, Path.Direction.CW)
          shapeCanvas.drawPath(nodePath, shapePaint)
        } else {
          shapeCanvas.drawRect(shapeRect, shapePaint)
        }
        shapePaint.xfermode = null
        shapeNode.endRecording()

        val shadowNode = RenderNode("insetShadowFinal$index")
        shadowNode.setRenderEffect(shadowEffect(shadow.blurRadius, shadow.color))
        shadowNode.setPosition(0, 0, frameW, frameH)
        shadowNode.translationX = -blurPad + shadow.offsetX
        shadowNode.translationY = -blurPad + shadow.offsetY

        val shadowNodeCanvas = shadowNode.beginRecording()
        shadowNodeCanvas.drawRenderNode(shapeNode)
        shadowNode.endRecording()

        shadowNode
      }
      insetKey.store(width, height, shadowsHash, radiiHash)
    }

    // Cached order is reversed so the first CSS shadow draws on top
    insetShadowNodes?.asReversed()?.forEach { canvas.drawRenderNode(it) }
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

    val radiiHash = radiiHash(borderRenderer)
    val shadowsHash = style.boxShadowsHash()
    if (cachedInsetShadows == null || !insetKey.matches(width, height, shadowsHash, radiiHash)) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) insetShadowNodes = null
      val pool = CSSFilters.getPool(context)
      val entries = mutableListOf<ShadowBitmapEntry>()
      val hasRadii = borderRenderer.hasRadii()
      val radii = if (hasRadii) borderRenderer.getRadii() else null

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

        val innerRadii = if (radii != null) {
          for (i in 0 until 8) tmpRadii[i] = (radii[i] - spread).coerceAtLeast(0f)
          tmpRadii
        } else null

        // The cached bitmap does not depend on the offset (applied at draw
        // time), so offset stays out of the key and identical inset shadows
        // on different elements share one raster.
        val key = SharedBoxShadowCache.Key(
          SharedBoxShadowCache.floatBits(width),
          SharedBoxShadowCache.floatBits(height),
          innerRadii?.map(SharedBoxShadowCache::floatBits) ?: emptyList(),
          SharedBoxShadowCache.floatBits(shadow.blurRadius),
          SharedBoxShadowCache.floatBits(spread),
          shadow.color,
          SharedBoxShadowCache.floatBits(0f),
          SharedBoxShadowCache.floatBits(0f),
          context.resources.displayMetrics.densityDpi,
          SharedBoxShadowCache.floatBits(1f),
        )
        val shadowBitmap = SharedBoxShadowCache.get(key) ?: run {
          // Create frame bitmap with hole cut out
          val frameBitmap = pool.getBitmap(frameW, frameH, Bitmap.Config.ARGB_8888)
          frameBitmap.eraseColor(Color.TRANSPARENT)
          val frameCanvas = Canvas(frameBitmap)

          // Fill frame
          val shapePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = Color.WHITE
          }
          frameCanvas.drawRect(0f, 0f, frameW.toFloat(), frameH.toFloat(), shapePaint)

          // Cut out inner area
          val shapeRect = RectF(
            blurPad + spread,
            blurPad + spread,
            blurPad + width - spread,
            blurPad + height - spread
          )
          shapePaint.xfermode = android.graphics.PorterDuffXfermode(PorterDuff.Mode.CLEAR)
          if (innerRadii != null) {
            tmpPath.reset()
            tmpPath.addRoundRect(shapeRect, innerRadii, Path.Direction.CW)
            frameCanvas.drawPath(tmpPath, shapePaint)
          } else {
            frameCanvas.drawRect(shapeRect, shapePaint)
          }
          shapePaint.xfermode = null

          val rendered = createBlurredShadowBitmapRS(
            context, frameBitmap, shadow.blurRadius, shadow.color, pool
          )

          pool.putBitmap(frameBitmap)
          SharedBoxShadowCache.put(key, rendered)
          rendered
        }

        // Draw at offset
        val extraPad = ceil(shadow.blurRadius * 3f)
        entries.add(
          ShadowBitmapEntry(
            shadowBitmap,
            -blurPad - extraPad + shadow.offsetX,
            -blurPad - extraPad + shadow.offsetY,
            shadowBitmap.width.toFloat(),
            shadowBitmap.height.toFloat(),
          )
        )
      }

      cachedInsetShadows = entries
      insetKey.store(width, height, shadowsHash, radiiHash)
    }

    cachedInsetShadows?.forEach { entry ->
      canvas.drawBitmap(entry.bitmap, entry.drawX, entry.drawY, null)
    }
  }

}
