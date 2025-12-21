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

  }
}
