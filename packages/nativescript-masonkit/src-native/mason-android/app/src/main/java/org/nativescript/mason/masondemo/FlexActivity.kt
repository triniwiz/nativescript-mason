package org.nativescript.mason.masondemo

import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.widget.Button
import org.nativescript.mason.masondemo.databinding.ActivityFlexBinding
import org.nativescript.mason.masonkit.Dimension
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
      it.style.flexDirection = FlexDirection.Row
    }

    val flexBtn = Button(this)
    flexBtn.text = "Button"

    val flexBtnNode = mason.nodeForView(flexBtn)

    flexBtnNode.configure {
      NodeHelper.setSizeWidth(flexBtnNode, Dimension.Points(1100f))
    }

    flexBtnNode.configure {
      NodeHelper.setMinSizeWidth(flexBtnNode, Dimension.Points(300f))
    }

    flexBtnNode.configure {
      NodeHelper.setMaxSizeWidth(flexBtnNode, Dimension.Points(1200f))
    }

    rootLayout.addView(flexBtn, flexBtnNode)

    val tv = mason.createTextView(this)
    tv.text = "Hello World"
    rootLayout.addView(tv)


    val a = mason.createView(this)
    a.setBackgroundColor(Color.RED)
    a.configure { node ->
      node.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    }
    rootLayout.addView(a)

    setContentView(rootLayout)

  }
}
