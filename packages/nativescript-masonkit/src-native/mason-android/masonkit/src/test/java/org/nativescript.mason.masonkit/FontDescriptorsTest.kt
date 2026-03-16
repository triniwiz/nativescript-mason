package org.nativescript.mason.masonkit

import org.junit.Assert.*
import org.junit.Test

class FontDescriptorsTest {
  @Test
  fun sharedDescriptorsAreMutableAndCopyIsIndependent() {
    val family = "test-family"
    val shared = FontFace.NSCFontDescriptors(family)
    shared.featureSettings = "normal"
    shared.variationSettings = "normal"

    val fontA = FontFace(family, descriptors = shared)
    val fontB = FontFace(family, descriptors = shared)

    // Mutating through one reference should reflect on the other (shared)
    fontA.fontDescriptors.featureSettings = "liga on"
    assertEquals("liga on", fontB.fontDescriptors.featureSettings)

    // Simulate a copy (what ensureWritableFontFace does)
    val copy = FontFace.NSCFontDescriptors(shared.family)
    copy.weight = shared.weight
    copy.ascentOverride = shared.ascentOverride
    copy.descentOverride = shared.descentOverride
    copy.display = shared.display
    copy.style = shared.style
    copy.stretch = shared.stretch
    copy.unicodeRange = shared.unicodeRange
    copy.featureSettings = shared.featureSettings
    copy.lineGapOverride = shared.lineGapOverride
    copy.variationSettings = shared.variationSettings
    copy.kerning = shared.kerning
    copy.variantLigatures = shared.variantLigatures

    val fontC = FontFace(family, descriptors = copy)

    // Mutating the copy should NOT affect the original shared object
    fontC.fontDescriptors.featureSettings = "kern on"
    assertEquals("liga on", fontA.fontDescriptors.featureSettings)
    assertEquals("kern on", fontC.fontDescriptors.featureSettings)
  }
}
