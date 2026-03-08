package org.nativescript.mason.masonkit

import org.junit.Test
import org.junit.Assert.*
import kotlin.system.measureNanoTime

/**
 * Unit tests for MasonLayoutTree flat layout parsing and MasonNodeView accessors.
 * These run on the host JVM without Android dependencies.
 */
class MasonLayoutTreeTests {

  // Helper: build a FloatArray for a single node with the given values and childCount
  private fun singleNodeArray(
    order: Float = 0f,
    x: Float = 10f, y: Float = 20f, width: Float = 100f, height: Float = 200f,
    borderTop: Float = 1f, borderRight: Float = 2f, borderBottom: Float = 3f, borderLeft: Float = 4f,
    marginTop: Float = 5f, marginRight: Float = 6f, marginBottom: Float = 7f, marginLeft: Float = 8f,
    paddingTop: Float = 9f, paddingRight: Float = 10f, paddingBottom: Float = 11f, paddingLeft: Float = 12f,
    contentWidth: Float = 80f, contentHeight: Float = 160f,
    scrollbarWidth: Float = 0f, scrollbarHeight: Float = 0f,
    childCount: Float = 0f
  ): FloatArray = floatArrayOf(
    order, x, y, width, height,
    borderTop, borderRight, borderBottom, borderLeft,
    marginTop, marginRight, marginBottom, marginLeft,
    paddingTop, paddingRight, paddingBottom, paddingLeft,
    contentWidth, contentHeight,
    scrollbarWidth, scrollbarHeight,
    childCount
  )

  @Test
  fun parseSingleNode() {
    val tree = MasonLayoutTree()
    val arr = singleNodeArray()
    tree.fromFloatArray(arr)

    assertEquals(1, tree.nodeCount)

    val nv = MasonNodeView(tree, 0)
    assertEquals(10f, nv.x, 0.001f)
    assertEquals(20f, nv.y, 0.001f)
    assertEquals(100f, nv.width, 0.001f)
    assertEquals(200f, nv.height, 0.001f)

    assertEquals(1f, nv.borderTop, 0.001f)
    assertEquals(2f, nv.borderRight, 0.001f)
    assertEquals(3f, nv.borderBottom, 0.001f)
    assertEquals(4f, nv.borderLeft, 0.001f)

    assertEquals(5f, nv.marginTop, 0.001f)
    assertEquals(6f, nv.marginRight, 0.001f)
    assertEquals(7f, nv.marginBottom, 0.001f)
    assertEquals(8f, nv.marginLeft, 0.001f)

    assertEquals(9f, nv.paddingTop, 0.001f)
    assertEquals(10f, nv.paddingRight, 0.001f)
    assertEquals(11f, nv.paddingBottom, 0.001f)
    assertEquals(12f, nv.paddingLeft, 0.001f)

    assertEquals(80f, nv.contentWidth, 0.001f)
    assertEquals(160f, nv.contentHeight, 0.001f)

    assertEquals(0f, nv.scrollbarWidth, 0.001f)
    assertEquals(0f, nv.scrollbarHeight, 0.001f)

    assertFalse(nv.hasChildren)
  }

  @Test
  fun parseParentWithChildren() {
    // Parent with 2 children
    val parent = singleNodeArray(
      order = 0f, x = 0f, y = 0f, width = 300f, height = 400f,
      borderTop = 0f, borderRight = 0f, borderBottom = 0f, borderLeft = 0f,
      marginTop = 0f, marginRight = 0f, marginBottom = 0f, marginLeft = 0f,
      paddingTop = 0f, paddingRight = 0f, paddingBottom = 0f, paddingLeft = 0f,
      contentWidth = 300f, contentHeight = 400f,
      scrollbarWidth = 0f, scrollbarHeight = 0f,
      childCount = 2f
    )
    val child1 = singleNodeArray(
      order = 0f, x = 0f, y = 0f, width = 150f, height = 50f,
      borderTop = 0f, borderRight = 0f, borderBottom = 0f, borderLeft = 0f,
      marginTop = 0f, marginRight = 0f, marginBottom = 0f, marginLeft = 0f,
      paddingTop = 0f, paddingRight = 0f, paddingBottom = 0f, paddingLeft = 0f,
      contentWidth = 150f, contentHeight = 50f,
      scrollbarWidth = 0f, scrollbarHeight = 0f,
      childCount = 0f
    )
    val child2 = singleNodeArray(
      order = 0f, x = 0f, y = 50f, width = 150f, height = 75f,
      borderTop = 0f, borderRight = 0f, borderBottom = 0f, borderLeft = 0f,
      marginTop = 0f, marginRight = 0f, marginBottom = 0f, marginLeft = 0f,
      paddingTop = 0f, paddingRight = 0f, paddingBottom = 0f, paddingLeft = 0f,
      contentWidth = 150f, contentHeight = 75f,
      scrollbarWidth = 0f, scrollbarHeight = 0f,
      childCount = 0f
    )

    val arr = parent + child1 + child2
    val tree = MasonLayoutTree()
    tree.fromFloatArray(arr)

    assertEquals(3, tree.nodeCount)

    val parentNv = MasonNodeView(tree, 0)
    assertTrue(parentNv.hasChildren)
    assertEquals(2, parentNv.childNodeCount)
    assertEquals(300f, parentNv.width, 0.001f)

    val c1 = parentNv.childAt(0)
    assertEquals(150f, c1.width, 0.001f)
    assertEquals(50f, c1.height, 0.001f)
    assertEquals(0f, c1.y, 0.001f)

    val c2 = parentNv.childAt(1)
    assertEquals(150f, c2.width, 0.001f)
    assertEquals(75f, c2.height, 0.001f)
    assertEquals(50f, c2.y, 0.001f)
  }

  @Test
  fun parseDeeplyNested() {
    // root -> A -> B -> C (each has 1 child except leaf)
    fun node(x: Float, y: Float, w: Float, h: Float, children: Int) = singleNodeArray(
      x = x, y = y, width = w, height = h,
      borderTop = 0f, borderRight = 0f, borderBottom = 0f, borderLeft = 0f,
      marginTop = 0f, marginRight = 0f, marginBottom = 0f, marginLeft = 0f,
      paddingTop = 0f, paddingRight = 0f, paddingBottom = 0f, paddingLeft = 0f,
      contentWidth = w, contentHeight = h,
      childCount = children.toFloat()
    )

    val arr = node(0f, 0f, 500f, 500f, 1) +
      node(10f, 10f, 400f, 400f, 1) +
      node(20f, 20f, 300f, 300f, 1) +
      node(30f, 30f, 200f, 200f, 0)

    val tree = MasonLayoutTree()
    tree.fromFloatArray(arr)

    assertEquals(4, tree.nodeCount)

    val root = MasonNodeView(tree, 0)
    assertEquals(500f, root.width, 0.001f)
    assertTrue(root.hasChildren)

    val a = root.childAt(0)
    assertEquals(400f, a.width, 0.001f)

    val b = a.childAt(0)
    assertEquals(300f, b.width, 0.001f)

    val c = b.childAt(0)
    assertEquals(200f, c.width, 0.001f)
    assertFalse(c.hasChildren)
  }

  @Test
  fun reuseTreeAcrossPasses() {
    val tree = MasonLayoutTree()

    // First parse
    val arr1 = singleNodeArray(width = 100f, height = 100f)
    tree.fromFloatArray(arr1)
    assertEquals(1, tree.nodeCount)
    assertEquals(100f, MasonNodeView(tree, 0).width, 0.001f)

    // Second parse with different data — should reuse backing arrays
    val arr2 = singleNodeArray(width = 200f, height = 200f)
    tree.fromFloatArray(arr2)
    assertEquals(1, tree.nodeCount)
    assertEquals(200f, MasonNodeView(tree, 0).width, 0.001f)
  }

  @Test
  fun emptyArrayProducesZeroNodes() {
    val tree = MasonLayoutTree()
    tree.fromFloatArray(FloatArray(0))
    assertEquals(0, tree.nodeCount)
  }

  @Test
  fun nodeViewHelpers() {
    val arr = singleNodeArray(
      width = 0f, height = 0f,
      paddingTop = 0f, paddingRight = 0f, paddingBottom = 0f, paddingLeft = 0f,
      marginTop = 0f, marginRight = 0f, marginBottom = 0f, marginLeft = 0f,
      borderTop = 0f, borderRight = 0f, borderBottom = 0f, borderLeft = 0f
    )
    val tree = MasonLayoutTree()
    tree.fromFloatArray(arr)
    val nv = MasonNodeView(tree, 0)

    assertTrue(nv.sizeIsEmpty)
    assertTrue(nv.paddingIsEmpty)
    assertTrue(nv.marginIsEmpty)
    assertTrue(nv.borderIsEmpty)
  }

  @Test
  fun matchesLegacyLayout() {
    // Verify flat tree produces same values as the legacy recursive Layout parser
    fun node(x: Float, y: Float, w: Float, h: Float, children: Int) = singleNodeArray(
      x = x, y = y, width = w, height = h,
      borderTop = 1f, borderRight = 2f, borderBottom = 3f, borderLeft = 4f,
      marginTop = 5f, marginRight = 6f, marginBottom = 7f, marginLeft = 8f,
      paddingTop = 9f, paddingRight = 10f, paddingBottom = 11f, paddingLeft = 12f,
      contentWidth = w - 6f, contentHeight = h - 4f,
      childCount = children.toFloat()
    )

    val arr = node(0f, 0f, 500f, 400f, 2) +
      node(10f, 0f, 200f, 100f, 0) +
      node(210f, 0f, 200f, 100f, 0)

    // Parse with flat tree
    val tree = MasonLayoutTree()
    tree.fromFloatArray(arr)

    // Parse with legacy
    val legacy = Layout.fromFloatArray(arr, 0).second

    val flatRoot = MasonNodeView(tree, 0)
    assertEquals(legacy.x, flatRoot.x, 0.001f)
    assertEquals(legacy.y, flatRoot.y, 0.001f)
    assertEquals(legacy.width, flatRoot.width, 0.001f)
    assertEquals(legacy.height, flatRoot.height, 0.001f)
    assertEquals(legacy.border.top, flatRoot.borderTop, 0.001f)
    assertEquals(legacy.border.right, flatRoot.borderRight, 0.001f)
    assertEquals(legacy.padding.left, flatRoot.paddingLeft, 0.001f)
    assertEquals(legacy.contentSize.width, flatRoot.contentWidth, 0.001f)
    assertEquals(legacy.contentSize.height, flatRoot.contentHeight, 0.001f)

    // Check children match
    assertEquals(legacy.children.size, flatRoot.childNodeCount)
    for (i in 0 until flatRoot.childNodeCount) {
      val flatChild = flatRoot.childAt(i)
      val legacyChild = legacy.children[i]
      assertEquals(legacyChild.x, flatChild.x, 0.001f)
      assertEquals(legacyChild.y, flatChild.y, 0.001f)
      assertEquals(legacyChild.width, flatChild.width, 0.001f)
      assertEquals(legacyChild.height, flatChild.height, 0.001f)
    }
  }

  // --- Performance Tests ---

  /**
   * Generate a synthetic layout FloatArray representing a tree with the given shape.
   * Each level has `childrenPerNode` children, up to `depth` levels.
   */
  private fun generateTree(depth: Int, childrenPerNode: Int): FloatArray {
    val result = mutableListOf<Float>()
    fun addNode(d: Int) {
      val children = if (d < depth) childrenPerNode else 0
      // order, x, y, w, h
      result.addAll(listOf(0f, d * 10f, d * 5f, 100f + d, 50f + d))
      // border (4), margin (4), padding (4)
      repeat(12) { result.add(it.toFloat()) }
      // contentSize (2), scrollbarSize (2)
      result.addAll(listOf(90f, 40f, 0f, 0f))
      // childCount
      result.add(children.toFloat())
      // recurse
      repeat(children) { addNode(d + 1) }
    }
    addNode(0)
    return result.toFloatArray()
  }

  @Test
  fun perfFlatTreeParsing() {
    // Tree: 3 levels deep, 5 children per node = 1 + 5 + 25 + 125 = 156 nodes
    val arr = generateTree(3, 5)
    val tree = MasonLayoutTree()

    // Warmup
    repeat(100) { tree.fromFloatArray(arr) }

    val iterations = 10_000
    val time = measureNanoTime {
      repeat(iterations) { tree.fromFloatArray(arr) }
    }

    val avgNs = time / iterations
    println("perfFlatTreeParsing: 156 nodes, iterations=$iterations avgNs=$avgNs")
    // Should be well under 100µs per parse for 156 nodes
    assertTrue("flat tree parse too slow: ${avgNs}ns", avgNs < 100_000L)
  }

  @Test
  fun perfLegacyLayoutParsing() {
    // Same tree for comparison
    val arr = generateTree(3, 5)

    // Warmup
    repeat(100) { Layout.fromFloatArray(arr, 0) }

    val iterations = 10_000
    val time = measureNanoTime {
      repeat(iterations) { Layout.fromFloatArray(arr, 0) }
    }

    val avgNs = time / iterations
    println("perfLegacyLayoutParsing: 156 nodes, iterations=$iterations avgNs=$avgNs")
  }

  @Test
  fun perfFlatVsLegacySpeedup() {
    val arr = generateTree(3, 5)
    val tree = MasonLayoutTree()

    // Warmup both
    repeat(500) {
      tree.fromFloatArray(arr)
      Layout.fromFloatArray(arr, 0)
    }

    val iterations = 10_000

    val flatTime = measureNanoTime {
      repeat(iterations) { tree.fromFloatArray(arr) }
    }

    val legacyTime = measureNanoTime {
      repeat(iterations) { Layout.fromFloatArray(arr, 0) }
    }

    val flatAvg = flatTime / iterations
    val legacyAvg = legacyTime / iterations
    val speedup = legacyAvg.toDouble() / flatAvg.toDouble()

    println("perfFlatVsLegacySpeedup: flat=${flatAvg}ns legacy=${legacyAvg}ns speedup=${String.format("%.2f", speedup)}x")
    // Flat tree should be at least 1.5x faster due to no object allocation
    assertTrue("flat tree not faster: speedup=${speedup}", speedup > 1.0)
  }

  @Test
  fun perfLargeTree() {
    // 4 levels, 4 children = 1 + 4 + 16 + 64 + 256 = 341 nodes
    val arr = generateTree(4, 4)
    val tree = MasonLayoutTree()

    // Warmup
    repeat(100) { tree.fromFloatArray(arr) }

    val iterations = 5_000
    val time = measureNanoTime {
      repeat(iterations) { tree.fromFloatArray(arr) }
    }

    val avgNs = time / iterations
    println("perfLargeTree: 341 nodes, iterations=$iterations avgNs=$avgNs")
    // Should be under 200µs for 341 nodes
    assertTrue("large tree parse too slow: ${avgNs}ns", avgNs < 200_000L)
  }

  @Test
  fun perfNodeViewAccess() {
    val arr = generateTree(3, 5)
    val tree = MasonLayoutTree()
    tree.fromFloatArray(arr)

    // Warmup
    var sink = 0f
    repeat(1000) {
      for (i in 0 until tree.nodeCount) {
        val nv = MasonNodeView(tree, i)
        sink += nv.x + nv.y + nv.width + nv.height +
          nv.borderTop + nv.paddingLeft + nv.contentWidth
      }
    }

    val iterations = 10_000
    val time = measureNanoTime {
      repeat(iterations) {
        for (i in 0 until tree.nodeCount) {
          val nv = MasonNodeView(tree, i)
          sink += nv.x + nv.y + nv.width + nv.height +
            nv.borderTop + nv.paddingLeft + nv.contentWidth
        }
      }
    }

    val avgPerNodeNs = time / (iterations.toLong() * tree.nodeCount)
    println("perfNodeViewAccess: ${tree.nodeCount} nodes, avgPerNodeNs=$avgPerNodeNs sink=$sink")
    // Direct array access should be under 50ns per node
    assertTrue("node view access too slow: ${avgPerNodeNs}ns", avgPerNodeNs < 100L)
  }
}
