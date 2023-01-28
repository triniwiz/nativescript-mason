package org.nativescript.mason.masondemo

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
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

    wrapper6()
  }

  fun wrapper5(){
    binding.gridRoot.apply {
      background = ColorDrawable(Color.WHITE)
      display = Display.Grid
      setGap(toPx(10F), toPx(10F))
      gridTemplateColumns = arrayOf(
        TrackSizingFunction.Single(MinMax.Points(toPx(100F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(100F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(100F)))
      )
    }

    val bg = ColorDrawable(Color.parseColor("#444444"))

    binding.boxA.apply {
      background = bg
      val node = binding.gridRoot.nodeForView(this)

      node.configure {
        it.style.apply {
          gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(1))
        }
      }
    }

    binding.boxB.apply {
      background = bg
      val node = binding.gridRoot.nodeForView(this)
      node.configure {
        it.style.apply {
          gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(3))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
        }
      }
    }

    binding.boxC.apply {
      background = bg
      val node = binding.gridRoot.nodeForView(this)
      node.configure {
        it.style.apply {
          gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(1))
          gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
        }
      }
    }

    binding.boxD.apply {
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

  fun wrapper6(){
    /*
    display: grid;
  background: no-repeat url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/12005/grid.png);
  grid-gap: 10px;
  grid-template-columns:  repeat(6, 150px);
  grid-template-rows: repeat( 4, 150px);
  background-color: #fff;
  color: #444;
     */
    binding.wrapper6.apply {
    //  background = ColorDrawable(Color.WHITE)
      display = Display.Grid
      setGap(toPx(10F), toPx(10F))
      gridTemplateColumns = arrayOf(
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F)))
      )

      gridTemplateRows = arrayOf(
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
        TrackSizingFunction.Single(MinMax.Points(toPx(150F))),
      )
    }

    val bg = ColorDrawable(Color.parseColor("#444444"))

    binding.boxA.apply {
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = binding.wrapper6.nodeForView(this)
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

    binding.boxB.apply {
      //background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = binding.wrapper6.nodeForView(this)
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(5))
          gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          alignSelf = AlignSelf.End
        }
      }
    }

    binding.boxC.apply {
     // background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = binding.wrapper6.nodeForView(this)
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
          gridRow = Line(GridPlacement.Line(3), GridPlacement.Line(6))
          alignSelf = AlignSelf.Start
        }
      }
    }

    binding.boxD.apply {
     // background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = binding.wrapper6.nodeForView(this)
      node.configure {
        it.style.apply {
          flexDirection = FlexDirection.Column
          gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(5))
          gridRow = Line(GridPlacement.Line(3), GridPlacement.Line(6))
          alignSelf = AlignSelf.Center
        }
      }
    }

    binding.boxE.apply {
      //background = bg
      background = resources.getDrawable(R.drawable.border_drawable)
      val node = binding.wrapper6.nodeForView(this)
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
