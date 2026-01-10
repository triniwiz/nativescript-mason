package org.nativescript.mason.masonkit.events

import org.nativescript.mason.masonkit.EventTarget


open class Event(val type: String, options: EventOptions? = null) {

  enum class InputType(val value: String) {
    // Text editing
    InsertText("insertText"),
    DeleteContentBackward("deleteContentBackward"),
    DeleteContentForward("deleteContentForward"),
    InsertLineBreak("insertLineBreak"),

    // Replacement / non-text controls
    InsertReplacementText("insertReplacementText"),

    // History
    HistoryUndo("historyUndo"),
    HistoryRedo("historyRedo"),

    // Composition (IME)
    InsertCompositionText("insertCompositionText"),
    DeleteCompositionText("deleteCompositionText"),

    InsertFromPaste("insertFromPaste")
  }

  val bubbles: Boolean = options?.bubbles ?: false
  val cancelable: Boolean = options?.cancelable ?: false
  val isComposing: Boolean = options?.isComposing ?: false
  val timeStamp: Double = (System.currentTimeMillis() * 1000).toDouble()

  var defaultPrevented = false
    internal set

  var propagationStopped = false
    internal set

  var immediatePropagationStopped = false
    internal set

  var target: EventTarget? = null
    internal set

  var currentTarget: EventTarget? = null
    internal set


  fun preventDefault() {
    if (cancelable) {
      return
    }
    defaultPrevented = true
  }

  fun stopPropagation() {
    propagationStopped = true
  }

  fun stopImmediatePropagation() {
    immediatePropagationStopped = true
    propagationStopped = true
  }
}
