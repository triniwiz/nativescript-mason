package org.nativescript.mason.masondemo

import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.Button
import org.nativescript.mason.masondemo.databinding.ActivityFlexBinding
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
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
      it.display = Display.Flex
      it.flexDirection = FlexDirection.Row
    }

    val flexBtn = Button(this)
    flexBtn.text = "Button"
    flexBtn.layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )
    val flexBtnNode = mason.nodeForView(flexBtn)
    rootLayout.append(flexBtnNode)

    val tv = mason.createTextView(this)
    tv.textContent = "Hello World"
    rootLayout.append(tv)


    val a = mason.createView(this)
    a.setBackgroundColor(Color.RED)
    a.configure {
      it.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    }
    rootLayout.addView(a)

    setContentView(rootLayout)

  }
}
