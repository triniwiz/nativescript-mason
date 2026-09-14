import { useRouter } from 'solid-navigation'

const FEATURES = [
  {
    id: 'Flexbox',
    label: 'Flexbox',
    desc: 'Live direction, justify, align, wrap & gap',
    bg: '#0984e3',
    glyph: 'Fx',
    count: 'Playground',
  },
  {
    id: 'Grid',
    label: 'CSS Grid',
    desc: 'Columns, gap, spans & flow — interactive',
    bg: '#00b894',
    glyph: 'Gr',
    count: 'Playground',
  },
  {
    id: 'Transforms',
    label: 'Transforms',
    desc: 'Compose translate, rotate & scale live',
    bg: '#6c5ce7',
    glyph: 'Tr',
    count: 'Playground',
  },
  {
    id: 'Shadows',
    label: 'Shadow Builder',
    desc: 'Tune offset, blur, opacity & radius',
    bg: '#e84393',
    glyph: 'Sh',
    count: 'Playground',
  },
  {
    id: 'Typography',
    label: 'Typography',
    desc: 'Size, weight, spacing & line-height live',
    bg: '#fdcb6e',
    glyph: 'Aa',
    count: 'Playground',
  },
  {
    id: 'Backgrounds',
    label: 'Gradient Builder',
    desc: 'Build gradients — colors & direction',
    bg: '#e17055',
    glyph: 'Bg',
    count: 'Playground',
  },
  {
    id: 'Position',
    label: 'Position',
    desc: 'Absolute insets, stretch, centering & badges',
    bg: '#00cec9',
    glyph: 'Po',
    count: 'Tests',
  },
  {
    id: 'QA',
    label: 'QA Harness',
    desc: 'Scroll-auto, backdrop-filter & stress tests',
    bg: '#2d3436',
    glyph: 'QA',
    count: 'Tests',
  },
  {
    id: 'WebSpec',
    label: 'WebSpec Conformance',
    desc: '374 CSS layout fixtures checked against real browser rects',
    bg: '#00cec9',
    glyph: 'Ws',
    count: 'Tests',
  },
] as const

const STATS = [
  { n: '184', label: 'CSS Props', color: '#6c5ce7' },
  { n: '4', label: 'Platforms', color: '#0984e3' },
  { n: '6', label: 'Playgrounds', color: '#00b894' },
  { n: 'Rust', label: 'Powered', color: '#e84393' },
]

export default function Home() {
  const router = useRouter()

  return (
    <>
      <actionbar title="" />
      <scroll style={{ backgroundColor: '#f0f4f8', padding: 16, overflowY: 'scroll' }}>
        {/* ── Hero ── */}
        <div
          style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '24px',
            padding: 28,
            marginBottom: 16,
            boxShadow: '0 16px 48px rgba(26,26,46,0.5)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: 4,
              background: 'linear-gradient(to right, #6c5ce7, #0984e3, #00b894)',
              borderRadius: '2px',
              marginBottom: 20,
            }}
          />
          <p
            style={{
              fontSize: 42,
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: -1.5,
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            Mason
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 6, fontWeight: '500' }}>
            CSS Layout Engine
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
              marginBottom: 22,
            }}
          >
            Full Flexbox, Grid, Shadows & Transforms for NativeScript — powered by a Rust core. No web views.
          </p>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px 8px', flexWrap: 'wrap' }}>
            {(['Rust · Taffy', 'Flexbox', 'CSS Grid', 'Transforms', 'iOS · Android · Windows · visionOS'] as const).map((tag) => (
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '20px',
                  paddingTop: 5,
                  paddingBottom: 5,
                  paddingLeft: 12,
                  paddingRight: 12,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' }}>{tag}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '8px 8px',
            marginBottom: 20,
          }}
        >
          {STATS.map((s) => (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                padding: 12,
                boxShadow: `0 4px 14px ${s.color}18`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 'bold', color: s.color, lineHeight: 1 }}>{s.n}</p>
              <p style={{ fontSize: 9, color: '#999', marginTop: 4, textAlignment: 'center' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Feature Grid ── */}
        <p style={{ fontSize: 12, fontWeight: 'bold', color: '#636e72', marginBottom: 12, letterSpacing: 1.5 }}>
          FEATURE DEMOS
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px 12px',
            marginBottom: 24,
          }}
        >
          {FEATURES.map((feat) => (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '18px',
                minHeight: 168,
                boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
              }}
              //@ts-ignore
              on:click={() => router.navigate(feat.id)}
            >
              {/* Color top bar */}
              <div style={{ height: 4, backgroundColor: feat.bg, borderRadius: '18px 18px 0 0' }} />
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '13px',
                    backgroundColor: feat.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: `0 4px 12px ${feat.bg}55`,
                  }}
                >
                  <p style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>{feat.glyph}</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 }}>
                  {feat.label}
                </p>
                <p style={{ fontSize: 11, color: '#888', lineHeight: 1.4, marginBottom: 10 }}>{feat.desc}</p>
                <div
                  style={{
                    backgroundColor: feat.bg + '18',
                    borderRadius: '6px',
                    paddingTop: 3,
                    paddingBottom: 3,
                    paddingLeft: 7,
                    paddingRight: 7,
                  }}
                >
                  <p style={{ fontSize: 10, color: feat.bg, fontWeight: 'bold' }}>{feat.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Color Strip ── */}
        <p style={{ fontSize: 12, fontWeight: 'bold', color: '#636e72', marginBottom: 12, letterSpacing: 1.5 }}>
          COLOR SYSTEM
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            height: 52,
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            marginBottom: 24,
          }}
        >
          {['#ff6b6b', '#e84393', '#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#e17055'].map((color) => (
            <div style={{ flex: 1, backgroundColor: color }} />
          ))}
        </div>

        {/* ── Glow Cards ── */}
        <p style={{ fontSize: 12, fontWeight: 'bold', color: '#636e72', marginBottom: 12, letterSpacing: 1.5 }}>
          BOX SHADOW GLOW
        </p>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px 10px', marginBottom: 24 }}>
          {[
            { bg: '#6c5ce7', label: 'Pro', sub: 'Purple' },
            { bg: '#0984e3', label: 'Plus', sub: 'Blue' },
            { bg: '#00b894', label: 'Go', sub: 'Green' },
          ].map((card) => (
            <div
              style={{
                flex: 1,
                height: 80,
                backgroundColor: card.bg,
                borderRadius: '16px',
                padding: 14,
                boxShadow: `0 10px 28px ${card.bg}70`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <p style={{ color: 'white', fontSize: 18, fontWeight: 'bold', lineHeight: 1 }}>{card.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>{card.sub} glow</p>
            </div>
          ))}
        </div>

        {/* ── Grid Showcase ── */}
        <p style={{ fontSize: 12, fontWeight: 'bold', color: '#636e72', marginBottom: 12, letterSpacing: 1.5 }}>
          GRID LAYOUT
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gridTemplateRows: '48px 48px',
            gap: '6px 6px',
            marginBottom: 24,
          }}
        >
          <div style={{ gridRow: 'span 2', backgroundColor: '#6c5ce7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(108,92,231,0.3)' }}>
            <p style={{ fontSize: 13, color: 'white', fontWeight: 'bold' }}>row span 2</p>
          </div>
          <div style={{ backgroundColor: '#0984e3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 11, color: 'white', fontWeight: 'bold' }}>A</p>
          </div>
          <div style={{ backgroundColor: '#00b894', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 11, color: 'white', fontWeight: 'bold' }}>B</p>
          </div>
          <div style={{ gridColumn: 'span 2', backgroundColor: '#e84393', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 11, color: 'white', fontWeight: 'bold' }}>col span 2</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingTop: 8, paddingBottom: 24 }}>
          <p style={{ fontSize: 11, color: '#b2bec3', textAlignment: 'center' }}>
            Mason · NativeScript · Rust · Taffy
          </p>
        </div>
      </scroll>
    </>
  )
}
