package org.nativescript.mason.masonkit

fun <E : Element> E.configure(block: (Style) -> Unit): E {
  style.inBatch = true
  try {
    block(style)
  } finally {
    style.inBatch = false
  }
  return this
}
