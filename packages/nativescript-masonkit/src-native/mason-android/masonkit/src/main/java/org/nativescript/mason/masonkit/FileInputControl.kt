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
import androidx.core.content.ContextCompat
import kotlin.math.max

class FileInputControl @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0
) : ViewGroup(context, attrs, defStyleAttr) {

  private val fileButton = Button(context)
  private val fileLabel = TextView(context)
  private val spacing = dp(8)

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
      setPadding(dp(8), dp(2), dp(8), dp(2))
      background = createButtonBackground()
      textAlignment = TEXT_ALIGNMENT_CENTER
      setOnClickListener { onPickFile?.invoke() }
    }


    fileLabel.apply {
      text = "No file selected"
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
