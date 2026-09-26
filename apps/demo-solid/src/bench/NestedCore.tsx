import { useNested } from './scenarios'
import NestedBoxCore from './NestedBoxCore'
import './elements'
import './styles'

export default function NestedCore() {
  const { tree, showOdd, narrow, retext, toggleOdd, toggleNarrow } = useNested('core')
  const boxCount = () => 2 ** (tree().depth + 1) - 1

  return (
    <>
      <actionbar title="Nested - core" />
      <scrollview class="bench-page">
        <stacklayout class="nc-nested">
          <wraplayout class="bc-toolbar">
            <nbutton class="bc-tool" text="Retext" on:tap={() => retext(Date.now() % 100)} />
            <nbutton class="bc-tool" text={showOdd() ? 'Hide row text' : 'Show row text'} on:tap={toggleOdd} />
            <nbutton class="bc-tool" text={narrow() ? 'Widen' : 'Narrow'} on:tap={toggleNarrow} />
          </wraplayout>
          <nlabel class="bc-count" text={`depth ${tree().depth} · ${boxCount()} boxes`} />

          <stacklayout class={narrow() ? 'nc-root nc-narrow' : 'nc-root'}>
            <NestedBoxCore node={tree()} showOdd={showOdd()} />
          </stacklayout>
        </stacklayout>
      </scrollview>
    </>
  )
}
