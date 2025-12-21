package org.nativescript.mason.masondemo

import android.animation.ValueAnimator
import android.graphics.Color
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size

class AnimationActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val root = mason.createView(this)
    enableEdgeToEdge()

    ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      root.style.padding = Rect(
        LengthPercentage.Points(systemBars.top.toFloat()),
        LengthPercentage.Points(systemBars.right.toFloat()),
        LengthPercentage.Points(systemBars.bottom.toFloat()),
        LengthPercentage.Points(systemBars.left.toFloat())
      )
      insets
    }

    root.style.size =
      Size(Dimension.Percent(1f), Dimension.Percent(1f))

    val animatedView = mason.createView(this)

    animatedView.configure {
      it.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    }
    animatedView.setBackgroundColor(Color.BLUE)

    root.addView(animatedView)

    setContentView(root)


    ValueAnimator()
      .apply {
        startDelay = 2000
        duration = 3000
        setFloatValues(1F, 0F, 1F)
        repeatCount = ValueAnimator.INFINITE
        repeatMode = ValueAnimator.REVERSE
        addUpdateListener { animator ->
//          animatedView.style.setSizeHeight(Dimension.Percent(animator.animatedValue as Float))
          animatedView.style.size = Size(
            Dimension.Percent(animator.animatedValue as Float),
            Dimension.Percent(animator.animatedValue as Float)
          )
        }
      }.start()
  }
}
