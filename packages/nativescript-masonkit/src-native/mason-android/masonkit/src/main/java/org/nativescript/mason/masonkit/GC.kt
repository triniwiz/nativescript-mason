package org.nativescript.mason.masonkit

import android.os.Build
import java.lang.ref.Cleaner
import java.lang.ref.PhantomReference
import java.lang.ref.ReferenceQueue
import java.util.Collections
import java.util.concurrent.Executors

internal class GC(val mason: Mason) {
  private val executor by lazy {
    Executors.newSingleThreadExecutor()
  }
  private val queue by lazy {
    ReferenceQueue<Any>()
  }

  @Volatile
  private var isRunning = false

  init {
    if (Build.VERSION.SDK_INT < 33) {
      executor.execute {
        isRunning = true
        while (isRunning) {
          try {
            val ref = queue.remove() as? NativePhantomReference
            ref?.let {
              it.release()
              phantomRefs.remove(it)
            }
            drainImmediate()
          } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
            break
          } catch (_: Exception) {
          }
        }
      }
    }
  }

  internal val cleaner by lazy {
    Cleaner.create()
  }

  private class NativePhantomReference(
    referent: NativeObject,
    val release: () -> Unit,
    queue: ReferenceQueue<Any>
  ) : PhantomReference<NativeObject>(referent, queue)

  private val phantomRefs by lazy {
    Collections.synchronizedSet(mutableSetOf<PhantomReference<*>>())
  }

  fun track(native: NativeObject) {
    if (native.isTracked) {
      return
    }
    native.setTracked(true)

    val nativePtr = native.nativePtr()
    val type = native.objectType
    val objectId = if (native.hasObjectId()) {
      native.objectId()
    } else {
      -1
    }

    if (Build.VERSION.SDK_INT >= 33) {
      cleaner.register(native) {
        when (type) {
          NativeObjectType.Node -> {
            if (nativePtr != 0L) {
              NativeHelpers.nativeNodeDestroy(nativePtr)
              mason.nodes.remove(nativePtr)
              if (objectId != -1) {
                ObjectManager.shared.remove(objectId)
              }
            }
          }

          else -> {}
        }
      }
      return
    }

    phantomRefs.add(
      NativePhantomReference(
        native, {
          when (type) {
            NativeObjectType.Node -> {
              if (nativePtr != 0L) {
                NativeHelpers.nativeNodeDestroy(nativePtr)
                mason.nodes.remove(nativePtr)
                if (objectId != -1) {
                  ObjectManager.shared.remove(objectId)
                }
              }
            }

            else -> {}
          }
        }, queue
      )
    )
  }

  private fun drainImmediate() {
    val poll = queue.poll()
    var ref = poll as? NativePhantomReference
    while (ref != null) {
      ref.release()
      phantomRefs.remove(ref)
      ref = queue.poll() as? NativePhantomReference
    }
  }

  fun drain() {
    if (Build.VERSION.SDK_INT >= 33) {
      return
    }
    drainImmediate()
  }

  fun shutdown() {
    isRunning = false
    executor.shutdown()
  }
}
