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
      // If the parent is an Element with a Style, apply the parent's
      // overflow clip to the canvas while drawing outset shadows so
      // shadows do not escape the parent's content-box when overflow
      // should be clipped (e.g. scroll roots or overflow:hidden).
      val parentStyle = (parent as? Element)?.style
      if (parentStyle != null) {
        canvas.withSave {
          Style.applyOverflowClip(parentStyle, canvas, parentStyle.node)

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
        return
      }

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
                // pass measured bounds so clip uses the real size instead of the
                // potentially-zero computedWidth/Height stored on the node
                Style.applyClip(canvas, layer.clip, style.node, width, height)
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

      // Resolve filter CSS (pseudo-aware) so :active/:hover strings apply
      // only when the node's pseudo mask is active.
      val css = style.resolvedFilterString
      if (style.mFilter == null || style.mFilter?.css != css) {
        val hadFilters = style.mFilter?.filters?.isNotEmpty() ?: false
        style.mFilter = CSSFilters.parse(css)
        if (style.mFilter?.filters?.isNotEmpty() == true || (css.isEmpty() && hadFilters)) {
          (style.node.view as? View)?.invalidate()
        }
      }

      val useFastFilter = style.mFilter?.canApplyFast() == true

      // Block 2: Content with inner border-radius clip + overflow clip
      canvas.withSave {
        if (hasRadii) {
          canvas.clipPath(style.mBorderRenderer.getClipPath(width, height))
        }

        Style.applyOverflowClip(style, canvas, style.node)

        val filter = style.mFilter
        if (filter != null) {
          if (filter.filters.isEmpty() || useFastFilter) {
            // No filter or fast-path — draw content normally; fast overlay applied below
            if (filter.filters.isEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              view.setRenderEffect(null)
            }
            superDraw(canvas)
          } else {
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
          }
        } else {
          superDraw(canvas)
        }
      }

      // Fast-path filter (e.g. brightness on :active) applied AFTER all
      // drawing so it covers background, text, and border uniformly.
      // Clip to border-radius so the overlay follows the element shape.
      if (useFastFilter) {
        canvas.withSave {
          if (hasRadii) {
            canvas.clipPath(style.mBorderRenderer.getOuterClipPath(width, height))
          }
          style.mFilter?.applyFast(canvas, width, height)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          view.setRenderEffect(null)
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
