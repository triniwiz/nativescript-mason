import { createSignal } from 'solid-js'
import { BG, MUTED, Card, Field, Stepper, CodeBlock } from './controls'

export default function Transforms() {
  const [tx, setTx] = createSignal(0)
  const [ty, setTy] = createSignal(0)
  const [rotate, setRotate] = createSignal(0)
  const [scale, setScale] = createSignal(100) // percent

  const transform = () =>
    `translate(${tx()}px, ${ty()}px) rotate(${rotate()}deg) scale(${(scale() / 100).toFixed(2)})`

  const reset = () => {
    setTx(0)
    setTy(0)
    setRotate(0)
    setScale(100)
  }

  return (
    <>
      <actionbar title="Transforms Playground" />
      <scroll style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>

        {/* ── Live Preview ── */}
        <Card title="LIVE PREVIEW">
          <div
            style={{
              height: 220,
              backgroundColor: '#1a1a2e',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* reference outline */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '16px',
                border: '2px dashed rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  background: 'linear-gradient(135deg, #6c5ce7, #0984e3)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: transform(),
                  boxShadow: '0 8px 30px rgba(108,92,231,0.5)',
                }}
              >
                <p style={{ fontSize: 13, color: 'white', fontWeight: 'bold' }}>Mason</p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Controls ── */}
        <Card title="CONTROLS">
          <Field label={`TRANSLATE X — ${tx()}px`}>
            <Stepper value={tx()} min={-80} max={80} step={8} suffix="px" onChange={setTx} />
          </Field>
          <Field label={`TRANSLATE Y — ${ty()}px`}>
            <Stepper value={ty()} min={-60} max={60} step={8} suffix="px" onChange={setTy} />
          </Field>
          <Field label={`ROTATE — ${rotate()}°`}>
            <Stepper value={rotate()} min={-180} max={180} step={15} suffix="°" onChange={setRotate} />
          </Field>
          <Field label={`SCALE — ${scale()}%`}>
            <Stepper value={scale()} min={25} max={200} step={5} suffix="%" onChange={setScale} />
          </Field>
          <div
            style={{
              marginTop: 4,
              backgroundColor: '#eef2f6',
              borderRadius: '10px',
              paddingTop: 11,
              paddingBottom: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            //@ts-ignore on: namespaced events are required by the NS solid renderer
            on:click={reset}
          >
            <p style={{ fontSize: 13, fontWeight: '600', color: '#6c5ce7' }}>Reset</p>
          </div>
        </Card>

        {/* ── transform-origin: the same 30° turn about three pivots ── */}
        <Card title="TRANSFORM-ORIGIN">
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 24, paddingBottom: 40 }}>
            {['center', 'top left', '100% 100%'].map((origin) => (
              <div style={{ alignItems: 'center' }}>
                <div style={{ width: 60, height: 60, border: '1px dashed #b2bec3' }}>
                  <div style={{ width: 58, height: 58, backgroundColor: 'rgba(108,92,231,0.6)', transform: 'rotate(30deg)', transformOrigin: origin }} />
                </div>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 28 }}>{origin}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Generated CSS ── */}
        <Card title="GENERATED CSS">
          <CodeBlock lines={[`transform:`, `  ${transform()};`]} />
        </Card>

        {/* ── Quick presets ── */}
        <Card title="QUICK PRESETS">
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px 8px' }}>
            {[
              { label: 'Tilt left', fn: () => { reset(); setRotate(-15) } },
              { label: 'Tilt right', fn: () => { reset(); setRotate(15) } },
              { label: 'Zoom in', fn: () => { reset(); setScale(160) } },
              { label: 'Zoom out', fn: () => { reset(); setScale(60) } },
              { label: 'Shift', fn: () => { reset(); setTx(40); setTy(20) } },
              { label: 'Flip 180°', fn: () => { reset(); setRotate(180) } },
            ].map((p) => (
              <div
                style={{
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: '20px',
                  backgroundColor: '#6c5ce7',
                  boxShadow: '0 3px 10px rgba(108,92,231,0.3)',
                }}
                //@ts-ignore on: namespaced events are required by the NS solid renderer
                on:click={p.fn}
              >
                <p style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>{p.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ height: 24 }} />
      </scroll>
    </>
  )
}
