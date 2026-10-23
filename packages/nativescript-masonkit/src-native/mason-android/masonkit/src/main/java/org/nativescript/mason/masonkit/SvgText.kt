package org.nativescript.mason.masonkit

import android.graphics.Paint
import android.graphics.Path
import android.graphics.PathIterator
import android.graphics.Rect
import android.graphics.Typeface
import android.os.Build
import androidx.annotation.RequiresApi

/*
 * Glyph outlines for SVG `<text>` (SvgParser.kt lays the runs out). Keep in step with SvgText.swift.
 */

/** The font a run of SVG text asks for. */
data class SvgFont(val families: List<String>, val size: Float, val weight: Int, val italic: Boolean)

/** One shaped run: outlines with the pen at (0, 0) on the alphabetic baseline, y down. */
class SvgTextRun(
  val commands: List<SvgPathCommand>,
  val advance: Float,
  val ascent: Float,
  /** Positive, below the baseline. */
  val descent: Float,
  val xHeight: Float,
)

fun interface SvgTextShaping {
  fun shape(text: String, font: SvgFont, letterSpacing: Float, wordSpacing: Float): SvgTextRun
}

/** Swapped in tests for a font-independent shaper. */
internal var svgTextShaper: SvgTextShaping = AndroidSvgShaper

/** Outlines are taken at this size and scaled, so tiny viewBox units keep their shape. */
private const val SHAPE_SIZE = 100f
/** Largest distance, in [SHAPE_SIZE] units, between a curve and its polyline below API 34. */
private const val APPROXIMATE_ERROR = 0.1f
private val EMPTY_RUN = SvgTextRun(emptyList(), 0f, 0f, 0f, 0f)
private val SANS_FAMILIES = setOf("sans-serif", "system-ui", "-apple-system", "ui-sans-serif", "ui-rounded")
private val SERIF_FAMILIES = setOf("serif", "ui-serif")
private val MONO_FAMILIES = setOf("monospace", "ui-monospace")
private val FALLBACK_FAMILY = listOf("serif")

internal object AndroidSvgShaper : SvgTextShaping {
  private val typefaces = HashMap<SvgFont, Typeface>()
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val xBounds = Rect()

  private fun family(name: String): Typeface? = when (val lower = name.lowercase()) {
    in SANS_FAMILIES -> Typeface.SANS_SERIF
    in SERIF_FAMILIES -> Typeface.SERIF
    in MONO_FAMILIES -> Typeface.MONOSPACE
    "cursive" -> Typeface.create("cursive", Typeface.NORMAL)
    "fantasy" -> Typeface.create("casual", Typeface.NORMAL)
    else -> AppFonts.typeface(name) ?: Typeface.create(lower, Typeface.NORMAL).takeIf { it != Typeface.DEFAULT }
  }

  private fun typeface(font: SvgFont): Typeface {
    val key = font.copy(size = SHAPE_SIZE)
    typefaces[key]?.let { return it }
    val base = (font.families + FALLBACK_FAMILY).firstNotNullOfOrNull { family(it) } ?: Typeface.SERIF
    // Missing bold or italic faces are synthesized, as browsers do.
    val styled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      Typeface.create(base, font.weight.coerceIn(1, 1000), font.italic)
    } else {
      val style = (if (font.weight >= 600) Typeface.BOLD else 0) or (if (font.italic) Typeface.ITALIC else 0)
      Typeface.create(base, style)
    }
    typefaces[key] = styled
    return styled
  }

  override fun shape(text: String, font: SvgFont, letterSpacing: Float, wordSpacing: Float): SvgTextRun {
    if (font.size <= 0f || text.isEmpty()) return EMPTY_RUN
    return try {
      synchronized(this) {
        val k = font.size / SHAPE_SIZE
        paint.reset()
        paint.isAntiAlias = true
        paint.typeface = typeface(font)
        paint.textSize = SHAPE_SIZE
        paint.letterSpacing = letterSpacing / font.size
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) paint.wordSpacing = wordSpacing / k
        val path = Path()
        paint.getTextPath(text, 0, text.length, 0f, 0f, path)
        val commands = pathCommands(path, k)
        val metrics = paint.fontMetrics
        paint.getTextBounds("x", 0, 1, xBounds)
        SvgTextRun(commands, paint.measureText(text) * k, -metrics.ascent * k, metrics.descent * k, -xBounds.top * k)
      }
    } catch (_: Throwable) {
      EMPTY_RUN
    }
  }

  private fun pathCommands(path: Path, k: Float): List<SvgPathCommand> = when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE -> iterate(path, k)
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O -> approximate(path, k)
    else -> emptyList()
  }

  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  private fun iterate(path: Path, k: Float): List<SvgPathCommand> {
    val out = ArrayList<SvgPathCommand>()
    val it = path.pathIterator
    val p = FloatArray(8)
    while (it.hasNext()) {
      when (it.next(p, 0)) {
        PathIterator.VERB_MOVE -> out.add(SvgPathCommand.MoveTo(p[0] * k, p[1] * k))
        PathIterator.VERB_LINE -> out.add(SvgPathCommand.LineTo(p[2] * k, p[3] * k))
        // Glyphs have no conics; treat one as its control polygon's quadratic.
        PathIterator.VERB_QUAD, PathIterator.VERB_CONIC -> out.add(SvgPathCommand.QuadTo(p[2] * k, p[3] * k, p[4] * k, p[5] * k))
        PathIterator.VERB_CUBIC -> out.add(SvgPathCommand.CubicTo(p[2] * k, p[3] * k, p[4] * k, p[5] * k, p[6] * k, p[7] * k))
        PathIterator.VERB_CLOSE -> out.add(SvgPathCommand.Close)
        PathIterator.VERB_DONE -> break
      }
    }
    return out
  }

  /** Each contour as a closed polyline; a repeated fraction marks a jump to the next one. */
  @RequiresApi(Build.VERSION_CODES.O)
  private fun approximate(path: Path, k: Float): List<SvgPathCommand> {
    val out = ArrayList<SvgPathCommand>()
    val pts = path.approximate(APPROXIMATE_ERROR)
    var last = Float.NaN
    var i = 0
    while (i + 2 < pts.size) {
      val fraction = pts[i]
      val x = pts[i + 1] * k
      val y = pts[i + 2] * k
      if (out.isEmpty() || fraction == last) {
        if (out.isNotEmpty()) out.add(SvgPathCommand.Close)
        out.add(SvgPathCommand.MoveTo(x, y))
      } else {
        out.add(SvgPathCommand.LineTo(x, y))
      }
      last = fraction
      i += 3
    }
    if (out.isNotEmpty()) out.add(SvgPathCommand.Close)
    return out
  }
}
