package org.nativescript.mason.masonkit.events


open class Event(val type: String, options: EventOptions? = null) {

  val bubbles: Boolean = options?.bubbles ?: false
  val cancelable: Boolean = options?.cancelable ?: false
  val composed: Boolean = options?.composed ?: false
  val timeStamp: Double = (System.currentTimeMillis() * 1000).toDouble()

  var defaultPrevented = false
    internal set

  var propagationStopped = false
    internal set

  var target: Any? = null
    internal set

  var currentTarget: Any? = null
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
}
