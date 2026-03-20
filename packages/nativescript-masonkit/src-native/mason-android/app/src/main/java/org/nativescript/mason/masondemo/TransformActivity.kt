package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.DisplayMetrics
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.Overflow

class TransformActivity : AppCompatActivity() {
  lateinit var metrics: DisplayMetrics
  val mason = Mason.shared

  /** Convert dp to layout pixels (device pixels). */
  private fun dp(value: Float): Float = value * metrics.density

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    metrics = resources.displayMetrics
    mason.setDeviceScale(metrics.density)

    enableEdgeToEdge()

    // ── Root Mason view (flex column, full screen) ──────────────────────
    val root = mason.createView(this)
    root.style.display = Display.Flex
    root.style.flexDirection = FlexDirection.Column
    root.style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))

    ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
      val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      // bars.left/top/right/bottom are already in pixels
      root.style.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }

    // ── Preview area (flex: 1, centered) ────────────────────────────────
    val preview = mason.createView(this)
    preview.style.display = Display.Flex
    preview.style.flexGrow = 1f
    preview.style.justifyContent = JustifyContent.Center
    preview.style.alignItems = AlignItems.Center
    preview.style.background = "#F0F0F0"

    // The box that will receive transforms
    val box = mason.createView(this)
    box.style.size = Size(Dimension.Points(dp(240f)), Dimension.Points(dp(140f)))
    box.style.background = "#2196F3"
    box.style.borderRadius = "8px"
    box.style.display = Display.Flex
    box.style.justifyContent = JustifyContent.Center
    box.style.alignItems = AlignItems.Center

    val label = mason.createTextView(this)
    label.textContent = "Transformed"
    label.style.setColor("#FFFFFF")
    label.style.fontSize = 18
    box.addView(label)

    // Default transform
    box.style.transform = "translate(24, 12) rotate(8deg) scale(1.02)"

    preview.addView(box)
    root.addView(preview)

    // ── Controls area ───────────────────────────────────────────────────
    val controls = mason.createView(this)
    controls.style.display = Display.Flex
    controls.style.flexDirection = FlexDirection.Column
    controls.style.setPadding(dp(16f), dp(12f), dp(16f), dp(16f))
    controls.style.gap = Size(
      LengthPercentage.Points(dp(8f)),
      LengthPercentage.Points(dp(8f))
    )

    // Presets row (horizontal scroll)
    val presetsScroll = mason.createScrollView(this)
    presetsScroll.style.overflowX = Overflow.Scroll
    presetsScroll.style.overflowY = Overflow.Hidden

    val presetsRow = mason.createView(this)
    presetsRow.style.display = Display.Flex
    presetsRow.style.flexDirection = FlexDirection.Row
    presetsRow.style.flexWrap = FlexWrap.NoWrap
    presetsRow.style.gap = Size(
      LengthPercentage.Points(dp(8f)),
      LengthPercentage.Points(0f)
    )

    // Input for custom transform
    val transformInput = mason.createInput(this)
    transformInput.value = "translate(24, 12) rotate(8deg) scale(1.02)"
    transformInput.placeholder = "enter transform() or matrix()"
    transformInput.style.flexGrow = 1f
    transformInput.style.minSize =
      Size(Dimension.Points(dp(120f)), Dimension.Auto)


    val presets = listOf(
      "translate(0,0)",
      "rotate(15deg)",
      "scale(1.3)",
      "matrix(1,2,3,4,20,10)",
      "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,30,40,0,1)",
      "translate(40,-10) rotate(-12deg) scale(0.9)"
    )

    for (p in presets) {
      val btn = mason.createButton(this)
      btn.textContent = p
      btn.setOnClickListener {
        box.style.transform = p
        transformInput.value = p
      }
      presetsRow.addView(btn)
    }

    presetsScroll.addView(presetsRow)
    controls.addView(presetsScroll)

    // Input row
    val inputRow = mason.createView(this)
    inputRow.style.display = Display.Flex
    inputRow.style.flexDirection = FlexDirection.Row
    inputRow.style.alignItems = AlignItems.Center
    inputRow.style.gap = Size(
      LengthPercentage.Points(dp(8f)),
      LengthPercentage.Points(0f)
    )

    val applyBtn = mason.createButton(this)
    applyBtn.textContent = "Apply"
    applyBtn.setOnClickListener {
      box.style.transform = transformInput.value
    }

    inputRow.addView(transformInput)
    inputRow.addView(applyBtn)
    controls.addView(inputRow)

    root.addView(controls)

    setContentView(root)
  }
}
