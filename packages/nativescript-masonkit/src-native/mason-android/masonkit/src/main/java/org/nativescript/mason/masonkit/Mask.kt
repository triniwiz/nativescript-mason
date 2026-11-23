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
// <style-keys:mask-names> generated from tools/scripts/style-keys/style-keys.schema
internal val MASK_CSS_NAMES = arrayOf(
  "mask-image",
  "mask-size",
  "mask-position",
  "mask-repeat",
  "mask-origin",
  "mask-clip",
  "mask-mode",
  "mask-composite",
  "mask-border-source",
  "mask-border-slice",
  "mask-border-width",
  "mask-border-outset",
  "mask-border-repeat",
  "mask-border-mode",
)
// </style-keys:mask-names>

/** How many of [MASK_CSS_NAMES] describe the `mask-image` layers. */
private const val MASK_LAYER_LONGHANDS = MaskInputRecord.STRIDE

// <style-keys:mask-keywords> generated from tools/scripts/style-keys/style-keys.schema
enum class MaskClip(val css: String) {
  BORDER_BOX("border-box"),
  PADDING_BOX("padding-box"),
  CONTENT_BOX("content-box"),
  NO_CLIP("no-clip");

  companion object {
    internal fun fromCode(code: Int): MaskClip? = entries.getOrNull(code)

    fun parse(value: String): MaskClip? =
      Mason.expandCssShorthand("keyword:mask-clip", value)?.firstOrNull()?.toIntOrNull()?.let(::fromCode)
  }
}

enum class MaskMode(val css: String) {
  MATCH_SOURCE("match-source"),
  ALPHA("alpha"),
  LUMINANCE("luminance");

  companion object {
    internal fun fromCode(code: Int): MaskMode? = entries.getOrNull(code)

    fun parse(value: String): MaskMode? =
      Mason.expandCssShorthand("keyword:mask-mode", value)?.firstOrNull()?.toIntOrNull()?.let(::fromCode)
  }
}

enum class MaskComposite(val css: String) {
  ADD("add"),
  SUBTRACT("subtract"),
  INTERSECT("intersect"),
  EXCLUDE("exclude");

  companion object {
    internal fun fromCode(code: Int): MaskComposite? = entries.getOrNull(code)

    fun parse(value: String): MaskComposite? =
      Mason.expandCssShorthand("keyword:mask-composite", value)?.firstOrNull()?.toIntOrNull()?.let(::fromCode)
  }
}
// </style-keys:mask-keywords>

internal fun MaskComposite.porterDuff(): PorterDuff.Mode = when (this) {
  MaskComposite.ADD -> PorterDuff.Mode.SRC_OVER
  MaskComposite.SUBTRACT -> PorterDuff.Mode.SRC_OUT
  MaskComposite.INTERSECT -> PorterDuff.Mode.SRC_IN
  MaskComposite.EXCLUDE -> PorterDuff.Mode.XOR
}

internal fun parseMaskOrigin(value: String): BackgroundOrigin? = when (MaskClip.parse(value)) {
  MaskClip.BORDER_BOX -> BackgroundOrigin.BORDER_BOX
  MaskClip.PADDING_BOX -> BackgroundOrigin.PADDING_BOX
  MaskClip.CONTENT_BOX -> BackgroundOrigin.CONTENT_BOX
  MaskClip.NO_CLIP, null -> null
}

class MaskLayer(
  /** Image or gradient plus size/position/repeat/origin and the image caches; null for `none`. */
  val source: BackgroundLayer?,
  var clip: MaskClip = MaskClip.BORDER_BOX,
  var mode: MaskMode = MaskMode.MATCH_SOURCE,
  var composite: MaskComposite = MaskComposite.ADD,
)

internal fun parseMaskGradient(token: String): Gradient? = parseGradient(token)

/** `mask-repeat`: one or two keywords. Null when invalid. */
internal fun parseMaskRepeat(value: String): BackgroundRepeat? = BackgroundRepeat.parse(value)

internal fun parseMaskLayers(
  image: String,
  size: String = "",
  position: String = "",
  repeat: String = "",
  origin: String = "",
  clip: String = "",
  mode: String = "",
  composite: String = "",
): List<MaskLayer> =
  NativeMaskProgram.parse(arrayOf(image, size, position, repeat, origin, clip, mode, composite), Color.BLACK)
    ?.layers(LengthContext.forStyleMask()).orEmpty()

private class NativeMaskProgram private constructor(private val handle: Long) {
  fun layers(context: LengthContext): List<MaskLayer> {
    val result = Mason.nativeMaskRead(
      this, handle, context.scale, context.emBasis, context.rootFontSize, context.viewportWidth, context.viewportHeight
    ) ?: return emptyList()
    val paint = NativePaintRead(result)
    val values = paint.values
    val stride = BackgroundRecord.STRIDE + MaskLayerRecord.STRIDE
    return List(paint.count) { row ->
      val start = row * stride
      val mask = start + BackgroundRecord.STRIDE
      val source = if (values[start + BackgroundRecord.IMAGE_KIND] == 0.0) null
      else readBackgroundLayer(paint, start, row, context.emBasis)
      MaskLayer(
        source,
        clip = MaskClip.fromCode(values[mask + MaskLayerRecord.CLIP].toInt()) ?: MaskClip.BORDER_BOX,
        mode = MaskMode.fromCode(values[mask + MaskLayerRecord.MODE].toInt()) ?: MaskMode.MATCH_SOURCE,
        composite = MaskComposite.fromCode(values[mask + MaskLayerRecord.COMPOSITE].toInt()) ?: MaskComposite.ADD,
      )
    }
  }

  companion object {
    fun parse(values: Array<String>, color: Int): NativeMaskProgram? {
      val handle = Mason.nativeMaskParse(values, color)
      if (handle == 0L) return null
      return NativeMaskProgram(handle).also { Mason.shared.gc.track(it) { Mason.nativeMaskRelease(handle) } }
    }

    fun install(program: NativeMaskProgram?, style: Style) {
      val node = style.node
      if (node.isPlaceholder) return
      val mason = node.mason
      if (mason.inCompute) mason.deferStyleRecords(style)
      else style.prepareMut()
      Mason.nativeMaskInstall(program, program?.handle ?: 0L, if (mason.inCompute) 0L else mason.nativePtr, node.nativePtr)
    }
  }
}

private fun LengthContext.Companion.forStyleMask(): LengthContext {
  val mason = Mason.shared
  return LengthContext(mason.scale, mason.rootFontSize, mason.rootFontSize, mason.viewportWidth, mason.viewportHeight)
}

/** Alpha = luminance of the layer drawn over black, i.e. luminance x alpha. */
internal val LUMINANCE_MATRIX = floatArrayOf(
  0f, 0f, 0f, 0f, 0f,
  0f, 0f, 0f, 0f, 0f,
  0f, 0f, 0f, 0f, 0f,
  0.2125f, 0.7154f, 0.0721f, 0f, 0f,
)

/** How far past the border box a no-clip mask is composed, in device px. */
private const val MAX_NO_CLIP_OUTSET = 1024f

class Mask internal constructor(private val style: Style) {

  companion object {
    // <style-keys:mask-constants> generated from tools/scripts/style-keys/style-keys.schema
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
    // </style-keys:mask-constants>
  }

  /** Longhands as set, indexed like [MASK_CSS_NAMES]; empty is the initial value. */
  private val base = Array(MASK_CSS_NAMES.size) { "" }

  /** The resolved longhands [layers] was parsed from. */
  private val builtFrom = arrayOfNulls<String>(MASK_CSS_NAMES.size)
  private var layers: List<MaskLayer> = emptyList()

  /** `mask-border`, with its source (null without one); multiplied into the layers' mask. */
  private var border: NativeNineSlice? = null
  private var borderSource: NineSliceSource? = null
  private var borderContext: LengthContext? = null
  private var version = 0

  /** A pseudo-class rule set a mask longhand; until then only [base] is consulted. */
  internal var hasPseudo = false

  /** [beginDraw]'s save count for [endMask] (draw() isn't re-entered for one view). */
  internal var pendingSave = -1

  operator fun get(index: Int): String = base[index]

  fun set(index: Int, value: String) {
    setBase(index, value)
    changed()
  }

  internal fun setBase(index: Int, value: String) {
    base[index] = value.trim()
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
      val input = Array(MASK_LAYER_LONGHANDS) { builtFrom[it]!! }
      val program = NativeMaskProgram.parse(input, style.color)
      NativeMaskProgram.install(program, style)
      layers = program?.layers(LengthContext.forStyle(style)).orEmpty()
      version++
    }
    if (borderDirty) {
      val input = Array(NineSliceInputRecord.STRIDE) { builtFrom[BORDER_SOURCE + it]!! }
      val spec = NativeNineSlice.parseMaskBorder(input, style.color)
      NativeNineSlice.install(spec, style, mask = true)
      // Keep the loaded image while only the geometry longhands change.
      if (spec?.source != border?.source) borderSource = spec?.image()
      border = spec
      version++
    }
    return layers
  }

  /** The mask border for the current state, unless its image can't be displayed (then it's ignored). */
  private fun currentBorder(): NativeNineSlice? = border?.takeUnless { borderSource?.failed == true }

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
    val border = currentBorder()?.let { program ->
      val context = LengthContext.forStyle(style)
      if (context != borderContext) {
        borderContext = context
        version++
      }
      program.read(context)
    }
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
        drawBackground(view.context, view, source, canvas, paintRect, area, color, style.resolvedFontSize)
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
  val shear = style.transformShear
  if (clip == null && mask == null && shear == 0f) return -1
  val outer = canvas.save()
  if (shear != 0f) {
    // The view's own properties hold the rest of the transform, about the same pivot.
    val px = view.scrollX + view.pivotX
    val py = view.scrollY + view.pivotY
    canvas.translate(px, py)
    canvas.skew(shear, 0f)
    canvas.translate(-px, -py)
  }
  val clipped = clip?.begin(view, canvas, masked = mask?.isActive() == true) == true
  val maskSave = mask?.beginDraw(view, canvas) ?: -1
  mask?.pendingSave = maskSave
  if (!clipped && maskSave < 0 && shear == 0f) {
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
