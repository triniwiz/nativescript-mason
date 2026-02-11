package org.nativescript.mason.masonkit

enum class NativeObjectType {
  Mason,
  Node,
}

internal interface NativeObject {
  val isTracked: Boolean
  fun nativePtr(): Long {
    return 0
  }

  val objectType: NativeObjectType

  fun hasObjectId(): Boolean {
    return false
  }

  fun objectId(): Int {
    return -1
  }

  fun setTracked(value: Boolean) {}
}
