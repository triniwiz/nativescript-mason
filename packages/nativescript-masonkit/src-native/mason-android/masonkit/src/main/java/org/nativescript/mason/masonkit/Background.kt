package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.Drawable
import android.util.Log
import android.view.View
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition


private val IMAGE_REGEX = Regex("""url\(["']?(.*?)["']?\)""")
private val IMAGE_REPLACE_REGEX = Regex("""url\(['"].*?['"]\)""")
private val GRADIENT_REGEX = Regex("""(linear|radial)-gradient\(([\s\S]*)\)\s*;?""")
private val GRADIENT_DIRECTION_REGEX = Regex("""to .*""")
private val REPEAT_KEYS = listOf("repeat", "repeat-x", "repeat-y", "no-repeat")
private val PARSE_LAYER_REGEX = Regex("""\s+""")
private val POSITION_KEYS = listOf("top", "bottom", "left", "right", "center")
private val COLOR_KEYWORDS = listOf("red", "blue", "green", "black", "white", "yellow", "gray")
private val CLIP_REGEX = Regex("""^(content-box|border-box|padding-box)\s+""")
private val COLOR_REGEX = Regex("(?i)^#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})")
private val RGBA_REGEX =
  Regex(
    """rgba?\(\s*([^)]+)\s*\)""",
    RegexOption.IGNORE_CASE
  )
private val ANGLE_REGEX =
  Regex("""^-?\d+(\.\d+)?(deg|rad|turn|grad)$""")

enum class BackgroundClip {
  BORDER_BOX, PADDING_BOX, CONTENT_BOX
}

data class BackgroundLayer(
  var image: String? = null,             // URL or asset path
  var repeat: BackgroundRepeat = BackgroundRepeat.NO_REPEAT,
  var position: Pair<Float, Float>? = null,  // 0..1 fraction
  var size: Pair<Float, Float>? = null,        // 0..1 fraction or special (cover/contain)
  var gradient: Gradient? = null,
  var shader: Shader? = null,
  var bitmap: Bitmap? = null,                  // cached image
  var clip: BackgroundClip = BackgroundClip.BORDER_BOX
)

class Background(
  val style: Style
) {
  var color: Int?
    set(value) {
      if (value == null) {
        style.textValues.put(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.INHERIT)
        style.textValues.putInt(TextStyleKeys.BACKGROUND_COLOR, 0)
        return
      }

      style.textValues.put(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
      style.textValues.putInt(TextStyleKeys.BACKGROUND_COLOR, value)
    }
    get() {
      if (style.textValues.get(TextStyleKeys.BACKGROUND_COLOR_STATE) == StyleState.INHERIT) {
        return null
      }
      return style.textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
    }

  var layers: MutableList<BackgroundLayer> = mutableListOf()


  fun clear() {
    layers = mutableListOf()
    color = null
  }
}

enum class BackgroundRepeat(val value: String) {
  REPEAT("repeat"), REPEAT_X("repeat-x"), REPEAT_Y("repeat-y"), NO_REPEAT("no-repeat")
}

data class Gradient(
  val type: String,             // linear or radial
  val direction: String?,       // e.g., "to bottom"
  val stops: List<String>,      // color stops
)

private val gradientPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
  isDither = true
}

fun drawBackground(
  context: Context, view: View?, layer: BackgroundLayer, canvas: Canvas, width: Int, height: Int
) {
  layer.gradient?.let { drawGradient(layer, canvas, width, height) }

  layer.image?.let { imageUrl ->
    // Use cached bitmap if available
    layer.bitmap?.let { bitmap ->
      drawBitmapLayer(bitmap, layer, canvas, width, height)
      return
    }

    // Load bitmap asynchronously
    Glide.with(context).asBitmap().load(imageUrl).into(object : CustomTarget<Bitmap>() {
      override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
        layer.bitmap = resource
        // Draw once loaded
        // drawBitmapLayer(resource, layer, canvas, width, height)
        view?.invalidate()
      }

      override fun onLoadCleared(placeholder: Drawable?) {}
    })
  }
}

fun drawGradient(layer: BackgroundLayer, canvas: Canvas, width: Int, height: Int) {
  val gradient = layer.gradient ?: return

  if (layer.shader == null) {
    // Parse color stops: each stop can be "color position" or just "color"
    val colors = mutableListOf<Int>()
    val positions = mutableListOf<Float>()

    for ((index, stop) in gradient.stops.withIndex()) {
      val trimmed = stop.trim()
      // Find the last space that separates color from position
      val lastSpace = trimmed.lastIndexOf(' ')

      if (lastSpace > 0) {
        val colorPart = trimmed.substring(0, lastSpace)
        val posPart = trimmed.substring(lastSpace + 1).trim()

        val color = parseColor(colorPart) ?: Color.TRANSPARENT
        colors.add(color)

        // Parse position: can be "0", "50%", "100%", etc.
        val posValue = posPart.trimEnd('%')
        val pos = posValue.toFloatOrNull()
        if (pos != null) {
          // Normalize to 0.0-1.0 range
          // If it ends with %, divide by 100; if no %, treat small values (0-1) as-is, larger as percentage
          val normalizedPos = when {
            posPart.endsWith('%') -> pos / 100f
            pos <= 1f -> pos  // Already in 0-1 range
            else -> pos / 100f  // Treat as percentage (0-100)
          }
          positions.add(normalizedPos.coerceIn(0f, 1f))
        } else {
          // Fallback: distribute evenly
          positions.add(index.toFloat() / (gradient.stops.size - 1).coerceAtLeast(1))
        }
      } else {
        // No position specified, just color
        val color = parseColor(trimmed) ?: Color.TRANSPARENT
        colors.add(color)
        // Distribute evenly
        positions.add(index.toFloat() / (gradient.stops.size - 1).coerceAtLeast(1))
      }
    }

    val colorsArray = colors.toIntArray()
    val positionsArray = if (positions.isNotEmpty()) positions.toFloatArray() else null

    // Ensure we have valid colors and positions
    if (colorsArray.isEmpty()) return

    layer.shader = when (gradient.type.lowercase()) {
      "linear" -> {
        val (x0, y0, x1, y1) = when (gradient.direction?.lowercase()) {
          "to bottom", "180deg" -> listOf(0f, 0f, 0f, height.toFloat())
          "to top", "0deg" -> listOf(0f, height.toFloat(), 0f, 0f)
          "to right", "90deg" -> listOf(0f, 0f, width.toFloat(), 0f)
          "to left", "270deg" -> listOf(width.toFloat(), 0f, 0f, 0f)
          else -> listOf(0f, 0f, 0f, height.toFloat())
        }
        LinearGradient(x0, y0, x1, y1, colorsArray, positionsArray, Shader.TileMode.CLAMP)
      }

      "radial" -> {
        RadialGradient(
          width / 2f, height / 2f, maxOf(width, height) / 2f, colorsArray, positionsArray, Shader.TileMode.CLAMP
        )
      }

      else -> null
    }
  }

  gradientPaint.shader = layer.shader
  canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), gradientPaint)
  gradientPaint.shader = null
}

private fun drawBitmapLayer(
  bitmap: Bitmap, layer: BackgroundLayer, canvas: Canvas, width: Int, height: Int
) {
  val paint = Paint(Paint.ANTI_ALIAS_FLAG)

  // Determine the scaled size
  val (drawWidth, drawHeight) = when (layer.size) {
    null -> bitmap.width to bitmap.height
    else -> {
      val w = if (layer.size!!.first < 0) bitmap.width else layer.size!!.first * width
      val h = if (layer.size!!.second < 0) bitmap.height else layer.size!!.second * height
      w.toInt() to h.toInt()
    }
  }

  // Determine position
  val x = ((layer.position?.first ?: 0.5f) * (width - drawWidth))
  val y = ((layer.position?.second ?: 0.5f) * (height - drawHeight))

  when (layer.repeat) {
    BackgroundRepeat.NO_REPEAT -> {
      val dst = RectF(x, y, x + drawWidth, y + drawHeight)
      canvas.drawBitmap(bitmap, null, dst, paint)
    }

    BackgroundRepeat.REPEAT_X -> {
      var px = x
      while (px < width) {
        val dst = RectF(px, y, px + drawWidth, y + drawHeight)
        canvas.drawBitmap(bitmap, null, dst, paint)
        px += drawWidth
      }
    }

    BackgroundRepeat.REPEAT_Y -> {
      var py = y
      while (py < height) {
        val dst = RectF(x, py, x + drawWidth, py + drawHeight)
        canvas.drawBitmap(bitmap, null, dst, paint)
        py += drawHeight
      }
    }

    BackgroundRepeat.REPEAT -> {
      var py = y
      while (py < height) {
        var px = x
        while (px < width) {
          val dst = RectF(px, py, px + drawWidth, py + drawHeight)
          canvas.drawBitmap(bitmap, null, dst, paint)
          px += drawWidth
        }
        py += drawHeight
      }
    }
  }
}

fun parseHexColor(hex: String): Int? {
  // extract a leading hex token like "#FFF", "#FFFF", "#RRGGBB" or "#RRGGBBAA"
  val match = COLOR_REGEX.find(hex.trim())
  val token = match?.value ?: return null
  val s = token.removePrefix("#")
  val len = s.length

  fun hexCharToInt(c: Char): Int = when (c) {
    in '0'..'9' -> c - '0'
    in 'a'..'f' -> c - 'a' + 10
    in 'A'..'F' -> c - 'A' + 10
    else -> -1
  }

  fun twoChar(c1: Char, c2: Char): Int {
    val hi = hexCharToInt(c1)
    val lo = hexCharToInt(c2)
    if (hi == -1 || lo == -1) return -1
    return (hi shl 4) or lo
  }

  return when (len) {
    3 -> { // RGB, alpha=255
      val r = hexCharToInt(s[0])
      val g = hexCharToInt(s[1])
      val b = hexCharToInt(s[2])
      if (r == -1 || g == -1 || b == -1) return null
      (255 shl 24) or ((r shl 4 or r) shl 16) or ((g shl 4 or g) shl 8) or (b shl 4 or b)
    }

    4 -> { // RGBA
      val r = hexCharToInt(s[0])
      val g = hexCharToInt(s[1])
      val b = hexCharToInt(s[2])
      val a = hexCharToInt(s[3])
      if (r == -1 || g == -1 || b == -1 || a == -1) return null
      ((a shl 4 or a) shl 24) or ((r shl 4 or r) shl 16) or ((g shl 4 or g) shl 8) or (b shl 4 or b)
    }

    6 -> { // RRGGBB, alpha=255
      val r = twoChar(s[0], s[1])
      val g = twoChar(s[2], s[3])
      val b = twoChar(s[4], s[5])
      if (r == -1 || g == -1 || b == -1) return null
      (255 shl 24) or (r shl 16) or (g shl 8) or b
    }

    8 -> { // RRGGBBAA
      val r = twoChar(s[0], s[1])
      val g = twoChar(s[2], s[3])
      val b = twoChar(s[4], s[5])
      val a = twoChar(s[6], s[7])
      if (r == -1 || g == -1 || b == -1 || a == -1) return null
      (a shl 24) or (r shl 16) or (g shl 8) or b
    }

    else -> null
  }
}

private fun parseColorChannel(token: String): Int? {
  val t = token.trim()

  return when {
    t.endsWith("%") -> {
      val v = t.dropLast(1).toFloatOrNull() ?: return null
      ((v.coerceIn(0f, 100f) / 100f) * 255f).toInt()
    }

    else -> {
      val v = t.toFloatOrNull() ?: return null
      v.coerceIn(0f, 255f).toInt()
    }
  }
}

private fun parseAlpha(token: String?): Int {
  if (token == null) return 255

  val t = token.trim()

  val alpha = when {
    t.endsWith("%") -> {
      val v = t.dropLast(1).toFloatOrNull() ?: return 255
      v.coerceIn(0f, 100f) / 100f
    }

    else -> {
      val v = t.toFloatOrNull() ?: return 255
      v.coerceIn(0f, 1f)
    }
  }

  return (alpha * 255f).toInt()
}

fun parseRgbColor(input: String): Int? {
  val match = RGBA_REGEX.find(input.trim()) ?: return null
  val body = match.groupValues[1]

  val (rgbPart, alphaPart) =
    if (body.contains('/')) {
      val parts = body.split('/', limit = 2)
      parts[0] to parts[1]
    } else {
      body to null
    }

  val components = rgbPart
    .trim()
    .split(Regex("""[\s,]+"""))
    .filter { it.isNotEmpty() }

  if (components.size != 3) return null

  val r = parseColorChannel(components[0]) ?: return null
  val g = parseColorChannel(components[1]) ?: return null
  val b = parseColorChannel(components[2]) ?: return null
  val a = parseAlpha(alphaPart)

  return (a shl 24) or (r shl 16) or (g shl 8) or b
}

fun parseColor(value: String): Int? {
  return try {
    val color = value.trim().trimEnd(';')
    if (COLOR_MAP.contains(color)) {
      return COLOR_MAP[color]
    }
    parseHexColor(color) ?: parseRgbColor(color)
  } catch (_: Exception) {
    null
  }
}

fun parseRepeat(value: String): BackgroundRepeat = when (value.lowercase()) {
  "repeat" -> BackgroundRepeat.REPEAT
  "repeat-x" -> BackgroundRepeat.REPEAT_X
  "repeat-y" -> BackgroundRepeat.REPEAT_Y
  else -> BackgroundRepeat.NO_REPEAT
}

fun parsePosition(parts: List<String>): Pair<Float, Float> {
  var x = 0.5f
  var y = 0.5f
  parts.forEach { part ->
    if (part.endsWith("%")) {
      val value = part.dropLast(1).toFloatOrNull()?.div(100f) ?: 0.5f
      if (x == 0.5f) x = value else y = value
    } else {
      when (part.lowercase()) {
        "center" -> {}
        "top" -> y = 0f
        "bottom" -> y = 1f
        "left" -> x = 0f
        "right" -> x = 1f
      }
    }
  }
  return x to y
}

fun splitTopLevelCommas(input: String): List<String> {
  val result = mutableListOf<String>()
  val current = StringBuilder()
  var depth = 0

  for (c in input) {
    when (c) {
      '(' -> {
        depth++
        current.append(c)
      }

      ')' -> {
        depth--
        current.append(c)
      }

      ',' -> {
        if (depth == 0) {
          result += current.toString()
          current.setLength(0)
        } else {
          current.append(c)
        }
      }

      else -> current.append(c)
    }
  }

  if (current.isNotEmpty()) {
    result += current.toString()
  }

  return result
}

private fun isAngleOrDirection(token: String): Boolean {
  val v = token.trim().lowercase()

  if (ANGLE_REGEX.matches(v)) return true

  if (v.startsWith("to ")) {
    val parts = v.removePrefix("to ").split(Regex("\\s+"))
    return parts.all {
      it == "top" || it == "bottom" || it == "left" || it == "right"
    }
  }

  // Handle radial gradient shape/position: e.g., "ellipse at center", "circle at top left"
  if (v.contains(" at ")) {
    val beforeAt = v.substringBefore(" at ").trim()
    // Check if it starts with a shape keyword or size keyword
    val shapeKeywords = listOf("circle", "ellipse")
    val sizeKeywords = listOf("closest-side", "closest-corner", "farthest-side", "farthest-corner")
    val parts = beforeAt.split(Regex("\\s+"))
    if (parts.any { it in shapeKeywords || it in sizeKeywords } || beforeAt.isEmpty()) {
      return true
    }
  }

  // Handle standalone shape keywords: "circle", "ellipse"
  if (v == "circle" || v == "ellipse") {
    return true
  }

  return false
}

fun parseGradient(part: String): Gradient? {
  val match = GRADIENT_REGEX.find(part) ?: return null
  val type = match.groupValues[1]
  val content = match.groupValues[2].trim()

  // split on top-level commas so color functions (eg rgba()) are kept intact
  val items = splitTopLevelCommas(content).filter { it.isNotEmpty() }

  if (items.isEmpty()) return null

  val first = items.first()
  val direction = if (isAngleOrDirection(first)) first.trim() else null
  val stops = if (direction != null) items.drop(1) else items

  return Gradient(type, direction, stops.map { it.trim() })
}

fun parseBackgroundLayers(css: String): List<BackgroundLayer> {
  val layers = mutableListOf<BackgroundLayer>()
  var depth = 0
  var start = 0

  // Split top-level commas only (ignore commas inside parentheses)
  css.forEachIndexed { i, c ->
    when (c) {
      '(' -> depth++
      ')' -> depth--
      ',' -> if (depth == 0) {
        layers.add(parseLayer(css.substring(start, i)))
        start = i + 1
      }
    }
  }
  layers.add(parseLayer(css.substring(start)))

  return layers
}

fun parseLayer(layerValue: String): BackgroundLayer {
  val layer = BackgroundLayer()
  var value = layerValue.trim()

  // 1. EXTRACT background-clip keyword
  val clipMatch = CLIP_REGEX.find(value)
  if (clipMatch != null) {
    val clipValue = clipMatch.groupValues[1].lowercase()
    layer.clip = when (clipValue) {
      "content-box" -> BackgroundClip.CONTENT_BOX
      "padding-box" -> BackgroundClip.PADDING_BOX
      else -> BackgroundClip.BORDER_BOX
    }
    value = value.replace(CLIP_REGEX, "").trim()
  }

  // 2. Extract image URL (remove it from value)
  IMAGE_REGEX.find(value)?.groups?.get(1)?.value?.let {
    layer.image = it
    value = value.replace(IMAGE_REPLACE_REGEX, "").trim()
  }

  // 3. Gradient
  if (value.startsWith("linear-gradient") || value.startsWith("radial-gradient")) {
    layer.gradient = parseGradient(value)
  }

  // 4. Repeat
  REPEAT_KEYS.forEach { key ->
    if (value.contains(key, ignoreCase = true)) {
      layer.repeat = parseRepeat(key)
    }
  }

  // 5. Position
  val posTokens = value.split(PARSE_LAYER_REGEX)
    .filter { it.endsWith("%") || POSITION_KEYS.contains(it.lowercase()) }

  if (posTokens.isNotEmpty()) {
    layer.position = parsePosition(posTokens)
  }

  return layer
}

fun splitLayers(css: String): List<String> {
  val layers = mutableListOf<String>()
  var depth = 0
  var start = 0
  css.forEachIndexed { i, c ->
    when (c) {
      '(' -> depth++
      ')' -> depth--
      ',' -> if (depth == 0) {
        layers.add(css.substring(start, i))
        start = i + 1
      }
    }
  }
  layers.add(css.substring(start))
  return layers
}

fun parseBackground(style: Style, css: String): Background? {
  val bg = Background(style)

  val layers = parseBackgroundLayers(css)

  val firstWord = css.trim().split(' ', limit = 2)[0]
  if (firstWord.startsWith("#")) {
    bg.color = parseColor(firstWord)
  } else {
    val value = firstWord.lowercase()
    if (value in COLOR_KEYWORDS) {
      bg.color = parseColor(firstWord)
    } else if (COLOR_MAP.contains(value)) {
      bg.color = COLOR_MAP[value]
    }
  }

  bg.layers.addAll(layers)

  if (bg.color == null && bg.layers.isEmpty()) return null

  return bg
}
