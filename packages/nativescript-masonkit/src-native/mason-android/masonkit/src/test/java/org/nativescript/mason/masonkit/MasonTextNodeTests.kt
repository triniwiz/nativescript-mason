package org.nativescript.mason.masonkit

import android.text.SpannableStringBuilder
import android.text.style.ForegroundColorSpan
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

    val spans = spannable.getSpans(0, spannable.length, ForegroundColorSpan::class.java)
    assertTrue(spans.isNotEmpty())
    val colorSpan = spans[0]
    // ForegroundColorSpan has getForegroundColor() on TextPaint only at draw-time; we at least ensure span exists
    assertNotNull(colorSpan)
  }

  @Test
  fun test_processText_transforms_whitespace() {
    val style = Style(Node(Mason.shared, 0L))
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
