package org.nativescript.mason.masonkit


data class Layout(
  val order: Int,
  val x: Float,
  val y: Float,
  val width: Float,
  val height: Float,
  val border: Rect<Float>,
  val margin: Rect<Float>,
  val padding: Rect<Float>,
  val contentSize: Size<Float>,
  val scrollbarSize: Size<Float>,
  val children: List<Layout>
) {
  companion object {
    internal fun fromFloatArray(args: FloatArray, offset: Int): Pair<Int, Layout> {
      var offset = offset

      val order = args[offset++]
      val x = args[offset++]
      val y = args[offset++]
      val width = args[offset++]
      val height = args[offset++]

      val border = Rect(
        args[offset++],
        args[offset++],
        args[offset++],
        args[offset++]
      )

      val margin = Rect(
        args[offset++],
        args[offset++],
        args[offset++],
        args[offset++]
      )

      val padding = Rect(
        args[offset++],
        args[offset++],
        args[offset++],
        args[offset++]
      )

      val contentSize = Size(
        args[offset++],
        args[offset++]
      )

      val scrollbarSize = Size(
        args[offset++],
        args[offset++]
      )


      val childCount = args[offset++].toInt()
      val children = ArrayList<Layout>(childCount)

      for (i in 0 until childCount) {
        val child = fromFloatArray(args, offset)
        offset = child.first
        children.add(child.second)
      }

      return Pair(
        offset,
        Layout(
          order.toInt(),
          x,
          y,
          width,
          height,
          border,
          margin,
          padding,
          contentSize,
          scrollbarSize,
          children
        )
      )
    }

    fun empty(): Layout {
      return Layout(
        0,
        0F,
        0F,
        0F,
        0F,
        Rect(0F, 0F, 0F, 0F),
        Rect(0F, 0F, 0F, 0F),
        Rect(0F, 0F, 0F, 0F),
        Size(0F, 0F),
        Size(0F, 0F),
        listOf()
      )
    }
  }
}
