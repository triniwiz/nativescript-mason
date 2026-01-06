package org.nativescript.mason.masonkit

import android.content.Context
import android.os.Build
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.util.AttributeSet
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.toDrawable
import kotlin.math.max
import kotlin.math.min

class NumberControl @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

  // MARK: - Subviews

  val editText = EditText(context)
  private val stepperContainer = LinearLayout(context)
  private val incrementButton = ImageButton(context)
  private val decrementButton = ImageButton(context)

  // MARK: - Value

  private var skip = false

  var value: Int = 0
    set(v) {
      field = v
      if (!skip) {
        editText.setText(v.toString())
      }
    }

  var step: Int = 1
  var minValue: Int? = null
  var maxValue: Int? = null

  init {
    setup()
  }

  // MARK: - Setup

  private fun setup() {
    setupEditText()
    setupStepper()
    setupLayout()
  }

  private fun setupEditText() {
    editText.apply {
      inputType = InputType.TYPE_CLASS_NUMBER
      background = null
      setPadding(0, 0, 0, 0)
      gravity = Gravity.START or Gravity.CENTER_VERTICAL
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
      setTextColor(ContextCompat.getColor(context, android.R.color.black))
      setHintTextColor(ContextCompat.getColor(context, android.R.color.darker_gray))
      setText(value.toString())

      addTextChangedListener(object : TextWatcher {
        override fun afterTextChanged(s: Editable?) {
          textChanged()
        }

        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
      })
    }
  }

  private fun setupStepper() {
    stepperContainer.apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.FILL
      isClickable = true
    }

    val bgNormal = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getColor(android.R.color.system_neutral2_100).toDrawable()
    } else {
      ContextCompat.getColor(context, android.R.color.darker_gray).toDrawable()
    }

    val bgPressed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getColor(android.R.color.system_neutral2_200).toDrawable()
    } else {
      ContextCompat.getColor(context, android.R.color.background_light).toDrawable()
    }

    fun setupButton(button: ImageButton, drawableRes: Int) {
      button.apply {
        setImageResource(drawableRes)
        scaleType = ImageView.ScaleType.CENTER
        background = bgNormal
        isClickable = true
        isFocusable = true

        setOnTouchListener { v, event ->
          when (event.action) {
            MotionEvent.ACTION_DOWN -> v.background = bgPressed
            MotionEvent.ACTION_UP,
            MotionEvent.ACTION_CANCEL -> v.background = bgNormal
          }
          false
        }
      }
    }

    setupButton(incrementButton, android.R.drawable.arrow_up_float)
    setupButton(decrementButton, android.R.drawable.arrow_down_float)

    incrementButton.setOnClickListener { increment() }
    decrementButton.setOnClickListener { decrement() }

    stepperContainer.addView(
      incrementButton,
      LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
      )
    )
    stepperContainer.addView(
      decrementButton,
      LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
      )
    )
  }

  private lateinit var container: LinearLayout

  private fun setupLayout() {
    container = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.FILL_VERTICAL
    }

    container.addView(
      editText,
      LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)
    )

    container.addView(
      stepperContainer,
      LinearLayout.LayoutParams(
        dp(16),
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )

    addView(
      container,
      LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )

    setPadding(dp(8), dp(1), dp(1), dp(1))
  }

  // MARK: - Actions

  private fun increment() {
    setValueInner(value + step)
  }

  private fun decrement() {
    setValueInner(value - step)
  }

  private fun textChanged() {
    val text = editText.text?.toString() ?: return
    if (text.isEmpty()) return

    val newValue = text.toIntOrNull()
    if (newValue != null) {
      setValueInner(newValue, updateText = false)
    }
  }

  private fun setValueInner(newValue: Int, updateText: Boolean = true) {
    val text = editText.text?.toString()
    if (text.isNullOrEmpty() && text?.toIntOrNull() == null) {
      skip = true
      value = 0
      skip = false
      return
    }

    var v = newValue
    minValue?.let { v = max(v, it) }
    maxValue?.let { v = min(v, it) }

    if (updateText) {
      value = v
    } else {
      skip = true
      value = v
      skip = false
    }
  }

  // MARK: - Utils

  private fun dp(value: Int): Int =
    (value * resources.displayMetrics.density).toInt()
}
