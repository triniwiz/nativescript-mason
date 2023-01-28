package org.nativescript.mason.masondemo

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.ViewGroup
import android.widget.TextView
import org.nativescript.mason.masonkit.View

class ScrollActivity : AppCompatActivity() {
  lateinit var container: View

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_scroll)

    container = findViewById(R.id.container)

    repeat(1000) {
      val view = TextView(this)
      val text = "Laffy Taffy ${it + 1}"
      view.text = text
      container.addView(
        view, ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
      )
    }
  }
}
