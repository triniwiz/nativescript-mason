package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.util.Log
import androidx.appcompat.widget.AppCompatImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition

class Img @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : AppCompatImageView(context, attrs), Element, MeasureFunc {
  override lateinit var node: Node
    private set

  override val style: Style
    get() = node.style

  override val view: android.view.View
    get() = this

  internal var currentBitmap: Bitmap? = null

  override fun setImageBitmap(bm: Bitmap?) {
    super.setImageBitmap(bm)
    currentBitmap = bm
    if (src.isEmpty()) {
      invalidateLayout()
    }
  }

  override fun setImageResource(resId: Int) {
    super.setImageResource(resId)
    if (src.isEmpty()) {
      invalidateLayout()
    }
  }

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    node = mason.createNode(this).apply {
      view = this@Img
    }
    style.display = Display.Inline
  }

  init {
    if (!override) {
      if (!::node.isInitialized) {
        node = Mason.shared.createNode(this).apply {
          view = this@Img
        }
        style.display = Display.Inline
      }
    }
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
        }

        override fun onLoadCleared(placeholder: Drawable?) {
          setImageDrawable(placeholder)
          markDirtyAndRecompute()
        }

      }
      currentTarget = target
      Glide.with(this)
        .asBitmap()
        .load(value)
        .into(target)

    }

  fun syncStyle(state: String) {
    try {
      val value = state.toLong()
      if (value != -1L) {
        node.style.isDirty = value
        node.style.updateNativeStyle()
      }
    } catch (_: Error) {
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
