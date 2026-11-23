package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Matrix
import android.graphics.Shader
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/*
 * The 9-slice painter shared by `border-image` (CSS Backgrounds 3 §6) and `mask-border`
 * (CSS Masking 1 §7): the source is cut into corners, edges and a middle by the slice
 * offsets and drawn onto the border image area (the border box grown by the outset).
 * Rust parses the values. This file projects them and draws the nine slices.
 */

enum class BorderImageRepeat { STRETCH, REPEAT, ROUND, SPACE }

/**
 * A parsed `border-image` / `mask-border`. Sides are top, right, bottom, left.
 * - [slice]: numbers (image units) or percentages (of the image).
 * - [width]: null is `auto`, a bare number multiplies the border width, else a length/percentage.
 * - [outset]: a bare number multiplies the border width, else a length.
 */
internal data class BorderImageSpec(
  val source: String,
  val slice: List<CssLength>,
  val fill: Boolean,
  val width: List<CssLength?>,
  val outset: List<CssLength>,
  val repeatX: BorderImageRepeat,
  val repeatY: BorderImageRepeat,
  /** `mask-border-mode: luminance`. */
  val luminance: Boolean = false,
  val widthProgram: NativeNineSlice? = null,
)

internal class NativeNineSlice private constructor(private val handle: Long) {
  val source: String = Mason.nativeNineSliceSource(this, handle, false).orEmpty()
  private var context: LengthContext? = null
  private var spec: BorderImageSpec? = null

  fun read(context: LengthContext): BorderImageSpec? {
    if (context == this.context) return spec
    val values = Mason.nativeNineSliceValues(
      this, handle, context.scale, context.emBasis, context.rootFontSize, context.viewportWidth, context.viewportHeight
    ) ?: return null
    fun sideOffset(index: Int) = NineSliceRecord.STRIDE + index * NineSliceSideRecord.STRIDE
    fun readSide(index: Int): CssLength? {
      val offset = sideOffset(index)
      val value = values[offset + NineSliceSideRecord.VALUE].toFloat()
      return when (values[offset + NineSliceSideRecord.KIND].toInt()) {
        0 -> CssLength(value, null)
        1 -> CssLength(value * 100f, "%")
        2 -> CssLength(value, "dppx")
        else -> null
      }
    }
    return BorderImageSpec(
      source, List(4) { readSide(it)!! }, values[NineSliceRecord.FILL] != 0.0,
      List(4) { readSide(it + 4) }, List(4) { readSide(it + 8)!! },
      BorderImageRepeat.entries[values[NineSliceRecord.REPEAT_X].toInt()],
      BorderImageRepeat.entries[values[NineSliceRecord.REPEAT_Y].toInt()],
      values[NineSliceRecord.LUMINANCE] != 0.0,
      widthProgram = takeIf { (4..<8).any { values[sideOffset(it) + NineSliceSideRecord.HAS_MATH] != 0.0 } },
    ).also {
      this.context = context
      spec = it
    }
  }

  fun mathWidths(width: Float, height: Float, context: LengthContext): FloatArray? =
    Mason.nativeNineSliceMathWidths(this, handle, width, height, context.scale, context.emBasis,
      context.rootFontSize, context.viewportWidth, context.viewportHeight)

  fun image() = NineSliceSource(
    Mason.nativeNineSliceSource(this, handle, true),
    readGradient(Mason.nativeNineSliceGradient(this, handle)),
  )

  companion object {
    private fun fromHandle(handle: Long): NativeNineSlice? =
      if (handle == 0L) null else NativeNineSlice(handle).also {
        Mason.shared.gc.track(it) { Mason.nativeNineSliceRelease(handle) }
      }

    fun parseBorderImage(value: String, color: Int): NativeNineSlice? =
      fromHandle(Mason.nativeBorderImageParse(value, color))

    fun parseMaskBorder(values: Array<String>, color: Int): NativeNineSlice? =
      fromHandle(Mason.nativeMaskBorderParse(values, color))

    fun install(program: NativeNineSlice?, style: Style, mask: Boolean) {
      val node = style.node
      if (node.isPlaceholder) return
      val mason = node.mason
      if (mason.inCompute) mason.deferStyleRecords(style)
      else style.prepareMut()
      Mason.nativeNineSliceInstall(program, program?.handle ?: 0L, if (mason.inCompute) 0L else mason.nativePtr, node.nativePtr, mask)
    }
  }
}

// MARK: - Geometry

/** Tiles along one axis: [starts] of tiles [size] long (clip them to the region). */
internal class AxisTiles(@JvmField val starts: FloatArray, @JvmField val size: Float) {
  override fun toString() = "AxisTiles(${starts.toList()}, $size)"
}

private val NO_TILES = AxisTiles(FloatArray(0), 0f)

/** Upper bound on tiles per axis, so a hairline slice can't stall a frame. */
private const val MAX_TILES = 2048

/**
 * Lays [tile]-long tiles along [start, start + length] per CSS Backgrounds 3 §6.5: `stretch`
 * fills it with one, `round` fits a whole number, `space` spreads whole tiles evenly and
 * `repeat` tiles outwards from one centred tile.
 */
internal fun axisTiles(start: Float, length: Float, tile: Float, mode: BorderImageRepeat): AxisTiles {
  if (length <= 0f) return NO_TILES
  if (mode == BorderImageRepeat.STRETCH) return AxisTiles(floatArrayOf(start), length)
  if (tile <= 0f || !tile.isFinite()) return NO_TILES
  return when (mode) {
    BorderImageRepeat.ROUND -> {
      val n = max(1, (length / tile).roundToInt()).coerceAtMost(MAX_TILES)
      val size = length / n
      AxisTiles(FloatArray(n) { start + it * size }, size)
    }

    BorderImageRepeat.SPACE -> {
      val n = floor(length / tile).toInt().coerceAtMost(MAX_TILES)
      if (n <= 0) return NO_TILES
      val gap = (length - n * tile) / (n + 1)
      AxisTiles(FloatArray(n) { start + gap + it * (tile + gap) }, tile)
    }

    else -> {
      val first0 = start + (length - tile) / 2f
      val before = ceil((first0 - start) / tile).toInt().coerceAtLeast(0)
      val first = first0 - before * tile
      val n = ceil((start + length - first) / tile).toInt().coerceIn(1, MAX_TILES)
      AxisTiles(FloatArray(n) { first + it * tile }, tile)
    }
  }
}

/** One of the nine parts: a source rectangle (image units) tiled over a destination region. */
internal class NineSlicePiece(
  @JvmField val src: RectBox,
  @JvmField val dst: RectBox,
  @JvmField val xs: AxisTiles,
  @JvmField val ys: AxisTiles,
  /** How [xs]/[ys] were laid out (corners stretch); the painter re-derives tiles from it. */
  @JvmField val modeX: BorderImageRepeat = BorderImageRepeat.STRETCH,
  @JvmField val modeY: BorderImageRepeat = BorderImageRepeat.STRETCH,
)

/** The border image area and its non-empty pieces. */
internal class NineSliceLayout(
  @JvmField val area: RectBox,
  @JvmField val pieces: List<NineSlicePiece>,
  /** Resolved slice offsets in image units (top, right, bottom, left). */
  @JvmField val slices: FloatArray,
  /** Used border image widths in device px (top, right, bottom, left). */
  @JvmField val widths: FloatArray,
) {
  /** The largest destination/source scale, i.e. how finely a vector source must be rasterized. */
  fun maxScale(): Float {
    var s = 0f
    for (p in pieces) {
      if (p.src.width > 0f) s = max(s, p.xs.size / p.src.width)
      if (p.src.height > 0f) s = max(s, p.ys.size / p.src.height)
    }
    return s
  }
}

/** The border box grown by the outsets (numbers multiply the border width). */
internal fun borderImageArea(spec: BorderImageSpec, w: Float, h: Float, borders: FloatArray, ctx: LengthContext): RectBox {
  val o = FloatArray(4) { i ->
    val v = spec.outset[i]
    max(0f, if (v.isNumber) v.value * borders[i] else v.toPx(0f, ctx))
  }
  // `0f -` rather than unary minus: no -0f edges (RectBox compares by Float.equals).
  return RectBox(0f - o[3], 0f - o[0], w + o[1], h + o[2])
}

/**
 * Resolves [spec] for a [w] x [h] border box (device px) with border widths [borders]
 * (top, right, bottom, left) against an image of [imgW] x [imgH] units.
 * [unitPx] is the device px of one image unit at intrinsic size, or 0 when the image has
 * no intrinsic size (gradients), in which case `auto` widths fall back to the border width.
 */
internal fun layoutNineSlice(
  spec: BorderImageSpec, w: Float, h: Float, borders: FloatArray,
  imgW: Float, imgH: Float, unitPx: Float, ctx: LengthContext,
): NineSliceLayout {
  val area = borderImageArea(spec, w, h, borders, ctx)
  val aw = area.width
  val ah = area.height

  // Slices: percentages of the image, numbers in image units; anything past the image is 100%.
  val s = FloatArray(4) { i ->
    val dim = if (i % 2 == 0) imgH else imgW
    val v = spec.slice[i]
    (if (v.isPercent) v.value / 100f * dim else v.value).coerceIn(0f, max(0f, dim))
  }

  val mathWidths = spec.widthProgram?.mathWidths(aw, ah, ctx)
  val ww = FloatArray(4) { i ->
    val math = mathWidths?.get(i)
    val v = spec.width[i]
    val horizontalSide = i % 2 == 1
    when {
      math != null && !math.isNaN() -> max(0f, math)
      v == null -> if (unitPx > 0f) s[i] * unitPx else borders[i]
      v.isNumber -> v.value * borders[i]
      else -> max(0f, v.toPx(if (horizontalSide) aw else ah, ctx))
    }
  }
  // Opposite widths that overlap are all reduced by the same factor.
  var f = 1f
  if (ww[3] + ww[1] > aw && ww[3] + ww[1] > 0f) f = min(f, max(0f, aw) / (ww[3] + ww[1]))
  if (ww[0] + ww[2] > ah && ww[0] + ww[2] > 0f) f = min(f, max(0f, ah) / (ww[0] + ww[2]))
  if (f < 1f) for (i in 0 until 4) ww[i] *= f

  val (wt, wr, wb, wl) = ww.toList()
  val (st, sr, sb, sl) = s.toList()
  val x0 = area.l + wl
  val x1 = area.r - wr
  val y0 = area.t + wt
  val y1 = area.b - wb
  val midW = x1 - x0
  val midH = y1 - y0
  // When the slices meet or cross, the edges and middle of that axis are empty.
  val smW = if (sl + sr < imgW) imgW - sl - sr else 0f
  val smH = if (st + sb < imgH) imgH - st - sb else 0f

  val pieces = ArrayList<NineSlicePiece>(9)
  fun single(start: Float, len: Float) = if (len > 0f) AxisTiles(floatArrayOf(start), len) else NO_TILES
  fun add(
    src: RectBox, dst: RectBox, xs: AxisTiles, ys: AxisTiles,
    mx: BorderImageRepeat = BorderImageRepeat.STRETCH, my: BorderImageRepeat = BorderImageRepeat.STRETCH,
  ) {
    if (src.width <= 0f || src.height <= 0f || dst.width <= 0f || dst.height <= 0f) return
    if (xs.starts.isEmpty() || ys.starts.isEmpty()) return
    pieces.add(NineSlicePiece(src, dst, xs, ys, mx, my))
  }

  // Corners: each slice scaled into its corner.
  add(RectBox(0f, 0f, sl, st), RectBox(area.l, area.t, x0, y0), single(area.l, wl), single(area.t, wt))
  add(RectBox(imgW - sr, 0f, imgW, st), RectBox(x1, area.t, area.r, y0), single(x1, wr), single(area.t, wt))
  add(RectBox(imgW - sr, imgH - sb, imgW, imgH), RectBox(x1, y1, area.r, area.b), single(x1, wr), single(y1, wb))
  add(RectBox(0f, imgH - sb, sl, imgH), RectBox(area.l, y1, x0, area.b), single(area.l, wl), single(y1, wb))

  // Edges: made as tall (top/bottom) or wide (left/right) as their area, the other side
  // scaled in proportion, then stretched/tiled along the edge.
  fun scale(dst: Float, src: Float) = if (src > 0f && dst > 0f) dst / src else 0f
  val kt = scale(wt, st)
  val kb = scale(wb, sb)
  val kl = scale(wl, sl)
  val kr = scale(wr, sr)
  if (smW > 0f) {
    add(RectBox(sl, 0f, imgW - sr, st), RectBox(x0, area.t, x1, y0), axisTiles(x0, midW, smW * kt, spec.repeatX), single(area.t, wt), spec.repeatX)
    add(RectBox(sl, imgH - sb, imgW - sr, imgH), RectBox(x0, y1, x1, area.b), axisTiles(x0, midW, smW * kb, spec.repeatX), single(y1, wb), spec.repeatX)
  }
  if (smH > 0f) {
    add(RectBox(0f, st, sl, imgH - sb), RectBox(area.l, y0, x0, y1), single(area.l, wl), axisTiles(y0, midH, smH * kl, spec.repeatY), my = spec.repeatY)
    add(RectBox(imgW - sr, st, imgW, imgH - sb), RectBox(x1, y0, area.r, y1), single(x1, wr), axisTiles(y0, midH, smH * kr, spec.repeatY), my = spec.repeatY)
  }
  // Middle (`fill` only): width scaled like the top edge (else bottom, else unscaled),
  // height like the left edge (else right, else unscaled). Gradient units are CSS px.
  if (spec.fill && smW > 0f && smH > 0f) {
    val natural = if (unitPx > 0f) unitPx else ctx.scale
    val sx = if (kt > 0f) kt else if (kb > 0f) kb else natural
    val sy = if (kl > 0f) kl else if (kr > 0f) kr else natural
    add(
      RectBox(sl, st, imgW - sr, imgH - sb), RectBox(x0, y0, x1, y1),
      axisTiles(x0, midW, smW * sx, spec.repeatX), axisTiles(y0, midH, smH * sy, spec.repeatY),
      spec.repeatX, spec.repeatY
    )
  }
  return NineSliceLayout(area, pieces, s, ww)
}

/** One run along an axis: draw over [start, end) mapping one tile of [tile] px at [origin]. */
private class Span(@JvmField var start: Int, @JvmField var end: Int, @JvmField var tile: Float, @JvmField var origin: Float, @JvmField var repeat: Boolean)

/**
 * Lays out the runs of one axis of a piece. Region edges are snapped to whole device px,
 * so neighbouring regions (which share the same unsnapped edge) abut exactly. Within a run
 * the tiles come from one REPEAT shader, so tiles meet with no seam either; `space` tiles
 * stand apart and each gets its own snapped run.
 */
private fun spans(lo: Float, hi: Float, tiles: AxisTiles, mode: BorderImageRepeat, out: ArrayList<Span>) {
  out.clear()
  val a = lo.roundToInt()
  val b = hi.roundToInt()
  if (b <= a) return
  val len = (b - a).toFloat()
  when (mode) {
    BorderImageRepeat.STRETCH -> out.add(Span(a, b, len, a.toFloat(), false))
    BorderImageRepeat.ROUND -> out.add(Span(a, b, len / tiles.starts.size, a.toFloat(), true))
    BorderImageRepeat.REPEAT -> out.add(Span(a, b, tiles.size, a + (len - tiles.size) / 2f, true))
    BorderImageRepeat.SPACE -> for (s in tiles.starts) {
      val ts = s.roundToInt()
      val te = (s + tiles.size).roundToInt()
      if (te > ts) out.add(Span(ts, te, (te - ts).toFloat(), ts.toFloat(), false))
    }
  }
}

/**
 * Paints [NineSliceLayout]s. Each slice is cut into its own bitmap and drawn through a
 * BitmapShader (CLAMP for one stretched tile, REPEAT for tiles), so filtering never samples
 * a neighbouring slice and adjoining tiles don't leave partial-alpha seams; the pieces of a
 * source are cached until the bitmap or slices change.
 */
internal class NineSlicePainter {
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
  private val matrix = Matrix()
  private val xSpans = ArrayList<Span>(4)
  private val ySpans = ArrayList<Span>(4)
  private var cachedSource: Bitmap? = null
  private val cachedRects = ArrayList<Rect>(9)
  private val cachedSlices = ArrayList<Bitmap>(9)

  private fun slice(bitmap: Bitmap, r: Rect): Bitmap {
    if (cachedSource !== bitmap) {
      cachedSource = bitmap
      cachedRects.clear()
      cachedSlices.clear()
    }
    for (i in cachedRects.indices) if (cachedRects[i] == r) return cachedSlices[i]
    val out = if (r.left == 0 && r.top == 0 && r.width() == bitmap.width && r.height() == bitmap.height) bitmap
    else Bitmap.createBitmap(bitmap, r.left, r.top, r.width(), r.height())
    cachedRects.add(Rect(r))
    cachedSlices.add(out)
    return out
  }

  /** Paints [layout] from [bitmap], which holds the whole [imgW] x [imgH]-unit source. */
  fun draw(canvas: Canvas, bitmap: Bitmap, imgW: Float, imgH: Float, layout: NineSliceLayout) {
    val kx = bitmap.width / imgW
    val ky = bitmap.height / imgH
    val src = Rect()
    for (p in layout.pieces) {
      src.set(
        (p.src.l * kx).roundToInt(), (p.src.t * ky).roundToInt(),
        (p.src.r * kx).roundToInt(), (p.src.b * ky).roundToInt()
      )
      src.intersect(0, 0, bitmap.width, bitmap.height)
      if (src.width() <= 0 || src.height() <= 0) continue
      spans(p.dst.l, p.dst.r, p.xs, p.modeX, xSpans)
      spans(p.dst.t, p.dst.b, p.ys, p.modeY, ySpans)
      if (xSpans.isEmpty() || ySpans.isEmpty()) continue
      val piece = slice(bitmap, src)
      for (sx in xSpans) for (sy in ySpans) {
        val shader = BitmapShader(
          piece,
          if (sx.repeat) Shader.TileMode.REPEAT else Shader.TileMode.CLAMP,
          if (sy.repeat) Shader.TileMode.REPEAT else Shader.TileMode.CLAMP,
        )
        matrix.setScale(sx.tile / piece.width, sy.tile / piece.height)
        matrix.postTranslate(sx.origin, sy.origin)
        shader.setLocalMatrix(matrix)
        paint.shader = shader
        canvas.drawRect(sx.start.toFloat(), sy.start.toFloat(), sx.end.toFloat(), sy.end.toFloat(), paint)
      }
    }
    paint.shader = null
  }
}

// MARK: - Source

/** Largest edge of a rasterized vector source, in device px. */
private const val MAX_SOURCE_RASTER_PX = 2048

/**
 * The image behind a border-image / mask-border: an SVG or raster data URL, a remote URL
 * (loaded once through Glide) or a gradient. [prepare] decides its unit size; [bitmap]
 * rasterizes vector sources at the scale they're drawn and caches the result.
 */
internal class NineSliceSource(private val url: String?, gradient: Gradient?) {
  private val gradientLayer: BackgroundLayer? = gradient?.let { BackgroundLayer(gradient = it) }
  private var svg: SvgDocument? = null
  private var raster: Bitmap? = null
  private var requested = false

  /** The image can't be displayed (bad URL, decode or load failure). */
  var failed = false
    private set

  /** Image units across and down (raster px, SVG user units, or CSS px for gradients). */
  var imgW = 0f
    private set
  var imgH = 0f
    private set

  /** Device px of one image unit at intrinsic size; 0 when there is none (gradients). */
  var unitPx = 0f
    private set

  /** Bumped when the decoded image changes (a remote load landed). */
  var generation = 0
    private set

  private var rendered: Bitmap? = null
  private var renderedColor = 0

  /**
   * Decodes the image, or starts loading a remote one (the view is invalidated when it lands).
   * True once it is available; false while loading or when [failed].
   */
  fun load(context: Context, view: android.view.View?): Boolean {
    if (failed) return false
    if (gradientLayer != null) return true
    val u = url
    if (u.isNullOrEmpty()) {
      failed = true
      return false
    }
    if (u.startsWith("data:image/svg", ignoreCase = true)) {
      if (svg != null) return true
      val doc = decodeSvgDataUrl(u)
      val vb = doc?.viewBox
      if (doc == null || doc.width <= 0f || doc.height <= 0f || (vb != null && (vb[2] <= 0f || vb[3] <= 0f))) {
        failed = true
        return false
      }
      svg = doc
      return true
    }
    return raster != null || loadRaster(context, view, u) != null
  }

  /**
   * Fills [imgW]/[imgH]/[unitPx] after [load]. False until the image is available.
   * [areaW]/[areaH] (device px) size a gradient.
   */
  fun prepare(context: Context, view: android.view.View?, areaW: Float, areaH: Float, scale: Float): Boolean {
    if (!load(context, view)) return false
    if (gradientLayer != null) {
      if (areaW <= 0f || areaH <= 0f) return false
      // A gradient has no intrinsic size: it's sized to the border image area, in CSS px.
      imgW = areaW / scale
      imgH = areaH / scale
      unitPx = 0f
      return true
    }
    val doc = svg
    if (doc != null) {
      // Slice numbers are user units: the viewBox when there is one.
      val vb = doc.viewBox
      imgW = vb?.get(2) ?: doc.width
      imgH = vb?.get(3) ?: doc.height
      unitPx = doc.width / imgW * scale
      return true
    }
    val bitmap = raster ?: return false
    imgW = bitmap.width.toFloat()
    imgH = bitmap.height.toFloat()
    // One image pixel is one CSS px.
    unitPx = scale
    return true
  }

  private fun loadRaster(context: Context, view: android.view.View?, u: String): Bitmap? {
    if (u.startsWith("data:", ignoreCase = true)) {
      val decoded = decodeDataUrlBitmap(u)
      if (decoded == null) failed = true else raster = decoded
      return decoded
    }
    if (requested) return null
    requested = true
    Glide.with(context).asBitmap().load(imageSource(context, u)).into(object : CustomTarget<Bitmap>() {
      override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
        raster = resource
        generation++
        view?.invalidate()
      }

      override fun onLoadFailed(errorDrawable: Drawable?) {
        failed = true
        generation++
        view?.invalidate()
      }

      override fun onLoadCleared(placeholder: Drawable?) {}
    })
    return null
  }

  /**
   * The whole source as a bitmap, after [prepare]: rasters as decoded, SVGs at [pxPerUnit]
   * device px per user unit, gradients at [areaW] x [areaH] device px.
   */
  fun bitmap(view: android.view.View?, pxPerUnit: Float, areaW: Float, areaH: Float, currentColor: Int): Bitmap? {
    raster?.let { return it }
    val (pw, ph) = if (gradientLayer != null) {
      ceil(areaW).toInt() to ceil(areaH).toInt()
    } else {
      val fit = min(1f, MAX_SOURCE_RASTER_PX / max(imgW * pxPerUnit, imgH * pxPerUnit))
      ceil(imgW * pxPerUnit * fit).toInt() to ceil(imgH * pxPerUnit * fit).toInt()
    }
    if (pw <= 0 || ph <= 0) return null
    val doc = svg
    val color = if (doc?.usesCurrentColor == true) currentColor else 0
    rendered?.let { if (it.width == pw && it.height == ph && renderedColor == color) return it }
    val out = when {
      doc != null -> renderSvgDocument(doc, pw, ph, color)
      gradientLayer != null -> Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888).also {
        val rect = RectF(0f, 0f, pw.toFloat(), ph.toFloat())
        drawGradient(gradientLayer, Canvas(it), rect, rect)
      }

      else -> null
    } ?: return null
    // Not recycled: a recorded display list may still reference the old one.
    rendered = out
    renderedColor = color
    return out
  }
}

/** Device px per unit to rasterize a vector source at so the largest piece stays sharp. */
internal fun nineSliceRasterScale(layout: NineSliceLayout, unitPx: Float): Float =
  max(max(1f, unitPx), ceil(layout.maxScale()))

/** Border widths (top, right, bottom, left) in device px from the layout. */
internal fun computedBorders(node: Node, out: FloatArray): FloatArray {
  out[0] = node.computedBorderTop
  out[1] = node.computedBorderRight
  out[2] = node.computedBorderBottom
  out[3] = node.computedBorderLeft
  return out
}

/**
 * `border-image`, drawn by the 9-slice painter in place of the border styles. While the
 * source loads (or if it fails) the normal border is drawn, as CSS falls back to it.
 */
internal class BorderImage(private val program: NativeNineSlice) {
  private val source = program.image()
  private val borders = FloatArray(4)
  private val painter = NineSlicePainter()

  /** Draws the image for a [w] x [h] box; false to draw the normal border instead. */
  fun draw(view: android.view.View, style: Style, canvas: Canvas, w: Float, h: Float): Boolean {
    if (w <= 0f || h <= 0f) return true
    val ctx = LengthContext.forStyle(style)
    val spec = program.read(ctx) ?: return false
    computedBorders(style.node, borders)
    val area = borderImageArea(spec, w, h, borders, ctx)
    if (!source.prepare(view.context, view, area.width, area.height, ctx.scale)) return false
    val layout = layoutNineSlice(spec, w, h, borders, source.imgW, source.imgH, source.unitPx, ctx)
    if (layout.pieces.isEmpty()) return true
    val bitmap = source.bitmap(
      view, nineSliceRasterScale(layout, source.unitPx),
      layout.area.width, layout.area.height, style.resolvedColor
    ) ?: return false
    painter.draw(canvas, bitmap, source.imgW, source.imgH, layout)
    return true
  }
}
