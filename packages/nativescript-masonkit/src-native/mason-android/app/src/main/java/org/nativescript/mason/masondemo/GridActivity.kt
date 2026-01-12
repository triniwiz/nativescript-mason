package org.nativescript.mason.masondemo

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import android.util.TypedValue
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.toColorInt
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Element
import org.nativescript.mason.masonkit.Input
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Point
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Scroll
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.Styles
import org.nativescript.mason.masonkit.TextStyleChangeMask
import org.nativescript.mason.masonkit.TextStyleKeys
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.ObjectFit
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.enums.VerticalAlign
import org.nativescript.mason.masonkit.events.InputEvent
import java.util.Timer
import kotlin.concurrent.schedule

class GridActivity : AppCompatActivity() {
  lateinit var metrics: DisplayMetrics
  val mason = Mason.shared
  fun toPx(dip: Float): Float {
    return dip * metrics.density
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    metrics = resources.displayMetrics
    mason.setDeviceScale(metrics.density)

    val body = mason.createScrollView(this)
//    body.style.overflowY = Overflow.Scroll

//    Timer().schedule(1000L) {
//      runOnUiThread {
//        body.style.values.putInt(StyleKeys.OVERFLOW_X, Overflow.Scroll.value)
//        body.syncStyle("${StateKeys.OVERFLOW_X.bits}", "-1")
////        body.style.overflowX = Overflow.Scroll
////        body.style.overflowY = Overflow.Scroll
//      }
//    }


//    body.style.margin = Rect(
//      LengthPercentageAuto.Points(40f),
//      LengthPercentageAuto.Points(40f),
//      LengthPercentageAuto.Points(40f),
//      LengthPercentageAuto.Points(40f)
//    )

//    val rootLayout = mason.createView(this)
//
//    body.addView(rootLayout)
//
//    wrapper5(rootLayout)


    //  wrapper6(body)
    // wrapper8(body)
    //genTest(body)

    //grid_template_areas(body)

    // grid_template_areas_500(body)

    //grid_template_areas_600(body)

    //  backgroundTest(body)
    // filter(body)
    //  objectFit(body)
    //   buttons(body)
    // verticalAlignment(body)
    // verticalAlignImages(body)
    // radius(body)
    // textShadow(body)
    input(body)
    setContentView(body)
  }

  fun input(body: Scroll) {
    val root = mason.createView(this)
    root.style.padding = Rect(
      LengthPercentage.Points(40f),
      LengthPercentage.Zero,
      LengthPercentage.Zero,
      LengthPercentage.Points(50f)
    )
    body.append(root)
    val input = mason.createInput(this)
    input.placeholder = "Enter Text"
    root.append(input)


    input.addEventListener("input") {
      if (it is InputEvent) {
        Log.d("com.test", "input ${(it).data} ${it.inputType}")
      }
    }

    root.append(mason.createBr(this))

    val btn = mason.createInput(this, Input.Type.Button)
    btn.value = "Button"
    root.append(btn)

    root.append(mason.createBr(this))

    val cb = mason.createInput(this, Input.Type.Checkbox)
    root.append(cb)

    root.append(mason.createBr(this))

    val password = mason.createInput(this, Input.Type.Password)
    password.placeholder = "Enter Password"
    root.append(password)

    root.append(mason.createBr(this))

    val email = mason.createInput(this, Input.Type.Email)
    email.placeholder = "Enter Email"
    root.append(email)

    root.append(mason.createBr(this))

    root.append(mason.createBr(this))

    val radio = mason.createInput(this, Input.Type.Radio)
    root.append(radio)

    root.append(mason.createBr(this))

    val range = mason.createInput(this, Input.Type.Range)
    root.append(range)

    root.append(mason.createBr(this))

    val number = mason.createInput(this, Input.Type.Number)
    root.append(number)

    root.append(mason.createBr(this))

    val file = mason.createInput(this)
    file.multiple = true

    Timer().schedule(3000L) {
      runOnUiThread {
        file.type = Input.Type.File
      }
    }

    root.append(file)


    root.append(mason.createBr(this))

    val date = mason.createInput(this, Input.Type.Date)
    root.append(date)

    val color = mason.createInput(this, Input.Type.Color)
    root.append(color)
  }

  fun textShadow(body: Scroll) {
    val container = mason.createView(this)

    container.configure {
      container.style.setPadding(30, 30, 30, 30)
    }
    val a = mason.createTextView(this)

    a.style.color = Color.WHITE
    a.style.textShadow = """
      1px 1px 2px black,
    0 0 1em blue,
    0 0 0.2em blue;
    """.trimIndent()

    a.append("Hello ")

    container.append(a)

    val b = mason.createButton(this)

    b.append("World")

    b.style.textShadow = """
     red 0 -2px
    """.trimIndent()

    container.append(b)

    body.append(container)
  }

  fun radius(body: Scroll) {
    val contentRoot = mason.createView(this)
    body.append(contentRoot)

    val root = mason.createView(this)

    contentRoot.append(root)

    contentRoot.configure {
      it.size = Size(
        Dimension.Points(240f),
        Dimension.Auto,
      )
      it.margin = Rect(
        LengthPercentageAuto.Points(
          20f
        ), LengthPercentageAuto.Auto, LengthPercentageAuto.Points(
          20f
        ), LengthPercentageAuto.Auto
      )
    }


    root.configure {
      it.display = Display.Flex
      it.size = Size(
        Dimension.Percent(1f),
        Dimension.Points(180f),
      )
      it.justifyContent = JustifyContent.Center
      it.alignItems = AlignItems.Center
      it.backgroundColor = Color.GREEN
      it.backgroundImage =
        "linear-gradient(\n" + "    to bottom,\n" + "    rgb(255 255 255 / 0),\n" + "    rgb(255 255 255 / 0.5)\n" + "    );"
      it.border = "1 solid #c3c3c3"
      it.borderRadius = "0 20% 50 30%"
    }


//    box-shadow: 1px 1px 3px gray;
//    border-radius: 0 20% 50px 30%;
//    corner-shape: superellipse(0.5) bevel notch squircle;
//


  }

  fun verticalAlignImages(body: Scroll) {
    val root = mason.createTextView(this, TextType.P)
    val height = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP, (16 * 3f), // 3 em
      resources.displayMetrics
    )
    val margin = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP, (16 * 0.5f), // .5 em
      resources.displayMetrics
    )
    root.configure {
      it.fontFamily = "monospace"
      it.size = Size(Dimension.Percent(0.8f), Dimension.Points(height))
      it.decorationLine = Styles.DecorationLine.Overline
      it.margin = Rect(
        LengthPercentageAuto.Points(16f),
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Points(16f),
      )
      it.padding = Rect(
        LengthPercentage.Zero, LengthPercentage.Points(
          margin
        ), LengthPercentage.Zero, LengthPercentage.Points(
          margin
        )
      )
    }

    root.append("text-top:    ")

    body.append(root)

    val top = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.Top
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    top.setImageResource(R.drawable.star)

    root.append(top)

    root.append("middle:      ")
    val middle = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.Middle
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    middle.setImageResource(R.drawable.star)
    root.append(middle)


    root.append("bottom:      ")
    val bottom = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.Bottom
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    bottom.setImageResource(R.drawable.star)
    root.append(bottom)

    root.append("super:      ")
    val supa = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.Super
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    supa.setImageResource(R.drawable.star)
    root.append(supa)

    root.append("sub:      ")
    val sub = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.Sub
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    sub.setImageResource(R.drawable.star)
    root.append(sub)

    val footer = mason.createTextView(this, TextType.P)
    footer.configure {
      it.fontFamily = "monospace"
      it.size = Size(Dimension.Percent(0.8f), Dimension.Points(height))
      it.decorationLine = Styles.DecorationLine.Overline
      it.margin = Rect(
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Auto,
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Auto,
      )
      it.padding = Rect(
        LengthPercentage.Zero, LengthPercentage.Points(
          margin
        ), LengthPercentage.Zero, LengthPercentage.Points(
          margin
        )
      )
    }


    footer.append("text-top:      ")
    val textTop = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.TextTop
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    textTop.setImageResource(R.drawable.star)
    footer.append(textTop)



    footer.append("text-bottom:      ")
    val textBottom = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.TextBottom
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    textBottom.setImageResource(R.drawable.star)
    footer.append(textBottom)



    footer.append("0.2em:      ")
    val zeroP2 = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.length(
        TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_SP, (16 * 0.2f), resources.displayMetrics
        )
      )
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    zeroP2.setImageResource(R.drawable.star)
    footer.append(zeroP2)


    footer.append("-1em:      ")
    val minusP2 = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.length(
        TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_SP, -16f, resources.displayMetrics
        )
      )
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    minusP2.setImageResource(R.drawable.star)
    footer.append(minusP2)


    footer.append("20%:      ")
    val twentyPercent = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.percent(0.2f)
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    twentyPercent.setImageResource(R.drawable.star)
    footer.append(twentyPercent)


    footer.append("-100%:      ")
    val minusPercent = mason.createImageView(this).apply {
      style.verticalAlign = VerticalAlign.percent(-1f)
      style.margin = Rect(
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(margin),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Auto,
      )
    }
    minusPercent.setImageResource(R.drawable.star)
    footer.append(minusPercent)

    body.append(footer)
  }

  fun verticalAlignment(body: Scroll) {
    val root = mason.createView(this)
    body.append(root)

    val frameImage = R.drawable.frame_image
    val normal = mason.createView(this)
    val normalImg = mason.createImageView(this)
    normal.append("An ")
    normalImg.style.size = Size(Dimension.Points(toPx(32f)), Dimension.Points(toPx(32f)))
    normal.append(normalImg)
    normal.append(" image with a default alignment.")
    normalImg.setImageResource(frameImage)
    root.append(normal)


    val top = mason.createView(this)
    val topImg = mason.createImageView(this)
    top.append("An ")
    topImg.style.size = Size(Dimension.Points(toPx(32f)), Dimension.Points(toPx(32f)))
    topImg.style.verticalAlign = VerticalAlign.TextTop
    top.append(topImg)
    top.append(" image with a text-top alignment.")
    topImg.setImageResource(frameImage)
    root.append(top)


    val bottom = mason.createView(this)
    val bottomImg = mason.createImageView(this)
    bottom.append("An ")
    bottomImg.style.size = Size(Dimension.Points(toPx(32f)), Dimension.Points(toPx(32f)))
    bottomImg.style.verticalAlign = VerticalAlign.TextBottom
    bottom.append(bottomImg)
    bottom.append(" image with a text-bottom alignment.")
    bottomImg.setImageResource(frameImage)
    root.append(bottom)


    val middle = mason.createView(this)
    val middleImg = mason.createImageView(this)
    middle.append("An ")
    middleImg.style.size = Size(Dimension.Points(toPx(32f)), Dimension.Points(toPx(32f)))
    middleImg.style.verticalAlign = VerticalAlign.Middle
    middle.append(middleImg)
    middle.append(" image with a middle alignment.")
    middleImg.setImageResource(frameImage)
    root.append(middle)

  }

  fun buttons(body: Scroll) {
    val container = mason.createView(this)
    container.style.background = "red"
    container.configure {
      container.style.setPadding(30, 30, 30, 30)
      container.style.size = Size(Dimension.Auto, Dimension.Points(600f))
    }
    val a = mason.createButton(this)
    a.append("Hello")

    val ns = mason.createImageView(this)
    ns.configure {
      it.size = Size(Dimension.Points(50f), Dimension.Points(50f))
    }

    ns.setImageResource(R.drawable.nativescript_logo_white_blue_rounded)

    a.append(" World!")

    a.append(ns)

    a.style.color = Color.BLUE
    a.style.background = "orange"
    a.style.textAlign = TextAlign.Center
    a.style.size = Size(Dimension.Points(150f), Dimension.Auto)

    a.style.border = "1px solid black"

    container.append(a)

    body.append(container)
  }

  fun insertObjectFit(section: View, header: String, fit: ObjectFit, src: String) {
    val h2 = mason.createTextView(this, TextType.H2)
    h2.append(header)

    h2.configure {
      it.fontFamily = "'Courier New', monospace"
      it.fontSize = 16
      it.margin = Rect(
        LengthPercentageAuto.Zero,
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(16f),
        LengthPercentageAuto.Points(
          16f / 0.3f
        )
      )
    }

    section.append(h2)
    val img = mason.createImageView(this)
    img.configure {
      it.objectFit = fit
      it.border = "1px solid black"
      it.margin = Rect(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(16f),
        LengthPercentageAuto.Points(16f)
      )
      it.size = Size(Dimension.Points(toPx(150f)), Dimension.Points(toPx(100f)))
    }
    img.src = src


    val imgNarrow = mason.createImageView(this)
    imgNarrow.configure {
      it.objectFit = fit
      it.border = "1px solid black"
      it.margin = Rect(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(16f),
        LengthPercentageAuto.Points(16f)
      )
      it.size = Size(Dimension.Points(toPx(100f)), Dimension.Points(toPx(150f)))
    }
    imgNarrow.src = src

    section.append(img)
    section.append(" ")
    section.append(imgNarrow)
  }

  fun objectFit(body: Scroll) {
    val section = mason.createView(this);
    val mdnLogoOnlyColor =
      "https://b4eb5495-cf4e-4b34-a1f5-d7ee06ed21f7.mdnplay.dev/en-US/docs/Web/CSS/Reference/Properties/object-fit/mdn_logo_only_color.png"

    insertObjectFit(section, "object-fit: fill", ObjectFit.Fill, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: contain", ObjectFit.Contain, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: cover", ObjectFit.Cover, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: none", ObjectFit.None, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: scale-down", ObjectFit.ScaleDown, mdnLogoOnlyColor)

    body.append(section)

  }

  fun code(value: String): TextView {
    val ret = mason.createTextView(this, TextType.Code)
    ret.append(value)
    ret.style.backgroundColor = 0xFFEFEFEF.toInt()
    return ret
  }

  var selected: Element? = null
  val defaultBorder = "1px solid #51565d"
  val selectedBorder = "1px solid red"

  private fun select(element: Element?) {
    element?.style?.border = selectedBorder
    selected?.style?.border = defaultBorder
    selected = element
  }

  private fun defaultStyle(element: Element) {
    element.configure {
      it.padding = Rect.uniform(LengthPercentage.Points(toPx(10f)))
      it.border = defaultBorder
      it.margin = Rect(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(toPx(5f)),
        LengthPercentageAuto.Points(toPx(5f))
      )
    }
  }

  fun filter(body: Scroll) {
    val rootLayout = mason.createView(this)
    rootLayout.style.padding = Rect.uniform(
      LengthPercentage.Points(toPx(10f))
    )


    val text = mason.createTextView(this)
    text.style.color = Color.RED
    text.append("Helloooooo")

    rootLayout.append(text)


    val img = mason.createImageView(this)
    //img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1024px-Firefox_logo%2C_2019.svg.png"

    img.style.size = Size(
      Dimension.Points(toPx(160f)), Dimension.Points(toPx(160f))
    )

    rootLayout.append(img)

    img.setImageResource(R.drawable.firefox_logo)


    val reset = mason.createView(this)
    reset.setOnClickListener {
      img.style.filter = ""
      text.style.filter = ""
      select(null)
    }

    reset.append("Reset ")

    rootLayout.append(reset)


    val blur = mason.createView(this)
    defaultStyle(blur)
    blur.setOnClickListener {
      select(blur)
      img.style.filter = "blur(5px);"
      text.style.filter = "blur(5px);"
    }
    blur.append("blur ")
    blur.append(code("filter: blur(5px);"))

    rootLayout.append(blur)


    /*

    val contrast = mason.createView(this)
    defaultStyle(contrast)
    contrast.setOnClickListener {
      select(contrast)
      img.style.filter = "contrast(200%);"
      text.style.filter = "contrast(200%);"
    }
    contrast.append("contrast ")
    contrast.append(code("filter:contrast(200%);"))

    rootLayout.append(contrast)

    val grayscale = mason.createView(this)
    defaultStyle(grayscale)
    grayscale.style.border = defaultBorder
    grayscale.append("grayscale ")
    grayscale.append(code("filter:grayscale(80%);"))

    grayscale.setOnClickListener {
      select(grayscale)
      img.style.filter = "grayscale(80%);"
      text.style.filter = "grayscale(80%);"
    }

    rootLayout.append(grayscale)


    val hueRotate = mason.createView(this)
    defaultStyle(hueRotate)
    hueRotate.append("hueRotate ")
    hueRotate.append(code("filter: hue-rotate(90deg);"))

    hueRotate.setOnClickListener {
      select(hueRotate)
      img.style.filter = "hue-rotate(90deg);"
      text.style.filter = "hue-rotate(90deg);"
    }

    rootLayout.append(hueRotate)


    val dropShadow = mason.createView(this)
    defaultStyle(dropShadow)
    dropShadow.append("dropShadow ")
    dropShadow.append(code("filter:drop-shadow(16px 16px 20px red) invert(75%);"))

    dropShadow.setOnClickListener {
      select(dropShadow)
      img.style.filter = "drop-shadow(16px 16px 20px red) invert(75%);"
      text.style.filter = "drop-shadow(16px 16px 20px red) invert(75%);"
    }

    rootLayout.append(dropShadow)

    */


    body.append(rootLayout)
  }

  fun backgroundTest(body: Scroll) {
    val rootLayout = mason.createView(this)
    rootLayout.style.size = Size(
      Dimension.Points(toPx(500f)), Dimension.Points(toPx(500f))
    )
//    rootLayout.background = "pink"
//    rootLayout.background = """
//                            left 5% / 15% 60% repeat-x
//                              url("https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png");
//                            """
//    rootLayout.style.background = """
//no-repeat url('https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/lizard.png')
//"""
    //rootLayout.style.background = "content-box radial-gradient(crimson, skyblue);"
    rootLayout.style.background =
      "radial-gradient(circle at center, rgba(0,0,255,0.3) 0%, rgba(0,0,255,0.0) 70%);"
    body.append(rootLayout)
  }

  fun grid_template_areas_600(rootLayout: Scroll) {
    val root = mason.createView(this)
    root.configure {
      it.display = Display.Grid
      it.gridTemplateColumns = "120px auto 120px"
      it.setMaxSizeWidth(Dimension.Points(600f))
      it.gridTemplateAreas = """
      "header  header  header"
      "sidebar content sidebar2"
      "footer  footer  footer"
      """.trimIndent()



      it.gap = Size(LengthPercentage.Points(20f), LengthPercentage.Points(20f))
    }


    val header = mason.createView(this)
    header.append("Header")
    header.setBackgroundColor("#999999".toColorInt())
    header.style.gridArea = "header"

    val sidebar = mason.createView(this)
    sidebar.style.gridArea = "sidebar"
    sidebar.setBackgroundColor("#444444".toColorInt())
    sidebar.append("Sidebar")

    val content = mason.createView(this)
    content.style.gridArea = "content"
    content.append("Content")
    val br = mason.createBr(this)
    Log.d("com.test", "style ${mason.styleForViewOrNode(br)}")
    content.replaceChildAt(br, 1)
    content.replaceChildAt(mason.createBr(this), 2)
    content.replaceChildAt(mason.createBr(this), 3)
    content.append("More content than we had before so this column is now quite tall.")

    val sidebar2 = mason.createView(this)
    sidebar2.setBackgroundColor("#cccccc".toColorInt())
    sidebar2.style.gridArea = "sidebar2"
    sidebar2.append("Sidebar 2")


    val footer = mason.createView(this)
    footer.style.gridArea = "footer"
    footer.setBackgroundColor("#999999".toColorInt())
    footer.append("Footer")

    root.append(arrayOf(header, sidebar, sidebar2, content, footer))

    rootLayout.append(root)
  }

  fun grid_template_areas_500(rootLayout: Scroll) {
    val body = mason.createView(this)
    body.style.margin = Rect.uniform(LengthPercentageAuto.Points(40f))
    val root = mason.createView(this)
    body.append(root)
    root.configure {
      it.display = Display.Grid
      it.gridTemplateAreas = """
     "header  header"
		"sidebar content"
		"sidebar2 sidebar2"
		"footer  footer"
      """.trimIndent()
      it.gridTemplateColumns = "20% auto"
      it.gap = Size(LengthPercentage.Points(16f), LengthPercentage.Points(16f))
    }


    val boxPadding: Rect<LengthPercentage> = Rect.uniform(LengthPercentage.Points(10f))
    val header = mason.createView(this)
    header.append("Header")
    header.configure {
      it.color = Color.WHITE
      // header.style.background = "#999999"
      header.style.gridArea = "header"
      it.padding = boxPadding
      it.borderRadius = "5px"
    }

    header.style.textValues.putInt(TextStyleKeys.BACKGROUND_COLOR, "#999999".toColorInt())
    header.style.textValues.put(TextStyleKeys.BACKGROUND_COLOR_STATE, 1)
    header.syncStyle("", TextStyleChangeMask.BACKGROUND_COLOR.toString())


    val sidebar = mason.createView(this)
    sidebar.append("Sidebar")
    sidebar.configure {
      it.color = Color.WHITE
      sidebar.style.gridArea = "sidebar"
      sidebar.style.background = "#444444"
      it.padding = boxPadding
      it.borderRadius = "5px"
    }

    val content = mason.createView(this)
    content.append(
      "Content"
    )
    val br = mason.createBr(this)
    content.append(br)
    content.append("More content than we had before so this column is now quite tall.")

    content.configure {
      content.style.gridArea = "content"
      it.borderRadius = "5px"
      it.padding = boxPadding
      it.color = Color.WHITE
      it.background = "#444444"
    }

    val sidebar2 = mason.createView(this)
    sidebar2.configure {
      sidebar2.style.background = "#cccccc"
      sidebar2.style.setColor("#444")
      sidebar2.style.gridArea = "sidebar2"
      it.borderRadius = "5px"
      it.padding = boxPadding
    }
    sidebar2.append("Sidebar 2")

    val footer = mason.createView(this)
    footer.configure {
      footer.style.gridArea = "footer"
      footer.style.background = "#999999"
      it.borderRadius = "5px"
      it.padding = boxPadding
      it.color = Color.WHITE
    }
    footer.append("Footer")

    root.append(arrayOf(header, sidebar, sidebar2, content, footer))

    rootLayout.append(body)
  }

  fun grid_template_areas(rootLayout: Scroll) {
    val root = mason.createView(this)
    root.configure {
      it.display = Display.Grid
      it.gridTemplateAreas = """
      "header"
      "sidebar"
      "content"
      "sidebar2"
      "footer"
      """.trimIndent()
      it.gap = Size(LengthPercentage.Points(10f), LengthPercentage.Points(10f))
    }


    val header = mason.createView(this)
    header.append("Header")
    header.setBackgroundColor("#999999".toColorInt())
    header.style.gridArea = "header"

    val sidebar = mason.createView(this)
    sidebar.style.gridArea = "sidebar"
    sidebar.append("Sidebar")

    val content = mason.createView(this)
    content.style.gridArea = "content"

    content.append(
      """
      Content
     More content than we had before so this column is now quite tall.
    """.trimIndent()
    )

    val sidebar2 = mason.createView(this)
    sidebar2.style.gridArea = "sidebar2"
    sidebar2.append("Sidebar 2")


    val footer = mason.createView(this)
    footer.style.gridArea = "footer"
    footer.setBackgroundColor("#999999".toColorInt())
    footer.append("Footer")

    root.append(arrayOf(header, sidebar, sidebar2, content, footer))

    rootLayout.append(root)
  }

  fun genTest(rootLayout: Scroll) {
    val root = mason.createView(this)
    root.configure {
      it.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
      it.display = Display.Grid
      it.gridTemplateColumns = "repeat(5, 1fr)"
      it.gridTemplateRows = "repeat(5, 1fr)"
      it.gap = Size(LengthPercentage.Points(10f), LengthPercentage.Points(10f))
    }

    val div1 = mason.createView(this)
    div1.append("A")
    div1.setBackgroundColor(Color.RED)
    div1.configure {
      it.gridArea = "1 / 1 / 2 / 2"
    }

    val div2 = mason.createView(this)
    div2.append("B")
    div2.configure {
      it.gridArea = "2 / 2 / 3 / 3"
    }


    val div3 = mason.createView(this)
    div3.append("C")
    div3.configure {
      it.gridArea = "3 / 3 / 4 / 4"
    }

    val div4 = mason.createView(this)
    div4.append("D")
    div4.configure {
      it.gridArea = "4 / 4 / 5 / 5"
    }


    val div5 = mason.createView(this)
    div5.append("D")
    div5.configure {
      it.gridArea = "5 / 5 / 6 / 6"
    }

    root.append(arrayOf(div1, div2, div3, div4, div5))

    rootLayout.addView(root)
  }

  fun wrapper8(rootLayout: Scroll) {
    val bg = "#444444".toColorInt()
    rootLayout.configure {
      it.color = Color.WHITE
      //it.boxSizing = BoxSizing.ContentBox
      rootLayout.setBackgroundColor(Color.WHITE)
      it.display = Display.Grid
      it.gap = Size(LengthPercentage.Points(10f), LengthPercentage.Points(10f))
//      it.margin = Rect(
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f))
//      )
      it.gridTemplateColumns = "[col] 100px [col] 100px [col] 100px [col] 100px  "
      it.gridTemplateRows = " [row] auto [row] auto [row] "
    }

    val a = Mason.shared.createView(this)

    a.setBackgroundColor(bg)

    a.style.gridColumn = "col / span 2"
    a.style.gridRow = "row"
    a.append("A")


    val b = Mason.shared.createView(this)
//    b.style.alignSelf = AlignSelf.Start
//    b.style.justifySelf = JustifySelf.Start
    b.setBackgroundColor(bg)
    b.style.gridColumn = "col 3 / span 2"
    b.style.gridRow = "row"
    b.append("B")


    val c = Mason.shared.createView(this)
//    c.style.alignSelf = AlignSelf.Start
//    c.style.justifySelf = JustifySelf.Start
    c.setBackgroundColor(bg)
    c.style.gridColumn = "col"
    c.style.gridRow = "row 2"
    c.append("C")


    val d = Mason.shared.createView(this)
//    d.style.alignSelf = AlignSelf.Start
//    d.style.justifySelf = JustifySelf.Start
    d.setBackgroundColor(bg)
    d.style.gridColumn = " col 2 / span 3 "
    d.style.gridRow = "row 2"
    d.append("D")


    val e = Mason.shared.createView(this)
//    e.style.alignSelf = AlignSelf.Start
//    e.style.justifySelf = JustifySelf.Start
    e.setBackgroundColor(bg)
    e.style.gridColumn = "col / span 4"
    e.style.gridRow = "row 3 "
    e.append("E")


    rootLayout.append(arrayOf(a, b, c, d, e))
  }

  fun wrapper5(rootLayout: View) {
    rootLayout.style.color = Color.WHITE
    rootLayout.configure {
      rootLayout.background = ColorDrawable(Color.WHITE)
      it.display = Display.Grid
      rootLayout.setGap(toPx(10F), toPx(10F))
//      it.margin = Rect(
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f)),
//        LengthPercentageAuto.Points(toPx(40f))
//      )
      it.gridTemplateColumns = "100 100 100"
    }

    val bg = ColorDrawable(Color.parseColor("#444444"))

    val boxA = mason.createView(this)
    boxA.append("A")


    val boxB = mason.createView(this)
    boxB.append("B")

    val boxC = mason.createView(this)
    boxC.append("C")

    val boxD = mason.createView(this)
    boxD.append("D")

    val boxE = mason.createView(this)
    boxE.append("E")


    val boxF = mason.createView(this)
    boxF.append("F")


    rootLayout.append(arrayOf(boxA, boxB, boxC, boxD))

    boxA.configure {
      boxA.background = bg
      it.padding = Rect(
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f)),
        LengthPercentage.Points(toPx(2f))
      )
      it.gridColumn = "1/3"
      it.gridRow = "1"

    }

    boxB.configure {
      boxB.background = bg
      it.gridColumn = "3"
      it.gridRow = "1/3"
    }

    boxC.configure {
      boxC.background = bg
      it.gridColumn = "1"
      it.gridRow = "2"
    }

    boxD.configure {
      boxD.background = bg
      it.gridColumn = "2"
      it.gridRow = "2"
    }

  }

  fun createParentWith2Kids(kidAText: String, kidBText: String, alignSelf: AlignSelf): View {

    val parent = mason.createView(this)
    parent.style.alignSelf = alignSelf

//    val a = TextView(this)
//    a.setText(kidAText)
//
//    val b = TextView(this)
//    b.setText(kidBText)

    val a = mason.createTextView(this, TextType.P)
    a.append(kidAText)

    val b = mason.createTextView(this, TextType.Code)
    b.append(kidBText)

    parent.appendView(a)
    parent.appendView(b)

    return parent
  }

  fun wrapper6(rootLayout: Scroll) {/*
    display: grid;
  background: no-repeat url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/12005/grid.png);
  grid-gap: 10px;
  grid-template-columns:  repeat(6, 150px);
  grid-template-rows: repeat( 4, 150px);
  background-color: #fff;
  color: #444;
     */

    val percentage: Byte = 1

    val body = mason.createView(this)
    rootLayout.addView(body)

    body.configure {
      it.margin = Rect.uniform(LengthPercentageAuto.Points(40f))
      it.overflow = Point(Overflow.Scroll, Overflow.Scroll)
      it.fontSize = 80
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
    }

    val wrapper6 = mason.createView(this)

    wrapper6.configure {
      it.color = "#444444".toColorInt()
      it.background = "no-repeat url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/12005/grid.png);"
      it.backgroundColor = Color.WHITE
      //  background = ColorDrawable(Color.WHITE)
      it.display = Display.Grid
      it.gap = Size(LengthPercentage.Points(10F), LengthPercentage.Points(10F))
      it.gridTemplateColumns = "repeat(6, 150px)"
      it.gridTemplateRows = "repeat(4, 150px)"
    }

    Log.d("com.test", " ${wrapper6.style}")


    val boxA = createParentWith2Kids("This is box A.", "align-self: stretch", AlignSelf.Stretch)
    val boxB = createParentWith2Kids("This is box B.", "align-self: end", AlignSelf.End)
    val boxC = createParentWith2Kids("This is box C.", "align-self: start", AlignSelf.Start)
    val boxD = createParentWith2Kids("This is box D.", "align-self: center", AlignSelf.Center)
    val boxE = mason.createView(this)
    val boxEA = mason.createTextView(this, TextType.P)
    boxEA.append("Each of the boxes on the left has a grid area of 3 columns and 3 rows (we're counting the gutter col/row). So each covers the same size area as box A.")

    val boxEB = mason.createTextView(this, TextType.P)
    boxEB.append("The align-self property is used to align the content inside the grid-area.")

    boxE.append(boxEA)
    boxE.append(boxEB)

    wrapper6.append(boxA)
    wrapper6.append(boxB)
    wrapper6.append(boxC)
//    wrapper6.append(boxD)
//    wrapper6.append(boxE)

    boxA.configure {
      // 150%
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f)
      )
      it.gridColumn = "1/3"
      it.gridRow = "1/3"
      it.alignSelf = AlignSelf.Stretch
    }

    boxB.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f)
      )
      it.gridColumn = "3/5"
      it.gridRow = "1/3"
      it.alignSelf = AlignSelf.End
    }

    boxC.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f)
      )
      it.gridColumn = "1/3"
      it.gridRow = "3/6"
      it.alignSelf = AlignSelf.Start
    }

    boxD.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f)
      )
      it.gridColumn = "3/5"
      it.gridRow = "3/6"
      it.alignSelf = AlignSelf.Center
    }

    boxE.configure {
      it.fontSize = 150
      it.textValues.put(TextStyleKeys.SIZE_TYPE, percentage)
      it.border = "1px solid #444"
      it.padding = Rect(
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f),
        LengthPercentage.Points(20f)
      )
      it.gridColumn = "5/7"
      it.gridRow = "1/6"
      it.alignSelf = AlignSelf.Stretch
    }


    body.addView(wrapper6)
  }
}
