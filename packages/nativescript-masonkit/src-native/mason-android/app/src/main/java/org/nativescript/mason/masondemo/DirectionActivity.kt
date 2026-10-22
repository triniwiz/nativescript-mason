package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.JustifyContent

class DirectionActivity : AppCompatActivity() {
  private val tag = "DirectionActivity"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val mason = Mason.shared

    val root = mason.createView(this)
    root.setBackgroundColor(Color.parseColor("#F5F5F5"))
    root.style.display = Display.Flex
    root.style.flexDirection = FlexDirection.Column
    root.style.justifyContent = JustifyContent.FlexStart
    root.style.alignItems = AlignItems.Stretch
    root.style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    root.setPadding(20f, 20f, 20f, 20f)

    val title = mason.createTextView(this)
    title.textContent = "Direction Demo"
    title.fontSize = 22f
    title.style.color = Color.parseColor("#222222")
    title.style.margin = Rect(
      LengthPercentageAuto.Points(0f),
      LengthPercentageAuto.Points(0f),
      LengthPercentageAuto.Points(10f),
      LengthPercentageAuto.Points(0f)
    )

    val subtitle = mason.createTextView(this)
    subtitle.textContent = "Toggle direction to see row start move between left and right."
    subtitle.fontSize = 14f
    subtitle.style.color = Color.parseColor("#555555")
    subtitle.style.margin = Rect(
      LengthPercentageAuto.Points(0f),
      LengthPercentageAuto.Points(0f),
      LengthPercentageAuto.Points(12f),
      LengthPercentageAuto.Points(0f)
    )

    val status = mason.createTextView(this)
    status.fontSize = 16f
    status.style.color = Color.parseColor("#0F766E")
    status.style.margin = Rect(
      LengthPercentageAuto.Points(0f),
      LengthPercentageAuto.Points(0f),
      LengthPercentageAuto.Points(12f),
      LengthPercentageAuto.Points(0f)
    )

    val toggle = Button(this)
    toggle.layoutParams = org.nativescript.mason.masonkit.View.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )

    val toggleRowDirection = Button(this)
    toggleRowDirection.layoutParams = org.nativescript.mason.masonkit.View.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )

    val demoRow = mason.createView(this)
    demoRow.setBackgroundColor(Color.WHITE)
    demoRow.style.display = Display.Flex
    demoRow.style.flexDirection = FlexDirection.Row
    demoRow.style.justifyContent = JustifyContent.FlexStart
    demoRow.style.alignItems = AlignItems.Center
    demoRow.style.size = Size(Dimension.Percent(1f), Dimension.Points(120f))
    demoRow.setGap(10f, 0f)
    demoRow.setPadding(12f, 12f, 12f, 12f)

    val colors = listOf("#EF4444", "#3B82F6", "#10B981", "#F59E0B")
    val labels = listOf("A", "B", "C", "D")

    for (i in labels.indices) {
      val card = mason.createView(this)
      card.style.size = Size(Dimension.Points(72f), Dimension.Points(72f))
      card.style.display = Display.Flex
      card.style.flexDirection = FlexDirection.Column
      card.style.justifyContent = JustifyContent.Center
      card.style.alignItems = AlignItems.Center
      card.setBackgroundColor(Color.parseColor(colors[i]))

      val text = mason.createTextView(this)
      text.textContent = labels[i]
      text.fontSize = 22f
      text.style.color = Color.WHITE
      card.addView(text)

      demoRow.addView(card)
    }

    var isRtl = false
    var isRowReverse = false

    fun applyDirection() {
      val direction = if (isRtl) Direction.RTL else Direction.LTR
      val rowDirection = if (isRowReverse) FlexDirection.RowReverse else FlexDirection.Row
      Log.d(tag, "applyDirection start isRtl=$isRtl direction=$direction")
      root.direction = direction
      demoRow.direction = direction
      demoRow.flexDirection = rowDirection
      root.setBackgroundColor(if (isRtl) Color.parseColor("#FFF7ED") else Color.parseColor("#F5F5F5"))
      status.textContent = "Current direction: ${if (isRtl) "RTL" else "LTR"}, row: ${if (isRowReverse) "Row-Reverse" else "Row"}"
      toggle.text = if (isRtl) "Switch to LTR" else "Switch to RTL"
      toggleRowDirection.text = if (isRowReverse) "Switch to Row" else "Switch to Row-Reverse"
      Log.d(
        tag,
        "applyDirection end rootLayoutDirection=${root.layoutDirection} demoRowLayoutDirection=${demoRow.layoutDirection} demoRowFlexDirection=${demoRow.flexDirection}"
      )
    }

    toggle.setOnClickListener {
      Log.d(tag, "toggle clicked current isRtl=$isRtl")
      isRtl = !isRtl
      applyDirection()
    }

    toggleRowDirection.setOnClickListener {
      Log.d(tag, "toggle row clicked current isRowReverse=$isRowReverse")
      isRowReverse = !isRowReverse
      applyDirection()
    }

    root.addView(title)
    root.addView(subtitle)
    root.addView(status)
    root.addView(toggle)
    root.addView(toggleRowDirection)
    root.addView(demoRow)

    applyDirection()
    setContentView(root)
  }
}