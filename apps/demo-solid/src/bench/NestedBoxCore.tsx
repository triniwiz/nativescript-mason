import { For, Show } from 'solid-js'
import type { NestedNode } from './data'
import './elements'
import './styles'

// cell/row/col stand in for the attrs Vue falls through onto the child component's root.
interface Props {
  node: NestedNode
  showOdd: boolean
  cell?: boolean
  row?: number
  col?: number
}

export default function NestedBoxCore(props: Props) {
  const boxClass = () => (props.cell ? 'nbc-box nbc-cell' : 'nbc-box')

  return (
    <Show
      when={props.node.depth % 2 === 0 && props.node.children.length}
      fallback={
        <stacklayout class={boxClass()} row={props.row} col={props.col}>
          <nlabel class={props.node.children.length ? 'nbc-text nbc-branch' : 'nbc-text nbc-leaf'} text={props.node.text} textWrap={true} />
          <For each={props.node.children}>{(child) => <NestedBoxCore node={child} showOdd={props.showOdd} cell />}</For>
        </stacklayout>
      }
    >
      <gridlayout class={boxClass()} columns="*, *" rows="auto, auto" row={props.row} col={props.col}>
        <Show when={props.showOdd}>
          <nlabel class="nbc-text nbc-branch" text={props.node.text} textWrap={true} row={0} colSpan={2} />
        </Show>
        <For each={props.node.children}>{(child, i) => <NestedBoxCore node={child} showOdd={props.showOdd} cell row={1} col={i()} />}</For>
      </gridlayout>
    </Show>
  )
}
