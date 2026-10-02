package org.nativescript.mason.masonkit

import android.text.SpannableStringBuilder
import android.text.TextPaint
import org.junit.Assert.*
import org.junit.Test

class MasonTextNodeTests {

  @Test
  fun test_applyAttributes_color_and_size() {
    val text = "hello"
    val spannable = SpannableStringBuilder(text)

    val attrs = TextDefaultAttributes()
    attrs.color = 0xFF112233.toInt()
    attrs.fontSize = 18

    TextNode.applyAttributes(spannable, 0, spannable.length, attrs)

    // Color and size are applied together by one run-style span.
    val spans = spannable.getSpans(0, spannable.length, Spans.RunStyleSpan::class.java)
    assertTrue(spans.isNotEmpty())
    val paint = TextPaint()
    spans[0].updateDrawState(paint)
    assertEquals(0xFF112233.toInt(), paint.color)
  }

  @Test
  fun test_processText_transforms_whitespace() {
    // A real node: a Style over a null native pointer has no buffer to write to.
    val style = Mason.shared.createNode().style
    // ensure a known transform without relying on view
    style.textTransform = Styles.TextTransform.Uppercase
    style.whiteSpace = Styles.WhiteSpace.Normal

    val input = "hello   world\nnext"
    val processed = TextNode.processText(input, style)
    // Uppercase and collapsed spaces
    assertTrue(processed.contains("HELLO"))
    assertFalse(processed.contains("  "))
  }
}
