package org.nativescript.mason.masondemo

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.GridPlacement
import org.nativescript.mason.masonkit.GridTrackRepetition
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Line
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.MinMax
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.TrackSizingFunction
import org.nativescript.mason.masonkit.View

class GridActivity : AppCompatActivity() {
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
    val rootLayout = mason.createView(this)

    body.addView(rootLayout)

   // wrapper5(rootLayout)
    // wrapper6(rootLayout)
    wrapper8(rootLayout)

    setContentView(body)
  }

  fun wrapper8(rootLayout: View){
    val bg = ColorDrawable(Color.parseColor("#444444"))
    rootLayout.configure {
      rootLayout.background = ColorDrawable(Color.WHITE)
      it.display = Display.Grid
      rootLayout.setGap(toPx(10F), toPx(10F))

//      it.margin = Rect(
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f))
//      )
      it.gridTemplateColumns = "[col] 100px [col] 100px [col] 100px [col] 100px  "
      it.gridTemplateRows = " [row] auto [row] auto [row] "
    }

    val a = Mason.shared.createView(this)

    a.background = bg
    a.gridColumn = "col / span 2"
    a.gridRow = "row"
    a.append("A")


    val b = Mason.shared.createView(this)
    b.background = bg
    b.gridColumn = "col 3 / span 2"
    b.gridRow = "row"
    b.append("B")

    Log.d("com.test", "${rootLayout.style}")

    rootLayout.append(arrayOf(a,b))
  }

  fun wrapper5(rootLayout: View) {
    rootLayout.configure {
      rootLayout.background = ColorDrawable(Color.WHITE)
      it.display = Display.Grid
      rootLayout.setGap(toPx(10F), toPx(10F))
//      it.margin = Rect(
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f))
//      )
      it.gridTemplateColumns = "100 100 100"
    }

    val bg = ColorDrawable(Color.parseColor("#444444"))

    val boxA = mason.createView(this)
    boxA.append("A")
//    val boxAText = mason.createTextView(this)
//    boxAText.text = "A"
//    boxAText.setTextColor(Color.WHITE)
//    boxA.append(boxAText)


    val boxB = mason.createView(this)
    boxB.append("B")
    //boxB.setTextColor(Color.WHITE)

    val boxC = mason.createView(this)
    boxC.append("C")
    // boxC.setTextColor(Color.WHITE)

    val boxD = mason.createView(this)
    boxD.append("D")
    // boxD.setTextColor(Color.WHITE)


    val boxE = mason.createView(this)
    boxE.append("E")


    val boxF = mason.createView(this)
    boxF.append("F")


    rootLayout.append(arrayOf(boxA, boxB, boxC, boxD, boxE, boxF))

    boxA.configure {
      boxA.background = bg
      it.padding = Rect(
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f))
      )
//      it.gridColumn = "1/3"
//      it.gridRow = "1"

      it.gridArea = "1 / 2 / 2 / 3"
    }

    boxB.configure {
      boxB.background = bg
//      it.gridColumn = "3"
//      it.gridRow = "1/3"
      it.gridArea = "2 / 2 / 3 / 3";
    }

    boxC.configure {
      boxC.background = bg
//      it.gridColumn = "1"
//      it.gridRow = "2"
      it.gridArea = "2 / 3 / 3 / 4"
    }

    boxD.configure {
      boxD.background = bg
//      it.gridColumn = "2"
//      it.gridRow = "2"
      it.gridArea = "1 / 1 / 2 / 2"
    }


    boxE.configure {
      boxE.background = bg
//      it.gridColumn = "2"
//      it.gridRow = "2"
      it.gridArea = " 2 / 1 / 3 / 2"
    }



    boxF.configure {
      boxF.background = bg
//      it.gridColumn = "2"
//      it.gridRow = "2"
      it.gridArea = "1 / 3 / 2 / 4"
    }
  }

  fun createParentWith2Kids(kidAText: String, kidBText: String): View {
//    val parent = mason.createView(this)
//
//    val kida = mason.createTextView(this)
//
//    kida.append(kidAText)
//
//    val kidb = mason.createTextView(this)
//
//    kidb.append(kidBText)
//
//    parent.append(kida)
//
//    parent.append(kidb)


    val parent = mason.createView(this)

    parent.append(kidAText)

    parent.append(kidBText)

    return parent
  }

  fun wrapper6(rootLayout: View) {
    /*
    display: grid;
  background: no-repeat url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/12005/grid.png);
  grid-gap: 10px;
  grid-template-columns:  repeat(6, 150px);
  grid-template-rows: repeat( 4, 150px);
  background-color: #fff;
  color: #444;
     */

    val wrapper6 = mason.createView(this)

    rootLayout.addView(wrapper6)

    val boxA = createParentWith2Kids("This is box A.", "align-self: stretch")
    val boxB = createParentWith2Kids("This is box B.", "align-self: end")
    val boxC = createParentWith2Kids("This is box C.", "align-self: start")
    val boxD = createParentWith2Kids("This is box D.", "align-self: center")
    val boxE = createParentWith2Kids(
      "Each of the boxes on the left has a grid area of 3 columns and 3 rows (we're counting the gutter col/row). So each covers the same size area as box A.",
      "The align-self property is used to align the content inside the grid-area."
    )


    wrapper6.append(boxA)
    wrapper6.append(boxB)
    wrapper6.append(boxC)
    wrapper6.append(boxD)
    wrapper6.append(boxE)


    wrapper6.apply {
      //  background = ColorDrawable(Color.WHITE)
      display = Display.Grid
      setGap(toPx(10F), toPx(10F))
      gridTemplateColumns = "repeat(6, 150)"
      gridTemplateColumns = "repeat(4, 150)"
    }

    val bg = ColorDrawable(Color.parseColor("#444444"))

    boxA.apply {
      background = resources.getDrawable(R.drawable.border_drawable)
      configure {
        style.display = Display.Grid
        gridColumn = "1/3"
        gridRow = "1/3"
        alignSelf = AlignSelf.Stretch
      }
    }

    boxB.apply {
      //background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      configure {
        it.display = Display.Grid
        it.gridColumn = "3/5"
        it.gridRow = "1/3"
        it.alignSelf = AlignSelf.End
      }
    }

    boxC.apply {
      // background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      configure {
        display = Display.Grid
        gridColumn = "1/3"
        gridRow = "3/6"
        alignSelf = AlignSelf.Start
      }
    }

    boxD.apply {
      // background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      configure {
        display = Display.Grid
        gridColumn = "3/5"
        gridRow = "3/6"
        alignSelf = AlignSelf.Center
      }
    }

    boxE.apply {
      //background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      configure {
        display = Display.Grid
        gridColumn = "5/7"
        gridRow = "1/6"
        alignSelf = AlignSelf.Stretch
      }
    }
  }
}
