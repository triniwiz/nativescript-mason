package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.os.Build
import android.view.ViewGroup
import androidx.core.graphics.withSave
import androidx.core.graphics.withTranslation

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
          Style.applyOverflowClip(
            parentStyle,
            canvas,
            parentStyle.node,
            parent.width.toFloat(),
            parent.height.toFloat(),
            includeBorderRadius = true
          )

          for (i in 0 until parent.childCount) {
            val child = parent.getChildAt(i)
            if (child.width <= 0 || child.height <= 0) continue
            val childStyle = (child as? Element)?.style ?: continue
            if (!childStyle.hasOutsetBoxShadow()) continue

            canvas.withTranslation(child.left.toFloat(), child.top.toFloat()) {
              childStyle.mBorderRenderer.updateCache(child.width.toFloat(), child.height.toFloat())
              childStyle.mBoxShadowRenderer.drawOutsetShadows(
                child,
                this,
                child.width.toFloat(),
                child.height.toFloat(),
                childStyle.mBorderRenderer,
                forceLegacy = true  // Use bitmap-based rendering from parent context
              )
            }
          }
        }
        return
      }

      for (i in 0 until parent.childCount) {
        val child = parent.getChildAt(i)
        if (child.width <= 0 || child.height <= 0) continue
        val childStyle = (child as? Element)?.style ?: continue
        if (!childStyle.hasOutsetBoxShadow()) continue

        canvas.withTranslation(child.left.toFloat(), child.top.toFloat()) {
          childStyle.mBorderRenderer.updateCache(child.width.toFloat(), child.height.toFloat())
          childStyle.mBoxShadowRenderer.drawOutsetShadows(
            child,
            this,
            child.width.toFloat(),
            child.height.toFloat(),
            childStyle.mBorderRenderer,
            forceLegacy = true  // Use bitmap-based rendering from parent context
          )
        }
      }
    }

    private fun render(
      view: android.view.View,
      canvas: Canvas,
      style: Style,
      superDraw: (Canvas) -> Unit,
      ignoreBorder: Boolean = false,
      beforeChildren: ((Canvas) -> Unit)? = null,
    ) {
      // Skip draw during backdrop capture — this view is the "hole" the blurred result fills.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && style.mBackdropHelper?.isCapturing == true) {
        return
      }

      val suppressOps = view.getTag(R.id.tag_suppress_ops) as? Boolean ?: false
      if (suppressOps || (!style.isValueInitialized && style.mFilter == null && style.boxShadows.isEmpty() && style.mBackdropHelper == null)) {
        beforeChildren?.invoke(canvas)
        superDraw(canvas)
        return
      }

      val width = view.width.toFloat()
      val height = view.height.toFloat()

      style.mBorderRenderer.updateCache(width, height)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        style.mBackdropHelper?.let { helper ->
          val outerPath = style.mBorderRenderer.getOuterClipPath(width, height)
          helper.draw(canvas, if (!outerPath.isEmpty) outerPath else null)
        }
      }

      val hasRadii = style.mBorderRenderer.hasRadii()
      val hasBackground =
        style.mBackground?.let { it.color != null || it.layers.isNotEmpty() } ?: false
      val hasBoxShadow = style.boxShadows.isNotEmpty()

      // Block 1: Background clipped to outer border-radius (CSS background-clip: border-box)
      if (hasBackground) {
        canvas.withSave {
          val outerPath = style.mBorderRenderer.getOuterClipPath(width, height)
          if (!outerPath.isEmpty) {
            canvas.clipPath(outerPath)
          }

          style.mBackground?.let { background ->
            // If background is a single solid color with no layers, draw the rounded
            // shape directly into the canvas to avoid clipPath reuse/antialias interaction.
            if (background.color != null && background.layers.isEmpty()) {
              val color = background.color!!
              background.bgPaint.color = color
              background.bgPaint.style = android.graphics.Paint.Style.FILL
              if (!outerPath.isEmpty) {
                canvas.drawPath(outerPath, background.bgPaint)
              } else {
                canvas.drawRect(0f, 0f, width, height, background.bgPaint)
              }
            } else {
              background.color?.let { color ->
                background.bgPaint.color = color
                canvas.drawRect(0f, 0f, width, height, background.bgPaint)
              }

              // Reverse so the first layer in the list is drawn on top.
              background.layers.asReversed().forEach { layer ->
                canvas.withSave {
                  // pass measured bounds so clip uses the real size instead of the
                  // potentially-zero computedWidth/Height stored on the node
                  Style.applyClip(canvas, layer.clip, style, width, height)
                  drawBackground(view.context, view, layer, canvas, width.toInt(), height.toInt())
                }
              }
            }
          }
        }
      }

      // Block 1.5: Inset box shadows (render on top of background)
      if (hasBoxShadow) {
        style.mBoxShadowRenderer.drawInsetShadows(
          view,
          canvas,
          width,
          height,
          style.mBorderRenderer
        )
      }

      // Border draws freely — the path itself is rounded, no clip needed
      if (!ignoreBorder) {
        style.mBorderRenderer.draw(canvas, width, height)
      }

      // Children's outset box-shadows: drawn after this view's own background and
      // border so an opaque parent background can't paint over them, but before the
      // children themselves so the shadows sit behind their content.
      beforeChildren?.invoke(canvas)

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

      // Block 2: Content with inner border-radius clip + overflow clip.
      // Per CSS, border-radius clips child content only when overflow isn't visible;
      // clipping unconditionally cut off transformed/overflowing children. Mirror
      // applyOverflowClip's per-axis test so the rounded content clip applies only
      // when an axis actually clips. (Own background/border rounded in Block 1.)
      val overflowClipsContent = if (style.isValueInitialized) {
        val ox = style.values.get(StyleKeys.OVERFLOW_X).toInt()
        val oy = style.values.get(StyleKeys.OVERFLOW_Y).toInt()
        val cx = when (ox) { 1, 2, 3 -> true; 4 -> style.node.overflowWidth.toFloat() > width; else -> false }
        val cy = when (oy) { 1, 2, 3 -> true; 4 -> style.node.overflowHeight.toFloat() > height; else -> false }
        cx || cy
      } else false
      canvas.withSave {
        if (hasRadii && overflowClipsContent) {
          val innerPath = style.mBorderRenderer.getClipPath(width, height)
          canvas.clipPath(innerPath)
        }

        Style.applyOverflowClip(style, canvas, style.node, width, height)

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
      beforeChildren: ((Canvas) -> Unit)? = null,
      superDraw: (Canvas) -> Unit,
    ) {
      render(view, canvas, style, superDraw, ignoreBorder, beforeChildren)
    }
  }
}
