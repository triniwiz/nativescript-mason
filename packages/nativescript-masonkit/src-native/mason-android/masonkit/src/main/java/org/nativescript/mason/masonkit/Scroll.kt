package org.nativescript.mason.masonkit

import android.content.Context
import android.util.AttributeSet
import android.view.ViewGroup
import android.widget.FrameLayout

class Scroll @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0, override: Boolean = false
) : TwoDScrollView(context, attrs), Element {


  internal lateinit var scrollRoot: View

  override val view: android.view.View
    get() = this

  override val style: Style
    get() = node.style

  override var enableScrollX: Boolean
    get() {
      val value = node.style.values.getInt(StyleKeys.OVERFLOW_X)
      return when (value) {
        2, 4 -> true
        0, 1, 3 -> false
        else -> throw IllegalArgumentException("Unknown overflow enum value: $value")
      }
    }
    set(value) {}


  override var enableScrollY: Boolean
    get() {
      val value = node.style.values.getInt(StyleKeys.OVERFLOW_Y)
      return when (value) {
        2, 4 -> true
        0, 1, 3 -> false
        else -> throw IllegalArgumentException("Unknown overflow enum value: $value")
      }
    }
    set(value) {}

  override val node: Node
    get() {
      return scrollRoot.node
    }

  constructor(context: Context, mason: Mason) : this(context, null, 0, true) {
    scrollRoot = View(context, mason).apply {
      isScrollRoot = true
    }
    super.addView(
      scrollRoot, FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.WRAP_CONTENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
    )
  }

  init {
    if (!override) {
      if (!::scrollRoot.isInitialized) {
        scrollRoot = View(context, attrs, defStyleAttr).apply {
          isScrollRoot = true
        }

        super.addView(
          scrollRoot, LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT
          )
        )

      }
    }
  }

  override fun addView(child: android.view.View) {
    if (child != scrollRoot) {
      scrollRoot.addView(child)
    }
  }


  override fun addView(child: android.view.View, width: Int, height: Int) {
    if (child != scrollRoot) {
      scrollRoot.addView(child, width, height)
    }
  }


  override fun addView(
    child: android.view.View, index: Int, params: ViewGroup.LayoutParams
  ) {
    if (child == scrollRoot) {
      //  scrollRoot.addView(child, index, params)
      super.addView(child, index, params)
    } else {
      scrollRoot.addView(child, index, params)
    }
  }

//  override fun getChildCount(): Int {
//    return scrollRoot.childCount
//  }
//
//  override fun getChildAt(index: Int): android.view.View? {
//    return scrollRoot.getChildAt(index)
//  }


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
}
