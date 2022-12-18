package org.nativescript.mason.masonkit


class Mason private constructor() {

    internal var nativePtr: Long = 0L

    init {
        initLib()
        nativePtr = nativeInit()
    }

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
            System.loadLibrary("masonandroid")
            didInit = true
        }

        @JvmStatic
        val instance = Mason()

        // enable when using along external bindings
        @JvmStatic
        var shared = false
    }

    private external fun nativeInit(): Long

    private external fun nativeClear(mason: Long)
}
