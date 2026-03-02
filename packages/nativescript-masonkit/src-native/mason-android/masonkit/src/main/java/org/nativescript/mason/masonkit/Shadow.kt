package org.nativescript.mason.masonkit

import android.graphics.Color

private val SPLIT_REGEX = Regex("\\s+")

class Shadow {
  data class TextShadow(
    val offsetX: Float,
    val offsetY: Float,
    val blurRadius: Float,
    val color: Int
  )

  data class BoxShadow(
    val offsetX: Float,
    val offsetY: Float,
    val blurRadius: Float,
    val spreadRadius: Float,
    val color: Int,
    val inset: Boolean
  )

  companion object {
    fun parseTextShadow(style: Style, value: String): List<TextShadow> {
      return value.split(",").mapNotNull { shadow ->
        try {
          val tokens = shadow.trim().split(SPLIT_REGEX)

          var offsetX: Float? = null
          var offsetY: Float? = null
          var blur = 0f
          var color: Int? = null

          for (token in tokens) {
            // Try length first
            val length = parseLength(style, token)
            if (length != null) {
              when {
                offsetX == null -> offsetX = length
                offsetY == null -> offsetY = length
                else -> blur = length.coerceAtLeast(0f) // blur must be ≥ 0
              }
              continue
            }

            // Try color
            val parsedColor = parseColor(token)
            if (parsedColor != null) {
              color = parsedColor
            }
          }

          // Must have at least two lengths
          if (offsetX == null || offsetY == null) return@mapNotNull null

          TextShadow(
            offsetX = offsetX,
            offsetY = offsetY,
            blurRadius = blur,
            color = color ?: Color.BLACK
          )
        } catch (_: Exception) {
          null
        }
      }
    }

    /**
     * Parse CSS box-shadow value.
     * Syntax: [inset] <offset-x> <offset-y> [blur-radius] [spread-radius] <color>
     * Multiple shadows separated by commas are supported.
     */
    fun parseBoxShadow(style: Style, value: String): List<BoxShadow> {
      return value.split(",").mapNotNull { shadow ->
        try {
          val tokens = shadow.trim().split(SPLIT_REGEX)
          
          var inset = false
          var offsetX: Float? = null
          var offsetY: Float? = null
          var blur = 0f
          var spread = 0f
          var color: Int? = null
          val lengths = mutableListOf<Float>()

          for (token in tokens) {
            // Check for inset keyword
            if (token.equals("inset", ignoreCase = true)) {
              inset = true
              continue
            }

            // Try length first
            val length = parseLength(style, token)
            if (length != null) {
              lengths.add(length)
              continue
            }

            // Try color
            val parsedColor = parseColor(token)
            if (parsedColor != null) {
              color = parsedColor
            }
          }

          // Must have at least two lengths (offset-x and offset-y)
          if (lengths.size < 2) return@mapNotNull null

          offsetX = lengths[0]
          offsetY = lengths[1]
          if (lengths.size >= 3) blur = lengths[2].coerceAtLeast(0f)
          if (lengths.size >= 4) spread = lengths[3]

          BoxShadow(
            offsetX = offsetX,
            offsetY = offsetY,
            blurRadius = blur,
            spreadRadius = spread,
            color = color ?: Color.BLACK,
            inset = inset
          )
        } catch (_: Exception) {
          null
        }
      }
    }
  }
}
