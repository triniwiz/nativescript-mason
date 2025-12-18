package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.os.Build
import androidx.core.graphics.withSave

class ViewUtils {
  companion object {
    private fun render(
      view: android.view.View,
      canvas: Canvas,
      style: Style,
      superDraw: (Canvas) -> Unit
    ) {
      val suppressOps = view.getTag(R.id.tag_suppress_ops) as? Boolean ?: false
      if (suppressOps || (!style.isValueInitialized && style.mFilter == null)) {
        superDraw(canvas)
        return
      }

      val width = view.width.toFloat()
      val height = view.height.toFloat()

      style.mBorderRenderer.updateCache(width, height)

      val hasRadii = style.mBorderRenderer.hasRadii()

      // Draw background (clipped to border radius)
      canvas.withSave {
        // Apply border radius clip for background
        if (hasRadii) {
          canvas.clipPath(style.mBorderRenderer.getClipPath(width, height))
        }

        // Draw solid background color
        style.mBackground?.let { background ->
          background.color?.let { color ->
            val paint = Paint().apply {
              this.style = Paint.Style.FILL
              this.color = color
            }
            canvas.drawRect(0f, 0f, width, height, paint)
          }

          // Draw background layers (images, gradients)
          background.layers.forEach { layer ->
            canvas.withSave {
              Style.applyClip(canvas, layer.clip, style.node)
              drawBackground(view.context, view, layer, canvas, width.toInt(), height.toInt())
            }
          }
        }
      }

      // Draw border on top of background
      style.mBorderRenderer.draw(canvas, width, height)

      // Apply overflow clip for content
      canvas.withSave {
        if (hasRadii) {
          canvas.clipPath(style.mBorderRenderer.getClipPath(width, height))
        }
        Style.applyOverflowClip(style, canvas, style.node)

        // Draw content with filters
        style.mFilter?.let { filter ->
          if (filter.filters.isEmpty()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              view.setRenderEffect(null)
            }
            superDraw(canvas)
            return@let
          }
          filter.renderFilters(view, canvas) { destCanvas ->
            if (filter.v1 != null || filter.v2 != null) {
              superDraw(destCanvas)
            }
          }
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if ((filter.v3 as? CSSFilters.FilterHelperV3)?.hasComposite != true) {
              superDraw(canvas)
            }
          }
        } ?: run {
          superDraw(canvas)
        }
      }
    }

    fun onDraw(view: android.view.View, canvas: Canvas, style: Style, superDraw: (Canvas) -> Unit) {
      render(view, canvas, style, superDraw)
    }

    fun dispatchDraw(
      view: android.view.View,
      canvas: Canvas,
      style: Style,
      superDraw: (Canvas) -> Unit
    ) {
      render(view, canvas, style, superDraw)
    }
  }
}
