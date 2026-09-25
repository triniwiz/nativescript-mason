package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BlendMode
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.os.Build
import androidx.annotation.RequiresApi
import kotlin.math.ceil
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.Drawable
import android.util.Base64
import android.view.View
import androidx.core.graphics.PathParser
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import kotlin.math.hypot


// Reusable objects to avoid per-frame allocations in draw paths
private val gradientPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { isDither = true }
private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG)
private val bitmapDstRect = RectF()

private val IMAGE_REGEX = Regex("""url\(["']?(.*?)["']?\)""")
private val GRADIENT_REGEX = Regex("""(linear|radial)-gradient\(([\s\S]*)\)\s*;?""")
private val GRADIENT_DIRECTION_REGEX = Regex("""to .*""")
private val REPEAT_KEYS = listOf("repeat", "repeat-x", "repeat-y", "no-repeat")
private val WHITESPACE_REGEX = Regex("""\s+""")
private val COMMA_WHITESPACE_REGEX = Regex("""[\s,]+""")
private val POSITION_KEYS = listOf("top", "bottom", "left", "right", "center")
private val COLOR_KEYWORDS = listOf("red", "blue", "green", "black", "white", "yellow", "gray")
private val COLOR_REGEX = Regex("(?i)^#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})")
private val RGBA_REGEX =
  Regex(
    """rgba?\(\s*([^)]+)\s*\)""",
    RegexOption.IGNORE_CASE
  )
private val ANGLE_REGEX =
  Regex("""^-?\d+(\.\d+)?(deg|rad|turn|grad)$""")
private val SVG_DIMENSION_REGEX = Regex("""(?i)\b(width|height)=["']?([0-9.]+)""")
private val SVG_VIEWBOX_REGEX = Regex("""(?i)\bviewBox=["']?\s*([-0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)""")
private val SVG_FILL_REGEX = Regex("""(?i)\bfill=["']([^"']+)["']""")
private val SVG_FILL_OPACITY_REGEX = Regex("""(?i)\bfill-opacity=["']([0-9.]+)["']""")
private val SVG_PATH_REGEX = Regex("""(?i)<path\b[^>]*\bd=["']([^"']+)["'][^>]*/?>""")

/**
 * CSS pseudo-state specificity order.
 * Later entries override earlier ones when multiple states are active.
 * Matches CSS spec: :active overrides :focus overrides :hover.
 */
internal val PSEUDO_CSS_ORDER = arrayOf(
  PseudoState.HOVER, PseudoState.FOCUS, PseudoState.ACTIVE, PseudoState.DISABLED
)

enum class BackgroundClip(val css: String) {
  BORDER_BOX("border-box"), PADDING_BOX("padding-box"), CONTENT_BOX("content-box");

  companion object {
    fun parse(value: String): BackgroundClip? = entries.firstOrNull { it.css == value.trim().lowercase() }
  }
}

/** `background-origin` uses the same box keywords as `background-clip`. */
typealias BackgroundOrigin = BackgroundClip

enum class BackgroundAttachment(val css: String) {
  SCROLL("scroll"), FIXED("fixed"), LOCAL("local");

  companion object {
    fun parse(value: String): BackgroundAttachment? = entries.firstOrNull { it.css == value.trim().lowercase() }
  }
}

enum class BackgroundBlendMode(val css: String) {
  NORMAL("normal"), MULTIPLY("multiply"), SCREEN("screen"), OVERLAY("overlay"), DARKEN("darken"),
  LIGHTEN("lighten"), COLOR_DODGE("color-dodge"), COLOR_BURN("color-burn"), HARD_LIGHT("hard-light"),
  SOFT_LIGHT("soft-light"), DIFFERENCE("difference"), EXCLUSION("exclusion"), HUE("hue"),
  SATURATION("saturation"), COLOR("color"), LUMINOSITY("luminosity");

  companion object {
    fun parse(value: String): BackgroundBlendMode? = entries.firstOrNull { it.css == value.trim().lowercase() }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  fun toBlendMode(): BlendMode? = when (this) {
    NORMAL -> null
    MULTIPLY -> BlendMode.MULTIPLY
    SCREEN -> BlendMode.SCREEN
    OVERLAY -> BlendMode.OVERLAY
    DARKEN -> BlendMode.DARKEN
    LIGHTEN -> BlendMode.LIGHTEN
    COLOR_DODGE -> BlendMode.COLOR_DODGE
    COLOR_BURN -> BlendMode.COLOR_BURN
    HARD_LIGHT -> BlendMode.HARD_LIGHT
    SOFT_LIGHT -> BlendMode.SOFT_LIGHT
    DIFFERENCE -> BlendMode.DIFFERENCE
    EXCLUSION -> BlendMode.EXCLUSION
    HUE -> BlendMode.HUE
    SATURATION -> BlendMode.SATURATION
    COLOR -> BlendMode.COLOR
    LUMINOSITY -> BlendMode.LUMINOSITY
  }

  /** Pre-Q fallback: the modes PorterDuff matches exactly; the rest draw normally. */
  fun toPorterDuff(): PorterDuff.Mode? = when (this) {
    SCREEN -> PorterDuff.Mode.SCREEN
    OVERLAY -> PorterDuff.Mode.OVERLAY
    DARKEN -> PorterDuff.Mode.DARKEN
    LIGHTEN -> PorterDuff.Mode.LIGHTEN
    else -> null
  }

  fun apply(paint: Paint) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      paint.blendMode = toBlendMode()
    } else {
      paint.xfermode = toPorterDuff()?.let { PorterDuffXfermode(it) }
    }
  }

  fun clear(paint: Paint) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      paint.blendMode = null
    } else {
      paint.xfermode = null
    }
  }
}

/**
 * One axis of `background-position`: a fraction of the free space plus a
 * device-pixel offset, so `right 10px` is (1, -10 * scale).
 */
data class BackgroundOffset(var fraction: Float = 0f, var px: Float = 0f) {
  fun resolve(area: Float, drawSize: Float): Float = fraction * (area - drawSize) + px

  fun cssValue(horizontal: Boolean): String = when {
    px == 0f -> "${(fraction * 100f).toInt()}%"
    fraction == 0f -> "${(px / Mason.shared.scale).toInt()}px"
    fraction == 1f -> "${if (horizontal) "right" else "bottom"} ${(-px / Mason.shared.scale).toInt()}px"
    else -> "calc(${(fraction * 100f).toInt()}% + ${(px / Mason.shared.scale).toInt()}px)"
  }
}

data class BackgroundPosition(
  var x: BackgroundOffset = BackgroundOffset(),
  var y: BackgroundOffset = BackgroundOffset()
) {
  val cssValue: String get() = "${x.cssValue(true)} ${y.cssValue(false)}"
}

/** `background-size` for one axis: `auto`, a fraction of the area, or device px. */
data class BackgroundSize(var width: BackgroundOffset? = null, var height: BackgroundOffset? = null, var keyword: String? = null) {
  val cssValue: String
    get() = keyword ?: "${width?.cssValue(true) ?: "auto"} ${height?.cssValue(false) ?: "auto"}"
}

data class BackgroundLayer(
  var image: String? = null,             // URL or asset path
  var repeat: BackgroundRepeat = BackgroundRepeat.REPEAT,
  var position: BackgroundPosition? = null,
  var size: BackgroundSize? = null,
  var gradient: Gradient? = null,
  var shader: Shader? = null,
  // remember the dimensions used to create `shader`; if the view resizes we
  // need to invalidate the cache so the gradient scales correctly.  Without
  // this, a zero‑sized element (common during initial layout) would leave a
  // degenerate shader that never repaints when the real size arrives.
  var shaderWidth: Int = -1,
  var shaderHeight: Int = -1,
  var bitmap: Bitmap? = null,                  // cached image
  var clip: BackgroundClip = BackgroundClip.BORDER_BOX,
  var origin: BackgroundOrigin = BackgroundOrigin.PADDING_BOX,
  var attachment: BackgroundAttachment = BackgroundAttachment.SCROLL,
  var blendMode: BackgroundBlendMode = BackgroundBlendMode.NORMAL,
  /** Raster images are 1 image px = 1 CSS px; SVGs are rasterized at device scale already. */
  var bitmapIsDevicePx: Boolean = false,
  /** A color token seen in the shorthand; the last layer\'s becomes `Background.color`. */
  var layerColor: Int? = null
) {
  val isDefault: Boolean
    get() = image == null && gradient == null && position == null && size == null &&
      repeat == BackgroundRepeat.REPEAT && clip == BackgroundClip.BORDER_BOX &&
      origin == BackgroundOrigin.PADDING_BOX && attachment == BackgroundAttachment.SCROLL &&
      blendMode == BackgroundBlendMode.NORMAL
}

class Background(
  val style: Style
) {

  internal val bgPaint by lazy {
    Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.style = Paint.Style.FILL
      isDither = true
    }
  }

  var color: Int?
    set(value) {
      if (value == null) {
        style.values.put(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.INHERIT)
        style.values.putInt(StyleKeys.BACKGROUND_COLOR, 0)
        style.values.put(StyleKeys.BACKGROUND_COLOR_TYPE, 0)
        return
      }

      style.values.put(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
      style.values.putInt(StyleKeys.BACKGROUND_COLOR, value)
      style.values.put(StyleKeys.BACKGROUND_COLOR_TYPE, 1)
    }
    get() {
      val baseValue: Int =
        if (style.values.get(StyleKeys.BACKGROUND_COLOR_STATE) == StyleState.SET) {
          style.values.getInt(StyleKeys.BACKGROUND_COLOR)
        } else {
          0
        }

      return style.resolvePseudoInt(
        StyleKeys.BACKGROUND_COLOR,
        StyleKeys.BACKGROUND_COLOR_STATE,
        baseValue,
        StateKeys.BACKGROUND_COLOR
      )
    }

  var layers: MutableList<BackgroundLayer> = mutableListOf()

  private fun invalidateView() {
    (style.node.view as? android.view.View)?.invalidate()
  }

  // Per-layer longhands in the order they were set. Layers come only from
  // images/gradients, so a longhand set before the layers is kept and
  // reapplied when they arrive. Core applies the `background` shorthand after
  // the longhands whatever their declaration order, so it reapplies them too.
  internal val longhands = LinkedHashMap<String, String>()

  private fun setLonghand(name: String, value: String) {
    longhands.remove(name)
    // `background-position` resets both axes set by the -x/-y longhands.
    if (name == "position") {
      longhands.remove("position-x")
      longhands.remove("position-y")
    }
    longhands[name] = value
    applyLonghand(name, value)
    invalidateView()
  }

  /** Reapply the stored longhands after the layer list was rebuilt. */
  internal fun reapplyLonghands() {
    for ((name, value) in longhands) applyLonghand(name, value)
  }

  /** Apply a comma-separated per-layer list, repeating it cyclically as CSS does. */
  private fun applyLonghand(name: String, value: String) {
    val parts = splitLayers(value).map { it.trim() }.filter { it.isNotEmpty() }
    if (parts.isEmpty()) return
    layers.forEachIndexed { idx, layer ->
      val v = parts[idx % parts.size]
      when (name) {
        "repeat" -> layer.repeat = parseRepeat(v)
        "position" -> parsePosition(splitTopLevelWhitespace(v))?.let { layer.position = it }
        "position-x" -> parseAxisPosition(splitTopLevelWhitespace(v), horizontal = true)?.let {
          layer.position = (layer.position ?: BackgroundPosition()).copy(x = it)
        }
        "position-y" -> parseAxisPosition(splitTopLevelWhitespace(v), horizontal = false)?.let {
          layer.position = (layer.position ?: BackgroundPosition()).copy(y = it)
        }
        "size" -> parseSize(v)?.let { layer.size = it }
        "clip" -> BackgroundClip.parse(v)?.let { layer.clip = it }
        "origin" -> BackgroundOrigin.parse(v)?.let { layer.origin = it }
        "attachment" -> BackgroundAttachment.parse(v)?.let { layer.attachment = it }
        "blend-mode" -> BackgroundBlendMode.parse(v)?.let { layer.blendMode = it }
      }
    }
  }

  fun applyBackgroundRepeat(value: String) = setLonghand("repeat", value)
  fun applyBackgroundPosition(value: String) = setLonghand("position", value)
  fun applyBackgroundPositionX(value: String) = setLonghand("position-x", value)
  fun applyBackgroundPositionY(value: String) = setLonghand("position-y", value)
  fun applyBackgroundSize(value: String) = setLonghand("size", value)
  fun applyBackgroundClip(value: String) = setLonghand("clip", value)
  fun applyBackgroundOrigin(value: String) = setLonghand("origin", value)
  fun applyBackgroundAttachment(value: String) = setLonghand("attachment", value)
  fun applyBackgroundBlendMode(value: String) = setLonghand("blend-mode", value)

  fun hasLocalLayer(): Boolean = layers.any { it.attachment == BackgroundAttachment.LOCAL }

  companion object {
    /** Views that drew a `fixed` layer; a scroll repaints only these. Main thread only. */
    private val fixedViews = java.util.Collections.newSetFromMap(java.util.WeakHashMap<android.view.View, Boolean>())

    internal fun registerFixed(view: android.view.View) {
      fixedViews.add(view)
    }

    /** Invalidate the registered fixed-attachment views inside [root] after it scrolls. */
    fun invalidateFixedDescendants(root: android.view.ViewGroup) {
      if (fixedViews.isEmpty()) return
      val stale = ArrayList<android.view.View>()
      for (view in fixedViews) {
        val bg = (view as? Element)?.style?.mBackground
        if (bg == null || bg.layers.none { it.attachment == BackgroundAttachment.FIXED }) {
          stale.add(view)
          continue
        }
        var p = view.parent
        while (p != null && p !== root) p = p.parent
        if (p === root) view.invalidate()
      }
      fixedViews.removeAll(stale.toSet())
    }

    /**
     * The positioning area for a layer, in the coordinates the caller draws in
     * (viewport-anchored for `scroll`/`fixed`, content for `local`).
     */
    fun positioningArea(layer: BackgroundLayer, view: android.view.View, node: Node, width: Float, height: Float): RectF {
      val area = when (layer.attachment) {
        BackgroundAttachment.FIXED -> {
          val loc = IntArray(2)
          view.getLocationInWindow(loc)
          val root = view.rootView
          RectF(-loc[0].toFloat(), -loc[1].toFloat(), root.width - loc[0].toFloat(), root.height - loc[1].toFloat())
        }
        BackgroundAttachment.LOCAL -> {
          val content = localContentSize(view, width, height)
          RectF(0f, 0f, content.first, content.second)
        }
        BackgroundAttachment.SCROLL -> RectF(0f, 0f, width, height)
      }
      if (layer.attachment != BackgroundAttachment.FIXED) {
        when (layer.origin) {
          BackgroundOrigin.BORDER_BOX -> {}
          BackgroundOrigin.PADDING_BOX -> area.inset(node.computedBorderLeft, node.computedBorderTop, node.computedBorderRight, node.computedBorderBottom)
          BackgroundOrigin.CONTENT_BOX -> area.inset(
            node.computedBorderLeft + node.computedPaddingLeft,
            node.computedBorderTop + node.computedPaddingTop,
            node.computedBorderRight + node.computedPaddingRight,
            node.computedBorderBottom + node.computedPaddingBottom
          )
        }
      }
      return area
    }

    /** The whole scrollable border box of a scroll container, else the view box. */
    internal fun localContentSize(view: android.view.View, width: Float, height: Float): Pair<Float, Float> {
      val scroll = view as? TwoDScrollView ?: return width to height
      val w = scroll.scrollContentWidth + view.paddingLeft + view.paddingRight
      val h = scroll.scrollContentHeight + view.paddingTop + view.paddingBottom
      return maxOf(width, w.toFloat()) to maxOf(height, h.toFloat())
    }

    private fun RectF.inset(l: Float, t: Float, r: Float, b: Float) {
      left += l; top += t; right -= r; bottom -= b
    }
  }

  fun clear() {
    layers = mutableListOf()
    longhands.clear()
    color = null
  }
}

enum class BackgroundRepeat(val value: String) {
  REPEAT("repeat"), REPEAT_X("repeat-x"), REPEAT_Y("repeat-y"), NO_REPEAT("no-repeat")
}

data class Gradient(
  val type: String,             // linear or radial
  val direction: String?,       // e.g., "to bottom"
  val stops: List<String>,      // color stops
)

fun drawBackground(
  context: Context, view: View?, layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF
) {
  layer.gradient?.let { drawGradient(layer, canvas, paintRect, area, view) }

  layer.image?.let { imageUrl ->
    // Use cached bitmap if available
    layer.bitmap?.let { bitmap ->
      drawBitmapLayer(bitmap, layer, canvas, paintRect, area)
      return
    }

    decodeDataUrlBitmap(imageUrl, context.resources.displayMetrics.density)?.let { bitmap ->
      layer.bitmap = bitmap
      layer.bitmapIsDevicePx = imageUrl.startsWith("data:image/svg", ignoreCase = true)
      drawBitmapLayer(bitmap, layer, canvas, paintRect, area)
      return
    }

    // Load bitmap asynchronously
    Glide.with(context).asBitmap().load(imageUrl).into(object : CustomTarget<Bitmap>() {
      override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
        layer.bitmap = resource
        layer.bitmapIsDevicePx = false
        view?.invalidate()
      }

      override fun onLoadCleared(placeholder: Drawable?) {}
    })
  }
}

private fun decodeDataUrlBitmap(url: String, density: Float): Bitmap? {
  if (!url.startsWith("data:", ignoreCase = true)) return null
  val comma = url.indexOf(',')
  if (comma < 0) return null

  val meta = url.substring(5, comma).lowercase()
  val payload = url.substring(comma + 1)
  val bytes = try {
    if (meta.contains(";base64")) {
      Base64.decode(payload, Base64.DEFAULT)
    } else {
      URLDecoder.decode(payload, StandardCharsets.UTF_8.name()).toByteArray(StandardCharsets.UTF_8)
    }
  } catch (_: Throwable) {
    return null
  }

  return if (meta.startsWith("image/svg+xml")) {
    rasterizeSimpleSvg(String(bytes, StandardCharsets.UTF_8), density)
  } else {
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
  }
}

private fun rasterizeSimpleSvg(svg: String, density: Float): Bitmap? {
  val dimensions = SVG_DIMENSION_REGEX.findAll(svg)
    .associate { it.groupValues[1].lowercase() to it.groupValues[2].toFloatOrNull() }
  val viewBox = SVG_VIEWBOX_REGEX.find(svg)?.groupValues
  val vbX = viewBox?.getOrNull(1)?.toFloatOrNull() ?: 0f
  val vbY = viewBox?.getOrNull(2)?.toFloatOrNull() ?: 0f
  val vbW = viewBox?.getOrNull(3)?.toFloatOrNull() ?: dimensions["width"] ?: 0f
  val vbH = viewBox?.getOrNull(4)?.toFloatOrNull() ?: dimensions["height"] ?: 0f
  val width = ((dimensions["width"] ?: vbW) * density).toInt().coerceAtLeast(1)
  val height = ((dimensions["height"] ?: vbH) * density).toInt().coerceAtLeast(1)
  if (vbW <= 0f || vbH <= 0f) return null

  val fill = SVG_FILL_REGEX.find(svg)?.groupValues?.getOrNull(1)
  val color = parseColor(fill ?: "#000") ?: Color.BLACK
  val opacity = SVG_FILL_OPACITY_REGEX.find(svg)?.groupValues?.getOrNull(1)?.toFloatOrNull()
    ?.coerceIn(0f, 1f) ?: (Color.alpha(color) / 255f)

  val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).apply {
    setHasAlpha(true)
    eraseColor(Color.TRANSPARENT)
  }
  val canvas = Canvas(bitmap)
  val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.FILL
    this.color = color
    alpha = (opacity * 255f).toInt().coerceIn(0, 255)
  }

  val matrix = Matrix().apply {
    postTranslate(-vbX, -vbY)
    postScale(width / vbW, height / vbH)
  }

  var drewPath = false
  SVG_PATH_REGEX.findAll(svg).forEach { match ->
    val data = match.groupValues[1]
    val path = try {
      PathParser.createPathFromPathData(data)
    } catch (_: Throwable) {
      null
    } ?: return@forEach
    path.transform(matrix)
    canvas.drawPath(path, paint)
    drewPath = true
  }

  return if (drewPath) bitmap else null
}

fun drawGradient(layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF, view: View? = null) {
  val gradient = layer.gradient ?: return
  // A gradient is an image with no intrinsic size: `auto` is the positioning area.
  val (tileW, tileH) = resolveBitmapSize(layer.size, area.width(), area.height(), area.width(), area.height())
  val width = tileW.toInt()
  val height = tileH.toInt()
  if (width <= 0 || height <= 0) return

  // invalidate cached shader if size has changed; without this the first draw
  // (which often happens at 0x0) would create a degenerate shader that never
  // updates when the view finally gets a proper size.
  if (layer.shader != null &&
    (layer.shaderWidth != width || layer.shaderHeight != height)
  ) {
    layer.shader = null
  }

  if (layer.shader == null) {
    // Parse color stops: each stop can be "color position" or just "color"
    val stopCount = gradient.stops.size
    val colorsArray = IntArray(stopCount)
    val positionsArray = FloatArray(stopCount)
    val maxIndex = (stopCount - 1).coerceAtLeast(1)

    for (index in 0 until stopCount) {
      val trimmed = gradient.stops[index].trim()
      // Find the last space that separates color from position
      val lastSpace = trimmed.lastIndexOf(' ')

      if (lastSpace > 0) {
        val colorPart = trimmed.substring(0, lastSpace)
        val posPart = trimmed.substring(lastSpace + 1).trim()

        colorsArray[index] = parseColor(colorPart) ?: Color.TRANSPARENT

        // Parse position: can be "0", "50%", "100%", etc.
        val posValue = posPart.trimEnd('%')
        val pos = posValue.toFloatOrNull()
        if (pos != null) {
          val normalizedPos = when {
            posPart.endsWith('%') -> pos / 100f
            pos <= 1f -> pos
            else -> pos / 100f
          }
          positionsArray[index] = normalizedPos.coerceIn(0f, 1f)
        } else {
          positionsArray[index] = index.toFloat() / maxIndex
        }
      } else {
        colorsArray[index] = parseColor(trimmed) ?: Color.TRANSPARENT
        positionsArray[index] = index.toFloat() / maxIndex
      }
    }

    // Ensure we have valid colors and positions
    if (colorsArray.isEmpty()) return

    layer.shader = when (gradient.type.lowercase()) {
      "linear" -> {
        val ep = resolveLinearGradientEndpoints(
          gradient.direction, width.toFloat(), height.toFloat()
        )
        LinearGradient(ep[0], ep[1], ep[2], ep[3], colorsArray, positionsArray, Shader.TileMode.CLAMP)
      }

      "radial" -> {
        val (cx, cy) = resolveRadialGradientCenter(gradient.direction, width.toFloat(), height.toFloat())
        // Radius must reach the farthest corner from the resolved centre.
        val radius = maxOf(
          hypot((cx).toDouble(), (cy).toDouble()),
          hypot((width - cx).toDouble(), (cy).toDouble()),
          hypot((cx).toDouble(), (height - cy).toDouble()),
          hypot((width - cx).toDouble(), (height - cy).toDouble())
        ).toFloat().coerceAtLeast(1f)
        RadialGradient(
          cx, cy, radius, colorsArray, positionsArray, Shader.TileMode.CLAMP
        )
      }

      else -> null
    }

    // remember the size used to create this shader
    layer.shaderWidth = width
    layer.shaderHeight = height

    // A freshly (re)built gradient Shader can miss painting on the very draw
    // call that creates it — e.g. a deeply nested scroll child whose first
    // real-size onDraw races the GPU texture upload for the new Shader.
    // Solid-color fills need no texture upload so they never hit this; a
    // gradient does, and without a follow-up invalidate it stays blank until
    // something else (scroll, rotation) forces a redraw. Schedule one
    // guaranteed extra draw pass so the shader is actually visible.
    if (width > 0 && height > 0) {
      view?.postInvalidateOnAnimation()
    }
  }

  // Fail-safe: if no shader could be built (e.g. an unrecognised gradient type
  // after a re-parse on rotation), do NOT fill — gradientPaint is shared and its
  // fallback colour is opaque black, which would paint a solid black box.
  if (layer.shader == null) return
  gradientPaint.shader = layer.shader
  layer.blendMode.apply(gradientPaint)
  forEachTile(layer, paintRect, area, tileW, tileH) { x, y ->
    val save = canvas.save()
    canvas.translate(x, y)
    canvas.drawRect(0f, 0f, tileW, tileH, gradientPaint)
    canvas.restoreToCount(save)
  }
  layer.blendMode.clear(gradientPaint)
}

/** Visit each tile origin of a `drawW`x`drawH` image placed and repeated per the layer. */
private inline fun forEachTile(layer: BackgroundLayer, paintRect: RectF, area: RectF, drawW: Float, drawH: Float, draw: (Float, Float) -> Unit) {
  val pos = layer.position
  val x = area.left + (pos?.x?.resolve(area.width(), drawW) ?: 0f)
  val y = area.top + (pos?.y?.resolve(area.height(), drawH) ?: 0f)
  val repeatX = layer.repeat == BackgroundRepeat.REPEAT || layer.repeat == BackgroundRepeat.REPEAT_X
  val repeatY = layer.repeat == BackgroundRepeat.REPEAT || layer.repeat == BackgroundRepeat.REPEAT_Y
  // Tiles start at the resolved position and extend both ways across the paint rect.
  val startX = if (repeatX) x - ceil((x - paintRect.left) / drawW) * drawW else x
  val startY = if (repeatY) y - ceil((y - paintRect.top) / drawH) * drawH else y
  val endX = if (repeatX) paintRect.right else x + 1f
  val endY = if (repeatY) paintRect.bottom else y + 1f
  var py = startY
  while (py < endY) {
    var px = startX
    while (px < endX) {
      draw(px, py)
      px += drawW
    }
    py += drawH
  }
}

/**
 * Resolve linear-gradient endpoints for the given direction string and box size.
 * Supports CSS angle values (deg, rad, turn, grad), named directions
 * ("to bottom", "to top right", etc.), and falls back to top-to-bottom (180deg).
 */
// Reusable array for gradient endpoint calculations (avoids List<Float> boxing)
private val gradientEndpoints = FloatArray(4)

private fun resolveLinearGradientEndpoints(
  direction: String?,
  width: Float,
  height: Float
): FloatArray {
  val ep = gradientEndpoints
  val dir = direction?.trim()?.lowercase()
  if (dir == null) { ep[0] = 0f; ep[1] = 0f; ep[2] = 0f; ep[3] = height; return ep }

  // Named directions
  when (dir) {
    "to bottom"                        -> { ep[0] = 0f;    ep[1] = 0f;     ep[2] = 0f;    ep[3] = height; return ep }
    "to top"                           -> { ep[0] = 0f;    ep[1] = height; ep[2] = 0f;    ep[3] = 0f;     return ep }
    "to right"                         -> { ep[0] = 0f;    ep[1] = 0f;     ep[2] = width; ep[3] = 0f;     return ep }
    "to left"                          -> { ep[0] = width; ep[1] = 0f;     ep[2] = 0f;    ep[3] = 0f;     return ep }
    "to bottom right", "to right bottom" -> { ep[0] = 0f;    ep[1] = 0f;     ep[2] = width; ep[3] = height; return ep }
    "to bottom left", "to left bottom" -> { ep[0] = width; ep[1] = 0f;     ep[2] = 0f;    ep[3] = height; return ep }
    "to top right", "to right top"     -> { ep[0] = 0f;    ep[1] = height; ep[2] = width; ep[3] = 0f;     return ep }
    "to top left", "to left top"       -> { ep[0] = width; ep[1] = height; ep[2] = 0f;    ep[3] = 0f;     return ep }
  }

  // Try to parse as an angle
  val angleRad = parseCssAngleToRadians(dir)
  if (angleRad != null) {
    val centerX = width / 2f
    val centerY = height / 2f
    val sinA = kotlin.math.sin(angleRad).toFloat()
    val cosA = kotlin.math.cos(angleRad).toFloat()
    val halfLen = (kotlin.math.abs(width * sinA) + kotlin.math.abs(height * cosA)) / 2f
    ep[0] = centerX - halfLen * sinA
    ep[1] = centerY + halfLen * cosA
    ep[2] = centerX + halfLen * sinA
    ep[3] = centerY - halfLen * cosA
    return ep
  }

  // Fallback: top-to-bottom (CSS default)
  ep[0] = 0f; ep[1] = 0f; ep[2] = 0f; ep[3] = height
  return ep
}

/**
 * Parse a CSS angle string (e.g. "135deg", "0.75turn", "1.5rad", "200grad")
 * to radians. Returns null if the string cannot be parsed.
 */
private fun parseCssAngleToRadians(value: String): Double? {
  val v = value.trim().lowercase()
  return when {
    v.endsWith("deg") -> v.removeSuffix("deg").toDoubleOrNull()
      ?.let { it * Math.PI / 180.0 }

    v.endsWith("grad") -> v.removeSuffix("grad").toDoubleOrNull()
      ?.let { it * Math.PI / 200.0 }

    v.endsWith("turn") -> v.removeSuffix("turn").toDoubleOrNull()
      ?.let { it * 2.0 * Math.PI }

    v.endsWith("rad") -> v.removeSuffix("rad").toDoubleOrNull()
    else -> null
  }
}

/**
 * Resolve the centre point of a radial-gradient from the CSS direction string.
 *
 * Accepted formats include:
 *   "circle at top left", "ellipse at 30% 70%", "at center", "circle", etc.
 *
 * When no position is given the default is the element centre (50% 50%).
 */
private fun resolveRadialGradientCenter(
  direction: String?,
  width: Float,
  height: Float
): Pair<Float, Float> {
  val defaultCenter = Pair(width / 2f, height / 2f)
  val dir = direction?.trim()?.lowercase() ?: return defaultCenter

  // Extract the position portion after "at "
  val atIndex = dir.indexOf(" at ")
  val positionStr = if (atIndex >= 0) dir.substring(atIndex + 4).trim() else return defaultCenter
  if (positionStr.isEmpty()) return defaultCenter

  return resolvePositionKeywords(positionStr, width, height)
}

/**
 * Convert a CSS background-position value (keyword or percentage based) to
 * absolute pixel coordinates.
 *
 * Supports: named keywords (top, bottom, left, right, center) and percentage
 * values (e.g. "30%" or "30% 70%").
 */
private fun resolvePositionKeywords(
  position: String,
  width: Float,
  height: Float
): Pair<Float, Float> {
  val parts = position.split(Regex("\\s+"))

  fun resolveToken(token: String, horizontal: Boolean): Float {
    return when (token) {
      "left" -> 0f
      "right" -> width
      "top" -> 0f
      "bottom" -> height
      "center" -> if (horizontal) width / 2f else height / 2f
      else -> {
        if (token.endsWith("%")) {
          val pct = token.removeSuffix("%").toFloatOrNull() ?: 50f
          if (horizontal) pct / 100f * width else pct / 100f * height
        } else {
          val num = token.removeSuffix("px").toFloatOrNull()
          if (num != null) num * Mason.shared.scale
          else if (horizontal) width / 2f else height / 2f
        }
      }
    }
  }

  return when (parts.size) {
    1 -> {
      val x = resolveToken(parts[0], horizontal = true)
      val y = when (parts[0]) {
        "top" -> 0f
        "bottom" -> height
        // Single keyword like "center", "left", "right" → y defaults to 50%
        else -> height / 2f
      }
      // For "top"/"bottom" used alone, x defaults to center
      val finalX = when (parts[0]) {
        "top", "bottom" -> width / 2f
        else -> x
      }
      Pair(finalX, y)
    }
    else -> Pair(
      resolveToken(parts[0], horizontal = true),
      resolveToken(parts[1], horizontal = false)
    )
  }
}

private fun drawBitmapLayer(
  bitmap: Bitmap, layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF
) {
  val areaW = area.width()
  val areaH = area.height()
  val imgScale = if (layer.bitmapIsDevicePx) 1f else Mason.shared.scale
  val (drawWidth, drawHeight) = resolveBitmapSize(layer.size, bitmap.width * imgScale, bitmap.height * imgScale, areaW, areaH)
  if (drawWidth <= 0f || drawHeight <= 0f) return

  // Reuse cached RectF and Paint to avoid per-tile allocations
  val dst = bitmapDstRect
  val paint = bitmapPaint
  layer.blendMode.apply(paint)
  forEachTile(layer, paintRect, area, drawWidth, drawHeight) { px, py ->
    dst.set(px, py, px + drawWidth, py + drawHeight)
    canvas.drawBitmap(bitmap, null, dst, paint)
  }
  layer.blendMode.clear(paint)
}

/** Resolve `background-size` against the positioning area, keeping the image ratio for `auto`. */
internal fun resolveBitmapSize(size: BackgroundSize?, imgW: Float, imgH: Float, areaW: Float, areaH: Float): Pair<Float, Float> {
  if (size == null) return imgW to imgH
  val ratio = if (imgH > 0f) imgW / imgH else 1f
  when (size.keyword) {
    "cover" -> {
      val scale = maxOf(areaW / imgW, areaH / imgH)
      return imgW * scale to imgH * scale
    }
    "contain" -> {
      val scale = minOf(areaW / imgW, areaH / imgH)
      return imgW * scale to imgH * scale
    }
  }
  val w = size.width?.let { it.fraction * areaW + it.px }
  val h = size.height?.let { it.fraction * areaH + it.px }
  return when {
    w != null && h != null -> w to h
    w != null -> w to w / ratio
    h != null -> h * ratio to h
    else -> imgW to imgH
  }
}

fun parseHexColor(hex: String): Int? {
  // extract a leading hex token like "#FFF", "#FFFF", "#RRGGBB" or "#RRGGBBAA"
  val match = COLOR_REGEX.find(hex.trim())
  val token = match?.value ?: return null
  val s = token.removePrefix("#")
  val len = s.length

  fun hexCharToInt(c: Char): Int = when (c) {
    in '0'..'9' -> c - '0'
    in 'a'..'f' -> c - 'a' + 10
    in 'A'..'F' -> c - 'A' + 10
    else -> -1
  }

  fun twoChar(c1: Char, c2: Char): Int {
    val hi = hexCharToInt(c1)
    val lo = hexCharToInt(c2)
    if (hi == -1 || lo == -1) return -1
    return (hi shl 4) or lo
  }

  return when (len) {
    3 -> { // RGB, alpha=255
      val r = hexCharToInt(s[0])
      val g = hexCharToInt(s[1])
      val b = hexCharToInt(s[2])
      if (r == -1 || g == -1 || b == -1) return null
      (255 shl 24) or ((r shl 4 or r) shl 16) or ((g shl 4 or g) shl 8) or (b shl 4 or b)
    }

    4 -> { // RGBA
      val r = hexCharToInt(s[0])
      val g = hexCharToInt(s[1])
      val b = hexCharToInt(s[2])
      val a = hexCharToInt(s[3])
      if (r == -1 || g == -1 || b == -1 || a == -1) return null
      ((a shl 4 or a) shl 24) or ((r shl 4 or r) shl 16) or ((g shl 4 or g) shl 8) or (b shl 4 or b)
    }

    6 -> { // RRGGBB, alpha=255
      val r = twoChar(s[0], s[1])
      val g = twoChar(s[2], s[3])
      val b = twoChar(s[4], s[5])
      if (r == -1 || g == -1 || b == -1) return null
      (255 shl 24) or (r shl 16) or (g shl 8) or b
    }

    8 -> { // RRGGBBAA
      val r = twoChar(s[0], s[1])
      val g = twoChar(s[2], s[3])
      val b = twoChar(s[4], s[5])
      val a = twoChar(s[6], s[7])
      if (r == -1 || g == -1 || b == -1 || a == -1) return null
      (a shl 24) or (r shl 16) or (g shl 8) or b
    }

    else -> null
  }
}

private fun parseColorChannel(token: String): Int? {
  val t = token.trim()

  return when {
    t.endsWith("%") -> {
      val v = t.dropLast(1).toFloatOrNull() ?: return null
      ((v.coerceIn(0f, 100f) / 100f) * 255f).toInt()
    }

    else -> {
      val v = t.toFloatOrNull() ?: return null
      v.coerceIn(0f, 255f).toInt()
    }
  }
}

private fun parseAlpha(token: String?): Int {
  if (token == null) return 255

  val t = token.trim()

  val alpha = when {
    t.endsWith("%") -> {
      val v = t.dropLast(1).toFloatOrNull() ?: return 255
      v.coerceIn(0f, 100f) / 100f
    }

    else -> {
      val v = t.toFloatOrNull() ?: return 255
      v.coerceIn(0f, 1f)
    }
  }

  return (alpha * 255f).toInt()
}

fun parseRgbColor(input: String): Int? {
  val match = RGBA_REGEX.find(input.trim()) ?: return null
  val body = match.groupValues[1]

  val (rgbPart, alphaPart) =
    if (body.contains('/')) {
      val parts = body.split('/', limit = 2)
      parts[0] to parts[1]
    } else {
      body to null
    }

  val components = rgbPart
    .trim()
    .split(COMMA_WHITESPACE_REGEX)
    .filter { it.isNotEmpty() }

  return when (components.size) {
    3 -> {
      val r = parseColorChannel(components[0]) ?: return null
      val g = parseColorChannel(components[1]) ?: return null
      val b = parseColorChannel(components[2]) ?: return null
      val a = parseAlpha(alphaPart)
      (a shl 24) or (r shl 16) or (g shl 8) or b
    }

    4 -> {
      // Legacy rgba(r, g, b, a) comma-separated format
      val r = parseColorChannel(components[0]) ?: return null
      val g = parseColorChannel(components[1]) ?: return null
      val b = parseColorChannel(components[2]) ?: return null
      val a = if (alphaPart != null) parseAlpha(alphaPart) else parseAlpha(components[3])
      (a shl 24) or (r shl 16) or (g shl 8) or b
    }

    else -> null
  }
}

fun parseColor(value: String): Int? {
  return try {
    val color = value.trim().trimEnd(';')
    COLOR_MAP[color.lowercase()]?.let { return it }
    parseHexColor(color) ?: parseRgbColor(color)
  } catch (_: Exception) {
    null
  }
}

fun parseRepeat(value: String): BackgroundRepeat = when (value.lowercase()) {
  "repeat" -> BackgroundRepeat.REPEAT
  "repeat-x" -> BackgroundRepeat.REPEAT_X
  "repeat-y" -> BackgroundRepeat.REPEAT_Y
  else -> BackgroundRepeat.NO_REPEAT
}

/** One `<length>` or `<percentage>` of a background position/size, or null. */
private fun parseBackgroundLength(token: String): BackgroundOffset? {
  val t = token.trim().lowercase()
  if (t.endsWith("%")) {
    return t.dropLast(1).toFloatOrNull()?.let { BackgroundOffset(it / 100f, 0f) }
  }
  val match = lengthPercentageRegex.matchEntire(t) ?: return null
  val num = match.groupValues[1].toFloatOrNull() ?: return null
  val unit = match.groupValues.getOrNull(2)
  val px = if (unit == "dppx") num else cssPxForUnit(num, unit, null) * Mason.shared.scale
  return BackgroundOffset(0f, px)
}

private fun isHorizontalKeyword(t: String) = t == "left" || t == "right"
private fun isVerticalKeyword(t: String) = t == "top" || t == "bottom"

private fun keywordOffset(t: String): BackgroundOffset? = when (t) {
  "left", "top" -> BackgroundOffset(0f, 0f)
  "center" -> BackgroundOffset(0.5f, 0f)
  "right", "bottom" -> BackgroundOffset(1f, 0f)
  else -> null
}

/** `background-position-x`/`-y`: a keyword, a length, or `<edge> <offset>`. */
fun parseAxisPosition(parts: List<String>, horizontal: Boolean): BackgroundOffset? {
  val tokens = parts.map { it.trim().lowercase() }.filter { it.isNotEmpty() }
  if (tokens.isEmpty()) return null
  val first = tokens[0]
  val edgeOk = if (horizontal) isHorizontalKeyword(first) || first == "center" else isVerticalKeyword(first) || first == "center"
  if (tokens.size == 1) {
    return if (edgeOk) keywordOffset(first) else parseBackgroundLength(first)
  }
  if (tokens.size == 2 && edgeOk && first != "center") {
    val offset = parseBackgroundLength(tokens[1]) ?: return null
    val edge = keywordOffset(first)!!
    // `right 10px` means 10px in from the right: a negative device offset.
    return if (edge.fraction == 1f) BackgroundOffset(1f - offset.fraction, -offset.px) else offset
  }
  return null
}

/** CSS `background-position` with the 1-, 2-, 3- and 4-value syntaxes. */
fun parsePosition(parts: List<String>): BackgroundPosition? {
  val tokens = parts.map { it.trim().lowercase() }.filter { it.isNotEmpty() }
  if (tokens.isEmpty() || tokens.size > 4) return null
  when (tokens.size) {
    1 -> {
      val t = tokens[0]
      return when {
        isVerticalKeyword(t) -> BackgroundPosition(BackgroundOffset(0.5f), keywordOffset(t)!!)
        else -> BackgroundPosition(
          keywordOffset(t) ?: parseBackgroundLength(t) ?: return null,
          BackgroundOffset(0.5f)
        )
      }
    }
    2 -> {
      var a = tokens[0]
      var b = tokens[1]
      // `top left` is legal: keywords may swap axes, lengths may not.
      if (isVerticalKeyword(a) || isHorizontalKeyword(b)) {
        val tmp = a; a = b; b = tmp
      }
      val x = keywordOffset(a)?.takeIf { !isVerticalKeyword(a) } ?: parseBackgroundLength(a) ?: return null
      val y = keywordOffset(b)?.takeIf { !isHorizontalKeyword(b) } ?: parseBackgroundLength(b) ?: return null
      return BackgroundPosition(x, y)
    }
    else -> {
      // 3/4-value: edge keywords each optionally followed by an offset.
      var x: BackgroundOffset? = null
      var y: BackgroundOffset? = null
      var i = 0
      while (i < tokens.size) {
        val kw = tokens[i]
        val offset = tokens.getOrNull(i + 1)?.let { parseBackgroundLength(it) }
        val pair = if (offset != null) listOf(kw, tokens[i + 1]) else listOf(kw)
        when {
          isHorizontalKeyword(kw) || (kw == "center" && x == null && !isVerticalKeyword(tokens.getOrNull(i + 1) ?: "")) ->
            x = parseAxisPosition(pair, horizontal = true) ?: return null
          isVerticalKeyword(kw) || kw == "center" ->
            y = parseAxisPosition(pair, horizontal = false) ?: return null
          else -> return null
        }
        i += pair.size
      }
      return BackgroundPosition(x ?: BackgroundOffset(0.5f), y ?: BackgroundOffset(0.5f))
    }
  }
}

fun parseSize(value: String): BackgroundSize? {
  val s = value.trim().lowercase()
  return when (s) {
    "cover", "contain" -> BackgroundSize(keyword = s)
    "auto", "auto auto" -> BackgroundSize()
    else -> {
      val tokens = s.split(WHITESPACE_REGEX)
      if (tokens.isEmpty() || tokens.size > 2) return null
      val w = if (tokens[0] == "auto") null else parseBackgroundLength(tokens[0]) ?: return null
      val h = tokens.getOrNull(1)?.let { if (it == "auto") null else parseBackgroundLength(it) ?: return null }
      BackgroundSize(w, h)
    }
  }
}

fun splitTopLevelCommas(input: String): List<String> {
  val result = mutableListOf<String>()
  val current = StringBuilder()
  var depth = 0

  for (c in input) {
    when (c) {
      '(' -> {
        depth++
        current.append(c)
      }

      ')' -> {
        depth--
        current.append(c)
      }

      ',' -> {
        if (depth == 0) {
          result += current.toString()
          current.setLength(0)
        } else {
          current.append(c)
        }
      }

      else -> current.append(c)
    }
  }

  if (current.isNotEmpty()) {
    result += current.toString()
  }

  return result
}

private fun isAngleOrDirection(token: String): Boolean {
  val v = token.trim().lowercase()

  if (ANGLE_REGEX.matches(v)) return true

  if (v.startsWith("to ")) {
    val parts = v.removePrefix("to ").split(WHITESPACE_REGEX)
    return parts.all {
      it == "top" || it == "bottom" || it == "left" || it == "right"
    }
  }

  // Handle radial gradient shape/position: e.g., "ellipse at center", "circle at top left"
  if (v.contains(" at ")) {
    val beforeAt = v.substringBefore(" at ").trim()
    // Check if it starts with a shape keyword or size keyword
    val shapeKeywords = listOf("circle", "ellipse")
    val sizeKeywords = listOf("closest-side", "closest-corner", "farthest-side", "farthest-corner")
    val parts = beforeAt.split(WHITESPACE_REGEX)
    if (parts.any { it in shapeKeywords || it in sizeKeywords } || beforeAt.isEmpty()) {
      return true
    }
  }

  // Handle standalone shape keywords: "circle", "ellipse"
  if (v == "circle" || v == "ellipse") {
    return true
  }

  return false
}

fun parseGradient(part: String): Gradient? {
  val match = GRADIENT_REGEX.find(part) ?: return null
  val type = match.groupValues[1]
  val content = match.groupValues[2].trim()

  // split on top-level commas so color functions (eg rgba()) are kept intact
  val items = splitTopLevelCommas(content).filter { it.isNotEmpty() }

  if (items.isEmpty()) return null

  val first = items.first()
  val direction = if (isAngleOrDirection(first)) first.trim() else null
  val stops = if (direction != null) items.drop(1) else items

  return Gradient(type, direction, stops.map { it.trim() })
}

/** Layers with only author-visible content (drops color-only and empty layers). */
fun parseBackgroundLayers(css: String): List<BackgroundLayer> = parseRawBackgroundLayers(css).filter { !it.isDefault }

private fun parseRawBackgroundLayers(css: String): List<BackgroundLayer> {
  val layers = mutableListOf<BackgroundLayer>()
  var depth = 0
  var start = 0

  // Split top-level commas only (ignore commas inside parentheses)
  css.forEachIndexed { i, c ->
    when (c) {
      '(' -> depth++
      ')' -> depth--
      ',' -> if (depth == 0) {
        layers.add(parseLayer(css.substring(start, i)))
        start = i + 1
      }
    }
  }
  layers.add(parseLayer(css.substring(start)))

  return layers
}

private val BOX_KEYWORDS = listOf("border-box", "padding-box", "content-box")
private val ATTACHMENT_KEYWORDS = listOf("scroll", "fixed", "local")

/**
 * One comma-separated layer of the `background` shorthand: image, gradient,
 * repeat, attachment, position [/ size] and up to two box keywords (origin,
 * then clip). A color token is kept on `layerColor` for the shorthand's
 * final layer.
 */
fun parseLayer(layerValue: String): BackgroundLayer {
  val layer = BackgroundLayer()
  var value = layerValue.trim()

  // Image URL first: its contents must not be tokenized.
  IMAGE_REGEX.find(value)?.let { match ->
    layer.image = match.groups[1]?.value
    value = value.removeRange(match.range).trim()
  }

  // Gradient: the function consumes its own parentheses, the rest are tokens.
  GRADIENT_REGEX.find(value)?.let { match ->
    val paren = value.indexOf('(', match.range.first)
    var depth = 0
    var end = paren
    while (end < value.length) {
      when (value[end]) {
        '(' -> depth++
        ')' -> { depth--; if (depth == 0) break }
      }
      end++
    }
    val gradientText = value.substring(match.range.first, minOf(end + 1, value.length))
    layer.gradient = parseGradient(gradientText)
    value = (value.substring(0, match.range.first) + " " + value.substring(minOf(end + 1, value.length))).trim()
  }

  val tokens = splitTopLevelWhitespace(value).filter { it.isNotBlank() }
  val boxes = mutableListOf<BackgroundClip>()
  val positionTokens = mutableListOf<String>()
  val sizeTokens = mutableListOf<String>()
  var afterSlash = false
  for (raw in tokens) {
    val t = raw.lowercase()
    // A '/' inside a function (rgb(0 0 0 / 50%)) is not the position/size separator.
    val bareSlash = !t.contains('(')
    when {
      !bareSlash -> parseColor(raw)?.let { layer.layerColor = it }
      t == "/" -> afterSlash = true
      t.startsWith("/") -> { afterSlash = true; sizeTokens.add(t.substring(1)) }
      t.endsWith("/") -> { positionTokens.add(t.dropLast(1)); afterSlash = true }
      t.contains("/") -> {
        val (p, sz) = t.split("/", limit = 2)
        positionTokens.add(p); sizeTokens.add(sz); afterSlash = true
      }
      afterSlash && (t == "auto" || t == "cover" || t == "contain" || parseBackgroundLength(t) != null) -> sizeTokens.add(t)
      t in REPEAT_KEYS -> layer.repeat = parseRepeat(t)
      t in ATTACHMENT_KEYWORDS -> BackgroundAttachment.parse(t)?.let {
        layer.attachment = it
      }
      t in BOX_KEYWORDS -> BackgroundClip.parse(t)?.let { boxes.add(it) }
      t in POSITION_KEYS || parseBackgroundLength(t) != null -> { afterSlash = false; positionTokens.add(t) }
      else -> parseColor(raw)?.let { layer.layerColor = it }
    }
  }
  if (positionTokens.isNotEmpty()) layer.position = parsePosition(positionTokens)
  if (sizeTokens.isNotEmpty()) layer.size = parseSize(sizeTokens.joinToString(" "))
  if (boxes.size == 1) {
    layer.origin = boxes[0]
    layer.clip = boxes[0]
  } else if (boxes.size >= 2) {
    layer.origin = boxes[0]
    layer.clip = boxes[1]
  }

  return layer
}

fun splitLayers(css: String): List<String> {
  val layers = mutableListOf<String>()
  var depth = 0
  var start = 0
  css.forEachIndexed { i, c ->
    when (c) {
      '(' -> depth++
      ')' -> depth--
      ',' -> if (depth == 0) {
        layers.add(css.substring(start, i))
        start = i + 1
      }
    }
  }
  layers.add(css.substring(start))
  return layers
}

fun parseBackground(style: Style, css: String): Background? {
  val bg = Background(style)

  val layers = parseRawBackgroundLayers(css)

  // The shorthand's color lives on its last layer; without one it resets.
  bg.color = layers.lastOrNull()?.layerColor

  bg.layers.addAll(layers.filter { !it.isDefault })

  return bg
}
