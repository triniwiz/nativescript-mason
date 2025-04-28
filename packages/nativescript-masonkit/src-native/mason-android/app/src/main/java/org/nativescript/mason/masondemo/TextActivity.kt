package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.text.Styles
import java.util.Timer
import kotlin.concurrent.schedule


class TextActivity : AppCompatActivity() {
  lateinit var root: View
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

//    val root = Mason.shared.createView(this)
//
//    val a = Mason.shared.createTextView(this)
//    a.updateText("A")
//
//    val b = Mason.shared.createTextView(this)
//    b.updateText("B")
//    root.addView(a)
//    root.addView(b)
//    setContentView(root)
    // testWrap()

    val root = Mason.shared.createView(this)
    val a = Mason.shared.createTextView(this)
    a.updateText("A")
    val b = Mason.shared.createTextView(this)
    b.updateText("B")
    root.addView(a, 0)
    root.addView(b, 1)
    setContentView(root)
  }

  fun testWrap() {
    val root = View(this)

    val a = TextView(this)
    a.textWrap = Styles.TextWrap.Wrap
    a.updateText("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris.")


    val b = TextView(this)
    b.updateText("Looking Out")
    b.color = Color.RED

    Log.d("com.test", "a $a b $b")

    a.addView(b)
    root.addView(a)
    setContentView(root)

    Timer().schedule(2000L) {
      runOnUiThread {
        b.fontSize = 60
        Log.d("com.test", "root $root ${root.node}")
      }
    }
  }

  fun testText() {
    val textOther = Mason.shared.createTextView(this)
    textOther.color = Color.RED
    textOther.updateText("Other")

    root.addView(textOther)

    val text = Mason.shared.createTextView(this)

    text.backgroundColorValue = Color.CYAN
    text.color = Color.RED
    text.updateText(
      "Hello World"
    )

    // root.addView(text)

//    text.textAlign = TextAlign.Justify
//    text.textJustify = TextJustify.InterWord

    val img = ImageView(this)
    img.setImageResource(R.mipmap.ic_launcher_ns)


    val text2 = Mason.shared.createTextView(this)
    text2.color = Color.BLUE
    text2.backgroundColorValue = Color.YELLOW
//    text2.configure {
//      it.style.size = Size(Dimension.Auto, Dimension.Points(300f))
//    }
    text2.updateText(
      "Lorem ipsum dolor sit amet."
    )
    val text3 = Mason.shared.createTextView(this)
    text3.color = Color.GREEN
    text3.updateText(
      "Just adding a break here"
    )
    val img2 = ImageView(this)
    img2.setImageResource(R.mipmap.ic_launcher)

    Mason.shared.nodeForView(img2).configure {
      style.size = Size(Dimension.Points(300f), Dimension.Points(300f))
    }

    val view = LinearLayout(this)
    view.setBackgroundColor(Color.RED)
    Mason.shared.nodeForView(view).configure {
      style.size = Size(Dimension.Points(110f), Dimension.Points(110f))
    }

    val view2 = Mason.shared.createView(this)
    view2.setBackgroundColor(Color.BLUE)
    view2.configure {
      style.size = Size(Dimension.Points(150f), Dimension.Points(150f))
    }

    val nest1 = Mason.shared.createTextView(this)
    nest1.updateText("This")
    nest1.color = Color.RED
    nest1.backgroundColorValue = Color.parseColor("#FFA500")



    Timer().schedule(3000L) {
      runOnUiThread {
        nest1.configureText {
          this.updateText(
            ""
          )
          nest1.color = Color.CYAN


          Timer().schedule(3000L) {
            runOnUiThread {
              nest1.configureText {
                this.updateText(
                  "Blue"
                )
                nest1.color = Color.BLUE
              }
            }
          }
        }
      }
    }


    val nest11 = Mason.shared.createTextView(this)
    nest11.color = Color.BLUE
    nest11.backgroundColorValue = Color.parseColor("red")

    val nest111 = Mason.shared.createTextView(this)
    nest111.updateText(" testing")
    nest111.color = Color.YELLOW
    nest111.backgroundColorValue = Color.parseColor("#FFC0CB")

    val nest1111 = Mason.shared.createTextView(this)
    nest1111.color = Color.GREEN
    nest1111.backgroundColorValue = Color.parseColor("#BF40BF")

    nest1.addView(nest11)

    Timer().schedule(3000L) {
      runOnUiThread {
        // nest1.removeView(nest1111)
        nest11.updateText(" is")
      }
    }


    nest1.addView(nest111)

    nest1.addView(nest1111)

    nest1.addView(img)


    Timer().schedule(3000L) {
      runOnUiThread {
        // nest1.removeView(nest1111)
        nest1111.updateText(" nesting")

        Timer().schedule(1000L) {
          runOnUiThread {
            // nest1.removeView(nest1111)
            nest11.updateText(" is")

            Timer().schedule(1000L) {
              runOnUiThread {
                //  nest11.backgroundColorValue = Color.CYAN


                Timer().schedule(1000L) {
                  runOnUiThread {
                    //   nest1.removeView(nest1111)
                  }
                }
              }
            }
          }
        }
      }
    }


    text.addView(img)

    text.addView(img2)

    text.addView(view)

    text.addView(text2)
    text.addView(text3)


    // text.addView(nest1)

    root.addView(nest1)


    /*
        ValueAnimator()
          .apply {
            startDelay = 2000
            duration = 3000
            setFloatValues(1F, .3F, 1F)
            addUpdateListener { animator ->
              Log.d("com.test", "animate")
              val per = animator.animatedValue as Float
              mason.nodeForView(view).configure {
                it.style.size = Size(
                  Dimension.Points((it.style.size.width as Dimension.Points).points * per),
                  Dimension.Points((it.style.size.height as Dimension.Points).points * per)
                )
              }
            }
          }.start()

        */

  }
}
