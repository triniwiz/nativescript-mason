package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.view.Choreographer
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.FontFace
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class NumericDemoActivity : AppCompatActivity() {
  private lateinit var mason: Mason
  private var running = AtomicBoolean()
  private var runnable: Choreographer.FrameCallback? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    mason = Mason()
    val density = resources.displayMetrics.density
    val scale = mason.scale
    fun px(dp: Float) = dp * scale

    val root = mason.createScrollView(this)
    root.style.overflowY = Overflow.Scroll

    val container = mason.createView(this)
    container.configure { style ->
      style.display = Display.Block
      style.padding = Rect(
        LengthPercentage.Points(px(16f)),
        LengthPercentage.Zero,
        LengthPercentage.Points(px(16f)),
        LengthPercentage.Zero
      )
      style.background = "#EEF2FF"
    }

    // Title
    val title = mason.createTextView(this, TextType.H1)
    title.textContent = "font-variant-numeric"
    title.configure { style ->
      style.display = Display.Block
      style.fontSize = 22
      style.fontWeight = FontFace.NSCFontWeight.Bold
      style.color = Color.parseColor("#1E293B")
      style.margin = Rect(
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Points(px(16f)),
        LengthPercentageAuto.Zero
      )
    }
    container.addView(title)

    // Timer row
    val timerRow = mason.createView(this)
    timerRow.configure { style ->
      style.display = Display.Flex
      style.flexDirection = FlexDirection.Row
      style.gap = Size(LengthPercentage.Points(px(12f)), LengthPercentage.Zero)
      style.margin = Rect(
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Points(px(24f)),
        LengthPercentageAuto.Zero
      )
    }

    fun timerCard(
      label: String,
      tabular: Boolean
    ): Pair<View, org.nativescript.mason.masonkit.TextView> {
      val card = mason.createView(this@NumericDemoActivity)
      card.configure { style ->
        style.display = Display.Block
        style.flexGrow = 1f
        style.background = "#FFFFFF"
        style.borderRadius = "12"
        style.padding = Rect(
          LengthPercentage.Points(px(16f)),
          LengthPercentage.Points(px(16f)),
          LengthPercentage.Points(px(16f)),
          LengthPercentage.Points(px(16f))
        )
      }

      val timeText = mason.createTextView(this@NumericDemoActivity)
      timeText.textContent = "00:00.00"
      timeText.configure { style ->
        style.display = Display.Block
        style.fontSize = 32
        style.fontWeight = FontFace.NSCFontWeight.Bold
        style.color = Color.parseColor("#1E293B")
        style.textAlign = TextAlign.Center
        if (tabular) {
          style.fontVariantNumericString = "tabular-nums"
        }
      }
      card.addView(timeText)

      val badge = mason.createView(this@NumericDemoActivity)
      badge.configure { style ->
        style.display = Display.Flex
        style.flexDirection = FlexDirection.Row
        style.gap = Size(LengthPercentage.Points(px(6f)), LengthPercentage.Zero)
        style.margin = Rect(
          LengthPercentageAuto.Points(px(8f)),
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Zero
        )
        style.alignItems = org.nativescript.mason.masonkit.enums.AlignItems.Center
        style.justifyContent = org.nativescript.mason.masonkit.enums.JustifyContent.Center
      }

      val dot = mason.createTextView(this@NumericDemoActivity)
      dot.textContent = if (tabular) "✅" else "❌"
      dot.configure { style ->
        style.display = Display.InlineBlock
        style.fontSize = 14
      }
      badge.addView(dot)

      val labelText = mason.createTextView(this@NumericDemoActivity)
      labelText.textContent = label
      labelText.configure { style ->
        style.display = Display.InlineBlock
        style.fontSize = 14
        style.color = Color.parseColor("#64748B")
      }
      badge.addView(labelText)

      card.addView(badge)
      return Pair(card, timeText)
    }

    val (leftCard, leftTime) = timerCard("w/o tabular-nums", false)
    val (rightCard, rightTime) = timerCard("w/ tabular-nums", true)
    timerRow.addView(leftCard)
    timerRow.addView(rightCard)
    container.addView(timerRow)

    // Showcase grid
    val variants = listOf(
      "lining-nums" to "0123456789",
      "oldstyle-nums" to "0123456789",
      "tabular-nums" to "111\n888",
      "proportional-nums" to "111\n888",
      "diagonal-fractions" to "1/2 3/4 5/6",
      "stacked-fractions" to "1/2 3/4 5/6",
      "ordinal" to "1st 2nd 3rd",
      "slashed-zero" to "0O 00 08",
    )

    for ((variant, sample) in variants) {
      val row = mason.createView(this)
      row.configure { style ->
        style.display = Display.Block
        style.background = "#FFFFFF"
        style.borderRadius = "8"
        style.padding = Rect(
          LengthPercentage.Points(px(12f)),
          LengthPercentage.Points(px(12f)),
          LengthPercentage.Points(px(12f)),
          LengthPercentage.Points(px(12f))
        )
        style.margin = Rect(
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Points(px(8f)),
          LengthPercentageAuto.Zero
        )
      }

      val variantLabel = mason.createTextView(this)
      variantLabel.textContent = variant
      variantLabel.configure { style ->
        style.display = Display.Block
        style.fontSize = 12
        style.fontWeight = FontFace.NSCFontWeight.SemiBold
        style.color = Color.parseColor("#6366F1")
        style.margin = Rect(
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Zero,
          LengthPercentageAuto.Points(px(4f)),
          LengthPercentageAuto.Zero
        )
      }
      row.addView(variantLabel)

      val sampleText = mason.createTextView(this)
      sampleText.textContent = sample
      sampleText.configure { style ->
        style.display = Display.Block
        style.fontSize = 24
        style.color = Color.parseColor("#1E293B")
        style.fontVariantNumericString = variant
      }
      row.addView(sampleText)

      container.addView(row)
    }

    root.addView(container)


    enableEdgeToEdge()

    ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      root.style.setPadding(
        0, systemBars.top + 24,
        0, 0
      )
      //layout.setPadding(0,0,0, systemBars.bottom + 24)
      insets
    }

    setContentView(root)
    running.set(true)
    val startTime = System.currentTimeMillis()
    runnable = object : Choreographer.FrameCallback {
      override fun doFrame(p0: Long) {
        if (!running.get()) return

        val elapsed = (System.currentTimeMillis() - startTime) / 1000.0
        val mins = (elapsed.toInt()) / 60
        val secs = (elapsed.toInt()) % 60
        val hundredths = ((elapsed - Math.floor(elapsed)) * 100).toInt()
        val str = String.format(Locale.getDefault(), "%02d:%02d.%02d", mins, secs, hundredths)

        leftTime.textContent = str
        rightTime.textContent = str

        Choreographer.getInstance().postFrameCallback(runnable)

      }
    }
    Choreographer.getInstance().postFrameCallback(runnable)

  }

  override fun onPause() {
    running.set(false)
    super.onPause()
  }

  override fun onDestroy() {
    running.set(false)
    super.onDestroy()
  }
}
