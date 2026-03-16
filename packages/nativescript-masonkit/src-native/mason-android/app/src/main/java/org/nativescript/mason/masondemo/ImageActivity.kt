package org.nativescript.mason.masondemo

import android.animation.ValueAnimator
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.util.Log
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.target.DrawableImageViewTarget
import com.bumptech.glide.request.target.ImageViewTarget
import com.bumptech.glide.request.target.SizeReadyCallback
import com.bumptech.glide.request.target.Target
import com.bumptech.glide.request.transition.Transition
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Size

class ImageActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val androidRoot = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
    }
    val root = mason.createView(this)
    root.style.background = "blue"
    val text = mason.createTextView(this)
    text.append("Hello")

    androidRoot.addView(root)

    enableEdgeToEdge()

    ViewCompat.setOnApplyWindowInsetsListener(androidRoot) { view, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      view.setPadding(
        systemBars.left + 24, systemBars.top + 24,
        systemBars.right + 24, 0
      )
      insets
    }


    val text2 = mason.createTextView(this)
    text2.append("\n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris. ")

    //text.append(text2)

    val image = mason.createImageView(this)
    //text.append(image)
    root.addView(text)

    image.configure {
      it.size = Size(Dimension.Points(300f), Dimension.Points(300f))
    }

    image.src = "https://picsum.photos/600/600"

    val image2 = mason.createImageView(this)
  //  root.addView(image2)

    image2.src = "https://picsum.photos/800/800"

    Log.d("com.test", "${root.style}")

    setContentView(androidRoot)

    /*
    ValueAnimator()
      .apply {
        startDelay = 2000
        duration = 3000
        setFloatValues(300F, 200F, 300F)
        addUpdateListener { animator ->
          image.configure {
            style.setSizeHeight(Dimension.Points(animator.animatedValue as Float))
          }
        }
      }.start()

    */

  }
}
