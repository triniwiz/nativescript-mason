package org.nativescript.mason.masonkit

import android.content.Context
import androidx.benchmark.BenchmarkState
import android.view.View as AndroidView
import androidx.benchmark.junit4.BenchmarkRule
import androidx.benchmark.junit4.measureRepeated
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Before
import org.junit.Rule
import org.junit.Assert
import android.util.SizeF
import android.view.View.MeasureSpec
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.Position

/**
 * Benchmark tests for the View class to measure performance of core operations.
 *
 * To run these benchmarks:
 * ./gradlew :masonkit:connectedAndroidTest
 *
 * Or run specific benchmark:
 * ./gradlew :masonkit:connectedAndroidTest \
 *   -Pandroid.testInstrumentationRunnerArguments.class=org.nativescript.mason.masonkit.ViewBenchmark
 *
 * Note: ACTIVITY-MISSING, DEBUGGABLE, and EMULATOR errors are suppressed in build.gradle
 */
@RunWith(AndroidJUnit4::class)
class ViewBenchmark {

    @get:Rule
    val benchmarkRule = BenchmarkRule()

    private lateinit var context: Context
    private lateinit var mason: Mason

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        mason = Mason.shared
    }

    // ===== View Creation Benchmarks =====
    // Note: These benchmarks create new views per iteration to measure creation cost.
    // They stress-test the native allocator and may fail if native memory is exhausted.
    // If crashes occur, run these benchmarks individually.

    @Test
    fun benchmark_createSimpleView() {
        benchmarkRule.measureRepeated {
            val view = View(context, mason)
            // Prevent optimization
            require(view.node != null)
        }
    }

    @Test
    fun benchmark_createFlexView() {
        benchmarkRule.measureRepeated {
            val view = View.createFlexView(mason, context)
            require(view.style.display == Display.Flex)
        }
    }

    @Test
    fun benchmark_createGridView() {
        benchmarkRule.measureRepeated {
            val view = View.createGridView(mason, context)
            require(view.style.display == Display.Grid)
        }
    }

    @Test
    fun benchmark_createBlockView() {
        benchmarkRule.measureRepeated {
            val view = View.createBlockView(mason, context)
            require(view.style.display == Display.Block)
        }
    }

    // ===== Layout Computation Benchmarks =====

    @Test
    fun benchmark_layoutSimpleView() {
        val view = View(context, mason)
        view.setSize(100f, 100f)

        benchmarkRule.measureRepeated {
            view.compute(-1f, -1f)
            val layout = view.layout()
            require(layout.width > 0)
        }
    }

    @Test
    fun benchmark_layoutWithChildren() {
        val parent = View(context, mason)
        parent.setSize(500f, 500f)
        parent.flexDirection = FlexDirection.Column

        // Add 10 children
        repeat(10) {
            val child = View(context, mason)
            child.setSize(50f, 50f)
            parent.addView(child)
        }

        benchmarkRule.measureRepeated {
            parent.compute(-1f, -1f)
            val layout = parent.layout()
            require(layout.width > 0)
        }
    }

    @Test
    fun benchmark_layoutDeeplyNested() {
        var current = View(context, mason)
        current.setSize(500f, 500f)
        val root = current

        // Create 5 levels of nesting
        repeat(5) {
            val child = View(context, mason)
            child.setSize(100f, 100f)
            current.addView(child)
            current = child
        }

        benchmarkRule.measureRepeated {
            root.compute(-1f, -1f)
            val layout = root.layout()
            require(layout.width > 0)
        }
    }

    @Test
    fun benchmark_layoutComplexFlexbox() {
        val parent = View.createFlexView(mason, context)
        parent.setSize(500f, 500f)
        parent.flexDirection = FlexDirection.Row

        // Add children with different flex properties
        repeat(20) { index ->
            val child = View(context, mason)
            child.flexGrow = (index % 3 + 1).toFloat()
            child.flexShrink = 1f
            parent.addView(child)
        }

        benchmarkRule.measureRepeated {
            parent.compute(-1f, -1f)
            val layout = parent.layout()
            require(layout.width > 0)
        }
    }

    @Test
    fun benchmark_layoutGrid() {
        val grid = View.createGridView(mason, context)
        grid.setSize(500f, 500f)
        grid.gridTemplateColumns = "repeat(3, 1fr)"
        grid.gridTemplateRows = "repeat(3, 1fr)"

        // Add 9 grid items
        repeat(9) {
            val item = View(context, mason)
            grid.addView(item)
        }

        benchmarkRule.measureRepeated {
            grid.compute(-1F,-1F)
            val layout = grid.layout()
            require(layout.width > 0)
        }
    }

    // ===== Measure Benchmarks =====

    @Test
    fun benchmark_measureView() {
        val view = View(context, mason)
        val widthSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)
        val heightSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)

        benchmarkRule.measureRepeated {
            view.measure(widthSpec, heightSpec)
        }
    }

    @Test
    fun benchmark_measureWithChildren() {
        val parent = View(context, mason)

        repeat(10) {
            val child = View(context, mason)
            child.setSize(50f, 50f)
            parent.addView(child)
        }

        val widthSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)
        val heightSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)

        benchmarkRule.measureRepeated {
            parent.measure(widthSpec, heightSpec)
        }
    }

    // ===== Style Update Benchmarks =====

    @Test
    fun benchmark_updateSingleStyleProperty() {
        val view = View(context, mason)

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                view.style.inBatch = true
            }
            view.flexGrow = 1.5f
            runWithTimingDisabled {
                view.style.inBatch = false
            }
        }
    }

    @Test
    fun benchmark_updateMultipleStyleProperties() {
        val view = View(context, mason)

        benchmarkRule.measureRepeated {
            view.style.inBatch = true
            view.flexGrow = 1.5f
            view.flexShrink = 0.5f
            view.flexDirection = FlexDirection.Row
            view.setSize(200f, 200f)
            view.setPadding(10f, 10f, 10f, 10f)
            view.setMargin(5f, 5f, 5f, 5f)
            view.style.inBatch = false
            view.updateNodeAndStyle()
        }
    }

    @Test
    fun benchmark_updatePadding() {
        val view = View(context, mason)

        benchmarkRule.measureRepeated {
            view.setPadding(10f, 15f, 20f, 25f)
        }
    }

    @Test
    fun benchmark_updateMargin() {
        val view = View(context, mason)

        benchmarkRule.measureRepeated {
            view.setMargin(5f, 10f, 15f, 20f)
        }
    }

    @Test
    fun benchmark_updateSize() {
        val view = View(context, mason)

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                view.style.inBatch = true
            }
            view.setSize(200f, 300f)
            runWithTimingDisabled {
                view.style.inBatch = false
                view.updateNodeAndStyle()
            }
        }
    }

    @Test
    fun benchmark_updateDisplay() {
        val view = View(context, mason)

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                view.style.inBatch = true
            }
            view.display = Display.Flex
            runWithTimingDisabled {
                view.style.inBatch = false
                view.updateNodeAndStyle()
            }
        }
    }

    @Test
    fun benchmark_updatePosition() {
        val view = View(context, mason)

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                view.style.inBatch = true
            }
            view.position = Position.Absolute
            runWithTimingDisabled {
                view.style.inBatch = false
                view.updateNodeAndStyle()
            }
        }
    }

    // ===== Child Operations Benchmarks =====
    // Note: These benchmarks pre-allocate views to avoid native memory exhaustion
    // during repeated iterations

    @Test
    fun benchmark_addSingleChild() {
        // Pre-allocate parent and child to reuse
        val parent = View(context, mason)
        val child = View(context, mason)

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                // Reset state
                if (child.parent != null) {
                    parent.removeView(child)
                }
            }
            parent.addView(child)
        }
    }

    @Test
    fun benchmark_addMultipleChildren() {
        val parent = View(context, mason)
        // Pre-allocate children pool
        val children = List(10) { View(context, mason) }

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                parent.removeAllViews()
            }
            children.forEach { child ->
                parent.addView(child)
            }
        }
    }

    @Test
    fun benchmark_removeChild() {
        val parent = View(context, mason)
        // Pre-allocate children pool
        val children = List(10) { View(context, mason) }
        // Add all children initially
        children.forEach { parent.addView(it) }

        var index = 0
        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                // Re-add the child we're about to remove if needed
                val childToAdd = children[index % children.size]
                if (childToAdd.parent == null) {
                    parent.addView(childToAdd)
                }
            }
            parent.removeViewAt(0)
            index++
        }
    }

    @Test
    fun benchmark_removeAllChildren() {
        val parent = View(context, mason)
        // Pre-allocate children pool
        val children = List(10) { View(context, mason) }

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                // Re-add all children if removed
                if (parent.childCount == 0) {
                    children.forEach { parent.addView(it) }
                }
            }
            parent.removeAllViews()
        }
    }

    @Test
    fun benchmark_addChildAtIndex() {
        val parent = View(context, mason)
        // Pre-allocate children
        val baseChildren = List(10) { View(context, mason) }
        baseChildren.forEach { parent.addView(it) }
        // Single child to insert/remove
        val childToInsert = View(context, mason)

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                if (childToInsert.parent != null) {
                    parent.removeView(childToInsert)
                }
            }
            parent.addView(childToInsert, 5)
        }
    }

    // ===== Z-Index / Sorting Benchmarks =====

    @Test
    fun benchmark_zIndexSorting() {
        val parent = View(context, mason)

        // Pre-allocate children with varying z-indices
        repeat(20) { index ->
            val child = View(context, mason)
            child.style.zIndex = (index % 5)
            parent.addView(child)
        }

        benchmarkRule.measureRepeated {
            // Just trigger invalidation which causes z-index sorting
            parent.invalidate()
        }
    }

    // ===== Complex Scenarios =====
    // Note: Pre-allocate views to avoid native memory exhaustion

    @Test
    fun benchmark_createComplexHierarchy() {
        // Pre-allocate the entire hierarchy
        val root = View.createFlexView(mason, context)
        root.setSize(500f, 500f)

        val level1Views = List(3) {
            View.createFlexView(mason, context).also { it.flexDirection = FlexDirection.Column }
        }
        val level2Views = List(9) {
            View(context, mason).also {
                it.setSize(50f, 50f)
                it.setMargin(5f, 5f, 5f, 5f)
            }
        }

        benchmarkRule.measureRepeated {
            runWithTimingDisabled {
                // Reset hierarchy
                root.removeAllViews()
                level1Views.forEach { it.removeAllViews() }
            }

            // Build hierarchy (this is what we're benchmarking)
            level1Views.forEachIndexed { i, level1 ->
                repeat(3) { j ->
                    level1.addView(level2Views[i * 3 + j])
                }
                root.addView(level1)
            }

            require(root.childCount == 3)
        }
    }

    @Test
    fun benchmark_fullLayoutCycle() {
        val parent = View.createFlexView(mason, context)
        parent.setSize(500f, 500f)

        repeat(10) {
            val child = View(context, mason)
            child.flexGrow = 1f
            child.setSize(0f, 50f)
            parent.addView(child)
        }

        val widthSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)
        val heightSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)

        benchmarkRule.measureRepeated {
            parent.measure(widthSpec, heightSpec)
            parent.layout(0, 0, parent.measuredWidth, parent.measuredHeight)
        }
    }

    @Test
    fun benchmark_styleSerializationToString() {
        val view = View(context, mason)
        view.setSize(200f, 300f)
        view.setPadding(10f, 15f, 20f, 25f)
        view.flexGrow = 1.5f

        benchmarkRule.measureRepeated {
            val json = view.getStyleAsString()
            require(json != null)
        }
    }

    // ===== Flat Layout Tree Benchmarks =====

    @Test
    fun benchmark_layoutFlat_simpleView() {
        val view = View(context, mason)
        view.setSize(100f, 100f)
        view.compute(-1f, -1f)

        benchmarkRule.measureRepeated {
            val tree = view.layoutFlat()
            require(tree.nodeCount > 0)
        }
    }

    @Test
    fun benchmark_layoutFlat_withChildren() {
        val parent = View(context, mason)
        parent.setSize(500f, 500f)
        parent.flexDirection = FlexDirection.Column

        repeat(10) {
            val child = View(context, mason)
            child.setSize(50f, 50f)
            parent.addView(child)
        }
        parent.compute(-1f, -1f)

        benchmarkRule.measureRepeated {
            val tree = parent.layoutFlat()
            require(tree.nodeCount == 11) // parent + 10 children
        }
    }

    @Test
    fun benchmark_layoutFlat_vs_legacy_withChildren() {
        val parent = View(context, mason)
        parent.setSize(500f, 500f)
        parent.flexDirection = FlexDirection.Column

        repeat(10) {
            val child = View(context, mason)
            child.setSize(50f, 50f)
            parent.addView(child)
        }
        parent.compute(-1f, -1f)

        // Benchmark legacy layout() for comparison
        benchmarkRule.measureRepeated {
            val layout = parent.layout()
            require(layout.width > 0)
        }
    }

    @Test
    fun benchmark_applyLayoutFlat_withChildren() {
        val parent = View(context, mason)
        parent.setSize(500f, 500f)
        parent.flexDirection = FlexDirection.Column

        repeat(10) {
            val child = View(context, mason)
            child.setSize(50f, 50f)
            parent.addView(child)
        }

        parent.compute(-1f, -1f)
        val tree = parent.layoutFlat()

        benchmarkRule.measureRepeated {
            parent.applyLayoutFlat(parent.node, tree)
        }
    }

    @Test
    fun rootMeasure_exactlyZero_heightGrows() {
        val parent = View(context, mason)
        val child = TextView(context, mason)
        child.text = "hello"
        parent.addView(child)

        // simulate the problematic case where Android sends EXACTLY 0 for the
        // height spec (e.g. first layout pass for a root).  previously this
        // forced a zero result; after the fix we should grow to the content.
        parent.measure(
            MeasureSpec.makeMeasureSpec(100, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(0, MeasureSpec.EXACTLY)
        )

        Assert.assertTrue(
            "parent measured height should be >0 but was ${parent.measuredHeight}",
            parent.measuredHeight > 0
        )
    }

    @Test
    fun invalidationMinValue_treatedAsMaxContent() {
        val parent = View(context, mason)
        val child = TextView(context, mason)
        child.text = "hello"
        parent.addView(child)

        // mark cache dirty and leave width/height at Float.MIN_VALUE
        parent.node.computeCache = SizeF(Float.MIN_VALUE, Float.MIN_VALUE)
        parent.node.computeCacheDirty = true

        // call invalidateLayout which should schedule compute and eventually
        // grow the root to child's size
        parent.invalidateLayout()

        // force immediate run (since test not running looper)
        parent.compute(-2f, -2f) // mimic posted runnable

        Assert.assertTrue(
            "after invalidation parent height should be >0 but was ${parent.node.computedHeight}",
            parent.node.computedHeight > 0
        )
    }

    @Test
    fun invalidationMaxContent_updatesToViewSize() {
        val parent = View(context, mason)
        val child = TextView(context, mason)
        child.text = "hello"
        parent.addView(child)

        // pretend we previously computed with max-content and cached -2
        parent.node.computeCache = SizeF(-2f, -2f)
        parent.node.computeCacheDirty = true

        // simulate the Android framework assigning a real size to the view
        parent.layout(0, 0, 123, 456)

        // invalidateLayout should notice the -2 sentinel and swap in the
        // view's dimensions before scheduling any compute work.
        parent.invalidateLayout()

        Assert.assertEquals(
            "computeCache should be updated to view width",
            123f,
            parent.node.computeCache.width
        )
        Assert.assertEquals(
            "computeCache should be updated to view height",
            456f,
            parent.node.computeCache.height
        )
    }
    @Test
    fun benchmark_fullLayoutCycleFlat() {
        val parent = View.createFlexView(mason, context)
        parent.setSize(500f, 500f)

        repeat(10) {
            val child = View(context, mason)
            child.flexGrow = 1f
            child.setSize(0f, 50f)
            parent.addView(child)
        }

        val widthSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)
        val heightSpec = AndroidView.MeasureSpec.makeMeasureSpec(500, AndroidView.MeasureSpec.EXACTLY)

        benchmarkRule.measureRepeated {
            parent.measure(widthSpec, heightSpec)
            parent.layout(0, 0, parent.measuredWidth, parent.measuredHeight)
        }
    }

    @Test
    fun benchmark_layoutFlat_deeplyNested() {
        var current = View(context, mason)
        current.setSize(500f, 500f)
        val root = current

        repeat(5) {
            val child = View(context, mason)
            child.setSize(100f, 100f)
            current.addView(child)
            current = child
        }
        root.compute(-1f, -1f)

        benchmarkRule.measureRepeated {
            val tree = root.layoutFlat()
            require(tree.nodeCount == 6) // root + 5 levels
        }
    }

    @Test
    fun benchmark_layoutFlat_complexFlexbox() {
        val parent = View.createFlexView(mason, context)
        parent.setSize(500f, 500f)
        parent.flexDirection = FlexDirection.Row

        repeat(20) { index ->
            val child = View(context, mason)
            child.flexGrow = (index % 3 + 1).toFloat()
            child.flexShrink = 1f
            parent.addView(child)
        }
        parent.compute(-1f, -1f)

        benchmarkRule.measureRepeated {
            val tree = parent.layoutFlat()
            require(tree.nodeCount == 21) // parent + 20 children
        }
    }
}
