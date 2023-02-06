package org.nativescript.mason.masondemo

import android.net.Uri
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import com.bumptech.glide.Glide
import org.nativescript.mason.masondemo.databinding.ActivityImageBinding
import java.util.Timer
import java.util.TimerTask
import kotlin.concurrent.schedule

class ImageActivity : AppCompatActivity() {
  lateinit var binding: ActivityImageBinding
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityImageBinding.inflate(layoutInflater)
    setContentView(binding.root)

    Timer().schedule(
      5000
    ) {

      runOnUiThread {
        Glide.with(binding.imageView)
          .load(
            Uri.parse(
              "https://picsum.photos/600/600"
            )
          ).into(binding.imageView)
      }
    }
  }
}
