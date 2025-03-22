package org.nativescript.mason.masondemo

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Display
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Position
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextAlign
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View
import android.util.DisplayMetrics
import android.util.Log
import android.view.TextureView
import android.view.WindowInsets
import android.view.WindowMetrics
import androidx.annotation.RequiresApi
import org.nativescript.mason.masonkit.text.Styles

@RequiresApi(Build.VERSION_CODES.R)
fun getActivitySizeWithInsets(activity: Activity): Triple<Int, Int, android.graphics.Rect> {
  val windowMetrics: WindowMetrics = activity.windowManager.currentWindowMetrics
  val insets =
    windowMetrics.windowInsets.getInsetsIgnoringVisibility(WindowInsets.Type.systemBars())

  val width = windowMetrics.bounds.width()
  val height = windowMetrics.bounds.height()

  val insetRect = android.graphics.Rect(insets.left, insets.top, insets.right, insets.bottom)

  return Triple(width, height, insetRect)
}

fun getActivitySizeWithInsetsLegacy(activity: Activity): Triple<Int, Int, android.graphics.Rect> {
  val displayMetrics = DisplayMetrics()
  val display = activity.windowManager.defaultDisplay
  display.getMetrics(displayMetrics)

  val rect = android.graphics.Rect()
  activity.window.decorView.getWindowVisibleDisplayFrame(rect) // Gets visible area (excluding status bar)

  val width = displayMetrics.widthPixels
  val height = displayMetrics.heightPixels
  val insets =
    android.graphics.Rect(0, rect.top, 0, height - rect.bottom) // Status bar top, nav bar bottom

  return Triple(width, height, insets)
}


class AbsoluteActivity : AppCompatActivity() {
  val mason = Mason()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    /*
    val child = mason.createView(this)
    child.setBackgroundColor(Color.RED)
    child.configure { node ->
      node.style.display = Display.Block
      node.style.position = Position.Absolute
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
    */

    val activitySize = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getActivitySizeWithInsets(this)
    } else {
      getActivitySizeWithInsetsLegacy(this)
    }


    val adjustedWidth =
      resources.displayMetrics.widthPixels - (activitySize.third.left + activitySize.third.right)
    val adjustedHeight =
      resources.displayMetrics.heightPixels - (activitySize.third.top + activitySize.third.bottom)

//    Log.d("com", "${activitySize.second} ${}")

    val rootLayout = mason.createView(this)
    rootLayout.setBackgroundColor(Color.BLUE)
    rootLayout.configure {
     style.display = Display.Block
//     style.size = Size(
//        Dimension.Points(adjustedWidth.toFloat()),
//        Dimension.Points(adjustedHeight.toFloat())
//      )

     style.size = Size(
        Dimension.Percent(1f),
        Dimension.Percent(1f)
      )

    }

    //rootLayout.addView(child)

    // absTextText(rootLayout)

    regularTextText(rootLayout)

    setContentView(rootLayout)

  }

  fun regularTextText(rootLayout: View) {

    val ct = mason.createTextView(this)
    ct.text = "Center Text"
    ct.backgroundColorValue = Color.GREEN
    val size = ct.paint.measureText(ct.text.toString())

    // ct.textAlignment = android.widget.TextView.TEXT_ALIGNMENT_CENTER
    rootLayout.addView(ct)

    ct.configure {
     style.position = Position.Absolute
     style.margin = Rect(
        LengthPercentageAuto.Points(-(size / 2)),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto
      )
     style.inset = Rect(
        LengthPercentageAuto.Percent(.5f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Percent(.5f),
        LengthPercentageAuto.Auto
      )
    }


    val topLeft = mason.createTextView(this)
    topLeft.text = "Top Left"

    rootLayout.addView(topLeft)

    topLeft.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto
      )
    }

    val topRight = mason.createTextView(this)
    topRight.text = "Top Right"

    topRight.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto
      )
    }

    rootLayout.addView(topRight)

    val bottomRight = mason.createTextView(this)

    bottomRight.text = "Bottom Right"

    bottomRight.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f)
      )
    }

    rootLayout.addView(bottomRight)

    val bottomLeft = mason.createTextView(this)

    bottomLeft.text = "Bottom Left"

    bottomLeft.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f)
      )
    }

    rootLayout.addView(bottomLeft)

  }

  fun absTextText(rootLayout: View) {

    val ct = mason.createTextView(this)
    ct.text = "Center Text"
    val size = ct.paint.measureText(ct.text.toString())
    ct.color = Color.MAGENTA
    ct.setBackgroundColor(Color.GREEN)
    ct.textAlignment = android.widget.TextView.TEXT_ALIGNMENT_CENTER
    ct.configure {
     style.position = Position.Absolute
     style.margin = Rect(
        LengthPercentageAuto.Points(-(size / 2)),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto
      )
     style.inset = Rect(
        LengthPercentageAuto.Percent(.5f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Percent(.5f),
        LengthPercentageAuto.Auto
      )
    }


    rootLayout.addView(ct)

    val topLeft = mason.createTextView(this)
    topLeft.text = "Top Left"

    topLeft.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto
      )
    }

    rootLayout.addView(topLeft)


    val topRight = mason.createTextView(this)
    rootLayout.addView(topRight)
    topRight.text = "Top Right"

    topRight.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto
      )
    }

    val bottomRight = mason.createTextView(this)
    rootLayout.addView(bottomRight)
    bottomRight.text = "Bottom Right"

    bottomRight.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f)
      )
    }

    val bottomLeft = mason.createTextView(this)
    rootLayout.addView(bottomLeft)
    bottomLeft.text = "Bottom Left"

    bottomLeft.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f)
      )
    }

    //   val image =

  }

  fun testText(rootLayout: View) {

    val ct = mason.createTextView(this)
    ct.setText("Center Text")
    ct.color = Color.MAGENTA
    ct.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Percent(.5f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Auto
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
    textNested.decorationLine = Styles.DecorationLine.LineThrough
    textNested.decorationColor = Color.MAGENTA


    rootLayout.addView(ct)
    rootLayout.addView(text)


    text.addView(textIn)
    text.addView(textNested)


    val topLeft = mason.createTextView(this)
    topLeft.text = "Top Left"

    topLeft.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Auto
      )
    }

    rootLayout.addView(topLeft)


    val para1 = mason.createTextView(this)

    para1.text =
      "\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Ut hendrerit leo at porta luctus. Etiam condimentum nulla non lorem consectetur, ut tincidunt ligula volutpat. Morbi egestas tellus nec libero egestas, eu tristique nunc pharetra. Integer vehicula, elit ultrices iaculis luctus, sapien magna tempus ipsum, sit amet tempus ex lacus vitae nisl. Maecenas a fermentum nunc. Nulla non molestie tellus. Sed pellentesque mauris in faucibus tincidunt. Mauris id dui quis justo blandit consequat eget in nisl. Maecenas eu est consequat, lobortis dolor consectetur, volutpat ligula. "
    para1.color = Color.GREEN
    para1.decorationLine = Styles.DecorationLine.Underline
    para1.decorationColor = Color.RED
    text.addView(para1)


    val para2 = mason.createTextView(this)
    para2.text =
      "\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Ut hendrerit leo at porta luctus. Etiam condimentum nulla non lorem consectetur, ut tincidunt ligula volutpat. Morbi egestas tellus nec libero egestas, eu tristique nunc pharetra. Integer vehicula, elit ultrices iaculis luctus, sapien magna tempus ipsum, sit amet tempus ex lacus vitae nisl. Maecenas a fermentum nunc. Nulla non molestie tellus. Sed pellentesque mauris in faucibus tincidunt. Mauris id dui quis justo blandit consequat eget in nisl. Maecenas eu est consequat, lobortis dolor consectetur, volutpat ligula. "
    para2.color = Color.BLUE
    text.addView(para2)


    val topRight = mason.createTextView(this)
    rootLayout.addView(topRight)
    topRight.text = "Top Right"

    topRight.configure {
     style.position = Position.Absolute
     style.inset = Rect(
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Points(10f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Auto
      )
    }

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


    //  rootLayout.addView(text)
//    rootLayout.addView(tl)
//    rootLayout.addView(tr)
//    rootLayout.addView(br)

  }
}
