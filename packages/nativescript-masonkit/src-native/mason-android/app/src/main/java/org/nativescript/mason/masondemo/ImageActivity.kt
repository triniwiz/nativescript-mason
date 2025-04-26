package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.SizeReadyCallback
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Size

class ImageActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val root = mason.createView(this)
    val image = ImageView(this)
    root.addView(image)
//    mason.nodeForView(image)
//      .style
//      .setSizeWidth(Dimension.Points(300f))

    mason.nodeForView(image).configure {
      style.size = Size(Dimension.Points(300f), Dimension.Points(300f))
    }

    Glide.with(image)
      .load(
        "https://picsum.photos/600/600"
      )
      .into(image)
      .getSize { width, height -> Log.d("com.test", "width $width height $height") }

    setContentView(root)


  }
}
