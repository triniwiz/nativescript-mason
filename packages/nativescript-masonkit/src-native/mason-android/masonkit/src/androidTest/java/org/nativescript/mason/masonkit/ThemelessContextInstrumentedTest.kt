package org.nativescript.mason.masonkit

import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import android.view.ContextThemeWrapper
import android.view.ViewGroup
import android.widget.EditText
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.TextType
import java.lang.ref.WeakReference

@RunWith(AndroidJUnit4::class)
class ThemelessContextInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private class Plain(context: Context) : ViewGroup(context) {
    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {}
  }

  private fun defaults(v: android.view.View): Map<String, Any?> {
    val g = v as ViewGroup
    val m = linkedMapOf<String, Any?>(
      "focusable" to v.isFocusable, "focusableInTouchMode" to v.isFocusableInTouchMode,
      "clickable" to v.isClickable, "longClickable" to v.isLongClickable,
      "soundEffects" to v.isSoundEffectsEnabled, "haptic" to v.isHapticFeedbackEnabled,
      "layoutDirection" to v.layoutDirection,
      "textDirection" to v.textDirection, "textAlignment" to v.textAlignment,
      "importantForA11y" to v.importantForAccessibility, "liveRegion" to v.accessibilityLiveRegion,
      "vScrollBar" to v.isVerticalScrollBarEnabled, "hScrollBar" to v.isHorizontalScrollBarEnabled,
      "vFadingEdge" to v.isVerticalFadingEdgeEnabled, "hFadingEdge" to v.isHorizontalFadingEdgeEnabled,
      "overScrollMode" to v.overScrollMode, "background" to v.background, "foreground" to v.foreground,
      "minWidth" to v.minimumWidth, "minHeight" to v.minimumHeight, "elevation" to v.elevation,
      "translationZ" to v.translationZ, "alpha" to v.alpha, "visibility" to v.visibility,
      "stateListAnimator" to v.stateListAnimator, "fitsSystemWindows" to v.fitsSystemWindows,
      "keepScreenOn" to v.keepScreenOn, "willNotDraw" to v.willNotDraw(), "padding" to listOf(
        v.paddingLeft, v.paddingTop, v.paddingRight, v.paddingBottom, v.paddingStart, v.paddingEnd
      ),
      "clipChildren" to g.clipChildren, "clipToPadding" to g.clipToPadding,
      "descendantFocusability" to g.descendantFocusability, "splitMotion" to g.isMotionEventSplittingEnabled,
      "layoutMode" to g.layoutMode, "transitionGroup" to g.isTransitionGroup,
      "layoutTransition" to g.layoutTransition, "layoutAnimation" to g.layoutAnimation,
      "touchscreenBlocksFocus" to g.touchscreenBlocksFocus, "scrollIndicators" to v.scrollIndicators,
      "nestedScroll" to v.isNestedScrollingEnabled, "defaultFocusHighlight" to v.defaultFocusHighlightEnabled,
      "focusedByDefault" to v.isFocusedByDefault, "keyboardNavigationCluster" to v.isKeyboardNavigationCluster,
      "importantForAutofill" to v.importantForAutofill, "tooltip" to v.tooltipText,
    )
    if (Build.VERSION.SDK_INT >= 28) {
      m["screenReaderFocusable"] = v.isScreenReaderFocusable; m["a11yHeading"] = v.isAccessibilityHeading
    }
    if (Build.VERSION.SDK_INT >= 29) m["forceDarkAllowed"] = v.isForceDarkAllowed
    if (Build.VERSION.SDK_INT >= 30) m["importantForContentCapture"] = v.importantForContentCapture
    return m
  }

  private fun unwrapsTo(context: Context, target: Context): Boolean {
    var c: Context? = context
    while (c != null) {
      if (c === target) return true
      c = (c as? ContextWrapper)?.baseContext
    }
    return false
  }

  private fun descendants(v: android.view.View): List<android.view.View> =
    listOf(v) + ((v as? ViewGroup)?.let { g -> (0 until g.childCount).flatMap { descendants(g.getChildAt(it)) } } ?: emptyList())

  @Test
  fun aViewGroupOnTheThemelessContextHasTheThemedDefaults() {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val appCompat = ContextThemeWrapper(activity, androidx.appcompat.R.style.Theme_AppCompat_Light_NoActionBar)
        for (themed in listOf<Context>(activity, appCompat)) {
          assertEquals(defaults(Plain(themed)), defaults(Plain(ThemelessContext.wrap(themed))))
          assertEquals(defaults(View(themed, null, 0, true)), defaults(View(ThemelessContext.wrap(themed), null, 0, true)))
        }
      }
    }
  }

  @Test
  fun masonViewsReachTheActivityAndShareItsResources() {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val mason = Mason()
        val views = listOf(mason.createView(activity), mason.createTextView(activity, TextType.Span))
        for (v in views) {
          assertTrue("${v.javaClass.simpleName} context should unwrap to the Activity", unwrapsTo(v.context, activity))
          assertSame("a configuration change on the Activity must reach the view", activity.resources, v.context.resources)
        }
        mason.clear()
      }
    }
  }

  @Test
  fun themedWidgetsMadeFromAMasonViewKeepTheActivityTheme() {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val mason = Mason()
        val parent = mason.createView(activity)
        parent.innerHTML = "<input type=\"text\"><scroll></scroll>"
        parent.measure(
          android.view.View.MeasureSpec.makeMeasureSpec(400, android.view.View.MeasureSpec.EXACTLY),
          android.view.View.MeasureSpec.makeMeasureSpec(0, android.view.View.MeasureSpec.UNSPECIFIED)
        )
        parent.layout(0, 0, parent.measuredWidth, parent.measuredHeight)
        val all = descendants(parent)
        val input = all.filterIsInstance<Input>().single()
        val scroll = all.filterIsInstance<Scroll>().single()

        assertEquals("selection colour comes from the theme", EditText(activity).highlightColor, input.textInput.highlightColor)
        assertSame("a date picker needs the Activity", activity, input.context)
        assertSame("edge effects and scrollbars come from the theme", activity, scroll.context)
        mason.clear()
      }
    }
  }

  @Test
  fun theCachedWrapperDoesNotKeepItsBaseContextAlive() {
    var base: Context? = ContextThemeWrapper(instr.targetContext, androidx.appcompat.R.style.Theme_AppCompat_Light_NoActionBar)
    val ref = WeakReference(base)
    instr.runOnMainSync {
      val mason = Mason()
      mason.createView(base!!)
      mason.createTextView(base!!, TextType.Span)
      ThemelessContext.textPaint(base!!)
      mason.clear()
    }
    base = null
    for (i in 0 until 20) {
      if (ref.get() == null) break
      Runtime.getRuntime().gc()
      System.runFinalization()
      Thread.sleep(50)
    }
    assertNull("the base context should be collectable", ref.get())
  }
}
