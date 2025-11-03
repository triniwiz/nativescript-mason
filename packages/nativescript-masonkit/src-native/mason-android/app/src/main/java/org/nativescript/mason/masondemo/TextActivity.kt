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
import org.nativescript.mason.masonkit.FlexDirection
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.MinMax
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.Styles
import org.nativescript.mason.masonkit.TextType
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.TrackSizingFunction
import org.nativescript.mason.masonkit.View
import java.util.Timer
import kotlin.concurrent.schedule

val LIGHT_BLUE = Color.rgb(173, 216, 230)
val BROWN = Color.rgb(165, 42, 42)
val LIGHT_GREEN = Color.rgb(144, 238, 144)
val light_salmon = Color.rgb(255, 160, 122)

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

    // basicInline()
    //basicNesting()
    // testText()
    //textWithImage()
    // basicBlock()
    //  testWrap()
    //testElements()
    //testTextInsert()
    // inlineTest()
    // testTextReplace()
    // testTextNodeReplace
//    testTextAppend()
    // testTextContainerAppend()
    // testTextContainerReplace()
    /// testTextContainerReplaceInContainer()
//    testTextNodeReplaceWithImage()
    //  testTextNodeInsertWithImage()
    //   testTextWrap()
    // flexDirection()
    //  flexGrow()
    // flexShrink()
    gridTemplateColumns()
    setContentView(body)
  }

  fun gridTemplateColumns() {
    val root = Mason.shared.createView(this)
    root.style.color = Color.WHITE
    root.style.display = Display.Grid
    root.style.gridTemplateColumns = arrayOf(
      TrackSizingFunction.Single(MinMax.fromTypeValue(3, 100f, 3, 100f)!!),
      TrackSizingFunction.Single(MinMax.fromTypeValue(3, 100f, 3, 100f)!!),
      TrackSizingFunction.Single(MinMax.fromTypeValue(3, 100f, 3, 100f)!!)
    )
    root.style.gap = Size(
      LengthPercentage.Points(10F),
      LengthPercentage.Points(10F)
    )

    val bg = Color.rgb(68, 68, 68)
    val a = Mason.shared.createView(this)
    a.append("A")
    a.style.padding = Rect(
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f)
    )
    a.setBackgroundColor(bg)

    val b = Mason.shared.createView(this)
    b.append("B")
    b.style.padding = Rect(
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f)
    )
    b.setBackgroundColor(bg)

    val c = Mason.shared.createView(this)
    c.append("C")
    c.style.padding = Rect(
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f)
    )
    c.setBackgroundColor(bg)

    val d = Mason.shared.createView(this)
    d.append("D")
    d.style.padding = Rect(
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f)
    )
    d.setBackgroundColor(bg)

    val e = Mason.shared.createView(this)
    e.append("E")
    e.style.padding = Rect(
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f)
    )
    e.setBackgroundColor(bg)

    val f = Mason.shared.createView(this)
    f.style.padding = Rect(
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f),
      LengthPercentage.Points(20f)
    )
    f.append("F")
    f.setBackgroundColor(bg)


    root.append(arrayOf(a, b, c, d, e, f))

    body.append(root)
  }

  fun flexShrink() {
    val root = Mason.shared.createView(this)
    root.style.setSizeWidth(Dimension.Points(500f))
    root.style.display = Display.Flex

    val a = Mason.shared.createView(this)
    a.style.setSizeWidth(Dimension.Points(200f))
    a.setBackgroundColor(Color.RED)
    a.append("A")

    val b = Mason.shared.createView(this)
    b.style.setSizeWidth(Dimension.Points(200f))
    b.setBackgroundColor(LIGHT_BLUE)
    b.append("B")

    val c = Mason.shared.createView(this)
    c.style.setSizeWidth(Dimension.Points(200f))
    c.setBackgroundColor(Color.YELLOW)
    c.append("C")

    val d = Mason.shared.createView(this)
    d.style.setSizeWidth(Dimension.Points(200f))
    d.style.flexShrink = 1.5f
    d.setBackgroundColor(light_salmon)
    d.append("D")

    val e = Mason.shared.createView(this)
    e.style.setSizeWidth(Dimension.Points(200f))
    e.append("E")
    e.setBackgroundColor(LIGHT_GREEN)
    e.style.flexShrink = 2.5f

    root.append(arrayOf(a, b, c, d, e))


    body.append(root)
  }

  fun flexGrow() {
    /*

      <div>
        <h1>This is a <code>flex-grow</code> example</h1>
        <p>
          A, B, C, and F have <code>flex-grow: 1</code> set. D and E have
          <code>flex-grow: 2</code> set.
        </p>
        <div id="content">
          <div class="box1">A</div>
          <div class="box2">B</div>
          <div class="box3">C</div>
          <div class="box4">D</div>
          <div class="box5">E</div>
          <div class="box6">F</div>
        </div>
      </div>
     */

    val root = Mason.shared.createView(this)

    val h1 = Mason.shared.createTextView(this, TextType.H1)
    h1.append("This is a")

    val code = Mason.shared.createTextView(this, TextType.Code)
    code.append("flex-grow")
    h1.append(code)

    h1.append(" example")

    root.append(h1)

    val p = Mason.shared.createTextView(this, TextType.P)
    p.append("A, B, C, and F have ")

    val code2 = Mason.shared.createTextView(this, TextType.Code)
    code2.append("flex-grow: 1")

    p.append(code2)

    p.append(" set. D and E have")


    val code3 = Mason.shared.createTextView(this, TextType.Code)
    code3.append("flex-grow: 2")

    p.append(code3)

    p.append(" set.")

    root.append(p)

    val div = Mason.shared.createView(this)

    div.style.display = Display.Flex

    val boxA = Mason.shared.createView(this)
    boxA.append("A")
    boxA.setBackgroundColor(Color.RED)

    boxA.style.flexGrow = 1f

    val boxB = Mason.shared.createView(this)
    boxB.append("B")
    boxB.setBackgroundColor(LIGHT_BLUE)

    boxB.style.flexGrow = 1f

    val boxC = Mason.shared.createView(this)
    boxC.append("C")
    boxC.setBackgroundColor(Color.YELLOW)

    boxC.style.flexGrow = 1f

    val boxD = Mason.shared.createView(this)
    boxD.append("D")
    boxD.setBackgroundColor(BROWN)

    boxD.style.flexGrow = 2f

    val boxE = Mason.shared.createView(this)
    boxE.append("E")
    boxE.setBackgroundColor(LIGHT_GREEN)


    boxE.style.flexGrow = 2f

    val boxF = Mason.shared.createView(this)
    boxF.append("F")
    boxF.setBackgroundColor(BROWN)
    boxF.style.flexGrow = 1f

    div.append(arrayOf(boxA, boxB, boxC, boxD, boxE, boxF))

    root.append(div)

    body.append(root)
  }

  fun flexDirection() {
    /*
    <h4>This is a Column-Reverse</h4>
<div id="col-rev" class="content">
  <div class="box red">A</div>
  <div class="box lightblue">B</div>
  <div class="box yellow">C</div>
</div>
<h4>This is a Row-Reverse</h4>
<div id="row-rev" class="content">
  <div class="box red">A</div>
  <div class="box lightblue">B</div>
  <div class="box yellow">C</div>
</div>
     */
    val root = Mason.shared.createView(this)
    val h4 = Mason.shared.createTextView(this, TextType.H4)
    h4.append("This is a Column-Reverse")

    root.append(h4)

    /*
    .content {
  width: 200px;
  height: 200px;
  border: 1px solid #c3c3c3;
  display: flex;
}

#col-rev {
  flex-direction: column-reverse;
}
     */

    val colRev = Mason.shared.createView(this)
    colRev.style.flexDirection = FlexDirection.ColumnReverse

    colRev.style.size = Size(
      Dimension.Points(200F),
      Dimension.Points(200F)
    )
    colRev.style.border = Rect(
      LengthPercentage.Points(1f),
      LengthPercentage.Points(1f),
      LengthPercentage.Points(1f),
      LengthPercentage.Points(1f)
    )

    colRev.style.display = Display.Flex

    val colA = Mason.shared.createView(this)
    colA.append("A")
    colA.style.size = Size(
      Dimension.Points(50F),
      Dimension.Points(50F)
    )
    colA.setBackgroundColor(Color.RED)

    val colB = Mason.shared.createView(this)
    colB.append("B")
    colB.style.size = Size(
      Dimension.Points(50F),
      Dimension.Points(50F)
    )
    colB.setBackgroundColor(Color.rgb(173, 216, 230))

    val colC = Mason.shared.createView(this)
    colC.append("C")
    colC.style.size = Size(
      Dimension.Points(50F),
      Dimension.Points(50F)
    )
    colC.setBackgroundColor(Color.YELLOW)

    colRev.append(arrayOf(colA, colB, colC))

    root.append(colRev)


    val h4_2 = Mason.shared.createTextView(this, TextType.H4)
    h4_2.append("This is a Row-Reverse")

    root.append(h4_2)

    val rowRev = Mason.shared.createView(this)
    rowRev.style.flexDirection = FlexDirection.RowReverse

    rowRev.style.size = Size(
      Dimension.Points(200F),
      Dimension.Points(200F)
    )
    rowRev.style.border = Rect(
      LengthPercentage.Points(1f),
      LengthPercentage.Points(1f),
      LengthPercentage.Points(1f),
      LengthPercentage.Points(1f)
    )

    rowRev.style.display = Display.Flex

    val rowA = Mason.shared.createView(this)
    rowA.append("A")
    rowA.style.size = Size(
      Dimension.Points(50F),
      Dimension.Points(50F)
    )
    rowA.setBackgroundColor(Color.RED)

    val rowB = Mason.shared.createView(this)
    rowB.append("B")
    rowB.style.size = Size(
      Dimension.Points(50F),
      Dimension.Points(50F)
    )
    rowB.setBackgroundColor(Color.rgb(173, 216, 230))

    val rowC = Mason.shared.createView(this)
    rowC.append("C")
    rowC.style.size = Size(
      Dimension.Points(50F),
      Dimension.Points(50F)
    )
    rowC.setBackgroundColor(Color.YELLOW)

    rowRev.append(arrayOf(rowA, rowB, rowC))

    root.append(rowRev)

    body.append(root)
  }


  fun testTextWrap() {
    val root = Mason.shared.createView(this)
    val a = Mason.shared.createTextView(this)
    a.style.display = Display.Block
    a.append(
      "\n" +
        "\n" +
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec dapibus hendrerit elit, id rhoncus turpis accumsan quis. Donec ipsum tellus, tristique eget luctus sed, venenatis et nibh. Morbi euismod massa consequat, dignissim augue et, facilisis leo. Nulla a vestibulum massa, dapibus fringilla leo. Nulla imperdiet lacus leo, vel tincidunt dui commodo id. Vestibulum sagittis aliquet arcu. Quisque vitae imperdiet magna, sit amet lacinia ligula. Praesent ullamcorper accumsan risus eu eleifend. Curabitur a pharetra orci. Mauris fringilla elit at magna faucibus semper.\n" +
        "\n" +
        "Ut cursus magna sed augue rutrum dictum. Proin dignissim lorem nec sem pretium, fermentum mattis sapien mollis. Quisque ligula urna, cursus vitae velit eu, feugiat luctus ex. In auctor libero sit amet lobortis fermentum. Mauris sit amet aliquam augue. Duis vehicula suscipit imperdiet. Phasellus nec placerat lectus.\n" +
        "\n" +
        "Nam elementum volutpat magna, ac volutpat neque viverra at. Sed eu pulvinar est. Aenean ultrices pharetra sem, eget imperdiet arcu fermentum quis. Sed porta sit amet lacus quis viverra. Quisque in nunc id purus dictum viverra in nec dolor. Suspendisse potenti. Integer facilisis massa id mi ornare, et commodo neque ornare. Fusce sollicitudin libero in velit tempor, sit amet mattis ex condimentum. Nunc ac orci et arcu convallis volutpat vel eget odio. Morbi interdum ante tincidunt ligula condimentum tristique. Donec at bibendum libero. Curabitur aliquet metus ac libero commodo eleifend. Fusce pretium condimentum suscipit. Cras mauris erat, feugiat nec metus nec, ullamcorper dignissim quam.\n" +
        "\n" +
        "Ut faucibus arcu magna, in sagittis metus aliquam nec. Vestibulum laoreet laoreet sapien, id tincidunt ligula hendrerit sed. Suspendisse tristique, libero et placerat dictum, metus tellus luctus erat, sed faucibus elit nunc a erat. Sed vehicula vitae risus a luctus. Nam et aliquam magna. Nulla placerat sed augue at semper. Nam faucibus consequat velit id ullamcorper. In sollicitudin non arcu eget venenatis.\n" +
        "\n" +
        "Vivamus id feugiat massa. Curabitur viverra ultrices auctor. Nulla ultrices odio a ante auctor, vel condimentum lorem euismod. Maecenas nec odio ac odio iaculis lobortis. Mauris bibendum lectus non tempor laoreet. Nunc eu eros lorem. Vestibulum egestas mollis enim, sed dignissim mauris porta ullamcorper. Cras tempus odio ut felis lobortis auctor. Sed eu sodales nulla, vitae posuere tellus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;\n" +
        "\n" +
        "Duis dapibus arcu eu sapien viverra, nec accumsan elit porttitor. Fusce a porttitor felis. Vivamus et eros a ipsum commodo rhoncus. Etiam vel facilisis orci, et cursus tellus. Donec ultricies augue sit amet venenatis iaculis. Integer non aliquet turpis. Aenean lacinia tortor augue, a pellentesque urna sollicitudin eu. Curabitur condimentum tortor interdum felis consequat hendrerit. Mauris vel lacus lacinia, luctus enim porttitor, commodo velit. Proin hendrerit orci eget luctus pharetra. Duis ut dolor et dui iaculis sagittis. Sed varius quis elit sed interdum. Maecenas magna quam, facilisis ut ullamcorper vitae, maximus at ante. Mauris tristique dolor metus, in tincidunt nulla vestibulum at.\n" +
        "\n" +
        "Curabitur mattis erat non erat varius lacinia. Integer nec iaculis tortor. Aliquam laoreet porta vestibulum. Duis malesuada velit purus, et tempus elit blandit nec. Vestibulum et aliquet leo. Aenean risus velit, convallis sit amet consequat et, tempus eget eros. Suspendisse ac scelerisque ipsum, fringilla dictum risus. Suspendisse finibus nulla sit amet mauris ornare, et pulvinar sapien tristique.\n" +
        "\n" +
        "Vestibulum vitae libero id mauris placerat porttitor vitae sed tellus. Quisque aliquet semper arcu, quis euismod orci convallis vitae. Pellentesque ullamcorper hendrerit augue vitae posuere. Donec efficitur congue lacus et ultrices. In at arcu eleifend, suscipit turpis nec, sollicitudin massa. Nam non eros risus. Mauris ut arcu sit amet erat pellentesque feugiat ultrices sit amet tortor. Quisque eget augue vitae eros faucibus interdum eu a felis. Donec hendrerit augue sit amet risus euismod, eu accumsan dolor feugiat.\n" +
        "\n" +
        "Sed vehicula egestas neque. Etiam rutrum ornare risus, sit amet volutpat leo fringilla non. Aliquam erat volutpat. Ut sit amet turpis ut ex convallis luctus. Vestibulum facilisis turpis augue, eget gravida libero sollicitudin at. Suspendisse mattis, odio semper aliquam aliquet, eros ante vulputate sem, in scelerisque erat ante eget ex. Aenean accumsan libero ut placerat viverra. Maecenas viverra est nulla, in consectetur augue congue vel. Nam sed eleifend ipsum. Pellentesque ultricies, justo eu vehicula dictum, mauris eros euismod neque, nec consequat nulla velit sit amet justo. Phasellus faucibus elementum congue. Duis odio orci, aliquam auctor vestibulum eget, vulputate faucibus tortor.\n" +
        "\n" +
        "Sed a nisi orci. Maecenas tincidunt porttitor aliquet. Aenean maximus tincidunt arcu in facilisis. Morbi at eros placerat, cursus erat non, iaculis dui. Mauris nisi ex, laoreet et mollis vel, ullamcorper ac tortor. Nam a consectetur metus. Mauris massa velit, tincidunt eu egestas ac, viverra sed ligula. Phasellus laoreet vestibulum gravida. Morbi hendrerit, massa ac vulputate mollis, erat quam aliquet eros, et tincidunt ipsum odio id odio. Donec ornare mi eget tempus dictum. In molestie elit vel lacus cursus maximus. \""
    )


    root.append(a)
    body.append(root)

  }

  fun testTextNodeInsertingInline() {
    val root = Mason.shared.createView(this)
    val a = Mason.shared.createTextView(this)
    a.append("A")
    val b = Mason.shared.createTextView(this)
    b.append("B")

    val c = Mason.shared.createTextView(this)
    c.style.display = Display.Block
    c.append("C")

    val other = Mason.shared.createView(this)
    other.setBackgroundColor(Color.BLUE)

    val d = Mason.shared.createTextView(this, TextType.P)
    d.textWrap = Styles.TextWrap.Wrap
    Log.d("com.test", "display ${d.style.display}")
    d.append(
      "\n" +
        "\n" +
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec dapibus hendrerit elit, id rhoncus turpis accumsan quis. Donec ipsum tellus, tristique eget luctus sed, venenatis et nibh. Morbi euismod massa consequat, dignissim augue et, facilisis leo. Nulla a vestibulum massa, dapibus fringilla leo. Nulla imperdiet lacus leo, vel tincidunt dui commodo id. Vestibulum sagittis aliquet arcu. Quisque vitae imperdiet magna, sit amet lacinia ligula. Praesent ullamcorper accumsan risus eu eleifend. Curabitur a pharetra orci. Mauris fringilla elit at magna faucibus semper.\n" +
        "\n" +
        "Ut cursus magna sed augue rutrum dictum. Proin dignissim lorem nec sem pretium, fermentum mattis sapien mollis. Quisque ligula urna, cursus vitae velit eu, feugiat luctus ex. In auctor libero sit amet lobortis fermentum. Mauris sit amet aliquam augue. Duis vehicula suscipit imperdiet. Phasellus nec placerat lectus.\n" +
        "\n" +
        "Nam elementum volutpat magna, ac volutpat neque viverra at. Sed eu pulvinar est. Aenean ultrices pharetra sem, eget imperdiet arcu fermentum quis. Sed porta sit amet lacus quis viverra. Quisque in nunc id purus dictum viverra in nec dolor. Suspendisse potenti. Integer facilisis massa id mi ornare, et commodo neque ornare. Fusce sollicitudin libero in velit tempor, sit amet mattis ex condimentum. Nunc ac orci et arcu convallis volutpat vel eget odio. Morbi interdum ante tincidunt ligula condimentum tristique. Donec at bibendum libero. Curabitur aliquet metus ac libero commodo eleifend. Fusce pretium condimentum suscipit. Cras mauris erat, feugiat nec metus nec, ullamcorper dignissim quam.\n" +
        "\n" +
        "Ut faucibus arcu magna, in sagittis metus aliquam nec. Vestibulum laoreet laoreet sapien, id tincidunt ligula hendrerit sed. Suspendisse tristique, libero et placerat dictum, metus tellus luctus erat, sed faucibus elit nunc a erat. Sed vehicula vitae risus a luctus. Nam et aliquam magna. Nulla placerat sed augue at semper. Nam faucibus consequat velit id ullamcorper. In sollicitudin non arcu eget venenatis.\n" +
        "\n" +
        "Vivamus id feugiat massa. Curabitur viverra ultrices auctor. Nulla ultrices odio a ante auctor, vel condimentum lorem euismod. Maecenas nec odio ac odio iaculis lobortis. Mauris bibendum lectus non tempor laoreet. Nunc eu eros lorem. Vestibulum egestas mollis enim, sed dignissim mauris porta ullamcorper. Cras tempus odio ut felis lobortis auctor. Sed eu sodales nulla, vitae posuere tellus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;\n" +
        "\n" +
        "Duis dapibus arcu eu sapien viverra, nec accumsan elit porttitor. Fusce a porttitor felis. Vivamus et eros a ipsum commodo rhoncus. Etiam vel facilisis orci, et cursus tellus. Donec ultricies augue sit amet venenatis iaculis. Integer non aliquet turpis. Aenean lacinia tortor augue, a pellentesque urna sollicitudin eu. Curabitur condimentum tortor interdum felis consequat hendrerit. Mauris vel lacus lacinia, luctus enim porttitor, commodo velit. Proin hendrerit orci eget luctus pharetra. Duis ut dolor et dui iaculis sagittis. Sed varius quis elit sed interdum. Maecenas magna quam, facilisis ut ullamcorper vitae, maximus at ante. Mauris tristique dolor metus, in tincidunt nulla vestibulum at.\n" +
        "\n" +
        "Curabitur mattis erat non erat varius lacinia. Integer nec iaculis tortor. Aliquam laoreet porta vestibulum. Duis malesuada velit purus, et tempus elit blandit nec. Vestibulum et aliquet leo. Aenean risus velit, convallis sit amet consequat et, tempus eget eros. Suspendisse ac scelerisque ipsum, fringilla dictum risus. Suspendisse finibus nulla sit amet mauris ornare, et pulvinar sapien tristique.\n" +
        "\n" +
        "Vestibulum vitae libero id mauris placerat porttitor vitae sed tellus. Quisque aliquet semper arcu, quis euismod orci convallis vitae. Pellentesque ullamcorper hendrerit augue vitae posuere. Donec efficitur congue lacus et ultrices. In at arcu eleifend, suscipit turpis nec, sollicitudin massa. Nam non eros risus. Mauris ut arcu sit amet erat pellentesque feugiat ultrices sit amet tortor. Quisque eget augue vitae eros faucibus interdum eu a felis. Donec hendrerit augue sit amet risus euismod, eu accumsan dolor feugiat.\n" +
        "\n" +
        "Sed vehicula egestas neque. Etiam rutrum ornare risus, sit amet volutpat leo fringilla non. Aliquam erat volutpat. Ut sit amet turpis ut ex convallis luctus. Vestibulum facilisis turpis augue, eget gravida libero sollicitudin at. Suspendisse mattis, odio semper aliquam aliquet, eros ante vulputate sem, in scelerisque erat ante eget ex. Aenean accumsan libero ut placerat viverra. Maecenas viverra est nulla, in consectetur augue congue vel. Nam sed eleifend ipsum. Pellentesque ultricies, justo eu vehicula dictum, mauris eros euismod neque, nec consequat nulla velit sit amet justo. Phasellus faucibus elementum congue. Duis odio orci, aliquam auctor vestibulum eget, vulputate faucibus tortor.\n" +
        "\n" +
        "Sed a nisi orci. Maecenas tincidunt porttitor aliquet. Aenean maximus tincidunt arcu in facilisis. Morbi at eros placerat, cursus erat non, iaculis dui. Mauris nisi ex, laoreet et mollis vel, ullamcorper ac tortor. Nam a consectetur metus. Mauris massa velit, tincidunt eu egestas ac, viverra sed ligula. Phasellus laoreet vestibulum gravida. Morbi hendrerit, massa ac vulputate mollis, erat quam aliquet eros, et tincidunt ipsum odio id odio. Donec ornare mi eget tempus dictum. In molestie elit vel lacus cursus maximus. \""
    )

    other.append(d)
    //other.addChildAt(d, 0)


    val img = Mason.shared.createImageView(this)
    img.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    other.append(img)

    val e = Mason.shared.createTextView(this)
    e.append("E")


    val f = Mason.shared.createTextView(this)
    f.append("F")


    other.append(e)
    other.append(f)

    root.append(a)
    root.append(b)
    root.append(c)

    root.append(other)

    Timer().schedule(2000L) {
      runOnUiThread {
        img.src = "https://picsum.photos/600/600"
      }
    }

    body.append(root)

  }

  fun testTextNodeInserting() {
    val root = Mason.shared.createView(this)
    root.addChildAt("A", 0)
    root.addChildAt("B", 1)
    root.addChildAt("C", 2)
    root.addChildAt("D", -1)

    val other = Mason.shared.createView(this)
    other.addChildAt("?", 0)

    root.append(other)

    body.append(root)

  }

  fun testTextNodeInsertWithImage() {
    val root = Mason.shared.createView(this)
    root.append("A")
    root.append("C")
    root.append("C")

    body.append(root)


    Timer().schedule(2000L) {
      runOnUiThread {

        val checkmark = Mason.shared.createImageView(this@TextActivity)
        checkmark.style.size = Size(
          Dimension.Points(100f), Dimension.Points(100f)
        )
        checkmark.setImageResource(R.drawable.ic_launcher_background)

        root.addChildAt(checkmark, 1)

        Mason.shared.printTree(root.node)

      }
    }
  }

  fun testTextNodeReplaceWithImage() {
    val root = Mason.shared.createView(this)
    root.append("A")
    root.append("C")
    root.append("C")

    body.append(root)


    Timer().schedule(2000L) {
      runOnUiThread {

        val checkmark = Mason.shared.createImageView(this@TextActivity)
        checkmark.style.size = Size(
          Dimension.Points(100f), Dimension.Points(100f)
        )
        checkmark.setImageResource(R.drawable.ic_launcher_background)

        root.replaceChildAt(checkmark, 1)

        Mason.shared.printTree(root.node)

      }
    }


  }

  fun testTextContainerReplaceInContainer() {
    val root = Mason.shared.createView(this)

    val a = Mason.shared.createTextView(this)
    a.append("A")
    a.setBackgroundColor(Color.RED)

    val b = Mason.shared.createTextView(this)
    b.append("D")
    b.setBackgroundColor(Color.BLUE)

    val c = Mason.shared.createTextView(this)
    c.append("C")
    c.setBackgroundColor(Color.GREEN)

    root.append(a)
    root.append(b)
    root.append(c)

    body.append(root)

    Mason.shared.printTree(root.node)

    Timer().schedule(2000L) {
      runOnUiThread {
        b.replaceChildAt("B", 0)
        Mason.shared.printTree(root.node)
      }
    }


  }

  fun testTextContainerReplace() {
    val root = Mason.shared.createView(this)

    val a = Mason.shared.createTextView(this)
    a.append("A")
    a.setBackgroundColor(Color.RED)

    val b = Mason.shared.createTextView(this)
    b.append("D")
    b.setBackgroundColor(Color.BLUE)

    val c = Mason.shared.createTextView(this)
    c.append("C")
    c.setBackgroundColor(Color.GREEN)

    root.append(a)
    root.append(b)
    root.append(c)

    body.append(root)

    Mason.shared.printTree(root.node)

    Timer().schedule(2000L) {
      runOnUiThread {
        val replace = Mason.shared.createTextView(this@TextActivity)
        replace.append("B")
        root.replaceChildAt(replace, 1)
        Mason.shared.printTree(root.node)
      }
    }


  }

  fun testTextNodeReplace() {
    val root = Mason.shared.createView(this)
    root.append("A")
    root.append("C")
    root.append("C")

    body.append(root)


    Timer().schedule(2000L) {
      runOnUiThread {
        root.replaceChildAt("B", 1)
      }
    }


  }

  fun testTextAppend() {
    val root = Mason.shared.createView(this)
    root.append("A")
    root.append("B")
    root.append("C")
    Mason.shared.printTree(root.node)

    body.append(root)

    Mason.shared.printTree(body.node)
  }

  fun testTextContainerAppend() {
    val root = Mason.shared.createView(this)

    val a = Mason.shared.createTextView(this)
    a.append("A")

    val b = Mason.shared.createTextView(this)
    b.append("B")

    val c = Mason.shared.createTextView(this)
    c.append("C")

    val d = Mason.shared.createTextView(this, TextType.P)
    d.setBackgroundColor(Color.BLUE)
    d.append("D")




    root.append(a)
    root.append(b)
    root.append(c)
    root.append(d)

    //root.append(div)

    // Mason.shared.printTree(root.node)

    body.append(root)

    Mason.shared.printTree(root.node)
  }

  fun testTextReplace() {
    val root = Mason.shared.createView(this)
    val a = Mason.shared.createTextView(this)
    a.append("A")

    val b = Mason.shared.createTextView(this)
    b.append("B")

    val c = Mason.shared.createTextView(this)
    c.append("C")

    root.append(a)
    root.append(b)
    root.append(c)

    val d = Mason.shared.createTextView(this, TextType.P)
    d.append("Wednesday")
    root.addChildAt(d, 1)

    Mason.shared.printTree(root.node)

    body.append(root)


    Timer().schedule(2000L) {
      runOnUiThread {
        val f = Mason.shared.createTextView(this@TextActivity)
        f.append("???")
        root.addChildAt(f, 1)
        Mason.shared.printTree(root.node)
      }
    }


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

    val a = TextView(this, Mason.shared, TextType.Span)
    a.append("This should")

    body.addView(a)

    Mason.shared.printTree(body.node)

    val b = TextView(this, Mason.shared, TextType.Span)
    b.append(" be Inlined")
    b.backgroundColorValue = Color.BLUE
    b.color = Color.RED

    val c = TextView(this, Mason.shared, TextType.Span)
    c.append(" Nice!!!")
    c.color = Color.BLUE


    body.addView(b)
    body.addView(c)

    Mason.shared.printTree(body.node)


    val replace = TextView(this)
    replace.append("This should be a replaced text")

    body.replaceChildAt(replace, 0)
    // setContentView(root)

    Mason.shared.printTree(body.node)
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
