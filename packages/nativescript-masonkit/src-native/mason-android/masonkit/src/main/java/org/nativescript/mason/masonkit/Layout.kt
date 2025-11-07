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
      var position = offset

      val order = args[position++]
      val x = args[position++]
      val y = args[position++]
      val width = args[position++]
      val height = args[position++]

      val border = Rect(
        args[position++],
        args[position++],
        args[position++],
        args[position++]
      )

      val margin = Rect(
        args[position++],
        args[position++],
        args[position++],
        args[position++]
      )

      val padding = Rect(
        args[position++],
        args[position++],
        args[position++],
        args[position++]
      )

      val contentSize = Size(
        args[position++],
        args[position++]
      )

      val scrollbarSize = Size(
        args[position++],
        args[position++]
      )


      val childCount = args[position++].toInt()
      val children = ArrayList<Layout>(childCount)

      for (i in 0 until childCount) {
        val child = fromFloatArray(args, position)
        position = child.first
        children.add(child.second)
      }

      return Pair(
        position,
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

    @JvmStatic
    val empty = Layout(
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
