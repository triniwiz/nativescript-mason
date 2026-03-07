package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.os.Build
import android.view.ViewGroup
import androidx.core.graphics.withSave

class ViewUtils {
  companion object {

    /**
     * Draw outset box-shadows for every child that is an [Element].
     * Called from the parent's [ViewGroup.dispatchDraw] *before* the
     * normal draw pass so shadows can paint outside the child's clip
     * bounds.
     */
    fun drawChildrenOutsetShadows(parent: ViewGroup, canvas: Canvas) {
      for (i in 0 until parent.childCount) {
        val child = parent.getChildAt(i)
        val childStyle = (child as? Element)?.style ?: continue
        val outsetShadows = childStyle.boxShadows.filter { !it.inset }
        if (outsetShadows.isEmpty()) continue

        canvas.save()
        canvas.translate(child.left.toFloat(), child.top.toFloat())
        childStyle.mBorderRenderer.updateCache(child.width.toFloat(), child.height.toFloat())
        childStyle.mBoxShadowRenderer.drawOutsetShadows(
          child,
          canvas,
          child.width.toFloat(),
          child.height.toFloat(),
          childStyle.mBorderRenderer,
          forceLegacy = true  // Use bitmap-based rendering from parent context
        )
        canvas.restore()
      }
    }

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

      // Block 1: Background clipped to outer border-radius (CSS background-clip: border-box)
      if (hasBackground) {
        canvas.withSave {
          if (hasRadii) {
            canvas.clipPath(style.mBorderRenderer.getOuterClipPath(width, height))
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

      // Border draws freely — the path itself is rounded, no clip needed
      if (!ignoreBorder) {
        style.mBorderRenderer.draw(canvas, width, height)
      }

      // Block 2: Content with inner border-radius clip + overflow clip
      canvas.withSave {
        if (hasRadii) {
          canvas.clipPath(style.mBorderRenderer.getClipPath(width, height))
        }

        Style.applyOverflowClip(style, canvas, style.node)

        // Ensure we use the pseudo-aware resolved filter string so :active/:hover
        // pseudo strings only apply when the node's pseudo mask is active.
        val css = style.resolvedFilterString
        if (style.mFilter == null || style.mFilter?.css != css) {
          val hadFilters = style.mFilter?.filters?.isNotEmpty() ?: false
          style.mFilter = CSSFilters.parse(css)
          if (style.mFilter?.filters?.isNotEmpty() == true || (css.isEmpty() && hadFilters)) {
            (style.node.view as? View)?.invalidate()
          }
        }

        style.mFilter?.let { filter ->
          if (filter.filters.isEmpty()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              view.setRenderEffect(null)
            }
            superDraw(canvas)
            return@let
          }

          // Try lightweight Canvas fast-path (e.g. brightness on :active).
          // Draw content first, then overlay the filter effect.
          if (filter.canApplyFast()) {
            superDraw(canvas)
            filter.applyFast(canvas, width, height)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              view.setRenderEffect(null)
            }
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
