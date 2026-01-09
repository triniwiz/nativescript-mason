package org.nativescript.mason.masonkit.events

class InputEvent(
  type: String,
  val data: String? = null,
  val inputType: String? = null,
  options: EventOptions? = null
) : Event(type, options) {

  @JvmOverloads
  constructor(
    type: String,
    data: Boolean,
    inputType: String? = null,
    options: EventOptions? = null
  ) : this(
    type,
    "$data",
    inputType,
    options
  )

  @JvmOverloads
  constructor(
    type: String,
    data: Int,
    inputType: String? = null,
    options: EventOptions? = null
  ) : this(
    type,
    "$data",
    inputType,
    options
  )


  @JvmOverloads
  constructor(
    type: String,
    data: Double,
    inputType: String? = null,
    options: EventOptions? = null
  ) : this(
    type,
    "$data",
    inputType,
    options
  )
}
