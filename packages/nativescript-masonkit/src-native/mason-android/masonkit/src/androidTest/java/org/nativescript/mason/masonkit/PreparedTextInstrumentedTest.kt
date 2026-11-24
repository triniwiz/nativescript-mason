package org.nativescript.mason.masonkit

import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.DisplayMode
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.JustifyItems
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.enums.Float as CSSFloat

@RunWith(AndroidJUnit4::class)
class PreparedTextInstrumentedTest {

  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  @Before
  fun requirePreparedText() = assumeTrue("prepared text is off on this device", PreparedText.enabled)

  private fun layOut(view: TextView, width: Int) {
    view.computeAndLayout(width.toFloat(), -1f)
    view.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    val height = maxOf(view.measuredHeight, view.node.computedHeight.toInt(), 1)
    view.layout(0, 0, width, height)
    view.draw(Canvas(Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)))
  }

  private fun Element.writeStyleThenSync(changed: StateKeys, write: (java.nio.ByteBuffer) -> Unit) {
    style.prepareMut()
    write(style.values)
    syncStyle(changed.low, changed.high)
  }

  private fun tap(view: TextView, x: Float, y: Float) {
    val time = SystemClock.uptimeMillis()
    val down = MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, x, y, 0)
    val up = MotionEvent.obtain(time, time + 50, MotionEvent.ACTION_UP, x, y, 0)
    view.onTouchEvent(down)
    view.onTouchEvent(up)
    down.recycle()
    up.recycle()
  }

  @Test
  fun tapWhereARemovedLinkWasDrawnDoesNotClickIt() {
    val mason = Mason()
    val p = mason.createTextView(context, TextType.P)
    val link = mason.createTextView(context, TextType.A).apply { append("link") }
    p.append(link)
    p.append(" and some plain text after it")
    val clicks = mutableListOf<String>()
    link.addEventListener("click") { clicks.add("link") }

    layOut(p, 1000)
    Assert.assertNull("text with a nested link takes the StaticLayout path", p.engine.preparedText)

    p.textContent = "plain text now"
    layOut(p, 1000)
    Assert.assertNotNull("plain text is drawn from prepared lines", p.engine.preparedText)

    tap(p, p.paddingLeft + 4f, p.height / 2f)
    Assert.assertEquals(emptyList<String>(), clicks)
  }

  @Test
  fun textCentredByItsOwnContainerIsDrawnWhereStaticLayoutDrawsIt() {
    val cases = listOf<Pair<String, (Style) -> Unit>>(
      "flex, justify-content: center" to { it.display = Display.Flex; it.justifyContent = JustifyContent.Center },
      "flex column, align-items: center" to {
        it.display = Display.Flex
        it.flexDirection = FlexDirection.Column
        it.alignItems = AlignItems.Center
      },
      "grid, justify-items: center" to { it.display = Display.Grid; it.justifyItems = JustifyItems.Center },
      "flex, justify-content: flex-end" to { it.display = Display.Flex; it.justifyContent = JustifyContent.FlexEnd },
    )
    for ((name, centre) in cases) {
      fun badge(preparedText: Boolean) = withPreparedText(preparedText) {
        val mason = Mason()
        val badge = mason.createTextView(context, TextType.Span).apply {
          centre(style)
          style.setSizeWidth(400f, Dimension.Kind.Points.value)
          textContent = "New"
        }
        val root = mason.createView(context).apply { addView(badge) }
        val bitmap = layOutAndDraw(root, 600)
        Assert.assertEquals("$name: prepared", preparedText, badge.engine.preparedText != null)
        bitmap
      }
      Assert.assertTrue("$name: drawn as with StaticLayout", badge(true).sameAs(badge(false)))
    }
  }

  @Test
  fun aParagraphThatLostItsLinkIsSizedAsWithStaticLayout() {
    fun sizes(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val row = mason.createView(context).apply { style.display = Display.Flex }
      val p = mason.createTextView(context, TextType.P)
      p.append(mason.createTextView(context, TextType.A).apply { append("link") })
      p.append(" and the text after it")
      row.addView(p)
      listOf(null, " ", "plain").map { content ->
        content?.let {
          p.textContent = it
          collectRemovedNodes()
        }
        layOutAndDraw(row, 600)
        "'$content': ${p.node.size()}"
      }
    }
    Assert.assertEquals(sizes(false), sizes(true))
  }

  @Test
  fun aParagraphPreparedBeforeItsSiblingFloatedWrapsAroundTheFloat() {
    fun drawn(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(context)
      val box = mason.createView(context).apply {
        style.setSizeWidth(200f, Dimension.Kind.Points.value)
        style.setSizeHeight(120f, Dimension.Kind.Points.value)
        style.background = "red"
      }
      val p = mason.createTextView(context, TextType.P).apply { textContent = LONG }
      root.addView(box)
      root.addView(p)
      val beside = layOutAndDraw(root, 600)
      Assert.assertEquals("prepared before the float", preparedText, p.engine.preparedText != null)
      box.writeStyleThenSync(StateKeys.FLOAT) { it.put(StyleKeys.FLOAT, CSSFloat.Left.value) }
      layOutAndDraw(root, 600).also {
        Assert.assertFalse("the float moved the text, prepared text $preparedText", it.sameAs(beside))
        Assert.assertNull("prepared beside the float", p.engine.preparedText)
      }
    }
    Assert.assertTrue(drawn(true).sameAs(drawn(false)))
  }

  @Test
  fun aParagraphPreparedBeforePreparedTextWasTurnedOffWrapsAroundALaterFloat() {
    fun floated(preparedTextBefore: Boolean) = withPreparedText(preparedTextBefore) {
      val mason = Mason()
      val root = mason.createView(context)
      val box = mason.createView(context).apply {
        style.setSizeWidth(200f, Dimension.Kind.Points.value)
        style.setSizeHeight(120f, Dimension.Kind.Points.value)
        style.background = "red"
      }
      val p = mason.createTextView(context, TextType.P).apply { textContent = LONG }
      root.addView(box)
      root.addView(p)
      layOutAndDraw(root, 600)
      Assert.assertEquals("prepared before the switch", preparedTextBefore, p.engine.preparedText != null)
      val unfloatedHeight = p.node.computedHeight
      PreparedText.enabled = false
      box.writeStyleThenSync(StateKeys.FLOAT) { it.put(StyleKeys.FLOAT, CSSFloat.Left.value) }
      layOutAndDraw(root, 600)
      // A text drawn around a float it was not measured beside posts this relayout, and a
      // detached view never runs what it posts.
      p.invalidateLayout()
      val drawn = layOutAndDraw(root, 600)
      if (!preparedTextBefore) Assert.assertTrue("the float wrapped the text", p.node.computedHeight > unfloatedHeight)
      Triple("${p.node.size()} at ${p.node.computedX},${p.node.computedY}", drawn, p.engine.preparedText != null)
    }
    val (offBox, offDrawn) = floated(false)
    val (box, drawn, prepared) = floated(true)
    Assert.assertEquals("paragraph box", offBox, box)
    Assert.assertTrue("drawn as with prepared text off from the start", drawn.sameAs(offDrawn))
    Assert.assertFalse("prepared after prepared text was turned off", prepared)
  }

  @Test
  fun aSpanWhoseRowBecameABlockIsLaidOutAsWithStaticLayout() {
    fun drawn(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(context).apply { style.display = Display.Flex }
      val before = mason.createTextView(context, TextType.Span).apply { textContent = "Before the span, " }
      val span = mason.createTextView(context, TextType.Span).apply { textContent = LONG }
      root.addView(before)
      root.addView(span)
      layOutAndDraw(root, 600)
      Assert.assertEquals("prepared in the row", preparedText, span.engine.preparedText != null)
      root.writeStyleThenSync(StateKeys.DISPLAY or StateKeys.DISPLAY_MODE) {
        it.put(StyleKeys.DISPLAY, Display.Block.value)
        it.put(StyleKeys.DISPLAY_MODE, DisplayMode.None.value)
      }
      layOutAndDraw(root, 600) to "${before.node.size()} ${span.node.size()}"
    }
    val (on, onSizes) = drawn(true)
    val (off, offSizes) = drawn(false)
    Assert.assertEquals(offSizes, onSizes)
    Assert.assertTrue(on.sameAs(off))
  }

  @Test
  fun textTurnedRightToLeftIsLaidOutByStaticLayout() = withPreparedText(true) {
    val mason = Mason()
    val root = mason.createView(context)
    val p = mason.createTextView(context, TextType.P).apply { textContent = "12 34 56" }
    root.addView(p)
    layOutAndDraw(root, 600)
    Assert.assertNotNull("prepared left to right", p.engine.preparedText)
    p.writeStyleThenSync(StateKeys.DIRECTION) { it.put(StyleKeys.DIRECTION, Direction.RTL.value) }
    layOutAndDraw(root, 600)
    Assert.assertNull("prepared right to left", p.engine.preparedText)
  }

  @Test
  fun aFloatInsertedBeforeAPreparedParagraphIsWrappedAround() {
    fun drawn(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(context)
      val p = mason.createTextView(context, TextType.P).apply { textContent = LONG }
      root.addView(p)
      layOutAndDraw(root, 600)
      Assert.assertEquals("prepared before the float", preparedText, p.engine.preparedText != null)
      val box = mason.createView(context).apply {
        style.float = CSSFloat.Left
        style.setSizeWidth(200f, Dimension.Kind.Points.value)
        style.setSizeHeight(120f, Dimension.Kind.Points.value)
        style.background = "red"
      }
      root.addView(box, 0)
      layOutAndDraw(root, 600)
    }
    Assert.assertTrue(drawn(true).sameAs(drawn(false)))
  }

  @Test
  fun aPreparedSpanMovedFromARowIntoABlockIsLaidOutAsWithStaticLayout() {
    fun drawn(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(context)
      val row = mason.createView(context).apply { style.display = Display.Flex }
      val block = mason.createView(context)
      val span = mason.createTextView(context, TextType.Span).apply { textContent = LONG }
      row.addView(span)
      block.addView(mason.createTextView(context, TextType.Span).apply { textContent = "Before the span, " })
      root.addView(row)
      root.addView(block)
      layOutAndDraw(root, 600)
      Assert.assertEquals("prepared in the row", preparedText, span.engine.preparedText != null)
      row.removeView(span)
      block.addView(span)
      layOutAndDraw(root, 600) to block.node.size()
    }
    val (on, onSize) = drawn(true)
    val (off, offSize) = drawn(false)
    Assert.assertEquals(offSize, onSize)
    Assert.assertTrue(on.sameAs(off))
  }

  @Test
  fun hidingAndShowingARowKeepsTheTextsAroundItPrepared() = withPreparedText(true) {
    val mason = Mason()
    val root = mason.createView(context)
    val row = mason.createView(context).apply { style.display = Display.Flex }
    val chip = mason.createTextView(context, TextType.Span).apply { textContent = "Chip" }
    val below = mason.createTextView(context, TextType.P).apply { textContent = "A paragraph below the row" }
    row.addView(chip)
    root.addView(row)
    root.addView(below)
    layOutAndDraw(root, 600)
    val prepared = listOf(chip, below).map { it.engine.preparedRun }
    Assert.assertTrue("prepared", prepared.all { it != null })
    row.style.display = Display.None
    layOutAndDraw(root, 600)
    row.style.display = Display.Flex
    layOutAndDraw(root, 600)
    Assert.assertEquals("the same preparations", prepared, listOf(chip, below).map { it.engine.preparedRun })
  }

  @Test
  fun textGivenFontPaddingAfterPreparationIsSizedAsWithStaticLayout() {
    fun size(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(context)
      val p = mason.createTextView(context, TextType.P).apply { textContent = "Font padding" }
      root.addView(p)
      if (preparedText) {
        layOutAndDraw(root, 600)
        Assert.assertNotNull("prepared without font padding", p.engine.preparedText)
      }
      p.includePadding = true
      layOutAndDraw(root, 600)
      Assert.assertNull("prepared with font padding", p.engine.preparedText)
      p.node.size()
    }
    Assert.assertEquals(size(false), size(true))
  }

  @Test
  fun anInlineFlexItemWrapsInsideItsPaddingAsWithStaticLayout() {
    val cases = listOf<Pair<String, (TextView) -> Unit>>(
      "width: 300px" to { it.style.setSizeWidth(300f, Dimension.Kind.Points.value) },
      "shrunk by its row" to {},
    )
    for ((name, size) in cases) {
      fun laidOut(preparedText: Boolean) = withPreparedText(preparedText) {
        val mason = Mason()
        val row = mason.createView(context).apply { style.display = Display.Flex }
        val span = mason.createTextView(context, TextType.Span).apply {
          style.setPadding(40f, 0f, 40f, 0f)
          textContent = LONG
          size(this)
        }
        row.addView(span)
        layOutAndDraw(row, 600)
        Assert.assertEquals("$name: prepared", preparedText, span.engine.preparedText != null)
        span.node.size()
      }
      Assert.assertEquals(name, laidOut(false), laidOut(true))
    }
  }

  @Test
  fun oneLineTextUnderALargerFontScaleIsAsTallAsWithStaticLayout() {
    val scaled = context.createConfigurationContext(
      Configuration(context.resources.configuration).apply { fontScale = 1.3f }
    )
    fun size(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(scaled)
      val p = mason.createTextView(scaled, TextType.P).apply { textContent = "One line" }
      root.addView(p)
      layOutAndDraw(root, 600)
      Assert.assertEquals("prepared", preparedText, p.engine.preparedText != null)
      p.node.size()
    }
    Assert.assertEquals(size(false), size(true))
  }

  @Test
  fun anInlineBlockWithNoWidthSitsOnItsParagraphsBaselineAsWithStaticLayout() {
    fun laidOut(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(context)
      val label = mason.createTextView(context, TextType.Span).apply { textContent = "Label" }
      val box = mason.createView(context).apply {
        style.display = Display.InlineBlock
        style.setSizeWidth(0f, Dimension.Kind.Points.value)
      }
      val p = mason.createTextView(context, TextType.P).apply { textContent = "Several words in no width" }
      box.addView(p)
      root.addView(label)
      root.addView(box)
      layOutAndDraw(root, 600)
      Assert.assertEquals("prepared", preparedText, p.engine.preparedText != null)
      "label at ${label.node.computedY}, box at ${box.node.computedY}, root ${root.node.size()}"
    }
    Assert.assertEquals(laidOut(false), laidOut(true))
  }

  @Test
  fun textCentredInABoxItsOwnWidthIsDrawnWhereStaticLayoutDrawsIt() {
    for (label in listOf("New", "Sale", "Beta", "Hot", "Free", "Pro", "Top", "Live")) {
      fun badge(preparedText: Boolean) = withPreparedText(preparedText) {
        val mason = Mason()
        val badge = mason.createTextView(context, TextType.Span).apply {
          style.display = Display.Flex
          style.justifyContent = JustifyContent.Center
          textContent = label
        }
        val root = mason.createView(context).apply {
          style.display = Display.Flex
          addView(badge)
        }
        val bitmap = layOutAndDraw(root, 600)
        Assert.assertEquals("'$label': prepared", preparedText, badge.engine.preparedText != null)
        bitmap
      }
      Assert.assertTrue("'$label': drawn as with StaticLayout", badge(true).sameAs(badge(false)))
    }
  }

  @Test
  fun decorationAddedAfterPreparationIsDrawn() {
    val decorations = listOf<Pair<String, (Style) -> Unit>>(
      "underline" to { it.decorationLine = Styles.DecorationLine.Underline },
      "text-shadow" to { it.textShadow = "6px 6px 0px red" },
    )
    for ((name, decorate) in decorations) {
      fun paragraph(mason: Mason) = mason.createTextView(context, TextType.P).apply { textContent = "Decorated text" }
      val decoratedAfter = withPreparedText(true) {
        val mason = Mason()
        val root = mason.createView(context)
        val p = paragraph(mason)
        root.addView(p)
        val plain = layOutAndDraw(root, 600)
        Assert.assertNotNull("$name: prepared before", p.engine.preparedText)
        decorate(p.style)
        drawn(root).also { Assert.assertFalse("$name: drawn", it.sameAs(plain)) }
      }
      val decoratedFirst = withPreparedText(false) {
        val mason = Mason()
        val root = mason.createView(context)
        root.addView(paragraph(mason).apply { decorate(style) })
        layOutAndDraw(root, 600)
      }
      Assert.assertTrue("$name: drawn as with StaticLayout", decoratedAfter.sameAs(decoratedFirst))
    }
  }

  @Test
  fun textChangedDuringAComputeIsMeasuredByTheNextCompute() {
    fun size(preparedText: Boolean) = withPreparedText(preparedText) {
      val mason = Mason()
      val root = mason.createView(context)
      val p = mason.createTextView(context, TextType.P).apply { textContent = "Short" }
      var changeText = false
      val leaf = object : android.view.View(context) {
        override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
          if (changeText) {
            changeText = false
            p.textContent = LONG
          }
          setMeasuredDimension(10, 10)
        }
      }
      root.addView(p)
      root.addView(leaf)
      layOutAndDraw(root, 600)
      val short = p.node.size()
      changeText = true
      root.compute(500f, -1f)
      Assert.assertFalse("text changed during the compute", changeText)
      root.compute(400f, -1f)
      root.node.computeCacheDirty = true
      root.layoutFlat()
      p.node.size().also { Assert.assertNotEquals("measured long, prepared text $preparedText", short, it) }
    }
    Assert.assertEquals(size(false), size(true))
  }

  @Test
  fun aParagraphIsPreparedOnlyWhileNoFloatIsBesideIt() = withPreparedText(true) {
    for (display in listOf(Display.Block, Display.Flex)) {
      val mason = Mason()
      val root = mason.createView(context).apply { style.display = display }
      val p = mason.createTextView(context, TextType.P).apply { textContent = LONG }
      val box = mason.createView(context).apply {
        style.float = CSSFloat.Left
        style.setSizeWidth(200f, Dimension.Kind.Points.value)
        style.setSizeHeight(120f, Dimension.Kind.Points.value)
      }
      root.addView(p)
      layOutAndDraw(root, 600)
      Assert.assertNotNull("$display: prepared alone", p.engine.preparedText)
      root.addView(box)
      layOutAndDraw(root, 600)
      Assert.assertNull("$display: prepared beside the float", p.engine.preparedText)
      root.removeView(box)
      layOutAndDraw(root, 600)
      Assert.assertNotNull("$display: prepared once the float is gone", p.engine.preparedText)
    }
  }

  @Test
  fun blankTextIsSizedAndAlignedAsWithStaticLayout() {
    for (blank in listOf(" ", "\u00A0", "\u2007", "\u202F", "")) {
      fun laidOut(preparedText: Boolean) = withPreparedText(preparedText) {
        val mason = Mason()
        val row = mason.createView(context).apply {
          style.display = Display.Flex
          style.alignItems = AlignItems.Baseline
        }
        val empty = mason.createTextView(context, TextType.Span).apply { textContent = blank }
        val label = mason.createTextView(context, TextType.Span).apply { textContent = "Label" }
        row.addView(empty)
        row.addView(label)
        layOutAndDraw(row, 600)
        val inRow = "blank ${empty.node.size()} at ${empty.node.computedY}, label at ${label.node.computedY}, row ${row.node.size()}"

        val root = mason.createView(context)
        val before = mason.createTextView(context, TextType.Span).apply { textContent = "Label" }
        val box = mason.createView(context).apply {
          style.display = Display.InlineBlock
          style.setSizeWidth(400f, Dimension.Kind.Points.value)
        }
        box.addView(mason.createTextView(context, TextType.P).apply { textContent = blank })
        root.addView(before)
        root.addView(box)
        layOutAndDraw(root, 1000)
        "$inRow; inline block at ${box.node.computedY}, label at ${before.node.computedY}, root ${root.node.size()}"
      }
      Assert.assertEquals(blank.map { it.code.toString(16) }.toString(), laidOut(false), laidOut(true))
    }
  }

  @Test
  fun textWithLineBreaksIsSizedAsWithStaticLayout() {
    val samples = listOf(
      Styles.WhiteSpace.PreLine to "one\ntwo",
      Styles.WhiteSpace.PreLine to "ends with a break\n",
      Styles.WhiteSpace.PreLine to "   ",
      Styles.WhiteSpace.Normal to "line\u2028separator",
      Styles.WhiteSpace.Normal to "paragraph\u2029separator",
      Styles.WhiteSpace.Normal to "next\u0085line",
    )
    for ((whiteSpace, content) in samples) {
      fun size(preparedText: Boolean) = withPreparedText(preparedText) {
        val mason = Mason()
        val root = mason.createView(context)
        val p = mason.createTextView(context, TextType.P).apply {
          style.whiteSpace = whiteSpace
          textContent = content
        }
        root.addView(p)
        layOutAndDraw(root, 600)
        p.node.size()
      }
      Assert.assertEquals("$whiteSpace ${content.map { it.code.toString(16) }}", size(false), size(true))
    }
  }

  // Wide enough that the text's automatic minimum width does not hide its flex base size.
  private fun maxWidthRowBoxes(preparedText: Boolean, limit: (View, TextView) -> Unit) = withPreparedText(preparedText) {
    val mason = Mason()
    val row = mason.createView(context).apply { style.display = Display.Flex }
    val text = mason.createTextView(context, TextType.P).apply { textContent = LONG }
    val box = mason.createView(context).apply { style.flexBasis = Dimension.Points(400f) }
    row.addView(text)
    row.addView(box)
    limit(row, text)
    layOutAndDraw(row, 600)
    "text ${text.node.size()}, box ${box.node.size()} at ${box.node.computedX}"
  }

  @Test
  fun aFlexItemWithAMaxWidthSharesItsRowAsWithStaticLayout() {
    fun boxes(preparedText: Boolean) = maxWidthRowBoxes(preparedText) { _, text ->
      text.style.maxWidth = Dimension.Points(400f)
    }
    Assert.assertEquals(boxes(false), boxes(true))
  }

  @Test
  fun aMaxWidthWrittenAfterPreparationSharesTheRowAsWithStaticLayout() {
    fun boxes(preparedText: Boolean) = maxWidthRowBoxes(preparedText) { row, text ->
      layOutAndDraw(row, 600)
      Assert.assertEquals("prepared before the max-width", preparedText, text.engine.preparedText != null)
      text.writeStyleThenSync(StateKeys.MAX_SIZE) {
        it.put(StyleKeys.MAX_WIDTH_TYPE, Dimension.Kind.Points.value)
        it.putFloat(StyleKeys.MAX_WIDTH_VALUE, 400f)
      }
    }
    Assert.assertEquals(boxes(false), boxes(true))
  }

  private fun <T> squeezedToNoWidth(preparedText: Boolean, inspect: (TextView, Bitmap) -> T) = withPreparedText(preparedText) {
    val mason = Mason()
    val row = mason.createView(context).apply { style.display = Display.Flex }
    val text = mason.createTextView(context, TextType.P).apply {
      style.flexBasis = Dimension.Points(0f)
      style.setMinSizeWidth(0f, Dimension.Kind.Points.value)
      textContent = "Squeezed out of its row"
    }
    val wide = mason.createView(context).apply {
      style.flexShrink = 0f
      style.setSizeWidth(600f, Dimension.Kind.Points.value)
    }
    row.addView(text)
    row.addView(wide)
    val bitmap = layOutAndDraw(row, 600)
    Assert.assertEquals("text width", 0f, text.node.computedWidth)
    Assert.assertEquals("prepared", preparedText, text.engine.preparedText != null)
    inspect(text, bitmap)
  }

  @Test
  fun textSqueezedToNoWidthIsDrawnAsWithStaticLayout() {
    val laidOut = squeezedToNoWidth(false) { _, bitmap -> bitmap }
    Assert.assertTrue(squeezedToNoWidth(true) { _, bitmap -> bitmap }.sameAs(laidOut))
  }

  @Test
  fun textSqueezedToNoWidthReportsNoLinesToContentCapture() {
    for (preparedText in listOf(false, true)) {
      val lines = squeezedToNoWidth(preparedText) { text, _ ->
        RecordingViewStructure().also { text.onProvideContentCaptureStructure(it, 0) }
          .calls.filter { it.startsWith("setTextLines") }
      }
      Assert.assertEquals("lines, prepared text $preparedText", emptyList<String>(), lines)
    }
  }

  private fun collectRemovedNodes() {
    repeat(3) {
      Runtime.getRuntime().gc()
      System.runFinalization()
      Thread.sleep(50)
    }
  }

  private companion object {
    val LONG = "The quick brown fox jumps over the lazy dog. ".repeat(6).trim()
  }
}
