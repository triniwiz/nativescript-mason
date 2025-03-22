package org.nativescript.mason.masondemo

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.util.AttributeSet
import android.util.Log
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextAlign
import org.nativescript.mason.masonkit.text.Styles.TextJustify
import java.util.Timer
import kotlin.concurrent.schedule


class TextActivity : AppCompatActivity() {
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val root = mason.createView(this)
    val text = mason.createTextView(this)
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


    val text2 = mason.createTextView(this)
    text2.color = Color.BLUE
    text2.backgroundColorValue = Color.YELLOW
//    text2.configure {
//      it.style.size = Size(Dimension.Auto, Dimension.Points(300f))
//    }
    text2.updateText(
      "Lorem ipsum dolor sit amet."
    )
    val text3 = mason.createTextView(this)
    text3.color = Color.GREEN
    text3.updateText(
      "Just adding a break here"
    )
    val img2 = ImageView(this)
    img2.setImageResource(R.mipmap.ic_launcher)


    val view = LinearLayout(this)
    view.setBackgroundColor(Color.RED)
    mason.nodeForView(view).configure {
      style.size = Size(Dimension.Points(110f), Dimension.Points(110f))
    }

    val view2 = mason.createView(this)
    view2.setBackgroundColor(Color.BLUE)
    view2.configure {
      style.size = Size(Dimension.Points(150f), Dimension.Points(150f))
    }

    val nest1 = mason.createTextView(this)
    nest1.updateText("This")
    nest1.color = Color.RED
    nest1.backgroundColorValue = Color.parseColor("#FFA500")

    /*

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

    */



    val nest11 = mason.createTextView(this)
    nest11.color = Color.BLUE
    nest11.backgroundColorValue = Color.parseColor("red")

    val nest111 = mason.createTextView(this)
    nest111.updateText(" testing")
    nest111.color = Color.YELLOW
    nest111.backgroundColorValue = Color.parseColor("#FFC0CB")

    val nest1111 = mason.createTextView(this)
    nest1111.color = Color.GREEN
    nest1111.backgroundColorValue = Color.parseColor("#BF40BF")

    nest1.addView(nest11)

    Timer().schedule(3000L) {
      runOnUiThread {
        // nest1.removeView(nest1111)
        nest11.updateText(" is")
      }}


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



    /*

      text.addView(img)

       text.addView(img2)

    text.addView(view)


    text.addView(text2)
    text.addView(text3)

    */

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


    setContentView(root)

  }
}
