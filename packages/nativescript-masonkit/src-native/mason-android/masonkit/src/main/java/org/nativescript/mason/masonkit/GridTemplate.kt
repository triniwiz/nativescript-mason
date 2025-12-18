package org.nativescript.mason.masonkit

sealed class GridTemplate(val isRepeating: Boolean = false) {

  data class Single(val value: MinMax, val lineNames: Array<String> = emptyArray()) :
    GridTemplate() {
    override val cssValue: String
      get() {
        val builder = StringBuilder()
        if (lineNames.isNotEmpty()) {
          builder.append("[${lineNames.joinToString(" ")}] ")
        }
        builder.append(value.cssValue)
        return builder.toString()
      }

    override fun equals(other: Any?): Boolean {
      if (this === other) return true
      if (javaClass != other?.javaClass) return false

      other as Single

      if (value != other.value) return false
      if (!lineNames.contentEquals(other.lineNames)) return false
      if (cssValue != other.cssValue) return false

      return true
    }

    override fun hashCode(): Int {
      var result = value.hashCode()
      result = 31 * result + lineNames.contentHashCode()
      result = 31 * result + cssValue.hashCode()
      return result
    }
  }

  data class AutoRepeat(
    val gridTrackRepetition: GridTrackRepetition,
    val value: Array<MinMax>,
    val lineNames: Array<Array<String>>
  ) : GridTemplate(true) {

    fun gridTrackRepetitionNativeType(): Int = gridTrackRepetition.toInt()
    fun gridTrackRepetitionNativeValue(): Short = gridTrackRepetition.value

    override fun equals(other: Any?): Boolean {
      if (this === other) return true
      if (javaClass != other?.javaClass) return false

      other as AutoRepeat
      return gridTrackRepetition == other.gridTrackRepetition &&
        value.contentEquals(other.value) &&
        lineNames.contentDeepEquals(other.lineNames)
    }

    override fun hashCode(): Int {
      var result = gridTrackRepetition.hashCode()
      result = 31 * result + value.contentHashCode()
      result = 31 * result + lineNames.contentDeepHashCode()
      return result
    }

    override val cssValue: String
      get() {
        val builder = StringBuilder()
        builder.append("repeat(${gridTrackRepetition.cssValue}, ")

        for (i in value.indices) {
          // before each track
          if (i < lineNames.size && lineNames[i].isNotEmpty()) {
            builder.append("[${lineNames[i].joinToString(" ")}] ")
          }
          builder.append(value[i].cssValue).append(" ")
        }

        // trailing line names after last track
        if (lineNames.size > value.size) {
          val trailing = lineNames.last()
          if (trailing.isNotEmpty()) {
            builder.append("[${trailing.joinToString(" ")}] ")
          }
        }

        builder.append(")")
        return builder.toString().trim()
      }
  }

  open val cssValue: String
    get() = when (this) {
      is AutoRepeat -> this.cssValue
      is Single -> this.cssValue
    }
}

val Array<GridTemplate>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Array<GridTemplate>.cssValue: String
  get() {
    if (isEmpty()) {
      return ""
    }
    val builder = StringBuilder()
    val last = this.lastIndex
    this.forEachIndexed { index, minMax ->
      if (index == last) {
        builder.append(minMax.cssValue)
      } else {
        builder.append("${minMax.cssValue} ")
      }
    }
    return builder.toString()
  }
