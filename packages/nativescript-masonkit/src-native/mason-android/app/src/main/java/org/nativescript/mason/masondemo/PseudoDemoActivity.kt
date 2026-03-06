package org.nativescript.mason.masondemo

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Button
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.PseudoState
import org.nativescript.mason.masonkit.StyleKeys

class PseudoDemoActivity : AppCompatActivity() {
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var mason: Mason

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    mason = Mason()

    val layout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(24, 24, 24, 24)
    }

    val btn1 = Button(this, mason).apply {
      textContent = "Press Me"
    }

    val btn2 = Button(this, mason).apply {
      textContent = "Hover / Focus Test"
    }

    val info = TextView(this)

    layout.addView(btn1, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ))

    layout.addView(btn2, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ))

    layout.addView(info, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ))

    enableEdgeToEdge()

    ViewCompat.setOnApplyWindowInsetsListener(layout) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      // apply padding to container so content respects system bars
      layout.setPadding(
        systemBars.left, systemBars.top, systemBars.right, systemBars.bottom
      )
      insets
    }

    setContentView(layout)

    //btn1.node.preparePseudoBuffer(Mas)

    // Periodically update pseudo state and buffer info for the first button
    handler.post(object : Runnable {
      override fun run() {
        try {
          val mask = btn1.node.pseudoMask
          val buf =  btn1.node.preparePseudoBuffer(PseudoState.ACTIVE.mask)
          buf.putInt(StyleKeys.BACKGROUND_COLOR, Color.RED)
          val len = buf.capacity()
          info.text = "mask=0x${"%04x".format(mask)} bufferLen=$len"
        } catch (t: Throwable) {
          info.text = "error: ${t.message}"
        }
        handler.postDelayed(this, 250)
      }
    })
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    super.onDestroy()
  }
}
