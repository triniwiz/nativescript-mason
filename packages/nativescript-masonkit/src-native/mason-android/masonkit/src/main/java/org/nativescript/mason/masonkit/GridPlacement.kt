package org.nativescript.mason.masonkit

sealed class GridPlacement {
  data object Auto : GridPlacement()
  data class Line(var value: Short) : GridPlacement()
  data class Span(var value: Short) : GridPlacement()
  data class NamedLine(var name: String, var line: Short = -1) : GridPlacement()
  data class NamedSpan(var name: String, var span: Short = -1) : GridPlacement()


  val jsonValue: String
    get() {
      return Mason.gson.toJson(this)
    }

  val cssValue: String
    get() {
      return when (this) {
        Auto -> "auto"
        is Line -> value.toString()
        is Span -> "span $value"

        is NamedLine -> {
          // "name" or "name line-number"
          if (line >= 0) "$name $line" else name
        }

        is NamedSpan -> {
          // "span name" or "span name span-count"
          if (span >= 0) "span $name $span" else "span $name"
        }
      }
    }
}
