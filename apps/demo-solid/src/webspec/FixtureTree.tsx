import { onMount } from 'solid-js'
import { cssToStyle } from './cssToStyle'
import type { FixtureNode } from './types'

function renderNode(node: FixtureNode, refs: Map<number, any>): any {
  return (
    <div ref={(el: any) => refs.set(node.seq, el)} style={cssToStyle(node.style)}>
      {node.children.map((child) => renderNode(child, refs))}
    </div>
  )
}

// Renders one fixture's style tree and hands back the seq->native-view refs
// once the native layout pass has had a couple of frames to settle.
export function FixtureTree(props: { tree: FixtureNode; onMounted: (refs: Map<number, any>) => void }) {
  const refs = new Map<number, any>()
  const element = renderNode(props.tree, refs)

  onMount(() => {
    setTimeout(() => setTimeout(() => props.onMounted(refs), 32), 0)
  })

  return element
}
