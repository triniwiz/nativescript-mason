package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BlendMode
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.os.Build
import androidx.annotation.RequiresApi
import kotlin.math.ceil
import kotlin.math.floor
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.ColorMatrixColorFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.DashPathEffect
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.SweepGradient
import android.graphics.drawable.Drawable
import android.util.Base64
import android.view.View
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import java.nio.charset.StandardCharsets
import kotlin.math.hypot


// Reusable objects to avoid per-frame allocations in draw paths
private val gradientPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { isDither = true }
private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG)
private val bitmapDstRect = RectF()


/**
 * CSS pseudo-state specificity order.
 * Later entries override earlier ones when multiple states are active.
 * Matches CSS spec: :active overrides :focus overrides :hover.
 */
internal val PSEUDO_CSS_ORDER = arrayOf(
  PseudoState.HOVER, PseudoState.FOCUS, PseudoState.ACTIVE, PseudoState.DISABLED
)

enum class BackgroundClip(val css: String) {
  BORDER_BOX("border-box"), PADDING_BOX("padding-box"), CONTENT_BOX("content-box"), TEXT("text");

  companion object {
    fun parse(value: String): BackgroundClip? = entries.firstOrNull { it.css == value.trim().lowercase() }

    /** `text` is a clip only, never an origin. */
    fun parseOrigin(value: String): BackgroundClip? = parse(value)?.takeIf { it != TEXT }
  }
}

/** `background-origin` uses the same box keywords as `background-clip`, bar `text`. */
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
class BackgroundOffset(fraction: Float = 0f, px: Float = 0f) {
  internal var math: NativePaintOffset? = null

  var fraction: Float = fraction
    set(value) {
      if (field.toBits() != value.toBits()) math = null
      field = value
    }
  var px: Float = px
    set(value) {
      if (field.toBits() != value.toBits()) math = null
      field = value
    }

  operator fun component1(): Float = fraction
  operator fun component2(): Float = px

  fun copy(fraction: Float = this.fraction, px: Float = this.px): BackgroundOffset =
    BackgroundOffset(fraction, px).also {
      if (fraction.toBits() == this.fraction.toBits() && px.toBits() == this.px.toBits()) it.math = math
    }

  override fun equals(other: Any?): Boolean =
    other is BackgroundOffset && fraction.toBits() == other.fraction.toBits() &&
      px.toBits() == other.px.toBits() && math == other.math

  override fun hashCode(): Int {
    val components = 31 * fraction.hashCode() + px.hashCode()
    return math?.let { 31 * components + it.hashCode() } ?: components
  }

  override fun toString(): String = "BackgroundOffset(fraction=$fraction, px=$px)"

  fun resolve(area: Float, drawSize: Float): Float = resolve(area, drawSize, null)

  internal fun resolve(area: Float, drawSize: Float, units: LengthContext?): Float {
    val basis = area - drawSize
    return math?.resolve(basis, units) ?: (fraction * basis + px)
  }

  fun cssValue(horizontal: Boolean): String = math?.text(horizontal) ?: when {
    px == 0f -> "${(fraction * 100f).toInt()}%"
    fraction == 0f -> "${(px / Mason.shared.scale).toInt()}px"
    fraction == 1f -> "${if (horizontal) "right" else "bottom"} ${(-px / Mason.shared.scale).toInt()}px"
    else -> "calc(${(fraction * 100f).toInt()}% + ${(px / Mason.shared.scale).toInt()}px)"
  }
}

internal class NativePaintOffset private constructor(
  private val handle: Long, private val fontSize: Float, private val snapshot: NativePaintSnapshot? = null,
) {
  private val formula by lazy { text(horizontal = true) }

  override fun equals(other: Any?): Boolean =
    this === other || other is NativePaintOffset && fontSize.toBits() == other.fontSize.toBits() && formula == other.formula

  override fun hashCode(): Int = 31 * fontSize.hashCode() + formula.hashCode()

  fun resolve(basis: Float, units: LengthContext?): Float {
    val context = units ?: gradientUnits(fontSize)
    return Mason.nativePaintOffsetResolve(snapshot ?: this, handle, basis, context.scale, context.emBasis,
      context.rootFontSize, context.viewportWidth, context.viewportHeight)
  }

  fun text(horizontal: Boolean): String? = Mason.nativePaintOffsetText(snapshot ?: this, handle, horizontal)

  companion object {
    fun fromSnapshot(snapshot: NativePaintSnapshot?, address: Long, fontSize: Float): NativePaintOffset? =
      if (snapshot != null && address != 0L) NativePaintOffset(address, fontSize, snapshot) else null

    fun retain(owner: Any, address: Long, fontSize: Float): NativePaintOffset? {
      if (address == 0L) return null
      val handle = Mason.nativePaintOffsetRetain(owner, address)
      return NativePaintOffset(handle, fontSize).also { Mason.shared.gc.track(it) { Mason.nativePaintOffsetRelease(handle) } }
    }
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
  /** A `data:image/svg+xml` image, parsed once; `bitmap` is its raster at the drawn size. */
  var svg: SvgDocument? = null,
  /** The SVG didn't parse; don't retry every frame. */
  var svgFailed: Boolean = false,
  /** The `currentColor` that `bitmap` was rasterized with (0 when the SVG doesn't use it). */
  var svgColor: Int = 0,
  /** A color token seen in the shorthand; the last layer\'s becomes `Background.color`. */
  var layerColor: Int? = null
) {
  internal var shaderUnits: LengthContext? = null

  val isDefault: Boolean
    get() = image == null && gradient == null && position == null && size == null &&
      repeat == BackgroundRepeat.REPEAT && clip == BackgroundClip.BORDER_BOX &&
      origin == BackgroundOrigin.PADDING_BOX && attachment == BackgroundAttachment.SCROLL &&
      blendMode == BackgroundBlendMode.NORMAL
}

class Background(
  val style: Style
) {

  // Solid fills set the colour right before each draw and the canvas copies the paint when
  // recording, so every background shares one (draws run on the UI thread).
  internal val bgPaint: Paint
    get() = sharedFillPaint

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
  private var nativeBackground: NativeBackground? = null

  /** Whether a layer paints through the text (`background-clip: text`). */
  val hasTextClip: Boolean
    get() {
      for (i in layers.indices) if (layers[i].clip == BackgroundClip.TEXT) return true
      return false
    }

  private fun invalidateView() {
    (style.node.view as? android.view.View)?.invalidate()
  }

  private fun backgroundProgram(): NativeBackground =
    nativeBackground ?: NativeBackground.create().also { nativeBackground = it }

  private fun setLonghand(name: String, value: String) {
    val background = backgroundProgram()
    val result = background.setLonghand(name, value)
    if (result < 0) return
    if (result > 0) {
      background.readLayers(reusing = layers)
      install()
    }
    invalidateView()
  }

  internal fun replaceLayers(value: String, shorthand: Boolean): Boolean {
    val background = backgroundProgram()
    val parsedColor = background.replace(value, style.color)
    if (parsedColor < -1L) return false
    val projected = background.readLayers() ?: return false
    if (shorthand) {
      if (!style.node.mason.inCompute) style.prepareMut()
      color = parsedColor.takeIf { it >= 0L }?.toInt()
    }
    layers = projected.toMutableList()
    return true
  }

  internal fun applyCompiled(fields: Array<String>, initialColor: Int, fontSize: Float) {
    val background = backgroundProgram()
    val result = background.applyCompiled(fields, initialColor) ?: return
    val shorthand = result[CssBackgroundResultRecord.SHORTHAND_VALUE]
    if (shorthand >= 0L) style.mBackgroundRaw = fields[shorthand.toInt()]
    val fill = result[CssBackgroundResultRecord.COLOR]
    if (fill >= -1L) {
      val shorthandColor = result[CssBackgroundResultRecord.COLOR_FROM_SHORTHAND] != 0L
      if (!shorthandColor || !style.node.mason.inCompute) style.prepareMut()
      color = fill.takeIf { it >= 0L }?.toInt()
    }
    if (result[CssBackgroundResultRecord.IMAGE_DECLARATION] != 0L) style.isValueInitialized = true
    if (result[CssBackgroundResultRecord.LAYERS_CHANGED] != 0L) {
      val existing = if (result[CssBackgroundResultRecord.IMAGES_REPLACED] != 0L) emptyList() else layers
      layers = background.readLayers(reusing = existing, mason = style.node.mason, fontSize = fontSize)
        ?.toMutableList() ?: return
      install()
    }
    invalidateView()
  }

  internal fun install() {
    installBackground(style, nativeBackground)
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
    private val sharedFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.style = Paint.Style.FILL
      isDither = true
    }

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
    /** The only layer, when it is a gradient covering the border box in one tile. */
    fun boxGradientLayer(background: Background, view: android.view.View, node: Node, width: Float, height: Float): BackgroundLayer? {
      val layer = background.layers.singleOrNull() ?: return null
      if (layer.gradient == null || layer.image != null || layer.size != null || layer.position != null ||
        layer.clip != BackgroundClip.BORDER_BOX || layer.attachment != BackgroundAttachment.SCROLL ||
        layer.blendMode != BackgroundBlendMode.NORMAL
      ) return null
      val area = positioningArea(layer, view, node, width, height)
      return if (area.left == 0f && area.top == 0f && area.right == width && area.bottom == height) layer else null
    }

    internal fun fillBorderBox(canvas: Canvas, border: BorderRenderer, width: Float, height: Float, paint: Paint) {
      val r = border.uniformRadius(width, height)
      when {
        r == 0f -> canvas.drawRect(0f, 0f, width, height, paint)
        r > 0f -> canvas.drawRoundRect(0f, 0f, width, height, r, r, paint)
        else -> {
          val outerPath = border.getOuterClipPath(width, height)
          if (!outerPath.isEmpty) canvas.drawPath(outerPath, paint) else canvas.drawRect(0f, 0f, width, height, paint)
        }
      }
    }

    internal fun fillBoxGradient(canvas: Canvas, layer: BackgroundLayer, border: BorderRenderer, width: Float, height: Float, fontSize: Float) {
      val shader = gradientShader(layer, width.toInt(), height.toInt(), gradientUnits(fontSize)) ?: return
      gradientPaint.shader = shader
      fillBorderBox(canvas, border, width, height, gradientPaint)
    }

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
          BackgroundOrigin.BORDER_BOX, BackgroundOrigin.TEXT -> {}
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
    nativeBackground = null
    installBackground(style, null)
    color = null
  }
}

/** One axis of `background-repeat` / `mask-repeat`. */
enum class RepeatStyle(val value: String) {
  REPEAT("repeat"), SPACE("space"), ROUND("round"), NO_REPEAT("no-repeat");

  companion object {
    fun parse(value: String): RepeatStyle? = entries.firstOrNull { it.value == value }
  }
}

/** `background-repeat` / `mask-repeat`, per axis. */
data class BackgroundRepeat(val x: RepeatStyle, val y: RepeatStyle) {
  val value: String
    get() = when {
      x == y -> x.value
      x == RepeatStyle.REPEAT && y == RepeatStyle.NO_REPEAT -> "repeat-x"
      x == RepeatStyle.NO_REPEAT && y == RepeatStyle.REPEAT -> "repeat-y"
      else -> "${x.value} ${y.value}"
    }

  companion object {
    @JvmField val REPEAT = BackgroundRepeat(RepeatStyle.REPEAT, RepeatStyle.REPEAT)
    @JvmField val REPEAT_X = BackgroundRepeat(RepeatStyle.REPEAT, RepeatStyle.NO_REPEAT)
    @JvmField val REPEAT_Y = BackgroundRepeat(RepeatStyle.NO_REPEAT, RepeatStyle.REPEAT)
    @JvmField val NO_REPEAT = BackgroundRepeat(RepeatStyle.NO_REPEAT, RepeatStyle.NO_REPEAT)

    /** `repeat-x`, `repeat-y`, or one or two axis keywords; null when invalid. */
    fun parse(value: String): BackgroundRepeat? =
      backgroundLonghandRecord("repeat", value)?.repeat(0)
  }
}

data class Gradient(
  val type: String,
  val direction: String?,
  val stops: List<String>,
  val interpolation: ColorInterpolation? = null,
  val repeating: Boolean = false,
) {
  private val parsedStops by lazy {
    (stops as? NativeGradientStops)?.takeIf { it.type == type && it.direction == direction } ?: run {
      // Typed callers can construct a gradient directly with a list of CSS stops.
      val value = stops.joinToString(", ")
      val prefix = if (repeating) "repeating-" else ""
      val prelude = direction?.takeIf { it.isNotBlank() }?.let { "$it, " } ?: ""
      parseGradient("$prefix$type-gradient($prelude$value)")?.stops as? NativeGradientStops
    }
  }

  internal fun paint(width: Float, height: Float, units: LengthContext = gradientUnits()): GradientPaint? =
    parsedStops?.paint(width, height, units)
}

private fun gradientUnits(fontSize: Float = 0f): LengthContext {
  val mason = Mason.shared
  return LengthContext(mason.scale, fontSize, mason.rootFontSize, mason.viewportWidth, mason.viewportHeight)
}

internal class GradientPaint(private val values: DoubleArray) {
  val x0 get() = values[0].toFloat()
  val y0 get() = values[1].toFloat()
  val x1 get() = values[2].toFloat()
  val y1 get() = values[3].toFloat()
  val radiusX get() = values[4].toFloat()
  val radiusY get() = values[5].toFloat()
  val angle get() = values[6].toFloat()
  val stopCount get() = (values.size - 7) / 2

  fun color(index: Int): Int = values[7 + index * 2].toLong().toInt()
  fun position(index: Int): Float = values[8 + index * 2].toFloat()
}

private class NativeGradientStops(
  private val handle: Long, override val size: Int, val type: String, val direction: String?,
  private val snapshot: NativePaintSnapshot?,
) : AbstractList<String>() {
  private val texts by lazy { checkNotNull(Mason.nativeGradientStopTexts(snapshot ?: this, handle)) }

  override fun get(index: Int): String {
    if (index !in indices) throw IndexOutOfBoundsException("Gradient stop $index of $size")
    return texts[index]
  }

  fun paint(width: Float, height: Float, units: LengthContext): GradientPaint? {
    return Mason.nativeGradientPaint(
      snapshot ?: this, handle, width, height, units.scale, units.emBasis, units.rootFontSize, units.viewportWidth, units.viewportHeight
    )?.let(::GradientPaint)
  }
}

/** Glide model for a CSS image URL: `~/` is the app folder and an absolute path is a file. */
internal fun imageSource(context: Context, url: String): Any = when {
  url.startsWith("~/") -> java.io.File(java.io.File(context.filesDir, "app"), url.substring(2))
  url.startsWith("/") -> java.io.File(url)
  else -> url
}

/** [currentColor] is the element's resolved CSS `color`, for SVG `currentColor` paints. */
fun drawBackground(
  context: Context, view: View?, layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF,
  currentColor: Int = 0xFF000000.toInt()
) = drawBackground(context, view, layer, canvas, paintRect, area, currentColor, 0f)

internal fun drawBackground(
  context: Context, view: View?, layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF,
  currentColor: Int, fontSize: Float,
) {
  val units = gradientUnits(fontSize)
  if (layer.gradient != null) drawGradient(layer, canvas, paintRect, area, units)

  layer.image?.let { imageUrl ->
    if (isSvgSource(imageUrl)) {
      drawSvgLayer(context, layer, imageUrl, canvas, paintRect, area, currentColor, units)
      return
    }

    // Use cached bitmap if available
    layer.bitmap?.let { bitmap ->
      drawBitmapLayer(bitmap, layer, canvas, paintRect, area, units)
      return
    }

    decodeDataUrlBitmap(imageUrl)?.let { bitmap ->
      layer.bitmap = bitmap
      layer.bitmapIsDevicePx = false
      drawBitmapLayer(bitmap, layer, canvas, paintRect, area, units)
      return
    }

    // Load bitmap asynchronously
    Glide.with(context).asBitmap().load(imageSource(context, imageUrl)).into(object : CustomTarget<Bitmap>() {
      override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
        layer.bitmap = resource
        layer.bitmapIsDevicePx = false
        view?.invalidate()
      }

      override fun onLoadCleared(placeholder: Drawable?) {}
    })
  }
}

/** Largest SVG raster edge, in device px; anything bigger is drawn scaled up. */
private const val MAX_SVG_RASTER_PX = 4096

/**
 * An SVG layer keeps its parsed document and rasterizes it at the size it is drawn, in device px
 * (so `background-size` scales stay sharp). The raster is cached on the layer and redone only
 * when that size or the `currentColor` it used changes.
 */
private fun drawSvgLayer(
  context: Context, layer: BackgroundLayer, url: String, canvas: Canvas, paintRect: RectF, area: RectF, currentColor: Int, units: LengthContext
) {
  if (layer.svgFailed) return
  val doc = layer.svg ?: decodeSvgSource(context, url)?.also { layer.svg = it }
  if (doc == null) {
    layer.svgFailed = true
    return
  }
  val density = context.resources.displayMetrics.density
  // Intrinsic size in device px: 1 SVG px is 1 CSS px.
  val (drawW, drawH) = resolveTileSize(layer, doc.width * density, doc.height * density, area.width(), area.height(), units)
  if (drawW <= 0f || drawH <= 0f) return
  val fit = minOf(1f, MAX_SVG_RASTER_PX / maxOf(drawW, drawH))
  val pxW = ceil(drawW * fit).toInt().coerceAtLeast(1)
  val pxH = ceil(drawH * fit).toInt().coerceAtLeast(1)
  val color = if (doc.usesCurrentColor) currentColor else 0
  val cached = layer.bitmap
  val bitmap = if (cached != null && cached.width == pxW && cached.height == pxH && layer.svgColor == color) {
    cached
  } else {
    renderSvgDocument(doc, pxW, pxH, color)?.also {
      layer.bitmap = it
      layer.svgColor = color
      layer.bitmapIsDevicePx = true
    } ?: return
  }
  drawBitmapLayer(bitmap, layer, canvas, paintRect, area, units, drawW, drawH)
}

/** Payload bytes of a `data:` URL, or null. */
private fun decodeDataUrlBytes(url: String): ByteArray? {
  if (!url.startsWith("data:", ignoreCase = true)) return null
  val comma = url.indexOf(',')
  if (comma < 0) return null

  val meta = url.substring(5, comma).lowercase()
  val payload = url.substring(comma + 1)
  return try {
    if (meta.contains(";base64")) {
      Base64.decode(payload, Base64.DEFAULT)
    } else {
      percentDecodeBytes(payload)
    }
  } catch (_: Throwable) {
    null
  }
}

internal fun decodeDataUrlBitmap(url: String): Bitmap? {
  val bytes = decodeDataUrlBytes(url) ?: return null
  return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
}

/** An SVG data URL, or a local `.svg` file (`~/` or an absolute path). */
internal fun isSvgSource(url: String): Boolean =
  url.startsWith("data:image/svg", ignoreCase = true) ||
    ((url.startsWith("~/") || url.startsWith("/")) && url.substringBefore('?').endsWith(".svg", ignoreCase = true))

internal fun decodeSvgSource(context: Context, url: String): SvgDocument? {
  if (url.startsWith("data:", ignoreCase = true)) return decodeSvgDataUrl(url)
  val file = imageSource(context, url.substringBefore('?')) as? java.io.File ?: return null
  return try {
    parseSvgDocument(file.readText())
  } catch (_: Throwable) {
    null
  }
}

internal fun decodeSvgDataUrl(url: String): SvgDocument? {
  val bytes = decodeDataUrlBytes(url) ?: return null
  return try {
    parseSvgDocument(String(bytes, StandardCharsets.UTF_8))
  } catch (_: Throwable) {
    null
  }
}

private fun svgMatrix(t: FloatArray) = Matrix().apply {
  setValues(floatArrayOf(t[0], t[2], t[4], t[1], t[3], t[5], 0f, 0f, 1f))
}

private fun svgPaintColor(paint: SvgPaint, opacity: Float, currentColor: Int): Int {
  val argb = when (paint) {
    is SvgPaint.Color -> paint.argb
    SvgPaint.CurrentColor -> currentColor
    else -> 0
  }
  val alpha = (((argb ushr 24) and 0xFF) * opacity.coerceIn(0f, 1f)).toInt().coerceIn(0, 255)
  return (alpha shl 24) or (argb and 0x00FFFFFF)
}

private fun buildSvgPath(path: Path, commands: List<SvgPathCommand>) {
  path.reset()
  for (c in commands) {
    when (c) {
      is SvgPathCommand.MoveTo -> path.moveTo(c.x, c.y)
      is SvgPathCommand.LineTo -> path.lineTo(c.x, c.y)
      is SvgPathCommand.CubicTo -> path.cubicTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y)
      is SvgPathCommand.QuadTo -> path.quadTo(c.x1, c.y1, c.x, c.y)
      SvgPathCommand.Close -> path.close()
    }
  }
}

private fun svgStopColor(stop: SvgGradientStop, currentColor: Int): Int {
  if (!stop.currentColor) return stop.argb
  val alpha = ((currentColor ushr 24) and 0xFF) * ((stop.argb ushr 24) and 0xFF) / 255
  return (alpha shl 24) or (currentColor and 0xFFFFFF)
}

/** A shader for [g], in the shape's user space. */
private fun svgGradientShader(g: SvgGradient, currentColor: Int): Shader {
  val colors = IntArray(g.stops.size) { svgStopColor(g.stops[it], currentColor) }
  val positions = FloatArray(g.stops.size) { g.stops[it].offset }
  val tile = when (g.spread) {
    SvgSpread.PAD -> Shader.TileMode.CLAMP
    SvgSpread.REFLECT -> Shader.TileMode.MIRROR
    SvgSpread.REPEAT -> Shader.TileMode.REPEAT
  }
  val shader = if (!g.radial) {
    LinearGradient(g.x1, g.y1, g.x2, g.y2, colors, positions, tile)
  } else if ((g.fx != g.cx || g.fy != g.cy) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    // Two-point conical: from the focal point (radius 0) out to the end circle.
    val longs = LongArray(colors.size) { Color.pack(colors[it]) }
    RadialGradient(g.fx, g.fy, 0f, g.cx, g.cy, g.r, longs, positions, tile)
  } else {
    RadialGradient(g.cx, g.cy, g.r, colors, positions, tile)
  }
  shader.setLocalMatrix(svgMatrix(g.transform))
  return shader
}

/** Colour, or shader for a gradient or pattern, of [paint] at [opacity]; false when it draws nothing. */
private fun applySvgPaint(canvas: Canvas, target: Paint, paint: SvgPaint, opacity: Float, currentColor: Int): Boolean {
  when (paint) {
    is SvgPaint.Gradient -> target.shader = svgGradientShader(paint.gradient, currentColor)
    is SvgPaint.Pattern -> target.shader = svgPatternShader(canvas, paint.pattern, currentColor) ?: return false
    else -> {
      target.color = svgPaintColor(paint, opacity, currentColor)
      return true
    }
  }
  target.color = Color.BLACK
  target.alpha = (opacity.coerceIn(0f, 1f) * 255f + 0.5f).toInt()
  return true
}

private fun svgClipPath(clip: SvgClip): Path {
  val out = Path()
  val evenOdd = clip.paths.first().evenOdd
  if (clip.paths.all { it.evenOdd == evenOdd }) {
    val p = Path()
    for (c in clip.paths) {
      buildSvgPath(p, c.commands)
      p.transform(svgMatrix(c.transform))
      out.addPath(p)
    }
    out.fillType = if (evenOdd) Path.FillType.EVEN_ODD else Path.FillType.WINDING
    return out
  }
  // Mixed clip-rules: union paths that each keep their own rule.
  for (c in clip.paths) {
    val p = Path()
    buildSvgPath(p, c.commands)
    p.transform(svgMatrix(c.transform))
    p.fillType = if (c.evenOdd) Path.FillType.EVEN_ODD else Path.FillType.WINDING
    out.op(p, Path.Op.UNION)
  }
  return out
}

private fun drawSvgImage(canvas: Canvas, image: SvgImage, paint: Paint) {
  val bitmap = decodeDataUrlBitmap(image.href) ?: return
  val iw = bitmap.width.toFloat()
  val ih = bitmap.height.toFloat()
  if (iw <= 0f || ih <= 0f) return
  // An auto side keeps the image's aspect ratio.
  val w = image.width ?: image.height?.let { it * iw / ih } ?: iw
  val h = image.height ?: image.width?.let { it * ih / iw } ?: ih
  val m = svgViewBoxTransform(floatArrayOf(0f, 0f, iw, ih), image.alignX, image.alignY, image.slice, w, h)
  canvas.save()
  canvas.concat(svgMatrix(image.transform))
  canvas.translate(image.x, image.y)
  if (image.slice) canvas.clipRect(0f, 0f, w, h)
  canvas.concat(svgMatrix(m))
  paint.reset()
  paint.isAntiAlias = true
  paint.isFilterBitmap = true
  paint.alpha = (image.opacity.coerceIn(0f, 1f) * 255f + 0.5f).toInt()
  canvas.drawBitmap(bitmap, 0f, 0f, paint)
  canvas.restore()
}

/** Rasterize [doc] into a [w] x [h] px bitmap; `currentColor` paints use [currentColor]. */
internal fun renderSvgDocument(doc: SvgDocument, w: Int, h: Int, currentColor: Int): Bitmap? {
  if (w <= 0 || h <= 0 || doc.ops.isEmpty()) return null
  val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888).apply {
    setHasAlpha(true)
    eraseColor(Color.TRANSPARENT)
  }
  val canvas = Canvas(bitmap)
  canvas.concat(svgMatrix(doc.viewportTransform(w.toFloat(), h.toFloat())))
  drawSvgOps(canvas, doc.ops, currentColor)
  return bitmap
}

/** Largest pattern tile edge, in device px. */
private const val MAX_SVG_PATTERN_TILE_PX = 2048

private val svgLuminanceFilter = ColorMatrixColorFilter(LUMINANCE_MATRIX)

/** Draws [ops] into [canvas], whose matrix maps the SVG's root user space to device px. */
internal fun drawSvgOps(canvas: Canvas, ops: List<SvgOp>, currentColor: Int) {
  val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  val path = Path()
  // A clip draws its content into a layer, then erases outside it with the inverse path (AA).
  val clips = ArrayList<SvgClip>()
  val clipPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_OUT) }
  for (op in ops) {
    when (op) {
      is SvgOp.BeginGroup -> {
        @Suppress("DEPRECATION")
        canvas.saveLayerAlpha(null, (op.opacity * 255f).toInt().coerceIn(0, 255))
      }

      SvgOp.EndGroup -> canvas.restore()
      is SvgOp.BeginClip -> {
        clips.add(op.clip)
        canvas.saveLayer(null, null)
      }

      SvgOp.EndClip -> {
        if (clips.isNotEmpty()) {
          val outside = svgClipPath(clips.removeAt(clips.size - 1)).apply { toggleInverseFillType() }
          canvas.drawPath(outside, clipPaint)
          canvas.restore()
        }
      }

      is SvgOp.Image -> drawSvgImage(canvas, op.image, paint)
      is SvgOp.Masked -> drawSvgMasked(canvas, op.mask, op.content, currentColor)
      is SvgOp.Shape -> {
        val shape = op.shape
        buildSvgPath(path, shape.commands)
        path.fillType = if (shape.evenOdd) Path.FillType.EVEN_ODD else Path.FillType.WINDING
        canvas.save()
        canvas.concat(svgMatrix(shape.transform))
        if (shape.hasFill) {
          paint.reset()
          paint.isAntiAlias = true
          paint.style = Paint.Style.FILL
          if (applySvgPaint(canvas, paint, shape.fill, shape.fillOpacity, currentColor)) canvas.drawPath(path, paint)
        }
        if (shape.hasStroke) {
          paint.reset()
          paint.isAntiAlias = true
          paint.style = Paint.Style.STROKE
          paint.strokeWidth = shape.strokeWidth
          paint.strokeCap = when (shape.lineCap) {
            SvgLineCap.BUTT -> Paint.Cap.BUTT
            SvgLineCap.ROUND -> Paint.Cap.ROUND
            SvgLineCap.SQUARE -> Paint.Cap.SQUARE
          }
          paint.strokeJoin = when (shape.lineJoin) {
            SvgLineJoin.MITER -> Paint.Join.MITER
            SvgLineJoin.ROUND -> Paint.Join.ROUND
            SvgLineJoin.BEVEL -> Paint.Join.BEVEL
          }
          paint.strokeMiter = shape.miterLimit
          shape.dashArray?.let { paint.pathEffect = DashPathEffect(it, shape.dashOffset) }
          if (applySvgPaint(canvas, paint, shape.stroke, shape.strokeOpacity, currentColor)) canvas.drawPath(path, paint)
        }
        canvas.restore()
      }
    }
  }
}

/**
 * A repeating shader for [pattern], its tile rasterized at the scale it lands at on [canvas]
 * (whose matrix is the shape's user space); null when it has nothing to draw.
 */
private fun svgPatternShader(canvas: Canvas, pattern: SvgPattern, currentColor: Int): Shader? {
  @Suppress("DEPRECATION")
  val m = Matrix(canvas.matrix).apply { preConcat(svgMatrix(pattern.transform)) }
  val v = FloatArray(9).also { m.getValues(it) }
  val pw = ceil(pattern.width * hypot(v[Matrix.MSCALE_X], v[Matrix.MSKEW_Y])).toInt().coerceIn(1, MAX_SVG_PATTERN_TILE_PX)
  val ph = ceil(pattern.height * hypot(v[Matrix.MSKEW_X], v[Matrix.MSCALE_Y])).toInt().coerceIn(1, MAX_SVG_PATTERN_TILE_PX)
  val tile = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888)
  val tileCanvas = Canvas(tile)
  tileCanvas.scale(pw / pattern.width, ph / pattern.height)
  tileCanvas.clipRect(0f, 0f, pattern.width, pattern.height)
  drawSvgOps(tileCanvas, pattern.ops, currentColor)
  return BitmapShader(tile, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT).apply {
    setLocalMatrix(svgMatrix(pattern.transform).apply { preScale(pattern.width / pw, pattern.height / ph) })
  }
}

/** Draws [content] through [mask]: the content in a layer, multiplied by the mask's coverage. */
private fun drawSvgMasked(canvas: Canvas, mask: SvgMask, content: List<SvgOp>, currentColor: Int) {
  val region = svgClipPath(mask.region)
  val bounds = RectF()
  region.computeBounds(bounds, true)
  val outer = canvas.saveLayer(bounds, null)
  drawSvgOps(canvas, content, currentColor)
  canvas.saveLayer(bounds, Paint().apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN) })
  canvas.clipPath(region)
  if (mask.luminance) {
    // Drawn over black, luminance x alpha becomes the layer's alpha.
    canvas.saveLayer(bounds, Paint().apply { colorFilter = svgLuminanceFilter })
    canvas.drawColor(Color.BLACK)
    drawSvgOps(canvas, mask.ops, currentColor)
    canvas.restore()
  } else {
    drawSvgOps(canvas, mask.ops, currentColor)
  }
  canvas.restoreToCount(outer)
}

fun drawGradient(layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF) =
  drawGradient(layer, canvas, paintRect, area, gradientUnits())

private fun drawGradient(layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF, units: LengthContext) {
  // A gradient is an image with no intrinsic size: `auto` is the positioning area.
  val (tileW, tileH) = resolveTileSize(layer, area.width(), area.height(), area.width(), area.height(), units)
  // No shader means no fill: gradientPaint's fallback colour is opaque black.
  val shader = gradientShader(layer, tileW.toInt(), tileH.toInt(), units) ?: return
  gradientPaint.shader = shader
  layer.blendMode.apply(gradientPaint)
  forEachTile(layer, paintRect, area, tileW, tileH, units) { x, y ->
    val save = canvas.save()
    canvas.translate(x, y)
    canvas.drawRect(0f, 0f, tileW, tileH, gradientPaint)
    canvas.restoreToCount(save)
  }
  layer.blendMode.clear(gradientPaint)
}

/** The layer's gradient over a `width` x `height` tile, cached on the layer. */
internal fun gradientShader(layer: BackgroundLayer, width: Int, height: Int, units: LengthContext = gradientUnits()): Shader? {
  val gradient = layer.gradient ?: return null
  if (width <= 0 || height <= 0) return null

  // A resize (often from a first draw at 0x0) needs a new shader.
  if (layer.shader != null &&
    (layer.shaderWidth != width || layer.shaderHeight != height || layer.shaderUnits != units)
  ) {
    layer.shader = null
  }

  if (layer.shader == null) {
    val type = gradient.type.lowercase()
    val paint = gradient.paint(width.toFloat(), height.toFloat(), units) ?: return null
    val colorsArray = IntArray(paint.stopCount, paint::color)
    val positions = FloatArray(paint.stopCount) {
      val position = paint.position(it)
      if (gradient.repeating) position else position.coerceIn(0f, 1f)
    }
    if (colorsArray.isEmpty()) return null
    var (shaderColors, positionsArray) = expandInterpolatedStops(colorsArray, positions, gradient.interpolation)
    if (gradient.repeating) {
      val repeated = repeatGradientStops(shaderColors, positionsArray)
      shaderColors = repeated.first
      positionsArray = repeated.second
    }
    // The platform shaders need two colours; a single stop is a solid fill.
    if (shaderColors.size == 1) {
      shaderColors = intArrayOf(shaderColors[0], shaderColors[0])
      positionsArray = floatArrayOf(0f, 1f)
    }

    layer.shader = when (type) {
      "linear" -> LinearGradient(paint.x0, paint.y0, paint.x1, paint.y1, shaderColors, positionsArray, Shader.TileMode.CLAMP)

      // An ellipse is the circle of radius rx scaled vertically about the centre.
      "radial" -> RadialGradient(paint.x0, paint.y0, paint.radiusX, shaderColors, positionsArray, Shader.TileMode.CLAMP).apply {
        if (paint.radiusY != paint.radiusX) setLocalMatrix(Matrix().apply { setScale(1f, paint.radiusY / paint.radiusX, paint.x0, paint.y0) })
      }

      // SweepGradient starts at 3 o'clock; CSS conic starts at 12 o'clock, both clockwise.
      "conic" -> SweepGradient(paint.x0, paint.y0, shaderColors, positionsArray).apply {
        setLocalMatrix(Matrix().apply { setRotate(paint.angle - 90f, paint.x0, paint.y0) })
      }

      else -> null
    }

    // remember the size used to create this shader
    layer.shaderWidth = width
    layer.shaderHeight = height
    layer.shaderUnits = units
  }
  return layer.shader
}

/** Largest stop list a repeating gradient expands to; finer periods are cut off. */
private const val MAX_REPEATED_STOPS = 2048

/**
 * Tiles a repeating gradient's stops across [0, 1]: the run from the first to the last stop
 * repeats with that length as its period, and the ends are cut at 0 and 1 with the colour
 * interpolated there, since the platform shaders only take stops inside [0, 1].
 */
internal fun repeatGradientStops(colors: IntArray, positions: FloatArray): Pair<IntArray, FloatArray> {
  val n = positions.size
  if (n < 2 || colors.size != n) return colors to positions
  val first = positions[0]
  val period = positions[n - 1] - first
  // CSS paints a zero-length period as one averaged colour; not worth tiling.
  if (period <= 1e-4f) return colors to positions

  val tiledColors = ArrayList<Int>()
  val tiledPositions = ArrayList<Float>()
  var k = kotlin.math.floor(-first / period).toInt()
  while (first + k * period <= 1f && tiledPositions.size < MAX_REPEATED_STOPS) {
    val shift = k * period
    for (i in 0 until n) {
      tiledColors.add(colors[i])
      tiledPositions.add(positions[i] + shift)
    }
    k++
  }

  val outColors = ArrayList<Int>(tiledColors.size + 2)
  val outPositions = ArrayList<Float>(tiledColors.size + 2)
  outColors.add(stopColorAt(tiledColors, tiledPositions, 0f, fromRight = true))
  outPositions.add(0f)
  for (i in tiledPositions.indices) {
    val p = tiledPositions[i]
    if (p > 0f && p < 1f) {
      outColors.add(tiledColors[i])
      outPositions.add(p)
    }
  }
  outColors.add(stopColorAt(tiledColors, tiledPositions, 1f, fromRight = false))
  outPositions.add(1f)
  return outColors.toIntArray() to outPositions.toFloatArray()
}

/**
 * The colour of a stop list at [t]. At a hard stop, [fromRight] picks the colour that
 * follows it, otherwise the one before it.
 */
private fun stopColorAt(colors: List<Int>, positions: List<Float>, t: Float, fromRight: Boolean): Int {
  val n = positions.size
  if (t <= positions[0] && !(fromRight && t == positions[0])) return colors[0]
  if (t >= positions[n - 1] && !(!fromRight && t == positions[n - 1])) return colors[n - 1]
  val i = if (fromRight) positions.indexOfLast { it <= t } else positions.indexOfFirst { it >= t } - 1
  if (i < 0) return colors[0]
  if (i >= n - 1) return colors[n - 1]
  val span = positions[i + 1] - positions[i]
  if (span <= 0f) return if (fromRight) colors[i + 1] else colors[i]
  return lerpArgb(colors[i], colors[i + 1], (t - positions[i]) / span)
}

private fun lerpArgb(a: Int, b: Int, f: Float): Int {
  fun ch(shift: Int): Int {
    val x = (a ushr shift) and 0xFF
    val y = (b ushr shift) and 0xFF
    return (x + (y - x) * f + 0.5f).toInt().coerceIn(0, 255)
  }
  return (ch(24) shl 24) or (ch(16) shl 16) or (ch(8) shl 8) or ch(0)
}

/** Most tiles drawn per axis; finer tilings are cut off. */
private const val MAX_TILES_PER_AXIS = 4096

/** Per-axis tiling scratch: first origin, step, count. Draws run on the UI thread. */
private val tileAxisX = FloatArray(3)
private val tileAxisY = FloatArray(3)

/** One axis's tiles, written to [out] as first origin, step and count; `space` spreads whole tiles edge to edge. */
internal fun tileAxis(
  style: RepeatStyle, areaStart: Float, areaLength: Float, paintStart: Float, paintEnd: Float,
  tile: Float, offset: Float, out: FloatArray
) {
  out[0] = areaStart + offset
  out[1] = tile
  out[2] = 1f
  if (tile <= 0f) {
    out[2] = 0f
    return
  }
  val start = when (style) {
    RepeatStyle.NO_REPEAT -> return
    RepeatStyle.SPACE -> {
      val n = floor(areaLength / tile + 1e-4f).toInt()
      if (n <= 1) return
      out[1] = tile + (areaLength - n * tile) / (n - 1)
      areaStart
    }
    RepeatStyle.REPEAT, RepeatStyle.ROUND -> areaStart + offset
  }
  val step = out[1]
  val first = start - ceil((start - paintStart) / step) * step
  out[0] = first
  out[2] = ceil((paintEnd - first) / step).coerceIn(0f, MAX_TILES_PER_AXIS.toFloat())
}

/** Visit each tile origin of a `drawW`x`drawH` image placed and repeated per the layer. */
private inline fun forEachTile(layer: BackgroundLayer, paintRect: RectF, area: RectF, drawW: Float, drawH: Float, units: LengthContext, draw: (Float, Float) -> Unit) {
  val pos = layer.position
  val offsetX = pos?.x?.resolve(area.width(), drawW, units) ?: 0f
  val offsetY = pos?.y?.resolve(area.height(), drawH, units) ?: 0f
  tileAxis(layer.repeat.x, area.left, area.width(), paintRect.left, paintRect.right, drawW, offsetX, tileAxisX)
  tileAxis(layer.repeat.y, area.top, area.height(), paintRect.top, paintRect.bottom, drawH, offsetY, tileAxisY)
  val x0 = tileAxisX[0]
  val stepX = tileAxisX[1]
  val countX = tileAxisX[2].toInt()
  val y0 = tileAxisY[0]
  val stepY = tileAxisY[1]
  val countY = tileAxisY[2].toInt()
  for (j in 0 until countY) {
    val py = y0 + j * stepY
    for (i in 0 until countX) draw(x0 + i * stepX, py)
  }
}

/** [drawW]/[drawH], when given, are the already-resolved tile size. */
private fun drawBitmapLayer(
  bitmap: Bitmap, layer: BackgroundLayer, canvas: Canvas, paintRect: RectF, area: RectF,
  units: LengthContext, drawW: Float? = null, drawH: Float? = null
) {
  val areaW = area.width()
  val areaH = area.height()
  val imgScale = if (layer.bitmapIsDevicePx) 1f else Mason.shared.scale
  val (drawWidth, drawHeight) = if (drawW != null && drawH != null) drawW to drawH
  else resolveTileSize(layer, bitmap.width * imgScale, bitmap.height * imgScale, areaW, areaH, units)
  if (drawWidth <= 0f || drawHeight <= 0f) return

  // Reuse cached RectF and Paint to avoid per-tile allocations
  val dst = bitmapDstRect
  val paint = bitmapPaint
  layer.blendMode.apply(paint)
  forEachTile(layer, paintRect, area, drawWidth, drawHeight, units) { px, py ->
    dst.set(px, py, px + drawWidth, py + drawHeight)
    canvas.drawBitmap(bitmap, null, dst, paint)
  }
  layer.blendMode.clear(paint)
}

/** The tile size: `background-size`, then `round` fits a whole number of tiles. */
internal fun resolveTileSize(layer: BackgroundLayer, imgW: Float, imgH: Float, areaW: Float, areaH: Float, units: LengthContext? = null): Pair<Float, Float> {
  var (w, h) = resolveBitmapSize(layer.size, imgW, imgH, areaW, areaH, units)
  val size = layer.size
  val autoW = size == null || (size.keyword == null && size.width == null)
  val autoH = size == null || (size.keyword == null && size.height == null)
  val roundX = layer.repeat.x == RepeatStyle.ROUND
  val roundY = layer.repeat.y == RepeatStyle.ROUND
  if (roundX && w > 0f && areaW > 0f) {
    val old = w
    w = areaW / maxOf(1f, Math.round(areaW / w).toFloat())
    if (autoH && !roundY) h *= w / old
  }
  if (roundY && h > 0f && areaH > 0f) {
    val old = h
    h = areaH / maxOf(1f, Math.round(areaH / h).toFloat())
    if (autoW && !roundX) w *= h / old
  }
  return w to h
}

/** Resolve `background-size` against the positioning area, keeping the image ratio for `auto`. */
internal fun resolveBitmapSize(size: BackgroundSize?, imgW: Float, imgH: Float, areaW: Float, areaH: Float, units: LengthContext? = null): Pair<Float, Float> {
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
  val w = size.width?.resolve(areaW, 0f, units)
  val h = size.height?.resolve(areaH, 0f, units)
  return when {
    w != null && h != null -> w to h
    w != null -> w to w / ratio
    h != null -> h * ratio to h
    else -> imgW to imgH
  }
}

private fun parseCssColor(property: String, value: String): Int? =
  Mason.expandCssShorthand(property, value)?.firstOrNull()?.toUIntOrNull()?.toInt()

fun parseHexColor(hex: String): Int? = parseCssColor("color-hex", hex)

fun parseRgbColor(input: String): Int? = parseCssColor("color-rgb", input)

fun parseColor(value: String): Int? = parseCssColor("color-value", value)

fun parseRepeat(value: String): BackgroundRepeat? = BackgroundRepeat.parse(value)

/** Projects a parsed layer list for the mask renderer and CSS accessors. */
internal class NativeBackgroundLonghand private constructor(internal val handle: Long) {
  fun records(): DoubleArray? {
    val mason = Mason.shared
    return Mason.nativeBackgroundLonghandRecords(
      this, handle, mason.scale, mason.rootFontSize, mason.viewportWidth, mason.viewportHeight
    )
  }

  fun offset(index: Int): NativePaintOffset? =
    NativePaintOffset.retain(this, Mason.nativeBackgroundLonghandOffset(this, handle, index), 0f)

  companion object {
    fun parse(name: String, value: String, allowInvalidEntries: Boolean = false): NativeBackgroundLonghand? {
      val mason = Mason.shared
      val handle = Mason.nativeBackgroundLonghandParse(name, value, allowInvalidEntries)
      if (handle == 0L) return null
      val longhand = NativeBackgroundLonghand(handle)
      mason.gc.track(longhand) { Mason.nativeBackgroundLonghandRelease(handle) }
      return longhand
    }
  }
}

private const val BACKGROUND_LONGHAND_RECORD_SIZE = 6

private fun backgroundLonghandRecord(name: String, value: String): DoubleArray? =
  NativeBackgroundLonghand.parse(name, value)?.records()?.takeIf { it.size == BACKGROUND_LONGHAND_RECORD_SIZE }

private fun DoubleArray.offset(index: Int, math: NativePaintOffset? = null): BackgroundOffset? =
  if (this[index].isNaN()) null else BackgroundOffset(this[index].toFloat(), this[index + 1].toFloat()).also { it.math = math }

private fun repeatStyle(value: Double): RepeatStyle = when (value.toInt()) {
  1 -> RepeatStyle.NO_REPEAT
  2 -> RepeatStyle.SPACE
  3 -> RepeatStyle.ROUND
  else -> RepeatStyle.REPEAT
}

private fun DoubleArray.repeat(base: Int): BackgroundRepeat =
  BackgroundRepeat(repeatStyle(this[base + 1]), repeatStyle(this[base + 2]))

private fun <T> readBackgroundLonghand(name: String, value: String, read: (NativeBackgroundLonghand, DoubleArray) -> T): T? {
  val program = NativeBackgroundLonghand.parse(name, value) ?: return null
  val records = program.records()?.takeIf { it.size == BACKGROUND_LONGHAND_RECORD_SIZE } ?: return null
  return read(program, records)
}

fun parseAxisPosition(parts: List<String>, horizontal: Boolean): BackgroundOffset? =
  readBackgroundLonghand(if (horizontal) "position-x" else "position-y", parts.joinToString(" ")) { program, records ->
    records.offset(1, program.offset(0))
  }

fun parsePosition(parts: List<String>): BackgroundPosition? =
  readBackgroundLonghand("position", parts.joinToString(" ")) { program, records ->
    BackgroundPosition(records.offset(1, program.offset(0))!!, records.offset(3, program.offset(1))!!)
  }

fun parseSize(value: String): BackgroundSize? =
  readBackgroundLonghand("size", value) { program, records ->
    when (records[1].toInt()) {
      2 -> BackgroundSize(keyword = "contain")
      3 -> BackgroundSize(keyword = "cover")
      else -> BackgroundSize(records.offset(2, program.offset(0)), records.offset(4, program.offset(1)))
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

fun parseGradient(part: String): Gradient? = parseGradient(part, Color.BLACK)

internal fun parseGradient(part: String, currentColor: Int): Gradient? {
  return readGradient(Mason.nativeGradientParse(part.trim().trimEnd(';'), currentColor))
}

internal fun readGradient(handle: Long): Gradient? {
  val mason = Mason.shared
  if (handle == 0L) return null
  try {
    val info = Mason.nativeGradientInfo(handle)
    if (info == null) {
      Mason.nativeGradientRelease(handle)
      return null
    }
    val gradient = decodeGradient(handle, info, 0, null)
    mason.gc.track(gradient.stops) { Mason.nativeGradientRelease(handle) }
    return gradient
  } catch (error: Throwable) {
    Mason.nativeGradientRelease(handle)
    throw error
  }
}

private fun decodeGradient(handle: Long, info: Array<*>, row: Int, snapshot: NativePaintSnapshot?): Gradient {
  val base = row * AndroidGradientInfoRecord.STRIDE
  fun field(slot: Int) = info[base + slot] as String
  val interpolation = field(AndroidGradientInfoRecord.SPACE).takeIf { it.isNotEmpty() }?.let {
    ColorInterpolation.fromRust(it, field(AndroidGradientInfoRecord.HUE))
  }
  val type = field(AndroidGradientInfoRecord.KIND)
  val direction = field(AndroidGradientInfoRecord.DIRECTION).takeIf { it.isNotEmpty() }
  val stops = NativeGradientStops(handle, field(AndroidGradientInfoRecord.STOP_COUNT).toInt(), type, direction, snapshot)
  return Gradient(type, direction, stops, interpolation, field(AndroidGradientInfoRecord.REPEATING) == "1")
}

/** Keeps borrowed gradient and math addresses valid after the style replaces its layers. */
internal class NativePaintSnapshot private constructor() {
  companion object {
    fun own(handle: Long): NativePaintSnapshot {
      try {
        return NativePaintSnapshot().also { Mason.shared.gc.track(it) { Mason.nativePaintSnapshotRelease(handle) } }
      } catch (error: Throwable) {
        Mason.nativePaintSnapshotRelease(handle)
        throw error
      }
    }
  }
}

internal class NativePaintRead(result: Array<Any?>) {
  private val snapshot = (result[AndroidPaintReadRecord.SNAPSHOT] as? Long)?.let(NativePaintSnapshot::own)
  val values = result[AndroidPaintReadRecord.VALUES] as DoubleArray
  private val images = result[AndroidPaintReadRecord.IMAGES] as Array<*>
  private val offsets = result[AndroidPaintReadRecord.OFFSETS] as? LongArray
  private val gradients = result[AndroidPaintReadRecord.GRADIENTS] as? LongArray
  private val gradientInfo = result[AndroidPaintReadRecord.GRADIENT_INFO] as? Array<*>
  val count get() = images.size

  fun image(row: Int): String? = images[row] as? String

  fun offset(row: Int, slot: Int, fontSize: Float): NativePaintOffset? {
    val address = offsets?.get(row * BackgroundOffsetsRecord.STRIDE + slot) ?: 0L
    return NativePaintOffset.fromSnapshot(snapshot, address, fontSize)
  }

  fun gradient(row: Int): Gradient? {
    val handle = gradients?.getOrNull(row) ?: 0L
    if (handle == 0L) return null
    return decodeGradient(handle, checkNotNull(gradientInfo), row, checkNotNull(snapshot))
  }
}

/** Layers with only author-visible content (drops color-only and empty layers). */
fun parseBackgroundLayers(css: String): List<BackgroundLayer> =
  parseBackgroundLayers(css, Color.BLACK).orEmpty()

internal fun parseBackgroundLayers(css: String, currentColor: Int): List<BackgroundLayer>? =
  parseRawBackgroundLayers(css, currentColor)?.filter { !it.isDefault }

fun parseLayer(layerValue: String): BackgroundLayer =
  parseRawBackgroundLayers(layerValue, Color.BLACK)?.firstOrNull() ?: BackgroundLayer()

private fun parseRawBackgroundLayers(css: String, currentColor: Int): List<BackgroundLayer>? {
  return NativeBackground.parse(css, currentColor)?.readLayers()
}

internal fun installBackground(style: Style, background: NativeBackground?) {
  val node = style.node
  if (node.isPlaceholder) return
  val engine = node.mason
  if (engine.inCompute) engine.deferStyleRecords(style)
  else style.prepareMut()
  Mason.nativeBackgroundInstall(background, background?.handle ?: 0L,
    if (engine.inCompute) 0L else engine.nativePtr, node.nativePtr)
}

internal class NativeBackground private constructor(internal val handle: Long) {
  fun replace(css: String, currentColor: Int) =
    Mason.nativeBackgroundReplace(this, handle, css, currentColor)

  fun setLonghand(property: String, value: String) =
    Mason.nativeBackgroundSetLonghand(this, handle, property, value)

  fun applyCompiled(fields: Array<String>, currentColor: Int): LongArray? =
    Mason.nativeBackgroundApply(this, handle, fields.joinToString("\u0000").encodeToByteArray(), currentColor)

  fun readLayers(
    reusing: List<BackgroundLayer> = emptyList(), mason: Mason = Mason.shared, fontSize: Float = mason.rootFontSize
  ): List<BackgroundLayer>? {
    val result = Mason.nativeBackgroundRead(
      this, handle, mason.scale, fontSize, mason.rootFontSize, mason.viewportWidth, mason.viewportHeight, reusing.size
    ) ?: return null
    val paint = NativePaintRead(result)
    return List(paint.count) { row ->
      readBackgroundLayer(paint, row * BackgroundRecord.STRIDE, row, fontSize, reusing.getOrNull(row))
    }
  }

  companion object {
    fun create(): NativeBackground = own(Mason.nativeBackgroundCreate())

    fun parse(css: String, currentColor: Int): NativeBackground? {
      val handle = Mason.nativeBackgroundParse(css, currentColor)
      if (handle == 0L) return null
      return own(handle)
    }

    private fun own(handle: Long): NativeBackground {
      val background = NativeBackground(handle)
      Mason.shared.gc.track(background) { Mason.nativeBackgroundRelease(handle) }
      return background
    }
  }
}

internal fun readBackgroundLayer(
  paint: NativePaintRead, base: Int, row: Int, fontSize: Float, existing: BackgroundLayer? = null,
): BackgroundLayer {
  val values = paint.values
  val layer = existing ?: BackgroundLayer(
    image = paint.image(row)?.takeIf { values[base + BackgroundRecord.IMAGE_KIND] == 1.0 },
    gradient = if (values[base + BackgroundRecord.IMAGE_KIND] == 2.0) paint.gradient(row) else null,
    layerColor = values[base + BackgroundRecord.COLOR].takeUnless { it.isNaN() }?.toLong()?.toInt()
  )
  fun offset(field: Int, slot: Int): BackgroundOffset? =
    values.offset(base + field, paint.offset(row, slot, fontSize))
  val x = offset(BackgroundRecord.POSITION_X_FRACTION, BackgroundOffsetsRecord.POSITION_X)
  val y = offset(BackgroundRecord.POSITION_Y_FRACTION, BackgroundOffsetsRecord.POSITION_Y)
  layer.repeat = BackgroundRepeat(repeatStyle(values[base + BackgroundRecord.REPEAT_X]), repeatStyle(values[base + BackgroundRecord.REPEAT_Y]))
  layer.origin = BackgroundOrigin.entries[values[base + BackgroundRecord.ORIGIN].toInt()]
  layer.clip = BackgroundClip.entries[values[base + BackgroundRecord.CLIP].toInt()]
  layer.attachment = BackgroundAttachment.entries[values[base + BackgroundRecord.ATTACHMENT].toInt()]
  layer.blendMode = BackgroundBlendMode.entries[values[base + BackgroundRecord.BLEND].toInt()]
  layer.size = when (values[base + BackgroundRecord.SIZE_KIND].toInt()) {
    1 -> BackgroundSize(offset(BackgroundRecord.WIDTH_FRACTION, BackgroundOffsetsRecord.WIDTH),
                        offset(BackgroundRecord.HEIGHT_FRACTION, BackgroundOffsetsRecord.HEIGHT))
    2 -> BackgroundSize(keyword = "contain")
    3 -> BackgroundSize(keyword = "cover")
    else -> null
  }
  layer.position = if (x != null || y != null) BackgroundPosition(x ?: BackgroundOffset(), y ?: BackgroundOffset()) else null
  return layer
}

fun splitLayers(css: String): List<String> {
  val layers = mutableListOf<String>()
  var depth = 0
  var start = 0
  var quote = 0.toChar()
  css.forEachIndexed { i, c ->
    if (quote != 0.toChar()) {
      if (c == quote) quote = 0.toChar()
      return@forEachIndexed
    }
    when (c) {
      '"', '\'' -> quote = c
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

fun parseBackground(style: Style, css: String): Background? =
  Background(style).takeIf { it.replaceLayers(css, shorthand = true) }
