package org.nativescript.mason.masonkit

import android.os.SystemClock

internal object HardwareShadowStats {
  data class Snapshot(val nodes: Long, val builds: Long, val buildNanos: Long)

  private var nodes = 0L
  private var builds = 0L
  private var buildNanos = 0L

  @Synchronized
  fun recordBuild(nodeCount: Int, startedNanos: Long) {
    nodes += nodeCount
    builds++
    buildNanos += SystemClock.elapsedRealtimeNanos() - startedNanos
  }

  @Synchronized
  fun snapshot() = Snapshot(nodes, builds, buildNanos)

  @Synchronized
  fun reset() {
    nodes = 0
    builds = 0
    buildNanos = 0
  }
}
