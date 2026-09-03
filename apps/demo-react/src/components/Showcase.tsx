const FEATURES = [
  {
    title: 'Real Rust Layout',
    desc: 'Flexbox & CSS Grid computed by a taffy-based engine — not a bridge to a browser, not an approximation.',
    span: '2 / 2',
    bg: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
  },
  { title: 'Backdrop Blur', desc: 'Real glassmorphism.', span: '1 / 1', bg: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' },
  { title: 'CSS Grid', desc: 'Bento layouts, real spans.', span: '1 / 1', bg: 'linear-gradient(135deg, #059669, #10b981)' },
  { title: 'Gradients', desc: 'Multi-stop, any angle.', span: '1 / 1', bg: 'linear-gradient(135deg, #db2777, #f97316)' },
  { title: 'Layered Shadows', desc: 'Color-tinted, soft.', span: '1 / 1', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
];

const STATS = [
  { value: '415', label: 'of 416 WebSpec checks passing' },
  { value: '3', label: 'platforms — iOS, Android, Windows' },
  { value: '0', label: 'WebViews involved' },
  { value: '1', label: 'Rust core driving every one' },
];

const TESTIMONIALS = [
  { initials: 'AK', name: 'Amara K.', role: 'Mobile Lead', quote: 'We ported a whole design system\'s CSS almost unchanged. The grid math just matched.' },
  { initials: 'JT', name: 'Jonas T.', role: 'Design Engineer', quote: 'Backdrop blur, real gradients, native performance — I stopped checking "is this a WebView".' },
  { initials: 'RM', name: 'Riya M.', role: 'Platform Eng', quote: 'flex-wrap, gap, aspect-ratio — the properties I actually use daily, not a subset.' },
];

const PLANS = [
  { name: 'Starter', price: '$0', highlight: false },
  { name: 'Pro', price: '$24', highlight: true },
  { name: 'Scale', price: '$79', highlight: false },
];

export function ShowcaseScreen() {
  return (
    <scroll style={{ backgroundColor: '#05060f' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Sticky-style glass header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            backgroundColor: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>◆ Mason</span>
          <div
            style={{
              display: 'flex',
              // Keep the pill stable while this mixed-height row is measured.
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '999px',
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>v1.0.0-beta.91</span>
          </div>
        </div>

        {/* Gradient hero */}
        <div style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 35%, #831843 70%, #7c2d12 100%)', padding: 28, paddingTop: 48, paddingBottom: 56 }}>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '999px', paddingTop: 6, paddingBottom: 6, paddingLeft: 14, paddingRight: 14, alignSelf: 'flex-start', marginBottom: 18 }}>
            <span style={{ color: '#fde68a', fontSize: 11, fontWeight: 700 }}>✦ NO WEBVIEW · REAL CSS</span>
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1.05 }}>
            Everything the web{'\n'}taught you, native.
          </span>
          <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 14, lineHeight: 1.5 }}>
            Gradients, glass, grid, shadow — the CSS you already know, computed by a real Rust layout engine and
            painted with native views.
          </span>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '10px', paddingTop: 14, paddingBottom: 14, paddingLeft: 22, paddingRight: 22 }}>
              <span style={{ color: '#4c1d95', fontWeight: 700, fontSize: 14 }}>Explore the grid ↓</span>
            </div>
            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '10px',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                paddingTop: 14,
                paddingBottom: 14,
                paddingLeft: 22,
                paddingRight: 22,
              }}
            >
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>View source</span>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: -32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  padding: 16,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{s.value}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, lineHeight: 1.35 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento grid */}
        <div style={{ padding: 20, paddingTop: 40, display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }}>ASYMMETRIC · CSS GRID</span>
          <span style={{ color: 'white', fontSize: 22, fontWeight: 800, marginTop: 6, marginBottom: 16 }}>A real bento layout</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 110, gap: 12 }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gridColumn: f.span.split(' / ')[0] === '2' ? 'span 2' : 'span 1',
                  gridRow: f.span.split(' / ')[1] === '2' ? 'span 2' : 'span 1',
                  background: f.bg,
                  borderRadius: '18px',
                  padding: 16,
                }}
              >
                <span style={{ color: 'white', fontWeight: 700, fontSize: f.span === '2 / 2' ? 20 : 14 }}>{f.title}</span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #7c2d12, #831843, #4c1d95)',
            padding: 20,
            paddingTop: 32,
            paddingBottom: 32,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700 }}>GLASSMORPHISM</span>
          <span style={{ color: 'white', fontSize: 20, fontWeight: 800, marginTop: 6, marginBottom: 16 }}>Built by people shipping it</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderRadius: '16px',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                  padding: 16,
                }}
              >
                <span style={{ color: 'white', fontSize: 13, lineHeight: 1.5 }}>&ldquo;{t.quote}&rdquo;</span>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      width: 34,
                      height: 34,
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{t.initials}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>{t.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div
          style={{
            // Keep this section opaque after the gradient band on Android.
            backgroundColor: '#05060f',
            padding: 20,
            paddingTop: 40,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }}>PRICING</span>
          <span style={{ color: 'white', fontSize: 20, fontWeight: 800, marginTop: 6, marginBottom: 18 }}>Ship it at any scale</span>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
            {PLANS.map((p) => (
              <div
                key={p.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  marginTop: p.highlight ? -12 : 0,
                  background: p.highlight ? 'linear-gradient(160deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.06)',
                  borderRadius: '18px',
                  borderWidth: p.highlight ? 0 : 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  padding: 18,
                  boxShadow: p.highlight ? '0 20px 45px rgba(124,58,237,0.45)' : undefined,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: p.highlight ? 'white' : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 }}>{p.name}</span>
                <span style={{ color: 'white', fontSize: 26, fontWeight: 800, marginTop: 8 }}>{p.price}</span>
                <span style={{ color: p.highlight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>/mo</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: '#05060f',
            display: 'flex',
            flexDirection: 'column',
            padding: 20,
            paddingTop: 32,
            paddingBottom: 40,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { h: 'Product', items: ['Layout Engine', 'WebSpec', 'Showcase'] },
              { h: 'Platforms', items: ['iOS', 'Android', 'Windows'] },
            ].map((col) => (
              <div key={col.h} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{col.h}</span>
                {col.items.map((i) => (
                  <span key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    {i}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 28 }}>Mason — a CSS layout engine for NativeScript. No WebView, ever.</span>
        </div>
      </div>
    </scroll>
  );
}
