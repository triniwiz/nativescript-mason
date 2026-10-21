package org.nativescript.mason.masonkit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.tan

/** CSS `transform` parsing, composition in device px, and the view-property decomposition. */
class TransformTest {

  private val ctx = LengthContext(scale = 3f, emBasis = 20f, rootFontSize = 16f, viewportWidth = 400f, viewportHeight = 800f)

  private fun affine(value: String, w: Float = 300f, h: Float = 150f): Affine =
    projectAffine(parseTransformList(value)!!, w, h, ctx)

  private fun assertAffine(expected: Affine, actual: Affine) {
    assertEquals("a", expected.a, actual.a, 1e-4f)
    assertEquals("b", expected.b, actual.b, 1e-4f)
    assertEquals("c", expected.c, actual.c, 1e-4f)
    assertEquals("d", expected.d, actual.d, 1e-4f)
    assertEquals("tx", expected.tx, actual.tx, 1e-3f)
    assertEquals("ty", expected.ty, actual.ty, 1e-3f)
  }

  @Test
  fun translateUnitsResolveToDevicePx() {
    assertAffine(Affine(1f, 0f, 0f, 1f, 30f, 60f), affine("translate(10px, 20px)"))
    // A bare number is a CSS px, like every other Mason length.
    assertAffine(Affine(1f, 0f, 0f, 1f, 30f, 0f), affine("translateX(10)"))
    assertAffine(Affine(1f, 0f, 0f, 1f, 2f * 20f * 3f, 16f * 3f), affine("translate(2em, 1rem)"))
    assertAffine(Affine(1f, 0f, 0f, 1f, 40f * 3f, 0f), affine("translateX(10vw)"))
    assertAffine(Affine(1f, 0f, 0f, 1f, 7f, 0f), affine("translateX(7dppx)"))
  }

  @Test
  fun translatePercentagesAreOfTheBorderBox() {
    assertAffine(Affine(1f, 0f, 0f, 1f, -150f, -75f), affine("translate(-50%, -50%)", 300f, 150f))
    assertAffine(Affine(1f, 0f, 0f, 1f, 0f, 15f), affine("translateY(10%)", 300f, 150f))
  }

  @Test
  fun functionsComposeLeftToRight() {
    // translate then rotate: the translation is not rotated.
    val r = Math.toRadians(90.0)
    val c = cos(r).toFloat()
    val s = sin(r).toFloat()
    assertAffine(Affine(c, s, -s, c, 30f, 0f), affine("translateX(10px) rotate(90deg)"))
    // rotate then translate: it is.
    assertAffine(Affine(c, s, -s, c, 0f, 30f), affine("rotate(90deg) translateX(10px)"))
  }

  @Test
  fun skewAndMatrixKeepEveryComponent() {
    val t = tan(Math.toRadians(30.0)).toFloat()
    assertAffine(Affine(1f, 0f, t, 1f, 0f, 0f), affine("skewX(30deg)"))
    assertAffine(Affine(1f, t, 0f, 1f, 0f, 0f), affine("skew(0, 30deg)"))
    // The translation is CSS px.
    assertAffine(Affine(1f, 2f, 3f, 4f, 15f, 18f), affine("matrix(1, 2, 3, 4, 5, 6)"))
  }

  @Test
  fun threeDFunctionsFlattenOrthographically() {
    val r = Math.toRadians(60.0)
    assertAffine(Affine(1f, 0f, 0f, cos(r).toFloat(), 0f, 0f), affine("rotateX(60deg)"))
    assertAffine(Affine(cos(r).toFloat(), 0f, 0f, 1f, 0f, 0f), affine("rotateY(60deg)"))
    assertAffine(Affine.IDENTITY, affine("translateZ(50px) scaleZ(3)"))
    assertAffine(Affine(2f, 0f, 0f, 3f, 12f, 15f), affine("matrix3d(2,0,0,0, 0,3,0,0, 0,0,1,0, 4,5,0,1)"))
  }

  @Test
  fun anglesAndScales() {
    assertAffine(affine("rotate(90deg)"), affine("rotate(0.25turn)"))
    assertAffine(affine("rotate(90deg)"), affine("rotate(100grad)"))
    assertAffine(Affine(0.5f, 0f, 0f, 2f, 0f, 0f), affine("scale(50%, 2)"))
  }

  @Test
  fun invalidValuesAreRejectedWhole() {
    assertNull(parseTransformList("translate(10px) bogus(1)"))
    assertNull(parseTransformList("rotate(10px)"))
    assertNull(parseTransformList("translateZ(10%)"))
    assertNull(parseTransformList("scale(1, 2, 3)"))
    assertNull(parseTransformList("garbage"))
    assertTrue(parseTransformList("none")!!.isEmpty())
    assertTrue(parseTransformList("")!!.isEmpty())
    assertNotNull(parseTransformList("  translate( 1px , 2px )   rotate( 3deg ) "))
  }

  @Test
  fun decompositionRebuildsTheMatrix() {
    for (value in listOf("rotate(30deg) scale(2, 0.5)", "skewX(20deg)", "rotate(45deg) skewY(10deg) scale(-1, 1)", "matrix(1, 2, 3, 4, 5, 6)")) {
      val m = affine(value)
      val v = decompose(m)
      // L = R * diag(sx, sy) * [[1, k], [0, 1]]
      val r = Math.toRadians(v.rotation.toDouble())
      val c = cos(r).toFloat()
      val s = sin(r).toFloat()
      val a = c * v.scaleX
      val b = s * v.scaleX
      val cc = c * v.scaleX * v.shear - s * v.scaleY
      val d = s * v.scaleX * v.shear + c * v.scaleY
      assertAffine(m, Affine(a, b, cc, d, v.translationX, v.translationY))
    }
  }

  @Test
  fun plainTransformsNeedNoShear() {
    assertEquals(0f, decompose(affine("rotate(30deg) scale(2) translate(5px)")).shear, 1e-5f)
  }
}
