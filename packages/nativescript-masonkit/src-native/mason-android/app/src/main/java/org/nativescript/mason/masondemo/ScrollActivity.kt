package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Point
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.Styles
import org.nativescript.mason.masonkit.enums.Overflow

class ScrollActivity : AppCompatActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val mason = Mason.shared
    val rootLayout = mason.createView(this)

    ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { view, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())

      rootLayout.style.padding = Rect(
        LengthPercentage.Points(systemBars.top.toFloat()),
        LengthPercentage.Points(systemBars.right.toFloat()),
        LengthPercentage.Points(systemBars.bottom.toFloat()),
        LengthPercentage.Points(systemBars.left.toFloat()),
      )

      insets
    }

    enableEdgeToEdge()


    rootLayout.configure {
      it.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    }

    val sv = mason.createScrollView(this)
    sv.configure {
    //  it.overflowX = Overflow.Scroll
     // it.overflowY = Overflow.Scroll
        it.overflow = Point(Overflow.Scroll, Overflow.Scroll)
      it.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    }
    sv.setBackgroundColor(Color.RED)

    val v = mason.createView(this)
    v.setBackgroundColor(Color.GREEN)
    v.configure {
      v.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    }
    sv.addView(v)


    val nowrap = mason.createTextView(this)
    nowrap.textWrap = Styles.TextWrap.NoWrap
    val text =
      "Duis ornare ut nulla ac dignissim. Morbi ac orci a ante lacinia ultricies. Donec nec eleifend eros. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Praesent eget turpis erat. Aliquam faucibus ullamcorper risus cursus feugiat. Etiam ac feugiat mauris, sit amet ornare ipsum. Ut a malesuada lectus, non consequat quam. Vestibulum quis molestie augue. Sed id dolor ac dui vehicula tempus. Nam sed pellentesque ipsum."
    nowrap.append(text)
    nowrap.color = Color.MAGENTA
    nowrap.setBackgroundColor(Color.BLUE)

    sv.addView(nowrap)

    repeat(1000) {
      val view = mason.createTextView(this)
      val text = "Laffy Taffy ${it + 1}"
      view.append(text)
      view.color = Color.BLACK
      view.setBackgroundColor(Color.BLUE)

      sv.addView(
        view
      )
    }


    rootLayout.addView(sv)


    setContentView(rootLayout)
  }
}
