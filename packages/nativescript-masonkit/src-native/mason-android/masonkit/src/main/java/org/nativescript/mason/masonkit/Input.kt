package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.app.DatePickerDialog
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.text.Editable
import android.text.InputFilter
import android.text.InputFilter.LengthFilter
import android.text.InputType
import android.text.TextWatcher
import android.text.format.DateFormat
import android.util.AttributeSet
import android.util.TypedValue
import android.view.View
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.RadioButton
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import java.util.Calendar
import java.util.Locale
import kotlin.math.max

@SuppressLint("DiscouragedPrivateApi")
class Input @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : FrameLayout(context, attrs), Element, MeasureFunc {


  class DateInput(context: Context) : FrameLayout(context) {

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
    private val showButton = android.widget.Button(context).apply {
      setBackgroundResource(android.R.drawable.ic_menu_my_calendar)
    }


    init {
      // Add fields to layout in correct order
      order.forEach {
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
      }

      // Auto-jump focus
      fields.forEachIndexed { i, field ->
        field.addTextChangedListener(object : TextWatcher {
          override fun afterTextChanged(s: Editable?) {
            if (s?.length == (field.filters.firstOrNull() as? InputFilter.LengthFilter)?.max) {
              if (i + 1 < fields.size) fields[i + 1].requestFocus()
            }
          }

          override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
          override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
      }

      addView(showButton)

      showButton.setOnClickListener {
        val today = Calendar.getInstance()
        DatePickerDialog(
          context,
          { _, year, month, dayOfMonth ->
            // month is 0-based
            val yrStr =
              String.format(Locale.getDefault(), "%04d", year, month + 1, dayOfMonth)
            val monthStr =
              String.format(Locale.getDefault(), "%02d", year, month + 1, dayOfMonth)
            val dayStr =
              String.format(Locale.getDefault(), "%02d", year, month + 1, dayOfMonth)
            dayInput.setText(dayStr)
            monthInput.setText(monthStr)
            yearInput.setText(yrStr)
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

      fields.forEach { child ->
        measureChild(child, widthMeasureSpec, heightMeasureSpec)
        totalWidth += child.measuredWidth
        maxHeight = max(maxHeight, child.measuredHeight)
      }

      val size = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_SP,
        16f,
        resources.displayMetrics
      )

      val wh = MeasureSpec.makeMeasureSpec(
        size.toInt(), MeasureSpec.EXACTLY
      )

      measureChild(showButton, wh, wh)
      totalWidth += showButton.measuredWidth
      maxHeight = max(maxHeight, showButton.measuredHeight)

      val spacing = (4 * resources.displayMetrics.density).toInt()
      totalWidth += spacing * (fields.size - 1)

      val width = resolveSize(totalWidth, widthMeasureSpec)
      val height = resolveSize(maxHeight, heightMeasureSpec)
      setMeasuredDimension(width, height)
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
      var left = 0
      val spacing = (4 * resources.displayMetrics.density).toInt()

      fields.forEach { child ->
        val right = left + child.measuredWidth
        child.layout(left, 0, right, child.measuredHeight)
        left = right + spacing
      }

      val right = left + showButton.measuredWidth
      showButton.layout(left, 0, right, showButton.measuredHeight)
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

  @SuppressLint("AppCompatCustomView")
  class InputEditText @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
  ) : EditText(context, attrs) {
    internal var input: Input? = null


    init {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
        isCursorVisible = false
      }
    }

    override fun isSuggestionsEnabled(): Boolean {
      return false
    }

    private val cursorPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = input?.style?.resolvedColor ?: Color.BLACK
      strokeWidth = resources.displayMetrics.density
    }

    private var showCursor = true
    private val blinkInterval = 500L // milliseconds

    private val blinkRunnable = object : Runnable {
      override fun run() {
        showCursor = !showCursor
        invalidate()
        postDelayed(this, blinkInterval)
      }
    }

    override fun onAttachedToWindow() {
      super.onAttachedToWindow()
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
        post(blinkRunnable)
      }
    }

    override fun onDetachedFromWindow() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
        removeCallbacks(blinkRunnable)
      }
      super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
      super.onDraw(canvas)

      if (!isFocused || selectionStart < 0 || !showCursor) return

      val layout = layout ?: return
      val offset = selectionStart
      val line = layout.getLineForOffset(offset)

      val x = layout.getPrimaryHorizontal(offset) + totalPaddingLeft
      val top = layout.getLineTop(line) + totalPaddingTop
      val bottom = layout.getLineBottom(line) + totalPaddingTop

      // Draw a vertical cursor line
      canvas.drawLine(x, top.toFloat(), x, bottom.toFloat(), cursorPaint)
    }

  }

  override val view: View
    get() = this

  override val style: Style
    get() = node.style

  override lateinit var node: Node
    private set

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach { it.shader = null } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }


  override fun dispatchDraw(canvas: Canvas) {
    ViewUtils.dispatchDraw(
      this,
      canvas,
      style,
      ignoreBorder = (type == Type.Radio || type == Type.Checkbox)
    ) {
      super.dispatchDraw(it)
    }
  }

  internal val textInput: EditText by lazy {
    InputEditText(context).apply {
      isSingleLine = true
      maxLines = 1
      setHorizontallyScrolling(true)
      setPadding(0, 0, 0, 0)
      background = null
      ellipsize = null
      inputType =
        InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD // disable spell checker
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        textCursorDrawable = null
      }

//      setOnFocusChangeListener { v, hasFocus ->
//       // if (hasFocus) textInput.setSelection(textInput.text?.length ?: 0)
//      }
    }
  }

  internal val buttonInput: Button by lazy {
    Button(context, node.mason)
  }

  internal val checkBoxInput: CheckBox by lazy {
    CheckBox(context)
  }

  internal val dateInput: DateInput by lazy {
    DateInput(context)
  }

  internal val radioInput: RadioButton by lazy {
    RadioButton(context)
  }


  enum class Type {
    Text,
    Button,
    Checkbox,
    Email,
    Password,
    Date,
    Radio,
    Number
  }

  private var initializing = true
  var type: Type = Type.Text
    set(value) {
      field = value
      if (initializing) {
        return
      }
      when (value) {
        Type.Text, Type.Email, Type.Password -> {
          removeAllViews()
          when (value) {
            Type.Email -> {
              textInput.inputType =
                InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            }

            Type.Password -> {
              textInput.inputType =
                InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            }

            else -> {
              textInput.inputType =
                InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD // disable spell checker
            }
          }

          addView(textInput)
        }

        Type.Button -> {
          removeAllViews()
          addView(buttonInput)
        }

        Type.Checkbox -> {
          removeAllViews()
          addView(checkBoxInput)
        }

        Type.Date -> {
          removeAllViews()
          addView(dateInput)
        }

        Type.Radio -> {
          removeAllViews()
          addView(radioInput)
        }

        Type.Number -> {}
      }
    }

  @JvmOverloads
  constructor(context: Context, mason: Mason, type: Type = Type.Text) : this(context, null, true) {
    setup(mason, type)
  }

  init {
    if (!::node.isInitialized && !override) {
      setup(Mason.shared, type)
    }
  }

  private fun setup(mason: Mason, type: Type) {
    node = mason.createNode(this).apply {
      view = this@Input
    }
    node.style.values.put(StyleKeys.ITEM_IS_REPLACED, 1.toByte())
    node.style.display = Display.InlineBlock
    this.type = type
    when (type) {
      Type.Text, Type.Email, Type.Password -> {

        configure {
          val x = (2 * resources.displayMetrics.density).toInt()
          val y = (resources.displayMetrics.density).toInt()
          textInput.setPadding(
            x, y, x, y
          )
//          style.padding = Rect(
//            LengthPercentage.Points(y),
//            LengthPercentage.Points(x),
//            LengthPercentage.Points(y),
//            LengthPercentage.Points(x),
//          )

          style.border = "2px"
          style.borderRadius = "4px"
          style.textAlign = TextAlign.Center
        }
        when (type) {
          Type.Email -> {
            textInput.inputType =
              InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
          }

          Type.Password -> {
            textInput.inputType =
              InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
          }

          else -> {
            textInput.inputType =
              InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD // disable spell checker
          }
        }
        addView(textInput)
      }

      Type.Button -> {
        addView(buttonInput)
      }

      Type.Checkbox -> {
        addView(checkBoxInput)
      }

      Type.Date -> {
        addView(dateInput)
      }

      Type.Radio -> {
        addView(radioInput)
      }

      Type.Number -> {}
    }
    initializing = false
  }

  var placeholder: String = ""
    set(value) {
      field = value
      when (type) {
        Type.Text, Type.Email,
        Type.Password -> {
          textInput.hint = value
        }

        else -> {}
      }
    }

  var name: String = ""

  var maxLength: Int = -1
    set(value) {
      field = value
      when (type) {
        Type.Text, Type.Email, Type.Password -> {
          if (value > -1) {
            textInput.filters = arrayOf(
              LengthFilter(value)
            )
          } else {
            textInput.filters = arrayOf()
          }
        }

        Type.Button -> {
          if (value > -1) {
            buttonInput.filters = arrayOf(
              LengthFilter(value)
            )
          } else {
            buttonInput.filters = arrayOf()
          }
        }

        Type.Checkbox -> {

        }

        Type.Date, Type.Radio -> {}
        Type.Number -> {}
      }
    }

  var value: String
    set(value) {
      when (type) {
        Type.Text, Type.Email, Type.Password -> {
          textInput.setText(value)
        }

        Type.Button -> {
          buttonInput.textContent = value
        }

        Type.Checkbox -> {

        }

        Type.Date -> {}
        Type.Radio -> {}
        Type.Number -> {}
      }
    }
    get() {
      return when (type) {
        Type.Text, Type.Email, Type.Password -> {
          textInput.text.toString()
        }

        Type.Button -> {
          buttonInput.textContent
        }

        Type.Checkbox, Type.Radio -> ""
        Type.Date -> {
          dateInput.value
        }

        Type.Number -> ""
      }
    }


  var size: Int = 20
    set(value) {
      field = value
      node.dirty()
      if (!style.inBatch) {
        invalidateLayout()
      }
    }

  internal fun layoutChild(l: Int, t: Int, r: Int, b: Int) {
    when (type) {
      Type.Text, Type.Email, Type.Password -> {
        textInput.layout(l, t, r, b)
      }

      Type.Button -> {
        buttonInput.layout(l, t, r, b)
      }

      Type.Checkbox -> {
        checkBoxInput.layout(l, t, r, b)
      }

      Type.Date -> {
        val width = r - l
        val height = b - t
        dateInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        dateInput.layout(l, t, r, b)
      }

      Type.Radio -> {
        radioInput.layout(l, t, r, b)
      }

      Type.Number -> {}
    }
  }

  override fun measure(
    knownDimensions: Size<Float?>,
    availableSpace: Size<Float?>
  ): Size<Float> {
    val size = Size(300f, 150f)
    var ch: Float? = null
    when (type) {
      Type.Checkbox -> {
        val dim = TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_DIP,
          24F,
          resources.displayMetrics
        )
        size.width = dim
        size.height = dim
      }

      Type.Radio -> {
        val width = TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_DIP,
          32F,
          resources.displayMetrics
        )
        val height = TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_DIP,
          24F,
          resources.displayMetrics
        )
        size.width = width
        size.height = height
      }

      else -> {
        ch = style.paint.measureText("0")
      }
    }

    knownDimensions.width?.let {
      if (!it.isNaN() && it.isFinite()) {
        size.width = it
      }
    } ?: run {
      ch?.let {
        size.width = max(ch * this.size, 150f)
      }
    }

    knownDimensions.height?.let {
      if (!it.isNaN() && it.isFinite()) {
        size.height = it
      }
    } ?: run {
      ch?.let {
        val fm = style.paint.fontMetrics
        size.height = fm.descent - fm.ascent
      }
    }
    return size
  }
}
