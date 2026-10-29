package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.os.Build
import android.view.ViewGroup
import androidx.core.graphics.withSave
import androidx.core.graphics.withTranslation
import org.nativescript.mason.masonkit.enums.Overflow

/** Which background layers a paint covers; `background-clip: text` ones go through the glyphs. */
internal enum class TextClipPass { ALL, EXCLUDING_TEXT, TEXT_ONLY }

// Keeps the text-clipped layers only where the glyph mask under them is drawn.
private val GLYPH_MASK_PAINT = Paint().apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN) }

class ViewUtils {
  companion object {
    /**
     * `background-clip: text`: the text-clipped layers show through the glyphs of the view's
     * own text and of every text inside it, as in the web.
     */
    private fun drawTextClippedLayers(
      view: android.view.View,
      canvas: Canvas,
      style: Style,
      background: Background,
      width: Float,
      height: Float,
      boxDx: Float,
      boxDy: Float
    ) {
      val save = canvas.saveLayer(0f, 0f, width, height, null)
      canvas.withTranslation(-boxDx, -boxDy) { drawGlyphMasks(view, this) }
      canvas.saveLayer(0f, 0f, width, height, GLYPH_MASK_PAINT)
      drawBackgroundLayers(view, canvas, style, background, width, height, boxDx, boxDy, TextClipPass.TEXT_ONLY)
      canvas.restoreToCount(save)
    }

    // Glyphs of [view]'s text and its descendants', in its content coordinates.
    private fun drawGlyphMasks(view: android.view.View, canvas: Canvas) {
      if (view is TextView) view.drawGlyphMask(canvas)
      if (view !is ViewGroup) return
      for (i in 0 until view.childCount) {
        val child = view.getChildAt(i)
        if (child.visibility != android.view.View.VISIBLE) continue
        canvas.withSave {
          translate(child.left.toFloat(), child.top.toFloat())
          if (!child.matrix.isIdentity) concat(child.matrix)
          translate(-child.scrollX.toFloat(), -child.scrollY.toFloat())
          drawGlyphMasks(child, this)
        }
      }
    }

    /** Text-clipped backgrounds paint through descendant text, so its changes and moves repaint them. */
    internal fun repaintIfTextClipped(view: android.view.View, style: Style) {
      if (style.mBackground?.hasTextClip == true) view.invalidate()
    }

    /** The background color and layers in [pass], bottom layer first, each clipped to its box. */
    internal fun drawBackgroundLayers(
      view: android.view.View,
      canvas: Canvas,
      style: Style,
      background: Background,
      width: Float,
      height: Float,
      boxDx: Float,
      boxDy: Float,
      pass: TextClipPass
    ) {
      fun inPass(clip: BackgroundClip?) = when (pass) {
        TextClipPass.ALL -> true
        TextClipPass.EXCLUDING_TEXT -> clip != BackgroundClip.TEXT
        TextClipPass.TEXT_ONLY -> clip == BackgroundClip.TEXT
      }
      // The color is clipped like the bottom-most layer.
      if (inPass(background.layers.lastOrNull()?.clip)) {
        background.color?.let { color ->
          background.bgPaint.color = color
          canvas.drawRect(0f, 0f, width, height, background.bgPaint)
        }
      }

      // Reverse so the first layer in the list is drawn on top.
      background.layers.asReversed().forEach { layer ->
        if (!inPass(layer.clip)) return@forEach
        canvas.withSave {
          // pass measured bounds so clip uses the real size instead of the
          // potentially-zero computedWidth/Height stored on the node
          Style.applyClip(canvas, layer.clip, style, width, height)
          val area = Background.positioningArea(layer, view, style.node, width, height)
          val paintRect = if (layer.attachment == BackgroundAttachment.LOCAL) {
            // `local` layers scroll with the content across the whole scrollable box.
            canvas.translate(-boxDx, -boxDy)
            val content = Background.localContentSize(view, width, height)
            android.graphics.RectF(0f, 0f, content.first, content.second)
          } else {
            android.graphics.RectF(0f, 0f, width, height)
          }
          if (layer.attachment == BackgroundAttachment.FIXED) Background.registerFixed(view)
          drawBackground(view.context, view, layer, canvas, paintRect, area, style.resolvedColor)
        }
      }
    }


    /**
     * Draw outset box-shadows for every child that is an [Element].
     * Called from the parent's [ViewGroup.dispatchDraw] *before* the
     * normal draw pass so shadows can paint outside the child's clip
     * bounds.
     */
    fun drawChildrenOutsetShadows(parent: ViewGroup, canvas: Canvas) {
      if (!anyChildHasOutsetShadow(parent)) return
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

          drawChildOutsetShadows(parent, canvas)
        }
        return
      }

      drawChildOutsetShadows(parent, canvas)
    }

    private fun anyChildHasOutsetShadow(parent: ViewGroup): Boolean {
      for (i in 0 until parent.childCount) {
        val style = (parent.getChildAt(i) as? Element)?.style ?: continue
        if (style.hasOutsetBoxShadow() && !isMasked(style)) return true
      }
      return false
    }

    // A masked or clip-path'd element's shadow is masked/clipped too: it draws its own inside
    // the mask layer or clip (see beginMask), so the parent must not paint it unmasked.
    private fun isMasked(style: Style): Boolean =
      style.mMask?.isActive() == true || style.mClipPath?.isActive() == true

    // Plain layout containers: nothing of their own to draw, and no clip to apply.
    private fun paintsNothing(style: Style, borderless: Boolean): Boolean {
      if (style.mBackdropHelper != null || style.mFilter != null) return false
      if (style.boxShadows.isNotEmpty()) return false
      val bg = style.mBackground
      if (bg != null && (bg.color != null || bg.layers.isNotEmpty())) return false
      if ((!borderless && style.mBorderRenderer.hasVisibleBorder()) || style.mBorderImage != null) return false
      if (style.isValueInitialized &&
        (style.values.get(StyleKeys.OVERFLOW_X) != Overflow.Visible.value ||
          style.values.get(StyleKeys.OVERFLOW_Y) != Overflow.Visible.value)
      ) return false
      return style.resolvedFilterString.isEmpty()
    }

    private fun drawChildOutsetShadows(parent: ViewGroup, canvas: Canvas) {
      for (i in 0 until parent.childCount) {
        val child = parent.getChildAt(i)
        if (child.width <= 0 || child.height <= 0) continue
        val childStyle = (child as? Element)?.style ?: continue
        if (!childStyle.hasOutsetBoxShadow() || isMasked(childStyle)) continue

        canvas.withTranslation(child.left.toFloat(), child.top.toFloat()) {
          childStyle.mBorderRenderer.updateCache(child.width.toFloat(), child.height.toFloat())
          childStyle.mBoxShadowRenderer.drawOutsetShadows(
            child,
            this,
            child.width.toFloat(),
            child.height.toFloat(),
            childStyle.mBorderRenderer,
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
      if (style.mBackdropHelper?.isCapturing == true) {
        return
      }

      val suppressOps = view.getTag(R.id.tag_suppress_ops) as? Boolean ?: false
      if (suppressOps || (!style.isValueInitialized && style.mFilter == null && style.boxShadows.isEmpty() &&
          style.mBackdropHelper == null && style.mBorderImage == null)
      ) {
        beforeChildren?.invoke(canvas)
        superDraw(canvas)
        return
      }

      val width = view.width.toFloat()
      val height = view.height.toFloat()

      // drop-shadow() shadows the whole element, background and border included: the filter
      // records this draw without itself, then paints the shadows and the recording.
      val filterSource = view.getTag(R.id.tag_filter_source) as? Boolean ?: false
      if (!filterSource && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        resolveFilter(style)
        val filter = style.mFilter
        if (filter != null && filter.hasDropShadow && !filter.canApplyFast()) {
          filter.renderFilters(view, canvas) {}
          return
        }
      }

      // A view with no border or radius skips creating a renderer unless it paints something.
      val borderless = !style.mBorderRendererExists && !style.mayHaveBorderOrRadius()
      if (!borderless) style.mBorderRenderer.updateCache(width, height)

      if (paintsNothing(style, borderless)) {
        beforeChildren?.invoke(canvas)
        superDraw(canvas)
        return
      }
      if (borderless) style.mBorderRenderer.updateCache(width, height)

      // A scrolled container draws in content coordinates; its own box (backdrop,
      // background, inset shadow, border) stays with the viewport. TextArea
      // compensates for its own scroll before calling in.
      val boxDx = if (view is TextArea) 0f else view.scrollX.toFloat()
      val boxDy = if (view is TextArea) 0f else view.scrollY.toFloat()
      val boxSave = canvas.save()
      if (boxDx != 0f || boxDy != 0f) canvas.translate(boxDx, boxDy)

      style.mBackdropHelper?.let { helper ->
        val outerPath = style.mBorderRenderer.getOuterClipPath(width, height)
        helper.draw(canvas, if (!outerPath.isEmpty) outerPath else null)
      }

      val hasRadii = style.mBorderRenderer.hasRadii()
      val hasBackground =
        style.mBackground?.let { it.color != null || it.layers.isNotEmpty() } ?: false
      val hasBoxShadow = style.boxShadows.isNotEmpty()

      // Block 1: Background clipped to outer border-radius (CSS background-clip: border-box)
      if (hasBackground) {
        style.mBackground?.let { background ->
          val boxGradient = if (background.layers.isEmpty()) null
            else Background.boxGradientLayer(background, view, style.node, width, height)
          if (background.layers.isEmpty() || boxGradient != null) {
            background.color?.let { color ->
              background.bgPaint.color = color
              background.bgPaint.style = android.graphics.Paint.Style.FILL
              Background.fillBorderBox(canvas, style.mBorderRenderer, width, height, background.bgPaint)
            }
            boxGradient?.let { Background.fillBoxGradient(canvas, it, style.mBorderRenderer, width, height) }
          } else canvas.withSave {
            // Blend modes composite within the element's own background group.
            val blends = background.layers.any { it.blendMode != BackgroundBlendMode.NORMAL }
            if (blends) canvas.saveLayer(0f, 0f, width, height, null)
            val outerPath = style.mBorderRenderer.getOuterClipPath(width, height)
            if (!outerPath.isEmpty) {
              canvas.clipPath(outerPath)
            }
            if (background.hasTextClip) {
              drawBackgroundLayers(view, canvas, style, background, width, height, boxDx, boxDy, TextClipPass.EXCLUDING_TEXT)
              drawTextClippedLayers(view, canvas, style, background, width, height, boxDx, boxDy)
            } else {
              drawBackgroundLayers(view, canvas, style, background, width, height, boxDx, boxDy, TextClipPass.ALL)
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

      // Border draws freely — the path itself is rounded, no clip needed. A border-image
      // replaces it once its source is available (it isn't clipped by border-radius either).
      if (!ignoreBorder) {
        val image = style.mBorderImage
        if (image == null || !image.draw(view, style, canvas, width, height)) {
          style.mBorderRenderer.draw(canvas, width, height)
        }
      }
      canvas.restoreToCount(boxSave)

      // Children's outset box-shadows: drawn after this view's own background and
      // border so an opaque parent background can't paint over them, but before the
      // children themselves so the shadows sit behind their content.
      beforeChildren?.invoke(canvas)

      resolveFilter(style)
      val activeFilter = if (filterSource) null else style.mFilter
      val useFastFilter = activeFilter?.canApplyFast() == true

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
      val drawContent = {
        if (hasRadii && overflowClipsContent) {
          // The outline belongs to the viewport, and the canvas is back in content coordinates.
          canvas.translate(boxDx, boxDy)
          canvas.clipPath(style.mBorderRenderer.getClipPath(width, height))
          canvas.translate(-boxDx, -boxDy)
        }

        Style.applyOverflowClip(style, canvas, style.node, width, height)

        val filter = activeFilter
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
      val filterRenders = activeFilter?.let { it.filters.isNotEmpty() && !useFastFilter } == true
      if (overflowClipsContent || filterRenders || !style.isValueInitialized) {
        canvas.withSave { drawContent() }
      } else {
        drawContent()
      }

      // Fast-path filter (e.g. brightness on :active) applied AFTER all
      // drawing so it covers background, text, and border uniformly.
      // Clip to border-radius so the overlay follows the element shape.
      if (useFastFilter) {
        canvas.withSave {
          if (boxDx != 0f || boxDy != 0f) canvas.translate(boxDx, boxDy)
          if (hasRadii) {
            canvas.clipPath(style.mBorderRenderer.getOuterClipPath(width, height))
          }
          activeFilter?.applyFast(canvas, width, height)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          view.setRenderEffect(null)
        }
      }
    }

    // Parses the filter CSS (pseudo-aware) so :active/:hover strings apply only when the node's
    // pseudo mask is active.
    private fun resolveFilter(style: Style) {
      val css = style.resolvedFilterString
      if ((style.mFilter == null && css.isNotEmpty()) || (style.mFilter != null && style.mFilter?.css != css)) {
        val hadFilters = style.mFilter?.filters?.isNotEmpty() ?: false
        style.mFilter = CSSFilters.parse(css)
        if (style.mFilter?.filters?.isNotEmpty() == true || (css.isEmpty() && hadFilters)) {
          (style.node.view as? View)?.invalidate()
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

    /**
     * Android gives a new window's focus to its first focusable view, so an `<input>` showed a
     * caret before anyone touched it. On the web an input is focused only by a tap, `autofocus`
     * or `focus()`, so a Mason root takes that initial focus itself; a tap still moves it.
     */
    fun holdInitialFocus(root: ViewGroup) {
      root.isFocusableInTouchMode = true
      root.descendantFocusability = ViewGroup.FOCUS_BEFORE_DESCENDANTS
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        root.defaultFocusHighlightEnabled = false
      }
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
