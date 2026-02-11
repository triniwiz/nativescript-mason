package org.nativescript.mason.masonkit

import android.app.Activity
import android.os.Bundle

/**
 * Minimal Activity required for AndroidX Benchmark to run.
 * Benchmark tests need a foreground activity to execute properly.
 */
class BenchmarkActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }
}
