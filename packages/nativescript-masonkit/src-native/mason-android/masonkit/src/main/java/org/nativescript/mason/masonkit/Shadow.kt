package org.nativescript.mason.masonkit

import android.graphics.Color

private val SPLIT_REGEX = Regex("\\s+")

/**
 * Tokenise a CSS shadow value, keeping parenthesised groups (e.g.
 * `rgba(26, 26, 46, 0.4)`) as single tokens even when they contain
 * spaces after commas.
 */
private fun tokenizeShadow(value: String): List<String> {
  val tokens = mutableListOf<String>()
  val sb = StringBuilder()
  var depth = 0
  for (ch in value) {
    when {
      ch == '(' -> { depth++; sb.append(ch) }
      ch == ')' -> { depth--; sb.append(ch) }
      ch.isWhitespace() && depth == 0 -> {
        if (sb.isNotEmpty()) { tokens.add(sb.toString()); sb.clear() }
      }
      else -> sb.append(ch)
    }
  }
  if (sb.isNotEmpty()) tokens.add(sb.toString())
  return tokens
}

/**
 * Split multiple comma-separated shadow values while respecting
 * parenthesised groups like `rgba(0, 0, 0, 0.5)`.
 */
private fun splitShadowLayers(value: String): List<String> {
  val layers = mutableListOf<String>()
  val sb = StringBuilder()
  var depth = 0
  for (ch in value) {
    when {
      ch == '(' -> { depth++; sb.append(ch) }
      ch == ')' -> { depth--; sb.append(ch) }
      ch == ',' && depth == 0 -> {
        layers.add(sb.toString()); sb.clear()
      }
      else -> sb.append(ch)
    }
  }
  if (sb.isNotEmpty()) layers.add(sb.toString())
  return layers
}

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
      return splitShadowLayers(value).mapNotNull { shadow ->
        try {
          val tokens = tokenizeShadow(shadow.trim())

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
      return splitShadowLayers(value).mapNotNull { shadow ->
        try {
          val tokens = tokenizeShadow(shadow.trim())
          
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
