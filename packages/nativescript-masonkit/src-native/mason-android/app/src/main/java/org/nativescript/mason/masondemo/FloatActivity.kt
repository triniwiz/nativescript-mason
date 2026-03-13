package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.DisplayMetrics
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Element
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Float as CSSFloat

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
      it.overflowY = Overflow.Scroll
      it.setSizeWidth(Dimension.Percent(1f))
      it.setSizeHeight(Dimension.Percent(1f))
      it.padding = Rect.uniform(LengthPercentage.Points(16f * scale))
    }


    mdn(body)
    setContentView(body)

    ViewCompat.setOnApplyWindowInsetsListener(body) { v, insets ->
      val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())

      body.style.setPadding(
        bars.left.toFloat() + 16f * scale,
        bars.top.toFloat() + 16f * scale,
        bars.right.toFloat() + 16f * scale,
        bars.bottom.toFloat() + 16f * scale
      )
      insets
    }
  }

  fun mdn(body: Element) {
    val root = mason.createView(this).apply {
      configure {
        it.boxSizing = BoxSizing.BorderBox
        it.border = "1px solid blue"
        it.setSizeWidth(Dimension.Percent(1f))
      //  it.float = CSSFloat.Left
      }
    }


    val one = mason.createView(this@FloatActivity).apply {
      append("1")
      configure {
        it.margin = Rect.uniform(
          LengthPercentageAuto.Points(
            5 * mason.scale
          )
        )

        it.size = Size(
          Dimension.Points(
            50 * mason.scale
          ), Dimension.Points(
            150 * mason.scale
          )
        )

       // it.float = CSSFloat.Left

        it.background = "pink"
      }
    }
    val two = mason.createView(this@FloatActivity).apply {
      append("2")
      configure {
        it.margin = Rect.uniform(
          LengthPercentageAuto.Points(
            5 * mason.scale
          )
        )

        it.size = Size(
          Dimension.Points(
            50 * mason.scale
          ), Dimension.Points(
            150 * mason.scale
          )
        )

      //  it.float = CSSFloat.Left

        it.background = "pink"
      }
    }
    val three = mason.createView(this@FloatActivity).apply {
      append("3")
      configure {
        it.margin = Rect.uniform(
          LengthPercentageAuto.Points(
            5 * mason.scale
          )
        )

        it.size = Size(
          Dimension.Points(
            50 * mason.scale
          ), Dimension.Points(
            150 * mason.scale
          )
        )

          //  it.float = CSSFloat.Right

        it.background = "cyan"
      }
    }
    val p = mason.createTextView(this@FloatActivity).apply {
      append(
        """
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tristique
      sapien ac erat tincidunt, sit amet dignissim lectus vulputate. Donec id
      iaculis velit. Aliquam vel malesuada erat. Praesent non magna ac massa
      aliquet tincidunt vel in massa. Phasellus feugiat est vel leo finibus
        congue.
        """.trimIndent()
      )
    }
    root.addView(one)
    root.addView(two)
    root.addView(three)
    root.addView(p)


    body.append(root)
  }
}
