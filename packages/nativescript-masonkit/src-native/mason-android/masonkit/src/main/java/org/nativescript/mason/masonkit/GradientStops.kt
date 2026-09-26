package org.nativescript.mason.masonkit

/** A stop with two positions ("red 10% 30%") is two stops of the same colour. */
internal fun expandColorStops(stops: List<String>): List<String> = stops.flatMap { stop ->
  val parts = splitTopLevelWhitespace(stop)
  if (parts.size == 3) listOf("${parts[0]} ${parts[1]}", "${parts[0]} ${parts[2]}") else listOf(stop)
}

/**
 * Fills in the positions a gradient leaves out, per CSS Images: the first and
 * last stops default to 0 and 1, a position before an earlier one moves up to
 * it, and a run of stops without positions spreads evenly between its neighbours.
 */
internal fun resolveStopPositions(positions: List<Float?>): FloatArray {
  val n = positions.size
  val resolved = FloatArray(n)
  var anchor = -1
  for (i in 0 until n) {
    val given = positions[i] ?: when (i) {
      0 -> 0f
      n - 1 -> 1f
      else -> continue
    }
    val position = if (anchor >= 0) maxOf(given, resolved[anchor]) else given
    resolved[i] = position
    if (anchor >= 0) {
      val start = resolved[anchor]
      for (k in anchor + 1 until i) {
        resolved[k] = start + (position - start) * (k - anchor) / (i - anchor)
      }
    }
    anchor = i
  }
  return resolved
}
