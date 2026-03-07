package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.DisplayMetrics
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Style
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.Clear
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.enums.Float as CSSFloat
import androidx.core.graphics.toColorInt

class FloatActivity : AppCompatActivity() {
  lateinit var metrics: DisplayMetrics
  val mason = Mason.shared
  val scale get() = mason.scale

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    metrics = resources.displayMetrics
    mason.setDeviceScale(metrics.density)

    val body = mason.createView(this)
    enableEdgeToEdge()

    body.configure {
      it.background = "#F8FAFC"
      it.display = Display.Block
      it.padding = Rect.uniform(LengthPercentage.Points(16f * scale))
    }

    buildDemo(body)

    setContentView(body)

    ViewCompat.setOnApplyWindowInsetsListener(body) { _, insets ->
      val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      body.style.padding = Rect(
        LengthPercentage.Points(bars.top.toFloat() + 16f * scale),
        LengthPercentage.Points(bars.right.toFloat() + 16f * scale),
        LengthPercentage.Points(bars.bottom.toFloat() + 16f * scale),
        LengthPercentage.Points(bars.left.toFloat() + 16f * scale),
      )
      insets
    }
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  private fun label(text: String, color: String = "#1E293B", size: Int = 14): org.nativescript.mason.masonkit.TextView {
    return mason.createTextView(this, TextType.Span).apply {
      append(text)
      configure {
        it.color = color.toColorInt()
        it.fontSize = (size * scale).toInt()
      }
    }
  }

  private fun card(): View {
    return mason.createView(this).apply {
      configure {
        it.background = "#FFFFFF"
        it.border = "1 solid #E2E8F0"
        it.borderRadius = "12"
        it.padding = Rect.uniform(LengthPercentage.Points(16f * scale))
        it.margin = Rect(
          LengthPercentageAuto.Points(12f * scale),
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Points(12f * scale),
          LengthPercentageAuto.Zero
        )
        it.display = Display.Block
      }
    }
  }

  private fun colorBox(
    text: String,
    bg: String,
    float: CSSFloat,
    w: Float = 80f,
    h: Float = 60f,
  ): View {
    return mason.createView(this).apply {
      append(label(text, "#FFFFFF", 11))
      configure {
        it.background = bg
        it.borderRadius = "8"
        it.float = float
        it.size = org.nativescript.mason.masonkit.Size(
          Dimension.Points(w * scale), Dimension.Points(h * scale)
        )
        it.margin = Rect.uniform(LengthPercentageAuto.Points(6f * scale))
        it.display = Display.Flex
        it.justifyContent = org.nativescript.mason.masonkit.enums.JustifyContent.Center
        it.alignItems = org.nativescript.mason.masonkit.enums.AlignItems.Center
      }
    }
  }

  private fun prose(text: String): org.nativescript.mason.masonkit.TextView {
    return mason.createTextView(this, TextType.P).apply {
      append(text)
      configure {
        it.color = "#334155".toColorInt()
        it.fontSize = (14 * scale).toInt()
        it.lineHeight = 20f * scale
      }
    }
  }

  // ---------------------------------------------------------------
  // Demo
  // ---------------------------------------------------------------
  private fun buildDemo(body: View) {

    // 1. Magazine Drop Cap
    body.append(label("Magazine Layout", "#1E293B", 18))

    val c1 = card()
    val dropCap = mason.createView(this).apply {
      append(label("T", "#7C3AED", 56))
      configure {
        it.background = "#F5F3FF"
        it.borderRadius = "12"
        it.float = CSSFloat.Left
        it.size = org.nativescript.mason.masonkit.Size(
          Dimension.Points(68f * scale), Dimension.Points(68f * scale)
        )
        it.margin = Rect(
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Points(12f * scale),
          LengthPercentageAuto.Points(6f * scale),
          LengthPercentageAuto.Zero
        )
        it.display = Display.Flex
        it.justifyContent = org.nativescript.mason.masonkit.enums.JustifyContent.Center
        it.alignItems = org.nativescript.mason.masonkit.enums.AlignItems.Center
      }
    }
    c1.append(dropCap)
    c1.append(prose(
      "he quick brown fox jumps over the lazy dog. " +
      "Text wraps naturally around the floated drop-cap, " +
      "just like a real magazine. The content reflows to fill " +
      "every available space beside and below the element."
    ))

   body.append(c1)

      /*

    // 2. Photo Essay -- alternating floats
    body.append(label("Photo Essay", "#1E293B", 18))

    val c2 = card()
    c2.append(colorBox("PHOTO", "#0EA5E9", CSSFloat.Left, 100f, 65f))
    c2.append(prose(
      "Sunrise at the peak. Golden light spills across the valley, " +
      "painting every ridge in warm amber tones."
    ))
    c2.append(colorBox("PHOTO", "#F43F5E", CSSFloat.Right, 100f, 65f))
    c2.append(prose(
      "By evening the colors shift to deep purple and crimson. " +
      "Pine silhouettes frame the scene perfectly."
    ))
    body.append(c2)

    // 3. Clear: Both with pull-quote
    body.append(label("Clear: Both", "#1E293B", 18))

    val c3 = card()
    c3.append(colorBox("42%", "#8B5CF6", CSSFloat.Left, 70f, 55f))
    c3.append(colorBox("$1.2M", "#06B6D4", CSSFloat.Right, 70f, 55f))
    c3.append(prose("Revenue grew strongly this quarter across all product lines."))

    val quote = mason.createView(this).apply {
      val qt = mason.createTextView(this@FloatActivity, TextType.Blockquote).apply {
        append("\u201CDesign is not just what it looks like. Design is how it works.\u201D")
        configure {
          it.color = "#7C3AED".toColorInt()
          it.fontSize = (15 * scale).toInt()
          it.fontWeight = org.nativescript.mason.masonkit.FontFace.NSCFontWeight.SemiBold
          it.textAlign = TextAlign.Center
        }
      }
      append(qt)
      configure {
        it.clear = Clear.Both
        it.background = "#FAF5FF"
        it.border = "2 solid #DDD6FE"
        it.borderRadius = "10"
        it.padding = Rect.uniform(LengthPercentage.Points(14f * scale))
        it.margin = Rect.uniform(LengthPercentageAuto.Points(8f * scale))
        it.display = Display.Block
      }
    }
    c3.append(quote)
    c3.append(prose("After clear: both, content resumes full width below."))
    body.append(c3)

    // 4. Newspaper grid -- multiple float: left
    body.append(label("Newspaper Columns", "#1E293B", 18))

    val c4 = card()
    val tags = arrayOf("News" to "#EF4444", "Sport" to "#F97316", "Tech" to "#EAB308",
      "Life" to "#22C55E", "Arts" to "#3B82F6", "Biz" to "#8B5CF6")
    for ((name, color) in tags) {
      c4.append(colorBox(name, color, CSSFloat.Left, 90f, 50f))
    }
    val clearAll = mason.createView(this).apply {
      configure { it.clear = Clear.Both }
    }
    c4.append(clearAll)
    c4.append(prose(
      "Multiple float: left elements stack horizontally then wrap -- " +
      "exactly how early CSS grid systems worked."
    ))
    body.append(c4)

    // 5. Sidebar pattern
    body.append(label("Sidebar Pattern", "#1E293B", 18))

    val c5 = card()
    val sidebar = mason.createView(this).apply {
      append(label("Related", "#1E293B", 13))
      append(label("- Getting Started", "#3B82F6", 12))
      append(label("- API Reference", "#3B82F6", 12))
      append(label("- Examples", "#3B82F6", 12))
      configure {
        it.background = "#F1F5F9"
        it.borderRadius = "10"
        it.border = "1 solid #CBD5E1"
        it.float = CSSFloat.Right
        it.size = org.nativescript.mason.masonkit.Size(
          Dimension.Points(120f * scale), Dimension.Auto
        )
        it.padding = Rect.uniform(LengthPercentage.Points(10f * scale))
        it.margin = Rect(
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Points(8f * scale),
          LengthPercentageAuto.Points(12f * scale)
        )
        it.display = Display.Block
      }
    }
    c5.append(sidebar)
    c5.append(prose(
      "The sidebar floats right while the article text flows " +
      "on the left. This classic pattern was the dominant web " +
      "layout before flexbox and grid existed."
    ))
    body.append(c5)

    // 6. Clear: Left vs Right
    body.append(label("Selective Clear", "#1E293B", 18))

    val c6 = card()
    c6.append(colorBox("L", "#EC4899", CSSFloat.Left, 55f, 45f))
    c6.append(colorBox("R", "#14B8A6", CSSFloat.Right, 55f, 45f))
    c6.append(prose("Text flows between two floats."))

    val clearLeftBar = mason.createView(this).apply {
      append(label("clear: left", "#FFFFFF", 11))
      configure {
        it.clear = Clear.Left
        it.background = "#F59E0B"
        it.borderRadius = "8"
        it.padding = Rect.uniform(LengthPercentage.Points(8f * scale))
        it.margin = Rect.uniform(LengthPercentageAuto.Points(6f * scale))
        it.display = Display.Flex
        it.justifyContent = org.nativescript.mason.masonkit.enums.JustifyContent.Center
        it.alignItems = org.nativescript.mason.masonkit.enums.AlignItems.Center
      }
    }
    c6.append(clearLeftBar)
    c6.append(prose("The amber bar clears left only -- it drops below the pink float but the teal float still affects layout above."))
    body.append(c6)

    */
  }
}
