package org.nativescript.mason.masonkit

import android.os.Build
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import org.nativescript.mason.masonkit.events.EventOptions
import org.nativescript.mason.masonkit.events.PointerEvent
import kotlin.math.atan
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin
import kotlin.math.tan

/** CSS `pointer-events` values for [Node.pointerEvents]. */
object PointerEvents {
  const val AUTO = 0
  const val NONE = 1
}

/**
 * DOM pointer events from Android touch and hover streams. The outermost Mason view of a stream
 * handles each MotionEvent once: it hit-tests for the target and the event bubbles from there.
 */
internal object PointerDispatch {
  private const val MOUSE_ID = 1
  private const val TOUCH_ID_BASE = 2

  private class Pointer(val id: Int, val type: String, val primary: Boolean) {
    var target: Node? = null
    var capture: Node? = null
    var pendingCapture: Node? = null
    var hasPendingCapture = false
    var clientX = Float.NaN
    var clientY = Float.NaN
    var buttons = 0
    var cancelled = false
  }

  private val pointers = HashMap<Int, Pointer>()

  // The last MotionEvent handled, so nested Mason views skip it.
  private var lastTime = Long.MIN_VALUE
  private var lastDown = Long.MIN_VALUE
  private var lastAction = -1
  private var lastPointerId = -1

  // A hover exit is settled a turn later: Android sends one before every mouse press.
  private var hoverGeneration = 0

  private val loc = IntArray(2)

  private fun firstSight(ev: MotionEvent): Boolean {
    val pointerId = ev.getPointerId(ev.actionIndex)
    if (ev.eventTime == lastTime && ev.downTime == lastDown && ev.actionMasked == lastAction && pointerId == lastPointerId) return false
    lastTime = ev.eventTime
    lastDown = ev.downTime
    lastAction = ev.actionMasked
    lastPointerId = pointerId
    return true
  }

  private fun isOutermost(view: View): Boolean {
    var parent = view.parent
    while (parent != null) {
      if (parent is Element) return false
      parent = parent.parent
    }
    return true
  }

  private fun active(mason: Mason) = mason.pointerListenerCount > 0 || pointers.isNotEmpty()

  /**
   * Called by every Mason view's dispatchTouchEvent before the view handles [ev]. Returns true when
   * pointer listeners need the rest of the stream, so the caller claims the DOWN.
   */
  fun onTouch(element: Element, ev: MotionEvent): Boolean {
    if (!active(element.node.mason)) return false
    val view = element.view
    if (!firstSight(ev)) return false
    if (!isOutermost(view)) {
      // A Mason ancestor handles the stream; a cancel only this view sees means a view between took it over.
      if (ev.actionMasked == MotionEvent.ACTION_CANCEL) cancelInside(element)
      return false
    }
    hoverGeneration++
    val scale = element.node.mason.scale
    view.getLocationInWindow(loc)
    val originX = loc[0].toFloat()
    val originY = loc[1].toFloat()

    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
        val index = ev.actionIndex
        // A new gesture: touch pointers left from the last one never ended.
        if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
          for (stale in pointers.values.toList()) {
            if (stale.type != "mouse") {
              cancel(stale)
              end(stale)
            }
          }
        }
        val pointer = begin(ev, index)
        val target = HitTesting.pointerTarget(view, ev.getX(index), ev.getY(index))
        val event = build("pointerdown", ev, index, pointer, originX, originY, scale)
        retarget(pointer, target, event)
        // Touch and pen are captured to their target, as if setPointerCapture ran before pointerdown.
        if (pointer.type != "mouse" && target != null) {
          pointer.pendingCapture = target
          pointer.hasPendingCapture = true
        }
        fire("pointerdown", target, event)
        return target != null && element.node.mason.hasListenerOnPath(target, PointerEvent.TYPES)
      }

      MotionEvent.ACTION_MOVE -> {
        for (index in 0 until ev.pointerCount) {
          val pointer = pointers[idOf(ev, index)] ?: continue
          if (pointer.cancelled) continue
          val lastX = pointer.clientX
          val lastY = pointer.clientY
          val event = build("pointermove", ev, index, pointer, originX, originY, scale)
          if (event.clientX == lastX && event.clientY == lastY) continue
          processPendingCapture(pointer, event)
          if (pointer.capture == null) retarget(pointer, HitTesting.pointerTarget(view, ev.getX(index), ev.getY(index)), event)
          send("pointermove", pointer, event)
        }
        return pointers.isNotEmpty()
      }

      MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP -> {
        val index = ev.actionIndex
        val pointer = pointers[idOf(ev, index)] ?: return false
        if (pointer.cancelled) {
          end(pointer)
          return true
        }
        val event = build("pointerup", ev, index, pointer, originX, originY, scale)
        processPendingCapture(pointer, event)
        if (pointer.capture == null) retarget(pointer, HitTesting.pointerTarget(view, ev.getX(index), ev.getY(index)), event)
        send("pointerup", pointer, event)
        release(pointer, event)
        if (pointer.type != "mouse") {
          retarget(pointer, null, event)
          end(pointer)
        }
        return true
      }

      MotionEvent.ACTION_CANCEL -> {
        for (pointer in pointers.values.toList()) {
          if (pointer.type != "mouse" || pointer.buttons != 0) cancel(pointer)
        }
        return false
      }
    }
    return false
  }

  /** Mouse and pen hover, from every Mason view's dispatchHoverEvent. */
  fun onHover(element: Element, ev: MotionEvent) {
    if (!active(element.node.mason)) return
    val view = element.view
    if (!firstSight(ev) || !isOutermost(view)) return
    val scale = element.node.mason.scale
    view.getLocationInWindow(loc)
    val id = idOf(ev, 0)
    when (ev.actionMasked) {
      MotionEvent.ACTION_HOVER_ENTER, MotionEvent.ACTION_HOVER_MOVE -> {
        hoverGeneration++
        val pointer = pointers.getOrPut(id) { Pointer(id, typeOf(ev, 0), true) }
        val lastX = pointer.clientX
        val lastY = pointer.clientY
        val event = build("pointermove", ev, 0, pointer, loc[0].toFloat(), loc[1].toFloat(), scale)
        if (event.clientX == lastX && event.clientY == lastY) return
        processPendingCapture(pointer, event)
        if (pointer.capture == null) retarget(pointer, HitTesting.pointerTarget(view, ev.x, ev.y), event)
        send("pointermove", pointer, event)
      }

      MotionEvent.ACTION_HOVER_EXIT -> {
        val pointer = pointers[id] ?: return
        val event = build("pointerout", ev, 0, pointer, loc[0].toFloat(), loc[1].toFloat(), scale)
        val generation = ++hoverGeneration
        view.post {
          if (generation != hoverGeneration || pointers[id] !== pointer || pointer.buttons != 0) return@post
          retarget(pointer, null, event)
          end(pointer)
        }
      }
    }
  }

  /** Cancels the touch pointers whose target is [element] or inside it: it took the gesture over. */
  fun cancelInside(element: Element) {
    if (pointers.isEmpty()) return
    val node = element.node
    for (pointer in pointers.values.toList()) {
      if (pointer.cancelled || (pointer.type == "mouse" && pointer.buttons == 0)) continue
      var current = pointer.target
      while (current != null && current !== node) current = current.parent
      if (current != null) cancel(pointer)
    }
  }

  fun setCapture(node: Node, pointerId: Int): Boolean {
    val pointer = pointers[pointerId] ?: return false
    if (pointer.buttons == 0 && pointer.type == "mouse") return false
    pointer.pendingCapture = node
    pointer.hasPendingCapture = true
    return true
  }

  fun releaseCapture(node: Node, pointerId: Int) {
    val pointer = pointers[pointerId] ?: return
    if (hasCapture(node, pointerId)) {
      pointer.pendingCapture = null
      pointer.hasPendingCapture = true
    }
  }

  fun hasCapture(node: Node, pointerId: Int): Boolean {
    val pointer = pointers[pointerId] ?: return false
    return (if (pointer.hasPendingCapture) pointer.pendingCapture else pointer.capture) === node
  }

  private fun idOf(ev: MotionEvent, index: Int): Int =
    if (ev.getToolType(index) == MotionEvent.TOOL_TYPE_MOUSE) MOUSE_ID else TOUCH_ID_BASE + ev.getPointerId(index)

  private fun typeOf(ev: MotionEvent, index: Int): String = when (ev.getToolType(index)) {
    MotionEvent.TOOL_TYPE_MOUSE -> "mouse"
    MotionEvent.TOOL_TYPE_STYLUS, MotionEvent.TOOL_TYPE_ERASER -> "pen"
    else -> "touch"
  }

  private fun begin(ev: MotionEvent, index: Int): Pointer {
    val id = idOf(ev, index)
    pointers[id]?.let { existing ->
      // A mouse keeps its hover state across presses; anything else left over was lost.
      if (existing.type == "mouse") {
        existing.cancelled = false
        return existing
      }
      end(existing)
    }
    val type = typeOf(ev, index)
    val primary = type == "mouse" || pointers.values.none { it.type == type }
    return Pointer(id, type, primary).also { pointers[id] = it }
  }

  private fun end(pointer: Pointer) {
    if (pointers[pointer.id] === pointer) pointers.remove(pointer.id)
  }

  private fun cancel(pointer: Pointer) {
    if (pointer.cancelled) return
    pointer.cancelled = true
    val event = PointerEvent("pointercancel", options("pointercancel")).apply {
      pointerId = pointer.id
      pointerType = pointer.type
      isPrimary = pointer.primary
      clientX = pointer.clientX
      clientY = pointer.clientY
      screenX = pointer.clientX
      screenY = pointer.clientY
    }
    pointer.buttons = 0
    send("pointercancel", pointer, event)
    release(pointer, event)
    retarget(pointer, null, event)
    if (pointer.type == "mouse") pointer.cancelled = false
  }

  private fun buttonsOf(ev: MotionEvent, type: String, action: Int): Int {
    if (type != "mouse") {
      return if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_CANCEL) 0 else 1
    }
    val state = ev.buttonState
    var buttons = 0
    if (state and MotionEvent.BUTTON_PRIMARY != 0) buttons = buttons or 1
    if (state and MotionEvent.BUTTON_SECONDARY != 0) buttons = buttons or 2
    if (state and MotionEvent.BUTTON_TERTIARY != 0) buttons = buttons or 4
    if (state and MotionEvent.BUTTON_BACK != 0) buttons = buttons or 8
    if (state and MotionEvent.BUTTON_FORWARD != 0) buttons = buttons or 16
    return buttons
  }

  private fun buttonOf(ev: MotionEvent, type: String, action: Int): Int {
    val changes = action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN ||
      action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP
    if (!changes) return -1
    if (type != "mouse" || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return 0
    return when (ev.actionButton) {
      MotionEvent.BUTTON_TERTIARY -> 1
      MotionEvent.BUTTON_SECONDARY -> 2
      MotionEvent.BUTTON_BACK -> 3
      MotionEvent.BUTTON_FORWARD -> 4
      else -> 0
    }
  }

  // Mason bubbles pointer events itself, so they report bubbles = false: a host framework's DOM
  // shim re-dispatching one must not bubble it again.
  private fun options(type: String) = EventOptions().apply {
    this.type = type
    cancelable = PointerEvent.cancelable(type)
  }

  private fun build(type: String, ev: MotionEvent, index: Int, pointer: Pointer, originX: Float, originY: Float, scale: Float): PointerEvent {
    val action = ev.actionMasked
    val event = PointerEvent(type, options(type))
    event.pointerId = pointer.id
    event.pointerType = pointer.type
    event.isPrimary = pointer.primary
    val x = (originX + ev.getX(index)) / scale
    val y = (originY + ev.getY(index)) / scale
    event.clientX = x
    event.clientY = y
    event.screenX = x
    event.screenY = y
    event.buttons = buttonsOf(ev, pointer.type, action)
    event.button = buttonOf(ev, pointer.type, action)
    event.pressure = when {
      event.buttons == 0 -> 0f
      pointer.type == "mouse" -> 0.5f
      else -> ev.getPressure(index).coerceIn(0f, 1f).let { if (it == 0f) 0.5f else it }
    }
    if (pointer.type != "mouse") {
      event.width = max(1f, ev.getTouchMajor(index) / scale)
      event.height = max(1f, ev.getTouchMinor(index) / scale)
    }
    if (pointer.type == "pen") {
      val tilt = ev.getAxisValue(MotionEvent.AXIS_TILT, index)
      val orientation = ev.getOrientation(index)
      event.tiltX = Math.toDegrees(atan(tan(tilt.toDouble()) * sin(orientation.toDouble()))).toFloat()
      event.tiltY = Math.toDegrees(atan(-tan(tilt.toDouble()) * cos(orientation.toDouble()))).toFloat()
    }
    val meta = ev.metaState
    event.ctrlKey = meta and KeyEvent.META_CTRL_ON != 0
    event.shiftKey = meta and KeyEvent.META_SHIFT_ON != 0
    event.altKey = meta and KeyEvent.META_ALT_ON != 0
    event.metaKey = meta and KeyEvent.META_META_ON != 0
    if (!pointer.clientX.isNaN()) {
      event.movementX = x - pointer.clientX
      event.movementY = y - pointer.clientY
    }
    pointer.buttons = event.buttons
    pointer.clientX = x
    pointer.clientY = y
    return event
  }

  private fun copy(type: String, from: PointerEvent, related: Node?): PointerEvent =
    PointerEvent(type, options(type)).apply {
      copyPointer(from)
      relatedTarget = related?.view as? EventTarget
    }

  private fun offsetFor(event: PointerEvent, target: Node) {
    var node: Node? = target
    var view: View? = null
    while (node != null) {
      view = node.view as? View
      if (view?.isAttachedToWindow == true) break
      view = null
      node = node.parent
    }
    if (view == null) return
    view.getLocationInWindow(loc)
    val scale = target.mason.scale
    event.offsetX = event.clientX - loc[0] / scale
    event.offsetY = event.clientY - loc[1] / scale
  }

  /** Dispatches at the pointer's target: its capture target or what's under it. */
  private fun send(type: String, pointer: Pointer, event: PointerEvent) {
    fire(type, pointer.capture ?: pointer.target, event)
  }

  private fun fire(type: String, target: Node?, event: PointerEvent) {
    target ?: return
    val eventTarget = target.view as? EventTarget ?: return
    offsetFor(event, target)
    event.target = eventTarget
    target.mason.dispatch(event)
  }

  private fun fireAt(type: String, node: Node, from: PointerEvent, related: Node?) {
    if (!node.mason.hasListener(node, type)) return
    val eventTarget = node.view as? EventTarget ?: return
    val event = copy(type, from, related)
    offsetFor(event, node)
    event.target = eventTarget
    node.mason.dispatchAtTarget(event)
  }

  private fun chain(node: Node?): List<Node> {
    val out = ArrayList<Node>()
    var current = node
    while (current != null) {
      out.add(current)
      current = current.parent
    }
    return out
  }

  /** Moves the pointer to [target], with pointerout/leave on the old one and pointerover/enter on the new one. */
  private fun retarget(pointer: Pointer, target: Node?, from: PointerEvent) {
    val old = pointer.target
    if (old === target) return
    pointer.target = target
    val oldChain = chain(old)
    val newChain = chain(target)
    if (old != null) {
      fire("pointerout", old, copy("pointerout", from, target))
      for (node in oldChain) {
        if (newChain.any { it === node }) break
        fireAt("pointerleave", node, from, target)
      }
    }
    if (target != null) {
      fire("pointerover", target, copy("pointerover", from, old))
      for (node in newChain.asReversed()) {
        if (oldChain.any { it === node }) continue
        fireAt("pointerenter", node, from, old)
      }
    }
  }

  private fun processPendingCapture(pointer: Pointer, from: PointerEvent) {
    if (!pointer.hasPendingCapture) return
    pointer.hasPendingCapture = false
    val next = pointer.pendingCapture
    val previous = pointer.capture
    if (next === previous) return
    pointer.capture = next
    previous?.let { fire("lostpointercapture", it, copy("lostpointercapture", from, null)) }
    next?.let {
      fire("gotpointercapture", it, copy("gotpointercapture", from, null))
      retarget(pointer, it, from)
    }
  }

  private fun release(pointer: Pointer, from: PointerEvent) {
    pointer.pendingCapture = null
    pointer.hasPendingCapture = false
    val previous = pointer.capture ?: return
    pointer.capture = null
    fire("lostpointercapture", previous, copy("lostpointercapture", from, null))
  }
}
