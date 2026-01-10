package org.nativescript.mason.masonkit.events

import android.net.Uri

class FileInputEvent(
  type: String,
  val data: String? = null,
  val inputType: String? = null,
  options: EventOptions? = null,
  val rawData: List<Uri>
) : Event(type, options) {
  @JvmOverloads
  constructor(
    type: String,
    data: List<String>,
    inputType: String? = null,
    options: EventOptions? = null,
    rawData: List<Uri>
  ) : this(
    type,
    "$data",
    inputType,
    options,
    rawData
  )
}
