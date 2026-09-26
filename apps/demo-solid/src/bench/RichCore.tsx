import { createMemo, For, Index } from 'solid-js'
import { bindKeyed, useRich } from './scenarios'
import type { SpanRun } from './data'
import './elements'
import './styles'

function spanProps(r: SpanRun): Record<string, string> {
  const p: Record<string, string> = {}
  if (r.bold) p.fontWeight = 'bold'
  if (r.italic) p.fontStyle = 'italic'
  if (r.color) p.color = r.color
  return p
}

export default function RichCore() {
  const { cards, narrow, retext, restyle, append, toggleNarrow } = useRich('core')
  const spanCount = createMemo(() => cards().reduce((n, c) => n + c.runs.length + c.meta.length + 2, 0))

  const run = (r: () => SpanRun) => <nspan text={r().text} ref={(el: any) => bindKeyed(el, () => spanProps(r()))} />

  return (
    <>
      <actionbar title="Rich Text - core" />
      <scrollview class="bench-page">
        <stacklayout class="rc-rich">
          <wraplayout class="bc-toolbar">
            <nbutton class="bc-tool" text="Retext" on:tap={() => retext(Date.now() % 100)} />
            <nbutton class="bc-tool" text="Restyle" on:tap={restyle} />
            <nbutton class="bc-tool" text="+10" on:tap={append} />
            <nbutton class="bc-tool" text={narrow() ? 'Widen' : 'Narrow'} on:tap={toggleNarrow} />
          </wraplayout>
          <nlabel class="bc-count" text={`${cards().length} cards · ${spanCount()} spans`} />

          <stacklayout class={narrow() ? 'rc-root rc-narrow' : 'rc-root'}>
            <For each={cards()}>
              {(card) => (
                <stacklayout class="rc-card" borderColor={card.color}>
                  <stacklayout class="rc-card-body">
                    <nlabel class="rc-title" textWrap={true}>
                      <formattedstring>
                        <nspan text={`#${card.id} `} color={card.color} fontWeight="bold" />
                        <nspan text={' ' + card.title} fontWeight="bold" />
                      </formattedstring>
                    </nlabel>
                    <nlabel class="rc-para" textWrap={true}>
                      <formattedstring>
                        <Index each={card.runs}>{run}</Index>
                      </formattedstring>
                    </nlabel>
                    <nlabel class="rc-meta" textWrap={true}>
                      <formattedstring>
                        <Index each={card.meta}>{run}</Index>
                      </formattedstring>
                    </nlabel>
                  </stacklayout>
                </stacklayout>
              )}
            </For>
          </stacklayout>
        </stacklayout>
      </scrollview>
    </>
  )
}
