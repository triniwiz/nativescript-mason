package org.nativescript.mason.masondemo

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import org.nativescript.mason.masondemo.databinding.ActivityAnimationBinding
import org.nativescript.mason.masonkit.Dimension

class AnimationActivity : AppCompatActivity() {
  lateinit var binding: ActivityAnimationBinding
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityAnimationBinding.inflate(layoutInflater)
    setContentView(binding.root)

    ValueAnimator()
      .apply {
        startDelay = 2000
        setFloatValues(100F,30F)
        addUpdateListener { animator ->
          binding.root.configure {
            it.style.size.height = Dimension.Percent(animator.animatedValue as Float / 100)
          }
        }
      }.start()

  }
}
