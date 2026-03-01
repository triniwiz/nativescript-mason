package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.toColorInt
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.FontFace
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Li
import org.nativescript.mason.masonkit.ListView
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Scroll
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.Styles
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.TextType

class WebActivity : AppCompatActivity() {
  val mason = Mason.shared
  fun toPx(dip: Float): Float {
    return dip * resources.displayMetrics.density
  }

  lateinit var body: View
  lateinit var root: Scroll
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    body = mason.createView(this)
    root = mason.createScrollView(this)
    body.addView(root)
    root.style.overflowY = Overflow.Scroll
    enableEdgeToEdge()
    setContentView(body)
    ViewCompat.setOnApplyWindowInsetsListener(body) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      body.style.setPadding(
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
    code1.style.backgroundColor = 0xFFE8E8EC.toInt()
    code1.style.borderRadius = "3px"
    code1.style.padding = Rect(
      top = LengthPercentage.Points(1 * density),
      right = LengthPercentage.Points(4 * density),
      bottom = LengthPercentage.Points(1 * density),
      left = LengthPercentage.Points(4 * density),
    )
    p2.append(code1)

    p2.append(", ")

    val code2 = mason.createTextView(this, TextType.Code)
    code2.append("grid")
    code2.style.backgroundColor = 0xFFE8E8EC.toInt()
    code2.style.borderRadius = "3px"
    code2.style.padding = Rect(
      top = LengthPercentage.Points(1 * density),
      right = LengthPercentage.Points(4 * density),
      bottom = LengthPercentage.Points(1 * density),
      left = LengthPercentage.Points(4 * density),
    )
    p2.append(code2)

    p2.append(", and ")

    val code3 = mason.createTextView(this, TextType.Code)
    code3.append("block")
    code3.style.backgroundColor = 0xFFE8E8EC.toInt()
    code3.style.borderRadius = "3px"
    code3.style.padding = Rect(
      top = LengthPercentage.Points(1 * density),
      right = LengthPercentage.Points(4 * density),
      bottom = LengthPercentage.Points(1 * density),
      left = LengthPercentage.Points(4 * density),
    )
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
    // Make the demo visually modern and professional
    root.style.background = "#F7F8FA"

    // Header
    val header = mason.createView(this)
    header.style.background = "#FFFFFF"
    header.style.padding = Rect.withPx(16f, 24f, 16f, 24f)
    header.style.borderRadius = "8px"
    header.style.margin = Rect.withPxAuto(12f, 12f, 0f, 12f)

    val title = mason.createTextView(this, TextType.H1)
    title.append("Mason — Native Web Layout")
    title.color = "#1F2D3D".toColorInt()
    title.fontSize = 22
    header.append(title)

    val subtitle = mason.createTextView(this, TextType.P)
    subtitle.append("Pixel-perfect, CSS-like layout primitives for native apps.")
    subtitle.color = "#65758A".toColorInt()
    subtitle.fontSize = 14
    subtitle.style.margin = Rect.withPxAuto(8f, 0f, 0f, 0f)
    header.append(subtitle)

    root.append(header)

    // Hero card
    val hero = mason.createView(this)
    hero.style.background = "#FFFFFF"
    hero.style.padding = Rect.withPx(24f, 24f, 24f, 24f)
    hero.style.borderRadius = "12px"
    hero.style.margin = Rect.withPxAuto(12f, 12f, 0f, 12f)

    val heroTitle = mason.createTextView(this, TextType.H2)
    heroTitle.append("Build beautiful native layouts with web ergonomics")
    heroTitle.fontSize = 18
    heroTitle.color = "#0F1720".toColorInt()
    hero.append(heroTitle)

    val heroDesc = mason.createTextView(this, TextType.P)
    heroDesc.append("Design once, render everywhere — flexible, performant, and predictable.")
    heroDesc.color = "#6B7280".toColorInt()
    heroDesc.style.margin = Rect.withPxAuto(8f, 0f, 0f, 0f)
    hero.append(heroDesc)

    val ctaRow = mason.createView(this)
    ctaRow.style.margin = Rect.withPxAuto(12f, 0f, 0f, 0f)

    val primary = mason.createButton(this)
    primary.text = "Get Started"
    primary.style.background = "#0B74FF"
    primary.style.color = "#FFFFFF".toColorInt()
    primary.style.padding = Rect.withPx(10f, 18f, 10f, 18f)
    primary.style.borderRadius = "8px"
    ctaRow.append(primary)

    val secondary = mason.createButton(this)
    secondary.text = "View Docs"
    secondary.style.background = "#FFFFFF"
    secondary.style.color = "#0B74FF".toColorInt()
    secondary.style.border = "1px solid #E6EEF8"
    secondary.style.padding = Rect.withPx(10f, 18f, 10f, 18f)
    secondary.style.borderRadius = "8px"
    secondary.style.margin = Rect.withPxAuto(0f, 12f, 0f, 0f)
    ctaRow.append(secondary)

    hero.append(ctaRow)
    root.append(hero)

    // Feature cards
    val featuresRow = mason.createView(this)
    featuresRow.style.margin = Rect.withPxAuto(12f, 12f, 0f, 12f)

    val f1 = mason.createView(this)
    f1.style.background = "#FFFFFF"
    f1.style.padding = Rect.withPx(16f, 16f, 16f, 16f)
    f1.style.borderRadius = "10px"
    f1.style.margin = Rect.withPxAuto(0f, 0f, 0f, 12f)
    val f1t = mason.createTextView(this, TextType.H3)
    f1t.append("CSS-like APIs")
    f1t.fontSize = 15
    f1t.color = "#10203A".toColorInt()
    f1.append(f1t)
    val f1d = mason.createTextView(this, TextType.P)
    f1d.append("Box model, flexbox, inline layout, and rich text styling.")
    f1d.color = "#6B7280".toColorInt()
    f1.append(f1d)

    val f2 = mason.createView(this)
    f2.style.background = "#FFFFFF"
    f2.style.padding = Rect.withPx(16f, 16f, 16f, 16f)
    f2.style.borderRadius = "10px"
    f2.style.margin = Rect.withPxAuto(0f, 12f, 0f, 12f)
    val f2t = mason.createTextView(this, TextType.H3)
    f2t.append("Native Performance")
    f2t.fontSize = 15
    f2t.color = "#10203A".toColorInt()
    f2.append(f2t)
    val f2d = mason.createTextView(this, TextType.P)
    f2d.append("Measured layout and native rendering keep your apps snappy.")
    f2d.color = "#6B7280".toColorInt()
    f2.append(f2d)

    featuresRow.append(f1)
    featuresRow.append(f2)
    root.append(featuresRow)

    // Quote
    val bq = mason.createTextView(this, TextType.Blockquote)
    bq.style.border = "0 0 0 ${3 * density}px solid #0B74FF"
    bq.style.padding = Rect(
      top = LengthPercentage.Points(0f),
      right = LengthPercentage.Points(0f),
      bottom = LengthPercentage.Points(0f),
      left = LengthPercentage.Points(16 * density),
    )
    bq.style.margin = Rect(
      top = LengthPercentageAuto.Points(12 * density),
      right = LengthPercentageAuto.Points(0f),
      bottom = LengthPercentageAuto.Points(12 * density),
      left = LengthPercentageAuto.Points(0f),
    )
    val bqText = mason.createTextView(this, TextType.P)
    bqText.append("\"Design systems + native primitives = delightful apps.\"")
    bqText.color = "#334155".toColorInt()
    bq.append(bqText)
    root.append(bq)

    // Code sample
    val codeHeader = mason.createTextView(this, TextType.H3)
    codeHeader.append("Quick example")
    root.append(codeHeader)

    val pre = mason.createTextView(this, TextType.Pre)
    pre.style.background = "#0F1720"
    pre.style.padding = Rect(
      top = LengthPercentage.Points(12 * density),
      right = LengthPercentage.Points(12 * density),
      bottom = LengthPercentage.Points(12 * density),
      left = LengthPercentage.Points(12 * density),
    )
    pre.style.borderRadius = "8px"
    pre.fontSize = 13
    pre.style.fontFamily = "'Courier New', monospace"
    pre.color = "#E6EEF8".toColorInt()
    pre.append(
      "val view = mason.createView(context)\n" +
        "view.style.background = \"#FFFFFF\"\n" +
        "view.style.padding = Rect(12f,12f,12f,12f)\n" +
        "val h1 = mason.createTextView(context, TextType.H1)\n" +
        "h1.append(\"Hello, Mason\")\n" +
        "view.append(h1)"
    )
    root.append(pre)

    // Footer
    val footer = mason.createTextView(this, TextType.P)
    footer.append("Crafted with care · © Mason 2026")
    footer.color = "#9AA4B2".toColorInt()
    footer.style.margin = Rect.withPxAuto(24f, 0f, 24f, 48f)
    footer.fontSize = 12
    root.append(footer)

    // ============================================================
    // Mixed Display Types
    // ============================================================
    val h3Mixed = mason.createTextView(this, TextType.H3)
    h3Mixed.append("Mixed Display Types")
    root.append(h3Mixed)

    val pMixedDesc = mason.createTextView(this, TextType.P)
    pMixedDesc.append("A flex container holding block, inline-block, and inline-flex children side by side:")
    root.append(pMixedDesc)

    val mixedContainer = mason.createView(this)
    mixedContainer.display = Display.Flex
    mixedContainer.flexDirection = FlexDirection.Row
    mixedContainer.flexWrap = FlexWrap.Wrap
    mixedContainer.style.alignItems = AlignItems.Center
    mixedContainer.style.gap =
      Size(LengthPercentage.Points(8 * density), LengthPercentage.Points(8 * density))
    mixedContainer.style.padding = Rect(
      top = LengthPercentage.Points(8 * density),
      right = LengthPercentage.Points(8 * density),
      bottom = LengthPercentage.Points(8 * density),
      left = LengthPercentage.Points(8 * density),
    )
    mixedContainer.style.background = "#F5F5F5"
    mixedContainer.style.borderRadius = "4px"
    mixedContainer.style.setMarginBottom(8 * density, 1.toByte())

    // Block child
    val blockChild = mason.createView(this)
    blockChild.display = Display.Block
    blockChild.setSize(toPx(60f), toPx(40f))
    blockChild.style.background = "#1565C0"
    blockChild.style.borderRadius = "4px"
    mixedContainer.addView(blockChild)

    // Inline-block child
    val ibChild = mason.createView(this)
    ibChild.display = Display.InlineBlock
    ibChild.setSize(toPx(60f), toPx(40f))
    ibChild.style.background = "#C62828"
    ibChild.style.borderRadius = "4px"
    mixedContainer.addView(ibChild)

    // Inline-flex child with 2 sub-items
    val ifChild = mason.createView(this)
    ifChild.display = Display.InlineFlex
    ifChild.flexDirection = FlexDirection.Column
    ifChild.style.gap =
      Size(LengthPercentage.Points(2 * density), LengthPercentage.Points(2 * density))
    ifChild.style.padding = Rect(
      top = LengthPercentage.Points(4 * density),
      right = LengthPercentage.Points(4 * density),
      bottom = LengthPercentage.Points(4 * density),
      left = LengthPercentage.Points(4 * density),
    )
    ifChild.style.background = "#2E7D32"
    ifChild.style.borderRadius = "4px"
    for (i in 0 until 2) {
      val sub = mason.createView(this)
      sub.setSize(toPx(50f), toPx(16f))
      sub.style.background = "#A5D6A7"
      sub.style.borderRadius = "2px"
      ifChild.addView(sub)
    }
    mixedContainer.addView(ifChild)

    // Inline-grid child with 2x2
    val igChild = mason.createView(this)
    igChild.display = Display.InlineGrid
    igChild.style.gridTemplateColumns = "1fr 1fr"
    igChild.style.gap =
      Size(LengthPercentage.Points(2 * density), LengthPercentage.Points(2 * density))
    igChild.style.padding = Rect(
      top = LengthPercentage.Points(4 * density),
      right = LengthPercentage.Points(4 * density),
      bottom = LengthPercentage.Points(4 * density),
      left = LengthPercentage.Points(4 * density),
    )
    igChild.style.background = "#E65100"
    igChild.style.borderRadius = "4px"
    for (i in 0 until 4) {
      val sub = mason.createView(this)
      sub.setSize(toPx(16f), toPx(16f))
      sub.style.background = "#FFCC80"
      sub.style.borderRadius = "2px"
      igChild.addView(sub)
    }
    mixedContainer.addView(igChild)

    root.append(mixedContainer)

    // Labels
    val pMixedLabels = mason.createTextView(this, TextType.P)
    pMixedLabels.fontSize = 12
    pMixedLabels.append("Blue = block, Red = inline-block, Green = inline-flex (column), Orange = inline-grid (2\u00D72)")
    pMixedLabels.color = Color.GRAY
    root.append(pMixedLabels)

    // ============================================================
    // Unordered List (static items via addView)
    // ============================================================
    val h3UL = mason.createTextView(this, TextType.H3)
    h3UL.append("Unordered List (Static)")
    root.append(h3UL)

    val ul = mason.createListView(this, isOrdered = false)
    ul.style.setMarginBottom(8 * density, 1.toByte())

    val ulItem1 = mason.createListItem(this)
    val ulText1 = mason.createTextView(this, TextType.P)
    ulText1.append("First static item (bullet)")
    ulItem1.append(ulText1)
    ul.addView(ulItem1)

    val ulItem2 = mason.createListItem(this)
    val ulText2 = mason.createTextView(this, TextType.P)
    ulText2.append("Second static item (bullet)")
    ulItem2.append(ulText2)
    ul.addView(ulItem2)

    val ulItem3 = mason.createListItem(this)
    val ulText3 = mason.createTextView(this, TextType.P)
    ulText3.append("Third static item")
    ulItem3.append(ulText3)
    ul.addView(ulItem3)

    ul.reload()
    root.append(ul)

    // ============================================================
    // Ordered List (static + virtual interleaved)
    // ============================================================
    val h3OL = mason.createTextView(this, TextType.H3)
    h3OL.append("Ordered List (Mixed Static + Virtual)")
    root.append(h3OL)

    val pOLDesc = mason.createTextView(this, TextType.P)
    pOLDesc.fontSize = 13
    pOLDesc.append("Static items at positions 0 and 3, virtual items fill the rest:")
    pOLDesc.color = Color.GRAY
    root.append(pOLDesc)

    val ol = mason.createListView(this, isOrdered = true)
    ol.style.setMarginBottom(8 * density, 1.toByte())

    val olItem1 = mason.createListItem(this)
    val olText1 = mason.createTextView(this, TextType.P)
    olText1.append("[Static] Install Mason via Gradle")
    olItem1.append(olText1)
   // ol.addView(olItem1, 0)

    val olItem2 = mason.createListItem(this)
    val olText2 = mason.createTextView(this, TextType.P)
    olText2.append("[Static] Run your layout")
    olItem2.append(olText2)
    //ol.addView(olItem2, 3)

    // 3 virtual items (fill positions 1, 2, 4)
    ol.count = 3
    ol.listener = object : ListView.Listener {
      override fun onCreate(type: Int): Li {
        return mason.createListItem(this@WebActivity)
      }

      override fun onBind(holder: ListView.Holder, index: Int) {
        val virtualData = listOf(
          "[Virtual] Create a layout tree",
          "[Virtual] Add text and views",
          "[Virtual] Call compute()"
        )
        val txt = mason.createTextView(this@WebActivity, TextType.P)
        // Map the virtual index to the data
        val virtualPositions = (0 until ol.count).filter { !ol.staticItems.containsKey(it) }
        val dataIndex = virtualPositions.indexOf(index)
        if (dataIndex in virtualData.indices) {
          txt.append(virtualData[dataIndex])
        }
        holder.view.append(txt)
      }

      override fun getItemViewType(position: Int): Int = 0
    }
    ol.reload()
    root.append(ol)

    // ============================================================
    // Horizontal Rule
    // ============================================================
    val hr = mason.createView(this)
    hr.setSizeHeight(1 * density, 1.toByte())
    hr.setSizeWidth(1f, 2.toByte()) // 100%
    hr.style.background = "#BDBDBD"
    hr.style.setMarginTop(16 * density, 1.toByte())
    hr.style.setMarginBottom(16 * density, 1.toByte())
    root.append(hr)

    // ============================================================
    // Nested Inline Styles
    // ============================================================
    val h3Nested = mason.createTextView(this, TextType.H3)
    h3Nested.append("Nested Inline Styles")
    root.append(h3Nested)

    val pNested = mason.createTextView(this, TextType.P)
    pNested.append("This paragraph has ")

    val nestedStrong = mason.createTextView(this, TextType.Strong)

    val nestedEm = mason.createTextView(this, TextType.Em)
    nestedEm.append("bold italic")
    nestedStrong.append(nestedEm)

    pNested.append(nestedStrong)
    pNested.append(" text, a ")

    val nestedCode = mason.createTextView(this, TextType.Code)
    nestedCode.append("inline code")
    nestedCode.style.backgroundColor = 0xFFE8E8EC.toInt()
    nestedCode.style.borderRadius = "3px"
    nestedCode.style.padding = Rect(
      top = LengthPercentage.Points(1 * density),
      right = LengthPercentage.Points(4 * density),
      bottom = LengthPercentage.Points(1 * density),
      left = LengthPercentage.Points(4 * density),
    )
    pNested.append(nestedCode)

    pNested.append(" snippet, and a ")

    val nestedLink = mason.createTextView(this, TextType.A)
    nestedLink.append("hyperlink")
    nestedLink.color = "#1976D2".toColorInt()
    nestedLink.decorationLine = Styles.DecorationLine.Underline
    pNested.append(nestedLink)

    pNested.append(" all in one line.")
    root.append(pNested)
  }
}
