package org.nativescript.mason.masonkit

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicInteger

class ObjectManager private constructor() {

  private val freeQueue: ConcurrentLinkedQueue<Int> = ConcurrentLinkedQueue()
  private val objects: ConcurrentHashMap<Int, Any> = ConcurrentHashMap()
  private val counter: AtomicInteger = AtomicInteger(0)

  fun add(value: Any): Int {
    val recycled = freeQueue.poll()
    return if (recycled != null) {
      objects[recycled] = value
      recycled
    } else {
      val id = counter.getAndIncrement()
      objects[id] = value
      id
    }
  }

  fun remove(id: Int) {
    if (objects.remove(id) != null) {
      freeQueue.add(id)
    }
  }

  operator fun get(id: Int): Any? {
    return objects[id]
  }

  fun clear() {
    objects.clear()
    freeQueue.clear()
    counter.set(0)
  }

  companion object {
    @JvmStatic
    val shared = ObjectManager()

    @JvmStatic
    fun addItem(value: Any): Int {
      return shared.add(value)
    }
  }
}
