import { createSignal } from 'solid-js'
import { BG, MUTED, TEXT, Card, Field, Segmented } from './controls'

const POEM = '「縦書き」は、日本語の本や新聞でよく使われる書き方です。ちょっとした記号（括弧や句読点）も縦向きの字形になります。'

export default function Vertical() {
  const [mode, setMode] = createSignal('vertical-rl')
  const [orientation, setOrientation] = createSignal('mixed')
  const [trim, setTrim] = createSignal('normal')
  const [direction, setDirection] = createSignal('ltr')

  const flow = () => ({ writingMode: mode(), textOrientation: orientation(), textSpacingTrim: trim(), direction: direction() }) as any

  return (
    <>
      <actionbar title="Vertical Writing" />
      <scroll style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>
        <Card title="LIVE PREVIEW">
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#f4f6f9', borderRadius: '12px', padding: 12 }}>
            <p style={{ ...flow(), height: 260, maxWidth: '100%', fontSize: 18, lineHeight: 1.7, color: TEXT }}>
              {POEM}
              CSS Writing Modes は<span style={{ textCombineUpright: 'all', color: '#6c5ce7' } as any}>12</span>月に読みました。
              <button style={{ backgroundColor: '#0984e3', color: 'white', borderRadius: '6px', padding: 4, fontSize: 14 } as any}>送信</button>
            </p>
          </div>
        </Card>

        <Card title="CONTROLS">
          <Field label="WRITING MODE">
            <Segmented
              value={mode()}
              onChange={setMode}
              options={[
                { label: 'vertical-rl', value: 'vertical-rl' },
                { label: 'vertical-lr', value: 'vertical-lr' },
                { label: 'horizontal-tb', value: 'horizontal-tb' },
              ]}
            />
          </Field>
          <Field label="TEXT ORIENTATION">
            <Segmented
              value={orientation()}
              onChange={setOrientation}
              options={[
                { label: 'mixed', value: 'mixed' },
                { label: 'upright', value: 'upright' },
                { label: 'sideways', value: 'sideways' },
              ]}
            />
          </Field>
          <Field label="TEXT SPACING TRIM">
            <Segmented
              value={trim()}
              onChange={setTrim}
              options={[
                { label: 'normal', value: 'normal' },
                { label: 'space-all', value: 'space-all' },
                { label: 'trim-start', value: 'trim-start' },
                { label: 'trim-both', value: 'trim-both' },
                { label: 'trim-all', value: 'trim-all' },
              ]}
            />
          </Field>
          <Field label="DIRECTION">
            <Segmented
              value={direction()}
              onChange={setDirection}
              options={[
                { label: 'ltr', value: 'ltr' },
                { label: 'rtl', value: 'rtl' },
              ]}
            />
          </Field>
        </Card>

        <Card title="LOGICAL BORDERS">
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>Red is border-inline-start, blue border-block-start, the round corner border-start-end-radius. They follow the writing mode and direction above.</p>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            <div
              style={{
                ...flow(),
                width: 140,
                height: 140,
                padding: 10,
                backgroundColor: '#fff6d8',
                borderInlineStart: '8px solid #e74c3c',
                borderBlockStart: '8px solid #0984e3',
                borderStartEndRadius: 28,
              } as any}
            >
              <p style={{ fontSize: 15, color: TEXT }}>論理的な枠線</p>
            </div>
          </div>
        </Card>

        <Card title="FLOATS">
          <div style={{ writingMode: 'vertical-rl', height: 170, backgroundColor: '#eaf7ea', borderRadius: '12px', padding: 10 } as any}>
            <div style={{ float: 'left', width: 56, height: 70, backgroundColor: '#e17055', borderRadius: '8px', marginBottom: 6 } as any} />
            <p style={{ fontSize: 17, color: TEXT }}>
              浮動要素の<span style={{ display: 'inline-block', width: 17, height: 17, backgroundColor: '#0984e3', borderRadius: '4px' } as any} />まわりを、縦書きの文章が回り込みます。行は浮動要素の横で短くなります。
            </p>
          </div>
        </Card>

        <Card title="SCROLLING">
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>A vertical-rl scroller starts at its right edge and scrolls to the left.</p>
          <div style={{ writingMode: 'vertical-rl', height: 150, overflowX: 'auto', backgroundColor: '#f4f6f9', borderRadius: '12px', padding: 10 } as any}>
            <p style={{ fontSize: 17, color: TEXT }}>
              {POEM}
              {POEM}
              {POEM}
            </p>
          </div>
        </Card>
      </scroll>
    </>
  )
}
