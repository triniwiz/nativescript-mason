package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.StyleKeys
import org.nativescript.mason.masonkit.enums.BorderStyle
import kotlin.math.floor
import kotlin.random.Random

class BugActivity : AppCompatActivity() {
  val mason = Mason.shared
  lateinit var metrics: android.util.DisplayMetrics
  fun toPx(dip: Float): Float {
    return dip * metrics.density
  }

  private val digits = "0123456789ABCDEF"

  fun hex(color: Int): String {
    val chars = CharArray(7)
    chars[0] = '#'
    for (i in 0 until 6) {
      val shift = (5 - i) * 4
      chars[i + 1] = digits[(color shr shift) and 0xF]
    }
    return String(chars)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    metrics = resources.displayMetrics
    mason.setDeviceScale(metrics.density)

    enableEdgeToEdge()

    val root = android.widget.LinearLayout(this)

    ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
      insets
    }

    val body = mason.createView(this)

    // Reproduce compact red-tile grid
    val container = mason.createView(this)
    container.display = org.nativescript.mason.masonkit.enums.Display.Flex
    container.flexDirection = org.nativescript.mason.masonkit.enums.FlexDirection.Row
    container.style.flexWrap = org.nativescript.mason.masonkit.enums.FlexWrap.Wrap
    container.style.gap = Size(LengthPercentage.Points(0f), LengthPercentage.Points(0f))

    val boxDp = 10f
    var boxSize = toPx(boxDp)
    if (boxSize <= 0f) boxSize = 1f
    val maxWidthPx = metrics.widthPixels.toFloat()
    val maxHeightPx = metrics.heightPixels.toFloat() + toPx(50f)

    val cols = 1.coerceAtLeast(floor((maxWidthPx / boxSize).toDouble()).toInt())
    var rows = 1.coerceAtLeast(floor((maxHeightPx / boxSize).toDouble()).toInt())


    val MAX_CELLS = 1000
    val total = cols.toLong() * rows.toLong()
    if (total > MAX_CELLS) {
      val newRows = 1.coerceAtLeast((MAX_CELLS / cols))
      Log.w("BugActivity", "Capping grid cells from $total to $MAX_CELLS (rows: $rows -> $newRows)")
      rows = newRows
    }


    for (r in 0 until rows) {
      for (c in 0 until cols) {
        val v = mason.createView(this)
        v.style.setSizePoints(boxSize, boxSize)
        val colorInt = Random.nextInt(0x1000000)
        //val hex = this.hex(0xFFFFFF and colorInt)
        //v.style.background = hex
        v.style.prepareMut()

        v.style.backgroundColor = 0xFFFFFF and colorInt
        v.style.borderLeftStyle = BorderStyle.Solid
        v.style.values.putInt(StyleKeys.BORDER_LEFT_COLOR, Color.BLACK)
        v.style.values.putInt(StyleKeys.BORDER_TOP_COLOR, Color.BLACK)
        v.style.values.putInt(StyleKeys.BORDER_RIGHT_COLOR, Color.BLACK)
        v.style.values.putInt(StyleKeys.BORDER_BOTTOM_COLOR, Color.BLACK)

        v.style.values.put(StyleKeys.BORDER_LEFT_STYLE, BorderStyle.Solid.value)
        v.style.values.put(StyleKeys.BORDER_TOP_STYLE, BorderStyle.Solid.value)
        v.style.values.put(StyleKeys.BORDER_RIGHT_STYLE, BorderStyle.Solid.value)
        v.style.values.put(StyleKeys.BORDER_BOTTOM_STYLE, BorderStyle.Solid.value)

        v.style.values.put(StyleKeys.BORDER_LEFT_TYPE, LengthPercentage.Kind.Points.value)
        v.style.values.putInt(StyleKeys.BORDER_LEFT_VALUE, 1)

        v.style.values.put(StyleKeys.BORDER_TOP_TYPE, LengthPercentage.Kind.Points.value)
        v.style.values.putInt(StyleKeys.BORDER_TOP_VALUE, 1)

        v.style.values.put(StyleKeys.BORDER_RIGHT_TYPE, LengthPercentage.Kind.Points.value)
        v.style.values.putInt(StyleKeys.BORDER_RIGHT_VALUE, 1)

        v.style.values.put(StyleKeys.BORDER_BOTTOM_TYPE, LengthPercentage.Kind.Points.value)
        v.style.values.put(StyleKeys.BORDER_BOTTOM_VALUE, 1)


        // v.style.border = "1px solid #000000"
        container.append(v)
      }
    }

    body.addView(container)
    root.addView(body)
    setContentView(root)
  }
}
