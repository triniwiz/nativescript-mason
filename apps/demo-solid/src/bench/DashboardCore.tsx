import { createMemo, For, Index } from 'solid-js'
import { useDashboard } from './scenarios'
import './elements'
import './styles'

export default function DashboardCore() {
  const { tiles, wide, bump, rotate, toggleWide } = useDashboard('core')

  const cols = createMemo(() => (wide() ? 2 : 3))
  const columns = createMemo(() => Array(cols()).fill('*').join(', '))
  const rows = createMemo(() => Array(Math.ceil(tiles().length / cols())).fill('auto').join(', '))

  return (
    <>
      <actionbar title="Dashboard - core" />
      <scrollview class="bench-page">
        <stacklayout class="dc-dash">
          <wraplayout class="dc-toolbar">
            <nbutton class="bc-tool" text="Bump" on:tap={() => bump(Date.now() % 100)} />
            <nbutton class="bc-tool" text="Rotate" on:tap={rotate} />
            <nbutton class="bc-tool" text={wide() ? '3 columns' : '2 columns'} on:tap={toggleWide} />
          </wraplayout>

          <gridlayout class="dc-grid" columns={columns()} rows={rows()}>
            <For each={tiles()}>
              {(tile, i) => (
                <stacklayout class="dc-tile" row={Math.floor(i() / cols())} col={i() % cols()}>
                  <nlabel class="dc-label" text={tile.label} />
                  <nlabel class="dc-value" text={tile.value} color={tile.color} />
                  <gridlayout class="dc-bars" columns="*, *, *, *, *">
                    <Index each={tile.bars}>{(h, j) => <stacklayout class="dc-bar" col={j} height={h()} verticalAlignment="bottom" backgroundColor={tile.color} />}</Index>
                  </gridlayout>
                </stacklayout>
              )}
            </For>
          </gridlayout>
        </stacklayout>
      </scrollview>
    </>
  )
}
