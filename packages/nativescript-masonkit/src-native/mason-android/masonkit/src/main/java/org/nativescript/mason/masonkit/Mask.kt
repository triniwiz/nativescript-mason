package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import android.view.ViewGroup
import kotlin.math.abs
import kotlin.math.ceil

/*
 * CSS Masking Level 1 (`mask-*`). A mask layer is drawn by the background painter: its
 * image/gradient, size, position, repeat and origin live on a [BackgroundLayer], so masks
 * take the same SVG, bitmap and gradient paths as backgrounds. The layers are composed
 * into one alpha bitmap per element size, and the element's whole draw (background,
 * border, content, children) is multiplied by it with DST_IN inside a saveLayer.
 */

/** The `mask-*` longhands, indexed like [Mask]'s storage: the layer list, then `mask-border-*`. */
internal val MASK_CSS_NAMES = arrayOf(
  "mask-image", "mask-size", "mask-position", "mask-repeat",
  "mask-origin", "mask-clip", "mask-mode", "mask-composite",
  "mask-border-source", "mask-border-slice", "mask-border-width",
  "mask-border-outset", "mask-border-repeat", "mask-border-mode",
)

/** How many of [MASK_CSS_NAMES] describe the `mask-image` layers. */
private const val MASK_LAYER_LONGHANDS = 8

/** `mask-mode`. Mason only draws images and gradients, for which `match-source` is alpha. */
enum class MaskMode(val css: String) {
  MATCH_SOURCE("match-source"), ALPHA("alpha"), LUMINANCE("luminance");

  companion object {
    fun parse(value: String): MaskMode? = entries.firstOrNull { it.css == value.trim().lowercase() }
  }
}

/** `mask-composite`: how a layer combines with the layers below it. */
enum class MaskComposite(val css: String) {
  ADD("add"), SUBTRACT("subtract"), INTERSECT("intersect"), EXCLUDE("exclude");

  // A function, not a constructor value: JVM unit tests can't load android.graphics enums.
  internal fun porterDuff(): PorterDuff.Mode = when (this) {
    ADD -> PorterDuff.Mode.SRC_OVER
    SUBTRACT -> PorterDuff.Mode.SRC_OUT
    INTERSECT -> PorterDuff.Mode.SRC_IN
    EXCLUDE -> PorterDuff.Mode.XOR
  }

  companion object {
    fun parse(value: String): MaskComposite? = entries.firstOrNull { it.css == value.trim().lowercase() }
  }
}

/** `mask-clip`. The SVG boxes and `margin-box` have no meaning for a Mason box: border box. */
enum class MaskClip(val css: String) {
  BORDER_BOX("border-box"), PADDING_BOX("padding-box"), CONTENT_BOX("content-box"), NO_CLIP("no-clip");

  companion object {
    fun parse(value: String): MaskClip? = when (value.trim().lowercase()) {
      "border-box", "fill-box", "stroke-box", "view-box", "margin-box" -> BORDER_BOX
      "padding-box" -> PADDING_BOX
      "content-box" -> CONTENT_BOX
      "no-clip" -> NO_CLIP
      else -> null
    }
  }
}

/** `mask-origin`, with the same fallbacks as [MaskClip]. */
internal fun parseMaskOrigin(value: String): BackgroundOrigin? = when (value.trim().lowercase()) {
  "border-box", "fill-box", "stroke-box", "view-box", "margin-box" -> BackgroundOrigin.BORDER_BOX
  "padding-box" -> BackgroundOrigin.PADDING_BOX
  "content-box" -> BackgroundOrigin.CONTENT_BOX
  else -> null
}

class MaskLayer(
  /** Image or gradient plus size/position/repeat/origin and the image caches; null for `none`. */
  val source: BackgroundLayer?,
  var clip: MaskClip = MaskClip.BORDER_BOX,
  var mode: MaskMode = MaskMode.MATCH_SOURCE,
  var composite: MaskComposite = MaskComposite.ADD,
)

/**
 * Splits a comma-separated layer list at the top level. Unlike [splitLayers] it skips
 * quoted text, so an unencoded SVG data URL keeps its commas and parentheses.
 */
internal fun splitMaskList(value: String): List<String> {
  val out = mutableListOf<String>()
  var depth = 0
  var quote = 0.toChar()
  var start = 0
  var i = 0
  while (i < value.length) {
    val c = value[i]
    if (quote != 0.toChar()) {
      if (c == '\\') i++ else if (c == quote) quote = 0.toChar()
    } else when (c) {
      '"', '\'' -> quote = c
      '(' -> depth++
      ')' -> depth = maxOf(0, depth - 1)
      ',' -> if (depth == 0) {
        out.add(value.substring(start, i))
        start = i + 1
      }
    }
    i++
  }
  out.add(value.substring(start))
  return out
}

/** The URL inside `url(...)`, unquoted and with CSS escapes resolved, or null. */
internal fun extractCssUrl(token: String): String? {
  val t = token.trim()
  if (!t.regionMatches(0, "url(", 0, 4, ignoreCase = true)) return null
  var i = 4
  while (i < t.length && t[i].isWhitespace()) i++
  if (i >= t.length) return null
  val q = t[i]
  if (q != '"' && q != '\'') {
    val end = t.lastIndexOf(')')
    return if (end < i) null else t.substring(i, end).trim()
  }
  val sb = StringBuilder()
  i++
  while (i < t.length) {
    val c = t[i]
    when {
      c == q -> return sb.toString()
      c == '\\' && i + 1 < t.length -> {
        // `\22` style hex escapes (plus one optional space), else the next char literally.
        var j = i + 1
        while (j < t.length && j - i <= 6 && Character.digit(t[j], 16) >= 0) j++
        if (j > i + 1) {
          sb.appendCodePoint(t.substring(i + 1, j).toInt(16))
          if (j < t.length && t[j] == ' ') j++
          i = j
        } else {
          if (t[i + 1] != '\n') sb.append(t[i + 1])
          i += 2
        }
        continue
      }
      else -> sb.append(c)
    }
    i++
  }
  return null
}

private val MASK_GRADIENT_REGEX =
  Regex("""^(repeating-)?(linear|radial|conic)-gradient\(([\s\S]*)\)$""", RegexOption.IGNORE_CASE)

/** `[repeating-](linear|radial|conic)-gradient(...)`, or null. */
internal fun parseMaskGradient(token: String): Gradient? {
  val m = MASK_GRADIENT_REGEX.matchEntire(token.trim()) ?: return null
  val repeating = m.groupValues[1].isNotEmpty()
  val type = m.groupValues[2].lowercase()
  val body = m.groupValues[3]
  if (type != "conic") return parseGradient("$type-gradient($body)")?.copy(repeating = repeating)

  val items = splitTopLevelCommas(body).map { it.trim() }.filter { it.isNotEmpty() }
  if (items.isEmpty()) return null
  // `from 90deg at 25% 25% in oklab`: the prelude shares the first argument.
  val extracted = ColorInterpolation.extract(items.first())
  val first = (extracted?.first ?: items.first()).trim()
  val lower = first.lowercase()
  val direction = if (lower.startsWith("from ") || lower.startsWith("at ")) first else null
  val stops = if (direction != null || extracted != null) items.drop(1) else items
  if (stops.isEmpty()) return null
  return Gradient("conic", direction, expandColorStops(stops), extracted?.second, repeating)
}

/** One `mask-image` entry: null when it isn't a supported image (the declaration is invalid). */
internal fun parseMaskImageSource(token: String): BackgroundLayer? {
  val t = token.trim()
  val lower = t.lowercase()
  val layer = when {
    lower.startsWith("url(") -> {
      val url = extractCssUrl(t) ?: return null
      // An empty url() is a transparent layer, like an image that fails to load.
      if (url.isEmpty()) BackgroundLayer() else BackgroundLayer(image = url)
    }

    lower.contains("gradient(") -> BackgroundLayer(gradient = parseMaskGradient(t) ?: return null)
    else -> return null
  }
  layer.origin = BackgroundOrigin.BORDER_BOX
  return layer
}

/**
 * `mask-repeat`: one or two keywords. `space` and `round` tile like `repeat` (the background
 * painter has no spacing/rounding). Null when invalid.
 */
internal fun parseMaskRepeat(value: String): BackgroundRepeat? {
  val tokens = value.trim().lowercase().split(Regex("""\s+""")).filter { it.isNotEmpty() }
  fun tiles(t: String): Boolean? = when (t) {
    "repeat", "space", "round" -> true
    "no-repeat" -> false
    else -> null
  }
  return when (tokens.size) {
    1 -> when (tokens[0]) {
      "repeat-x" -> BackgroundRepeat.REPEAT_X
      "repeat-y" -> BackgroundRepeat.REPEAT_Y
      else -> tiles(tokens[0])?.let { if (it) BackgroundRepeat.REPEAT else BackgroundRepeat.NO_REPEAT }
    }

    2 -> {
      val x = tiles(tokens[0]) ?: return null
      val y = tiles(tokens[1]) ?: return null
      when {
        x && y -> BackgroundRepeat.REPEAT
        x -> BackgroundRepeat.REPEAT_X
        y -> BackgroundRepeat.REPEAT_Y
        else -> BackgroundRepeat.NO_REPEAT
      }
    }

    else -> null
  }
}

/**
 * The mask layers for a set of longhands (empty strings are initial values). The image list
 * decides the layer count; every other list repeats cyclically. No layers means no mask:
 * `none` everywhere, or an image list that doesn't parse.
 */
internal fun parseMaskLayers(
  image: String,
  size: String = "",
  position: String = "",
  repeat: String = "",
  origin: String = "",
  clip: String = "",
  mode: String = "",
  composite: String = "",
): List<MaskLayer> {
  val images = splitMaskList(image).map { it.trim() }
  // A `none` layer is transparent black, but only matters next to a real image.
  if (images.all { it.isEmpty() || it.equals("none", ignoreCase = true) }) return emptyList()
  val layers = ArrayList<MaskLayer>(images.size)
  for (token in images) {
    if (token.isEmpty() || token.equals("none", ignoreCase = true)) {
      layers.add(MaskLayer(null))
      continue
    }
    layers.add(MaskLayer(parseMaskImageSource(token) ?: return emptyList()))
  }

  fun cyclic(value: String, apply: (MaskLayer, String) -> Unit) {
    val parts = splitMaskList(value).map { it.trim() }.filter { it.isNotEmpty() }
    if (parts.isEmpty()) return
    layers.forEachIndexed { i, layer -> apply(layer, parts[i % parts.size]) }
  }
  cyclic(size) { l, v -> parseSize(v)?.let { l.source?.size = it } }
  cyclic(position) { l, v -> parsePosition(splitTopLevelWhitespace(v))?.let { l.source?.position = it } }
  cyclic(repeat) { l, v -> parseMaskRepeat(v)?.let { l.source?.repeat = it } }
  cyclic(origin) { l, v -> parseMaskOrigin(v)?.let { l.source?.origin = it } }
  cyclic(clip) { l, v -> MaskClip.parse(v)?.let { l.clip = it } }
  cyclic(mode) { l, v -> MaskMode.parse(v)?.let { l.mode = it } }
  cyclic(composite) { l, v -> MaskComposite.parse(v)?.let { l.composite = it } }
  return layers
}

/** Alpha = luminance of the layer drawn over black, i.e. luminance x alpha. */
private val LUMINANCE_MATRIX = floatArrayOf(
  0f, 0f, 0f, 0f, 0f,
  0f, 0f, 0f, 0f, 0f,
  0f, 0f, 0f, 0f, 0f,
  0.2125f, 0.7154f, 0.0721f, 0f, 0f,
)

/** How far past the border box a no-clip mask is composed, in device px. */
private const val MAX_NO_CLIP_OUTSET = 1024f

class Mask internal constructor(private val style: Style) {

  companion object {
    const val IMAGE = 0
    const val SIZE = 1
    const val POSITION = 2
    const val REPEAT = 3
    const val ORIGIN = 4
    const val CLIP = 5
    const val MODE = 6
    const val COMPOSITE = 7
    const val BORDER_SOURCE = 8
    const val BORDER_SLICE = 9
    const val BORDER_WIDTH = 10
    const val BORDER_OUTSET = 11
    const val BORDER_REPEAT = 12
    const val BORDER_MODE = 13
  }

  /** Longhands as set, indexed like [MASK_CSS_NAMES]; empty is the initial value. */
  private val base = Array(MASK_CSS_NAMES.size) { "" }

  /** The resolved longhands [layers] was parsed from. */
  private val builtFrom = arrayOfNulls<String>(MASK_CSS_NAMES.size)
  private var layers: List<MaskLayer> = emptyList()

  /** `mask-border`, with its source (null without one); multiplied into the layers' mask. */
  private var border: BorderImageSpec? = null
  private var borderSource: NineSliceSource? = null
  private var version = 0

  /** A pseudo-class rule set a mask longhand; until then only [base] is consulted. */
  internal var hasPseudo = false

  /** [beginDraw]'s save count for [endMask] (draw() isn't re-entered for one view). */
  internal var pendingSave = -1

  operator fun get(index: Int): String = base[index]

  fun set(index: Int, value: String) {
    base[index] = value.trim()
    changed()
  }

  internal fun changed() {
    val view = style.node.view as? android.view.View ?: return
    // Masking hooks draw(), which a ViewGroup that draws nothing itself skips.
    view.setWillNotDraw(false)
    view.invalidate()
    // The parent draws this element's outset shadow, or skips it while masked.
    if (style.hasOutsetBoxShadow()) (view.parent as? android.view.View)?.invalidate()
  }

  private fun resolved(index: Int): String {
    val node = style.node
    if (hasPseudo && node.pseudoMask != 0) {
      for (i in PSEUDO_CSS_ORDER.indices.reversed()) {
        val state = PSEUDO_CSS_ORDER[i]
        if (node.hasPseudo(state)) {
          node.getPseudoString(state.mask, MASK_CSS_NAMES[index])?.let { if (it.isNotEmpty()) return it }
        }
      }
    }
    return base[index]
  }

  /** The layers for the current pseudo state; reparsed only when a resolved longhand changed. */
  internal fun currentLayers(): List<MaskLayer> {
    var layersDirty = false
    var borderDirty = false
    for (i in base.indices) {
      val value = resolved(i)
      if (value != builtFrom[i]) {
        builtFrom[i] = value
        if (i < MASK_LAYER_LONGHANDS) layersDirty = true else borderDirty = true
      }
    }
    if (layersDirty) {
      layers = parseMaskLayers(
        builtFrom[IMAGE]!!, builtFrom[SIZE]!!, builtFrom[POSITION]!!, builtFrom[REPEAT]!!,
        builtFrom[ORIGIN]!!, builtFrom[CLIP]!!, builtFrom[MODE]!!, builtFrom[COMPOSITE]!!
      )
      version++
    }
    if (borderDirty) {
      val spec = parseBorderImageLonghands(
        builtFrom[BORDER_SOURCE]!!, builtFrom[BORDER_SLICE]!!, builtFrom[BORDER_WIDTH]!!,
        builtFrom[BORDER_OUTSET]!!, builtFrom[BORDER_REPEAT]!!, builtFrom[BORDER_MODE]!!, mask = true
      )
      // Keep the loaded image while only the geometry longhands change.
      if (spec?.source != border?.source) borderSource = spec?.let { NineSliceSource(it.source) }
      border = spec
      version++
    }
    return layers
  }

  /** The mask border for the current state, unless its image can't be displayed (then it's ignored). */
  private fun currentBorder(): BorderImageSpec? = border?.takeUnless { borderSource?.failed == true }

  internal fun isActive(): Boolean = currentLayers().isNotEmpty() || currentBorder() != null

  // Composed mask (only its alpha is used), cached per size and inputs.
  private var maskBitmap: Bitmap? = null
  private val maskRect = RectF()
  private val nextRect = RectF()
  private val tmpRect = RectF()
  private var cacheW = -1
  private var cacheH = -1
  private var cacheVersion = -1
  private var cacheColor = 0
  private var cacheLoaded = -1
  private val cacheInsets = FloatArray(8)
  private val insets = FloatArray(8)
  private var drawOwnShadow = false
  private var drawing = false
  private var boxDx = 0f
  private var boxDy = 0f

  private val dstInPaint by lazy {
    Paint(Paint.FILTER_BITMAP_FLAG).apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN) }
  }
  private val layerPaint by lazy { Paint() }
  private val borderPainter by lazy { NineSlicePainter() }
  private val luminanceFilter by lazy { ColorMatrixColorFilter(LUMINANCE_MATRIX) }

  /**
   * Start drawing [view] through the mask. Returns -1 when no mask applies (draw normally),
   * else a save count to hand to [endDraw] after the view's normal draw.
   */
  internal fun beginDraw(view: android.view.View, canvas: Canvas): Int {
    val layers = currentLayers()
    // A mask-border image that turns out undisplayable is ignored rather than masking all.
    if (this.border != null) borderSource?.load(view.context, view)
    val border = currentBorder()
    if (layers.isEmpty() && border == null) {
      release()
      return -1
    }
    val w = view.width
    val h = view.height
    // The canvas is in scrolled-content coordinates; the mask belongs to the box.
    boxDx = view.scrollX.toFloat()
    boxDy = view.scrollY.toFloat()
    val bitmap = if (w > 0 && h > 0) ensureComposite(view, layers, border, w, h) else null
    if (bitmap == null) {
      // An empty mask painting area lets nothing through.
      drawing = false
      val save = canvas.save()
      canvas.clipRect(0f, 0f, 0f, 0f)
      return save
    }
    drawing = true
    val save = canvas.saveLayer(
      maskRect.left + boxDx, maskRect.top + boxDy, maskRect.right + boxDx, maskRect.bottom + boxDy, null
    )
    if (drawOwnShadow) {
      val s = canvas.save()
      canvas.translate(boxDx, boxDy)
      style.mBorderRenderer.updateCache(w.toFloat(), h.toFloat())
      style.mBoxShadowRenderer.drawOutsetShadows(view, canvas, w.toFloat(), h.toFloat(), style.mBorderRenderer)
      canvas.restoreToCount(s)
    }
    return save
  }

  internal fun endDraw(canvas: Canvas, save: Int) {
    val bitmap = maskBitmap
    if (drawing && bitmap != null) {
      canvas.translate(boxDx, boxDy)
      canvas.drawBitmap(bitmap, null, maskRect, dstInPaint)
    }
    drawing = false
    canvas.restoreToCount(save)
  }

  private fun release() {
    // Not recycled: a recorded display list may still reference it; the GC frees it.
    maskBitmap = null
    cacheW = -1
  }

  private fun clipBox(clip: MaskClip, w: Float, h: Float, out: RectF) {
    val node = style.node
    out.set(0f, 0f, w, h)
    if (clip == MaskClip.PADDING_BOX || clip == MaskClip.CONTENT_BOX) {
      out.left += node.computedBorderLeft
      out.top += node.computedBorderTop
      out.right -= node.computedBorderRight
      out.bottom -= node.computedBorderBottom
    }
    if (clip == MaskClip.CONTENT_BOX) {
      out.left += node.computedPaddingLeft
      out.top += node.computedPaddingTop
      out.right -= node.computedPaddingRight
      out.bottom -= node.computedPaddingBottom
    }
  }

  private fun outsetShadowExtent(): Float {
    if (!style.hasOutsetBoxShadow()) return 0f
    var extent = 0f
    for (s in style.boxShadows) {
      if (s.inset) continue
      extent = maxOf(extent, maxOf(abs(s.offsetX), abs(s.offsetY)) + s.blurRadius + maxOf(0f, s.spreadRadius))
    }
    return extent
  }

  /** Remote images that have arrived since a compose; a new arrival recomposes. */
  private fun loadedImages(layers: List<MaskLayer>): Int {
    var n = 0
    for (l in layers) if (l.source?.bitmap != null) n++
    return n
  }

  private val borderWidths = FloatArray(4)
  private var cacheBorderGen = -1

  private fun ensureComposite(
    view: android.view.View, layers: List<MaskLayer>, border: BorderImageSpec?, w: Int, h: Int,
  ): Bitmap? {
    val fw = w.toFloat()
    val fh = h.toFloat()
    val node = style.node

    // Composition area: the union of the layers' clip boxes, grown for no-clip layers to
    // what the element can paint outside its box (outset shadow, overflowing children).
    val rect = nextRect
    rect.setEmpty()
    var noClip = false
    for (l in layers) {
      if (l.source == null) continue
      if (l.clip == MaskClip.NO_CLIP) {
        noClip = true
        continue
      }
      clipBox(l.clip, fw, fh, tmpRect)
      rect.union(tmpRect)
    }
    val shadowExtent = if (noClip) outsetShadowExtent() else 0f
    if (noClip) {
      tmpRect.set(0f, 0f, fw, fh)
      if (shadowExtent > 0f) tmpRect.inset(-shadowExtent, -shadowExtent)
      if (view is ViewGroup && view.scrollX == 0 && view.scrollY == 0) {
        for (i in 0 until view.childCount) {
          val child = view.getChildAt(i)
          if (child.visibility != android.view.View.VISIBLE || child.width <= 0 || child.height <= 0) continue
          tmpRect.union(child.left.toFloat(), child.top.toFloat(), child.right.toFloat(), child.bottom.toFloat())
        }
      }
      tmpRect.intersect(-MAX_NO_CLIP_OUTSET, -MAX_NO_CLIP_OUTSET, fw + MAX_NO_CLIP_OUTSET, fh + MAX_NO_CLIP_OUTSET)
      rect.union(tmpRect)
    }
    // mask-border: its mask is the border image area's, multiplied into the layers' one.
    var borderLayout: NineSliceLayout? = null
    var borderReady = false
    val borderSrc = borderSource
    if (border != null && borderSrc != null) {
      val ctx = LengthContext.forStyle(style)
      computedBorders(node, borderWidths)
      val area = borderImageArea(border, fw, fh, borderWidths, ctx)
      tmpRect.set(area.l, area.t, area.r, area.b)
      if (layers.isEmpty()) rect.set(tmpRect) else if (!rect.intersect(tmpRect)) rect.setEmpty()
      borderReady = borderSrc.prepare(view.context, view, area.width, area.height, ctx.scale)
      if (borderReady) {
        borderLayout = layoutNineSlice(border, fw, fh, borderWidths, borderSrc.imgW, borderSrc.imgH, borderSrc.unitPx, ctx)
      }
    }
    rect.set(kotlin.math.floor(rect.left), kotlin.math.floor(rect.top), ceil(rect.right), ceil(rect.bottom))
    // The parent skips a masked element's outset shadow; draw it here if the mask can show it.
    drawOwnShadow = style.hasOutsetBoxShadow() &&
      (rect.left < 0f || rect.top < 0f || rect.right > fw || rect.bottom > fh)

    insets[0] = node.computedBorderLeft
    insets[1] = node.computedBorderTop
    insets[2] = node.computedBorderRight
    insets[3] = node.computedBorderBottom
    insets[4] = node.computedPaddingLeft
    insets[5] = node.computedPaddingTop
    insets[6] = node.computedPaddingRight
    insets[7] = node.computedPaddingBottom
    val color = style.resolvedColor
    val loaded = loadedImages(layers)
    val borderGen = if (borderSrc == null) -1 else borderSrc.generation * 2 + (if (borderReady) 1 else 0)

    val cached = maskBitmap
    if (cached != null && cacheW == w && cacheH == h && cacheVersion == version && cacheColor == color &&
      cacheLoaded == loaded && cacheBorderGen == borderGen && rect == maskRect && insets.contentEquals(cacheInsets)
    ) return cached

    release()
    val bw = rect.width().toInt()
    val bh = rect.height().toInt()
    if (bw <= 0 || bh <= 0) return null
    maskRect.set(rect)

    val argb = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(argb)
    canvas.translate(-rect.left, -rect.top)
    // Bottom layer first; each layer above composites onto the result with its operator.
    for (i in layers.indices.reversed()) {
      val layer = layers[i]
      val paint = layerPaint
      paint.reset()
      // The bottom layer has nothing below it, so its operator is ignored.
      if (i != layers.lastIndex) paint.xfermode = PorterDuffXfermode(layer.composite.porterDuff())
      val luminance = layer.mode == MaskMode.LUMINANCE
      if (luminance) paint.colorFilter = luminanceFilter
      val save = canvas.saveLayer(rect, paint)
      // Over opaque black, each channel is premultiplied, so the matrix gives luminance x alpha.
      if (luminance) canvas.drawColor(Color.BLACK)
      layer.source?.let { source ->
        val paintRect = RectF()
        if (layer.clip == MaskClip.NO_CLIP) paintRect.set(rect) else clipBox(layer.clip, fw, fh, paintRect)
        canvas.clipRect(paintRect)
        val area = Background.positioningArea(source, view, node, fw, fh)
        drawBackground(view.context, view, source, canvas, paintRect, area, color)
      }
      canvas.restoreToCount(save)
    }
    if (border != null) {
      // Multiplied into the layers below (DST_IN); alone, it is the mask. A source still
      // loading masks everything, like a mask-image layer that hasn't arrived.
      val paint = layerPaint
      paint.reset()
      if (layers.isNotEmpty()) paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
      if (border.luminance) paint.colorFilter = luminanceFilter
      val save = canvas.saveLayer(rect, paint)
      if (border.luminance) canvas.drawColor(Color.BLACK)
      val layout = borderLayout
      if (layout != null && borderSrc != null && layout.pieces.isNotEmpty()) {
        borderSrc.bitmap(
          view, nineSliceRasterScale(layout, borderSrc.unitPx),
          layout.area.width, layout.area.height, color
        )?.let { borderPainter.draw(canvas, it, borderSrc.imgW, borderSrc.imgH, layout) }
      }
      canvas.restoreToCount(save)
    }
    // Kept as ARGB: DST_IN reads the source alpha, whereas an ALPHA_8 bitmap may be
    // drawn as coverage, which DST_IN with an opaque paint would ignore.
    maskBitmap = argb
    cacheW = w
    cacheH = h
    cacheVersion = version
    cacheColor = color
    // Counted after drawing: a data URL or SVG decodes synchronously while composing.
    cacheLoaded = loadedImages(layers)
    cacheBorderGen = if (borderSrc == null) -1 else borderSrc.generation * 2 + (if (borderReady) 1 else 0)
    insets.copyInto(cacheInsets)
    return argb
  }
}

/**
 * Mason views wrap their `draw()` in [beginMask]/[endMask], so `clip-path` and the mask cover
 * their whole rendering: background, border, content and children. -1 means neither applies:
 * draw as usual. Both apply when set: the mask layer multiplies what is drawn, inside the
 * clip's layer, which then erases everything outside the shape.
 */
internal fun beginMask(view: android.view.View, style: Style, canvas: Canvas): Int {
  val clip = style.mClipPath
  val mask = style.mMask
  if (clip == null && mask == null) return -1
  val outer = canvas.save()
  val clipped = clip?.begin(view, canvas, masked = mask?.isActive() == true) == true
  val maskSave = mask?.beginDraw(view, canvas) ?: -1
  mask?.pendingSave = maskSave
  if (!clipped && maskSave < 0) {
    canvas.restoreToCount(outer)
    return -1
  }
  return outer
}

internal fun endMask(style: Style, canvas: Canvas, save: Int) {
  if (save < 0) return
  val mask = style.mMask
  val maskSave = mask?.pendingSave ?: -1
  if (maskSave >= 0) mask?.endDraw(canvas, maskSave)
  style.mClipPath?.end(canvas)
  canvas.restoreToCount(save)
}
