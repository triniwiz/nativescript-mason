package org.nativescript.mason.masonkit

import android.os.MessageQueue

class IdleHandler(val mason: Mason) : MessageQueue.IdleHandler {
  override fun queueIdle(): Boolean {
    mason.drain()
    return true
  }
}
