package org.nativescript.mason.masonkit

import android.content.Context
import android.os.Build
import android.os.Debug
import android.os.SystemClock
import android.os.Trace
import android.util.Log
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.gson.GsonBuilder
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.TextType
import java.io.File
import java.util.Locale

/**
 * Cross-branch Android layout profile used by tools/benchmarks/android-layout-compare.ps1.
 *
 * The fixture deliberately resembles a dense web page: responsive navigation, a grid shelf,
 * and two six-deep comment threads with real TextView measurement. Keep this file free of
 * branch-specific production APIs so the runner can copy the same source into both worktrees.
 */
@RunWith(AndroidJUnit4::class)
class DeepWebLayoutBenchmark {
  @Test
  fun profileDeepWebLayout() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    val args = InstrumentationRegistry.getArguments()
    val context = ApplicationProvider.getApplicationContext<Context>()
    val label = args.getString("benchmarkLabel") ?: "local"
    val warmups = args.positiveInt("warmups", 2)
    val samples = args.positiveInt("samples", 5)
    val iterations = args.positiveInt("iterations", 12).coerceAtLeast(2)
    val phases = mutableListOf<PhaseResult>()

    Debug.startAllocCounting()
    repeat(warmups) {
      val fixture = Fixture(context)
      fixture.installMeasureDiagnostics()
      fixture.root.compute(WIDE, HEIGHT)
      repeat(4) { index -> fixture.root.compute(if (index % 2 == 0) NARROW else WIDE, HEIGHT) }
      fixture.mason.clear()
    }

    repeat(samples) { sample ->
      val (fixture, build) = timed("build_fixture", sample, 1, null) { Fixture(context) }
      phases += build
      fixture.installMeasureDiagnostics()

      phases += timed("cold_compute", sample, 1, fixture.diagnostics) {
        fixture.root.compute(WIDE, HEIGHT)
      }.second

      phases += timed("export_and_apply_layout", sample, 1, fixture.diagnostics) {
        val tree = fixture.root.layoutFlat()
        fixture.root.applyLayoutFlat(fixture.root.node, tree)
        assertTrue("expected a deep layout tree, got ${tree.nodeCount}", tree.nodeCount >= fixture.nodeCount)
      }.second

      phases += timed("constant_width_compute", sample, iterations, fixture.diagnostics) {
        repeat(iterations) {
          // Exercise the native cache rather than Element.compute's Java-side early return.
          fixture.root.node.computeCacheDirty = true
          fixture.root.compute(WIDE, HEIGHT)
        }
      }.second

      phases += timed("alternating_width_compute", sample, iterations, fixture.diagnostics) {
        repeat(iterations) { index ->
          fixture.root.compute(if (index % 2 == 0) NARROW else WIDE, HEIGHT)
        }
      }.second

      val styleResult = timed("style_mutation_relayout", sample, iterations, fixture.diagnostics) {
        repeat(iterations) { index ->
          if (index % 2 == 0) fixture.styleTarget.setSize(3f, 54f) else fixture.styleTarget.setSize(9f, 96f)
          // Descendant size writes currently miss both the native dirty mark and
          // Element.compute's root gate. Force both so this phase isolates cache cost.
          fixture.styleTarget.node.dirty()
          fixture.root.node.computeCacheDirty = true
          fixture.root.compute(WIDE, HEIGHT)
        }
      }.second
      val styleStates = validateGeometryChange("thread rail height") { even ->
        if (even) fixture.styleTarget.setSize(3f, 54f) else fixture.styleTarget.setSize(9f, 96f)
        fixture.styleTarget.node.dirty()
        fixture.root.node.computeCacheDirty = true
        fixture.root.compute(WIDE, HEIGHT)
        fixture.applyComputedLayout()
        fixture.styleTarget.node.computedHeight
      }
      phases += styleResult.copy(layoutStates = styleStates)

      val textResult = timed("text_mutation_relayout", sample, iterations, fixture.diagnostics) {
        repeat(iterations) { index ->
          fixture.textTarget.textContent = if (index % 2 == 0) LONG_TEXT else LONGER_TEXT
          // Text writes have the same descendant invalidation gap as style writes.
          // Force recomputation so this phase measures cache work, not a stale fast path.
          fixture.textTarget.node.dirty()
          fixture.root.node.computeCacheDirty = true
          fixture.root.compute(WIDE, HEIGHT)
        }
      }.second
      val textStates = validateGeometryChange("text intrinsic height") { even ->
        fixture.textTarget.textContent = if (even) LONG_TEXT else LONGER_TEXT
        MeasureOutput.getHeight(
          fixture.textTarget.node.measureFunc.measure(-3f, -3f, TEXT_ORACLE_WIDTH, HEIGHT),
        )
      }
      phases += textResult.copy(layoutStates = textStates)

      assertTrue("layout width should be positive", fixture.root.node.computedWidth > 0f)
      fixture.mason.clear()
    }

    val report = BenchmarkReport(
      label = label,
      device = DeviceInfo(),
      warmups = warmups,
      samples = samples,
      iterations = iterations,
      fixture = FixtureInfo(NODE_COUNT, TEXT_COUNT, MAX_DEPTH),
      phases = phases,
    )
    val json = GsonBuilder().setPrettyPrinting().create().toJson(report)
    val reportFile = File(instrumentation.targetContext.filesDir, REPORT_FILE)
    reportFile.writeText(json)
    phases.forEach { Log.i(TAG, it.logLine(label)) }
    Log.i(TAG, "wrote ${reportFile.absolutePath}")
  }

  private inline fun <T> timed(
    name: String,
    sample: Int,
    operations: Int,
    diagnostics: MeasureDiagnostics?,
    block: () -> T,
  ): Pair<T, PhaseResult> {
    diagnostics?.reset()
    val memoryBefore = memorySnapshot()
    Debug.resetThreadAllocCount()
    val allocationsBefore = Debug.getThreadAllocCount().toLong()
    Trace.beginSection("mason-bench:$name")
    val started = SystemClock.elapsedRealtimeNanos()
    val value: T
    try {
      value = block()
    } finally {
      Trace.endSection()
    }
    val elapsed = SystemClock.elapsedRealtimeNanos() - started
    val allocations = (Debug.getThreadAllocCount().toLong() - allocationsBefore).coerceAtLeast(0)
    val memoryAfter = memorySnapshot()
    return value to PhaseResult(
      name = name,
      sample = sample,
      operations = operations,
      elapsedNs = elapsed,
      managedAllocations = allocations,
      measure = diagnostics?.snapshot() ?: MeasureSnapshot(),
      memory = MemoryResult(memoryBefore, memoryAfter),
    )
  }

  private fun memorySnapshot(): MemorySnapshot {
    val runtime = Runtime.getRuntime()
    val info = Debug.MemoryInfo()
    Debug.getMemoryInfo(info)
    return MemorySnapshot(
      javaHeapBytes = runtime.totalMemory() - runtime.freeMemory(),
      nativeHeapBytes = Debug.getNativeHeapAllocatedSize(),
      totalPssKb = info.totalPss.toLong(),
      dalvikPssKb = info.dalvikPss.toLong(),
      nativePssKb = info.nativePss.toLong(),
      otherPssKb = info.otherPss.toLong(),
    )
  }

  private fun validateGeometryChange(name: String, updateAndRead: (Boolean) -> Float): LayoutStates {
    val evenValue = updateAndRead(true)
    val oddValue = updateAndRead(false)
    val evenAgain = updateAndRead(true)
    val oddAgain = updateAndRead(false)
    assertTrue("$name even state was unstable: $evenValue vs $evenAgain", kotlin.math.abs(evenValue - evenAgain) < 0.01f)
    assertTrue("$name odd state was unstable: $oddValue vs $oddAgain", kotlin.math.abs(oddValue - oddAgain) < 0.01f)
    assertTrue("$name did not change computed geometry: $evenValue vs $oddValue", kotlin.math.abs(evenValue - oddValue) >= 0.5f)
    return LayoutStates(evenValue, oddValue)
  }

  private class Fixture(context: Context) {
    val mason = Mason()
    val root: View
    val textTarget: TextView
    val styleTarget: View
    val nodeCount: Int
    val diagnostics: MeasureDiagnostics
    private val measuredText = mutableListOf<Pair<String, TextView>>()
    private val wrappers = mutableListOf<MeasureFunc>()
    private var nodes = 0

    init {
      root = flex(context, FlexDirection.Column).apply {
        setPadding(24f, 20f, 24f, 28f)
        setGap(18f, 18f)
      }

      val header = flex(context, FlexDirection.Row).apply {
        alignItems = AlignItems.Center
        justifyContent = JustifyContent.SpaceBetween
        setPadding(18f, 12f, 18f, 12f)
      }
      header.addView(text(context, "header/title", "Mason performance forum", TextType.H2, 22f))
      header.addView(text(context, "header/status", "128 engineers online", TextType.Span, 13f))
      root.addView(header)

      val page = flex(context, FlexDirection.Row).apply {
        alignItems = AlignItems.Start
        setGap(22f, 22f)
        flexGrow = 1f
        flexShrink = 1f
      }
      root.addView(page)

      val sidebar = flex(context, FlexDirection.Column).apply {
        setSize(210f, 760f)
        setPadding(14f, 16f, 14f, 16f)
        setGap(9f, 9f)
      }
      sidebar.addView(text(context, "sidebar/heading", "Navigation", TextType.H4, 17f))
      repeat(12) { index ->
        sidebar.addView(text(context, "sidebar/item-$index", "Topic ${index + 1}: layout systems", TextType.A, 13f))
      }
      page.addView(sidebar)

      val main = flex(context, FlexDirection.Column).apply {
        flexGrow = 1f
        flexShrink = 1f
        setMinSizeWidth(0f, Dimension.Kind.Points.value)
        setGap(20f, 20f)
      }
      page.addView(main)

      val shelf = View.createGridView(mason, context).also {
        nodes++
        it.gridTemplateColumns = "repeat(3, 1fr)"
        it.gridTemplateRows = "repeat(2, auto)"
        it.setGap(12f, 12f)
        it.setPadding(12f, 12f, 12f, 12f)
      }
      repeat(6) { index ->
        val card = flex(context, FlexDirection.Column).apply {
          setPadding(10f, 9f, 10f, 9f)
          setGap(5f, 5f)
        }
        card.addView(text(context, "card-$index/title", "Performance case ${index + 1}", TextType.Strong, 14f))
        card.addView(text(context, "card-$index/body", CARD_TEXT, TextType.P, 12f))
        shelf.addView(card)
      }
      main.addView(shelf)

      val article = flex(context, FlexDirection.Column).apply {
        flexShrink = 0f
        setPadding(12f, 10f, 12f, 10f)
      }
      val articleBody = text(context, "article/body", LONG_TEXT, TextType.P, 14f)
      article.addView(articleBody)
      main.addView(article)
      textTarget = articleBody

      val comments = flex(context, FlexDirection.Column).apply {
        setGap(14f, 14f)
      }
      main.addView(comments)

      var selectedStyle: View? = null
      repeat(2) { thread ->
        var parent = comments
        repeat(6) { depth ->
          val comment = flex(context, FlexDirection.Row).apply {
            setGap(10f, 10f)
            setPadding(8f + depth, 7f, 8f, 7f)
            setMargin(if (depth == 0) 0f else 10f, 0f, 0f, 0f)
          }
          val rail = box(context, 3f, 54f)
          val content = flex(context, FlexDirection.Column).apply {
            flexGrow = 1f
            flexShrink = 1f
            setMinSizeWidth(0f, Dimension.Kind.Points.value)
            setGap(5f, 5f)
          }
          val meta = flex(context, FlexDirection.Row).apply {
            alignItems = AlignItems.Baseline
            setGap(8f, 8f)
          }
          meta.addView(text(context, "thread-$thread/depth-$depth/author", "user_${thread}_$depth", TextType.Strong, 13f))
          meta.addView(text(context, "thread-$thread/depth-$depth/time", "${depth + 1}h ago", TextType.Span, 11f))
          val body = text(context, "thread-$thread/depth-$depth/body", LONG_TEXT, TextType.P, 14f)
          val actions = flex(context, FlexDirection.Row).apply {
            flexWrap = FlexWrap.Wrap
            setGap(7f, 7f)
          }
          actions.addView(text(context, "thread-$thread/depth-$depth/reply", "reply", TextType.A, 11f))
          actions.addView(text(context, "thread-$thread/depth-$depth/score", "${42 + depth} points", TextType.Span, 11f))
          content.addView(meta)
          content.addView(body)
          content.addView(actions)
          comment.addView(rail)
          comment.addView(content)
          parent.addView(comment)
          parent = content
          if (thread == 1 && depth == 4) {
            selectedStyle = rail
          }
        }
      }
      styleTarget = checkNotNull(selectedStyle)
      nodeCount = nodes
      diagnostics = MeasureDiagnostics(measuredText.map { ProbeStats(it.first) })
      check(nodeCount == NODE_COUNT) { "fixture node count changed: $nodeCount (update NODE_COUNT)" }
      check(measuredText.size == TEXT_COUNT) { "fixture text count changed: ${measuredText.size} (update TEXT_COUNT)" }
    }

    fun installMeasureDiagnostics() {
      measuredText.zip(diagnostics.probes).forEach { (entry, stats) ->
        val original = entry.second.node.measureFunc
        val wrapper = object : MeasureFunc {
          override fun measure(
            knownWidth: Float,
            knownHeight: Float,
            availableWidth: Float,
            availableHeight: Float,
          ): Long {
            val started = SystemClock.elapsedRealtimeNanos()
            try {
              return original.measure(knownWidth, knownHeight, availableWidth, availableHeight)
            } finally {
              stats.record(
                SystemClock.elapsedRealtimeNanos() - started,
                knownWidth,
                knownHeight,
                availableWidth,
                availableHeight,
              )
            }
          }
        }
        wrappers += wrapper
        entry.second.node.setMeasureFunction(wrapper)
      }
    }

    fun applyComputedLayout() {
      // compute() marks the root cache clean before layoutFlat(), whose fast path
      // would otherwise return the previously exported Java tree.
      root.node.computeCacheDirty = true
      val tree = root.layoutFlat()
      root.applyLayoutFlat(root.node, tree)
    }

    private fun flex(context: Context, direction: FlexDirection): View {
      val view = View.createFlexView(mason, context)
      nodes++
      view.flexDirection = direction
      return view
    }

    private fun box(context: Context, width: Float, height: Float): View {
      val view = View(context, mason)
      nodes++
      view.setSize(width, height)
      view.flexShrink = 0f
      return view
    }

    private fun text(context: Context, name: String, value: String, type: TextType, size: Float): TextView {
      val view = TextView(context, mason, type)
      nodes++
      view.textContent = value
      view.setTextSize(size)
      measuredText += name to view
      return view
    }
  }

  private class MeasureDiagnostics(val probes: List<ProbeStats>) {
    fun reset() = probes.forEach(ProbeStats::reset)

    fun snapshot(): MeasureSnapshot {
      val active = probes.filter { it.calls > 0 }
      return MeasureSnapshot(
        calls = active.sumOf { it.calls },
        elapsedNs = active.sumOf { it.elapsedNs },
        knownBoth = active.sumOf { it.knownBoth },
        knownWidthOnly = active.sumOf { it.knownWidthOnly },
        noKnownDimensions = active.sumOf { it.noKnownDimensions },
        definiteWidth = active.sumOf { it.definiteWidth },
        maxContentWidth = active.sumOf { it.maxContentWidth },
        minContentWidth = active.sumOf { it.minContentWidth },
        hottest = active.sortedByDescending { it.elapsedNs }.take(8).map {
          Hotspot(
            it.name,
            it.calls,
            it.elapsedNs,
            it.lastKnownWidth,
            it.lastKnownHeight,
            it.lastAvailableWidth,
            it.lastAvailableHeight,
          )
        },
      )
    }
  }

  private class ProbeStats(val name: String) {
    var calls = 0L
    var elapsedNs = 0L
    var knownBoth = 0L
    var knownWidthOnly = 0L
    var noKnownDimensions = 0L
    var definiteWidth = 0L
    var maxContentWidth = 0L
    var minContentWidth = 0L
    var lastKnownWidth = 0f
    var lastKnownHeight = 0f
    var lastAvailableWidth = 0f
    var lastAvailableHeight = 0f

    fun reset() {
      calls = 0
      elapsedNs = 0
      knownBoth = 0
      knownWidthOnly = 0
      noKnownDimensions = 0
      definiteWidth = 0
      maxContentWidth = 0
      minContentWidth = 0
      lastKnownWidth = 0f
      lastKnownHeight = 0f
      lastAvailableWidth = 0f
      lastAvailableHeight = 0f
    }

    fun record(ns: Long, knownWidth: Float, knownHeight: Float, availableWidth: Float, availableHeight: Float) {
      calls++
      elapsedNs += ns
      lastKnownWidth = knownWidth
      lastKnownHeight = knownHeight
      lastAvailableWidth = availableWidth
      lastAvailableHeight = availableHeight
      when {
        knownWidth >= 0f && knownHeight >= 0f -> knownBoth++
        knownWidth >= 0f -> knownWidthOnly++
        else -> noKnownDimensions++
      }
      when (availableWidth) {
        -2f -> maxContentWidth++
        -1f -> minContentWidth++
        else -> if (availableWidth >= 0f) definiteWidth++
      }
    }
  }

  private data class BenchmarkReport(
    val schemaVersion: Int = 1,
    val benchmark: String = "deep-web-layout-android",
    val label: String,
    val device: DeviceInfo,
    val warmups: Int,
    val samples: Int,
    val iterations: Int,
    val fixture: FixtureInfo,
    val phases: List<PhaseResult>,
  )

  private data class DeviceInfo(
    val manufacturer: String = Build.MANUFACTURER,
    val model: String = Build.MODEL,
    val api: Int = Build.VERSION.SDK_INT,
    val abis: List<String> = Build.SUPPORTED_ABIS.toList(),
    val fingerprint: String = Build.FINGERPRINT,
  )

  private data class FixtureInfo(val nodes: Int, val measuredTextNodes: Int, val maxDepth: Int)

  private data class PhaseResult(
    val name: String,
    val sample: Int,
    val operations: Int,
    val elapsedNs: Long,
    val managedAllocations: Long,
    val measure: MeasureSnapshot,
    val memory: MemoryResult,
    val layoutStates: LayoutStates? = null,
  ) {
    fun logLine(label: String): String = String.format(
      Locale.US,
      "label=%s phase=%s sample=%d ops=%d total_ms=%.3f measure_ms=%.3f other_ms=%.3f calls=%d allocs=%d pss_mb=%.2f pss_delta_kb=%d java_mb=%.2f java_delta_kb=%d native_mb=%.2f native_delta_kb=%d states=%s hottest=%s",
      label,
      name,
      sample,
      operations,
      elapsedNs / 1_000_000.0,
      measure.elapsedNs / 1_000_000.0,
      (elapsedNs - measure.elapsedNs).coerceAtLeast(0) / 1_000_000.0,
      measure.calls,
      managedAllocations,
      memory.after.totalPssKb / 1024.0,
      memory.totalPssDeltaKb,
      memory.after.javaHeapBytes / 1_048_576.0,
      memory.javaHeapDeltaBytes / 1024,
      memory.after.nativeHeapBytes / 1_048_576.0,
      memory.nativeHeapDeltaBytes / 1024,
      layoutStates?.let { "${it.evenValue}/${it.oddValue}" } ?: "-",
      measure.hottest.take(3).joinToString { "${it.name}:${it.calls}" },
    )
  }

  private data class LayoutStates(val evenValue: Float, val oddValue: Float)

  private data class MemoryResult(val before: MemorySnapshot, val after: MemorySnapshot) {
    val javaHeapDeltaBytes = after.javaHeapBytes - before.javaHeapBytes
    val nativeHeapDeltaBytes = after.nativeHeapBytes - before.nativeHeapBytes
    val totalPssDeltaKb = after.totalPssKb - before.totalPssKb
  }

  private data class MemorySnapshot(
    val javaHeapBytes: Long,
    val nativeHeapBytes: Long,
    val totalPssKb: Long,
    val dalvikPssKb: Long,
    val nativePssKb: Long,
    val otherPssKb: Long,
  )

  private data class MeasureSnapshot(
    val calls: Long = 0,
    val elapsedNs: Long = 0,
    val knownBoth: Long = 0,
    val knownWidthOnly: Long = 0,
    val noKnownDimensions: Long = 0,
    val definiteWidth: Long = 0,
    val maxContentWidth: Long = 0,
    val minContentWidth: Long = 0,
    val hottest: List<Hotspot> = emptyList(),
  )

  private data class Hotspot(
    val name: String,
    val calls: Long,
    val elapsedNs: Long,
    val lastKnownWidth: Float,
    val lastKnownHeight: Float,
    val lastAvailableWidth: Float,
    val lastAvailableHeight: Float,
  )

  private fun android.os.Bundle.positiveInt(name: String, fallback: Int): Int =
    getString(name)?.toIntOrNull()?.takeIf { it > 0 } ?: fallback

  companion object {
    const val TAG = "MasonDeepLayoutBench"
    const val REPORT_FILE = "mason-deep-layout-benchmark.json"
    const val WIDE = 1080f
    const val NARROW = 840f
    const val HEIGHT = 1920f
    const val TEXT_ORACLE_WIDTH = 600f
    const val NODE_COUNT = 162
    const val TEXT_COUNT = 88
    const val MAX_DEPTH = 18
    const val CARD_TEXT = "Grid and flex sizing share the same responsive content constraints."
    const val LONG_TEXT =
      "A deeply nested reply should wrap naturally while its metadata, actions, padding, and flexible ancestors all participate in intrinsic sizing."
    const val LONGER_TEXT =
      "A deeply nested reply should wrap naturally while its metadata, actions, padding, and flexible ancestors all participate in intrinsic sizing. The longer state adds enough realistic prose to force several additional wrapped lines while keeping the viewport constant. It includes navigation context, responsive grid notes, nested discussion details, and a final sentence long enough that the auto-height article cannot remain at its shorter geometry."
  }
}
