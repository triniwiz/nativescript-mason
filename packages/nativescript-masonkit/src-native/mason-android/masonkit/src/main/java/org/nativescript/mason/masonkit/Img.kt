package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.widget.ImageView
import androidx.core.graphics.withClip
import androidx.core.graphics.withMatrix
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import org.nativescript.mason.masonkit.enums.ObjectFit
import kotlin.math.ceil
import kotlin.math.hypot
import kotlin.math.max

@SuppressLint("AppCompatCustomView")
class Img @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : ImageView(context, attrs), Element, MeasureFunc {
  override lateinit var node: Node
    private set

  var onStateChange: ((LoadingState) -> Unit)? = null

  override val style: Style
    get() = node.style

  override val view: android.view.View
    get() = this

  internal var currentBitmap: Bitmap? = null

  var objectFit: ObjectFit
    get() {
      return style.objectFit
    }
    set(value) {
      style.objectFit = value
    }

  override fun setImageBitmap(bm: Bitmap?) {
    super.setImageBitmap(bm)
    currentBitmap = bm
    if (src.isEmpty()) {
      markDirtyAndRecompute()
    }
  }

  override fun setImageResource(resId: Int) {
    super.setImageResource(resId)
    if (src.isEmpty()) {
      markDirtyAndRecompute()
    }
  }

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    node = mason.createImageNode(this).apply {
      view = this@Img
      isImage = true
    }
  }

  internal val mImgMatrix = Matrix()

  init {
    if (!override) {
      if (!::node.isInitialized) {
        node = Mason.shared.createImageNode(this).apply {
          view = this@Img
          isImage = true
        }
      }
    }
    scaleType = ScaleType.MATRIX
  }

  override fun onNodeAttached() {
    markDirtyAndRecompute()
  }

  private fun markDirtyAndRecompute() {
    node.dirty()
    if (!node.style.inBatch) {
      if (node.parent == null) {
        invalidateLayout()
      } else {
        invalidateLayout(true)
      }
      requestLayout()
      invalidate()
    }
  }

  private var currentTarget: CustomTarget<Bitmap>? = null

  /** Bumped per [src] so a slow SVG fetch can't overwrite a newer source. */
  private var svgGeneration = 0

  /** The SVG [src], parsed; drawn as vectors at the size it is shown. */
  val svg: SvgDocument?
    get() = (drawable as? SvgDrawable)?.doc

  /** SVG sources (data URLs, files, `.svg` URLs) go through Mason's SVG reader; false for anything else. */
  private fun loadSvg(value: String): Boolean {
    val path = value.substringBefore('?').substringBefore('#')
    val remote = (value.startsWith("http://", true) || value.startsWith("https://", true)) && path.endsWith(".svg", true)
    if (!remote && !isSvgSource(value)) return false
    val generation = svgGeneration
    onStateChange?.let { it(LoadingState.Loading) }
    if (!remote) {
      applySvg(generation, decodeSvgSource(context, value))
      return true
    }
    Thread {
      val doc = try {
        java.net.URL(value).openStream().use { parseSvgDocument(it.readBytes().toString(Charsets.UTF_8)) }
      } catch (_: Throwable) {
        null
      }
      post { applySvg(generation, doc) }
    }.start()
    return true
  }

  private fun applySvg(generation: Int, doc: SvgDocument?) {
    if (generation != svgGeneration) return
    setImageDrawable(doc?.let { SvgDrawable(it, resources.displayMetrics.density) { style.resolvedColor } })
    markDirtyAndRecompute()
    onStateChange?.let { it(if (doc != null) LoadingState.Loaded else LoadingState.Error) }
  }

  var src: String = ""
    set(value) {
      field = value
      currentTarget?.let {
        Glide.with(this).clear(it)
        currentTarget = null
      }
      svgGeneration++
      if (drawable is SvgDrawable) setImageDrawable(null)
      if (loadSvg(value)) return
      val target = object : CustomTarget<Bitmap>(
        when (node.computeCache.width) {
          Float.MIN_VALUE, -2f, -1f -> SIZE_ORIGINAL
          else -> node.computeCache.width.toInt()
        },
        when (node.computeCache.height) {
          Float.MIN_VALUE, -2f, -1f -> SIZE_ORIGINAL
          else -> node.computeCache.height.toInt()
        }
      ) {
        override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
          setImageBitmap(resource)
          markDirtyAndRecompute()
          onStateChange?.let {
            it(LoadingState.Loaded)
          }
        }

        override fun onLoadFailed(errorDrawable: Drawable?) {
          super.onLoadFailed(errorDrawable)
          markDirtyAndRecompute()
          onStateChange?.let {
            it(LoadingState.Error)
          }
        }

        override fun onLoadCleared(placeholder: Drawable?) {
          setImageDrawable(placeholder)
          markDirtyAndRecompute()
        }

      }
      currentTarget = target
      onStateChange?.let {
        it(LoadingState.Loading)
      }
      Glide.with(this)
        .asBitmap()
        .load(imageSource(context, value))
        .into(target)

    }

  val srcF = android.graphics.RectF()
  val dstF = android.graphics.RectF()

  // The mask and clip-path cover the whole draw: own box, content and children (see Mask.kt).
  override fun draw(canvas: Canvas) {
    val save = beginMask(this, style, canvas)
    super.draw(canvas)
    endMask(style, canvas, save)
  }

  // A touch outside the clip-path passes through to what's beneath (see ClipPath.kt).
  override fun dispatchTouchEvent(ev: android.view.MotionEvent): Boolean =
    !clipPathRejectsTouch(this, style, ev) && super.dispatchTouchEvent(ev)

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    if (::node.isInitialized) style.onViewSizeChanged(this)
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun onDraw(canvas: Canvas) {

    // map the drawable's intrinsic rect -> destination region with a Matrix so positioning
    // uses float math and behaves like imageMatrix
    val d = drawable
    val iw = d?.intrinsicWidth ?: 0
    val ih = d?.intrinsicHeight ?: 0

    val cw = width - paddingLeft - paddingRight
    val ch = height - paddingTop - paddingBottom

    val dstLeft = paddingLeft.toFloat()
    val dstTop = paddingTop.toFloat()
    srcF.set(0f, 0f, iw.toFloat(), ih.toFloat())
    dstF.set(dstLeft, dstTop, dstLeft + cw.toFloat(), dstTop + ch.toFloat())

    mImgMatrix.reset()
    // Read object-position offsets from style buffer (percentage 0..100, default 50 = center)
    val opXType = style.values.get(StyleKeys.OBJECT_POSITION_X_TYPE)
    val opYType = style.values.get(StyleKeys.OBJECT_POSITION_Y_TYPE)
    val opXPct = if (opXType != 0.toByte()) style.values.getFloat(StyleKeys.OBJECT_POSITION_X_VALUE) / 100f else 0.5f
    val opYPct = if (opYType != 0.toByte()) style.values.getFloat(StyleKeys.OBJECT_POSITION_Y_VALUE) / 100f else 0.5f

    when (style.objectFit) {
      ObjectFit.Cover -> {
        if (iw > 0 && ih > 0) {
          val scale = max(cw.toFloat() / iw, ch.toFloat() / ih)

          val dx = dstLeft + (cw - iw * scale) * opXPct
          val dy = dstTop + (ch - ih * scale) * opYPct

          mImgMatrix.reset()
          mImgMatrix.setScale(scale, scale)
          mImgMatrix.postTranslate(dx, dy)
        } else {
          mImgMatrix.reset()
          mImgMatrix.postTranslate(dstLeft, dstTop)
        }
      }

      ObjectFit.Contain -> {
        if (iw > 0 && ih > 0) {
          val scale = kotlin.math.min(cw.toFloat() / iw, ch.toFloat() / ih)
          val dx = dstLeft + (cw - iw * scale) * opXPct
          val dy = dstTop + (ch - ih * scale) * opYPct
          mImgMatrix.setScale(scale, scale)
          mImgMatrix.postTranslate(dx, dy)
        } else {
          mImgMatrix.postTranslate(dstLeft, dstTop)
        }
      }

      ObjectFit.Fill -> {
        mImgMatrix.setRectToRect(srcF, dstF, Matrix.ScaleToFit.FILL)
      }

      ObjectFit.None -> {
        mImgMatrix.postTranslate(dstLeft, dstTop)
      }

      ObjectFit.ScaleDown -> {
        if (iw > 0 && ih > 0) {
          val containScale = kotlin.math.min(cw.toFloat() / iw, ch.toFloat() / ih)
          val scale = kotlin.math.min(1f, containScale)
          val dx = dstLeft + (cw - iw * scale) * opXPct
          val dy = dstTop + (ch - ih * scale) * opYPct
          mImgMatrix.setScale(scale, scale)
          mImgMatrix.postTranslate(dx, dy)
        } else {
          mImgMatrix.postTranslate(dstLeft, dstTop)
        }
      }
    }

    imageMatrix = mImgMatrix

    val suppress = (getTag(R.id.tag_suppress_ops) as? Boolean) == true
    val callSuper = suppress || !(iw > 0 && ih > 0 && cw > 0 && ch > 0)

    ViewUtils.onDraw(this, canvas, style) { c ->
      if (callSuper) {
        super.onDraw(c)
      } else {
        // clip to the image content box so object-fit results don't paint outside the view bounds
        val clipLeft = paddingLeft.toFloat()
        val clipTop = paddingTop.toFloat()
        val clipRight = clipLeft + cw.toFloat()
        val clipBottom = clipTop + ch.toFloat()

        c.withClip(clipLeft, clipTop, clipRight, clipBottom) {
          c.withMatrix(mImgMatrix) {
            d!!.setBounds(0, 0, iw, ih)
            d.draw(this)
          }
        }
      }
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    if (specWidthMode == MeasureSpec.EXACTLY && specHeightMode == MeasureSpec.EXACTLY) {
      setMeasuredDimension(
        specWidth, specHeight
      )
    } else if (parent !is Element) {
      computeOrDeferNested(
        View.mapMeasureSpec(specWidthMode, specWidth).value,
        View.mapMeasureSpec(specHeightMode, specHeight).value
      )

      layoutFlat()

      setMeasuredDimension(
        node.computedWidth.toInt(), node.computedHeight.toInt(),
      )
    } else {
      var width = node.computedWidth.toInt()
      var height = node.computedHeight.toInt()

      if (specWidthMode == MeasureSpec.UNSPECIFIED) {
        width = drawable?.intrinsicWidth ?: 0
      }

      if (specHeightMode == MeasureSpec.UNSPECIFIED) {
        height = drawable?.intrinsicHeight ?: 0
      }

      setMeasuredDimension(
        width, height
      )
    }
  }

  override fun measure(
    knownWidth: Float, knownHeight: Float,
    availableWidth: Float, availableHeight: Float
  ): Long {

    val width = knownWidth.takeIf {
      !it.isNaN() && it >= 0
    }

    val height = knownHeight.takeIf {
      !it.isNaN() && it >= 0
    }

    val iw = (drawable?.intrinsicWidth ?: 0).coerceAtLeast(0).toFloat()
    val ih = (drawable?.intrinsicHeight ?: 0).coerceAtLeast(0).toFloat()
    // One known side keeps the image's ratio.
    val retWidth = width ?: if (height != null && ih > 0f) height * iw / ih else iw
    val retHeight = height ?: if (width != null && iw > 0f) width * ih / iw else ih

    if (width != null && height != null) {
      drawable?.setBounds(0, 0, knownWidth.toInt(), knownHeight.toInt())
    }

    return MeasureOutput.make(retWidth, retHeight)
  }

}

/** Largest edge of an `<img>` SVG raster, in device px. */
private const val MAX_IMG_SVG_RASTER_PX = 4096

/**
 * An SVG as a drawable: intrinsic size in device px (1 SVG px is 1 CSS px), rasterized at the device
 * size it is drawn at, again when that or [currentColor] changes.
 */
internal class SvgDrawable(val doc: SvgDocument, private val density: Float, private val currentColor: () -> Int) : Drawable() {
  private var raster: Bitmap? = null
  private var rasterColor = 0
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
  private val dst = RectF()
  private val values = FloatArray(9)

  override fun getIntrinsicWidth() = ceil(doc.width * density).toInt()
  override fun getIntrinsicHeight() = ceil(doc.height * density).toInt()

  override fun draw(canvas: Canvas) {
    val b = bounds
    if (b.isEmpty) return
    @Suppress("DEPRECATION")
    canvas.matrix.getValues(values)
    val sx = hypot(values[Matrix.MSCALE_X], values[Matrix.MSKEW_Y])
    val sy = hypot(values[Matrix.MSKEW_X], values[Matrix.MSCALE_Y])
    val fit = minOf(1f, MAX_IMG_SVG_RASTER_PX / maxOf(b.width() * sx, b.height() * sy))
    val pw = ceil(b.width() * sx * fit).toInt().coerceAtLeast(1)
    val ph = ceil(b.height() * sy * fit).toInt().coerceAtLeast(1)
    val color = if (doc.usesCurrentColor) currentColor() else 0
    var bitmap = raster
    if (bitmap == null || bitmap.width != pw || bitmap.height != ph || rasterColor != color) {
      bitmap = renderSvgDocument(doc, pw, ph, color) ?: return
      raster = bitmap
      rasterColor = color
    }
    dst.set(b)
    canvas.drawBitmap(bitmap, null, dst, paint)
  }

  override fun setAlpha(alpha: Int) {
    paint.alpha = alpha
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    paint.colorFilter = colorFilter
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity() = PixelFormat.TRANSLUCENT
}
