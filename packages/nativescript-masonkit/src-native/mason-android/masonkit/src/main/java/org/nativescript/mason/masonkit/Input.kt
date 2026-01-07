package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.app.DatePickerDialog
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.drawable.Drawable
import android.graphics.drawable.StateListDrawable
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
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
import android.widget.SeekBar
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.graphics.toColorInt
import androidx.core.text.TextUtilsCompat
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import java.util.Calendar
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

@SuppressLint("DiscouragedPrivateApi")
class Input @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : FrameLayout(context, attrs), Element, MeasureFunc, StyleChangeListener {

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

      // measure all children (fields + separators + showButton)
      val childCount = childCount
      // fixed size for the button based on sp like before
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

      // layout children in order (fields, separators, button)
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

  internal val buttonInput: android.widget.Button by lazy {
    android.widget.Button(context).apply {
      background = null
      setPadding(0, 0, 0, 0)
      isAllCaps = false
    }
  }


  private val systemGreen = "#4CAF50".toColorInt()

  private val systemGray = "#9E9E9E".toColorInt()

  fun setCheckboxColors(
    checkBox: CheckBox,
    checkedColor: Int = systemGreen,
    uncheckedColor: Int = systemGray
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      checkBox.buttonTintList = ColorStateList(
        arrayOf(
          intArrayOf(android.R.attr.state_checked),
          intArrayOf(-android.R.attr.state_checked)
        ),
        intArrayOf(
          checkedColor,
          uncheckedColor
        )
      )
    } else {
      setCheckboxColorsPre21(checkBox, checkedColor, uncheckedColor)
    }

  }

  private fun setCheckboxColorsPre21(
    checkBox: CheckBox,
    checkedColor: Int,
    uncheckedColor: Int
  ) {
    fun makeDrawable(color: Int): Drawable {
      val d = ContextCompat.getDrawable(
        checkBox.context,
        android.R.drawable.checkbox_off_background
      )!!.mutate()

      d.setColorFilter(color, PorterDuff.Mode.SRC_IN)
      return d
    }

    val checked = makeDrawable(checkedColor)
    val unchecked = makeDrawable(uncheckedColor)

    val states = StateListDrawable().apply {
      addState(intArrayOf(android.R.attr.state_checked), checked)
      addState(intArrayOf(), unchecked)
    }

    checkBox.buttonDrawable = states
  }

  internal val checkBoxInput: CheckBox by lazy {
    CheckBox(context).apply {
      setCheckboxColors(this)
    }
  }

  internal val dateInput: DateInput by lazy {
    DateInput(context)
  }

  internal val radioInput: RadioButton by lazy {
    RadioButton(context).apply {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        buttonTintList = ColorStateList(
          arrayOf(
            intArrayOf(android.R.attr.state_checked),
            intArrayOf(-android.R.attr.state_checked)
          ),
          intArrayOf(
            systemGreen,
            systemGray
          )
        )
      }
    }
  }

  internal val rangeInput: SeekBar by lazy {
    SeekBar(context).apply {
      isClickable = true
      isFocusable = true
      thumb = context.getDrawable(R.drawable.seekbar_thumb_web)
      progressDrawable = context.getDrawable(R.drawable.seekbar_track_web_bordered)
    }
  }

  internal val numberInput: NumberControl by lazy {
    NumberControl(context)
  }

  internal val colorInput: ColorInput by lazy {
    ColorInput(context)
  }

  var multiple: Boolean = false

  val fileInput = FileInputControl(context).apply {
    onPickFile = {
      pickFile(multiple = this@Input.multiple)
    }
    onContentSizeChanged = {
      invalidateLayout()
    }
  }

  private var filePickerLauncher: ActivityResultLauncher<Array<String>>? = null

  private var multiFilePickerLauncher: ActivityResultLauncher<Array<String>>? = null

  private fun handlePickedFiles(uris: List<Uri>) {
    if (uris.isEmpty()) return

    if (multiple) {
      if (uris.size == 1) {
        fileInput.labelText = getFileName(uris.first())
      } else {
        fileInput.labelText = "${uris.size} files selected"
      }
    } else {
      fileInput.labelText = getFileName(uris.first())
    }
  }

  private fun getFileName(uri: Uri): String {
    return context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
      val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
      if (cursor.moveToFirst() && nameIndex >= 0) {
        cursor.getString(nameIndex)
      } else ""
    } ?: ""
  }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    filePickerLauncher?.unregister()
    multiFilePickerLauncher?.unregister()
  }

  private fun pickFile(multiple: Boolean) {
    val mimeTypes = arrayOf(
      "image/png",
      "image/jpeg",
      "image/webp"
    )

    val hash = hashCode()
    (context as? androidx.activity.ComponentActivity)?.let {
      filePickerLauncher = it.activityResultRegistry.register(
        "picker:${hash}",
        ActivityResultContracts.OpenDocument()
      ) { uri ->
        if (uri != null) {
          handlePickedFiles(listOf(uri))
        }
      }

      filePickerLauncher = it.activityResultRegistry.register(
        "picker:${hash}",
        ActivityResultContracts.OpenMultipleDocuments()
      ) { uris ->
        if (uris.isNotEmpty()) {
          handlePickedFiles(uris)
        }
      }
    }

    if (multiple) {
      multiFilePickerLauncher?.launch(mimeTypes)
    } else {
      filePickerLauncher?.launch(mimeTypes)
    }
  }


  enum class Type {
    Text, Button, Checkbox, Email, Password, Date, Radio, Number, Range, Tel, Url, Color, File
  }

  private var initializing = true
  var type: Type = Type.Text
    set(value) {
      field = value
      if (initializing) {
        return
      }
      setupType()
    }

  private fun setupType(initial: Boolean = false) {
    if (!initial) {
      removeAllViews()
    }
    when (type) {
      Type.Text, Type.Email, Type.Password, Type.Tel, Type.Url -> {
        configure {
          val x = (2 * resources.displayMetrics.density).toInt()
          val y = (resources.displayMetrics.density).toInt()
          textInput.setPadding(
            x, y, x, y
          )
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

          Type.Tel -> {
            textInput.inputType =
              InputType.TYPE_CLASS_PHONE
          }

          Type.Url -> {
            textInput.inputType =
              InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
          }

          else -> {
            textInput.inputType =
              InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD // disable spell checker
          }
        }
        addView(textInput)
      }

      Type.Button -> {
        configure {
          val x = (2 * resources.displayMetrics.density).toInt()
          val y = (resources.displayMetrics.density).toInt()
//          textInput.setPadding(
//            x, y, x, y
//          )
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

      Type.Number -> {
        configure {
          val x = (2 * resources.displayMetrics.density).toInt()
          val y = (resources.displayMetrics.density).toInt()
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
        addView(numberInput)
      }

      Type.Range -> {
        addView(rangeInput)
      }

      Type.Color -> {
        configure {
          val x = (2 * resources.displayMetrics.density).toInt()
          val y = (resources.displayMetrics.density).toInt()
//          textInput.setPadding(
//            x, y, x, y
//          )
//          style.padding = Rect(
//            LengthPercentage.Points(y),
//            LengthPercentage.Points(x),
//            LengthPercentage.Points(y),
//            LengthPercentage.Points(x),
//          )

          style.border = "2px"
        }
        addView(colorInput)
      }
      Type.File -> {
        addView(fileInput)
      }
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
    this.setupType(true)
    node.style.setStyleChangeListener(this)
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
        Type.Range -> {}
        Type.Tel -> {}
        Type.Url -> {}
        Type.Color -> {}
        Type.File -> {}
      }
    }

  var value: String
    set(value) {
      when (type) {
        Type.Text, Type.Email, Type.Password -> {
          textInput.setText(value)
        }

        Type.Button -> {
          buttonInput.setText(value)
        }

        Type.Checkbox -> {

        }

        Type.Date -> {}
        Type.Radio -> {}
        Type.Number -> {}
        Type.Range -> {}
        Type.Tel -> {}
        Type.Url -> {}
        Type.Color -> {}
        Type.File -> {}
      }
    }
    get() {
      return when (type) {
        Type.Text, Type.Email, Type.Password -> {
          textInput.text.toString()
        }

        Type.Button -> {
          buttonInput.text.toString()
        }

        Type.Checkbox, Type.Radio -> ""
        Type.Date -> {
          dateInput.value
        }

        Type.Number -> ""
        Type.Range -> ""
        Type.Tel -> ""
        Type.Url -> ""
        Type.Color -> ""
        Type.File -> ""
      }
    }

  var checked: Boolean = false
    set(value) {
      field = value
      if (type == Type.Checkbox) {
        checkBoxInput.isChecked = value
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
      Type.Text, Type.Email, Type.Password, Type.Tel, Type.Url -> {
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

      Type.Number -> {
        numberInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        numberInput.layout(l, t, r, b)
      }

      Type.Range -> {
        rangeInput.layout(l, t, r, b)
      }

      Type.Color -> {
        val width = r - l
        val height = b - t
        colorInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        colorInput.layout(l, t, r, b)
      }

      Type.File -> {
        fileInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        fileInput.layout(l, t, r, b)
      }
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

      Type.Color -> {
        val width = TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_DIP,
          64F,
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

    if (type == Type.Button) {
      size.width = min(size.width, 64 * resources.displayMetrics.density)
      size.height = min(size.height, 32 * resources.displayMetrics.density)
    }
    return size
  }

  override fun onTextStyleChanged(change: Int) {
    val fontColor = change and TextStyleChangeMask.COLOR != 0
    val fontSize = change and TextStyleChangeMask.FONT_SIZE != 0
    val font =
      change and TextStyleChangeMask.FONT_WEIGHT != 0 || change and TextStyleChangeMask.FONT_STYLE != 0 || change and TextStyleChangeMask.FONT_FAMILY != 0


    val textAlign = change and TextStyleChangeMask.TEXT_ALIGN != 0

    when (type) {
      Type.Text, Type.Email, Type.Password, Type.Number, Type.Tel, Type.Url -> {
        if (fontSize) {
          textInput.textSize = style.fontSize.toFloat()
        }
        if (fontColor) {
          textInput.setTextColor(style.resolvedColor)
        }

        if (font) {
          style.resolvedFontFace.font?.let {
            textInput.typeface = it
          }
        }


        val isLeftToRight =
          TextUtilsCompat.getLayoutDirectionFromLocale(Locale.getDefault()) == LAYOUT_DIRECTION_LTR
        if (textAlign) {
          val align = style.resolvedTextAlign
          if (align == TextAlign.Justify) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
              textInput.justificationMode =
                android.graphics.text.LineBreaker.JUSTIFICATION_MODE_INTER_WORD
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              //  textInput.justificationMode = 1
            }
          } else {
            textInput.textAlignment = when (align) {
              TextAlign.Auto -> View.TEXT_ALIGNMENT_GRAVITY
              TextAlign.Left -> if (isLeftToRight) {
                View.TEXT_ALIGNMENT_TEXT_START
              } else {
                View.TEXT_ALIGNMENT_TEXT_END
              }

              TextAlign.Right -> if (isLeftToRight) {
                View.TEXT_ALIGNMENT_TEXT_END
              } else {
                View.TEXT_ALIGNMENT_TEXT_START
              }

              TextAlign.Center -> View.TEXT_ALIGNMENT_CENTER
              TextAlign.Justify -> View.TEXT_ALIGNMENT_INHERIT
              TextAlign.Start -> TEXT_ALIGNMENT_TEXT_START
              TextAlign.End -> TEXT_ALIGNMENT_TEXT_END
            }
          }

        }
      }

      Type.Button -> {
        if (fontSize) {
          buttonInput.textSize = style.fontSize.toFloat()
        }
        if (fontColor) {
          buttonInput.setTextColor(style.resolvedColor)
        }

        if (font) {
          style.resolvedFontFace.font?.let {
            buttonInput.typeface = it
          }
        }
      }

      Type.Checkbox -> {}
      Type.Date -> {}
      Type.Radio -> {}
      Type.Range -> {}
      Type.Color -> {}
      Type.File -> {}
    }
  }
}
