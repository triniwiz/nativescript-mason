package org.nativescript.mason.masondemo

import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.ViewGroup
import android.widget.TextView
import org.nativescript.mason.masondemo.databinding.ActivityScrollBinding
import org.nativescript.mason.masonkit.View

class ScrollActivity : AppCompatActivity() {
  lateinit var binding: ActivityScrollBinding
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityScrollBinding.inflate(layoutInflater)
    setContentView(binding.root)


    repeat(1000) {
      val view = TextView(this)
      val text = "Laffy Taffy ${it + 1}"
      view.text = text
      view.setTextColor(Color.BLACK)
      binding.container.addView(
        view
      )
    }
  }
}
