package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Display
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.MeasureFunc
import org.nativescript.mason.masonkit.Node
import org.nativescript.mason.masonkit.Position
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextAlign
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View


class AbsoluteActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val rootLayout = mason.createView(this)
    rootLayout.setBackgroundColor(Color.BLUE)
//    rootLayout.configure {
//      it.style.size = Size(Dimension.Percent(1F), Dimension.Percent(1F))
//    }

    val child = mason.createView(this)
    child.setBackgroundColor(Color.RED)
    child.configure { node ->
      node.style.display = Display.Block
    //  node.style.position = Position.Absolute
      node.style.maxSize = Size(
        Dimension.Points(12f),
        Dimension.Points(12f)
      )
      node.style.padding = Rect(
        LengthPercentage.Points(2f),
        LengthPercentage.Points(4f),
        LengthPercentage.Points(6f),
        LengthPercentage.Points(8f)
      )

      node.style.border = Rect(
        LengthPercentage.Points(1f),
        LengthPercentage.Points(3f),
        LengthPercentage.Points(5f),
        LengthPercentage.Points(7f)
      )
    }

    rootLayout.addView(child)

//    <div id="test-root" style="display: block;">
//    <div style="display: block; position: absolute; max-width: 12px; max-height: 12px; padding: 2px 4px 6px 8px; border-width: 1px 3px 5px 7px; border-style: solid; border-color: red;"></div>
//    </div>


    setContentView(rootLayout)


  }

  fun absTextText(rootLayout: View) {


    val ct = mason.createTextView(this)
    ct.text = "Center Text"
    ct.color = Color.MAGENTA
    ct.configure {
      it.style.position = Position.Absolute
      it.style.inset = Rect(
        LengthPercentageAuto.Percent(.5f),
        LengthPercentageAuto.Percent(.5f),
        LengthPercentageAuto.Points(100f),
        LengthPercentageAuto.Points(100f)
      )
    }

    val text = mason.createTextView(this)
    text.text = "Test"
    text.color = Color.GRAY

    val textIn = mason.createTextView(this)
    textIn.text = "ing Nested "
    textIn.color = Color.CYAN

    val textNested = mason.createTextView(this)
    textNested.text = "Text"
    textNested.color = Color.RED
    textNested.decorationLine = TextView.DecorationLine.LineThrough
    textNested.decorationColor = Color.MAGENTA


    rootLayout.addView(ct)
    rootLayout.addView(text)


    text.addView(textIn)
    text.addView(textNested)


    val topLeft = mason.createTextView(this)
    topLeft.text = "Top Left"

    topLeft.configure {
      it.style.position = Position.Absolute
      it.style.inset = Rect(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
      )
    }


    val para1 = mason.createTextView(this)

    para1.text =
      "\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Ut hendrerit leo at porta luctus. Etiam condimentum nulla non lorem consectetur, ut tincidunt ligula volutpat. Morbi egestas tellus nec libero egestas, eu tristique nunc pharetra. Integer vehicula, elit ultrices iaculis luctus, sapien magna tempus ipsum, sit amet tempus ex lacus vitae nisl. Maecenas a fermentum nunc. Nulla non molestie tellus. Sed pellentesque mauris in faucibus tincidunt. Mauris id dui quis justo blandit consequat eget in nisl. Maecenas eu est consequat, lobortis dolor consectetur, volutpat ligula. "
    para1.color = Color.GREEN
    para1.decorationLine = TextView.DecorationLine.Underline
    para1.decorationColor = Color.RED
    text.addView(para1)


    val para2 = mason.createTextView(this)
    para2.text =
      "\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Ut hendrerit leo at porta luctus. Etiam condimentum nulla non lorem consectetur, ut tincidunt ligula volutpat. Morbi egestas tellus nec libero egestas, eu tristique nunc pharetra. Integer vehicula, elit ultrices iaculis luctus, sapien magna tempus ipsum, sit amet tempus ex lacus vitae nisl. Maecenas a fermentum nunc. Nulla non molestie tellus. Sed pellentesque mauris in faucibus tincidunt. Mauris id dui quis justo blandit consequat eget in nisl. Maecenas eu est consequat, lobortis dolor consectetur, volutpat ligula. "
    para2.color = Color.BLUE
    text.addView(para2)


//    val tr = org.nativescript.mason.masonkit.View(this)
//    val topRight = TextView(this)
//    tr.addView(topRight)
//    topRight.text = "Top Right"
//    val topRightNode = Node()
//    topRightNode.style.position = Position.Absolute
//    topRightNode.style.inset = Rect(
//      LengthPercentageAuto.Points(0f),
//      LengthPercentageAuto.Percent(1f),
//      LengthPercentageAuto.Points(0f),
//      LengthPercentageAuto.Points(0f)
//    )
//
//
////    topRightNode.setMeasureFunction(object : MeasureFunc {
////      override fun measure(
////        knownDimensions: Size<Float?>,
////        availableSpace: Size<Float?>
////      ): Size<Float> {
////        val width = text.paint.measureText(text.text as String)
////        val height = text.lineHeight
////        return Size(width, knownDimensions.height ?: height.toFloat())
////      }
////    })
//
//
//    val br = org.nativescript.mason.masonkit.View(this)
//    val bottomRight = TextView(this)
//    br.addView(bottomRight)
//    bottomRight.text = "Bottom Right"
//    val bottomRightNode = Node()
//    bottomRightNode.style.position = Position.Absolute
//    bottomRightNode.style.inset = Rect(
//      LengthPercentageAuto.Points(0f),
//      LengthPercentageAuto.Points(0f),
//      LengthPercentageAuto.Percent(1f),
//      LengthPercentageAuto.Percent(1f)
//    )
//
//
////    bottomRightNode.setMeasureFunction(object : MeasureFunc {
////      override fun measure(
////        knownDimensions: Size<Float?>,
////        availableSpace: Size<Float?>
////      ): Size<Float> {
////        val width = text.paint.measureText(text.text as String)
////        val height = text.lineHeight
////        return Size(width, knownDimensions.height ?: height.toFloat())
////      }
////    })
//
//    rootLayout.node.addChild(topLeftNode)
//    rootLayout.node.addChild(topRightNode)
//    rootLayout.node.addChild(bottomRightNode)
    //  rootNode.addChild(rootLayout.node)

    // rootNode.compute(1000F, 1000F)
//    rootLayout.node.compute()
//    Log.d("com.test", "${rootLayout.node.layout()}")


//    rootLayout.addView(text)
////    rootLayout.addView(tl)
////    rootLayout.addView(tr)
////    rootLayout.addView(br)

  }
}
