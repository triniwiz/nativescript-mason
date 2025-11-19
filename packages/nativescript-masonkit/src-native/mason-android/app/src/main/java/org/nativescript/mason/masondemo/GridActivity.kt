package org.nativescript.mason.masondemo

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.toColorInt
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Scroll
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextStyleKeys
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.TextType

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

    val body = mason.createScrollView(this)
    body.style.overflowX = Overflow.Scroll

//    Timer().schedule(1000L) {
//      runOnUiThread {
//        body.style.values.putInt(StyleKeys.OVERFLOW_X, Overflow.Scroll.value)
//        body.syncStyle("${StateKeys.OVERFLOW_X.bits}", "-1")
////        body.style.overflowX = Overflow.Scroll
////        body.style.overflowY = Overflow.Scroll
//      }
//    }


//    body.style.margin = Rect(
//      LengthPercentageAuto.Points(40f),
//      LengthPercentageAuto.Points(40f),
//      LengthPercentageAuto.Points(40f),
//      LengthPercentageAuto.Points(40f)
//    )

    val rootLayout = mason.createScrollView(this)

    //body.addView(rootLayout)

    // wrapper5(rootLayout)
    wrapper6(body)
    //wrapper8(body)
    //genTest(body)

//    grid_template_areas(body)

    //  grid_template_areas_500(body)

    //  grid_template_areas_600(body)

    setContentView(body)
  }

  fun grid_template_areas_600(rootLayout: Scroll) {
    val root = mason.createView(this)
    root.configure {
      it.display = Display.Grid
      it.gridTemplateColumns = "120px auto 120px"
      it.setMaxSizeWidth(Dimension.Points(600f))
      it.gridTemplateAreas = """
      "header  header  header"
      "sidebar content sidebar2"
      "footer  footer  footer"
      """.trimIndent()



      it.gap = Size(LengthPercentage.Points(20f), LengthPercentage.Points(20f))
    }


    val header = mason.createView(this)
    header.append("Header")
    header.setBackgroundColor("#999999".toColorInt())
    header.style.gridArea = "header"

    val sidebar = mason.createView(this)
    sidebar.style.gridArea = "sidebar"
    sidebar.setBackgroundColor("#444444".toColorInt())
    sidebar.append("Sidebar")

    val content = mason.createView(this)
    content.style.gridArea = "content"

    content.append(
      """
      Content
     More content than we had before so this column is now quite tall.
    """.trimIndent()
    )

    val sidebar2 = mason.createView(this)
    sidebar2.setBackgroundColor("#cccccc".toColorInt())
    sidebar2.style.gridArea = "sidebar2"
    sidebar2.append("Sidebar 2")


    val footer = mason.createView(this)
    footer.style.gridArea = "footer"
    footer.setBackgroundColor("#999999".toColorInt())
    footer.append("Footer")

    root.append(arrayOf(header, sidebar, sidebar2, content, footer))

    rootLayout.append(root)
  }

  fun grid_template_areas_500(rootLayout: Scroll) {
    val root = mason.createView(this)
    root.configure {
      it.display = Display.Grid
      it.gridTemplateAreas = """
     "header  header"
		"sidebar content"
		"sidebar2 sidebar2"
		"footer  footer"
      """.trimIndent()
      it.gridTemplateColumns = "20% auto"
      it.gap = Size(LengthPercentage.Points(10f), LengthPercentage.Points(10f))
    }


    val header = mason.createView(this)
    Log.d("com.test", "header ???")
    mason.printTree(header.node)
    header.append("Header")
    header.setBackgroundColor("#999999".toColorInt())
    header.configure {
      it.gridRow = "header"
      it.gridColumn = "header"
    }


    val sidebar = mason.createView(this)
    sidebar.style.gridArea = "sidebar"
    sidebar.setBackgroundColor("#444444".toColorInt())
    sidebar.append("Sidebar")

    val content = mason.createView(this)
    content.style.gridArea = "content"

    content.append(
      """
      Content
     More content than we had before so this column is now quite tall.
    """.trimIndent()
    )

    val sidebar2 = mason.createView(this)
    sidebar2.setBackgroundColor("#cccccc".toColorInt())
    sidebar2.style.gridArea = "sidebar2"
    sidebar2.append("Sidebar 2")


    val footer = mason.createView(this)
    footer.style.gridArea = "footer"
    footer.setBackgroundColor("#999999".toColorInt())
    footer.append("Footer")

    root.append(arrayOf(header, sidebar, sidebar2, content, footer))

    rootLayout.append(root)
  }

  fun grid_template_areas(rootLayout: Scroll) {
    val root = mason.createView(this)
    root.configure {
      it.display = Display.Grid
      it.gridTemplateAreas = """
      "header"
      "sidebar"
      "content"
      "sidebar2"
      "footer"
      """.trimIndent()
      it.gap = Size(LengthPercentage.Points(10f), LengthPercentage.Points(10f))
    }


    val header = mason.createView(this)
    header.append("Header")
    header.setBackgroundColor("#999999".toColorInt())
    header.style.gridArea = "header"

    val sidebar = mason.createView(this)
    sidebar.style.gridArea = "sidebar"
    sidebar.append("Sidebar")

    val content = mason.createView(this)
    content.style.gridArea = "content"

    content.append(
      """
      Content
     More content than we had before so this column is now quite tall.
    """.trimIndent()
    )

    val sidebar2 = mason.createView(this)
    sidebar2.style.gridArea = "sidebar2"
    sidebar2.append("Sidebar 2")


    val footer = mason.createView(this)
    footer.style.gridArea = "footer"
    footer.setBackgroundColor("#999999".toColorInt())
    footer.append("Footer")

    root.append(arrayOf(header, sidebar, sidebar2, content, footer))

    rootLayout.append(root)
  }

  fun genTest(rootLayout: Scroll) {
    val root = mason.createView(this)
    root.configure {
      it.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
      it.display = Display.Grid
      it.gridTemplateColumns = "repeat(5, 1fr)"
      it.gridTemplateRows = "repeat(5, 1fr)"
      it.gap = Size(LengthPercentage.Points(10f), LengthPercentage.Points(10f))
    }

    val div1 = mason.createView(this)
    div1.append("A")
    div1.setBackgroundColor(Color.RED)
    div1.configure {
      it.gridArea = "1 / 1 / 2 / 2"
    }

    val div2 = mason.createView(this)
    div2.append("B")
    div2.configure {
      it.gridArea = "2 / 2 / 3 / 3"
    }


    val div3 = mason.createView(this)
    div3.append("C")
    div3.configure {
      it.gridArea = "3 / 3 / 4 / 4"
    }

    val div4 = mason.createView(this)
    div4.append("D")
    div4.configure {
      it.gridArea = "4 / 4 / 5 / 5"
    }


    val div5 = mason.createView(this)
    div5.append("D")
    div5.configure {
      it.gridArea = "5 / 5 / 6 / 6"
    }

    root.append(arrayOf(div1, div2, div3, div4, div5))

    rootLayout.addView(root)
  }

  fun wrapper8(rootLayout: Scroll) {
    val bg = "#444444".toColorInt()
    rootLayout.configure {
      it.color = Color.WHITE
      //it.boxSizing = BoxSizing.ContentBox
      rootLayout.setBackgroundColor(Color.WHITE)
      it.display = Display.Grid
      it.gap = Size(LengthPercentage.Points(10f), LengthPercentage.Points(10f))
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

    a.setBackgroundColor(bg)

    a.style.gridColumn = "col / span 2"
    a.style.gridRow = "row"
    a.append("A")


    val b = Mason.shared.createView(this)
//    b.style.alignSelf = AlignSelf.Start
//    b.style.justifySelf = JustifySelf.Start
    b.setBackgroundColor(bg)
    b.style.gridColumn = "col 3 / span 2"
    b.style.gridRow = "row"
    b.append("B")


    val c = Mason.shared.createView(this)
//    c.style.alignSelf = AlignSelf.Start
//    c.style.justifySelf = JustifySelf.Start
    c.setBackgroundColor(bg)
    c.style.gridColumn = "col"
    c.style.gridRow = "row 2"
    c.append("C")


    val d = Mason.shared.createView(this)
//    d.style.alignSelf = AlignSelf.Start
//    d.style.justifySelf = JustifySelf.Start
    d.setBackgroundColor(bg)
    d.style.gridColumn = " col 2 / span 3 "
    d.style.gridRow = "row 2"
    d.append("D")


    val e = Mason.shared.createView(this)
//    e.style.alignSelf = AlignSelf.Start
//    e.style.justifySelf = JustifySelf.Start
    e.setBackgroundColor(bg)
    e.style.gridColumn = "col / span 4"
    e.style.gridRow = "row 3 "
    e.append("E")


    rootLayout.append(arrayOf(a, b, c, d, e))
  }

  fun wrapper5(rootLayout: View) {
    rootLayout.style.color = Color.WHITE
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


    val boxB = mason.createView(this)
    boxB.append("B")

    val boxC = mason.createView(this)
    boxC.append("C")

    val boxD = mason.createView(this)
    boxD.append("D")

    val boxE = mason.createView(this)
    boxE.append("E")


    val boxF = mason.createView(this)
    boxF.append("F")


    rootLayout.append(arrayOf(boxA, boxB, boxC, boxD))

    boxA.configure {
      boxA.background = bg
      it.padding = Rect(
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f))
      )
      it.gridColumn = "1/3"
      it.gridRow = "1"

    }

    boxB.configure {
      boxB.background = bg
      it.gridColumn = "3"
      it.gridRow = "1/3"
    }

    boxC.configure {
      boxC.background = bg
      it.gridColumn = "1"
      it.gridRow = "2"
    }

    boxD.configure {
      boxD.background = bg
      it.gridColumn = "2"
      it.gridRow = "2"
    }

  }

  fun createParentWith2Kids(kidAText: String, kidBText: String, alignSelf: AlignSelf): View {

    val parent = mason.createView(this)
    parent.style.alignSelf = alignSelf

//    val a = TextView(this)
//    a.setText(kidAText)
//
//    val b = TextView(this)
//    b.setText(kidBText)

    val a = mason.createTextView(this, TextType.P)
    a.append(kidAText)

    val b = mason.createTextView(this, TextType.Code)
    b.append(kidBText)

    parent.appendView(a)
    parent.appendView(b)

    return parent
  }

  fun wrapper6(rootLayout: Scroll) {
    /*
    display: grid;
  background: no-repeat url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/12005/grid.png);
  grid-gap: 10px;
  grid-template-columns:  repeat(6, 150px);
  grid-template-rows: repeat( 4, 150px);
  background-color: #fff;
  color: #444;
     */

    val percentage: Byte = 1

    rootLayout.style.fontSize = 80
    rootLayout.style.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)

    val wrapper6 = mason.createView(this)

    val boxA = createParentWith2Kids("This is box A.", "align-self: stretch", AlignSelf.Stretch)
    val boxB = createParentWith2Kids("This is box B.", "align-self: end", AlignSelf.End)
    val boxC = createParentWith2Kids("This is box C.", "align-self: start", AlignSelf.Start)
    val boxD = createParentWith2Kids("This is box D.", "align-self: center", AlignSelf.Center)
    val boxE = mason.createView(this)
    val boxEA = mason.createTextView(this, TextType.P)
    boxEA.append("Each of the boxes on the left has a grid area of 3 columns and 3 rows (we're counting the gutter col/row). So each covers the same size area as box A.")

    val boxEB = mason.createTextView(this, TextType.P)
    boxEB.append("The align-self property is used to align the content inside the grid-area.")

    boxE.append(boxEA)
    boxE.append(boxEB)

    wrapper6.append(boxA)
    wrapper6.append(boxB)
    wrapper6.append(boxC)
    wrapper6.append(boxD)
    wrapper6.append(boxE)


    wrapper6.configure {
      it.color = "#444444".toColorInt()
      //  background = ColorDrawable(Color.WHITE)
      it.display = Display.Grid
      it.gap = Size(LengthPercentage.Points(toPx(10F)), LengthPercentage.Points(toPx(10F)))
      it.gridTemplateColumns = "repeat(6, 150)"
      it.gridTemplateRows = "repeat(4, 150)"
    }

    boxA.configure {
      // 150%
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.background = "no-repeat url('https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/lizard.png')"
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f))
      )
      it.gridColumn = "1/3"
      it.gridRow = "1/3"
      it.alignSelf = AlignSelf.Stretch
    }

    boxB.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f))
      )
      it.gridColumn = "3/5"
      it.gridRow = "1/3"
      it.alignSelf = AlignSelf.End
    }

    boxC.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.background = """
        left 5% / 15% 60% repeat-x
  url("https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png");
      """.trimIndent()
      it.padding = Rect(
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f))
      )
      it.gridColumn = "1/3"
      it.gridRow = "3/6"
      it.alignSelf = AlignSelf.Start
    }

    boxD.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f))
      )
      it.gridColumn = "3/5"
      it.gridRow = "3/6"
      it.alignSelf = AlignSelf.Center
    }

    boxE.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f)),
        LengthPercentage.Points(toPx(20f))
      )
      it.gridColumn = "5/7"
      it.gridRow = "1/6"
      it.alignSelf = AlignSelf.Stretch
    }


    rootLayout.addView(wrapper6)
  }
}
