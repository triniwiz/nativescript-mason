package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import androidx.appcompat.widget.AppCompatImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.target.Target
import com.bumptech.glide.request.transition.Transition

class Img @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null
) : AppCompatImageView(context, attrs), MasonView, MeasureFunc {
  override lateinit var node: Node
    private set

  internal var currentBitmap: Bitmap? = null

  override fun setImageBitmap(bm: Bitmap?) {
    super.setImageBitmap(bm)
    currentBitmap = bm
  }

  constructor(context: Context, mason: Mason) : this(context) {
    node = mason.createNode(this).apply {
      data = this@Img
    }
  }

  init {
    if (!::node.isInitialized) {
      node = Mason.shared.createNode(this).apply {
        data = this@Img
      }
    }
  }

  private val rootNode: Node
    get() {
      var current = this.node
      while (current.owner != null) {
        current = current.owner!!
      }
      return current
    }

  override fun requestLayout() {
    super.requestLayout()
    markDirtyAndRecompute()
  }

  private fun markDirtyAndRecompute() {
    node.dirty()
    if (!node.inBatch) {
      if (parent == null) {
        val parent = node.owner
        if (parent?.data != null) {
          (parent.data as? TextView)?.let {

            it.requestLayout()
            //  it.invalidate()
          }
        }
      } else {
        rootNode.computeCacheWidth?.let { width ->
          rootNode.computeCacheHeight?.let { height ->
            rootNode.compute(width, height)
            (rootNode.data as? android.view.View)?.let {
              it.requestLayout()
              it.invalidate()
            }

          }
        }
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
        node.computeCacheWidth?.toInt() ?: Target.SIZE_ORIGINAL,
        node.computeCacheHeight?.toInt() ?: Target.SIZE_ORIGINAL
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

  var inBatch: Boolean
    get() {
      return node.inBatch
    }
    set(value) {
      node.inBatch = value
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

  override fun isLeaf(): Boolean {
    return true
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
    } else if (parent !is View) {
      node.compute(
        View.mapMeasureSpec(specWidthMode, specWidth).value,
        View.mapMeasureSpec(specHeightMode, specHeight).value
      )

      val layout = node.layout()
      node.layoutCache = layout

      setMeasuredDimension(
        layout.width.toInt(),
        layout.height.toInt(),
      )
    } else {
      val layout = node.layout()

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

    return ret
  }

}
