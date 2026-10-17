import { createSignal } from 'solid-js'
import { BG, MUTED, TEXT, Card, Field, Segmented, Stepper, CodeBlock } from './controls'

const SAMPLE = 'The quick brown fox jumps over the lazy dog while Mason lays out every glyph natively.'

export default function Typography() {
  const [size, setSize] = createSignal(18)
  const [weight, setWeight] = createSignal('400')
  const [spacing, setSpacing] = createSignal(0)
  const [lineHeight, setLineHeight] = createSignal(140) // percent
  const [align, setAlign] = createSignal('left')
  const [color, setColor] = createSignal('#1a1a2e')

  return (
    <>
      <actionbar title="Typography Playground" />
      <scroll style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>

        {/* ── Live Preview ── */}
        <Card title="LIVE PREVIEW">
          <div
            style={{
              minHeight: 160,
              backgroundColor: '#f4f6f9',
              borderRadius: '12px',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontSize: size(),
                fontWeight: weight() as any,
                letterSpacing: spacing(),
                lineHeight: lineHeight() / 100,
                textAlignment: align() as any,
                color: color(),
                width: '100%',
              }}
            >
              {SAMPLE}
            </p>
          </div>
        </Card>

        {/* ── Controls ── */}
        <Card title="CONTROLS">
          <Field label={`FONT SIZE — ${size()}px`}>
            <Stepper value={size()} min={10} max={48} onChange={setSize} />
          </Field>

          <Field label="FONT WEIGHT">
            <Segmented
              value={weight()}
              onChange={setWeight}
              options={[
                { label: '100', value: '100' },
                { label: '300', value: '300' },
                { label: '400', value: '400' },
                { label: '600', value: '600' },
                { label: '700', value: 'bold' },
                { label: '900', value: '900' },
              ]}
            />
          </Field>

          <Field label={`LETTER SPACING — ${spacing()}`}>
            <Stepper value={spacing()} min={-2} max={8} onChange={setSpacing} />
          </Field>

          <Field label={`LINE HEIGHT — ${(lineHeight() / 100).toFixed(1)}`}>
            <Stepper value={lineHeight()} min={100} max={240} step={10} suffix="%" onChange={setLineHeight} />
          </Field>

          <Field label="TEXT ALIGN">
            <Segmented
              value={align()}
              onChange={setAlign}
              options={[
                { label: 'left', value: 'left' },
                { label: 'center', value: 'center' },
                { label: 'right', value: 'right' },
              ]}
            />
          </Field>

          <Field label="COLOR">
            <Segmented
              value={color()}
              onChange={setColor}
              options={[
                { label: 'Ink', value: '#1a1a2e' },
                { label: 'Purple', value: '#6c5ce7' },
                { label: 'Blue', value: '#0984e3' },
                { label: 'Green', value: '#00b894' },
                { label: 'Pink', value: '#e84393' },
              ]}
            />
          </Field>
        </Card>

        {/* ── Generated CSS ── */}
        <Card title="GENERATED CSS">
          <CodeBlock
            lines={[
              `font-size: ${size()}px;`,
              `font-weight: ${weight()};`,
              `letter-spacing: ${spacing()}px;`,
              `line-height: ${(lineHeight() / 100).toFixed(1)};`,
              `text-align: ${align()};`,
              `color: ${color()};`,
            ]}
          />
        </Card>

        {/* ── Type Scale reference ── */}
        <Card title="LINE-CLAMP & TEXT-INDENT">
          <p style={{ fontSize: 14, color: TEXT, lineClamp: 2 }}>
            line-clamp: 2. This paragraph is long enough to wrap past two lines on any phone, so the second line should end in an ellipsis and the box should be exactly two lines tall.
          </p>
          <p style={{ fontSize: 14, color: TEXT, textIndent: '2em', marginTop: 12 }}>
            text-indent: 2em. Only the first line of this paragraph starts two ems in from the left edge; the lines after it start flush.
          </p>
        </Card>

        <Card title="TYPE SCALE">
          {[
            { label: 'Display', size: 34, w: 'bold' },
            { label: 'Title', size: 24, w: 'bold' },
            { label: 'Heading', size: 18, w: '600' },
            { label: 'Body', size: 15, w: '400' },
            { label: 'Caption', size: 12, w: '400' },
          ].map((t) => (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: '12px 12px',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid #f0f4f8',
              }}
            >
              <p style={{ width: 60, fontSize: 10, color: MUTED, fontWeight: 'bold' }}>{t.label}</p>
              <p style={{ fontSize: t.size, fontWeight: t.w as any, color: TEXT, flex: 1 }}>{t.size}px</p>
            </div>
          ))}
        </Card>

        <div style={{ height: 24 }} />
      </scroll>
    </>
  )
}
