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
      superDraw: (Canvas) -> Unit,
      ignoreBorder: Boolean = false,
    ) {
      val suppressOps = view.getTag(R.id.tag_suppress_ops) as? Boolean ?: false
      if (suppressOps || (!style.isValueInitialized && style.mFilter == null && style.boxShadows.isEmpty())) {
        superDraw(canvas)
        return
      }

      val width = view.width.toFloat()
      val height = view.height.toFloat()

      style.mBorderRenderer.updateCache(width, height)

      val hasRadii = style.mBorderRenderer.hasRadii()
      val hasBackground = style.mBackground?.let { it.color != null || it.layers.isNotEmpty() } ?: false
      val hasBoxShadow = style.boxShadows.isNotEmpty()

      // Outset shadows are drawn by parent's dispatchDraw to avoid clipping
      // Only draw inset shadows here
      // (Comment out outset shadow drawing at child level)
      // if (hasBoxShadow) {
      //   style.mBoxShadowRenderer.drawOutsetShadows(view, canvas, width, height, style.mBorderRenderer)
      // }

      // Block 1: Background with border-radius clip
      if (hasBackground) {
        canvas.withSave {
          if (hasRadii) {
            canvas.clipPath(style.mBorderRenderer.getClipPath(width, height))
          }

          style.mBackground?.let { background ->
            background.color?.let { color ->
              val bgPaint = Paint().apply {
                this.style = Paint.Style.FILL
                this.color = color
              }
              canvas.drawRect(0f, 0f, width, height, bgPaint)
            }

            background.layers.forEach { layer ->
              canvas.withSave {
                Style.applyClip(canvas, layer.clip, style.node)
                drawBackground(view.context, view, layer, canvas, width.toInt(), height.toInt())
              }
            }
          }
        }
      }

      // Block 1.5: Inset box shadows (render on top of background)
      if (hasBoxShadow) {
        style.mBoxShadowRenderer.drawInsetShadows(view, canvas, width, height, style.mBorderRenderer)
      }

      // Border drawn OUTSIDE any clip scope so strokes aren't clipped
      if (!ignoreBorder) {
        style.mBorderRenderer.draw(canvas, width, height)
      }

      // Block 2: Content with border-radius clip + overflow clip
      canvas.withSave {
        if (hasRadii) {
          canvas.clipPath(style.mBorderRenderer.getClipPath(width, height))
        }

        Style.applyOverflowClip(style, canvas, style.node)

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

    fun onDraw(
      view: android.view.View,
      canvas: Canvas,
      style: Style,
      ignoreBorder: Boolean = false,
      superDraw: (Canvas) -> Unit,
    ) {
      render(view, canvas, style, superDraw, ignoreBorder)
    }

    fun dispatchDraw(
      view: android.view.View,
      canvas: Canvas,
      style: Style,
      ignoreBorder: Boolean = false,
      superDraw: (Canvas) -> Unit,
    ) {
      render(view, canvas, style, superDraw, ignoreBorder)
    }
  }
}
