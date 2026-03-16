package org.nativescript.mason.masonkit

import org.junit.Test
import kotlin.system.measureNanoTime
import org.junit.Assert.*

class FontPerformanceTest {
  @Test
  fun descriptorCopyBenchmark() {
    val iterations = 100_000
    val family = "perf-family"
    val shared = FontFace.NSCFontDescriptors(family)
    shared.featureSettings = "normal"

    val time = measureNanoTime {
      repeat(iterations) {
        val nd = FontFace.NSCFontDescriptors(shared.family)
        nd.weight = shared.weight
        nd.ascentOverride = shared.ascentOverride
        nd.descentOverride = shared.descentOverride
        nd.display = shared.display
        nd.style = shared.style
        nd.stretch = shared.stretch
        nd.unicodeRange = shared.unicodeRange
        nd.featureSettings = shared.featureSettings
        nd.lineGapOverride = shared.lineGapOverride
        nd.variationSettings = shared.variationSettings
        nd.kerning = shared.kerning
        nd.variantLigatures = shared.variantLigatures
      }
    }

    println("descriptorCopyBenchmark: iterations=$iterations timeNs=$time avgNs=${time / iterations}")
    // Assert the average time per copy is below a generous threshold (100µs)
    assertTrue("avg too slow: ${time / iterations}", (time / iterations) < 100_000L)
  }

  @Test
  fun fontFaceCreationBenchmark() {
    val iterations = 10_000
    val family = "sans-serif"

    val time = measureNanoTime {
      repeat(iterations) {
        val f = FontFace(family)
      }
    }

    println("fontFaceCreationBenchmark: iterations=$iterations timeNs=$time avgNs=${time / iterations}")
    // Assert the average creation cost is below a generous threshold (200µs)
    assertTrue((time / iterations) < 200_000L)
  }
}
