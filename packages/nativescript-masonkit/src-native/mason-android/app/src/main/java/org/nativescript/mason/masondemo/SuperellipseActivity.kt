package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.Log
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.toColorInt
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.TextAlign

/**
 * Demonstrates the superellipse (corner-shape) CSS property.
 */
class SuperellipseActivity : AppCompatActivity() {

  private val mason = Mason()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    mason.setDeviceScale(resources.displayMetrics.density)

    val scale = mason.scale
    val density = resources.displayMetrics.density
    val hPad = 16 * scale

    val layout = mason.createScrollView(this)
    // Only vertical scrolling — use EXACTLY width so children stretch.
    layout.style.overflowX = Overflow.Hidden

    // Block container with horizontal padding — matches the iOS pattern.
    // Children with Auto width stretch to fill the content box.
    val container = mason.createView(this)
    container.configure { s ->
      s.display = Display.Block
      s.padding = Rect(
        LengthPercentage.Points(0f),
        LengthPercentage.Points(hPad),
        LengthPercentage.Points(0f),
        LengthPercentage.Points(hPad),
      )
    }

    fun sectionHeader(label: String): TextView {
      val header = mason.createTextView(this)
      header.textContent = label
      header.configure { s ->
        s.color = "#9CA3AF".toColorInt()
        s.fontSize = 11
      }
      header.style.margin = Rect(
        top = LengthPercentageAuto.Points(12 * scale),
        right = LengthPercentageAuto.Zero,
        bottom = LengthPercentageAuto.Points(4 * scale),
        left = LengthPercentageAuto.Zero,
      )
      return header
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. Side-by-Side Comparison: round vs squircle
    // ─────────────────────────────────────────────────────────────────
    container.addView(sectionHeader("CIRCULAR VS SQUIRCLE"))

    val comparison = mason.createView(this)
    comparison.configure { s ->
      s.display = Display.Flex
      s.flexDirection = FlexDirection.Row
      s.gap = Size(LengthPercentage.Points(8 * scale), LengthPercentage.Points(8 * scale))
    }

    val circularCard = mason.createView(this)
    circularCard.configure { s ->
      s.display = Display.Flex
      s.justifyContent = JustifyContent.Center
      s.alignItems = AlignItems.Center
      s.flexGrow = 1f
      s.flexBasis = Dimension.Points(0f)
      s.size = Size(Dimension.Auto, Dimension.Points(140 * scale))
      s.backgroundColor = "#EEF2FF".toColorInt()
      s.border = "2 solid #6366F1"
      s.borderRadius = "24"
      s.cornerShape = "round"
    }
    val circLabel = mason.createTextView(this)
    circLabel.textContent = "corner-shape: round"
    circLabel.configure { s ->
      s.textAlign = TextAlign.Center
      s.color = "#4338CA".toColorInt()
      s.fontSize = 12
    }
    circularCard.addView(circLabel)

    val squircleCard = mason.createView(this)
    squircleCard.configure { s ->
      s.display = Display.Flex
      s.justifyContent = JustifyContent.Center
      s.alignItems = AlignItems.Center
      s.flexGrow = 1f
      s.flexBasis = Dimension.Points(0f)
      s.size = Size(Dimension.Auto, Dimension.Points(140 * scale))
      s.backgroundColor = "#F0FDF4".toColorInt()
      s.border = "2 solid #22C55E"
      s.borderRadius = "24"
      s.cornerShape = "squircle"
    }
    val sqLabel = mason.createTextView(this)
    sqLabel.textContent = "corner-shape: squircle"
    sqLabel.configure { s ->
      s.textAlign = TextAlign.Center
      s.color = "#15803D".toColorInt()
      s.fontSize = 12
    }
    squircleCard.addView(sqLabel)

    comparison.addView(circularCard)
    comparison.addView(squircleCard)
    container.addView(comparison)

    // ─────────────────────────────────────────────────────────────────
    // 2. Exponent Spectrum
    // ─────────────────────────────────────────────────────────────────
    container.addView(sectionHeader("EXPONENT SPECTRUM"))

    data class Sample(val shape: String, val label: String, val bg: String, val border: String)

    val samples = listOf(
      Sample("superellipse(0.3)", "superellipse(0.3) — Super Squircle", "#FFF7ED", "#FB923C"),
      Sample("squircle", "squircle — iOS-style (0.5)", "#F0FDF4", "#22C55E"),
      Sample("superellipse(0.7)", "superellipse(0.7) — Soft Round", "#EFF6FF", "#3B82F6"),
      Sample("round", "round — Circular (default)", "#F5F3FF", "#8B5CF6"),
      Sample("notch", "notch — Exponent 2", "#FDF2F8", "#EC4899"),
      Sample("bevel", "bevel — Exponent 4", "#FEF2F2", "#EF4444"),
    )

    for (sample in samples) {
      val card = mason.createView(this)
      card.configure { s ->
        s.display = Display.Flex
        s.justifyContent = JustifyContent.Center
        s.alignItems = AlignItems.Center
        s.size = Size(Dimension.Auto, Dimension.Points(100 * scale))
        s.backgroundColor = sample.bg.toColorInt()
        s.border = "1 solid ${sample.border}"
        s.borderRadius = "28"
        s.cornerShape = sample.shape
        s.margin = Rect(
          top = LengthPercentageAuto.Zero,
          right = LengthPercentageAuto.Zero,
          bottom = LengthPercentageAuto.Points(8 * scale),
          left = LengthPercentageAuto.Zero,
        )
      }

      val text = mason.createTextView(this)
      text.textContent = sample.label
      text.configure { s ->
        s.textAlign = TextAlign.Center
        s.color = "#374151".toColorInt()
        s.fontSize = 13
      }
      card.addView(text)
      container.addView(card)
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. Per-Corner Mixed Shapes
    // ─────────────────────────────────────────────────────────────────
    container.addView(sectionHeader("PER-CORNER MIXED SHAPES"))

    val mixed = mason.createView(this)
    mixed.configure { s ->
      s.display = Display.Flex
      s.justifyContent = JustifyContent.Center
      s.alignItems = AlignItems.Center
      s.size = Size(Dimension.Auto, Dimension.Points(160 * scale))
      s.backgroundColor = "#1E293B".toColorInt()
      s.border = "2 solid #475569"
      s.borderRadius = "32"
      s.cornerShape = "superellipse(0.3) round squircle notch"
    }

    val mixedLabel = mason.createTextView(this)
    mixedLabel.textContent = "TL: superellipse(0.3)\nTR: round\nBR: squircle\nBL: notch"
    mixedLabel.configure { s ->
      s.textAlign = TextAlign.Center
      s.color = "#E2E8F0".toColorInt()
      s.fontSize = 13
    }
    mixed.addView(mixedLabel)
    container.addView(mixed)

    // ─────────────────────────────────────────────────────────────────
    // 4. App Icon Grid
    // ─────────────────────────────────────────────────────────────────
    container.addView(sectionHeader("APP ICON GRID — SQUIRCLE"))

    val grid = mason.createView(this)
    grid.configure { s ->
      s.display = Display.Flex
      s.flexDirection = FlexDirection.Row
      s.flexWrap = FlexWrap.Wrap
      s.justifyContent = JustifyContent.SpaceBetween
      s.gap = Size(LengthPercentage.Points(8 * scale), LengthPercentage.Points(8 * scale))
    }

    val iconColors = listOf(
      "#FF3B30", "#FF9500", "#FFCC00", "#34C759",
      "#00C7BE", "#007AFF", "#5856D6", "#AF52DE",
    )

    for (color in iconColors) {
      val icon = mason.createView(this)
      icon.configure { s ->
        s.size = Size(Dimension.Points(64 * scale), Dimension.Points(64 * scale))
        s.backgroundColor = color.toColorInt()
        s.borderRadius = "16"
        s.cornerShape = "squircle"
      }
      grid.addView(icon)
    }
    container.addView(grid)

    // ─────────────────────────────────────────────────────────────────
    // 5. Notification Banners
    // ─────────────────────────────────────────────────────────────────
    container.addView(sectionHeader("NOTIFICATION BANNERS"))

    data class Banner(val text: String, val bg: String, val border: String, val fg: String)

    val banners = listOf(
      Banner("Payment processed successfully", "#F0FDF4", "#BBF7D0", "#166534"),
      Banner("Your session will expire in 5 minutes", "#FFFBEB", "#FDE68A", "#92400E"),
      Banner("Unable to connect to server", "#FEF2F2", "#FECACA", "#991B1B"),
    )

    for (b in banners) {
      val banner = mason.createView(this)
      banner.configure { s ->
        s.display = Display.Flex
        s.alignItems = AlignItems.Center
        s.backgroundColor = b.bg.toColorInt()
        s.border = "1 solid ${b.border}"
        s.borderRadius = "14"
        s.cornerShape = "squircle"
        s.margin = Rect(
          top = LengthPercentageAuto.Zero,
          right = LengthPercentageAuto.Zero,
          bottom = LengthPercentageAuto.Points(8 * scale),
          left = LengthPercentageAuto.Zero,
        )
        s.padding = Rect(
          LengthPercentage.Points(8 * scale),
          LengthPercentage.Points(12 * scale),
          LengthPercentage.Points(8 * scale),
          LengthPercentage.Points(12 * scale),
        )
      }

      val bannerText = mason.createTextView(this)
      bannerText.textContent = b.text
      bannerText.configure { s ->
        s.color = b.fg.toColorInt()
        s.fontSize = 14
      }
      banner.addView(bannerText)
      container.addView(banner)
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. Pill Buttons
    // ─────────────────────────────────────────────────────────────────
    container.addView(sectionHeader("PILL BUTTONS"))

    val pillRow = mason.createView(this)
    pillRow.configure { s ->
      s.display = Display.Flex
      s.flexDirection = FlexDirection.Row
      s.gap = Size(LengthPercentage.Points(8 * scale), LengthPercentage.Points(8 * scale))
    }

    fun pillButton(label: String, bg: String, fg: String, shape: String): View {
      val pill = mason.createView(this)
      pill.configure { s ->
        s.display = Display.Flex
        s.justifyContent = JustifyContent.Center
        s.alignItems = AlignItems.Center
        s.flexGrow = 1f
        s.flexBasis = Dimension.Points(0f)
        s.size = Size(Dimension.Auto, Dimension.Points(44 * scale))
        s.backgroundColor = bg.toColorInt()
        s.borderRadius = "999"
        s.cornerShape = shape
        s.padding = Rect(
          LengthPercentage.Points(0f),
          LengthPercentage.Points(16 * scale),
          LengthPercentage.Points(0f),
          LengthPercentage.Points(16 * scale),
        )
      }

      val text = mason.createTextView(this)
      text.textContent = label
      text.configure { s ->
        s.color = fg.toColorInt()
        s.fontSize = 14
      }
      pill.addView(text)
      return pill
    }

    pillRow.addView(pillButton("Circular", "#4F46E5", "#FFFFFF", "round"))
    pillRow.addView(pillButton("Squircle", "#059669", "#FFFFFF", "squircle"))
    container.addView(pillRow)

    // ─────────────────────────────────────────────────────────────────
    // Wire up: add the container to the scroll view
    // ─────────────────────────────────────────────────────────────────
    layout.addView(container)

    enableEdgeToEdge()

    ViewCompat.setOnApplyWindowInsetsListener(layout) { view, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      layout.style.setPadding(
        0,
        systemBars.top + (16 * density).toInt(),
        0,
        systemBars.bottom + (16 * density).toInt()
      )
      insets
    }

    setContentView(layout)
  }
}
