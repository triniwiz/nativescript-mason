import { createSignal, For } from 'solid-js'
import { BG, MUTED, TEXT, Card, Field, Segmented, Stepper } from './controls'

// QA harness — deliberately throws varied/edge-case markup at the lib to make
// sure nothing breaks: scroll-auto default, backdrop-filter (content must stay
// sharp), dynamic add/remove churn, nested scrolling and extreme styles.
export default function QA() {
  const [blur, setBlur] = createSignal(18)
  const [filterKind, setFilterKind] = createSignal('blur')
  const [count, setCount] = createSignal(6)

  const filterCss = () => {
    switch (filterKind()) {
      case 'blur':
        return `blur(${blur()}px)`
      case 'bright':
        return `brightness(1.6)`
      case 'sat':
        return `saturate(2.2)`
      case 'gray':
        return `grayscale(1)`
      default:
        return `blur(${blur()}px)`
    }
  }

  return (
    <>
      <actionbar title="QA Harness" />
      {/*
        Outer scroll deliberately has NO overflow set — it must auto-scroll
        because content overflows the viewport (web-like default).
      */}
      <scroll style={{ backgroundColor: BG, padding: 16 }}>
        {/* ── 0. Repro: nested div>span text disappearing at depth 2 ── */}
        <div style={{ 'background-color': '#0f172a', padding: '8px', 'margin-bottom': 12 }}>
          <span style={{ color: 'red', 'font-weight': 600, 'font-size': 18 }}>DEPTH-1 (should show)</span>
        </div>
        <div style={{ display: 'flex', 'flex-direction': 'row', 'margin-bottom': 12 }}>
          <div style={{ 'background-color': '#38bdf8' }}>
            <span style={{ color: 'red', 'font-weight': 600, 'font-size': 18 }}>DEPTH-2 ROW (bug: blank on iOS)</span>
          </div>
        </div>
        <div style={{ display: 'flex', 'flex-direction': 'column', 'margin-bottom': 12 }}>
          <div style={{ 'background-color': '#38bdf8' }}>
            <span style={{ color: 'red', 'font-weight': 600, 'font-size': 18 }}>DEPTH-2 COLUMN (bug: blank on iOS)</span>
          </div>
        </div>
        {/* ── 1. Backdrop-filter: content must stay SHARP ── */}
        <Card title="BACKDROP-FILTER — TEXT MUST BE SHARP">
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #e84393, #6c5ce7, #0984e3)',
              padding: 18,
            }}
          >
            {/* Busy text behind the glass — should appear BLURRED under the card,
                while text OUTSIDE the card stays sharp. */}
            <For each={Array.from({ length: 6 })}>
              {() => (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>
                  backdrop content • backdrop content • backdrop content • backdrop content
                </p>
              )}
            </For>

            {/* The glass card, pulled UP to overlap the text behind it. Its OWN
                text must render crisp; the text behind must be blurred. */}
            <div
              style={{
                marginTop: -64,
                borderRadius: '14px',
                padding: 18,
                backgroundColor: 'rgba(255,255,255,0.18)',
                backdropFilter: filterCss(),
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.35)',
              }}
            >
              <p style={{ fontSize: 22, fontWeight: 'bold', color: 'white' }}>Hello world</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.95)' }}>
                This text sits inside the backdrop-filter node and must be perfectly readable.
              </p>
            </div>
          </div>
        </Card>

        <Card title="BACKDROP CONTROLS">
          <Field label="FILTER">
            <Segmented
              value={filterKind()}
              onChange={setFilterKind}
              accent="#6c5ce7"
              options={[
                { label: 'Blur', value: 'blur' },
                { label: 'Bright', value: 'bright' },
                { label: 'Saturate', value: 'sat' },
                { label: 'Gray', value: 'gray' },
              ]}
            />
          </Field>
          <Field label={`BLUR RADIUS — ${blur()}px`}>
            <Stepper value={blur()} min={0} max={40} step={2} suffix="px" onChange={setBlur} accent="#6c5ce7" />
          </Field>
        </Card>

        {/* ── 2. Dynamic add/remove churn ── */}
        <Card title="DYNAMIC ADD / REMOVE">
          <Field label={`ITEM COUNT — ${count()}`}>
            <Stepper value={count()} min={0} max={40} step={1} onChange={setCount} accent="#00b894" />
          </Field>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px 8px', marginTop: 8 }}>
            <For each={Array.from({ length: count() })}>
              {(_, i) => (
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: `${(i() % 6) * 5}px`,
                    backgroundColor: ['#e84393', '#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#e17055'][i() % 6],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <p style={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>{i()}</p>
                </div>
              )}
            </For>
          </div>
        </Card>

        {/* ── 3. Nested horizontal auto-scroll (no explicit overflow) ──
            KNOWN LIMITATION: a <scroll> nested inside another <scroll> does not
            position its children yet (the nested onLayout path doesn't run the
            flat-layout pass), so this row renders empty. Tracked separately from
            the scroll-auto-default fix. */}
        <Card title="NESTED HORIZONTAL SCROLL">
          <scroll style={{ height: 90, overflowX: 'scroll', overflowY: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px 10px', height: 74 }}>
              <For each={Array.from({ length: 14 })}>
                {(_, i) => (
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      flexShrink: 0,
                      borderRadius: '12px',
                      backgroundColor: ['#e84393', '#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#e17055'][i() % 6],
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: 8,
                    }}
                  >
                    <p style={{ fontSize: 11, color: 'white', fontWeight: 'bold' }}>#{i()}</p>
                  </div>
                )}
              </For>
            </div>
          </scroll>
        </Card>

        {/* ── 4. Extreme / edge styles ── */}
        <Card title="EDGE STYLES">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px 8px' }}>
            <p style={{ fontSize: 11, color: MUTED }}>Zero-size, negative margins, huge radius, deep nesting:</p>
            <div style={{ width: 0, height: 0 }} />
            <div
              style={{
                height: 60,
                borderRadius: '999px',
                backgroundColor: '#0984e3',
                marginLeft: -8,
                marginRight: -8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '999px' }}>
                <div style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '999px' }}>
                  {/* margin:0 — <p> has a default block margin (web-faithful) that
                      inflates this tight pill, more so on iOS. */}
                  <p style={{ fontSize: 12, color: 'white', fontWeight: 'bold', margin: 0 }}>nested pill</p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 40, color: TEXT, fontWeight: 'bold' }}>Big</p>
            <p style={{ fontSize: 8, color: MUTED }}>tiny</p>
          </div>
        </Card>

        <div style={{ height: 40 }} />
      </scroll>
    </>
  )
}
