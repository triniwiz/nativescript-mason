package org.nativescript.mason.masonkit

import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.SeekBar
import android.widget.TextView
import androidx.core.graphics.ColorUtils

class ColorInput @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null
) : FrameLayout(context, attrs) {
  val colorView = View(context)
  private var hueTrackDrawable: HueTrackDrawable? = null

  init {
    colorView.setBackgroundColor(Color.BLACK)
    val padding = (4 * resources.displayMetrics.density).toInt()
    setPadding(padding, padding, padding, padding)
    addView(
      colorView, LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
    )

    setOnClickListener {
      // show color picker dialog
      val dlg = Dialog(context)
      val inflater = LayoutInflater.from(context)
      val root = inflater.inflate(
        R.layout.color_picker,
        null as ViewGroup?
      )

      val preview = root.findViewById<View>(R.id.preview_color)
      val hue = root.findViewById<SeekBar>(R.id.seek_hue)
      val hText = root.findViewById<EditText>(R.id.h_value)
      val sText = root.findViewById<EditText>(R.id.s_value)
      val lText = root.findViewById<EditText>(R.id.l_value)
      val colorArea = root.findViewById<FrameLayout>(R.id.color_area)
      val btnOk = root.findViewById<Button?>(R.id.btn_ok)
      val btnCancel = root.findViewById<Button?>(R.id.btn_cancel)
      val outSwitcher = root.findViewById<View>(R.id.output_switcher)
      val outA = root.findViewById<TextView>(R.id.out_a)
      val outB = root.findViewById<TextView>(R.id.out_b)
      val outC = root.findViewById<TextView>(R.id.out_c)
      val hexView = root.findViewById<EditText>(R.id.hex_value)

      // initial HSL values
      var h = 0f
      var s = 0f
      var l = 0f
      var selectedColor = Color.BLACK
      var outMode = 0 // 0 = RGB, 1 = HSL, 2 = HEX

      fun updateOutputFields(col: Int) {
        // Toggle between RGB / HSL / HEX displays.
        when (outMode) {
          0 -> {
            // RGB: show three value boxes, hide hex
            hexView.visibility = View.GONE
            hText.visibility = View.VISIBLE
            sText.visibility = View.VISIBLE
            lText.visibility = View.VISIBLE

            outA.text = "R"
            outB.text = "G"
            outC.text = "B"

            val r = Color.red(col)
            val g = Color.green(col)
            val b = Color.blue(col)
            hText.setText("$r")
            sText.setText("$g")
            lText.setText("$b")
          }

          1 -> {
            // HSL: show three value boxes, hide hex
            hexView.visibility = View.GONE
            hText.visibility = View.VISIBLE
            sText.visibility = View.VISIBLE
            lText.visibility = View.VISIBLE
            val hsl = FloatArray(3)
            ColorUtils.colorToHSL(col, hsl)
            hText.setText("${hsl[0].toInt()}")
            sText.setText("${(hsl[1] * 100).toInt()}")
            lText.setText("${(hsl[2] * 100).toInt()}")
            outA.text = "H"
            outB.text = "S"
            outC.text = "L"
          }

          else -> {
            // HEX: show single hex box
            hexView.visibility = View.VISIBLE
            hText.visibility = View.GONE
            sText.visibility = View.GONE
            lText.visibility = View.GONE
            val hex = String.format("#%06X", 0xFFFFFF and col)
            hexView.setText(hex)

            outA.text = "H"
            outB.text = "E"
            outC.text = "x"
          }
        }
      }

      outSwitcher?.setOnClickListener {
        outMode = (outMode + 1) % 3
        updateOutputFields(selectedColor)
      }



      fun updatePreview() {
        val rgb = ColorUtils.HSLToColor(floatArrayOf(h, s, l))
        preview.setBackgroundColor(rgb)
      }

      hue.background = null
      hue.progress = h.toInt()
      // add saturation/value view into the color area
      val svView = SaturationValueView(context)
      svView.layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
      svView.hue = h
      colorArea.addView(svView)

      // commit edits from user into the color model when editing finishes
      fun applyEditedOutputs() {
        try {
          when (outMode) {
            0 -> {
              // RGB
              val r = hText.text.toString().toIntOrNull() ?: 0
              val g = sText.text.toString().toIntOrNull() ?: 0
              val b = lText.text.toString().toIntOrNull() ?: 0
              val rr = r.coerceIn(0, 255)
              val gg = g.coerceIn(0, 255)
              val bb = b.coerceIn(0, 255)
              selectedColor = Color.rgb(rr, gg, bb)
            }

            1 -> {
              // HSL (h, s%, l%)
              val hh = hText.text.toString().toFloatOrNull() ?: 0f
              val ss = sText.text.toString().toFloatOrNull() ?: 0f
              val ll = lText.text.toString().toFloatOrNull() ?: 0f
              val rgb = ColorUtils.HSLToColor(floatArrayOf(hh, (ss / 100f).coerceIn(0f, 1f), (ll / 100f).coerceIn(0f, 1f)))
              selectedColor = rgb
            }

            else -> {
              // HEX
              val txt = hexView.text.toString().trim()
              try {
                selectedColor = if (txt.startsWith("#")) Color.parseColor(txt) else Color.parseColor("#${txt}")
              } catch (_: Exception) {
              }
            }
          }
        } catch (_: Exception) {
        }
        // propagate selectedColor into UI (seekbar, SV, preview)
        val hsvTmp = FloatArray(3)
        android.graphics.Color.colorToHSV(selectedColor, hsvTmp)
        h = hsvTmp[0]
        svView.hue = h
        svView.sat = hsvTmp[1]
        svView.valueV = hsvTmp[2]
        try { hue.progress = h.toInt() } catch (_: Exception) {}
        updatePreview()
        updateOutputFields(selectedColor)
      }

      // apply edits when fields lose focus
      hText.setOnFocusChangeListener { _, hasFocus -> if (!hasFocus) applyEditedOutputs() }
      sText.setOnFocusChangeListener { _, hasFocus -> if (!hasFocus) applyEditedOutputs() }
      lText.setOnFocusChangeListener { _, hasFocus -> if (!hasFocus) applyEditedOutputs() }
      hexView.setOnFocusChangeListener { _, hasFocus -> if (!hasFocus) applyEditedOutputs() }

      // create a hue gradient bitmap for the SeekBar after layout
      var huePressed = false
      hue.viewTreeObserver.addOnGlobalLayoutListener(object :
        ViewTreeObserver.OnGlobalLayoutListener {
        override fun onGlobalLayout() {
          val w = hue.width
          val hPx = hue.height.coerceAtLeast((6 * resources.displayMetrics.density).toInt())
          if (w <= 0 || hPx <= 0) return
          // initialize hue track drawable and set initial gap
          // compute thumb center X robustly: prefer thumb bounds if available
          val posX = run {
            val tb = try {
              hue.thumb?.bounds
            } catch (_: Exception) {
              null
            }
            if (tb != null && !tb.isEmpty) tb.centerX() else {
              // map progress -> pixel in the inner track area (respect paddings)
              val avail = (w - hue.paddingLeft - hue.paddingRight).coerceAtLeast(1)
              val x = (hue.progress.toFloat() / hue.max) * (avail - 1)
              (hue.paddingLeft + x).toInt()
            }
          }
          val trackH = (12 * resources.displayMetrics.density).toInt()
          // create a fresh HueTrackDrawable for this SeekBar instance so
          // a newly-created dialog always has the correct progress drawable
          hueTrackDrawable = HueTrackDrawable(trackH, resources.displayMetrics.density)
          try {
            hue.progressDrawable = hueTrackDrawable
          } catch (_: Exception) {
          }
          hueTrackDrawable?.setGap(posX, huePressed)
          // ensure thumb reflects current selection (respect pressed state)
          val trackColorInit = android.graphics.Color.HSVToColor(floatArrayOf(h, 1f, 1f))
          setHueThumb(hue, trackColorInit, huePressed)
          try {
            hue.viewTreeObserver.removeOnGlobalLayoutListener(this)
          } catch (_: Exception) {
          }
        }
      })
      // change thumb when touching the hue bar
      hue.setOnTouchListener { v, event ->
        when (event.actionMasked) {
          MotionEvent.ACTION_DOWN -> {
            huePressed = true
            val trackColorDown = android.graphics.Color.HSVToColor(floatArrayOf(h, 1f, 1f))
            setHueThumb(hue, trackColorDown, true)
          }

          MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
            huePressed = false
            val trackColorUp = android.graphics.Color.HSVToColor(floatArrayOf(h, 1f, 1f))
            setHueThumb(hue, trackColorUp, false)
          }
        }
        // allow SeekBar to handle the touch as well
        false
      }
      hue.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
        override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
          h = progress.toFloat()
          svView.hue = h
          // compute color from HSV (h, s, v) where svView holds latest s/v
          val hsv = floatArrayOf(h, svView.sat, svView.valueV)
          val rgb = android.graphics.Color.HSVToColor(hsv)
          val hsl = FloatArray(3)
          ColorUtils.colorToHSL(rgb, hsl)
          s = hsl[1]
          l = hsl[2]
          updatePreview()
          hText.setText(progress.toString())
          sText.setText("${(s * 100).toInt()}")
          lText.setText("${(l * 100).toInt()}")
          selectedColor = rgb
          val trackColor = android.graphics.Color.HSVToColor(floatArrayOf(h, 1f, 1f))
          setHueThumb(hue, trackColor, huePressed)
          updateOutputFields(selectedColor)
          // update hue drawable gap
          val posX = run {
            val tb = try {
              hue.thumb?.bounds
            } catch (_: Exception) {
              null
            }
            if (tb != null && !tb.isEmpty) tb.centerX() else {
              val avail = (hue.width - hue.paddingLeft - hue.paddingRight).coerceAtLeast(1)
              val x = (progress.toFloat() / hue.max) * (avail - 1)
              (hue.paddingLeft + x).toInt()
            }
          }
          hueTrackDrawable?.setGap(posX, huePressed)
        }

        override fun onStartTrackingTouch(seekBar: SeekBar?) {}
        override fun onStopTrackingTouch(seekBar: SeekBar?) {}
      })

      // SV change handler
      svView.onSVChanged = { sv, vv ->
        // build HSV color
        val hsv = floatArrayOf(h, sv, vv)
        val rgb = android.graphics.Color.HSVToColor(hsv)
        val hsl = FloatArray(3)
        ColorUtils.colorToHSL(rgb, hsl)
        s = hsl[1]
        l = hsl[2]
        selectedColor = rgb
        val trackColorSV = android.graphics.Color.HSVToColor(floatArrayOf(h, 1f, 1f))
        setHueThumb(hue, trackColorSV, huePressed)
        updateOutputFields(selectedColor)
        // keep gap updated when SV changes
        val posX = run {
          val tb = try {
            hue.thumb?.bounds
          } catch (_: Exception) {
            null
          }
          if (tb != null && !tb.isEmpty) tb.centerX() else {
            val avail = (hue.width - hue.paddingLeft - hue.paddingRight).coerceAtLeast(1)
            val x = (hue.progress.toFloat() / hue.max) * (avail - 1)
            (hue.paddingLeft + x).toInt()
          }
        }
        hueTrackDrawable?.setGap(posX, huePressed)
        updatePreview()
        hText.setText(h.toInt().toString())
        sText.setText("${(s * 100).toInt()}")
        lText.setText("${(l * 100).toInt()}")
      }

      updatePreview()
      // initialize output fields to current color/mode
      updateOutputFields(selectedColor)

      dlg.setContentView(root)
      dlg.show()

      // increase dialog width to look more like the reference
      val dm = resources.displayMetrics
      val widthPx = (340 * dm.density).toInt()
      dlg.window?.setLayout(widthPx, WindowManager.LayoutParams.WRAP_CONTENT)

      btnCancel?.setOnClickListener { dlg.dismiss() }
      btnOk?.setOnClickListener {
        // persist selected color back to the colorView
        colorView.setBackgroundColor(selectedColor)
        dlg.dismiss()
      }
    }
  }

  private fun setHueThumb(seek: SeekBar, color: Int, pressed: Boolean = false) {
    // Mutate the existing thumb drawable when possible to avoid triggering re-layout
    try {
      val current = seek.thumb
      if (current != null) {
        val d = current.mutate()

        // try to find any GradientDrawable inside and set its color
        fun setInnerColor(drawable: android.graphics.drawable.Drawable) {
          when (drawable) {
            is android.graphics.drawable.LayerDrawable -> {
              for (i in 0 until drawable.numberOfLayers) {
                val child = drawable.getDrawable(i)
                setInnerColor(child)
              }
            }

            is android.graphics.drawable.StateListDrawable -> {
              val stateContainer = drawable.constantState
              if (stateContainer is android.graphics.drawable.DrawableContainer.DrawableContainerState) {
                for (child in stateContainer.children) setInnerColor(child)
              }
            }

            is android.graphics.drawable.GradientDrawable -> {
              drawable.setColor(color)
            }
          }
        }
        setInnerColor(d)
        try {
          d.invalidateSelf()
        } catch (_: Exception) {
        }
      } else {
        // fallback: load the xml drawable once and set as thumb
        val d = context.getDrawable(R.drawable.seekbar_thumb_color_picker)?.mutate()
        if (d != null) {
          fun setInner(drawable: android.graphics.drawable.Drawable) {
            when (drawable) {
              is android.graphics.drawable.LayerDrawable -> {
                for (i in 0 until drawable.numberOfLayers) setInner(drawable.getDrawable(i))
              }

              is android.graphics.drawable.StateListDrawable -> {
                val stateContainer = drawable.constantState
                if (stateContainer is android.graphics.drawable.DrawableContainer.DrawableContainerState) {
                  for (child in stateContainer.children) setInner(child)
                }
              }

              is android.graphics.drawable.GradientDrawable -> drawable.setColor(color)
            }
          }
          setInner(d)
          seek.thumb = d
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

}
