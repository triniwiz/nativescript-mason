package org.nativescript.mason.masondemo

import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.nativescript.mason.masondemo.databinding.ActivityScrollBinding
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.View

class ScrollActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val rootLayout = LinearLayout(this) // mason.createView(this)
    rootLayout.orientation = LinearLayout.VERTICAL
    rootLayout.layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )
    val sv = ScrollView(this)

    sv.layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )

    val scrollRoot = mason.createView(this)

    repeat(1000) {
      val view = mason.createTextView(this)
      val text = "Laffy Taffy ${it + 1}"
      view.updateText(text)
      view.color = Color.BLACK

      scrollRoot.addView(
        view
      )
    }

    sv.addView(scrollRoot)

    rootLayout.addView(sv)

    setContentView(rootLayout)
  }
}
