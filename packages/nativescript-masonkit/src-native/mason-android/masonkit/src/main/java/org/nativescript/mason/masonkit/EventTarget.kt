package org.nativescript.mason.masonkit

import org.nativescript.mason.masonkit.events.Event
import java.util.UUID

interface EventTarget {
  val node: Node

  fun addEventListener(
    type: String,
    listener: (Event) -> Unit
  ): UUID {
    return node.mason.addEventListener(node, type, listener)
  }

  fun removeEventListener(
    type: String,
    id: UUID
  ) {
    node.mason.removeEventListener(node, type, id)
  }

  fun dispatch(event: Event) {
    node.mason.dispatch(event)
  }
}
