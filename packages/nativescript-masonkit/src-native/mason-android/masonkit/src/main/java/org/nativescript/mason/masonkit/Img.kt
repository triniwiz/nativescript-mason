package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.widget.ImageView
import androidx.core.graphics.withClip
import androidx.core.graphics.withMatrix
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import org.nativescript.mason.masonkit.enums.ObjectFit
import java.io.File
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
        requestLayout()
      } else {
        invalidateLayout()
      }
    }
  }

  private var currentTarget: CustomTarget<Bitmap>? = null

  var src: String = ""
    set(value) {
      field = value
      currentTarget?.let {
        Glide.with(this).clear(it)
        currentTarget = null
      }
      val target = object : CustomTarget<Bitmap>(
        if (node.computeCache.width == Float.MIN_VALUE) {
          SIZE_ORIGINAL
        } else {
          node.computeCache.width.toInt()
        },
        if (node.computeCache.height == Float.MIN_VALUE) {
          SIZE_ORIGINAL
        } else {
          node.computeCache.height.toInt()
        },
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
      if (value.startsWith("/")) {
        Glide.with(this)
          .asBitmap()
          .load(File(value))
          .into(target)
      } else {
        Glide.with(this)
          .asBitmap()
          .load(value)
          .into(target)
      }

    }

  val srcF = android.graphics.RectF()
  val dstF = android.graphics.RectF()

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
    when (style.objectFit) {
      ObjectFit.Cover -> {
        if (iw > 0 && ih > 0) {
          val scale = max(cw.toFloat() / iw, ch.toFloat() / ih)

          val dx = dstLeft + (cw - iw * scale) / 2f
          val dy = dstTop + (ch - ih * scale) / 2f

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
          val dx = dstLeft + (cw - iw * scale) / 2f
          val dy = dstTop + (ch - ih * scale) / 2f
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
          val dx = dstLeft + (cw - iw * scale) / 2f
          val dy = dstTop + (ch - ih * scale) / 2f
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

    if (!callSuper) {
      // clip to the image content box so object-fit results don't paint outside the view bounds
      val clipLeft = paddingLeft.toFloat()
      val clipTop = paddingTop.toFloat()
      val clipRight = clipLeft + cw.toFloat()
      val clipBottom = clipTop + ch.toFloat()

      canvas.withClip(clipLeft, clipTop, clipRight, clipBottom) {
        canvas.withMatrix(mImgMatrix) {
          d.setBounds(0, 0, iw, ih)
          d.draw(this)
        }
      }
    }

    ViewUtils.onDraw(this, canvas, style) {
      if (callSuper) {
        super.onDraw(it)
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
      compute(
        View.mapMeasureSpec(specWidthMode, specWidth).value,
        View.mapMeasureSpec(specHeightMode, specHeight).value
      )

      val layout = layout()
      node.computedLayout = layout

      setMeasuredDimension(
        layout.width.toInt(),
        layout.height.toInt(),
      )
    } else {
      val layout = layout()

      var width = layout.width.toInt()
      var height = layout.height.toInt()

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

  override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float> {
    val width = knownDimensions.width?.takeIf {
      !it.isNaN() && it >= 0
    }

    val height = knownDimensions.height?.takeIf {
      !it.isNaN() && it >= 0
    }

    val ret = Size(0f, 0f)

    if (width != null) {
      ret.width = width
    } else {
      drawable?.intrinsicWidth?.let {
        ret.width = it.toFloat()
      }
    }

    if (height != null) {
      ret.height = height
    } else {
      drawable?.intrinsicHeight?.let {
        ret.height = it.toFloat()
      }
    }

    if (width != null && height != null) {
      drawable?.setBounds(0, 0, knownDimensions.width!!.toInt(), knownDimensions.height!!.toInt())
    }

    return ret
  }

}
