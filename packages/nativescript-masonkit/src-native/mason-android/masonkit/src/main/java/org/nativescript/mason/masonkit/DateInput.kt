package org.nativescript.mason.masonkit

import android.app.DatePickerDialog
import android.content.Context
import android.text.Editable
import android.text.InputFilter
import android.text.InputFilter.LengthFilter
import android.text.InputType
import android.text.TextWatcher
import android.text.format.DateFormat
import android.util.TypedValue
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.FrameLayout
import org.nativescript.mason.masonkit.events.Event
import org.nativescript.mason.masonkit.events.InputEvent
import java.util.Calendar
import java.util.Locale
import kotlin.math.max

class DateInput(context: Context) : FrameLayout(context) {
  internal var owner: Input? = null
  private fun clampAndNormalize(): String {
    val now = Calendar.getInstance()
    val yInt = yearInput.text.toString().toIntOrNull() ?: now.get(Calendar.YEAR)
    var mInt = monthInput.text.toString().toIntOrNull() ?: 1
    var dInt = dayInput.text.toString().toIntOrNull() ?: 1

    if (mInt < 1) mInt = 1
    if (mInt > 12) mInt = 12

    val cal = Calendar.getInstance().apply {
      set(Calendar.YEAR, yInt)
      set(Calendar.MONTH, mInt - 1)
      set(Calendar.DAY_OF_MONTH, 1)
    }
    val maxDay = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

    if (dInt < 1) dInt = 1
    if (dInt > maxDay) dInt = maxDay

    val yrStr = String.format(Locale.getDefault(), "%04d", yInt)
    val monthStr = String.format(Locale.getDefault(), "%02d", mInt)
    val dayStr = String.format(Locale.getDefault(), "%02d", dInt)

    if (yearInput.text.toString() != yrStr) yearInput.setText(yrStr)
    if (monthInput.text.toString() != monthStr) monthInput.setText(monthStr)
    if (dayInput.text.toString() != dayStr) dayInput.setText(dayStr)

    return "$yrStr-$monthStr-$dayStr"
  }

  private val locale = Locale.getDefault()
  private val pattern = DateFormat.getBestDateTimePattern(locale, "yMd") // e.g., "MM/dd/yyyy"
  private val order = pattern.map {
    when (it) {
      'y' -> "Y"
      'M' -> "M"
      'd' -> "D"
      else -> null
    }
  }.filterNotNull() // ["M","d","Y"] etc.

  internal val yearInput = createField(4).apply {
    hint = "yyyy"
  }
  internal val monthInput = createField(2).apply {
    hint = "mm"
  }
  internal val dayInput = createField(2).apply {
    hint = "dd"
  }

  private val fields = mutableListOf<EditText>()
  private var lastChangeValue: String? = null
  private val showButton = android.widget.ImageButton(context).apply {
    background = null
    // scaleType = ImageView.ScaleType.CENTER_INSIDE
    setImageResource(R.drawable.ic_calendar_web)
    val size = (20 * resources.displayMetrics.density).toInt()
    minimumWidth = size
    minimumHeight = size
  }

  private fun createSeparator(): android.widget.TextView {
    return android.widget.TextView(context).apply {
      text = "/"
      scaleY = 2f
      gravity = android.view.Gravity.CENTER
      setPadding(
        (2 * resources.displayMetrics.density).toInt(),
        0,
        (2 * resources.displayMetrics.density).toInt(),
        0
      )
    }
  }

  init {
    // Add fields to layout in correct order
    order.forEachIndexed { index, it ->
      when (it) {
        "Y" -> {
          addView(
            yearInput, LayoutParams(
              LayoutParams.WRAP_CONTENT,
              LayoutParams.MATCH_PARENT,
            )
          ); fields.add(yearInput)
        }

        "M" -> {
          addView(
            monthInput, LayoutParams(
              LayoutParams.WRAP_CONTENT,
              LayoutParams.MATCH_PARENT,
            )
          ); fields.add(monthInput)
        }

        "D" -> {
          addView(
            dayInput, LayoutParams(
              LayoutParams.WRAP_CONTENT,
              LayoutParams.MATCH_PARENT,
            )
          ); fields.add(dayInput)
        }
      }
      // Add separator after each field except the last
      if (index < order.size - 1) {
        addView(
          createSeparator(), LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.MATCH_PARENT
          )
        )
      }
    }

    fields.forEachIndexed { i, field ->
      field.addTextChangedListener(object : TextWatcher {
        override fun afterTextChanged(s: Editable?) {
          if (s?.length == (field.filters.firstOrNull() as? InputFilter.LengthFilter)?.max) {
            if (i + 1 < fields.size) fields[i + 1].requestFocus()
          }

          val y = yearInput.text.toString()
          val m = monthInput.text.toString()
          val d = dayInput.text.toString()
          val dateStr = "$y-$m-$d"

          owner?.node?.mason?.dispatch(
            InputEvent(
              "input",
              dateStr,
              Event.InputType.InsertText.value
            ).apply { target = owner }
          )
        }

        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
      })

      field.onFocusChangeListener = OnFocusChangeListener { _, hasFocus ->
        // if focus was lost and no other field has focus, normalize/clamp values and emit change if different
        if (!hasFocus) {
          val anyFocused = fields.any { it.isFocused }
          if (!anyFocused) {
            val dateStr = clampAndNormalize()
            if (lastChangeValue != dateStr) {
              owner?.node?.mason?.dispatch(
                InputEvent("input", dateStr, Event.InputType.InsertText.value).apply {
                  target = owner
                }
              )
              owner?.node?.mason?.dispatch(
                InputEvent("change", dateStr, Event.InputType.InsertText.value).apply {
                  target = owner
                }
              )
              lastChangeValue = dateStr
            }
          }
        }
      }

      field.setOnEditorActionListener { _, actionId, _ ->
        if (actionId == EditorInfo.IME_ACTION_DONE) {
          val dateStr = clampAndNormalize()
          if (lastChangeValue != dateStr) {
            owner?.node?.mason?.dispatch(
              InputEvent("input", dateStr, Event.InputType.InsertText.value).apply {
                target = owner
              }
            )
            owner?.node?.mason?.dispatch(
              InputEvent("change", dateStr, Event.InputType.InsertText.value).apply {
                target = owner
              }
            )
            lastChangeValue = dateStr
          }
          true
        } else false
      }

      field.setOnKeyListener { _, keyCode, event ->
        if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
          val dateStr = clampAndNormalize()
          if (lastChangeValue != dateStr) {
            owner?.node?.mason?.dispatch(
              InputEvent("input", dateStr, Event.InputType.InsertText.value).apply {
                target = owner
              }
            )
            owner?.node?.mason?.dispatch(
              InputEvent("change", dateStr, Event.InputType.InsertText.value).apply {
                target = owner
              }
            )
            lastChangeValue = dateStr
          }
          true
        } else false
      }
    }

    addView(showButton)

    showButton.setOnClickListener {
      val today = Calendar.getInstance()
      DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
          // month is 0-based
          val yrStr = String.format(Locale.getDefault(), "%04d", year)
          val monthStr = String.format(Locale.getDefault(), "%02d", month + 1)
          val dayStr = String.format(Locale.getDefault(), "%02d", dayOfMonth)
          dayInput.setText(dayStr)
          monthInput.setText(monthStr)
          yearInput.setText(yrStr)

          val dateStr = "$yrStr-$monthStr-$dayStr"
          owner?.node?.mason?.dispatch(
            InputEvent("input", dateStr, Event.InputType.InsertText.value).apply {
              target = owner
            }
          )
          owner?.node?.mason?.dispatch(
            InputEvent("change", dateStr, Event.InputType.InsertText.value).apply {
              target = owner
            }
          )
          lastChangeValue = dateStr
        },
        today.get(Calendar.YEAR),
        today.get(Calendar.MONTH),
        today.get(Calendar.DAY_OF_MONTH)
      ).show()
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    var totalWidth = 0
    var maxHeight = 0

    val childCount = childCount
    val size = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP,
      16f,
      resources.displayMetrics
    )
    val wh = MeasureSpec.makeMeasureSpec(size.toInt(), MeasureSpec.EXACTLY)

    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child === showButton) {
        measureChild(child, wh, wh)
      } else {
        measureChild(child, widthMeasureSpec, heightMeasureSpec)
      }
      totalWidth += child.measuredWidth
      maxHeight = max(maxHeight, child.measuredHeight)
    }

    val width = resolveSize(totalWidth, widthMeasureSpec)
    val height = resolveSize(maxHeight, heightMeasureSpec)
    setMeasuredDimension(width, height)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    var left = 0

    val childCount = childCount
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      val right = left + child.measuredWidth
      child.layout(left, 0, right, child.measuredHeight)
      left = right
    }
  }

  private fun createField(maxDigits: Int): EditText {
    return EditText(context).apply {
      isSingleLine = true
      maxLines = 1
      setHorizontallyScrolling(true)
      filters = arrayOf(LengthFilter(maxDigits))
      inputType = InputType.TYPE_CLASS_NUMBER
      hint = "_".repeat(maxDigits)
      background = null
      setPadding(0, 0, 0, 0)
    }
  }

  var value: String
    get() {
      val y = yearInput.text.toString().padStart(4, '0')
      val m = monthInput.text.toString().padStart(2, '0')
      val d = dayInput.text.toString().padStart(2, '0')
      return "$y-$m-$d"
    }
    set(v) {
      val parts = v.split("-")
      if (parts.size == 3) {
        yearInput.setText(parts[0])
        monthInput.setText(parts[1])
        dayInput.setText(parts[2])
      }
    }
}
