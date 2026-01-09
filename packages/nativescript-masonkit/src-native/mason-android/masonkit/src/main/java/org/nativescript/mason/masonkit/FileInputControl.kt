package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.text.TextUtils
import android.util.AttributeSet
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.core.content.ContextCompat
import kotlin.math.max

class FileInputControl @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0
) : ViewGroup(context, attrs, defStyleAttr) {
  internal var owner: Element? = null

  private val fileButton = Button(context).apply {
    owner?.let {
      textSize = it.style.fontSize.toFloat()
    }
  }
  private val fileLabel = TextView(context).apply {
    owner?.let {
      textSize = it.style.fontSize.toFloat()
    }
  }

  // slightly tighter spacing to keep controls compact
  private val spacing = dp(6)

  var onPickFile: (() -> Unit)? = null
  var onContentSizeChanged: (() -> Unit)? = null

  var labelText: String
    get() = fileLabel.text?.toString() ?: ""
    set(value) {
      fileLabel.text = value
      requestLayout()
      invalidate()
      onContentSizeChanged?.invoke()
    }

  init {
    setup()
  }

  private fun setup() {
    clipToPadding = false
    clipChildren = false


    fileButton.apply {
      text = "Browse…"
      isAllCaps = false
      // avoid default extra min width/padding from button styles
      includeFontPadding = false
      background = createButtonBackground()
      // re-apply tight padding after setting custom background
      setPadding(dp(8), dp(2), dp(8), dp(2))
      textAlignment = TEXT_ALIGNMENT_CENTER
      setOnClickListener { onPickFile?.invoke() }
    }


    fileLabel.apply {
      text = "No file selected"
      setTextColor(Color.DKGRAY)
      // slightly smaller label to de-emphasize it relative to the button
      textSize = 12f
      visibility = VISIBLE
      ellipsize = TextUtils.TruncateAt.END
      maxLines = 1
    }

    addView(fileButton)
    addView(fileLabel)
  }

  private fun createButtonBackground(): Drawable {
    val strokeColor =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
        context.getColor(android.R.color.system_neutral2_300)
      else
        ContextCompat.getColor(context, android.R.color.darker_gray)

    return GradientDrawable().apply {
      cornerRadius = dp(4).toFloat()
      setStroke(dp(1), strokeColor)
      setColor(Color.TRANSPARENT)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    measureChild(fileButton, widthMeasureSpec, heightMeasureSpec)
    measureChild(fileLabel, widthMeasureSpec, heightMeasureSpec)

    val width =
      fileButton.measuredWidth +
        spacing +
        fileLabel.measuredWidth

    val height =
      max(fileButton.measuredHeight, fileLabel.measuredHeight)

    setMeasuredDimension(
      resolveSize(width, widthMeasureSpec),
      resolveSize(height, heightMeasureSpec)
    )
  }

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    var x = 0

    fileButton.layout(
      x,
      (measuredHeight - fileButton.measuredHeight) / 2,
      x + fileButton.measuredWidth,
      (measuredHeight + fileButton.measuredHeight) / 2
    )

    x += fileButton.measuredWidth + spacing

    fileLabel.layout(
      x,
      (measuredHeight - fileLabel.measuredHeight) / 2,
      x + fileLabel.measuredWidth,
      (measuredHeight + fileLabel.measuredHeight) / 2
    )
  }

  private fun dp(v: Int): Int =
    (v * resources.displayMetrics.density).toInt()
}
