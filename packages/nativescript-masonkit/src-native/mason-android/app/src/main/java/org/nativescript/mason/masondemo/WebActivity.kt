package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.FontFace
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Scroll
import org.nativescript.mason.masonkit.Styles
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.TextType
import androidx.core.graphics.toColorInt

class WebActivity : AppCompatActivity() {
  val mason = Mason.shared
  fun toPx(dip: Float): Float {
    return dip * resources.displayMetrics.density
  }

  lateinit var root: Scroll
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    root = mason.createScrollView(this)
    root.style.overflowY = Overflow.Scroll
    enableEdgeToEdge()
    setContentView(root)
    ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      root.style.setPadding(
        systemBars.left, systemBars.top, systemBars.right, systemBars.bottom
      )
      insets
    }
    webTextSample()
  }

  private fun webTextSample() {
    val density = resources.displayMetrics.density

    // --- H1 heading ---
    val h1 = mason.createTextView(this, TextType.H1)
    h1.append("Mason Layout Engine")
    root.append(h1)

    // --- Paragraph with inline styles ---
    val p1 = mason.createTextView(this, TextType.P)
    p1.append("Mason is a ")

    val bold = mason.createTextView(this, TextType.Strong)
    bold.append("CSS-like layout engine")
    p1.append(bold)

    p1.append(" that brings ")

    val italic = mason.createTextView(this, TextType.Em)
    italic.append("web-standard")
    p1.append(italic)

    p1.append(" layouts to native iOS and Android views.")
    root.append(p1)

    // --- H2 heading ---
    val h2 = mason.createTextView(this, TextType.H2)
    h2.append("Features")
    root.append(h2)

    // --- Paragraph with nested inline elements ---
    val p2 = mason.createTextView(this, TextType.P)
    p2.append("Supports ")

    val code1 = mason.createTextView(this, TextType.Code)
    code1.append("flexbox")
    code1.style.backgroundColor = 0xFFEFEFEF.toInt()
    p2.append(code1)

    p2.append(", ")

    val code2 = mason.createTextView(this, TextType.Code)
    code2.append("grid")
    code2.style.backgroundColor = 0xFFEFEFEF.toInt()
    p2.append(code2)

    p2.append(", and ")

    val code3 = mason.createTextView(this, TextType.Code)
    code3.append("block")
    code3.style.backgroundColor = 0xFFEFEFEF.toInt()
    p2.append(code3)

    p2.append(" layouts with full CSS text rendering including ")

    val underlined = mason.createTextView(this, TextType.Span)
    underlined.append("underline")
    underlined.decorationLine = Styles.DecorationLine.Underline
    p2.append(underlined)

    p2.append(", ")

    val colored = mason.createTextView(this, TextType.Span)
    colored.append("color")
    colored.color = "#2196F3".toColorInt()
    p2.append(colored)

    p2.append(", and ")

    val boldItalic = mason.createTextView(this, TextType.Span)
    boldItalic.append("bold italic")
    boldItalic.fontWeight = FontFace.NSCFontWeight.Bold
    boldItalic.fontStyle = FontFace.NSCFontStyle.Italic
    p2.append(boldItalic)

    p2.append(" text.")
    root.append(p2)

    // --- H3 heading ---
    val h3 = mason.createTextView(this, TextType.H3)
    h3.append("How it works")
    root.append(h3)

    // --- Paragraph ---
    val p3 = mason.createTextView(this, TextType.P)
    p3.append("The layout tree is computed by ")

    val taffyLink = mason.createTextView(this, TextType.A)
    taffyLink.append("Taffy")
    taffyLink.color = "#1976D2".toColorInt()
    taffyLink.decorationLine = Styles.DecorationLine.Underline
    p3.append(taffyLink)

    p3.append(", a Rust-based layout engine, and the results are applied to native View frames. Text measurement uses platform APIs for pixel-perfect rendering.")
    root.append(p3)

    // --- Blockquote ---
    val bq = mason.createTextView(this, TextType.Blockquote)
    bq.style.border = "0 0 0 3px solid #666666"
    bq.style.padding = Rect(
      top = LengthPercentage.Points(0f),
      right = LengthPercentage.Points(0f),
      bottom = LengthPercentage.Points(0f),
      left = LengthPercentage.Points(12 * density),
    )
    bq.style.margin = Rect(
      top = LengthPercentageAuto.Points(8 * density),
      right = LengthPercentageAuto.Points(0f),
      bottom = LengthPercentageAuto.Points(8 * density),
      left = LengthPercentageAuto.Points(0f),
    )

    val bqText = mason.createTextView(this, TextType.Em)
    bqText.append("\"Any application that can be written in JavaScript, will eventually be written in JavaScript.\"")
    bqText.color = Color.GRAY
    bq.append(bqText)
    root.append(bq)

    // --- Pre/Code block ---
    val h3Code = mason.createTextView(this, TextType.H3)
    h3Code.append("Example")
    root.append(h3Code)

    val pre = mason.createTextView(this, TextType.Pre)
    pre.style.backgroundColor = 0xFFF5F5F5.toInt()
    pre.style.padding = Rect(
      top = LengthPercentage.Points(12 * density),
      right = LengthPercentage.Points(12 * density),
      bottom = LengthPercentage.Points(12 * density),
      left = LengthPercentage.Points(12 * density),
    )
    pre.style.borderRadius = "4px"
    pre.fontSize = 13
    pre.style.fontFamily = "'Courier New', monospace"
    pre.append(
      "val body = mason.createView(context)\n" +
        "val h1 = mason.createTextView(context, TextType.H1)\n" +
        "h1.append(\"Hello World\")\n" +
        "body.append(h1)"
    )
    root.append(pre)
  }
}
