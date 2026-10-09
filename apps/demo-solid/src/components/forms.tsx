import { createSignal, For } from 'solid-js'
import { BG, MUTED, Card } from './controls'

const RANGES = [
  { label: 'horizontal-tb', style: {} },
  { label: 'horizontal-tb · rtl', style: { direction: 'rtl' } },
  { label: 'vertical-lr', style: { writingMode: 'vertical-lr' } },
  { label: 'vertical-rl', style: { writingMode: 'vertical-rl' } },
  { label: 'vertical-lr · rtl', style: { writingMode: 'vertical-lr', direction: 'rtl' } },
] as const

const FIELDS = [
  { type: 'text', value: 'Styled text', style: { color: '#6c5ce7', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' } },
  { type: 'email', placeholder: 'name@example.com' },
  { type: 'search', placeholder: 'Search' },
  { type: 'number', value: '42' },
  { type: 'date', value: '2026-10-08' },
  { type: 'time', value: '09:30' },
  { type: 'checkbox', value: 'true' },
  { type: 'radio' },
  { type: 'submit' },
  { type: 'reset' },
] as const

function Range(props: { label: string; style: Record<string, unknown> }) {
  const [value, setValue] = createSignal('40')
  let input: any
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 8 }}>
      <input ref={input} type="range" value="40" style={props.style as any} on:input={() => setValue(String(input?.value ?? ''))} />
      <span style={{ fontSize: 12, color: MUTED }} text={`${props.label}: ${value()}`} />
    </div>
  )
}

export default function Forms() {
  const [log, setLog] = createSignal<string[]>([])
  const record = (e: any) => {
    const target = e?.target
    const value = target?.value !== undefined ? ` = ${target.value}` : ''
    setLog((l) => [`${e?.type} on ${target?.type ?? target?.constructor?.name ?? '?'}${value}`, ...l].slice(0, 6))
  }

  return (
    <>
      <actionbar title="Forms" />
      <scroll style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>
        <Card title="RANGE · WRITING MODE">
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 8 }} text="A vertical range starts at the top, as in browsers; direction: rtl flips either orientation." />
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
            <For each={RANGES}>{(r) => <Range label={r.label} style={r.style} />}</For>
          </div>
        </Card>
        <Card title="INPUTS · EVENTS BUBBLE TO THE CARD">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} on:input={record} on:change={record} on:focus={record}>
            <For each={FIELDS}>
              {(f) => (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 80, fontSize: 13, color: MUTED }} text={f.type} />
                  <input type={f.type} value={(f as any).value ?? ''} placeholder={(f as any).placeholder ?? ''} style={{ color: '#1a1a2e', ...((f as any).style ?? {}) }} />
                </div>
              )}
            </For>
            <textarea rows={3} placeholder="textarea" style={{ fontSize: 15, color: '#0984e3' }} />
            <input class="forms-focus" type="text" placeholder=":focus turns this yellow" style={{ color: '#1a1a2e' }} />
            <div class="forms-hover" style={{ padding: 8, borderRadius: '8px' }}>
              <span text=":hover turns this blue" />
            </div>
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }} text={log().length ? log().join('\n') : 'Type or pick a value: events show here.'} />
        </Card>
      </scroll>
    </>
  )
}
