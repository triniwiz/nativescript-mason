package org.nativescript.mason.masonkit

/** Lightweight counters used by lifecycle regression tests and benchmarks. */
internal object BoxShadowLifecycleStats {
  data class Snapshot(
    val retainedResources: Int,
    val retainedBytes: Long,
    val releasedResources: Long,
    val releasedBytes: Long,
    val windowDetachReleases: Long,
  )

  private var retainedResources = 0
  private var retainedBytes = 0L
  private var releasedResources = 0L
  private var releasedBytes = 0L
  private var windowDetachReleases = 0L

  @Synchronized
  fun retained(count: Int, bytes: Long) {
    retainedResources += count
    retainedBytes += bytes
  }

  @Synchronized
  fun released(count: Int, bytes: Long, fromWindowDetach: Boolean) {
    retainedResources = (retainedResources - count).coerceAtLeast(0)
    retainedBytes = (retainedBytes - bytes).coerceAtLeast(0L)
    releasedResources += count
    releasedBytes += bytes
    if (fromWindowDetach) windowDetachReleases += count
  }

  @Synchronized
  fun snapshot() = Snapshot(
    retainedResources,
    retainedBytes,
    releasedResources,
    releasedBytes,
    windowDetachReleases,
  )

  @Synchronized
  fun reset() {
    retainedResources = 0
    retainedBytes = 0
    releasedResources = 0
    releasedBytes = 0
    windowDetachReleases = 0
  }
}
