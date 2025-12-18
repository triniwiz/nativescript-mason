package org.nativescript.mason.masonkit

class Document(
  mason: Mason
) {

  val node = mason.createNode().apply {
    type = NodeType.Document
    document = this@Document
  }

  var documentElement: Element? = null
    internal set
}
