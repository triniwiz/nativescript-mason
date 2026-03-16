package org.nativescript.mason.masonkit

import org.junit.Assert.*
import org.junit.Test

class FontDescriptorsTests {

  @Test
  fun test_copy_independence() {
    val shared = FontFaceSet.instance.getOrNull("sans-serif") ?: FontFace("sans-serif")
    val sharedDescriptors = shared.fontDescriptors

    // create an explicit copy
    val copy = FontFace.NSCFontDescriptors(sharedDescriptors.family)
    copy.weight = sharedDescriptors.weight
    copy.ascentOverride = sharedDescriptors.ascentOverride
    copy.descentOverride = sharedDescriptors.descentOverride
    copy.display = sharedDescriptors.display
    copy.style = sharedDescriptors.style
    copy.stretch = sharedDescriptors.stretch
    copy.unicodeRange = sharedDescriptors.unicodeRange
    copy.featureSettings = sharedDescriptors.featureSettings
    copy.lineGapOverride = sharedDescriptors.lineGapOverride
    copy.variationSettings = sharedDescriptors.variationSettings
    copy.kerning = sharedDescriptors.kerning
    copy.variantLigatures = sharedDescriptors.variantLigatures

    // mutate copy and ensure shared is unchanged
    val beforeFeature = sharedDescriptors.featureSettings
    copy.featureSettings = "TEST_FEATURE"

    assertEquals(beforeFeature, sharedDescriptors.featureSettings)
    assertNotEquals(copy.featureSettings, sharedDescriptors.featureSettings)
  }

  @Test
  fun descriptor_copy_performance() {
    val shared = FontFace.NSCFontDescriptors("sans-serif")
    val start = System.nanoTime()
    for (i in 0 until 10000) {
      val c = FontFace.NSCFontDescriptors(shared.family)
      c.weight = shared.weight
      c.featureSettings = shared.featureSettings
    }
    val end = System.nanoTime()
    val total = end - start
    println("descriptorCopyBenchmark: iterations=10000 timeNs=$total avgNs=${total / 10000}")
  }

  @Test
  fun fontFace_creation_performance() {
    val start = System.nanoTime()
    for (i in 0 until 1000) {
      val f = FontFace("sans-serif")
    }
    val end = System.nanoTime()
    val total = end - start
    println("fontFaceCreationBenchmark: iterations=1000 timeNs=$total avgNs=${total / 1000}")
  }
}
