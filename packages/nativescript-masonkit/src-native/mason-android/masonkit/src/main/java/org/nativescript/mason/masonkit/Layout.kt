package org.nativescript.mason.masonkit


data class Layout(
    val order: Int,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
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
            val childCount = args[offset++].toInt()
            val children = ArrayList<Layout>(childCount)

            for (i in 0 until childCount) {
                val child = fromFloatArray(args, offset)
                offset = child.first
                children.add(child.second)
            }

            return Pair(offset, Layout(order.toInt(), x, y, width, height, children))
        }
    }
}
