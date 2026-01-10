package org.nativescript.mason.masonkit.input

import android.R
import android.content.Context
import android.content.res.ColorStateList
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.util.AttributeSet
import android.util.TypedValue
import android.view.Gravity
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.core.content.ContextCompat
import androidx.core.graphics.toColorInt
import kotlin.math.max
import kotlin.math.min

class NumberControl @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

  val editText = EditText(context)
  private val stepperContainer = LinearLayout(context)
  private val incrementButton = ImageButton(context)
  private val decrementButton = ImageButton(context)

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
      setTextColor(ContextCompat.getColor(context, R.color.black))
      setHintTextColor(ContextCompat.getColor(context, R.color.darker_gray))
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
      // default background similar to iOS systemGray6
      background = ContextCompat.getDrawable(context, org.nativescript.mason.masonkit.R.drawable.stepper_bg_web)
    }

    // Use lightweight chevron icons and tint them for pressed state to match iOS style
    val defaultTint = "#636366".toColorInt()
    val pressedTint = ContextCompat.getColor(context, R.color.system_neutral2_100)

    val tintList = ColorStateList(
      arrayOf(
        intArrayOf(R.attr.state_pressed),
        intArrayOf()
      ),
      intArrayOf(
        pressedTint,
        defaultTint
      )
    )

    fun setupButton(button: ImageButton, drawableRes: Int) {
      button.apply {
        setImageResource(drawableRes)
        scaleType = ImageView.ScaleType.CENTER
        background = context.getDrawable(org.nativescript.mason.masonkit.R.drawable.stepper_bg_web)
        isClickable = true
        isFocusable = true
//        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
//          imageTintList = tintList
//        } else {
//          // fallback: apply default tint
//          setColorFilter(defaultTint)
//        }
      }
    }

    setupButton(incrementButton, org.nativescript.mason.masonkit.R.drawable.ic_stepper_up)
    setupButton(decrementButton, org.nativescript.mason.masonkit.R.drawable.ic_stepper_down)

    incrementButton.setOnClickListener { increment() }
    decrementButton.setOnClickListener { decrement() }

    stepperContainer.addView(
      incrementButton,
      LinearLayout.LayoutParams(
        LayoutParams.MATCH_PARENT, 0, 1f
      )
    )
    stepperContainer.addView(
      decrementButton,
      LinearLayout.LayoutParams(
        LayoutParams.MATCH_PARENT, 0, 1f
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
      LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 1f)
    )

    container.addView(
      stepperContainer,
      LinearLayout.LayoutParams(
        dp(16),
        LayoutParams.MATCH_PARENT
      )
    )

    addView(
      container,
      LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
    )

    setPadding(dp(8), dp(1), dp(1), dp(1))
  }

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

  private fun dp(value: Int): Int =
    (value * resources.displayMetrics.density).toInt()
}
