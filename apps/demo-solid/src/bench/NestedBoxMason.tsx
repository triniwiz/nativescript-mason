import { For, Show } from 'solid-js'
import type { NestedNode } from './data'
import './styles'

// `cell` stands in for the class Vue falls through onto the child component's root.
interface Props {
  node: NestedNode
  showOdd: boolean
  cell?: boolean
}

export default function NestedBoxMason(props: Props) {
  const odd = () => props.node.depth % 2 === 1
  const boxClass = () => `nbm-box ${odd() ? 'nbm-column' : 'nbm-row'}${props.cell ? ' nbm-cell' : ''}`
  const textClass = () => `nbm-text ${props.node.children.length ? 'nbm-branch' : 'nbm-leaf'}${odd() ? '' : ' nbm-full'}`

  return (
    <div class={boxClass()}>
      {/* One array child, so a hidden <p> or a leaf's empty list leaves no "" placeholder text node, which Mason would lay out as an anonymous text run. */}
      {[
        <Show when={props.showOdd || odd()}>
          <p class={textClass()} text={props.node.text} />
        </Show>,
        <For each={props.node.children}>{(child) => <NestedBoxMason node={child} showOdd={props.showOdd} cell />}</For>,
      ]}
    </div>
  )
}
