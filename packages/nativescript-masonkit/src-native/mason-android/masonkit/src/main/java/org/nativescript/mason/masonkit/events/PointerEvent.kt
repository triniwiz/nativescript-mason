package org.nativescript.mason.masonkit.events

import org.nativescript.mason.masonkit.EventTarget

/** DOM PointerEvent. Coordinates are CSS pixels (dips). */
class PointerEvent(type: String, options: EventOptions) : Event(type, options) {
  var pointerId: Int = 0
    internal set
  var pointerType: String = "touch"
    internal set
  var isPrimary: Boolean = false
    internal set

  var clientX: Float = 0f
    internal set
  var clientY: Float = 0f
    internal set
  var screenX: Float = 0f
    internal set
  var screenY: Float = 0f
    internal set
  var offsetX: Float = 0f
    internal set
  var offsetY: Float = 0f
    internal set
  var movementX: Float = 0f
    internal set
  var movementY: Float = 0f
    internal set

  val pageX: Float get() = clientX
  val pageY: Float get() = clientY
  val x: Float get() = clientX
  val y: Float get() = clientY

  var button: Int = -1
    internal set
  var buttons: Int = 0
    internal set

  var width: Float = 1f
    internal set
  var height: Float = 1f
    internal set
  var pressure: Float = 0f
    internal set
  var tangentialPressure: Float = 0f
    internal set
  var tiltX: Float = 0f
    internal set
  var tiltY: Float = 0f
    internal set
  var twist: Float = 0f
    internal set

  var ctrlKey: Boolean = false
    internal set
  var shiftKey: Boolean = false
    internal set
  var altKey: Boolean = false
    internal set
  var metaKey: Boolean = false
    internal set

  /** pointerover/out/enter/leave: the element the pointer came from or went to. */
  var relatedTarget: EventTarget? = null
    internal set

  internal fun copyPointer(from: PointerEvent) {
    pointerId = from.pointerId
    pointerType = from.pointerType
    isPrimary = from.isPrimary
    clientX = from.clientX
    clientY = from.clientY
    screenX = from.screenX
    screenY = from.screenY
    button = from.button
    buttons = from.buttons
    width = from.width
    height = from.height
    pressure = from.pressure
    tiltX = from.tiltX
    tiltY = from.tiltY
    twist = from.twist
    ctrlKey = from.ctrlKey
    shiftKey = from.shiftKey
    altKey = from.altKey
    metaKey = from.metaKey
  }

  companion object {
    /** The pointer event types, for listener bookkeeping. */
    @JvmField
    val TYPES = setOf(
      "pointerdown", "pointermove", "pointerup", "pointercancel",
      "pointerover", "pointerout", "pointerenter", "pointerleave",
      "gotpointercapture", "lostpointercapture"
    )

    internal fun cancelable(type: String) = when (type) {
      "pointerdown", "pointermove", "pointerup", "pointerover", "pointerout" -> true
      else -> false
    }
  }
}
