package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Button
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Node
import org.nativescript.mason.masonkit.PseudoState
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.StateKeys
import org.nativescript.mason.masonkit.StyleKeys
import org.nativescript.mason.masonkit.enums.BorderStyle as MasonBorderStyle
import org.nativescript.mason.masonkit.enums.TextAlign
import java.nio.ByteBuffer
import androidx.core.graphics.toColorInt

class PseudoDemoActivity : AppCompatActivity() {
  private lateinit var mason: Mason

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    mason = Mason()

    val scrollView = ScrollView(this)

    val layout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(24, 48, 24, 24)
    }

    val density = resources.displayMetrics.density
    val scale = mason.scale

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    fun sectionHeader(text: String): TextView {
      return TextView(this).apply {
        this.text = text
        textSize = 12f
        setTextColor(Color.parseColor("#6B7280"))
        setPadding(0, (20 * density).toInt(), 0, (6 * density).toInt())
      }
    }

    fun ByteBuffer.setBg(color: Int) {
      putInt(StyleKeys.BACKGROUND_COLOR, color)
      put(StyleKeys.BACKGROUND_COLOR_STATE, 1)
      Node.markPseudoSet(this, StateKeys.BACKGROUND_COLOR)
    }

    fun ByteBuffer.setFontColor(color: Int) {
      putInt(StyleKeys.FONT_COLOR, color)
      put(StyleKeys.FONT_COLOR_STATE, 1)
      Node.markPseudoSet(this, StateKeys.FONT_COLOR)
    }

    fun ByteBuffer.setBorderColor(color: Int) {
      putInt(StyleKeys.BORDER_LEFT_COLOR, color)
      putInt(StyleKeys.BORDER_RIGHT_COLOR, color)
      putInt(StyleKeys.BORDER_TOP_COLOR, color)
      putInt(StyleKeys.BORDER_BOTTOM_COLOR, color)
      Node.markPseudoSet(this, StateKeys.BORDER_COLOR)
    }

    fun ByteBuffer.setBorderWidth(px: Float) {
      for ((t, v) in listOf(
        StyleKeys.BORDER_LEFT_TYPE to StyleKeys.BORDER_LEFT_VALUE,
        StyleKeys.BORDER_RIGHT_TYPE to StyleKeys.BORDER_RIGHT_VALUE,
        StyleKeys.BORDER_TOP_TYPE to StyleKeys.BORDER_TOP_VALUE,
        StyleKeys.BORDER_BOTTOM_TYPE to StyleKeys.BORDER_BOTTOM_VALUE,
      )) {
        put(t, 0)
        putFloat(v, px)
      }
      Node.markPseudoSet(this, StateKeys.BORDER)
    }

    fun ByteBuffer.setBorderRadius(px: Float) {
      for (xType in intArrayOf(
        StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE,
        StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE,
        StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE,
        StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE
      )) {
        put(xType, 0); putFloat(xType + 1, px)
      }
      for (yType in intArrayOf(
        StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE,
        StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE,
        StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE,
        StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE
      )) {
        put(yType, 0); putFloat(yType + 1, px)
      }
      Node.markPseudoSet(this, StateKeys.BORDER_RADIUS)
    }

    fun ByteBuffer.setBorderStyle(style: MasonBorderStyle) {
      val v = style.value
      put(StyleKeys.BORDER_LEFT_STYLE, v)
      put(StyleKeys.BORDER_RIGHT_STYLE, v)
      put(StyleKeys.BORDER_TOP_STYLE, v)
      put(StyleKeys.BORDER_BOTTOM_STYLE, v)
      Node.markPseudoSet(this, StateKeys.BORDER_STYLE)
    }

    fun styledButton(
      label: String,
      bg: String? = null,
      fg: String? = null,
      border: String? = null,
      radius: String? = null,
      paddingH: Float = 16f,
      paddingV: Float = 10f,
    ): Button {
      return Button(this, mason).apply {
        textContent = label
        configure { style ->
          bg?.let { style.background = it }
          fg?.let { style.color = it.toColorInt() }
          border?.let { style.border = it }
          radius?.let { style.borderRadius = it }
          style.padding = Rect(
            LengthPercentage.Points(paddingV * scale),
            LengthPercentage.Points(paddingH * scale),
            LengthPercentage.Points(paddingV * scale),
            LengthPercentage.Points(paddingH * scale),
          )
          style.textAlign = TextAlign.Center
        }
      }
    }

    // ===============================================================
    // 1. Primary Button (Indigo)
    // ===============================================================
    layout.addView(sectionHeader("Primary Button"))

    val primary = styledButton(
      "Get Started",
      bg = "#4F46E5", fg = "#FFFFFF",
      border = "1 solid #4F46E5", radius = "8",
    )
    layout.addView(primary, matchWrap())

    primary.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#4338CA"))
    }
    primary.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#3730A3"))
    }
    primary.node.preparePseudoBuffer(PseudoState.FOCUS.mask).apply {
      setBorderColor(Color.parseColor("#818CF8"))
      setBorderWidth(2f * density)
    }

    // ===============================================================
    // 2. Outline / Ghost Button
    // ===============================================================
    layout.addView(sectionHeader("Outline Button"))

    val outline = styledButton(
      "Learn More",
      bg = "#00000000", fg = "#4F46E5",
      border = "1 solid #4F46E5", radius = "8",
    )
    layout.addView(outline, matchWrap())

    outline.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#EEF2FF"))
    }
    outline.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#4F46E5"))
      setFontColor(Color.WHITE)
    }

    // ===============================================================
    // 3. Danger / Destructive Button
    // ===============================================================
    layout.addView(sectionHeader("Danger Button"))

    val danger = styledButton(
      "Delete Account",
      bg = "#DC2626", fg = "#FFFFFF",
      border = "0 solid #DC2626", radius = "8",
    )
    layout.addView(danger, matchWrap())

    danger.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#B91C1C"))
    }
    danger.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#991B1B"))
    }

    // ===============================================================
    // 4. Success Button
    // ===============================================================
    layout.addView(sectionHeader("Success Button"))

    val success = styledButton(
      "Confirm Payment",
      bg = "#059669", fg = "#FFFFFF",
      border = "0 solid #059669", radius = "8",
    )
    layout.addView(success, matchWrap())

    success.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#047857"))
    }
    success.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#065F46"))
    }

    // ===============================================================
    // 5. Pill Button (rounded)
    // ===============================================================
    layout.addView(sectionHeader("Pill Button"))

    val pill = styledButton(
      "Subscribe",
      bg = "#7C3AED", fg = "#FFFFFF",
      border = "0 solid #7C3AED", radius = "999",
      paddingH = 24f, paddingV = 10f,
    )
    layout.addView(pill, matchWrap())

    pill.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#6D28D9"))
    }
    pill.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#5B21B6"))
      setBorderRadius(12f * density)
    }

    // ===============================================================
    // 6. Ghost Button (minimal, text-only feel)
    // ===============================================================
    layout.addView(sectionHeader("Ghost Button"))

    val ghost = styledButton(
      "Cancel",
      bg = "#00000000", fg = "#6B7280",
      border = "0 solid #00000000", radius = "6",
    )
    layout.addView(ghost, matchWrap())

    ghost.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#F3F4F6"))
      setFontColor(Color.parseColor("#111827"))
    }
    ghost.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#E5E7EB"))
      setFontColor(Color.parseColor("#111827"))
    }

    // ===============================================================
    // 7. Dark Mode Button
    // ===============================================================
    layout.addView(sectionHeader("Dark Mode Button"))

    val dark = styledButton(
      "Sign In",
      bg = "#1F2937", fg = "#F9FAFB",
      border = "1 solid #374151", radius = "8",
    )
    layout.addView(dark, matchWrap())

    dark.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#374151"))
      setBorderColor(Color.parseColor("#4B5563"))
    }
    dark.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#111827"))
      setBorderColor(Color.parseColor("#6366F1"))
    }

    // ===============================================================
    // 8. Outline Danger (hover fills, active deepens)
    // ===============================================================
    layout.addView(sectionHeader("Outline Danger"))

    val outlineDanger = styledButton(
      "Remove Item",
      bg = "#00000000", fg = "#DC2626",
      border = "1 solid #DC2626", radius = "8",
    )
    layout.addView(outlineDanger, matchWrap())

    outlineDanger.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#FEF2F2"))
    }
    outlineDanger.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#DC2626"))
      setFontColor(Color.WHITE)
      setBorderColor(Color.parseColor("#991B1B"))
    }

    // ===============================================================
    // 9. Focus Ring Demo
    // ===============================================================
    layout.addView(sectionHeader("Focus Ring (use D-pad / Tab)"))

    val focusBtn = styledButton(
      "Tab to Focus Me",
      bg = "#FFFFFF", fg = "#1F2937",
      border = "1 solid #D1D5DB", radius = "8",
    )
    layout.addView(focusBtn, matchWrap())

    focusBtn.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#F9FAFB"))
      setBorderColor(Color.parseColor("#9CA3AF"))
    }
    focusBtn.node.preparePseudoBuffer(PseudoState.FOCUS.mask).apply {
      setBorderColor(Color.parseColor("#6366F1"))
      setBorderWidth(2f * density)
    }
    focusBtn.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#F3F4F6"))
    }

    // ===============================================================
    // 10. Disabled States
    // ===============================================================
    layout.addView(sectionHeader("Disabled States"))

    val disabledPrimary = styledButton(
      "Unavailable",
      bg = "#4F46E5", fg = "#FFFFFF",
      border = "0 solid #4F46E5", radius = "8",
    ).apply { isEnabled = false }
    layout.addView(disabledPrimary, matchWrap())

    disabledPrimary.node.preparePseudoBuffer(PseudoState.DISABLED.mask).apply {
      setBg(Color.parseColor("#C7D2FE"))
      setFontColor(Color.parseColor("#A5B4FC"))
      setBorderColor(Color.parseColor("#C7D2FE"))
    }

    val disabledOutline = styledButton(
      "Coming Soon",
      bg = "#00000000", fg = "#4F46E5",
      border = "1 solid #4F46E5", radius = "8",
    ).apply { isEnabled = false }
    layout.addView(disabledOutline, matchWrap())

    disabledOutline.node.preparePseudoBuffer(PseudoState.DISABLED.mask).apply {
      setBg(Color.parseColor("#F9FAFB"))
      setFontColor(Color.parseColor("#D1D5DB"))
      setBorderColor(Color.parseColor("#E5E7EB"))
      setBorderStyle(MasonBorderStyle.Dashed)
    }

    // ===============================================================
    // 11. Cascade: hover + focus + active
    // ===============================================================
    layout.addView(sectionHeader("Full Cascade (hover > focus > active)"))

    val cascade = styledButton(
      "Hover, Focus, or Press",
      bg = "#FFFFFF", fg = "#1F2937",
      border = "1 solid #D1D5DB", radius = "8",
    )
    layout.addView(cascade, matchWrap())

    // hover: subtle tint
    cascade.node.preparePseudoBuffer(PseudoState.HOVER.mask).apply {
      setBg(Color.parseColor("#EEF2FF"))
      setBorderColor(Color.parseColor("#A5B4FC"))
      setFontColor(Color.parseColor("#4F46E5"))
    }
    // focus: indigo ring
    cascade.node.preparePseudoBuffer(PseudoState.FOCUS.mask).apply {
      setBorderColor(Color.parseColor("#6366F1"))
      setBorderWidth(2f * density)
    }
    // active: fills solid (overrides hover + focus per CSS specificity)
    cascade.node.preparePseudoBuffer(PseudoState.ACTIVE.mask).apply {
      setBg(Color.parseColor("#4F46E5"))
      setFontColor(Color.WHITE)
      setBorderColor(Color.parseColor("#4338CA"))
    }

    // ---------------------------------------------------------------
    // Wire up
    // ---------------------------------------------------------------
    scrollView.addView(layout, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.MATCH_PARENT
    ))

    enableEdgeToEdge()

    ViewCompat.setOnApplyWindowInsetsListener(scrollView) { _, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      scrollView.setPadding(
        systemBars.left + 24, systemBars.top + 24,
        systemBars.right + 24, 0
      )
      layout.setPadding(0,0,0, systemBars.bottom + 24)
      insets
    }

    setContentView(scrollView)
  }

  private fun matchWrap(): LinearLayout.LayoutParams {
    return LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply {
      bottomMargin = (8 * 1).toInt()
    }
  }

  override fun onDestroy() {
    super.onDestroy()
  }
}
