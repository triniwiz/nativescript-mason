package org.nativescript.mason.masondemo

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.*
import org.nativescript.mason.masonkit.enums.Display

/**
 * Reproduces the grid_template_areas_500 layout from GridActivity to verify
 * that grid children do not overflow their container when the root has padding.
 *
 * Structure: Scroll (vertical padding) → body (40px margin) → grid ("275px auto", 8px gap) → text items
 *
 * Expected: auto column = body_width - 275 - 8, no item exceeds grid width.
 * Bug: auto column resolves to max-content (~1292px) instead of being constrained.
 */
@RunWith(AndroidJUnit4::class)
class GridTemplateAreasOverflowTest {

  private lateinit var mason: Mason
  private lateinit var context: android.content.Context
  private var density: Float = 1f

  private fun toPx(dp: Float): Float = dp * density

  @Before
  fun setup() {
    context = InstrumentationRegistry.getInstrumentation().targetContext
    mason = Mason.shared
    val metrics = context.resources.displayMetrics
    density = metrics.density
    mason.setDeviceScale(density)
  }

  @Test
  fun gridTemplateAreas_noOverflow() {
    val screenWidth = context.resources.displayMetrics.widthPixels.toFloat()

    // Scroll root with system bar padding (vertical only, like the demo)
    val scroll = Scroll(context, mason)
    scroll.style.padding = Rect(
      top = LengthPercentage.Points(290f), // simulates the system bar
      right = LengthPercentage.Points(0f),
      bottom = LengthPercentage.Points(132f),
      left = LengthPercentage.Points(0f),
    )

    // Body with 40px uniform margin
    val body = mason.createView(context)
    body.style.margin = Rect.uniform(LengthPercentageAuto.Points(40f))

    // Grid container: "275px auto" columns, 8px gap, template areas
    val grid = mason.createView(context)
    grid.configure {
      it.display = Display.Grid
      it.gridTemplateAreas = """
     "header  header"
		"sidebar content"
		"sidebar2 sidebar2"
		"footer  footer"
      """.trimIndent()
      // CSS px, which Mason scales by density like the web's device pixel ratio
      it.gridTemplateColumns = "100px auto"
      it.gap = Size(LengthPercentage.Points(8f), LengthPercentage.Points(8f))
    }

    val boxPadding: Rect<LengthPercentage> = Rect.uniform(LengthPercentage.Points(10f))

    // Header
    val header = mason.createView(context)
    header.append("Header")
    header.configure {
      header.style.gridArea = "header"
      it.padding = boxPadding
    }

    // Sidebar
    val sidebar = mason.createView(context)
    sidebar.append("Sidebar")
    sidebar.configure {
      sidebar.style.gridArea = "sidebar"
      it.padding = boxPadding
    }

    // Content — long text that would overflow if unconstrained
    val content = mason.createView(context)
    content.append("Content")
    val br = mason.createBr(context)
    content.append(br)
    content.append("More content than we had before so this column is now quite tall.")
    content.configure {
      content.style.gridArea = "content"
      it.padding = boxPadding
    }

    // Sidebar2
    val sidebar2 = mason.createView(context)
    sidebar2.append("Sidebar 2")
    sidebar2.configure {
      sidebar2.style.gridArea = "sidebar2"
      it.padding = boxPadding
    }

    // Footer
    val footer = mason.createView(context)
    footer.append("Footer")
    footer.configure {
      footer.style.gridArea = "footer"
      it.padding = boxPadding
    }

    // Assemble tree: grid ← items, body ← grid, scroll ← body
    grid.append(arrayOf(header, sidebar, sidebar2, content, footer))
    body.addView(grid)
    scroll.addView(body)

    // Compute layout at screen width
    val layout = scroll.computeAndLayout(screenWidth, -2f)  // -2 = MaxContent height

    assertTrue("Layout should have nodes", layout.nodeCount > 0)

    mason.printTree(scroll.node)

    // Read layout results via the flat tree
    val nv = layout.cursor

    // scroll = node 0
    nv.pointTo(0)
    val scrollW = nv.width
    Log.d("GridOverflowTest", "scroll: w=$scrollW h=${nv.height}")

    // body = node 1 (first child of scroll)
    nv.pointTo(1)
    val bodyW = nv.width
    val bodyX = nv.x
    Log.d("GridOverflowTest", "body: x=$bodyX w=$bodyW h=${nv.height}")

    // grid = node 2 (first child of body)
    nv.pointTo(2)
    val gridW = nv.width
    Log.d("GridOverflowTest", "grid: w=$gridW h=${nv.height}")

    // Iterate grid children (nodes 3+)
    val gridChildStart = layout.childStart[2]
    val gridChildCount = layout.childCount[2]
    val childNames = arrayOf("header", "sidebar", "sidebar2", "content", "footer")

    for (i in 0 until gridChildCount) {
      val childIdx = layout.childIndices[gridChildStart + i]
      nv.pointTo(childIdx)
      val name = childNames.getOrElse(i) { "child$i" }
      Log.d("GridOverflowTest", "$name: x=${nv.x} w=${nv.width} h=${nv.height}")
    }

    // The grid width should match body width (grid stretches to fill block parent)
    val fixedCol = toPx(100f).toInt().toFloat()
    val gap = 8f
    val expectedAutoCol = gridW - fixedCol - gap

    Log.d("GridOverflowTest", "gridW=$gridW fixedCol=$fixedCol gap=$gap expectedAutoCol=$expectedAutoCol")

    // Core overflow assertions — no item should exceed the grid width
    // Find content item width
    val contentIdx = layout.childIndices[gridChildStart + 3]  // content is 4th child
    nv.pointTo(contentIdx)
    val contentW = nv.width
    val contentX = nv.x

    assertTrue(
      "content width $contentW should be <= auto column $expectedAutoCol (not overflowing!)",
      contentW <= expectedAutoCol + 2f
    )

    assertTrue(
      "content right edge ${contentX + contentW} should not exceed grid width $gridW",
      contentX + contentW <= gridW + 2f
    )

    // Header spans 2 columns — should be <= grid width
    val headerIdx = layout.childIndices[gridChildStart + 0]
    nv.pointTo(headerIdx)
    val headerW = nv.width

    assertTrue(
      "header width $headerW should be <= grid width $gridW",
      headerW <= gridW + 2f
    )

    // Footer spans 2 columns — should be <= grid width
    val footerIdx = layout.childIndices[gridChildStart + 4]
    nv.pointTo(footerIdx)
    val footerW = nv.width

    assertTrue(
      "footer width $footerW should be <= grid width $gridW",
      footerW <= gridW + 2f
    )
  }
}
