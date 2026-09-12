package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.view.View
import android.view.ViewTreeObserver
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Implements CSS `backdrop-filter` on Android.
 *
 * The naive approach — `view.setRenderEffect(effect)` — filters the view's OWN
 * render output (its background AND every child), so the element's own content
 * (e.g. `Text "Hello world"`) gets blurred. That is the opposite of what CSS
 * `backdrop-filter` specifies: the filter must apply only to the content drawn
 * *behind* the element (the "backdrop"), while the element's own content stays
 * crisp on top.
 *
 * Backdrop capture deliberately uses a software [Bitmap] plus [stackBlur]
 * instead of `RenderNode` + `RenderEffect`: that capture/effect chain has
 * crashed RenderThread on Android 16, while regular foreground `filter: blur()`
 * remains safe.
 *
 *  1. A [ViewTreeObserver.OnPreDrawListener] on the target runs each frame.
 *  2. It draws the backdrop's root view into a downscaled [Bitmap], translated
 *     so the target's top-left maps to (0,0). While drawing, the target draws
 *     nothing (the [isCapturing] guard short-circuits [ViewUtils] render), so
 *     the snapshot contains only what's behind the target.
 *  3. [stackBlur] blurs that bitmap in place; a combined [ColorMatrix] (for
 *     brightness/contrast/etc.) is applied later via a [Paint] at draw time.
 *  4. During the target's normal draw, [draw] blits the blurred bitmap
 *     *underneath* the element's own background/border/children — so the
 *     backdrop is filtered and the content stays sharp.
 */
internal class BackdropHelper(private val target: View) {

  private var cssFilter: CSSFilters.CSSFilter? = null
  private var blurRadiusPx = 0f
  private var colorMatrix: ColorMatrix? = null

  private var blurredBitmap: Bitmap? = null
  private var contentWidth = 0
  private var contentHeight = 0

  /** True only while [capture] is drawing the root into the capture bitmap. */
  @Volatile
  var isCapturing = false
    private set

  private var listenerAttached = false
  private var enabled = false

  private val targetLocation = IntArray(2)
  private val rootLocation = IntArray(2)
  private val srcRect = Rect()
  private val dstRect = RectF()
  private val drawPaint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)

  private val preDrawListener = ViewTreeObserver.OnPreDrawListener {
    capture()
    true
  }

  private val attachListener = object : View.OnAttachStateChangeListener {
    override fun onViewAttachedToWindow(v: View) {
      registerPreDraw()
    }

    override fun onViewDetachedFromWindow(v: View) {
      unregisterPreDraw()
    }
  }

  /** Update the active filter chain. Pass null/empty to tear the helper down. */
  fun setFilter(filter: CSSFilters.CSSFilter?) {
    cssFilter = filter
    blurRadiusPx = filter?.backdropBlurRadiusPx() ?: 0f
    colorMatrix = filter?.buildBackdropColorMatrix()
    if (filter != null && filter.filters.isNotEmpty() && (blurRadiusPx > 0f || colorMatrix != null)) {
      enable()
    } else {
      disable()
    }
  }

  private fun enable() {
    if (enabled) return
    enabled = true
    target.addOnAttachStateChangeListener(attachListener)
    if (target.isAttachedToWindow) {
      registerPreDraw()
    }
  }

  fun disable() {
    if (!enabled) return
    enabled = false
    target.removeOnAttachStateChangeListener(attachListener)
    unregisterPreDraw()
    blurredBitmap?.recycle()
    blurredBitmap = null
  }

  private fun registerPreDraw() {
    if (listenerAttached) return
    val vto = target.viewTreeObserver
    if (vto.isAlive) {
      vto.addOnPreDrawListener(preDrawListener)
      listenerAttached = true
    }
  }

  private fun unregisterPreDraw() {
    if (!listenerAttached) return
    val vto = target.viewTreeObserver
    if (vto.isAlive) {
      vto.removeOnPreDrawListener(preDrawListener)
    }
    listenerAttached = false
  }

  /**
   * Prefer the Activity content view over the window decor so toolbar/system
   * chrome is not included in the captured backdrop.
   */
  private fun findCaptureRoot(): View {
    var v: View = target
    while (true) {
      if (v.id == android.R.id.content) return v
      val parent = v.parent
      if (parent !is View) return target.rootView
      v = parent
    }
  }

  /**
   * Blur at a reduced resolution; larger radii can downscale further without
   * losing useful detail.
   */
  private fun downscaleFor(radiusPx: Float): Int = when {
    radiusPx <= 4f -> 2
    radiusPx <= 16f -> 4
    else -> 8
  }

  private fun capture() {
    val w = target.width
    val h = target.height
    if (w <= 0 || h <= 0) return
    if (!target.isShown) return

    val root = findCaptureRoot()
    if (root.width <= 0 || root.height <= 0) return

    val scale = downscaleFor(blurRadiusPx)
    val bw = max(1, w / scale)
    val bh = max(1, h / scale)

    val bmp = try {
      Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888)
    } catch (_: Throwable) {
      return
    }

    val recorded = try {
      val canvas = Canvas(bmp)
      target.getLocationInWindow(targetLocation)
      root.getLocationInWindow(rootLocation)
      canvas.scale(1f / scale, 1f / scale)
      canvas.translate(
        -(targetLocation[0] - rootLocation[0]).toFloat(),
        -(targetLocation[1] - rootLocation[1]).toFloat()
      )
      isCapturing = true
      // Draws the whole hierarchy; the target itself short-circuits to nothing
      // via the isCapturing guard in ViewUtils, so only the backdrop is captured.
      root.draw(canvas)
      true
    } catch (_: Throwable) {
      false
    } finally {
      isCapturing = false
    }

    if (!recorded) {
      bmp.recycle()
      return
    }

    if (blurRadiusPx > 0f) {
      val r = (blurRadiusPx / scale).roundToInt().coerceIn(1, 25)
      try {
        stackBlur(bmp, r)
      } catch (_: Throwable) {
        // Show the captured backdrop rather than dropping it entirely.
      }
    }

    val old = blurredBitmap
    blurredBitmap = bmp
    contentWidth = w
    contentHeight = h
    old?.recycle()

    target.invalidate()
  }

  /**
   * Draw the filtered backdrop into [canvas], clipped to [clipPath] (the
   * element's rounded outer shape) when provided. Called from [ViewUtils]
   * before the element's own background/content.
   */
  fun draw(canvas: Canvas, clipPath: Path?) {
    val bmp = blurredBitmap ?: return
    if (bmp.isRecycled || isCapturing) return

    drawPaint.colorFilter = colorMatrix?.let { ColorMatrixColorFilter(it) }

    val save = canvas.save()
    if (clipPath != null && !clipPath.isEmpty) {
      canvas.clipPath(clipPath)
    }
    srcRect.set(0, 0, bmp.width, bmp.height)
    dstRect.set(0f, 0f, contentWidth.toFloat(), contentHeight.toFloat())
    canvas.drawBitmap(bmp, srcRect, dstRect, drawPaint)
    canvas.restoreToCount(save)
  }
}

/**
 * In-place stack blur over the bitmap's ARGB buffer. It stays cheap enough for
 * per-frame backdrop updates at the reduced capture sizes above.
 */
private fun stackBlur(bitmap: Bitmap, radius: Int) {
  if (radius < 1) return

  val w = bitmap.width
  val h = bitmap.height
  if (w < 1 || h < 1) return

  val pix = IntArray(w * h)
  bitmap.getPixels(pix, 0, w, 0, 0, w, h)

  val wm = w - 1
  val hm = h - 1
  val wh = w * h
  val div = radius + radius + 1

  val r = IntArray(wh)
  val g = IntArray(wh)
  val b = IntArray(wh)
  val a = IntArray(wh)
  var rsum: Int
  var gsum: Int
  var bsum: Int
  var asum: Int
  var x: Int
  var y: Int
  var i: Int
  var p: Int
  var yp: Int
  var yi: Int
  var yw: Int
  val vmin = IntArray(max(w, h))

  var divsum = (div + 1) shr 1
  divsum *= divsum
  val dv = IntArray(256 * divsum)
  i = 0
  while (i < 256 * divsum) {
    dv[i] = i / divsum
    i++
  }

  yw = 0
  yi = 0

  val stack = Array(div) { IntArray(4) }
  var stackpointer: Int
  var stackstart: Int
  var sir: IntArray
  var rbs: Int
  val r1 = radius + 1
  var routsum: Int
  var goutsum: Int
  var boutsum: Int
  var aoutsum: Int
  var rinsum: Int
  var ginsum: Int
  var binsum: Int
  var ainsum: Int

  y = 0
  while (y < h) {
    rinsum = 0; ginsum = 0; binsum = 0; ainsum = 0
    routsum = 0; goutsum = 0; boutsum = 0; aoutsum = 0
    rsum = 0; gsum = 0; bsum = 0; asum = 0

    i = -radius
    while (i <= radius) {
      p = pix[yi + min(wm, max(i, 0))]
      sir = stack[i + radius]
      sir[0] = (p and 0xff0000) shr 16
      sir[1] = (p and 0x00ff00) shr 8
      sir[2] = (p and 0x0000ff)
      sir[3] = (p ushr 24)
      rbs = r1 - kotlin.math.abs(i)
      rsum += sir[0] * rbs
      gsum += sir[1] * rbs
      bsum += sir[2] * rbs
      asum += sir[3] * rbs
      if (i > 0) {
        rinsum += sir[0]; ginsum += sir[1]; binsum += sir[2]; ainsum += sir[3]
      } else {
        routsum += sir[0]; goutsum += sir[1]; boutsum += sir[2]; aoutsum += sir[3]
      }
      i++
    }
    stackpointer = radius

    x = 0
    while (x < w) {
      a[yi] = dv[asum]
      r[yi] = dv[rsum]
      g[yi] = dv[gsum]
      b[yi] = dv[bsum]

      asum -= aoutsum; rsum -= routsum; gsum -= goutsum; bsum -= boutsum

      stackstart = stackpointer - radius + div
      sir = stack[stackstart % div]

      aoutsum -= sir[3]; routsum -= sir[0]; goutsum -= sir[1]; boutsum -= sir[2]

      if (y == 0) {
        vmin[x] = min(x + radius + 1, wm)
      }
      p = pix[yw + vmin[x]]

      sir[0] = (p and 0xff0000) shr 16
      sir[1] = (p and 0x00ff00) shr 8
      sir[2] = (p and 0x0000ff)
      sir[3] = (p ushr 24)

      rinsum += sir[0]; ginsum += sir[1]; binsum += sir[2]; ainsum += sir[3]
      rsum += rinsum; gsum += ginsum; bsum += binsum; asum += ainsum

      stackpointer = (stackpointer + 1) % div
      sir = stack[stackpointer % div]

      routsum += sir[0]; goutsum += sir[1]; boutsum += sir[2]; aoutsum += sir[3]
      rinsum -= sir[0]; ginsum -= sir[1]; binsum -= sir[2]; ainsum -= sir[3]

      yi++
      x++
    }
    yw += w
    y++
  }

  x = 0
  while (x < w) {
    rinsum = 0; ginsum = 0; binsum = 0; ainsum = 0
    routsum = 0; goutsum = 0; boutsum = 0; aoutsum = 0
    rsum = 0; gsum = 0; bsum = 0; asum = 0

    yp = -radius * w
    i = -radius
    while (i <= radius) {
      yi = max(0, yp) + x

      sir = stack[i + radius]
      sir[0] = r[yi]; sir[1] = g[yi]; sir[2] = b[yi]; sir[3] = a[yi]

      rbs = r1 - kotlin.math.abs(i)
      rsum += r[yi] * rbs; gsum += g[yi] * rbs; bsum += b[yi] * rbs; asum += a[yi] * rbs

      if (i > 0) {
        rinsum += sir[0]; ginsum += sir[1]; binsum += sir[2]; ainsum += sir[3]
      } else {
        routsum += sir[0]; goutsum += sir[1]; boutsum += sir[2]; aoutsum += sir[3]
      }

      if (i < hm) {
        yp += w
      }
      i++
    }

    yi = x
    stackpointer = radius
    y = 0
    while (y < h) {
      val outPix = (dv[asum] shl 24) or (dv[rsum] shl 16) or (dv[gsum] shl 8) or dv[bsum]
      pix[yi] = outPix

      asum -= aoutsum; rsum -= routsum; gsum -= goutsum; bsum -= boutsum

      stackstart = stackpointer - radius + div
      sir = stack[stackstart % div]

      aoutsum -= sir[3]; routsum -= sir[0]; goutsum -= sir[1]; boutsum -= sir[2]

      if (x == 0) {
        vmin[y] = min(y + r1, hm) * w
      }
      p = x + vmin[y]

      sir[0] = r[p]; sir[1] = g[p]; sir[2] = b[p]; sir[3] = a[p]

      rinsum += sir[0]; ginsum += sir[1]; binsum += sir[2]; ainsum += sir[3]
      rsum += rinsum; gsum += ginsum; bsum += binsum; asum += ainsum

      stackpointer = (stackpointer + 1) % div
      sir = stack[stackpointer]

      routsum += sir[0]; goutsum += sir[1]; boutsum += sir[2]; aoutsum += sir[3]
      rinsum -= sir[0]; ginsum -= sir[1]; binsum -= sir[2]; ainsum -= sir[3]

      yi += w
      y++
    }
    x++
  }

  bitmap.setPixels(pix, 0, w, 0, 0, w, h)
}
