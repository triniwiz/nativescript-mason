package org.nativescript.mason.masondemo

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.widget.TextView
import androidx.core.graphics.drawable.DrawableCompat
import org.nativescript.mason.masondemo.databinding.ActivityGridBinding
import org.nativescript.mason.masonkit.*

class GridActivity : AppCompatActivity() {
  lateinit var binding: ActivityGridBinding
  lateinit var metrics: DisplayMetrics

  fun toPx(dip: Float): Float {
    return dip * metrics.density
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    metrics = resources.displayMetrics
    binding = ActivityGridBinding.inflate(layoutInflater)
    setContentView(binding.root)

   // wrapper5()
      wrapper6()
  }

  fun wrapper5() {
    binding.gridRoot.apply {
      background = ColorDrawable(Color.WHITE)
      display = Display.Grid
      setGap(toPx(10F), toPx(10F))
      gridTemplateColumns = arrayOf(
        TrackSizingFunction.AutoRepeat(
          GridTrackRepetition.Count(3),
          arrayOf(MinMax.Points(toPx(100F)))
        )
      )
    }

    val bg = ColorDrawable(Color.parseColor("#444444"))

    val boxA = TextView(this)
    boxA.text = "A"
    boxA.setTextColor(Color.WHITE)


    val boxB = TextView(this)
    boxB.text = "B"
    boxB.setTextColor(Color.WHITE)

    val boxC = TextView(this)
    boxC.text = "C"
    boxC.setTextColor(Color.WHITE)

    val boxD = TextView(this)
    boxD.text = "D"
    boxD.setTextColor(Color.WHITE)

    binding.gridRoot.addView(
      boxA
    )

    binding.gridRoot.addView(
      boxB
    )

    binding.gridRoot.addView(
      boxC
    )

    binding.gridRoot.addView(
      boxD
    )

    boxA.apply {
      background = bg
      val node = binding.gridRoot.nodeForView(this)

      node.configure {
        it.style.apply {
          gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(1))
        }
      }
    }

    boxB.apply {
      background = bg
      val node = binding.gridRoot.nodeForView(this)
      node.configure {
        it.style.apply {
          gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(3))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
        }
      }
    }

    boxC.apply {
      background = bg
      val node = binding.gridRoot.nodeForView(this)
      node.configure {
        it.style.apply {
          gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(1))
          gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
        }
      }
    }

    boxD.apply {
      background = bg
      val node = binding.gridRoot.nodeForView(this)
      node.configure {
        it.style.apply {
          gridColumn = Line(GridPlacement.Line(2), GridPlacement.Line(2))
          gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
        }
      }
    }

  }

  fun createParentWith2Kids(kidAText: String, kidBText: String): View {
    val parent = View(this)

    val kida = TextView(this)

    kida.text = kidAText

    val kidb = TextView(this)

    kidb.text = kidBText

    parent.addView(kida)

    parent.addView(kidb)

    return parent
  }

  fun wrapper6() {
    /*
    display: grid;
  background: no-repeat url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/12005/grid.png);
  grid-gap: 10px;
  grid-template-columns:  repeat(6, 150px);
  grid-template-rows: repeat( 4, 150px);
  background-color: #fff;
  color: #444;
     */

    val wrapper6 = View(this)

    binding.gridRoot.addView(wrapper6)

    val boxA = createParentWith2Kids("This is box A.", "align-self: stretch")
    val boxB = createParentWith2Kids("This is box B.", "align-self: end")
    val boxC = createParentWith2Kids("This is box C.", "align-self: start")
    val boxD = createParentWith2Kids("This is box D.", "align-self: center")
    val boxE = createParentWith2Kids(
      "Each of the boxes on the left has a grid area of 3 columns and 3 rows (we're counting the gutter col/row). So each covers the same size area as box A.",
      "The align-self property is used to align the content inside the grid-area."
    )


    wrapper6.addView(boxA)
    wrapper6.addView(boxB)
    wrapper6.addView(boxC)
    wrapper6.addView(boxD)
    wrapper6.addView(boxE)


    wrapper6.apply {
      //  background = ColorDrawable(Color.WHITE)
      display = Display.Grid
      setGap(toPx(10F), toPx(10F))
      gridTemplateColumns = arrayOf(
        TrackSizingFunction.AutoRepeat(
          GridTrackRepetition.Count(6),
          arrayOf(MinMax.Points(toPx(150F)))
        )
      )

      gridTemplateRows = arrayOf(
        TrackSizingFunction.AutoRepeat(
          GridTrackRepetition.Count(4),
          arrayOf(MinMax.Points(toPx(150F)))
        )
      )
    }

    val bg = ColorDrawable(Color.parseColor("#444444"))

    boxA.apply {
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = wrapper6.nodeForView(this)
      this.clipChildren = false
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          alignSelf = AlignSelf.Stretch
        }
      }
    }

    boxB.apply {
      //background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = wrapper6.nodeForView(this)
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(5))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          alignSelf = AlignSelf.End
        }
      }
    }

    boxC.apply {
      // background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = wrapper6.nodeForView(this)
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          gridRow = Line(GridPlacement.Line(3), GridPlacement.Line(6))
          alignSelf = AlignSelf.Start
        }
      }
    }

    boxD.apply {
      // background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = wrapper6.nodeForView(this)
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(5))
          gridRow = Line(GridPlacement.Line(3), GridPlacement.Line(6))
          alignSelf = AlignSelf.Center
        }
      }
    }

    boxE.apply {
      //background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = wrapper6.nodeForView(this)
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(5), GridPlacement.Line(7))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(6))
          alignSelf = AlignSelf.Stretch
        }
      }
    }
  }
}
