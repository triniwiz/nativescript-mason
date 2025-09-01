package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.size
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Overflow
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.text.Styles

class ScrollActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val rootLayout = mason.createView(this)
    rootLayout.configure {
      rootLayout.node.style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    }

    val sv = mason.createScrollView(this)
    sv.configure {
      sv.node.style.overflowX = Overflow.Clip
      sv.node.style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
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
    val text =  "Duis ornare ut nulla ac dignissim. Morbi ac orci a ante lacinia ultricies. Donec nec eleifend eros. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Praesent eget turpis erat. Aliquam faucibus ullamcorper risus cursus feugiat. Etiam ac feugiat mauris, sit amet ornare ipsum. Ut a malesuada lectus, non consequat quam. Vestibulum quis molestie augue. Sed id dolor ac dui vehicula tempus. Nam sed pellentesque ipsum."
    nowrap.updateText(text)
    nowrap.color = Color.MAGENTA
    nowrap.setBackgroundColor(Color.BLUE)

    sv.addView(nowrap)

    repeat(1000) {
      val view = mason.createTextView(this)
      val text = "Laffy Taffy ${it + 1}"
      view.updateText(text)
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
