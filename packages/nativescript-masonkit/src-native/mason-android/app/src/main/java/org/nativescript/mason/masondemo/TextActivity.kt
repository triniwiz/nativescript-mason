package org.nativescript.mason.masondemo

import android.animation.ValueAnimator
import android.graphics.Color
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.toColorInt
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.Styles
import org.nativescript.mason.masonkit.TextType
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View
import java.util.Timer
import kotlin.concurrent.schedule


class TextActivity : AppCompatActivity() {
  lateinit var body: View
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    body = Mason.shared.createView(this)
    ViewCompat.setOnApplyWindowInsetsListener(body) { view, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())

      body.style.padding = Rect(
        LengthPercentage.Points(systemBars.left.toFloat()),
        LengthPercentage.Points(systemBars.right.toFloat()),
        LengthPercentage.Points(systemBars.top.toFloat()),
        LengthPercentage.Points(systemBars.bottom.toFloat())
      )

      insets
    }

    enableEdgeToEdge()

    basicInline()
    //basicNesting()
    // testText()
    //textWithImage()
    // basicBlock()
    //  testWrap()
    //testElements()
    //testTextInsert()
   // inlineTest()
    setContentView(body)
  }

  fun testInsert() {
    val root = Mason.shared.createView(this)
    root.setBackgroundColor(Color.GREEN)
    val view = Mason.shared.createView(this)

    val checkmark = Mason.shared.createImageView(this)
    checkmark.style.size = Size(
      Dimension.Points(100f), Dimension.Points(100f)
    )
    checkmark.setImageResource(R.drawable.ic_launcher_foreground)

    view.append(checkmark)


    val div = Mason.shared.createView(this)
    div.setBackgroundColor(Color.RED)
    div.style.size = Size(
      Dimension.Points(100f), Dimension.Points(100f)
    )

    view.append(div)


//    let remove = NSCMason.shared.createImageView()
//    remove.style.size = MasonSize(
//      .Points(100), .Points(100)
//    )
//    remove.image = UIImage.remove
//
//
//    view.addChildAt(element: remove, 1)
//
//
//
//
//    root.append(view)
//    body.append(root)
//
//
//    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }

  fun testTextInsert() {
    val root = Mason.shared.createView(this)
    root.setBackgroundColor(Color.GREEN)

    val view = Mason.shared.createView(this)
    view.append("1")
    view.append("3")
    view.addChildAt("2", 1)
    view.append("4")

    val img = Mason.shared.createImageView(this)

    img.style.size = Size(
      Dimension.Points(100f), Dimension.Points(100f)
    )

    img.setImageResource(R.drawable.ttigraas)

    view.addChildAt(img, 3)

    view.append("5")

    root.append(view)
    body.append(root)
  }


  fun inlineTest() {
    val root = Mason.shared.createView(this)
    root.setBackgroundColor(Color.GRAY)
    val txt = Mason.shared.createTextView(this)
    txt.append("First")
    txt.id = android.view.View.generateViewId()

    val second = Mason.shared.createTextView(this)
    second.color = Color.BLUE
    second.append(" Second")
    second.id = android.view.View.generateViewId()

    txt.append(second)

    val img = Mason.shared.createImageView(this)

    img.style.size = Size(
      Dimension.Points(100f), Dimension.Points(100f)
    )
    img.setImageResource(R.drawable.ttigraas)

    txt.append(img)

    val view = Mason.shared.createView(this)
    view.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    view.setBackgroundColor(Color.MAGENTA)

    txt.append(view)

    root.append(arrayOf(txt))

    body.append(root)

    body.addOnLayoutChangeListener { v, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom ->
      Mason.shared.printTree(root.node)
    }

  }

  fun testElements() {
    val h1 = Mason.shared.createTextView(this, TextType.H1)
    h1.append("This is heading 1")

    val h2 = Mason.shared.createTextView(this, TextType.H2)
    h2.append("This is heading 2")

    val h3 = Mason.shared.createTextView(this, TextType.H3)
    h3.append("This is heading 3")


    val h4 = Mason.shared.createTextView(this, TextType.H4)
    h4.append("This is heading 4")

    val h5 = Mason.shared.createTextView(this, TextType.H5)
    h5.append("This is heading 5")


    val h6 = Mason.shared.createTextView(this, TextType.H6)
    h6.append("This is heading 6")


    val p = Mason.shared.createTextView(this, TextType.P)
    p.append("Tip:")

    val span = Mason.shared.createTextView(this, TextType.Span)
    span.append(" Use h1 to h6 elements only for headings. Do not use them just to make text bold or big. Use other tags for that.")

    p.append(span)

    span.color = Color.BLUE
    span.fontSize = 24

    body.appendView(arrayOf(h1, h2, h3, h4, h5, h6, p))


  }

  fun textWithImage() {
    val txt = Mason.shared.createTextView(this)
    txt.backgroundColorValue = Color.GREEN
    txt.color = Color.RED
    txt.append("Inline Image ")
    txt.id = android.view.View.generateViewId()


    val img = Mason.shared.createImageView(this)
    img.setBackgroundColor(Color.BLUE)

    img.style.size = Size(
      Dimension.Points(150f), Dimension.Points(150f)
    )

    img.setImageResource(R.mipmap.ic_launcher_ns)

    val txt2 = Mason.shared.createTextView(this)
    txt2.backgroundColorValue = Color.YELLOW
    txt2.color = Color.BLUE
    txt2.append("Hello ???")

    txt2.id = android.view.View.generateViewId()

    txt.append(txt2)

    val txt3 = Mason.shared.createTextView(this)
    txt3.backgroundColorValue = Color.GRAY
    txt3.color = Color.GREEN
    txt3.append(" ashbnjmkasijdaskmd")

    txt.append(txt3)

    body.append(arrayOf(txt, img))

  }

  fun basicNesting() {
    val a = TextView(this)
    a.append("This should")

    val b = TextView(this)
    b.append(" be Inlined")
    b.color = Color.RED

    val c = TextView(this)
    c.append(" Nice!!!")
    c.color = Color.BLUE


    // a.addView(b)
    a.append(b)
    a.append(c)
    body.addView(a)
    //setContentView(root)
  }

  fun basicBlock() {
    val a = TextView(this)
    a.append("This should")

    val b = TextView(this)
    b.append(" be different")
    b.color = Color.RED

    val c = TextView(this)
    c.append(" Lines!!!")
    c.color = Color.BLUE


    // a.addView(b)
    body.addView(a)
    body.addView(b)
    body.addView(c)
    //setContentView(root)
  }

  fun basicInline() {

    // val a = TextView(this, Mason.shared, TextType.Span)
    body.append("This should")


    val b = TextView(this, Mason.shared, TextType.Span)
    b.append(" be Inlined")
    b.color = Color.RED

    val c = TextView(this, Mason.shared, TextType.Span)
    c.append(" Nice!!!")
    c.color = Color.BLUE


    // a.addView(b)
    //body.addView(a)
    body.addView(b)
    body.addView(c)


   // a.replaceChildAt("This should be a replaced text", 0)
    //setContentView(root)
  }

  fun testWrap() {
    val a = TextView(this)
    a.textWrap = Styles.TextWrap.Wrap
    a.append("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris.")

    val b = TextView(this)
    b.append("Looking Out")
    b.color = Color.RED
    // b.backgroundColorValue = Color.BLUE

    b.fontSize = 24

    a.append(b)

    body.addView(a)

    setContentView(body)

    Timer().schedule(2000L) {
      runOnUiThread {
        b.fontSize = 60
      }
    }
  }

  fun testText() {
    val textOther = Mason.shared.createTextView(this)
    textOther.color = Color.RED
    textOther.append("Other")

    body.addView(textOther)

    val text = Mason.shared.createTextView(this)

    text.backgroundColorValue = Color.CYAN
    text.color = Color.RED
    text.append(
      "Hello World"
    )

    // root.addView(text)

//    text.textAlign = TextAlign.Justify
//    text.textJustify = TextJustify.InterWord

    val img = Mason.shared.createImageView(this)
    img.setImageResource(R.mipmap.ic_launcher_ns)


    val text2 = Mason.shared.createTextView(this)
    text2.color = Color.BLUE
    text2.backgroundColorValue = Color.YELLOW
//    text2.configure {
//      it.style.size = Size(Dimension.Auto, Dimension.Points(300f))
//    }
    text2.append(
      "Lorem ipsum dolor sit amet."
    )
    val text3 = Mason.shared.createTextView(this)
    text3.color = Color.GREEN
    text3.append(
      "Just adding a break here"
    )
    val img2 = Mason.shared.createImageView(this)
    img2.setImageResource(R.mipmap.ic_launcher)

    img2.configure {
      it.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    }

    val img3 = Mason.shared.createImageView(this)
    img3.setImageResource(R.mipmap.ic_launcher_ns)

    img3.configure {
      it.size = Size(Dimension.Points(110f), Dimension.Points(110f))
    }

    val view = View(this)
    view.setBackgroundColor(Color.RED)
    view.configure {
      it.size = Size(Dimension.Points(120f), Dimension.Points(120f))
    }

    val view2 = View(this)
    view2.setBackgroundColor(Color.BLUE)
    view2.configure {
      it.size = Size(Dimension.Points(150f), Dimension.Points(150f))
    }

    val nest1 = Mason.shared.createTextView(this)
    nest1.append("This")
    nest1.color = Color.RED
    nest1.backgroundColorValue = "#FFA500".toColorInt()


    Timer().schedule(3000L) {
      runOnUiThread {
        nest1.configure {
          nest1.text = ""
          nest1.color = Color.CYAN
        }


        Timer().schedule(1000L) {
          runOnUiThread {
            nest1.configure {
              nest1.text = "Blue"
              nest1.color = Color.BLUE
            }
          }
        }
      }
    }


    val nest11 = Mason.shared.createTextView(this)
    nest11.color = Color.BLUE
    nest11.backgroundColorValue = Color.RED

    val nest111 = Mason.shared.createTextView(this)
    nest111.append(" testing")
    nest111.color = Color.YELLOW
    nest111.backgroundColorValue = "#FFC0CB".toColorInt()

    val nest1111 = Mason.shared.createTextView(this)
    nest1111.color = Color.GREEN
    nest1111.backgroundColorValue = Color.parseColor("#BF40BF")

    nest1.append(nest11)

    Timer().schedule(4500L) {
      runOnUiThread {
        // nest1.removeView(nest1111)
        nest11.append(" is")
      }
    }


    nest1.append(nest111)

    nest1.append(nest1111)

    //  nest1.addView(img)


    /*
    Timer().schedule(3000L) {
      runOnUiThread {
        // nest1.removeView(nest1111)
        nest1111.append(" nesting")

        Timer().schedule(1000L) {
          runOnUiThread {
            // nest1.removeView(nest1111)
            nest11.append(" is")

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


    text.append(img)

    text.append(img2)

    text.append(img3)

    text.append(view)

//    text.addView(text2)
//    text.addView(text3)


    text.append(nest1)

    body.addView(text)


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
