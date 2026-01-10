package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.drawable.Drawable
import android.graphics.drawable.StateListDrawable
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import android.text.InputFilter
import android.text.InputFilter.LengthFilter
import android.text.InputType
import android.text.SpannableStringBuilder
import android.util.AttributeSet
import android.util.TypedValue
import android.view.View
import android.widget.CheckBox
import android.widget.FrameLayout
import android.widget.RadioButton
import android.widget.SeekBar
import android.widget.TextView
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.content.ContextCompat
import androidx.core.graphics.toColorInt
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.events.Event
import org.nativescript.mason.masonkit.events.EventOptions
import org.nativescript.mason.masonkit.events.FileInputEvent
import org.nativescript.mason.masonkit.events.InputEvent
import org.nativescript.mason.masonkit.input.ColorInput
import org.nativescript.mason.masonkit.input.DateInput
import org.nativescript.mason.masonkit.input.FileInputControl
import org.nativescript.mason.masonkit.input.NumberControl
import org.nativescript.mason.masonkit.input.TextInput
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.max

@SuppressLint("DiscouragedPrivateApi")
class Input @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : FrameLayout(context, attrs), Element, MeasureFunc, StyleChangeListener {

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

  private val beforeFilter = InputFilter { source, start, end, dest, dstart, dend ->
    val event = InputEvent(
      type = "beforeinput",
      data = source?.toString(),
      inputType = Event.InputType.InsertText.value
    ).apply {
      target = this@Input
    }

    node.mason.dispatch(event)

    if (event.defaultPrevented) {
      "" // CANCEL mutation
    } else {
      null // ALLOW mutation
    }
  }


  internal fun onBeforeInput(
    type: String,
    data: String? = null,
    options: EventOptions? = null
  ): Boolean {
    val event = InputEvent(
      type = "beforeinput",
      data = data,
      inputType = type,
      options
    ).apply {
      target = this@Input
    }

    node.mason.dispatch(event)

    return !event.defaultPrevented
  }

  internal val textInput: TextInput by lazy {
    TextInput(context).apply {
      input = this@Input
      isSingleLine = true
      maxLines = 1
      textSize = style.fontSize.toFloat()
      setHorizontallyScrolling(true)
      setPadding(0, 0, 0, 0)
      background = null
      ellipsize = null
      inputType =
        InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD // disable spell checker
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        textCursorDrawable = null
      }

      filters = arrayOf(beforeFilter)
    }
  }

  internal val buttonInput: TextView by lazy {
    TextView(context).apply {
      background = null
      includeFontPadding = false
      setPadding(0, 0, 0, 0)
      isAllCaps = false
      gravity = android.view.Gravity.CENTER_HORIZONTAL or android.view.Gravity.CENTER_VERTICAL
      setOnClickListener {
        node.mason.dispatch(
          Event(
            type = "click",
          ).apply {
            target = this@Input
          }
        )
      }
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
      setOnCheckedChangeListener { checkBox, isChecked ->
        val before = InputEvent(
          type = "beforeinput",
          data = isChecked,
          inputType = Event.InputType.InsertReplacementText.value
        ).apply {
          target = this@Input
        }

        node.mason.dispatch(before)

        if (before.defaultPrevented) {
          checkBox.isChecked = !isChecked
          return@setOnCheckedChangeListener
        }

        node.mason.dispatch(
          InputEvent("input", isChecked, Event.InputType.InsertReplacementText.value).apply {
            target = this@Input
          }
        )

        node.mason.dispatch(
          InputEvent("change", isChecked, Event.InputType.InsertReplacementText.value).apply {
            target = this@Input
          }
        )
      }
    }
  }

  internal val dateInput: DateInput by lazy {
    DateInput(context).apply {
      owner = this@Input
    }
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

      setOnCheckedChangeListener { _, isChecked ->
        if (isChecked) {
          node.mason.dispatch(
            InputEvent(
              "change", true
            ).apply {
              target = this@Input
            }
          )
        }
      }
    }
  }

  internal val rangeInput: SeekBar by lazy {
    SeekBar(context).apply {
      isClickable = true
      isFocusable = true
      thumb = AppCompatResources.getDrawable(context, R.drawable.seekbar_thumb_web)
      progressDrawable =
        AppCompatResources.getDrawable(context, R.drawable.seekbar_track_web_bordered)
      setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {

        override fun onProgressChanged(sb: SeekBar, value: Int, fromUser: Boolean) {
          if (!fromUser) return

          val before = InputEvent(
            "beforeinput", value.toDouble(),
            Event.InputType.InsertReplacementText.value
          ).apply {
            target = this@Input
          }

          node.mason.dispatch(before)
          if (before.defaultPrevented) return

          node.mason.dispatch(
            InputEvent(
              "input", value.toDouble(),
              Event.InputType.InsertReplacementText.value
            ).apply {
              target = this@Input
            }
          )
        }

        override fun onStopTrackingTouch(sb: SeekBar) {
          node.mason.dispatch(
            InputEvent(
              "change", sb.progress.toDouble(),
              Event.InputType.InsertReplacementText.value
            ).apply {
              target = this@Input
            }
          )
        }

        override fun onStartTrackingTouch(sb: SeekBar) {}
      })
    }
  }

  internal val numberInput: NumberControl by lazy {
    NumberControl(context)
  }

  internal val colorInput: ColorInput by lazy {
    ColorInput(context).apply {
      owner = this@Input
    }
  }

  var multiple: Boolean = false
  var accept: String = "*/*"
  val fileInput = FileInputControl(context).apply {
    owner = this@Input
    onPickFile = {
      pickFile(multiple = this@Input.multiple, accept)
    }
    onContentSizeChanged = {
      invalidateLayout()
    }
  }

  private var filePickerLauncher: ActivityResultLauncher<Array<String>>? = null

  private var multiFilePickerLauncher: ActivityResultLauncher<Array<String>>? = null

  private fun dispatchInput(files: List<Uri>) {
    val payload = files.map { getFileName(it) }

    node.mason.dispatch(
      FileInputEvent(
        type = "input",
        data = payload,
        inputType = "insertFromFile",
        EventOptions().apply {
          bubbles = true
          cancelable = false
        }, files
      ).apply {
        target = this@Input
      }
    )
  }

  private fun dispatchBeforeInput(files: List<Uri>): Boolean {
    val event = InputEvent(
      type = "beforeinput",
      data = null,
      inputType = "insertFromFile",
      EventOptions().apply {
        bubbles = true
        cancelable = true
      }
    ).apply {
      target = this@Input
    }

    node.mason.dispatch(event)
    return !event.defaultPrevented
  }


  private fun dispatchChange(files: List<Uri>) {
    val payload = files.map { getFileName(it) }
    node.mason.dispatch(
      FileInputEvent(
        type = "change",
        data = payload,
        null,
        EventOptions().apply {
          bubbles = true
        },
        emptyList()
      ).apply {
        target = this@Input
      },
    )
  }

  private fun handlePickedFiles(uris: List<Uri>) {
    if (uris.isEmpty()) return

    val allowed = dispatchBeforeInput(uris)
    if (!allowed) return

    if (multiple) {
      fileInput.labelText =
        if (uris.size == 1) getFileName(uris.first())
        else "${uris.size} files selected"
    } else {
      fileInput.labelText = getFileName(uris.first())
    }

    dispatchInput(uris)

    dispatchChange(uris)
  }

  private fun getFileName(uri: Uri): String {
    return context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
      val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
      if (cursor.moveToFirst() && nameIndex >= 0) {
        cursor.getString(nameIndex)
      } else ""
    } ?: ""
  }


  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    filePickerLauncher?.unregister()
    multiFilePickerLauncher?.unregister()
    filePickerLauncher = null
    multiFilePickerLauncher = null
  }

  private fun pickFile(multiple: Boolean, accept: String) {
    val mimeTypes = accept.split(",").map { it.trim() }

    val hash = hashCode()
    (context as? androidx.activity.ComponentActivity)?.let {
      if (filePickerLauncher == null) {
        filePickerLauncher = it.activityResultRegistry.register(
          "picker:${hash}",
          ActivityResultContracts.OpenDocument()
        ) { uri ->
          if (uri != null) {
            handlePickedFiles(listOf(uri))
          }
        }
      }

      if (multiFilePickerLauncher == null) {
        multiFilePickerLauncher = it.activityResultRegistry.register(
          "picker:${hash}",
          ActivityResultContracts.OpenMultipleDocuments()
        ) { uris ->
          if (uris.isNotEmpty()) {
            handlePickedFiles(uris)
          }
        }
      }

    }

    if (multiple) {
      multiFilePickerLauncher?.launch(mimeTypes.toTypedArray())
    } else {
      filePickerLauncher?.launch(mimeTypes.toTypedArray())
    }
  }

  private fun resetFileInput() {
    fileInput.labelText = ""
    node.mason.dispatch(
      FileInputEvent(
        type = "input",
        data = emptyList(),
        inputType = "deleteContent",
        EventOptions().apply { bubbles = true },
        emptyList()
      ).apply { target = this@Input }
    )
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
      style.inBatch = true
      style.border = ""
      style.borderRadius = ""
      style.textAlign = TextAlign.Auto
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
          (2 * resources.displayMetrics.density).toInt()
          (resources.displayMetrics.density).toInt()
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

        addView(
          buttonInput, -2, -2
        )
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
          (2 * resources.displayMetrics.density).toInt()
          (resources.displayMetrics.density).toInt()
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
          (2 * resources.displayMetrics.density).toInt()
          (resources.displayMetrics.density).toInt()
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
    style.inBatch = false
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
        Type.Password, Type.Url, Type.Tel -> {
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
              LengthFilter(value), beforeFilter
            )
          } else {
            textInput.filters = arrayOf(beforeFilter)
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

  private fun syncTextStyle(value: String, view: TextView, ignoreLineHeight: Boolean = false) {
    val text = SpannableStringBuilder(TextNode.processText(value, style))
    val attributes = node.getDefaultAttributes()
    if (ignoreLineHeight) {
      attributes.lineHeight = null
    }
    TextNode.applyAttributes(text, 0, text.length, attributes)
    view.setText(text, TextView.BufferType.SPANNABLE)
  }

  var value: String
    set(value) {
      when (type) {
        Type.Tel, Type.Url, Type.Text, Type.Email, Type.Password -> {
          syncTextStyle(value, textInput)
        }

        Type.Button -> {
          syncTextStyle(value, buttonInput)
        }

        Type.Checkbox -> {

        }

        Type.Date -> {}
        Type.Radio -> {}
        Type.Number -> {}
        Type.Range -> {}
        Type.Color -> {}
        Type.File -> {
          if (value.isEmpty()) {
            resetFileInput()
          }
        }
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

  var valueAsNumber: Double
    get() = when (type) {
      Type.Number -> numberInput.value.toDouble()
      Type.Range -> rangeInput.progress.toDouble()
      Type.Text, Type.Email, Type.Password, Type.Tel, Type.Url -> textInput.text.toString()
        .toDoubleOrNull()
        ?: Double.NaN

      else -> Double.NaN
    }
    set(v) {
      when (type) {
        Type.Number -> numberInput.value = v.toInt()
        Type.Range -> rangeInput.progress = v.toInt()
        Type.Text, Type.Email, Type.Password, Type.Tel, Type.Url -> textInput.setText(v.toString())
        else -> {}
      }
    }

  var valueAsDate: Date
    get() {
      return when (type) {
        Type.Date -> {
          val parts = dateInput.value.split("-")
          if (parts.size == 3) {
            val y = parts[0].toIntOrNull() ?: 0
            val m = (parts[1].toIntOrNull() ?: 1) - 1
            val d = parts[2].toIntOrNull() ?: 1
            Calendar.getInstance().apply {
              set(Calendar.YEAR, y)
              set(Calendar.MONTH, m)
              set(Calendar.DAY_OF_MONTH, d)
              set(Calendar.HOUR_OF_DAY, 0)
              set(Calendar.MINUTE, 0)
              set(Calendar.SECOND, 0)
              set(Calendar.MILLISECOND, 0)
            }.time
          } else {
            Date(0)
          }
        }

        else -> Date(0)
      }
    }
    set(v) {
      if (type == Type.Date) {
        val cal = Calendar.getInstance().apply { time = v }
        val yr = cal.get(Calendar.YEAR)
        val mon = cal.get(Calendar.MONTH) + 1
        val day = cal.get(Calendar.DAY_OF_MONTH)
        val formatted = String.format(Locale.getDefault(), "%04d-%02d-%02d", yr, mon, day)
        dateInput.value = formatted
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
    val width = r - l
    val height = b - t
    when (type) {
      Type.Text, Type.Email, Type.Password, Type.Tel, Type.Url -> {
        textInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        textInput.layout(l, t, r, b)
      }

      Type.Button -> {
        buttonInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        buttonInput.layout(l, t, r, b)
      }

      Type.Checkbox -> {
        checkBoxInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        checkBoxInput.layout(l, t, r, b)
      }

      Type.Date -> {
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
        radioInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
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
        rangeInput.measure(
          MeasureSpec.makeMeasureSpec(
            width, MeasureSpec.EXACTLY
          ),
          MeasureSpec.makeMeasureSpec(
            height, MeasureSpec.EXACTLY
          )
        )
        rangeInput.layout(l, t, r, b)
      }

      Type.Color -> {
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

      Type.File -> {
        fileInput.measure(0, 0)
        size.width = fileInput.measuredWidth.toFloat()
        size.height = fileInput.measuredHeight.toFloat()
      }

      Type.Button -> {
        buttonInput.measure(0, 0)
        size.width = max(buttonInput.measuredWidth.toFloat(), 64 * resources.displayMetrics.density)

        val fm = style.paint.fontMetrics
        size.height =
          max(fm.descent - fm.ascent, 32 * resources.displayMetrics.density)
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

  override fun onTextStyleChanged(change: Int) {
    val fontColor = change and TextStyleChangeMask.COLOR != 0
    val fontSize = change and TextStyleChangeMask.FONT_SIZE != 0
    val font =
      change and TextStyleChangeMask.FONT_WEIGHT != 0 || change and TextStyleChangeMask.FONT_STYLE != 0 || change and TextStyleChangeMask.FONT_FAMILY != 0


    val textAlign = change and TextStyleChangeMask.TEXT_ALIGN != 0

    when (type) {
      Type.Text, Type.Email, Type.Password, Type.Number, Type.Tel, Type.Url -> {
        if (fontSize || fontColor || font || textAlign) {
          textInput.cursorPaint.textSize = style.resolvedFontSize.toFloat()
          textInput.cursorPaint.color = style.resolvedColor
          syncTextStyle(textInput.text.toString(), textInput)
        }
      }

      Type.Button -> {
        if (fontSize || fontColor || font || textAlign) {
          syncTextStyle(buttonInput.text.toString(), buttonInput)
        }
      }

      Type.Checkbox -> {}
      Type.Date -> {
        if (fontSize || fontColor || font || textAlign) {
          syncTextStyle(dateInput.dayInput.text.toString(), dateInput.dayInput)
          syncTextStyle(dateInput.monthInput.text.toString(), dateInput.monthInput)
          syncTextStyle(dateInput.yearInput.text.toString(), dateInput.yearInput)
        }
      }

      Type.Radio -> {}
      Type.Range -> {}
      Type.Color -> {}
      Type.File -> {
        if (fontSize || fontColor || font || textAlign) {
          syncTextStyle(fileInput.fileButton.text.toString(), fileInput.fileButton)
          syncTextStyle(fileInput.fileLabel.text.toString(), fileInput.fileLabel)
        }
      }
    }
  }
}
