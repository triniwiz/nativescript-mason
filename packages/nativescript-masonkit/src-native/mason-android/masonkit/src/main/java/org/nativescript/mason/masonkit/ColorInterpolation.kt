package org.nativescript.mason.masonkit

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cbrt
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sign
import kotlin.math.sin

/**
 * A gradient's `in <colorspace> [<hue-method> hue]`. Shaders only interpolate in sRGB,
 * so [expandInterpolatedStops] resamples each segment in the requested space.
 */
data class ColorInterpolation(val space: Space, val hue: HueMethod = HueMethod.SHORTER) {
  enum class Space(val css: String, val hueIndex: Int, val chromaIndex: Int) {
    SRGB("srgb", -1, -1),
    SRGB_LINEAR("srgb-linear", -1, -1),
    OKLAB("oklab", -1, -1),
    OKLCH("oklch", 2, 1),
    LAB("lab", -1, -1),
    LCH("lch", 2, 1),
    XYZ_D65("xyz-d65", -1, -1),
    XYZ_D50("xyz-d50", -1, -1),
    HSL("hsl", 0, 1),
    HWB("hwb", 0, -1);

    companion object {
      fun parse(name: String): Space? = when (val n = name.lowercase()) {
        "xyz" -> XYZ_D65
        else -> entries.firstOrNull { it.css == n }
      }
    }
  }

  enum class HueMethod { SHORTER, LONGER, INCREASING, DECREASING }

  companion object {
    private val WHITESPACE = Regex("\\s+")

    /** Splits the method from a gradient's first argument: (the rest, the method), or null. */
    fun extract(first: String): Pair<String, ColorInterpolation>? {
      val tokens = first.trim().split(WHITESPACE).filter { it.isNotEmpty() }.toMutableList()
      val at = tokens.indexOfFirst { it.equals("in", ignoreCase = true) }
      if (at < 0 || at + 1 >= tokens.size) return null
      // Unknown spaces fall back to sRGB instead of dropping the gradient.
      val space = Space.parse(tokens[at + 1]) ?: Space.SRGB
      var consumed = 2
      var hue = HueMethod.SHORTER
      if (at + 3 < tokens.size && tokens[at + 3].equals("hue", ignoreCase = true)) {
        HueMethod.entries.firstOrNull { it.name.equals(tokens[at + 2], ignoreCase = true) }?.let {
          hue = it
          consumed = 4
        }
      }
      repeat(consumed) { tokens.removeAt(at) }
      return tokens.joinToString(" ") to ColorInterpolation(space, hue)
    }
  }
}

// Keeps each channel within ~1/255 of the exact curve.
private const val SAMPLES_PER_SEGMENT = 8

internal fun expandInterpolatedStops(
  colors: IntArray,
  positions: FloatArray,
  interpolation: ColorInterpolation?
): Pair<IntArray, FloatArray> {
  if (interpolation == null || interpolation.space == ColorInterpolation.Space.SRGB || colors.size < 2) {
    return colors to positions
  }
  val outColors = ArrayList<Int>(colors.size * SAMPLES_PER_SEGMENT)
  val outPositions = ArrayList<Float>(colors.size * SAMPLES_PER_SEGMENT)
  for (i in colors.indices) {
    outColors.add(colors[i])
    outPositions.add(positions[i])
    if (i == colors.lastIndex) break
    val p0 = positions[i]
    val p1 = positions[i + 1]
    if (p1 - p0 <= 1e-6f) continue // hard stop
    for (k in 1 until SAMPLES_PER_SEGMENT) {
      val t = k.toDouble() / SAMPLES_PER_SEGMENT
      outColors.add(interpolateArgb(colors[i], colors[i + 1], t, interpolation))
      outPositions.add((p0 + (p1 - p0) * t).toFloat())
    }
  }
  return outColors.toIntArray() to outPositions.toFloatArray()
}

// Premultiplied, per CSS Color 4 §12.
internal fun interpolateArgb(from: Int, to: Int, t: Double, interpolation: ColorInterpolation): Int {
  val space = interpolation.space
  val fromAlpha = ((from ushr 24) and 0xFF) / 255.0
  val toAlpha = ((to ushr 24) and 0xFF) / 255.0
  val a = ColorSpaces.fromSrgb(space, channels(from))
  val b = ColorSpaces.fromSrgb(space, channels(to))

  val hue = space.hueIndex
  if (hue >= 0) {
    // A powerless hue (grey or transparent) takes the other endpoint's.
    val aGray = isAchromatic(space, a) || fromAlpha == 0.0
    val bGray = isAchromatic(space, b) || toAlpha == 0.0
    if (aGray && !bGray) a[hue] = b[hue]
    if (bGray && !aGray) b[hue] = a[hue]
    fixHues(a, b, hue, interpolation.hue)
  }

  for (i in 0 until 3) {
    if (i == hue) continue
    a[i] *= fromAlpha
    b[i] *= toAlpha
  }
  val alpha = fromAlpha + (toAlpha - fromAlpha) * t
  val mixed = DoubleArray(3)
  for (i in 0 until 3) {
    mixed[i] = a[i] + (b[i] - a[i]) * t
    if (i != hue && alpha > 0.0) mixed[i] /= alpha
  }
  if (hue >= 0) mixed[hue] = ((mixed[hue] % 360.0) + 360.0) % 360.0

  val rgb = ColorSpaces.toSrgb(space, mixed)
  return argb(alpha, rgb[0], rgb[1], rgb[2])
}

private fun isAchromatic(space: ColorInterpolation.Space, v: DoubleArray): Boolean = when (space) {
  // HWB's hue is powerless when whiteness + blackness reach 100%.
  ColorInterpolation.Space.HWB -> v[1] + v[2] >= 100.0 - 1e-4
  else -> abs(v[space.chromaIndex]) < 1e-4
}

private fun fixHues(a: DoubleArray, b: DoubleArray, i: Int, method: ColorInterpolation.HueMethod) {
  val d = b[i] - a[i]
  when (method) {
    ColorInterpolation.HueMethod.SHORTER -> if (d > 180) a[i] += 360.0 else if (d < -180) b[i] += 360.0
    ColorInterpolation.HueMethod.LONGER -> if (d > 0 && d < 180) a[i] += 360.0 else if (d > -180 && d <= 0) b[i] += 360.0
    ColorInterpolation.HueMethod.INCREASING -> if (d < 0) b[i] += 360.0
    ColorInterpolation.HueMethod.DECREASING -> if (d > 0) a[i] += 360.0
  }
}

private fun channels(argb: Int) = doubleArrayOf(
  ((argb shr 16) and 0xFF) / 255.0,
  ((argb shr 8) and 0xFF) / 255.0,
  (argb and 0xFF) / 255.0
)

private fun argb(alpha: Double, r: Double, g: Double, b: Double): Int {
  fun ch(v: Double) = (v.coerceIn(0.0, 1.0) * 255.0).roundToInt()
  return (ch(alpha) shl 24) or (ch(r) shl 16) or (ch(g) shl 8) or ch(b)
}

// Matrices from CSS Color 4 §18.
internal object ColorSpaces {
  private val LINEAR_SRGB_TO_XYZ = arrayOf(
    doubleArrayOf(0.41239079926595934, 0.357584339383878, 0.1804807884018343),
    doubleArrayOf(0.21263900587151027, 0.715168678767756, 0.07219231536073371),
    doubleArrayOf(0.01933081871559182, 0.11919477979462598, 0.9505321522496607)
  )
  private val XYZ_TO_LINEAR_SRGB = arrayOf(
    doubleArrayOf(3.2409699419045226, -1.537383177570094, -0.4986107602930034),
    doubleArrayOf(-0.9692436362808796, 1.8759675015077202, 0.04155505740717559),
    doubleArrayOf(0.05563007969699366, -0.20397695888897652, 1.0569715142428786)
  )
  private val D65_TO_D50 = arrayOf(
    doubleArrayOf(1.0479298208405488, 0.022946793341019088, -0.05019222954313557),
    doubleArrayOf(0.029627815688159344, 0.990434484573249, -0.01707382502938514),
    doubleArrayOf(-0.009243058152591178, 0.015055144896577895, 0.7518742899580008)
  )
  private val D50_TO_D65 = arrayOf(
    doubleArrayOf(0.9554734527042182, -0.023098536874261423, 0.0632593086610217),
    doubleArrayOf(-0.028369706963208136, 1.0099954580106629, 0.021041398966943008),
    doubleArrayOf(0.012314001688319899, -0.020507696433477912, 1.3303659366080753)
  )
  private val D50_WHITE = doubleArrayOf(0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585)
  private const val LAB_E = 216.0 / 24389.0
  private const val LAB_K = 24389.0 / 27.0

  fun fromSrgb(space: ColorInterpolation.Space, rgb: DoubleArray): DoubleArray = when (space) {
    ColorInterpolation.Space.SRGB -> rgb.copyOf()
    ColorInterpolation.Space.SRGB_LINEAR -> linear(rgb)
    ColorInterpolation.Space.OKLAB -> oklab(linear(rgb))
    ColorInterpolation.Space.OKLCH -> polar(oklab(linear(rgb)))
    ColorInterpolation.Space.LAB -> lab(mul(D65_TO_D50, mul(LINEAR_SRGB_TO_XYZ, linear(rgb))))
    ColorInterpolation.Space.LCH -> polar(lab(mul(D65_TO_D50, mul(LINEAR_SRGB_TO_XYZ, linear(rgb)))))
    ColorInterpolation.Space.XYZ_D65 -> mul(LINEAR_SRGB_TO_XYZ, linear(rgb))
    ColorInterpolation.Space.XYZ_D50 -> mul(D65_TO_D50, mul(LINEAR_SRGB_TO_XYZ, linear(rgb)))
    ColorInterpolation.Space.HSL -> hsl(rgb)
    ColorInterpolation.Space.HWB -> hwb(rgb)
  }

  fun toSrgb(space: ColorInterpolation.Space, v: DoubleArray): DoubleArray = when (space) {
    ColorInterpolation.Space.SRGB -> v.copyOf()
    ColorInterpolation.Space.SRGB_LINEAR -> gamma(v)
    ColorInterpolation.Space.OKLAB -> gamma(oklabToLinear(v))
    ColorInterpolation.Space.OKLCH -> gamma(oklabToLinear(rectangular(v)))
    ColorInterpolation.Space.LAB -> gamma(mul(XYZ_TO_LINEAR_SRGB, mul(D50_TO_D65, labToXyz(v))))
    ColorInterpolation.Space.LCH -> gamma(mul(XYZ_TO_LINEAR_SRGB, mul(D50_TO_D65, labToXyz(rectangular(v)))))
    ColorInterpolation.Space.XYZ_D65 -> gamma(mul(XYZ_TO_LINEAR_SRGB, v))
    ColorInterpolation.Space.XYZ_D50 -> gamma(mul(XYZ_TO_LINEAR_SRGB, mul(D50_TO_D65, v)))
    ColorInterpolation.Space.HSL -> hslToRgb(v)
    ColorInterpolation.Space.HWB -> hwbToRgb(v)
  }

  private fun mul(m: Array<DoubleArray>, v: DoubleArray) = DoubleArray(3) { r ->
    m[r][0] * v[0] + m[r][1] * v[1] + m[r][2] * v[2]
  }

  private fun toLinear(c: Double): Double {
    val a = abs(c)
    return if (a <= 0.04045) c / 12.92 else sign(c) * ((a + 0.055) / 1.055).pow(2.4)
  }

  private fun fromLinear(c: Double): Double {
    val a = abs(c)
    return if (a <= 0.0031308) c * 12.92 else sign(c) * (1.055 * a.pow(1 / 2.4) - 0.055)
  }

  private fun linear(rgb: DoubleArray) = DoubleArray(3) { toLinear(rgb[it]) }
  private fun gamma(rgb: DoubleArray) = DoubleArray(3) { fromLinear(rgb[it]) }

  private fun oklab(lin: DoubleArray): DoubleArray {
    val l = cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2])
    val m = cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2])
    val s = cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2])
    return doubleArrayOf(
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    )
  }

  private fun oklabToLinear(lab: DoubleArray): DoubleArray {
    val l = (lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2]).pow(3)
    val m = (lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2]).pow(3)
    val s = (lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2]).pow(3)
    return doubleArrayOf(
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    )
  }

  private fun lab(xyzD50: DoubleArray): DoubleArray {
    val f = DoubleArray(3) {
      val n = xyzD50[it] / D50_WHITE[it]
      if (n > LAB_E) cbrt(n) else (LAB_K * n + 16) / 116
    }
    return doubleArrayOf(116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2]))
  }

  private fun labToXyz(lab: DoubleArray): DoubleArray {
    val fy = (lab[0] + 16) / 116
    val fx = lab[1] / 500 + fy
    val fz = fy - lab[2] / 200
    val x = if (fx.pow(3) > LAB_E) fx.pow(3) else (116 * fx - 16) / LAB_K
    val y = if (lab[0] > LAB_K * LAB_E) fy.pow(3) else lab[0] / LAB_K
    val z = if (fz.pow(3) > LAB_E) fz.pow(3) else (116 * fz - 16) / LAB_K
    return doubleArrayOf(x * D50_WHITE[0], y * D50_WHITE[1], z * D50_WHITE[2])
  }

  private fun polar(v: DoubleArray): DoubleArray {
    var h = atan2(v[2], v[1]) * 180 / PI
    if (h < 0) h += 360
    return doubleArrayOf(v[0], hypot(v[1], v[2]), h)
  }

  private fun rectangular(v: DoubleArray): DoubleArray {
    val rad = v[2] * PI / 180
    return doubleArrayOf(v[0], v[1] * cos(rad), v[1] * sin(rad))
  }

  private fun hsl(rgb: DoubleArray): DoubleArray {
    val (r, g, b) = Triple(rgb[0], rgb[1], rgb[2])
    val mx = max(r, max(g, b))
    val mn = min(r, min(g, b))
    val l = (mx + mn) / 2
    val d = mx - mn
    var h = 0.0
    var s = 0.0
    if (d != 0.0) {
      s = if (l == 0.0 || l == 1.0) 0.0 else (mx - l) / min(l, 1 - l)
      h = when (mx) {
        r -> (g - b) / d + (if (g < b) 6 else 0)
        g -> (b - r) / d + 2
        else -> (r - g) / d + 4
      } * 60
    }
    return doubleArrayOf(h, s * 100, l * 100)
  }

  private fun hslToRgb(v: DoubleArray): DoubleArray {
    val h = v[0]
    val s = v[1] / 100
    val l = v[2] / 100
    fun f(n: Double): Double {
      val k = (n + h / 30) % 12
      return l - s * min(l, 1 - l) * max(-1.0, min(k - 3, min(9 - k, 1.0)))
    }
    return doubleArrayOf(f(0.0), f(8.0), f(4.0))
  }

  private fun hwb(rgb: DoubleArray): DoubleArray {
    val h = hsl(rgb)[0]
    return doubleArrayOf(h, min(rgb[0], min(rgb[1], rgb[2])) * 100, (1 - max(rgb[0], max(rgb[1], rgb[2]))) * 100)
  }

  private fun hwbToRgb(v: DoubleArray): DoubleArray {
    val w = v[1] / 100
    val b = v[2] / 100
    if (w + b >= 1) {
      val gray = w / (w + b)
      return doubleArrayOf(gray, gray, gray)
    }
    val rgb = hslToRgb(doubleArrayOf(v[0], 100.0, 50.0))
    return DoubleArray(3) { rgb[it] * (1 - w - b) + w }
  }
}
