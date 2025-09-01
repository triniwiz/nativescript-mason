package org.nativescript.mason.masondemo

import android.animation.ValueAnimator
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.toColorInt
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Display
import org.nativescript.mason.masonkit.Img
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextType
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.text.Styles
import java.util.Timer
import kotlin.concurrent.schedule


class TextActivity : AppCompatActivity() {
  lateinit var root: View
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    root = Mason.shared.createView(this)
    ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      root.style.padding = Rect(
        LengthPercentage.Points(systemBars.left.toFloat()),
        LengthPercentage.Points(systemBars.right.toFloat()),
        LengthPercentage.Points(systemBars.top.toFloat()),
        LengthPercentage.Points(systemBars.bottom.toFloat())
      )

      insets
    }

    // basicNesting()
    // testText()
    // textWithImage()
    // basicBlock()
    // testWrap()
    testElements()
    setContentView(root)
  }

  fun testElements() {
    val h1 = Mason.shared.createTextView(this, TextType.H1)
    h1.updateText("This is heading 1")

    val h2 = Mason.shared.createTextView(this, TextType.H2)
    h2.updateText("This is heading 2")


    val h3 = Mason.shared.createTextView(this, TextType.H3)
    h3.updateText("This is heading 3")


    val h4 = Mason.shared.createTextView(this, TextType.H4)
    h4.updateText("This is heading 4")

    val h5 = Mason.shared.createTextView(this, TextType.H5)
    h5.updateText("This is heading 5")


    val h6 = Mason.shared.createTextView(this, TextType.H6)
    h6.updateText("This is heading 6")


    val p = Mason.shared.createTextView(this, TextType.P)
    p.updateText("Tip:")

    val span = Mason.shared.createTextView(this, TextType.Span)
    span.updateText(" Use h1 to h6 elements only for headings. Do not use them just to make text bold or big. Use other tags for that.")

    p.addView(span)

    root.addViews(arrayOf(h1, h2, h3, h4, h5, h6, p))

  }

  fun textWithImage() {
    val txt = TextView(this)
    txt.setBackgroundColor(Color.CYAN)
    txt.backgroundColorValue = Color.GREEN
    txt.color = Color.RED
    txt.updateText("Inline Image ")

    val img = Img(this)
    img.setBackgroundColor(Color.BLUE)

    img.node.style.size = Size(
      Dimension.Points(150f), Dimension.Points(150f)
    )

    txt.addView(img)
    img.setImageResource(R.mipmap.ic_launcher_ns)


    root.addView(txt)


  }

  fun basicNesting() {

    val a = TextView(this)
    a.updateText("This should")


    val b = TextView(this)
    b.updateText(" be Inlined")
    b.color = Color.RED

    val c = TextView(this)
    c.updateText(" Nice!!!")
    c.color = Color.BLUE


    // a.addView(b)
    a.addView(b)
    a.addView(c)
    root.addView(a)
    //setContentView(root)
  }

  fun basicBlock() {

    val a = TextView(this)
    a.updateText("This should")


    val b = TextView(this)
    b.updateText(" be different")
    b.color = Color.RED

    val c = TextView(this)
    c.updateText(" Lines!!!")
    c.color = Color.BLUE


    // a.addView(b)
    root.addView(a)
    root.addView(b)
    root.addView(c)
    //setContentView(root)
  }

  fun basicInline() {

    val a = TextView(this, Mason.shared, TextType.Span)
    a.updateText("This should")


    val b = TextView(this, Mason.shared, TextType.Span)
    b.updateText(" be Inlined")
    b.color = Color.RED

    val c = TextView(this, Mason.shared, TextType.Span)
    c.updateText(" Nice!!!")
    c.color = Color.BLUE


    // a.addView(b)
    root.addView(a)
    root.addView(b)
    root.addView(c)
    //setContentView(root)
  }

  fun testWrap() {
    val a = TextView(this)
    a.textWrap = Styles.TextWrap.Wrap
    a.updateText("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris.")


    val b = TextView(this)
    b.style.display = Display.Inline
    b.updateText("Looking Out")
    b.color = Color.RED
    b.backgroundColorValue = Color.BLUE

    Log.d("com.test", "a $a b $b")

    root.addView(a)
    a.addView(b)
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

    val img = Img(this)
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
    val img2 = Img(this)
    img2.setImageResource(R.mipmap.ic_launcher)

    img2.configure {
      style.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    }

    val img3 = Img(this)
    img3.setImageResource(R.mipmap.ic_launcher_ns)

    img3.configure {
      style.size = Size(Dimension.Points(110f), Dimension.Points(110f))
    }

    val view = View(this)
    view.setBackgroundColor(Color.RED)
    view.configure {
      style.size = Size(Dimension.Points(120f), Dimension.Points(120f))
    }

    val view2 = View(this)
    view2.setBackgroundColor(Color.BLUE)
    view2.configure {
      style.size = Size(Dimension.Points(150f), Dimension.Points(150f))
    }

    val nest1 = Mason.shared.createTextView(this)
    nest1.updateText("This")
    nest1.color = Color.RED
    nest1.backgroundColorValue = "#FFA500".toColorInt()


    Timer().schedule(3000L) {
      runOnUiThread {
        nest1.configureText {
          this.updateText(
            ""
          )
          nest1.color = Color.CYAN


          Timer().schedule(1000L) {
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
    nest11.backgroundColorValue = Color.RED

    val nest111 = Mason.shared.createTextView(this)
    nest111.updateText(" testing")
    nest111.color = Color.YELLOW
    nest111.backgroundColorValue = "#FFC0CB".toColorInt()

    val nest1111 = Mason.shared.createTextView(this)
    nest1111.color = Color.GREEN
    nest1111.backgroundColorValue = Color.parseColor("#BF40BF")

    nest1.addView(nest11)

    Timer().schedule(4500L) {
      runOnUiThread {
        // nest1.removeView(nest1111)
        nest11.updateText(" is")
      }
    }


    nest1.addView(nest111)

    nest1.addView(nest1111)

    //  nest1.addView(img)


    /*
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

    */


    text.addView(img)

    text.addView(img2)

    text.addView(img3)

    text.addView(view)

//    text.addView(text2)
//    text.addView(text3)


    text.addView(nest1)

    root.addView(text)


    val size = view.style.size
    ValueAnimator()
      .apply {
        startDelay = 2000
        duration = 3000
        setFloatValues(1F, .3F, 1F)
        repeatCount = ValueAnimator.INFINITE
        repeatMode = ValueAnimator.REVERSE
        addUpdateListener { animator ->
          val per = animator.animatedValue as Float
          val newWidth = (size.width as Dimension.Points).points * per
          val newHeight = (size.height as Dimension.Points).points * per
          view.style.size = Size(
            Dimension.Points(newWidth),
            Dimension.Points(newHeight)
          )
        }
      }.start()


  }
}
