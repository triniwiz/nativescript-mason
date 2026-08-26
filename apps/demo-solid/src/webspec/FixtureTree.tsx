import { onMount } from 'solid-js'
import { cssToStyle } from './cssToStyle'
import type { FixtureNode } from './types'

function renderNode(node: FixtureNode, refs: Map<number, any>, isRoot = false): any {
  return (
    <div ref={(el: any) => refs.set(node.seq, el)} style={cssToStyle(node.style, isRoot)}>
      {node.children.map((child) => renderNode(child, refs))}
    </div>
  )
}

// Snapshot every ref's measured size, to detect when layout stops changing
function snapshotSizes(refs: Map<number, any>): string {
  let out = ''
  for (const view of refs.values()) {
    const { width, height } = view.getActualSize()
    out += `${width},${height};`
  }
  return out
}

// Renders one fixture's style tree and hands back the seq->native-view refs
// once layout has settled. Polls instead of a fixed timeout, since a
// complex fixture can take several debounced compute rounds to settle.
export function FixtureTree(props: { tree: FixtureNode; onMounted: (refs: Map<number, any>) => void }) {
  const refs = new Map<number, any>()
  const element = renderNode(props.tree, refs, true)

  onMount(() => {
    let last: string | null = null
    let stableRounds = 0
    let attempts = 0
    const poll = () => {
      attempts++
      const snap = snapshotSizes(refs)
      if (snap === last) {
        stableRounds++
      } else {
        stableRounds = 0
        last = snap
      }
      // require a minimum poll count so an early cold-start match doesn't
      // pass as "settled"; hard-cap so a stuck fixture still falls through
      // to WebSpec.tsx's 4s watchdog
      if ((stableRounds >= 3 && attempts >= 5) || attempts >= 60) {
        props.onMounted(refs)
      } else {
        setTimeout(poll, 32)
      }
    }
    setTimeout(poll, 32)
  })

  return element
}
