package org.nativescript.mason.masonkit

import com.google.gson.Gson
import dalvik.annotation.optimization.CriticalNative


class Mason private constructor() {

  internal var nativePtr = nativeInit()

  fun clear() {
    nativeClear(nativePtr)
  }

  fun getNativePtr(): Long {
    return nativePtr
  }

  companion object {

    private var didInit = false

    internal fun initLib() {
      if (didInit) {
        return
      }
      System.loadLibrary("masonnative")
      didInit = true
    }

    init {
      initLib()
    }

    @JvmStatic
    val instance = Mason()

    // enable when using along external bindings
    @JvmStatic
    var shared = false

    internal val gson =
      Gson().newBuilder()
        .registerTypeAdapter(Dimension::class.java, DimensionSerializer())
        .registerTypeAdapter(LengthPercentageSerializer::class.java, LengthPercentageSerializer())
        .registerTypeAdapter(LengthPercentageAutoSerializer::class.java, LengthPercentageAutoSerializer())
        .create()

    @JvmStatic
    @CriticalNative
    private external fun nativeInit(): Long

    @JvmStatic
    @CriticalNative
    private external fun nativeInitWithCapacity(capacity: Int): Long

    @JvmStatic
    @CriticalNative
    private external fun nativeClear(mason: Long)
  }
}
