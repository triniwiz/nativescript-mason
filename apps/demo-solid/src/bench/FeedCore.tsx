import { For } from 'solid-js'
import { useFeed } from './scenarios'
import './elements'
import './styles'

export default function FeedCore() {
  const { items, append, prepend, shuffle, retitle, clear, refill } = useFeed('core')

  return (
    <>
      <actionbar title="Feed - core" />
      <scrollview class="bench-page">
        <stacklayout class="fc-feed">
          <wraplayout class="bc-toolbar">
            <nbutton class="bc-tool" text="+20" on:tap={append} />
            <nbutton class="bc-tool" text="Prepend" on:tap={prepend} />
            <nbutton class="bc-tool" text="Shuffle" on:tap={shuffle} />
            <nbutton class="bc-tool" text="Retitle" on:tap={() => retitle(Date.now() % 100)} />
            <nbutton class="bc-tool" text="Clear" on:tap={clear} />
            <nbutton class="bc-tool" text="Refill" on:tap={refill} />
          </wraplayout>
          <nlabel class="bc-count" text={`${items().length} rows`} />

          <For each={items()}>
            {(item) => (
              <gridlayout class="fc-row" columns="40, *, auto" rows="auto">
                <gridlayout col={0} class="fc-avatar" verticalAlignment="middle" backgroundColor={item.color}>
                  <nlabel class="fc-avatar-text" text={item.id % 100} />
                </gridlayout>
                <stacklayout col={1} class="bench-body fc-body">
                  <nlabel class="fc-title" text={item.title} />
                  <nlabel class="fc-subtitle" text={item.subtitle} textWrap={true} />
                </stacklayout>
                <gridlayout col={2} class="fc-badge" verticalAlignment="middle">
                  <nlabel class="fc-badge-text" text={item.badge} />
                </gridlayout>
              </gridlayout>
            )}
          </For>
        </stacklayout>
      </scrollview>
    </>
  )
}
