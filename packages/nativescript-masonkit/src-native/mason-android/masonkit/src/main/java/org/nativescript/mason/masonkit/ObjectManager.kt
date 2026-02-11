package org.nativescript.mason.masonkit

import java.util.ArrayDeque

class ObjectManager private constructor() {

  private val queue by lazy {
    ArrayDeque<Int>(256)
  }

  private val objects by lazy {
    ArrayList<Any?>(256)
  }

  @Synchronized
  fun add(value: Any): Int {
    if (queue.isNotEmpty()) {
      val id = queue.removeLast()
      objects[id] = value
      return id
    }
    val id = objects.size
    objects.add(value)
    return id
  }

  @Synchronized
  fun remove(id: Int) {
    objects.getOrNull(id)?.let {
      objects[id] = null
      queue.add(id)
    }
  }

  @Synchronized
  operator fun get(id: Int): Any? {
    return objects[id]
  }

  @Synchronized
  fun clear() {
    objects.clear()
    queue.clear()
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
