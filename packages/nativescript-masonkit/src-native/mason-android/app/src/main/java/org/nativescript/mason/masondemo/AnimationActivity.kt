package org.nativescript.mason.masondemo

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import androidx.core.view.size
import org.nativescript.mason.masondemo.databinding.ActivityAnimationBinding
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size

class AnimationActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val root = mason.createView(this)
    root.setBackgroundColor(Color.RED)
    root.style.size =
      Size(Dimension.Points(resources.displayMetrics.widthPixels.toFloat()), Dimension.Percent(1f))
    val animatedView = mason.createView(this)
    animatedView.setBackgroundColor(Color.BLUE)
    animatedView.configure {
      style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    }

    root.addView(animatedView)

    setContentView(root)


    ValueAnimator()
      .apply {
        startDelay = 2000
        duration = 3000
        setFloatValues(1F, .3F, 1F)
        addUpdateListener { animator ->
          animatedView.configure {
            style.setSizeHeight(Dimension.Percent(animator.animatedValue as Float))
          }
        }
      }.start()
  }
}
