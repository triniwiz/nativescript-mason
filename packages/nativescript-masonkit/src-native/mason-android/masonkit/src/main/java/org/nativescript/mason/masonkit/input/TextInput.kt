package org.nativescript.mason.masonkit.input

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.text.Editable
import android.text.TextWatcher
import android.util.AttributeSet
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputConnectionWrapper
import android.widget.EditText
import androidx.core.view.ViewCompat
import org.nativescript.mason.masonkit.Input
import org.nativescript.mason.masonkit.events.Event
import org.nativescript.mason.masonkit.events.EventOptions
import org.nativescript.mason.masonkit.events.InputEvent

@SuppressLint("AppCompatCustomView")
class TextInput @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null
) : EditText(context, attrs) {
  internal var input: Input? = null

  private val undoStack = ArrayDeque<String>()
  private val redoStack = ArrayDeque<String>()
  private var isUndoOrRedo = false

  private var lastInputType: String? = null
  private var lastInputData: CharSequence? = null

  private var isComposingText = false
  private var lastIsComposing = false

  private var skipNextCommitText = false

  init {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
      isCursorVisible = false
    }

    isFocusable = true
    isFocusableInTouchMode = true
    isEnabled = true

    ViewCompat.setOnReceiveContentListener(
      this,
      ViewCompat.getOnReceiveContentMimeTypes(this) ?: arrayOf(
        "text/plain",
        "text/html",
        "text/uri-list"
      ),
    ) { view, payload ->
      val text = payload.clip
        .getItemAt(0)
        .coerceToText(view.context)

      lastInputType = Event.InputType.InsertFromPaste.value
      lastInputData = text
      input?.onBeforeInput(lastInputType!!, text.toString())

      // Skip the next commitText call (keyboard might try to commit the same text)
      skipNextCommitText = true

      null
    }

    setOnFocusChangeListener { _, hasFocus ->
      input?.let {
        it.node.mason.dispatch(
          Event(
            type = if (hasFocus) "focus" else "blur",
          ).apply {
            target = it
          }
        )
      }
    }

    addTextChangedListener(object : TextWatcher {
      override fun afterTextChanged(s: Editable?) {
        if (isUndoOrRedo) return

        val type = lastInputType ?: return

        input?.let {
          it.node.mason.dispatch(
            InputEvent(
              type = "input",
              data = lastInputData?.toString(),
              inputType = type,
              EventOptions().apply {
                isComposing = lastIsComposing
              }
            ).apply {
              target = it
            }
          )
        }

        if (!isComposingText) {
          undoStack.addLast(s?.toString() ?: "")
          redoStack.clear()
        }

        lastInputType = null
        lastInputData = null
        lastIsComposing = false
      }

      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
        // Handle deletions
        if (before > 0 && count == 0) {
          lastInputType = Event.InputType.DeleteContentBackward.value
          lastInputData = null
          input?.onBeforeInput(lastInputType!!)
          return
        }

        // Handle simple insertions that some IMEs perform via direct text changes
        // (without going through InputConnection.commitText).
        if (before == 0 && count > 0) {
          val inserted = s?.subSequence(start, start + count)

          lastInputType = Event.InputType.InsertText.value
          lastInputData = inserted
          lastIsComposing = isComposingText

          input?.onBeforeInput(
            lastInputType!!,
            inserted?.toString(),
            EventOptions().apply {
              isComposing = lastIsComposing
            }
          )
        }
      }
    })
  }

  fun undo() {
    if (undoStack.isEmpty()) return

    val allowed = input?.onBeforeInput(
      Event.InputType.HistoryUndo.value
    ) ?: true

    if (!allowed) return

    isUndoOrRedo = true

    redoStack.addLast(text.toString())
    val prev = undoStack.removeLast()

    setText(prev)
    setSelection(prev.length)

    isUndoOrRedo = false
  }

  fun redo() {
    if (redoStack.isEmpty()) return

    val allowed = input?.onBeforeInput(
      Event.InputType.HistoryRedo.value
    ) ?: true

    if (!allowed) return

    isUndoOrRedo = true

    undoStack.addLast(text.toString())
    val next = redoStack.removeLast()

    setText(next)
    setSelection(next.length)

    isUndoOrRedo = false
  }

  override fun onKeyDown(keyCode: Int, event: android.view.KeyEvent): Boolean {
    if (event.isCtrlPressed) {
      when (keyCode) {
        android.view.KeyEvent.KEYCODE_Z -> {
          if (event.isShiftPressed) redo() else undo()
          return true
        }

        android.view.KeyEvent.KEYCODE_Y -> {
          redo()
          return true
        }
      }
    }
    return super.onKeyDown(keyCode, event)
  }

  override fun onCreateInputConnection(outAttrs: EditorInfo?): InputConnection {
    val baseConnection = super.onCreateInputConnection(outAttrs)

    return object : InputConnectionWrapper(baseConnection, true) {

      override fun sendKeyEvent(event: android.view.KeyEvent): Boolean {
        if (event.action == android.view.KeyEvent.ACTION_DOWN) {
          when (event.keyCode) {
            android.view.KeyEvent.KEYCODE_DEL -> {
              lastInputType = Event.InputType.DeleteContentBackward.value
              lastInputData = null
              input?.onBeforeInput(lastInputType!!)
            }

            android.view.KeyEvent.KEYCODE_FORWARD_DEL -> {
              lastInputType = Event.InputType.DeleteContentForward.value
              lastInputData = null
              input?.onBeforeInput(lastInputType!!)
            }
          }
        }
        return super.sendKeyEvent(event)
      }

      override fun deleteSurroundingText(before: Int, after: Int): Boolean {
        lastInputType =
          if (before > 0) Event.InputType.DeleteContentBackward.value
          else Event.InputType.DeleteContentForward.value

        lastInputData = null
        input?.onBeforeInput(lastInputType!!)
        return super.deleteSurroundingText(before, after)
      }

      override fun commitText(text: CharSequence?, newCursorPosition: Int): Boolean {
        if (skipNextCommitText) {
          // Already handled as paste
          skipNextCommitText = false
          return super.commitText(text, newCursorPosition)
        }

        // Detect paste: if text length > 1 or contains newlines, treat as paste
        val isLikelyPaste = text?.let {
          it.length > 1 || it.contains("\n")
        } ?: false

        lastInputType = if (isLikelyPaste)
          Event.InputType.InsertFromPaste.value
        else
          Event.InputType.InsertText.value

        lastInputData = text
        lastIsComposing = false


        input?.onBeforeInput(
          lastInputType!!,
          text?.toString(),
        )

        return super.commitText(text, newCursorPosition)
      }

      override fun setComposingText(
        text: CharSequence?,
        newCursorPosition: Int
      ): Boolean {
        isComposingText = true

        lastInputType = Event.InputType.InsertCompositionText.value
        lastInputData = text
        lastIsComposing = true

        input?.onBeforeInput(
          lastInputType!!,
          text?.toString(),
          EventOptions().apply {
            isComposing = true
          }
        )

        return super.setComposingText(text, newCursorPosition)
      }

      override fun finishComposingText(): Boolean {
        isComposingText = false

        lastInputType = Event.InputType.InsertText.value
        lastInputData = null
        lastIsComposing = false

        input?.onBeforeInput(
          lastInputType!!,
          null
        )

        return super.finishComposingText()
      }
    }
  }

  override fun isSuggestionsEnabled(): Boolean {
    return false
  }

  internal val cursorPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
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
