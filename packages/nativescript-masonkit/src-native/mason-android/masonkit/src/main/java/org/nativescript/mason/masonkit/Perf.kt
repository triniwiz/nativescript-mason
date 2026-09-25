package org.nativescript.mason.masonkit

import android.util.Log

object Perf {
  @JvmField
  var enabled = false

  private val times = java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.LongAdder>()
  private val counts = java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.LongAdder>()

  @JvmStatic
  fun now(): Long = if (enabled) System.nanoTime() else 0L

  @JvmStatic
  fun add(name: String, ns: Long) {
    if (!enabled) return
    counts.computeIfAbsent(name) { java.util.concurrent.atomic.LongAdder() }.increment()
    times.computeIfAbsent(name) { java.util.concurrent.atomic.LongAdder() }.add(ns)
  }

  @JvmStatic
  fun hit(name: String) {
    if (!enabled) return
    counts.computeIfAbsent(name) { java.util.concurrent.atomic.LongAdder() }.increment()
  }

  @JvmStatic
  fun addCount(name: String, n: Long) {
    if (!enabled) return
    counts.computeIfAbsent(name) { java.util.concurrent.atomic.LongAdder() }.add(n)
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
  fun reset() {
    times.clear()
    counts.clear()
  }

  @JvmStatic
  fun dump(label: String) {
    if (counts.isEmpty()) {
      Log.i("MasonPerf", "[$label] (no samples)")
      return
    }
    val sb = StringBuilder()
    for (k in (times.keys + counts.keys).toSortedSet()) {
      val c = counts[k]?.sum() ?: 0L
      val t = times[k]?.sum()
      sb.append(k).append('=').append(c).append('x')
      if (t != null) {
        sb.append(' ').append("%.2f".format(t / 1e6)).append("ms")
      }
      sb.append("; ")
    }
    Log.i("MasonPerf", "[$label] $sb")
  }
}
