import { onMount } from 'solid-js'
import { cssToStyle } from './cssToStyle'
import type { FixtureNode } from './types'

// Tag-specific renderers, keyed by the fixture's `tag` (defaults to 'div').
// This custom renderer has no `Dynamic`-style "render by tag string" helper,
// so a fixture that isn't `<div>`-based (e.g. the UA-default-margin fixtures
// under tools/scripts/gentests/custom_element_tests) needs a literal JSX tag
// per entry — each one otherwise identical to the plain `<div>` case.
type NodeProps = { ref: (el: any) => void; style: any; children: any }
const TAG_RENDERERS: Record<string, (p: NodeProps) => any> = {
  div: (p) => (
    <div ref={p.ref} style={p.style}>
      {p.children}
    </div>
  ),
  p: (p) => (
    <p ref={p.ref} style={p.style}>
      {p.children}
    </p>
  ),
  h1: (p) => (
    <h1 ref={p.ref} style={p.style}>
      {p.children}
    </h1>
  ),
  h2: (p) => (
    <h2 ref={p.ref} style={p.style}>
      {p.children}
    </h2>
  ),
  h3: (p) => (
    <h3 ref={p.ref} style={p.style}>
      {p.children}
    </h3>
  ),
  h4: (p) => (
    <h4 ref={p.ref} style={p.style}>
      {p.children}
    </h4>
  ),
  h5: (p) => (
    <h5 ref={p.ref} style={p.style}>
      {p.children}
    </h5>
  ),
  h6: (p) => (
    <h6 ref={p.ref} style={p.style}>
      {p.children}
    </h6>
  ),
  blockquote: (p) => (
    <blockquote ref={p.ref} style={p.style}>
      {p.children}
    </blockquote>
  ),
  pre: (p) => (
    <pre ref={p.ref} style={p.style}>
      {p.children}
    </pre>
  ),
}

function renderNode(node: FixtureNode, refs: Map<number, any>, isRoot = false): any {
  const render = TAG_RENDERERS[node.tag ?? 'div'] ?? TAG_RENDERERS.div
  // Own text first, then element children — the order they appear in the
  // fixture's markup, which is what the browser measured.
  const children: any[] = []
  if (node.text) children.push(node.text)
  for (const child of node.children) children.push(renderNode(child, refs))
  return render({
    ref: (el: any) => refs.set(node.seq, el),
    style: cssToStyle(node.style, isRoot),
    children,
  })
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
