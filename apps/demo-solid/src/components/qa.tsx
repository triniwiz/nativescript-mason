import { createSignal, For, Show } from 'solid-js'
import { BG, MUTED, TEXT, Card, Field, Segmented, Stepper } from './controls'

// QA harness — deliberately throws varied/edge-case markup at the lib to make
// sure nothing breaks: scroll-auto default, backdrop-filter (content must stay
// sharp), dynamic add/remove churn, nested scrolling and extreme styles.
const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAA8CAIAAAAiz+n/AAAAvklEQVR4nO3QQQlCURQA0b81jDuxgH1MYQMNYwdjuLGEYAq9w/PABBjOtj8c9YO28YM/CTTotQINenno1+kab7vf4oEGDTrYuCPoSqBBgw427gi6EmjQoIONO4KuBBo06GDjjqArgQYNOti4I+hKoEGDDrYI9O7yjPd+nOOBBg062Lgj6EqgQYMONu4IuhJo0KCDjTuCrgQaNOhg446gK4EGDTrYuCPoSqBBgw62CLS+EWjQawUa9FqBPv4G+gNgLYJbtaKhMAAAAABJRU5ErkJggg=='

export default function QA() {
  const [blur, setBlur] = createSignal(18)
  const [filterKind, setFilterKind] = createSignal('blur')
  const [filtersOn, setFiltersOn] = createSignal(true)
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
        <Card title="INNER HTML">
          <div
            ref={(el: any) =>
              setTimeout(() => {
                el.innerHTML =
                  '<h3 style="margin: 0 0 6px 0">Parsed &amp; built</h3><p>Plain <b>bold</b>, <i>italic</i> and <span style="color: #e84393; background-color: #ffeaa7">styled</span> text.<br>After a break.</p><ul><li>one<li>two</ul><div style="display: flex; gap: 8px"><div style="width: 40px; height: 24px; background-color: #74b9ff; border-radius: 6px"></div><div style="width: 40px; height: 24px; background-color: #00b894; border-radius: 6px"></div></div>'
              }, 0)
            }
          />
        </Card>

        <Card title="FILTERS">
          <input type="checkbox" checked={filtersOn()} on:change={() => setFiltersOn(!filtersOn())} />
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <For each={['none', 'grayscale(1)', 'sepia(1)', 'hue-rotate(120deg)', 'invert(1)', 'blur(3px)', 'brightness(1.6)', 'contrast(0.4)', 'saturate(3)', 'opacity(0.4)']}>
              {(f) => (
                <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ width: 120, height: 70, borderRadius: '10px', background: 'linear-gradient(135deg, #e84393, #fdcb6e, #00b894)', padding: 8, filter: filtersOn() ? f : 'none' } as any}>
                    <p style={{ fontSize: 18, fontWeight: 'bold', color: '#2d3436' }}>Aa 12</p>
                  </div>
                  <p style={{ fontSize: 11, color: MUTED }}>{f}</p>
                </div>
              )}
            </For>
            <Show when={filtersOn()}>
              <div style={{ width: 120, height: 70, borderRadius: '10px', background: 'linear-gradient(135deg, #e84393, #fdcb6e, #00b894)', padding: 8, filter: 'drop-shadow(4px 4px 4px rgba(0,0,0,0.6))' } as any}>
                <p style={{ fontSize: 18, fontWeight: 'bold', color: '#2d3436' }}>shadow</p>
              </div>
            </Show>
          </div>
        </Card>

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

        <Card title="BORDERS & CLIPPING">
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ width: 90, height: 70, backgroundColor: '#6c5ce7', borderTopLeftRadius: '30px', borderBottomRightRadius: '30px' }} />
            <div style={{ width: 120, height: 70, backgroundColor: '#00b894', borderRadius: '50%' }} />
            <div style={{ width: 90, height: 70, backgroundColor: '#ffeaa7', borderRadius: '40px 10px / 20px 30px' }} />
            <div style={{ width: 90, height: 70, border: '4px dashed #e17055', borderRadius: '12px' }} />
            <div style={{ width: 90, height: 70, border: '4px dotted #0984e3' }} />
            <div style={{ width: 90, height: 70, border: '8px double #2d3436', borderRadius: '10px' }} />
            <div style={{ width: 90, height: 70, border: '8px inset #74b9ff' }} />
            <div style={{ width: 90, height: 70, borderWidth: '6px 2px 10px 4px', borderColor: '#e84393 #fdcb6e #00b894 #6c5ce7', borderStyle: 'solid', borderRadius: '16px' }} />
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden' }}>
              <div style={{ width: 80, height: 40, backgroundColor: '#e84393' }} />
              <div style={{ width: 80, height: 40, backgroundColor: '#0984e3' }} />
            </div>
            <div style={{ width: 90, height: 70, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }} />
            <div style={{ width: 90, height: 70, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 0 0 4px #6c5ce7' }} />
            <div style={{ width: 90, height: 70, backgroundColor: '#dfe6e9', borderRadius: '12px', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.45)' }} />
            <div style={{ width: 90, height: 70, backgroundColor: 'white', borderRadius: '30px 4px', boxShadow: '-6px -6px 0 #fdcb6e, 6px 6px 0 #0984e3' }} />
            <div style={{ width: 70, height: 70, backgroundColor: '#e84393', borderRadius: '50%', boxShadow: '0 0 20px 4px rgba(232,67,147,0.7)' }} />
            <div style={{ width: 90, height: 70, overflow: 'hidden', borderRadius: '14px', border: '2px solid #2d3436' }}>
              <div style={{ width: 140, height: 140, marginLeft: -20, marginTop: -20, backgroundColor: '#fdcb6e' }} />
            </div>
          </div>
        </Card>

        <Card title="BACKGROUNDS">
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ width: 110, height: 80, background: 'radial-gradient(#fdcb6e, #e17055)' }} />
            <div style={{ width: 110, height: 80, background: 'radial-gradient(circle at top left, #74b9ff, #6c5ce7)' }} />
            <div style={{ width: 110, height: 80, background: 'radial-gradient(closest-side at 30% 50%, white, #00b894 60%, #2d3436)' }} />
            <div style={{ width: 110, height: 80, borderRadius: '24px', background: 'radial-gradient(#e84393, #2d3436)' }} />
            <div style={{ width: 110, height: 80, backgroundColor: '#dfe6e9', background: `url(${TEST_IMAGE}) center / cover no-repeat` }} />
            <div style={{ width: 110, height: 80, backgroundColor: '#dfe6e9', backgroundImage: `url(${TEST_IMAGE})`, backgroundSize: 'contain', backgroundPosition: 'center' } as any} />
            <div style={{ width: 110, height: 80, borderRadius: '50%', backgroundImage: `url(${TEST_IMAGE})`, backgroundSize: 'cover' } as any} />
          </div>
        </Card>

        <Card title="TEXT">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 16, textTransform: 'uppercase' as any }}>uppercase text-transform</p>
            <p style={{ fontSize: 16, textTransform: 'capitalize' as any }}>capitalize every word here</p>
            <p style={{ fontSize: 16 }}>
              Plain <span style={{ backgroundColor: '#ffeaa7' }}>highlighted span</span> and <span style={{ backgroundColor: '#74b9ff', color: 'white' }}>another</span>.
            </p>
            <p style={{ fontSize: 16, textDecoration: 'underline wavy #e17055' } as any}>Wavy underline</p>
            <p style={{ fontSize: 16, textDecoration: 'underline double #6c5ce7' } as any}>Double underline</p>
            <p style={{ fontSize: 16, textDecoration: 'line-through dotted #0984e3' } as any}>Dotted line-through</p>
            <p style={{ fontSize: 16, textDecoration: 'overline dashed #00b894' } as any}>Dashed overline</p>
            <p style={{ fontSize: 16, textDecoration: 'underline solid #e84393 3px' } as any}>Thick coloured underline</p>
            <p style={{ fontSize: 22, fontWeight: 'bold', textShadow: '2px 2px 0 #fdcb6e' } as any}>Hard text shadow</p>
            <p style={{ fontSize: 22, fontWeight: 'bold', color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.6)' } as any}>Blurred text shadow</p>
            <p style={{ fontSize: 22, fontWeight: 'bold', textShadow: '-2px -2px 0 #74b9ff, 2px 2px 0 #e84393' } as any}>Two shadows</p>
            <p style={{ fontSize: 20, fontFamily: 'Bahnschrift', fontStretch: 'condensed' } as any}>Condensed Bahnschrift</p>
            <p style={{ fontSize: 20, fontFamily: 'Bahnschrift' } as any}>Normal Bahnschrift</p>
            <p style={{ fontSize: 16, wordSpacing: 16 } as any}>word spacing sixteen pixels</p>
            <p style={{ fontSize: 22, fontFamily: 'Gabriola', fontFeatureSettings: '"ss06"' } as any}>Gabriola stylistic set six</p>
            <p style={{ fontSize: 22, fontFamily: 'Gabriola' } as any}>Gabriola stylistic set six</p>
            <p style={{ fontSize: 18, fontFamily: 'Calibri', fontFeatureSettings: '"smcp"' } as any}>Calibri small caps</p>
            <p style={{ fontSize: 18, direction: 'rtl', backgroundColor: '#dfe6e9' } as any}>שלום עולם — مرحبا بالعالم</p>
            <p style={{ fontSize: 18, direction: 'rtl', textAlignment: 'left', backgroundColor: '#dfe6e9' } as any}>RTL text-align left</p>
          </div>
        </Card>

        <Card title="HYPHENS">
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            <For each={['auto', 'manual', 'none']}>
              {(mode) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ fontSize: 11, color: MUTED }}>{mode}</p>
                  <p style={{ width: 120, fontSize: 15, backgroundColor: '#dfe6e9', hyphens: mode as any }}>
                    {mode === 'auto' ? 'Extraordinary hyphenation demonstrates internationalization responsibilities' : 'Extra\u00ADordinary hyphen\u00ADation demon\u00ADstrates inter\u00ADnational\u00ADization respon\u00ADsibilities'}
                  </p>
                </div>
              )}
            </For>
          </div>
        </Card>

        <Card title="LISTS">
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
            <ul>
              <li>Disc item one</li>
              <li>Disc item two</li>
              <li>Disc item three</li>
            </ul>
            <ol>
              <li>First</li>
              <li>Second</li>
              <li>Third</li>
            </ol>
            <ul style={{ listStyleType: 'square' as any }}>
              <li>Square</li>
              <li>Square</li>
            </ul>
            <ul style={{ listStyleType: 'circle' as any, color: '#6c5ce7' }}>
              <li style={{ color: '#6c5ce7' }}>Circle</li>
              <li style={{ color: '#6c5ce7' }}>Circle</li>
            </ul>
            <ul style={{ listStylePosition: 'inside' as any, width: 160, backgroundColor: '#dfe6e9' }}>
              <li>Inside disc</li>
              <li>Inside marker with text long enough to wrap</li>
            </ul>
            <ol style={{ listStylePosition: 'inside' as any, width: 160, backgroundColor: '#dfe6e9' }}>
              <li>Inside one</li>
              <li style={{ listStylePosition: 'outside' as any }}>Outside override</li>
              <li>Inside three</li>
            </ol>
          </div>
        </Card>

        <Card title="IMAGES">
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
            <For each={['fill', 'contain', 'cover', 'none', 'scale-down']}>
              {(fit) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <img src={TEST_IMAGE} style={{ width: 80, height: 80, objectFit: fit as any, backgroundColor: '#dfe6e9' }} />
                  <p style={{ fontSize: 11, color: MUTED }}>{fit}</p>
                </div>
              )}
            </For>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <img src={TEST_IMAGE} style={{ width: 80, height: 80, objectFit: 'none', objectPosition: 'left top', backgroundColor: '#dfe6e9' }} />
              <p style={{ fontSize: 11, color: MUTED }}>none · left top</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <img src="ms-appx:///Assets/Square44x44Logo.scale-200.png" style={{ width: 80, height: 80, objectFit: 'contain', backgroundColor: '#dfe6e9' }} />
              <p style={{ fontSize: 11, color: MUTED }}>ms-appx contain</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <img src="ms-appx:///Assets/Square44x44Logo.scale-200.png" />
              <p style={{ fontSize: 11, color: MUTED }}>ms-appx natural</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <img src={TEST_IMAGE} />
              <p style={{ fontSize: 11, color: MUTED }}>natural size</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <img src={TEST_IMAGE} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '50%' }} />
              <p style={{ fontSize: 11, color: MUTED }}>avatar</p>
            </div>
          </div>
        </Card>

        <Card title="OVERFLOW ON A DIV">
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
            <div style={{ height: 120, width: 160, overflow: 'auto', backgroundColor: '#dfe6e9', borderRadius: '8px', padding: 8 }}>
              <For each={Array.from({ length: 12 })}>{(_, i) => <p style={{ fontSize: 13, color: '#2d3436' }}>{`Row ${i()} of 12`}</p>}</For>
            </div>
            <div style={{ flexGrow: 1, overflowX: 'auto', overflowY: 'hidden', backgroundColor: '#dfe6e9', borderRadius: '8px', padding: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, width: 1200 }}>
                <For each={Array.from({ length: 12 })}>
                  {(_, i) => <div style={{ width: 90, height: 90, flexShrink: 0, borderRadius: '10px', backgroundColor: ['#e84393', '#6c5ce7', '#0984e3', '#00b894'][i() % 4] }} />}
                </For>
              </div>
            </div>
          </div>
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
