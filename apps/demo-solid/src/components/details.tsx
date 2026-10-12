import { createSignal, For, onMount } from 'solid-js'
import { BG, MUTED, Card } from './controls'

const FAQ = [
  { q: 'Is this a web view?', a: 'No. Every box is a native view laid out by Mason.' },
  { q: 'Does the accordion need app state?', a: 'No. Details sharing a name open one at a time.' },
  { q: 'Can a screen reader open it?', a: 'Yes. The summary is a button that expands or collapses.' },
]

const PARSED = `<details><summary>Parsed by the native HTML parser</summary><p>Closed content stays hidden until the summary is tapped.</p></details>
<details open><summary>Parsed with the open attribute</summary><p>This one starts open.</p></details>`

export default function Details() {
  const [log, setLog] = createSignal<string[]>([])
  const record = (label: string) => (e: any) => setLog((l) => [`toggle ${label}: ${e?.oldState} → ${e?.newState}`, ...l].slice(0, 5))
  let parsed: any
  let root: any
  onMount(() => {
    if (root?.page) root.page.actionBarHidden = true
    if (parsed) parsed.innerHTML = PARSED
  })

  return (
    <>
      <scroll ref={root} style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>
        <Card title="PLAIN · MARKER TURNS">
          <details class="details-plain" on:toggle={record('plain')}>
            <summary>Tap to show more</summary>
            <p style={{ color: MUTED, marginTop: 6 }} text="Hidden while closed, as in a browser." />
            <div style={{ height: 40, backgroundColor: '#74b9ff', borderRadius: '6px', marginTop: 6 }} />
          </details>
        </Card>
        <Card title="ACCORDION · NAME GROUP · NO MARKER">
          <For each={FAQ}>
            {(item, i) => (
              <details class="details-item" name="faq" open={i() === 0 ? true : undefined} on:toggle={record(`faq ${i() + 1}`)}>
                {/* Inline: Tailwind's PostCSS plugin strips list-style-type from app.css. */}
                <summary class="details-header" style={{ listStyleType: 'none' }}>{item.q}</summary>
                <p class="details-body" text={item.a} />
              </details>
            )}
          </For>
        </Card>
        <Card title="NATIVE HTML PARSER">
          <div ref={parsed} />
        </Card>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }} text={log().length ? log().join('\n') : 'Toggle a details: events show here.'} />
      </scroll>
    </>
  )
}
