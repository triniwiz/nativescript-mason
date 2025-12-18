package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.DisplayMetrics
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Style
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.TextType

class FloatActivity : AppCompatActivity() {
  lateinit var metrics: DisplayMetrics
  val mason = Mason.shared
  fun toPx(dip: Float): Float {
    return dip * metrics.density
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    metrics = resources.displayMetrics
    mason.setDeviceScale(metrics.density)

    val body = mason.createView(this)
    enableEdgeToEdge()
    renderFloat(body)
    setContentView(body)
    ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
      insets
    }
  }

  fun applyDivStyle(style: Style) {
    style.margin = Rect.uniform(LengthPercentageAuto.Points(5f))
    style.size = org.nativescript.mason.masonkit.Size(
      org.nativescript.mason.masonkit.Dimension.Points(
        50f
      ),
      org.nativescript.mason.masonkit.Dimension.Points(
        150f
      )
    )
  }

  fun renderFloat(view: View) {
    val section = mason.createView(this)
    val one = mason.createView(this)
    one.append("1")
    one.configure {
      it.background = "pink"
      it.float = org.nativescript.mason.masonkit.enums.Float.Left
      applyDivStyle(it)
    }
    val two = mason.createView(this)
    two.append("2")
    two.configure {
      it.background = "pink"
      it.float = org.nativescript.mason.masonkit.enums.Float.Left
      applyDivStyle(it)
    }
    val three = mason.createView(this)
    three.append("3")

    three.configure {
      it.background = "cyan"
      it.float = org.nativescript.mason.masonkit.enums.Float.Right
      applyDivStyle(it)
    }

    val p = mason.createTextView(this, TextType.P)
    p.append(
      """
     Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tristique
    sapien ac erat tincidunt, sit amet dignissim lectus vulputate. Donec id
    iaculis velit. Aliquam vel malesuada erat. Praesent non magna ac massa
    aliquet tincidunt vel in massa. Phasellus feugiat est vel leo finibus
      congue.
      """
    )
    section.append(arrayOf(one, two, three, p))

    view.append(section)
  }
}
