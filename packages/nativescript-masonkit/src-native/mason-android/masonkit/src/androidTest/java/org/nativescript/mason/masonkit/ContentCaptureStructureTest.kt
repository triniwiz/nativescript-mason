package org.nativescript.mason.masonkit

import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.fontmanager.FontWeight
import org.nativescript.mason.masonkit.enums.TextType
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class ContentCaptureStructureTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  @Test
  fun pendingTextReportsTheSameStructureAsThePlatform() {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var texts: List<TextView>
      val drawn = CountDownLatch(1)
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        val root = View.createFlexView(mason, activity).apply { flexDirection = FlexDirection.Column; setPadding(12f, 12f, 12f, 12f) }
        val a = TextView(activity, mason, TextType.Span).apply { textContent = "Row 42 title"; setTextSize(15f) }
        val b = TextView(activity, mason, TextType.P).apply {
          textContent = "A paragraph long enough to wrap onto several lines on a phone screen, so the multi-line path runs too."
          setTextSize(14f)
        }
        val c = TextView(activity, mason, TextType.Span).apply {
          textContent = "Bold red"
          setTextSize(18f)
          style.color = 0xFFCC0000.toInt()
          style.fontWeight = FontWeight.Bold
        }
        val d = TextView(activity, mason, TextType.P).apply {
          textContent = (1..2000).joinToString(" ") { "word$it" }
          setTextSize(16f)
        }
        texts = listOf(a, b, c, d)
        texts.forEach(root::addView)
        host.addView(root, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        host.viewTreeObserver.addOnDrawListener(object : ViewTreeObserver.OnDrawListener {
          override fun onDraw() { drawn.countDown() }
        })
      }
      assertTrue("host drew", drawn.await(10, TimeUnit.SECONDS))
      instr.waitForIdleSync()
      instr.runOnMainSync {
        val platformOnlyBaselines = Regex("""setTextLines\((\[.*?]), \[.*?]\)""")
        texts.forEachIndexed { i, tv ->
          val masonKit = RecordingViewStructure().also { tv.onProvideContentCaptureStructure(it, 0) }
          assertNull("text$i stayed deferred", tv.layout)
          masonKit.calls.firstOrNull { it.startsWith("setTextLines") }?.let { lines ->
            val layout = tv.floatAwareStaticLayout ?: tv.cachedStaticLayout!!
            val starts = Regex("""\d+""").findAll(lines.substringBefore("], [")).map { it.value.toInt() }.toList()
            val expected = starts.map { layout.getLineBaseline(layout.getLineForOffset(it)) + tv.paddingTop }
            assertEquals("text$i baselines", "setTextLines($starts, $expected)", lines)
          }
          tv.text
          val platform = RecordingViewStructure().also { tv.onProvideContentCaptureStructure(it, 0) }
          assertEquals("text$i", platform.calls.map { it.replace(platformOnlyBaselines, "setTextLines($1)") }, masonKit.calls.map { it.replace(platformOnlyBaselines, "setTextLines($1)") })
        }
      }
    }
  }
}
