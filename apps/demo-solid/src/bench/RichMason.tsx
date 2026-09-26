import { createMemo, For, Index } from 'solid-js'
import { bindKeyed, useRich } from './scenarios'
import type { SpanRun } from './data'
import './styles'

function runStyle(r: SpanRun): Record<string, string> {
  const s: Record<string, string> = {}
  if (r.bold) s.fontWeight = 'bold'
  if (r.italic) s.fontStyle = 'italic'
  if (r.color) s.color = r.color
  return s
}

export default function RichMason() {
  const { cards, narrow, retext, restyle, append, toggleNarrow } = useRich('mason')
  const spanCount = createMemo(() => cards().reduce((n, c) => n + c.runs.length + c.meta.length + 2, 0))

  const run = (r: () => SpanRun) => <span text={r().text} ref={(el: any) => bindKeyed(el.style, () => runStyle(r()))} />

  return (
    <>
      <actionbar title="Rich Text - MasonKit" />
      <scroll class="bench-page">
        <main class="rm-rich">
          <div class="bm-toolbar">
            <div class="bm-tool" on:click={() => retext(Date.now() % 100)}>
              <span class="bm-tool-text" text="Retext" />
            </div>
            <div class="bm-tool" on:click={restyle}>
              <span class="bm-tool-text" text="Restyle" />
            </div>
            <div class="bm-tool" on:click={append}>
              <span class="bm-tool-text" text="+10" />
            </div>
            <div class="bm-tool" on:click={toggleNarrow}>
              <span class="bm-tool-text" text={narrow() ? 'Widen' : 'Narrow'} />
            </div>
          </div>
          <span class="bm-count" text={`${cards().length} cards · ${spanCount()} spans`} />

          <div class={narrow() ? 'rm-root rm-narrow' : 'rm-root'}>
            <For each={cards()}>
              {(card) => (
                <div class="rm-card" style={{ borderColor: card.color }}>
                  <div class="rm-card-body">
                    <p class="rm-title">
                      <span class="rm-badge" style={{ backgroundColor: card.color }} text={`#${card.id}`} />
                      <span class="rm-title-text" text={' ' + card.title} />
                    </p>
                    <p class="rm-para">
                      <Index each={card.runs}>{run}</Index>
                    </p>
                    <p class="rm-meta">
                      <Index each={card.meta}>{run}</Index>
                    </p>
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
