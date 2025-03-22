package org.nativescript.mason.masondemo

import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.widget.Button
import org.nativescript.mason.masondemo.databinding.ActivityFlexBinding
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Display
import org.nativescript.mason.masonkit.FlexDirection
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.NodeHelper
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextView

class FlexActivity : AppCompatActivity() {
  private lateinit var binding: ActivityFlexBinding
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // binding = ActivityFlexBinding.inflate(layoutInflater)
    // setContentView(binding.root)

//    mason:mason_width="300dp"
//    mason:mason_minWidth="10dp"

    val rootLayout = mason.createView(this)
    rootLayout.setBackgroundColor(Color.GRAY)
    rootLayout.configure {
      style.display = Display.Flex
      style.flexDirection = FlexDirection.Row
    }

    val flexBtn = Button(this)
    flexBtn.text = "Button"
    rootLayout.addView(flexBtn)

    val tv = mason.createTextView(this)
    tv.text = "Hello World"
    rootLayout.addView(tv)


    val a = mason.createView(this)
    a.setBackgroundColor(Color.RED)
    a.configure {
      style.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    }
    rootLayout.addView(a)

    setContentView(rootLayout)

  }
}
