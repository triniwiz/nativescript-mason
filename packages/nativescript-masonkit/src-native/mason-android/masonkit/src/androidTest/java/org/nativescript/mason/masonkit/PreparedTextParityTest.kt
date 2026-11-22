package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Picture
import android.text.StaticLayout
import android.util.Log
import android.view.View.MeasureSpec
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.fontmanager.FontWeight
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.TextType
import kotlin.math.abs
import kotlin.random.Random

@RunWith(AndroidJUnit4::class)
class PreparedTextParityTest {
  private val context = ApplicationProvider.getApplicationContext<Context>()
  private val enabled = PreparedText.enabled

  @Before
  fun requirePreparedText() = assumeTrue("prepared text is off on this device", enabled)

  @After
  fun restore() {
    PreparedText.enabled = enabled
  }

  @Test
  fun cardsGetTheSameBoxesAndLineStartsAtEveryWidth() {
    val prepared = Fixture.cards(context, preparedText = true)
    val laidOut = Fixture.cards(context, preparedText = false)
    val (preparedCount, lineBreaks, mismatches) = compare(prepared, laidOut)
    Log.i(TAG, "prepared $preparedCount of ${prepared.texts.size} texts; ${WIDTHS.size} widths, $lineBreaks line breaks compared")
    assertEquals("texts prepared", prepared.texts.count { it.prepares }, preparedCount)
    assertEquals(emptyList<String>(), mismatches.take(20))
  }

  @Test
  fun textsWithHyphensUrlsAndFallbackFontsMatchStaticLayout() = assertSamplesMatch(BREAK_SAMPLES)

  @Test
  fun textsWithControlCharactersOrPreservedWhiteSpaceMatchStaticLayout() =
    assertSamplesMatch(CONTROL_CHARACTERS_AS_SPACES + NON_NORMAL_WHITE_SPACE)

  private fun assertSamplesMatch(samples: List<Sample>) {
    val prepared = Fixture.samples(context, preparedText = true, samples)
    val laidOut = Fixture.samples(context, preparedText = false, samples)
    val (preparedCount, _, mismatches) = compare(prepared, laidOut)
    assertEquals("texts prepared", prepared.texts.count { it.prepares }, preparedCount)
    assertEquals(emptyList<String>(), mismatches.take(20))
  }

  @Test
  fun minContentSizesInANarrowRowMatchStaticLayout() {
    for (sample in MIN_CONTENT_SAMPLES) {
      fun size(preparedText: Boolean): String {
        PreparedText.enabled = preparedText
        val mason = Mason()
        val row = mason.createView(context).apply {
          style.display = Display.Flex
          style.setSizeWidth(40f, Dimension.Kind.Points.value)
        }
        val text = mason.createTextView(context, if (sample.inline) TextType.Span else TextType.P).apply {
          textContent = sample.text
        }
        row.addView(text)
        row.applyLayoutFlat(row.node, row.computeAndLayout(40f, -1f))
        assertEquals("'${sample.text}' prepared", preparedText, text.engine.preparedText != null)
        return text.node.size()
      }
      assertEquals("'${sample.text}', inline ${sample.inline}", size(false), size(true))
    }
  }

  private fun compare(prepared: Fixture, laidOut: Fixture): Triple<Int, Int, List<String>> {
    val mismatches = mutableListOf<String>()
    var preparedCount = 0
    var lineBreaks = 0
    for (width in WIDTHS) {
      val on = prepared.layOut(width)
      val off = laidOut.layOut(width)
      if (width == WIDTHS.first()) {
        preparedCount = prepared.texts.count { it.view.engine.preparedText != null }
        assertEquals("texts prepared with it off", 0, laidOut.texts.count { it.view.engine.preparedText != null })
      }
      for (i in on.indices) {
        val (a, b) = on[i] to off[i]
        val text = prepared.texts[i].text.take(40)
        if (abs(a.width - b.width) >= 0.01f || abs(a.height - b.height) >= 0.01f) {
          mismatches += "at $width, '$text' box ${a.width}x${a.height}, StaticLayout's ${b.width}x${b.height}"
        }
        if (!a.lineStarts.contentEquals(b.lineStarts)) {
          mismatches += "at $width, '$text' lines start at ${a.lineStarts.toList()}, StaticLayout's at ${b.lineStarts.toList()}"
        }
        lineBreaks += b.lineStarts.size - 1
      }
    }
    return Triple(preparedCount, lineBreaks, mismatches)
  }

  @Test
  fun anInlineBlockSitsOnItsPreparedParagraphsLastBaseline() {
    fun layOut(preparedText: Boolean): List<Float> {
      PreparedText.enabled = preparedText
      val mason = Mason()
      val root = mason.createView(context)
      val label = mason.createTextView(context, TextType.Span).apply { textContent = "Label" }
      val box = mason.createView(context).apply {
        style.display = Display.InlineBlock
        style.setSizeWidth(400f, Dimension.Kind.Points.value)
      }
      val paragraph = mason.createTextView(context, TextType.P).apply {
        textContent = "A paragraph long enough to wrap onto several lines inside its inline block."
      }
      box.addView(paragraph)
      root.addView(label)
      root.addView(box)
      root.applyLayoutFlat(root.node, root.computeAndLayout(1000f, -1f))
      assertEquals("paragraph prepared", preparedText, paragraph.engine.preparedText != null)
      return listOf(label.node.computedY, box.node.computedY, root.node.computedHeight, paragraph.node.computedHeight)
    }
    assertEquals("label y, box y, root height, paragraph height", layOut(false), layOut(true))
  }

  private class Measured(val width: Float, val height: Float, val lineStarts: IntArray)

  private class Entry(val text: String, val view: TextView, val prepares: Boolean)

  private class Sample(
    val text: String,
    val prepares: Boolean = true,
    val inline: Boolean = false,
    val whiteSpace: Styles.WhiteSpace? = null,
  )

  private class Fixture(context: Context, private val preparedText: Boolean) {
    val mason = Mason()
    val root: View = View.createFlexView(mason, context).apply {
      flexDirection = FlexDirection.Column
      setPadding(12f, 12f, 12f, 12f)
      setGap(10f, 10f)
    }
    val texts = mutableListOf<Entry>()

    fun text(
      context: Context,
      value: String,
      size: Float,
      bold: Boolean = false,
      prepares: Boolean = true,
      whiteSpace: Styles.WhiteSpace? = null,
    ): TextView {
      val view = TextView(context, mason, TextType.None)
      whiteSpace?.let { view.style.whiteSpace = it }
      view.textContent = value
      view.setTextSize(size)
      if (bold) view.fontWeight = FontWeight.Bold
      texts += Entry(value, view, prepares)
      return view
    }

    fun layOut(width: Float): List<Measured> {
      PreparedText.enabled = preparedText
      root.node.computeCacheDirty = true
      root.applyLayoutFlat(root.node, root.computeAndLayout(width, -1f))
      val w = width.toInt()
      val h = root.node.computedHeight.toInt().coerceAtLeast(1)
      root.measure(MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(h, MeasureSpec.EXACTLY))
      root.layout(0, 0, w, h)
      val picture = Picture()
      root.draw(picture.beginRecording(w, h))
      picture.endRecording()
      return texts.map { measured(it.view) }
    }

    private fun measured(view: TextView): Measured {
      val n = view.node
      val contentWidth = n.computedWidth - n.computedPaddingLeft - n.computedPaddingRight -
        n.computedBorderLeft - n.computedBorderRight
      view.engine.preparedRun?.let { prepared ->
        val lines = prepared.lines(contentWidth)!!
        return Measured(n.computedWidth, n.computedHeight, IntArray(lines.lineCount) { lines.lineStart(it) })
      }
      val text = view.engine.applyTextIfNeeded()
      val layout = StaticLayout.Builder.obtain(text, 0, text.length, view.paint, ceilConstraint(contentWidth)).build()
      return Measured(n.computedWidth, n.computedHeight, IntArray(layout.lineCount) { layout.getLineStart(it) })
    }

    companion object {
      fun cards(context: Context, preparedText: Boolean) = Fixture(context, preparedText).apply {
        val r = Random(7)
        repeat(CARDS) { i ->
          val card = View.createFlexView(mason, context).apply {
            flexDirection = FlexDirection.Column
            setPadding(10f, 8f, 10f, 8f)
            setGap(4f, 4f)
          }
          card.addView(text(context, sentence(r, 2 + r.nextInt(5)), 18f, bold = true))
          val body = when {
            i % 20 == 7 -> MIXED_SCRIPTS[(i / 20) % MIXED_SCRIPTS.size].let {
              Sample(it.text + " " + sentence(r, 6 + r.nextInt(10)), it.prepares)
            }
            i % 5 == 0 -> Sample(paragraph(r, 40 + r.nextInt(50)))
            else -> Sample(sentence(r, 6 + r.nextInt(18)))
          }
          card.addView(text(context, body.text, 14f, prepares = body.prepares))
          val chips = View.createFlexView(mason, context).apply {
            flexDirection = FlexDirection.Row
            flexWrap = FlexWrap.Wrap
            setGap(6f, 6f)
          }
          repeat(3) { chips.addView(text(context, sentence(r, 1 + r.nextInt(2)).dropLast(1), 12f)) }
          card.addView(chips)
          root.addView(card)
        }
      }

      fun samples(context: Context, preparedText: Boolean, samples: List<Sample>) = Fixture(context, preparedText).apply {
        for (sample in samples) {
          root.addView(text(context, sample.text, 16f, prepares = sample.prepares, whiteSpace = sample.whiteSpace))
        }
      }
    }
  }

  companion object {
    const val TAG = "PreparedTextParity"
    const val CARDS = 200
    val WIDTHS = floatArrayOf(1080f, 936f, 808f, 680f, 552f, 424f, 360f, 240f, 120f)

    private val WORDS = ("the of and to in is it layout measure text android rust native kotlin bridge mason taffy " +
      "flex grid wrap line break shaping glyph font weight style paragraph container width height pixel cache " +
      "crossing upcall budget frame render paint canvas window surface thread queue latency throughput benchmark " +
      "baseline prototype parity fallback script locale hyphen justify align intrinsic minimum maximum content " +
      "available definite constraint segment cluster advance kerning ligature unicode opportunity mandatory greedy " +
      "internationalization accessibility performance a an we our you they was were be has had").split(" ")

    private val MIXED_SCRIPTS = listOf(
      Sample("東京の天気は晴れです。今日は良い一日になりそうです。", prepares = false),
      Sample("Status ✅ shipped 🚀 with emoji 😀🎉 inline"),
      Sample("مرحبا بالعالم and hello world", prepares = false),
      Sample("日本語のテキストと English が混ざった文字列"),
      Sample("Café naïve résumé façade coöperate Ångström"),
    )

    private val BREAK_SAMPLES = listOf(
      Sample("A well-known state-of-the-art re-entry plan for a long-awaited follow-up"),
      Sample("Dashes\u2010and\u2013ranges like 1990\u20132000 or pre\u2010war, mid\u2027dot and more"),
      Sample("\u0532\u0561\u0580\u0565\u0582 first, so its taller fallback font sets every line from the start"),
      Sample("A taller fallback font later on, \u0532\u0561\u0580\u0565\u0582, grows only the lines from its own", prepares = false),
      Sample("Write to someone@example.com or visit https://example.com/products/category/item today", prepares = false),
      Sample("Soft\u00ADhyphenated words like extra\u00ADordinary stay on the StaticLayout path", prepares = false),
    )

    private val CONTROL_CHARACTERS_AS_SPACES = listOf(
      Sample("Words\tafter a tab that wrap at the narrower widths"),
      Sample("Words\u000Bafter a vertical tab that wrap at the narrower widths"),
      Sample("Words\u000Cafter a form feed that wrap at the narrower widths"),
      Sample("Words\rafter a carriage return\r\nand a CRLF that wrap at the narrower widths"),
    )

    private val NON_NORMAL_WHITE_SPACE = listOf(
      Styles.WhiteSpace.NoWrap, Styles.WhiteSpace.Pre, Styles.WhiteSpace.PreWrap, Styles.WhiteSpace.BreakSpaces,
    ).map {
      Sample("$it with  doubled  spaces and a line long enough to wrap", prepares = false, whiteSpace = it)
    }

    private val MIN_CONTENT_SAMPLES = listOf(
      Sample("well-known-and-widely-adopted"),
      Sample("red/green/blue/yellow/orange/purple"),
      Sample("日本語の文章は単語の間に空白を入れないのでほとんどの文字の間で改行できます"),
      Sample("10\u00A0km"),
      Sample("日本語 then Café naïve Ελληνικά 😀"),
      Sample("foo-bar", inline = true),
      Sample("An inline span of several words", inline = true),
      Sample("A well-known span, then more words", inline = true),
    )

    fun sentence(r: Random, words: Int): String =
      (0 until words).joinToString(" ") { WORDS[r.nextInt(WORDS.size)] }.replaceFirstChar { it.uppercase() } + "."

    fun paragraph(r: Random, words: Int): String {
      val parts = mutableListOf<String>()
      var left = words
      while (left > 0) {
        val n = minOf(left, 6 + r.nextInt(12))
        parts += sentence(r, n)
        left -= n
      }
      return parts.joinToString(" ")
    }
  }
}
