package org.nativescript.mason.masonkit.events

import org.nativescript.mason.masonkit.Input

class MasonInputEvent(
  type: String,
  val data: String? = null,
  inputType: Input.Type,
  options: EventOptions? = null
) : Event(type, options) {
}
