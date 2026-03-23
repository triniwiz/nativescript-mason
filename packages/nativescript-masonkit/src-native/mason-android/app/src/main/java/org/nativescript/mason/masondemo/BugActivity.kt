package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.Log
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Node
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.View
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

    val body = mason.createView(this)
    body.display = org.nativescript.mason.masonkit.enums.Display.Flex
    // Ensure the Mason body expands to fill the parent
    body.style.flexGrow = 1f
    body.style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))

    ViewCompat.setOnApplyWindowInsetsListener(body) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      body.style.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
      insets
    }

    // Reproduce compact red-tile grid
    val container = mason.createView(this)
    container.display = org.nativescript.mason.masonkit.enums.Display.Flex
    container.flexDirection = org.nativescript.mason.masonkit.enums.FlexDirection.Row
    container.style.flexWrap = org.nativescript.mason.masonkit.enums.FlexWrap.Wrap
    container.style.gap = Size(LengthPercentage.Points(0f), LengthPercentage.Points(0f))
    // Make sure rows pack toward the start (top) rather than spreading out.
    container.style.alignContent = org.nativescript.mason.masonkit.enums.AlignContent.FlexStart
    container.style.alignItems = org.nativescript.mason.masonkit.enums.AlignItems.FlexStart

    // Let the pseudo-grid container expand to fill available body space
    container.style.flexGrow = 1f

    val boxDp = 10f
    var boxSize = toPx(boxDp)
    if (boxSize <= 0f) boxSize = 1f
    val maxWidthPx = metrics.widthPixels.toFloat()
    val maxHeightPx = metrics.heightPixels.toFloat() + toPx(50f)

    // Ensure the container can grow/fill so wrap layout is computed.
    container.style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    container.style.flexGrow = 1f

    val cols = 1.coerceAtLeast(floor((maxWidthPx / boxSize).toDouble()).toInt())
    var rows = 1.coerceAtLeast(floor((maxHeightPx / boxSize).toDouble()).toInt())


    val items = mutableListOf<View>()
    for (r in 0 until rows) {
      for (c in 0 until cols) {
        val v = mason.createView(this)
        v.style.setSizePoints(boxSize, boxSize)
        val colorInt = Random.nextInt(0x1000000)
        val hex = this.hex(0xFFFFFF and colorInt)
        v.style.background = hex
        v.style.border = "1px solid #000000"
        items.add(v)
      }
    }

    container.append(items)

    body.addView(container)
    setContentView(body)
  }
}
