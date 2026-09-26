import { For } from 'solid-js'
import { useFeed } from './scenarios'
import './styles'

export default function FeedMason() {
  const { items, append, prepend, shuffle, retitle, clear, refill } = useFeed('mason')

  return (
    <>
      <actionbar title="Feed - MasonKit" />
      <scroll class="bench-page">
        <main class="fm-feed">
          {/* One array child, so an empty list leaves no "" placeholder text node, which Mason would lay out as an anonymous text run. */}
          {[
            <div class="bm-toolbar">
              <div class="bm-tool" on:click={append}>
                <span class="bm-tool-text" text="+20" />
              </div>
              <div class="bm-tool" on:click={prepend}>
                <span class="bm-tool-text" text="Prepend" />
              </div>
              <div class="bm-tool" on:click={shuffle}>
                <span class="bm-tool-text" text="Shuffle" />
              </div>
              <div class="bm-tool" on:click={() => retitle(Date.now() % 100)}>
                <span class="bm-tool-text" text="Retitle" />
              </div>
              <div class="bm-tool" on:click={clear}>
                <span class="bm-tool-text" text="Clear" />
              </div>
              <div class="bm-tool" on:click={refill}>
                <span class="bm-tool-text" text="Refill" />
              </div>
            </div>,
            <span class="bm-count" text={`${items().length} rows`} />,
            <For each={items()}>
              {(item) => (
                <div class="fm-row">
                  <div class="fm-avatar" backgroundColor={item.color}>
                    <span class="fm-avatar-text" text={String(item.id % 100)} />
                  </div>
                  <div class="bench-body fm-body">
                    <span class="fm-title" text={item.title} />
                    <span class="fm-subtitle" text={item.subtitle} />
                  </div>
                  <div class="fm-badge">
                    <span class="fm-badge-text" text={item.badge} />
                  </div>
                </div>
              )}
            </For>,
          ]}
        </main>
      </scroll>
    </>
  )
}
