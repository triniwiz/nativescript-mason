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
import android.view.View
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition

enum class BackgroundClip {
  BORDER_BOX,
  PADDING_BOX,
  CONTENT_BOX
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

data class Background(
  var color: Int? = null,
  var layers: MutableList<BackgroundLayer> = mutableListOf()
)

enum class BackgroundRepeat(val value: String) {
  REPEAT("repeat"),
  REPEAT_X("repeat-x"),
  REPEAT_Y("repeat-y"),
  NO_REPEAT("no-repeat")
}

data class Gradient(
  val type: String,             // linear or radial
  val direction: String?,       // e.g., "to bottom"
  val stops: List<String>,      // color stops
)

private val gradientPaint = Paint(Paint.ANTI_ALIAS_FLAG)

fun drawBackground(
  context: Context,
  view: View?,
  layer: BackgroundLayer,
  canvas: Canvas,
  width: Int,
  height: Int
) {
  layer.gradient?.let { drawGradient(layer, canvas, width, height) }

  layer.image?.let { imageUrl ->
    // Use cached bitmap if available
    layer.bitmap?.let { bitmap ->
      drawBitmapLayer(bitmap, layer, canvas, width, height)
      return
    }

    // Load bitmap asynchronously
    Glide.with(context)
      .asBitmap()
      .load(imageUrl)
      .into(object : CustomTarget<Bitmap>() {
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
    val colors = gradient.stops.map { parseColor(it) ?: Color.TRANSPARENT }.toIntArray()
    layer.shader = when (gradient.type.lowercase()) {
      "linear" -> {
        val (x0, y0, x1, y1) = when (gradient.direction?.lowercase()) {
          "to bottom" -> listOf(0f, 0f, 0f, height.toFloat())
          "to top" -> listOf(0f, height.toFloat(), 0f, 0f)
          "to right" -> listOf(0f, 0f, width.toFloat(), 0f)
          "to left" -> listOf(width.toFloat(), 0f, 0f, 0f)
          else -> listOf(0f, 0f, 0f, height.toFloat())
        }
        LinearGradient(x0, y0, x1, y1, colors, null, Shader.TileMode.CLAMP)
      }

      "radial" -> {
        RadialGradient(
          width / 2f,
          height / 2f,
          maxOf(width, height) / 2f,
          colors,
          null,
          Shader.TileMode.CLAMP
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
  bitmap: Bitmap,
  layer: BackgroundLayer,
  canvas: Canvas,
  width: Int,
  height: Int
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
  val s = hex.removePrefix("#")
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

fun parseColor(value: String): Int? {
  return try {
    if (COLOR_MAP.contains(value)) {
      return COLOR_MAP[value]
    }
    parseHexColor(value)
  } catch (_: Exception) {
    null
  }
}

private val IMAGE_REGEX = Regex("""url\(["']?(.*?)["']?\)""")
fun parseImage(value: String): String? = IMAGE_REGEX.find(value)?.groups?.get(1)?.value

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

private val GRADIENT_REGEX = Regex("""(linear|radial)-gradient\((.*?)\)\s*;?""")
private val GRADIENT_DIRECTION_REGEX = Regex("""to .*""")

fun parseGradient(part: String): Gradient? {
  val match = GRADIENT_REGEX.find(part) ?: return null
  val type = match.groupValues[1]
  val content = match.groupValues[2]
  val items = content.split(",").map { it.trim() }
  val direction = if (items.first().matches(GRADIENT_DIRECTION_REGEX)) items.first() else null
  val stops = if (direction != null) items.drop(1) else items
  return Gradient(type, direction, stops)
}

private val REPEAT_KEYS = listOf("repeat", "repeat-x", "repeat-y", "no-repeat")
private val PARSE_LAYER_REGEX = Regex("""\s+""")
private val POSITION_KEYS = listOf("top", "bottom", "left", "right", "center")
private val COLOR_KEYWORDS = listOf("red", "blue", "green", "black", "white", "yellow", "gray")
private val COLOR_MAP = mapOf(
  "crimson" to 0xFFDC143C.toInt(),
  "skyblue" to 0xFF87CEEB.toInt()
)
private val CLIP_REGEX = Regex("""^(content-box|border-box|padding-box)\s+""")
// private val CLIP_REGEX = Regex("""\b(content-box|padding-box|border-box)\b""")
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
    value = value.replace(Regex("""url\(['"].*?['"]\)"""), "").trim()
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

fun parseBackground(css: String): Background? {
  val bg = Background()

//  val layers = splitLayers(css).mapNotNull { layerStr ->
//    val trimmed = layerStr.trim()
//    if (trimmed.isEmpty()) return@mapNotNull null
//
//    val layer = parseLayer(trimmed)
//
//    if (layer.image != null || layer.gradient != null || layer.size != null || layer.position != null) {
//      layer
//    } else null
//  }

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
