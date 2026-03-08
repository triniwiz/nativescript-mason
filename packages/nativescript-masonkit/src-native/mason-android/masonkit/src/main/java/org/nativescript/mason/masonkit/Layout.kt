package org.nativescript.mason.masonkit

// MARK: - Flat Layout Tree (Android equivalent of iOS MasonLayoutTree)

class MasonLayoutTree {
  // Per-node floats: stride-4 (x, y, width, height)
  var frames = FloatArray(0)
    internal set

  // Per-node floats: stride-4 (top, right, bottom, left)
  var borders = FloatArray(0)
    internal set
  var margins = FloatArray(0)
    internal set
  var paddings = FloatArray(0)
    internal set

  // Per-node floats: stride-2 (width, height)
  var contentSizes = FloatArray(0)
    internal set
  var scrollbarSizes = FloatArray(0)
    internal set

  // Per-node ints
  var order = IntArray(0)
    internal set
  var childStart = IntArray(0)
    internal set
  var childCount = IntArray(0)
    internal set

  // Flat list of child indices
  var childIndices = IntArray(0)
    internal set

  var nodeCount = 0
    internal set

  /** Preallocated reusable cursor — use in hot paths instead of allocating new MasonNodeView. */
  val cursor = MasonNodeView(this, 0)

  private var childIndicesCount = 0

  fun fromFloatArray(args: FloatArray) {
    val estimatedNodes = args.size / 22
    ensureCapacity(estimatedNodes, estimatedNodes) // rough estimate for child indices too
    nodeCount = 0
    childIndicesCount = 0

    var arrayIndex = 0

    // DFS stack: (nodeIndex, remainingChildren)
    val stack = ArrayList<IntArray>(32) // [nodeIndex, remaining]

    while (arrayIndex < args.size) {
      val nodeOrder = args[arrayIndex++].toInt()
      val x = args[arrayIndex++]
      val y = args[arrayIndex++]
      val width = args[arrayIndex++]
      val height = args[arrayIndex++]

      val nodeIndex = nodeCount

      val f4 = nodeIndex * 4
      frames[f4] = x
      frames[f4 + 1] = y
      frames[f4 + 2] = width
      frames[f4 + 3] = height

      borders[f4] = args[arrayIndex++]
      borders[f4 + 1] = args[arrayIndex++]
      borders[f4 + 2] = args[arrayIndex++]
      borders[f4 + 3] = args[arrayIndex++]

      margins[f4] = args[arrayIndex++]
      margins[f4 + 1] = args[arrayIndex++]
      margins[f4 + 2] = args[arrayIndex++]
      margins[f4 + 3] = args[arrayIndex++]

      paddings[f4] = args[arrayIndex++]
      paddings[f4 + 1] = args[arrayIndex++]
      paddings[f4 + 2] = args[arrayIndex++]
      paddings[f4 + 3] = args[arrayIndex++]

      val s2 = nodeIndex * 2
      contentSizes[s2] = args[arrayIndex++]
      contentSizes[s2 + 1] = args[arrayIndex++]

      scrollbarSizes[s2] = args[arrayIndex++]
      scrollbarSizes[s2 + 1] = args[arrayIndex++]

      val childrenCountNode = args[arrayIndex++].toInt()

      order[nodeIndex] = nodeOrder
      childStart[nodeIndex] = childIndicesCount
      childCount[nodeIndex] = childrenCountNode

      // Reserve slots for this node's children (filled as we encounter them)
      ensureChildIndicesCapacity(childIndicesCount + childrenCountNode)
      for (i in 0 until childrenCountNode) {
        childIndices[childIndicesCount + i] = 0
      }
      childIndicesCount += childrenCountNode

      // Register this node as the next child of the parent on the stack
      if (stack.isNotEmpty()) {
        val last = stack[stack.size - 1]
        val parentIndex = last[0]
        val parentStart = childStart[parentIndex]
        val parentTotal = childCount[parentIndex]
        val parentRemaining = last[1]
        val slot = parentStart + (parentTotal - parentRemaining)
        childIndices[slot] = nodeIndex
      }

      // Pop completed parents
      if (stack.isNotEmpty()) {
        val last = stack[stack.size - 1]
        last[1]--
        while (stack.isNotEmpty() && stack[stack.size - 1][1] == 0) {
          stack.removeAt(stack.size - 1)
        }
      }

      // Push this node if it has children
      if (childrenCountNode > 0) {
        stack.add(intArrayOf(nodeIndex, childrenCountNode))
      }

      nodeCount++
      ensureCapacity(nodeCount + 1, childIndicesCount)
    }
  }

  private fun ensureCapacity(nodes: Int, childIndicesCap: Int) {
    if (nodes * 4 > frames.size) {
      val newSize = maxOf(nodes, nodeCount * 2, 16)
      frames = frames.copyOf(newSize * 4)
      borders = borders.copyOf(newSize * 4)
      margins = margins.copyOf(newSize * 4)
      paddings = paddings.copyOf(newSize * 4)
      contentSizes = contentSizes.copyOf(newSize * 2)
      scrollbarSizes = scrollbarSizes.copyOf(newSize * 2)
      order = order.copyOf(newSize)
      childStart = childStart.copyOf(newSize)
      childCount = childCount.copyOf(newSize)
    }
    ensureChildIndicesCapacity(childIndicesCap)
  }

  private fun ensureChildIndicesCapacity(needed: Int) {
    if (needed > childIndices.size) {
      childIndices = childIndices.copyOf(maxOf(needed, childIndices.size * 2, 16))
    }
  }

  companion object {
    @JvmStatic
    val empty = MasonLayoutTree()
  }
}

// MARK: - Node View (reusable, mutable cursor into MasonLayoutTree — no allocation per node)

class MasonNodeView(var tree: MasonLayoutTree, var index: Int) {

  /** Re-point this view at a different node index without allocating. */
  fun pointTo(newIndex: Int) { index = newIndex }

  /** Re-point this view at a different tree and index without allocating. */
  fun pointTo(newTree: MasonLayoutTree, newIndex: Int) { tree = newTree; index = newIndex }

  inline val x get() = tree.frames[index * 4]
  inline val y get() = tree.frames[index * 4 + 1]
  inline val width get() = tree.frames[index * 4 + 2]
  inline val height get() = tree.frames[index * 4 + 3]

  inline val borderTop get() = tree.borders[index * 4]
  inline val borderRight get() = tree.borders[index * 4 + 1]
  inline val borderBottom get() = tree.borders[index * 4 + 2]
  inline val borderLeft get() = tree.borders[index * 4 + 3]

  inline val marginTop get() = tree.margins[index * 4]
  inline val marginRight get() = tree.margins[index * 4 + 1]
  inline val marginBottom get() = tree.margins[index * 4 + 2]
  inline val marginLeft get() = tree.margins[index * 4 + 3]

  inline val paddingTop get() = tree.paddings[index * 4]
  inline val paddingRight get() = tree.paddings[index * 4 + 1]
  inline val paddingBottom get() = tree.paddings[index * 4 + 2]
  inline val paddingLeft get() = tree.paddings[index * 4 + 3]

  inline val contentWidth get() = tree.contentSizes[index * 2]
  inline val contentHeight get() = tree.contentSizes[index * 2 + 1]

  inline val scrollbarWidth get() = tree.scrollbarSizes[index * 2]
  inline val scrollbarHeight get() = tree.scrollbarSizes[index * 2 + 1]

  inline val order get() = tree.order[index]

  val hasChildren get() = tree.childCount[index] > 0

  val childNodeCount get() = tree.childCount[index]

  /** Returns the child tree index (not a new MasonNodeView). Use with pointTo(). */
  fun childTreeIndex(i: Int): Int {
    val start = tree.childStart[index]
    return tree.childIndices[start + i]
  }

  /** Convenience for tests / non-hot-path code. Allocates a new MasonNodeView. */
  fun childAt(i: Int): MasonNodeView {
    return MasonNodeView(tree, childTreeIndex(i))
  }

  val sizeIsEmpty get() = width == 0f && height == 0f

  val paddingIsEmpty get() = paddingTop == 0f && paddingRight == 0f && paddingBottom == 0f && paddingLeft == 0f

  val marginIsEmpty get() = marginTop == 0f && marginRight == 0f && marginBottom == 0f && marginLeft == 0f

  val borderIsEmpty get() = borderTop == 0f && borderRight == 0f && borderBottom == 0f && borderLeft == 0f
}

// MARK: - Legacy recursive Layout (kept for backward compatibility)

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
  val children: List<Layout>,
) {
  var baseline: Int = -1
    internal set

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
