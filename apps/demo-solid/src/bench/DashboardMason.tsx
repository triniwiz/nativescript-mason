import { For, Index } from 'solid-js'
import { useDashboard } from './scenarios'
import './styles'

export default function DashboardMason() {
  const { tiles, wide, bump, rotate, toggleWide } = useDashboard('mason')

  return (
    <>
      <actionbar title="Dashboard - MasonKit" />
      <scroll class="bench-page">
        <main class="dm-dash">
          <div class="bm-toolbar">
            <div class="bm-tool" on:click={() => bump(Date.now() % 100)}>
              <span class="bm-tool-text" text="Bump" />
            </div>
            <div class="bm-tool" on:click={rotate}>
              <span class="bm-tool-text" text="Rotate" />
            </div>
            <div class="bm-tool" on:click={toggleWide}>
              <span class="bm-tool-text" text={wide() ? '3 columns' : '2 columns'} />
            </div>
          </div>

          <div class={wide() ? 'dm-grid dm-wide' : 'dm-grid'}>
            <For each={tiles()}>
              {(tile) => (
                <div class="dm-tile">
                  <span class="dm-label" text={tile.label} />
                  <span class="dm-value" text={String(tile.value)} color={tile.color} />
                  <div class="dm-bars">
                    <Index each={tile.bars}>{(h) => <div class="dm-bar" height={h()} backgroundColor={tile.color} />}</Index>
                  </div>
                </div>
              )}
            </For>
          </div>
        </main>
      </scroll>
    </>
  )
}
