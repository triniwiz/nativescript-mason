import { useNested } from './scenarios'
import NestedBoxMason from './NestedBoxMason'
import './styles'

export default function NestedMason() {
  const { tree, showOdd, narrow, retext, toggleOdd, toggleNarrow } = useNested('mason')
  const boxCount = () => 2 ** (tree().depth + 1) - 1

  return (
    <>
      <actionbar title="Nested - MasonKit" />
      <scroll class="bench-page">
        <main class="nm-nested">
          <div class="bm-toolbar">
            <div class="bm-tool" on:click={() => retext(Date.now() % 100)}>
              <span class="bm-tool-text" text="Retext" />
            </div>
            <div class="bm-tool" on:click={toggleOdd}>
              <span class="bm-tool-text" text={showOdd() ? 'Hide row text' : 'Show row text'} />
            </div>
            <div class="bm-tool" on:click={toggleNarrow}>
              <span class="bm-tool-text" text={narrow() ? 'Widen' : 'Narrow'} />
            </div>
          </div>
          <span class="bm-count" text={`depth ${tree().depth} · ${boxCount()} boxes`} />

          <div class={narrow() ? 'nm-root nm-narrow' : 'nm-root'}>
            <NestedBoxMason node={tree()} showOdd={showOdd()} />
          </div>
        </main>
      </scroll>
    </>
  )
}
