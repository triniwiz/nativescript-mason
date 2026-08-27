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
import kotlin.math.hypot


// Reusable objects to avoid per-frame allocations in draw paths
private val gradientPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { isDither = true }
private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG)
private val bitmapDstRect = RectF()

private val IMAGE_REGEX = Regex("""url\(["']?(.*?)["']?\)""")
private val IMAGE_REPLACE_REGEX = Regex("""url\(['"].*?['"]\)""")
private val GRADIENT_REGEX = Regex("""(linear|radial)-gradient\(([\s\S]*)\)\s*;?""")
private val GRADIENT_DIRECTION_REGEX = Regex("""to .*""")
private val REPEAT_KEYS = listOf("repeat", "repeat-x", "repeat-y", "no-repeat")
private val WHITESPACE_REGEX = Regex("""\s+""")
private val COMMA_WHITESPACE_REGEX = Regex("""[\s,]+""")
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

/**
 * CSS pseudo-state specificity order.
 * Later entries override earlier ones when multiple states are active.
 * Matches CSS spec: :active overrides :focus overrides :hover.
 */
internal val PSEUDO_CSS_ORDER = arrayOf(
  PseudoState.HOVER, PseudoState.FOCUS, PseudoState.ACTIVE, PseudoState.DISABLED
)

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
  // remember the dimensions used to create `shader`; if the view resizes we
  // need to invalidate the cache so the gradient scales correctly.  Without
  // this, a zero‑sized element (common during initial layout) would leave a
  // degenerate shader that never repaints when the real size arrives.
  var shaderWidth: Int = -1,
  var shaderHeight: Int = -1,
  var bitmap: Bitmap? = null,                  // cached image
  var clip: BackgroundClip = BackgroundClip.BORDER_BOX
)

class Background(
  val style: Style
) {

  internal val bgPaint by lazy {
    Paint().apply {
      this.style = Paint.Style.FILL
    }
  }

  var color: Int?
    set(value) {
      if (value == null) {
        style.values.put(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.INHERIT)
        style.values.putInt(StyleKeys.BACKGROUND_COLOR, 0)
        style.values.put(StyleKeys.BACKGROUND_COLOR_TYPE, 0)
        return
      }

      style.values.put(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
      style.values.putInt(StyleKeys.BACKGROUND_COLOR, value)
      style.values.put(StyleKeys.BACKGROUND_COLOR_TYPE, 1)
    }
    get() {
      val baseValue: Int =
        if (style.values.get(StyleKeys.BACKGROUND_COLOR_STATE) == StyleState.SET) {
          style.values.getInt(StyleKeys.BACKGROUND_COLOR)
        } else {
          0
        }

      return style.resolvePseudoInt(
        StyleKeys.BACKGROUND_COLOR,
        StyleKeys.BACKGROUND_COLOR_STATE,
        baseValue,
        StateKeys.BACKGROUND_COLOR
      )
    }

  var layers: MutableList<BackgroundLayer> = mutableListOf()

  fun applyBackgroundRepeat(value: String) {
    val parts = splitLayers(value)
    while (layers.size < parts.size) layers.add(BackgroundLayer())
    parts.forEachIndexed { idx, rep ->
      layers[idx].repeat = parseRepeat(rep.trim())
    }
    (style.node.view as? View)?.invalidate()
  }

  fun applyBackgroundPosition(value: String) {
    val parts = splitLayers(value)
    while (layers.size < parts.size) layers.add(BackgroundLayer())
    parts.forEachIndexed { idx, p ->
      val tokens = p.trim().split(WHITESPACE_REGEX)
      layers[idx].position = parsePosition(tokens)
    }
    (style.node.view as? android.view.View)?.invalidate()
  }

  fun applyBackgroundSize(value: String) {
    val parts = splitLayers(value)
    while (layers.size < parts.size) layers.add(BackgroundLayer())
    parts.forEachIndexed { idx, p ->
      layers[idx].size = parseSize(p.trim())
    }
    (style.node.view as? android.view.View)?.invalidate()
  }

  fun applyBackgroundClip(value: String) {
    val clip = when (value.trim().lowercase()) {
      "content-box" -> BackgroundClip.CONTENT_BOX
      "padding-box" -> BackgroundClip.PADDING_BOX
      "border-box" -> BackgroundClip.BORDER_BOX
      else -> return
    }
    for (layer in layers) {
      layer.clip = clip
    }
    (style.node.view as? android.view.View)?.invalidate()
  }

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

fun drawBackground(
  context: Context, view: View?, layer: BackgroundLayer, canvas: Canvas, width: Int, height: Int
) {
  layer.gradient?.let { drawGradient(layer, canvas, width, height, view) }

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

fun drawGradient(layer: BackgroundLayer, canvas: Canvas, width: Int, height: Int, view: View? = null) {
  val gradient = layer.gradient ?: return

  // invalidate cached shader if size has changed; without this the first draw
  // (which often happens at 0x0) would create a degenerate shader that never
  // updates when the view finally gets a proper size.
  if (layer.shader != null &&
    (layer.shaderWidth != width || layer.shaderHeight != height)
  ) {
    layer.shader = null
  }

  if (layer.shader == null) {
    // Parse color stops: each stop can be "color position" or just "color"
    val stopCount = gradient.stops.size
    val colorsArray = IntArray(stopCount)
    val positionsArray = FloatArray(stopCount)
    val maxIndex = (stopCount - 1).coerceAtLeast(1)

    for (index in 0 until stopCount) {
      val trimmed = gradient.stops[index].trim()
      // Find the last space that separates color from position
      val lastSpace = trimmed.lastIndexOf(' ')

      if (lastSpace > 0) {
        val colorPart = trimmed.substring(0, lastSpace)
        val posPart = trimmed.substring(lastSpace + 1).trim()

        colorsArray[index] = parseColor(colorPart) ?: Color.TRANSPARENT

        // Parse position: can be "0", "50%", "100%", etc.
        val posValue = posPart.trimEnd('%')
        val pos = posValue.toFloatOrNull()
        if (pos != null) {
          val normalizedPos = when {
            posPart.endsWith('%') -> pos / 100f
            pos <= 1f -> pos
            else -> pos / 100f
          }
          positionsArray[index] = normalizedPos.coerceIn(0f, 1f)
        } else {
          positionsArray[index] = index.toFloat() / maxIndex
        }
      } else {
        colorsArray[index] = parseColor(trimmed) ?: Color.TRANSPARENT
        positionsArray[index] = index.toFloat() / maxIndex
      }
    }

    // Ensure we have valid colors and positions
    if (colorsArray.isEmpty()) return

    layer.shader = when (gradient.type.lowercase()) {
      "linear" -> {
        val ep = resolveLinearGradientEndpoints(
          gradient.direction, width.toFloat(), height.toFloat()
        )
        LinearGradient(ep[0], ep[1], ep[2], ep[3], colorsArray, positionsArray, Shader.TileMode.CLAMP)
      }

      "radial" -> {
        val (cx, cy) = resolveRadialGradientCenter(gradient.direction, width.toFloat(), height.toFloat())
        // Radius must reach the farthest corner from the resolved centre.
        val radius = maxOf(
          hypot((cx).toDouble(), (cy).toDouble()),
          hypot((width - cx).toDouble(), (cy).toDouble()),
          hypot((cx).toDouble(), (height - cy).toDouble()),
          hypot((width - cx).toDouble(), (height - cy).toDouble())
        ).toFloat().coerceAtLeast(1f)
        RadialGradient(
          cx, cy, radius, colorsArray, positionsArray, Shader.TileMode.CLAMP
        )
      }

      else -> null
    }

    // remember the size used to create this shader
    layer.shaderWidth = width
    layer.shaderHeight = height

    // A freshly (re)built gradient Shader can miss painting on the very draw
    // call that creates it — e.g. a deeply nested scroll child whose first
    // real-size onDraw races the GPU texture upload for the new Shader.
    // Solid-color fills need no texture upload so they never hit this; a
    // gradient does, and without a follow-up invalidate it stays blank until
    // something else (scroll, rotation) forces a redraw. Schedule one
    // guaranteed extra draw pass so the shader is actually visible.
    if (width > 0 && height > 0) {
      view?.postInvalidateOnAnimation()
    }
  }

  // Fail-safe: if no shader could be built (e.g. an unrecognised gradient type
  // after a re-parse on rotation), do NOT fill — gradientPaint is shared and its
  // fallback colour is opaque black, which would paint a solid black box.
  if (layer.shader == null) return
  gradientPaint.shader = layer.shader
  canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), gradientPaint)
}

/**
 * Resolve linear-gradient endpoints for the given direction string and box size.
 * Supports CSS angle values (deg, rad, turn, grad), named directions
 * ("to bottom", "to top right", etc.), and falls back to top-to-bottom (180deg).
 */
// Reusable array for gradient endpoint calculations (avoids List<Float> boxing)
private val gradientEndpoints = FloatArray(4)

private fun resolveLinearGradientEndpoints(
  direction: String?,
  width: Float,
  height: Float
): FloatArray {
  val ep = gradientEndpoints
  val dir = direction?.trim()?.lowercase()
  if (dir == null) { ep[0] = 0f; ep[1] = 0f; ep[2] = 0f; ep[3] = height; return ep }

  // Named directions
  when (dir) {
    "to bottom"                        -> { ep[0] = 0f;    ep[1] = 0f;     ep[2] = 0f;    ep[3] = height; return ep }
    "to top"                           -> { ep[0] = 0f;    ep[1] = height; ep[2] = 0f;    ep[3] = 0f;     return ep }
    "to right"                         -> { ep[0] = 0f;    ep[1] = 0f;     ep[2] = width; ep[3] = 0f;     return ep }
    "to left"                          -> { ep[0] = width; ep[1] = 0f;     ep[2] = 0f;    ep[3] = 0f;     return ep }
    "to bottom right", "to right bottom" -> { ep[0] = 0f;    ep[1] = 0f;     ep[2] = width; ep[3] = height; return ep }
    "to bottom left", "to left bottom" -> { ep[0] = width; ep[1] = 0f;     ep[2] = 0f;    ep[3] = height; return ep }
    "to top right", "to right top"     -> { ep[0] = 0f;    ep[1] = height; ep[2] = width; ep[3] = 0f;     return ep }
    "to top left", "to left top"       -> { ep[0] = width; ep[1] = height; ep[2] = 0f;    ep[3] = 0f;     return ep }
  }

  // Try to parse as an angle
  val angleRad = parseCssAngleToRadians(dir)
  if (angleRad != null) {
    val centerX = width / 2f
    val centerY = height / 2f
    val sinA = kotlin.math.sin(angleRad).toFloat()
    val cosA = kotlin.math.cos(angleRad).toFloat()
    val halfLen = (kotlin.math.abs(width * sinA) + kotlin.math.abs(height * cosA)) / 2f
    ep[0] = centerX - halfLen * sinA
    ep[1] = centerY + halfLen * cosA
    ep[2] = centerX + halfLen * sinA
    ep[3] = centerY - halfLen * cosA
    return ep
  }

  // Fallback: top-to-bottom (CSS default)
  ep[0] = 0f; ep[1] = 0f; ep[2] = 0f; ep[3] = height
  return ep
}

/**
 * Parse a CSS angle string (e.g. "135deg", "0.75turn", "1.5rad", "200grad")
 * to radians. Returns null if the string cannot be parsed.
 */
private fun parseCssAngleToRadians(value: String): Double? {
  val v = value.trim().lowercase()
  return when {
    v.endsWith("deg") -> v.removeSuffix("deg").toDoubleOrNull()
      ?.let { it * Math.PI / 180.0 }

    v.endsWith("grad") -> v.removeSuffix("grad").toDoubleOrNull()
      ?.let { it * Math.PI / 200.0 }

    v.endsWith("turn") -> v.removeSuffix("turn").toDoubleOrNull()
      ?.let { it * 2.0 * Math.PI }

    v.endsWith("rad") -> v.removeSuffix("rad").toDoubleOrNull()
    else -> null
  }
}

/**
 * Resolve the centre point of a radial-gradient from the CSS direction string.
 *
 * Accepted formats include:
 *   "circle at top left", "ellipse at 30% 70%", "at center", "circle", etc.
 *
 * When no position is given the default is the element centre (50% 50%).
 */
private fun resolveRadialGradientCenter(
  direction: String?,
  width: Float,
  height: Float
): Pair<Float, Float> {
  val defaultCenter = Pair(width / 2f, height / 2f)
  val dir = direction?.trim()?.lowercase() ?: return defaultCenter

  // Extract the position portion after "at "
  val atIndex = dir.indexOf(" at ")
  val positionStr = if (atIndex >= 0) dir.substring(atIndex + 4).trim() else return defaultCenter
  if (positionStr.isEmpty()) return defaultCenter

  return resolvePositionKeywords(positionStr, width, height)
}

/**
 * Convert a CSS background-position value (keyword or percentage based) to
 * absolute pixel coordinates.
 *
 * Supports: named keywords (top, bottom, left, right, center) and percentage
 * values (e.g. "30%" or "30% 70%").
 */
private fun resolvePositionKeywords(
  position: String,
  width: Float,
  height: Float
): Pair<Float, Float> {
  val parts = position.split(Regex("\\s+"))

  fun resolveToken(token: String, horizontal: Boolean): Float {
    return when (token) {
      "left" -> 0f
      "right" -> width
      "top" -> 0f
      "bottom" -> height
      "center" -> if (horizontal) width / 2f else height / 2f
      else -> {
        if (token.endsWith("%")) {
          val pct = token.removeSuffix("%").toFloatOrNull() ?: 50f
          if (horizontal) pct / 100f * width else pct / 100f * height
        } else {
          val num = token.removeSuffix("px").toFloatOrNull()
          if (num != null) num * Mason.shared.scale
          else if (horizontal) width / 2f else height / 2f
        }
      }
    }
  }

  return when (parts.size) {
    1 -> {
      val x = resolveToken(parts[0], horizontal = true)
      val y = when (parts[0]) {
        "top" -> 0f
        "bottom" -> height
        // Single keyword like "center", "left", "right" → y defaults to 50%
        else -> height / 2f
      }
      // For "top"/"bottom" used alone, x defaults to center
      val finalX = when (parts[0]) {
        "top", "bottom" -> width / 2f
        else -> x
      }
      Pair(finalX, y)
    }
    else -> Pair(
      resolveToken(parts[0], horizontal = true),
      resolveToken(parts[1], horizontal = false)
    )
  }
}

private fun drawBitmapLayer(
  bitmap: Bitmap, layer: BackgroundLayer, canvas: Canvas, width: Int, height: Int
) {
  // Determine the scaled size
  val drawWidth: Int
  val drawHeight: Int
  val size = layer.size
  if (size == null) {
    drawWidth = bitmap.width
    drawHeight = bitmap.height
  } else {
    drawWidth = if (size.first < 0) bitmap.width else (size.first * width).toInt()
    drawHeight = if (size.second < 0) bitmap.height else (size.second * height).toInt()
  }

  // Determine position
  val x = ((layer.position?.first ?: 0.5f) * (width - drawWidth))
  val y = ((layer.position?.second ?: 0.5f) * (height - drawHeight))

  // Reuse cached RectF and Paint to avoid per-tile allocations
  val dst = bitmapDstRect
  val paint = bitmapPaint

  when (layer.repeat) {
    BackgroundRepeat.NO_REPEAT -> {
      dst.set(x, y, x + drawWidth, y + drawHeight)
      canvas.drawBitmap(bitmap, null, dst, paint)
    }

    BackgroundRepeat.REPEAT_X -> {
      var px = x
      while (px < width) {
        dst.set(px, y, px + drawWidth, y + drawHeight)
        canvas.drawBitmap(bitmap, null, dst, paint)
        px += drawWidth
      }
    }

    BackgroundRepeat.REPEAT_Y -> {
      var py = y
      while (py < height) {
        dst.set(x, py, x + drawWidth, py + drawHeight)
        canvas.drawBitmap(bitmap, null, dst, paint)
        py += drawHeight
      }
    }

    BackgroundRepeat.REPEAT -> {
      var py = y
      while (py < height) {
        var px = x
        while (px < width) {
          dst.set(px, py, px + drawWidth, py + drawHeight)
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
    .split(COMMA_WHITESPACE_REGEX)
    .filter { it.isNotEmpty() }

  return when (components.size) {
    3 -> {
      val r = parseColorChannel(components[0]) ?: return null
      val g = parseColorChannel(components[1]) ?: return null
      val b = parseColorChannel(components[2]) ?: return null
      val a = parseAlpha(alphaPart)
      (a shl 24) or (r shl 16) or (g shl 8) or b
    }

    4 -> {
      // Legacy rgba(r, g, b, a) comma-separated format
      val r = parseColorChannel(components[0]) ?: return null
      val g = parseColorChannel(components[1]) ?: return null
      val b = parseColorChannel(components[2]) ?: return null
      val a = if (alphaPart != null) parseAlpha(alphaPart) else parseAlpha(components[3])
      (a shl 24) or (r shl 16) or (g shl 8) or b
    }

    else -> null
  }
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

fun parseSize(value: String): Pair<Float, Float>? {
  val s = value.lowercase()
  return when (s) {
    "cover" -> -1f to -1f
    "contain" -> -2f to -2f
    else -> {
      val tokens = s.split(WHITESPACE_REGEX)
      if (tokens.size == 2) {
        val w = tokens[0].removeSuffix("px").toFloatOrNull()
        val h = tokens[1].removeSuffix("px").toFloatOrNull()
        if (w != null && h != null) w to h else null
      } else null
    }
  }
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
    val parts = v.removePrefix("to ").split(WHITESPACE_REGEX)
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
    val parts = beforeAt.split(WHITESPACE_REGEX)
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
  val posTokens = value.split(WHITESPACE_REGEX)
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

  // Filter out empty/default layers (e.g. when the author only specified
  // a simple color like "#fff" we don't want a placeholder layer).
  val meaningful = layers.filter { layer ->
    layer.image != null || layer.gradient != null || layer.position != null || layer.size != null || layer.repeat != BackgroundRepeat.NO_REPEAT || layer.clip != BackgroundClip.BORDER_BOX
  }

  bg.layers.addAll(meaningful)

  if (bg.color == null && bg.layers.isEmpty()) return null

  return bg
}
