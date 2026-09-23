package org.nativescript.mason.masonkit

import android.util.Log

/**
 * Lightweight wall-clock profiler for the hot paths (child ops, node creation,
 * layout passes, text measurement). Off by default; enable from JS via
 * `Perf.enabled = true`, then `Perf.dump(label)` / `Perf.reset()` around the
 * region of interest. Counters accumulate until reset.
 */
object Perf {
  @JvmField
  var enabled = false

  // Global count of real (non-skip) native computes; the bench harness
  // polls this from JS to wait for layout quiescence. Volatile: written
  // on the UI thread inside compute, read cross-thread from JS/Nativescript.
  @JvmField
  @Volatile
  var computeCount = 0L
  private val times = HashMap<String, Long>()
  private val counts = HashMap<String, Long>()

  @JvmStatic
  @Synchronized
  fun add(name: String, ns: Long) {
    if (!enabled) return
    times[name] = (times[name] ?: 0L) + ns
    counts[name] = (counts[name] ?: 0L) + 1L
  }

  @JvmStatic
  @Synchronized
  fun hit(name: String) {
    if (!enabled) return
    counts[name] = (counts[name] ?: 0L) + 1L
  }

  @JvmStatic
  @Synchronized
  fun addCount(name: String, n: Long) {
    if (!enabled) return
    counts[name] = (counts[name] ?: 0L) + n
  }

  inline fun <T> timed(name: String, block: () -> T): T {
    if (!enabled) return block()
    val t0 = System.nanoTime()
    try {
      return block()
    } finally {
      add(name, System.nanoTime() - t0)
    }
  }

  @JvmStatic
  @Synchronized
  fun reset() {
    times.clear()
    counts.clear()
    logCounts.clear()
  }

  private val logCounts = HashMap<String, Int>()

  @JvmStatic
  fun logCappedLazy(key: String, limit: Int, msg: () -> String) {
    if (!enabled) return
    val c = synchronized(logCounts) {
      val cur = logCounts[key] ?: 0
      if (cur >= limit) -1 else {
        logCounts[key] = cur + 1
        cur
      }
    }
    if (c >= 0) Log.i("MasonPerf", "$key: ${msg()}")
  }

  @JvmStatic
  @Synchronized
  fun logCapped(key: String, limit: Int, msg: String) {
    if (!enabled) return
    val c = logCounts[key] ?: 0
    if (c < limit) {
      logCounts[key] = c + 1
      Log.i("MasonPerf", "$key: $msg")
    }
  }

  @JvmStatic
  @Synchronized
  fun dump(label: String) {
    if (counts.isEmpty()) {
      Log.i("MasonPerf", "[$label] (no samples)")
      return
    }
    val sb = StringBuilder()
    for (k in (times.keys + counts.keys).toSortedSet()) {
      val c = counts[k] ?: 0L
      val t = times[k]
      sb.append(k).append('=').append(c).append('x')
      if (t != null) {
        sb.append(' ').append("%.2f".format(t / 1e6)).append("ms")
      }
      sb.append("; ")
    }
    Log.i("MasonPerf", "[$label] $sb")
  }
}
